const sequelize = require('sequelize');
const async = require('async');
const createHttpError = require('http-errors');
const AesUtil = require('../../lib/AesUtil');

// Filenames that contain "/", "\" or only spaces are invalid
const invalidName = /[/\\]|^\s*$/;

const { Op } = sequelize;

module.exports = (Model, App) => {
  const CreateFile = async (user, file) => {
    return Model.folder
      .findOne({
        where: {
          id: { [Op.eq]: file.folder_id },
          user_id: { [Op.eq]: user.id },
        },
      })
      .then(async (folder) => {
        if (!folder) {
          throw Error('Folder not found / Is not your folder');
        }

        const fileExists = await Model.file.findOne({
          where: {
            name: { [Op.eq]: file.name },
            folder_id: { [Op.eq]: folder.id },
            type: { [Op.eq]: file.type },
            userId: { [Op.eq]: user.id },
          },
        });

        if (fileExists) {
          throw Error('File entry already exists');
        }

        const fileInfo = {
          name: file.name,
          type: file.type,
          size: file.size,
          folder_id: folder.id,
          fileId: file.fileId,
          bucket: file.bucket,
          encrypt_version: file.encrypt_version,
          userId: user.id,
          modificationTime: file.modificationTime || new Date(),
        };

        try {
          AesUtil.decrypt(file.name, file.fileId);
          fileInfo.encrypt_version = '03-aes';
        } catch {
          // eslint-disable-next-line no-empty
        }

        if (file.date) {
          fileInfo.createdAt = file.date;
        }

        return Model.file.create(fileInfo);
      });
  };

  const Delete = (user, bucket, fileId) =>
    new Promise((resolve, reject) => {
      App.services.Inxt.DeleteFile(user, bucket, fileId)
        .then(async () => {
          const file = await Model.file.findOne({ where: { fileId: { [Op.eq]: fileId }, userId: user.id } });

          if (file) {
            const isDestroyed = await file.destroy();
            if (isDestroyed) {
              return resolve('File deleted');
            }
            return reject(Error('Cannot delete file'));
          }
          return reject(Error('File not found'));
        })
        .catch(async (err) => {
          if (err.message.includes('Resource not found')) {
            const file = await Model.file.findOne({
              where: { fileId: { [Op.eq]: fileId }, userId: user.id },
            });
            if (file) {
              await file.destroy();
            }

            resolve();
          } else {
            reject(err);
          }
        });
    });

  const DeleteFile = async (user, folderId, fileId) => {
    const file = await Model.file.findOne({ where: { id: fileId, folder_id: folderId, userId: user.id } });

    await Model.shares.destroy({ where: { file: file.fileId } }).catch(() => {
      // eslint-disable-next-line no-empty
    });

    if (!file) {
      throw Error('File/Folder not found');
    }

    try {
      await App.services.Inxt.DeleteFile(user, file.bucket, file.fileId);
    } catch (err) {
      const resourceNotFoundPattern = /Resource not found/;

      if (!resourceNotFoundPattern.exec(err.message)) {
        throw err;
      }
    }
    await file.destroy();
  };

  const UpdateMetadata = (user, fileId, metadata, mnemonic, bucketId, relativePath) => {
    const newMeta = {};

    return async.waterfall([
      (next) => {
        // Find the file in database
        Model.file
          .findOne({ where: { fileId: { [Op.eq]: fileId }, userId: user.id } })
          .then((file) => {
            if (!file) {
              next(Error('Update Metadata Error: File not exists'));
            } else {
              next(null, file);
            }
          })
          .catch(next);
      },
      (file, next) => {
        if (metadata.itemName !== undefined) {
          if (invalidName.test(metadata.itemName)) {
            return next(Error('Cannot upload, invalid file name'));
          }
        }
        return next(null, file);
      },
      (file, next) => {
        Model.folder
          .findOne({
            where: {
              id: { [Op.eq]: file.folder_id },
              user_id: { [Op.eq]: user.id },
            },
          })
          .then((folder) => {
            if (!folder) {
              next(Error('Update Metadata Error: Not your file'));
            } else {
              next(null, file);
            }
          })
          .catch(next);
      },
      (file, next) => {
        // If no name, empty string (only extension filename)
        const cryptoFileName = metadata.itemName
          ? App.services.Crypt.encryptName(metadata.itemName, file.folder_id)
          : '';

        // Check if there is a file with the same name
        Model.file
          .findOne({
            where: {
              folder_id: { [Op.eq]: file.folder_id },
              name: { [Op.eq]: cryptoFileName },
              type: { [Op.eq]: file.type },
            },
          })
          .then((duplicateFile) => {
            if (duplicateFile) {
              return next(Error('File with this name exists'));
            }
            newMeta.name = cryptoFileName;
            return next(null, file);
          })
          .catch(next);
      },
      (file, next) => {
        if (newMeta.name !== file.name) {
          file
            .update(newMeta)
            .then(async (update) => {
              await App.services.Inxt.renameFile(user.email, user.userId, mnemonic, bucketId, fileId, relativePath);

              next(null, update);
            })
            .catch(next);
        } else {
          next();
        }
      },
    ]);
  };

  const MoveFile = async (user, fileId, destination, bucketId, mnemonic, relativePath) => {
    const file = await Model.file.findOne({ where: { fileId: { [Op.eq]: fileId } }, userId: user.id });

    if (!file) {
      throw Error('File not found');
    }

    const folderSource = await Model.folder.findOne({ where: { id: file.folder_id, user_id: user.id } });
    const folderTarget = await Model.folder.findOne({ where: { id: destination, user_id: user.id } });
    if (!folderSource || !folderTarget) {
      throw Error('Folder not found');
    }

    const originalName = App.services.Crypt.decryptName(file.name, file.folder_id);
    const destinationName = App.services.Crypt.encryptName(originalName, destination);

    const exists = await Model.file.findOne({
      where: {
        name: { [Op.eq]: destinationName },
        folder_id: { [Op.eq]: destination },
        type: { [Op.eq]: file.type },
      },
    });

    // Change name if exists
    if (exists) {
      throw createHttpError(409, 'A file with same name exists in destination');
    }

    // Move
    await App.services.Inxt.renameFile(user.email, user.userId, mnemonic, bucketId, fileId, relativePath);
    const result = await file.update({
      folder_id: parseInt(destination, 10),
      name: destinationName,
    });

    // we don't want ecrypted name on front
    file.setDataValue('name', App.services.Crypt.decryptName(destinationName, destination));
    file.setDataValue('folder_id', parseInt(destination, 10));
    const response = {
      result,
      item: file,
      destination,
      moved: true,
    };

    return response;
  };

  const isFileOfTeamFolder = (fileId) =>
    new Promise((resolve, reject) => {
      Model.file
        .findOne({
          where: {
            file_id: { [Op.eq]: fileId },
          },
          include: [
            {
              model: Model.folder,
              where: {
                id_team: { [Op.ne]: null },
              },
            },
          ],
        })
        .then((file) => {
          if (!file) {
            throw Error('File not found on database, please refresh');
          }

          resolve(file);
        })
        .catch(reject);
    });

  const getFileByFolder = (fileId, folderId, userId) => {
    return Model.file.findOne({
      where: {
        file_id: { [Op.eq]: fileId },
      },
      raw: true,
      include: [
        {
          model: Model.folder,
          where: {
            user_id: { [Op.eq]: userId },
            id: { [Op.eq]: folderId },
          },
        },
      ],
    });
  };

  const getByFolderAndUserId = (folderId, userId) => {
    return Model.file.findAll({ where: { folderId, userId } }).then((files) => {
      if (!files) {
        throw new Error('Not found');
      }
      return files.map((file) => {
        file.name = App.services.Crypt.decryptName(file.name, folderId);

        return file;
      });
    });
  };

  const getRecentFiles = async (userId, limit) => {
    const results = await Model.file.findAll({
      order: [['updatedAt', 'DESC']],
      limit,
      raw: true,
      where: { userId },
    });

    return results;
  };

  return {
    Name: 'Files',
    CreateFile,
    Delete,
    DeleteFile,
    UpdateMetadata,
    MoveFile,
    isFileOfTeamFolder,
    getRecentFiles,
    getFileByFolder,
    getByFolderAndUserId,
  };
};

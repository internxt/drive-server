const sequelize = require('sequelize');
const async = require('async');
const createHttpError = require('http-errors');
const { v4 } = require('uuid');
const { FileWithNameAlreadyExistsError, FileAlreadyExistsError } = require('./errors/FileWithNameAlreadyExistsError');

// Filenames that contain "/", "\" or only spaces are invalid
const invalidName = /[/\\]|^\s*$/;

const { Op } = sequelize;

module.exports = (Model, App) => {
  const log = App.logger;

  const CheckFileExistence = async (user, file) => {
    const plainName = App.services.Crypt.decryptName(file.name, file.folderId);

    const maybeAlreadyExistentFile = await Model.file.findOne({
      where: {
        plain_name: { [Op.eq]: plainName },
        folder_id: { [Op.eq]: file.folderId },
        type: { [Op.eq]: file.type },
        userId: { [Op.eq]: user.id },
        status: { [Op.eq]: 'EXISTS' },
      },
    });

    const fileExists = !!maybeAlreadyExistentFile;

    if (!fileExists) {
      return { exists: false, file: null };
    }

    return { exists: true, file: maybeAlreadyExistentFile };
  };

  const CreateFile = async (user, file) => {
    const folder = await Model.folder.findOne({
      where: {
        id: { [Op.eq]: file.folder_id },
      },
    });

    if (!folder) {
      throw new Error('Folder not found');
    }

    const isTheFolderOwner = user.id === folder.user_id;

    if (!isTheFolderOwner) {
      throw new Error('Folder is not yours');
    }

    const plainName = file.plainName ?? file.plain_name ?? App.services.Crypt.decryptName(file.name, folder.id);

    const maybeAlreadyExistentFile = await Model.file.findOne({
      where: {
        plain_name: { [Op.eq]: plainName },
        folder_id: { [Op.eq]: folder.id },
        type: { [Op.eq]: file.type },
        userId: { [Op.eq]: user.id },
        status: { [Op.eq]: 'EXISTS' },
      },
    });

    const fileAlreadyExists = !!maybeAlreadyExistentFile;

    if (fileAlreadyExists) {
      throw new FileAlreadyExistsError('File already exists');
    }

    const fileInfo = {
      name: file.name,
      plain_name: plainName,
      type: file.type,
      size: file.size,
      folder_id: folder.id,
      fileId: file.fileId,
      bucket: file.bucket,
      encrypt_version: file.encrypt_version || '03-aes',
      userId: user.id,
      uuid: v4(),
      folderUuid: folder.uuid,
      creationTime: file.creationTime || file.date || new Date(),
      modificationTime: file.modificationTime || new Date(),
    };

    return Model.file.create(fileInfo);
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
      const resourceNotFoundError = err.response.status === 404;

      if (!resourceNotFoundError) {
        throw err;
      }
    }

    const thumbnails = await Model.thumbnail.findAll({
      where: { file_id: fileId },
    });

    if (thumbnails && Array.isArray(thumbnails) && thumbnails.length > 0) {
      await Promise.all(
        thumbnails.map(async (thumbnail) => {
          try {
            await App.services.Inxt.DeleteFile(user, thumbnail.bucket_id, thumbnail.bucket_file);
          } catch (err) {
            //ignore error and keep deleting the remaining thumbnails
            log.info(
              '[ERROR deleting thumbnail]: User: %s, Bucket: %s, File: %s, Error: %s',
              user.bridgeUser,
              thumbnail.bucket_id,
              thumbnail.bucket_file,
              err,
            );
          }
        }),
      );
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
              plain_name: { [Op.eq]: metadata.itemName },
              type: { [Op.eq]: file.type },
              status: { [Op.eq]: 'EXISTS' },
            },
          })
          .then((duplicateFile) => {
            if (duplicateFile) {
              return next(new FileWithNameAlreadyExistsError('File with this name exists'));
            }
            newMeta.name = cryptoFileName;
            newMeta.plain_name = metadata.itemName;
            return next(null, file);
          })
          .catch(next);
      },
      (file, next) => {
        if (newMeta.name !== file.name) {
          file
            .update(newMeta)
            .then((update) => {
              next(null, update);
            })
            .catch(next);
        } else {
          next();
        }
      },
    ]);
  };

  const MoveFile = async (user, fileId, destination) => {
    const file = await Model.file.findOne({
      where: { fileId: { [Op.eq]: fileId }, status: { [Op.not]: 'DELETED' } },
      userId: user.id,
    });

    if (!file) {
      throw Error('File not found');
    }

    const folderSource = await Model.folder.findOne({ where: { id: file.folder_id, user_id: user.id } });
    const folderTarget = await Model.folder.findOne({ where: { id: destination, user_id: user.id } });
    if (!folderSource || !folderTarget) {
      throw Error('Folder not found');
    }

    const plainName = file.plainName ?? file.plain_name ?? App.services.Crypt.decryptName(file.name, file.folder_id);
    const destinationName = App.services.Crypt.encryptName(plainName, destination);

    const exists = await Model.file.findOne({
      where: {
        plain_name: { [Op.eq]: plainName },
        folder_id: { [Op.eq]: destination },
        type: { [Op.eq]: file.type },
        fileId: { [Op.ne]: fileId },
        status: { [Op.eq]: 'EXISTS' },
      },
    });

    // Change name if exists
    if (exists) {
      throw createHttpError(409, 'A file with same name exists in destination');
    }

    // Move
    const result = await file.update({
      folder_id: parseInt(destination, 10),
      folderUuid: folderTarget.uuid,
      name: destinationName,
      status: 'EXISTS',
    });

    // we don't want encrypted name on front
    file.setDataValue('name', plainName);
    file.setDataValue('folder_id', parseInt(destination, 10));

    return {
      result: result,
      item: file,
      destination,
      moved: true,
    };
  };

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

  const getByFolderAndUserId = (folderId, userId, deleted = false) => {
    return Model.file
      .findAll({
        where: { folderId, userId, deleted },
        include: [
          {
            model: Model.thumbnail,
            as: 'thumbnails',
            required: false,
          },
          {
            model: Model.shares,
            attributes: ['id', 'active', 'hashed_password', 'code', 'token', 'is_folder'],
            as: 'shares',
            required: false,
          },
        ],
      })
      .then((files) => {
        if (!files) {
          throw new Error('Not found');
        }
        return files.map((file) => {
          file.name = App.services.Crypt.decryptName(file.name, folderId);

          return file;
        });
      });
  };

  const getRecentFiles = (user, limit) => {
    return Model.file
      .findAll({
        order: [['updatedAt', 'DESC']],
        limit,
        where: {
          userId: user.id,
          bucket: {
            [Op.ne]: user.backupsBucket,
          },
          status: { [Op.eq]: 'EXISTS' },
        },
        include: [
          {
            model: Model.thumbnail,
            as: 'thumbnails',
            required: false,
          },
        ],
      })
      .then((files) => {
        if (!files) {
          throw new Error('Not found');
        }
        return files.map((file) => {
          file.name = App.services.Crypt.decryptName(file.name, file.folderId);

          return file;
        });
      });
  };

  const getFileByFileId = async (fileId) => {
    const file = await Model.file.findOne({
      where: {
        file_id: { [Op.eq]: fileId },
      },
    });

    if (file) return file;

    throw new Error('File not found');
  };

  return {
    Name: 'Files',
    CreateFile,
    CheckFileExistence,
    Delete,
    DeleteFile,
    UpdateMetadata,
    MoveFile,
    getRecentFiles,
    getFileByFolder,
    getByFolderAndUserId,
    getFileByFileId,
  };
};

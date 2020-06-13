const fs = require('fs');

const sequelize = require('sequelize');
const SanitizeFilename = require('sanitize-filename');
const async = require('async');

const { Op } = sequelize;

module.exports = (Model, App) => {
  const log = App.logger;

  const CreateFile = (user, file) => {
    return new Promise(async (resolve, reject) => {
      if (
        !file ||
        !file.fileId ||
        !file.bucket ||
        !file.size ||
        !file.folder_id ||
        !file.name
      ) {
        return reject(new Error('Invalid metadata for new file'));
      }

      return Model.folder
        .findOne({
          where: {
            id: { [Op.eq]: file.folder_id },
            user_id: { [Op.eq]: user.id },
          },
        })
        .then(async (folder) => {
          if (!folder) {
            return reject(new Error('Folder not found / Is not your folder'));
          }

          const fileExists = await Model.file.findOne({
            where: {
              name: { [Op.eq]: file.name },
              folder_id: { [Op.eq]: folder.id },
              type: { [Op.eq]: file.type },
            },
          });

          if (fileExists) {
            return reject(new Error('File entry already exists'));
          }

          const fileInfo = {
            name: file.name,
            type: file.type,
            size: file.size,
            folder_id: folder.id,
            fileId: file.file_id,
            bucket: file.bucket,
          };

          if (file.date) {
            fileInfo.createdAt = file.date;
          }

          return Model.file
            .create(fileInfo)
            .then(resolve)
            .catch((err) => {
              console.log('Error creating entry', err);
              reject('Unable to create file in database');
            });
        })
        .catch((err) => {
          console.log('Other error', err);
          reject(`Cannot find bucket ${file.folder_id}`);
        });
    });
  };

  const Upload = (user, folderId, fileName, filePath) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (user.mnemonic === 'null')
          throw new Error('Your mnemonic is invalid');

        const sanitizedFilename = SanitizeFilename(fileName);

        if (fileName !== sanitizedFilename) {
          throw Error('Cannot upload, invalid file name');
        }

        log.info(`Starting file upload: ${fileName}`);

        const rootFolder = await Model.folder.findOne({
          where: { id: { [Op.eq]: user.root_folder_id } },
        });
        const folder = await Model.folder.findOne({
          where: { id: { [Op.eq]: folderId } },
        });

        if (!rootFolder.bucket) return reject('Missing file bucket');

        // Separate filename from extension
        const extSeparatorPos = fileName.lastIndexOf('.');
        const fileNameNoExt =
          extSeparatorPos > 0 ? fileName.slice(0, extSeparatorPos) : fileName;

        let encryptedFileName = App.services.Crypt.encryptName(
          fileNameNoExt,
          folderId
        );

        const fileExt = fileName.slice(extSeparatorPos + 1);

        // Check if file already exists.
        const exists = await Model.file.findOne({
          where: {
            name: { [Op.eq]: encryptedFileName },
            folder_id: { [Op.eq]: folderId },
            type: { [Op.eq]: fileExt },
          },
        });

        // Change name if exists
        let originalEncryptedFileName;
        let newName;
        if (exists) {
          newName = await GetNewMoveName(folderId, fileNameNoExt, fileExt);
          encryptedFileName = newName.cryptedName;
          originalEncryptedFileName = App.services.Crypt.encryptName(
            newName.name
          );
        }

        originalEncryptedFileName =
          originalEncryptedFileName ||
          App.services.Crypt.encryptName(fileNameNoExt);
        const encryptedFileNameWithExt = `${encryptedFileName}.${fileExt}`;
        const originalEncryptedFileNameWithExt = `${originalEncryptedFileName}.${fileExt}`;
        log.info('Uploading file to network');

        return App.services.Storj.StoreFile(
          user,
          rootFolder.bucket,
          originalEncryptedFileNameWithExt,
          filePath
        )
          .then(async ({ fileId, size }) => {
            if (!fileId) return reject(Error('Missing file id'));

            if (!size) return reject(Error('Missing file size'));

            const addedFile = await Model.file.create({
              name: encryptedFileName,
              type: fileExt,
              fileId,
              bucket: rootFolder.bucket,
              size,
            });
            const result = await folder.addFile(addedFile);

            return resolve(addedFile);
          })
          .catch((err) => {
            log.error(err.message);
            reject(err.message);
          });
      } catch (err) {
        log.error(err.message);

        return reject(err.message);
      } finally {
        fs.unlink(filePath, (error) => {
          if (error) throw error;

          console.log(`Deleted:  ${filePath}`);
        });
      }
    });
  };

  const Download = (user, fileId) => {
    const maxAcceptableSize = 1024 * 1024 * 300; // 300MB

    return new Promise((resolve, reject) => {
      if (user.mnemonic === 'null') throw new Error('Your mnemonic is invalid');

      Model.file
        .findOne({ where: { file_id: { [Op.eq]: fileId } } })
        .then((file) => {
          if (!file) {
            throw Error('File not found on database, please refresh');
          } else if (file.size > maxAcceptableSize) {
            // 300MB
            throw Error('File too large');
          }

          App.services.Storj.ResolveFile(user, file)
            .then((result) => {
              resolve({ ...result, folderId: file.folder_id });
            })
            .catch((err) => {
              if (err.message === 'File already exists') {
                resolve({ file: { name: `${file.name}.${file.type}` } });
              } else {
                reject(err);
              }
            });
        })
        .catch(reject);
    });
  };

  const DownloadFolderFile = (user, fileId, path) => {
    return new Promise((resolve, reject) => {
      if (user.mnemonic === 'null') throw new Error('Your mnemonic is invalid');

      Model.file
        .findOne({ where: { file_id: { [Op.eq]: fileId } } })
        .then((file) => {
          if (!file) {
            throw Error('File not found on database, please refresh');
          }

          App.services.Storj.ResolveFolderFile(user, file, path)
            .then((result) => {
              resolve({ ...result, folderId: file.folder_id });
            })
            .catch((err) => {
              if (err.message === 'File already exists') {
                resolve({ file: { name: `${file.name}.${file.type}` } });
              } else {
                reject(err);
              }
            });
        })
        .catch(reject);
    });
  };

  const Delete = (user, bucket, fileId) => {
    return new Promise((resolve, reject) => {
      App.services.Storj.DeleteFile(user, bucket, fileId)
        .then(async (result) => {
          const file = await Model.file.findOne({
            where: { fileId: { [Op.eq]: fileId } },
          });
          if (file) {
            const isDestroyed = await file.destroy();
            if (isDestroyed) {
              resolve('File deleted');
            } else {
              reject('Cannot delete file');
            }
          } else {
            reject('File not found');
          }
        })
        .catch(async (err) => {
          if (err.message.includes('Resource not found')) {
            const file = await Model.file.findOne({
              where: { fileId: { [Op.eq]: fileId } },
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
  };

  const DeleteFile = (user, folderid, fileid) => {
    return new Promise((resolve, reject) => {
      Model.file
        .findOne({ where: { id: fileid, folder_id: folderid } })
        .then((fileObj) => {
          if (!fileObj) {
            reject(new Error('Folder not found'));
          } else if (fileObj.fileId) {
            App.services.Storj.DeleteFile(user, fileObj.bucket, fileObj.fileId)
              .then(() => {
                fileObj.destroy().then(resolve).catch(reject);
              })
              .catch((err) => {
                const resourceNotFoundPattern = /Resource not found/;

                if (resourceNotFoundPattern.exec(err.message)) {
                  fileObj.destroy().then(resolve).catch(reject);
                } else {
                  log.error('Error deleting file from bridge:', err.message);
                  reject(err);
                }
              });
          } else {
            fileObj.destroy().then(resolve).catch(reject);
          }
        })
        .catch((err) => {
          log.error('Failed to find folder on database:', err.message);
          reject(err);
        });
    });
  };

  const UpdateMetadata = (user, fileId, metadata) => {
    return new Promise((resolve, reject) => {
      const newMeta = {};

      async.waterfall(
        [
          (next) => {
            // Find the file in database
            Model.file
              .findOne({ where: { fileId: { [Op.eq]: fileId } } })
              .then((file) => next(null, file))
              .catch(next);
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
              ? App.services.Crypt.encryptName(
                metadata.itemName,
                file.folder_id
              )
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
                  next(Error('File with this name exists'));
                } else {
                  newMeta.name = cryptoFileName;
                }

                next(null, file);
              })
              .catch(next);
          },
          (file, next) => {
            if (newMeta.name !== file.name) {
              file
                .update(newMeta)
                .then((update) => next(null, update))
                .catch(next);
            } else {
              next();
            }
          },
        ],
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });
  };

  const GetNewMoveName = async (destination, originalName, type) => {
    let exists = true;
    let i = 1;
    let nextName;
    let nextCryptedName;
    while (exists) {
      nextName = App.services.Utils.getNewMoveName(originalName, i);
      nextCryptedName = App.services.Crypt.encryptName(
        App.services.Utils.getNewMoveName(originalName, i),
        destination
      );
      // eslint-disable-next-line no-await-in-loop
      exists = !!(await Model.file.findOne({
        where: {
          folder_id: { [Op.eq]: destination },
          name: { [Op.eq]: nextCryptedName },
          type: { [Op.eq]: type },
        },
        raw: true,
      }));
      i += 1;
    }

    return { cryptedName: nextCryptedName, name: nextName };
  };

  const MoveFile = async (user, fileId, destination) => {
    const file = await Model.file.findOne({
      where: { fileId: { [Op.eq]: fileId } },
    });
    if (!file) {
      throw new Error('File not found');
    }

    const originalName = App.services.Crypt.decryptName(
      file.name,
      file.folder_id
    );
    let destinationName = App.services.Crypt.encryptName(
      originalName,
      destination
    );

    const exists = await Model.file.findOne({
      where: {
        name: { [Op.eq]: destinationName },
        folder_id: { [Op.eq]: destination },
        type: { [Op.eq]: file.type },
      },
    });

    // Change name if exists
    if (exists) {
      const newName = await GetNewMoveName(
        destination,
        originalName,
        file.type
      );
      destinationName = newName.cryptedName;
    }

    // Move
    const result = await file.update({
      folder_id: parseInt(destination, 0),
      name: destinationName,
    });
    // we don't want ecrypted name on front
    file.setDataValue(
      'name',
      App.services.Crypt.decryptName(destinationName, destination)
    );
    file.setDataValue('folder_id', parseInt(destination, 0));
    const response = {
      result,
      item: file,
      destination,
      moved: true,
    };

    return response;
  };

  const ListAllFiles = (user, bucketId) => {
    return new Promise((resolve, reject) => {
      App.services.Storj.ListBucketFiles(user, bucketId)
        .then(resolve)
        .catch((err) => reject(err.message));
    });
  };

  return {
    Name: 'Files',
    Upload,
    CreateFile,
    Delete,
    DeleteFile,
    Download,
    UpdateMetadata,
    GetNewMoveName,
    MoveFile,
    ListAllFiles,
    DownloadFolderFile,
  };
};

const fs = require('fs');
const sequelize = require('sequelize');
const axios = require('axios');

const Op = sequelize.Op;

module.exports = (Model, App) => {

  const CreateFile = (file) => {
    return new Promise(async (resolve, reject) => {
      Model.folder.findOne({ where: { bucket: { [Op.eq]: file.folder_id } } })
        .then((folder) => {
          // Attention: bucketId is the fileId.
          Model.file.create({
            bucketId: file.fileId,
            name: file.name,
            type: file.type,
            size: file.size,
            folder_id: folder.id,
            fileId: file.fileId,
            bucket: file.folder_id
          }).then((creation) => {
            resolve(creation);
          }).catch((err) => {
            reject('Unable to create file in database');
          });
        }).catch((err) => {
          reject('Cannot find bucket ' + file.folder_id);
        });
    })
  }

  const Upload = (user, folderId, fileName, filePath) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (user.mnemonic === 'null') throw new Error('Your mnemonic is invalid');

        App.logger.info(`Starting file upload: ${fileName}`)

        const rootFolder = await Model.folder.findOne({ where: { id: { [Op.eq]: user.root_folder_id } } });
        const folder = await Model.folder.findOne({ where: { id: { [Op.eq]: folderId } } });

        // Separate filename from extension
        const extSeparatorPos = fileName.lastIndexOf('.')
        const fileNameNoExt = extSeparatorPos > 0 ? fileName.slice(0, extSeparatorPos) : fileName;

        const encryptedFileName = App.services.Crypt.encryptName(fileNameNoExt, folderId);
        const originalEncryptedFileName = App.services.Crypt.encryptName(fileNameNoExt);

        const fileExt = fileName.slice(extSeparatorPos + 1);

        // Check if file already exists.
        const exists = await Model.file.findOne({
          where: {
            name: { [Op.eq]: encryptedFileName },
            folder_id: { [Op.eq]: folderId },
            type: { [Op.eq]: fileExt }
          }
        });

        if (exists) throw new Error('File with same name already exists in this folder')

        const encryptedFileNameWithExt = `${encryptedFileName}.${fileExt}`
        const originalEncryptedFileNameWithExt = `${originalEncryptedFileName}.${fileExt}`

        App.logger.info('Uploading file to network')
        App.services.Storj.StoreFile(user, rootFolder.bucket, originalEncryptedFileNameWithExt, filePath)
          .then(async ({ fileId, size }) => {
            const addedFile = await Model.file.create({
              name: encryptedFileName, type: fileExt, fileId, bucketId: fileId, bucket: rootFolder.bucket, size
            })
            const result = await folder.addFile(addedFile)
            resolve(addedFile)
          }).catch((err) => {
            App.logger.error(err.message)
            reject(err.message)
          });
      } catch (err) {
        App.logger.error(err.message)
        reject(err.message)
      } finally {
        fs.unlink(filePath, (error) => {
          if (error) throw error;
          console.log(`Deleted:  ${filePath}`);
        });
      }
    });
  }

  const Download = (user, fileId) => {
    return new Promise(async (resolve, reject) => {
      if (user.mnemonic === 'null') throw new Error('Your mnemonic is invalid')
      const file = await Model.file.findOne({ where: { fileId: { [Op.eq]: fileId } } });
      App.services.Storj.ResolveFile(user, file)
        .then((result) => {
          resolve({ ...result, folderId: file.folder_id })
        }).catch((err) => {
          if (err.message === 'File already exists') {
            resolve({ file: { name: `${file.name}.${file.type}` } })
          } else {
            reject(err)
          }
        });
    });
  }

  const Delete = (user, bucket, fileId) => {
    return new Promise((resolve, reject) => {
      App.services.Storj.DeleteFile(user, bucket, fileId)
        .then(async (result) => {
          const file = await Model.file.findOne({ where: { fileId: { [Op.eq]: fileId } } })
          if (file) {
            const isDestroyed = await file.destroy()
            if (isDestroyed) {
              resolve('File deleted')
            } else {
              reject('Cannot delete file')
            }
          } else {
            reject('File not found')
          }
        }).catch(async (err) => {
          if (err.message.includes('Resource not found')) {
            const file = await Model.file.findOne({ where: { fileId: { [Op.eq]: fileId } } });
            await file.destroy();
          }
          reject(err)
        })
    })
  }

  const UpdateMetadata = async (fileId, metadata) => {
    let result = null;
    // If metadata is passed, update file fields
    if (metadata.itemName) {
      // Get file to update metadata
      const file = await Model.file.findOne({ where: { fileId: { [Op.eq]: fileId } } });

      const newMeta = {}
      if (metadata.itemName) {
        // Check if exists file with new name
        const cryptoFileName = App.services.Crypt.encryptName(metadata.itemName, file.folder_id);
        const exists = await Model.file.findOne({
          where: {
            folder_id: { [Op.eq]: file.folder_id },
            name: { [Op.eq]: cryptoFileName },
            type: { [Op.eq]: file.type }
          }
        });
        if (exists) throw new Error('File with this name exists')
        else {
          newMeta.name = cryptoFileName;
        }
      }

      result = await file.update(newMeta);
    }

    return result;
  }

  const MoveFile = (user, fileId, destination, replace = false) => {
    return new Promise(async (resolve, reject) => {
      const file = await Model.file.findOne({ where: { fileId: { [Op.eq]: fileId } } });
      if (!file) {
        reject(new Error('File not found'));
      } else {
        const originalName = App.services.Crypt.decryptName(file.name, file.folder_id);
        const destinationName = App.services.Crypt.encryptName(originalName, destination);

        const exists = await Model.file.findOne({
          where: {
            name: { [Op.eq]: destinationName },
            folder_id: { [Op.eq]: destination },
            type: { [Op.eq]: file.type }
          }
        });

        if (exists && !replace) {
          reject(Error('Destination contains a file with the same name'));
        } else {
          if (exists) {
            await Delete(user, exists.bucket, exists.fileId);
            console.log('Delete destination file');
          }
          console.log('File renamed in database from %s to %s', file.name, destinationName);

          file.update({
            folder_id: parseInt(destination, 0),
            name: App.services.Crypt.encryptName(originalName, destination)
          }).then(resolve());

        }
      }
    })
  }

  const ListAllFiles = (user, bucketId) => {
    return new Promise((resolve, reject) => {
      App.services.Storj.ListFiles(user, bucketId)
        .then((result) => {
          resolve(result)
        }).catch((err) => {
          reject(err.message)
        });
    })
  }

  const GetFileInfo = (user, fileId) => {
    return new Promise(async (resolve, reject) => {
      const file = await Model.file.findOne({ where: { id: { [Op.eq]: fileId } } });
      if (!file) {
        return reject(Error('File not found'));
      }
      const password = App.services.Crypt.hashSha256(user.userId);

      axios.get(`${process.env.STORJ_BRIDGE}/buckets/${file.bucket}/files/${file.fileId}/info`, {
        auth: {
          username: user.email,
          password: password
        }
      }).then(result => {
        resolve(result.data);
      }).catch(err => {
        reject(err)
      });
    });
  }

  return {
    Name: 'Files',
    Upload,
    CreateFile,
    Delete,
    Download,
    UpdateMetadata,
    MoveFile,
    ListAllFiles,
    GetFileInfo
  }
}

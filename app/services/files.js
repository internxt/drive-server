const fs = require('fs');

module.exports = (Model, App) => {
  const CreateFile = (file) => {
    return new Promise(async (result, reject) => {
      try {
        const folder = await Model.folder.findOne({ where: { id: file.folder_id } })
        const addedFile = await Model.file.create({
          name: file.name,
          type: file.type,
          fileId: file.fileId,
          size: file.size
        });
        const res = await folder.addFile(addedFile)
        result(res);
      } catch (error) {
        App.logger.error(error);
        reject(error);
      }
    })
  }

  const Upload = (user, folderId, fileName, filePath) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (user.mnemonic === 'null') throw new Error('Your mnemonic is invalid');
        App.logger.info(`Starting file upload: ${fileName}`)
        const folder = await Model.folder.findOne({ where: { id: folderId } })
        App.logger.info(`Found upload folder: ${folder.name}`)
        const extSeparatorPos = fileName.lastIndexOf('.')
        const fileNameNoExt = fileName.slice(0, extSeparatorPos)

        App.logger.info(`Encrypting file name`)
        const encryptedFileName = App.services.Crypt.encryptName(fileNameNoExt);

        const exists = await Model.file.findOne({ where: { name: encryptedFileName, folder_id: folderId } })
        if (exists) throw new Error('File with same name already exists in this folder')
        const fileExt = fileName.slice(extSeparatorPos + 1);

        const encryptedFileNameWithExt = `${encryptedFileName}.${fileExt}`
        
        App.logger.info(`Uploading file to network`)
        App.services.Storj.StoreFile(user, folder.bucket, encryptedFileNameWithExt, filePath)
          .then(async ({ fileId, size }) => {
            const addedFile = await Model.file.create({
              name: encryptedFileName, type: fileExt, fileId, bucketId: fileId, bucket: folder.bucket, size
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
      const file = await Model.file.find({ where: { fileId } })
      App.services.Storj.ResolveFile(user, file)
        .then((result) => {
          resolve(result)
        }).catch((err) => {
          if (err.message === 'File already exists') {
            resolve({ file: { name: `${file.name}.${file.type}` } })
          }
          reject(err)
        });
    });
  }

  const Delete = (user, bucket, fileId) => {
    return new Promise((resolve, reject) => {
      App.services.Storj.DeleteFile(user, bucket, fileId)
        .then(async (result) => {
          const file = await Model.file.findOne({ where: { fileId } })
          if (file) {
            const isDestroyed = await file.destroy()
            if (isDestroyed) {
              resolve('File deleted')
            } else {
              throw new Error('Cannot delete file')
            }
          } else {
            throw new Error('File not found')
          }
        }).catch((err) => {
          reject(err)
        })
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

  return {
    Name: 'Files',
    Upload,
    CreateFile,
    Delete,
    Download,
    ListAllFiles
  }
}

const _ = require('lodash')
const Secret = require('crypto-js');

module.exports = (Model, App) => {
  function decryptFolderName(cipherText) {
    const reb64 = Secret.enc.Hex.parse(cipherText);
    const bytes = reb64.toString(Secret.enc.Base64);
    const decrypt = Secret.AES.decrypt(bytes, App.config.get('secrets').CRYPTO);
    const plain = decrypt.toString(Secret.enc.Utf8);
    return plain;
  }

  const encryptFolderName = (folderName) => {
    const b64 = Secret.AES.encrypt(folderName, App.config.get('secrets').CRYPTO).toString();
    const e64 = Secret.enc.Base64.parse(b64);
    const eHex = e64.toString(Secret.enc.Hex);
    return eHex;
  }

  const Op = App.database.Sequelize.Op
  const Create = (user, folderName, parentFolderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const cryptoFolderName = encryptFolderName(folderName);
        const exists = await Model.folder.findOne({
          where: { parentId: parentFolderId, name: cryptoFolderName }
        })
        if (exists) throw new Error('Folder with same name already exists')

        const bucket = await App.services.Storj
          .CreateBucket(user.email, user.userId, user.mnemonic, cryptoFolderName)

        const xCloudFolder = await user.createFolder({
          name: cryptoFolderName,
          bucket: bucket.id,
          parentId: parentFolderId || null
        })
        resolve(xCloudFolder)
      } catch (error) {
        reject(error.message)
      }
    });
  }

  const Delete = (user, folderId) => {
    return new Promise(async (resolve, reject) => {
      const folder = await Model.folder.findOne({ where: { id: folderId } })
      try {
        const isBucketDeleted = await App.services.Storj.DeleteBucket(user, folder.bucket)
        const isFolderDeleted = await folder.destroy()
        Model.folder.rebuildHierarchy()
        resolve(isFolderDeleted)
      } catch (error) {
        reject(error)
      }
    });
  }

  const GetTree = () => {}

  const GetParent = (folder) => { }

  const mapChildrenNames = (folder = []) => {
    return folder.map((child) => {
      child.name = decryptFolderName(child.name)
      child.children = mapChildrenNames(child.children)
      return child;
    });
  }


  const GetContent = async (folderId) => {
    const result = await Model.folder.find({
      where: { id: folderId },
      include: [{
        model: Model.folder,
        as: 'descendents',
        hierarchy: true,
      },
      {
        model: Model.file,
        as: 'files'
      }]
    })
    result.name = decryptFolderName(result.name);
    result.children = mapChildrenNames(result.children)

    return result
  }

  return {
    Name: 'Folder',
    Create,
    Delete,
    GetTree,
    GetParent,
    GetContent,
    decryptFolderName,
    encryptFolderName
  }
}

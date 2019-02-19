const _ = require('lodash')
const Secret = require('crypto-js');

module.exports = (Model, App) => {
  const Op = App.database.Sequelize.Op
  const logger = App.logger;
  const Create = (user, folderName, parentFolderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const cryptoFolderName = App.services.Crypt.encryptName(folderName);
        const exists = await Model.folder.findOne({
          where: { parentId: parentFolderId, name: cryptoFolderName }
        })
        if (exists) throw new Error('Folder with same name already exists')
        if (user.mnemonic === 'null') throw new Error('Your mnemonic is invalid')
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
        if (user.mnemonic === 'null') throw new Error('Your mnemonic is invalid');
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
      child.name = App.services.Crypt.decryptName(child.name)
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
    logger.info(result);
    result.name = App.services.Crypt.decryptName(result.name);
    result.children = mapChildrenNames(result.children)
    result.files = result.files.map((file) => {
      file.name = `${App.services.Crypt.decryptName(file.name)}`;
      return file;
    })
    return result
  }

  return {
    Name: 'Folder',
    Create,
    Delete,
    GetTree,
    GetParent,
    GetContent,
  }
}

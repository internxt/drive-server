const _ = require('lodash')

module.exports = (Model, App) => {
  const Op = App.database.Sequelize.Op
  const Create = (user, folderName, parentFolderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const exists = await Model.folder.findOne({
          where: { parentId: parentFolderId, name: folderName }
        })
        if (exists) throw new Error('Folder with same name already exists')
        const bucket = await App.services.Storj
          .CreateBucket(user.email, user.userId, user.mnemonic, folderName)
        const xCloudFolder = await user.createFolder({
          name: folderName,
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
    return result
  }

  return {
    Name: 'Folder',
    Create,
    Delete,
    GetTree,
    GetParent,
    GetContent
  }
}

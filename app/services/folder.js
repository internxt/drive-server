const _ = require('lodash')
const Secret = require('crypto-js');

module.exports = (Model, App) => {
  const FileService = require('./files')(Model, App);
  const Op = App.database.Sequelize.Op;

  const Create = (user, folderName, parentFolderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (user.mnemonic === 'null') { throw Error('Your mnemonic is invalid'); }

        const cryptoFolderName = App.services.Crypt.encryptName(folderName, parentFolderId);

        const exists = await Model.folder.findOne({
          where: { parentId: { [Op.eq]: parentFolderId }, name: { [Op.eq]: cryptoFolderName } }
        });

        if (exists) {
          throw Error('Folder with the same name already exists');
        }

        // const bucket = await App.services.Storj.CreateBucket(user.email, user.userId, user.mnemonic, cryptoFolderName)

        const xCloudFolder = await user.createFolder({
          name: cryptoFolderName,
          bucket: null,
          parentId: parentFolderId || null
        });

        resolve(xCloudFolder);
      } catch (error) {
        reject(error);
      }
    });
  }

  const Delete = (user, folderId) => {
    return new Promise(async (resolve, reject) => {
      const folder = await Model.folder.findOne({ where: { id: { [Op.eq]: folderId } } })

      try {
        if (user.mnemonic === 'null') throw new Error('Your mnemonic is invalid');
        try {
          // Delete bucket if exists from legacy code
          await App.services.Storj.DeleteBucket(user, folder.bucket);
        } catch (error) {
          // If bucket bot exists an error will be thrown, we ignore it.
        }

        async function AddFolderFilesAndCallMeMaybeWithSubfolders(pk, email) {
          const FilesInFolder = await Model.file.findAll({ where: { folder_id: pk } });

          FilesInFolder.forEach(async file => {
            console.log('Recursive delete file %s (%s)', file.id, user.email);
            await FileService.Delete(user, file.bucket, file.fileId);
          });

          const SubFolders = await Model.folder.findAll({ where: { parentId: pk } });
          SubFolders.forEach(async folder => await AddFolderFilesAndCallMeMaybeWithSubfolders(folder.id, email));
        }

        AddFolderFilesAndCallMeMaybeWithSubfolders(folderId, user.email);

        const isFolderDeleted = await folder.destroy();
        Model.folder.rebuildHierarchy();
        resolve(isFolderDeleted)
      } catch (error) {
        reject(error)
      }
    });
  }

  const GetTree = (user) => {
    const username = user.email;

    return new Promise(async (resolve, reject) => {

      const userObject = await Model.users.findOne({ where: { email: { [Op.eq]: username } } });

      const rootFolder = await Model.folder.findOne({
        where: { id: { [Op.eq]: userObject.root_folder_id } },
        include: [{
          model: Model.folder,
          as: 'descendents',
          hierarchy: true,
          include: [{
            model: Model.file,
            as: 'files'
          }]
        },
        {
          model: Model.file,
          as: 'files'
        }]
      });

      resolve(rootFolder)
    });
  }

  const GetParent = (folder) => { }

  const mapChildrenNames = (folder = []) => {
    return folder.map((child) => {
      child.name = App.services.Crypt.decryptName(child.name, child.parentId);
      child.children = mapChildrenNames(child.children)
      return child;
    });
  }


  const GetContent = async (folderId, email) => {
    const result = await Model.folder.findOne({
      where: { id: { [Op.eq]: folderId } },
      include: [{
        model: Model.folder,
        as: 'descendents',
        hierarchy: true,
        include: [
          {
            model: Model.icon,
            as: 'icon'
          }
        ]
      },
      {
        model: Model.file,
        as: 'files'
      },
      {
        model: Model.icon,
        as: 'icon'
      }
      ]
    });

    // Null result implies empty folder.
    // TODO: Should send an error to be handled and showed on website.

    if (result != null) {
      result.name = App.services.Crypt.decryptName(result.name, result.parentId);
      result.children = mapChildrenNames(result.children)
      result.files = result.files.map((file) => {
        file.name = `${App.services.Crypt.decryptName(file.name, file.folder_id)}`;
        return file;
      })
    }
    return result
  }

  const UpdateMetadata = async (folderId, metadata) => {
    let result = null;
    // If icon or color is passed, update folder fields
    if (metadata.itemName || metadata.color || (typeof metadata.icon === 'number' && metadata.icon >= 0)) {
      // Get folder to update metadata
      const folder = await Model.folder.findOne({ where: { id: { [Op.eq]: folderId } } });

      const newMeta = {}
      if (metadata.itemName) {
        // Check if exists folder with new name
        const cryptoFolderName = App.services.Crypt.encryptName(metadata.itemName, folder.parentId);
        const exists = await Model.folder.findOne({
          where: { parentId: { [Op.eq]: folder.parentId }, name: { [Op.eq]: cryptoFolderName } }
        });
        if (exists) throw new Error('Folder with this name exists')
        else {
          newMeta.name = cryptoFolderName;
        }
      }
      if (metadata.color) newMeta.color = metadata.color;
      if (typeof metadata.icon === 'number' && metadata.icon >= 0) newMeta.icon_id = metadata.icon;

      result = await folder.update(newMeta);
    }

    return result;
  }

  return {
    Name: 'Folder',
    Create,
    Delete,
    GetTree,
    GetParent,
    GetContent,
    UpdateMetadata
  }
}

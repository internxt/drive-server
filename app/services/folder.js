const _ = require('lodash')
const SanitizeFilename = require('sanitize-filename')
const sequelize = require('sequelize');
const async = require('async')

const Op = sequelize.Op;

module.exports = (Model, App) => {
  const FileService = require('./files')(Model, App);

  const Create = (user, folderName, parentFolderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        // parent folder is yours?
        const existsParentFolder = await Model.folder.findOne({
          where: { id: { [Op.eq]: parentFolderId }, user_id: { [Op.eq]: user.id } }
        });

        if (!existsParentFolder) {
          console.warn('Parent folder is not yours')
          throw Error('Parent folder is not yours')
        }

        // Prevent strange folder names from being created
        const sanitizedFoldername = SanitizeFilename(folderName)

        if (sanitizedFoldername !== folderName) {
          throw Error('Invalid folder name')
        }

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
        })

        resolve(xCloudFolder);
      } catch (error) {
        reject(error);
      }
    });
  }

  const Delete = (user, folderId) => {
    return new Promise(async (resolve, reject) => {
      const folder = await Model.folder.findOne({ where: { id: { [Op.eq]: folderId } } })

      if (!folder) {
        console.error('Folder does not exists')
        return resolve(true)
      }

      try {
        if (user.mnemonic === 'null') throw new Error('Your mnemonic is invalid');
        try {
          // Delete bucket if exists from legacy code
          await App.services.Storj.DeleteBucket(user, folder.bucket);
        } catch (error) {
          // If bucket bot exists an error will be thrown, we ignore it.
        }

        // eslint-disable-next-line no-inner-declarations
        async function AddFolderFilesAndCallMeMaybeWithSubfolders(pk, email) {
          const FilesInFolder = await Model.file.findAll({ where: { folder_id: pk } });

          FilesInFolder.forEach(async (file) => {
            console.log('Recursive delete file %s (%s)', file.id, user.email);
            await FileService.Delete(user, file.bucket, file.fileId);
          });

          const SubFolders = await Model.folder.findAll({ where: { parentId: pk } });
          // eslint-disable-next-line no-return-await
          SubFolders.forEach(async folderResult => await AddFolderFilesAndCallMeMaybeWithSubfolders(folderResult.id, email));
        }

        await AddFolderFilesAndCallMeMaybeWithSubfolders(folderId, user.email);

        const isFolderDeleted = await folder.destroy();
        await Model.folder.rebuildHierarchy();
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


  const GetContent = async (folderId, user) => {
    const result = await Model.folder.findOne({
      where: {
        id: { [Op.eq]: folderId },
        user_id: user.id
      },
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

    if (result !== null) {
      result.name = App.services.Crypt.decryptName(result.name, result.parentId);
      result.children = mapChildrenNames(result.children)
      result.files = result.files.map((file) => {
        file.name = `${App.services.Crypt.decryptName(file.name, file.folder_id)}`;
        return file;
      })
    }
    return result
  }

  const UpdateMetadata = (user, folderId, metadata) => {
    return new Promise((resolve, reject) => {
      const newMeta = {}

      async.waterfall([
        (next) => {
          // Is there something to change?
          if (!metadata.itemName && !metadata.icon && !metadata.color) {
            next(Error('Nothing to change'))
          } else {
            next()
          }
        },
        (next) => {
          // Get the target folder from database
          Model.folder.findOne({ where: { id: { [Op.eq]: folderId } } })
            .then(result => next(null, result))
            .catch(next)
        },
        (folder, next) => {
          // Check if user is the owner of that folder
          if (folder.user_id !== user.id) {
            next(Error('Update Folder Metadata: This is not your folder'))
          } else {
            next(null, folder)
          }
        },
        (folder, next) => {
          // Check if the new folder name already exists
          if (metadata.itemName) {
            const cryptoFolderName = App.services.Crypt.encryptName(metadata.itemName, folder.parentId);

            Model.folder.findOne({
              where: { parentId: { [Op.eq]: folder.parentId }, name: { [Op.eq]: cryptoFolderName } }
            }).then((isDuplicated) => {
              if (isDuplicated) {
                next(Error('Folder with this name exists'))
              } else {
                newMeta.name = cryptoFolderName
                next(null, folder)
              }
            }).catch(next)
          } else {
            next(null, folder)
          }
        },
        (folder, next) => {
          // Set optional changes
          if (metadata.color) { newMeta.color = metadata.color }
          if (typeof metadata.icon === 'number' && metadata.icon >= 0) { newMeta.icon_id = metadata.icon }
          next(null, folder)
        },
        (folder, next) => {
          // Perform the update
          folder.update(newMeta).then(result => next(null, result)).catch(next)
        }
      ], (err, result) => {
        if (err) { reject(err) } else { resolve(result) }
      })
    })
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

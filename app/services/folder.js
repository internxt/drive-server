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
    console.info('User %s requested to delete folder %s', user.email, folderId)
    return new Promise((resolve, reject) => {

      async.waterfall([
        next => {
          // Mnemonic is needed to use the CLI
          if (user.mnemonic === 'null') { next(new Error('Your mnemonic is invalid')) } else { next() }
        },
        next => {
          // Check if user is the owner if the folder
          Model.folder.findOne({ where: { id: { [Op.eq]: folderId }, userId: { [Op.eq]: user.id } } }).then(result => next(null, result)).catch(() => next('Folder does not exists'))
        },
        (folder, next) => {
          // Check if folder is the root folder
          console.log(folder.id)
          if (folder.id === user.root_folder_id) {
            next(new Error('Cannot delete root folder'))
          } else {
            next(null, folder)
          }
        },
        (folder, next) => {
          // If folder has bucket id, is a legacy folder. Just delete that bucket.
          if (folder.bucket) {
            App.services.Storj.DeleteBucket(user, folder.bucket).then(() => next(null, folder)).catch(err => reject(err))
          }
          else {
            next(null, folder)
          }
        },
        (folder, next) => {
          // Delete all the files in the folder
          Model.file.findAll({ where: { folder_id: folder.id } }).then(files => {
            async.eachSeries(files, (file, nextFile) => {
              FileService.Delete(user, file.bucket, file.fileId).then(() => {
                console.log('Deleted file %s', file.fileId)
                nextFile()
              }).catch(err => {
                console.log('Error deleting file %s', err)
                nextFile(err)
              })
            }, (err) => next(err, folder))            
          }).catch(next)
        },
        (folder, next) => {
          // Find all subfolders and repeat
          Model.folder.findAll({ where: { parentId: folder.id } }).then(subFolders => {
            async.eachSeries(subFolders, (subFolder, nextSubFolder) => {
              console.log(subFolder.id)
              Delete(user, subFolder.id).then(() => {
                console.log('Deleted folder %s', subFolder.id)
                nextSubFolder()
              }).catch(nextSubFolder)
            }, (err) => {
              next(err, folder)
            })
          }).catch(next)
        },
        (folder, next) => {
          // Delete folder itself
          folder.destroy().then(() => next()).catch(err => next(err))
        }
      ], (err) => {
        if (err) {
          reject(new Error(err))
        } else {
          resolve()
        }
      })
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

  const GetBucketList = (user) => {
    return new Promise((resolve, reject) => {
      App.services.Storj.ListBuckets(user).then(resolve).catch(reject)
    })
  }

  const MoveFolder = (user, folderId, destination, replace = false) => {
    return new Promise(async (resolve, reject) => {
      const folder = await Model.folder.findOne({ where: { id: { [Op.eq]: folderId } } })
      const destinationFolder = await Model.folder.findOne({ where: { id: { [Op.eq]: destination } } })

      if (!folder || !destinationFolder) {
        console.error('Folder does not exists')
        return resolve(true)
      }

      const originalName = App.services.Crypt.decryptName(folder.name, folder.parentId)
      const destinationName = App.services.Crypt.encryptName(originalName, destination)

      const exists = await Model.folder.findOne({
        where: {
          name: { [Op.eq]: destinationName },
          parent_id: { [Op.eq]: destination }
        }
      })

      if (exists && !replace) {
        return reject(Error('Destination contains a folder with the same name'))
      }

      try {
        if (user.mnemonic === 'null') throw new Error('Your mnemonic is invalid');

        folder.update({
          parentId: destination,
          name: destinationName
        }).then(async (res) => {
          await Model.folder.rebuildHierarchy();
          resolve(true);
        }).catch((err) => {
          reject(err);
        });
      } catch (error) {
        reject(error);
      }
    })
  }

  return {
    Name: 'Folder',
    Create,
    Delete,
    GetTree,
    GetParent,
    GetContent,
    UpdateMetadata,
    GetBucketList,
    MoveFolder
  }
}

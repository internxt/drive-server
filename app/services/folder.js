const fs = require('fs');

const _ = require('lodash');
const SanitizeFilename = require('sanitize-filename');
const sequelize = require('sequelize');
const async = require('async');
const AdmZip = require('adm-zip');

const { Op } = sequelize;

module.exports = (Model, App) => {
  const FileService = require('./files')(Model, App);

  const Create = (user, folderName, parentFolderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        // parent folder is yours?
        const existsParentFolder = await Model.folder.findOne({
          where: {
            id: { [Op.eq]: parentFolderId },
            user_id: { [Op.eq]: user.id },
          },
        });

        if (!existsParentFolder) {
          console.warn('Parent folder is not yours');
          throw Error('Parent folder is not yours');
        }

        // Prevent strange folder names from being created
        const sanitizedFoldername = SanitizeFilename(folderName);

        if (folderName === '' || sanitizedFoldername !== folderName) {
          throw Error('Invalid folder name');
        }

        if (user.mnemonic === 'null') {
          throw Error('Your mnemonic is invalid');
        }

        const cryptoFolderName = App.services.Crypt.encryptName(
          folderName,
          parentFolderId
        );

        const exists = await Model.folder.findOne({
          where: {
            parentId: { [Op.eq]: parentFolderId },
            name: { [Op.eq]: cryptoFolderName },
          },
        });

        if (exists) {
          throw Error('Folder with the same name already exists');
        }

        // const bucket = await App.services.Storj.CreateBucket(user.email, user.userId, user.mnemonic, cryptoFolderName)

        const xCloudFolder = await user.createFolder({
          name: cryptoFolderName,
          bucket: null,
          parentId: parentFolderId || null,
        });

        resolve(xCloudFolder);
      } catch (error) {
        reject(error);
      }
    });
  };

  const Delete = async (user, folderId) => {
    console.info('User %s requested to delete folder %s', user.email, folderId);

    if (user.mnemonic === 'null') {
      return new Error('Your mnemonic is invalid');
    }

    const folder = await Model.folder.findOne({
      where: { id: { [Op.eq]: folderId }, userId: { [Op.eq]: user.id } },
    });
    if (!folder) {
      return new Error('Folder does not exists');
    }

    console.log(folder.id);
    if (folder.id === user.root_folder_id) {
      return new Error('Cannot delete root folder');
    }

    if (folder.bucket) {
      await App.services.Storj.DeleteBucket(user, folder.bucket);
    }

    // Delete all the files in the folder
    // Find all subfolders and repeat
    const folderFiles = await Model.file.findAll({
      where: { folder_id: folder.id },
    });
    const folderFolders = await Model.folder.findAll({
      where: { parentId: folder.id },
    });
    await Promise.all(
      folderFiles
        .map((file) => FileService.Delete(user, file.bucket, file.fileId))
        .concat(folderFolders.map((subFolder) => Delete(user, subFolder.id)))
    );

    // Destroy folder
    const removed = await folder.destroy();

    return removed;
  };

  const CreateZip = (zipFileName, pathNames = []) => {
    const zip = new AdmZip();

    pathNames.forEach((path) => {
      const p = fs.statSync(path);

      if (p.isFile()) {
        zip.addLocalFile(path);
      } else if (p.isDirectory()) {
        const zipInternalPath = path.split('/')[2];
        zip.addLocalFolder(path, zipInternalPath);
      }
    });

    zip.writeZip(zipFileName);
  };

  const Download = (tree, userData) => {
    return new Promise(async (resolve, reject) => {
      const rootFolder = App.services.Crypt.decryptName(
        tree.name,
        tree.parentId
      );
      const rootPath = `./downloads/${tree.id}/${rootFolder}`;
      const listFilesToDownload = [];

      function traverseFile(files, path = rootPath) {
        files.forEach((file) => {
          listFilesToDownload.push({
            id: file.fileId,
            path,
          });
        });
      }

      function traverseChildren(children, path = rootPath) {
        children.forEach((child) => {
          const subFolder = App.services.Crypt.decryptName(
            child.name,
            child.parentId
          );

          fs.mkdir(`${path}/${subFolder}`, { recursive: true }, (err) => {
            if (err) throw err;
          });

          if (child.files && child.files.length > 0) {
            traverseFile(child.files, `${path}/${subFolder}`);
          }

          if (child.children && child.children.length > 0) {
            traverseChildren(child.children, `${path}/${subFolder}`);
          }
        });
      }

      fs.mkdir(rootPath, { recursive: true }, (err) => {
        if (err) throw err;
      });

      if (tree.files && tree.files.length > 0) {
        traverseFile(tree.files);
      }

      if (tree.children && tree.children.length > 0) {
        traverseChildren(tree.children);
      }

      async.eachSeries(
        listFilesToDownload,
        (file, next) => {
          FileService.DownloadFolderFile(userData, file.id, file.path)
            .then(() => {
              next();
            })
            .catch((err) => {
              next(err);
            });
        },
        (err) => {
          return err ? reject(err) : resolve();
        }
      );
    });
  };

  const GetTreeSize = (tree) => {
    let treeSize = 0;

    function getFileSize(files) {
      files.forEach((file) => {
        treeSize += file.size;
      });
    }

    function getChildrenSize(children) {
      children.forEach((child) => {
        if (child.files && child.files.length > 0) {
          getFileSize(child.files);
        }

        if (child.children && child.children.length > 0) {
          getChildrenSize(child.children);
        }
      });
    }

    if (tree.files && tree.files.length > 0) {
      getFileSize(tree.files);
    }

    if (tree.children && tree.children.length > 0) {
      getChildrenSize(tree.children);
    }

    return treeSize;
  };

  const GetTree = (user, rootFolderId = null) => {
    const username = user.email;

    return new Promise(async (resolve, reject) => {
      const userObject = await Model.users.findOne({
        where: { email: { [Op.eq]: username } },
      });
      rootFolderId = !rootFolderId ? userObject.root_folder_id : rootFolderId;

      const rootFolder = await Model.folder.findOne({
        where: { id: { [Op.eq]: rootFolderId } },
        include: [
          {
            model: Model.folder,
            as: 'descendents',
            hierarchy: true,
            include: [
              {
                model: Model.file,
                as: 'files',
              },
            ],
          },
          {
            model: Model.file,
            as: 'files',
          },
        ],
      });

      resolve(rootFolder);
    });
  };

  const mapChildrenNames = (folder = []) => {
    return folder.map((child) => {
      child.name = App.services.Crypt.decryptName(child.name, child.parentId);
      child.children = mapChildrenNames(child.children);

      return child;
    });
  };

  const GetContent = async (folderId, user) => {
    const result = await Model.folder.findOne({
      where: {
        id: { [Op.eq]: folderId },
        user_id: user.id,
      },
      include: [
        {
          model: Model.folder,
          as: 'descendents',
          hierarchy: true,
          include: [
            {
              model: Model.icon,
              as: 'icon',
            },
          ],
        },
        {
          model: Model.file,
          as: 'files',
        },
        {
          model: Model.icon,
          as: 'icon',
        },
      ],
    });

    // Null result implies empty folder.
    // TODO: Should send an error to be handled and showed on website.

    if (result !== null) {
      result.name = App.services.Crypt.decryptName(
        result.name,
        result.parentId
      );
      result.children = mapChildrenNames(result.children);
      result.files = result.files.map((file) => {
        file.name = `${App.services.Crypt.decryptName(
          file.name,
          file.folder_id
        )}`;

        return file;
      });
    }

    return result;
  };

  const UpdateMetadata = (user, folderId, metadata) => {
    return new Promise((resolve, reject) => {
      const newMeta = {};

      async.waterfall(
        [
          (next) => {
            // Is there something to change?
            if (!metadata.itemName && !metadata.icon && !metadata.color) {
              next(Error('Nothing to change'));
            } else {
              next();
            }
          },
          (next) => {
            // Get the target folder from database
            Model.folder
              .findOne({ where: { id: { [Op.eq]: folderId } } })
              .then((result) => next(null, result))
              .catch(next);
          },
          (folder, next) => {
            // Check if user is the owner of that folder
            if (folder.user_id !== user.id) {
              next(Error('Update Folder Metadata: This is not your folder'));
            } else {
              next(null, folder);
            }
          },
          (folder, next) => {
            // Check if the new folder name already exists
            if (metadata.itemName) {
              const cryptoFolderName = App.services.Crypt.encryptName(
                metadata.itemName,
                folder.parentId
              );

              Model.folder
                .findOne({
                  where: {
                    parentId: { [Op.eq]: folder.parentId },
                    name: { [Op.eq]: cryptoFolderName },
                  },
                })
                .then((isDuplicated) => {
                  if (isDuplicated) {
                    next(Error('Folder with this name exists'));
                  } else {
                    newMeta.name = cryptoFolderName;
                    next(null, folder);
                  }
                })
                .catch(next);
            } else {
              next(null, folder);
            }
          },
          (folder, next) => {
            // Set optional changes
            if (metadata.color) {
              newMeta.color = metadata.color;
            }

            if (typeof metadata.icon === 'number' && metadata.icon >= 0) {
              newMeta.icon_id = metadata.icon;
            }

            next(null, folder);
          },
          (folder, next) => {
            // Perform the update
            folder
              .update(newMeta)
              .then((result) => next(null, result))
              .catch(next);
          },
        ],
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        },
        (folder, next) => {
          // Set optional changes
          if (metadata.color) {
            newMeta.color = metadata.color;
          }

          if (typeof metadata.icon === 'number' && metadata.icon >= 0) {
            newMeta.icon_id = metadata.icon;
          }

          if (metadata.icon === 'none') {
            newMeta.icon_id = null;
          }

          next(null, folder);
        },
        (folder, next) => {
          // Perform the update
          folder
            .update(newMeta)
            .then((result) => next(null, result))
            .catch(next);
        }
      );
    });
  };

  const GetBucketList = (user) => {
    return new Promise((resolve, reject) => {
      App.services.Storj.ListBuckets(user).then(resolve).catch(reject);
    });
  };

  const GetChildren = async (user, folderId, options = {}) => {
    const query = {
      where: {
        user_id: { [Op.eq]: user.id },
        parent_id: { [Op.eq]: folderId },
      },
      raw: true,
    };

    if (options.attributes) {
      query.attributes = options.attributes;
    }

    return Model.folder.findAll(query);
  };

  const GetNewMoveName = async (
    user,
    destination,
    originalName,
    newFolder = false
  ) => {
    let exists = true;
    let i = 1;
    let nextName;
    let nextCryptedName;
    while (exists) {
      nextName = App.services.Utils.getNewMoveName(originalName, i);
      nextCryptedName = App.services.Crypt.encryptName(nextName, destination);
      // eslint-disable-next-line no-await-in-loop
      exists = !!(await Model.folder.findOne({
        where: {
          parent_id: { [Op.eq]: destination },
          name: { [Op.eq]: nextCryptedName },
          user_id: { [Op.eq]: user.id },
        },
        raw: true,
      }));
      i += 1;
    }

    return { cryptedName: nextCryptedName, name: nextName };
  };

  const MoveFolder = async (user, folderId, destination) => {
    const folder = await Model.folder.findOne({
      where: { id: { [Op.eq]: folderId } },
    });
    const destinationFolder = await Model.folder.findOne({
      where: { id: { [Op.eq]: destination } },
    });

    if (!folder || !destinationFolder) {
      throw new Error('Folder does not exists');
    }

    const originalName = App.services.Crypt.decryptName(
      folder.name,
      folder.parentId
    );
    let destinationName = App.services.Crypt.encryptName(
      originalName,
      destination
    );
    const exists = await Model.folder.findOne({
      where: {
        name: { [Op.eq]: destinationName },
        parent_id: { [Op.eq]: destination },
      },
    });

    if (exists) {
      // Change folder origin name before move
      const newName = await GetNewMoveName(user, destination, originalName);
      destinationName = newName.cryptedName;
    }

    if (user.mnemonic === 'null') throw new Error('Your mnemonic is invalid');

    // Move
    const result = await folder.update({
      parentId: parseInt(destination, 0),
      name: destinationName,
    });
    // we don't want ecrypted name on front
    folder.setDataValue(
      'name',
      App.services.Crypt.decryptName(destinationName, destination)
    );
    folder.setDataValue('parentId', parseInt(destination, 0));
    const response = {
      result,
      item: folder,
      destination,
      moved: true,
    };

    return response;
  };

  return {
    Name: 'Folder',
    Create,
    Delete,
    GetChildren,
    GetTree,
    GetTreeSize,
    GetContent,
    GetNewMoveName,
    UpdateMetadata,
    GetBucketList,
    MoveFolder,
    Download,
    CreateZip,
  };
};

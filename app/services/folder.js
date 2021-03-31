const fs = require('fs');
const SanitizeFilename = require('sanitize-filename');
const sequelize = require('sequelize');
const async = require('async');
const AdmZip = require('adm-zip');
const FileService = require('./files');
const AesUtil = require('../../lib/AesUtil');

const { Op } = sequelize;

module.exports = (Model, App) => {
  const FileServiceInstance = FileService(Model, App);

  // Create folder entry, for desktop
  const Create = async (user, folderName, parentFolderId, teamId = null) => {
    if (parentFolderId >= 2147483648) {
      throw Error('Invalid parent folder');
    }
    // parent folder is yours?
    const whereCondition = { where: null };

    if (teamId) {
      whereCondition.where = {
        id: { [Op.eq]: parentFolderId },
        id_team: { [Op.eq]: teamId }
      };
    } else {
      whereCondition.where = {
        id: { [Op.eq]: parentFolderId },
        user_id: { [Op.eq]: user.id }
      };
    }

    const existsParentFolder = await Model.folder.findOne({ whereCondition });

    if (!existsParentFolder) {
      throw Error('Parent folder is not yours');
    }

    // Prevent strange folder names from being created
    const sanitizedFoldername = SanitizeFilename(folderName);

    if (folderName === '' || sanitizedFoldername !== folderName) {
      throw Error('Invalid folder name');
    }

    if (user.mnemonic === 'null') {
      // throw Error('Your mnemonic is invalid');
    }

    // Encrypt folder name, TODO: use versioning for encryption
    const cryptoFolderName = App.services.Crypt.encryptName(folderName,
      parentFolderId);

    const exists = await Model.folder.findOne({
      where: {
        parentId: { [Op.eq]: parentFolderId },
        name: { [Op.eq]: cryptoFolderName }
      }
    });

    if (exists) {
      // TODO: If the folder already exists,
      // return the folder data to make desktop
      // incorporate new info to its database
      throw Error('Folder with the same name already exists');
    }

    // Since we upload everything in the same bucket, this line is no longer needed
    // const bucket = await App.services.Storj.CreateBucket(user.email, user.userId, user.mnemonic, cryptoFolderName)

    const xCloudFolder = await user.createFolder({
      name: cryptoFolderName,
      bucket: null,
      parentId: parentFolderId || null,
      id_team: teamId
    });

    return xCloudFolder;
  };

  const Delete = async (user, folderId) => {
    if (user.mnemonic === 'null') {
      return new Error('Your mnemonic is invalid');
    }

    const folder = await Model.folder.findOne({
      where: { id: { [Op.eq]: folderId }, userId: { [Op.eq]: user.id } }
    });

    if (!folder) {
      return new Error('Folder does not exists');
    }

    if (folder.id === user.root_folder_id) {
      return new Error('Cannot delete root folder');
    }

    if (folder.bucket) {
      await App.services.Storj.DeleteBucket(user, folder.bucket);
    }

    // Delete all the files in the folder
    // Find all subfolders and repeat
    /*
    const folderFiles = await Model.file.findAll({
      where: { folder_id: folder.id }
    });
    const folderFolders = await Model.folder.findAll({
      where: { parentId: folder.id }
    });

    await Promise.all(folderFiles
      .map((file) => FileServiceInstance.Delete(user, file.bucket, file.fileId))
      .concat(folderFolders.map((subFolder) => Delete(user, subFolder.id))));
    */

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

  const Download = async (tree, userData) => {
    const rootFolder = App.services.Crypt.decryptName(tree.name, tree.parentId);
    const rootPath = `./downloads/${tree.id}/${rootFolder}`;
    const listFilesToDownload = [];

    function traverseFile(files, path = rootPath) {
      files.forEach((file) => { listFilesToDownload.push({ id: file.fileId, path }); });
    }

    function traverseChildren(children, path = rootPath) {
      children.forEach((child) => {
        const subFolder = App.services.Crypt.decryptName(child.name, child.parentId);

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

    return async.eachSeries(listFilesToDownload, (file, next) => {
      FileServiceInstance.DownloadFolderFile(userData, file.id, file.path).then(() => {
        next();
      }).catch((err) => {
        next(err);
      });
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

  // A tree without using hierarchy library
  const GetTree = async (user, rootFolderId = null) => {
    const folderContents = (await Model.folder.findOne({
      where: { id: { [Op.eq]: rootFolderId || user.root_folder_id } },
      include: [
        {
          model: Model.folder,
          as: 'children',
          include: [
            {
              model: Model.file,
              as: 'files'
            }
          ]
        },
        {
          model: Model.file,
          as: 'files'
        }
      ]
    })).toJSON();

    const res = await async.mapSeries(folderContents.children, async (folder) => {
      const subfolder = await GetTree(user, folder.id);
      /*
      // Server decrypted tree
      const name = App.services.Crypt.decryptName(subfolder.name, subfolder.parentId);
      subfolder.name = name;
      */
      return subfolder;
    });

    folderContents.children = res;

    return folderContents;
  };

  // Legacy hierarchy tree code (needs sequelize-hierarchy dependency)
  const GetTreeHierarchy = async (user, rootFolderId = null) => {
    const username = user.email;

    const userObject = await Model.users.findOne({ where: { email: { [Op.eq]: username } } });
    rootFolderId = !rootFolderId ? userObject.root_folder_id : rootFolderId;

    const rootFolder = await Model.folder.findOne({
      where: { id: { [Op.eq]: rootFolderId } },
      include: [
        {
          model: Model.folder,
          as: 'descendents',
          include: [
            {
              model: Model.file,
              as: 'files'
            }
          ]
        },
        {
          model: Model.file,
          as: 'files'
        }
      ]
    });

    return rootFolder;
  };

  const GetFolders = async (user) => {
    const userObject = user;

    const folders = await Model.folder.findAll({
      where: { user_id: { [Op.eq]: userObject.id } },
      // where: { user_id: 21810 },
      attributes: ['id', 'parent_id', 'name', 'bucket', 'updated_at']
    });
    const foldersId = folders.map((result) => result.id);
    const files = await Model.file.findAll({
      where: { folder_id: { [Op.in]: foldersId } }
    });
    return {
      folders,
      files
    };
  };

  const GetFoldersPagination = async (user, index) => {
    const userObject = user;

    const folders = await Model.folder.findAll({
      where: { user_id: { [Op.eq]: userObject.id } },
      attributes: ['id', 'parent_id', 'name', 'bucket', 'updated_at', 'created_at'],
      order: [['id', 'DESC']],
      limit: 5000,
      offset: index
    });
    const foldersId = folders.map((result) => result.id);
    const files = await Model.file.findAll({
      where: { folder_id: { [Op.in]: foldersId } }
    });
    return {
      folders,
      files
    };
  };

  const mapChildrenNames = (folder = []) => folder.map((child) => {
    child.name = App.services.Crypt.decryptName(child.name, child.parentId);
    child.children = mapChildrenNames(child.children);

    return child;
  });

  const GetContent = async (folderId, user, teamId = null) => {
    let teamMember = null;
    if (teamId) {
      teamMember = await Model.teamsmembers.findOne({
        where: {
          user: { [Op.eq]: user.email },
          id_team: { [Op.eq]: teamId }
        }
      });
    }

    if (teamId && !teamMember) {
      return null; // User isn't member of this team
    }

    const result = await Model.folder.findOne({
      where: {
        id: { [Op.eq]: folderId },
        user_id: user.id
      },
      include: [
        {
          model: Model.folder,
          as: 'children',
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
      result.children = mapChildrenNames(result.children);
      result.files = result.files.map((file) => {
        file.name = `${App.services.Crypt.decryptName(file.name, file.folder_id)}`;

        return file;
      });
    }

    return result;
  };

  const isFolderOfTeam = (folderId) => {
    return Model.folder.findOne({
      where: {
        id: { [Op.eq]: folderId }
      }
    }).then((folder) => {
      if (!folder) {
        throw Error('Folder not found on database, please refresh');
      }

      return folder;
    });
  };

  const UpdateMetadata = (user, folderId, metadata) => new Promise((resolve, reject) => {
    const newMeta = {};

    async.waterfall([
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
          .findOne({ where: { id: { [Op.eq]: folderId } } }).then((result) => next(null, result)).catch(next);
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
          const cryptoFolderName = App.services.Crypt.encryptName(metadata.itemName,
            folder.parentId);

          Model.folder.findOne({
            where: {
              parentId: { [Op.eq]: folder.parentId },
              name: { [Op.eq]: cryptoFolderName }
            }
          }).then((isDuplicated) => {
            if (isDuplicated) {
              next(Error('Folder with this name exists'));
            } else {
              newMeta.name = cryptoFolderName;
              try {
                AesUtil.decrypt(cryptoFolderName, folder.parentId);
                newMeta.encrypt_version = '03-aes';
              } catch (e) {
                (() => { })();
              }
              next(null, folder);
            }
          }).catch(next);
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
          .update(newMeta).then((result) => next(null, result)).catch(next);
      }
    ], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    }, (folder, next) => {
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
    }, (folder, next) => {
      // Perform the update
      folder.update(newMeta).then((result) => next(null, result)).catch(next);
    });
  });

  const GetBucketList = (user) => App.services.Storj.ListBuckets(user);

  const GetChildren = async (user, folderId, options = {}) => {
    const query = {
      where: {
        user_id: { [Op.eq]: user.id },
        parent_id: { [Op.eq]: folderId }
      },
      raw: true
    };

    if (options.attributes) {
      query.attributes = options.attributes;
    }

    return Model.folder.findAll(query);
  };

  const GetNewMoveName = async (user, destination, originalName) => {
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
          user_id: { [Op.eq]: user.id }
        },
        raw: true
      }));
      i += 1;
    }

    return { cryptedName: nextCryptedName, name: nextName };
  };

  const MoveFolder = async (user, folderId, destination) => {
    const folder = await Model.folder.findOne({
      where: {
        id: { [Op.eq]: folderId },
        user_id: { [Op.eq]: user.id }
      }
    });
    const destinationFolder = await Model.folder.findOne({
      where: {
        id: { [Op.eq]: destination },
        user_id: { [Op.eq]: user.id }
      }
    });

    if (!folder || !destinationFolder) {
      throw Error('Folder does not exists');
    }

    const originalName = App.services.Crypt.decryptName(folder.name,
      folder.parentId);
    let destinationName = App.services.Crypt.encryptName(originalName,
      destination);
    const exists = await Model.folder.findOne({
      where: {
        name: { [Op.eq]: destinationName },
        parent_id: { [Op.eq]: destination }
      }
    });

    if (exists) {
      // Change folder origin name before move
      const newName = await GetNewMoveName(user, destination, originalName);
      destinationName = newName.cryptedName;
    }

    if (user.mnemonic === 'null') throw Error('Your mnemonic is invalid');

    // Move
    const result = await folder.update({
      parentId: parseInt(destination, 10),
      name: destinationName
    });
    // we don't want ecrypted name on front
    folder.setDataValue('name',
      App.services.Crypt.decryptName(destinationName, destination));
    folder.setDataValue('parentId', parseInt(destination, 10));
    const response = {
      result,
      item: folder,
      destination,
      moved: true
    };

    return response;
  };

  const GetBucket = (user, folderId) => Model.folder.findOne({
    where: {
      id: { [Op.eq]: folderId },
      user_id: { [Op.eq]: user.id }
    }
  });

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
    GetBucket,
    GetFolders,
    isFolderOfTeam,
    GetFoldersPagination,
    GetTreeHierarchy
  };
};

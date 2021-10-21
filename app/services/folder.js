const sequelize = require('sequelize');
const async = require('async');
const { fn, col } = require('sequelize');
const createHttpError = require('http-errors');
const AesUtil = require('../../lib/AesUtil');
const Logger = require('../../lib/logger');

const invalidName = /[\\/]|[. ]$/;

const { Op } = sequelize;

module.exports = (Model, App) => {
  const getById = (id) => {
    return Model.folder.findOne({ where: { id }, raw: true }).then((folder) => {
      folder.name = App.services.Crypt.decryptName(folder.name, folder.parentId);

      return folder;
    });
  };

  // Create folder entry, for desktop
  const Create = async (user, folderName, parentFolderId, teamId = null) => {
    if (parentFolderId >= 2147483648) {
      throw Error('Invalid parent folder');
    }
    // parent folder is yours?
    const whereCondition = { where: null };
    const isGuest = user.email !== user.bridgeUser;

    if (isGuest) {
      const { bridgeUser } = user;

      user = await Model.users.findOne({
        where: { username: bridgeUser }
      });
    }

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

    if (folderName === '' || invalidName.test(folderName)) {
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
    // const bucket = await App.services.Inxt.CreateBucket(user.email, user.userId, user.mnemonic, cryptoFolderName)

    const folder = await user.createFolder({
      name: cryptoFolderName,
      bucket: null,
      parentId: parentFolderId || null,
      id_team: teamId
    });

    return folder;
  };

  // Requires stored procedure
  const DeleteOrphanFolders = async (userId) => {
    const clear = await App.database.instance
      .query('CALL clear_orphan_folders_by_user (:userId)',
        { replacements: { userId } });

    const totalLeft = clear[0].total_left;

    if (totalLeft > 0) {
      return DeleteOrphanFolders(userId);
    }

    return true;
  };

  const Delete = async (user, folderId) => {
    if (user.mnemonic === 'null') {
      throw new Error('Your mnemonic is invalid');
    }

    const folder = await Model.folder.findOne({
      where: { id: { [Op.eq]: folderId }, userId: { [Op.eq]: user.id } }
    });

    if (!folder) {
      throw new Error('Folder does not exists');
    }

    if (folder.id === user.root_folder_id) {
      throw new Error('Cannot delete root folder');
    }

    // Destroy folder
    const removed = await folder.destroy();

    DeleteOrphanFolders(user.id).catch((err) => {
      Logger.error('ERROR deleting orphan folders from user %s, reason: %s', user.email, err.message);
    });

    return removed;
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
              as: 'files',
              where: { userId: user.id }
            }
          ]
        },
        {
          model: Model.file,
          as: 'files',
          where: { userId: user.id }
        }
      ]
    })).toJSON();

    const res = await async.mapSeries(folderContents.children, async (folder) => {
      return GetTree(user, folder.id);
    });

    folderContents.children = res;

    return folderContents;
  };

  const GetFoldersPagination = async (user, index) => {
    const userObject = user;
    const root = await Model.folder.findOne({
      where: {
        id: { [Op.eq]: userObject.root_folder_id },
        userId: user.id
      }
    });
    if (!root) {
      throw new Error('root folder does not exists');
    }
    const folders = await Model.folder.findAll({
      where: { user_id: { [Op.eq]: userObject.id } },
      attributes: ['id', 'parent_id', 'name', 'bucket', 'updated_at', 'created_at'],
      order: [['id', 'DESC']],
      limit: 5000,
      offset: index
    });
    const foldersId = folders.map((result) => result.id);
    const files = await Model.file.findAll({
      where: { folder_id: { [Op.in]: foldersId }, userId: user.id }
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

  const getFolders = (parentFolderId, userId) => {
    return Model.folder.findAll({
      where: { parentId: parentFolderId, userId }
    }).then((folders) => {
      if (!folders) {
        throw new Error('Not found');
      }
      return folders.map((folder) => {
        folder.name = App.services.Crypt.decryptName(folder.name, folder.parentId);

        return folder;
      });
    });
  };

  const GetContent = async (folderId, user, teamId = null) => {
    if (user.email !== user.bridgeUser) {
      user = await Model.users.findOne({ where: { username: user.bridgeUser } });
    }

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
          where: { userId: user.id },
          separate: true
        },
        {
          model: Model.file,
          as: 'files',
          where: { userId: user.id },
          separate: true
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

  const UpdateMetadata = (user, folderId, metadata) => {
    const newMeta = {};

    return async.waterfall([
      (next) => {
        // Is there something to change?
        if (!metadata || !metadata.itemName) {
          next(Error('Nothing to change'));
        } else {
          next();
        }
      },
      (next) => {
        if (metadata.itemName && (metadata.itemName === '' || invalidName.test(metadata.itemName))) {
          return next(Error('Invalid folder name'));
        }
        return next();
      },
      (next) => {
        // Get the target folder from database
        Model.folder
          .findOne({
            where: {
              id: { [Op.eq]: folderId },
              user_id: { [Op.eq]: user.id }
            }
          }).then((result) => {
            if (!result) {
              throw Error('Folder does not exists');
            }
            next(null, result);
          }).catch(next);
      },
      (folder, next) => {
        // Check if the new folder name already exists
        if (metadata.itemName) {
          const cryptoFolderName = App.services.Crypt.encryptName(metadata.itemName, folder.parentId);

          Model.folder.findOne({
            where: {
              parentId: { [Op.eq]: folder.parentId },
              name: { [Op.eq]: cryptoFolderName }
            }
          }).then((isDuplicated) => {
            if (isDuplicated) {
              return next(Error('Folder with this name exists'));
            }
            newMeta.name = cryptoFolderName;
            try {
              AesUtil.decrypt(cryptoFolderName, folder.parentId);
              newMeta.encrypt_version = '03-aes';
            } catch (e) {
              // no op
            }
            return next(null, folder);
          }).catch(next);
        } else {
          next(null, folder);
        }
      },
      (folder, next) => {
        // Perform the update
        folder
          .update(newMeta).then((result) => next(null, result)).catch(next);
      }
    ]);
  };

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
    const destinationName = App.services.Crypt.encryptName(originalName,
      destination);
    const exists = await Model.folder.findOne({
      where: {
        name: { [Op.eq]: destinationName },
        parent_id: { [Op.eq]: destination }
      }
    });

    if (exists) {
      throw createHttpError(409, 'A folder with same name exists in destination');
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

  const changeDuplicateName = async (user) => {
    const userObject = user;
    let index = 0;
    let duplicateName = ['inicial'];
    const dict = new Map();
    while (duplicateName.length !== 0) {
      // eslint-disable-next-line no-await-in-loop
      duplicateName = await Model.folder.findAll({
        where: { user_id: { [Op.eq]: userObject.id } },
        attributes: ['name', [fn('COUNT', col('*')), 'count_name']],
        group: ['name'],
        having: {
          count_name: {
            [Op.gt]: 1
          }
        },
        limit: 5000,
        offset: index
      });
      if (duplicateName.length === 0) {
        break;
      }
      duplicateName = duplicateName.map((obj) => { return obj.name; });
      // eslint-disable-next-line no-await-in-loop
      const folders = await Model.folder.findAll({
        where: {
          user_id: {
            [Op.eq]: userObject.id
          },
          name: { [Op.in]: duplicateName }
        },
        attributes: ['id', 'name', 'parent_id']
      });
      dict.clear();
      folders.forEach(async (folder) => {
        if (dict.get(folder.name)) {
          let resolved = false;
          let i = 1;
          while (!resolved) {
            const originalName = App.services.Crypt.decryptName(folder.name, folder.parent_id);
            try {
              // eslint-disable-next-line no-await-in-loop
              await UpdateMetadata(user, folder.id, { itemName: `${originalName}(${i})` });
              resolved = true;
            } catch (e) {
              i += 1;
            }
          }
        } else {
          dict.set(folder.name, true);
        }
      });
      index += 5000;
    }
  };

  return {
    Name: 'Folder',
    getById,
    Create,
    Delete,
    GetChildren,
    GetTree,
    GetTreeSize,
    GetContent,
    UpdateMetadata,
    MoveFolder,
    GetBucket,
    getFolders,
    isFolderOfTeam,
    GetFoldersPagination,
    changeDuplicateName
  };
};

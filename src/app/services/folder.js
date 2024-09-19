const sequelize = require('sequelize');
const async = require('async');
const { fn, col } = require('sequelize');
const createHttpError = require('http-errors');
const AesUtil = require('../../lib/AesUtil');
const logger = require('../../lib/logger').default.getInstance();
const { default: Redis } = require('../../config/initializers/redis');
import { v4 } from 'uuid';
import { FolderAlreadyExistsError, FolderWithNameAlreadyExistsError } from './errors/FolderWithNameAlreadyExistsError';
import { LockNotAvaliableError } from './errors/locks';

const invalidName = /[\\/]|^\s*$/;

const { Op } = sequelize;

module.exports = (Model, App) => {
  const getById = (id) => {
    return Model.folder
      .findOne({
        where: { id },
        raw: true,
      })
      .then((folder) => {
        if (!folder) {
          return null;
        }

        folder.name = App.services.Crypt.decryptName(folder.name, folder.parentId);

        return folder;
      });
  };

  const getByIdAndUserIds = async (id, userIds = []) => {
    const folder = await Model.folder.findOne({
      where: { id },
      raw: true,
    });

    if (!folder) {
      throw new Error('Folder not found');
    }

    const ownedFolder = userIds.some((userId) => {
      return userId === folder.userId;
    });

    if (!ownedFolder) {
      throw new Error('Folder not owned');
    }

    folder.name = App.services.Crypt.decryptName(folder.name, folder.parentId);

    return folder;
  };

  // Create folder entry, for desktop
  const Create = async (user, folderName, parentFolderId, teamId = null, uuid = null) => {
    if (!parentFolderId || isNaN(parentFolderId) || parentFolderId >= 2147483648) {
      throw Error('Invalid parent folder');
    }
    // parent folder is yours?
    const whereCondition = { where: null };
    const isGuest = user.email !== user.bridgeUser;

    if (isGuest) {
      const { bridgeUser } = user;

      user = await Model.users.findOne({
        where: { username: bridgeUser },
      });
    }

    whereCondition.where = {
      id: { [Op.eq]: parentFolderId },
      user_id: { [Op.eq]: user.id },
    };

    const parentFolder = await Model.folder.findOne(whereCondition);

    if (!parentFolder) {
      throw Error('Parent folder is not yours');
    }

    if (folderName === '' || invalidName.test(folderName)) {
      throw Error('Invalid folder name');
    }

    const exists = await Model.folder.findOne({
      where: {
        parentId: { [Op.eq]: parentFolderId },
        plain_name: { [Op.eq]: folderName },
        deleted: { [Op.eq]: false },
      },
    });

    if (exists) {
      // TODO: If the folder already exists,
      // return the folder data to make desktop
      // incorporate new info to its database
      throw new FolderAlreadyExistsError('Folder with the same name already exists');
    }

    const cryptoFolderName = App.services.Crypt.encryptName(folderName, parentFolderId);
    const folder = await user.createFolder({
      name: cryptoFolderName,
      plain_name: folderName,
      uuid: uuid || v4(),
      bucket: null,
      parentId: parentFolderId || null,
      parentUuid: parentFolder.uuid,
    });

    return folder;
  };

  const CheckFolderExistence = async (user, folderName, parentFolderId) => {
    if (parentFolderId >= 2147483648) {
      throw Error('Invalid parent folder');
    }
    const isGuest = user.email !== user.bridgeUser;

    if (isGuest) {
      const { bridgeUser } = user;

      user = await Model.users.findOne({
        where: { username: bridgeUser },
      });
    }

    const parentFolder = await Model.folder.findOne({
      where: {
        id: { [Op.eq]: parentFolderId },
        user_id: { [Op.eq]: user.id },
      },
    });

    if (!parentFolder) {
      throw Error('Parent folder is not yours');
    }

    if (folderName === '' || invalidName.test(folderName)) {
      throw Error('Invalid folder name');
    }

    const folder = await Model.folder.findOne({
      where: {
        parentId: { [Op.eq]: parentFolderId },
        plain_name: { [Op.eq]: folderName },
        deleted: { [Op.eq]: false },
      },
    });
    const folderExists = !!folder;

    return { exists: folderExists, folder };
  };

  // Requires stored procedure
  const DeleteOrphanFolders = async (userId) => {
    const clear = await App.database.query('CALL clear_orphan_folders_by_user (:userId, :output)', {
      replacements: { userId, output: null },
    });
    const totalLeft = clear[0][0].total_left;

    if (totalLeft > 0) {
      return DeleteOrphanFolders(userId);
    }

    return true;
  };

  const Delete = async (user, folderId) => {
    const folder = await Model.folder.findOne({
      where: { id: { [Op.eq]: folderId }, userId: { [Op.eq]: user.id } },
    });

    if (!folder) {
      throw new Error('Folder does not exist');
    }

    if (folder.id === user.root_folder_id) {
      throw new Error('Cannot delete root folder');
    }

    const removed = await folder.update({
      deleted: true,
      deletedAt: new Date(),
      removed: true,
      removedAt: new Date(),
    });

    return removed;
  };

  const GetTree = async (user, rootFolderId = null, deleted = false) => {
    const rootElements = [];
    const pendingFolders = [
      {
        folderId: rootFolderId || user.root_folder_id,
        elements: rootElements,
      },
    ];

    while (pendingFolders.length) {
      const { folderId, elements } = pendingFolders.shift();
      const folder = await getFolderByFolderId(folderId);
      const folderNotOwned = !(folder.userId === user.id);

      if (folderNotOwned) {
        throw new Error('Forbidden');
      }

      folder.files = await getFilesByFolderId(folderId, deleted);
      folder.children = [];

      const folders = await getChildrenFoldersByFolderId(folderId, deleted);

      folders.forEach((f) => {
        pendingFolders.push({
          folderId: f.id,
          elements: folder.children,
        });
      });

      elements.push(folder);
    }

    return rootElements[0];
  };

  const getFolderByFolderId = (folderId) => {
    return Model.folder.findOne({
      raw: true,
      where: {
        id: {
          [Op.eq]: folderId,
        },
      },
    });
  };

  const getChildrenFoldersByFolderId = (folderId, deleted) => {
    return Model.folder.findAll({
      raw: true,
      where: {
        parent_id: {
          [Op.eq]: folderId,
        },
        deleted,
      },
    });
  };

  const getFilesByFolderId = (folderId, deleted) => {
    return Model.file.findAll({
      raw: true,
      where: {
        folder_id: {
          [Op.eq]: folderId,
        },
        deleted,
      },
      include: [
        {
          model: Model.thumbnail,
          as: 'thumbnails',
          required: false,
        },
        {
          model: Model.shares,
          attributes: ['id', 'active', 'hashed_password', 'token', 'code', 'is_folder'],
          as: 'shares',
          required: false,
        },
      ],
    });
  };

  const GetFoldersPagination = async (user, index, filterOptions) => {
    let userObject = user.get({ plain: true });

    const isSharedWorkspace = user.bridgeUser !== user.email;

    if (isSharedWorkspace) {
      const hostUser = await Model.users.findOne({
        where: {
          email: user.bridgeUser,
        },
      });

      userObject = { ...userObject, id: hostUser.id };
    }

    const root = await Model.folder.findOne({
      where: {
        id: { [Op.eq]: userObject.root_folder_id },
        userId: userObject.id,
      },
    });
    if (!root) {
      throw new Error('root folder does not exists');
    }
    const folders = await Model.folder.findAll({
      where: { user_id: { [Op.eq]: userObject.id }, deleted: filterOptions.deleted || false },
      attributes: ['id', 'parent_id', 'name', 'bucket', 'updated_at', 'created_at'],
      order: [['id', 'DESC']],
      limit: 5000,
      offset: index,
    });
    const foldersId = folders.map((result) => result.id);
    const files = await Model.file.findAll({
      where: {
        folder_id: { [Op.in]: foldersId },
        userId: userObject.id,
        status: filterOptions.deleted ? 'TRASHED' : 'EXISTS',
      },
      include: [
        {
          model: Model.thumbnail,
          as: 'thumbnails',
          required: false,
        },
        {
          model: Model.shares,
          attributes: ['id', 'active', 'hashed_password', 'code', 'token', 'is_folder'],
          as: 'shares',
          required: false,
        },
      ],
    });
    return {
      folders,
      files,
    };
  };

  const GetFoldersPaginationWithoutSharesNorThumbnails = async (user, index, filterOptions) => {
    let userObject = user.get({ plain: true });

    const isSharedWorkspace = user.bridgeUser !== user.email;

    if (isSharedWorkspace) {
      const hostUser = await Model.users.findOne({
        where: {
          email: user.bridgeUser,
        },
      });

      userObject = { ...userObject, id: hostUser.id };
    }

    const folders = await Model.folder.findAll({
      where: { user_id: { [Op.eq]: userObject.id }, deleted: filterOptions.deleted || false, removed: false },
      attributes: ['id', 'parent_id', 'name', 'bucket', 'updated_at', 'created_at', 'plain_name'],
      order: [['id', 'DESC']],
      limit: 5000,
      offset: index,
    });

    const foldersId = folders.map((result) => result.id);
    const files = await Model.file.findAll({
      where: {
        folder_id: { [Op.in]: foldersId },
        userId: userObject.id,
        status: filterOptions.deleted ? 'TRASHED' : 'EXISTS',
      },
    });

    return {
      folders,
      files,
    };
  };

  const getFolders = (parentFolderId, userId, deleted = false) => {
    return Model.folder
      .findAll({
        where: { parentId: parentFolderId, userId, deleted },
        include: [
          {
            model: Model.shares,
            attributes: ['id', 'active', 'hashed_password', 'code', 'token', 'is_folder'],
            as: 'shares',
            where: { active: true },
            required: false,
          },
        ],
      })
      .then((folders) => {
        if (!folders) {
          throw new Error('Not found');
        }
        return folders.map((folder) => {
          folder.name = App.services.Crypt.decryptName(folder.name, folder.parentId);

          return folder;
        });
      });
  };

  const isFolderOfTeam = (folderId) => {
    return Model.folder
      .findOne({
        where: {
          id: { [Op.eq]: folderId },
        },
      })
      .then((folder) => {
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
              user_id: { [Op.eq]: user.id },
            },
          })
          .then((result) => {
            if (!result) {
              throw Error('Folder does not exists');
            }
            next(null, result);
          })
          .catch(next);
      },
      (folder, next) => {
        // Check if the new folder name already exists
        if (metadata.itemName) {
          const cryptoFolderName = App.services.Crypt.encryptName(metadata.itemName, folder.parentId);

          Model.folder
            .findOne({
              where: {
                parentId: { [Op.eq]: folder.parentId },
                name: { [Op.eq]: cryptoFolderName },
                deleted: { [Op.eq]: false },
              },
            })
            .then((isDuplicated) => {
              if (isDuplicated) {
                return next(new FolderWithNameAlreadyExistsError('Folder with this name exists'));
              }
              newMeta.name = cryptoFolderName;
              newMeta.plain_name = metadata.itemName;
              try {
                AesUtil.decrypt(cryptoFolderName, folder.parentId);
                newMeta.encrypt_version = '03-aes';
              } catch (e) {
                // no op
              }
              return next(null, folder);
            })
            .catch(next);
        } else {
          next(null, folder);
        }
      },
      (folder, next) => {
        // Perform the update
        folder
          .update(newMeta)
          .then((result) => next(null, result))
          .catch(next);
      },
    ]);
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

  const MoveFolder = async (user, folderId, destination) => {
    const folder = await Model.folder.findOne({
      where: {
        id: { [Op.eq]: folderId },
        user_id: { [Op.eq]: user.id },
      },
    });
    const destinationFolder = await Model.folder.findOne({
      where: {
        id: { [Op.eq]: destination },
        user_id: { [Op.eq]: user.id },
      },
    });

    if (!folder || !destinationFolder) {
      throw Error('Folder does not exists');
    }

    const originalName = App.services.Crypt.decryptName(folder.name, folder.parentId);
    const destinationName = App.services.Crypt.encryptName(originalName, destination);
    const exists = await Model.folder.findOne({
      where: {
        name: { [Op.eq]: destinationName },
        parent_id: { [Op.eq]: destination },
        id: { [Op.ne]: folderId },
        deleted: { [Op.eq]: false },
      },
    });

    if (exists) {
      throw createHttpError(409, 'A folder with same name exists in destination');
    }

    if (user.mnemonic === 'null') throw Error('Your mnemonic is invalid');

    // Move
    const result = await folder.update({
      parentId: parseInt(destination, 10),
      parentUuid: destinationFolder.uuid,
      name: destinationName,
      deleted: false,
      deletedAt: null,
    });
    // we don't want ecrypted name on front
    folder.setDataValue('name', App.services.Crypt.decryptName(destinationName, destination));
    folder.setDataValue('parentId', parseInt(destination, 10));
    const response = {
      result,
      item: folder,
      destination,
      moved: true,
    };

    return response;
  };

  const GetBucket = (user, folderId) =>
    Model.folder.findOne({
      where: {
        id: { [Op.eq]: folderId },
        user_id: { [Op.eq]: user.id },
      },
    });

  const changeDuplicateName = async (user) => {
    const userObject = user;
    let index = 0;
    let duplicateName = ['inicial'];
    const dict = new Map();
    while (duplicateName.length !== 0) {
      // eslint-disable-next-line no-await-in-loop
      duplicateName = await Model.folder.findAll({
        where: {
          user_id: { [Op.eq]: userObject.id },
          deleted: { [Op.eq]: false },
        },
        attributes: ['name', [fn('COUNT', col('*')), 'count_name']],
        group: ['name'],
        having: {
          count_name: {
            [Op.gt]: 1,
          },
        },
        limit: 5000,
        offset: index,
      });
      if (duplicateName.length === 0) {
        break;
      }
      duplicateName = duplicateName.map((obj) => {
        return obj.name;
      });
      // eslint-disable-next-line no-await-in-loop
      const folders = await Model.folder.findAll({
        where: {
          user_id: {
            [Op.eq]: userObject.id,
          },
          name: { [Op.in]: duplicateName },
          deleted: { [Op.eq]: false },
        },
        attributes: ['id', 'name', 'parent_id'],
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

  const acquireLock = async (userId, folderId, lockId) => {
    const redis = Redis.getInstance();

    const res = await redis.set(`${userId}-${folderId}`, lockId, 'EX', 15, 'NX');

    if (!res) throw new Error();
  };

  const refreshLock = async (userId, folderId, lockId) => {
    const redis = Redis.getInstance();

    const res = await redis.refreshLock(`${userId}-${folderId}`, lockId);

    if (!res) throw new Error();
  };

  const releaseLock = async (userId, folderId, lockId) => {
    Redis.getInstance();
    const res = await Redis.releaseLock(`${userId}-${folderId}`, lockId);

    if (!res) throw new LockNotAvaliableError(folderId);
  };

  const acquireOrRefreshLock = async (userId, folderId, lockId) => {
    const redis = Redis.getInstance();

    if (redis.status !== 'ready') {
      logger.warn('Redis is not ready to accept commands');
    }

    const res = await Redis.acquireOrRefreshLock(`${userId}-${folderId}`, lockId);

    if (!res) throw new LockNotAvaliableError(folderId);
  };

  const getUserDirectoryFiles = async (userId, directoryId, offset, limit) => {
    const rawFiles = await Model.file.findAll({
      raw: true,
      where: {
        user_id: userId,
        folder_id: { [Op.eq]: directoryId },
        status: 'EXISTS',
      },
      include: [
        {
          model: Model.thumbnail,
          as: 'thumbnails',
          required: false,
        },
        {
          model: Model.shares,
          attributes: ['id', 'active', 'hashed_password', 'code', 'token', 'is_folder'],
          as: 'shares',
          required: false,
        },
      ],
      offset,
      limit,
      order: [['id', 'ASC']],
    });

    const files = [];

    for (const file of rawFiles) {
      files.push({
        ...file,
        name: App.services.Crypt.decryptName(file.name, file.folder_id),
      });
    }

    return { files, last: limit > rawFiles.length };
  };

  const getUserDirectoryFolders = async (userId, directoryId, offset, limit) => {
    const rawFolders = await Model.folder.findAll({
      raw: true,
      where: {
        user_id: userId,
        parent_id: { [Op.eq]: directoryId },
        deleted: false,
        removed: false,
      },
      offset,
      limit,
      order: [['id', 'ASC']],
    });

    const folders = [];

    for (const folder of rawFolders) {
      folders.push({
        ...folder,
        name: App.services.Crypt.decryptName(folder.name, folder.parentId),
      });
    }

    return { folders, last: limit > rawFolders.length };
  };

  /**
   * Get directory files paginated
   * @param {number} directoryId Folder id
   * @param {*} offset
   * @param {*} limit
   * @returns directory files
   */
  const getDirectoryFiles = async (directoryId, offset, limit) => {
    const rawFiles = await Model.file.findAll({
      raw: true,
      where: {
        folder_id: { [Op.eq]: directoryId },
        status: 'EXISTS',
      },
      include: [
        {
          model: Model.thumbnail,
          as: 'thumbnails',
          required: false,
        },
      ],
      offset,
      limit,
      order: [['id', 'ASC']],
    });

    const files = [];

    for (const file of rawFiles) {
      files.push({
        ...file,
        name: App.services.Crypt.decryptName(file.name, file.folder_id),
      });
    }

    return { files, last: limit > rawFiles.length };
  };

  /**
   * Get directory folders paginated
   * @param {number} directoryId Folder id
   * @param {*} offset
   * @param {*} limit
   * @returns directory folders
   */
  const getDirectoryFolders = async (directoryId, offset, limit) => {
    const rawFolders = await Model.folder.findAll({
      raw: true,
      where: {
        parent_id: { [Op.eq]: directoryId },
        deleted: false,
        removed: false,
      },
      offset,
      limit,
      order: [['id', 'ASC']],
    });

    const folders = [];

    for (const folder of rawFolders) {
      folders.push({
        ...folder,
        name: App.services.Crypt.decryptName(folder.name, folder.parentId),
      });
    }

    return { folders, last: limit > rawFolders.length };
  };

  return {
    Name: 'Folder',
    getById,
    Create,
    CheckFolderExistence,
    Delete,
    GetChildren,
    GetTree,
    UpdateMetadata,
    MoveFolder,
    GetBucket,
    getFolders,
    isFolderOfTeam,
    GetFoldersPagination,
    GetFoldersPaginationWithoutSharesNorThumbnails,
    changeDuplicateName,
    acquireLock,
    releaseLock,
    refreshLock,
    acquireOrRefreshLock,
    getByIdAndUserIds,
    getDirectoryFiles,
    getDirectoryFolders,
    getUserDirectoryFiles,
    getUserDirectoryFolders,
    DeleteOrphanFolders,
  };
};

const crypto = require('crypto');
const sequelize = require('sequelize');
const { Environment } = require('@internxt/inxt-js');
const { aes } = require('@internxt/lib');

const { Op } = sequelize;

module.exports = (Model, App) => {
  const maxAcceptableSize = 1024 * 1024 * 1024; // 1GB

  /**
   * Returns a share of a specific token
   * @param token
   * @returns {Promise<Model> | Promise<ReferralAttributes> | Promise<Model | null>}
   */
  const findShareByToken = (token) => {
    return Model.shares.findOne({
      where: {
        token: {
          [Op.eq]: token,
        },
      },
    });
  };

  /**
   * Returns a share of a specific token
   * @returns {Promise<Model> | Promise<ReferralAttributes> | Promise<Model | null>}
   * @param resourceId
   * @param userEmail
   */
  const findShareByResourceAndUser = (resourceId, userEmail) => {
    return Model.shares.findOne({
      where: {
        file: {
          [Op.eq]: resourceId,
        },
        user: {
          [Op.eq]: userEmail,
        },
      },
    });
  };

  /**
   * Returns the shared file data of a specific token
   * @param token
   * @returns {Promise<*&{fileMeta: *}>}
   */
  const getFileInfo = async (token) => {
    const share = await findShareByToken(token);

    if (!share) {
      throw Error('Token does not exist');
    }

    if (share.views === 1) {
      await share.destroy();
    } else {
      await Model.shares.update({ views: share.views - 1 }, { where: { id: { [Op.eq]: share.id } } });
    }

    const file = await Model.file.findOne({
      where: { fileId: { [Op.eq]: share.file } },
    });

    if (!file) {
      throw Error('File not found on database, please refresh');
    }

    if (file.size > maxAcceptableSize) {
      throw Error('File too large');
    }

    return {
      ...share.get({ plain: true }),
      fileMeta: file.get({ plain: true }),
    };
  };

  /**
   * Returns the shared folder data given a specific token and code
   * @param token
   * @returns {Promise<*&{fileMeta: *}>}
   */
  const getFolderInfo = async (token) => {
    const share = await findShareByToken(token);

    if (!share) {
      throw Error('Token does not exist');
    }

    if (share.views === 1) {
      await share.destroy();
    } else {
      await Model.shares.update({ views: share.views - 1 }, { where: { id: { [Op.eq]: share.id } } });
    }

    const folderId = share.file;

    const sharedFolder = await Model.folder.findOne({
      where: {
        id: { [Op.eq]: folderId },
      },
    });

    if (!sharedFolder) {
      throw Error('Folder not found on database, please refresh');
    }

    return {
      folderId: folderId,
      name: decryptName(sharedFolder.name, sharedFolder.parentId),
      bucket: share.bucket,
      bucketToken: share.fileToken,
      // TODO: Remove this from SDK and then remove it from here
      size: 0,
      shareId: share.id,
    };
  };

  const getSharedFolderSize = async (shareId, folderId) => {
    const share = await Model.shares.findOne({
      where: {
        id: shareId,
        file: folderId,
      },
    });

    if (!share) {
      throw new Error('Share not found');
    }

    const folder = await Model.folder.findOne({
      where: {
        id: folderId,
      },
    });

    if (!folder) {
      throw new Error('Folder not found');
    }

    return getFolderSize(folderId, folder.user_id);
  };

  /**
   * Fetches a paginated list of the folders inside a directory
   * @param directoryId
   * @param offset
   * @param limit
   * @param token
   * @returns {Promise<{folders: {name: *, folderId: *}[], last: boolean}>}
   */
  const getSharedDirectoryFolders = async (directoryId, offset, limit, token) => {
    const share = await findShareByToken(token);

    if (!share) {
      throw Error('Token does not exist');
    }

    const sharedFolders = await App.services.Folder
      .getDirectoryFolders(directoryId, offset, limit);

    if (sharedFolders.folders && sharedFolders.folders.length > 0) {
      const [firstFolder] = sharedFolders.folders;
      if (firstFolder.userId !== share.userId) {
        throw new Error('Forbidden');
      }
    }

    return sharedFolders;
  };

  /**
   * Fetches a paginated list of files inside a directory
   * @param directoryId
   * @param offset
   * @param limit
   * @param token
   * @param code
   * @returns {Promise<{files: {name: *, id: *}[], last: boolean}>}
   */
  const getSharedDirectoryFiles = async (directoryId, offset, limit, token, code) => {
    const share = await findShareByToken(token);

    if (!share) {
      throw Error('Token does not exist');
    }

    const { files: directoryFiles, last } = await App.services.Folder.getDirectoryFiles(directoryId, offset, limit);

    const encryptedMnemonic = share.mnemonic.toString();
    const mnemonic = aes.decrypt(encryptedMnemonic, code);
    const network = await getNetworkHandler(mnemonic, share.user);

    const files = [];
    for (const file of directoryFiles) {
      const { index } = await network.getFileInfo(share.bucket, file.fileId);
      const fileEncryptionKey = await Environment.utils.generateFileKey(
        mnemonic,
        share.bucket,
        Buffer.from(index, 'hex'),
      );
      files.push({
        ...file,
        /* TODO: This is not the file.id, this could be confusing */
        id: file.fileId,
        encryptionKey: fileEncryptionKey.toString('hex'),
      });
    }

    return { files, last };
  };

  /**
   * Initializes and returns a user-identified handler to the network
   * @param mnemonic
   * @param email
   * @returns {Promise<Environment>}
   */
  const getNetworkHandler = async (mnemonic, email) => {
    const { user_id, bridge_user } = await Model.users.findOne({
      raw: true,
      where: {
        email: { [Op.eq]: email },
      },
      attributes: ['user_id', 'bridge_user'],
    });
    return new Environment({
      bridgePass: user_id,
      bridgeUser: bridge_user,
      encryptionKey: mnemonic,
      bridgeUrl: App.config.get('STORJ_BRIDGE'),
    });
  };

  /**
   * Generates a share file token
   * @param user
   * @param fileIdInBucket
   * @param mnemonic
   * @param bucket
   * @param encryptionKey
   * @param fileToken
   * @param isFolder
   * @param views
   * @returns {Promise<string|*>}
   * @constructor
   */
  const GenerateFileToken = async (
    user,
    fileIdInBucket,
    mnemonic,
    bucket,
    encryptionKey,
    fileToken,
    isFolder = false,
    views = 1,
  ) => {
    if (!encryptionKey) {
      throw Error('Encryption key cannot be empty');
    }

    const itemExists = await Model.file.findOne({ where: { fileId: { [Op.eq]: fileIdInBucket }, userId: user.id } });

    if (!itemExists) {
      throw Error('File not found');
    }

    if (itemExists.size > maxAcceptableSize) {
      throw Error('File too large');
    }

    // Always generate a new token
    const newToken = crypto.randomBytes(10).toString('hex');

    const share = await findShareByResourceAndUser(fileIdInBucket, user.email);

    if (share) {
      // Update token
      Model.shares.update(
        {
          token: newToken,
          mnemonic,
          isFolder,
          views,
          fileToken,
          encryptionKey,
        },
        { where: { id: { [Op.eq]: share.id } } },
      );
      return newToken;
    }

    const newShare = await Model.shares.create({
      token: newToken,
      mnemonic,
      encryptionKey,
      file: fileIdInBucket,
      user: user.email,
      isFolder,
      views,
      bucket,
      fileToken,
    });

    return newShare.token;
  };

  /**
   * Generates a share folder token
   * @param user
   * @param folderId
   * @param bucket
   * @param encryptedMnemonic
   * @param bucketToken
   * @param views
   * @returns {Promise<string|*>}
   * @constructor
   */
  const GenerateFolderToken = async (user, folderId, bucket, encryptedMnemonic, bucketToken, views = 1) => {
    const itemExists = await Model.folder.findOne({
      where: {
        id: { [Op.eq]: folderId },
        user_id: { [Op.eq]: user.id },
      },
    });

    if (!itemExists) {
      throw Error('Folder not found');
    }

    // Generate a new share token
    const newToken = crypto.randomBytes(10).toString('hex');

    const share = await findShareByResourceAndUser(folderId, user.email);

    if (share) {
      // Update share details
      await Model.shares.update(
        {
          token: newToken,
          mnemonic: encryptedMnemonic,
          isFolder: true,
          views: views,
          fileToken: bucketToken,
        },
        {
          where: {
            id: {
              [Op.eq]: share.id,
            },
          },
        },
      );
    } else {
      // Create share details
      await Model.shares.create({
        token: newToken,
        mnemonic: encryptedMnemonic,
        encryptionKey: '',
        file: folderId,
        user: user.email,
        isFolder: true,
        views: views,
        bucket: bucket,
        fileToken: bucketToken,
      });
    }

    return newToken;
  };

  const list = (user) => {
    return Model.shares.findAll({
      where: {
        user: user.email,
        mnemonic: {
          [Op.eq]: '',
        },
      },
      include: [
        {
          model: Model.file,
          as: 'fileInfo',
          where: { userId: user.id },
        },
      ],
      attributes: ['token', 'file', 'encryptionKey', 'bucket', 'fileToken', 'isFolder', 'views'],
    });
  };

  /**
   * Computes the total tree size of a folder
   * @param folderId
   * @returns {Promise<number>}
   */
  const getFolderSize = async (folderId, userId) => {
    const foldersToCheck = [folderId];
    let totalSize = 0;

    while (foldersToCheck.length > 0) {
      const currentFolderId = foldersToCheck.shift();

      // Sum files size from this level
      const [filesSize, folders] = await Promise.all([
        getFilesTotalSizeFromFolder(currentFolderId),
        Model.folder.findAll({
          attributes: ['id'],
          raw: true,
          where: {
            parent_id: { [Op.eq]: currentFolderId },
            user_id: userId,
          },
        }),
      ]);
      totalSize += filesSize;

      folders.forEach((folder) => foldersToCheck.push(folder.id));
    }

    return totalSize;
  };

  /**
   * Computes the size of the elements inside one folder
   * @param folderId
   * @returns {Promise<*>}
   */
  const getFilesTotalSizeFromFolder = async (folderId) => {
    const result = await Model.file.findAll({
      attributes: [[sequelize.fn('sum', sequelize.col('size')), 'total']],
      raw: true,
      where: {
        folderId: { [Op.eq]: folderId },
      },
    });

    return result[0].total;
  };

  const decryptName = (encryptedName, folderId) => {
    return App.services.Crypt.decryptName(encryptedName, folderId);
  };

  return {
    Name: 'Share',
    getFileInfo,
    getFolderInfo,
    list,
    getSharedFolderSize,
    GenerateFileToken,
    GenerateFolderToken,
    getFolderSize,
    getSharedDirectoryFolders,
    getSharedDirectoryFiles,
  };
};

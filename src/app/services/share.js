const crypto = require('crypto');
const sequelize = require('sequelize');
const { SHARE_TOKEN_LENGTH } = require('../constants');
const lib = require('@internxt/lib');

const { Op } = sequelize;

module.exports = (Model) => {
  const maxAcceptableSize = 1024 * 1024 * 1000; // 1000MB

  /**
   * Returns a share of a specific token
   * @param token
   * @returns {Promise<Model> | Promise<ReferralAttributes> | Promise<Model | null>}
   */
  const findShareByToken = (token) => {
    return Model.shares.findOne({
      where: {
        token: {
          [Op.eq]: token
        }
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
          [Op.eq]: resourceId
        },
        user: {
          [Op.eq]: userEmail
        }
      },
    });
  };

  /**
   * Returns the shared file data of a specific token
   * @param token
   * @returns {Promise<*&{fileMeta: *}>}
   */
  const getFile = async (token) => {
    const result = await findShareByToken(token);

    if (!result) {
      throw Error('Token does not exist');
    }

    if (result.views === 1) {
      await result.destroy();
    } else {
      await Model.shares.update({ views: result.views - 1 }, { where: { id: { [Op.eq]: result.id } } });
    }

    const file = await Model.file.findOne({
      where: { fileId: { [Op.eq]: result.file } },
    });

    if (!file) {
      throw Error('File not found on database, please refresh');
    }

    if (file.size > maxAcceptableSize) {
      throw Error('File too large');
    }

    return { ...result.get({ plain: true }), fileMeta: file.get({ plain: true }) };
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

    if (encryptionKey.length !== SHARE_TOKEN_LENGTH) {
      throw Error('Invalid encryption key size');
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
  const GenerateFolderTokenAndCode = async (
    user,
    folderId,
    bucket,
    encryptedMnemonic,
    bucketToken,
    views = 1,
  ) => {
    const itemExists = await Model.folder.findOne({
      where: {
        id: { [Op.eq]: folderId },
        user_id: { [Op.eq]: user.id },
      }
    });

    if (!itemExists) {
      throw Error('Folder not found');
    }

    const folderSize = await getFolderSize(folderId);

    if (folderSize > maxAcceptableSize) {
      throw Error('Folder too large');
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
              [Op.eq]: share.id
            }
          }
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

  const getFolderSize = async (folderId) => {
    const foldersToCheck = [folderId];
    let totalSize = 0;

    while (foldersToCheck.length > 0) {
      const currentFolderId = foldersToCheck.shift();

      // Sum files size from this level
      const filesSize = await getFilesTotalSizeFromFolder(currentFolderId);
      totalSize += filesSize;

      // Add folders from this level to the list
      const folders = await Model.folder
        .findAll({
          attributes: ['id'],
          raw: true,
          where: {
            parent_id: { [Op.eq]: currentFolderId },
          },
        });
      folders.forEach(folder => foldersToCheck.push(folder.id));
    }

    return totalSize;
  };

  const getFilesTotalSizeFromFolder = async (folderId) => {
    const result = await Model.file.findAll({
      attributes: [
        [sequelize.fn('sum', sequelize.col('size')), 'total']
      ],
      raw: true,
      where: {
        folderId: { [Op.eq]: folderId },
      },
    });

    return result[0].total;
  };

  return {
    Name: 'Share',
    getFile,
    list,
    GenerateFileToken,
    GenerateFolderTokenAndCode,
    getFolderSize,
  };
};

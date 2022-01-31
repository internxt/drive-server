const crypto = require('crypto');

const sequelize = require('sequelize');
const { SHARE_TOKEN_LENGTH } = require('../constants');
const FolderService = require('./folder');

const { Op } = sequelize;

module.exports = (Model, App) => {
  const FolderServiceInstance = FolderService(Model, App);

  const getFile = async (token) => {
    const maxAcceptableSize = 1024 * 1024 * 1000; // 1000MB

    const result = await Model.shares.findOne({
      where: { token: { [Op.eq]: token } },
    });

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

    let itemExists = null;

    if (isFolder === 'true') {
      // Check if folder exists
      itemExists = await Model.folder.findOne({ where: { id: { [Op.eq]: fileIdInBucket } } });
    } else {
      // Check if file exists
      itemExists = await Model.file.findOne({ where: { fileId: { [Op.eq]: fileIdInBucket }, userId: user.id } });
    }

    if (!itemExists) {
      throw Error('File not found');
    }

    const maxAcceptableSize = 1024 * 1024 * 1200; // 1200MB

    if (itemExists.size > maxAcceptableSize) {
      throw Error('File too large');
    }

    if (isFolder === 'true') {
      // WARNING: Review GetTree before use it, it's a high cost function
      const tree = await FolderServiceInstance.GetTree({ email: user.email }, fileIdInBucket);

      if (!tree) {
        throw Error('Tree not found');
      }

      const treeSize = await FolderServiceInstance.GetTreeSize(tree);

      if (treeSize > maxAcceptableSize) {
        throw Error('File too large');
      }
    }

    // Always generate a new token
    const newToken = crypto.randomBytes(10).toString('hex');

    const tokenData = await Model.shares.findOne({
      where: { file: { [Op.eq]: fileIdInBucket }, user: { [Op.eq]: user.email } },
    });

    if (tokenData) {
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
        { where: { id: { [Op.eq]: tokenData.id } } },
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

  const getFolderSize = async (user, folderId) => {
    const foldersToCheck = [folderId];
    let totalSize = 0;

    while (foldersToCheck.length > 0) {
      const currentFolderId = foldersToCheck.shift();

      // Sum files size from this level
      const filesSize = await getFilesTotalSizeFromFolder(user.id, currentFolderId);
      totalSize += filesSize;

      // Add folders from this level to the list
      const folders = await Model.folder
        .findAll({
          attributes: ['id'],
          raw: true,
          where: {
            parent_id: { [Op.eq]: currentFolderId },
            user_id: { [Op.eq]: user.id },
          },
        });
      folders.forEach(folder => foldersToCheck.push(folder.id));
    }

    return totalSize;
  };

  const getFilesTotalSizeFromFolder = async (userId, folderId) => {
    const result = await Model.file.findAll({
      attributes: [
        [sequelize.fn('sum', sequelize.col('size')), 'total']
      ],
      raw: true,
      where: {
        folderId: { [Op.eq]: folderId },
        userId: { [Op.eq]: userId },
      },
    });

    return result[0].total;
  };

  return {
    Name: 'Share',
    getFile,
    list,
    GenerateFileToken,
    getFolderSize,
  };
};

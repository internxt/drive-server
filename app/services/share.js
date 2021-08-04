const crypto = require('crypto');

const sequelize = require('sequelize');
const { SHARE_TOKEN_LENGTH } = require('../constants');
const FolderService = require('./folder');

const { Op } = sequelize;

module.exports = (Model, App) => {
  const FolderServiceInstance = FolderService(Model, App);

  const get = async (token) => {
    const maxAcceptableSize = 1024 * 1024 * 1000; // 1000MB

    const result = await Model.shares.findOne({
      where: { token: { [Op.eq]: token } }
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
      where: { fileId: { [Op.eq]: result.file } }
    });

    if (!file) {
      throw Error('File not found on database, please refresh');
    }

    if (file.size > maxAcceptableSize) {
      throw Error('File too large');
    }

    return { ...result.get({ plain: true }), fileMeta: file.get({ plain: true }) };
  };

  const GenerateToken = async (user, fileIdInBucket, mnemonic, bucket, encryptionKey, fileToken, isFolder = false, views = 1) => {
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
      itemExists = await Model.file.findOne({ where: { fileId: { [Op.eq]: fileIdInBucket } } });
    }

    if (!itemExists) {
      throw Error('File not found');
    }

    const maxAcceptableSize = 1024 * 1024 * 1200; // 1200MB

    if (itemExists.size > maxAcceptableSize) {
      throw Error('File too large');
    }

    if (isFolder === 'true') {
      const tree = await FolderServiceInstance.GetTree({ email: user }, fileIdInBucket);

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

    const tokenData = await Model.shares.findOne({ where: { file: { [Op.eq]: fileIdInBucket }, user: { [Op.eq]: user } } });

    if (tokenData) {
      // Update token
      Model.shares.update(
        {
          token: newToken, mnemonic, isFolder, views, fileToken, encryptionKey
        },
        { where: { id: { [Op.eq]: tokenData.id } } }
      );
      return newToken;
    }

    const newShare = await Model.shares.create({
      token: newToken, mnemonic, encryptionKey, file: fileIdInBucket, user, isFolder, views, bucket, fileToken
    });

    return newShare.token;
  };

  return {
    Name: 'Share',
    get,
    GenerateToken
  };
};

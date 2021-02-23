const crypto = require('crypto');

const sequelize = require('sequelize');
const FolderService = require('./folder');

const { Op } = sequelize;

module.exports = (Model, App) => {
  const FolderServiceInstance = FolderService(Model, App);

  const FindOne = async (token) => {
    const result = await Model.shares.findOne({
      where: { token: { [Op.eq]: token } }
    });

    if (!result) {
      throw Error('Token does not exists');
    }

    if (result.views === 1) {
      await result.destroy();
    } else {
      await Model.shares.update({ views: result.views - 1 }, { where: { id: { [Op.eq]: result.id } } });
    }

    return result;
  };

  const GenerateToken = async (user, fileIdInBucket, mnemonic, isFolder = false, views = 1) => {
    // Required mnemonic
    if (!mnemonic) {
      throw Error('Mnemonic cannot be empty');
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

    if (isFolder === 'true') {
      const tree = await FolderServiceInstance.GetTree({ email: user },
        fileIdInBucket);

      if (tree) {
        const treeSize = await FolderServiceInstance.GetTreeSize(tree);

        if (treeSize > maxAcceptableSize) {
          throw Error('File too large');
        }
      } else {
        throw Error();
      }
    } else if (itemExists.size > maxAcceptableSize) {
      throw Error('File too large');
    }

    // Always generate a new token
    const newToken = crypto.randomBytes(5).toString('hex');

    const tokenData = await Model.shares.findOne({ where: { file: { [Op.eq]: fileIdInBucket }, user: { [Op.eq]: user } } });

    if (tokenData) {
      // Update token
      Model.shares.update(
        {
          token: newToken, mnemonic, is_folder: isFolder, views
        },
        { where: { id: { [Op.eq]: tokenData.id } } }
      );
      return newToken;
    }

    const newShare = await Model.shares.create({
      token: newToken, mnemonic, file: fileIdInBucket, user, is_folder: isFolder, views
    });

    return newShare.token;
  };

  return {
    Name: 'Share',
    FindOne,
    GenerateToken
  };
};

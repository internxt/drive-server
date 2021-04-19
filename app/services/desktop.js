const sequelize = require('sequelize');

const invalidName = /[\\/]|[. ]$/;

const { Op } = sequelize;

module.exports = (Model, App) => {
  const CreateChildren = async (user, folders, parentFolderId) => {
    const existsParentFolder = await Model.folder.findOne({
      where: {
        id: { [Op.eq]: parentFolderId },
        user_id: { [Op.eq]: user.id }
      }
    });

    if (!existsParentFolder) {
      throw Error('Parent folder is not yours');
    }

    folders = folders.filter((folderName) => {
      return !(folderName === '' || invalidName.test(folderName));
    });

    // Encrypt folder name, TODO: use versioning for encryption
    const foldersDict = {};
    let cryptoFolderNames = folders.map((folderName) => {
      const cryptoName = App.services.Crypt.encryptName(folderName, parentFolderId);
      foldersDict[cryptoName] = folderName;
      return cryptoName;
    });
    const exists = await Model.folder.findAll({
      attributes: ['name'],
      where: {
        parentId: { [Op.eq]: parentFolderId },
        name: { [Op.in]: cryptoFolderNames }
      }
    });
    exists.forEach((folder) => {
      exists[folder.dataValues.name] = true;
    });

    if (exists) {
      // TODO: If the folder already exists,
      // return the folder data to make desktop
      // incorporate new info to its database
      cryptoFolderNames = cryptoFolderNames.filter((cryptoName) => {
        if (exists[cryptoName]) {
          delete foldersDict[cryptoName];
          return false;
        }
        return true;
      });
    }

    // Since we upload everything in the same bucket, this line is no longer needed
    // const bucket = await App.services.Storj.CreateBucket(user.email, user.userId, user.mnemonic, cryptoFolderName)
    const foldersCreated = await Model.folder.bulkCreate(cryptoFolderNames.map((cryptoName) => {
      return {
        name: cryptoName,
        bucket: null,
        parentId: parentFolderId || null,
        user_id: user.id
      };
    }));
    const result = foldersCreated.map((folder) => {
      return {
        name: foldersDict[folder.name],
        value: folder
      };
    });
    return result;
  };

  return {
    Name: 'Desktop',
    CreateChildren
  };
};

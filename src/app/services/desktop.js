const sequelize = require('sequelize');

const { Op } = sequelize;

module.exports = (Model) => {
  const CreateChildren = async (user, folders) => {
    let newFolders = [];
    const existsParentFolder = await Model.folder.findAll({
      where: {
        id: { [Op.in]: Object.keys(folders) },
        user_id: { [Op.eq]: user.id },
      },
    });
    existsParentFolder.forEach((folder) => {
      newFolders = newFolders.concat(
        folders[folder.dataValues.id].map((encryptedName) => {
          return [encryptedName, folder.dataValues.id];
        }),
      );
    });
    const exists = await Model.folder.findAll({
      attributes: ['id', 'name', 'parentId', 'createdAt', 'updatedAt'],
      where: {
        user_id: { [Op.eq]: user.id },
        name: { [Op.in]: newFolders.map(([encryptedName]) => encryptedName) },
      },
    });

    exists.forEach((folder) => {
      exists[folder.dataValues.name] = folder.dataValues;
    });
    const result = [];
    if (exists) {
      // TODO: If the folder already exists,
      // return the folder data to make desktop
      // incorporate new info to its database
      newFolders = newFolders.filter(([cryptoName]) => {
        if (exists[cryptoName]) {
          result.push(exists[cryptoName]);
          return false;
        }
        return true;
      });
    }
    // Since we upload everything in the same bucket, this line is no longer needed
    // const bucket = await App.services.Inxt.CreateBucket(user.email, user.userId, user.mnemonic, cryptoFolderName)
    const foldersCreated = await Model.folder.bulkCreate(
      newFolders.map(([cryptoName, parentFolderId]) => {
        return {
          name: cryptoName,
          bucket: null,
          parentId: parentFolderId || null,
          user_id: user.id,
          encrypt_version: '03-aes',
        };
      }),
      { returning: true, individualHooks: true },
    );
    foldersCreated.forEach((folder) => {
      result.push(folder);
    });
    return result;
  };

  return {
    Name: 'Desktop',
    CreateChildren,
  };
};

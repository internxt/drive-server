const { mnemonicGenerate } = require('storj');
const axios = require('axios')

module.exports = (Model, App) => {
  const logger = App.logger;

  const FindOrCreate = (user) => {
    // Create password hashed pass only when a pass is given
    const userPass = App.services.Crypt.decryptText(user.password);
    const userSalt = App.services.Crypt.decryptText(user.salt);

    const userMnemonic = mnemonicGenerate(256)

    return Model.users.sequelize.transaction(function (t) {
      return Model.users.findOrCreate({
        where: { email: user.email },
        defaults: {
          name: user.name,
          lastname: user.lastname,
          password: userPass,
          mnemonic: userMnemonic,
          hKey: userSalt
        },
        transaction: t
      }).spread(async function (userResult, created) {
        if (created) {
          // Create bridge pass using email (because id is unconsistent)
          const bcryptId = await App.services.Storj.IdToBcrypt(userResult.email)

          const bridgeUser = await App.services.Storj
            .RegisterBridgeUser(userResult.email, bcryptId)
          if (!bridgeUser.data) { throw new Error('Error creating bridge user') }
          logger.info('User Service | created brigde user')

          const freeTier = bridgeUser.data ? bridgeUser.data.isFreeTier : 1;
          // Store bcryptid on user register
          await userResult.update({
            userId: bcryptId,
            isFreeTier: freeTier
          }, { transaction: t });

          // Set created flag for Frontend management
          Object.assign(userResult, { isCreated: created })
        }
        // TODO: proveriti userId kao pass
        return userResult;
      }).catch((err) => {
        if (err.response) {
          // This happens when email is registered in bridge
          logger.error(err.response.data);
        } else {
          logger.error(err.stack);
        }
        throw new Error(err)
      })
    }) // end transaction
  }

  const InitializeUser = (user) => {
    return Model.users.sequelize.transaction(function (t) {
      return Model.users.findOne({ where: { email: user.email } })
        .then(async (userData) => {
          const bcryptId = userData.userId;

          const rootBucket = await App.services.Storj
            .CreateBucket(userData.email, bcryptId, userData.mnemonic)
          logger.info('User init | root bucket created')

          const rootFolderName = await App.services.Crypt.encryptName(`${userData.email}_root`)
          logger.info('User init | root folder name: ' + rootFolderName)

          const rootFolder = await userData.createFolder({
            name: rootFolderName,
            bucket: rootBucket.id
          })
          logger.info('User init | root folder created')

          // Update user register with root folder Id
          await userData.update({
            root_folder_id: rootFolder.id
          }, { transaction: t });

          return userData
        }).catch((error) => {
          logger.error(error.stack);
          throw new Error(error);
        })
    })
  }

  const UpdateMnemonic = async (userId, mnemonic) => {
    const found = Model.users.findById(userId);
    if (found) {
      try {
        const user = await Model.users.update(
          { mnemonic },
          { where: { id: userId }, validate: true }
        );
        return user
      } catch (errorResponse) {
        throw new Error(errorResponse);
      }
    }
  }

  // Get an email and option (true/false) and set storeMnemonic option for user with this email
  const UpdateStorageOption = (email, option) => {
    return Model.users.findOne({ where: { email } })
      .then((userData) => {
        if (userData) { return userData.update({ storeMnemonic: option }); }
        throw new Error('User not found')
      }).catch((error) => {
        logger.error(error.stack);
        throw new Error(error);
      })
  }

  const GetUserById = id => Model.users.findOne({ where: { id } })
    .then((response) => {
      return response.dataValues
    })

  const FindUserByEmail = email => Model.users.findOne({ where: { email } })
    .then((userData) => {
      if (userData) return userData.dataValues
      throw new Error('User not found');
    })

  const GetUsersRootFolder = id => Model.users.findAll({
    include: [Model.folder]
  }).then(user => user.dataValues)

  const resolveCaptcha = (token) => {
    const secret = App.config.get('secrets').CAPTCHA
    const responseToken = token

    return axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${responseToken}`
    ).then(response => response.data)
      .catch(error => error);
  }

  return {
    Name: 'User',
    FindOrCreate,
    UpdateMnemonic,
    UpdateStorageOption,
    GetUserById,
    FindUserByEmail,
    InitializeUser,
    GetUsersRootFolder,
    resolveCaptcha
  }
}

const { mnemonicGenerate } = require('storj');

module.exports = (Model, App) => {
  const logger = App.logger
  const FindOrCreate = (user) => {
    logger.info(App.services.Crypt.encryptName(user.password));
    return Model.users.sequelize.transaction(function (t) {
      return Model.users.findOrCreate({
        where: { email: user.email },
        defaults: { name: user.name, lastname: user.lastname, password: App.services.Crypt.encryptName(user.password) },
        transaction: t
      })
        .spread(async function (userResult, created) {
          if (created) {
            const bcryptId = await App.services.Storj.IdToBcrypt(userResult.id)

            logger.info('User Service | creating brigde user')
            const bridgeUser = await App.services.Storj
              .RegisterBridgeUser(userResult.email, bcryptId)
            logger.info(bridgeUser)

            const userMnemonic = mnemonicGenerate(256)
            logger.info('User Service | mnemonic generated')

            const rootBucket = await App.services.Storj
              .CreateBucket(bridgeUser.data.email, bcryptId, userMnemonic)
            logger.info('User Service | root bucket created')

            const rootFolderName = App.services.Crypt.encryptName(`${userResult.email}_root`)
            logger.info('User Service | root folder name: ' + rootFolderName)

            const rootFolder = await userResult.createFolder({
              name: rootFolderName,
              bucket: rootBucket.id
            })
            logger.info('User Service | root folder created')

            await userResult.update({
              userId: bcryptId,
              isFreeTier: bridgeUser.data.isFreeTier,
              root_folder_id: rootFolder.id,
            }, { transaction: t })
            /**
             * On return mnemonic to user. He needs to decide if he will preserve it in DB
             */
            Object.assign(userResult, { mnemonic: userMnemonic, isCreated: created });
            return userResult;
          }
          // Create mnemonic for existing user when doesnt have yet
          if (userResult.mnemonic == null) {
            Object.assign(userResult, { mnemonic: mnemonicGenerate(256), isCreated: created })
          }
          // TODO: proveriti userId kao pass
          // const isValid = bcrypt.compareSync(user.userId, userResult.userId)
          const isValid = true;
          if (isValid) return userResult;
          throw new Error('User invalid')
        })
        .catch((err) => {
          if (err.response) {
            throw new Error(err.response.data.error)
          }
          throw new Error(err)
        })
    }) // end transaction
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

  const GetUserById = id => Model.users.findOne({ where: { id } })
    .then((response) => {
      return response.dataValues
    })

  const FindUserByEmail = email => Model.users.findOne({ where: { email } })
    .then((userData) => {
      return userData
    })

  const GetUsersRootFolder = id => Model.users.findAll({
    include: [Model.folder]
  }).then(user => user.dataValues)

  return {
    Name: 'User',
    FindOrCreate,
    GetUserById,
    FindUserByEmail,
    GetUsersRootFolder,
    UpdateMnemonic
  }
}

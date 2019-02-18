const { mnemonicGenerate } = require('storj');
const crypto = require('crypto')

module.exports = (Model, App) => {
  const logger = App.logger;

  const FindOrCreate = (user) => {
    return Model.users.sequelize.transaction(function (t) {
      return Model.users.findOrCreate({
        where: { email: user.email },
        defaults: {
          name: user.name,
          lastname: user.lastname,
          password: crypto.createHash('sha256').update(user.password).digest('hex')
        },
        transaction: t
      }).spread(async function (userResult, created) {
        if (created) {
          // Create bridge pass using email (because id is unconsistent)
          const bcryptId = await App.services.Storj.IdToBcrypt(userResult.email)
          
          const userMnemonic = mnemonicGenerate(256)
          const encryptMnemonic = await App.services.Storj.IdToBcrypt(userMnemonic)
          logger.info('User Service | mnemonic generated')

          let bridgeUser = await App.services.Storj
            .RegisterBridgeUser(userResult.email, bcryptId, encryptMnemonic)
          logger.info(bridgeUser)
          if (!bridgeUser) { throw new Error('Error creating bridge user') }
          logger.info('User Service | creating brigde user')
          logger.info(bridgeUser)

          // In case of user was registered in bridge, give bridgeuser.data.email the userData.email value
          // TO-DO Change this making API giving userData when exists
          if (!bridgeUser) {
            bridgeUser = { data: { email: userResult.email, isFreeTier: true } };
          }

          const rootBucket = await App.services.Storj
            .CreateBucket(bridgeUser.data.email, bcryptId, encryptMnemonic)
          logger.info('User Service | root bucket created')

          const rootFolderName = await App.services.Crypt.encryptName(`${userResult.email}_root`)
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
          Object.assign(userResult, { mnemonic: encryptMnemonic, isCreated: created });
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
      }).catch((err) => {
        logger.error(err.message + '\n' + err.stack);
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
    UpdateMnemonic,
    GetUserById,
    FindUserByEmail,
    GetUsersRootFolder
  }
}

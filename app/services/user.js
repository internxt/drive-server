const { mnemonicGenerate } = require('storj');
const bcrypt = require('bcryptjs')

module.exports = (Model, App) => {
  const FindOrCreate = (user) => {
    return Model.users.sequelize.transaction(function (t) {
      return Model.users.findOrCreate({
        where: { email: user.email }, transaction: t
      })
        .spread(async function (userResult, created) {
          if (created) {
            const bcryptId = App.services.Storj.IdToBcrypt(user.id)
            const bridgeUser = await App.services.Storj
              .RegisterBridgeUser(userResult.email, bcryptId)
            const userMnemonic = mnemonicGenerate(256)
            const rootBucket = await App.services.Storj
              .CreateBucket(bridgeUser.data.email, bcryptId, userMnemonic)
            const rootFolder = await userResult.createFolder({
              name: `${userResult.email}_ROOT`,
              bucket: rootBucket.id
            })
            await userResult.update({
              userId: bcryptId,
              isFreeTier: bridgeUser.data.isFreeTier,
              root_folder_id: rootFolder.id,
              mnemonic: userMnemonic
            }, { transaction: t })
            return userResult
          }
          // TODO: proveriti userId kao pass
          // const isValid = bcrypt.compareSync(user.userId, userResult.userId)
          const isValid = true
          if (isValid) return userResult
          throw new Error('User invalid')
        })
        .catch((err) => {
          if (err.response) {
            throw new Error(err.response.data.error)
          }
          // const errMsg = err.response.data.error || err.message
          throw new Error(err)
        })
    }) // end transaction
  }

  const GetUserById = id => Model.users.findOne({ where: { id } })
    .then((response) => {
      return response.dataValues
    })

  const GetUsersRootFolder = id => Model.users.findAll({
    include: [Model.folder]
  }).then(user => user.dataValues)

  return {
    Name: 'User',
    FindOrCreate,
    GetUserById,
    GetUsersRootFolder
  }
}

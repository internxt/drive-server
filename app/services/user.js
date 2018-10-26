const { mnemonicGenerate } = require('storj');
const Secret = require('crypto-js');

module.exports = (Model, App) => {
  const encryptFolderName = (folderName) => {
    const b64 = Secret.AES.encrypt(folderName, App.config.get('secrets').CRYPTO).toString();
    const e64 = Secret.enc.Base64.parse(b64);
    const eHex = e64.toString(Secret.enc.Hex);
    return eHex;
  }

  const FindOrCreate = (user) => {
    return Model.users.sequelize.transaction(function (t) {
      return Model.users.findOrCreate({
        where: { email: user.email }, transaction: t
      })
        .spread(async function (userResult, created) {
          if (created) {
            const bcryptId = await App.services.Storj.IdToBcrypt(user.id)

            const bridgeUser = await App.services.Storj
              .RegisterBridgeUser(userResult.email, bcryptId)

            const userMnemonic = mnemonicGenerate(256)

            const rootBucket = await App.services.Storj
              .CreateBucket(bridgeUser.data.email, bcryptId, userMnemonic)

            const rootFolderName = App.services.Folder.encryptFolderName(`${userResult.email}_root`)

            const rootFolder = await userResult.createFolder({
              name: rootFolderName,
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

const bcrypt = require('bcryptjs')
const axios = require('axios')
const crypto = require('crypto');
const { Environment, mnemonicGenerate } = require('storj');

module.exports = (Model, App) => {
  function registerBridgeUser(email, password) {
    const hashPwd = pwdToHex(password)
    return axios.post(
      'http://localhost:6382/users',
      { email, password: hashPwd }
    )
  }

  function pwdToHex(pwd) {
    return crypto.createHash('sha256').update(pwd).digest('hex')
  }

  function idToBcrypt(id) {
    return bcrypt.hashSync(id, 8)
  }

  function generateMnemonicWords() {
    return mnemonicGenerate(256)
  }

  function createRootBucket(email, password) {
    return new Promise((resolve, reject) => {
      const storj = new Environment({
        bridgeUrl: 'http://localhost:6382/',
        bridgeUser: email,
        bridgePass: password,
        encryptionKey: generateMnemonicWords(),
        logLevel: 4
      })
      storj.createBucket('root', function(err, res) {
        if (err) reject(err)
        resolve(res)
      })
    });
  }

  const FindOrCreate = (user) => {
    return Model.users.sequelize.transaction(function (t) {
      return Model.users.findOrCreate({
        where: { email: user.email }, transaction: t
      })
        .spread(async function (userResult, created) {
          if (created) {
            const bcryptId = idToBcrypt(user.id)
            const bridgeUser = await registerBridgeUser(userResult.email, bcryptId)
            const rootBucket = await createRootBucket(bridgeUser.data.email, bcryptId)
            const rootFolder = await userResult.createFolder({
              name: `${userResult.email}_ROOT`,
              bucket: rootBucket.id
            })
            await userResult.update({
              userId: bcryptId,
              isFreeTier: bridgeUser.data.isFreeTier,
              root_folder_id: rootFolder.id
            }, { transaction: t })
            return userResult
          }
          const isValid = bcrypt.compareSync(user.id, userResult.userId)
          if (isValid) return userResult
          throw new Error('User invalid')
        })
        .catch(function(err) {
          const errMsg = err.response.data.error || err.message
          throw new Error(errMsg)
        })
    }) // end transaction
  }

  const GetUserById = id => Model.users.findOne({ where: { id } })
    .then(response => response.dataValues)

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

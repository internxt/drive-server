const sequelize = require('sequelize');

const { Op } = sequelize;

module.exports = (Model, App) => {
  const activate = async (userData, deviceId, deviceName) => {
    const { Storj, User } = App.services;
    let { backupsBucket } = await User.FindUserObjByEmail(userData.email);
    if (!backupsBucket) {
	    backupsBucket = (await Storj.CreateBucket(userData.email, userData.userId, userData.mnemonic)).id;
  	  Model.users.update({ backupsBucket },
        { where: { email: { [Op.eq]: userData.email } } });
    }

    await Model.device.create({ id: deviceId, userId: userData.id, name: deviceName });
  };

  const create = async (userId, path, deviceId, encryptVersion, interval) => {
    const { backupsBucket } = await Model.users.findOne({ where: { id: { [Op.eq]: userId } } });

    if (!backupsBucket) throw new Error('Backups must be activated before creating one');

    const device = Model.device.findOne({ where: { id: { [Op.eq]: deviceId } }, userId: { [Op.eq]: userId } });

    if (!device) throw new Error('This user didnt register this device');

    return Model.backup.create({
      path, encrypt_version: encryptVersion, deviceId, bucket: backupsBucket, interval
    });
  };

  const getAll = async (userId, deviceId) => {
    const device = Model.device.findOne({ where: { id: { [Op.eq]: deviceId } }, userId: { [Op.eq]: userId } });

    if (!device) throw new Error('This user didnt register this device');

    return Model.backup.findAll({ where: { deviceId } });
  };

  const deleteOne = async (userId, deviceId, id) => {
    const device = Model.device.findOne({ where: { id: { [Op.eq]: deviceId } }, userId: { [Op.eq]: userId } });

    if (!device) throw new Error('This user didnt register this device');

    return Model.backup.destroy({ where: { deviceId, id } });
  };

  const updateOne = async (userId, deviceId, id, data) => {
    const device = Model.device.findOne({ where: { id: { [Op.eq]: deviceId } }, userId: { [Op.eq]: userId } });

    if (!device) throw new Error('This user didnt register this device');

    return Model.backup.update(data, { where: { deviceId, id } });
  };

  return {
    Name: 'Backup',
    activate,
    create,
    getAll,
    deleteOne,
    updateOne
  };
};

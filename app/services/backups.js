const sequelize = require('sequelize');

const { Op, fn, col } = sequelize;

module.exports = (Model, App) => {
  const getDevice = async (userId, mac) => {
    const device = await Model.device.findOne({ where: { mac, userId } });

    if (!device) {
      const err = new Error('This user didnt register this device');
      err.name = 'NOT_FOUND';
      throw err;
    }

    return device;
  };

  const getAllDevices = async (userId) => {
    return Model.device.findAll({
      where: { userId },
      attributes: { include: [[fn('SUM', col('backups.size')), 'size']] },
      include: [{ model: Model.backup, attributes: ['size'] }]
    });
  };

  const createDevice = async (userId, mac, deviceName, platform) => {
    try {
      return await getDevice(userId, mac);
    } catch (err) {
      if (err.name === 'NOT_FOUND') {
        return Model.device.create({
          mac, userId, name: deviceName, platform
        });
      }

      throw err;
    }
  };

  const updateDevice = async (userId, deviceId, deviceName) => {
    return Model.device.update({ name: deviceName }, { where: { id: deviceId, userId } });
  };

  const activate = async (userData) => {
    const { Storj, User } = App.services;
    let { backupsBucket } = await User.FindUserObjByEmail(userData.email);
    if (!backupsBucket) {
      backupsBucket = (await Storj.CreateBucket(userData.email, userData.userId, userData.mnemonic)).id;
      Model.users.update({ backupsBucket },
        { where: { email: { [Op.eq]: userData.email } } });
    }
  };

  const create = async ({
    userId, path, deviceId, encryptVersion, interval, enabled
  }) => {
    const { backupsBucket } = await Model.users.findOne({ where: { id: userId } });

    if (!backupsBucket) throw new Error('Backups must be activated before creating one');

    const device = Model.device.findOne({ where: { id: deviceId, userId } });

    if (!device) throw new Error('This user didnt register this device');

    return Model.backup.create({
      path, encrypt_version: encryptVersion, deviceId, bucket: backupsBucket, interval, userId, enabled
    });
  };

  const getAll = async (userId, mac) => {
    const device = await Model.device.findOne({ where: { mac, userId } });
    if (!device) throw new Error('This user didnt register this device');

    return Model.backup.findAll({ where: { deviceId: device.id } });
  };

  const deleteOne = async (userId, id) => {
    return Model.backup.destroy({ where: { userId, id } });
  };

  const updateOne = async (userId, id, data) => {
    return Model.backup.update(data, { where: { userId, id } });
  };

  const updateManyOfDevice = async (userId, deviceId, data) => {
    return Model.backup.update(data, { where: { userId, deviceId } });
  };

  return {
    Name: 'Backup',
    activate,
    create,
    getAll,
    deleteOne,
    updateOne,
    getDevice,
    getAllDevices,
    createDevice,
    updateDevice,
    updateManyOfDevice
  };
};

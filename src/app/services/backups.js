const createHttpError = require('http-errors');
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
      group: [col('device.id'), col('backups.id')],
      include: [{ model: Model.backup, attributes: ['size'] }],
    });
  };

  const createDevice = async (userId, mac, deviceName, platform) => {
    try {
      return await getDevice(userId, mac);
    } catch (err) {
      if (err.name === 'NOT_FOUND') {
        return Model.device.create({
          mac,
          userId,
          name: deviceName,
          platform,
        });
      }

      throw err;
    }
  };

  const updateDevice = async (userId, deviceId, deviceName) => {
    return Model.device.update({ name: deviceName }, { where: { id: deviceId, userId } });
  };

  const deleteDevice = async (user, deviceId) => {
    const device = await Model.device.findOne({
      where: { id: deviceId, userId: user.id },
      include: [{ model: Model.backup }],
    });

    if (!device) {
      const err = new Error('This user didnt register this device');
      err.name = 'NOT_FOUND';
      throw err;
    }

    for (const backup of device.backups) {
      if (backup.fileId) {
        await App.services.Inxt.DeleteFile(user, backup.bucket, backup.fileId);
      }
    }

    await Model.backup.destroy({ where: { deviceId: device.id } });

    return device.destroy();
  };

  const activate = async (userData) => {
    const { Inxt, User } = App.services;
    let { backupsBucket } = await User.FindUserObjByEmail(userData.email);

    if (!backupsBucket) {
      // TODO: Remove mnemonic from here
      backupsBucket = (await Inxt.CreateBucket(userData.email, userData.userId, userData.mnemonic)).id;
      await Model.users.update({ backupsBucket }, { where: { username: { [Op.eq]: userData.email } } });
    }

    return backupsBucket;
  };

  const createDeviceAsFolder = async (userData, deviceName) => {
    const { User, Crypt } = App.services;
    let { backupsBucket } = await User.FindUserObjByEmail(userData.email);

    if (!backupsBucket) {
      backupsBucket = await activate(userData);
    }

    const encryptedFolderName = Crypt.encryptName(deviceName, backupsBucket);

    const alreadyExists = await Model.folder.findOne({
      where: {
        bucket: { [Op.eq]: backupsBucket },
        name: { [Op.eq]: encryptedFolderName },
        deleted: { [Op.eq]: false },
        removed: { [Op.eq]: false },
      },
    });

    if (alreadyExists) {
      throw createHttpError(409, 'Folder with the same name already exists');
    }
    return Model.folder.create({ name: encryptedFolderName, bucket: backupsBucket, userId: userData.id });
  };

  const isDeviceAsFolderEmpty = async (folder) => {
    const folders = await Model.folder.findOne({
      where: {
        parent_id: folder.id,
        deleted: false,
      },
    });
    const files = await Model.file.findOne({
      where: {
        folder_id: folder.id,
        deleted: false,
      },
    });
    return !folders && !files;
  };

  const getDeviceAsFolder = async (userData, id) => {
    const folder = await Model.folder.findOne({ where: { id, user_id: userData.id } });
    if (!folder) throw createHttpError(404, 'Folder does not exist');

    return {
      ...folder.get({ plain: true }),
      hasBackups: !(await isDeviceAsFolderEmpty(folder)),
      lastBackupAt: folder.updatedAt,
    };
  };

  // deprecated in favor of updateDeviceAsFolder
  const renameDeviceAsFolder = async (userData, id, deviceName) => {
    const folder = await Model.folder.findOne({ where: { id, user_id: userData.id } });
    if (!folder) throw createHttpError(404, 'Folder does not exist');

    const encryptedFolderName = App.services.Crypt.encryptName(deviceName, folder.bucket);
    return folder.update({ name: encryptedFolderName });
  };

  const updateDeviceAsFolder = async (userData, id, data) => {
    const folder = await Model.folder.findOne({ where: { id, user_id: userData.id } });
    if (!folder) throw createHttpError(404, 'Folder does not exist');

    if (data.name) {
      const encryptedFolderName = App.services.Crypt.encryptName(data.name, folder.bucket);
      data.name = encryptedFolderName;
      folder.changed('name', true);
    }

    return folder.update({ ...data });
  };

  const getDevicesAsFolder = async (userData) => {
    const { backupsBucket } = await Model.users.findOne({ where: { id: userData.id } });

    if (!backupsBucket) throw createHttpError(400, 'Backups is not activated for this user');

    const folders = await Model.folder.findAll({ where: { bucket: backupsBucket } });

    const newFolders = await Promise.all(
      folders.map(async (folder) => {
        const decryptedWithBucket = App.services.Crypt.decryptName(folder.name, folder.bucket);

        const shouldUpdateName = !decryptedWithBucket && folder.bucket;

        const backupName = shouldUpdateName
          ? App.services.Crypt.encryptName(App.services.Crypt.decryptNameWithNullFolderId(folder.name), folder.bucket)
          : folder.name;

        if (shouldUpdateName) {
          await folder.update({ name: backupName }, { silent: true });
        }

        return {
          ...folder.get({ plain: true }),
          name: backupName,
          hasBackups: !(await isDeviceAsFolderEmpty(folder)),
          lastBackupAt: folder.updatedAt,
        };
      }),
    );

    return newFolders;
  };

  const create = async ({ userId, path, deviceId, encryptVersion, interval, enabled }) => {
    const { backupsBucket } = await Model.users.findOne({ where: { id: userId } });

    if (!backupsBucket) throw new Error('Backups must be activated before creating one');

    const device = Model.device.findOne({ where: { id: deviceId, userId } });

    if (!device) throw new Error('This user didnt register this device');

    return Model.backup.create({
      path,
      encrypt_version: encryptVersion,
      deviceId,
      bucket: backupsBucket,
      interval,
      userId,
      enabled,
    });
  };

  const getAll = async (userId, mac) => {
    const device = await Model.device.findOne({ where: { mac, userId } });
    if (!device) throw new Error('This user didnt register this device');

    return Model.backup.findAll({ where: { deviceId: device.id } });
  };

  const deleteOne = async (user, id) => {
    const backup = await Model.backup.findOne({ where: { id, userId: user.id } });

    if (!backup) throw new Error(`This user does not have a backup with id ${id}`);

    const { fileId, bucket } = backup;

    if (fileId) {
      await App.services.Inxt.DeleteFile(user, bucket, fileId);
    }

    return backup.destroy();
  };

  const updateOne = async (userId, id, data) => {
    return Model.backup.update(data, { where: { userId, id } });
  };

  const updateManyOfDevice = async (userId, deviceId, data) => {
    return Model.backup.update(data, { where: { userId, deviceId } });
  };

  const getByUserId = (userId) => {
    return Model.backup.findOne({ where: { userId } });
  };

  return {
    Name: 'Backup',
    activate,
    create,
    getAll,
    getByUserId,
    deleteOne,
    updateOne,
    getDevice,
    deleteDevice,
    getAllDevices,
    createDevice,
    updateDevice,
    updateManyOfDevice,
    createDeviceAsFolder,
    getDeviceAsFolder,
    renameDeviceAsFolder,
    updateDeviceAsFolder,
    getDevicesAsFolder,
  };
};

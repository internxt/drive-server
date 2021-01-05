require('dotenv').config();

const { Environment } = require('storj');
const Sequelize = require('sequelize');

const UserModel = require('../models/user');
const FolderModel = require('../models/folder');

const { Op } = Sequelize;

const sequelize = new Sequelize(
    process.env.RDS_DBNAME,
    process.env.RDS_USERNAME,
    process.env.RDS_PASSWORD,
    {
        host: process.env.RDS_HOSTNAME,
        dialect: 'mysql',
        operatorsAliases: 0,
        logging: null
    }
);
const User = UserModel(sequelize, Sequelize);
const Folder = FolderModel(sequelize, Sequelize);

const getBucket = (folderId) => new Promise((resolve, reject) => {
    Folder.findOne({
        where: { id: { [Op.eq]: folderId } }
    })
        .then((res) => resolve(res.bucket))
        .catch(reject);
});

const updateUser = (emailUser) => {
    console.log(`Removing root_folder_id ${emailUser}`);

    return new Promise((resolve, reject) => {
        User.update(
            {
                root_folder_id: null
            },
            { where: { email: emailUser } }
        )
            .then((res) => {
                resolve();
            })
            .catch(reject);
    });
};

const deleteRootBucket = (user, bucketId) => new Promise((resolve, reject) => {
    let storj;
    try {
        storj = new Environment({
            bridgeUrl: process.env.STORJ_BRIDGE,
            bridgeUser: user.email,
            bridgePass: user.userId,
            logLevel: 3
        });
    } catch (error) {
        console.error('[NODE-LIB getEnvironment]', error);
        reject(error);
    }

    console.log(`Removing root bucket for user: ${user.email}`);
    storj.deleteBucket(bucketId, (err, result) => {
        if (err) {
            console.error(err);
            reject(err);
        } else {
            console.log(result);
            updateUser(user.email)
                .then((res) => resolve(res))
                .catch(reject);
        }
    });
});

const getUnconfirmedUsers = () => {
    const yearAgo = new Date();
    yearAgo.setMonth(yearAgo.getMonth() - 12);

    return new Promise((resolve, reject) => {
        User.findAll({
            where: {
                updatedAt: {
                    [Op.lt]: yearAgo
                },
                is_email_activity_sended: {
                    [Op.eq]: true
                }
            }
        })
            .then((res) => {
                resolve(res);
            })
            .catch(reject);
    });
};

const init = () => {
    sequelize
        .authenticate()
        .then(() => {
            getUnconfirmedUsers()
                .then((users) => {
                    users.forEach((user) => {
                        console.log(user.email);

                        if (user.root_folder_id) {
                            getBucket(user.root_folder_id)
                                .then((bucketId) => {
                                    console.log('kkkkkkkkkkkkk');
                                    console.log(bucketId);

                                    deleteRootBucket(user, bucketId)
                                        .then((res) => {
                                            console.log(res);
                                        })
                                        .catch((err) => {
                                            console.error(err);
                                        });
                                })
                                .catch((err) => {
                                    console.error(err);
                                });
                        }
                    });
                })
                .catch((err) => {
                    console.error(err);
                });
        })
        .catch((err) => {
            console.error(err);
        });
};

setInterval(init, 60000 * 60 * 24);

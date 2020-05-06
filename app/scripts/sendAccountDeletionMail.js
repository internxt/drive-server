require('dotenv').config();

const InternxtMailer = require('storj-service-mailer');
const UserModel = require('./../models/user');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

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

const sendMail = (emailTo) => {
    var mailer = new InternxtMailer({
        host: process.env.STORJ_MAILER_HOST,
        port: process.env.STORJ_MAILER_PORT,
        secure: true,
        auth: {
            user: process.env.STORJ_MAILER_USERNAME,
            pass: process.env.STORJ_MAILER_PASSWORD
        },
        from: 'hello@internxt.com'
    });

    mailer.dispatch(emailTo, 'inactive', {
        template: 'variables',
        go: { in: 'here' }
    }, function (err) {
        if (!err) {
            console.log(`Mail sent to ${emailTo}!`);
            updateUser(emailTo);
        } else {
            console.error(`Error sending mail to ${emailTo}`);
            console.error(err);
        }
    });
}

const getInactiveAccountsForAYear = () => {
    var yearAgo = new Date();

    yearAgo.setMonth(yearAgo.getMonth() - 12);
    yearAgo.setDate(yearAgo.getDate() + 7);
    yearAgo.setMinutes(0)
    yearAgo.setSeconds(0)
    yearAgo.setHours(0)

    return new Promise((resolve, reject) => {
        User.findAll({
            where: {
                updatedAt: {
                    [Op.lt]: yearAgo
                },
                is_email_activity_sended: {
                    [Op.eq]: false
                }
            }
        })
        .then((res) => { resolve(res) })
        .catch(reject);
    });
}

const updateUser = (emailUser) => {
    console.log(`Updating is_email_activity_sended to ${emailUser}`);
    return new Promise((resolve, reject) => {
        User.update({
            is_email_activity_sended: true
        }, { where: { email: emailUser } }).then((res) => { resolve() }).catch(reject);
    });
}

const init = () => {
    sequelize.authenticate().then(() => {
        getInactiveAccountsForAYear().then((users) => {
            users.forEach(user => {
                console.log(`Sending email to ${user.email}`);
                sendMail(user.email);
            });
        }).catch((err) => {
            console.error(err);
        });
    }).catch((err) => {
        console.error(err);
    });
}

setInterval(init, 60000 * 60 * 24)
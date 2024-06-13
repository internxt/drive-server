const InternxtMailer = require('inxt-service-mailer');
const { isProduction } = require('../../config/environments/env');
const { MailerService } = require('./mailer/mailer.service');

module.exports = (Model) => {
  const mailInstance = () => {
    const mailConfig = {
      host: process.env.INXT_MAILER_HOST,
      port: process.env.INXT_MAILER_PORT,
      secure: isProduction(),
      auth: {
        user: process.env.INXT_MAILER_USERNAME,
        pass: process.env.INXT_MAILER_PASSWORD,
      },
      from: 'hello@internxt.com',
    };

    if (process.env.SENDGRID_API_KEY) {
      mailConfig.sendgrid = {
        api_key: process.env.SENDGRID_API_KEY,
      };
    }

    return new InternxtMailer(mailConfig);
  };

  const sendGuestInvitation = async (user, guestEmail) => {
    const mailer = mailInstance();

    const guest = await Model.users.findOne({ where: { username: guestEmail } });

    return new Promise((resolve, reject) => {
      mailer.dispatchSendGrid(
        guestEmail,
        'join-workspace',
        {
          host: `${user.name} ${user.lastname}`,
          guest: `${guest.name} ${guest.lastname}`,
          url: `${process.env.HOST_DRIVE_WEB}/guest/invite`,
        },
        (err) => {
          if (err) {
            return reject(Error('Cannot send guest invitation'));
          }

          return resolve();
        },
      );
    });
  };

  const sendInviteFriendMail = async ({ inviteEmail, hostEmail, hostFullName, registerUrl }) => {
    const maile = new MailerService();
    const inviteTemplateID = process.env.DRIVE_INVITE_FRIEND_TEMPLATE_ID;
    return maile.send(inviteEmail, inviteTemplateID, {
      sender_fullname: hostFullName,
      sender_email: hostEmail,
      referral_url: registerUrl,
    });
  };

  const sendVerifyEmailMail = async (email, { url }) => {
    const maile = new MailerService();
    const verifyAccountTemplateId = process.env.DRIVE_VERIFY_ACCOUNT_TEMPLATE_ID;
    
    console.log('[MAIL/sendVerifyEmailMail]', { email, verifyAccountTemplateId, url });

    return maile.send(email, verifyAccountTemplateId, {
      verification_url: url,
    });
  };

  return {
    Name: 'Mail',
    sendGuestInvitation,
    sendInviteFriendMail,
    sendVerifyEmailMail,
  };
};

const InternxtMailer = require('inxt-service-mailer');

module.exports = (Model, App) => {
  const mailInstance = () => {
    const mailConfig = {
      host: process.env.INXT_MAILER_HOST,
      port: process.env.INXT_MAILER_PORT,
      secure: process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'production',
      auth: {
        user: process.env.INXT_MAILER_USERNAME,
        pass: process.env.INXT_MAILER_PASSWORD,
      },
      from: 'hello@internxt.com',
    }

    if (process.env.SENDGRID_API_KEY) {
      mailConfig.sendgrid = {
        api_key: process.env.SENDGRID_API_KEY
      }
      return new InternxtMailer(mailConfig);

    }

    return new InternxtMailer(mailConfig);
  }
  const sendInvitationMail = (emailTo, user) => {
    const mailer = mailInstance();

    return new Promise((resolve, reject) => {
      mailer.dispatchSendGrid(
        emailTo,
        'referral',
        {
          template: 'referral',
          go: { in: 'here' },
          senderUser: user.name,
          url: `https://internxt.com/?ref=${user.uuid}`
        },
        (err) => {
          if (!err) {
            console.log(`Mail sent to ${emailTo}!`);
            resolve();
          } else {
            console.error(`Error sending mail to ${emailTo}`);
            reject(err);
          }
        }
      );
    });
  };



  const sendEmailTeamsMember = (member, cryptedToken, teamName) => {
    const mailer = mailInstance();
    return new Promise((resolve, reject) => {
      mailer.dispatchSendGrid(
        member,
        'join-team',
        {
          template: 'join-team',
          go: { in: 'here' },
          memberName: member.user,
          teamName: teamName,
          urlAcceptInvitation: `${process.env.HOST_DRIVE_WEB}/teams/join/${cryptedToken}`

        }, (err) => {
          if (!err) {
            resolve(`Mail team's invitation send to ${member}!`);
            Logger.info("Teams: Team invitation mail sent to", member);
          } else {
            reject(`Error sending mail team's invitation to ${member}`);
          }
        });
    });
  }



  return {
    Name: 'Mail',
    sendInvitationMail,
    sendEmailTeamsMember

  }
}
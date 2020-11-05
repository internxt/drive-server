const axios = require('axios');

const passport = require('../middleware/passport');

const { passportAuth } = passport;

module.exports = (Router, Service, Logger, App) => {
  Router.get('/usage/:idTeam?', passportAuth, function (req, res) {
    const userData = req.user;
    const idTeam = req.params.idTeam || null;

    new Promise((resolve, reject) => {
      if (idTeam) {
        Service.TeamsMembers.getIdTeamByUser(userData.email)
          .then((teamMember) => {
            Service.Team.getTeamById(teamMember.id_team)
              .then((team) => {
                const pwd = team.bridge_user;
                let pwdHash = Service.Crypt.hashSha256(pwd);

                let credential = Buffer.from(
                  `${team.bridge_user}:${pwdHash}`
                ).toString('base64');

                resolve(credential);
              })
              .catch((err) => reject(err));
          })
          .catch((err) => reject(err));
      } else {
        const pwd = userData.userId;
        const pwdHash = Service.Crypt.hashSha256(pwd);

        const credential = Buffer.from(`${userData.email}:${pwdHash}`).toString(
          'base64'
        );

        resolve(credential);
      }
    })
      .then((credential) => {
        axios
          .get(`${App.config.get('STORJ_BRIDGE')}/usage`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Basic ${credential}`,
            },
          })
          .then((data) => {
            res.status(200).send(data.data ? data.data : { total: 0 });
          })
          .catch((err) => {
            res
              .status(400)
              .send({ result: 'Error retrieving bridge information' });
          });
      })
      .catch((err) => {
        res.status(400).send({ result: 'Error retrieving bridge information' });
      });
  });

  Router.get('/limit/:idTeam?', passportAuth, function (req, res) {
    const userData = req.user;
    const idTeam = req.params.idTeam || null;

    new Promise((resolve, reject) => {
      if (idTeam) {
        Service.TeamsMembers.getIdTeamByUser(userData.email)
          .then((teamMember) => {
            Service.Team.getTeamById(teamMember.id_team)
              .then((team) => {
                const pwd = team.bridge_user;
                let pwdHash = Service.Crypt.hashSha256(pwd);

            const credential = Buffer.from(`${team.bridge_user}:${pwdHash}`).toString
                  toString('base64');

                resolve(credential);
              })
              .catch((err) => reject(err));
          })
          .catch((err) => reject(err));
      } else {
        const pwd = userData.userId;
        const pwdHash = Service.Crypt.hashSha256(pwd);

        const credential = Buffer.from(`${userData.email}:${pwdHash}`).toString(
          'base64'
        );

        resolve(credential);
      }
    })
      .then((credential) => {
        axios
          .get(`${App.config.get('STORJ_BRIDGE')}/limit`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Basic ${credential}`,
            },
          })
          .then((data) => {
            res.status(200).send(data.data ? data.data : { total: 0 });
          })
          .catch((err) => {
            res
              .status(400)
              .send({ result: 'Error retrieving bridge information' });
          });
      })
      .catch((err) => {
        res.status(400).send({ result: 'Error retrieving bridge information' });
      });
  });
};

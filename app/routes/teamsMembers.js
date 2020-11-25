const sgMail = require('@sendgrid/mail');

const { passportAuth } = require('../middleware/passport');

module.exports = (Router, Service, Logger, App) => {


    Router.get('/teams-members/:user', passportAuth, (req, res) => {
        const userEmail  = req.params.user;

        Service.Team.getIdTeamByUser(userEmail)
            .then((team) => {
                Service.Team.getTeamById(team.id_team).then((team2) => {
                    res.status(200).json(team2.dataValues);
                }).catch((err) => {});
            })
            .catch((err) => {
                res.status(500).json(err);
            });
    });

    Router.get('/teams-members/team/:idTeam', passportAuth, (req, res) => {
        const { idTeam } = req.params;
        Service.TeamsMembers.getMembersByIdTeam(idTeam)
            .then((teamMembers) => {
                res.status(200).json(teamMembers);
            })
            .catch((err) => {
                res.status(500).json(err);
            });
    });
};

const { passportAuth } = require('../middleware/passport');
const sgMail = require('@sendgrid/mail');

module.exports = (Router, Service, Logger, App) => {
  Router.post('/teams-members', passportAuth, function (req, res) {
    const { members } = req.body;
    const { user } = req.user;

    Service.Team.getTeamByUser(user)
    .then((team) => {
      if (req.body.idTeam == team.id) {
        var oldMembers = [];

        Service.TeamsMembers.getMembersByIdTeam(team.id)
        .then((teamMembers) => {
          teamMembers.forEach(teamMember => {
            oldMembers.push(teamMember.user);
          });

          Service.TeamsMembers.save(members, oldMembers, team).then(() => {
            res.status(200).json({'message': 'new users saved'});
          }).catch((err) => {
            res.status(500).json({error: err});
          });
        }).catch((err) => {
          res.status(500).json({error: err});
        });

      } else {
        res.status(500).json({error: "it's not your team"});
      }
    }).catch((err) => {
      res.status(500).json({error: "it's not your team"});
    });
  });

  Router.delete('/teams-members/', passportAuth, function (req, res) {
    const { members } = req.body;
    const { idTeam } = req.body;
    const { user } = req;

    Service.Team.getTeamByIdUser(user.email).then((team) => {
      if (idTeam == team.id) {
        Service.TeamsMembers.remove(members, team.id).then(() => {
          Service.TeamInvitations.remove(members[0]).then(() => {
            res.status(200).json({message: 'team member removed'});
          }).catch((err) => {
            res.status(500).json({error: err});
          });
          
        }).catch((err) => {
          res.status(500).json({error: err});
        });
      } else {
        res.status(500).json({error: "it's not your team"});
      }
    }).catch((err) => {
      res.status(500).json({error: "it's not your team"});
    });
  });

  Router.get('/teams-members/:user', passportAuth, function (req, res) {
    const user = req.user;
    Service.TeamsMembers.getTeamByUser(user.email)
    .then(teamMember => {
      res.status(200).json(teamMember);
    }).catch(err => {
      res.status(500).json(err);
    });
  });

  Router.get('/teams-members/team/:idTeam', passportAuth, function (req, res) {
    const { idTeam } = req.params;

    Service.TeamsMembers.getMembersByIdTeam(idTeam).then(teamMembers => {
      res.status(200).json(teamMembers);
    }).catch(err => {
      res.status(500).json(err);
    });
  });
}
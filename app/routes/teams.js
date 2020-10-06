const { passportAuth } = require('../middleware/passport');

module.exports = (Router, Service, Logger, App) => {
  Router.get('/teams/:user', passportAuth, function (req, res) {
    const { user } = req.params;

    Service.Team.getTeamByIdUser(user).then(team => {
      res.status(200).json(team);
    }).catch(err => {
      res.status(500).json(err);
    });
  });

  Router.get('/teams/getById/:id', passportAuth, function (req, res) {
    const { id } = req.params;

    Service.Team.getTeamById(id).then(team => {
      res.status(200).json(team);
    }).catch(err => {
      res.status(500).json(err);
    });
  });
}
const { passportAuth } = require('../middleware/passport');

module.exports = (Router, Service, Logger, App) => {
  Router.post('/team-invitation', passportAuth, (req, res) => {
    const { token } = req.body;

    Service.TeamInvitations.getByToken(token)
      .then((teamInvitation) => {
        Service.TeamInvitations.markAsUsed(teamInvitation)
          .then(() => {
            Service.TeamsMembers.update(teamInvitation)
              .then(() => {
                res.status(200).json({});
              })
              .catch(() => {
                res.status(500).json({ error: 'Invalid Team invitation link' });
              });
          })
          .catch((err) => {
            res.status(500).json({ error: 'Invalid Team invitation link' });
          });
      })
      .catch((err) => {
        res.status(500).json({ error: 'Invalid Team invitation link' });
      });
  });
};

const useragent = require('useragent')
const passport = require('../middleware/passport')
const passportAuth = passport.passportAuth

module.exports = (Router, Service, Logger, App) => {
  Router.get('/storage/tree', passportAuth, function (req, res) {
    const user = req.user;
    const agent = useragent.parse(req.headers['user-agent']);

    if (agent && agent.family === 'Electron') {
      Service.Statistics.Insert({
        name: 'X Cloud Desktop',
        user: user.email,
        userAgent: agent.source
      }).then(() => {

      }).catch((err) => {
        console.log('Error creating statistics:', err)
      })
    }

    Service.User.UpdateAccountActivity(user.email);

    Service.Folder.GetTree(user).then((result) => {
      res.status(200).send(result)
    }).catch((err) => {
      res.status(500).send({ error: err.message })
    })
  });
}
const passport = require('passport')
const upload = require('./../middleware/multer')
const swaggerSpec = require('./../../config/initializers/swagger')
/**
 * JWT
 */
const passportAuth = passport.authenticate('jwt', {
  session: false
})

module.exports = (Router, Service, Logger) => {
  Router.get('/api-docs.json', function(req, res) {
    res.setHeader('Content-Type', 'application/json')
    res.send(swaggerSpec)
  })


  Router.post('/user', (req, res) => {
    const newUser = Service.User.Create(req.body);
    res.json(newUser);
  });

  Router.get('/user/:id', (req, res) => {
    Service.User.GetUserById(req.params.id).then((foundUser) => {
      res.send(foundUser);
    });
  });

  Router.get('/user/:id/root_folder', (req, res) => {
    Service.User.GetUsersRootFolder(req.params.id).then((rootFolder) => {
      res.send(rootFolder);
    });
  });

  return Router
}

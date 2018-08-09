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

  Router.post('/auth', function(req, res) {
    // TODO implement civic reg/login
  });

  Router.get('/user/:id', function(req, res) {
    Service.User.GetUserById(req.params.id).then((foundUser) {
      res.send(foundUser);
    });
  });

  Router.get('/storage/folder/:id', function(req, res) {
    // TODO
  });
  
  Router.get('/storage/folder/:id/meta', function(req, res) {
    // TODO
  });

  Rotuer.post('/storage/folder/:id/upload', function(req, res) {
    // TODO
  })

  Router.get('./storage/file/:id', function(req, res) {
    // TODO
  })
  
  Router.delete('./storage/file/:id', function(req, res) {
    // TODO
  })
  
  Router.get('./storage/file/search', function(req, res) {
    const query = req.query.q
    // TODO
  })
  
  return Router
}

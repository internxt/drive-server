const passport = require('passport')
const upload = require('./../middleware/multer')
const swaggerSpec = require('./../../config/initializers/swagger')
/**
 * JWT
 */
const passportAuth = passport.authenticate('jwt', {
  session: false
})

module.exports = (Router, Service, Logger, App) => {
  Router.get('/api-docs.json', function(req, res) {
    res.setHeader('Content-Type', 'application/json')
    res.send(swaggerSpec)
  })

  Router.get('/auth', function (req, res) {
    const civicClient = App.civic
    const jwtToken = req.headers.civictoken

    civicClient.exchangeCode(jwtToken)
      .then((userData) => {
        const id = userData.userId
        const email = userData.data[0].value
        Service.User.FindOrCreate({ id, email })
          .then((result) => {
            res.status(201).json(result)
          }).catch((err) => {
            res.send(err.message)
          });
      }).catch((error) => {
        res.send(error)
      });
  });

  Router.get('/user/:id', function(req, res) {
    Service.User.GetUserById(req.params.id).then(function(foundUser) {
      res.send(foundUser);
    });
  });

  Router.get('/storage/folder/:id', function(req, res) {
    // TODO
  });

  Router.get('/storage/folder/:id/meta', function(req, res) {
    // TODO
  });

  Router.post('/storage/folder/:id/upload', function(req, res) {
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

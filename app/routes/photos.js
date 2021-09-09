const passport = require('../middleware/passport');

const { passportAuth } = passport;

module.exports = (Router, Service, App) => {
  Router.get('/photos/user', passportAuth, async (req, res) => {
    const userPhotos = await App.services.UserPhotos.FindUserById(req.user.id);
    if (userPhotos) {
      res.status(200).send(userPhotos.toJSON());
    } else {
      res.status(400).send({});
    }
  });

  Router.get('/photos/initialize', passportAuth, (req, res) => {
    const inputData = {
      email: req.user.email,
      mnemonic: req.headers['internxt-mnemonic']
    };
    Service.UserPhotos.InitializeUserPhotos(inputData).then((userData) => {
      res.status(200).send({ user: userData });
    }).catch(() => {
      res.status(500).send({ message: 'Your account can\'t be initialized' });
    });
  });
};

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
};

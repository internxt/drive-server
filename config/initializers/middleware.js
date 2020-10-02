const bodyParser = require('body-parser');
const cors = require('cors');
const Passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const { ExtractJwt } = require('passport-jwt');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

module.exports = (App, Config) => {
  // use helmet
  App.express.use(helmet());

  // Disable X-Powered-By
  App.express.disable('x-powered-by');

  // Rate limiter
  App.express.use('/api/user/claim', rateLimit({
    windowMs: 24 * 60 * 60 * 1000,
    max: 1
  }));

  App.express.use('/api/user/invite', rateLimit({
    windowMs: 60 * 1000,
    max: 1
  }));

  // enables cors
  App.express.use(
    cors({
      allowedHeaders: ['sessionId', 'Content-Type', 'Authorization', 'method', 'internxt-version', 'internxt-client', 'internxt-mnemonic'],
      exposedHeaders: ['sessionId'],
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      preflightContinue: false,
    }),
  );

  App.express.use(bodyParser.json());

  App.express.use(bodyParser.urlencoded({ extended: true }));

  /**
   * JWT configuration.
   * Defines user authorization source (header / bearer token),
   * and the password to verify the JWT
   */
  const passportOpts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: Config.JWT,
  };

  /**
   * Passport strategy configuration.
   * Once JWT is granted, this middleware resolves the user info
   */
  Passport.use(
    new JwtStrategy(passportOpts, (payload, done) => {
      /* Temporal compatibility with old JWT
       * BEGIN
       */
      const COMPATIBILITY = true;
      let email = payload;
      if (typeof payload === 'object') {
        email = payload.email;
      } else if (!COMPATIBILITY) {
        return done(new Error('Old JWT not supported'));
      }
      /* END
       * After JWT migration, the email will be payload.email
       * and delete this block + uncomment next line
       */

      // const email = payload.email

      App.services.User.FindUserObjByEmail(email)
        .then((user) => done(null, user))
        .catch((err) => {
          console.log('Unauthorized %s', email)
          done(err)
        });
    }),
  );

  /**
   * Logger middleware.
   * Prints in console the used endpoints in real time.
   */
  App.express.use(function (req, res, next) {
    let user = null;
    if (req.headers.authorization) {
      try {
        const x = jwt.decode(req.headers.authorization.split(" ")[1])
        if (x.email) {
          user = x.email
        } else {
          user = x
        }
      } catch (e) {

      }
    }
    App.logger.info(
      `[${req.method}${req.headers.authorization ? ' w/AUTH' : ''}] ${req.originalUrl} ${user ? '\t' + user : ''}`,
    );
    next();
  });
};

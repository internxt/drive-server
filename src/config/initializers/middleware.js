const { json, urlencoded } = require('express');
const cors = require('cors');
const Passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const { ExtractJwt } = require('passport-jwt');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const addRequestId = require('express-request-id');
const util = require('util');
const Logger = require('../../lib/logger').default;
const logger = Logger.getInstance();
const apiMetrics = require('prometheus-api-metrics');
const { isProduction } = require('../environments/env');

module.exports = (App, Config) => {
  App.express.use((req, res, next) => {    
    if (
      req.headers['internxt-version'] 
      && req.headers['internxt-version'] === '2.2.2.54'
      && req.path.includes('/user/refresh')
    ) {
      return res.status(503).send();
    }
    next();
  });
  App.express.use(helmet());
  App.express.use(addRequestId());
  App.express.use(apiMetrics());
  App.express.use((req, res, next) => {
    const meta = {
      requestId: req.id,
    };
    req.logger = {
      info: (...content) => {
        logger.log({
          level: 'info',
          message: util.format(...content),
          meta,
        });
      },
      warn: (...content) => {
        logger.log({
          level: 'warn',
          message: util.format(...content),
          meta,
        });
      },
      error: (...content) => {
        logger.log({
          level: 'error',
          message: util.format(...content),
          meta,
        });
      },
      debug: (...content) => {
        logger.log({
          level: 'debug',
          message: util.format(...content),
          meta,
        });
      },
    };
    next();
  });
  App.express.disable('x-powered-by');

  const limiterKeyGenerator = (req) => {
    if (req.user && req.user.email) {
      return req.user.email;
    }

    try {
      const auth = jwt.decode(req.headers.authorization.split(' ')[1], App.config.get('secrets').JWT);
      if (auth.email) {
        return auth.email;
      }
    } catch {
      // no op
    }

    return req.headers['x-forwarded-for'] || req.ip;
  };

  // Rate limiter
  App.express.use(
    '/api/newsletter/subscribe',
    rateLimit({
      windowMs: 60 * 1000,
      max: 10,
      keyGenerator: limiterKeyGenerator,
    }),
  );

  App.express.use(
    '/api/user/invite',
    rateLimit({
      windowMs: 60 * 1000,
      max: 10,
      keyGenerator: limiterKeyGenerator,
    }),
  );

  App.express.use(
    '/api/user/resend',
    rateLimit({
      windowMs: 10 * 1000,
      max: 1,
      keyGenerator: limiterKeyGenerator,
    }),
  );

  App.express.use(
    '/user/refresh',
    rateLimit({
      windowMs: 24 * 60 * 60 * 1000,
      max: 10,
      keyGenerator: limiterKeyGenerator,
    }),
  );

  // enables cors
  App.express.use(
    cors({
      allowedHeaders: [
        'sessionId',
        'Content-Type',
        'Authorization',
        'method',
        'internxt-version',
        'internxt-client',
        'internxt-mnemonic',
        'x-share-password',
      ],
      exposedHeaders: ['sessionId'],
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      preflightContinue: false,
    }),
  );

  App.express.use(json());
  App.express.use(urlencoded({ extended: true }));

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
      const tokenWithoutExpiration = !payload.exp;

      if (tokenWithoutExpiration) {
        return done(null, false, { message: 'Invalid token, sign in again' });
      }

      /* Temporal compatibility with old JWT
       * BEGIN
       */
      const COMPATIBILITY = true;
      const email = typeof payload === 'object' ? payload.email : payload;

      if (!COMPATIBILITY) {
        return done(new Error('Old JWT not supported'));
      }
      /* END
       * After JWT migration, the email will be payload.email
       * and delete this block + uncomment next line
       */

      // const email = payload.email

      App.services.User.FindUserObjByEmail(email)
        .then((user) => {
          if (!user) {
            return done(new Error(`User ${email} not found`));
          }
  
          const userWithoutLastPasswordChangedAt = user.lastPasswordChangedAt === null;
          const userWithLastPasswordChangedAtLowerThanToken =
            user.lastPasswordChangedAt &&
            Math.floor(new Date(user.lastPasswordChangedAt).getTime()) / 1000 < payload.iat;
          if (userWithoutLastPasswordChangedAt || userWithLastPasswordChangedAtLowerThanToken) {
            done(null, user);
          } else {
            done(null);
          }
        })
        .catch((err) => {
          done(err);
        });
    }),
  );

  /**
   * Logger middleware.
   * Prints in console the used endpoints in real time.
   */
  App.express.use((req, res, next) => {
    let user = null;
    if (req.headers.authorization) {
      try {
        const x = jwt.decode(req.headers.authorization.split(' ')[1]);
        if (x.email) {
          user = x.email;
        } else {
          user = x;
        }
      } catch (e) {
        // no op
      }
    }

    const clientVersion = `[${req.headers['internxt-client']} ${req.headers['internxt-version']}]`.trim();
    const clientAuth = req.headers.authorization && user;

    if (!isProduction()) {
      App.logger.info(`[${req.method}] ${req.originalUrl} ${clientAuth && ` [w/AUTH ${clientAuth}]`} ${clientVersion}`);
    }

    next();
  });
};

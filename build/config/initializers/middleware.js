"use strict";
var _a = require('express'), json = _a.json, urlencoded = _a.urlencoded;
var cors = require('cors');
var Passport = require('passport');
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var jwt = require('jsonwebtoken');
var helmet = require('helmet');
var rateLimit = require('express-rate-limit');
module.exports = function (App, Config) {
    // use helmet
    App.express.use(helmet());
    // Disable X-Powered-By
    App.express.disable('x-powered-by');
    var limiterKeyGenerator = function (req) {
        if (req.user && req.user.email) {
            return req.user.email;
        }
        try {
            var auth = jwt.decode(req.headers.authorization.split(' ')[1], App.config.get('secrets').JWT);
            if (auth.email) {
                return auth.email;
            }
        }
        catch (_a) {
            // no op
        }
        return req.headers['x-forwarded-for'] || req.ip;
    };
    // Rate limiter
    App.express.use('/api/user/claim', rateLimit({
        windowMs: 60 * 1000,
        max: 1,
        keyGenerator: limiterKeyGenerator
    }));
    App.express.use('/api/user/invite', rateLimit({
        windowMs: 60 * 1000,
        max: 10,
        keyGenerator: limiterKeyGenerator
    }));
    App.express.use('/api/user/resend', rateLimit({
        windowMs: 10 * 1000,
        max: 1,
        keyGenerator: limiterKeyGenerator
    }));
    App.express.use('/api/teams/team-invitations', rateLimit({
        windowMs: 30 * 60 * 1000,
        max: 10,
        keyGenerator: limiterKeyGenerator
    }));
    // enables cors
    App.express.use(cors({
        allowedHeaders: [
            'sessionId',
            'Content-Type',
            'Authorization',
            'method',
            'internxt-version',
            'internxt-client',
            'internxt-mnemonic'
        ],
        exposedHeaders: ['sessionId'],
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false
    }));
    App.express.use(json());
    App.express.use(urlencoded({ extended: true }));
    /**
     * JWT configuration.
     * Defines user authorization source (header / bearer token),
     * and the password to verify the JWT
     */
    var passportOpts = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: Config.JWT
    };
    /**
     * Passport strategy configuration.
     * Once JWT is granted, this middleware resolves the user info
     */
    Passport.use(new JwtStrategy(passportOpts, function (payload, done) {
        /* Temporal compatibility with old JWT
         * BEGIN
         */
        var COMPATIBILITY = true;
        var email = typeof payload === 'object' ? payload.email : payload;
        if (!COMPATIBILITY) {
            return done(new Error('Old JWT not supported'));
        }
        /* END
         * After JWT migration, the email will be payload.email
         * and delete this block + uncomment next line
         */
        // const email = payload.email
        App.services.User.FindUserObjByEmail(email).then(function (user) { return done(null, user); }).catch(function (err) {
            done(err);
        });
    }));
    /**
     * Logger middleware.
     * Prints in console the used endpoints in real time.
     */
    App.express.use(function (req, res, next) {
        var user = null;
        if (req.headers.authorization) {
            try {
                var x = jwt.decode(req.headers.authorization.split(' ')[1]);
                if (x.email) {
                    user = x.email;
                }
                else {
                    user = x;
                }
            }
            catch (e) {
                // no op
            }
        }
        var clientVersion = ("[" + req.headers['internxt-client'] + " " + req.headers['internxt-version'] + "]").trim();
        var clientAuth = req.headers.authorization && user;
        App.logger.info("[" + req.method + "] " + req.originalUrl + " " + (clientAuth && " [w/AUTH " + clientAuth + "]") + " " + clientVersion);
        next();
    });
};

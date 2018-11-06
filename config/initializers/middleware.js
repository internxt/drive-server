const bodyParser = require('body-parser')
const cors = require('cors')
const Passport = require('passport')
const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt
const path = require('path')
const express = require('express')

module.exports = (App, Config) => {

  // enables cors
  App.express.use(cors({
    allowedHeaders: ['sessionId', 'Content-Type', 'Authorization', 'civicToken', 'method'],
    exposedHeaders: ['sessionId'],
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false
  }))
  App.express.use(bodyParser.json())
  App.express.use(bodyParser.urlencoded({ extended: true }))

  /**
   * JWT
   */
  const passportOpts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: Config.JWT
  }

  Passport.use(new JwtStrategy(passportOpts, (payload, done) => {
    App.services.User.FindOrCreate({ email: payload })
      .then((user) => {
        done(null, user)
        return null
      }).catch((err) => {
        done(err)
        return null
      })
  }))

  App.express.use(function(req, res, next) {
    App.logger.info(`[${req.method}] ${req.originalUrl}`)
    next()
  })
}

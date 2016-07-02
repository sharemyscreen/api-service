const path = require('path');
const express = require('express');
const logger = require('winston');
const passport = require('passport');
const bodyParser = require('body-parser');
const bearerAuth = require('./auth/bearer');
const httpHelper = require('sharemyscreen-http-helper');

const user = require('./route/user');
const organization = require('./route/organization/index');

var apiApp = null;
var apiRouter = null;

function getApp (log) {
  logger.info('Initializing api app ...');
  apiApp = express();
  apiApp.use(bodyParser.json());
  apiApp.use(passport.initialize());

  apiRouter = express.Router();

  bearerAuth.init();

  apiApp.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Authorization');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    next();
  });

  if (log) {
    apiApp.use(httpHelper.requestLogger('api'));
  }

  // Register all routes
  user.registerRoute(apiRouter);
  organization.registerRoute(apiRouter);

  apiApp.use('/v1', apiRouter);
  apiApp.use('/doc', express.static(path.join(__dirname, '/doc'), {dotfiles: 'allow'}));

  // Error handler
  apiApp.use(function (err, req, res, next) {
    logger.error(err);
    httpHelper.sendReply(res, httpHelper.error.internalServerError(err));
  });

  logger.info('Api app initialized');

  return apiApp;
}

module.exports.getApp = getApp;

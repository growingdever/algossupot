/*jslint node: true, eqeq: true */
/*global alog*/
'use strict';

var express = require('express');
var RedisStore = require('connect-redis')(express);
var routes = require('./config/routes');
var http = require('http');
var path = require('path');
var async = require('async');
var winston = require('winston');
var config = require('./config');
var models = require('./app/models');

var DBLib = require('mysql-activerecord');
var db = new DBLib.Adapter({
  server: '127.0.0.1',
  username: 'algossupotadmin',
  password: 'ncloudme',
  database: 'algossupot'
});

global.config = config;
global.db = db;
global.async = async;

winston.addColors(winston.config.syslog.colors);

global.alog = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      colorize: true
    }),
    new (winston.transports.File)({ filename: 'server.log' })
  ]
});

var app = express();

// all environments
app.set('port', process.env.PORT || 17239);
app.set('views', path.join(__dirname, 'app/views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('S3CRE7'));
app.use(express.session({ store: new RedisStore({
  host: '127.0.0.1',
  port: 6379,
  prefix: 'sess'
}), secret: 'SEKR37' }));
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}

routes.use(app);

models
  .sequelize
  .sync({force: true})
  .complete(function (err) {
    if (err) {
      throw err;
    }

    http.createServer(app).listen(app.get('port'), function () {
      alog.info('Express server listening on port ' + app.get('port'));
    });
  });

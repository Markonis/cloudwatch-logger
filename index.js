var _ = require('underscore');
var winston = require('winston');
var expressWinston = require('express-winston');
var CloudWatchTransport = require('winston-aws-cloudwatch');
var Options = require('@markonis/options');

module.exports = (function() {
  var Logger = function(params) {
    var options = new Options(params, {
      logStreamName: 'cloudwatch-logger',
      logGroupName: process.env['AWS_LOG_GROUP'],
      level: 'info',
      fileTransport: false,
      requestWhitelist: [],
      requestBlacklist: [],
      responseWhitelist: [],
      responseBlackList: [],
      awsConfig: {
        accessKeyId: process.env['AWS_ACCESS_KEY_ID'],
        secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY'],
        region: process.env['AWS_REGION']
      }
    });

    var environment = process.env['NODE_ENV'];

    // ===========================
    // Init transports
    // ===========================

    var transports = [];

    transports.push(new winston.transports.Console({
      json: true,
      level: options.get('level'),
    }));

    if (options.get('fileTransport')) {
      transports.push(new winston.transports.File({
        json: true,
        level: options.get('level'),
        filename: 'log/' + options.get('logStreamName') + '.log'
      }));
    }

    if (environment === 'production') {
      transports.push(new CloudWatchTransport({
        logGroupName: options.get('logGroupName'),
        logStreamName: options.get('logStreamName'),
        level: options.get('level'),
        createLogGroup: true,
        createLogStream: true,
        awsConfig: options.get('awsConfig'),
        formatLog: function(item) {
          return JSON.stringify({
            level: item.level,
            message: item.message,
            meta: item.meta
          });
        }
      }));
    }

    // ===========================
    // Getters
    // ===========================

    this.getTransports = function() {
      return transports;
    };

    this.getOptions = function() {
      return options;
    };

    this.getWinstonInstance = _.memoize(function() {
      var instance = new winston.Logger({
        transports: transports
      });

      instance.setLevels(winston.config.syslog.levels);

      return instance;
    });
  };

  Logger.prototype.createRequestMiddleware = function() {
    var options = this.getOptions();

    var instance = expressWinston.logger({
      winstonInstance: this.getWinstonInstance(),
      requestWhitelist: options.get('requestWhitelist'),
      requestBlacklist: options.get('requestBlacklist'),
      responseWhitelist: options.get('responseWhitelist'),
      responseBlackList: options.get('responseBlackList')
    });

    return instance;
  };

  Logger.prototype.createErrorMiddleware = function() {
    var options = this.getOptions();

    var instance = expressWinston.errorLogger({
      winstonInstance: this.getWinstonInstance(),
      requestWhitelist: options.get('requestWhitelist'),
      requestBlacklist: options.get('requestBlacklist'),
      responseWhitelist: options.get('responseWhitelist'),
      responseBlackList: options.get('responseBlackList')
    });

    return instance;
  };

  Logger.prototype.log = function() {
    var instance = this.getWinstonInstance();
    return instance.log.apply(instance, arguments);
  };

  return Logger;
}());

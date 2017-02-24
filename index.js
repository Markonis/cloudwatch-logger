var _ = require('underscore');
var winston = require('winston');
var expressWinston = require('express-winston');
var CloudWatchTransport = require('winston-aws-cloudwatch');


module.exports = (function() {
  var Logger = function(params) {
    var environment = process.env['NODE_ENV'];
    params = Logger.processParams(params);

    // ===========================
    // Init transports
    // ===========================

    var transports = [
      new winston.transports.Console({
        json: true,
        level: params.level,
      }),
      new winston.transports.File({
        json: true,
        level: params.level,
        filename: 'log/' + params.logStreamName + '.log'
      })
    ];

    if (environment === 'production') {
      transports.push(new CloudWatchTransport({
        logGroupName: params.logGroupName,
        logStreamName: params.logStreamName,
        level: params.level,
        createLogGroup: true,
        createLogStream: true,
        awsConfig: params.awsConfig,
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

    this.getParams = function() {
      return params;
    };

    this.getWinstonInstance = _.memoize(function() {
      var instance = new winston.Logger({
        transports: transports
      });

      instance.setLevels(winston.config.syslog.levels);

      return instance;
    });
  };

  Logger.processParams = function(params) {
    var defaults = {
      logStreamName: 'cloudwatch-logger',
      logGroupName: process.env['AWS_LOG_GROUP'],
      level: 'info',
      requestWhitelist: [],
      requestBlacklist: [],
      responseWhitelist: [],
      responseBlackList: [],
      awsConfig: {
        accessKeyId: process.env['AWS_ACCESS_KEY_ID'],
        secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY'],
        region: process.env['AWS_REGION']
      }
    };

    return _.defaults(params, defaults);
  };

  Logger.prototype.createRequestMiddleware = function() {
    var params = this.getParams();

    var instance = expressWinston.logger({
      winstonInstance: this.getWinstonInstance(),
      requestWhitelist: params.requestWhitelist,
      requestBlacklist: params.requestBlacklist,
      responseWhitelist: params.responseWhitelist,
      responseBlackList: params.responseBlackList
    });

    return instance;
  };

  Logger.prototype.createErrorMiddleware = function() {
    var params = this.getParams();

    var instance = expressWinston.errorLogger({
      winstonInstance: this.getWinstonInstance(),
      requestWhitelist: params.requestWhitelist,
      requestBlacklist: params.requestBlacklist,
      responseWhitelist: params.responseWhitelist,
      responseBlackList: params.responseBlackList
    });

    return instance;
  };

  Logger.prototype.log = function() {
    var instance = this.getWinstonInstance();
    return instance.log.apply(instance, arguments);
  };

  return Logger;
}());

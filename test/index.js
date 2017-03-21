var expect = require('expect.js');
var Logger = require(process.cwd() + '/index.js');
var _ = require('underscore');

describe('Logger', function() {
  describe('constructor', function() {
    it('initializes the transports properly', function() {
      var logger = null;
      var params = {
        logStreamName: 'cloudwatch-logger',
        logGroupName: 'test-log-group',
        fileTransport: true,
        awsConfig: {
          accessKeyId: 'test',
          secretAccessKey: 'test',
          region: 'test'
        }
      };

      logger = new Logger(_.extend(params, {
        fileTransport: false
      }));

      expect(logger.getTransports().length).to.be(1);

      logger = new Logger(_.extend(params, {
        fileTransport: true
      }));

      expect(logger.getTransports().length).to.be(2);
    });
  });
});

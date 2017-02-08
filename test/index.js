var expect = require('expect.js');
var Logger = require(process.cwd() + '/index.js');

describe('Logger', function() {
  describe('processParams', function() {
    it('sets default params', function() {
      var input = {
        logStreamName: 'test-log',
        requestWhitelist: ['body']
      };

      var result = Logger.processParams(input);
      expect(result).to.eql({
        logStreamName: 'test-log',
        logGroupName: process.env['AWS_LOG_GROUP'],
        level: 'info',
        requestWhitelist: ['body'],
        requestBlacklist: [],
        responseWhitelist: [],
        responseBlackList: [],
        awsConfig: {
          accessKeyId: process.env['AWS_ACCESS_KEY_ID'],
          secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY'],
          region: process.env['AWS_REGION']
        }
      });
    });
  });
});

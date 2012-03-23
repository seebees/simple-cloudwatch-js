var cw      = require('../')

var nock    = require('nock')
var test    = require('tap').test

var con     = require('./constants.js')
var key     = con.key
var secret  = con.secret

test('test get to many results', function(t) {
  if (con.proxy) {
    nock('https://monitoring.amazonaws.com')
    .filteringPath(function(path) {
        return path
                .replace(/Timestamp=[^&]*/g, 'Timestamp=XXX')
                .replace(/Signature=[^&]*/g, 'Signature=YYY')
      })
      .get( '/?AWSAccessKeyId=YOUR-KEY-HERE'
          + '&Action=GetMetricStatistics'
          + '&Namespace=Disk_Space'
          + '&SignatureMethod=HmacSHA256'
          + '&SignatureVersion=2'
          + '&Timestamp=XXX'
          + '&Version=2010-08-01'
          + '&MetricName=DiskSpace'
          + '&StartTime=2012-02-19T09%3A49%3A50Z'
          + '&EndTime=2012-02-19T09%3A49%3A50Z'
          + '&Unit=Bytes'
          + '&Period=60'
          + '&Statistics.member.1=Maximum'
          + '&Dimensions.member.1.Name=DriveSize'
          + '&Dimensions.member.1.Value=30.0GB'
          + '&Dimensions.member.2.Name=Drive'
          + '&Dimensions.member.2.Value=System'
          + '&Dimensions.member.3.Name=Host'
          + '&Dimensions.member.3.Value=Utility'
          + '&Dimensions.member.4.Name=DriveLetter'
          + '&Dimensions.member.4.Value=C'
          + '&Signature=YYY')
      .reply(500, "<ErrorResponse xmlns=\"http://monitoring.amazonaws.com/doc/2010-08-01/\">\n"
                + "  <Error>\n"
                + "    <Type>Sender</Type>\n"
                + "    <Code>InvalidParameterCombination</Code>\n"
                + "    <Message>You have requested up to 16,666 datapoints, which exceeds the limit of 1,440. You may reduce the datapoints requested by increasing Period, or decreasing the time range.</Message>\n"
                + "  </Error>\n"
                + "  <RequestId>922116e5-63e8-11e1-a2be-a103f56f7144</RequestId>\n"
                + "</ErrorResponse>\n"
                , { 'x-amzn-requestid': '6c14f231-63e8-11e1-bc02-390405fef36d'
                  , 'content-type': 'text/xml'
                  , 'content-length': '808'
                  , date: 'Thu, 01 Mar 2012 21:49:29 GMT' })
  }

  cw(key, secret)
    .namespace('Disk_Space')
    .metric('DiskSpace')
    .start('2012-02-19T09:49:50Z')
    .end('2012-02-19T09:49:50Z')
    .period(60)
    .unit('bytes')
    .statistics('maximum')
    .dimensions({ DriveSize: '30.0GB'
                , Drive: 'System'
                , Host: 'Utility'
                , DriveLetter: 'C'})
    .get(function(err, obj) {
      console.log(err)
      console.log(obj)
      t.end()
    })
})


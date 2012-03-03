var cw      = require('../')

var nock    = require('nock')
var test    = require('tap').test

var con     = require('./constants.js')
var key     = con.key
var secret  = con.secret

test('basicFunction, No ts', function(t) {

  if (con.proxy) {
    var scope = nock('https://monitoring.amazonaws.com')
                .filteringPath(function(path) {
                  return path
                          .replace(/Timestamp=[^&]*/g, 'Timestamp=XXX')
                          .replace(/Signature=[^&]*/g, 'Signature=YYY')
                })
                .get( '/?AWSAccessKeyId=YOUR-KEY-HERE'
                    + '&Action=PutMetricData'
                    + '&Namespace=ServerResponse'
                    + '&SignatureMethod=HmacSHA256'
                    + '&SignatureVersion=2'
                    + '&Timestamp=XXX'
                    + '&Version=2010-08-01'
                    + '&MetricData.member.1.MetricName=Latency'
                    + '&MetricData.member.1.Value=87'
                    + '&Signature=YYY')
                .reply(200
                      ,   "<PutMetricDataResponse xmlns=\"http://monitoring.amazonaws.com/doc/2010-08-01/\">\n"
                        + "  <ResponseMetadata>\n"
                        + "    <RequestId>2b0d02a2-5da7-11e1-9909-a31f8ccab735</RequestId>\n"
                        + "  </ResponseMetadata>\n"
                        + "</PutMetricDataResponse>\n"
                      , { 'x-amzn-requestid': '2b0d02a2-5da7-11e1-9909-a31f8ccab735'
                        , 'content-type': 'text/xml'
                        , 'content-length': '212'
                        ,  date: 'Wed, 22 Feb 2012 22:47:15 GMT' })
  }

  cw(key, secret)
    .namespace('ServerResponse')
    .metric('Latency')
    .put(87
        , function(err, reqId, obj) {
            if (con.proxy) {
              t.ok(!err)
              t.equal('2b0d02a2-5da7-11e1-9909-a31f8ccab735', reqId)
            } else {
              console.log(err, reqId, obj)
            }
            t.end()
          })
})


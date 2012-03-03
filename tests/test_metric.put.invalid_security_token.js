var cw      = require('../')

var nock    = require('nock')
var test    = require('tap').test

var con     = require('./constants.js')
var key     = con.key
var secret  = con.secret

test('Invalid Securty Token', function(t) {
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
                  .reply(403
                        ,   "<ErrorResponse xmlns=\"http://monitoring.amazonaws.com/doc/2010-08-01/\">\n"
                          + "  <Error>\n"
                          + "    <Type>Sender</Type>\n"
                          + "    <Code>InvalidClientTokenId</Code>\n"
                          + "    <Message>The security token included in the request is invalid</Message>\n"
                          + "  </Error>\n"
                          + "  <RequestId>d1c7f189-5db9-11e1-9a37-6d848b0ae032</RequestId>\n"
                          + "</ErrorResponse>\n"
                        , { 'x-amzn-requestid': 'd1c7f189-5db9-11e1-9a37-6d848b0ae032'
                          , 'content-type': 'text/xml'
                          , 'content-length': '311'
                          , date: 'Thu, 23 Feb 2012 01:00:46 GMT' })
  }

  cw(key, secret)
    .namespace('ServerResponse')
    .metric('Latency')
    .put(87
        , function(err, reqId) {
            if (con.proxy) {
              t.ok(err)
              t.equal('d1c7f189-5db9-11e1-9a37-6d848b0ae032', reqId)
            } else {
              console.log(err, reqId, obj)
            }
            t.end()
          })
})


var cw      = require('../')

var nock    = require('nock')
var test    = require('tap').test

var con     = require('./constants.js')
var key     = con.key
var secret  = con.secret

test('Invalid Unit', function(t) {
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
                  .reply(400
                        ,   "<ErrorResponse xmlns=\"http://monitoring.amazonaws.com/doc/2010-08-01/\">\n"
                          + "  <Error>\n"
                          + "    <Type>Sender</Type>\n"
                          + "    <Code>InvalidParameterValue</Code>\n"
                          + "    <Message>The parameter MetricData.member.1.Unit must be a value in the set [Ljava.lang.String;@167213b.</Message>\n"
                          + "  </Error>\n"
                          + "  <RequestId>040ac37c-5dba-11e1-b03a-013967903caf</RequestId>\n"
                          + "</ErrorResponse>\n"
                        , { 'x-amzn-requestid': '040ac37c-5dba-11e1-b03a-013967903caf'
                          , 'content-type': 'text/xml'
                          , 'content-length': '353'
                          , date: 'Thu, 23 Feb 2012 01:02:10 GMT' })
  }

  cw(key, secret)
    .namespace('ServerResponse')
    .metric('Latency')
    .put(87
        , function(err, reqId, obj) {
            if (con.proxy) {
              t.ok(err)
              t.equal('040ac37c-5dba-11e1-b03a-013967903caf', reqId)
            } else {
              console.log(err, reqId, obj)
            }
            t.end()
          })
})


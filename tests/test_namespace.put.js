var cw      = require('../')

var nock    = require('nock')
var test    = require('tap').test

var con     = require('./constants.js')
var key     = con.key
var secret  = con.secret

test('test namespace.put', function(t) {

  if (con.proxy) {
    nock('https://monitoring.amazonaws.com')
    .filteringPath(function(path) {
        return path
                .replace(/Timestamp=[^&]*/g, 'Timestamp=XXX')
                .replace(/Signature=[^&]*/g, 'Signature=YYY')
      })
      .get( '/?AWSAccessKeyId=YOUR-KEY-HERE'
          + '&Action=PutMetricData'
          + '&Namespace=NameSpaceHere'
          + '&SignatureMethod=HmacSHA256'
          + '&SignatureVersion=2'
          + '&Timestamp=XXX'
          + '&Version=2010-08-01'
          + '&MetricData.member.1.MetricName=Metric1'
          + '&MetricData.member.1.Value=87'
          + '&MetricData.member.2.MetricName=Metric2'
          + '&MetricData.member.2.Value=99'
          + '&MetricData.member.2.Unit=Seconds'
          + '&MetricData.member.3.MetricName=Metric3'
          + '&MetricData.member.3.Value=33'
          + '&MetricData.member.3.Dimensions.member.1.Name=Host'
          + '&MetricData.member.3.Dimensions.member.1.Value=Big'
          + '&Signature=YYY')
      .reply(200, "<PutMetricDataResponse xmlns=\"http://monitoring.amazonaws.com/doc/2010-08-01/\">\n"
                + "  <ResponseMetadata>\n"
                + "    <RequestId>647811f9-64a4-11e1-b90b-37543abc7638</RequestId>\n"
                + "  </ResponseMetadata>\n"
                + "</PutMetricDataResponse>\n"
                , { 'x-amzn-requestid': '6c14f231-63e8-11e1-bc02-390405fef36d'
                  , 'content-type': 'text/xml'
                  , 'content-length': '212'
                  , date: 'Thu, 01 Mar 2012 21:49:29 GMT' })
  }

  var namespace = cw('YOUR-KEY-HERE', 'uSfLP0jkHmdLU+BoltiPik/u0fD96lIBQfN6Yjiu')
    .namespace('NameSpaceHere')
  var metric1 = namespace
                .metric('Metric1')

  var metric2 = namespace
                .metric('Metric2')
                .unit('Seconds')

  var metric3 = namespace
                .metric('Metric3')
                .dimensions({
                  Host:'Big'})

  namespace.put([ metric1.put(87)
                , metric2.put(99)
                , metric3.put(33)]
              , function (err, reqId, obj) {
                  t.ok(!err)
                  t.equal('6c14f231-63e8-11e1-bc02-390405fef36d', reqId)
                  t.end()
              })

})


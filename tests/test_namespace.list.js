var cw      = require('../')

var nock    = require('nock')
var test    = require('tap').test

var con     = require('./constants.js')
var key     = con.key
var secret  = con.secret

test('test namespace.list', function(t) {

  if (con.proxy) {
    nock('https://monitoring.amazonaws.com')
    .filteringPath(function(path) {
        return path
                .replace(/Timestamp=[^&]*/g, 'Timestamp=XXX')
                .replace(/Signature=[^&]*/g, 'Signature=YYY')
      })
      .get( '/?AWSAccessKeyId=YOUR-KEY-HERE'
          + '&Action=ListMetrics'
          + '&Namespace=Disk_Space'
          + '&SignatureMethod=HmacSHA256'
          + '&SignatureVersion=2'
          + '&Timestamp=XXX'
          + '&Version=2010-08-01'
          + '&Signature=YYY')
      .reply(200, "<ListMetricsResponse xmlns=\"http://monitoring.amazonaws.com/doc/2010-08-01/\">\n"
                + "  <ListMetricsResult>\n"
                + "    <Metrics>\n"
                + "      <member>\n"
                + "        <Dimensions>\n"
                + "          <member>\n"
                + "            <Name>Drive</Name>\n"
                + "            <Value>System</Value>\n"
                + "          </member>\n"
                + "          <member>\n"
                + "            <Name>Host</Name>\n"
                + "            <Value>IP-0ACC5231</Value>\n"
                + "          </member>\n"
                + "          <member>\n"
                + "            <Name>DriveLetter</Name>\n"
                + "            <Value>C</Value>\n"
                + "          </member>\n"
                + "        </Dimensions>\n"
                + "        <MetricName>DiskSpace</MetricName>\n"
                + "        <Namespace>Disk_Space</Namespace>\n"
                + "      </member>\n"
                + "      <member>\n"
                + "        <Dimensions>\n"
                + "          <member>\n"
                + "            <Name>Drive</Name>\n"
                + "            <Value>System</Value>\n"
                + "          </member>\n"
                + "          <member>\n"
                + "            <Name>Host</Name>\n"
                + "            <Value>IP-0AC349AB</Value>\n"
                + "          </member>\n"
                + "          <member>\n"
                + "            <Name>DriveLetter</Name>\n"
                + "            <Value>C</Value>\n"
                + "          </member>\n"
                + "        </Dimensions>\n"
                + "        <MetricName>DiskSpace</MetricName>\n"
                + "        <Namespace>Disk_Space</Namespace>\n"
                + "      </member>\n"
                + "    </Metrics>\n"
                + "  </ListMetricsResult>\n"
                + "  <ResponseMetadata>\n"
                + "    <RequestId>a3ce4762-63e9-11e1-ad07-79106d4904a3</RequestId>\n"
                + "  </ResponseMetadata>\n"
                , { 'x-amzn-requestid': '6c14f231-63e8-11e1-bc02-390405fef36d'
                  , 'content-type': 'text/xml'
                  , 'content-length': '808'
                  , date: 'Thu, 01 Mar 2012 21:49:29 GMT' })
  }

  // TODO need to have more then one metric
  cw(key, secret)
    .namespace('Disk_Space')
    .list(function(err, obj) {
      console.log(err)
      console.log(obj)
      t.end()
    })

})



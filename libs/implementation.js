var request       = require('request')
  , crypto        = require('crypto')
  , url           = require('url')
  , querystring   = require('querystring')
  , toJson        = require('sax2json').toJson

module.exports = {putMetricData       : putMetricData
                , getMetricStatistics : getMetricStatistics
                , listMetrics         : listMetrics
                , transport           : transport
                , ISODateString       : ISODateString}

// AWS CloudWatch PutMetricData
// see:
// http://docs.amazonwebservices.com/AmazonCloudWatch/latest/APIReference/API_PutMetricData.html
function putMetricData(awskey, secret, host, namespace, ts, op) {

  if (!Array.isArray(op)) {
    op = [op]
  }
  var qs = baseQS(awskey, 'PutMetricData', ts, namespace)

  op.forEach(function addMetricData(metric, i) {

    // You need to give me something that makes sense
    if (!metric) {
      return
    } else if (!metric.name && !metric.value) {
      return
    }

    // Metric's are not 0 indexed
    i += 1
    qs['MetricData.member.' + i + '.MetricName']  = metric.name
    qs['MetricData.member.' + i + '.Value']       = metric.value
    if (metric.unit) {
      qs['MetricData.member.' + i + '.Unit']      = metric.unit
    }

    if (metric.dimensions) {
       Object.keys(metric.dimensions)
        .forEach(function addDimensions(key, c) {
            // Dimensions are not 0 indexed
            c += 1
            qs['MetricData.member.' + i
             + '.Dimensions.member.' + c
             + '.Name']   = key
            qs['MetricData.member.' + i
             + '.Dimensions.member.' + c
             + '.Value']  = metric.dimensions[key]
          })
    }
  })
  qs.Signature = signature('GET', host, qs, secret)
  return qs
}

// AWS CloudWatch ListMetrics
// see:
// http://docs.amazonwebservices.com/AmazonCloudWatch/latest/APIReference/API_ListMetrics.html
function listMetrics(awskey, secret, host, namespace, metric) {
  var qs = baseQS(awskey
                , 'ListMetrics'
                , ISODateString(new Date())
                , namespace)

  // TODO throw if missing values

  if (metric) {
    qs.MetricName   = metric.name

    if (metric.dimensions) {
      Object.keys(metric.dimensions)
          .forEach(function addDimensions(key, i) {
              // Dimensions are not 0 indexed
              i += 1
              qs['Dimensions.member.' + i
               + '.Name']   = key
              qs['Dimensions.member.' + i
               + '.Value']  = metric.dimensions[key]
            })
      }
  }

  qs.Signature = signature('GET', host, qs, secret)

  return qs
}

// AWS CloudWatch GetMetricStatistics
// see:
// http://docs.amazonwebservices.com/AmazonCloudWatch/latest/APIReference/API_GetMetricStatistics.html
function getMetricStatistics(awskey, secret, host, namespace, op) {
 var qs = baseQS( awskey
                , 'GetMetricStatistics'
                , ISODateString(new Date())
                , namespace)

  // TODO throw if missing values

  qs.MetricName = op.name
  qs.StartTime  = op.start
  qs.EndTime    = op.end
  qs.Unit       = op.unit
  qs.Period     = op.period // in sec, must be multiple of 60

  op.statistics.forEach(function addStat(stat, i) {
    // Statistics are not zero indexed
    i += 1
    qs['Statistics.member.' + i] = stat
  })

  if (op.dimensions) {
    Object.keys(op.dimensions)
        .forEach(function addDimensions(key, i) {
            // Dimensions are not 0 indexed
            i += 1
            qs['Dimensions.member.' + i
             + '.Name']   = key
            qs['Dimensions.member.' + i
             + '.Value']  = op.dimensions[key]
          })
  }

  qs.Signature = signature('GET', host, qs, secret)

  return qs
}

// AWS CloudWatch signature ver 2 HmacSHA256
// see:
// http://docs.amazonwebservices.com/AmazonCloudWatch/latest/DeveloperGuide/choosing_your_cloudwatch_interface.html#Using_Query_API
// step 2
function signature(action, host, qs, secret) {

  // build string to hash
  var tmp = action + '\n'         // HTTPVerb
      + host.toLowerCase() + '\n' // ValueOfHostHeaderInLowercase
      + '/\n'                     // HTTPRequestURI
      + Object.keys(qs)           // CanonicalizedQueryString
              .sort()
              .map(function sortParams(key) {
                return querystring.escape(key)
                      + '='
                      + querystring.escape(qs[key])
              })
              .join('&')

  // give it back
  return crypto
          .createHmac('sha256', secret)
          .update(tmp)
          .digest('base64')
}

// Helper to build up an object with common paramaters
// see:
// http://docs.amazonwebservices.com/AmazonCloudWatch/latest/APIReference/CommonParameters.html
// I added namespace becuase it falls nicely into this implementation
function baseQS(awskey, action, ts, namespace) {
  return {'AWSAccessKeyId': awskey
        , 'Action': action
        , 'Namespace': namespace
        // this value and the createHash in signature should follow
        , 'SignatureMethod': 'HmacSHA256'
        , 'SignatureVersion': 2
        , 'Timestamp': ts
        , 'Version': '2010-08-01'}
}

function ISODateString(d){
  function pad(n){return n<10 ? '0'+n : n}
  return d.getUTCFullYear()+'-'
      + pad(d.getUTCMonth()+1)+'-'
      + pad(d.getUTCDate())+'T'
      + pad(d.getUTCHours())+':'
      + pad(d.getUTCMinutes())+':'
      + pad(d.getUTCSeconds())+'Z'
}


function transport(host, protocol, qs, cb) {
  var uri = url.format({protocol  : protocol
                      , host      : host
                      , query     : qs})

    request.get({uri: uri}
                , parseReturn(cb))
}

function parseReturn(cb) {
  return function parseReturn(err, res, body) {
    if (err) {
      cb(err)
    }

    var reqID = res.headers['x-amzn-requestid']

    if (typeof cb === 'function') {
      toJson( body
            , { lowercasetags : true
              , objects       : true }
            , function ret(err, obj) {

                if (res.statusCode === 200) {
                  cb(null, reqID, obj)
                } else {
                  var errmsg = body
                  if (   obj
                      && obj.errorresponse
                      && obj.errorresponse.error
                      && obj.errorresponse.error.message) {
                    errmsg = obj.errorresponse.error.message
                  }
                  cb(errmsg, reqID)
                }
      })
    }
  }
}

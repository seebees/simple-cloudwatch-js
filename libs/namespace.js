var newMetric       = require('./metric.js')
  , implementation  = require('./implementation.js')
  , putMetricData   = implementation.putMetricData
  , listMetrics     = implementation.listMetrics
  , transport       = implementation.transport
  , ISODateString   = implementation.ISODateString

module.exports = newNameSpace

function newNameSpace(awskey, secret, host, protocol) {
  function NameSpace(namespace) {
    // TODO validate namespace len < 255

    var metric = newMetric( awskey
                          , secret
                          , host
                          , protocol
                          , namespace)

    metric.put = put
    metric.list = list
    return metric

    function put() {

      var args = Array.prototype.slice.call(arguments)
        , cb
        , metrics = []

      // Pop off the last argument if it is a callback
      if (typeof args[args.length - 1] === 'function') {
        cb = args.pop()
      }

      // if you give me some kind of crazy crap, find the
      // objects so I can send them up
      if (args.length === 1 && !Array.isArray(args[0])) {
        metrics = args
      } else if (args.length === 1 && !Array.isArray(args[0])) {
        args[0].forEach(mergeMetrics)
      } else {
        args.forEach(mergeMetrics)
      }

      transport(host
              , protocol
              , putMetricData(awskey
                            , secret
                            , host
                            , namespace
                            , ISODateString(new Date())
                            , metrics)
              , cb)

      function mergeMetrics(each) {
        if (Array.isArray(each)) {
          each.forEach(mergeMetrics)
        } else {
          metrics.push(each)
        }
      }
    }

    function list(cb) {

      if (typeof cb !== 'function') {
        // throw
      }

      transport(host
              , protocol
              , listMetrics(awskey
                          , secret
                          , host
                          , namespace)
              , makeList)

      function makeList(err, reqId, obj) {

        if (err) {
          cb(err, reqId, obj)
        }

        // TODO some kind of structure check
        obj = obj.listmetricsresponse
                  .listmetricsresult
                  .metrics
                  .member
                  .map(function(member) {
                    return NameSpace(namespace)
                            .metric(member.metricname)
                            .dimensions(member.dimensions
                                                .member)})

        cb(err, obj)
      }
    }
  }

  NameSpace.namespace = NameSpace
  return NameSpace
}


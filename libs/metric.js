var implementation      = require('./implementation.js')
  , putMetricData       = implementation.putMetricData
  , getMetricStatistics = implementation.getMetricStatistics
  , listMetrics         = implementation.listMetrics
  , transport           = implementation.transport
  , ISODateString       = implementation.ISODateString
  , isDate              = require('util').isDate
  , isArray             = require('util').isArray

module.exports = newMetric

function newMetric(awskey, secret, host, protocol, namespace) {

  Metric.metric = Metric
  return Metric

  function Metric(name) {
    // TODO validate len name < 255

    // a place to store options as they are set
    // TODO handle unit?  Required for get, not for put...
    var _metric = { unit        : false
                  , dimensions  : false
                  , period      : 60
                  , statistics  : ['Average']
                  , start       : false   // start and end are defaulted at
                  , end         : false   // run time for get
                  , name        : name
                  , namespace   : namespace}


    return decorate(put
                  , get, list, _metric)

    // base function.  Used to put a value onto a metric
    function put(value, op, cb) {

      if (typeof value !== 'number') {
        // TODO throw error
      }

      var ts
      op = op || {}

      if (typeof op === 'function') {
        cb = op
        op = {}
        ts = ISODateString(new Date())
      } else if (typeof op === 'string') {
        // I assume you have given me an ISO 8601 timestamp
        ts = op
        op = {}
      } else if (isDate(op)) {
        ts = ISODateString(ts)
      } else {
        ts = ISODateString(new Date())
      }

      var metric = {
          namespace   : namespace
        , name        : name
        , value       : value
        , unit        : op.unit       || _metric.unit
        , dimensions  : op.dimensions || _metric.dimensions}

      // TODO return request stream? vs metric obj?
      if (typeof cb === 'function') {
        transport(host
                , protocol
                , putMetricData(awskey
                              , secret
                              , host
                              , namespace
                              , ts
                              , metric)
                , cb)
      }

      return metric
    }

    // just what it says, get values from CloudWatch
    function get(op, cb) {
      op = op || {}
      if (typeof op === 'function') {
        cb = op
        op = {}
      }

      var metric = {
          name      : name
        , unit      : op.unit       || _metric.unit
        , dimensions: op.dimensions || _metric.dimensions
        , statistics: op.statistics || _metric.statistics
        , period    : op.period     || _metric.period
        , start     : op.start      || _metric.start              // 1 hour
                                    || ISODateString(new Date() - 60*60*1000)
        , end       : op.end        || _metric.end
                                    || ISODateString(new Date())}

      if (typeof cb === 'function') {
        transport(host
                , protocol
                , getMetricStatistics(awskey
                                    , secret
                                    , host
                                    , namespace
                                    , metric)
                , makeResponse)
      } else {
        throw new Error('get requires a callback')
      }

      return put

      function makeResponse(err, reqId, obj) {

        if (err) {
          return cb(err, reqId)
        }

        var ret = obj
                  .getmetricstatisticsresponse
                  .getmetricstatisticsresult
                  .datapoints
                  .member

        ret = ret || []
        cb(err, ret)
      }
    }

    // Helper to list out metrics.  In case you don't know
    function list(op, cb) {
      op = op || {}
      if (typeof op === 'function') {
        cb = op
        op = {}
      }

      var metric = {
          name      : name
        , dimensions: op.dimensions || _metric.dimensions}

      if (typeof cb === 'function') {
        transport(host
                , protocol
                , listMetrics(awskey
                            , secret
                            , host
                            , namespace
                            , metric)
                , makeList)
      } else {
        throw new Error('list requires a callback')
      }

      return put

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
                    member = Metric(member.metricname)
                              .dimensions(member.dimensions
                                                  .member)
                    if (!op.raw) {
                      return member
                    } else {
                      return member.conf()
                    }
                  })

        cb(err, obj)
      }
    }
  }
}

var validStatistics = {
        average     : 'Average'
      , sum         : 'Sum'
      , samplecount : 'SampleCount'
      , maximum     : 'Maximum'
      , mimimum     : 'Minimum'}
  , validUnits = {
        seconds           : 'Seconds'
      , microseconds      : 'Microseconds'
      , milliseconds      : 'Milliseconds'
      , bytes             : 'Bytes'
      , kilobytes         : 'Kilobytes'
      , megabytes         : 'Megabytes'
      , gigabytes         : 'Gigabytes'
      , terabytes         : 'Terabytes'
      , bits              : 'Bits'
      , kilobits          : 'Kilobits'
      , megabits          : 'Megabits'
      , gigabits          : 'Gigabits'
      , terabits          : 'Terabits'
      , percent           : 'Percent'
      , count             : 'Count'
      , 'bytes/second'    : 'Bytes/Second'
      , 'kilobytes/second': 'Kilobytes/Second'
      , 'megabytes/second': 'Megabytes/Second'
      , 'gigabytes/second': 'Gigabytes/Second'
      , 'terabytes/second': 'Terabytes/Second'
      , 'bits/second'     : 'Bits/Second'
      , 'kilobits/second' : 'Kilobits/Second'
      , 'megabits/second' : 'Megabits/Second'
      , 'gigabits/second' : 'Gigabits/Second'
      , 'terabits/second' : 'Terabits/Second'
      , 'count/second'    :'Count/Second'
      , none              : 'None'}

// Decorate the put fuction with some convenience methods
function decorate(put, get, list, _metric) {

  put.unit        = unit
  put.statistics  = statistics
  put.period      = period
  put.dimensions  = dimensions
  put.start       = start
  put.end         = end
  put.get         = get
  put.list        = list
  put.put         = put
  put.conf        = conf
  put.endByEvents = endByEvents

  return put

  // Option setter for AWS CloudWatch Metric Unit
  // see:
  // http://docs.amazonwebservices.com/AmazonCloudWatch/latest/DeveloperGuide/cloudwatch_concepts.html#Unit
  function unit(unit) {
    if (    typeof unit === 'string' && validUnits[unit.toLowerCase()]) {
        _metric.unit = validUnits[unit.toLowerCase()]
      } else if (!unit) {
        _metric.unit = validUnits['none']
      } else {
        // TODO throw error
      }
      return put
    }


  // Option setter for AWS CloudWatch Metric Statistics
  // see:
  // http://docs.amazonwebservices.com/AmazonCloudWatch/latest/DeveloperGuide/cloudwatch_concepts.html#Statistics
  function statistics(stat) {
    // TODO it would be nice to have an interface to request
    // multiple stats at the same time...  Untill that day, be a little lazy
    if (    typeof stat === 'string' && validStatistics[stat.toLowerCase()]) {
      _metric.statistics = [validStatistics[stat.toLowerCase()]]
    } else if (!stat) {
      // TODO throw error (required value)
    } else {
      // TODO throw error
    }
    return put
  }

  // Option setter for AWS CloudWatch Metric Period
  // see:
  // http://docs.amazonwebservices.com/AmazonCloudWatch/latest/DeveloperGuide/cloudwatch_concepts.html#CloudWatchPeriods
  function period(period) {
    if (period && typeof period === 'number') {
      if (!(period % 60)) {
        _metric.period = period
      } else {
        // TODO throw error
      }
    } else if (!period) {
      // TODO throw error (required value)
    } else {
      // TODO throw error
    }

    return put
  }


  // Option setter for AWS CloudWatch Metric Dimensions
  // see:
  // http://docs.amazonwebservices.com/AmazonCloudWatch/latest/DeveloperGuide/cloudwatch_concepts.html#Dimension
  function dimensions(dimensions) {
    // TODO validation
    if (dimensions) {
      if (isArray(dimensions)) {
        var tmp = {}
        dimensions.forEach(function(i) {
          tmp[i.name] = i.value})
        _metric.dimensions = tmp
      } else {
        _metric.dimensions = dimensions
      }
    } else {
      _metric.dimensions = false
    }

    return put
  }

  // Option setters for start and end
  // TODO need to do validation as well as formating
  function start(value) {
    if (typeof value === 'string') {
      _metric.start = value
    } else if (isDate(value)) {
      _metric.start = ISODateString(value)
    } else {
      _metric.start = false
    }

    return put
  }

  function end(value) {
    if (typeof value === 'string') {
      _metric.end = value
    } else if (isDate(value)) {
      _metric.end = ISODateString(value)
    } else {
      _metric.end = value
    }

    return put
  }

  function endByEvents(eventsInPeriod, moveStartToEnd) {
    if (moveStartToEnd && _metric.end) {
      start(_metric.end)
    } else {
      // throw
    }

    if (!_metric.start) {
      // throw
    }

    var newEnd = new Date(_metric.start)
    newEnd.setSeconds(newEnd.getSeconds()
                        + eventsInPeriod * _metric.period *  1440)
    end(newEnd)

    return put
  }

  function conf() {
    return JSON.parse(JSON.stringify(_metric))
  }
}

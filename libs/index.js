var newNamespace = require('./namespace.js')

module.exports = CloudWatch

// val(3, cb)
// http://docs.amazonwebservices.com/AmazonCloudWatch/latest/APIReference/API_MetricDatum.html?r=4756
//

function CloudWatch(awskey, secret, host, protocol) {
  host      = host      || 'monitoring.amazonaws.com'
  protocol  = protocol  || 'https'

  return newNamespace(awskey
                    , secret
                    , host
                    , protocol)
}



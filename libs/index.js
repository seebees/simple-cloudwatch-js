var newNamespace = require('./namespace.js')

module.exports = CloudWatch

// val(3, cb)
// http://docs.amazonwebservices.com/AmazonCloudWatch/latest/APIReference/API_MetricDatum.html?r=4756
//

function CloudWatch(awskey, secret, host, protocol) {
  host      = host      || 'monitoring.amazonaws.com'
  protocol  = protocol  || 'https'

  if (!awskey || !secret) {
    throw new Error('Key and secret is required')
  }

  return newNamespace(awskey
                    , secret
                    , host
                    , protocol)
}



AWS CloudWatch Node Client
-------------

Getting Started
==============

Install:

    npm install ironmq

The Basics
=========

**Put** a value:

    var cw = require('simple-cloudwatch')
    
    cw('key', 'secret')
      .namespace('ServerResponse')      // Namespace Grouping
      .metric('Latency')                // Metric Grouping (easy to see on one graph)
      .unit('Seconds')                  // Uh, the units
      .dimensions({ Host: 'Big'         // sub grouping withing a metric
                  , App : 'small'})
      .put(87                           // the actual value logged
        , function callBack(err
                        , reqID         // reqID from AWS
                        , obj) {})      // the body XML as json      

**Get** values:

    var cw = require('simple-cloudwatch')
    
    cw('key', 'secret')
      .namespace('ServerResponse')      // Namespace Grouping
      .metric('Latency')                // Metric Grouping (easy to see on one graph)
      .unit('Seconds')                  // Uh, the units
      .dimensions({ Host: 'Big'         // sub grouping withing a metric
                  , App : 'small'})
      .get(function callBack(err
                        , obj) {})      // the itmes as json 

A little bit more
==========

The level of organization is

* key/secrete
* namespace
* metric

Each level is a function, so while you can chain everything, you can also
pass the function on to someone else.

    var cw = require('simple-cloudwatch')
    
    var put = cw('key', 'secret')
                .namespace('ServerResponse')
                .metric('Latency')
                .unit('Seconds')
                .put
    
    put(87)
    put(53)
    goDoSomethingAndPut(info, put, cb)


put and get both take an options argument to override any curried values.
However you can not change key, namespace, or metrics with this option

    var cw = require('simple-cloudwatch')
    
    var put = cw('key', 'secret')
                .namespace('ServerResponse')
                .metric('Latency')
                .unit('Seconds')
                .put
    
    put(1024, {unit:'bytes'}, cb)


If you call put without a callback it assumes that you want to build
a batch of puts to send all at once.  In this case it returns an
object to alow you to do that.  This version of put will take
almost any combination of objects and arrays, and look for a
callback at the end

    var cw  = require('simple-cloudwatch')
      , ns  = cw('key', 'secret')
                .namespace('ServerResponse')
      , put = ns.metric('Latency')
                .unit('Seconds')
                .put
    
    ns.put([put(1024, {unit:'bytes'}, put(87)], cb)

Both metric and namespace have a list function to return posible
values for get

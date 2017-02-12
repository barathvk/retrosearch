global.config = require('config')
global.logger = require('simple-node-logger').createSimpleLogger({
  timestampFormat: 'HH:mm:ss'
})
global.outdent = require('outdent')
global._ = require('lodash')
global.axios = require('axios')

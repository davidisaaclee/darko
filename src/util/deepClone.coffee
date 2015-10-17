_ = require 'lodash'

module.exports = deepClone = (obj) ->
  result = _.clone obj
  if typeof result is 'object'
  then _.mapValues result, (value, key) -> deepClone value
  else result
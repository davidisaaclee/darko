_ = require 'lodash'

module.exports = deepClone = (obj) ->
  result = _.clone obj
  switch obj.constructor
    when Object
      _.mapValues result, (value, key) -> deepClone value
    when Array
      _.map result, (value) -> deepClone value
    else result
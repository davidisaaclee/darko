_ = require 'lodash'

# lol, completely missed _.cloneDeep; keeping this around in case it's useful?
# delete if you want though
module.exports = deepClone = (obj) ->
  result = _.clone obj
  switch obj.constructor
    when Object
      _.mapValues result, (value, key) -> deepClone value
    when Array
      _.map result, (value) -> deepClone value
    else result
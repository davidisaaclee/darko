_ = require 'lodash'
base = require '../timeline'
timelines = [ require './KeyframeTimeline' ]
vtable = require '../../util/vtable'

###
Vtable for dynamic dispatch of timeline methods.
###


extensions = timelines.reduce ((o, t) ->
  o[base.typeOf t] = t
  return o), {}

table = vtable (({type}) -> type), base, extensions

module.exports = _.extend table,
  Reducers:
    sum: 'sum'    


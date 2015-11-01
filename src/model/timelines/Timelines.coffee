_ = require 'lodash'
base = require './Timeline'
timelines = [ require './KeyframeTimeline'
              require './GenericTimeline' ]
vtable = require '../../util/vtable'

###
Vtable for dynamic dispatch of timeline methods.
###


extensions = timelines.reduce ((o, t) ->
  o[base.typeOf t] = t
  return o), {}

table = vtable base.typeOf, base, extensions

module.exports = table
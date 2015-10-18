_ = require 'lodash'
k = require './ActionTypes'

updeep = require 'updeep'

# TODO: Should we be using updeep instead?
# https://github.com/substantial/updeep
# Mapping over deep objects / arrays seems pretty cumbersome compared to
#   `mapAssign()`'s wildcard paradigm; but the wildcards might be less efficient
#   than `updeep`'s `map()`.
# `updeep` also seems better for editing multiple paths.
mapAssign = require './util/mapAssign'

baseReducer = require './reducers/base'

###
State ::=
  timelines: { id -> Timeline }
  entities: { id -> Entity | '_nextId': () -> String }

Timeline ::=
  # Progress along the timeline is scaled by its `length`.
  # If timeline A has 2x the length of timeline B, it should take twice as long
  #   to progress along A as to progress along B.
  length: Number
  triggers: [Trigger]
  mappings: [] # TODO

Entity ::=
  attachedTimelines: [EntityTimelineRelation]

Trigger ::=
  # When `position` is a float, the trigger's `action` is performed when
  #   `progress` crosses that float.
  # When `position` is a function, it is called on every progress update,
  #   providing as arguments `newProgress, oldProgress`. If the function returns
  #   `true`, the trigger's `action` is performed.
  position: Float | Function
  action: Function

EntityTimelineRelation ::=
  id: String
  progress: Float
###

module.exports = baseReducer
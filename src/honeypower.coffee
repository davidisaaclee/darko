redux = require 'redux'
_ = require 'lodash'
k = require './ActionTypes'

# TODO: Should we be using updeep instead?
# https://github.com/substantial/updeep
# Mapping over deep objects / arrays seems pretty cumbersome compared to
#   `mapAssign()`'s wildcard paradigm; but the wildcards might be less efficient
#   than `updeep`'s `map()`.
# `updeep` also seems better for editing multiple paths.
mapAssign = require './util/mapAssign'

###
State ::=
  timelines: { id -> Timeline }
  entities: { id -> Entity }

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


baseStateReducer = (state = {}, action) ->
  if action.type is k.ProgressEntityTimeline
    {entity, timelines, delta} = action.data

    mapAssign (_.cloneDeep state),
      'entities.*.attachedTimelines.*.progress',
      (oldProgress, wildcardVals, wildcards) ->
        [entityId, timelineIdx] = wildcards
        [entityObj, attachedTimeline] = wildcardVals

        # Check if this timeline is one of the ones we want to update.
        if (entityId == entity) and (_.contains timelines, attachedTimeline.id)
          timeline = state.timelines[attachedTimeline.id]
          progressDelta = delta / timeline.length
          newProgress = oldProgress + progressDelta

          # Trigger any triggers needed triggering.
          timeline.triggers
            .filter (trigger) ->
              if _.isNumber trigger.position
                return (oldProgress < trigger.position <= newProgress)
              else if _.isFunction trigger.position
                return trigger.position newProgress, oldProgress
              else
                console.warn 'Invalid trigger position on trigger', trigger
                return false
            .forEach (trigger) ->
              do trigger.action

          return newProgress

        # Otherwise, just return the existing value.
        else
          return oldProgress
  else state


timelineReducer = (state = {}, action) ->
  if action.type is k.AddTrigger
    {timeline, position, action} = action.data
    mapAssign (_.cloneDeep state),
      "#{timeline}.triggers",
      (value) -> [value..., {position: position, action: action}]
  else state


combinedReducer = (state = {}, action) ->
  state = baseStateReducer state, action

  childReducers =
    'timelines': timelineReducer

  # `acc` will hold our state as it gets updated by each reducer
  # `key` is the key of the reducer, as well as the substate's path
  reduceOverChildren = (acc, key) ->
    changedState = {}
    changedState[key] = childReducers[key] acc[key], action
    _.assign {}, acc, changedState

  result = Object.keys childReducers
    .reduce reduceOverChildren, state

  # freeze this to ensure we're not accidentally mutating
  Object.freeze result
  return result

module.exports = combinedReducer
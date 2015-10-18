redux = require 'redux'
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


baseStateReducer = (state = {}, action) ->
  switch action.type
    when k.ProgressEntityTimeline
      {entity, timelines, delta} = action.data

      mapAssign (_.cloneDeep state),
        'entities.dict.*.attachedTimelines.*.progress',
        (oldProgress, wildcardVals, wildcards) ->
          [entityId, timelineIdx] = wildcards
          [entityObj, timelineRelation] = wildcardVals

          # Check if this timeline is one of the ones we want to update.
          if (entityId == entity) and (_.contains timelines, timelineRelation.id)
            timeline = state.timelines.dict[timelineRelation.id]
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
                trigger.action entityId

            # Update all mappings.
            timeline.mappings
              .forEach (mapping) ->
                mapping newProgress, oldProgress, entityId

            return newProgress

          # Otherwise, just return the existing value.
          else
            return oldProgress

    when k.AttachEntityToTimeline
      {entity, timeline, progress} = action.data
      if not progress?
        progress = 0

      newAttachedTimeline =
        id: timeline
        progress: progress

      mapAssign (_.cloneDeep state),
        "entities.dict.#{entity}.attachedTimelines",
        (oldAttachedTimelines) -> [oldAttachedTimelines..., newAttachedTimeline]



    else state


timelineReducer = (state = {dict: {}, _spawnedCount: 0}, action) ->
  switch action.type
    when k.AddTimeline
      {length} = action.data

      changes =
        dict: {}
        _spawnedCount: state._spawnedCount + 1
      # new entity
      changes.dict["timeline-#{state._spawnedCount}"] =
        length: length
        triggers: []
        mappings: []

      updeep changes, state

    when k.AddTrigger
      {timeline, position, action} = action.data
      mapAssign (_.cloneDeep state),
        "dict.#{timeline}.triggers",
        (oldTriggers) -> [oldTriggers..., {position: position, action: action}]

    when k.AddMapping
      {timeline, mapping} = action.data
      mapAssign (_.cloneDeep state),
        "dict.#{timeline}.mappings",
        (oldMappings) -> [oldMappings..., mapping]

    else state


entityReducer = (state = {dict: {}, _spawnedCount: 0}, action) ->
  switch action.type
    when k.AddEntity
      {} = action.data

      changes =
        dict: {}
        _spawnedCount: state._spawnedCount + 1
      # new entity
      changes.dict["entity-#{state._spawnedCount}"] =
        attachedTimelines: []

      updeep changes, state

    else state


combinedReducer = (state = {}, action) ->
  childReducers =
    'timelines': timelineReducer
    'entities': entityReducer

  # `acc` will hold our state as it gets updated by each reducer
  # `key` is the key of the reducer, as well as the substate's path
  reduceOverChildren = (acc, key) ->
    changedState = {}
    changedState[key] = childReducers[key] acc[key], action

    # _.assign {}, acc, changedState
    _.assign acc, changedState
  state = _.assign {}, state

  result = Object.keys childReducers
    .reduce reduceOverChildren, state

  result = baseStateReducer result, action

  # freeze this to ensure we're not accidentally mutating
  Object.freeze result
  return result

module.exports = combinedReducer
_ = require 'lodash'
updeep = require 'updeep'
k = require '../ActionTypes'
mapAssign = require '../util/mapAssign'
addChildReducers = require '../util/addChildReducers'

timelinesReducer = require './timelines'
entitiesReducer = require './entities'


reducer = (state = {}, action) ->
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


module.exports = addChildReducers reducer,
  'timelines': timelinesReducer
  'entities': entitiesReducer
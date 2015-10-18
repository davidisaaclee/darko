_ = require 'lodash'
updeep = require 'updeep'
k = require '../ActionTypes'

mapAssign = require '../util/mapAssign'
addChildReducers = require '../util/addChildReducers'

clamp = require '../util/clamp'
wrap = require '../util/wrap'

timelinesReducer = require './timelines'
entitiesReducer = require './entities'



reducer = (state = {}, action) ->
  switch action.type
    when k.ProgressEntityTimeline
      {entity, timelines, delta} = action.data
      entityObj = state.entities.dict[entity]

      performTriggers = (entityId, timelineObj, oldProgress, newProgress) ->
        timelineObj.triggers
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

      entityChanges =
        attachedTimelines: updeep.map (attachedTimeline) ->
          if _.contains timelines, attachedTimeline.id
            timelineObj = state.timelines.dict[attachedTimeline.id]
            progressDelta = delta / timelineObj.length
            oldProgress = attachedTimeline.progress
            newProgress =
              if timelineObj.shouldLoop
              then wrap 0, 1, oldProgress + progressDelta
              else clamp 0, 1, oldProgress + progressDelta

            # Trigger any triggers needed triggering.
            performTriggers entity, timelineObj, oldProgress, newProgress

            updeep.update {progress: newProgress}, attachedTimeline

          else
            attachedTimeline

      stateWithUpdatedProgress =
        updeep.updateIn "entities.dict.#{entity}",
          entityChanges,
          state

      # Update all mappings.
      dataChanges =
        data: do ->
          applyMapping = (progress) -> (entityData, mapping) ->
            _.assign {}, entityData,
              mapping progress, entity, entityData

          # for every attached timeline...
          entityObj.attachedTimelines.reduce ((data, attachedTimeline, idx) ->
            # ... apply every mapping, threading the `data` through
            timeline = state.timelines.dict[attachedTimeline.id]
            updatedEntityObj = stateWithUpdatedProgress.entities.dict[entity]
            newProgress = updatedEntityObj.attachedTimelines[idx].progress
            timeline.mappings.reduce (applyMapping newProgress), data), entityObj.data

      updeep.updateIn "entities.dict.#{entity}",
        dataChanges,
        stateWithUpdatedProgress


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
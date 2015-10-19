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

      ###
      1. Update progress on entity-timeline relation.
      2. Check if the progress update triggered any triggers. Perform those
         triggers.
      3. Update all mappings. (TODO: Change this to only updating updated
         timelines' mappings.)
      ###

      # 1. Update progress on entity-timeline relation.
      entityObj = state.entities.dict[entity]

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

            updeep.update {progress: newProgress}, attachedTimeline

          else
            attachedTimeline

      updatedState =
        updeep.updateIn "entities.dict.#{entity}",
          entityChanges,
          state


      # 2. Check if the progress update triggered any triggers.
      #    Perform those triggers.
      newTimelines =
        updatedState.entities.dict[entity].attachedTimelines
      oldTimelines =
        state.entities.dict[entity].attachedTimelines

      applyTrigger = (newProgress, oldProgress) -> (entityData, trigger) ->
        shouldPerformTrigger = switch
          when _.isNumber trigger.position
            (oldProgress < trigger.position <= newProgress) or
            (newProgress < trigger.position <= oldProgress)
          when _.isFunction trigger.position
            trigger.position newProgress, oldProgress
          else
            console.warn 'Invalid trigger position on trigger', trigger
            false

        if shouldPerformTrigger
        then _.assign {}, entityData, (trigger.action newProgress, entity, entityData)
        else entityData

      reduceTriggers = (data, __, i) ->
        timelineObj = updatedState.timelines.dict[newTimelines[i].id]
        newProgress = newTimelines[i].progress
        oldProgress = oldTimelines[i].progress

        applyThisTrigger = applyTrigger newProgress, oldProgress
        timelineObj.triggers.reduce applyThisTrigger, data

      triggerChanges =
        data:
          newTimelines.reduce reduceTriggers,
            updatedState.entities.dict[entity].data

      updatedState = updeep.updateIn "entities.dict.#{entity}",
        triggerChanges,
        updatedState


      # 3. Update all mappings.
      dataChanges =
        data: do ->
          entityObj = updatedState.entities.dict[entity]
          applyMapping = (progress) -> (entityData, mapping) ->
            _.assign {}, entityData,
              mapping progress, entity, entityData

          # for every attached timeline...
          entityObj.attachedTimelines.reduce ((data, attachedTimeline, idx) ->
            # ... apply every mapping, threading the `data` through
            timeline = state.timelines.dict[attachedTimeline.id]
            updatedEntityObj = updatedState.entities.dict[entity]
            newProgress = updatedEntityObj.attachedTimelines[idx].progress
            timeline.mappings.reduce (applyMapping newProgress), data), entityObj.data

      updeep.updateIn "entities.dict.#{entity}",
        dataChanges,
        updatedState


    when k.AttachEntityToTimeline
      {entity, timeline, progress} = action.data
      mapAssign (_.cloneDeep state),
        "entities.dict.#{entity}.attachedTimelines",
        (oldAttachedTimelines) ->
          checkTimeline = (tmln) -> tmln.id isnt timeline
          isTimelineAlreadyAttached = _.all oldAttachedTimelines, checkTimeline
          if isTimelineAlreadyAttached
            if not progress?
              progress = 0
            newAttachedTimeline =
              id: timeline
              progress: progress
            [oldAttachedTimelines..., newAttachedTimeline]
          else
            oldAttachedTimelines



    else state


module.exports = addChildReducers reducer,
  'timelines': timelinesReducer
  'entities': entitiesReducer
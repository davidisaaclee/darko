_ = require 'lodash'
updeep = require 'updeep'
k = require '../ActionTypes'

mapAssign = require '../util/mapAssign'
addChildReducers = require '../util/addChildReducers'

clamp = require '../util/clamp'
wrap = require '../util/wrap'

timelinesReducer = require './timelines'
entitiesReducer = require './entities'

###
state ::= State
progressInfo ::= { timelineId -> {delta: Float, entities: [entityId]} } # for specific entities
               | { timelineId -> {delta: Float} } # for all attached entities
###
batchProgress = (state, progressInfo) ->
  state_ = mapAssign (_.cloneDeep state),
    'entities.dict.*.attachedTimelines.*.progress',
    (oldProgress, [entityObj, timelineObj], [entityId, timelineIdx]) ->
      timelineModel = state.timelines.dict[timelineObj.timeline]

      shouldUpdate =
        if progressInfo[timelineObj.timeline]?.entities?
        then _.contains entityId, progressInfo[timelineObj.timeline].entities
        else progressInfo[timelineObj.timeline]?

      progressDelta =
        if shouldUpdate
        then progressInfo[timelineObj.timeline].delta / timelineModel.length
        else 0

      newProgress =
        if timelineModel.shouldLoop
        then wrap 0, 1, oldProgress + progressDelta
        else clamp 0, 1, oldProgress + progressDelta

      return newProgress

  state__ = mapAssign state_,
    'entities.dict.*.data',
    (previousData, [entityObj], [entityId]) ->
      oldTimelines = state.entities.dict[entityId].attachedTimelines
      newTimelines = entityObj.attachedTimelines

      reduceTriggers = (data, __, i) ->
        timelineObj = state_.timelines.dict[newTimelines[i].timeline]
        newProgress = newTimelines[i].progress
        oldProgress = oldTimelines[i].progress

        applyThisTrigger = applyTrigger newProgress, oldProgress
        timelineObj.triggers.reduce applyThisTrigger, data

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
        then _.assign {}, entityData, (trigger.action newProgress, entityId, entityData)
        else entityData

      # NOTE: does not respect trigger position across entities -
      #   but if `Mapping`s truly do not modify anything but entity data,
      #   this shouldn't be a problem...
      # newTimelines.reduce reduceTriggers,
      #   state_.entities.dict[entityId].data

      triggersToInvoke = _ newTimelines
        .map (attachedTimeline, idx) ->
          oldProgress = oldTimelines[idx].progress
          newProgress = newTimelines[idx].progress

          state_.timelines.dict[attachedTimeline.timeline].triggers
            .filter (trigger) ->
              switch
                when _.isNumber trigger.position
                  (oldProgress < trigger.position <= newProgress) or
                  (newProgress < trigger.position <= oldProgress)
                when _.isFunction trigger.position
                  trigger.position newProgress, oldProgress
                else
                  console.warn 'Invalid trigger position on trigger', trigger
                  false
            .map (trigger) ->
              trigger: trigger
              oldProgress: oldProgress
              newProgress: newProgress
        .reduce ((p, e) -> Array.prototype.concat p, e), []

      _ triggersToInvoke
        .sortByOrder ({trigger, oldProgress, newProgress}) ->
          switch
            when _.isNumber trigger.position
              sign = (x) -> if x > 0 then 1 else if x < 0 then -1 else 0
              trigger.position * sign (newProgress - oldProgress)
            # when _.isFunction trigger.position
            #   # fun stuffffff let's find that crossing point i guess?
            else
              throw new Error 'Invalid trigger position on trigger: ' + trigger.position
        .reduce ((data, {trigger, newProgress}) ->
          _.assign {}, data, (trigger.action newProgress, entityId, data)),
          entityObj.data

  mapAssign state__,
    'entities.dict.*.data',
    (previousData, [entityObj], [entityId]) ->
      applyMapping = (progress) -> (entityData, mapping) ->
        _.assign {}, entityData,
          mapping progress, entityId, entityData

      # for every attached timeline...
      r = entityObj.attachedTimelines.reduce ((data, attachedTimeline, idx) ->
        # ... apply every mapping, threading the `data` through
        timeline = state__.timelines.dict[attachedTimeline.timeline]
        updatedEntityObj = state__.entities.dict[entityId]
        newProgress = updatedEntityObj.attachedTimelines[idx].progress
        timeline.mappings.reduce (applyMapping newProgress), data), entityObj.data



reducer = (state = {}, action) ->
  switch action.type
    when k.ProgressTimeline
      {timeline, delta} = action.data

      progressInfo = {}
      progressInfo[timeline] =
        delta: delta

      batchProgress state, progressInfo


    when k.ProgressEntityTimeline
      {entity, timeline, delta} = action.data

      progressInfo = {}
      progressInfo[timeline] =
        entities: [entity]
        delta: delta
      batchProgress state, progressInfo


    when k.AttachEntityToTimeline
      {entity, timeline, progress} = action.data

      mapAssign (_.cloneDeep state),
        "entities.dict.#{entity}.attachedTimelines",
        (oldAttachedTimelines) ->
          checkTimeline = (tmln) -> tmln.timeline isnt timeline
          isTimelineAlreadyAttached = _.all oldAttachedTimelines, checkTimeline
          if isTimelineAlreadyAttached
            if not progress?
              progress = 0
            newAttachedTimeline =
              timeline: timeline
              progress: progress
            [oldAttachedTimelines..., newAttachedTimeline]
          else
            oldAttachedTimelines



    else state


module.exports = addChildReducers reducer,
  'timelines': timelinesReducer
  'entities': entitiesReducer
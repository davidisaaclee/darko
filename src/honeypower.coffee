require 'redux'
_ = require 'lodash'
k = require './ActionTypes'


timelineReducer = (state, action) ->
  if state is undefined
    console.warn 'Reducer received no state.'

  switch action.type
    when k.DeltaTime
      {delta} = action.data

      # mapAssign {}, state, 'entities.*.attachedTimelines.*.progress', (val, wildcardVals, wildcards) ->
      #   [entity, attachedTimeline] = wildcardVals

      #   timelineLength = state.timelines[attachedTimeline.id].length
      #   progressDelta = delta / timelineLength

      #   return val + progressDelta

      entities =
        entities: _.mapValues state.entities, (entity, id) ->
          timelines =
            attachedTimelines: _.map entity.attachedTimelines, (timelineInfo) ->
              progressDelta = delta / state.timelines[timelineInfo.id].length
              progress = progress: timelineInfo.progress + progressDelta

              return _.assign timelineInfo, progress
          return _.assign entity, timelines
      return _.assign {}, state, entities


    when k.AddTrigger
      {position, action} = action.data

      _.assign {}, state


    else
      return state




module.exports =
  timelineReducer: timelineReducer
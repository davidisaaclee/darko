require 'redux'
_ = require 'lodash'
k = require './ActionTypes'


timelineReducer = (state, action) ->
  if state is undefined
    console.warn 'Reducer received no state.'

  switch action.type
    when k.DeltaTime
      {delta} = action.data

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
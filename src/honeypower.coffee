require 'redux'
_ = require 'lodash'
k = require './actionTypes'

initialState =
  timelines:
    'timeline1':
      length: 2
      triggers: []
      mappings: []
  entities:
    'entity1':
      attachedTimelines: [
        id: 'timeline1'
        progress: 0
      ]

timelineReducer = (state = initialState, action) ->
  switch action.type
    when k.DeltaTime
      {delta} = action

      return _.assign {}, state, {
        entities: _.mapValues state.entities, (entity, id) ->
          _.assign entity, {
            attachedTimelines: entity.attachedTimelines.map (timelineInfo) ->
              scaledDelta = delta / state.timelines[timelineInfo.id].length
              _.assign timelineInfo, {
                progress: timelineInfo.progress + scaledDelta
              }
          }
      }
    else
      return state


module.exports =
  timelineReducer: timelineReducer
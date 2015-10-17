require 'redux'
_ = require 'lodash'
k = require './ActionTypes'

mapAssign = require './util/mapAssign'


timelineReducer = (state, action) ->
  if state is undefined
    console.warn 'Reducer received no state.'

  switch action.type
    when k.DeltaTime
      {delta} = action.data

      # TODO: this might need to be a deep clone
      mapAssign (_.clone state),
        'entities.*.attachedTimelines.*.progress',
        (val, wildcardVals, wildcards) ->
          [entity, attachedTimeline] = wildcardVals

          timelineLength = state.timelines[attachedTimeline.id].length
          progressDelta = delta / timelineLength

          return val + progressDelta

    when k.AddTrigger
      {timeline, position, action} = action.data

      trigger =
        position: position
        action: action

      mapAssign (_.clone state),
        "timelines.#{timeline}.triggers",
        (value) -> [value..., trigger]

    else
      return state




module.exports =
  timelineReducer: timelineReducer
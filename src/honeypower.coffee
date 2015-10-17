require 'redux'
_ = require 'lodash'
k = require './ActionTypes'

mapAssign = require './util/mapAssign'
deepClone = require './util/deepClone'


timelineReducer = (state, action) ->
  if state is undefined
    console.warn 'Reducer received no state.'

  switch action.type
    when k.DeltaTime
      incrementAllTimelinesProgress state, action.data

    when k.AddTrigger
      addTrigger state, action.data

    else
      return state


incrementAllTimelinesProgress = (state, {delta}) ->
  mapAssign (deepClone state),
    'entities.*.attachedTimelines.*.progress',
    (val, wildcardVals, wildcards) ->
      [entity, attachedTimeline] = wildcardVals
      timelineLength = state.timelines[attachedTimeline.id].length
      progressDelta = delta / timelineLength
      return val + progressDelta


addTrigger = (state, {timeline, position, action}) ->
  mapAssign (deepClone state),
    "timelines.#{timeline}.triggers",
    (value) -> [value..., {position: position, action: action}]


module.exports =
  timelineReducer: timelineReducer
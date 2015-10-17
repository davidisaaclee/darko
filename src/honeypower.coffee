redux = require 'redux'
_ = require 'lodash'
k = require './ActionTypes'

# TODO: Should we be using updeep instead?
# https://github.com/substantial/updeep
# Mapping over deep objects / arrays seems pretty cumbersome compared to
#   `mapAssign()`...
mapAssign = require './util/mapAssign'
deepClone = require './util/deepClone'


timelineReducer = (state, action) ->
  if state is undefined
    console.warn 'Reducer received no state.'
  else deepClone state


baseStateReducer = (state = {}, action) ->
  if action.type is k.DeltaTime
    {delta} = action.data

    mapAssign (deepClone state),
      'entities.*.attachedTimelines.*.progress',
      (val, wildcardVals, wildcards) ->
        [entity, attachedTimeline] = wildcardVals
        timelineLength = state.timelines[attachedTimeline.id].length
        progressDelta = delta / timelineLength

        return val + progressDelta
  else deepClone state


timelineReducer = (state = {}, action) ->
  if action.type is k.AddTrigger
    {timeline, position, action} = action.data
    mapAssign (deepClone state),
      "#{timeline}.triggers",
      (value) -> [value..., {position: position, action: action}]
  else deepClone state


combinedReducer = (state = {}, action) ->
  state = baseStateReducer state, action

  childReducers =
    'timelines': timelineReducer

  # `acc` will hold our state as it gets updated by each reducer
  # `key` is the key of the reducer, as well as the substate's path
  reduceOverChildren = (acc, key) ->
    changedState = {}
    changedState[key] = childReducers[key] acc[key], action
    _.assign {}, acc, changedState

  Object.keys childReducers
    .reduce reduceOverChildren, state

module.exports = combinedReducer
_ = require 'lodash'
updeep = require 'updeep'
k = require '../ActionTypes'
mapAssign = require '../util/mapAssign'
addChildReducers = require '../util/addChildReducers'

reducer = (state = {dict: {}, _spawnedCount: 0}, action) ->
  switch action.type
    when k.AddTimeline
      {length, shouldLoop} = _.defaults action.data,
        length: 1
        shouldLoop: false

      changes =
        dict: {}
        _spawnedCount: state._spawnedCount + 1
      # new entity
      changes.dict["timeline-#{state._spawnedCount}"] =
        length: length
        shouldLoop: shouldLoop
        triggers: []
        mappings: []

      updeep changes, state


    when k.AddTrigger
      {timeline, position, action} = action.data
      mapAssign (_.cloneDeep state),
        "dict.#{timeline}.triggers",
        (oldTriggers) -> [oldTriggers..., {position: position, action: action}]


    when k.AddMapping
      {timeline, mapping} = action.data
      mapAssign (_.cloneDeep state),
        "dict.#{timeline}.mappings",
        (oldMappings) -> [oldMappings..., mapping]


    when k.SetTimelineLoop
      {timeline, shouldLoop} = action.data
      mapAssign (_.cloneDeep state),
        "dict.#{timeline}.shouldLoop",
        () -> shouldLoop

    else state

module.exports = reducer
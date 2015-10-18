_ = require 'lodash'
updeep = require 'updeep'
k = require '../ActionTypes'
mapAssign = require '../util/mapAssign'
addChildReducers = require '../util/addChildReducers'

reducer = (state = {dict: {}, _spawnedCount: 0}, action) ->
  switch action.type
    when k.AddEntity
      {} = action.data

      changes =
        dict: {}
        _spawnedCount: state._spawnedCount + 1
      # new entity
      changes.dict["entity-#{state._spawnedCount}"] =
        attachedTimelines: []

      updeep changes, state

    else state


module.exports = reducer
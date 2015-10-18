_ = require 'lodash'
updeep = require 'updeep'
k = require '../ActionTypes'
mapAssign = require '../util/mapAssign'
addChildReducers = require '../util/addChildReducers'

makeNewEntity = (initialData = {}) ->
  attachedTimelines: []
  data: initialData

reducer = (state = {dict: {}, _spawnedCount: 0}, action) ->
  switch action.type
    when k.AddEntity
      # TODO: cleaner way to enable optional data
      if action.data?
        {initialData} = action.data

      changes =
        dict: {}
        _spawnedCount: state._spawnedCount + 1
      changes.dict["entity-#{state._spawnedCount}"] = makeNewEntity initialData

      updeep changes, state

    when k.UpdateEntityData
      {entity, changes} = action.data

      if state.dict[entity]?
        stateChanges =
          dict: {}
        stateChanges.dict[entity] =
          data: changes

        updeep stateChanges, state

      else
        throw new Error "Attempted to update non-existant entity #{entity}."

    else state


module.exports = reducer
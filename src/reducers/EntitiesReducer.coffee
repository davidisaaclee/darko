_ = require 'lodash'
updeep = require 'updeep'
k = require '../ActionTypes'
mapAssign = require '../util/mapAssign'
addChildReducers = require '../util/addChildReducers'

Entity = require '../model/Entity'

reducer = (state = {dict: {}, _spawnedCount: 0}, action) ->
  switch action.type
    when k.AddEntity
      {id, name, initialData} = _.defaults {}, action.data,
        id: "entity-#{state._spawnedCount}"
        name: null
        initialData: {}

      changes =
        dict: {}
        _spawnedCount: state._spawnedCount + 1
      changes.dict[id] = new Entity id, name, [], initialData

      if name?
        changes.dict[id].name = name

      updeep changes, state

    when k.UpdateEntityData
      {entity, changes} = action.data

      if state.dict[entity]?
        stateChanges = dict: {}
        stateChanges.dict[entity] =
          data: changes

        updeep stateChanges, state

      else
        throw new Error "Attempted to update non-existant entity #{entity}."

    else state


module.exports = reducer
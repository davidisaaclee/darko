_ = require 'lodash'
updeep = require 'updeep'
k = require '../ActionTypes'
mapAssign = require '../util/mapAssign'
addChildReducers = require '../util/addChildReducers'

Entity = require '../model/Entity'

editEntity = (state, entityId, proc) ->
  entity = state.dict[entityId]

  if entity?
    changes = {}
    changes[entityId] = proc entity
    
    _.assign {}, state,
      dict: _.assign {}, state.dict, changes
  else
    throw new Error "Attempted to update non-existant entity #{entityId}."
    return state

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


    # Sets the `localData` property of the entity with id `entity` to `localData`.
    #
    #   entity: String
    #   localData: Object
    when k.SetEntityLocalData
      {entity, localData} = action.data

      editEntity state, entity, (e) ->
        _.assign {}, e, localData: localData

    else state


module.exports = reducer
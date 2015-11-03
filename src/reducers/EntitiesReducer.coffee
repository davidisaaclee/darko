_ = require 'lodash'
updeep = require 'updeep'
Immutable = require 'immutable'
k = require '../ActionTypes'
mapAssign = require '../util/mapAssign'
addChildReducers = require '../util/addChildReducers'

Entity = require '../model/Entity'


reducer = (state = Immutable.Map(), action) ->
  switch action.type
    when k.AddEntity
      {id, name, initialData} = _.defaults {}, action.data,
        id: "entity-#{state._spawnedCount}"
        name: null
        initialData: {}
      entity = new Entity id, name, initialData
      state.set id, entity


    # Removes the entity with the specified ID from the database.
    #
    #   id: String
    when k.RemoveEntity
      {id} = action.data
      state.delete id

    else state


module.exports = reducer
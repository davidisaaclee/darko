_ = require 'lodash'

module.exports = addChildReducers = (baseReducer, childReducers = {}) ->
  (state = {}, action) ->
    # `acc` will hold our state as it gets updated by each reducer
    # `key` is the key of the reducer, as well as the substate's path
    reduceOverChildren = (acc, key) ->
      changedState = {}
      changedState[key] = childReducers[key] acc[key], action

      _.assign {}, acc, changedState

    # this way might be faster
    #   _.assign acc, changedState
    # state = _.assign {}, state

    result = Object.keys childReducers
      .reduce reduceOverChildren, state

    result = baseReducer result, action

    # freeze this to ensure we're not accidentally mutating
    Object.freeze result
    return result
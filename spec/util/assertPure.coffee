_ = require 'lodash'

module.exports = assertPure = (getState, procedure, deep = true) ->
  preState = do getState
  preCopy = _.clone preState
  expect preState
    .toEqual preCopy

  do procedure

  postState = do getState

  expect preState
    .toEqual preCopy

  isNot = (a, b) ->
    # if object type
    if typeof a is 'object'
      expect a
        .not.toBe b
      if deep
        (Object.keys a).forEach (key) ->
          isNot a[key], b[key]

    # if value type
    else
      # treat all values as distinct
      return

  isNot preState, postState
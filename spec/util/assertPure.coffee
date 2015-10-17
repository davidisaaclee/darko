_ = require 'lodash'

module.exports = assertPure = (getState, procedure, deep = false) ->
  preState = do getState
  preCopy = _.clone preState
  expect preState
    .toEqual preCopy

  do procedure

  postState = do getState

  expect preState
    .toEqual preCopy

  isNot = (a, b) ->
    expect a
      .not.toBe b

    if deep
      (Object.keys a).forEach (key) ->
        isNot a[key], b[key]

  isNot preState, postState
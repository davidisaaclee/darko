_ = require 'lodash'

module.exports = assertPure = (getState, procedure, deep = false) ->
  preState = do getState
  preClone = _.cloneDeep preState
  expect preState
    .toEqual preClone

  do procedure
  postState = do getState
  expect preState
    .toEqual preClone
  expect postState
    .not.toBe preState

  # if the procedure did not change anything...
  if _.isEqual preClone, postState
    # ... then everything's cool
    return

  # otherwise, check to make sure the result is not referencing the old state
  else
    # TODO: test me
    checkMutated = (reference, pre, post) ->
      if _.isEqual reference, post
        # no change, it's okay for them to be the same
        return
      else
        # if object type
        if typeof pre is 'object'
          expect pre
            .not.toBe post
          if deep
            (Object.keys pre).forEach (key) ->
              checkMutated reference[key], pre[key], post[key]

        # if value type
        else
          # treat all values as distinct
          return

    checkMutated preClone, preState, postState
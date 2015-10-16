###
Object matches if, for every key k in subset,
  - k is a key of superset, and
  - the values at k in subset and superset are "equal"

For shallow matches, "equal" means that the values are equal according to the
  `equals()` function provided by Jasmine's injected `util`.
For deep matches, "equal" means:
  - if the values are objects, the values recursively match according to this
    object matching specification
  - if the values are not objects, the values are equal according to the
    `equals()` function provided by Jasmine's injected `util`
###

matchShallow = (util, customEqualityTesters) ->
  compare: (superset, subset) ->
    pass: (Object.keys subset).every (key) ->
      superset[key]? and
      util.equals superset[key], subset[key]

matchDeep = (util, customEqualityTesters) ->
  compareFn = (superset, subset) ->
    (Object.keys subset).every (key) ->
      if superset[key]?
        if (typeof subset[key] is 'object') and (typeof superset[key] is 'object')
        then compareFn superset[key], subset[key]
        else util.equals superset[key], subset[key]
      else
        return false

  compare: (superset, subset) ->
    pass: compareFn superset, subset

module.exports = (jasmine, \
                  shallowIdentifier = 'toMatchObject', \
                  deepIdentifier = 'toMatchObjectDeep') ->
  matcher = {}
  matcher[shallowIdentifier] = matchShallow
  matcher[deepIdentifier] = matchDeep
  jasmine.addMatchers matcher
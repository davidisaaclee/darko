###
Utility for mapping `Object.assign()` over arrays and objects.

@param obj [Object] Source object to map over and mutate.
@param path [String] Property path for mapping; can include property names,
  array indices (as numerals), and wildcards (`*`), delimited by `.`.
@param makeValue [Function] Function to determine new value to be placed at
  `path`. Parameters are:
    value - The current value at `path`, or `undefined` if path doesn't exist
      yet.
    wildcardValues - An array of values at each subpath ending in a wildcard,
      based on the current iteration.
    wildcards - An array of property names or indices of the wildcards, based
      on the current iteration.

@example

    obj =
      a: 1
      b: [
        {c: {p1: 1}}
        {c: {p2: 2, p3: 3}}
      ]

    result =
      mapAssign obj, 'b.*.c.*', (value, wildcardsValues, wildcards) ->
        console.log '=========='
        console.log 'value:', value
        console.log 'wildcardValues:', wildcardValues
        console.log 'wildcards:', wildcards
        return value + 1

    # Output:
    # ==========
    # value: 1
    # wildcardValues: [{c: {p1: 1}}, 1]
    # wildcards: [0, 'p1']
    # ==========
    # value: 2
    # wildcardValues: [{c: {p2: 2, p3: 3}}, 2]
    # wildcards: [0, 'p2']
    # ==========
    # value: 3
    # wildcardValues: [{c: {p2: 2, p3: 3}}, 3]
    # wildcards: [1, 'p3']


    # true
    result ==
      a: 1
      b: [
        {c: {p1: 2}}
        {c: {p2: 3, p3: 4}}
      ]

###

module.exports = mapAssign = (obj, pathString, makeValue) ->
  r = (path, node, wildcardValues = [], wildcards = []) ->
    if path.length is 0
      return node

    if not node?
      # pass through
      return {
        node: node
        wildcardValues: wildcardValues
        wildcards: wildcards
      }


    [first, tail...] = path
    [next, _...] = tail

    switch first
      # Wildcard tag
      when '*'
        keys =
          if node.constructor is Array
          then [0...node.length]
          else Object.keys node


        for key in keys
          elm = node[key]
          newWildcardValues = [wildcardValues..., elm]
          newWildcards = [wildcards..., key]

          if next?
            # we aren't assigning yet; just recur
            r tail, elm, newWildcardValues, newWildcards
          else
            # no more tags; so go ahead and assign
            node[key] = makeValue elm, newWildcardValues, newWildcards

      # Normal tag
      else
        key =
          if node.constructor is Array
          then do ->
            try
              parseInt elm
            catch e
              throw new Error 'Attempted to index into an array with a non-integer value.'
          else first

        if next?
          # we aren't assigning yet; just recur

          # get element, making new node if necessary
          elm =
            if node[key]?
            then node[key]
            else do ->
              # is `next` formatted as a number,
              #   and so requiring an array?
              node[key] =
                # (not (is not a number) == is a number)
                if not isNaN next
                then []
                else {}
              return node[key]

          r tail, elm, wildcardValues, wildcards
        else
          # no more tags; so go ahead and assign
          node[key] = makeValue node[key], wildcardValues, wildcards

  r (pathString.split '.'), obj
  return obj
module.exports = buildObjectWithPropertyKey = (keyProp) ->
  (obj, element) ->
    obj[element[keyProp]] = element
    return obj
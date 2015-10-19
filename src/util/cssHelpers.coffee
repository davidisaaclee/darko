translate3d = (x, y, z, element) ->
  ['-webkit-', '-moz-', '-o-', ''].forEach (prefix) ->
    element.style["#{prefix}transform"] = "translate3d(#{x}, #{y}, #{z})"

offset = (left, top, element) ->
  element.left = left
  element.top = top


module.exports =
  'translate3d': translate3d
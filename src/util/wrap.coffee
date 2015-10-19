# TODO: should probably test this
module.exports = wrap = (low, high, n) ->
  fn = (n) ->
    range = high - low
    t = n - low
    while t < 0
      t += range
    t = t % range
    return t + low

  if n?
  then fn n
  else fn
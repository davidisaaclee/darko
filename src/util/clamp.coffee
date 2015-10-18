module.exports = clamp = (low, high, n) ->
  fn = (n) -> Math.min high, (Math.max low, n)

  if n?
  then fn n
  else fn
_ = require 'lodash'
Immutable = require 'immutable'
Timeline = require './Timeline'

class KeyframeTimeline extends Timeline
  @type: 'KeyframeTimeline'

  constructor: (length, @keyframes = Immutable.List()) ->
    super KeyframeTimeline.type, length


  @withKeyframes: (length, keyframesObj) ->
    _ keyframesObj
      # split object into key-value pairs
      .pairs()
      # parse the key into a float - this will be the position of the keyframe
      .map ([timeString, data]) -> [(parseFloat timeString), data]
      # add all of the keyframes to the new timeline
      .reduce ((tl, [p, d]) ->
        KeyframeTimeline.addKeyframe tl, p, d),
        (new KeyframeTimeline length)


  @reducer: (timeline, data, changes) -> _objArith data, changes


  @progress: (timeline, progress, data) ->
    idx = _immutableSortedIndex timeline.keyframes, {position: progress},
      compareValue: _.property 'position'
    switch idx
      when 0, timeline.keyframes.size
        # extrapolate
        throw new Error 'Must, not, extrapolate'
      else
        [lower, upper] = [ (timeline.keyframes.get (idx - 1))
                         , (timeline.keyframes.get idx) ]
        tween = _objTween lower.data, upper.data, (progress - lower.position)
        # _objArith tween, data


  @addKeyframe: (timeline, position, data) ->
    _.assign {}, timeline,
      keyframes:
        timeline.keyframes
          .push position: position, data: data
          .sortBy _.property 'position'


  @getKeyframe: (timeline, idx) -> timeline.keyframes.get idx


  @getKeyframePosition: (idx) -> (timeline.keyframes.get idx).position

  @getKeyframeData: (idx) -> (timeline.keyframes.get idx).data


### Helpers ###

# if `element` was to be inserted into `list` and sorted, what would `element`'s
#   index be?
_immutableSortedIndex = (list, element, options = {}) ->
  options = _.defaults options,
    compareValue: _.identity
    comparator: (x, y) -> x - y
    shouldCheckSorted: false

  if not options.shouldCheckSorted
    for i in [0...list.size]
      compared = options.comparator (options.compareValue list.get i), (options.compareValue element)
      switch
        when compared > 0
          return i
    # got past full list, so it should just go at the end
    return list.size
  else
    console.warn 'Implement me!'


_objTween = (src, dst, amount) ->
  if _.matches src, dst
    switch
      when (_.isNumber src) and (_.isNumber dst)
        src + (dst - src) * amount
      when (_.isArray src) and (_.isArray dst)
        _ src
          .zip dst
          .map ([s, d]) -> _objTween s, d, amount
          .value()
      when (_.isObject src) and (_.isObject dst)
        result = {}
        for k, __ of src
          result[k] = _objTween src[k], dst[k], amount
        return result
  else
    throw new Error 'Attempted to tween between two incongruent keyframes.'


_objArith = (randl, randr, rator = _.add) ->
  switch
    when (_.isNumber randl) and (_.isNumber randr)
      rator randl, randr
    when (_.isArray randl) and (_.isArray randr)
      _ randl
        .zip randr
        .map ([s, d]) -> _objArith s, d, rator
        .value()
    when (_.isObject randl) and (_.isObject randr)
      result = {}
      for k, __ of randl
        result[k] = _objArith randl[k], randr[k], rator
      return result
    else
      throw new Error "Unmatched case on data #{randl}, #{randr}"





module.exports = KeyframeTimeline
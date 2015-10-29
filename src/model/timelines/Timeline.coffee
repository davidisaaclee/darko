_ = require 'lodash'
Model = require '../Model'

###
# Represents a timeline model.
# These timeline models are referenced by entities; so they only hold
#   information applicable to any attached entity - such as triggers,
#   mappings, and timeline length.
Timeline ::=
  # Progress along the timeline is scaled by its `length`.
  # If timeline A has 2x the length of timeline B, it should take twice as long
  #   to progress along A as to progress along B.
  length: Number
###
class Timeline extends Model
  @type: 'Timeline'

  constructor: (@type, @length = 1, @shouldLoop = false) ->

  @getLength: (timeline) -> timeline.length

  @getShouldLoop: (timeline) -> timeline.shouldLoop

  @setLoop: (timeline, shouldLoop) ->
    _.assign {}, timeline,
      shouldLoop: shouldLoop

  @reducer: (timeline, data, changes) ->
    console.warn 'Timeline should override Timeline.reducer: ', timeline

  @progress: (timeline, progress, data) ->
    console.warn 'Timeline should override Timeline.progress: ', timeline

  @typeOf: (timeline) -> timeline.type


module.exports = Timeline
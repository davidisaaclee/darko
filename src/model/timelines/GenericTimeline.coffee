Timeline = require './Timeline'

class GenericTimeline extends Timeline
  @type: 'GenericTimeline'

  constructor: (@length, @progressFn) ->
    super GenericTimeline.type, length
    # @type = GenericTimeline.type

  @reducer: (timeline, data, changes) -> changes

  @progress: (timeline, progress, data) ->
    timeline.progressFn progress, data


module.exports = GenericTimeline
Model = require './model'

class Entity extends Model
  constructor: (@id, @name, @attachedTimelines, @data) ->

  @getId: (entity) -> entity.id

  @getName: (entity) -> entity.name

  @getData: (entity) -> entity.data

  @getAttachedTimelines: (entity) -> entity.attachedTimelines

  @isAttachedToTimeline: (entity, timelineId) ->
    entity.attachedTimelines.some ({timeline}) -> timeline is timelineId

  @progressForTimeline: (entity, timelineId) ->
    tl = _.find entity.attachedTimelines, ({timeline}) -> timeline is timelineId
    return tl?.progress


module.exports = Entity
_ = require 'lodash'
Immutable = require 'immutable'
Model = require './Model'
Timelines = require './timelines/Timelines'

###
Entity ::=
  id: string

  name: string

  # A list of timelines which this `Entity` is attached to. The order of this
  #   list designates the order in which triggers / mappings are invoked.
  attachedTimelines: [EntityTimelineRelation]

  # "Output" data path.
  data: Object

  # The `Entity`'s data before any modifications from timelines.
  localData: Object


# Describes an attachment of an `Entity` to a `Timeline`.
EntityTimelineRelation ::=
  # The attached `Timeline`'s unique ID.
  timeline: String

  # The progress along the attached `Timeline`: a number between 0 and 1.
  progress: Float
###
class Entity extends Model
  constructor: (@id, @name, @localData, @attachedTimelines = Immutable.List()) ->
    # calculated data is initially the same as `localData`
    # TODO: is this true? if `attachedTimelines` is initialized to non-empty?
    @data = _.assign {}, @localData

  @getId: (entity) -> entity.id

  @getName: (entity) -> entity.name

  @getData: (entity) -> entity.data

  @getLocalData: (entity) -> entity.localData

  @getAttachedTimeline: (entity, timelineId) ->
    entity.attachedTimelines.find ({timeline}) -> timeline is timelineId

  @getAttachedTimelines: (entity) ->
    entity.attachedTimelines.toArray()

  @isAttachedToTimeline: (entity, timelineId) ->
    entity.attachedTimelines.some ({timeline}) -> timeline is timelineId

  @getProgressForTimeline: (entity, timelineId) ->
    (Entity.getAttachedTimeline entity, timelineId)?.progress


  @attachTimeline: (entity, timeline, progress, stackPosition = 0) ->
    timelineRelation =
      timeline: timeline.id
      progress: progress

    _.assign {}, entity,
      attachedTimelines:
        entity.attachedTimelines.splice stackPosition, 0, timelineRelation

  @detachTimeline: (entity, timelineId) ->
    [idx, val] =
      entity.attachedTimelines.findEntry ({timeline}) -> timeline is timelineId
    _.assign {}, entity,
      attachedTimelines: entity.attachedTimelines.splice idx, 1

  @getAttachedTimelineIndex: (entity, timelineId) ->
    [idx, val] =
      entity.attachedTimelines.findEntry ({timeline}) -> timeline is timelineId
    return idx

  @mutateTimeline: (entity, timelineId, mutator) ->
    idx = Entity.getAttachedTimelineIndex entity, timelineId
    _.assign {}, entity,
      attachedTimelines: entity.attachedTimelines.update idx, mutator


module.exports = Entity
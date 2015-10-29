_ = require 'lodash'
Model = require './model'
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
  constructor: (@id, @name, @attachedTimelines, @localData) ->
    @data = _.assign {}, @localData

  @getId: (entity) -> entity.id

  @getName: (entity) -> entity.name

  @getData: (entity) -> entity.data

  @getLocalData: (entity) -> entity.localData

  @getAttachedTimelines: (entity) -> entity.attachedTimelines

  @isAttachedToTimeline: (entity, timelineId) ->
    entity.attachedTimelines.some ({timeline}) -> timeline is timelineId

  @getProgressForTimeline: (entity, timelineId) ->
    tl = _.find entity.attachedTimelines, ({timeline}) -> timeline is timelineId
    return tl?.progress


  @incrementProgressOnTimeline: (entity, delta, timelineId) ->
    {attachedTimelines} = entity
    idx = _.findIndex attachedTimelines, timeline: timelineId
    if idx isnt -1
      newAttachedTimeline = _.assign {}, attachedTimelines[idx],
        progress: delta + attachedTimelines[idx].progress
      _.assign {}, entity,
        attachedTimelines: [ attachedTimelines[0...idx]...
                           , newAttachedTimeline
                           , attachedTimelines[idx + 1..]... ]
    else entity

  # @calculateData: (entity) ->
  #   reduction = (data, elm) ->
  #     timeline = GET_TIMELINE elm.timeline
  #     reducer = (a, b) -> Timelines.reducer timeline, a, b
  #     reducer data, (Timelines.progress timeline, elm.progress)

  #   _.assign {}, entity,
  #     data: entity.attachedTimelines.reduce reduction, entity.localData


  @attachTimeline: (entity, timeline, progress) ->
    timelineRelation =
      timeline: timeline.id
      progress: progress
    _.assign {}, entity,
      attachedTimelines: [entity.attachedTimelines..., timelineRelation]

module.exports = Entity
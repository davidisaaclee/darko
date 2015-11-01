_ = require 'lodash'
Model = require './Model'
Entity = require './Entity'

Timelines = require './timelines/Timelines'
buildObjectWithPropertyKey = require '../util/buildObjectWithPropertyKey'
clamp = require '../util/clamp'
wrap = require '../util/wrap'

###
# The main state of an interactive scene.
Scene ::=
  timelines:
    # Dictionary mapping unique timeline ID to a timeline model.
    # These timeline models are referenced by entities; so they only hold
    #   information applicable to any attached entity - such as triggers,
    #   mappings, and timeline length.
    dict: { id -> Timeline }

    # Internal; number of times timelines have been spawned.
    # Used for assigning unique timeline IDs.
    _spawnedCount: Number

  entities:
    # Dictionary mapping unique entity ID to an entity model.
    dict: { id -> Entity }

    # Internal; number of times entities have been spawned.
    # Used for assigning unique entity IDs.
    _spawnedCount: Number
###
class Scene extends Model
  constructor: (@entities, @timelines) ->
    if not @entities?
      @entities =
        dict: {}
        _spawnCount: 0
    if not @timelines?
      @timelines =
        dict: {}
        _spawnCount: 0

  @getEntity: (scene, entityId) ->
    scene.entities.dict[entityId]

  @getEntityById: @getEntity

  @getAllEntities: (scene) ->
    _.values scene.entities.dict

  @getTimeline: (scene, timelineId) ->
    scene.timelines.dict[timelineId]

  @getTimelineById: @getTimeline

  @getAllTimelines: (scene) ->
    _.values scene.timelines.dict

  @getEntityByName: (scene, entityName) ->
    _ scene.entities.dict
      .values()
      .find ({name}) -> name is entityName


  @progressTimeline: (scene, timelineId, delta, entities = _.values entityDict) ->
    timeline = Scene.getTimeline scene, timelineId
    entityDict = scene.entities.dict
    incrProgress = Scene.incrementProgressOnTimeline scene

    _.assign {}, scene,
      entities: _.assign {}, scene.entities,
        dict: _.assign {}, scene.entities.dict,
          entities
            # map into list of actual entities
            .map _.propertyOf entityDict
            # update all progresses
            .map (e) -> incrProgress e, delta, timelineId
            # recalculate all changed entity data
            .map Scene.calculateEntityData scene
            # build back into a dictionary
            .reduce (buildObjectWithPropertyKey 'id'), {}


  @mutateEntity: (scene, entityId, mutator) ->
    entity = Scene.getEntity scene, entityId
    if entity?
      changes = {}
      changes[entityId] = mutator entity
      _.assign {}, scene,
        entities: _.assign {}, scene.entities,
          dict: _.assign {}, scene.dict, changes
    else
      console.warn 'No such entity ' + entityId
      scene


  ### Entity mutators ###
  # These functions are entity operations that need data from elsewhere in the
  #   scene. As such, they take in a `Scene` and return a function which takes
  #   in an entity and returns a modified version of the entity.

  # returns entity
  @incrementProgressOnTimeline: (scene) -> (entity, delta, timelineId) ->
    {attachedTimelines} = entity
    idx = _.findIndex attachedTimelines, timeline: timelineId
    if idx isnt -1
      prevTl = attachedTimelines[idx]
      timelineObj = Scene.getTimeline scene, prevTl.timeline
      scaledDelta = delta / (Timelines.getLength timelineObj)
      newProgress =
        if Timelines.getShouldLoop timelineObj
        then wrap 0, 1, scaledDelta + prevTl.progress
        else clamp 0, 1, scaledDelta + prevTl.progress

      newAttachedTimeline = _.assign {}, prevTl,
        progress: newProgress
      _.assign {}, entity,
        attachedTimelines: [ attachedTimelines[0...idx]...
                           , newAttachedTimeline
                           , attachedTimelines[idx + 1..]... ]
    else entity


  @calculateEntityData = (scene) -> (entity) ->
    _.assign {}, entity,
      data:
        entity.attachedTimelines
          .map ({timeline, progress}) ->
            timelineObj = Scene.getTimeline scene, timeline

            changes: Timelines.progress timelineObj, progress
            reducer: Timelines.reducer timelineObj
          .reduce ((data, {changes, reducer}) ->
            reducer data, changes), entity.localData

module.exports = Scene
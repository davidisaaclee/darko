_ = require 'lodash'
Model = require './model'
Entity = require './entity'

Timelines = require './timelines/Timelines'
buildObjectWithPropertyKey = require '../util/buildObjectWithPropertyKey'

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

    # returns the modified entity
    calculateEntityData = (scene) -> (entity) ->
      reduction = (data, elm) ->
        timeline = Scene.getTimeline scene, elm.timeline
        reducer = (a, b) -> Timelines.reducer timeline, a, b
        reducer data, (Timelines.progress timeline, elm.progress)

      _.assign {}, entity,
        data: entity.attachedTimelines.reduce reduction, entity.localData

    _.assign {}, scene,
      entities: _.assign {}, scene.entities,
        dict: _.assign {}, scene.entities.dict,
          entities
            # map into list of actual entities
            .map _.propertyOf entityDict
            # update all progresses
            .map (e) -> Entity.incrementProgressOnTimeline e, delta, timelineId
            # recalculate all changed entity data
            # .map Entity.calculateData
            .map (calculateEntityData scene)
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




module.exports = Scene
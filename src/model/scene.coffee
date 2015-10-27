_ = require 'lodash'
Model = require './model'

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

  @getAllEntities: (scene) ->
    _.values scene.entities.dict

  @getTimeline: (scene, timelineId) ->
    scene.timelines.dict[timelineId]

  @getAllTimelines: (scene) ->
    _.values scene.timelines.dict

  @getEntityByName: (scene, entityName) ->
    _ scene.entities.dict
      .values()
      .find ({name}) -> name is entityName


module.exports = Scene
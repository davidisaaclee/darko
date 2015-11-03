_ = require 'lodash'
Immutable = require 'immutable'
Model = require './Model'
Entity = require './Entity'

Timelines = require './timelines/Timelines'
buildObjectWithPropertyKey = require '../util/buildObjectWithPropertyKey'
clamp = require '../util/clamp'
wrap = require '../util/wrap'

###
# The main state of an interactive scene.
Scene ::=
  # Map of timeline ID -> Timeline model
  timelines: Immutable.Map
  # Map of entity ID -> Entity model
  entities: Immutable.Map
###
class Scene extends Model
  constructor: (@entities = Immutable.Map(), @timelines = Immutable.Map()) ->

  @getEntity: (scene, entityId) ->
    scene.entities.get entityId

  @getEntityById: @getEntity

  @getAllEntities: (scene) ->
    scene.entities.toArray()

  @getTimeline: (scene, timelineId) ->
    scene.timelines.get timelineId

  @getTimelineById: @getTimeline

  @getAllTimelines: (scene) ->
    scene.timelines.toArray()

  @getEntityByName: (scene, entityName) ->
    scene.entities.find ({name}) -> name is entityName

  @findEntity: (scene, predicate) ->
    scene.entities.find predicate


  @progressTimeline: (scene, timelineId, delta, entities) ->
    timeline = Scene.getTimeline scene, timelineId
    incrProgress = (e) ->
      (Scene.incrementProgressOnTimeline scene) e, delta, timelineId

    _.assign {}, scene,
      entities:
        entities
          .map (e) ->
            [e, (_.compose (Scene.calculateEntityData scene), incrProgress)]
          # `.reduce Immutable.Map.prototype.update.apply, scene.entities`
          # should work but does not...
          # why do i need these explicit parameters??
          .reduce ((acc, elm) -> Immutable.Map.prototype.update.apply acc, elm), scene.entities


  @mutateEntity: (scene, entityId, mutator) ->
    _.assign {}, scene,
      entities: scene.entities.update entityId, mutator


  ### Entity mutators ###
  # These functions are entity operations that need data from elsewhere in the
  #   scene. As such, they take in a `Scene` and return a function which takes
  #   in an entity and returns a modified version of the entity.

  # returns entity
  @incrementProgressOnTimeline: (scene) -> (entity, delta, timelineId) ->
    Entity.mutateTimeline entity, timelineId, (t) ->
      timelineObj = Scene.getTimeline scene, t.timeline
      scaledDelta = delta / (Timelines.getLength timelineObj)
      newProgress =
        if Timelines.getShouldLoop timelineObj
        then wrap 0, 1, scaledDelta + t.progress
        else clamp 0, 1, scaledDelta + t.progress

      _.assign {}, t,
        progress: newProgress


  @calculateEntityData = (scene) -> (entity) ->
    _.assign {}, entity,
      data:
        Entity.getAttachedTimelines entity
          .map ({timeline, progress}) ->
            timelineObj = Scene.getTimeline scene, timeline

            changes: Timelines.progress timelineObj, progress
            reducer: Timelines.reducer timelineObj
          .reduce ((data, {changes, reducer}) ->
            reducer data, changes), entity.localData

module.exports = Scene
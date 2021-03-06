_ = require 'lodash'
updeep = require 'updeep'
k = require '../ActionTypes'

mapAssign = require '../util/mapAssign'
addChildReducers = require '../util/addChildReducers'
clamp = require '../util/clamp'
wrap = require '../util/wrap'

timelinesReducer = require './TimelinesReducer'
entitiesReducer = require './EntitiesReducer'

Scene = require '../model/Scene'
Entity = require '../model/Entity'
Timelines = require '../model/timelines/Timelines'

buildObjectWithPropertyKey = require '../util/buildObjectWithPropertyKey'


reducer = (state = {}, action) ->
  switch action.type
    # Progress the specified `timeline` by `delta` on all attached entities.
    #
    #   timeline: String
    #   delta: Number
    when k.ProgressTimeline
      {timeline, delta} = action.data
      Scene.progressTimeline state, timeline, delta

    # Progress the `timeline` on `entity` by `delta`.
    #
    #   timeline: String
    #   entity: String
    #   delta: Number
    when k.ProgressEntityTimeline
      {entity, timeline, delta} = action.data
      Scene.progressTimeline state, timeline, delta, [entity]

    # Attaches the `entity` with the provided id to the `timeline` with the
    #   provided timeline id.
    # Provides support for optionally precise placement of timeline into the
    #   `Entity's` `attachedTimelines` stack. The `stackPosition` parameter
    #   indicates the index at which to insert the new timeline relation. A
    #   `stackPosition` of 0 means that the relation will be pushed onto the head
    #   (top) of the stack.
    #
    #   entity: String
    #   timeline: String
    #   [progress: Number = 0]
    #   [stackPosition: Number = 0]
    when k.AttachEntityToTimeline
      {entity, timeline, progress, stackPosition} = _.defaults action.data,
        stackPosition: 0
        progress: 0

      timelineObj = Scene.getTimeline state, timeline
      state_ = Scene.mutateEntity state, entity, (e) ->
        if not Entity.isAttachedToTimeline e, timeline
          ent = Entity.attachTimeline e, timelineObj, progress, stackPosition
          ent = (Scene.calculateEntityData state) ent
        else e

      # Scene.progressTimeline state_, timeline, 0, [entity]


    # Removes the timeline with the provided id from the list of timelines
    #   attached to the entity with the provided id.
    #
    #   entity: String
    #   timeline: String
    when k.DetachEntityFromTimeline
      {entity, timeline} = action.data
      _.assign {}, state,
        entities:
          state.entities.update entity, (e) ->
            Entity.detachTimeline e, timeline


    # Sets the `localData` property of the entity with id `entity` to `localData`.
    #
    #   entity: String
    #   localData: Object
    when k.SetEntityLocalData
      {entity, localData} = action.data
      _.assign {}, state,
        entities:
          state.entities.update entity, (e) ->
            newEnt = _.assign {}, e, localData: localData
            newEnt_ = (Scene.calculateEntityData state) newEnt
            return newEnt_

    else state


module.exports = addChildReducers reducer,
  'timelines': timelinesReducer
  'entities': entitiesReducer
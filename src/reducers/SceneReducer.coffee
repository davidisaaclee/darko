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
    when k.ProgressTimeline
      {timeline, delta} = action.data
      Scene.progressTimeline state, timeline, delta

    when k.ProgressEntityTimeline
      {entity, timeline, delta} = action.data
      Scene.progressTimeline state, timeline, delta, [entity]

    when k.AttachEntityToTimeline
      {entity, timeline, progress} = _.defaults action.data,
        progress: 0


      timelineObj = Scene.getTimeline state, timeline
      state_ = Scene.mutateEntity state, entity, (e) ->
        if not Entity.isAttachedToTimeline e, timeline
        then Entity.attachTimeline e, timelineObj, progress
        else e

      Scene.progressTimeline state_, timeline, 0, [entity]


    else state


module.exports = addChildReducers reducer,
  'timelines': timelinesReducer
  'entities': entitiesReducer
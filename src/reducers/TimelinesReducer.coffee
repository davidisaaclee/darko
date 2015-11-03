_ = require 'lodash'
updeep = require 'updeep'
Immutable = require 'immutable'
k = require '../ActionTypes'
mapAssign = require '../util/mapAssign'
addChildReducers = require '../util/addChildReducers'
Timelines = require '../model/timelines/Timelines'

reducer = (state = Immutable.Map(), action) ->
  switch action.type

    # Adds the specified timeline to the database.
    #
    #   [id: String]
    #   timeline: Timeline
    when k.AddTimeline
      {id, timeline} = _.defaults action.data,
        id: "timeline-#{state._spawnedCount}"

      timelineWithId = _.assign {}, timeline, id: id
      state.set id, timelineWithId

    # Removes the timeline with the specified ID from the database.
    #
    #   id: String
    when k.RemoveTimeline
      {id} = action.data
      state.delete id


    # Set a timeline to loop or not loop.
    #
    #   timeline: String
    #   shouldLoop: Boolean
    when k.SetTimelineLoop
      {timeline, shouldLoop} = action.data
      state.update timeline, (t) -> Timelines.setLoop t, shouldLoop

    else state

module.exports = reducer
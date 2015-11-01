_ = require 'lodash'
updeep = require 'updeep'
k = require '../ActionTypes'
mapAssign = require '../util/mapAssign'
addChildReducers = require '../util/addChildReducers'
Timelines = require '../model/timelines/Timelines'

reducer = (state = {dict: {}, _spawnedCount: 0}, action) ->
  switch action.type

    # Adds the specified timeline to the database.
    #
    #   [id: String]
    #   timeline: Timeline
    when k.AddTimeline
      {id, timeline} = _.defaults action.data,
        id: "timeline-#{state._spawnedCount}"

      change = {}
      change[id] = _.assign {}, timeline, id: id

      _.assign {}, state,
        dict: _.assign {}, state.dict,
          change


    when k.AddTrigger
      {timeline, position, action} = action.data
      mapAssign (_.cloneDeep state),
        "dict.#{timeline}.triggers",
        (oldTriggers) -> [oldTriggers..., {position: position, action: action}]


    when k.AddMapping
      {timeline, mapping} = action.data
      mapAssign (_.cloneDeep state),
        "dict.#{timeline}.mappings",
        (oldMappings) -> [oldMappings..., mapping]


    when k.SetTimelineLoop
      {timeline, shouldLoop} = action.data
      mapAssign (_.cloneDeep state),
        "dict.#{timeline}",
        (t) -> Timelines.setLoop t, shouldLoop

    else state

module.exports = reducer
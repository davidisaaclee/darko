_ = require 'lodash'
updeep = require 'updeep'
k = require '../ActionTypes'
mapAssign = require '../util/mapAssign'
addChildReducers = require '../util/addChildReducers'

reducer = (state = {dict: {}, _spawnedCount: 0}, action) ->
  switch action.type

    # Adds the specified timeline to the database.
    #
    #   [id: String]
    #   timeline: Timeline
    when k.AddTimeline
      {id, timeline} = _.defaults action.data,
        id: "timeline-#{state._spawnedCount}"

      # changes =
      #   dict: {}
      #   _spawnedCount: state._spawnedCount + 1
      # # new entity
      # changes.dict[id] = timeline
      # updeep changes, state

      timeline.id = id

      change = {}
      change[id] = timeline

      _.assign {}, state,
        dict: _.assign {}, state.dict,
          change

    # when k.AddTimeline
    #   {id, length, shouldLoop} = _.defaults action.data,
    #     id: "timeline-#{state._spawnedCount}"
    #     length: 1
    #     shouldLoop: false

    #   changes =
    #     dict: {}
    #     _spawnedCount: state._spawnedCount + 1
    #   # new entity
    #   changes.dict[id] =
    #     id: id
    #     length: length
    #     shouldLoop: shouldLoop
    #     triggers: []
    #     mappings: []

    #   updeep changes, state


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
        "dict.#{timeline}.shouldLoop",
        () -> shouldLoop

    else state

module.exports = reducer
// Generated by CoffeeScript 1.9.2
(function() {
  var Immutable, Timelines, _, addChildReducers, k, mapAssign, reducer, updeep;

  _ = require('lodash');

  updeep = require('updeep');

  Immutable = require('immutable');

  k = require('../ActionTypes');

  mapAssign = require('../util/mapAssign');

  addChildReducers = require('../util/addChildReducers');

  Timelines = require('../model/timelines/Timelines');

  reducer = function(state, action) {
    var id, ref, ref1, shouldLoop, timeline, timelineWithId;
    if (state == null) {
      state = Immutable.Map();
    }
    switch (action.type) {
      case k.AddTimeline:
        ref = _.defaults(action.data, {
          id: "timeline-" + state._spawnedCount
        }), id = ref.id, timeline = ref.timeline;
        timelineWithId = _.assign({}, timeline, {
          id: id
        });
        return state.set(id, timelineWithId);
      case k.RemoveTimeline:
        id = action.data.id;
        return state["delete"](id);
      case k.SetTimelineLoop:
        ref1 = action.data, timeline = ref1.timeline, shouldLoop = ref1.shouldLoop;
        return state.update(timeline, function(t) {
          return Timelines.setLoop(t, shouldLoop);
        });
      default:
        return state;
    }
  };

  module.exports = reducer;

}).call(this);

//# sourceMappingURL=TimelinesReducer.js.map

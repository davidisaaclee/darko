// Generated by CoffeeScript 1.9.2
(function() {
  var Entity, Model, Timelines, _,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  _ = require('lodash');

  Model = require('./Model');

  Timelines = require('./timelines/Timelines');


  /*
  Entity ::=
    id: string
  
    name: string
  
     * A list of timelines which this `Entity` is attached to. The order of this
     *   list designates the order in which triggers / mappings are invoked.
    attachedTimelines: [EntityTimelineRelation]
  
     * "Output" data path.
    data: Object
  
     * The `Entity`'s data before any modifications from timelines.
    localData: Object
  
  
   * Describes an attachment of an `Entity` to a `Timeline`.
  EntityTimelineRelation ::=
     * The attached `Timeline`'s unique ID.
    timeline: String
  
     * The progress along the attached `Timeline`: a number between 0 and 1.
    progress: Float
   */

  Entity = (function(superClass) {
    extend(Entity, superClass);

    function Entity(id, name, attachedTimelines, localData) {
      this.id = id;
      this.name = name;
      this.attachedTimelines = attachedTimelines;
      this.localData = localData;
      this.data = _.assign({}, this.localData);
    }

    Entity.getId = function(entity) {
      return entity.id;
    };

    Entity.getName = function(entity) {
      return entity.name;
    };

    Entity.getData = function(entity) {
      return entity.data;
    };

    Entity.getLocalData = function(entity) {
      return entity.localData;
    };

    Entity.getAttachedTimeline = function(entity, timelineId) {
      return _.find(entity.attachedTimelines, {
        timeline: timelineId
      });
    };

    Entity.getAttachedTimelines = function(entity) {
      return entity.attachedTimelines;
    };

    Entity.isAttachedToTimeline = function(entity, timelineId) {
      return entity.attachedTimelines.some(function(arg) {
        var timeline;
        timeline = arg.timeline;
        return timeline === timelineId;
      });
    };

    Entity.getProgressForTimeline = function(entity, timelineId) {
      var tl;
      tl = _.find(entity.attachedTimelines, function(arg) {
        var timeline;
        timeline = arg.timeline;
        return timeline === timelineId;
      });
      return tl != null ? tl.progress : void 0;
    };

    Entity.attachTimeline = function(entity, timeline, progress, stackPosition) {
      var timelineRelation;
      if (stackPosition == null) {
        stackPosition = 0;
      }
      timelineRelation = {
        timeline: timeline.id,
        progress: progress
      };
      return _.assign({}, entity, {
        attachedTimelines: slice.call(entity.attachedTimelines.slice(0, stackPosition)).concat([timelineRelation], slice.call(entity.attachedTimelines.slice(stackPosition)))
      });
    };

    return Entity;

  })(Model);

  module.exports = Entity;

}).call(this);

//# sourceMappingURL=Entity.js.map

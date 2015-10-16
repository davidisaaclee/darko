(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = {
  DeltaTime: 'DeltaTime',
  AddTrigger: 'AddTrigger'
};


},{}],2:[function(require,module,exports){
var _, k, timelineReducer;

require('redux');

_ = require('lodash');

k = require('./ActionTypes');

timelineReducer = function(state, action) {
  var delta, entities;
  if (state === void 0) {
    console.warn('Reducer received no state.');
  }
  switch (action.type) {
    case k.DeltaTime:
      delta = action.data.delta;
      entities = {
        entities: _.mapValues(state.entities, function(entity, id) {
          var timelines;
          timelines = {
            attachedTimelines: _.map(entity.attachedTimelines, function(timelineInfo) {
              var progress, progressDelta;
              progressDelta = delta / state.timelines[timelineInfo.id].length;
              progress = {
                progress: timelineInfo.progress + progressDelta
              };
              return _.assign(timelineInfo, progress);
            })
          };
          return _.assign(entity, timelines);
        })
      };
      return _.assign({}, state, entities);
    default:
      return state;
  }
};

module.exports = {
  timelineReducer: timelineReducer
};


},{"./ActionTypes":1,"lodash":"lodash","redux":"redux"}]},{},[2]);

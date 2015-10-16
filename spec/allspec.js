(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var createStore, hp, k;

createStore = require('redux').createStore;

k = require('../src/actionTypes');

hp = require('../src/honeypower');

describe('timeline actions', function() {
  beforeEach(function() {
    return this.store = createStore(hp.timelineReducer);
  });
  return it('should respond to delta time', function() {
    expect(this.store.getState().entities['entity1'].attachedTimelines[0].progress).toBe(0);
    this.store.dispatch({
      type: k.DeltaTime,
      delta: 1
    });
    expect(this.store.getState().entities['entity1'].attachedTimelines[0].progress).toBe(0.5);
    this.store.dispatch({
      type: k.DeltaTime,
      delta: 1
    });
    return expect(this.store.getState().entities['entity1'].attachedTimelines[0].progress).toBe(1);
  });
});


},{"../src/actionTypes":3,"../src/honeypower":4,"redux":"redux"}],2:[function(require,module,exports){
require('./honeypowerspec');


},{"./honeypowerspec":1}],3:[function(require,module,exports){
module.exports = {
  DeltaTime: 'deltaTime'
};


},{}],4:[function(require,module,exports){
var _, initialState, k, timelineReducer;

require('redux');

_ = require('lodash');

k = require('./actionTypes');


/*
State

World
  [entities]:
    [attachedTimelines]:
      timeline:
        length: Number
        [triggers]: (position, type)
        [mappings]: progress -> (descriptor, value)
      progress: Number
 */

initialState = {
  timelines: {
    'timeline1': {
      length: 2,
      triggers: [],
      mappings: []
    }
  },
  entities: {
    'entity1': {
      attachedTimelines: [
        {
          id: 'timeline1',
          progress: 0
        }
      ]
    }
  }
};

timelineReducer = function(state, action) {
  var delta;
  if (state == null) {
    state = initialState;
  }
  switch (action.type) {
    case k.DeltaTime:
      delta = action.delta;
      return _.assign({}, state, {
        entities: _.mapValues(state.entities, function(entity, id) {
          return _.assign(entity, {
            attachedTimelines: entity.attachedTimelines.map(function(timelineInfo) {
              var scaledDelta;
              scaledDelta = delta / state.timelines[timelineInfo.id].length;
              return _.assign(timelineInfo, {
                progress: timelineInfo.progress + scaledDelta
              });
            })
          });
        })
      });
    default:
      return state;
  }
};

module.exports = {
  timelineReducer: timelineReducer
};


},{"./actionTypes":3,"lodash":"lodash","redux":"redux"}]},{},[2]);

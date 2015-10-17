(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = {
  ProgressEntityTimeline: 'ProgressEntityTimeline',
  AddTrigger: 'AddTrigger'
};


},{}],2:[function(require,module,exports){
var _, baseStateReducer, combinedReducer, k, mapAssign, redux, timelineReducer,
  slice = [].slice;

redux = require('redux');

_ = require('lodash');

k = require('./ActionTypes');

mapAssign = require('./util/mapAssign');

baseStateReducer = function(state, action) {
  var delta, entity, ref, timelines;
  if (state == null) {
    state = {};
  }
  if (action.type === k.ProgressEntityTimeline) {
    ref = action.data, entity = ref.entity, timelines = ref.timelines, delta = ref.delta;
    return mapAssign(_.cloneDeep(state), 'entities.*.attachedTimelines.*.progress', function(oldProgress, wildcardVals, wildcards) {
      var attachedTimeline, entityId, entityObj, newProgress, progressDelta, timeline, timelineIdx;
      entityId = wildcards[0], timelineIdx = wildcards[1];
      entityObj = wildcardVals[0], attachedTimeline = wildcardVals[1];
      if ((entityId === entity) && (_.contains(timelines, attachedTimeline.id))) {
        timeline = state.timelines[attachedTimeline.id];
        progressDelta = delta / timeline.length;
        newProgress = oldProgress + progressDelta;
        timeline.triggers.filter(function(trigger) {
          var ref1;
          return (oldProgress < (ref1 = trigger.position) && ref1 <= newProgress);
        }).forEach(function(trigger) {
          return trigger.action();
        });
        return newProgress;
      } else {
        return oldProgress;
      }
    });
  } else {
    return state;
  }
};

timelineReducer = function(state, action) {
  var position, ref, timeline;
  if (state == null) {
    state = {};
  }
  if (action.type === k.AddTrigger) {
    ref = action.data, timeline = ref.timeline, position = ref.position, action = ref.action;
    return mapAssign(_.cloneDeep(state), timeline + ".triggers", function(value) {
      return slice.call(value).concat([{
          position: position,
          action: action
        }]);
    });
  } else {
    return state;
  }
};

combinedReducer = function(state, action) {
  var childReducers, reduceOverChildren, result;
  if (state == null) {
    state = {};
  }
  state = baseStateReducer(state, action);
  childReducers = {
    'timelines': timelineReducer
  };
  reduceOverChildren = function(acc, key) {
    var changedState;
    changedState = {};
    changedState[key] = childReducers[key](acc[key], action);
    return _.assign({}, acc, changedState);
  };
  result = Object.keys(childReducers).reduce(reduceOverChildren, state);
  Object.freeze(result);
  return result;
};

module.exports = combinedReducer;


},{"./ActionTypes":1,"./util/mapAssign":3,"lodash":"lodash","redux":"redux"}],3:[function(require,module,exports){

/*
Utility for mapping `Object.assign()` over arrays and objects.

@param obj [Object] Source object to map over and mutate.
@param path [String] Property path for mapping; can include property names,
  array indices (as numerals), and wildcards (`*`), delimited by `.`.
@param makeValue [Function] Function to determine new value to be placed at
  `path`. Parameters are:
    value - The current value at `path`, or `undefined` if path doesn't exist
      yet.
    wildcardValues - An array of values at each subpath ending in a wildcard,
      based on the current iteration.
    wildcards - An array of property names or indices of the wildcards, based
      on the current iteration.

@example

    obj =
      a: 1
      b: [
        {c: {p1: 1}}
        {c: {p2: 2, p3: 3}}
      ]

    result =
      mapAssign obj, 'b.*.c.*', (value, wildcardsValues, wildcards) ->
        console.log '=========='
        console.log 'value:', value
        console.log 'wildcardValues:', wildcardValues
        console.log 'wildcards:', wildcards
        return value + 1

     * Output:
     * ==========
     * value: 1
     * wildcardValues: [{c: {p1: 1}}, 1]
     * wildcards: [0, 'p1']
     * ==========
     * value: 2
     * wildcardValues: [{c: {p2: 2, p3: 3}}, 2]
     * wildcards: [0, 'p2']
     * ==========
     * value: 3
     * wildcardValues: [{c: {p2: 2, p3: 3}}, 3]
     * wildcards: [1, 'p3']


     * true
    result ==
      a: 1
      b: [
        {c: {p1: 2}}
        {c: {p2: 3, p3: 4}}
      ]
 */
var mapAssign,
  slice = [].slice;

module.exports = mapAssign = function(obj, pathString, makeValue) {
  var r;
  r = function(path, node, wildcardValues, wildcards) {
    var _, elm, first, i, j, key, keys, len, newWildcardValues, newWildcards, next, ref, results, results1, tail;
    if (wildcardValues == null) {
      wildcardValues = [];
    }
    if (wildcards == null) {
      wildcards = [];
    }
    if (path.length === 0) {
      return node;
    }
    if (node == null) {
      return {
        node: node,
        wildcardValues: wildcardValues,
        wildcards: wildcards
      };
    }
    first = path[0], tail = 2 <= path.length ? slice.call(path, 1) : [];
    next = tail[0], _ = 2 <= tail.length ? slice.call(tail, 1) : [];
    switch (first) {
      case '*':
        keys = node.constructor === Array ? (function() {
          results = [];
          for (var i = 0, ref = node.length; 0 <= ref ? i < ref : i > ref; 0 <= ref ? i++ : i--){ results.push(i); }
          return results;
        }).apply(this) : Object.keys(node);
        results1 = [];
        for (j = 0, len = keys.length; j < len; j++) {
          key = keys[j];
          elm = node[key];
          newWildcardValues = slice.call(wildcardValues).concat([elm]);
          newWildcards = slice.call(wildcards).concat([key]);
          if (next != null) {
            results1.push(r(tail, elm, newWildcardValues, newWildcards));
          } else {
            results1.push(node[key] = makeValue(elm, newWildcardValues, newWildcards));
          }
        }
        return results1;
        break;
      default:
        key = node.constructor === Array ? (function() {
          var e, error;
          try {
            return parseInt(elm);
          } catch (error) {
            e = error;
            throw new Error('Attempted to index into an array with a non-integer value.');
          }
        })() : first;
        if (next != null) {
          elm = node[key] != null ? node[key] : (function() {
            node[key] = !isNaN(next) ? [] : {};
            return node[key];
          })();
          return r(tail, elm, wildcardValues, wildcards);
        } else {
          return node[key] = makeValue(node[key], wildcardValues, wildcards);
        }
    }
  };
  r(pathString.split('.'), obj);
  return obj;
};


},{}]},{},[2]);

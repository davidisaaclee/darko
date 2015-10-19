(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var _, canvas, container, diffKeys, draw, k, offset, randomColor, reducer, redux, ref, resizeCanvas, setup, setupInteractions, setupTimelines, translate3d, update, wrap;

_ = require('lodash');

redux = require('redux');

k = require('../../src/ActionTypes');

reducer = require('../../src/reducers/base');

ref = require('../../src/util/cssHelpers'), translate3d = ref.translate3d, offset = ref.offset;

wrap = require('../../src/util/wrap');

container = document.getElementById('container');

canvas = document.createElement('canvas');

canvas.width = container.offsetWidth;

canvas.height = container.offsetHeight;

container.appendChild(canvas);

update = function(state, dispatch) {
  (Object.keys(state.entities.dict)).forEach(function(key) {
    if (state.entities.dict[key].attachedTimelines.length === 0) {
      return dispatch({
        type: k.AttachEntityToTimeline,
        data: {
          entity: key,
          timeline: 'timeline-0'
        }
      });
    }
  });
  return draw(canvas.getContext('2d'), state.entities);
};

draw = function(ctx, entities) {
  var entityKeys, getPosition;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.beginPath();
  getPosition = function(entity) {
    var p;
    if (entity != null) {
      p = entities.dict[entity].data.position;
      return {
        x: p.x * ctx.canvas.width,
        y: p.y * ctx.canvas.height
      };
    } else {
      return entity;
    }
  };
  entityKeys = Object.keys(entities.dict);
  entityKeys.forEach(function(key, idx, arr) {
    var pos;
    pos = getPosition(key);
    return ctx.lineTo(pos.x, pos.y);
  });
  ctx.closePath();
  ctx.strokeStyle = 'white';
  ctx.stroke();
  return entityKeys.forEach(function(key, idx, arr) {
    var pos;
    pos = getPosition(key);
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y, 10, 10, 45 * Math.PI / 180, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = entities.dict[key].data.strokeColor;
    return ctx.fill();
  });
};

diffKeys = function(previous, current) {
  return {
    added: (Object.keys(current)).filter(function(key) {
      return previous[key] == null;
    }),
    removed: (Object.keys(previous)).filter(function(key) {
      return current[key] == null;
    })
  };
};

setup = function() {
  var store;
  store = redux.createStore(reducer);
  setupTimelines(store.dispatch);
  setupInteractions(store.dispatch, store);
  return store.subscribe(function() {
    return update(store.getState(), store.dispatch);
  });
};

setupTimelines = function(dispatch) {
  dispatch({
    type: k.AddTimeline,
    data: {
      length: 1,
      shouldLoop: true
    }
  });
  dispatch({
    type: k.AddMapping,
    data: {
      timeline: 'timeline-0',
      mapping: function(progress, entityId, entityData) {
        return _.assign({}, entityData, {
          position: {
            x: 0.5 * ((Math.sin(progress * (75 / Math.PI))) + 1),
            y: 0.5 * ((Math.sin(progress * (50 / Math.PI))) + 1)
          }
        });
      }
    }
  });
  return dispatch({
    type: k.AddTrigger,
    data: {
      timeline: 'timeline-0',
      position: 0.5,
      action: function(progress, entityId, entityData) {
        return _.assign({}, entityData, {
          strokeColor: randomColor()
        });
      }
    }
  });
};

setupInteractions = function(dispatch, store) {
  var addEntityButton, animationOffset, down, getTimelineValue, isAnimating, mouseIsDown, move, previousSliderValue, progressTimeline, shouldMakeNewEntity, startAnimation, startPoint, stopAnimation, time, timelineSlider, timeoutId, up, updateTimeline;
  addEntityButton = document.getElementById('add-entity');
  addEntityButton.addEventListener('click', function() {
    return dispatch({
      type: k.AddEntity,
      data: {
        initialData: {
          strokeColor: 'black',
          position: {
            x: 0,
            y: 0
          }
        }
      }
    });
  });
  timelineSlider = document.getElementById('timeline-slider');
  getTimelineValue = function() {
    return timelineSlider.value / 100;
  };
  previousSliderValue = getTimelineValue();
  progressTimeline = function() {
    var v;
    v = getTimelineValue();
    Object.keys(store.getState().entities.dict).forEach(function(entityId) {
      return dispatch({
        type: k.ProgressEntityTimeline,
        data: {
          entity: entityId,
          timelines: ['timeline-0'],
          delta: v - previousSliderValue
        }
      });
    });
    return previousSliderValue = v;
  };
  timelineSlider.addEventListener('input', progressTimeline);
  timelineSlider.addEventListener('change', progressTimeline);
  isAnimating = true;
  animationOffset = 0;
  time = 0;
  updateTimeline = function(t) {
    time = t;
    window.requestAnimationFrame(updateTimeline);
    if (isAnimating) {
      timelineSlider.value = wrap(0, 100, Math.floor((animationOffset + t) / 40));
      return progressTimeline();
    }
  };
  stopAnimation = function() {
    return isAnimating = false;
  };
  startAnimation = function() {
    if (!isAnimating) {
      isAnimating = true;
      return animationOffset = timelineSlider.value * 30 - time;
    }
  };
  canvas = document.querySelector('canvas');
  startPoint = null;
  timeoutId = null;
  shouldMakeNewEntity = true;
  down = function(pt) {
    shouldMakeNewEntity = true;
    if (timeoutId != null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    timeoutId = setTimeout((function() {
      return shouldMakeNewEntity = false;
    }), 100);
    return startPoint = pt;
  };
  move = function(pt) {
    if (!shouldMakeNewEntity) {
      stopAnimation();
      timelineSlider.value = wrap(0, 100, (pt.x - startPoint.x) / 3);
      return progressTimeline();
    }
  };
  up = function(pt) {
    if (shouldMakeNewEntity) {
      dispatch({
        type: k.AddEntity,
        data: {
          initialData: {
            strokeColor: 'black',
            position: {
              x: 0,
              y: 0
            }
          }
        }
      });
    }
    return startAnimation();
  };
  canvas.addEventListener('touchstart', function(evt) {
    evt.preventDefault();
    return down({
      x: evt.touches[0].clientX,
      y: evt.touches[0].clientY
    });
  });
  canvas.addEventListener('touchmove', function(evt) {
    evt.preventDefault();
    return move({
      x: evt.touches[0].clientX,
      y: evt.touches[0].clientY
    });
  });
  canvas.addEventListener('touchend', function(evt) {
    return up();
  });
  mouseIsDown = false;
  canvas.addEventListener('mousedown', function(evt) {
    mouseIsDown = true;
    return down({
      x: evt.clientX,
      y: evt.clientY
    });
  });
  canvas.addEventListener('mousemove', function(evt) {
    if (mouseIsDown) {
      return move({
        x: evt.clientX,
        y: evt.clientY
      });
    }
  });
  canvas.addEventListener('mouseup', function(evt) {
    mouseIsDown = false;
    return up();
  });
  return updateTimeline();
};

setup();

randomColor = function() {
  var random8bit;
  random8bit = function() {
    return Math.floor(Math.random() * 256);
  };
  return "rgba(" + (random8bit()) + ", " + (random8bit()) + ", " + (random8bit()) + ", 1)";
};

resizeCanvas = function() {
  var bcr;
  canvas = document.querySelector('canvas');
  bcr = canvas.parentNode.getBoundingClientRect();
  canvas.width = bcr.width;
  return canvas.height = bcr.height;
};

window.addEventListener('resize', resizeCanvas, false);

resizeCanvas();


},{"../../src/ActionTypes":91,"../../src/reducers/base":92,"../../src/util/cssHelpers":97,"../../src/util/wrap":99,"lodash":"lodash","redux":"redux"}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
/**
 * Gets the last element of `array`.
 *
 * @static
 * @memberOf _
 * @category Array
 * @param {Array} array The array to query.
 * @returns {*} Returns the last element of `array`.
 * @example
 *
 * _.last([1, 2, 3]);
 * // => 3
 */
function last(array) {
  var length = array ? array.length : 0;
  return length ? array[length - 1] : undefined;
}

module.exports = last;

},{}],4:[function(require,module,exports){
var arrayEach = require('../internal/arrayEach'),
    baseEach = require('../internal/baseEach'),
    createForEach = require('../internal/createForEach');

/**
 * Iterates over elements of `collection` invoking `iteratee` for each element.
 * The `iteratee` is bound to `thisArg` and invoked with three arguments:
 * (value, index|key, collection). Iteratee functions may exit iteration early
 * by explicitly returning `false`.
 *
 * **Note:** As with other "Collections" methods, objects with a "length" property
 * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`
 * may be used for object iteration.
 *
 * @static
 * @memberOf _
 * @alias each
 * @category Collection
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @param {*} [thisArg] The `this` binding of `iteratee`.
 * @returns {Array|Object|string} Returns `collection`.
 * @example
 *
 * _([1, 2]).forEach(function(n) {
 *   console.log(n);
 * }).value();
 * // => logs each value from left to right and returns the array
 *
 * _.forEach({ 'a': 1, 'b': 2 }, function(n, key) {
 *   console.log(n, key);
 * });
 * // => logs each value-key pair and returns the object (iteration order is not guaranteed)
 */
var forEach = createForEach(arrayEach, baseEach);

module.exports = forEach;

},{"../internal/arrayEach":9,"../internal/baseEach":16,"../internal/createForEach":40}],5:[function(require,module,exports){
var arrayMap = require('../internal/arrayMap'),
    baseCallback = require('../internal/baseCallback'),
    baseMap = require('../internal/baseMap'),
    isArray = require('../lang/isArray');

/**
 * Creates an array of values by running each element in `collection` through
 * `iteratee`. The `iteratee` is bound to `thisArg` and invoked with three
 * arguments: (value, index|key, collection).
 *
 * If a property name is provided for `iteratee` the created `_.property`
 * style callback returns the property value of the given element.
 *
 * If a value is also provided for `thisArg` the created `_.matchesProperty`
 * style callback returns `true` for elements that have a matching property
 * value, else `false`.
 *
 * If an object is provided for `iteratee` the created `_.matches` style
 * callback returns `true` for elements that have the properties of the given
 * object, else `false`.
 *
 * Many lodash methods are guarded to work as iteratees for methods like
 * `_.every`, `_.filter`, `_.map`, `_.mapValues`, `_.reject`, and `_.some`.
 *
 * The guarded methods are:
 * `ary`, `callback`, `chunk`, `clone`, `create`, `curry`, `curryRight`,
 * `drop`, `dropRight`, `every`, `fill`, `flatten`, `invert`, `max`, `min`,
 * `parseInt`, `slice`, `sortBy`, `take`, `takeRight`, `template`, `trim`,
 * `trimLeft`, `trimRight`, `trunc`, `random`, `range`, `sample`, `some`,
 * `sum`, `uniq`, and `words`
 *
 * @static
 * @memberOf _
 * @alias collect
 * @category Collection
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function|Object|string} [iteratee=_.identity] The function invoked
 *  per iteration.
 * @param {*} [thisArg] The `this` binding of `iteratee`.
 * @returns {Array} Returns the new mapped array.
 * @example
 *
 * function timesThree(n) {
 *   return n * 3;
 * }
 *
 * _.map([1, 2], timesThree);
 * // => [3, 6]
 *
 * _.map({ 'a': 1, 'b': 2 }, timesThree);
 * // => [3, 6] (iteration order is not guaranteed)
 *
 * var users = [
 *   { 'user': 'barney' },
 *   { 'user': 'fred' }
 * ];
 *
 * // using the `_.property` callback shorthand
 * _.map(users, 'user');
 * // => ['barney', 'fred']
 */
function map(collection, iteratee, thisArg) {
  var func = isArray(collection) ? arrayMap : baseMap;
  iteratee = baseCallback(iteratee, thisArg, 3);
  return func(collection, iteratee);
}

module.exports = map;

},{"../internal/arrayMap":11,"../internal/baseCallback":14,"../internal/baseMap":27,"../lang/isArray":61}],6:[function(require,module,exports){
var arrayFilter = require('../internal/arrayFilter'),
    baseCallback = require('../internal/baseCallback'),
    baseFilter = require('../internal/baseFilter'),
    isArray = require('../lang/isArray');

/**
 * The opposite of `_.filter`; this method returns the elements of `collection`
 * that `predicate` does **not** return truthy for.
 *
 * @static
 * @memberOf _
 * @category Collection
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function|Object|string} [predicate=_.identity] The function invoked
 *  per iteration.
 * @param {*} [thisArg] The `this` binding of `predicate`.
 * @returns {Array} Returns the new filtered array.
 * @example
 *
 * _.reject([1, 2, 3, 4], function(n) {
 *   return n % 2 == 0;
 * });
 * // => [1, 3]
 *
 * var users = [
 *   { 'user': 'barney', 'age': 36, 'active': false },
 *   { 'user': 'fred',   'age': 40, 'active': true }
 * ];
 *
 * // using the `_.matches` callback shorthand
 * _.pluck(_.reject(users, { 'age': 40, 'active': true }), 'user');
 * // => ['barney']
 *
 * // using the `_.matchesProperty` callback shorthand
 * _.pluck(_.reject(users, 'active', false), 'user');
 * // => ['fred']
 *
 * // using the `_.property` callback shorthand
 * _.pluck(_.reject(users, 'active'), 'user');
 * // => ['barney']
 */
function reject(collection, predicate, thisArg) {
  var func = isArray(collection) ? arrayFilter : baseFilter;
  predicate = baseCallback(predicate, thisArg, 3);
  return func(collection, function(value, index, collection) {
    return !predicate(value, index, collection);
  });
}

module.exports = reject;

},{"../internal/arrayFilter":10,"../internal/baseCallback":14,"../internal/baseFilter":17,"../lang/isArray":61}],7:[function(require,module,exports){
/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/* Native method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * Creates a function that invokes `func` with the `this` binding of the
 * created function and arguments from `start` and beyond provided as an array.
 *
 * **Note:** This method is based on the [rest parameter](https://developer.mozilla.org/Web/JavaScript/Reference/Functions/rest_parameters).
 *
 * @static
 * @memberOf _
 * @category Function
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 * @example
 *
 * var say = _.restParam(function(what, names) {
 *   return what + ' ' + _.initial(names).join(', ') +
 *     (_.size(names) > 1 ? ', & ' : '') + _.last(names);
 * });
 *
 * say('hello', 'fred', 'barney', 'pebbles');
 * // => 'hello fred, barney, & pebbles'
 */
function restParam(func, start) {
  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  start = nativeMax(start === undefined ? (func.length - 1) : (+start || 0), 0);
  return function() {
    var args = arguments,
        index = -1,
        length = nativeMax(args.length - start, 0),
        rest = Array(length);

    while (++index < length) {
      rest[index] = args[start + index];
    }
    switch (start) {
      case 0: return func.call(this, rest);
      case 1: return func.call(this, args[0], rest);
      case 2: return func.call(this, args[0], args[1], rest);
    }
    var otherArgs = Array(start + 1);
    index = -1;
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = rest;
    return func.apply(this, otherArgs);
  };
}

module.exports = restParam;

},{}],8:[function(require,module,exports){
(function (global){
var cachePush = require('./cachePush'),
    getNative = require('./getNative');

/** Native method references. */
var Set = getNative(global, 'Set');

/* Native method references for those with the same name as other `lodash` methods. */
var nativeCreate = getNative(Object, 'create');

/**
 *
 * Creates a cache object to store unique values.
 *
 * @private
 * @param {Array} [values] The values to cache.
 */
function SetCache(values) {
  var length = values ? values.length : 0;

  this.data = { 'hash': nativeCreate(null), 'set': new Set };
  while (length--) {
    this.push(values[length]);
  }
}

// Add functions to the `Set` cache.
SetCache.prototype.push = cachePush;

module.exports = SetCache;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./cachePush":36,"./getNative":47}],9:[function(require,module,exports){
/**
 * A specialized version of `_.forEach` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEach(array, iteratee) {
  var index = -1,
      length = array.length;

  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }
  return array;
}

module.exports = arrayEach;

},{}],10:[function(require,module,exports){
/**
 * A specialized version of `_.filter` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
function arrayFilter(array, predicate) {
  var index = -1,
      length = array.length,
      resIndex = -1,
      result = [];

  while (++index < length) {
    var value = array[index];
    if (predicate(value, index, array)) {
      result[++resIndex] = value;
    }
  }
  return result;
}

module.exports = arrayFilter;

},{}],11:[function(require,module,exports){
/**
 * A specialized version of `_.map` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function arrayMap(array, iteratee) {
  var index = -1,
      length = array.length,
      result = Array(length);

  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}

module.exports = arrayMap;

},{}],12:[function(require,module,exports){
/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}

module.exports = arrayPush;

},{}],13:[function(require,module,exports){
/**
 * A specialized version of `_.some` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if any element passes the predicate check,
 *  else `false`.
 */
function arraySome(array, predicate) {
  var index = -1,
      length = array.length;

  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }
  return false;
}

module.exports = arraySome;

},{}],14:[function(require,module,exports){
var baseMatches = require('./baseMatches'),
    baseMatchesProperty = require('./baseMatchesProperty'),
    bindCallback = require('./bindCallback'),
    identity = require('../utility/identity'),
    property = require('../utility/property');

/**
 * The base implementation of `_.callback` which supports specifying the
 * number of arguments to provide to `func`.
 *
 * @private
 * @param {*} [func=_.identity] The value to convert to a callback.
 * @param {*} [thisArg] The `this` binding of `func`.
 * @param {number} [argCount] The number of arguments to provide to `func`.
 * @returns {Function} Returns the callback.
 */
function baseCallback(func, thisArg, argCount) {
  var type = typeof func;
  if (type == 'function') {
    return thisArg === undefined
      ? func
      : bindCallback(func, thisArg, argCount);
  }
  if (func == null) {
    return identity;
  }
  if (type == 'object') {
    return baseMatches(func);
  }
  return thisArg === undefined
    ? property(func)
    : baseMatchesProperty(func, thisArg);
}

module.exports = baseCallback;

},{"../utility/identity":72,"../utility/property":73,"./baseMatches":28,"./baseMatchesProperty":29,"./bindCallback":34}],15:[function(require,module,exports){
var baseIndexOf = require('./baseIndexOf'),
    cacheIndexOf = require('./cacheIndexOf'),
    createCache = require('./createCache');

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/**
 * The base implementation of `_.difference` which accepts a single array
 * of values to exclude.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Array} values The values to exclude.
 * @returns {Array} Returns the new array of filtered values.
 */
function baseDifference(array, values) {
  var length = array ? array.length : 0,
      result = [];

  if (!length) {
    return result;
  }
  var index = -1,
      indexOf = baseIndexOf,
      isCommon = true,
      cache = (isCommon && values.length >= LARGE_ARRAY_SIZE) ? createCache(values) : null,
      valuesLength = values.length;

  if (cache) {
    indexOf = cacheIndexOf;
    isCommon = false;
    values = cache;
  }
  outer:
  while (++index < length) {
    var value = array[index];

    if (isCommon && value === value) {
      var valuesIndex = valuesLength;
      while (valuesIndex--) {
        if (values[valuesIndex] === value) {
          continue outer;
        }
      }
      result.push(value);
    }
    else if (indexOf(values, value, 0) < 0) {
      result.push(value);
    }
  }
  return result;
}

module.exports = baseDifference;

},{"./baseIndexOf":23,"./cacheIndexOf":35,"./createCache":39}],16:[function(require,module,exports){
var baseForOwn = require('./baseForOwn'),
    createBaseEach = require('./createBaseEach');

/**
 * The base implementation of `_.forEach` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array|Object|string} Returns `collection`.
 */
var baseEach = createBaseEach(baseForOwn);

module.exports = baseEach;

},{"./baseForOwn":21,"./createBaseEach":37}],17:[function(require,module,exports){
var baseEach = require('./baseEach');

/**
 * The base implementation of `_.filter` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
function baseFilter(collection, predicate) {
  var result = [];
  baseEach(collection, function(value, index, collection) {
    if (predicate(value, index, collection)) {
      result.push(value);
    }
  });
  return result;
}

module.exports = baseFilter;

},{"./baseEach":16}],18:[function(require,module,exports){
var arrayPush = require('./arrayPush'),
    isArguments = require('../lang/isArguments'),
    isArray = require('../lang/isArray'),
    isArrayLike = require('./isArrayLike'),
    isObjectLike = require('./isObjectLike');

/**
 * The base implementation of `_.flatten` with added support for restricting
 * flattening and specifying the start index.
 *
 * @private
 * @param {Array} array The array to flatten.
 * @param {boolean} [isDeep] Specify a deep flatten.
 * @param {boolean} [isStrict] Restrict flattening to arrays-like objects.
 * @param {Array} [result=[]] The initial result value.
 * @returns {Array} Returns the new flattened array.
 */
function baseFlatten(array, isDeep, isStrict, result) {
  result || (result = []);

  var index = -1,
      length = array.length;

  while (++index < length) {
    var value = array[index];
    if (isObjectLike(value) && isArrayLike(value) &&
        (isStrict || isArray(value) || isArguments(value))) {
      if (isDeep) {
        // Recursively flatten arrays (susceptible to call stack limits).
        baseFlatten(value, isDeep, isStrict, result);
      } else {
        arrayPush(result, value);
      }
    } else if (!isStrict) {
      result[result.length] = value;
    }
  }
  return result;
}

module.exports = baseFlatten;

},{"../lang/isArguments":60,"../lang/isArray":61,"./arrayPush":12,"./isArrayLike":49,"./isObjectLike":53}],19:[function(require,module,exports){
var createBaseFor = require('./createBaseFor');

/**
 * The base implementation of `baseForIn` and `baseForOwn` which iterates
 * over `object` properties returned by `keysFunc` invoking `iteratee` for
 * each property. Iteratee functions may exit iteration early by explicitly
 * returning `false`.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */
var baseFor = createBaseFor();

module.exports = baseFor;

},{"./createBaseFor":38}],20:[function(require,module,exports){
var baseFor = require('./baseFor'),
    keysIn = require('../object/keysIn');

/**
 * The base implementation of `_.forIn` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForIn(object, iteratee) {
  return baseFor(object, iteratee, keysIn);
}

module.exports = baseForIn;

},{"../object/keysIn":68,"./baseFor":19}],21:[function(require,module,exports){
var baseFor = require('./baseFor'),
    keys = require('../object/keys');

/**
 * The base implementation of `_.forOwn` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForOwn(object, iteratee) {
  return baseFor(object, iteratee, keys);
}

module.exports = baseForOwn;

},{"../object/keys":67,"./baseFor":19}],22:[function(require,module,exports){
var toObject = require('./toObject');

/**
 * The base implementation of `get` without support for string paths
 * and default values.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array} path The path of the property to get.
 * @param {string} [pathKey] The key representation of path.
 * @returns {*} Returns the resolved value.
 */
function baseGet(object, path, pathKey) {
  if (object == null) {
    return;
  }
  if (pathKey !== undefined && pathKey in toObject(object)) {
    path = [pathKey];
  }
  var index = 0,
      length = path.length;

  while (object != null && index < length) {
    object = object[path[index++]];
  }
  return (index && index == length) ? object : undefined;
}

module.exports = baseGet;

},{"./toObject":58}],23:[function(require,module,exports){
var indexOfNaN = require('./indexOfNaN');

/**
 * The base implementation of `_.indexOf` without support for binary searches.
 *
 * @private
 * @param {Array} array The array to search.
 * @param {*} value The value to search for.
 * @param {number} fromIndex The index to search from.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseIndexOf(array, value, fromIndex) {
  if (value !== value) {
    return indexOfNaN(array, fromIndex);
  }
  var index = fromIndex - 1,
      length = array.length;

  while (++index < length) {
    if (array[index] === value) {
      return index;
    }
  }
  return -1;
}

module.exports = baseIndexOf;

},{"./indexOfNaN":48}],24:[function(require,module,exports){
var baseIsEqualDeep = require('./baseIsEqualDeep'),
    isObject = require('../lang/isObject'),
    isObjectLike = require('./isObjectLike');

/**
 * The base implementation of `_.isEqual` without support for `this` binding
 * `customizer` functions.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {Function} [customizer] The function to customize comparing values.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA] Tracks traversed `value` objects.
 * @param {Array} [stackB] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 */
function baseIsEqual(value, other, customizer, isLoose, stackA, stackB) {
  if (value === other) {
    return true;
  }
  if (value == null || other == null || (!isObject(value) && !isObjectLike(other))) {
    return value !== value && other !== other;
  }
  return baseIsEqualDeep(value, other, baseIsEqual, customizer, isLoose, stackA, stackB);
}

module.exports = baseIsEqual;

},{"../lang/isObject":64,"./baseIsEqualDeep":25,"./isObjectLike":53}],25:[function(require,module,exports){
var equalArrays = require('./equalArrays'),
    equalByTag = require('./equalByTag'),
    equalObjects = require('./equalObjects'),
    isArray = require('../lang/isArray'),
    isTypedArray = require('../lang/isTypedArray');

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    objectTag = '[object Object]';

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * A specialized version of `baseIsEqual` for arrays and objects which performs
 * deep comparisons and tracks traversed objects enabling objects with circular
 * references to be compared.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} [customizer] The function to customize comparing objects.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA=[]] Tracks traversed `value` objects.
 * @param {Array} [stackB=[]] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function baseIsEqualDeep(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
  var objIsArr = isArray(object),
      othIsArr = isArray(other),
      objTag = arrayTag,
      othTag = arrayTag;

  if (!objIsArr) {
    objTag = objToString.call(object);
    if (objTag == argsTag) {
      objTag = objectTag;
    } else if (objTag != objectTag) {
      objIsArr = isTypedArray(object);
    }
  }
  if (!othIsArr) {
    othTag = objToString.call(other);
    if (othTag == argsTag) {
      othTag = objectTag;
    } else if (othTag != objectTag) {
      othIsArr = isTypedArray(other);
    }
  }
  var objIsObj = objTag == objectTag,
      othIsObj = othTag == objectTag,
      isSameTag = objTag == othTag;

  if (isSameTag && !(objIsArr || objIsObj)) {
    return equalByTag(object, other, objTag);
  }
  if (!isLoose) {
    var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
        othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

    if (objIsWrapped || othIsWrapped) {
      return equalFunc(objIsWrapped ? object.value() : object, othIsWrapped ? other.value() : other, customizer, isLoose, stackA, stackB);
    }
  }
  if (!isSameTag) {
    return false;
  }
  // Assume cyclic values are equal.
  // For more information on detecting circular references see https://es5.github.io/#JO.
  stackA || (stackA = []);
  stackB || (stackB = []);

  var length = stackA.length;
  while (length--) {
    if (stackA[length] == object) {
      return stackB[length] == other;
    }
  }
  // Add `object` and `other` to the stack of traversed objects.
  stackA.push(object);
  stackB.push(other);

  var result = (objIsArr ? equalArrays : equalObjects)(object, other, equalFunc, customizer, isLoose, stackA, stackB);

  stackA.pop();
  stackB.pop();

  return result;
}

module.exports = baseIsEqualDeep;

},{"../lang/isArray":61,"../lang/isTypedArray":66,"./equalArrays":42,"./equalByTag":43,"./equalObjects":44}],26:[function(require,module,exports){
var baseIsEqual = require('./baseIsEqual'),
    toObject = require('./toObject');

/**
 * The base implementation of `_.isMatch` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Object} object The object to inspect.
 * @param {Array} matchData The propery names, values, and compare flags to match.
 * @param {Function} [customizer] The function to customize comparing objects.
 * @returns {boolean} Returns `true` if `object` is a match, else `false`.
 */
function baseIsMatch(object, matchData, customizer) {
  var index = matchData.length,
      length = index,
      noCustomizer = !customizer;

  if (object == null) {
    return !length;
  }
  object = toObject(object);
  while (index--) {
    var data = matchData[index];
    if ((noCustomizer && data[2])
          ? data[1] !== object[data[0]]
          : !(data[0] in object)
        ) {
      return false;
    }
  }
  while (++index < length) {
    data = matchData[index];
    var key = data[0],
        objValue = object[key],
        srcValue = data[1];

    if (noCustomizer && data[2]) {
      if (objValue === undefined && !(key in object)) {
        return false;
      }
    } else {
      var result = customizer ? customizer(objValue, srcValue, key) : undefined;
      if (!(result === undefined ? baseIsEqual(srcValue, objValue, customizer, true) : result)) {
        return false;
      }
    }
  }
  return true;
}

module.exports = baseIsMatch;

},{"./baseIsEqual":24,"./toObject":58}],27:[function(require,module,exports){
var baseEach = require('./baseEach'),
    isArrayLike = require('./isArrayLike');

/**
 * The base implementation of `_.map` without support for callback shorthands
 * and `this` binding.
 *
 * @private
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function baseMap(collection, iteratee) {
  var index = -1,
      result = isArrayLike(collection) ? Array(collection.length) : [];

  baseEach(collection, function(value, key, collection) {
    result[++index] = iteratee(value, key, collection);
  });
  return result;
}

module.exports = baseMap;

},{"./baseEach":16,"./isArrayLike":49}],28:[function(require,module,exports){
var baseIsMatch = require('./baseIsMatch'),
    getMatchData = require('./getMatchData'),
    toObject = require('./toObject');

/**
 * The base implementation of `_.matches` which does not clone `source`.
 *
 * @private
 * @param {Object} source The object of property values to match.
 * @returns {Function} Returns the new function.
 */
function baseMatches(source) {
  var matchData = getMatchData(source);
  if (matchData.length == 1 && matchData[0][2]) {
    var key = matchData[0][0],
        value = matchData[0][1];

    return function(object) {
      if (object == null) {
        return false;
      }
      return object[key] === value && (value !== undefined || (key in toObject(object)));
    };
  }
  return function(object) {
    return baseIsMatch(object, matchData);
  };
}

module.exports = baseMatches;

},{"./baseIsMatch":26,"./getMatchData":46,"./toObject":58}],29:[function(require,module,exports){
var baseGet = require('./baseGet'),
    baseIsEqual = require('./baseIsEqual'),
    baseSlice = require('./baseSlice'),
    isArray = require('../lang/isArray'),
    isKey = require('./isKey'),
    isStrictComparable = require('./isStrictComparable'),
    last = require('../array/last'),
    toObject = require('./toObject'),
    toPath = require('./toPath');

/**
 * The base implementation of `_.matchesProperty` which does not clone `srcValue`.
 *
 * @private
 * @param {string} path The path of the property to get.
 * @param {*} srcValue The value to compare.
 * @returns {Function} Returns the new function.
 */
function baseMatchesProperty(path, srcValue) {
  var isArr = isArray(path),
      isCommon = isKey(path) && isStrictComparable(srcValue),
      pathKey = (path + '');

  path = toPath(path);
  return function(object) {
    if (object == null) {
      return false;
    }
    var key = pathKey;
    object = toObject(object);
    if ((isArr || !isCommon) && !(key in object)) {
      object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
      if (object == null) {
        return false;
      }
      key = last(path);
      object = toObject(object);
    }
    return object[key] === srcValue
      ? (srcValue !== undefined || (key in object))
      : baseIsEqual(srcValue, object[key], undefined, true);
  };
}

module.exports = baseMatchesProperty;

},{"../array/last":3,"../lang/isArray":61,"./baseGet":22,"./baseIsEqual":24,"./baseSlice":32,"./isKey":51,"./isStrictComparable":54,"./toObject":58,"./toPath":59}],30:[function(require,module,exports){
/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

module.exports = baseProperty;

},{}],31:[function(require,module,exports){
var baseGet = require('./baseGet'),
    toPath = require('./toPath');

/**
 * A specialized version of `baseProperty` which supports deep paths.
 *
 * @private
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new function.
 */
function basePropertyDeep(path) {
  var pathKey = (path + '');
  path = toPath(path);
  return function(object) {
    return baseGet(object, path, pathKey);
  };
}

module.exports = basePropertyDeep;

},{"./baseGet":22,"./toPath":59}],32:[function(require,module,exports){
/**
 * The base implementation of `_.slice` without an iteratee call guard.
 *
 * @private
 * @param {Array} array The array to slice.
 * @param {number} [start=0] The start position.
 * @param {number} [end=array.length] The end position.
 * @returns {Array} Returns the slice of `array`.
 */
function baseSlice(array, start, end) {
  var index = -1,
      length = array.length;

  start = start == null ? 0 : (+start || 0);
  if (start < 0) {
    start = -start > length ? 0 : (length + start);
  }
  end = (end === undefined || end > length) ? length : (+end || 0);
  if (end < 0) {
    end += length;
  }
  length = start > end ? 0 : ((end - start) >>> 0);
  start >>>= 0;

  var result = Array(length);
  while (++index < length) {
    result[index] = array[index + start];
  }
  return result;
}

module.exports = baseSlice;

},{}],33:[function(require,module,exports){
/**
 * Converts `value` to a string if it's not one. An empty string is returned
 * for `null` or `undefined` values.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  return value == null ? '' : (value + '');
}

module.exports = baseToString;

},{}],34:[function(require,module,exports){
var identity = require('../utility/identity');

/**
 * A specialized version of `baseCallback` which only supports `this` binding
 * and specifying the number of arguments to provide to `func`.
 *
 * @private
 * @param {Function} func The function to bind.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {number} [argCount] The number of arguments to provide to `func`.
 * @returns {Function} Returns the callback.
 */
function bindCallback(func, thisArg, argCount) {
  if (typeof func != 'function') {
    return identity;
  }
  if (thisArg === undefined) {
    return func;
  }
  switch (argCount) {
    case 1: return function(value) {
      return func.call(thisArg, value);
    };
    case 3: return function(value, index, collection) {
      return func.call(thisArg, value, index, collection);
    };
    case 4: return function(accumulator, value, index, collection) {
      return func.call(thisArg, accumulator, value, index, collection);
    };
    case 5: return function(value, other, key, object, source) {
      return func.call(thisArg, value, other, key, object, source);
    };
  }
  return function() {
    return func.apply(thisArg, arguments);
  };
}

module.exports = bindCallback;

},{"../utility/identity":72}],35:[function(require,module,exports){
var isObject = require('../lang/isObject');

/**
 * Checks if `value` is in `cache` mimicking the return signature of
 * `_.indexOf` by returning `0` if the value is found, else `-1`.
 *
 * @private
 * @param {Object} cache The cache to search.
 * @param {*} value The value to search for.
 * @returns {number} Returns `0` if `value` is found, else `-1`.
 */
function cacheIndexOf(cache, value) {
  var data = cache.data,
      result = (typeof value == 'string' || isObject(value)) ? data.set.has(value) : data.hash[value];

  return result ? 0 : -1;
}

module.exports = cacheIndexOf;

},{"../lang/isObject":64}],36:[function(require,module,exports){
var isObject = require('../lang/isObject');

/**
 * Adds `value` to the cache.
 *
 * @private
 * @name push
 * @memberOf SetCache
 * @param {*} value The value to cache.
 */
function cachePush(value) {
  var data = this.data;
  if (typeof value == 'string' || isObject(value)) {
    data.set.add(value);
  } else {
    data.hash[value] = true;
  }
}

module.exports = cachePush;

},{"../lang/isObject":64}],37:[function(require,module,exports){
var getLength = require('./getLength'),
    isLength = require('./isLength'),
    toObject = require('./toObject');

/**
 * Creates a `baseEach` or `baseEachRight` function.
 *
 * @private
 * @param {Function} eachFunc The function to iterate over a collection.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseEach(eachFunc, fromRight) {
  return function(collection, iteratee) {
    var length = collection ? getLength(collection) : 0;
    if (!isLength(length)) {
      return eachFunc(collection, iteratee);
    }
    var index = fromRight ? length : -1,
        iterable = toObject(collection);

    while ((fromRight ? index-- : ++index < length)) {
      if (iteratee(iterable[index], index, iterable) === false) {
        break;
      }
    }
    return collection;
  };
}

module.exports = createBaseEach;

},{"./getLength":45,"./isLength":52,"./toObject":58}],38:[function(require,module,exports){
var toObject = require('./toObject');

/**
 * Creates a base function for `_.forIn` or `_.forInRight`.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseFor(fromRight) {
  return function(object, iteratee, keysFunc) {
    var iterable = toObject(object),
        props = keysFunc(object),
        length = props.length,
        index = fromRight ? length : -1;

    while ((fromRight ? index-- : ++index < length)) {
      var key = props[index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}

module.exports = createBaseFor;

},{"./toObject":58}],39:[function(require,module,exports){
(function (global){
var SetCache = require('./SetCache'),
    getNative = require('./getNative');

/** Native method references. */
var Set = getNative(global, 'Set');

/* Native method references for those with the same name as other `lodash` methods. */
var nativeCreate = getNative(Object, 'create');

/**
 * Creates a `Set` cache object to optimize linear searches of large arrays.
 *
 * @private
 * @param {Array} [values] The values to cache.
 * @returns {null|Object} Returns the new cache object if `Set` is supported, else `null`.
 */
function createCache(values) {
  return (nativeCreate && Set) ? new SetCache(values) : null;
}

module.exports = createCache;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./SetCache":8,"./getNative":47}],40:[function(require,module,exports){
var bindCallback = require('./bindCallback'),
    isArray = require('../lang/isArray');

/**
 * Creates a function for `_.forEach` or `_.forEachRight`.
 *
 * @private
 * @param {Function} arrayFunc The function to iterate over an array.
 * @param {Function} eachFunc The function to iterate over a collection.
 * @returns {Function} Returns the new each function.
 */
function createForEach(arrayFunc, eachFunc) {
  return function(collection, iteratee, thisArg) {
    return (typeof iteratee == 'function' && thisArg === undefined && isArray(collection))
      ? arrayFunc(collection, iteratee)
      : eachFunc(collection, bindCallback(iteratee, thisArg, 3));
  };
}

module.exports = createForEach;

},{"../lang/isArray":61,"./bindCallback":34}],41:[function(require,module,exports){
var baseCallback = require('./baseCallback'),
    baseForOwn = require('./baseForOwn');

/**
 * Creates a function for `_.mapKeys` or `_.mapValues`.
 *
 * @private
 * @param {boolean} [isMapKeys] Specify mapping keys instead of values.
 * @returns {Function} Returns the new map function.
 */
function createObjectMapper(isMapKeys) {
  return function(object, iteratee, thisArg) {
    var result = {};
    iteratee = baseCallback(iteratee, thisArg, 3);

    baseForOwn(object, function(value, key, object) {
      var mapped = iteratee(value, key, object);
      key = isMapKeys ? mapped : key;
      value = isMapKeys ? value : mapped;
      result[key] = value;
    });
    return result;
  };
}

module.exports = createObjectMapper;

},{"./baseCallback":14,"./baseForOwn":21}],42:[function(require,module,exports){
var arraySome = require('./arraySome');

/**
 * A specialized version of `baseIsEqualDeep` for arrays with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Array} array The array to compare.
 * @param {Array} other The other array to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} [customizer] The function to customize comparing arrays.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA] Tracks traversed `value` objects.
 * @param {Array} [stackB] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
 */
function equalArrays(array, other, equalFunc, customizer, isLoose, stackA, stackB) {
  var index = -1,
      arrLength = array.length,
      othLength = other.length;

  if (arrLength != othLength && !(isLoose && othLength > arrLength)) {
    return false;
  }
  // Ignore non-index properties.
  while (++index < arrLength) {
    var arrValue = array[index],
        othValue = other[index],
        result = customizer ? customizer(isLoose ? othValue : arrValue, isLoose ? arrValue : othValue, index) : undefined;

    if (result !== undefined) {
      if (result) {
        continue;
      }
      return false;
    }
    // Recursively compare arrays (susceptible to call stack limits).
    if (isLoose) {
      if (!arraySome(other, function(othValue) {
            return arrValue === othValue || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB);
          })) {
        return false;
      }
    } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB))) {
      return false;
    }
  }
  return true;
}

module.exports = equalArrays;

},{"./arraySome":13}],43:[function(require,module,exports){
/** `Object#toString` result references. */
var boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    numberTag = '[object Number]',
    regexpTag = '[object RegExp]',
    stringTag = '[object String]';

/**
 * A specialized version of `baseIsEqualDeep` for comparing objects of
 * the same `toStringTag`.
 *
 * **Note:** This function only supports comparing values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {string} tag The `toStringTag` of the objects to compare.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalByTag(object, other, tag) {
  switch (tag) {
    case boolTag:
    case dateTag:
      // Coerce dates and booleans to numbers, dates to milliseconds and booleans
      // to `1` or `0` treating invalid dates coerced to `NaN` as not equal.
      return +object == +other;

    case errorTag:
      return object.name == other.name && object.message == other.message;

    case numberTag:
      // Treat `NaN` vs. `NaN` as equal.
      return (object != +object)
        ? other != +other
        : object == +other;

    case regexpTag:
    case stringTag:
      // Coerce regexes to strings and treat strings primitives and string
      // objects as equal. See https://es5.github.io/#x15.10.6.4 for more details.
      return object == (other + '');
  }
  return false;
}

module.exports = equalByTag;

},{}],44:[function(require,module,exports){
var keys = require('../object/keys');

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * A specialized version of `baseIsEqualDeep` for objects with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} [customizer] The function to customize comparing values.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA] Tracks traversed `value` objects.
 * @param {Array} [stackB] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalObjects(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
  var objProps = keys(object),
      objLength = objProps.length,
      othProps = keys(other),
      othLength = othProps.length;

  if (objLength != othLength && !isLoose) {
    return false;
  }
  var index = objLength;
  while (index--) {
    var key = objProps[index];
    if (!(isLoose ? key in other : hasOwnProperty.call(other, key))) {
      return false;
    }
  }
  var skipCtor = isLoose;
  while (++index < objLength) {
    key = objProps[index];
    var objValue = object[key],
        othValue = other[key],
        result = customizer ? customizer(isLoose ? othValue : objValue, isLoose? objValue : othValue, key) : undefined;

    // Recursively compare objects (susceptible to call stack limits).
    if (!(result === undefined ? equalFunc(objValue, othValue, customizer, isLoose, stackA, stackB) : result)) {
      return false;
    }
    skipCtor || (skipCtor = key == 'constructor');
  }
  if (!skipCtor) {
    var objCtor = object.constructor,
        othCtor = other.constructor;

    // Non `Object` object instances with different constructors are not equal.
    if (objCtor != othCtor &&
        ('constructor' in object && 'constructor' in other) &&
        !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
          typeof othCtor == 'function' && othCtor instanceof othCtor)) {
      return false;
    }
  }
  return true;
}

module.exports = equalObjects;

},{"../object/keys":67}],45:[function(require,module,exports){
var baseProperty = require('./baseProperty');

/**
 * Gets the "length" property value of `object`.
 *
 * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
 * that affects Safari on at least iOS 8.1-8.3 ARM64.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {*} Returns the "length" value.
 */
var getLength = baseProperty('length');

module.exports = getLength;

},{"./baseProperty":30}],46:[function(require,module,exports){
var isStrictComparable = require('./isStrictComparable'),
    pairs = require('../object/pairs');

/**
 * Gets the propery names, values, and compare flags of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the match data of `object`.
 */
function getMatchData(object) {
  var result = pairs(object),
      length = result.length;

  while (length--) {
    result[length][2] = isStrictComparable(result[length][1]);
  }
  return result;
}

module.exports = getMatchData;

},{"../object/pairs":71,"./isStrictComparable":54}],47:[function(require,module,exports){
var isNative = require('../lang/isNative');

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = object == null ? undefined : object[key];
  return isNative(value) ? value : undefined;
}

module.exports = getNative;

},{"../lang/isNative":63}],48:[function(require,module,exports){
/**
 * Gets the index at which the first occurrence of `NaN` is found in `array`.
 *
 * @private
 * @param {Array} array The array to search.
 * @param {number} fromIndex The index to search from.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {number} Returns the index of the matched `NaN`, else `-1`.
 */
function indexOfNaN(array, fromIndex, fromRight) {
  var length = array.length,
      index = fromIndex + (fromRight ? 0 : -1);

  while ((fromRight ? index-- : ++index < length)) {
    var other = array[index];
    if (other !== other) {
      return index;
    }
  }
  return -1;
}

module.exports = indexOfNaN;

},{}],49:[function(require,module,exports){
var getLength = require('./getLength'),
    isLength = require('./isLength');

/**
 * Checks if `value` is array-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 */
function isArrayLike(value) {
  return value != null && isLength(getLength(value));
}

module.exports = isArrayLike;

},{"./getLength":45,"./isLength":52}],50:[function(require,module,exports){
/** Used to detect unsigned integer values. */
var reIsUint = /^\d+$/;

/**
 * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  value = (typeof value == 'number' || reIsUint.test(value)) ? +value : -1;
  length = length == null ? MAX_SAFE_INTEGER : length;
  return value > -1 && value % 1 == 0 && value < length;
}

module.exports = isIndex;

},{}],51:[function(require,module,exports){
var isArray = require('../lang/isArray'),
    toObject = require('./toObject');

/** Used to match property names within property paths. */
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\n\\]|\\.)*?\1)\]/,
    reIsPlainProp = /^\w*$/;

/**
 * Checks if `value` is a property name and not a property path.
 *
 * @private
 * @param {*} value The value to check.
 * @param {Object} [object] The object to query keys on.
 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
 */
function isKey(value, object) {
  var type = typeof value;
  if ((type == 'string' && reIsPlainProp.test(value)) || type == 'number') {
    return true;
  }
  if (isArray(value)) {
    return false;
  }
  var result = !reIsDeepProp.test(value);
  return result || (object != null && value in toObject(object));
}

module.exports = isKey;

},{"../lang/isArray":61,"./toObject":58}],52:[function(require,module,exports){
/**
 * Used as the [maximum length](http://ecma-international.org/ecma-262/6.0/#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This function is based on [`ToLength`](http://ecma-international.org/ecma-262/6.0/#sec-tolength).
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

module.exports = isLength;

},{}],53:[function(require,module,exports){
/**
 * Checks if `value` is object-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

module.exports = isObjectLike;

},{}],54:[function(require,module,exports){
var isObject = require('../lang/isObject');

/**
 * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` if suitable for strict
 *  equality comparisons, else `false`.
 */
function isStrictComparable(value) {
  return value === value && !isObject(value);
}

module.exports = isStrictComparable;

},{"../lang/isObject":64}],55:[function(require,module,exports){
var toObject = require('./toObject');

/**
 * A specialized version of `_.pick` which picks `object` properties specified
 * by `props`.
 *
 * @private
 * @param {Object} object The source object.
 * @param {string[]} props The property names to pick.
 * @returns {Object} Returns the new object.
 */
function pickByArray(object, props) {
  object = toObject(object);

  var index = -1,
      length = props.length,
      result = {};

  while (++index < length) {
    var key = props[index];
    if (key in object) {
      result[key] = object[key];
    }
  }
  return result;
}

module.exports = pickByArray;

},{"./toObject":58}],56:[function(require,module,exports){
var baseForIn = require('./baseForIn');

/**
 * A specialized version of `_.pick` which picks `object` properties `predicate`
 * returns truthy for.
 *
 * @private
 * @param {Object} object The source object.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Object} Returns the new object.
 */
function pickByCallback(object, predicate) {
  var result = {};
  baseForIn(object, function(value, key, object) {
    if (predicate(value, key, object)) {
      result[key] = value;
    }
  });
  return result;
}

module.exports = pickByCallback;

},{"./baseForIn":20}],57:[function(require,module,exports){
var isArguments = require('../lang/isArguments'),
    isArray = require('../lang/isArray'),
    isIndex = require('./isIndex'),
    isLength = require('./isLength'),
    keysIn = require('../object/keysIn');

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * A fallback implementation of `Object.keys` which creates an array of the
 * own enumerable property names of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function shimKeys(object) {
  var props = keysIn(object),
      propsLength = props.length,
      length = propsLength && object.length;

  var allowIndexes = !!length && isLength(length) &&
    (isArray(object) || isArguments(object));

  var index = -1,
      result = [];

  while (++index < propsLength) {
    var key = props[index];
    if ((allowIndexes && isIndex(key, length)) || hasOwnProperty.call(object, key)) {
      result.push(key);
    }
  }
  return result;
}

module.exports = shimKeys;

},{"../lang/isArguments":60,"../lang/isArray":61,"../object/keysIn":68,"./isIndex":50,"./isLength":52}],58:[function(require,module,exports){
var isObject = require('../lang/isObject');

/**
 * Converts `value` to an object if it's not one.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {Object} Returns the object.
 */
function toObject(value) {
  return isObject(value) ? value : Object(value);
}

module.exports = toObject;

},{"../lang/isObject":64}],59:[function(require,module,exports){
var baseToString = require('./baseToString'),
    isArray = require('../lang/isArray');

/** Used to match property names within property paths. */
var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\n\\]|\\.)*?)\2)\]/g;

/** Used to match backslashes in property paths. */
var reEscapeChar = /\\(\\)?/g;

/**
 * Converts `value` to property path array if it's not one.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {Array} Returns the property path array.
 */
function toPath(value) {
  if (isArray(value)) {
    return value;
  }
  var result = [];
  baseToString(value).replace(rePropName, function(match, number, quote, string) {
    result.push(quote ? string.replace(reEscapeChar, '$1') : (number || match));
  });
  return result;
}

module.exports = toPath;

},{"../lang/isArray":61,"./baseToString":33}],60:[function(require,module,exports){
var isArrayLike = require('../internal/isArrayLike'),
    isObjectLike = require('../internal/isObjectLike');

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Native method references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/**
 * Checks if `value` is classified as an `arguments` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
function isArguments(value) {
  return isObjectLike(value) && isArrayLike(value) &&
    hasOwnProperty.call(value, 'callee') && !propertyIsEnumerable.call(value, 'callee');
}

module.exports = isArguments;

},{"../internal/isArrayLike":49,"../internal/isObjectLike":53}],61:[function(require,module,exports){
var getNative = require('../internal/getNative'),
    isLength = require('../internal/isLength'),
    isObjectLike = require('../internal/isObjectLike');

/** `Object#toString` result references. */
var arrayTag = '[object Array]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/* Native method references for those with the same name as other `lodash` methods. */
var nativeIsArray = getNative(Array, 'isArray');

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(function() { return arguments; }());
 * // => false
 */
var isArray = nativeIsArray || function(value) {
  return isObjectLike(value) && isLength(value.length) && objToString.call(value) == arrayTag;
};

module.exports = isArray;

},{"../internal/getNative":47,"../internal/isLength":52,"../internal/isObjectLike":53}],62:[function(require,module,exports){
var isObject = require('./isObject');

/** `Object#toString` result references. */
var funcTag = '[object Function]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in older versions of Chrome and Safari which return 'function' for regexes
  // and Safari 8 which returns 'object' for typed array constructors.
  return isObject(value) && objToString.call(value) == funcTag;
}

module.exports = isFunction;

},{"./isObject":64}],63:[function(require,module,exports){
var isFunction = require('./isFunction'),
    isObjectLike = require('../internal/isObjectLike');

/** Used to detect host constructors (Safari > 5). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var fnToString = Function.prototype.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  fnToString.call(hasOwnProperty).replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/**
 * Checks if `value` is a native function.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function, else `false`.
 * @example
 *
 * _.isNative(Array.prototype.push);
 * // => true
 *
 * _.isNative(_);
 * // => false
 */
function isNative(value) {
  if (value == null) {
    return false;
  }
  if (isFunction(value)) {
    return reIsNative.test(fnToString.call(value));
  }
  return isObjectLike(value) && reIsHostCtor.test(value);
}

module.exports = isNative;

},{"../internal/isObjectLike":53,"./isFunction":62}],64:[function(require,module,exports){
/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

module.exports = isObject;

},{}],65:[function(require,module,exports){
var baseForIn = require('../internal/baseForIn'),
    isArguments = require('./isArguments'),
    isObjectLike = require('../internal/isObjectLike');

/** `Object#toString` result references. */
var objectTag = '[object Object]';

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is a plain object, that is, an object created by the
 * `Object` constructor or one with a `[[Prototype]]` of `null`.
 *
 * **Note:** This method assumes objects created by the `Object` constructor
 * have no inherited enumerable properties.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * _.isPlainObject(new Foo);
 * // => false
 *
 * _.isPlainObject([1, 2, 3]);
 * // => false
 *
 * _.isPlainObject({ 'x': 0, 'y': 0 });
 * // => true
 *
 * _.isPlainObject(Object.create(null));
 * // => true
 */
function isPlainObject(value) {
  var Ctor;

  // Exit early for non `Object` objects.
  if (!(isObjectLike(value) && objToString.call(value) == objectTag && !isArguments(value)) ||
      (!hasOwnProperty.call(value, 'constructor') && (Ctor = value.constructor, typeof Ctor == 'function' && !(Ctor instanceof Ctor)))) {
    return false;
  }
  // IE < 9 iterates inherited properties before own properties. If the first
  // iterated property is an object's own property then there are no inherited
  // enumerable properties.
  var result;
  // In most environments an object's own properties are iterated before
  // its inherited properties. If the last iterated property is an object's
  // own property then there are no inherited enumerable properties.
  baseForIn(value, function(subValue, key) {
    result = key;
  });
  return result === undefined || hasOwnProperty.call(value, result);
}

module.exports = isPlainObject;

},{"../internal/baseForIn":20,"../internal/isObjectLike":53,"./isArguments":60}],66:[function(require,module,exports){
var isLength = require('../internal/isLength'),
    isObjectLike = require('../internal/isObjectLike');

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
typedArrayTags[dateTag] = typedArrayTags[errorTag] =
typedArrayTags[funcTag] = typedArrayTags[mapTag] =
typedArrayTags[numberTag] = typedArrayTags[objectTag] =
typedArrayTags[regexpTag] = typedArrayTags[setTag] =
typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
function isTypedArray(value) {
  return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[objToString.call(value)];
}

module.exports = isTypedArray;

},{"../internal/isLength":52,"../internal/isObjectLike":53}],67:[function(require,module,exports){
var getNative = require('../internal/getNative'),
    isArrayLike = require('../internal/isArrayLike'),
    isObject = require('../lang/isObject'),
    shimKeys = require('../internal/shimKeys');

/* Native method references for those with the same name as other `lodash` methods. */
var nativeKeys = getNative(Object, 'keys');

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/6.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
var keys = !nativeKeys ? shimKeys : function(object) {
  var Ctor = object == null ? undefined : object.constructor;
  if ((typeof Ctor == 'function' && Ctor.prototype === object) ||
      (typeof object != 'function' && isArrayLike(object))) {
    return shimKeys(object);
  }
  return isObject(object) ? nativeKeys(object) : [];
};

module.exports = keys;

},{"../internal/getNative":47,"../internal/isArrayLike":49,"../internal/shimKeys":57,"../lang/isObject":64}],68:[function(require,module,exports){
var isArguments = require('../lang/isArguments'),
    isArray = require('../lang/isArray'),
    isIndex = require('../internal/isIndex'),
    isLength = require('../internal/isLength'),
    isObject = require('../lang/isObject');

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Creates an array of the own and inherited enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keysIn(new Foo);
 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
 */
function keysIn(object) {
  if (object == null) {
    return [];
  }
  if (!isObject(object)) {
    object = Object(object);
  }
  var length = object.length;
  length = (length && isLength(length) &&
    (isArray(object) || isArguments(object)) && length) || 0;

  var Ctor = object.constructor,
      index = -1,
      isProto = typeof Ctor == 'function' && Ctor.prototype === object,
      result = Array(length),
      skipIndexes = length > 0;

  while (++index < length) {
    result[index] = (index + '');
  }
  for (var key in object) {
    if (!(skipIndexes && isIndex(key, length)) &&
        !(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}

module.exports = keysIn;

},{"../internal/isIndex":50,"../internal/isLength":52,"../lang/isArguments":60,"../lang/isArray":61,"../lang/isObject":64}],69:[function(require,module,exports){
var createObjectMapper = require('../internal/createObjectMapper');

/**
 * Creates an object with the same keys as `object` and values generated by
 * running each own enumerable property of `object` through `iteratee`. The
 * iteratee function is bound to `thisArg` and invoked with three arguments:
 * (value, key, object).
 *
 * If a property name is provided for `iteratee` the created `_.property`
 * style callback returns the property value of the given element.
 *
 * If a value is also provided for `thisArg` the created `_.matchesProperty`
 * style callback returns `true` for elements that have a matching property
 * value, else `false`.
 *
 * If an object is provided for `iteratee` the created `_.matches` style
 * callback returns `true` for elements that have the properties of the given
 * object, else `false`.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to iterate over.
 * @param {Function|Object|string} [iteratee=_.identity] The function invoked
 *  per iteration.
 * @param {*} [thisArg] The `this` binding of `iteratee`.
 * @returns {Object} Returns the new mapped object.
 * @example
 *
 * _.mapValues({ 'a': 1, 'b': 2 }, function(n) {
 *   return n * 3;
 * });
 * // => { 'a': 3, 'b': 6 }
 *
 * var users = {
 *   'fred':    { 'user': 'fred',    'age': 40 },
 *   'pebbles': { 'user': 'pebbles', 'age': 1 }
 * };
 *
 * // using the `_.property` callback shorthand
 * _.mapValues(users, 'age');
 * // => { 'fred': 40, 'pebbles': 1 } (iteration order is not guaranteed)
 */
var mapValues = createObjectMapper();

module.exports = mapValues;

},{"../internal/createObjectMapper":41}],70:[function(require,module,exports){
var arrayMap = require('../internal/arrayMap'),
    baseDifference = require('../internal/baseDifference'),
    baseFlatten = require('../internal/baseFlatten'),
    bindCallback = require('../internal/bindCallback'),
    keysIn = require('./keysIn'),
    pickByArray = require('../internal/pickByArray'),
    pickByCallback = require('../internal/pickByCallback'),
    restParam = require('../function/restParam');

/**
 * The opposite of `_.pick`; this method creates an object composed of the
 * own and inherited enumerable properties of `object` that are not omitted.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The source object.
 * @param {Function|...(string|string[])} [predicate] The function invoked per
 *  iteration or property names to omit, specified as individual property
 *  names or arrays of property names.
 * @param {*} [thisArg] The `this` binding of `predicate`.
 * @returns {Object} Returns the new object.
 * @example
 *
 * var object = { 'user': 'fred', 'age': 40 };
 *
 * _.omit(object, 'age');
 * // => { 'user': 'fred' }
 *
 * _.omit(object, _.isNumber);
 * // => { 'user': 'fred' }
 */
var omit = restParam(function(object, props) {
  if (object == null) {
    return {};
  }
  if (typeof props[0] != 'function') {
    var props = arrayMap(baseFlatten(props), String);
    return pickByArray(object, baseDifference(keysIn(object), props));
  }
  var predicate = bindCallback(props[0], props[1], 3);
  return pickByCallback(object, function(value, key, object) {
    return !predicate(value, key, object);
  });
});

module.exports = omit;

},{"../function/restParam":7,"../internal/arrayMap":11,"../internal/baseDifference":15,"../internal/baseFlatten":18,"../internal/bindCallback":34,"../internal/pickByArray":55,"../internal/pickByCallback":56,"./keysIn":68}],71:[function(require,module,exports){
var keys = require('./keys'),
    toObject = require('../internal/toObject');

/**
 * Creates a two dimensional array of the key-value pairs for `object`,
 * e.g. `[[key1, value1], [key2, value2]]`.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the new array of key-value pairs.
 * @example
 *
 * _.pairs({ 'barney': 36, 'fred': 40 });
 * // => [['barney', 36], ['fred', 40]] (iteration order is not guaranteed)
 */
function pairs(object) {
  object = toObject(object);

  var index = -1,
      props = keys(object),
      length = props.length,
      result = Array(length);

  while (++index < length) {
    var key = props[index];
    result[index] = [key, object[key]];
  }
  return result;
}

module.exports = pairs;

},{"../internal/toObject":58,"./keys":67}],72:[function(require,module,exports){
/**
 * This method returns the first argument provided to it.
 *
 * @static
 * @memberOf _
 * @category Utility
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'user': 'fred' };
 *
 * _.identity(object) === object;
 * // => true
 */
function identity(value) {
  return value;
}

module.exports = identity;

},{}],73:[function(require,module,exports){
var baseProperty = require('../internal/baseProperty'),
    basePropertyDeep = require('../internal/basePropertyDeep'),
    isKey = require('../internal/isKey');

/**
 * Creates a function that returns the property value at `path` on a
 * given object.
 *
 * @static
 * @memberOf _
 * @category Utility
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new function.
 * @example
 *
 * var objects = [
 *   { 'a': { 'b': { 'c': 2 } } },
 *   { 'a': { 'b': { 'c': 1 } } }
 * ];
 *
 * _.map(objects, _.property('a.b.c'));
 * // => [2, 1]
 *
 * _.pluck(_.sortBy(objects, _.property(['a', 'b', 'c'])), 'a.b.c');
 * // => [1, 2]
 */
function property(path) {
  return isKey(path) ? baseProperty(path) : basePropertyDeep(path);
}

module.exports = property;

},{"../internal/baseProperty":30,"../internal/basePropertyDeep":31,"../internal/isKey":51}],74:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _freeze = require('./freeze');

/**
 * Returns a function that always returns the supplied value.
 *
 * Useful for replacing an object outright rather than merging it.
 *
 * @function
 * @sig a -> (* -> a)
 * @memberOf u
 * @param  {*} value what to return from returned function.
 * @return {function} a new function that will always return value.
 *
 * @example
 * var alwaysFour = u.constant(4);
 * expect(alwaysFour(32)).toEqual(4);
 *
 * @example
 * var user = {
 *   name: 'Mitch',
 *   favorites: {
 *     band: 'Nirvana',
 *     movie: 'The Matrix'
 *   }
 * };
 *
 * var newFavorites = {
 *   band: 'Coldplay'
 * };
 *
 * var result = u({ favorites: u.constant(newFavorites) }, user);
 *
 * expect(result).toEqual({ name: 'Mitch', favorites: { band: 'Coldplay' } });
 */

var _freeze2 = _interopRequireDefault(_freeze);

function constant(value) {
  var frozen = _freeze2['default'](value);
  return function () {
    return frozen;
  };
}

exports['default'] = constant;
module.exports = exports['default'];
},{"./freeze":75}],75:[function(require,module,exports){
(function (process){
'use strict';

exports.__esModule = true;
function isFreezable(object) {
  if (object === null) return false;

  return Array.isArray(object) || typeof object === 'object';
}

function needsFreezing(object) {
  return isFreezable(object) && !Object.isFrozen(object);
}

function recur(object) {
  Object.freeze(object);

  Object.keys(object).forEach(function (key) {
    var value = object[key];
    if (needsFreezing(value)) {
      recur(value);
    }
  });

  return object;
}

/**
 * Deeply freeze a plain javascript object.
 *
 * If `process.env.NODE_ENV === 'production'`, this returns the original object
 * witout freezing.
 *
 * @function
 * @sig a -> a
 * @param  {object} object Object to freeze.
 * @return {object} Frozen object, unless in production, then the same object.
 */
function freeze(object) {
  if (process.env.NODE_ENV === 'production') {
    return object;
  }

  if (needsFreezing(object)) {
    recur(object);
  }

  return object;
}

exports['default'] = freeze;
module.exports = exports['default'];
}).call(this,require('_process'))

},{"_process":2}],76:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _ifElse = require('./ifElse');

var _ifElse2 = _interopRequireDefault(_ifElse);

var _utilCurry = require('./util/curry');

var _utilCurry2 = _interopRequireDefault(_utilCurry);

exports['default'] = _utilCurry2['default'](function (predicate, trueUpdates, object) {
  return _ifElse2['default'](predicate, trueUpdates, function (x) {
    return x;
  }, object);
});
module.exports = exports['default'];
},{"./ifElse":77,"./util/curry":85}],77:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _update = require('./update');

var _update2 = _interopRequireDefault(_update);

var _wrap = require('./wrap');

var _wrap2 = _interopRequireDefault(_wrap);

function updateIfElse(predicate, trueUpdates, falseUpdates, object) {
  var test = typeof predicate === 'function' ? predicate(object) : predicate;

  var updates = test ? trueUpdates : falseUpdates;

  return _update2['default'](updates, object);
}

exports['default'] = _wrap2['default'](updateIfElse);
module.exports = exports['default'];
},{"./update":83,"./wrap":90}],78:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _constant = require('./constant');

var _constant2 = _interopRequireDefault(_constant);

var _freeze = require('./freeze');

var _freeze2 = _interopRequireDefault(_freeze);

var _is = require('./is');

var _is2 = _interopRequireDefault(_is);

var _if2 = require('./if');

var _if3 = _interopRequireDefault(_if2);

var _ifElse = require('./ifElse');

var _ifElse2 = _interopRequireDefault(_ifElse);

var _map = require('./map');

var _map2 = _interopRequireDefault(_map);

var _omit = require('./omit');

var _omit2 = _interopRequireDefault(_omit);

var _reject = require('./reject');

var _reject2 = _interopRequireDefault(_reject);

var _update = require('./update');

var _update2 = _interopRequireDefault(_update);

var _updateIn = require('./updateIn');

var _updateIn2 = _interopRequireDefault(_updateIn);

var _withDefault = require('./withDefault');

var _withDefault2 = _interopRequireDefault(_withDefault);

var _utilCurry = require('./util/curry');

var u = _update2['default'];

u._ = _utilCurry._;
u.constant = _constant2['default'];
u['if'] = _if3['default'];
u.ifElse = _ifElse2['default'];
u.is = _is2['default'];
u.freeze = _freeze2['default'];
u.map = _map2['default'];
u.omit = _omit2['default'];
u.reject = _reject2['default'];
u.update = _update2['default'];
u.updateIn = _updateIn2['default'];
u.withDefault = _withDefault2['default'];

exports['default'] = u;
module.exports = exports['default'];
},{"./constant":74,"./freeze":75,"./if":76,"./ifElse":77,"./is":79,"./map":80,"./omit":81,"./reject":82,"./update":83,"./updateIn":84,"./util/curry":85,"./withDefault":89}],79:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _utilSplitPath = require('./util/splitPath');

var _utilSplitPath2 = _interopRequireDefault(_utilSplitPath);

var _utilCurry = require('./util/curry');

var _utilCurry2 = _interopRequireDefault(_utilCurry);

function is(path, predicate, object) {
  var parts = _utilSplitPath2['default'](path);

  var rest = object;
  var part = undefined;
  for (var _iterator = parts, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
    if (_isArray) {
      if (_i >= _iterator.length) break;
      part = _iterator[_i++];
    } else {
      _i = _iterator.next();
      if (_i.done) break;
      part = _i.value;
    }

    if (typeof rest === 'undefined') return false;
    rest = rest[part];
  }

  if (typeof predicate === 'function') {
    return predicate(rest);
  }

  return predicate === rest;
}

exports['default'] = _utilCurry2['default'](is);
module.exports = exports['default'];
},{"./util/curry":85,"./util/splitPath":88}],80:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _update = require('./update');

var _update2 = _interopRequireDefault(_update);

var _wrap = require('./wrap');

var _wrap2 = _interopRequireDefault(_wrap);

var _lodashCollectionForEach = require('lodash/collection/forEach');

var _lodashCollectionForEach2 = _interopRequireDefault(_lodashCollectionForEach);

var _lodashCollectionMap = require('lodash/collection/map');

var _lodashCollectionMap2 = _interopRequireDefault(_lodashCollectionMap);

var _lodashObjectMapValues = require('lodash/object/mapValues');

var _lodashObjectMapValues2 = _interopRequireDefault(_lodashObjectMapValues);

function shallowEqual(object, otherObject) {
  var equal = true;
  _lodashCollectionForEach2['default'](otherObject, function (value, key) {
    if (value !== object[key]) {
      equal = false;

      // exit early
      return false;
    }
  });

  return equal;
}

function map(iteratee, object) {
  var updater = typeof iteratee === 'function' ? iteratee : _update2['default'](iteratee);

  var mapper = Array.isArray(object) ? _lodashCollectionMap2['default'] : _lodashObjectMapValues2['default'];

  var newObject = mapper(object, updater);
  var equal = shallowEqual(object, newObject);

  return equal ? object : newObject;
}

exports['default'] = _wrap2['default'](map);
module.exports = exports['default'];
},{"./update":83,"./wrap":90,"lodash/collection/forEach":4,"lodash/collection/map":5,"lodash/object/mapValues":69}],81:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodashObjectOmit = require('lodash/object/omit');

var _lodashObjectOmit2 = _interopRequireDefault(_lodashObjectOmit);

var _wrap = require('./wrap');

var _wrap2 = _interopRequireDefault(_wrap);

function omit(predicate, collection) {
  return _lodashObjectOmit2['default'](collection, predicate);
}

exports['default'] = _wrap2['default'](omit);
module.exports = exports['default'];
},{"./wrap":90,"lodash/object/omit":70}],82:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodashCollectionReject = require('lodash/collection/reject');

var _lodashCollectionReject2 = _interopRequireDefault(_lodashCollectionReject);

var _wrap = require('./wrap');

var _wrap2 = _interopRequireDefault(_wrap);

function reject(predicate, collection) {
  return _lodashCollectionReject2['default'](collection, predicate);
}

exports['default'] = _wrap2['default'](reject);
module.exports = exports['default'];
},{"./wrap":90,"lodash/collection/reject":6}],83:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _wrap = require('./wrap');

var _wrap2 = _interopRequireDefault(_wrap);

var _utilIsEmpty = require('./util/isEmpty');

var _utilIsEmpty2 = _interopRequireDefault(_utilIsEmpty);

var _utilDefaultObject = require('./util/defaultObject');

var _utilDefaultObject2 = _interopRequireDefault(_utilDefaultObject);

var _lodashLangIsPlainObject = require('lodash/lang/isPlainObject');

var _lodashLangIsPlainObject2 = _interopRequireDefault(_lodashLangIsPlainObject);

function reduce(object, callback, initialValue) {
  return Object.keys(object).reduce(function (acc, key) {
    return callback(acc, object[key], key);
  }, initialValue);
}

function resolveUpdates(updates, object) {
  return reduce(updates, function (acc, value, key) {
    var updatedValue = value;

    if (!Array.isArray(value) && value !== null && typeof value === 'object') {
      updatedValue = update(value, object[key]);
    } else if (typeof value === 'function') {
      updatedValue = value(object[key]);
    }

    if (object[key] !== updatedValue) {
      acc[key] = updatedValue;
    }

    return acc;
  }, {});
}

function updateArray(updates, object) {
  var newArray = [].concat(object);

  Object.keys(updates).forEach(function (key) {
    newArray[key] = updates[key];
  });

  return newArray;
}

/**
 * Recursively update an object or array.
 *
 * Can update with values:
 * update({ foo: 3 }, { foo: 1, bar: 2 });
 * // => { foo: 3, bar: 2 }
 *
 * Or with a function:
 * update({ foo: x => (x + 1) }, { foo: 2 });
 * // => { foo: 3 }
 *
 * @function
 * @name update
 * @param {Object|Function} updates
 * @param {Object|Array}    object to update
 * @return {Object|Array}   new object with modifications
 */
function update(updates, object) {
  if (typeof updates === 'function') {
    for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      args[_key - 2] = arguments[_key];
    }

    return updates.apply(undefined, [object].concat(args));
  }

  if (!_lodashLangIsPlainObject2['default'](updates)) {
    return updates;
  }

  var defaultedObject = _utilDefaultObject2['default'](object, updates);

  var resolvedUpdates = resolveUpdates(updates, defaultedObject);

  if (_utilIsEmpty2['default'](resolvedUpdates)) {
    return defaultedObject;
  }

  if (Array.isArray(defaultedObject)) {
    return updateArray(resolvedUpdates, defaultedObject);
  }

  return _extends({}, defaultedObject, resolvedUpdates);
}

exports['default'] = _wrap2['default'](update, 2);
module.exports = exports['default'];
},{"./util/defaultObject":86,"./util/isEmpty":87,"./wrap":90,"lodash/lang/isPlainObject":65}],84:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _utilCurry = require('./util/curry');

var _utilCurry2 = _interopRequireDefault(_utilCurry);

var _update2 = require('./update');

var _update3 = _interopRequireDefault(_update2);

var _map = require('./map');

var _map2 = _interopRequireDefault(_map);

var _utilSplitPath = require('./util/splitPath');

var _utilSplitPath2 = _interopRequireDefault(_utilSplitPath);

var wildcard = '*';

function reducePath(acc, key) {
  var _ref;

  if (key === wildcard) {
    return function (value) {
      var _update;

      return Object.prototype.hasOwnProperty.call(value, wildcard) ?
      // If we actually have wildcard as a property, update that
      _update3['default']((_update = {}, _update[wildcard] = acc, _update), value) :
      // Otherwise map over all properties
      _map2['default'](acc, value);
    };
  }

  return (_ref = {}, _ref[key] = acc, _ref);
}

function updateIn(path, value, object) {
  var parts = _utilSplitPath2['default'](path);
  var updates = parts.reduceRight(reducePath, value);

  return _update3['default'](updates, object);
}

exports['default'] = _utilCurry2['default'](updateIn);
module.exports = exports['default'];
},{"./map":80,"./update":83,"./util/curry":85,"./util/splitPath":88}],85:[function(require,module,exports){
/* eslint no-shadow:0, no-param-reassign:0 */
'use strict';

exports.__esModule = true;
exports.curry1 = curry1;
exports.curry2 = curry2;
exports.curry3 = curry3;
exports.curry4 = curry4;
exports['default'] = curry;
var _ = '@@updeep/placeholder';

exports._ = _;
function countArguments(args, max) {
  var n = args.length;
  if (n > max) n = max;

  while (args[n - 1] === _) {
    n--;
  }

  return n;
}

function curry1(fn) {
  return function curried(a) {
    for (var _len = arguments.length, _ref = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      _ref[_key - 1] = arguments[_key];
    }

    var b = _ref[0],
        c = _ref[1];

    var n = countArguments(arguments);

    if (n >= 1) return fn(a, b, c);
    return curried;
  };
}

function curry2(fn) {
  return function curried(a, b) {
    for (var _len2 = arguments.length, _ref2 = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
      _ref2[_key2 - 2] = arguments[_key2];
    }

    var c = _ref2[0],
        d = _ref2[1];

    var n = countArguments(arguments, 2);

    if (b === _ || c === _ || d === _) {
      throw new Error('Can only use placeholder on first argument of this function.');
    }

    if (n >= 2) {
      if (a === _) return curry1(function (a, c, d) {
        return fn(a, b, c, d);
      });
      return fn(a, b, c, d);
    }

    if (n === 1) return curry1(function (b, c, d) {
      return fn(a, b, c, d);
    });
    return curried;
  };
}

function curry3(fn) {
  return function curried(a, b, c) {
    for (var _len3 = arguments.length, _ref3 = Array(_len3 > 3 ? _len3 - 3 : 0), _key3 = 3; _key3 < _len3; _key3++) {
      _ref3[_key3 - 3] = arguments[_key3];
    }

    var d = _ref3[0],
        e = _ref3[1];

    var n = countArguments(arguments, 3);

    if (c === _ || d === _ || e === _) {
      throw new Error('Can only use placeholder on first or second argument of this function.');
    }

    if (n >= 3) {
      if (a === _) {
        if (b === _) return curry2(function (a, b, d, e) {
          return fn(a, b, c, d, e);
        });
        return curry1(function (a, d, e) {
          return fn(a, b, c, d, e);
        });
      }
      if (b === _) return curry1(function (b, d, e) {
        return fn(a, b, c, d, e);
      });
      return fn(a, b, c, d, e);
    }

    if (n === 2) {
      if (a === _) return curry2(function (a, c, d, e) {
        return fn(a, b, c, d, e);
      });
      return curry1(function (c, d, e) {
        return fn(a, b, c, d, e);
      });
    }

    if (n === 1) return curry2(function (b, c, d, e) {
      return fn(a, b, c, d, e);
    });

    return curried;
  };
}

function curry4(fn) {
  return function curried(a, b, c, d) {
    for (var _len4 = arguments.length, _ref4 = Array(_len4 > 4 ? _len4 - 4 : 0), _key4 = 4; _key4 < _len4; _key4++) {
      _ref4[_key4 - 4] = arguments[_key4];
    }

    var e = _ref4[0],
        f = _ref4[1];

    var n = countArguments(arguments, 4);

    if (d === _ || e === _ || f === _) {
      throw new Error('Can only use placeholder on first, second or third argument of this function.');
    }

    if (n >= 4) {
      if (a === _) {
        if (b === _) {
          if (c === _) return curry3(function (a, b, c, e, f) {
            return fn(a, b, c, d, e, f);
          });
          return curry2(function (a, b, e, f) {
            return fn(a, b, c, d, e, f);
          });
        }
        if (c === _) return curry2(function (a, c, e, f) {
          return fn(a, b, c, d, e, f);
        });
        return curry1(function (a, e, f) {
          return fn(a, b, c, d, e, f);
        });
      }
      if (b === _) {
        if (c === _) return curry2(function (b, c, e, f) {
          return fn(a, b, c, d, e, f);
        });
        return curry1(function (b, e, f) {
          return fn(a, b, c, d, e, f);
        });
      }
      if (c === _) return curry1(function (c, e, f) {
        return fn(a, b, c, d, e, f);
      });
      return fn(a, b, c, d, e, f);
    }

    if (n === 3) {
      if (a === _) {
        if (b === _) return curry3(function (a, b, d, e, f) {
          return fn(a, b, c, d, e, f);
        });
        return curry2(function (a, d, e, f) {
          return fn(a, b, c, d, e, f);
        });
      }
      if (b === _) return curry2(function (b, d, e, f) {
        return fn(a, b, c, d, e, f);
      });
      return curry1(function (d, e, f) {
        return fn(a, b, c, d, e, f);
      });
    }

    if (n === 2) {
      if (a === _) return curry3(function (a, c, d, e, f) {
        return fn(a, b, c, d, e, f);
      });
      return curry2(function (c, d, e, f) {
        return fn(a, b, c, d, e, f);
      });
    }

    if (n === 1) return curry3(function (b, c, d, e, f) {
      return fn(a, b, c, d, e, f);
    });
    return curried;
  };
}

function curry(fn) {
  var length = arguments.length <= 1 || arguments[1] === undefined ? fn.length : arguments[1];
  return (function () {
    return [fn, curry1, curry2, curry3, curry4][length](fn);
  })();
}
},{}],86:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _isEmpty = require('./isEmpty');

var _isEmpty2 = _interopRequireDefault(_isEmpty);

function isInt(value) {
  if (isNaN(value)) {
    return false;
  }
  var x = parseFloat(value);
  return (x | 0) === x;
}

function isArrayUpdate(updates) {
  for (var _iterator = Object.keys(updates), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
    var _ref;

    if (_isArray) {
      if (_i >= _iterator.length) break;
      _ref = _iterator[_i++];
    } else {
      _i = _iterator.next();
      if (_i.done) break;
      _ref = _i.value;
    }

    var updateKey = _ref;

    if (!isInt(updateKey)) {
      return false;
    }
  }

  return true;
}

function arrayOrObject(updates) {
  if (!_isEmpty2['default'](updates) && isArrayUpdate(updates)) {
    return [];
  }

  return {};
}

function defaultObject(object, updates) {
  if (typeof object === 'undefined' || object === null) {
    return arrayOrObject(updates);
  }

  return object;
}

exports['default'] = defaultObject;
module.exports = exports['default'];
},{"./isEmpty":87}],87:[function(require,module,exports){
"use strict";

exports.__esModule = true;
function isEmpty(object) {
  return !Object.keys(object).length;
}

exports["default"] = isEmpty;
module.exports = exports["default"];
},{}],88:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = splitPath;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodashCollectionReject = require('lodash/collection/reject');

var _lodashCollectionReject2 = _interopRequireDefault(_lodashCollectionReject);

function splitPath(path) {
  return Array.isArray(path) ? path : _lodashCollectionReject2['default'](path.split('.'), function (x) {
    return !x;
  });
}

module.exports = exports['default'];
},{"lodash/collection/reject":6}],89:[function(require,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _update = require('./update');

var _update2 = _interopRequireDefault(_update);

var _utilCurry = require('./util/curry');

var _utilCurry2 = _interopRequireDefault(_utilCurry);

function withDefault(defaultValue, updates, object) {
  if (typeof object === 'undefined') {
    return _update2['default'](updates, defaultValue);
  }

  return _update2['default'](updates, object);
}

exports['default'] = _utilCurry2['default'](withDefault);
module.exports = exports['default'];
},{"./update":83,"./util/curry":85}],90:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = wrap;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _utilCurry = require('./util/curry');

var _utilCurry2 = _interopRequireDefault(_utilCurry);

var _freeze = require('./freeze');

var _freeze2 = _interopRequireDefault(_freeze);

function wrap(func) {
  var length = arguments.length <= 1 || arguments[1] === undefined ? func.length : arguments[1];
  return (function () {
    return _utilCurry2['default'](function () {
      return _freeze2['default'](func.apply(undefined, arguments));
    }, length);
  })();
}

module.exports = exports['default'];
},{"./freeze":75,"./util/curry":85}],91:[function(require,module,exports){
var actions;

actions = ['ProgressEntityTimeline', 'AddTrigger', 'AddMapping', 'AddEntity', 'AddTimeline', 'SetTimelineLoop', 'AttachEntityToTimeline', 'UpdateEntityData'];

module.exports = actions.reduce((function(acc, actionType) {
  acc[actionType] = actionType;
  return acc;
}), {});


},{}],92:[function(require,module,exports){
var _, addChildReducers, batchProgress, clamp, entitiesReducer, k, mapAssign, reducer, timelinesReducer, updeep, wrap,
  slice = [].slice;

_ = require('lodash');

updeep = require('updeep');

k = require('../ActionTypes');

mapAssign = require('../util/mapAssign');

addChildReducers = require('../util/addChildReducers');

clamp = require('../util/clamp');

wrap = require('../util/wrap');

timelinesReducer = require('./timelines');

entitiesReducer = require('./entities');


/*
state ::= State
progressInfo ::= { timelineId -> {delta: Float, entities: [entityId]} } # for specific entities
               | { timelineId -> {delta: Float} } # for all attached entities
 */

batchProgress = function(state, progressInfo) {
  var state_, state__;
  state_ = mapAssign(_.cloneDeep(state), 'entities.dict.*.attachedTimelines.*.progress', function(oldProgress, arg, arg1) {
    var entityId, entityObj, newProgress, progressDelta, ref, shouldUpdate, timelineIdx, timelineModel, timelineObj;
    entityObj = arg[0], timelineObj = arg[1];
    entityId = arg1[0], timelineIdx = arg1[1];
    timelineModel = state.timelines.dict[timelineObj.id];
    shouldUpdate = ((ref = progressInfo[timelineObj.id]) != null ? ref.entities : void 0) != null ? _.contains(entityId, progressInfo[timelineObj.id].entities) : progressInfo[timelineObj.id] != null;
    progressDelta = shouldUpdate ? progressInfo[timelineObj.id].delta / timelineModel.length : 0;
    newProgress = timelineModel.shouldLoop ? wrap(0, 1, oldProgress + progressDelta) : clamp(0, 1, oldProgress + progressDelta);
    return newProgress;
  });
  state__ = mapAssign(state_, 'entities.dict.*.data', function(previousData, arg, arg1) {
    var applyTrigger, entityId, entityObj, newTimelines, oldTimelines, reduceTriggers;
    entityObj = arg[0];
    entityId = arg1[0];
    oldTimelines = state.entities.dict[entityId].attachedTimelines;
    newTimelines = entityObj.attachedTimelines;
    applyTrigger = function(newProgress, oldProgress) {
      return function(entityData, trigger) {
        var shouldPerformTrigger;
        shouldPerformTrigger = (function() {
          var ref, ref1;
          switch (false) {
            case !_.isNumber(trigger.position):
              return ((oldProgress < (ref = trigger.position) && ref <= newProgress)) || ((newProgress < (ref1 = trigger.position) && ref1 <= oldProgress));
            case !_.isFunction(trigger.position):
              return trigger.position(newProgress, oldProgress);
            default:
              console.warn('Invalid trigger position on trigger', trigger);
              return false;
          }
        })();
        if (shouldPerformTrigger) {
          return _.assign({}, entityData, trigger.action(newProgress, entityId, entityData));
        } else {
          return entityData;
        }
      };
    };
    reduceTriggers = function(data, __, i) {
      var applyThisTrigger, newProgress, oldProgress, timelineObj;
      timelineObj = state_.timelines.dict[newTimelines[i].id];
      newProgress = newTimelines[i].progress;
      oldProgress = oldTimelines[i].progress;
      applyThisTrigger = applyTrigger(newProgress, oldProgress);
      return timelineObj.triggers.reduce(applyThisTrigger, data);
    };
    return newTimelines.reduce(reduceTriggers, state_.entities.dict[entityId].data);
  });
  return mapAssign(state__, 'entities.dict.*.data', function(previousData, arg, arg1) {
    var applyMapping, entityId, entityObj, r;
    entityObj = arg[0];
    entityId = arg1[0];
    applyMapping = function(progress) {
      return function(entityData, mapping) {
        return _.assign({}, entityData, mapping(progress, entityId, entityData));
      };
    };
    return r = entityObj.attachedTimelines.reduce((function(data, attachedTimeline, idx) {
      var newProgress, timeline, updatedEntityObj;
      timeline = state__.timelines.dict[attachedTimeline.id];
      updatedEntityObj = state__.entities.dict[entityId];
      newProgress = updatedEntityObj.attachedTimelines[idx].progress;
      return timeline.mappings.reduce(applyMapping(newProgress), data);
    }), entityObj.data);
  });
};

reducer = function(state, action) {
  var delta, entity, progress, progressInfo, ref, ref1, ref2, timeline;
  if (state == null) {
    state = {};
  }
  switch (action.type) {
    case k.ProgressTimeline:
      return ref = action.data, timeline = ref.timeline, delta = ref.delta, ref;
    case k.ProgressEntityTimeline:
      ref1 = action.data, entity = ref1.entity, timeline = ref1.timeline, delta = ref1.delta;
      progressInfo = {};
      progressInfo[timeline] = {
        entities: [entity],
        delta: delta
      };
      return batchProgress(state, progressInfo);
    case k.AttachEntityToTimeline:
      ref2 = action.data, entity = ref2.entity, timeline = ref2.timeline, progress = ref2.progress;
      return mapAssign(_.cloneDeep(state), "entities.dict." + entity + ".attachedTimelines", function(oldAttachedTimelines) {
        var checkTimeline, isTimelineAlreadyAttached, newAttachedTimeline;
        checkTimeline = function(tmln) {
          return tmln.id !== timeline;
        };
        isTimelineAlreadyAttached = _.all(oldAttachedTimelines, checkTimeline);
        if (isTimelineAlreadyAttached) {
          if (progress == null) {
            progress = 0;
          }
          newAttachedTimeline = {
            id: timeline,
            progress: progress
          };
          return slice.call(oldAttachedTimelines).concat([newAttachedTimeline]);
        } else {
          return oldAttachedTimelines;
        }
      });
    default:
      return state;
  }
};

module.exports = addChildReducers(reducer, {
  'timelines': timelinesReducer,
  'entities': entitiesReducer
});


},{"../ActionTypes":91,"../util/addChildReducers":95,"../util/clamp":96,"../util/mapAssign":98,"../util/wrap":99,"./entities":93,"./timelines":94,"lodash":"lodash","updeep":78}],93:[function(require,module,exports){
var _, addChildReducers, k, makeNewEntity, mapAssign, reducer, updeep;

_ = require('lodash');

updeep = require('updeep');

k = require('../ActionTypes');

mapAssign = require('../util/mapAssign');

addChildReducers = require('../util/addChildReducers');

makeNewEntity = function(initialData) {
  if (initialData == null) {
    initialData = {};
  }
  return {
    attachedTimelines: [],
    data: initialData
  };
};

reducer = function(state, action) {
  var changes, entity, id, initialData, name, ref, ref1, stateChanges;
  if (state == null) {
    state = {
      dict: {},
      _spawnedCount: 0
    };
  }
  switch (action.type) {
    case k.AddEntity:
      if (action.data != null) {
        ref = action.data, name = ref.name, initialData = ref.initialData;
      }
      id = "entity-" + state._spawnedCount;
      changes = {
        dict: {},
        _spawnedCount: state._spawnedCount + 1
      };
      changes.dict[id] = makeNewEntity(initialData);
      if (name != null) {
        changes.dict[id].name = name;
      }
      return updeep(changes, state);
    case k.UpdateEntityData:
      ref1 = action.data, entity = ref1.entity, changes = ref1.changes;
      if (state.dict[entity] != null) {
        stateChanges = {
          dict: {}
        };
        stateChanges.dict[entity] = {
          data: changes
        };
        return updeep(stateChanges, state);
      } else {
        throw new Error("Attempted to update non-existant entity " + entity + ".");
      }
      break;
    default:
      return state;
  }
};

module.exports = reducer;


},{"../ActionTypes":91,"../util/addChildReducers":95,"../util/mapAssign":98,"lodash":"lodash","updeep":78}],94:[function(require,module,exports){
var _, addChildReducers, k, mapAssign, reducer, updeep,
  slice = [].slice;

_ = require('lodash');

updeep = require('updeep');

k = require('../ActionTypes');

mapAssign = require('../util/mapAssign');

addChildReducers = require('../util/addChildReducers');

reducer = function(state, action) {
  var changes, length, mapping, position, ref, ref1, ref2, ref3, shouldLoop, timeline;
  if (state == null) {
    state = {
      dict: {},
      _spawnedCount: 0
    };
  }
  switch (action.type) {
    case k.AddTimeline:
      ref = _.defaults(action.data, {
        length: 1,
        shouldLoop: false
      }), length = ref.length, shouldLoop = ref.shouldLoop;
      changes = {
        dict: {},
        _spawnedCount: state._spawnedCount + 1
      };
      changes.dict["timeline-" + state._spawnedCount] = {
        length: length,
        shouldLoop: shouldLoop,
        triggers: [],
        mappings: []
      };
      return updeep(changes, state);
    case k.AddTrigger:
      ref1 = action.data, timeline = ref1.timeline, position = ref1.position, action = ref1.action;
      return mapAssign(_.cloneDeep(state), "dict." + timeline + ".triggers", function(oldTriggers) {
        return slice.call(oldTriggers).concat([{
            position: position,
            action: action
          }]);
      });
    case k.AddMapping:
      ref2 = action.data, timeline = ref2.timeline, mapping = ref2.mapping;
      return mapAssign(_.cloneDeep(state), "dict." + timeline + ".mappings", function(oldMappings) {
        return slice.call(oldMappings).concat([mapping]);
      });
    case k.SetTimelineLoop:
      ref3 = action.data, timeline = ref3.timeline, shouldLoop = ref3.shouldLoop;
      return mapAssign(_.cloneDeep(state), "dict." + timeline + ".shouldLoop", function() {
        return shouldLoop;
      });
    default:
      return state;
  }
};

module.exports = reducer;


},{"../ActionTypes":91,"../util/addChildReducers":95,"../util/mapAssign":98,"lodash":"lodash","updeep":78}],95:[function(require,module,exports){
var _, addChildReducers;

_ = require('lodash');

module.exports = addChildReducers = function(baseReducer, childReducers) {
  if (childReducers == null) {
    childReducers = {};
  }
  return function(state, action) {
    var reduceOverChildren, result;
    if (state == null) {
      state = {};
    }
    reduceOverChildren = function(acc, key) {
      var changedState;
      changedState = {};
      changedState[key] = childReducers[key](acc[key], action);
      return _.assign({}, acc, changedState);
    };
    result = Object.keys(childReducers).reduce(reduceOverChildren, state);
    result = baseReducer(result, action);
    Object.freeze(result);
    return result;
  };
};


},{"lodash":"lodash"}],96:[function(require,module,exports){
var clamp;

module.exports = clamp = function(low, high, n) {
  var fn;
  fn = function(n) {
    return Math.min(high, Math.max(low, n));
  };
  if (n != null) {
    return fn(n);
  } else {
    return fn;
  }
};


},{}],97:[function(require,module,exports){
var offset, translate3d;

translate3d = function(x, y, z, element) {
  return ['-webkit-', '-moz-', '-o-', ''].forEach(function(prefix) {
    return element.style[prefix + "transform"] = "translate3d(" + x + ", " + y + ", " + z + ")";
  });
};

offset = function(left, top, element) {
  element.left = left;
  return element.top = top;
};

module.exports = {
  'translate3d': translate3d
};


},{}],98:[function(require,module,exports){

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


},{}],99:[function(require,module,exports){
var wrap;

module.exports = wrap = function(low, high, n) {
  var fn;
  fn = function(n) {
    var range, t;
    range = high - low;
    t = n - low;
    while (t < 0) {
      t += range;
    }
    t = t % range;
    return t + low;
  };
  if (n != null) {
    return fn(n);
  } else {
    return fn;
  }
};


},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvZGF2aWQvRG9jdW1lbnRzL1dvcmsvaG9uZXlwb3dlci9kZW1vL3NyYy9kZW1vLmNvZmZlZSIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2FycmF5L2xhc3QuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2NvbGxlY3Rpb24vZm9yRWFjaC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvY29sbGVjdGlvbi9tYXAuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2NvbGxlY3Rpb24vcmVqZWN0LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9mdW5jdGlvbi9yZXN0UGFyYW0uanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL1NldENhY2hlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9hcnJheUVhY2guanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2FycmF5RmlsdGVyLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9hcnJheU1hcC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYXJyYXlQdXNoLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9hcnJheVNvbWUuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Jhc2VDYWxsYmFjay5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZURpZmZlcmVuY2UuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Jhc2VFYWNoLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9iYXNlRmlsdGVyLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9iYXNlRmxhdHRlbi5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZUZvci5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZUZvckluLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9iYXNlRm9yT3duLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9iYXNlR2V0LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9iYXNlSW5kZXhPZi5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZUlzRXF1YWwuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Jhc2VJc0VxdWFsRGVlcC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZUlzTWF0Y2guanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Jhc2VNYXAuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Jhc2VNYXRjaGVzLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9iYXNlTWF0Y2hlc1Byb3BlcnR5LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9iYXNlUHJvcGVydHkuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Jhc2VQcm9wZXJ0eURlZXAuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2Jhc2VTbGljZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvYmFzZVRvU3RyaW5nLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9iaW5kQ2FsbGJhY2suanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2NhY2hlSW5kZXhPZi5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvY2FjaGVQdXNoLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9jcmVhdGVCYXNlRWFjaC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvY3JlYXRlQmFzZUZvci5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvY3JlYXRlQ2FjaGUuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2NyZWF0ZUZvckVhY2guanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2NyZWF0ZU9iamVjdE1hcHBlci5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvZXF1YWxBcnJheXMuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2VxdWFsQnlUYWcuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2VxdWFsT2JqZWN0cy5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvZ2V0TGVuZ3RoLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9nZXRNYXRjaERhdGEuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2dldE5hdGl2ZS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvaW5kZXhPZk5hTi5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvaXNBcnJheUxpa2UuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2lzSW5kZXguanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL2lzS2V5LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9pc0xlbmd0aC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvaXNPYmplY3RMaWtlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9pc1N0cmljdENvbXBhcmFibGUuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL3BpY2tCeUFycmF5LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC9waWNrQnlDYWxsYmFjay5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvaW50ZXJuYWwvc2hpbUtleXMuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2ludGVybmFsL3RvT2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9pbnRlcm5hbC90b1BhdGguanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2xhbmcvaXNBcmd1bWVudHMuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2xhbmcvaXNBcnJheS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvbGFuZy9pc0Z1bmN0aW9uLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9sYW5nL2lzTmF0aXZlLmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9sYW5nL2lzT2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9sYW5nL2lzUGxhaW5PYmplY3QuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL2xhbmcvaXNUeXBlZEFycmF5LmpzIiwibm9kZV9tb2R1bGVzL2xvZGFzaC9vYmplY3Qva2V5cy5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvb2JqZWN0L2tleXNJbi5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvb2JqZWN0L21hcFZhbHVlcy5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvb2JqZWN0L29taXQuanMiLCJub2RlX21vZHVsZXMvbG9kYXNoL29iamVjdC9wYWlycy5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvdXRpbGl0eS9pZGVudGl0eS5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2gvdXRpbGl0eS9wcm9wZXJ0eS5qcyIsIm5vZGVfbW9kdWxlcy91cGRlZXAvZGlzdC9jb25zdGFudC5qcyIsIm5vZGVfbW9kdWxlcy91cGRlZXAvZGlzdC9mcmVlemUuanMiLCJub2RlX21vZHVsZXMvdXBkZWVwL2Rpc3QvaWYuanMiLCJub2RlX21vZHVsZXMvdXBkZWVwL2Rpc3QvaWZFbHNlLmpzIiwibm9kZV9tb2R1bGVzL3VwZGVlcC9kaXN0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3VwZGVlcC9kaXN0L2lzLmpzIiwibm9kZV9tb2R1bGVzL3VwZGVlcC9kaXN0L21hcC5qcyIsIm5vZGVfbW9kdWxlcy91cGRlZXAvZGlzdC9vbWl0LmpzIiwibm9kZV9tb2R1bGVzL3VwZGVlcC9kaXN0L3JlamVjdC5qcyIsIm5vZGVfbW9kdWxlcy91cGRlZXAvZGlzdC91cGRhdGUuanMiLCJub2RlX21vZHVsZXMvdXBkZWVwL2Rpc3QvdXBkYXRlSW4uanMiLCJub2RlX21vZHVsZXMvdXBkZWVwL2Rpc3QvdXRpbC9jdXJyeS5qcyIsIm5vZGVfbW9kdWxlcy91cGRlZXAvZGlzdC91dGlsL2RlZmF1bHRPYmplY3QuanMiLCJub2RlX21vZHVsZXMvdXBkZWVwL2Rpc3QvdXRpbC9pc0VtcHR5LmpzIiwibm9kZV9tb2R1bGVzL3VwZGVlcC9kaXN0L3V0aWwvc3BsaXRQYXRoLmpzIiwibm9kZV9tb2R1bGVzL3VwZGVlcC9kaXN0L3dpdGhEZWZhdWx0LmpzIiwibm9kZV9tb2R1bGVzL3VwZGVlcC9kaXN0L3dyYXAuanMiLCIvVXNlcnMvZGF2aWQvRG9jdW1lbnRzL1dvcmsvaG9uZXlwb3dlci9zcmMvQWN0aW9uVHlwZXMuY29mZmVlIiwiL1VzZXJzL2RhdmlkL0RvY3VtZW50cy9Xb3JrL2hvbmV5cG93ZXIvc3JjL3JlZHVjZXJzL2Jhc2UuY29mZmVlIiwiL1VzZXJzL2RhdmlkL0RvY3VtZW50cy9Xb3JrL2hvbmV5cG93ZXIvc3JjL3JlZHVjZXJzL2VudGl0aWVzLmNvZmZlZSIsIi9Vc2Vycy9kYXZpZC9Eb2N1bWVudHMvV29yay9ob25leXBvd2VyL3NyYy9yZWR1Y2Vycy90aW1lbGluZXMuY29mZmVlIiwiL1VzZXJzL2RhdmlkL0RvY3VtZW50cy9Xb3JrL2hvbmV5cG93ZXIvc3JjL3V0aWwvYWRkQ2hpbGRSZWR1Y2Vycy5jb2ZmZWUiLCIvVXNlcnMvZGF2aWQvRG9jdW1lbnRzL1dvcmsvaG9uZXlwb3dlci9zcmMvdXRpbC9jbGFtcC5jb2ZmZWUiLCIvVXNlcnMvZGF2aWQvRG9jdW1lbnRzL1dvcmsvaG9uZXlwb3dlci9zcmMvdXRpbC9jc3NIZWxwZXJzLmNvZmZlZSIsIi9Vc2Vycy9kYXZpZC9Eb2N1bWVudHMvV29yay9ob25leXBvd2VyL3NyYy91dGlsL21hcEFzc2lnbi5jb2ZmZWUiLCIvVXNlcnMvZGF2aWQvRG9jdW1lbnRzL1dvcmsvaG9uZXlwb3dlci9zcmMvdXRpbC93cmFwLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLElBQUE7O0FBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxRQUFSOztBQUNKLEtBQUEsR0FBUSxPQUFBLENBQVEsT0FBUjs7QUFDUixDQUFBLEdBQUksT0FBQSxDQUFRLHVCQUFSOztBQUNKLE9BQUEsR0FBVSxPQUFBLENBQVEseUJBQVI7O0FBRVYsTUFBd0IsT0FBQSxDQUFRLDJCQUFSLENBQXhCLEVBQUMsa0JBQUEsV0FBRCxFQUFjLGFBQUE7O0FBRWQsSUFBQSxHQUFPLE9BQUEsQ0FBUSxxQkFBUjs7QUFFUCxTQUFBLEdBQVksUUFBUSxDQUFDLGNBQVQsQ0FBd0IsV0FBeEI7O0FBQ1osTUFBQSxHQUFTLFFBQVEsQ0FBQyxhQUFULENBQXVCLFFBQXZCOztBQUNULE1BQU0sQ0FBQyxLQUFQLEdBQWUsU0FBUyxDQUFDOztBQUN6QixNQUFNLENBQUMsTUFBUCxHQUFnQixTQUFTLENBQUM7O0FBQzFCLFNBQVMsQ0FBQyxXQUFWLENBQXNCLE1BQXRCOztBQUdBLE1BQUEsR0FBUyxTQUFDLEtBQUQsRUFBUSxRQUFSO0VBQ1AsQ0FBQyxNQUFNLENBQUMsSUFBUCxDQUFZLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBM0IsQ0FBRCxDQUFpQyxDQUFDLE9BQWxDLENBQTBDLFNBQUMsR0FBRDtJQUN4QyxJQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSyxDQUFBLEdBQUEsQ0FBSSxDQUFDLGlCQUFpQixDQUFDLE1BQTNDLEtBQXFELENBQXhEO2FBQ0UsUUFBQSxDQUNFO1FBQUEsSUFBQSxFQUFNLENBQUMsQ0FBQyxzQkFBUjtRQUNBLElBQUEsRUFDRTtVQUFBLE1BQUEsRUFBUSxHQUFSO1VBQ0EsUUFBQSxFQUFVLFlBRFY7U0FGRjtPQURGLEVBREY7O0VB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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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VUFBVSxDQUFDLEtBQVgsQ0FBaUIsR0FBakIsQ0FBSCxFQUEwQixHQUExQjtBQUNBLFNBQU87QUF4RW9COzs7O0FDbEU3QixJQUFBOztBQUFBLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLElBQUEsR0FBTyxTQUFDLEdBQUQsRUFBTSxJQUFOLEVBQVksQ0FBWjtBQUN0QixNQUFBO0VBQUEsRUFBQSxHQUFLLFNBQUMsQ0FBRDtBQUNILFFBQUE7SUFBQSxLQUFBLEdBQVEsSUFBQSxHQUFPO0lBQ2YsQ0FBQSxHQUFJLENBQUEsR0FBSTtBQUNSLFdBQU0sQ0FBQSxHQUFJLENBQVY7TUFDRSxDQUFBLElBQUs7SUFEUDtJQUVBLENBQUEsR0FBSSxDQUFBLEdBQUk7QUFDUixXQUFPLENBQUEsR0FBSTtFQU5SO0VBUUwsSUFBRyxTQUFIO1dBQ0ssRUFBQSxDQUFHLENBQUgsRUFETDtHQUFBLE1BQUE7V0FFSyxHQUZMOztBQVRzQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJfID0gcmVxdWlyZSAnbG9kYXNoJ1xucmVkdXggPSByZXF1aXJlICdyZWR1eCdcbmsgPSByZXF1aXJlICcuLi8uLi9zcmMvQWN0aW9uVHlwZXMnXG5yZWR1Y2VyID0gcmVxdWlyZSAnLi4vLi4vc3JjL3JlZHVjZXJzL2Jhc2UnXG5cbnt0cmFuc2xhdGUzZCwgb2Zmc2V0fSA9IHJlcXVpcmUgJy4uLy4uL3NyYy91dGlsL2Nzc0hlbHBlcnMnXG5cbndyYXAgPSByZXF1aXJlICcuLi8uLi9zcmMvdXRpbC93cmFwJ1xuXG5jb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCAnY29udGFpbmVyJ1xuY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnY2FudmFzJ1xuY2FudmFzLndpZHRoID0gY29udGFpbmVyLm9mZnNldFdpZHRoXG5jYW52YXMuaGVpZ2h0ID0gY29udGFpbmVyLm9mZnNldEhlaWdodFxuY29udGFpbmVyLmFwcGVuZENoaWxkIGNhbnZhc1xuXG5cbnVwZGF0ZSA9IChzdGF0ZSwgZGlzcGF0Y2gpIC0+XG4gIChPYmplY3Qua2V5cyBzdGF0ZS5lbnRpdGllcy5kaWN0KS5mb3JFYWNoIChrZXkpIC0+XG4gICAgaWYgc3RhdGUuZW50aXRpZXMuZGljdFtrZXldLmF0dGFjaGVkVGltZWxpbmVzLmxlbmd0aCBpcyAwXG4gICAgICBkaXNwYXRjaFxuICAgICAgICB0eXBlOiBrLkF0dGFjaEVudGl0eVRvVGltZWxpbmVcbiAgICAgICAgZGF0YTpcbiAgICAgICAgICBlbnRpdHk6IGtleVxuICAgICAgICAgIHRpbWVsaW5lOiAndGltZWxpbmUtMCdcblxuICBkcmF3IChjYW52YXMuZ2V0Q29udGV4dCAnMmQnKSwgc3RhdGUuZW50aXRpZXNcblxuXG5kcmF3ID0gKGN0eCwgZW50aXRpZXMpIC0+XG4gIGN0eC5jbGVhclJlY3QoMCwgMCwgY3R4LmNhbnZhcy53aWR0aCwgY3R4LmNhbnZhcy5oZWlnaHQpO1xuICBjdHguYmVnaW5QYXRoKClcblxuICBnZXRQb3NpdGlvbiA9IChlbnRpdHkpIC0+XG4gICAgaWYgZW50aXR5P1xuICAgICAgcCA9IGVudGl0aWVzLmRpY3RbZW50aXR5XS5kYXRhLnBvc2l0aW9uXG4gICAgICB4OiBwLnggKiBjdHguY2FudmFzLndpZHRoXG4gICAgICB5OiBwLnkgKiBjdHguY2FudmFzLmhlaWdodFxuICAgIGVsc2UgZW50aXR5XG5cbiAgZW50aXR5S2V5cyA9IE9iamVjdC5rZXlzIGVudGl0aWVzLmRpY3RcblxuICBlbnRpdHlLZXlzXG4gICAgLmZvckVhY2ggKGtleSwgaWR4LCBhcnIpIC0+XG4gICAgICBwb3MgPSBnZXRQb3NpdGlvbiBrZXlcbiAgICAgIGN0eC5saW5lVG8gcG9zLngsIHBvcy55XG4gIGN0eC5jbG9zZVBhdGgoKVxuICBjdHguc3Ryb2tlU3R5bGUgPSAnd2hpdGUnXG4gIGN0eC5zdHJva2UoKVxuXG4gIGVudGl0eUtleXNcbiAgICAuZm9yRWFjaCAoa2V5LCBpZHgsIGFycikgLT5cbiAgICAgIHBvcyA9IGdldFBvc2l0aW9uIGtleVxuICAgICAgY3R4LmJlZ2luUGF0aCgpXG4gICAgICBjdHguZWxsaXBzZSBwb3MueCwgcG9zLnksIDEwLCAxMCwgNDUgKiBNYXRoLlBJLzE4MCwgMCwgMiAqIE1hdGguUElcbiAgICAgIGN0eC5jbG9zZVBhdGgoKVxuICAgICAgY3R4LmZpbGxTdHlsZSA9IGVudGl0aWVzLmRpY3Rba2V5XS5kYXRhLnN0cm9rZUNvbG9yXG4gICAgICBjdHguZmlsbCgpXG5cblxuXG5kaWZmS2V5cyA9IChwcmV2aW91cywgY3VycmVudCkgLT5cbiAgYWRkZWQ6IChPYmplY3Qua2V5cyBjdXJyZW50KS5maWx0ZXIgKGtleSkgLT4gbm90IHByZXZpb3VzW2tleV0/XG4gIHJlbW92ZWQ6IChPYmplY3Qua2V5cyBwcmV2aW91cykuZmlsdGVyIChrZXkpIC0+IG5vdCBjdXJyZW50W2tleV0/XG5cbnNldHVwID0gKCkgLT5cbiAgc3RvcmUgPSByZWR1eC5jcmVhdGVTdG9yZSByZWR1Y2VyXG5cbiAgc2V0dXBUaW1lbGluZXMgc3RvcmUuZGlzcGF0Y2hcbiAgc2V0dXBJbnRlcmFjdGlvbnMgc3RvcmUuZGlzcGF0Y2gsIHN0b3JlXG5cbiAgc3RvcmUuc3Vic2NyaWJlICgpIC0+XG4gICAgdXBkYXRlIHN0b3JlLmdldFN0YXRlKCksIHN0b3JlLmRpc3BhdGNoXG5cbnNldHVwVGltZWxpbmVzID0gKGRpc3BhdGNoKSAtPlxuICBkaXNwYXRjaFxuICAgIHR5cGU6IGsuQWRkVGltZWxpbmVcbiAgICBkYXRhOlxuICAgICAgbGVuZ3RoOiAxXG4gICAgICBzaG91bGRMb29wOiB0cnVlXG5cbiAgZGlzcGF0Y2hcbiAgICB0eXBlOiBrLkFkZE1hcHBpbmdcbiAgICBkYXRhOlxuICAgICAgdGltZWxpbmU6ICd0aW1lbGluZS0wJ1xuICAgICAgbWFwcGluZzogKHByb2dyZXNzLCBlbnRpdHlJZCwgZW50aXR5RGF0YSkgLT5cbiAgICAgICAgXy5hc3NpZ24ge30sIGVudGl0eURhdGEsXG4gICAgICAgICAgcG9zaXRpb246XG4gICAgICAgICAgICB4OiAwLjUgKiAoKE1hdGguc2luIChwcm9ncmVzcyAqICg3NSAvIE1hdGguUEkpKSkgKyAxKVxuICAgICAgICAgICAgeTogMC41ICogKChNYXRoLnNpbiAocHJvZ3Jlc3MgKiAoNTAgLyBNYXRoLlBJKSkpICsgMSlcblxuICBkaXNwYXRjaFxuICAgIHR5cGU6IGsuQWRkVHJpZ2dlclxuICAgIGRhdGE6XG4gICAgICB0aW1lbGluZTogJ3RpbWVsaW5lLTAnXG4gICAgICBwb3NpdGlvbjogMC41XG4gICAgICBhY3Rpb246IChwcm9ncmVzcywgZW50aXR5SWQsIGVudGl0eURhdGEpIC0+XG4gICAgICAgIF8uYXNzaWduIHt9LCBlbnRpdHlEYXRhLFxuICAgICAgICAgIHN0cm9rZUNvbG9yOiByYW5kb21Db2xvcigpXG5cbnNldHVwSW50ZXJhY3Rpb25zID0gKGRpc3BhdGNoLCBzdG9yZSkgLT5cbiAgIyBBZGRpbmcgZW50aXRpZXNcbiAgYWRkRW50aXR5QnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQgJ2FkZC1lbnRpdHknXG4gIGFkZEVudGl0eUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyICdjbGljaycsICgpIC0+XG4gICAgZGlzcGF0Y2hcbiAgICAgIHR5cGU6IGsuQWRkRW50aXR5XG4gICAgICBkYXRhOlxuICAgICAgICBpbml0aWFsRGF0YTpcbiAgICAgICAgICBzdHJva2VDb2xvcjogJ2JsYWNrJ1xuICAgICAgICAgIHBvc2l0aW9uOlxuICAgICAgICAgICAgeDogMFxuICAgICAgICAgICAgeTogMFxuXG5cbiAgIyBUaW1lbGluZSBzbGlkZXJcbiAgdGltZWxpbmVTbGlkZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCAndGltZWxpbmUtc2xpZGVyJ1xuICBnZXRUaW1lbGluZVZhbHVlID0gKCkgLT4gdGltZWxpbmVTbGlkZXIudmFsdWUgLyAxMDBcblxuICBwcmV2aW91c1NsaWRlclZhbHVlID0gZ2V0VGltZWxpbmVWYWx1ZSgpXG4gIHByb2dyZXNzVGltZWxpbmUgPSAoKSAtPlxuICAgIHYgPSBnZXRUaW1lbGluZVZhbHVlKClcbiAgICBPYmplY3Qua2V5cyBzdG9yZS5nZXRTdGF0ZSgpLmVudGl0aWVzLmRpY3RcbiAgICAgIC5mb3JFYWNoIChlbnRpdHlJZCkgLT5cbiAgICAgICAgZGlzcGF0Y2hcbiAgICAgICAgICB0eXBlOiBrLlByb2dyZXNzRW50aXR5VGltZWxpbmVcbiAgICAgICAgICBkYXRhOlxuICAgICAgICAgICAgZW50aXR5OiBlbnRpdHlJZFxuICAgICAgICAgICAgdGltZWxpbmVzOiBbJ3RpbWVsaW5lLTAnXVxuICAgICAgICAgICAgZGVsdGE6IHYgLSBwcmV2aW91c1NsaWRlclZhbHVlXG4gICAgcHJldmlvdXNTbGlkZXJWYWx1ZSA9IHZcblxuICB0aW1lbGluZVNsaWRlci5hZGRFdmVudExpc3RlbmVyICdpbnB1dCcsIHByb2dyZXNzVGltZWxpbmVcbiAgdGltZWxpbmVTbGlkZXIuYWRkRXZlbnRMaXN0ZW5lciAnY2hhbmdlJywgcHJvZ3Jlc3NUaW1lbGluZVxuXG4gICMgVGltZSBjb250cm9sIG9mIHNsaWRlclxuICBpc0FuaW1hdGluZyA9IHRydWVcbiAgYW5pbWF0aW9uT2Zmc2V0ID0gMFxuICB0aW1lID0gMFxuICB1cGRhdGVUaW1lbGluZSA9ICh0KSAtPlxuICAgIHRpbWUgPSB0XG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB1cGRhdGVUaW1lbGluZVxuICAgIGlmIGlzQW5pbWF0aW5nXG4gICAgICB0aW1lbGluZVNsaWRlci52YWx1ZSA9IHdyYXAgMCwgMTAwLCBNYXRoLmZsb29yICgoYW5pbWF0aW9uT2Zmc2V0ICsgdCkgLyA0MClcbiAgICAgIGRvIHByb2dyZXNzVGltZWxpbmVcblxuXG4gIHN0b3BBbmltYXRpb24gPSAoKSAtPlxuICAgIGlzQW5pbWF0aW5nID0gZmFsc2VcblxuICBzdGFydEFuaW1hdGlvbiA9ICgpIC0+XG4gICAgaWYgbm90IGlzQW5pbWF0aW5nXG4gICAgICBpc0FuaW1hdGluZyA9IHRydWVcbiAgICAgIGFuaW1hdGlvbk9mZnNldCA9IHRpbWVsaW5lU2xpZGVyLnZhbHVlICogMzAgLSB0aW1lXG5cbiAgIyBVc2VyLWVkaXRpbmcgb3ZlcnJpZGUgb2YgdGltZSBjb250cm9sXG4gICMgdGltZWxpbmVTbGlkZXIuYWRkRXZlbnRMaXN0ZW5lciAnbW91c2Vkb3duJywgc3RvcEFuaW1hdGlvblxuICAjIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNldXAnLCBzdGFydEFuaW1hdGlvblxuXG4gICMgR2VzdHVyZSBjb250cm9sIG9mIHNsaWRlclxuICBjYW52YXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yICdjYW52YXMnXG4gIHN0YXJ0UG9pbnQgPSBudWxsXG5cbiAgdGltZW91dElkID0gbnVsbFxuICBzaG91bGRNYWtlTmV3RW50aXR5ID0gdHJ1ZVxuXG4gIGRvd24gPSAocHQpIC0+XG4gICAgc2hvdWxkTWFrZU5ld0VudGl0eSA9IHRydWVcbiAgICBpZiB0aW1lb3V0SWQ/XG4gICAgICBjbGVhclRpbWVvdXQgdGltZW91dElkXG4gICAgICB0aW1lb3V0SWQgPSBudWxsXG4gICAgdGltZW91dElkID0gc2V0VGltZW91dCAoKCkgLT5cbiAgICAgIHNob3VsZE1ha2VOZXdFbnRpdHkgPSBmYWxzZSksIDEwMFxuICAgIHN0YXJ0UG9pbnQgPSBwdFxuXG4gIG1vdmUgPSAocHQpIC0+XG4gICAgaWYgbm90IHNob3VsZE1ha2VOZXdFbnRpdHlcbiAgICAgIHN0b3BBbmltYXRpb24oKVxuICAgICAgdGltZWxpbmVTbGlkZXIudmFsdWUgPSB3cmFwIDAsIDEwMCwgKHB0LnggLSBzdGFydFBvaW50LngpIC8gM1xuICAgICAgZG8gcHJvZ3Jlc3NUaW1lbGluZVxuXG4gIHVwID0gKHB0KSAtPlxuICAgIGlmIHNob3VsZE1ha2VOZXdFbnRpdHlcbiAgICAgIGRpc3BhdGNoXG4gICAgICAgIHR5cGU6IGsuQWRkRW50aXR5XG4gICAgICAgIGRhdGE6XG4gICAgICAgICAgaW5pdGlhbERhdGE6XG4gICAgICAgICAgICBzdHJva2VDb2xvcjogJ2JsYWNrJ1xuICAgICAgICAgICAgcG9zaXRpb246XG4gICAgICAgICAgICAgIHg6IDBcbiAgICAgICAgICAgICAgeTogMFxuXG4gICAgc3RhcnRBbmltYXRpb24oKVxuXG4gIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyICd0b3VjaHN0YXJ0JywgKGV2dCkgLT5cbiAgICBldnQucHJldmVudERlZmF1bHQoKVxuICAgIGRvd25cbiAgICAgIHg6IGV2dC50b3VjaGVzWzBdLmNsaWVudFhcbiAgICAgIHk6IGV2dC50b3VjaGVzWzBdLmNsaWVudFlcbiAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIgJ3RvdWNobW92ZScsIChldnQpIC0+XG4gICAgZXZ0LnByZXZlbnREZWZhdWx0KClcbiAgICBtb3ZlXG4gICAgICB4OiBldnQudG91Y2hlc1swXS5jbGllbnRYXG4gICAgICB5OiBldnQudG91Y2hlc1swXS5jbGllbnRZXG4gIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyICd0b3VjaGVuZCcsIChldnQpIC0+XG4gICAgdXAoKVxuXG4gIG1vdXNlSXNEb3duID0gZmFsc2VcbiAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlZG93bicsIChldnQpIC0+XG4gICAgbW91c2VJc0Rvd24gPSB0cnVlXG4gICAgZG93blxuICAgICAgeDogZXZ0LmNsaWVudFhcbiAgICAgIHk6IGV2dC5jbGllbnRZXG4gIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyICdtb3VzZW1vdmUnLCAoZXZ0KSAtPlxuICAgIGlmIG1vdXNlSXNEb3duXG4gICAgICBtb3ZlXG4gICAgICAgIHg6IGV2dC5jbGllbnRYXG4gICAgICAgIHk6IGV2dC5jbGllbnRZXG4gIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyICdtb3VzZXVwJywgKGV2dCkgLT5cbiAgICBtb3VzZUlzRG93biA9IGZhbHNlXG4gICAgdXAoKVxuXG5cblxuICBkbyB1cGRhdGVUaW1lbGluZVxuXG5kbyBzZXR1cFxuXG5cblxuIyAtLS0gSGVscGVyc1xuXG5yYW5kb21Db2xvciA9ICgpIC0+XG4gIHJhbmRvbThiaXQgPSAoKSAtPlxuICAgIE1hdGguZmxvb3IgKE1hdGgucmFuZG9tKCkgKiAyNTYpXG5cbiAgXCJcIlwiXG4gIHJnYmEoI3tyYW5kb204Yml0KCl9LCBcXFxuICAgICAgICN7cmFuZG9tOGJpdCgpfSwgXFxcbiAgICAgICAje3JhbmRvbThiaXQoKX0sIFxcXG4gICAgICAgMSlcbiAgXCJcIlwiXG5cbnJlc2l6ZUNhbnZhcyA9ICgpIC0+XG4gIGNhbnZhcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IgJ2NhbnZhcydcbiAgYmNyID0gY2FudmFzLnBhcmVudE5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgY2FudmFzLndpZHRoID0gYmNyLndpZHRoXG4gIGNhbnZhcy5oZWlnaHQgPSBiY3IuaGVpZ2h0XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyICdyZXNpemUnLCByZXNpemVDYW52YXMsIGZhbHNlXG5kbyByZXNpemVDYW52YXMiLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gc2V0VGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgc2V0VGltZW91dChkcmFpblF1ZXVlLCAwKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIi8qKlxuICogR2V0cyB0aGUgbGFzdCBlbGVtZW50IG9mIGBhcnJheWAuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBBcnJheVxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIHF1ZXJ5LlxuICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIGxhc3QgZWxlbWVudCBvZiBgYXJyYXlgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmxhc3QoWzEsIDIsIDNdKTtcbiAqIC8vID0+IDNcbiAqL1xuZnVuY3Rpb24gbGFzdChhcnJheSkge1xuICB2YXIgbGVuZ3RoID0gYXJyYXkgPyBhcnJheS5sZW5ndGggOiAwO1xuICByZXR1cm4gbGVuZ3RoID8gYXJyYXlbbGVuZ3RoIC0gMV0gOiB1bmRlZmluZWQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbGFzdDtcbiIsInZhciBhcnJheUVhY2ggPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9hcnJheUVhY2gnKSxcbiAgICBiYXNlRWFjaCA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2Jhc2VFYWNoJyksXG4gICAgY3JlYXRlRm9yRWFjaCA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2NyZWF0ZUZvckVhY2gnKTtcblxuLyoqXG4gKiBJdGVyYXRlcyBvdmVyIGVsZW1lbnRzIG9mIGBjb2xsZWN0aW9uYCBpbnZva2luZyBgaXRlcmF0ZWVgIGZvciBlYWNoIGVsZW1lbnQuXG4gKiBUaGUgYGl0ZXJhdGVlYCBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kIGludm9rZWQgd2l0aCB0aHJlZSBhcmd1bWVudHM6XG4gKiAodmFsdWUsIGluZGV4fGtleSwgY29sbGVjdGlvbikuIEl0ZXJhdGVlIGZ1bmN0aW9ucyBtYXkgZXhpdCBpdGVyYXRpb24gZWFybHlcbiAqIGJ5IGV4cGxpY2l0bHkgcmV0dXJuaW5nIGBmYWxzZWAuXG4gKlxuICogKipOb3RlOioqIEFzIHdpdGggb3RoZXIgXCJDb2xsZWN0aW9uc1wiIG1ldGhvZHMsIG9iamVjdHMgd2l0aCBhIFwibGVuZ3RoXCIgcHJvcGVydHlcbiAqIGFyZSBpdGVyYXRlZCBsaWtlIGFycmF5cy4gVG8gYXZvaWQgdGhpcyBiZWhhdmlvciBgXy5mb3JJbmAgb3IgYF8uZm9yT3duYFxuICogbWF5IGJlIHVzZWQgZm9yIG9iamVjdCBpdGVyYXRpb24uXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBhbGlhcyBlYWNoXG4gKiBAY2F0ZWdvcnkgQ29sbGVjdGlvblxuICogQHBhcmFtIHtBcnJheXxPYmplY3R8c3RyaW5nfSBjb2xsZWN0aW9uIFRoZSBjb2xsZWN0aW9uIHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtpdGVyYXRlZT1fLmlkZW50aXR5XSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBpdGVyYXRlZWAuXG4gKiBAcmV0dXJucyB7QXJyYXl8T2JqZWN0fHN0cmluZ30gUmV0dXJucyBgY29sbGVjdGlvbmAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8oWzEsIDJdKS5mb3JFYWNoKGZ1bmN0aW9uKG4pIHtcbiAqICAgY29uc29sZS5sb2cobik7XG4gKiB9KS52YWx1ZSgpO1xuICogLy8gPT4gbG9ncyBlYWNoIHZhbHVlIGZyb20gbGVmdCB0byByaWdodCBhbmQgcmV0dXJucyB0aGUgYXJyYXlcbiAqXG4gKiBfLmZvckVhY2goeyAnYSc6IDEsICdiJzogMiB9LCBmdW5jdGlvbihuLCBrZXkpIHtcbiAqICAgY29uc29sZS5sb2cobiwga2V5KTtcbiAqIH0pO1xuICogLy8gPT4gbG9ncyBlYWNoIHZhbHVlLWtleSBwYWlyIGFuZCByZXR1cm5zIHRoZSBvYmplY3QgKGl0ZXJhdGlvbiBvcmRlciBpcyBub3QgZ3VhcmFudGVlZClcbiAqL1xudmFyIGZvckVhY2ggPSBjcmVhdGVGb3JFYWNoKGFycmF5RWFjaCwgYmFzZUVhY2gpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZvckVhY2g7XG4iLCJ2YXIgYXJyYXlNYXAgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9hcnJheU1hcCcpLFxuICAgIGJhc2VDYWxsYmFjayA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2Jhc2VDYWxsYmFjaycpLFxuICAgIGJhc2VNYXAgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9iYXNlTWFwJyksXG4gICAgaXNBcnJheSA9IHJlcXVpcmUoJy4uL2xhbmcvaXNBcnJheScpO1xuXG4vKipcbiAqIENyZWF0ZXMgYW4gYXJyYXkgb2YgdmFsdWVzIGJ5IHJ1bm5pbmcgZWFjaCBlbGVtZW50IGluIGBjb2xsZWN0aW9uYCB0aHJvdWdoXG4gKiBgaXRlcmF0ZWVgLiBUaGUgYGl0ZXJhdGVlYCBpcyBib3VuZCB0byBgdGhpc0FyZ2AgYW5kIGludm9rZWQgd2l0aCB0aHJlZVxuICogYXJndW1lbnRzOiAodmFsdWUsIGluZGV4fGtleSwgY29sbGVjdGlvbikuXG4gKlxuICogSWYgYSBwcm9wZXJ0eSBuYW1lIGlzIHByb3ZpZGVkIGZvciBgaXRlcmF0ZWVgIHRoZSBjcmVhdGVkIGBfLnByb3BlcnR5YFxuICogc3R5bGUgY2FsbGJhY2sgcmV0dXJucyB0aGUgcHJvcGVydHkgdmFsdWUgb2YgdGhlIGdpdmVuIGVsZW1lbnQuXG4gKlxuICogSWYgYSB2YWx1ZSBpcyBhbHNvIHByb3ZpZGVkIGZvciBgdGhpc0FyZ2AgdGhlIGNyZWF0ZWQgYF8ubWF0Y2hlc1Byb3BlcnR5YFxuICogc3R5bGUgY2FsbGJhY2sgcmV0dXJucyBgdHJ1ZWAgZm9yIGVsZW1lbnRzIHRoYXQgaGF2ZSBhIG1hdGNoaW5nIHByb3BlcnR5XG4gKiB2YWx1ZSwgZWxzZSBgZmFsc2VgLlxuICpcbiAqIElmIGFuIG9iamVjdCBpcyBwcm92aWRlZCBmb3IgYGl0ZXJhdGVlYCB0aGUgY3JlYXRlZCBgXy5tYXRjaGVzYCBzdHlsZVxuICogY2FsbGJhY2sgcmV0dXJucyBgdHJ1ZWAgZm9yIGVsZW1lbnRzIHRoYXQgaGF2ZSB0aGUgcHJvcGVydGllcyBvZiB0aGUgZ2l2ZW5cbiAqIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICpcbiAqIE1hbnkgbG9kYXNoIG1ldGhvZHMgYXJlIGd1YXJkZWQgdG8gd29yayBhcyBpdGVyYXRlZXMgZm9yIG1ldGhvZHMgbGlrZVxuICogYF8uZXZlcnlgLCBgXy5maWx0ZXJgLCBgXy5tYXBgLCBgXy5tYXBWYWx1ZXNgLCBgXy5yZWplY3RgLCBhbmQgYF8uc29tZWAuXG4gKlxuICogVGhlIGd1YXJkZWQgbWV0aG9kcyBhcmU6XG4gKiBgYXJ5YCwgYGNhbGxiYWNrYCwgYGNodW5rYCwgYGNsb25lYCwgYGNyZWF0ZWAsIGBjdXJyeWAsIGBjdXJyeVJpZ2h0YCxcbiAqIGBkcm9wYCwgYGRyb3BSaWdodGAsIGBldmVyeWAsIGBmaWxsYCwgYGZsYXR0ZW5gLCBgaW52ZXJ0YCwgYG1heGAsIGBtaW5gLFxuICogYHBhcnNlSW50YCwgYHNsaWNlYCwgYHNvcnRCeWAsIGB0YWtlYCwgYHRha2VSaWdodGAsIGB0ZW1wbGF0ZWAsIGB0cmltYCxcbiAqIGB0cmltTGVmdGAsIGB0cmltUmlnaHRgLCBgdHJ1bmNgLCBgcmFuZG9tYCwgYHJhbmdlYCwgYHNhbXBsZWAsIGBzb21lYCxcbiAqIGBzdW1gLCBgdW5pcWAsIGFuZCBgd29yZHNgXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBhbGlhcyBjb2xsZWN0XG4gKiBAY2F0ZWdvcnkgQ29sbGVjdGlvblxuICogQHBhcmFtIHtBcnJheXxPYmplY3R8c3RyaW5nfSBjb2xsZWN0aW9uIFRoZSBjb2xsZWN0aW9uIHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb258T2JqZWN0fHN0cmluZ30gW2l0ZXJhdGVlPV8uaWRlbnRpdHldIFRoZSBmdW5jdGlvbiBpbnZva2VkXG4gKiAgcGVyIGl0ZXJhdGlvbi5cbiAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgaXRlcmF0ZWVgLlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBuZXcgbWFwcGVkIGFycmF5LlxuICogQGV4YW1wbGVcbiAqXG4gKiBmdW5jdGlvbiB0aW1lc1RocmVlKG4pIHtcbiAqICAgcmV0dXJuIG4gKiAzO1xuICogfVxuICpcbiAqIF8ubWFwKFsxLCAyXSwgdGltZXNUaHJlZSk7XG4gKiAvLyA9PiBbMywgNl1cbiAqXG4gKiBfLm1hcCh7ICdhJzogMSwgJ2InOiAyIH0sIHRpbWVzVGhyZWUpO1xuICogLy8gPT4gWzMsIDZdIChpdGVyYXRpb24gb3JkZXIgaXMgbm90IGd1YXJhbnRlZWQpXG4gKlxuICogdmFyIHVzZXJzID0gW1xuICogICB7ICd1c2VyJzogJ2Jhcm5leScgfSxcbiAqICAgeyAndXNlcic6ICdmcmVkJyB9XG4gKiBdO1xuICpcbiAqIC8vIHVzaW5nIHRoZSBgXy5wcm9wZXJ0eWAgY2FsbGJhY2sgc2hvcnRoYW5kXG4gKiBfLm1hcCh1c2VycywgJ3VzZXInKTtcbiAqIC8vID0+IFsnYmFybmV5JywgJ2ZyZWQnXVxuICovXG5mdW5jdGlvbiBtYXAoY29sbGVjdGlvbiwgaXRlcmF0ZWUsIHRoaXNBcmcpIHtcbiAgdmFyIGZ1bmMgPSBpc0FycmF5KGNvbGxlY3Rpb24pID8gYXJyYXlNYXAgOiBiYXNlTWFwO1xuICBpdGVyYXRlZSA9IGJhc2VDYWxsYmFjayhpdGVyYXRlZSwgdGhpc0FyZywgMyk7XG4gIHJldHVybiBmdW5jKGNvbGxlY3Rpb24sIGl0ZXJhdGVlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBtYXA7XG4iLCJ2YXIgYXJyYXlGaWx0ZXIgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9hcnJheUZpbHRlcicpLFxuICAgIGJhc2VDYWxsYmFjayA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2Jhc2VDYWxsYmFjaycpLFxuICAgIGJhc2VGaWx0ZXIgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9iYXNlRmlsdGVyJyksXG4gICAgaXNBcnJheSA9IHJlcXVpcmUoJy4uL2xhbmcvaXNBcnJheScpO1xuXG4vKipcbiAqIFRoZSBvcHBvc2l0ZSBvZiBgXy5maWx0ZXJgOyB0aGlzIG1ldGhvZCByZXR1cm5zIHRoZSBlbGVtZW50cyBvZiBgY29sbGVjdGlvbmBcbiAqIHRoYXQgYHByZWRpY2F0ZWAgZG9lcyAqKm5vdCoqIHJldHVybiB0cnV0aHkgZm9yLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgQ29sbGVjdGlvblxuICogQHBhcmFtIHtBcnJheXxPYmplY3R8c3RyaW5nfSBjb2xsZWN0aW9uIFRoZSBjb2xsZWN0aW9uIHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb258T2JqZWN0fHN0cmluZ30gW3ByZWRpY2F0ZT1fLmlkZW50aXR5XSBUaGUgZnVuY3Rpb24gaW52b2tlZFxuICogIHBlciBpdGVyYXRpb24uXG4gKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYHByZWRpY2F0ZWAuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIG5ldyBmaWx0ZXJlZCBhcnJheS5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5yZWplY3QoWzEsIDIsIDMsIDRdLCBmdW5jdGlvbihuKSB7XG4gKiAgIHJldHVybiBuICUgMiA9PSAwO1xuICogfSk7XG4gKiAvLyA9PiBbMSwgM11cbiAqXG4gKiB2YXIgdXNlcnMgPSBbXG4gKiAgIHsgJ3VzZXInOiAnYmFybmV5JywgJ2FnZSc6IDM2LCAnYWN0aXZlJzogZmFsc2UgfSxcbiAqICAgeyAndXNlcic6ICdmcmVkJywgICAnYWdlJzogNDAsICdhY3RpdmUnOiB0cnVlIH1cbiAqIF07XG4gKlxuICogLy8gdXNpbmcgdGhlIGBfLm1hdGNoZXNgIGNhbGxiYWNrIHNob3J0aGFuZFxuICogXy5wbHVjayhfLnJlamVjdCh1c2VycywgeyAnYWdlJzogNDAsICdhY3RpdmUnOiB0cnVlIH0pLCAndXNlcicpO1xuICogLy8gPT4gWydiYXJuZXknXVxuICpcbiAqIC8vIHVzaW5nIHRoZSBgXy5tYXRjaGVzUHJvcGVydHlgIGNhbGxiYWNrIHNob3J0aGFuZFxuICogXy5wbHVjayhfLnJlamVjdCh1c2VycywgJ2FjdGl2ZScsIGZhbHNlKSwgJ3VzZXInKTtcbiAqIC8vID0+IFsnZnJlZCddXG4gKlxuICogLy8gdXNpbmcgdGhlIGBfLnByb3BlcnR5YCBjYWxsYmFjayBzaG9ydGhhbmRcbiAqIF8ucGx1Y2soXy5yZWplY3QodXNlcnMsICdhY3RpdmUnKSwgJ3VzZXInKTtcbiAqIC8vID0+IFsnYmFybmV5J11cbiAqL1xuZnVuY3Rpb24gcmVqZWN0KGNvbGxlY3Rpb24sIHByZWRpY2F0ZSwgdGhpc0FyZykge1xuICB2YXIgZnVuYyA9IGlzQXJyYXkoY29sbGVjdGlvbikgPyBhcnJheUZpbHRlciA6IGJhc2VGaWx0ZXI7XG4gIHByZWRpY2F0ZSA9IGJhc2VDYWxsYmFjayhwcmVkaWNhdGUsIHRoaXNBcmcsIDMpO1xuICByZXR1cm4gZnVuYyhjb2xsZWN0aW9uLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pIHtcbiAgICByZXR1cm4gIXByZWRpY2F0ZSh2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pO1xuICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSByZWplY3Q7XG4iLCIvKiogVXNlZCBhcyB0aGUgYFR5cGVFcnJvcmAgbWVzc2FnZSBmb3IgXCJGdW5jdGlvbnNcIiBtZXRob2RzLiAqL1xudmFyIEZVTkNfRVJST1JfVEVYVCA9ICdFeHBlY3RlZCBhIGZ1bmN0aW9uJztcblxuLyogTmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzIGZvciB0aG9zZSB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgb3RoZXIgYGxvZGFzaGAgbWV0aG9kcy4gKi9cbnZhciBuYXRpdmVNYXggPSBNYXRoLm1heDtcblxuLyoqXG4gKiBDcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCBpbnZva2VzIGBmdW5jYCB3aXRoIHRoZSBgdGhpc2AgYmluZGluZyBvZiB0aGVcbiAqIGNyZWF0ZWQgZnVuY3Rpb24gYW5kIGFyZ3VtZW50cyBmcm9tIGBzdGFydGAgYW5kIGJleW9uZCBwcm92aWRlZCBhcyBhbiBhcnJheS5cbiAqXG4gKiAqKk5vdGU6KiogVGhpcyBtZXRob2QgaXMgYmFzZWQgb24gdGhlIFtyZXN0IHBhcmFtZXRlcl0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0Z1bmN0aW9ucy9yZXN0X3BhcmFtZXRlcnMpLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGFwcGx5IGEgcmVzdCBwYXJhbWV0ZXIgdG8uXG4gKiBAcGFyYW0ge251bWJlcn0gW3N0YXJ0PWZ1bmMubGVuZ3RoLTFdIFRoZSBzdGFydCBwb3NpdGlvbiBvZiB0aGUgcmVzdCBwYXJhbWV0ZXIuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBmdW5jdGlvbi5cbiAqIEBleGFtcGxlXG4gKlxuICogdmFyIHNheSA9IF8ucmVzdFBhcmFtKGZ1bmN0aW9uKHdoYXQsIG5hbWVzKSB7XG4gKiAgIHJldHVybiB3aGF0ICsgJyAnICsgXy5pbml0aWFsKG5hbWVzKS5qb2luKCcsICcpICtcbiAqICAgICAoXy5zaXplKG5hbWVzKSA+IDEgPyAnLCAmICcgOiAnJykgKyBfLmxhc3QobmFtZXMpO1xuICogfSk7XG4gKlxuICogc2F5KCdoZWxsbycsICdmcmVkJywgJ2Jhcm5leScsICdwZWJibGVzJyk7XG4gKiAvLyA9PiAnaGVsbG8gZnJlZCwgYmFybmV5LCAmIHBlYmJsZXMnXG4gKi9cbmZ1bmN0aW9uIHJlc3RQYXJhbShmdW5jLCBzdGFydCkge1xuICBpZiAodHlwZW9mIGZ1bmMgIT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoRlVOQ19FUlJPUl9URVhUKTtcbiAgfVxuICBzdGFydCA9IG5hdGl2ZU1heChzdGFydCA9PT0gdW5kZWZpbmVkID8gKGZ1bmMubGVuZ3RoIC0gMSkgOiAoK3N0YXJ0IHx8IDApLCAwKTtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcmdzID0gYXJndW1lbnRzLFxuICAgICAgICBpbmRleCA9IC0xLFxuICAgICAgICBsZW5ndGggPSBuYXRpdmVNYXgoYXJncy5sZW5ndGggLSBzdGFydCwgMCksXG4gICAgICAgIHJlc3QgPSBBcnJheShsZW5ndGgpO1xuXG4gICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgIHJlc3RbaW5kZXhdID0gYXJnc1tzdGFydCArIGluZGV4XTtcbiAgICB9XG4gICAgc3dpdGNoIChzdGFydCkge1xuICAgICAgY2FzZSAwOiByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIHJlc3QpO1xuICAgICAgY2FzZSAxOiByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIGFyZ3NbMF0sIHJlc3QpO1xuICAgICAgY2FzZSAyOiByZXR1cm4gZnVuYy5jYWxsKHRoaXMsIGFyZ3NbMF0sIGFyZ3NbMV0sIHJlc3QpO1xuICAgIH1cbiAgICB2YXIgb3RoZXJBcmdzID0gQXJyYXkoc3RhcnQgKyAxKTtcbiAgICBpbmRleCA9IC0xO1xuICAgIHdoaWxlICgrK2luZGV4IDwgc3RhcnQpIHtcbiAgICAgIG90aGVyQXJnc1tpbmRleF0gPSBhcmdzW2luZGV4XTtcbiAgICB9XG4gICAgb3RoZXJBcmdzW3N0YXJ0XSA9IHJlc3Q7XG4gICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgb3RoZXJBcmdzKTtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSByZXN0UGFyYW07XG4iLCJ2YXIgY2FjaGVQdXNoID0gcmVxdWlyZSgnLi9jYWNoZVB1c2gnKSxcbiAgICBnZXROYXRpdmUgPSByZXF1aXJlKCcuL2dldE5hdGl2ZScpO1xuXG4vKiogTmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIFNldCA9IGdldE5hdGl2ZShnbG9iYWwsICdTZXQnKTtcblxuLyogTmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzIGZvciB0aG9zZSB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgb3RoZXIgYGxvZGFzaGAgbWV0aG9kcy4gKi9cbnZhciBuYXRpdmVDcmVhdGUgPSBnZXROYXRpdmUoT2JqZWN0LCAnY3JlYXRlJyk7XG5cbi8qKlxuICpcbiAqIENyZWF0ZXMgYSBjYWNoZSBvYmplY3QgdG8gc3RvcmUgdW5pcXVlIHZhbHVlcy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gW3ZhbHVlc10gVGhlIHZhbHVlcyB0byBjYWNoZS5cbiAqL1xuZnVuY3Rpb24gU2V0Q2FjaGUodmFsdWVzKSB7XG4gIHZhciBsZW5ndGggPSB2YWx1ZXMgPyB2YWx1ZXMubGVuZ3RoIDogMDtcblxuICB0aGlzLmRhdGEgPSB7ICdoYXNoJzogbmF0aXZlQ3JlYXRlKG51bGwpLCAnc2V0JzogbmV3IFNldCB9O1xuICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICB0aGlzLnB1c2godmFsdWVzW2xlbmd0aF0pO1xuICB9XG59XG5cbi8vIEFkZCBmdW5jdGlvbnMgdG8gdGhlIGBTZXRgIGNhY2hlLlxuU2V0Q2FjaGUucHJvdG90eXBlLnB1c2ggPSBjYWNoZVB1c2g7XG5cbm1vZHVsZS5leHBvcnRzID0gU2V0Q2FjaGU7XG4iLCIvKipcbiAqIEEgc3BlY2lhbGl6ZWQgdmVyc2lvbiBvZiBgXy5mb3JFYWNoYCBmb3IgYXJyYXlzIHdpdGhvdXQgc3VwcG9ydCBmb3IgY2FsbGJhY2tcbiAqIHNob3J0aGFuZHMgYW5kIGB0aGlzYCBiaW5kaW5nLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gaXRlcmF0ZSBvdmVyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgVGhlIGZ1bmN0aW9uIGludm9rZWQgcGVyIGl0ZXJhdGlvbi5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyBgYXJyYXlgLlxuICovXG5mdW5jdGlvbiBhcnJheUVhY2goYXJyYXksIGl0ZXJhdGVlKSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gYXJyYXkubGVuZ3RoO1xuXG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgaWYgKGl0ZXJhdGVlKGFycmF5W2luZGV4XSwgaW5kZXgsIGFycmF5KSA9PT0gZmFsc2UpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gYXJyYXk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYXJyYXlFYWNoO1xuIiwiLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYF8uZmlsdGVyYCBmb3IgYXJyYXlzIHdpdGhvdXQgc3VwcG9ydCBmb3IgY2FsbGJhY2tcbiAqIHNob3J0aGFuZHMgYW5kIGB0aGlzYCBiaW5kaW5nLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gaXRlcmF0ZSBvdmVyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gcHJlZGljYXRlIFRoZSBmdW5jdGlvbiBpbnZva2VkIHBlciBpdGVyYXRpb24uXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIG5ldyBmaWx0ZXJlZCBhcnJheS5cbiAqL1xuZnVuY3Rpb24gYXJyYXlGaWx0ZXIoYXJyYXksIHByZWRpY2F0ZSkge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxlbmd0aCA9IGFycmF5Lmxlbmd0aCxcbiAgICAgIHJlc0luZGV4ID0gLTEsXG4gICAgICByZXN1bHQgPSBbXTtcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIHZhciB2YWx1ZSA9IGFycmF5W2luZGV4XTtcbiAgICBpZiAocHJlZGljYXRlKHZhbHVlLCBpbmRleCwgYXJyYXkpKSB7XG4gICAgICByZXN1bHRbKytyZXNJbmRleF0gPSB2YWx1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBhcnJheUZpbHRlcjtcbiIsIi8qKlxuICogQSBzcGVjaWFsaXplZCB2ZXJzaW9uIG9mIGBfLm1hcGAgZm9yIGFycmF5cyB3aXRob3V0IHN1cHBvcnQgZm9yIGNhbGxiYWNrXG4gKiBzaG9ydGhhbmRzIGFuZCBgdGhpc2AgYmluZGluZy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIFRoZSBmdW5jdGlvbiBpbnZva2VkIHBlciBpdGVyYXRpb24uXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIG5ldyBtYXBwZWQgYXJyYXkuXG4gKi9cbmZ1bmN0aW9uIGFycmF5TWFwKGFycmF5LCBpdGVyYXRlZSkge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxlbmd0aCA9IGFycmF5Lmxlbmd0aCxcbiAgICAgIHJlc3VsdCA9IEFycmF5KGxlbmd0aCk7XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICByZXN1bHRbaW5kZXhdID0gaXRlcmF0ZWUoYXJyYXlbaW5kZXhdLCBpbmRleCwgYXJyYXkpO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYXJyYXlNYXA7XG4iLCIvKipcbiAqIEFwcGVuZHMgdGhlIGVsZW1lbnRzIG9mIGB2YWx1ZXNgIHRvIGBhcnJheWAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBtb2RpZnkuXG4gKiBAcGFyYW0ge0FycmF5fSB2YWx1ZXMgVGhlIHZhbHVlcyB0byBhcHBlbmQuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgYGFycmF5YC5cbiAqL1xuZnVuY3Rpb24gYXJyYXlQdXNoKGFycmF5LCB2YWx1ZXMpIHtcbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICBsZW5ndGggPSB2YWx1ZXMubGVuZ3RoLFxuICAgICAgb2Zmc2V0ID0gYXJyYXkubGVuZ3RoO1xuXG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgYXJyYXlbb2Zmc2V0ICsgaW5kZXhdID0gdmFsdWVzW2luZGV4XTtcbiAgfVxuICByZXR1cm4gYXJyYXk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYXJyYXlQdXNoO1xuIiwiLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYF8uc29tZWAgZm9yIGFycmF5cyB3aXRob3V0IHN1cHBvcnQgZm9yIGNhbGxiYWNrXG4gKiBzaG9ydGhhbmRzIGFuZCBgdGhpc2AgYmluZGluZy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IHByZWRpY2F0ZSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGFueSBlbGVtZW50IHBhc3NlcyB0aGUgcHJlZGljYXRlIGNoZWNrLFxuICogIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gYXJyYXlTb21lKGFycmF5LCBwcmVkaWNhdGUpIHtcbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICBsZW5ndGggPSBhcnJheS5sZW5ndGg7XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICBpZiAocHJlZGljYXRlKGFycmF5W2luZGV4XSwgaW5kZXgsIGFycmF5KSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBhcnJheVNvbWU7XG4iLCJ2YXIgYmFzZU1hdGNoZXMgPSByZXF1aXJlKCcuL2Jhc2VNYXRjaGVzJyksXG4gICAgYmFzZU1hdGNoZXNQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vYmFzZU1hdGNoZXNQcm9wZXJ0eScpLFxuICAgIGJpbmRDYWxsYmFjayA9IHJlcXVpcmUoJy4vYmluZENhbGxiYWNrJyksXG4gICAgaWRlbnRpdHkgPSByZXF1aXJlKCcuLi91dGlsaXR5L2lkZW50aXR5JyksXG4gICAgcHJvcGVydHkgPSByZXF1aXJlKCcuLi91dGlsaXR5L3Byb3BlcnR5Jyk7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uY2FsbGJhY2tgIHdoaWNoIHN1cHBvcnRzIHNwZWNpZnlpbmcgdGhlXG4gKiBudW1iZXIgb2YgYXJndW1lbnRzIHRvIHByb3ZpZGUgdG8gYGZ1bmNgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IFtmdW5jPV8uaWRlbnRpdHldIFRoZSB2YWx1ZSB0byBjb252ZXJ0IHRvIGEgY2FsbGJhY2suXG4gKiBAcGFyYW0geyp9IFt0aGlzQXJnXSBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGZ1bmNgLlxuICogQHBhcmFtIHtudW1iZXJ9IFthcmdDb3VudF0gVGhlIG51bWJlciBvZiBhcmd1bWVudHMgdG8gcHJvdmlkZSB0byBgZnVuY2AuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIGNhbGxiYWNrLlxuICovXG5mdW5jdGlvbiBiYXNlQ2FsbGJhY2soZnVuYywgdGhpc0FyZywgYXJnQ291bnQpIHtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgZnVuYztcbiAgaWYgKHR5cGUgPT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiB0aGlzQXJnID09PSB1bmRlZmluZWRcbiAgICAgID8gZnVuY1xuICAgICAgOiBiaW5kQ2FsbGJhY2soZnVuYywgdGhpc0FyZywgYXJnQ291bnQpO1xuICB9XG4gIGlmIChmdW5jID09IG51bGwpIHtcbiAgICByZXR1cm4gaWRlbnRpdHk7XG4gIH1cbiAgaWYgKHR5cGUgPT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gYmFzZU1hdGNoZXMoZnVuYyk7XG4gIH1cbiAgcmV0dXJuIHRoaXNBcmcgPT09IHVuZGVmaW5lZFxuICAgID8gcHJvcGVydHkoZnVuYylcbiAgICA6IGJhc2VNYXRjaGVzUHJvcGVydHkoZnVuYywgdGhpc0FyZyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUNhbGxiYWNrO1xuIiwidmFyIGJhc2VJbmRleE9mID0gcmVxdWlyZSgnLi9iYXNlSW5kZXhPZicpLFxuICAgIGNhY2hlSW5kZXhPZiA9IHJlcXVpcmUoJy4vY2FjaGVJbmRleE9mJyksXG4gICAgY3JlYXRlQ2FjaGUgPSByZXF1aXJlKCcuL2NyZWF0ZUNhY2hlJyk7XG5cbi8qKiBVc2VkIGFzIHRoZSBzaXplIHRvIGVuYWJsZSBsYXJnZSBhcnJheSBvcHRpbWl6YXRpb25zLiAqL1xudmFyIExBUkdFX0FSUkFZX1NJWkUgPSAyMDA7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uZGlmZmVyZW5jZWAgd2hpY2ggYWNjZXB0cyBhIHNpbmdsZSBhcnJheVxuICogb2YgdmFsdWVzIHRvIGV4Y2x1ZGUuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBpbnNwZWN0LlxuICogQHBhcmFtIHtBcnJheX0gdmFsdWVzIFRoZSB2YWx1ZXMgdG8gZXhjbHVkZS5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgbmV3IGFycmF5IG9mIGZpbHRlcmVkIHZhbHVlcy5cbiAqL1xuZnVuY3Rpb24gYmFzZURpZmZlcmVuY2UoYXJyYXksIHZhbHVlcykge1xuICB2YXIgbGVuZ3RoID0gYXJyYXkgPyBhcnJheS5sZW5ndGggOiAwLFxuICAgICAgcmVzdWx0ID0gW107XG5cbiAgaWYgKCFsZW5ndGgpIHtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgaW5kZXhPZiA9IGJhc2VJbmRleE9mLFxuICAgICAgaXNDb21tb24gPSB0cnVlLFxuICAgICAgY2FjaGUgPSAoaXNDb21tb24gJiYgdmFsdWVzLmxlbmd0aCA+PSBMQVJHRV9BUlJBWV9TSVpFKSA/IGNyZWF0ZUNhY2hlKHZhbHVlcykgOiBudWxsLFxuICAgICAgdmFsdWVzTGVuZ3RoID0gdmFsdWVzLmxlbmd0aDtcblxuICBpZiAoY2FjaGUpIHtcbiAgICBpbmRleE9mID0gY2FjaGVJbmRleE9mO1xuICAgIGlzQ29tbW9uID0gZmFsc2U7XG4gICAgdmFsdWVzID0gY2FjaGU7XG4gIH1cbiAgb3V0ZXI6XG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgdmFyIHZhbHVlID0gYXJyYXlbaW5kZXhdO1xuXG4gICAgaWYgKGlzQ29tbW9uICYmIHZhbHVlID09PSB2YWx1ZSkge1xuICAgICAgdmFyIHZhbHVlc0luZGV4ID0gdmFsdWVzTGVuZ3RoO1xuICAgICAgd2hpbGUgKHZhbHVlc0luZGV4LS0pIHtcbiAgICAgICAgaWYgKHZhbHVlc1t2YWx1ZXNJbmRleF0gPT09IHZhbHVlKSB7XG4gICAgICAgICAgY29udGludWUgb3V0ZXI7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJlc3VsdC5wdXNoKHZhbHVlKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoaW5kZXhPZih2YWx1ZXMsIHZhbHVlLCAwKSA8IDApIHtcbiAgICAgIHJlc3VsdC5wdXNoKHZhbHVlKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlRGlmZmVyZW5jZTtcbiIsInZhciBiYXNlRm9yT3duID0gcmVxdWlyZSgnLi9iYXNlRm9yT3duJyksXG4gICAgY3JlYXRlQmFzZUVhY2ggPSByZXF1aXJlKCcuL2NyZWF0ZUJhc2VFYWNoJyk7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uZm9yRWFjaGAgd2l0aG91dCBzdXBwb3J0IGZvciBjYWxsYmFja1xuICogc2hvcnRoYW5kcyBhbmQgYHRoaXNgIGJpbmRpbmcuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl8T2JqZWN0fHN0cmluZ30gY29sbGVjdGlvbiBUaGUgY29sbGVjdGlvbiB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRlZSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICogQHJldHVybnMge0FycmF5fE9iamVjdHxzdHJpbmd9IFJldHVybnMgYGNvbGxlY3Rpb25gLlxuICovXG52YXIgYmFzZUVhY2ggPSBjcmVhdGVCYXNlRWFjaChiYXNlRm9yT3duKTtcblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlRWFjaDtcbiIsInZhciBiYXNlRWFjaCA9IHJlcXVpcmUoJy4vYmFzZUVhY2gnKTtcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5maWx0ZXJgIHdpdGhvdXQgc3VwcG9ydCBmb3IgY2FsbGJhY2tcbiAqIHNob3J0aGFuZHMgYW5kIGB0aGlzYCBiaW5kaW5nLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fE9iamVjdHxzdHJpbmd9IGNvbGxlY3Rpb24gVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gcHJlZGljYXRlIFRoZSBmdW5jdGlvbiBpbnZva2VkIHBlciBpdGVyYXRpb24uXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIG5ldyBmaWx0ZXJlZCBhcnJheS5cbiAqL1xuZnVuY3Rpb24gYmFzZUZpbHRlcihjb2xsZWN0aW9uLCBwcmVkaWNhdGUpIHtcbiAgdmFyIHJlc3VsdCA9IFtdO1xuICBiYXNlRWFjaChjb2xsZWN0aW9uLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pIHtcbiAgICBpZiAocHJlZGljYXRlKHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbikpIHtcbiAgICAgIHJlc3VsdC5wdXNoKHZhbHVlKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VGaWx0ZXI7XG4iLCJ2YXIgYXJyYXlQdXNoID0gcmVxdWlyZSgnLi9hcnJheVB1c2gnKSxcbiAgICBpc0FyZ3VtZW50cyA9IHJlcXVpcmUoJy4uL2xhbmcvaXNBcmd1bWVudHMnKSxcbiAgICBpc0FycmF5ID0gcmVxdWlyZSgnLi4vbGFuZy9pc0FycmF5JyksXG4gICAgaXNBcnJheUxpa2UgPSByZXF1aXJlKCcuL2lzQXJyYXlMaWtlJyksXG4gICAgaXNPYmplY3RMaWtlID0gcmVxdWlyZSgnLi9pc09iamVjdExpa2UnKTtcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5mbGF0dGVuYCB3aXRoIGFkZGVkIHN1cHBvcnQgZm9yIHJlc3RyaWN0aW5nXG4gKiBmbGF0dGVuaW5nIGFuZCBzcGVjaWZ5aW5nIHRoZSBzdGFydCBpbmRleC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGZsYXR0ZW4uXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtpc0RlZXBdIFNwZWNpZnkgYSBkZWVwIGZsYXR0ZW4uXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1N0cmljdF0gUmVzdHJpY3QgZmxhdHRlbmluZyB0byBhcnJheXMtbGlrZSBvYmplY3RzLlxuICogQHBhcmFtIHtBcnJheX0gW3Jlc3VsdD1bXV0gVGhlIGluaXRpYWwgcmVzdWx0IHZhbHVlLlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBuZXcgZmxhdHRlbmVkIGFycmF5LlxuICovXG5mdW5jdGlvbiBiYXNlRmxhdHRlbihhcnJheSwgaXNEZWVwLCBpc1N0cmljdCwgcmVzdWx0KSB7XG4gIHJlc3VsdCB8fCAocmVzdWx0ID0gW10pO1xuXG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gYXJyYXkubGVuZ3RoO1xuXG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgdmFyIHZhbHVlID0gYXJyYXlbaW5kZXhdO1xuICAgIGlmIChpc09iamVjdExpa2UodmFsdWUpICYmIGlzQXJyYXlMaWtlKHZhbHVlKSAmJlxuICAgICAgICAoaXNTdHJpY3QgfHwgaXNBcnJheSh2YWx1ZSkgfHwgaXNBcmd1bWVudHModmFsdWUpKSkge1xuICAgICAgaWYgKGlzRGVlcCkge1xuICAgICAgICAvLyBSZWN1cnNpdmVseSBmbGF0dGVuIGFycmF5cyAoc3VzY2VwdGlibGUgdG8gY2FsbCBzdGFjayBsaW1pdHMpLlxuICAgICAgICBiYXNlRmxhdHRlbih2YWx1ZSwgaXNEZWVwLCBpc1N0cmljdCwgcmVzdWx0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFycmF5UHVzaChyZXN1bHQsIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKCFpc1N0cmljdCkge1xuICAgICAgcmVzdWx0W3Jlc3VsdC5sZW5ndGhdID0gdmFsdWU7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUZsYXR0ZW47XG4iLCJ2YXIgY3JlYXRlQmFzZUZvciA9IHJlcXVpcmUoJy4vY3JlYXRlQmFzZUZvcicpO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBiYXNlRm9ySW5gIGFuZCBgYmFzZUZvck93bmAgd2hpY2ggaXRlcmF0ZXNcbiAqIG92ZXIgYG9iamVjdGAgcHJvcGVydGllcyByZXR1cm5lZCBieSBga2V5c0Z1bmNgIGludm9raW5nIGBpdGVyYXRlZWAgZm9yXG4gKiBlYWNoIHByb3BlcnR5LiBJdGVyYXRlZSBmdW5jdGlvbnMgbWF5IGV4aXQgaXRlcmF0aW9uIGVhcmx5IGJ5IGV4cGxpY2l0bHlcbiAqIHJldHVybmluZyBgZmFsc2VgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gaXRlcmF0ZSBvdmVyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgVGhlIGZ1bmN0aW9uIGludm9rZWQgcGVyIGl0ZXJhdGlvbi5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGtleXNGdW5jIFRoZSBmdW5jdGlvbiB0byBnZXQgdGhlIGtleXMgb2YgYG9iamVjdGAuXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIGBvYmplY3RgLlxuICovXG52YXIgYmFzZUZvciA9IGNyZWF0ZUJhc2VGb3IoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlRm9yO1xuIiwidmFyIGJhc2VGb3IgPSByZXF1aXJlKCcuL2Jhc2VGb3InKSxcbiAgICBrZXlzSW4gPSByZXF1aXJlKCcuLi9vYmplY3Qva2V5c0luJyk7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uZm9ySW5gIHdpdGhvdXQgc3VwcG9ydCBmb3IgY2FsbGJhY2tcbiAqIHNob3J0aGFuZHMgYW5kIGB0aGlzYCBiaW5kaW5nLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gaXRlcmF0ZSBvdmVyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgVGhlIGZ1bmN0aW9uIGludm9rZWQgcGVyIGl0ZXJhdGlvbi5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgYG9iamVjdGAuXG4gKi9cbmZ1bmN0aW9uIGJhc2VGb3JJbihvYmplY3QsIGl0ZXJhdGVlKSB7XG4gIHJldHVybiBiYXNlRm9yKG9iamVjdCwgaXRlcmF0ZWUsIGtleXNJbik7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUZvckluO1xuIiwidmFyIGJhc2VGb3IgPSByZXF1aXJlKCcuL2Jhc2VGb3InKSxcbiAgICBrZXlzID0gcmVxdWlyZSgnLi4vb2JqZWN0L2tleXMnKTtcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5mb3JPd25gIHdpdGhvdXQgc3VwcG9ydCBmb3IgY2FsbGJhY2tcbiAqIHNob3J0aGFuZHMgYW5kIGB0aGlzYCBiaW5kaW5nLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gaXRlcmF0ZSBvdmVyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgVGhlIGZ1bmN0aW9uIGludm9rZWQgcGVyIGl0ZXJhdGlvbi5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgYG9iamVjdGAuXG4gKi9cbmZ1bmN0aW9uIGJhc2VGb3JPd24ob2JqZWN0LCBpdGVyYXRlZSkge1xuICByZXR1cm4gYmFzZUZvcihvYmplY3QsIGl0ZXJhdGVlLCBrZXlzKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlRm9yT3duO1xuIiwidmFyIHRvT2JqZWN0ID0gcmVxdWlyZSgnLi90b09iamVjdCcpO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBnZXRgIHdpdGhvdXQgc3VwcG9ydCBmb3Igc3RyaW5nIHBhdGhzXG4gKiBhbmQgZGVmYXVsdCB2YWx1ZXMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEBwYXJhbSB7QXJyYXl9IHBhdGggVGhlIHBhdGggb2YgdGhlIHByb3BlcnR5IHRvIGdldC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBbcGF0aEtleV0gVGhlIGtleSByZXByZXNlbnRhdGlvbiBvZiBwYXRoLlxuICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIHJlc29sdmVkIHZhbHVlLlxuICovXG5mdW5jdGlvbiBiYXNlR2V0KG9iamVjdCwgcGF0aCwgcGF0aEtleSkge1xuICBpZiAob2JqZWN0ID09IG51bGwpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKHBhdGhLZXkgIT09IHVuZGVmaW5lZCAmJiBwYXRoS2V5IGluIHRvT2JqZWN0KG9iamVjdCkpIHtcbiAgICBwYXRoID0gW3BhdGhLZXldO1xuICB9XG4gIHZhciBpbmRleCA9IDAsXG4gICAgICBsZW5ndGggPSBwYXRoLmxlbmd0aDtcblxuICB3aGlsZSAob2JqZWN0ICE9IG51bGwgJiYgaW5kZXggPCBsZW5ndGgpIHtcbiAgICBvYmplY3QgPSBvYmplY3RbcGF0aFtpbmRleCsrXV07XG4gIH1cbiAgcmV0dXJuIChpbmRleCAmJiBpbmRleCA9PSBsZW5ndGgpID8gb2JqZWN0IDogdW5kZWZpbmVkO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VHZXQ7XG4iLCJ2YXIgaW5kZXhPZk5hTiA9IHJlcXVpcmUoJy4vaW5kZXhPZk5hTicpO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmluZGV4T2ZgIHdpdGhvdXQgc3VwcG9ydCBmb3IgYmluYXJ5IHNlYXJjaGVzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gc2VhcmNoLlxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gc2VhcmNoIGZvci5cbiAqIEBwYXJhbSB7bnVtYmVyfSBmcm9tSW5kZXggVGhlIGluZGV4IHRvIHNlYXJjaCBmcm9tLlxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgaW5kZXggb2YgdGhlIG1hdGNoZWQgdmFsdWUsIGVsc2UgYC0xYC5cbiAqL1xuZnVuY3Rpb24gYmFzZUluZGV4T2YoYXJyYXksIHZhbHVlLCBmcm9tSW5kZXgpIHtcbiAgaWYgKHZhbHVlICE9PSB2YWx1ZSkge1xuICAgIHJldHVybiBpbmRleE9mTmFOKGFycmF5LCBmcm9tSW5kZXgpO1xuICB9XG4gIHZhciBpbmRleCA9IGZyb21JbmRleCAtIDEsXG4gICAgICBsZW5ndGggPSBhcnJheS5sZW5ndGg7XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICBpZiAoYXJyYXlbaW5kZXhdID09PSB2YWx1ZSkge1xuICAgICAgcmV0dXJuIGluZGV4O1xuICAgIH1cbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUluZGV4T2Y7XG4iLCJ2YXIgYmFzZUlzRXF1YWxEZWVwID0gcmVxdWlyZSgnLi9iYXNlSXNFcXVhbERlZXAnKSxcbiAgICBpc09iamVjdCA9IHJlcXVpcmUoJy4uL2xhbmcvaXNPYmplY3QnKSxcbiAgICBpc09iamVjdExpa2UgPSByZXF1aXJlKCcuL2lzT2JqZWN0TGlrZScpO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmlzRXF1YWxgIHdpdGhvdXQgc3VwcG9ydCBmb3IgYHRoaXNgIGJpbmRpbmdcbiAqIGBjdXN0b21pemVyYCBmdW5jdGlvbnMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0geyp9IG90aGVyIFRoZSBvdGhlciB2YWx1ZSB0byBjb21wYXJlLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2N1c3RvbWl6ZXJdIFRoZSBmdW5jdGlvbiB0byBjdXN0b21pemUgY29tcGFyaW5nIHZhbHVlcy5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzTG9vc2VdIFNwZWNpZnkgcGVyZm9ybWluZyBwYXJ0aWFsIGNvbXBhcmlzb25zLlxuICogQHBhcmFtIHtBcnJheX0gW3N0YWNrQV0gVHJhY2tzIHRyYXZlcnNlZCBgdmFsdWVgIG9iamVjdHMuXG4gKiBAcGFyYW0ge0FycmF5fSBbc3RhY2tCXSBUcmFja3MgdHJhdmVyc2VkIGBvdGhlcmAgb2JqZWN0cy5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgdmFsdWVzIGFyZSBlcXVpdmFsZW50LCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGJhc2VJc0VxdWFsKHZhbHVlLCBvdGhlciwgY3VzdG9taXplciwgaXNMb29zZSwgc3RhY2tBLCBzdGFja0IpIHtcbiAgaWYgKHZhbHVlID09PSBvdGhlcikge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGlmICh2YWx1ZSA9PSBudWxsIHx8IG90aGVyID09IG51bGwgfHwgKCFpc09iamVjdCh2YWx1ZSkgJiYgIWlzT2JqZWN0TGlrZShvdGhlcikpKSB7XG4gICAgcmV0dXJuIHZhbHVlICE9PSB2YWx1ZSAmJiBvdGhlciAhPT0gb3RoZXI7XG4gIH1cbiAgcmV0dXJuIGJhc2VJc0VxdWFsRGVlcCh2YWx1ZSwgb3RoZXIsIGJhc2VJc0VxdWFsLCBjdXN0b21pemVyLCBpc0xvb3NlLCBzdGFja0EsIHN0YWNrQik7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUlzRXF1YWw7XG4iLCJ2YXIgZXF1YWxBcnJheXMgPSByZXF1aXJlKCcuL2VxdWFsQXJyYXlzJyksXG4gICAgZXF1YWxCeVRhZyA9IHJlcXVpcmUoJy4vZXF1YWxCeVRhZycpLFxuICAgIGVxdWFsT2JqZWN0cyA9IHJlcXVpcmUoJy4vZXF1YWxPYmplY3RzJyksXG4gICAgaXNBcnJheSA9IHJlcXVpcmUoJy4uL2xhbmcvaXNBcnJheScpLFxuICAgIGlzVHlwZWRBcnJheSA9IHJlcXVpcmUoJy4uL2xhbmcvaXNUeXBlZEFycmF5Jyk7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBhcmdzVGFnID0gJ1tvYmplY3QgQXJndW1lbnRzXScsXG4gICAgYXJyYXlUYWcgPSAnW29iamVjdCBBcnJheV0nLFxuICAgIG9iamVjdFRhZyA9ICdbb2JqZWN0IE9iamVjdF0nO1xuXG4vKiogVXNlZCBmb3IgbmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgdGhlIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICogb2YgdmFsdWVzLlxuICovXG52YXIgb2JqVG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYGJhc2VJc0VxdWFsYCBmb3IgYXJyYXlzIGFuZCBvYmplY3RzIHdoaWNoIHBlcmZvcm1zXG4gKiBkZWVwIGNvbXBhcmlzb25zIGFuZCB0cmFja3MgdHJhdmVyc2VkIG9iamVjdHMgZW5hYmxpbmcgb2JqZWN0cyB3aXRoIGNpcmN1bGFyXG4gKiByZWZlcmVuY2VzIHRvIGJlIGNvbXBhcmVkLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvdGhlciBUaGUgb3RoZXIgb2JqZWN0IHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBlcXVhbEZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGRldGVybWluZSBlcXVpdmFsZW50cyBvZiB2YWx1ZXMuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY3VzdG9taXplcl0gVGhlIGZ1bmN0aW9uIHRvIGN1c3RvbWl6ZSBjb21wYXJpbmcgb2JqZWN0cy5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzTG9vc2VdIFNwZWNpZnkgcGVyZm9ybWluZyBwYXJ0aWFsIGNvbXBhcmlzb25zLlxuICogQHBhcmFtIHtBcnJheX0gW3N0YWNrQT1bXV0gVHJhY2tzIHRyYXZlcnNlZCBgdmFsdWVgIG9iamVjdHMuXG4gKiBAcGFyYW0ge0FycmF5fSBbc3RhY2tCPVtdXSBUcmFja3MgdHJhdmVyc2VkIGBvdGhlcmAgb2JqZWN0cy5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgb2JqZWN0cyBhcmUgZXF1aXZhbGVudCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBiYXNlSXNFcXVhbERlZXAob2JqZWN0LCBvdGhlciwgZXF1YWxGdW5jLCBjdXN0b21pemVyLCBpc0xvb3NlLCBzdGFja0EsIHN0YWNrQikge1xuICB2YXIgb2JqSXNBcnIgPSBpc0FycmF5KG9iamVjdCksXG4gICAgICBvdGhJc0FyciA9IGlzQXJyYXkob3RoZXIpLFxuICAgICAgb2JqVGFnID0gYXJyYXlUYWcsXG4gICAgICBvdGhUYWcgPSBhcnJheVRhZztcblxuICBpZiAoIW9iaklzQXJyKSB7XG4gICAgb2JqVGFnID0gb2JqVG9TdHJpbmcuY2FsbChvYmplY3QpO1xuICAgIGlmIChvYmpUYWcgPT0gYXJnc1RhZykge1xuICAgICAgb2JqVGFnID0gb2JqZWN0VGFnO1xuICAgIH0gZWxzZSBpZiAob2JqVGFnICE9IG9iamVjdFRhZykge1xuICAgICAgb2JqSXNBcnIgPSBpc1R5cGVkQXJyYXkob2JqZWN0KTtcbiAgICB9XG4gIH1cbiAgaWYgKCFvdGhJc0Fycikge1xuICAgIG90aFRhZyA9IG9ialRvU3RyaW5nLmNhbGwob3RoZXIpO1xuICAgIGlmIChvdGhUYWcgPT0gYXJnc1RhZykge1xuICAgICAgb3RoVGFnID0gb2JqZWN0VGFnO1xuICAgIH0gZWxzZSBpZiAob3RoVGFnICE9IG9iamVjdFRhZykge1xuICAgICAgb3RoSXNBcnIgPSBpc1R5cGVkQXJyYXkob3RoZXIpO1xuICAgIH1cbiAgfVxuICB2YXIgb2JqSXNPYmogPSBvYmpUYWcgPT0gb2JqZWN0VGFnLFxuICAgICAgb3RoSXNPYmogPSBvdGhUYWcgPT0gb2JqZWN0VGFnLFxuICAgICAgaXNTYW1lVGFnID0gb2JqVGFnID09IG90aFRhZztcblxuICBpZiAoaXNTYW1lVGFnICYmICEob2JqSXNBcnIgfHwgb2JqSXNPYmopKSB7XG4gICAgcmV0dXJuIGVxdWFsQnlUYWcob2JqZWN0LCBvdGhlciwgb2JqVGFnKTtcbiAgfVxuICBpZiAoIWlzTG9vc2UpIHtcbiAgICB2YXIgb2JqSXNXcmFwcGVkID0gb2JqSXNPYmogJiYgaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsICdfX3dyYXBwZWRfXycpLFxuICAgICAgICBvdGhJc1dyYXBwZWQgPSBvdGhJc09iaiAmJiBoYXNPd25Qcm9wZXJ0eS5jYWxsKG90aGVyLCAnX193cmFwcGVkX18nKTtcblxuICAgIGlmIChvYmpJc1dyYXBwZWQgfHwgb3RoSXNXcmFwcGVkKSB7XG4gICAgICByZXR1cm4gZXF1YWxGdW5jKG9iaklzV3JhcHBlZCA/IG9iamVjdC52YWx1ZSgpIDogb2JqZWN0LCBvdGhJc1dyYXBwZWQgPyBvdGhlci52YWx1ZSgpIDogb3RoZXIsIGN1c3RvbWl6ZXIsIGlzTG9vc2UsIHN0YWNrQSwgc3RhY2tCKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFpc1NhbWVUYWcpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy8gQXNzdW1lIGN5Y2xpYyB2YWx1ZXMgYXJlIGVxdWFsLlxuICAvLyBGb3IgbW9yZSBpbmZvcm1hdGlvbiBvbiBkZXRlY3RpbmcgY2lyY3VsYXIgcmVmZXJlbmNlcyBzZWUgaHR0cHM6Ly9lczUuZ2l0aHViLmlvLyNKTy5cbiAgc3RhY2tBIHx8IChzdGFja0EgPSBbXSk7XG4gIHN0YWNrQiB8fCAoc3RhY2tCID0gW10pO1xuXG4gIHZhciBsZW5ndGggPSBzdGFja0EubGVuZ3RoO1xuICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICBpZiAoc3RhY2tBW2xlbmd0aF0gPT0gb2JqZWN0KSB7XG4gICAgICByZXR1cm4gc3RhY2tCW2xlbmd0aF0gPT0gb3RoZXI7XG4gICAgfVxuICB9XG4gIC8vIEFkZCBgb2JqZWN0YCBhbmQgYG90aGVyYCB0byB0aGUgc3RhY2sgb2YgdHJhdmVyc2VkIG9iamVjdHMuXG4gIHN0YWNrQS5wdXNoKG9iamVjdCk7XG4gIHN0YWNrQi5wdXNoKG90aGVyKTtcblxuICB2YXIgcmVzdWx0ID0gKG9iaklzQXJyID8gZXF1YWxBcnJheXMgOiBlcXVhbE9iamVjdHMpKG9iamVjdCwgb3RoZXIsIGVxdWFsRnVuYywgY3VzdG9taXplciwgaXNMb29zZSwgc3RhY2tBLCBzdGFja0IpO1xuXG4gIHN0YWNrQS5wb3AoKTtcbiAgc3RhY2tCLnBvcCgpO1xuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUlzRXF1YWxEZWVwO1xuIiwidmFyIGJhc2VJc0VxdWFsID0gcmVxdWlyZSgnLi9iYXNlSXNFcXVhbCcpLFxuICAgIHRvT2JqZWN0ID0gcmVxdWlyZSgnLi90b09iamVjdCcpO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmlzTWF0Y2hgIHdpdGhvdXQgc3VwcG9ydCBmb3IgY2FsbGJhY2tcbiAqIHNob3J0aGFuZHMgYW5kIGB0aGlzYCBiaW5kaW5nLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gaW5zcGVjdC5cbiAqIEBwYXJhbSB7QXJyYXl9IG1hdGNoRGF0YSBUaGUgcHJvcGVyeSBuYW1lcywgdmFsdWVzLCBhbmQgY29tcGFyZSBmbGFncyB0byBtYXRjaC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtjdXN0b21pemVyXSBUaGUgZnVuY3Rpb24gdG8gY3VzdG9taXplIGNvbXBhcmluZyBvYmplY3RzLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGBvYmplY3RgIGlzIGEgbWF0Y2gsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gYmFzZUlzTWF0Y2gob2JqZWN0LCBtYXRjaERhdGEsIGN1c3RvbWl6ZXIpIHtcbiAgdmFyIGluZGV4ID0gbWF0Y2hEYXRhLmxlbmd0aCxcbiAgICAgIGxlbmd0aCA9IGluZGV4LFxuICAgICAgbm9DdXN0b21pemVyID0gIWN1c3RvbWl6ZXI7XG5cbiAgaWYgKG9iamVjdCA9PSBudWxsKSB7XG4gICAgcmV0dXJuICFsZW5ndGg7XG4gIH1cbiAgb2JqZWN0ID0gdG9PYmplY3Qob2JqZWN0KTtcbiAgd2hpbGUgKGluZGV4LS0pIHtcbiAgICB2YXIgZGF0YSA9IG1hdGNoRGF0YVtpbmRleF07XG4gICAgaWYgKChub0N1c3RvbWl6ZXIgJiYgZGF0YVsyXSlcbiAgICAgICAgICA/IGRhdGFbMV0gIT09IG9iamVjdFtkYXRhWzBdXVxuICAgICAgICAgIDogIShkYXRhWzBdIGluIG9iamVjdClcbiAgICAgICAgKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgZGF0YSA9IG1hdGNoRGF0YVtpbmRleF07XG4gICAgdmFyIGtleSA9IGRhdGFbMF0sXG4gICAgICAgIG9ialZhbHVlID0gb2JqZWN0W2tleV0sXG4gICAgICAgIHNyY1ZhbHVlID0gZGF0YVsxXTtcblxuICAgIGlmIChub0N1c3RvbWl6ZXIgJiYgZGF0YVsyXSkge1xuICAgICAgaWYgKG9ialZhbHVlID09PSB1bmRlZmluZWQgJiYgIShrZXkgaW4gb2JqZWN0KSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciByZXN1bHQgPSBjdXN0b21pemVyID8gY3VzdG9taXplcihvYmpWYWx1ZSwgc3JjVmFsdWUsIGtleSkgOiB1bmRlZmluZWQ7XG4gICAgICBpZiAoIShyZXN1bHQgPT09IHVuZGVmaW5lZCA/IGJhc2VJc0VxdWFsKHNyY1ZhbHVlLCBvYmpWYWx1ZSwgY3VzdG9taXplciwgdHJ1ZSkgOiByZXN1bHQpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUlzTWF0Y2g7XG4iLCJ2YXIgYmFzZUVhY2ggPSByZXF1aXJlKCcuL2Jhc2VFYWNoJyksXG4gICAgaXNBcnJheUxpa2UgPSByZXF1aXJlKCcuL2lzQXJyYXlMaWtlJyk7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8ubWFwYCB3aXRob3V0IHN1cHBvcnQgZm9yIGNhbGxiYWNrIHNob3J0aGFuZHNcbiAqIGFuZCBgdGhpc2AgYmluZGluZy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheXxPYmplY3R8c3RyaW5nfSBjb2xsZWN0aW9uIFRoZSBjb2xsZWN0aW9uIHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIFRoZSBmdW5jdGlvbiBpbnZva2VkIHBlciBpdGVyYXRpb24uXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIG5ldyBtYXBwZWQgYXJyYXkuXG4gKi9cbmZ1bmN0aW9uIGJhc2VNYXAoY29sbGVjdGlvbiwgaXRlcmF0ZWUpIHtcbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICByZXN1bHQgPSBpc0FycmF5TGlrZShjb2xsZWN0aW9uKSA/IEFycmF5KGNvbGxlY3Rpb24ubGVuZ3RoKSA6IFtdO1xuXG4gIGJhc2VFYWNoKGNvbGxlY3Rpb24sIGZ1bmN0aW9uKHZhbHVlLCBrZXksIGNvbGxlY3Rpb24pIHtcbiAgICByZXN1bHRbKytpbmRleF0gPSBpdGVyYXRlZSh2YWx1ZSwga2V5LCBjb2xsZWN0aW9uKTtcbiAgfSk7XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZU1hcDtcbiIsInZhciBiYXNlSXNNYXRjaCA9IHJlcXVpcmUoJy4vYmFzZUlzTWF0Y2gnKSxcbiAgICBnZXRNYXRjaERhdGEgPSByZXF1aXJlKCcuL2dldE1hdGNoRGF0YScpLFxuICAgIHRvT2JqZWN0ID0gcmVxdWlyZSgnLi90b09iamVjdCcpO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLm1hdGNoZXNgIHdoaWNoIGRvZXMgbm90IGNsb25lIGBzb3VyY2VgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gc291cmNlIFRoZSBvYmplY3Qgb2YgcHJvcGVydHkgdmFsdWVzIHRvIG1hdGNoLlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGJhc2VNYXRjaGVzKHNvdXJjZSkge1xuICB2YXIgbWF0Y2hEYXRhID0gZ2V0TWF0Y2hEYXRhKHNvdXJjZSk7XG4gIGlmIChtYXRjaERhdGEubGVuZ3RoID09IDEgJiYgbWF0Y2hEYXRhWzBdWzJdKSB7XG4gICAgdmFyIGtleSA9IG1hdGNoRGF0YVswXVswXSxcbiAgICAgICAgdmFsdWUgPSBtYXRjaERhdGFbMF1bMV07XG5cbiAgICByZXR1cm4gZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgICBpZiAob2JqZWN0ID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG9iamVjdFtrZXldID09PSB2YWx1ZSAmJiAodmFsdWUgIT09IHVuZGVmaW5lZCB8fCAoa2V5IGluIHRvT2JqZWN0KG9iamVjdCkpKTtcbiAgICB9O1xuICB9XG4gIHJldHVybiBmdW5jdGlvbihvYmplY3QpIHtcbiAgICByZXR1cm4gYmFzZUlzTWF0Y2gob2JqZWN0LCBtYXRjaERhdGEpO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VNYXRjaGVzO1xuIiwidmFyIGJhc2VHZXQgPSByZXF1aXJlKCcuL2Jhc2VHZXQnKSxcbiAgICBiYXNlSXNFcXVhbCA9IHJlcXVpcmUoJy4vYmFzZUlzRXF1YWwnKSxcbiAgICBiYXNlU2xpY2UgPSByZXF1aXJlKCcuL2Jhc2VTbGljZScpLFxuICAgIGlzQXJyYXkgPSByZXF1aXJlKCcuLi9sYW5nL2lzQXJyYXknKSxcbiAgICBpc0tleSA9IHJlcXVpcmUoJy4vaXNLZXknKSxcbiAgICBpc1N0cmljdENvbXBhcmFibGUgPSByZXF1aXJlKCcuL2lzU3RyaWN0Q29tcGFyYWJsZScpLFxuICAgIGxhc3QgPSByZXF1aXJlKCcuLi9hcnJheS9sYXN0JyksXG4gICAgdG9PYmplY3QgPSByZXF1aXJlKCcuL3RvT2JqZWN0JyksXG4gICAgdG9QYXRoID0gcmVxdWlyZSgnLi90b1BhdGgnKTtcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5tYXRjaGVzUHJvcGVydHlgIHdoaWNoIGRvZXMgbm90IGNsb25lIGBzcmNWYWx1ZWAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIFRoZSBwYXRoIG9mIHRoZSBwcm9wZXJ0eSB0byBnZXQuXG4gKiBAcGFyYW0geyp9IHNyY1ZhbHVlIFRoZSB2YWx1ZSB0byBjb21wYXJlLlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGJhc2VNYXRjaGVzUHJvcGVydHkocGF0aCwgc3JjVmFsdWUpIHtcbiAgdmFyIGlzQXJyID0gaXNBcnJheShwYXRoKSxcbiAgICAgIGlzQ29tbW9uID0gaXNLZXkocGF0aCkgJiYgaXNTdHJpY3RDb21wYXJhYmxlKHNyY1ZhbHVlKSxcbiAgICAgIHBhdGhLZXkgPSAocGF0aCArICcnKTtcblxuICBwYXRoID0gdG9QYXRoKHBhdGgpO1xuICByZXR1cm4gZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgaWYgKG9iamVjdCA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciBrZXkgPSBwYXRoS2V5O1xuICAgIG9iamVjdCA9IHRvT2JqZWN0KG9iamVjdCk7XG4gICAgaWYgKChpc0FyciB8fCAhaXNDb21tb24pICYmICEoa2V5IGluIG9iamVjdCkpIHtcbiAgICAgIG9iamVjdCA9IHBhdGgubGVuZ3RoID09IDEgPyBvYmplY3QgOiBiYXNlR2V0KG9iamVjdCwgYmFzZVNsaWNlKHBhdGgsIDAsIC0xKSk7XG4gICAgICBpZiAob2JqZWN0ID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAga2V5ID0gbGFzdChwYXRoKTtcbiAgICAgIG9iamVjdCA9IHRvT2JqZWN0KG9iamVjdCk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3Rba2V5XSA9PT0gc3JjVmFsdWVcbiAgICAgID8gKHNyY1ZhbHVlICE9PSB1bmRlZmluZWQgfHwgKGtleSBpbiBvYmplY3QpKVxuICAgICAgOiBiYXNlSXNFcXVhbChzcmNWYWx1ZSwgb2JqZWN0W2tleV0sIHVuZGVmaW5lZCwgdHJ1ZSk7XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZU1hdGNoZXNQcm9wZXJ0eTtcbiIsIi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8ucHJvcGVydHlgIHdpdGhvdXQgc3VwcG9ydCBmb3IgZGVlcCBwYXRocy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSBwcm9wZXJ0eSB0byBnZXQuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gYmFzZVByb3BlcnR5KGtleSkge1xuICByZXR1cm4gZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgcmV0dXJuIG9iamVjdCA9PSBudWxsID8gdW5kZWZpbmVkIDogb2JqZWN0W2tleV07XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZVByb3BlcnR5O1xuIiwidmFyIGJhc2VHZXQgPSByZXF1aXJlKCcuL2Jhc2VHZXQnKSxcbiAgICB0b1BhdGggPSByZXF1aXJlKCcuL3RvUGF0aCcpO1xuXG4vKipcbiAqIEEgc3BlY2lhbGl6ZWQgdmVyc2lvbiBvZiBgYmFzZVByb3BlcnR5YCB3aGljaCBzdXBwb3J0cyBkZWVwIHBhdGhzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fHN0cmluZ30gcGF0aCBUaGUgcGF0aCBvZiB0aGUgcHJvcGVydHkgdG8gZ2V0LlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGJhc2VQcm9wZXJ0eURlZXAocGF0aCkge1xuICB2YXIgcGF0aEtleSA9IChwYXRoICsgJycpO1xuICBwYXRoID0gdG9QYXRoKHBhdGgpO1xuICByZXR1cm4gZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgcmV0dXJuIGJhc2VHZXQob2JqZWN0LCBwYXRoLCBwYXRoS2V5KTtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlUHJvcGVydHlEZWVwO1xuIiwiLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5zbGljZWAgd2l0aG91dCBhbiBpdGVyYXRlZSBjYWxsIGd1YXJkLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gc2xpY2UuXG4gKiBAcGFyYW0ge251bWJlcn0gW3N0YXJ0PTBdIFRoZSBzdGFydCBwb3NpdGlvbi5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbZW5kPWFycmF5Lmxlbmd0aF0gVGhlIGVuZCBwb3NpdGlvbi5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgc2xpY2Ugb2YgYGFycmF5YC5cbiAqL1xuZnVuY3Rpb24gYmFzZVNsaWNlKGFycmF5LCBzdGFydCwgZW5kKSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gYXJyYXkubGVuZ3RoO1xuXG4gIHN0YXJ0ID0gc3RhcnQgPT0gbnVsbCA/IDAgOiAoK3N0YXJ0IHx8IDApO1xuICBpZiAoc3RhcnQgPCAwKSB7XG4gICAgc3RhcnQgPSAtc3RhcnQgPiBsZW5ndGggPyAwIDogKGxlbmd0aCArIHN0YXJ0KTtcbiAgfVxuICBlbmQgPSAoZW5kID09PSB1bmRlZmluZWQgfHwgZW5kID4gbGVuZ3RoKSA/IGxlbmd0aCA6ICgrZW5kIHx8IDApO1xuICBpZiAoZW5kIDwgMCkge1xuICAgIGVuZCArPSBsZW5ndGg7XG4gIH1cbiAgbGVuZ3RoID0gc3RhcnQgPiBlbmQgPyAwIDogKChlbmQgLSBzdGFydCkgPj4+IDApO1xuICBzdGFydCA+Pj49IDA7XG5cbiAgdmFyIHJlc3VsdCA9IEFycmF5KGxlbmd0aCk7XG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgcmVzdWx0W2luZGV4XSA9IGFycmF5W2luZGV4ICsgc3RhcnRdO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZVNsaWNlO1xuIiwiLyoqXG4gKiBDb252ZXJ0cyBgdmFsdWVgIHRvIGEgc3RyaW5nIGlmIGl0J3Mgbm90IG9uZS4gQW4gZW1wdHkgc3RyaW5nIGlzIHJldHVybmVkXG4gKiBmb3IgYG51bGxgIG9yIGB1bmRlZmluZWRgIHZhbHVlcy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gcHJvY2Vzcy5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFJldHVybnMgdGhlIHN0cmluZy5cbiAqL1xuZnVuY3Rpb24gYmFzZVRvU3RyaW5nKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSA9PSBudWxsID8gJycgOiAodmFsdWUgKyAnJyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZVRvU3RyaW5nO1xuIiwidmFyIGlkZW50aXR5ID0gcmVxdWlyZSgnLi4vdXRpbGl0eS9pZGVudGl0eScpO1xuXG4vKipcbiAqIEEgc3BlY2lhbGl6ZWQgdmVyc2lvbiBvZiBgYmFzZUNhbGxiYWNrYCB3aGljaCBvbmx5IHN1cHBvcnRzIGB0aGlzYCBiaW5kaW5nXG4gKiBhbmQgc3BlY2lmeWluZyB0aGUgbnVtYmVyIG9mIGFyZ3VtZW50cyB0byBwcm92aWRlIHRvIGBmdW5jYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gYmluZC5cbiAqIEBwYXJhbSB7Kn0gdGhpc0FyZyBUaGUgYHRoaXNgIGJpbmRpbmcgb2YgYGZ1bmNgLlxuICogQHBhcmFtIHtudW1iZXJ9IFthcmdDb3VudF0gVGhlIG51bWJlciBvZiBhcmd1bWVudHMgdG8gcHJvdmlkZSB0byBgZnVuY2AuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIGNhbGxiYWNrLlxuICovXG5mdW5jdGlvbiBiaW5kQ2FsbGJhY2soZnVuYywgdGhpc0FyZywgYXJnQ291bnQpIHtcbiAgaWYgKHR5cGVvZiBmdW5jICE9ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gaWRlbnRpdHk7XG4gIH1cbiAgaWYgKHRoaXNBcmcgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBmdW5jO1xuICB9XG4gIHN3aXRjaCAoYXJnQ291bnQpIHtcbiAgICBjYXNlIDE6IHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIGZ1bmMuY2FsbCh0aGlzQXJnLCB2YWx1ZSk7XG4gICAgfTtcbiAgICBjYXNlIDM6IHJldHVybiBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pIHtcbiAgICAgIHJldHVybiBmdW5jLmNhbGwodGhpc0FyZywgdmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKTtcbiAgICB9O1xuICAgIGNhc2UgNDogcmV0dXJuIGZ1bmN0aW9uKGFjY3VtdWxhdG9yLCB2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pIHtcbiAgICAgIHJldHVybiBmdW5jLmNhbGwodGhpc0FyZywgYWNjdW11bGF0b3IsIHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbik7XG4gICAgfTtcbiAgICBjYXNlIDU6IHJldHVybiBmdW5jdGlvbih2YWx1ZSwgb3RoZXIsIGtleSwgb2JqZWN0LCBzb3VyY2UpIHtcbiAgICAgIHJldHVybiBmdW5jLmNhbGwodGhpc0FyZywgdmFsdWUsIG90aGVyLCBrZXksIG9iamVjdCwgc291cmNlKTtcbiAgICB9O1xuICB9XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzQXJnLCBhcmd1bWVudHMpO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJpbmRDYWxsYmFjaztcbiIsInZhciBpc09iamVjdCA9IHJlcXVpcmUoJy4uL2xhbmcvaXNPYmplY3QnKTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBpbiBgY2FjaGVgIG1pbWlja2luZyB0aGUgcmV0dXJuIHNpZ25hdHVyZSBvZlxuICogYF8uaW5kZXhPZmAgYnkgcmV0dXJuaW5nIGAwYCBpZiB0aGUgdmFsdWUgaXMgZm91bmQsIGVsc2UgYC0xYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IGNhY2hlIFRoZSBjYWNoZSB0byBzZWFyY2guXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBzZWFyY2ggZm9yLlxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyBgMGAgaWYgYHZhbHVlYCBpcyBmb3VuZCwgZWxzZSBgLTFgLlxuICovXG5mdW5jdGlvbiBjYWNoZUluZGV4T2YoY2FjaGUsIHZhbHVlKSB7XG4gIHZhciBkYXRhID0gY2FjaGUuZGF0YSxcbiAgICAgIHJlc3VsdCA9ICh0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycgfHwgaXNPYmplY3QodmFsdWUpKSA/IGRhdGEuc2V0Lmhhcyh2YWx1ZSkgOiBkYXRhLmhhc2hbdmFsdWVdO1xuXG4gIHJldHVybiByZXN1bHQgPyAwIDogLTE7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY2FjaGVJbmRleE9mO1xuIiwidmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi4vbGFuZy9pc09iamVjdCcpO1xuXG4vKipcbiAqIEFkZHMgYHZhbHVlYCB0byB0aGUgY2FjaGUuXG4gKlxuICogQHByaXZhdGVcbiAqIEBuYW1lIHB1c2hcbiAqIEBtZW1iZXJPZiBTZXRDYWNoZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2FjaGUuXG4gKi9cbmZ1bmN0aW9uIGNhY2hlUHVzaCh2YWx1ZSkge1xuICB2YXIgZGF0YSA9IHRoaXMuZGF0YTtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJyB8fCBpc09iamVjdCh2YWx1ZSkpIHtcbiAgICBkYXRhLnNldC5hZGQodmFsdWUpO1xuICB9IGVsc2Uge1xuICAgIGRhdGEuaGFzaFt2YWx1ZV0gPSB0cnVlO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY2FjaGVQdXNoO1xuIiwidmFyIGdldExlbmd0aCA9IHJlcXVpcmUoJy4vZ2V0TGVuZ3RoJyksXG4gICAgaXNMZW5ndGggPSByZXF1aXJlKCcuL2lzTGVuZ3RoJyksXG4gICAgdG9PYmplY3QgPSByZXF1aXJlKCcuL3RvT2JqZWN0Jyk7XG5cbi8qKlxuICogQ3JlYXRlcyBhIGBiYXNlRWFjaGAgb3IgYGJhc2VFYWNoUmlnaHRgIGZ1bmN0aW9uLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBlYWNoRnVuYyBUaGUgZnVuY3Rpb24gdG8gaXRlcmF0ZSBvdmVyIGEgY29sbGVjdGlvbi5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2Zyb21SaWdodF0gU3BlY2lmeSBpdGVyYXRpbmcgZnJvbSByaWdodCB0byBsZWZ0LlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgYmFzZSBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlQmFzZUVhY2goZWFjaEZ1bmMsIGZyb21SaWdodCkge1xuICByZXR1cm4gZnVuY3Rpb24oY29sbGVjdGlvbiwgaXRlcmF0ZWUpIHtcbiAgICB2YXIgbGVuZ3RoID0gY29sbGVjdGlvbiA/IGdldExlbmd0aChjb2xsZWN0aW9uKSA6IDA7XG4gICAgaWYgKCFpc0xlbmd0aChsZW5ndGgpKSB7XG4gICAgICByZXR1cm4gZWFjaEZ1bmMoY29sbGVjdGlvbiwgaXRlcmF0ZWUpO1xuICAgIH1cbiAgICB2YXIgaW5kZXggPSBmcm9tUmlnaHQgPyBsZW5ndGggOiAtMSxcbiAgICAgICAgaXRlcmFibGUgPSB0b09iamVjdChjb2xsZWN0aW9uKTtcblxuICAgIHdoaWxlICgoZnJvbVJpZ2h0ID8gaW5kZXgtLSA6ICsraW5kZXggPCBsZW5ndGgpKSB7XG4gICAgICBpZiAoaXRlcmF0ZWUoaXRlcmFibGVbaW5kZXhdLCBpbmRleCwgaXRlcmFibGUpID09PSBmYWxzZSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNvbGxlY3Rpb247XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlQmFzZUVhY2g7XG4iLCJ2YXIgdG9PYmplY3QgPSByZXF1aXJlKCcuL3RvT2JqZWN0Jyk7XG5cbi8qKlxuICogQ3JlYXRlcyBhIGJhc2UgZnVuY3Rpb24gZm9yIGBfLmZvckluYCBvciBgXy5mb3JJblJpZ2h0YC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtib29sZWFufSBbZnJvbVJpZ2h0XSBTcGVjaWZ5IGl0ZXJhdGluZyBmcm9tIHJpZ2h0IHRvIGxlZnQuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBiYXNlIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBjcmVhdGVCYXNlRm9yKGZyb21SaWdodCkge1xuICByZXR1cm4gZnVuY3Rpb24ob2JqZWN0LCBpdGVyYXRlZSwga2V5c0Z1bmMpIHtcbiAgICB2YXIgaXRlcmFibGUgPSB0b09iamVjdChvYmplY3QpLFxuICAgICAgICBwcm9wcyA9IGtleXNGdW5jKG9iamVjdCksXG4gICAgICAgIGxlbmd0aCA9IHByb3BzLmxlbmd0aCxcbiAgICAgICAgaW5kZXggPSBmcm9tUmlnaHQgPyBsZW5ndGggOiAtMTtcblxuICAgIHdoaWxlICgoZnJvbVJpZ2h0ID8gaW5kZXgtLSA6ICsraW5kZXggPCBsZW5ndGgpKSB7XG4gICAgICB2YXIga2V5ID0gcHJvcHNbaW5kZXhdO1xuICAgICAgaWYgKGl0ZXJhdGVlKGl0ZXJhYmxlW2tleV0sIGtleSwgaXRlcmFibGUpID09PSBmYWxzZSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVCYXNlRm9yO1xuIiwidmFyIFNldENhY2hlID0gcmVxdWlyZSgnLi9TZXRDYWNoZScpLFxuICAgIGdldE5hdGl2ZSA9IHJlcXVpcmUoJy4vZ2V0TmF0aXZlJyk7XG5cbi8qKiBOYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgU2V0ID0gZ2V0TmF0aXZlKGdsb2JhbCwgJ1NldCcpO1xuXG4vKiBOYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMgZm9yIHRob3NlIHdpdGggdGhlIHNhbWUgbmFtZSBhcyBvdGhlciBgbG9kYXNoYCBtZXRob2RzLiAqL1xudmFyIG5hdGl2ZUNyZWF0ZSA9IGdldE5hdGl2ZShPYmplY3QsICdjcmVhdGUnKTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgYFNldGAgY2FjaGUgb2JqZWN0IHRvIG9wdGltaXplIGxpbmVhciBzZWFyY2hlcyBvZiBsYXJnZSBhcnJheXMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IFt2YWx1ZXNdIFRoZSB2YWx1ZXMgdG8gY2FjaGUuXG4gKiBAcmV0dXJucyB7bnVsbHxPYmplY3R9IFJldHVybnMgdGhlIG5ldyBjYWNoZSBvYmplY3QgaWYgYFNldGAgaXMgc3VwcG9ydGVkLCBlbHNlIGBudWxsYC5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlQ2FjaGUodmFsdWVzKSB7XG4gIHJldHVybiAobmF0aXZlQ3JlYXRlICYmIFNldCkgPyBuZXcgU2V0Q2FjaGUodmFsdWVzKSA6IG51bGw7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlQ2FjaGU7XG4iLCJ2YXIgYmluZENhbGxiYWNrID0gcmVxdWlyZSgnLi9iaW5kQ2FsbGJhY2snKSxcbiAgICBpc0FycmF5ID0gcmVxdWlyZSgnLi4vbGFuZy9pc0FycmF5Jyk7XG5cbi8qKlxuICogQ3JlYXRlcyBhIGZ1bmN0aW9uIGZvciBgXy5mb3JFYWNoYCBvciBgXy5mb3JFYWNoUmlnaHRgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBhcnJheUZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGl0ZXJhdGUgb3ZlciBhbiBhcnJheS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGVhY2hGdW5jIFRoZSBmdW5jdGlvbiB0byBpdGVyYXRlIG92ZXIgYSBjb2xsZWN0aW9uLlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZWFjaCBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlRm9yRWFjaChhcnJheUZ1bmMsIGVhY2hGdW5jKSB7XG4gIHJldHVybiBmdW5jdGlvbihjb2xsZWN0aW9uLCBpdGVyYXRlZSwgdGhpc0FyZykge1xuICAgIHJldHVybiAodHlwZW9mIGl0ZXJhdGVlID09ICdmdW5jdGlvbicgJiYgdGhpc0FyZyA9PT0gdW5kZWZpbmVkICYmIGlzQXJyYXkoY29sbGVjdGlvbikpXG4gICAgICA/IGFycmF5RnVuYyhjb2xsZWN0aW9uLCBpdGVyYXRlZSlcbiAgICAgIDogZWFjaEZ1bmMoY29sbGVjdGlvbiwgYmluZENhbGxiYWNrKGl0ZXJhdGVlLCB0aGlzQXJnLCAzKSk7XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlRm9yRWFjaDtcbiIsInZhciBiYXNlQ2FsbGJhY2sgPSByZXF1aXJlKCcuL2Jhc2VDYWxsYmFjaycpLFxuICAgIGJhc2VGb3JPd24gPSByZXF1aXJlKCcuL2Jhc2VGb3JPd24nKTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgZnVuY3Rpb24gZm9yIGBfLm1hcEtleXNgIG9yIGBfLm1hcFZhbHVlc2AuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzTWFwS2V5c10gU3BlY2lmeSBtYXBwaW5nIGtleXMgaW5zdGVhZCBvZiB2YWx1ZXMuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBtYXAgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZU9iamVjdE1hcHBlcihpc01hcEtleXMpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKG9iamVjdCwgaXRlcmF0ZWUsIHRoaXNBcmcpIHtcbiAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgaXRlcmF0ZWUgPSBiYXNlQ2FsbGJhY2soaXRlcmF0ZWUsIHRoaXNBcmcsIDMpO1xuXG4gICAgYmFzZUZvck93bihvYmplY3QsIGZ1bmN0aW9uKHZhbHVlLCBrZXksIG9iamVjdCkge1xuICAgICAgdmFyIG1hcHBlZCA9IGl0ZXJhdGVlKHZhbHVlLCBrZXksIG9iamVjdCk7XG4gICAgICBrZXkgPSBpc01hcEtleXMgPyBtYXBwZWQgOiBrZXk7XG4gICAgICB2YWx1ZSA9IGlzTWFwS2V5cyA/IHZhbHVlIDogbWFwcGVkO1xuICAgICAgcmVzdWx0W2tleV0gPSB2YWx1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZU9iamVjdE1hcHBlcjtcbiIsInZhciBhcnJheVNvbWUgPSByZXF1aXJlKCcuL2FycmF5U29tZScpO1xuXG4vKipcbiAqIEEgc3BlY2lhbGl6ZWQgdmVyc2lvbiBvZiBgYmFzZUlzRXF1YWxEZWVwYCBmb3IgYXJyYXlzIHdpdGggc3VwcG9ydCBmb3JcbiAqIHBhcnRpYWwgZGVlcCBjb21wYXJpc29ucy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0ge0FycmF5fSBvdGhlciBUaGUgb3RoZXIgYXJyYXkgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGVxdWFsRnVuYyBUaGUgZnVuY3Rpb24gdG8gZGV0ZXJtaW5lIGVxdWl2YWxlbnRzIG9mIHZhbHVlcy5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtjdXN0b21pemVyXSBUaGUgZnVuY3Rpb24gdG8gY3VzdG9taXplIGNvbXBhcmluZyBhcnJheXMuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtpc0xvb3NlXSBTcGVjaWZ5IHBlcmZvcm1pbmcgcGFydGlhbCBjb21wYXJpc29ucy5cbiAqIEBwYXJhbSB7QXJyYXl9IFtzdGFja0FdIFRyYWNrcyB0cmF2ZXJzZWQgYHZhbHVlYCBvYmplY3RzLlxuICogQHBhcmFtIHtBcnJheX0gW3N0YWNrQl0gVHJhY2tzIHRyYXZlcnNlZCBgb3RoZXJgIG9iamVjdHMuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGFycmF5cyBhcmUgZXF1aXZhbGVudCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBlcXVhbEFycmF5cyhhcnJheSwgb3RoZXIsIGVxdWFsRnVuYywgY3VzdG9taXplciwgaXNMb29zZSwgc3RhY2tBLCBzdGFja0IpIHtcbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICBhcnJMZW5ndGggPSBhcnJheS5sZW5ndGgsXG4gICAgICBvdGhMZW5ndGggPSBvdGhlci5sZW5ndGg7XG5cbiAgaWYgKGFyckxlbmd0aCAhPSBvdGhMZW5ndGggJiYgIShpc0xvb3NlICYmIG90aExlbmd0aCA+IGFyckxlbmd0aCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy8gSWdub3JlIG5vbi1pbmRleCBwcm9wZXJ0aWVzLlxuICB3aGlsZSAoKytpbmRleCA8IGFyckxlbmd0aCkge1xuICAgIHZhciBhcnJWYWx1ZSA9IGFycmF5W2luZGV4XSxcbiAgICAgICAgb3RoVmFsdWUgPSBvdGhlcltpbmRleF0sXG4gICAgICAgIHJlc3VsdCA9IGN1c3RvbWl6ZXIgPyBjdXN0b21pemVyKGlzTG9vc2UgPyBvdGhWYWx1ZSA6IGFyclZhbHVlLCBpc0xvb3NlID8gYXJyVmFsdWUgOiBvdGhWYWx1ZSwgaW5kZXgpIDogdW5kZWZpbmVkO1xuXG4gICAgaWYgKHJlc3VsdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBSZWN1cnNpdmVseSBjb21wYXJlIGFycmF5cyAoc3VzY2VwdGlibGUgdG8gY2FsbCBzdGFjayBsaW1pdHMpLlxuICAgIGlmIChpc0xvb3NlKSB7XG4gICAgICBpZiAoIWFycmF5U29tZShvdGhlciwgZnVuY3Rpb24ob3RoVmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBhcnJWYWx1ZSA9PT0gb3RoVmFsdWUgfHwgZXF1YWxGdW5jKGFyclZhbHVlLCBvdGhWYWx1ZSwgY3VzdG9taXplciwgaXNMb29zZSwgc3RhY2tBLCBzdGFja0IpO1xuICAgICAgICAgIH0pKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKCEoYXJyVmFsdWUgPT09IG90aFZhbHVlIHx8IGVxdWFsRnVuYyhhcnJWYWx1ZSwgb3RoVmFsdWUsIGN1c3RvbWl6ZXIsIGlzTG9vc2UsIHN0YWNrQSwgc3RhY2tCKSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZXF1YWxBcnJheXM7XG4iLCIvKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgYm9vbFRhZyA9ICdbb2JqZWN0IEJvb2xlYW5dJyxcbiAgICBkYXRlVGFnID0gJ1tvYmplY3QgRGF0ZV0nLFxuICAgIGVycm9yVGFnID0gJ1tvYmplY3QgRXJyb3JdJyxcbiAgICBudW1iZXJUYWcgPSAnW29iamVjdCBOdW1iZXJdJyxcbiAgICByZWdleHBUYWcgPSAnW29iamVjdCBSZWdFeHBdJyxcbiAgICBzdHJpbmdUYWcgPSAnW29iamVjdCBTdHJpbmddJztcblxuLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYGJhc2VJc0VxdWFsRGVlcGAgZm9yIGNvbXBhcmluZyBvYmplY3RzIG9mXG4gKiB0aGUgc2FtZSBgdG9TdHJpbmdUYWdgLlxuICpcbiAqICoqTm90ZToqKiBUaGlzIGZ1bmN0aW9uIG9ubHkgc3VwcG9ydHMgY29tcGFyaW5nIHZhbHVlcyB3aXRoIHRhZ3Mgb2ZcbiAqIGBCb29sZWFuYCwgYERhdGVgLCBgRXJyb3JgLCBgTnVtYmVyYCwgYFJlZ0V4cGAsIG9yIGBTdHJpbmdgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvdGhlciBUaGUgb3RoZXIgb2JqZWN0IHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnIFRoZSBgdG9TdHJpbmdUYWdgIG9mIHRoZSBvYmplY3RzIHRvIGNvbXBhcmUuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIG9iamVjdHMgYXJlIGVxdWl2YWxlbnQsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gZXF1YWxCeVRhZyhvYmplY3QsIG90aGVyLCB0YWcpIHtcbiAgc3dpdGNoICh0YWcpIHtcbiAgICBjYXNlIGJvb2xUYWc6XG4gICAgY2FzZSBkYXRlVGFnOlxuICAgICAgLy8gQ29lcmNlIGRhdGVzIGFuZCBib29sZWFucyB0byBudW1iZXJzLCBkYXRlcyB0byBtaWxsaXNlY29uZHMgYW5kIGJvb2xlYW5zXG4gICAgICAvLyB0byBgMWAgb3IgYDBgIHRyZWF0aW5nIGludmFsaWQgZGF0ZXMgY29lcmNlZCB0byBgTmFOYCBhcyBub3QgZXF1YWwuXG4gICAgICByZXR1cm4gK29iamVjdCA9PSArb3RoZXI7XG5cbiAgICBjYXNlIGVycm9yVGFnOlxuICAgICAgcmV0dXJuIG9iamVjdC5uYW1lID09IG90aGVyLm5hbWUgJiYgb2JqZWN0Lm1lc3NhZ2UgPT0gb3RoZXIubWVzc2FnZTtcblxuICAgIGNhc2UgbnVtYmVyVGFnOlxuICAgICAgLy8gVHJlYXQgYE5hTmAgdnMuIGBOYU5gIGFzIGVxdWFsLlxuICAgICAgcmV0dXJuIChvYmplY3QgIT0gK29iamVjdClcbiAgICAgICAgPyBvdGhlciAhPSArb3RoZXJcbiAgICAgICAgOiBvYmplY3QgPT0gK290aGVyO1xuXG4gICAgY2FzZSByZWdleHBUYWc6XG4gICAgY2FzZSBzdHJpbmdUYWc6XG4gICAgICAvLyBDb2VyY2UgcmVnZXhlcyB0byBzdHJpbmdzIGFuZCB0cmVhdCBzdHJpbmdzIHByaW1pdGl2ZXMgYW5kIHN0cmluZ1xuICAgICAgLy8gb2JqZWN0cyBhcyBlcXVhbC4gU2VlIGh0dHBzOi8vZXM1LmdpdGh1Yi5pby8jeDE1LjEwLjYuNCBmb3IgbW9yZSBkZXRhaWxzLlxuICAgICAgcmV0dXJuIG9iamVjdCA9PSAob3RoZXIgKyAnJyk7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGVxdWFsQnlUYWc7XG4iLCJ2YXIga2V5cyA9IHJlcXVpcmUoJy4uL29iamVjdC9rZXlzJyk7XG5cbi8qKiBVc2VkIGZvciBuYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuXG4vKipcbiAqIEEgc3BlY2lhbGl6ZWQgdmVyc2lvbiBvZiBgYmFzZUlzRXF1YWxEZWVwYCBmb3Igb2JqZWN0cyB3aXRoIHN1cHBvcnQgZm9yXG4gKiBwYXJ0aWFsIGRlZXAgY29tcGFyaXNvbnMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBjb21wYXJlLlxuICogQHBhcmFtIHtPYmplY3R9IG90aGVyIFRoZSBvdGhlciBvYmplY3QgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGVxdWFsRnVuYyBUaGUgZnVuY3Rpb24gdG8gZGV0ZXJtaW5lIGVxdWl2YWxlbnRzIG9mIHZhbHVlcy5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtjdXN0b21pemVyXSBUaGUgZnVuY3Rpb24gdG8gY3VzdG9taXplIGNvbXBhcmluZyB2YWx1ZXMuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtpc0xvb3NlXSBTcGVjaWZ5IHBlcmZvcm1pbmcgcGFydGlhbCBjb21wYXJpc29ucy5cbiAqIEBwYXJhbSB7QXJyYXl9IFtzdGFja0FdIFRyYWNrcyB0cmF2ZXJzZWQgYHZhbHVlYCBvYmplY3RzLlxuICogQHBhcmFtIHtBcnJheX0gW3N0YWNrQl0gVHJhY2tzIHRyYXZlcnNlZCBgb3RoZXJgIG9iamVjdHMuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIG9iamVjdHMgYXJlIGVxdWl2YWxlbnQsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gZXF1YWxPYmplY3RzKG9iamVjdCwgb3RoZXIsIGVxdWFsRnVuYywgY3VzdG9taXplciwgaXNMb29zZSwgc3RhY2tBLCBzdGFja0IpIHtcbiAgdmFyIG9ialByb3BzID0ga2V5cyhvYmplY3QpLFxuICAgICAgb2JqTGVuZ3RoID0gb2JqUHJvcHMubGVuZ3RoLFxuICAgICAgb3RoUHJvcHMgPSBrZXlzKG90aGVyKSxcbiAgICAgIG90aExlbmd0aCA9IG90aFByb3BzLmxlbmd0aDtcblxuICBpZiAob2JqTGVuZ3RoICE9IG90aExlbmd0aCAmJiAhaXNMb29zZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICB2YXIgaW5kZXggPSBvYmpMZW5ndGg7XG4gIHdoaWxlIChpbmRleC0tKSB7XG4gICAgdmFyIGtleSA9IG9ialByb3BzW2luZGV4XTtcbiAgICBpZiAoIShpc0xvb3NlID8ga2V5IGluIG90aGVyIDogaGFzT3duUHJvcGVydHkuY2FsbChvdGhlciwga2V5KSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgdmFyIHNraXBDdG9yID0gaXNMb29zZTtcbiAgd2hpbGUgKCsraW5kZXggPCBvYmpMZW5ndGgpIHtcbiAgICBrZXkgPSBvYmpQcm9wc1tpbmRleF07XG4gICAgdmFyIG9ialZhbHVlID0gb2JqZWN0W2tleV0sXG4gICAgICAgIG90aFZhbHVlID0gb3RoZXJba2V5XSxcbiAgICAgICAgcmVzdWx0ID0gY3VzdG9taXplciA/IGN1c3RvbWl6ZXIoaXNMb29zZSA/IG90aFZhbHVlIDogb2JqVmFsdWUsIGlzTG9vc2U/IG9ialZhbHVlIDogb3RoVmFsdWUsIGtleSkgOiB1bmRlZmluZWQ7XG5cbiAgICAvLyBSZWN1cnNpdmVseSBjb21wYXJlIG9iamVjdHMgKHN1c2NlcHRpYmxlIHRvIGNhbGwgc3RhY2sgbGltaXRzKS5cbiAgICBpZiAoIShyZXN1bHQgPT09IHVuZGVmaW5lZCA/IGVxdWFsRnVuYyhvYmpWYWx1ZSwgb3RoVmFsdWUsIGN1c3RvbWl6ZXIsIGlzTG9vc2UsIHN0YWNrQSwgc3RhY2tCKSA6IHJlc3VsdCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgc2tpcEN0b3IgfHwgKHNraXBDdG9yID0ga2V5ID09ICdjb25zdHJ1Y3RvcicpO1xuICB9XG4gIGlmICghc2tpcEN0b3IpIHtcbiAgICB2YXIgb2JqQ3RvciA9IG9iamVjdC5jb25zdHJ1Y3RvcixcbiAgICAgICAgb3RoQ3RvciA9IG90aGVyLmNvbnN0cnVjdG9yO1xuXG4gICAgLy8gTm9uIGBPYmplY3RgIG9iamVjdCBpbnN0YW5jZXMgd2l0aCBkaWZmZXJlbnQgY29uc3RydWN0b3JzIGFyZSBub3QgZXF1YWwuXG4gICAgaWYgKG9iakN0b3IgIT0gb3RoQ3RvciAmJlxuICAgICAgICAoJ2NvbnN0cnVjdG9yJyBpbiBvYmplY3QgJiYgJ2NvbnN0cnVjdG9yJyBpbiBvdGhlcikgJiZcbiAgICAgICAgISh0eXBlb2Ygb2JqQ3RvciA9PSAnZnVuY3Rpb24nICYmIG9iakN0b3IgaW5zdGFuY2VvZiBvYmpDdG9yICYmXG4gICAgICAgICAgdHlwZW9mIG90aEN0b3IgPT0gJ2Z1bmN0aW9uJyAmJiBvdGhDdG9yIGluc3RhbmNlb2Ygb3RoQ3RvcikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZXF1YWxPYmplY3RzO1xuIiwidmFyIGJhc2VQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vYmFzZVByb3BlcnR5Jyk7XG5cbi8qKlxuICogR2V0cyB0aGUgXCJsZW5ndGhcIiBwcm9wZXJ0eSB2YWx1ZSBvZiBgb2JqZWN0YC5cbiAqXG4gKiAqKk5vdGU6KiogVGhpcyBmdW5jdGlvbiBpcyB1c2VkIHRvIGF2b2lkIGEgW0pJVCBidWddKGh0dHBzOi8vYnVncy53ZWJraXQub3JnL3Nob3dfYnVnLmNnaT9pZD0xNDI3OTIpXG4gKiB0aGF0IGFmZmVjdHMgU2FmYXJpIG9uIGF0IGxlYXN0IGlPUyA4LjEtOC4zIEFSTTY0LlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gcXVlcnkuXG4gKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgXCJsZW5ndGhcIiB2YWx1ZS5cbiAqL1xudmFyIGdldExlbmd0aCA9IGJhc2VQcm9wZXJ0eSgnbGVuZ3RoJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0TGVuZ3RoO1xuIiwidmFyIGlzU3RyaWN0Q29tcGFyYWJsZSA9IHJlcXVpcmUoJy4vaXNTdHJpY3RDb21wYXJhYmxlJyksXG4gICAgcGFpcnMgPSByZXF1aXJlKCcuLi9vYmplY3QvcGFpcnMnKTtcblxuLyoqXG4gKiBHZXRzIHRoZSBwcm9wZXJ5IG5hbWVzLCB2YWx1ZXMsIGFuZCBjb21wYXJlIGZsYWdzIG9mIGBvYmplY3RgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gcXVlcnkuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIG1hdGNoIGRhdGEgb2YgYG9iamVjdGAuXG4gKi9cbmZ1bmN0aW9uIGdldE1hdGNoRGF0YShvYmplY3QpIHtcbiAgdmFyIHJlc3VsdCA9IHBhaXJzKG9iamVjdCksXG4gICAgICBsZW5ndGggPSByZXN1bHQubGVuZ3RoO1xuXG4gIHdoaWxlIChsZW5ndGgtLSkge1xuICAgIHJlc3VsdFtsZW5ndGhdWzJdID0gaXNTdHJpY3RDb21wYXJhYmxlKHJlc3VsdFtsZW5ndGhdWzFdKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGdldE1hdGNoRGF0YTtcbiIsInZhciBpc05hdGl2ZSA9IHJlcXVpcmUoJy4uL2xhbmcvaXNOYXRpdmUnKTtcblxuLyoqXG4gKiBHZXRzIHRoZSBuYXRpdmUgZnVuY3Rpb24gYXQgYGtleWAgb2YgYG9iamVjdGAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgbWV0aG9kIHRvIGdldC5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBmdW5jdGlvbiBpZiBpdCdzIG5hdGl2ZSwgZWxzZSBgdW5kZWZpbmVkYC5cbiAqL1xuZnVuY3Rpb24gZ2V0TmF0aXZlKG9iamVjdCwga2V5KSB7XG4gIHZhciB2YWx1ZSA9IG9iamVjdCA9PSBudWxsID8gdW5kZWZpbmVkIDogb2JqZWN0W2tleV07XG4gIHJldHVybiBpc05hdGl2ZSh2YWx1ZSkgPyB2YWx1ZSA6IHVuZGVmaW5lZDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBnZXROYXRpdmU7XG4iLCIvKipcbiAqIEdldHMgdGhlIGluZGV4IGF0IHdoaWNoIHRoZSBmaXJzdCBvY2N1cnJlbmNlIG9mIGBOYU5gIGlzIGZvdW5kIGluIGBhcnJheWAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBzZWFyY2guXG4gKiBAcGFyYW0ge251bWJlcn0gZnJvbUluZGV4IFRoZSBpbmRleCB0byBzZWFyY2ggZnJvbS5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2Zyb21SaWdodF0gU3BlY2lmeSBpdGVyYXRpbmcgZnJvbSByaWdodCB0byBsZWZ0LlxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgaW5kZXggb2YgdGhlIG1hdGNoZWQgYE5hTmAsIGVsc2UgYC0xYC5cbiAqL1xuZnVuY3Rpb24gaW5kZXhPZk5hTihhcnJheSwgZnJvbUluZGV4LCBmcm9tUmlnaHQpIHtcbiAgdmFyIGxlbmd0aCA9IGFycmF5Lmxlbmd0aCxcbiAgICAgIGluZGV4ID0gZnJvbUluZGV4ICsgKGZyb21SaWdodCA/IDAgOiAtMSk7XG5cbiAgd2hpbGUgKChmcm9tUmlnaHQgPyBpbmRleC0tIDogKytpbmRleCA8IGxlbmd0aCkpIHtcbiAgICB2YXIgb3RoZXIgPSBhcnJheVtpbmRleF07XG4gICAgaWYgKG90aGVyICE9PSBvdGhlcikge1xuICAgICAgcmV0dXJuIGluZGV4O1xuICAgIH1cbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaW5kZXhPZk5hTjtcbiIsInZhciBnZXRMZW5ndGggPSByZXF1aXJlKCcuL2dldExlbmd0aCcpLFxuICAgIGlzTGVuZ3RoID0gcmVxdWlyZSgnLi9pc0xlbmd0aCcpO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGFycmF5LWxpa2UuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYXJyYXktbGlrZSwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBpc0FycmF5TGlrZSh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgIT0gbnVsbCAmJiBpc0xlbmd0aChnZXRMZW5ndGgodmFsdWUpKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc0FycmF5TGlrZTtcbiIsIi8qKiBVc2VkIHRvIGRldGVjdCB1bnNpZ25lZCBpbnRlZ2VyIHZhbHVlcy4gKi9cbnZhciByZUlzVWludCA9IC9eXFxkKyQvO1xuXG4vKipcbiAqIFVzZWQgYXMgdGhlIFttYXhpbXVtIGxlbmd0aF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtbnVtYmVyLm1heF9zYWZlX2ludGVnZXIpXG4gKiBvZiBhbiBhcnJheS1saWtlIHZhbHVlLlxuICovXG52YXIgTUFYX1NBRkVfSU5URUdFUiA9IDkwMDcxOTkyNTQ3NDA5OTE7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSB2YWxpZCBhcnJheS1saWtlIGluZGV4LlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbbGVuZ3RoPU1BWF9TQUZFX0lOVEVHRVJdIFRoZSB1cHBlciBib3VuZHMgb2YgYSB2YWxpZCBpbmRleC5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgdmFsaWQgaW5kZXgsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNJbmRleCh2YWx1ZSwgbGVuZ3RoKSB7XG4gIHZhbHVlID0gKHR5cGVvZiB2YWx1ZSA9PSAnbnVtYmVyJyB8fCByZUlzVWludC50ZXN0KHZhbHVlKSkgPyArdmFsdWUgOiAtMTtcbiAgbGVuZ3RoID0gbGVuZ3RoID09IG51bGwgPyBNQVhfU0FGRV9JTlRFR0VSIDogbGVuZ3RoO1xuICByZXR1cm4gdmFsdWUgPiAtMSAmJiB2YWx1ZSAlIDEgPT0gMCAmJiB2YWx1ZSA8IGxlbmd0aDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc0luZGV4O1xuIiwidmFyIGlzQXJyYXkgPSByZXF1aXJlKCcuLi9sYW5nL2lzQXJyYXknKSxcbiAgICB0b09iamVjdCA9IHJlcXVpcmUoJy4vdG9PYmplY3QnKTtcblxuLyoqIFVzZWQgdG8gbWF0Y2ggcHJvcGVydHkgbmFtZXMgd2l0aGluIHByb3BlcnR5IHBhdGhzLiAqL1xudmFyIHJlSXNEZWVwUHJvcCA9IC9cXC58XFxbKD86W15bXFxdXSp8KFtcIiddKSg/Oig/IVxcMSlbXlxcblxcXFxdfFxcXFwuKSo/XFwxKVxcXS8sXG4gICAgcmVJc1BsYWluUHJvcCA9IC9eXFx3KiQvO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgcHJvcGVydHkgbmFtZSBhbmQgbm90IGEgcHJvcGVydHkgcGF0aC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcGFyYW0ge09iamVjdH0gW29iamVjdF0gVGhlIG9iamVjdCB0byBxdWVyeSBrZXlzIG9uLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSBwcm9wZXJ0eSBuYW1lLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzS2V5KHZhbHVlLCBvYmplY3QpIHtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG4gIGlmICgodHlwZSA9PSAnc3RyaW5nJyAmJiByZUlzUGxhaW5Qcm9wLnRlc3QodmFsdWUpKSB8fCB0eXBlID09ICdudW1iZXInKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHZhciByZXN1bHQgPSAhcmVJc0RlZXBQcm9wLnRlc3QodmFsdWUpO1xuICByZXR1cm4gcmVzdWx0IHx8IChvYmplY3QgIT0gbnVsbCAmJiB2YWx1ZSBpbiB0b09iamVjdChvYmplY3QpKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc0tleTtcbiIsIi8qKlxuICogVXNlZCBhcyB0aGUgW21heGltdW0gbGVuZ3RoXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1udW1iZXIubWF4X3NhZmVfaW50ZWdlcilcbiAqIG9mIGFuIGFycmF5LWxpa2UgdmFsdWUuXG4gKi9cbnZhciBNQVhfU0FGRV9JTlRFR0VSID0gOTAwNzE5OTI1NDc0MDk5MTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIHZhbGlkIGFycmF5LWxpa2UgbGVuZ3RoLlxuICpcbiAqICoqTm90ZToqKiBUaGlzIGZ1bmN0aW9uIGlzIGJhc2VkIG9uIFtgVG9MZW5ndGhgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy10b2xlbmd0aCkuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSB2YWxpZCBsZW5ndGgsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNMZW5ndGgodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PSAnbnVtYmVyJyAmJiB2YWx1ZSA+IC0xICYmIHZhbHVlICUgMSA9PSAwICYmIHZhbHVlIDw9IE1BWF9TQUZFX0lOVEVHRVI7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNMZW5ndGg7XG4iLCIvKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIG9iamVjdC1saWtlLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIG9iamVjdC1saWtlLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0TGlrZSh2YWx1ZSkge1xuICByZXR1cm4gISF2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNPYmplY3RMaWtlO1xuIiwidmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi4vbGFuZy9pc09iamVjdCcpO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIHN1aXRhYmxlIGZvciBzdHJpY3QgZXF1YWxpdHkgY29tcGFyaXNvbnMsIGkuZS4gYD09PWAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaWYgc3VpdGFibGUgZm9yIHN0cmljdFxuICogIGVxdWFsaXR5IGNvbXBhcmlzb25zLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzU3RyaWN0Q29tcGFyYWJsZSh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgPT09IHZhbHVlICYmICFpc09iamVjdCh2YWx1ZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNTdHJpY3RDb21wYXJhYmxlO1xuIiwidmFyIHRvT2JqZWN0ID0gcmVxdWlyZSgnLi90b09iamVjdCcpO1xuXG4vKipcbiAqIEEgc3BlY2lhbGl6ZWQgdmVyc2lvbiBvZiBgXy5waWNrYCB3aGljaCBwaWNrcyBgb2JqZWN0YCBwcm9wZXJ0aWVzIHNwZWNpZmllZFxuICogYnkgYHByb3BzYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgc291cmNlIG9iamVjdC5cbiAqIEBwYXJhbSB7c3RyaW5nW119IHByb3BzIFRoZSBwcm9wZXJ0eSBuYW1lcyB0byBwaWNrLlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyB0aGUgbmV3IG9iamVjdC5cbiAqL1xuZnVuY3Rpb24gcGlja0J5QXJyYXkob2JqZWN0LCBwcm9wcykge1xuICBvYmplY3QgPSB0b09iamVjdChvYmplY3QpO1xuXG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gcHJvcHMubGVuZ3RoLFxuICAgICAgcmVzdWx0ID0ge307XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICB2YXIga2V5ID0gcHJvcHNbaW5kZXhdO1xuICAgIGlmIChrZXkgaW4gb2JqZWN0KSB7XG4gICAgICByZXN1bHRba2V5XSA9IG9iamVjdFtrZXldO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHBpY2tCeUFycmF5O1xuIiwidmFyIGJhc2VGb3JJbiA9IHJlcXVpcmUoJy4vYmFzZUZvckluJyk7XG5cbi8qKlxuICogQSBzcGVjaWFsaXplZCB2ZXJzaW9uIG9mIGBfLnBpY2tgIHdoaWNoIHBpY2tzIGBvYmplY3RgIHByb3BlcnRpZXMgYHByZWRpY2F0ZWBcbiAqIHJldHVybnMgdHJ1dGh5IGZvci5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgc291cmNlIG9iamVjdC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IHByZWRpY2F0ZSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyB0aGUgbmV3IG9iamVjdC5cbiAqL1xuZnVuY3Rpb24gcGlja0J5Q2FsbGJhY2sob2JqZWN0LCBwcmVkaWNhdGUpIHtcbiAgdmFyIHJlc3VsdCA9IHt9O1xuICBiYXNlRm9ySW4ob2JqZWN0LCBmdW5jdGlvbih2YWx1ZSwga2V5LCBvYmplY3QpIHtcbiAgICBpZiAocHJlZGljYXRlKHZhbHVlLCBrZXksIG9iamVjdCkpIHtcbiAgICAgIHJlc3VsdFtrZXldID0gdmFsdWU7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBwaWNrQnlDYWxsYmFjaztcbiIsInZhciBpc0FyZ3VtZW50cyA9IHJlcXVpcmUoJy4uL2xhbmcvaXNBcmd1bWVudHMnKSxcbiAgICBpc0FycmF5ID0gcmVxdWlyZSgnLi4vbGFuZy9pc0FycmF5JyksXG4gICAgaXNJbmRleCA9IHJlcXVpcmUoJy4vaXNJbmRleCcpLFxuICAgIGlzTGVuZ3RoID0gcmVxdWlyZSgnLi9pc0xlbmd0aCcpLFxuICAgIGtleXNJbiA9IHJlcXVpcmUoJy4uL29iamVjdC9rZXlzSW4nKTtcblxuLyoqIFVzZWQgZm9yIG5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIGNoZWNrIG9iamVjdHMgZm9yIG93biBwcm9wZXJ0aWVzLiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogQSBmYWxsYmFjayBpbXBsZW1lbnRhdGlvbiBvZiBgT2JqZWN0LmtleXNgIHdoaWNoIGNyZWF0ZXMgYW4gYXJyYXkgb2YgdGhlXG4gKiBvd24gZW51bWVyYWJsZSBwcm9wZXJ0eSBuYW1lcyBvZiBgb2JqZWN0YC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBhcnJheSBvZiBwcm9wZXJ0eSBuYW1lcy5cbiAqL1xuZnVuY3Rpb24gc2hpbUtleXMob2JqZWN0KSB7XG4gIHZhciBwcm9wcyA9IGtleXNJbihvYmplY3QpLFxuICAgICAgcHJvcHNMZW5ndGggPSBwcm9wcy5sZW5ndGgsXG4gICAgICBsZW5ndGggPSBwcm9wc0xlbmd0aCAmJiBvYmplY3QubGVuZ3RoO1xuXG4gIHZhciBhbGxvd0luZGV4ZXMgPSAhIWxlbmd0aCAmJiBpc0xlbmd0aChsZW5ndGgpICYmXG4gICAgKGlzQXJyYXkob2JqZWN0KSB8fCBpc0FyZ3VtZW50cyhvYmplY3QpKTtcblxuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIHJlc3VsdCA9IFtdO1xuXG4gIHdoaWxlICgrK2luZGV4IDwgcHJvcHNMZW5ndGgpIHtcbiAgICB2YXIga2V5ID0gcHJvcHNbaW5kZXhdO1xuICAgIGlmICgoYWxsb3dJbmRleGVzICYmIGlzSW5kZXgoa2V5LCBsZW5ndGgpKSB8fCBoYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwga2V5KSkge1xuICAgICAgcmVzdWx0LnB1c2goa2V5KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzaGltS2V5cztcbiIsInZhciBpc09iamVjdCA9IHJlcXVpcmUoJy4uL2xhbmcvaXNPYmplY3QnKTtcblxuLyoqXG4gKiBDb252ZXJ0cyBgdmFsdWVgIHRvIGFuIG9iamVjdCBpZiBpdCdzIG5vdCBvbmUuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHByb2Nlc3MuXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBvYmplY3QuXG4gKi9cbmZ1bmN0aW9uIHRvT2JqZWN0KHZhbHVlKSB7XG4gIHJldHVybiBpc09iamVjdCh2YWx1ZSkgPyB2YWx1ZSA6IE9iamVjdCh2YWx1ZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdG9PYmplY3Q7XG4iLCJ2YXIgYmFzZVRvU3RyaW5nID0gcmVxdWlyZSgnLi9iYXNlVG9TdHJpbmcnKSxcbiAgICBpc0FycmF5ID0gcmVxdWlyZSgnLi4vbGFuZy9pc0FycmF5Jyk7XG5cbi8qKiBVc2VkIHRvIG1hdGNoIHByb3BlcnR5IG5hbWVzIHdpdGhpbiBwcm9wZXJ0eSBwYXRocy4gKi9cbnZhciByZVByb3BOYW1lID0gL1teLltcXF1dK3xcXFsoPzooLT9cXGQrKD86XFwuXFxkKyk/KXwoW1wiJ10pKCg/Oig/IVxcMilbXlxcblxcXFxdfFxcXFwuKSo/KVxcMilcXF0vZztcblxuLyoqIFVzZWQgdG8gbWF0Y2ggYmFja3NsYXNoZXMgaW4gcHJvcGVydHkgcGF0aHMuICovXG52YXIgcmVFc2NhcGVDaGFyID0gL1xcXFwoXFxcXCk/L2c7XG5cbi8qKlxuICogQ29udmVydHMgYHZhbHVlYCB0byBwcm9wZXJ0eSBwYXRoIGFycmF5IGlmIGl0J3Mgbm90IG9uZS5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gcHJvY2Vzcy5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgcHJvcGVydHkgcGF0aCBhcnJheS5cbiAqL1xuZnVuY3Rpb24gdG9QYXRoKHZhbHVlKSB7XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuICB2YXIgcmVzdWx0ID0gW107XG4gIGJhc2VUb1N0cmluZyh2YWx1ZSkucmVwbGFjZShyZVByb3BOYW1lLCBmdW5jdGlvbihtYXRjaCwgbnVtYmVyLCBxdW90ZSwgc3RyaW5nKSB7XG4gICAgcmVzdWx0LnB1c2gocXVvdGUgPyBzdHJpbmcucmVwbGFjZShyZUVzY2FwZUNoYXIsICckMScpIDogKG51bWJlciB8fCBtYXRjaCkpO1xuICB9KTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0b1BhdGg7XG4iLCJ2YXIgaXNBcnJheUxpa2UgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9pc0FycmF5TGlrZScpLFxuICAgIGlzT2JqZWN0TGlrZSA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2lzT2JqZWN0TGlrZScpO1xuXG4vKiogVXNlZCBmb3IgbmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqIE5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBwcm9wZXJ0eUlzRW51bWVyYWJsZSA9IG9iamVjdFByb3RvLnByb3BlcnR5SXNFbnVtZXJhYmxlO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYW4gYGFyZ3VtZW50c2Agb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBjb3JyZWN0bHkgY2xhc3NpZmllZCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzQXJndW1lbnRzKGZ1bmN0aW9uKCkgeyByZXR1cm4gYXJndW1lbnRzOyB9KCkpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNBcmd1bWVudHMoWzEsIDIsIDNdKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzQXJndW1lbnRzKHZhbHVlKSB7XG4gIHJldHVybiBpc09iamVjdExpa2UodmFsdWUpICYmIGlzQXJyYXlMaWtlKHZhbHVlKSAmJlxuICAgIGhhc093blByb3BlcnR5LmNhbGwodmFsdWUsICdjYWxsZWUnKSAmJiAhcHJvcGVydHlJc0VudW1lcmFibGUuY2FsbCh2YWx1ZSwgJ2NhbGxlZScpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzQXJndW1lbnRzO1xuIiwidmFyIGdldE5hdGl2ZSA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2dldE5hdGl2ZScpLFxuICAgIGlzTGVuZ3RoID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvaXNMZW5ndGgnKSxcbiAgICBpc09iamVjdExpa2UgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9pc09iamVjdExpa2UnKTtcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIGFycmF5VGFnID0gJ1tvYmplY3QgQXJyYXldJztcblxuLyoqIFVzZWQgZm9yIG5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKlxuICogVXNlZCB0byByZXNvbHZlIHRoZSBbYHRvU3RyaW5nVGFnYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtb2JqZWN0LnByb3RvdHlwZS50b3N0cmluZylcbiAqIG9mIHZhbHVlcy5cbiAqL1xudmFyIG9ialRvU3RyaW5nID0gb2JqZWN0UHJvdG8udG9TdHJpbmc7XG5cbi8qIE5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcyBmb3IgdGhvc2Ugd2l0aCB0aGUgc2FtZSBuYW1lIGFzIG90aGVyIGBsb2Rhc2hgIG1ldGhvZHMuICovXG52YXIgbmF0aXZlSXNBcnJheSA9IGdldE5hdGl2ZShBcnJheSwgJ2lzQXJyYXknKTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGFuIGBBcnJheWAgb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBjb3JyZWN0bHkgY2xhc3NpZmllZCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzQXJyYXkoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzQXJyYXkoZnVuY3Rpb24oKSB7IHJldHVybiBhcmd1bWVudHM7IH0oKSk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG52YXIgaXNBcnJheSA9IG5hdGl2ZUlzQXJyYXkgfHwgZnVuY3Rpb24odmFsdWUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0TGlrZSh2YWx1ZSkgJiYgaXNMZW5ndGgodmFsdWUubGVuZ3RoKSAmJiBvYmpUb1N0cmluZy5jYWxsKHZhbHVlKSA9PSBhcnJheVRhZztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gaXNBcnJheTtcbiIsInZhciBpc09iamVjdCA9IHJlcXVpcmUoJy4vaXNPYmplY3QnKTtcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIGZ1bmNUYWcgPSAnW29iamVjdCBGdW5jdGlvbl0nO1xuXG4vKiogVXNlZCBmb3IgbmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgdGhlIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICogb2YgdmFsdWVzLlxuICovXG52YXIgb2JqVG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGEgYEZ1bmN0aW9uYCBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGNvcnJlY3RseSBjbGFzc2lmaWVkLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNGdW5jdGlvbihfKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzRnVuY3Rpb24oL2FiYy8pO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNGdW5jdGlvbih2YWx1ZSkge1xuICAvLyBUaGUgdXNlIG9mIGBPYmplY3QjdG9TdHJpbmdgIGF2b2lkcyBpc3N1ZXMgd2l0aCB0aGUgYHR5cGVvZmAgb3BlcmF0b3JcbiAgLy8gaW4gb2xkZXIgdmVyc2lvbnMgb2YgQ2hyb21lIGFuZCBTYWZhcmkgd2hpY2ggcmV0dXJuICdmdW5jdGlvbicgZm9yIHJlZ2V4ZXNcbiAgLy8gYW5kIFNhZmFyaSA4IHdoaWNoIHJldHVybnMgJ29iamVjdCcgZm9yIHR5cGVkIGFycmF5IGNvbnN0cnVjdG9ycy5cbiAgcmV0dXJuIGlzT2JqZWN0KHZhbHVlKSAmJiBvYmpUb1N0cmluZy5jYWxsKHZhbHVlKSA9PSBmdW5jVGFnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzRnVuY3Rpb247XG4iLCJ2YXIgaXNGdW5jdGlvbiA9IHJlcXVpcmUoJy4vaXNGdW5jdGlvbicpLFxuICAgIGlzT2JqZWN0TGlrZSA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2lzT2JqZWN0TGlrZScpO1xuXG4vKiogVXNlZCB0byBkZXRlY3QgaG9zdCBjb25zdHJ1Y3RvcnMgKFNhZmFyaSA+IDUpLiAqL1xudmFyIHJlSXNIb3N0Q3RvciA9IC9eXFxbb2JqZWN0IC4rP0NvbnN0cnVjdG9yXFxdJC87XG5cbi8qKiBVc2VkIGZvciBuYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogVXNlZCB0byByZXNvbHZlIHRoZSBkZWNvbXBpbGVkIHNvdXJjZSBvZiBmdW5jdGlvbnMuICovXG52YXIgZm5Ub1N0cmluZyA9IEZ1bmN0aW9uLnByb3RvdHlwZS50b1N0cmluZztcblxuLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IGlmIGEgbWV0aG9kIGlzIG5hdGl2ZS4gKi9cbnZhciByZUlzTmF0aXZlID0gUmVnRXhwKCdeJyArXG4gIGZuVG9TdHJpbmcuY2FsbChoYXNPd25Qcm9wZXJ0eSkucmVwbGFjZSgvW1xcXFxeJC4qKz8oKVtcXF17fXxdL2csICdcXFxcJCYnKVxuICAucmVwbGFjZSgvaGFzT3duUHJvcGVydHl8KGZ1bmN0aW9uKS4qPyg/PVxcXFxcXCgpfCBmb3IgLis/KD89XFxcXFxcXSkvZywgJyQxLio/JykgKyAnJCdcbik7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSBuYXRpdmUgZnVuY3Rpb24uXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgbmF0aXZlIGZ1bmN0aW9uLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNOYXRpdmUoQXJyYXkucHJvdG90eXBlLnB1c2gpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNOYXRpdmUoXyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc05hdGl2ZSh2YWx1ZSkge1xuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICByZXR1cm4gcmVJc05hdGl2ZS50ZXN0KGZuVG9TdHJpbmcuY2FsbCh2YWx1ZSkpO1xuICB9XG4gIHJldHVybiBpc09iamVjdExpa2UodmFsdWUpICYmIHJlSXNIb3N0Q3Rvci50ZXN0KHZhbHVlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc05hdGl2ZTtcbiIsIi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgdGhlIFtsYW5ndWFnZSB0eXBlXShodHRwczovL2VzNS5naXRodWIuaW8vI3g4KSBvZiBgT2JqZWN0YC5cbiAqIChlLmcuIGFycmF5cywgZnVuY3Rpb25zLCBvYmplY3RzLCByZWdleGVzLCBgbmV3IE51bWJlcigwKWAsIGFuZCBgbmV3IFN0cmluZygnJylgKVxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhbiBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc09iamVjdCh7fSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QoMSk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc09iamVjdCh2YWx1ZSkge1xuICAvLyBBdm9pZCBhIFY4IEpJVCBidWcgaW4gQ2hyb21lIDE5LTIwLlxuICAvLyBTZWUgaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTIyOTEgZm9yIG1vcmUgZGV0YWlscy5cbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG4gIHJldHVybiAhIXZhbHVlICYmICh0eXBlID09ICdvYmplY3QnIHx8IHR5cGUgPT0gJ2Z1bmN0aW9uJyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNPYmplY3Q7XG4iLCJ2YXIgYmFzZUZvckluID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvYmFzZUZvckluJyksXG4gICAgaXNBcmd1bWVudHMgPSByZXF1aXJlKCcuL2lzQXJndW1lbnRzJyksXG4gICAgaXNPYmplY3RMaWtlID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvaXNPYmplY3RMaWtlJyk7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RUYWcgPSAnW29iamVjdCBPYmplY3RdJztcblxuLyoqIFVzZWQgZm9yIG5hdGl2ZSBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIGNoZWNrIG9iamVjdHMgZm9yIG93biBwcm9wZXJ0aWVzLiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogVXNlZCB0byByZXNvbHZlIHRoZSBbYHRvU3RyaW5nVGFnYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtb2JqZWN0LnByb3RvdHlwZS50b3N0cmluZylcbiAqIG9mIHZhbHVlcy5cbiAqL1xudmFyIG9ialRvU3RyaW5nID0gb2JqZWN0UHJvdG8udG9TdHJpbmc7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSBwbGFpbiBvYmplY3QsIHRoYXQgaXMsIGFuIG9iamVjdCBjcmVhdGVkIGJ5IHRoZVxuICogYE9iamVjdGAgY29uc3RydWN0b3Igb3Igb25lIHdpdGggYSBgW1tQcm90b3R5cGVdXWAgb2YgYG51bGxgLlxuICpcbiAqICoqTm90ZToqKiBUaGlzIG1ldGhvZCBhc3N1bWVzIG9iamVjdHMgY3JlYXRlZCBieSB0aGUgYE9iamVjdGAgY29uc3RydWN0b3JcbiAqIGhhdmUgbm8gaW5oZXJpdGVkIGVudW1lcmFibGUgcHJvcGVydGllcy5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSBwbGFpbiBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogZnVuY3Rpb24gRm9vKCkge1xuICogICB0aGlzLmEgPSAxO1xuICogfVxuICpcbiAqIF8uaXNQbGFpbk9iamVjdChuZXcgRm9vKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc1BsYWluT2JqZWN0KFsxLCAyLCAzXSk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNQbGFpbk9iamVjdCh7ICd4JzogMCwgJ3knOiAwIH0pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNQbGFpbk9iamVjdChPYmplY3QuY3JlYXRlKG51bGwpKTtcbiAqIC8vID0+IHRydWVcbiAqL1xuZnVuY3Rpb24gaXNQbGFpbk9iamVjdCh2YWx1ZSkge1xuICB2YXIgQ3RvcjtcblxuICAvLyBFeGl0IGVhcmx5IGZvciBub24gYE9iamVjdGAgb2JqZWN0cy5cbiAgaWYgKCEoaXNPYmplY3RMaWtlKHZhbHVlKSAmJiBvYmpUb1N0cmluZy5jYWxsKHZhbHVlKSA9PSBvYmplY3RUYWcgJiYgIWlzQXJndW1lbnRzKHZhbHVlKSkgfHxcbiAgICAgICghaGFzT3duUHJvcGVydHkuY2FsbCh2YWx1ZSwgJ2NvbnN0cnVjdG9yJykgJiYgKEN0b3IgPSB2YWx1ZS5jb25zdHJ1Y3RvciwgdHlwZW9mIEN0b3IgPT0gJ2Z1bmN0aW9uJyAmJiAhKEN0b3IgaW5zdGFuY2VvZiBDdG9yKSkpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vIElFIDwgOSBpdGVyYXRlcyBpbmhlcml0ZWQgcHJvcGVydGllcyBiZWZvcmUgb3duIHByb3BlcnRpZXMuIElmIHRoZSBmaXJzdFxuICAvLyBpdGVyYXRlZCBwcm9wZXJ0eSBpcyBhbiBvYmplY3QncyBvd24gcHJvcGVydHkgdGhlbiB0aGVyZSBhcmUgbm8gaW5oZXJpdGVkXG4gIC8vIGVudW1lcmFibGUgcHJvcGVydGllcy5cbiAgdmFyIHJlc3VsdDtcbiAgLy8gSW4gbW9zdCBlbnZpcm9ubWVudHMgYW4gb2JqZWN0J3Mgb3duIHByb3BlcnRpZXMgYXJlIGl0ZXJhdGVkIGJlZm9yZVxuICAvLyBpdHMgaW5oZXJpdGVkIHByb3BlcnRpZXMuIElmIHRoZSBsYXN0IGl0ZXJhdGVkIHByb3BlcnR5IGlzIGFuIG9iamVjdCdzXG4gIC8vIG93biBwcm9wZXJ0eSB0aGVuIHRoZXJlIGFyZSBubyBpbmhlcml0ZWQgZW51bWVyYWJsZSBwcm9wZXJ0aWVzLlxuICBiYXNlRm9ySW4odmFsdWUsIGZ1bmN0aW9uKHN1YlZhbHVlLCBrZXkpIHtcbiAgICByZXN1bHQgPSBrZXk7XG4gIH0pO1xuICByZXR1cm4gcmVzdWx0ID09PSB1bmRlZmluZWQgfHwgaGFzT3duUHJvcGVydHkuY2FsbCh2YWx1ZSwgcmVzdWx0KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc1BsYWluT2JqZWN0O1xuIiwidmFyIGlzTGVuZ3RoID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvaXNMZW5ndGgnKSxcbiAgICBpc09iamVjdExpa2UgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9pc09iamVjdExpa2UnKTtcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIGFyZ3NUYWcgPSAnW29iamVjdCBBcmd1bWVudHNdJyxcbiAgICBhcnJheVRhZyA9ICdbb2JqZWN0IEFycmF5XScsXG4gICAgYm9vbFRhZyA9ICdbb2JqZWN0IEJvb2xlYW5dJyxcbiAgICBkYXRlVGFnID0gJ1tvYmplY3QgRGF0ZV0nLFxuICAgIGVycm9yVGFnID0gJ1tvYmplY3QgRXJyb3JdJyxcbiAgICBmdW5jVGFnID0gJ1tvYmplY3QgRnVuY3Rpb25dJyxcbiAgICBtYXBUYWcgPSAnW29iamVjdCBNYXBdJyxcbiAgICBudW1iZXJUYWcgPSAnW29iamVjdCBOdW1iZXJdJyxcbiAgICBvYmplY3RUYWcgPSAnW29iamVjdCBPYmplY3RdJyxcbiAgICByZWdleHBUYWcgPSAnW29iamVjdCBSZWdFeHBdJyxcbiAgICBzZXRUYWcgPSAnW29iamVjdCBTZXRdJyxcbiAgICBzdHJpbmdUYWcgPSAnW29iamVjdCBTdHJpbmddJyxcbiAgICB3ZWFrTWFwVGFnID0gJ1tvYmplY3QgV2Vha01hcF0nO1xuXG52YXIgYXJyYXlCdWZmZXJUYWcgPSAnW29iamVjdCBBcnJheUJ1ZmZlcl0nLFxuICAgIGZsb2F0MzJUYWcgPSAnW29iamVjdCBGbG9hdDMyQXJyYXldJyxcbiAgICBmbG9hdDY0VGFnID0gJ1tvYmplY3QgRmxvYXQ2NEFycmF5XScsXG4gICAgaW50OFRhZyA9ICdbb2JqZWN0IEludDhBcnJheV0nLFxuICAgIGludDE2VGFnID0gJ1tvYmplY3QgSW50MTZBcnJheV0nLFxuICAgIGludDMyVGFnID0gJ1tvYmplY3QgSW50MzJBcnJheV0nLFxuICAgIHVpbnQ4VGFnID0gJ1tvYmplY3QgVWludDhBcnJheV0nLFxuICAgIHVpbnQ4Q2xhbXBlZFRhZyA9ICdbb2JqZWN0IFVpbnQ4Q2xhbXBlZEFycmF5XScsXG4gICAgdWludDE2VGFnID0gJ1tvYmplY3QgVWludDE2QXJyYXldJyxcbiAgICB1aW50MzJUYWcgPSAnW29iamVjdCBVaW50MzJBcnJheV0nO1xuXG4vKiogVXNlZCB0byBpZGVudGlmeSBgdG9TdHJpbmdUYWdgIHZhbHVlcyBvZiB0eXBlZCBhcnJheXMuICovXG52YXIgdHlwZWRBcnJheVRhZ3MgPSB7fTtcbnR5cGVkQXJyYXlUYWdzW2Zsb2F0MzJUYWddID0gdHlwZWRBcnJheVRhZ3NbZmxvYXQ2NFRhZ10gPVxudHlwZWRBcnJheVRhZ3NbaW50OFRhZ10gPSB0eXBlZEFycmF5VGFnc1tpbnQxNlRhZ10gPVxudHlwZWRBcnJheVRhZ3NbaW50MzJUYWddID0gdHlwZWRBcnJheVRhZ3NbdWludDhUYWddID1cbnR5cGVkQXJyYXlUYWdzW3VpbnQ4Q2xhbXBlZFRhZ10gPSB0eXBlZEFycmF5VGFnc1t1aW50MTZUYWddID1cbnR5cGVkQXJyYXlUYWdzW3VpbnQzMlRhZ10gPSB0cnVlO1xudHlwZWRBcnJheVRhZ3NbYXJnc1RhZ10gPSB0eXBlZEFycmF5VGFnc1thcnJheVRhZ10gPVxudHlwZWRBcnJheVRhZ3NbYXJyYXlCdWZmZXJUYWddID0gdHlwZWRBcnJheVRhZ3NbYm9vbFRhZ10gPVxudHlwZWRBcnJheVRhZ3NbZGF0ZVRhZ10gPSB0eXBlZEFycmF5VGFnc1tlcnJvclRhZ10gPVxudHlwZWRBcnJheVRhZ3NbZnVuY1RhZ10gPSB0eXBlZEFycmF5VGFnc1ttYXBUYWddID1cbnR5cGVkQXJyYXlUYWdzW251bWJlclRhZ10gPSB0eXBlZEFycmF5VGFnc1tvYmplY3RUYWddID1cbnR5cGVkQXJyYXlUYWdzW3JlZ2V4cFRhZ10gPSB0eXBlZEFycmF5VGFnc1tzZXRUYWddID1cbnR5cGVkQXJyYXlUYWdzW3N0cmluZ1RhZ10gPSB0eXBlZEFycmF5VGFnc1t3ZWFrTWFwVGFnXSA9IGZhbHNlO1xuXG4vKiogVXNlZCBmb3IgbmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgdGhlIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICogb2YgdmFsdWVzLlxuICovXG52YXIgb2JqVG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGEgdHlwZWQgYXJyYXkuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGNvcnJlY3RseSBjbGFzc2lmaWVkLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNUeXBlZEFycmF5KG5ldyBVaW50OEFycmF5KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzVHlwZWRBcnJheShbXSk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc1R5cGVkQXJyYXkodmFsdWUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0TGlrZSh2YWx1ZSkgJiYgaXNMZW5ndGgodmFsdWUubGVuZ3RoKSAmJiAhIXR5cGVkQXJyYXlUYWdzW29ialRvU3RyaW5nLmNhbGwodmFsdWUpXTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc1R5cGVkQXJyYXk7XG4iLCJ2YXIgZ2V0TmF0aXZlID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvZ2V0TmF0aXZlJyksXG4gICAgaXNBcnJheUxpa2UgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9pc0FycmF5TGlrZScpLFxuICAgIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi4vbGFuZy9pc09iamVjdCcpLFxuICAgIHNoaW1LZXlzID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvc2hpbUtleXMnKTtcblxuLyogTmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzIGZvciB0aG9zZSB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgb3RoZXIgYGxvZGFzaGAgbWV0aG9kcy4gKi9cbnZhciBuYXRpdmVLZXlzID0gZ2V0TmF0aXZlKE9iamVjdCwgJ2tleXMnKTtcblxuLyoqXG4gKiBDcmVhdGVzIGFuIGFycmF5IG9mIHRoZSBvd24gZW51bWVyYWJsZSBwcm9wZXJ0eSBuYW1lcyBvZiBgb2JqZWN0YC5cbiAqXG4gKiAqKk5vdGU6KiogTm9uLW9iamVjdCB2YWx1ZXMgYXJlIGNvZXJjZWQgdG8gb2JqZWN0cy4gU2VlIHRoZVxuICogW0VTIHNwZWNdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW9iamVjdC5rZXlzKVxuICogZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IE9iamVjdFxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBhcnJheSBvZiBwcm9wZXJ0eSBuYW1lcy5cbiAqIEBleGFtcGxlXG4gKlxuICogZnVuY3Rpb24gRm9vKCkge1xuICogICB0aGlzLmEgPSAxO1xuICogICB0aGlzLmIgPSAyO1xuICogfVxuICpcbiAqIEZvby5wcm90b3R5cGUuYyA9IDM7XG4gKlxuICogXy5rZXlzKG5ldyBGb28pO1xuICogLy8gPT4gWydhJywgJ2InXSAoaXRlcmF0aW9uIG9yZGVyIGlzIG5vdCBndWFyYW50ZWVkKVxuICpcbiAqIF8ua2V5cygnaGknKTtcbiAqIC8vID0+IFsnMCcsICcxJ11cbiAqL1xudmFyIGtleXMgPSAhbmF0aXZlS2V5cyA/IHNoaW1LZXlzIDogZnVuY3Rpb24ob2JqZWN0KSB7XG4gIHZhciBDdG9yID0gb2JqZWN0ID09IG51bGwgPyB1bmRlZmluZWQgOiBvYmplY3QuY29uc3RydWN0b3I7XG4gIGlmICgodHlwZW9mIEN0b3IgPT0gJ2Z1bmN0aW9uJyAmJiBDdG9yLnByb3RvdHlwZSA9PT0gb2JqZWN0KSB8fFxuICAgICAgKHR5cGVvZiBvYmplY3QgIT0gJ2Z1bmN0aW9uJyAmJiBpc0FycmF5TGlrZShvYmplY3QpKSkge1xuICAgIHJldHVybiBzaGltS2V5cyhvYmplY3QpO1xuICB9XG4gIHJldHVybiBpc09iamVjdChvYmplY3QpID8gbmF0aXZlS2V5cyhvYmplY3QpIDogW107XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGtleXM7XG4iLCJ2YXIgaXNBcmd1bWVudHMgPSByZXF1aXJlKCcuLi9sYW5nL2lzQXJndW1lbnRzJyksXG4gICAgaXNBcnJheSA9IHJlcXVpcmUoJy4uL2xhbmcvaXNBcnJheScpLFxuICAgIGlzSW5kZXggPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9pc0luZGV4JyksXG4gICAgaXNMZW5ndGggPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9pc0xlbmd0aCcpLFxuICAgIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi4vbGFuZy9pc09iamVjdCcpO1xuXG4vKiogVXNlZCBmb3IgbmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBDcmVhdGVzIGFuIGFycmF5IG9mIHRoZSBvd24gYW5kIGluaGVyaXRlZCBlbnVtZXJhYmxlIHByb3BlcnR5IG5hbWVzIG9mIGBvYmplY3RgLlxuICpcbiAqICoqTm90ZToqKiBOb24tb2JqZWN0IHZhbHVlcyBhcmUgY29lcmNlZCB0byBvYmplY3RzLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgT2JqZWN0XG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gcXVlcnkuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIGFycmF5IG9mIHByb3BlcnR5IG5hbWVzLlxuICogQGV4YW1wbGVcbiAqXG4gKiBmdW5jdGlvbiBGb28oKSB7XG4gKiAgIHRoaXMuYSA9IDE7XG4gKiAgIHRoaXMuYiA9IDI7XG4gKiB9XG4gKlxuICogRm9vLnByb3RvdHlwZS5jID0gMztcbiAqXG4gKiBfLmtleXNJbihuZXcgRm9vKTtcbiAqIC8vID0+IFsnYScsICdiJywgJ2MnXSAoaXRlcmF0aW9uIG9yZGVyIGlzIG5vdCBndWFyYW50ZWVkKVxuICovXG5mdW5jdGlvbiBrZXlzSW4ob2JqZWN0KSB7XG4gIGlmIChvYmplY3QgPT0gbnVsbCkge1xuICAgIHJldHVybiBbXTtcbiAgfVxuICBpZiAoIWlzT2JqZWN0KG9iamVjdCkpIHtcbiAgICBvYmplY3QgPSBPYmplY3Qob2JqZWN0KTtcbiAgfVxuICB2YXIgbGVuZ3RoID0gb2JqZWN0Lmxlbmd0aDtcbiAgbGVuZ3RoID0gKGxlbmd0aCAmJiBpc0xlbmd0aChsZW5ndGgpICYmXG4gICAgKGlzQXJyYXkob2JqZWN0KSB8fCBpc0FyZ3VtZW50cyhvYmplY3QpKSAmJiBsZW5ndGgpIHx8IDA7XG5cbiAgdmFyIEN0b3IgPSBvYmplY3QuY29uc3RydWN0b3IsXG4gICAgICBpbmRleCA9IC0xLFxuICAgICAgaXNQcm90byA9IHR5cGVvZiBDdG9yID09ICdmdW5jdGlvbicgJiYgQ3Rvci5wcm90b3R5cGUgPT09IG9iamVjdCxcbiAgICAgIHJlc3VsdCA9IEFycmF5KGxlbmd0aCksXG4gICAgICBza2lwSW5kZXhlcyA9IGxlbmd0aCA+IDA7XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICByZXN1bHRbaW5kZXhdID0gKGluZGV4ICsgJycpO1xuICB9XG4gIGZvciAodmFyIGtleSBpbiBvYmplY3QpIHtcbiAgICBpZiAoIShza2lwSW5kZXhlcyAmJiBpc0luZGV4KGtleSwgbGVuZ3RoKSkgJiZcbiAgICAgICAgIShrZXkgPT0gJ2NvbnN0cnVjdG9yJyAmJiAoaXNQcm90byB8fCAhaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIGtleSkpKSkge1xuICAgICAgcmVzdWx0LnB1c2goa2V5KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBrZXlzSW47XG4iLCJ2YXIgY3JlYXRlT2JqZWN0TWFwcGVyID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvY3JlYXRlT2JqZWN0TWFwcGVyJyk7XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBvYmplY3Qgd2l0aCB0aGUgc2FtZSBrZXlzIGFzIGBvYmplY3RgIGFuZCB2YWx1ZXMgZ2VuZXJhdGVkIGJ5XG4gKiBydW5uaW5nIGVhY2ggb3duIGVudW1lcmFibGUgcHJvcGVydHkgb2YgYG9iamVjdGAgdGhyb3VnaCBgaXRlcmF0ZWVgLiBUaGVcbiAqIGl0ZXJhdGVlIGZ1bmN0aW9uIGlzIGJvdW5kIHRvIGB0aGlzQXJnYCBhbmQgaW52b2tlZCB3aXRoIHRocmVlIGFyZ3VtZW50czpcbiAqICh2YWx1ZSwga2V5LCBvYmplY3QpLlxuICpcbiAqIElmIGEgcHJvcGVydHkgbmFtZSBpcyBwcm92aWRlZCBmb3IgYGl0ZXJhdGVlYCB0aGUgY3JlYXRlZCBgXy5wcm9wZXJ0eWBcbiAqIHN0eWxlIGNhbGxiYWNrIHJldHVybnMgdGhlIHByb3BlcnR5IHZhbHVlIG9mIHRoZSBnaXZlbiBlbGVtZW50LlxuICpcbiAqIElmIGEgdmFsdWUgaXMgYWxzbyBwcm92aWRlZCBmb3IgYHRoaXNBcmdgIHRoZSBjcmVhdGVkIGBfLm1hdGNoZXNQcm9wZXJ0eWBcbiAqIHN0eWxlIGNhbGxiYWNrIHJldHVybnMgYHRydWVgIGZvciBlbGVtZW50cyB0aGF0IGhhdmUgYSBtYXRjaGluZyBwcm9wZXJ0eVxuICogdmFsdWUsIGVsc2UgYGZhbHNlYC5cbiAqXG4gKiBJZiBhbiBvYmplY3QgaXMgcHJvdmlkZWQgZm9yIGBpdGVyYXRlZWAgdGhlIGNyZWF0ZWQgYF8ubWF0Y2hlc2Agc3R5bGVcbiAqIGNhbGxiYWNrIHJldHVybnMgYHRydWVgIGZvciBlbGVtZW50cyB0aGF0IGhhdmUgdGhlIHByb3BlcnRpZXMgb2YgdGhlIGdpdmVuXG4gKiBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IE9iamVjdFxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb258T2JqZWN0fHN0cmluZ30gW2l0ZXJhdGVlPV8uaWRlbnRpdHldIFRoZSBmdW5jdGlvbiBpbnZva2VkXG4gKiAgcGVyIGl0ZXJhdGlvbi5cbiAqIEBwYXJhbSB7Kn0gW3RoaXNBcmddIFRoZSBgdGhpc2AgYmluZGluZyBvZiBgaXRlcmF0ZWVgLlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyB0aGUgbmV3IG1hcHBlZCBvYmplY3QuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8ubWFwVmFsdWVzKHsgJ2EnOiAxLCAnYic6IDIgfSwgZnVuY3Rpb24obikge1xuICogICByZXR1cm4gbiAqIDM7XG4gKiB9KTtcbiAqIC8vID0+IHsgJ2EnOiAzLCAnYic6IDYgfVxuICpcbiAqIHZhciB1c2VycyA9IHtcbiAqICAgJ2ZyZWQnOiAgICB7ICd1c2VyJzogJ2ZyZWQnLCAgICAnYWdlJzogNDAgfSxcbiAqICAgJ3BlYmJsZXMnOiB7ICd1c2VyJzogJ3BlYmJsZXMnLCAnYWdlJzogMSB9XG4gKiB9O1xuICpcbiAqIC8vIHVzaW5nIHRoZSBgXy5wcm9wZXJ0eWAgY2FsbGJhY2sgc2hvcnRoYW5kXG4gKiBfLm1hcFZhbHVlcyh1c2VycywgJ2FnZScpO1xuICogLy8gPT4geyAnZnJlZCc6IDQwLCAncGViYmxlcyc6IDEgfSAoaXRlcmF0aW9uIG9yZGVyIGlzIG5vdCBndWFyYW50ZWVkKVxuICovXG52YXIgbWFwVmFsdWVzID0gY3JlYXRlT2JqZWN0TWFwcGVyKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gbWFwVmFsdWVzO1xuIiwidmFyIGFycmF5TWFwID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvYXJyYXlNYXAnKSxcbiAgICBiYXNlRGlmZmVyZW5jZSA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2Jhc2VEaWZmZXJlbmNlJyksXG4gICAgYmFzZUZsYXR0ZW4gPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9iYXNlRmxhdHRlbicpLFxuICAgIGJpbmRDYWxsYmFjayA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2JpbmRDYWxsYmFjaycpLFxuICAgIGtleXNJbiA9IHJlcXVpcmUoJy4va2V5c0luJyksXG4gICAgcGlja0J5QXJyYXkgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9waWNrQnlBcnJheScpLFxuICAgIHBpY2tCeUNhbGxiYWNrID0gcmVxdWlyZSgnLi4vaW50ZXJuYWwvcGlja0J5Q2FsbGJhY2snKSxcbiAgICByZXN0UGFyYW0gPSByZXF1aXJlKCcuLi9mdW5jdGlvbi9yZXN0UGFyYW0nKTtcblxuLyoqXG4gKiBUaGUgb3Bwb3NpdGUgb2YgYF8ucGlja2A7IHRoaXMgbWV0aG9kIGNyZWF0ZXMgYW4gb2JqZWN0IGNvbXBvc2VkIG9mIHRoZVxuICogb3duIGFuZCBpbmhlcml0ZWQgZW51bWVyYWJsZSBwcm9wZXJ0aWVzIG9mIGBvYmplY3RgIHRoYXQgYXJlIG5vdCBvbWl0dGVkLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAY2F0ZWdvcnkgT2JqZWN0XG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBzb3VyY2Ugb2JqZWN0LlxuICogQHBhcmFtIHtGdW5jdGlvbnwuLi4oc3RyaW5nfHN0cmluZ1tdKX0gW3ByZWRpY2F0ZV0gVGhlIGZ1bmN0aW9uIGludm9rZWQgcGVyXG4gKiAgaXRlcmF0aW9uIG9yIHByb3BlcnR5IG5hbWVzIHRvIG9taXQsIHNwZWNpZmllZCBhcyBpbmRpdmlkdWFsIHByb3BlcnR5XG4gKiAgbmFtZXMgb3IgYXJyYXlzIG9mIHByb3BlcnR5IG5hbWVzLlxuICogQHBhcmFtIHsqfSBbdGhpc0FyZ10gVGhlIGB0aGlzYCBiaW5kaW5nIG9mIGBwcmVkaWNhdGVgLlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyB0aGUgbmV3IG9iamVjdC5cbiAqIEBleGFtcGxlXG4gKlxuICogdmFyIG9iamVjdCA9IHsgJ3VzZXInOiAnZnJlZCcsICdhZ2UnOiA0MCB9O1xuICpcbiAqIF8ub21pdChvYmplY3QsICdhZ2UnKTtcbiAqIC8vID0+IHsgJ3VzZXInOiAnZnJlZCcgfVxuICpcbiAqIF8ub21pdChvYmplY3QsIF8uaXNOdW1iZXIpO1xuICogLy8gPT4geyAndXNlcic6ICdmcmVkJyB9XG4gKi9cbnZhciBvbWl0ID0gcmVzdFBhcmFtKGZ1bmN0aW9uKG9iamVjdCwgcHJvcHMpIHtcbiAgaWYgKG9iamVjdCA9PSBudWxsKSB7XG4gICAgcmV0dXJuIHt9O1xuICB9XG4gIGlmICh0eXBlb2YgcHJvcHNbMF0gIT0gJ2Z1bmN0aW9uJykge1xuICAgIHZhciBwcm9wcyA9IGFycmF5TWFwKGJhc2VGbGF0dGVuKHByb3BzKSwgU3RyaW5nKTtcbiAgICByZXR1cm4gcGlja0J5QXJyYXkob2JqZWN0LCBiYXNlRGlmZmVyZW5jZShrZXlzSW4ob2JqZWN0KSwgcHJvcHMpKTtcbiAgfVxuICB2YXIgcHJlZGljYXRlID0gYmluZENhbGxiYWNrKHByb3BzWzBdLCBwcm9wc1sxXSwgMyk7XG4gIHJldHVybiBwaWNrQnlDYWxsYmFjayhvYmplY3QsIGZ1bmN0aW9uKHZhbHVlLCBrZXksIG9iamVjdCkge1xuICAgIHJldHVybiAhcHJlZGljYXRlKHZhbHVlLCBrZXksIG9iamVjdCk7XG4gIH0pO1xufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gb21pdDtcbiIsInZhciBrZXlzID0gcmVxdWlyZSgnLi9rZXlzJyksXG4gICAgdG9PYmplY3QgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC90b09iamVjdCcpO1xuXG4vKipcbiAqIENyZWF0ZXMgYSB0d28gZGltZW5zaW9uYWwgYXJyYXkgb2YgdGhlIGtleS12YWx1ZSBwYWlycyBmb3IgYG9iamVjdGAsXG4gKiBlLmcuIGBbW2tleTEsIHZhbHVlMV0sIFtrZXkyLCB2YWx1ZTJdXWAuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBPYmplY3RcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgbmV3IGFycmF5IG9mIGtleS12YWx1ZSBwYWlycy5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5wYWlycyh7ICdiYXJuZXknOiAzNiwgJ2ZyZWQnOiA0MCB9KTtcbiAqIC8vID0+IFtbJ2Jhcm5leScsIDM2XSwgWydmcmVkJywgNDBdXSAoaXRlcmF0aW9uIG9yZGVyIGlzIG5vdCBndWFyYW50ZWVkKVxuICovXG5mdW5jdGlvbiBwYWlycyhvYmplY3QpIHtcbiAgb2JqZWN0ID0gdG9PYmplY3Qob2JqZWN0KTtcblxuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIHByb3BzID0ga2V5cyhvYmplY3QpLFxuICAgICAgbGVuZ3RoID0gcHJvcHMubGVuZ3RoLFxuICAgICAgcmVzdWx0ID0gQXJyYXkobGVuZ3RoKTtcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIHZhciBrZXkgPSBwcm9wc1tpbmRleF07XG4gICAgcmVzdWx0W2luZGV4XSA9IFtrZXksIG9iamVjdFtrZXldXTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHBhaXJzO1xuIiwiLyoqXG4gKiBUaGlzIG1ldGhvZCByZXR1cm5zIHRoZSBmaXJzdCBhcmd1bWVudCBwcm92aWRlZCB0byBpdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IFV0aWxpdHlcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgQW55IHZhbHVlLlxuICogQHJldHVybnMgeyp9IFJldHVybnMgYHZhbHVlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogdmFyIG9iamVjdCA9IHsgJ3VzZXInOiAnZnJlZCcgfTtcbiAqXG4gKiBfLmlkZW50aXR5KG9iamVjdCkgPT09IG9iamVjdDtcbiAqIC8vID0+IHRydWVcbiAqL1xuZnVuY3Rpb24gaWRlbnRpdHkodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlkZW50aXR5O1xuIiwidmFyIGJhc2VQcm9wZXJ0eSA9IHJlcXVpcmUoJy4uL2ludGVybmFsL2Jhc2VQcm9wZXJ0eScpLFxuICAgIGJhc2VQcm9wZXJ0eURlZXAgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9iYXNlUHJvcGVydHlEZWVwJyksXG4gICAgaXNLZXkgPSByZXF1aXJlKCcuLi9pbnRlcm5hbC9pc0tleScpO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgdGhlIHByb3BlcnR5IHZhbHVlIGF0IGBwYXRoYCBvbiBhXG4gKiBnaXZlbiBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBVdGlsaXR5XG4gKiBAcGFyYW0ge0FycmF5fHN0cmluZ30gcGF0aCBUaGUgcGF0aCBvZiB0aGUgcHJvcGVydHkgdG8gZ2V0LlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZnVuY3Rpb24uXG4gKiBAZXhhbXBsZVxuICpcbiAqIHZhciBvYmplY3RzID0gW1xuICogICB7ICdhJzogeyAnYic6IHsgJ2MnOiAyIH0gfSB9LFxuICogICB7ICdhJzogeyAnYic6IHsgJ2MnOiAxIH0gfSB9XG4gKiBdO1xuICpcbiAqIF8ubWFwKG9iamVjdHMsIF8ucHJvcGVydHkoJ2EuYi5jJykpO1xuICogLy8gPT4gWzIsIDFdXG4gKlxuICogXy5wbHVjayhfLnNvcnRCeShvYmplY3RzLCBfLnByb3BlcnR5KFsnYScsICdiJywgJ2MnXSkpLCAnYS5iLmMnKTtcbiAqIC8vID0+IFsxLCAyXVxuICovXG5mdW5jdGlvbiBwcm9wZXJ0eShwYXRoKSB7XG4gIHJldHVybiBpc0tleShwYXRoKSA/IGJhc2VQcm9wZXJ0eShwYXRoKSA6IGJhc2VQcm9wZXJ0eURlZXAocGF0aCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcHJvcGVydHk7XG4iLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIF9mcmVlemUgPSByZXF1aXJlKCcuL2ZyZWV6ZScpO1xuXG4vKipcbiAqIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IGFsd2F5cyByZXR1cm5zIHRoZSBzdXBwbGllZCB2YWx1ZS5cbiAqXG4gKiBVc2VmdWwgZm9yIHJlcGxhY2luZyBhbiBvYmplY3Qgb3V0cmlnaHQgcmF0aGVyIHRoYW4gbWVyZ2luZyBpdC5cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBzaWcgYSAtPiAoKiAtPiBhKVxuICogQG1lbWJlck9mIHVcbiAqIEBwYXJhbSAgeyp9IHZhbHVlIHdoYXQgdG8gcmV0dXJuIGZyb20gcmV0dXJuZWQgZnVuY3Rpb24uXG4gKiBAcmV0dXJuIHtmdW5jdGlvbn0gYSBuZXcgZnVuY3Rpb24gdGhhdCB3aWxsIGFsd2F5cyByZXR1cm4gdmFsdWUuXG4gKlxuICogQGV4YW1wbGVcbiAqIHZhciBhbHdheXNGb3VyID0gdS5jb25zdGFudCg0KTtcbiAqIGV4cGVjdChhbHdheXNGb3VyKDMyKSkudG9FcXVhbCg0KTtcbiAqXG4gKiBAZXhhbXBsZVxuICogdmFyIHVzZXIgPSB7XG4gKiAgIG5hbWU6ICdNaXRjaCcsXG4gKiAgIGZhdm9yaXRlczoge1xuICogICAgIGJhbmQ6ICdOaXJ2YW5hJyxcbiAqICAgICBtb3ZpZTogJ1RoZSBNYXRyaXgnXG4gKiAgIH1cbiAqIH07XG4gKlxuICogdmFyIG5ld0Zhdm9yaXRlcyA9IHtcbiAqICAgYmFuZDogJ0NvbGRwbGF5J1xuICogfTtcbiAqXG4gKiB2YXIgcmVzdWx0ID0gdSh7IGZhdm9yaXRlczogdS5jb25zdGFudChuZXdGYXZvcml0ZXMpIH0sIHVzZXIpO1xuICpcbiAqIGV4cGVjdChyZXN1bHQpLnRvRXF1YWwoeyBuYW1lOiAnTWl0Y2gnLCBmYXZvcml0ZXM6IHsgYmFuZDogJ0NvbGRwbGF5JyB9IH0pO1xuICovXG5cbnZhciBfZnJlZXplMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2ZyZWV6ZSk7XG5cbmZ1bmN0aW9uIGNvbnN0YW50KHZhbHVlKSB7XG4gIHZhciBmcm96ZW4gPSBfZnJlZXplMlsnZGVmYXVsdCddKHZhbHVlKTtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZnJvemVuO1xuICB9O1xufVxuXG5leHBvcnRzWydkZWZhdWx0J10gPSBjb25zdGFudDtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmZ1bmN0aW9uIGlzRnJlZXphYmxlKG9iamVjdCkge1xuICBpZiAob2JqZWN0ID09PSBudWxsKSByZXR1cm4gZmFsc2U7XG5cbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkob2JqZWN0KSB8fCB0eXBlb2Ygb2JqZWN0ID09PSAnb2JqZWN0Jztcbn1cblxuZnVuY3Rpb24gbmVlZHNGcmVlemluZyhvYmplY3QpIHtcbiAgcmV0dXJuIGlzRnJlZXphYmxlKG9iamVjdCkgJiYgIU9iamVjdC5pc0Zyb3plbihvYmplY3QpO1xufVxuXG5mdW5jdGlvbiByZWN1cihvYmplY3QpIHtcbiAgT2JqZWN0LmZyZWV6ZShvYmplY3QpO1xuXG4gIE9iamVjdC5rZXlzKG9iamVjdCkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgdmFyIHZhbHVlID0gb2JqZWN0W2tleV07XG4gICAgaWYgKG5lZWRzRnJlZXppbmcodmFsdWUpKSB7XG4gICAgICByZWN1cih2YWx1ZSk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gb2JqZWN0O1xufVxuXG4vKipcbiAqIERlZXBseSBmcmVlemUgYSBwbGFpbiBqYXZhc2NyaXB0IG9iamVjdC5cbiAqXG4gKiBJZiBgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdwcm9kdWN0aW9uJ2AsIHRoaXMgcmV0dXJucyB0aGUgb3JpZ2luYWwgb2JqZWN0XG4gKiB3aXRvdXQgZnJlZXppbmcuXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAc2lnIGEgLT4gYVxuICogQHBhcmFtICB7b2JqZWN0fSBvYmplY3QgT2JqZWN0IHRvIGZyZWV6ZS5cbiAqIEByZXR1cm4ge29iamVjdH0gRnJvemVuIG9iamVjdCwgdW5sZXNzIGluIHByb2R1Y3Rpb24sIHRoZW4gdGhlIHNhbWUgb2JqZWN0LlxuICovXG5mdW5jdGlvbiBmcmVlemUob2JqZWN0KSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfVxuXG4gIGlmIChuZWVkc0ZyZWV6aW5nKG9iamVjdCkpIHtcbiAgICByZWN1cihvYmplY3QpO1xuICB9XG5cbiAgcmV0dXJuIG9iamVjdDtcbn1cblxuZXhwb3J0c1snZGVmYXVsdCddID0gZnJlZXplO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfaWZFbHNlID0gcmVxdWlyZSgnLi9pZkVsc2UnKTtcblxudmFyIF9pZkVsc2UyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfaWZFbHNlKTtcblxudmFyIF91dGlsQ3VycnkgPSByZXF1aXJlKCcuL3V0aWwvY3VycnknKTtcblxudmFyIF91dGlsQ3VycnkyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdXRpbEN1cnJ5KTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gX3V0aWxDdXJyeTJbJ2RlZmF1bHQnXShmdW5jdGlvbiAocHJlZGljYXRlLCB0cnVlVXBkYXRlcywgb2JqZWN0KSB7XG4gIHJldHVybiBfaWZFbHNlMlsnZGVmYXVsdCddKHByZWRpY2F0ZSwgdHJ1ZVVwZGF0ZXMsIGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIHg7XG4gIH0sIG9iamVjdCk7XG59KTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX3VwZGF0ZSA9IHJlcXVpcmUoJy4vdXBkYXRlJyk7XG5cbnZhciBfdXBkYXRlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3VwZGF0ZSk7XG5cbnZhciBfd3JhcCA9IHJlcXVpcmUoJy4vd3JhcCcpO1xuXG52YXIgX3dyYXAyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfd3JhcCk7XG5cbmZ1bmN0aW9uIHVwZGF0ZUlmRWxzZShwcmVkaWNhdGUsIHRydWVVcGRhdGVzLCBmYWxzZVVwZGF0ZXMsIG9iamVjdCkge1xuICB2YXIgdGVzdCA9IHR5cGVvZiBwcmVkaWNhdGUgPT09ICdmdW5jdGlvbicgPyBwcmVkaWNhdGUob2JqZWN0KSA6IHByZWRpY2F0ZTtcblxuICB2YXIgdXBkYXRlcyA9IHRlc3QgPyB0cnVlVXBkYXRlcyA6IGZhbHNlVXBkYXRlcztcblxuICByZXR1cm4gX3VwZGF0ZTJbJ2RlZmF1bHQnXSh1cGRhdGVzLCBvYmplY3QpO1xufVxuXG5leHBvcnRzWydkZWZhdWx0J10gPSBfd3JhcDJbJ2RlZmF1bHQnXSh1cGRhdGVJZkVsc2UpO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfY29uc3RhbnQgPSByZXF1aXJlKCcuL2NvbnN0YW50Jyk7XG5cbnZhciBfY29uc3RhbnQyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfY29uc3RhbnQpO1xuXG52YXIgX2ZyZWV6ZSA9IHJlcXVpcmUoJy4vZnJlZXplJyk7XG5cbnZhciBfZnJlZXplMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2ZyZWV6ZSk7XG5cbnZhciBfaXMgPSByZXF1aXJlKCcuL2lzJyk7XG5cbnZhciBfaXMyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfaXMpO1xuXG52YXIgX2lmMiA9IHJlcXVpcmUoJy4vaWYnKTtcblxudmFyIF9pZjMgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9pZjIpO1xuXG52YXIgX2lmRWxzZSA9IHJlcXVpcmUoJy4vaWZFbHNlJyk7XG5cbnZhciBfaWZFbHNlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2lmRWxzZSk7XG5cbnZhciBfbWFwID0gcmVxdWlyZSgnLi9tYXAnKTtcblxudmFyIF9tYXAyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfbWFwKTtcblxudmFyIF9vbWl0ID0gcmVxdWlyZSgnLi9vbWl0Jyk7XG5cbnZhciBfb21pdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9vbWl0KTtcblxudmFyIF9yZWplY3QgPSByZXF1aXJlKCcuL3JlamVjdCcpO1xuXG52YXIgX3JlamVjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9yZWplY3QpO1xuXG52YXIgX3VwZGF0ZSA9IHJlcXVpcmUoJy4vdXBkYXRlJyk7XG5cbnZhciBfdXBkYXRlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3VwZGF0ZSk7XG5cbnZhciBfdXBkYXRlSW4gPSByZXF1aXJlKCcuL3VwZGF0ZUluJyk7XG5cbnZhciBfdXBkYXRlSW4yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdXBkYXRlSW4pO1xuXG52YXIgX3dpdGhEZWZhdWx0ID0gcmVxdWlyZSgnLi93aXRoRGVmYXVsdCcpO1xuXG52YXIgX3dpdGhEZWZhdWx0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3dpdGhEZWZhdWx0KTtcblxudmFyIF91dGlsQ3VycnkgPSByZXF1aXJlKCcuL3V0aWwvY3VycnknKTtcblxudmFyIHUgPSBfdXBkYXRlMlsnZGVmYXVsdCddO1xuXG51Ll8gPSBfdXRpbEN1cnJ5Ll87XG51LmNvbnN0YW50ID0gX2NvbnN0YW50MlsnZGVmYXVsdCddO1xudVsnaWYnXSA9IF9pZjNbJ2RlZmF1bHQnXTtcbnUuaWZFbHNlID0gX2lmRWxzZTJbJ2RlZmF1bHQnXTtcbnUuaXMgPSBfaXMyWydkZWZhdWx0J107XG51LmZyZWV6ZSA9IF9mcmVlemUyWydkZWZhdWx0J107XG51Lm1hcCA9IF9tYXAyWydkZWZhdWx0J107XG51Lm9taXQgPSBfb21pdDJbJ2RlZmF1bHQnXTtcbnUucmVqZWN0ID0gX3JlamVjdDJbJ2RlZmF1bHQnXTtcbnUudXBkYXRlID0gX3VwZGF0ZTJbJ2RlZmF1bHQnXTtcbnUudXBkYXRlSW4gPSBfdXBkYXRlSW4yWydkZWZhdWx0J107XG51LndpdGhEZWZhdWx0ID0gX3dpdGhEZWZhdWx0MlsnZGVmYXVsdCddO1xuXG5leHBvcnRzWydkZWZhdWx0J10gPSB1O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfdXRpbFNwbGl0UGF0aCA9IHJlcXVpcmUoJy4vdXRpbC9zcGxpdFBhdGgnKTtcblxudmFyIF91dGlsU3BsaXRQYXRoMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3V0aWxTcGxpdFBhdGgpO1xuXG52YXIgX3V0aWxDdXJyeSA9IHJlcXVpcmUoJy4vdXRpbC9jdXJyeScpO1xuXG52YXIgX3V0aWxDdXJyeTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF91dGlsQ3VycnkpO1xuXG5mdW5jdGlvbiBpcyhwYXRoLCBwcmVkaWNhdGUsIG9iamVjdCkge1xuICB2YXIgcGFydHMgPSBfdXRpbFNwbGl0UGF0aDJbJ2RlZmF1bHQnXShwYXRoKTtcblxuICB2YXIgcmVzdCA9IG9iamVjdDtcbiAgdmFyIHBhcnQgPSB1bmRlZmluZWQ7XG4gIGZvciAodmFyIF9pdGVyYXRvciA9IHBhcnRzLCBfaXNBcnJheSA9IEFycmF5LmlzQXJyYXkoX2l0ZXJhdG9yKSwgX2kgPSAwLCBfaXRlcmF0b3IgPSBfaXNBcnJheSA/IF9pdGVyYXRvciA6IF9pdGVyYXRvcltTeW1ib2wuaXRlcmF0b3JdKCk7Oykge1xuICAgIGlmIChfaXNBcnJheSkge1xuICAgICAgaWYgKF9pID49IF9pdGVyYXRvci5sZW5ndGgpIGJyZWFrO1xuICAgICAgcGFydCA9IF9pdGVyYXRvcltfaSsrXTtcbiAgICB9IGVsc2Uge1xuICAgICAgX2kgPSBfaXRlcmF0b3IubmV4dCgpO1xuICAgICAgaWYgKF9pLmRvbmUpIGJyZWFrO1xuICAgICAgcGFydCA9IF9pLnZhbHVlO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgcmVzdCA9PT0gJ3VuZGVmaW5lZCcpIHJldHVybiBmYWxzZTtcbiAgICByZXN0ID0gcmVzdFtwYXJ0XTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgcHJlZGljYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIHByZWRpY2F0ZShyZXN0KTtcbiAgfVxuXG4gIHJldHVybiBwcmVkaWNhdGUgPT09IHJlc3Q7XG59XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IF91dGlsQ3VycnkyWydkZWZhdWx0J10oaXMpO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfdXBkYXRlID0gcmVxdWlyZSgnLi91cGRhdGUnKTtcblxudmFyIF91cGRhdGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdXBkYXRlKTtcblxudmFyIF93cmFwID0gcmVxdWlyZSgnLi93cmFwJyk7XG5cbnZhciBfd3JhcDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF93cmFwKTtcblxudmFyIF9sb2Rhc2hDb2xsZWN0aW9uRm9yRWFjaCA9IHJlcXVpcmUoJ2xvZGFzaC9jb2xsZWN0aW9uL2ZvckVhY2gnKTtcblxudmFyIF9sb2Rhc2hDb2xsZWN0aW9uRm9yRWFjaDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9sb2Rhc2hDb2xsZWN0aW9uRm9yRWFjaCk7XG5cbnZhciBfbG9kYXNoQ29sbGVjdGlvbk1hcCA9IHJlcXVpcmUoJ2xvZGFzaC9jb2xsZWN0aW9uL21hcCcpO1xuXG52YXIgX2xvZGFzaENvbGxlY3Rpb25NYXAyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfbG9kYXNoQ29sbGVjdGlvbk1hcCk7XG5cbnZhciBfbG9kYXNoT2JqZWN0TWFwVmFsdWVzID0gcmVxdWlyZSgnbG9kYXNoL29iamVjdC9tYXBWYWx1ZXMnKTtcblxudmFyIF9sb2Rhc2hPYmplY3RNYXBWYWx1ZXMyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfbG9kYXNoT2JqZWN0TWFwVmFsdWVzKTtcblxuZnVuY3Rpb24gc2hhbGxvd0VxdWFsKG9iamVjdCwgb3RoZXJPYmplY3QpIHtcbiAgdmFyIGVxdWFsID0gdHJ1ZTtcbiAgX2xvZGFzaENvbGxlY3Rpb25Gb3JFYWNoMlsnZGVmYXVsdCddKG90aGVyT2JqZWN0LCBmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgIGlmICh2YWx1ZSAhPT0gb2JqZWN0W2tleV0pIHtcbiAgICAgIGVxdWFsID0gZmFsc2U7XG5cbiAgICAgIC8vIGV4aXQgZWFybHlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBlcXVhbDtcbn1cblxuZnVuY3Rpb24gbWFwKGl0ZXJhdGVlLCBvYmplY3QpIHtcbiAgdmFyIHVwZGF0ZXIgPSB0eXBlb2YgaXRlcmF0ZWUgPT09ICdmdW5jdGlvbicgPyBpdGVyYXRlZSA6IF91cGRhdGUyWydkZWZhdWx0J10oaXRlcmF0ZWUpO1xuXG4gIHZhciBtYXBwZXIgPSBBcnJheS5pc0FycmF5KG9iamVjdCkgPyBfbG9kYXNoQ29sbGVjdGlvbk1hcDJbJ2RlZmF1bHQnXSA6IF9sb2Rhc2hPYmplY3RNYXBWYWx1ZXMyWydkZWZhdWx0J107XG5cbiAgdmFyIG5ld09iamVjdCA9IG1hcHBlcihvYmplY3QsIHVwZGF0ZXIpO1xuICB2YXIgZXF1YWwgPSBzaGFsbG93RXF1YWwob2JqZWN0LCBuZXdPYmplY3QpO1xuXG4gIHJldHVybiBlcXVhbCA/IG9iamVjdCA6IG5ld09iamVjdDtcbn1cblxuZXhwb3J0c1snZGVmYXVsdCddID0gX3dyYXAyWydkZWZhdWx0J10obWFwKTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX2xvZGFzaE9iamVjdE9taXQgPSByZXF1aXJlKCdsb2Rhc2gvb2JqZWN0L29taXQnKTtcblxudmFyIF9sb2Rhc2hPYmplY3RPbWl0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2xvZGFzaE9iamVjdE9taXQpO1xuXG52YXIgX3dyYXAgPSByZXF1aXJlKCcuL3dyYXAnKTtcblxudmFyIF93cmFwMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3dyYXApO1xuXG5mdW5jdGlvbiBvbWl0KHByZWRpY2F0ZSwgY29sbGVjdGlvbikge1xuICByZXR1cm4gX2xvZGFzaE9iamVjdE9taXQyWydkZWZhdWx0J10oY29sbGVjdGlvbiwgcHJlZGljYXRlKTtcbn1cblxuZXhwb3J0c1snZGVmYXVsdCddID0gX3dyYXAyWydkZWZhdWx0J10ob21pdCk7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIF9sb2Rhc2hDb2xsZWN0aW9uUmVqZWN0ID0gcmVxdWlyZSgnbG9kYXNoL2NvbGxlY3Rpb24vcmVqZWN0Jyk7XG5cbnZhciBfbG9kYXNoQ29sbGVjdGlvblJlamVjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9sb2Rhc2hDb2xsZWN0aW9uUmVqZWN0KTtcblxudmFyIF93cmFwID0gcmVxdWlyZSgnLi93cmFwJyk7XG5cbnZhciBfd3JhcDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF93cmFwKTtcblxuZnVuY3Rpb24gcmVqZWN0KHByZWRpY2F0ZSwgY29sbGVjdGlvbikge1xuICByZXR1cm4gX2xvZGFzaENvbGxlY3Rpb25SZWplY3QyWydkZWZhdWx0J10oY29sbGVjdGlvbiwgcHJlZGljYXRlKTtcbn1cblxuZXhwb3J0c1snZGVmYXVsdCddID0gX3dyYXAyWydkZWZhdWx0J10ocmVqZWN0KTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxudmFyIF9leHRlbmRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7IGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7IHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07IGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHsgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTsgfSB9IH0gcmV0dXJuIHRhcmdldDsgfTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX3dyYXAgPSByZXF1aXJlKCcuL3dyYXAnKTtcblxudmFyIF93cmFwMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3dyYXApO1xuXG52YXIgX3V0aWxJc0VtcHR5ID0gcmVxdWlyZSgnLi91dGlsL2lzRW1wdHknKTtcblxudmFyIF91dGlsSXNFbXB0eTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF91dGlsSXNFbXB0eSk7XG5cbnZhciBfdXRpbERlZmF1bHRPYmplY3QgPSByZXF1aXJlKCcuL3V0aWwvZGVmYXVsdE9iamVjdCcpO1xuXG52YXIgX3V0aWxEZWZhdWx0T2JqZWN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3V0aWxEZWZhdWx0T2JqZWN0KTtcblxudmFyIF9sb2Rhc2hMYW5nSXNQbGFpbk9iamVjdCA9IHJlcXVpcmUoJ2xvZGFzaC9sYW5nL2lzUGxhaW5PYmplY3QnKTtcblxudmFyIF9sb2Rhc2hMYW5nSXNQbGFpbk9iamVjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9sb2Rhc2hMYW5nSXNQbGFpbk9iamVjdCk7XG5cbmZ1bmN0aW9uIHJlZHVjZShvYmplY3QsIGNhbGxiYWNrLCBpbml0aWFsVmFsdWUpIHtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKG9iamVjdCkucmVkdWNlKGZ1bmN0aW9uIChhY2MsIGtleSkge1xuICAgIHJldHVybiBjYWxsYmFjayhhY2MsIG9iamVjdFtrZXldLCBrZXkpO1xuICB9LCBpbml0aWFsVmFsdWUpO1xufVxuXG5mdW5jdGlvbiByZXNvbHZlVXBkYXRlcyh1cGRhdGVzLCBvYmplY3QpIHtcbiAgcmV0dXJuIHJlZHVjZSh1cGRhdGVzLCBmdW5jdGlvbiAoYWNjLCB2YWx1ZSwga2V5KSB7XG4gICAgdmFyIHVwZGF0ZWRWYWx1ZSA9IHZhbHVlO1xuXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHZhbHVlKSAmJiB2YWx1ZSAhPT0gbnVsbCAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICB1cGRhdGVkVmFsdWUgPSB1cGRhdGUodmFsdWUsIG9iamVjdFtrZXldKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdXBkYXRlZFZhbHVlID0gdmFsdWUob2JqZWN0W2tleV0pO1xuICAgIH1cblxuICAgIGlmIChvYmplY3Rba2V5XSAhPT0gdXBkYXRlZFZhbHVlKSB7XG4gICAgICBhY2Nba2V5XSA9IHVwZGF0ZWRWYWx1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gYWNjO1xuICB9LCB7fSk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUFycmF5KHVwZGF0ZXMsIG9iamVjdCkge1xuICB2YXIgbmV3QXJyYXkgPSBbXS5jb25jYXQob2JqZWN0KTtcblxuICBPYmplY3Qua2V5cyh1cGRhdGVzKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICBuZXdBcnJheVtrZXldID0gdXBkYXRlc1trZXldO1xuICB9KTtcblxuICByZXR1cm4gbmV3QXJyYXk7XG59XG5cbi8qKlxuICogUmVjdXJzaXZlbHkgdXBkYXRlIGFuIG9iamVjdCBvciBhcnJheS5cbiAqXG4gKiBDYW4gdXBkYXRlIHdpdGggdmFsdWVzOlxuICogdXBkYXRlKHsgZm9vOiAzIH0sIHsgZm9vOiAxLCBiYXI6IDIgfSk7XG4gKiAvLyA9PiB7IGZvbzogMywgYmFyOiAyIH1cbiAqXG4gKiBPciB3aXRoIGEgZnVuY3Rpb246XG4gKiB1cGRhdGUoeyBmb286IHggPT4gKHggKyAxKSB9LCB7IGZvbzogMiB9KTtcbiAqIC8vID0+IHsgZm9vOiAzIH1cbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBuYW1lIHVwZGF0ZVxuICogQHBhcmFtIHtPYmplY3R8RnVuY3Rpb259IHVwZGF0ZXNcbiAqIEBwYXJhbSB7T2JqZWN0fEFycmF5fSAgICBvYmplY3QgdG8gdXBkYXRlXG4gKiBAcmV0dXJuIHtPYmplY3R8QXJyYXl9ICAgbmV3IG9iamVjdCB3aXRoIG1vZGlmaWNhdGlvbnNcbiAqL1xuZnVuY3Rpb24gdXBkYXRlKHVwZGF0ZXMsIG9iamVjdCkge1xuICBpZiAodHlwZW9mIHVwZGF0ZXMgPT09ICdmdW5jdGlvbicpIHtcbiAgICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IEFycmF5KF9sZW4gPiAyID8gX2xlbiAtIDIgOiAwKSwgX2tleSA9IDI7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICAgIGFyZ3NbX2tleSAtIDJdID0gYXJndW1lbnRzW19rZXldO1xuICAgIH1cblxuICAgIHJldHVybiB1cGRhdGVzLmFwcGx5KHVuZGVmaW5lZCwgW29iamVjdF0uY29uY2F0KGFyZ3MpKTtcbiAgfVxuXG4gIGlmICghX2xvZGFzaExhbmdJc1BsYWluT2JqZWN0MlsnZGVmYXVsdCddKHVwZGF0ZXMpKSB7XG4gICAgcmV0dXJuIHVwZGF0ZXM7XG4gIH1cblxuICB2YXIgZGVmYXVsdGVkT2JqZWN0ID0gX3V0aWxEZWZhdWx0T2JqZWN0MlsnZGVmYXVsdCddKG9iamVjdCwgdXBkYXRlcyk7XG5cbiAgdmFyIHJlc29sdmVkVXBkYXRlcyA9IHJlc29sdmVVcGRhdGVzKHVwZGF0ZXMsIGRlZmF1bHRlZE9iamVjdCk7XG5cbiAgaWYgKF91dGlsSXNFbXB0eTJbJ2RlZmF1bHQnXShyZXNvbHZlZFVwZGF0ZXMpKSB7XG4gICAgcmV0dXJuIGRlZmF1bHRlZE9iamVjdDtcbiAgfVxuXG4gIGlmIChBcnJheS5pc0FycmF5KGRlZmF1bHRlZE9iamVjdCkpIHtcbiAgICByZXR1cm4gdXBkYXRlQXJyYXkocmVzb2x2ZWRVcGRhdGVzLCBkZWZhdWx0ZWRPYmplY3QpO1xuICB9XG5cbiAgcmV0dXJuIF9leHRlbmRzKHt9LCBkZWZhdWx0ZWRPYmplY3QsIHJlc29sdmVkVXBkYXRlcyk7XG59XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IF93cmFwMlsnZGVmYXVsdCddKHVwZGF0ZSwgMik7XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIF91dGlsQ3VycnkgPSByZXF1aXJlKCcuL3V0aWwvY3VycnknKTtcblxudmFyIF91dGlsQ3VycnkyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdXRpbEN1cnJ5KTtcblxudmFyIF91cGRhdGUyID0gcmVxdWlyZSgnLi91cGRhdGUnKTtcblxudmFyIF91cGRhdGUzID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdXBkYXRlMik7XG5cbnZhciBfbWFwID0gcmVxdWlyZSgnLi9tYXAnKTtcblxudmFyIF9tYXAyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfbWFwKTtcblxudmFyIF91dGlsU3BsaXRQYXRoID0gcmVxdWlyZSgnLi91dGlsL3NwbGl0UGF0aCcpO1xuXG52YXIgX3V0aWxTcGxpdFBhdGgyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdXRpbFNwbGl0UGF0aCk7XG5cbnZhciB3aWxkY2FyZCA9ICcqJztcblxuZnVuY3Rpb24gcmVkdWNlUGF0aChhY2MsIGtleSkge1xuICB2YXIgX3JlZjtcblxuICBpZiAoa2V5ID09PSB3aWxkY2FyZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHZhciBfdXBkYXRlO1xuXG4gICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlLCB3aWxkY2FyZCkgP1xuICAgICAgLy8gSWYgd2UgYWN0dWFsbHkgaGF2ZSB3aWxkY2FyZCBhcyBhIHByb3BlcnR5LCB1cGRhdGUgdGhhdFxuICAgICAgX3VwZGF0ZTNbJ2RlZmF1bHQnXSgoX3VwZGF0ZSA9IHt9LCBfdXBkYXRlW3dpbGRjYXJkXSA9IGFjYywgX3VwZGF0ZSksIHZhbHVlKSA6XG4gICAgICAvLyBPdGhlcndpc2UgbWFwIG92ZXIgYWxsIHByb3BlcnRpZXNcbiAgICAgIF9tYXAyWydkZWZhdWx0J10oYWNjLCB2YWx1ZSk7XG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiAoX3JlZiA9IHt9LCBfcmVmW2tleV0gPSBhY2MsIF9yZWYpO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVJbihwYXRoLCB2YWx1ZSwgb2JqZWN0KSB7XG4gIHZhciBwYXJ0cyA9IF91dGlsU3BsaXRQYXRoMlsnZGVmYXVsdCddKHBhdGgpO1xuICB2YXIgdXBkYXRlcyA9IHBhcnRzLnJlZHVjZVJpZ2h0KHJlZHVjZVBhdGgsIHZhbHVlKTtcblxuICByZXR1cm4gX3VwZGF0ZTNbJ2RlZmF1bHQnXSh1cGRhdGVzLCBvYmplY3QpO1xufVxuXG5leHBvcnRzWydkZWZhdWx0J10gPSBfdXRpbEN1cnJ5MlsnZGVmYXVsdCddKHVwZGF0ZUluKTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIi8qIGVzbGludCBuby1zaGFkb3c6MCwgbm8tcGFyYW0tcmVhc3NpZ246MCAqL1xuJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZXhwb3J0cy5jdXJyeTEgPSBjdXJyeTE7XG5leHBvcnRzLmN1cnJ5MiA9IGN1cnJ5MjtcbmV4cG9ydHMuY3VycnkzID0gY3VycnkzO1xuZXhwb3J0cy5jdXJyeTQgPSBjdXJyeTQ7XG5leHBvcnRzWydkZWZhdWx0J10gPSBjdXJyeTtcbnZhciBfID0gJ0BAdXBkZWVwL3BsYWNlaG9sZGVyJztcblxuZXhwb3J0cy5fID0gXztcbmZ1bmN0aW9uIGNvdW50QXJndW1lbnRzKGFyZ3MsIG1heCkge1xuICB2YXIgbiA9IGFyZ3MubGVuZ3RoO1xuICBpZiAobiA+IG1heCkgbiA9IG1heDtcblxuICB3aGlsZSAoYXJnc1tuIC0gMV0gPT09IF8pIHtcbiAgICBuLS07XG4gIH1cblxuICByZXR1cm4gbjtcbn1cblxuZnVuY3Rpb24gY3VycnkxKGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiBjdXJyaWVkKGEpIHtcbiAgICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgX3JlZiA9IEFycmF5KF9sZW4gPiAxID8gX2xlbiAtIDEgOiAwKSwgX2tleSA9IDE7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICAgIF9yZWZbX2tleSAtIDFdID0gYXJndW1lbnRzW19rZXldO1xuICAgIH1cblxuICAgIHZhciBiID0gX3JlZlswXSxcbiAgICAgICAgYyA9IF9yZWZbMV07XG5cbiAgICB2YXIgbiA9IGNvdW50QXJndW1lbnRzKGFyZ3VtZW50cyk7XG5cbiAgICBpZiAobiA+PSAxKSByZXR1cm4gZm4oYSwgYiwgYyk7XG4gICAgcmV0dXJuIGN1cnJpZWQ7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGN1cnJ5Mihmbikge1xuICByZXR1cm4gZnVuY3Rpb24gY3VycmllZChhLCBiKSB7XG4gICAgZm9yICh2YXIgX2xlbjIgPSBhcmd1bWVudHMubGVuZ3RoLCBfcmVmMiA9IEFycmF5KF9sZW4yID4gMiA/IF9sZW4yIC0gMiA6IDApLCBfa2V5MiA9IDI7IF9rZXkyIDwgX2xlbjI7IF9rZXkyKyspIHtcbiAgICAgIF9yZWYyW19rZXkyIC0gMl0gPSBhcmd1bWVudHNbX2tleTJdO1xuICAgIH1cblxuICAgIHZhciBjID0gX3JlZjJbMF0sXG4gICAgICAgIGQgPSBfcmVmMlsxXTtcblxuICAgIHZhciBuID0gY291bnRBcmd1bWVudHMoYXJndW1lbnRzLCAyKTtcblxuICAgIGlmIChiID09PSBfIHx8IGMgPT09IF8gfHwgZCA9PT0gXykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW4gb25seSB1c2UgcGxhY2Vob2xkZXIgb24gZmlyc3QgYXJndW1lbnQgb2YgdGhpcyBmdW5jdGlvbi4nKTtcbiAgICB9XG5cbiAgICBpZiAobiA+PSAyKSB7XG4gICAgICBpZiAoYSA9PT0gXykgcmV0dXJuIGN1cnJ5MShmdW5jdGlvbiAoYSwgYywgZCkge1xuICAgICAgICByZXR1cm4gZm4oYSwgYiwgYywgZCk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBmbihhLCBiLCBjLCBkKTtcbiAgICB9XG5cbiAgICBpZiAobiA9PT0gMSkgcmV0dXJuIGN1cnJ5MShmdW5jdGlvbiAoYiwgYywgZCkge1xuICAgICAgcmV0dXJuIGZuKGEsIGIsIGMsIGQpO1xuICAgIH0pO1xuICAgIHJldHVybiBjdXJyaWVkO1xuICB9O1xufVxuXG5mdW5jdGlvbiBjdXJyeTMoZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGN1cnJpZWQoYSwgYiwgYykge1xuICAgIGZvciAodmFyIF9sZW4zID0gYXJndW1lbnRzLmxlbmd0aCwgX3JlZjMgPSBBcnJheShfbGVuMyA+IDMgPyBfbGVuMyAtIDMgOiAwKSwgX2tleTMgPSAzOyBfa2V5MyA8IF9sZW4zOyBfa2V5MysrKSB7XG4gICAgICBfcmVmM1tfa2V5MyAtIDNdID0gYXJndW1lbnRzW19rZXkzXTtcbiAgICB9XG5cbiAgICB2YXIgZCA9IF9yZWYzWzBdLFxuICAgICAgICBlID0gX3JlZjNbMV07XG5cbiAgICB2YXIgbiA9IGNvdW50QXJndW1lbnRzKGFyZ3VtZW50cywgMyk7XG5cbiAgICBpZiAoYyA9PT0gXyB8fCBkID09PSBfIHx8IGUgPT09IF8pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2FuIG9ubHkgdXNlIHBsYWNlaG9sZGVyIG9uIGZpcnN0IG9yIHNlY29uZCBhcmd1bWVudCBvZiB0aGlzIGZ1bmN0aW9uLicpO1xuICAgIH1cblxuICAgIGlmIChuID49IDMpIHtcbiAgICAgIGlmIChhID09PSBfKSB7XG4gICAgICAgIGlmIChiID09PSBfKSByZXR1cm4gY3VycnkyKGZ1bmN0aW9uIChhLCBiLCBkLCBlKSB7XG4gICAgICAgICAgcmV0dXJuIGZuKGEsIGIsIGMsIGQsIGUpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGN1cnJ5MShmdW5jdGlvbiAoYSwgZCwgZSkge1xuICAgICAgICAgIHJldHVybiBmbihhLCBiLCBjLCBkLCBlKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBpZiAoYiA9PT0gXykgcmV0dXJuIGN1cnJ5MShmdW5jdGlvbiAoYiwgZCwgZSkge1xuICAgICAgICByZXR1cm4gZm4oYSwgYiwgYywgZCwgZSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBmbihhLCBiLCBjLCBkLCBlKTtcbiAgICB9XG5cbiAgICBpZiAobiA9PT0gMikge1xuICAgICAgaWYgKGEgPT09IF8pIHJldHVybiBjdXJyeTIoZnVuY3Rpb24gKGEsIGMsIGQsIGUpIHtcbiAgICAgICAgcmV0dXJuIGZuKGEsIGIsIGMsIGQsIGUpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gY3VycnkxKGZ1bmN0aW9uIChjLCBkLCBlKSB7XG4gICAgICAgIHJldHVybiBmbihhLCBiLCBjLCBkLCBlKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChuID09PSAxKSByZXR1cm4gY3VycnkyKGZ1bmN0aW9uIChiLCBjLCBkLCBlKSB7XG4gICAgICByZXR1cm4gZm4oYSwgYiwgYywgZCwgZSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gY3VycmllZDtcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3Vycnk0KGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiBjdXJyaWVkKGEsIGIsIGMsIGQpIHtcbiAgICBmb3IgKHZhciBfbGVuNCA9IGFyZ3VtZW50cy5sZW5ndGgsIF9yZWY0ID0gQXJyYXkoX2xlbjQgPiA0ID8gX2xlbjQgLSA0IDogMCksIF9rZXk0ID0gNDsgX2tleTQgPCBfbGVuNDsgX2tleTQrKykge1xuICAgICAgX3JlZjRbX2tleTQgLSA0XSA9IGFyZ3VtZW50c1tfa2V5NF07XG4gICAgfVxuXG4gICAgdmFyIGUgPSBfcmVmNFswXSxcbiAgICAgICAgZiA9IF9yZWY0WzFdO1xuXG4gICAgdmFyIG4gPSBjb3VudEFyZ3VtZW50cyhhcmd1bWVudHMsIDQpO1xuXG4gICAgaWYgKGQgPT09IF8gfHwgZSA9PT0gXyB8fCBmID09PSBfKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NhbiBvbmx5IHVzZSBwbGFjZWhvbGRlciBvbiBmaXJzdCwgc2Vjb25kIG9yIHRoaXJkIGFyZ3VtZW50IG9mIHRoaXMgZnVuY3Rpb24uJyk7XG4gICAgfVxuXG4gICAgaWYgKG4gPj0gNCkge1xuICAgICAgaWYgKGEgPT09IF8pIHtcbiAgICAgICAgaWYgKGIgPT09IF8pIHtcbiAgICAgICAgICBpZiAoYyA9PT0gXykgcmV0dXJuIGN1cnJ5MyhmdW5jdGlvbiAoYSwgYiwgYywgZSwgZikge1xuICAgICAgICAgICAgcmV0dXJuIGZuKGEsIGIsIGMsIGQsIGUsIGYpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiBjdXJyeTIoZnVuY3Rpb24gKGEsIGIsIGUsIGYpIHtcbiAgICAgICAgICAgIHJldHVybiBmbihhLCBiLCBjLCBkLCBlLCBmKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYyA9PT0gXykgcmV0dXJuIGN1cnJ5MihmdW5jdGlvbiAoYSwgYywgZSwgZikge1xuICAgICAgICAgIHJldHVybiBmbihhLCBiLCBjLCBkLCBlLCBmKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBjdXJyeTEoZnVuY3Rpb24gKGEsIGUsIGYpIHtcbiAgICAgICAgICByZXR1cm4gZm4oYSwgYiwgYywgZCwgZSwgZik7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgaWYgKGIgPT09IF8pIHtcbiAgICAgICAgaWYgKGMgPT09IF8pIHJldHVybiBjdXJyeTIoZnVuY3Rpb24gKGIsIGMsIGUsIGYpIHtcbiAgICAgICAgICByZXR1cm4gZm4oYSwgYiwgYywgZCwgZSwgZik7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gY3VycnkxKGZ1bmN0aW9uIChiLCBlLCBmKSB7XG4gICAgICAgICAgcmV0dXJuIGZuKGEsIGIsIGMsIGQsIGUsIGYpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGlmIChjID09PSBfKSByZXR1cm4gY3VycnkxKGZ1bmN0aW9uIChjLCBlLCBmKSB7XG4gICAgICAgIHJldHVybiBmbihhLCBiLCBjLCBkLCBlLCBmKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGZuKGEsIGIsIGMsIGQsIGUsIGYpO1xuICAgIH1cblxuICAgIGlmIChuID09PSAzKSB7XG4gICAgICBpZiAoYSA9PT0gXykge1xuICAgICAgICBpZiAoYiA9PT0gXykgcmV0dXJuIGN1cnJ5MyhmdW5jdGlvbiAoYSwgYiwgZCwgZSwgZikge1xuICAgICAgICAgIHJldHVybiBmbihhLCBiLCBjLCBkLCBlLCBmKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBjdXJyeTIoZnVuY3Rpb24gKGEsIGQsIGUsIGYpIHtcbiAgICAgICAgICByZXR1cm4gZm4oYSwgYiwgYywgZCwgZSwgZik7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgaWYgKGIgPT09IF8pIHJldHVybiBjdXJyeTIoZnVuY3Rpb24gKGIsIGQsIGUsIGYpIHtcbiAgICAgICAgcmV0dXJuIGZuKGEsIGIsIGMsIGQsIGUsIGYpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gY3VycnkxKGZ1bmN0aW9uIChkLCBlLCBmKSB7XG4gICAgICAgIHJldHVybiBmbihhLCBiLCBjLCBkLCBlLCBmKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChuID09PSAyKSB7XG4gICAgICBpZiAoYSA9PT0gXykgcmV0dXJuIGN1cnJ5MyhmdW5jdGlvbiAoYSwgYywgZCwgZSwgZikge1xuICAgICAgICByZXR1cm4gZm4oYSwgYiwgYywgZCwgZSwgZik7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBjdXJyeTIoZnVuY3Rpb24gKGMsIGQsIGUsIGYpIHtcbiAgICAgICAgcmV0dXJuIGZuKGEsIGIsIGMsIGQsIGUsIGYpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKG4gPT09IDEpIHJldHVybiBjdXJyeTMoZnVuY3Rpb24gKGIsIGMsIGQsIGUsIGYpIHtcbiAgICAgIHJldHVybiBmbihhLCBiLCBjLCBkLCBlLCBmKTtcbiAgICB9KTtcbiAgICByZXR1cm4gY3VycmllZDtcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3VycnkoZm4pIHtcbiAgdmFyIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMSB8fCBhcmd1bWVudHNbMV0gPT09IHVuZGVmaW5lZCA/IGZuLmxlbmd0aCA6IGFyZ3VtZW50c1sxXTtcbiAgcmV0dXJuIChmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFtmbiwgY3VycnkxLCBjdXJyeTIsIGN1cnJ5MywgY3Vycnk0XVtsZW5ndGhdKGZuKTtcbiAgfSkoKTtcbn0iLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIF9pc0VtcHR5ID0gcmVxdWlyZSgnLi9pc0VtcHR5Jyk7XG5cbnZhciBfaXNFbXB0eTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9pc0VtcHR5KTtcblxuZnVuY3Rpb24gaXNJbnQodmFsdWUpIHtcbiAgaWYgKGlzTmFOKHZhbHVlKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICB2YXIgeCA9IHBhcnNlRmxvYXQodmFsdWUpO1xuICByZXR1cm4gKHggfCAwKSA9PT0geDtcbn1cblxuZnVuY3Rpb24gaXNBcnJheVVwZGF0ZSh1cGRhdGVzKSB7XG4gIGZvciAodmFyIF9pdGVyYXRvciA9IE9iamVjdC5rZXlzKHVwZGF0ZXMpLCBfaXNBcnJheSA9IEFycmF5LmlzQXJyYXkoX2l0ZXJhdG9yKSwgX2kgPSAwLCBfaXRlcmF0b3IgPSBfaXNBcnJheSA/IF9pdGVyYXRvciA6IF9pdGVyYXRvcltTeW1ib2wuaXRlcmF0b3JdKCk7Oykge1xuICAgIHZhciBfcmVmO1xuXG4gICAgaWYgKF9pc0FycmF5KSB7XG4gICAgICBpZiAoX2kgPj0gX2l0ZXJhdG9yLmxlbmd0aCkgYnJlYWs7XG4gICAgICBfcmVmID0gX2l0ZXJhdG9yW19pKytdO1xuICAgIH0gZWxzZSB7XG4gICAgICBfaSA9IF9pdGVyYXRvci5uZXh0KCk7XG4gICAgICBpZiAoX2kuZG9uZSkgYnJlYWs7XG4gICAgICBfcmVmID0gX2kudmFsdWU7XG4gICAgfVxuXG4gICAgdmFyIHVwZGF0ZUtleSA9IF9yZWY7XG5cbiAgICBpZiAoIWlzSW50KHVwZGF0ZUtleSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gYXJyYXlPck9iamVjdCh1cGRhdGVzKSB7XG4gIGlmICghX2lzRW1wdHkyWydkZWZhdWx0J10odXBkYXRlcykgJiYgaXNBcnJheVVwZGF0ZSh1cGRhdGVzKSkge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIHJldHVybiB7fTtcbn1cblxuZnVuY3Rpb24gZGVmYXVsdE9iamVjdChvYmplY3QsIHVwZGF0ZXMpIHtcbiAgaWYgKHR5cGVvZiBvYmplY3QgPT09ICd1bmRlZmluZWQnIHx8IG9iamVjdCA9PT0gbnVsbCkge1xuICAgIHJldHVybiBhcnJheU9yT2JqZWN0KHVwZGF0ZXMpO1xuICB9XG5cbiAgcmV0dXJuIG9iamVjdDtcbn1cblxuZXhwb3J0c1snZGVmYXVsdCddID0gZGVmYXVsdE9iamVjdDtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIlwidXNlIHN0cmljdFwiO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuZnVuY3Rpb24gaXNFbXB0eShvYmplY3QpIHtcbiAgcmV0dXJuICFPYmplY3Qua2V5cyhvYmplY3QpLmxlbmd0aDtcbn1cblxuZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBpc0VtcHR5O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzW1wiZGVmYXVsdFwiXTsiLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5leHBvcnRzWydkZWZhdWx0J10gPSBzcGxpdFBhdGg7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIF9sb2Rhc2hDb2xsZWN0aW9uUmVqZWN0ID0gcmVxdWlyZSgnbG9kYXNoL2NvbGxlY3Rpb24vcmVqZWN0Jyk7XG5cbnZhciBfbG9kYXNoQ29sbGVjdGlvblJlamVjdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9sb2Rhc2hDb2xsZWN0aW9uUmVqZWN0KTtcblxuZnVuY3Rpb24gc3BsaXRQYXRoKHBhdGgpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkocGF0aCkgPyBwYXRoIDogX2xvZGFzaENvbGxlY3Rpb25SZWplY3QyWydkZWZhdWx0J10ocGF0aC5zcGxpdCgnLicpLCBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiAheDtcbiAgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX3VwZGF0ZSA9IHJlcXVpcmUoJy4vdXBkYXRlJyk7XG5cbnZhciBfdXBkYXRlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3VwZGF0ZSk7XG5cbnZhciBfdXRpbEN1cnJ5ID0gcmVxdWlyZSgnLi91dGlsL2N1cnJ5Jyk7XG5cbnZhciBfdXRpbEN1cnJ5MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3V0aWxDdXJyeSk7XG5cbmZ1bmN0aW9uIHdpdGhEZWZhdWx0KGRlZmF1bHRWYWx1ZSwgdXBkYXRlcywgb2JqZWN0KSB7XG4gIGlmICh0eXBlb2Ygb2JqZWN0ID09PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiBfdXBkYXRlMlsnZGVmYXVsdCddKHVwZGF0ZXMsIGRlZmF1bHRWYWx1ZSk7XG4gIH1cblxuICByZXR1cm4gX3VwZGF0ZTJbJ2RlZmF1bHQnXSh1cGRhdGVzLCBvYmplY3QpO1xufVxuXG5leHBvcnRzWydkZWZhdWx0J10gPSBfdXRpbEN1cnJ5MlsnZGVmYXVsdCddKHdpdGhEZWZhdWx0KTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddOyIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHdyYXA7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIF91dGlsQ3VycnkgPSByZXF1aXJlKCcuL3V0aWwvY3VycnknKTtcblxudmFyIF91dGlsQ3VycnkyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdXRpbEN1cnJ5KTtcblxudmFyIF9mcmVlemUgPSByZXF1aXJlKCcuL2ZyZWV6ZScpO1xuXG52YXIgX2ZyZWV6ZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9mcmVlemUpO1xuXG5mdW5jdGlvbiB3cmFwKGZ1bmMpIHtcbiAgdmFyIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMSB8fCBhcmd1bWVudHNbMV0gPT09IHVuZGVmaW5lZCA/IGZ1bmMubGVuZ3RoIDogYXJndW1lbnRzWzFdO1xuICByZXR1cm4gKGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gX3V0aWxDdXJyeTJbJ2RlZmF1bHQnXShmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gX2ZyZWV6ZTJbJ2RlZmF1bHQnXShmdW5jLmFwcGx5KHVuZGVmaW5lZCwgYXJndW1lbnRzKSk7XG4gICAgfSwgbGVuZ3RoKTtcbiAgfSkoKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107IiwiYWN0aW9ucyA9IFtcbiAgIyBQcm9ncmVzcyB0aGUgYHRpbWVsaW5lc2Agb24gYGVudGl0eWAgYnkgYGRlbHRhYC5cbiAgI1xuICAjICAgdGltZWxpbmVzOiBbU3RyaW5nXVxuICAjICAgZW50aXR5OiBTdHJpbmdcbiAgIyAgIGRlbHRhOiBOdW1iZXJcbiAgJ1Byb2dyZXNzRW50aXR5VGltZWxpbmUnXG5cbiAgIyBBZGRzIGEgbmV3IHRyaWdnZXIgdG8gYHRpbWVsaW5lYCB3aXRoIHNwZWNpZmllZCBgcG9zaXRpb25gIGFuZCBgYWN0aW9uYC4gVGhlXG4gICMgICBgYWN0aW9uYCBmdW5jdGlvbiBleHBlY3RzIHRoZSBpZCBvZiB0aGUgaW52b2tpbmcgZW50aXR5IGFzIGFuIGFyZ3VtZW50LlxuICAjXG4gICMgICB0aW1lbGluZTogU3RyaW5nXG4gICMgICBwb3NpdGlvbjogRmxvYXRcbiAgIyAgIGFjdGlvbjogRnVuY3Rpb25cbiAgJ0FkZFRyaWdnZXInXG5cbiAgIyBBZGRzIGEgbmV3IGBtYXBwaW5nYCBmdW5jdGlvbiB0byBhIGB0aW1lbGluZWAuIEEgYG1hcHBpbmdgIGZ1bmN0aW9uIG1vZGlmaWVzXG4gICMgICBhbiBlbnRpdHkncyBgZGF0YWAgZmllbGQsIGJhc2VkIG9uIGFuIGF0dGFjaGVkIGB0aW1lbGluZWAncyBwcm9ncmVzcy5cbiAgIyBUaGUgYG1hcHBpbmdgIGZ1bmN0aW9uIGV4cGVjdHMgZm91ciBhcmd1bWVudHM6XG4gICMgICBwcm9ncmVzczogRmxvYXQgLSB0aGUgdGltZWxpbmUncyB1cGRhdGVkIHByb2dyZXNzXG4gICMgICBlbnRpdHk6IHRoZSBpZCBvZiB0aGUgaW52b2tpbmcgZW50aXR5XG4gICMgICBkYXRhOiB0aGUgY3VycmVudCBgZGF0YWAgZmllbGQgb2YgdGhlIGludm9raW5nIGVudGl0eVxuICAjIFRoZSBgbWFwcGluZ2AgZnVuY3Rpb24gc2hvdWxkIHJldHVybiBhbiBvYmplY3Qgb2YgY2hhbmdlcyB0byB0aGUgZXhpc3RpbmdcbiAgIyAgIGBkYXRhYCBmaWVsZC5cbiAgI1xuICAjICB0aW1lbGluZTogU3RyaW5nXG4gICMgIG1hcHBpbmc6IEZ1bmN0aW9uXG4gICdBZGRNYXBwaW5nJ1xuXG4gICMgQWRkcyBhIG5ldyBlbnRpdHksIHdpdGggYW4gb3B0aW9uYWwgaW5pdGlhbCBgZGF0YWAgZmllbGQgYW5kIG9wdGlvbmFsIGBuYW1lYFxuICAjICAgZmllbGQuXG4gICNcbiAgIyAgIGluaXRpYWxEYXRhOiBPYmplY3RcbiAgIyAgIG5hbWU6IFN0cmluZ1xuICAnQWRkRW50aXR5J1xuXG4gICMgQWRkcyBhIG5ldyB0aW1lbGluZSB3aXRoIHRoZSBwcm92aWRlZCBgbGVuZ3RoYCwgYW5kIG9wdGlvbmFsbHkgd2hldGhlciB0aGVcbiAgIyAgIHRpbWVsaW5lIGBzaG91bGRMb29wYC5cbiAgI1xuICAjICAgbGVuZ3RoOiBOdW1iZXJcbiAgIyAgIHNob3VsZExvb3A6IEJvb2xlYW4gIyBUT0RPOiBEb2VzIGl0IG1ha2Ugc2Vuc2UgdG8gaGF2ZSB0aGlzIGxvb3AgcGFyYW1ldGVyP1xuICAjICAgICAgICAgICAgICAgICAgICAgICAjICAgICAgIFNlZW1zIGxpa2UgaXQgc2hvdWxkIGp1c3QgcmVtYWluIGFuIGFjdGlvbi5cbiAgJ0FkZFRpbWVsaW5lJ1xuXG4gICMgU2V0IGEgdGltZWxpbmUgdG8gbG9vcCBvciBub3QgbG9vcC5cbiAgI1xuICAjICAgdGltZWxpbmU6IFN0cmluZ1xuICAjICAgc2hvdWxkTG9vcDogQm9vbGVhblxuICAnU2V0VGltZWxpbmVMb29wJ1xuXG4gICMgQXR0YWNoZXMgdGhlIGBlbnRpdHlgIHdpdGggdGhlIHByb3ZpZGVkIGlkIHRvIHRoZSBgdGltZWxpbmVgIHdpdGggdGhlXG4gICMgICBwcm92aWRlZCB0aW1lbGluZSBpZC5cbiAgI1xuICAjICAgZW50aXR5OiBTdHJpbmdcbiAgIyAgIHRpbWVsaW5lOiBTdHJpbmdcbiAgJ0F0dGFjaEVudGl0eVRvVGltZWxpbmUnXG5cbiAgIyBVcGRhdGVzIGBlbnRpdHlgJ3MgYGRhdGFgIHByb3BlcnR5IHdpdGggYGNoYW5nZXNgICh3aGljaCBhcmUgYXBwbGllZCB0byB0aGVcbiAgIyAgIGV4aXN0aW5nIGBkYXRhYCB2aWEgYHVwZGVlcGApLlxuICAjXG4gICMgICBlbnRpdHk6IFN0cmluZ1xuICAjICAgY2hhbmdlczogT2JqZWN0XG4gICdVcGRhdGVFbnRpdHlEYXRhJ1xuXVxuXG5tb2R1bGUuZXhwb3J0cyA9IGFjdGlvbnMucmVkdWNlICgoYWNjLCBhY3Rpb25UeXBlKSAtPlxuICBhY2NbYWN0aW9uVHlwZV0gPSBhY3Rpb25UeXBlXG4gIHJldHVybiBhY2MpLCB7fSIsIl8gPSByZXF1aXJlICdsb2Rhc2gnXG51cGRlZXAgPSByZXF1aXJlICd1cGRlZXAnXG5rID0gcmVxdWlyZSAnLi4vQWN0aW9uVHlwZXMnXG5cbm1hcEFzc2lnbiA9IHJlcXVpcmUgJy4uL3V0aWwvbWFwQXNzaWduJ1xuYWRkQ2hpbGRSZWR1Y2VycyA9IHJlcXVpcmUgJy4uL3V0aWwvYWRkQ2hpbGRSZWR1Y2VycydcblxuY2xhbXAgPSByZXF1aXJlICcuLi91dGlsL2NsYW1wJ1xud3JhcCA9IHJlcXVpcmUgJy4uL3V0aWwvd3JhcCdcblxudGltZWxpbmVzUmVkdWNlciA9IHJlcXVpcmUgJy4vdGltZWxpbmVzJ1xuZW50aXRpZXNSZWR1Y2VyID0gcmVxdWlyZSAnLi9lbnRpdGllcydcblxuIyMjXG5zdGF0ZSA6Oj0gU3RhdGVcbnByb2dyZXNzSW5mbyA6Oj0geyB0aW1lbGluZUlkIC0+IHtkZWx0YTogRmxvYXQsIGVudGl0aWVzOiBbZW50aXR5SWRdfSB9ICMgZm9yIHNwZWNpZmljIGVudGl0aWVzXG4gICAgICAgICAgICAgICB8IHsgdGltZWxpbmVJZCAtPiB7ZGVsdGE6IEZsb2F0fSB9ICMgZm9yIGFsbCBhdHRhY2hlZCBlbnRpdGllc1xuIyMjXG5iYXRjaFByb2dyZXNzID0gKHN0YXRlLCBwcm9ncmVzc0luZm8pIC0+XG4gIHN0YXRlXyA9IG1hcEFzc2lnbiAoXy5jbG9uZURlZXAgc3RhdGUpLFxuICAgICdlbnRpdGllcy5kaWN0LiouYXR0YWNoZWRUaW1lbGluZXMuKi5wcm9ncmVzcycsXG4gICAgKG9sZFByb2dyZXNzLCBbZW50aXR5T2JqLCB0aW1lbGluZU9ial0sIFtlbnRpdHlJZCwgdGltZWxpbmVJZHhdKSAtPlxuICAgICAgdGltZWxpbmVNb2RlbCA9IHN0YXRlLnRpbWVsaW5lcy5kaWN0W3RpbWVsaW5lT2JqLmlkXVxuXG4gICAgICBzaG91bGRVcGRhdGUgPVxuICAgICAgICBpZiBwcm9ncmVzc0luZm9bdGltZWxpbmVPYmouaWRdPy5lbnRpdGllcz9cbiAgICAgICAgdGhlbiBfLmNvbnRhaW5zIGVudGl0eUlkLCBwcm9ncmVzc0luZm9bdGltZWxpbmVPYmouaWRdLmVudGl0aWVzXG4gICAgICAgIGVsc2UgcHJvZ3Jlc3NJbmZvW3RpbWVsaW5lT2JqLmlkXT9cblxuICAgICAgcHJvZ3Jlc3NEZWx0YSA9XG4gICAgICAgIGlmIHNob3VsZFVwZGF0ZVxuICAgICAgICB0aGVuIHByb2dyZXNzSW5mb1t0aW1lbGluZU9iai5pZF0uZGVsdGEgLyB0aW1lbGluZU1vZGVsLmxlbmd0aFxuICAgICAgICBlbHNlIDBcblxuICAgICAgbmV3UHJvZ3Jlc3MgPVxuICAgICAgICBpZiB0aW1lbGluZU1vZGVsLnNob3VsZExvb3BcbiAgICAgICAgdGhlbiB3cmFwIDAsIDEsIG9sZFByb2dyZXNzICsgcHJvZ3Jlc3NEZWx0YVxuICAgICAgICBlbHNlIGNsYW1wIDAsIDEsIG9sZFByb2dyZXNzICsgcHJvZ3Jlc3NEZWx0YVxuXG4gICAgICByZXR1cm4gbmV3UHJvZ3Jlc3NcblxuICBzdGF0ZV9fID0gbWFwQXNzaWduIHN0YXRlXyxcbiAgICAnZW50aXRpZXMuZGljdC4qLmRhdGEnLFxuICAgIChwcmV2aW91c0RhdGEsIFtlbnRpdHlPYmpdLCBbZW50aXR5SWRdKSAtPlxuICAgICAgb2xkVGltZWxpbmVzID0gc3RhdGUuZW50aXRpZXMuZGljdFtlbnRpdHlJZF0uYXR0YWNoZWRUaW1lbGluZXNcbiAgICAgIG5ld1RpbWVsaW5lcyA9IGVudGl0eU9iai5hdHRhY2hlZFRpbWVsaW5lc1xuXG4gICAgICBhcHBseVRyaWdnZXIgPSAobmV3UHJvZ3Jlc3MsIG9sZFByb2dyZXNzKSAtPiAoZW50aXR5RGF0YSwgdHJpZ2dlcikgLT5cbiAgICAgICAgc2hvdWxkUGVyZm9ybVRyaWdnZXIgPSBzd2l0Y2hcbiAgICAgICAgICB3aGVuIF8uaXNOdW1iZXIgdHJpZ2dlci5wb3NpdGlvblxuICAgICAgICAgICAgKG9sZFByb2dyZXNzIDwgdHJpZ2dlci5wb3NpdGlvbiA8PSBuZXdQcm9ncmVzcykgb3JcbiAgICAgICAgICAgIChuZXdQcm9ncmVzcyA8IHRyaWdnZXIucG9zaXRpb24gPD0gb2xkUHJvZ3Jlc3MpXG4gICAgICAgICAgd2hlbiBfLmlzRnVuY3Rpb24gdHJpZ2dlci5wb3NpdGlvblxuICAgICAgICAgICAgdHJpZ2dlci5wb3NpdGlvbiBuZXdQcm9ncmVzcywgb2xkUHJvZ3Jlc3NcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBjb25zb2xlLndhcm4gJ0ludmFsaWQgdHJpZ2dlciBwb3NpdGlvbiBvbiB0cmlnZ2VyJywgdHJpZ2dlclxuICAgICAgICAgICAgZmFsc2VcblxuICAgICAgICBpZiBzaG91bGRQZXJmb3JtVHJpZ2dlclxuICAgICAgICB0aGVuIF8uYXNzaWduIHt9LCBlbnRpdHlEYXRhLCAodHJpZ2dlci5hY3Rpb24gbmV3UHJvZ3Jlc3MsIGVudGl0eUlkLCBlbnRpdHlEYXRhKVxuICAgICAgICBlbHNlIGVudGl0eURhdGFcblxuICAgICAgcmVkdWNlVHJpZ2dlcnMgPSAoZGF0YSwgX18sIGkpIC0+XG4gICAgICAgIHRpbWVsaW5lT2JqID0gc3RhdGVfLnRpbWVsaW5lcy5kaWN0W25ld1RpbWVsaW5lc1tpXS5pZF1cbiAgICAgICAgbmV3UHJvZ3Jlc3MgPSBuZXdUaW1lbGluZXNbaV0ucHJvZ3Jlc3NcbiAgICAgICAgb2xkUHJvZ3Jlc3MgPSBvbGRUaW1lbGluZXNbaV0ucHJvZ3Jlc3NcblxuICAgICAgICBhcHBseVRoaXNUcmlnZ2VyID0gYXBwbHlUcmlnZ2VyIG5ld1Byb2dyZXNzLCBvbGRQcm9ncmVzc1xuICAgICAgICB0aW1lbGluZU9iai50cmlnZ2Vycy5yZWR1Y2UgYXBwbHlUaGlzVHJpZ2dlciwgZGF0YVxuXG4gICAgICByZXR1cm4gbmV3VGltZWxpbmVzLnJlZHVjZSByZWR1Y2VUcmlnZ2VycyxcbiAgICAgICAgc3RhdGVfLmVudGl0aWVzLmRpY3RbZW50aXR5SWRdLmRhdGFcblxuICBtYXBBc3NpZ24gc3RhdGVfXyxcbiAgICAnZW50aXRpZXMuZGljdC4qLmRhdGEnLFxuICAgIChwcmV2aW91c0RhdGEsIFtlbnRpdHlPYmpdLCBbZW50aXR5SWRdKSAtPlxuICAgICAgYXBwbHlNYXBwaW5nID0gKHByb2dyZXNzKSAtPiAoZW50aXR5RGF0YSwgbWFwcGluZykgLT5cbiAgICAgICAgXy5hc3NpZ24ge30sIGVudGl0eURhdGEsXG4gICAgICAgICAgbWFwcGluZyBwcm9ncmVzcywgZW50aXR5SWQsIGVudGl0eURhdGFcblxuICAgICAgIyBmb3IgZXZlcnkgYXR0YWNoZWQgdGltZWxpbmUuLi5cbiAgICAgIHIgPSBlbnRpdHlPYmouYXR0YWNoZWRUaW1lbGluZXMucmVkdWNlICgoZGF0YSwgYXR0YWNoZWRUaW1lbGluZSwgaWR4KSAtPlxuICAgICAgICAjIC4uLiBhcHBseSBldmVyeSBtYXBwaW5nLCB0aHJlYWRpbmcgdGhlIGBkYXRhYCB0aHJvdWdoXG4gICAgICAgIHRpbWVsaW5lID0gc3RhdGVfXy50aW1lbGluZXMuZGljdFthdHRhY2hlZFRpbWVsaW5lLmlkXVxuICAgICAgICB1cGRhdGVkRW50aXR5T2JqID0gc3RhdGVfXy5lbnRpdGllcy5kaWN0W2VudGl0eUlkXVxuICAgICAgICBuZXdQcm9ncmVzcyA9IHVwZGF0ZWRFbnRpdHlPYmouYXR0YWNoZWRUaW1lbGluZXNbaWR4XS5wcm9ncmVzc1xuICAgICAgICB0aW1lbGluZS5tYXBwaW5ncy5yZWR1Y2UgKGFwcGx5TWFwcGluZyBuZXdQcm9ncmVzcyksIGRhdGEpLCBlbnRpdHlPYmouZGF0YVxuXG5cblxucmVkdWNlciA9IChzdGF0ZSA9IHt9LCBhY3Rpb24pIC0+XG4gIHN3aXRjaCBhY3Rpb24udHlwZVxuICAgIHdoZW4gay5Qcm9ncmVzc1RpbWVsaW5lXG4gICAgICB7dGltZWxpbmUsIGRlbHRhfSA9IGFjdGlvbi5kYXRhXG5cbiAgICAgIFxuXG4gICAgd2hlbiBrLlByb2dyZXNzRW50aXR5VGltZWxpbmVcbiAgICAgIHtlbnRpdHksIHRpbWVsaW5lLCBkZWx0YX0gPSBhY3Rpb24uZGF0YVxuICAgICAgcHJvZ3Jlc3NJbmZvID0ge31cbiAgICAgIHByb2dyZXNzSW5mb1t0aW1lbGluZV0gPVxuICAgICAgICBlbnRpdGllczogW2VudGl0eV1cbiAgICAgICAgZGVsdGE6IGRlbHRhXG4gICAgICBiYXRjaFByb2dyZXNzIHN0YXRlLCBwcm9ncmVzc0luZm9cblxuXG4gICAgd2hlbiBrLkF0dGFjaEVudGl0eVRvVGltZWxpbmVcbiAgICAgIHtlbnRpdHksIHRpbWVsaW5lLCBwcm9ncmVzc30gPSBhY3Rpb24uZGF0YVxuICAgICAgbWFwQXNzaWduIChfLmNsb25lRGVlcCBzdGF0ZSksXG4gICAgICAgIFwiZW50aXRpZXMuZGljdC4je2VudGl0eX0uYXR0YWNoZWRUaW1lbGluZXNcIixcbiAgICAgICAgKG9sZEF0dGFjaGVkVGltZWxpbmVzKSAtPlxuICAgICAgICAgIGNoZWNrVGltZWxpbmUgPSAodG1sbikgLT4gdG1sbi5pZCBpc250IHRpbWVsaW5lXG4gICAgICAgICAgaXNUaW1lbGluZUFscmVhZHlBdHRhY2hlZCA9IF8uYWxsIG9sZEF0dGFjaGVkVGltZWxpbmVzLCBjaGVja1RpbWVsaW5lXG4gICAgICAgICAgaWYgaXNUaW1lbGluZUFscmVhZHlBdHRhY2hlZFxuICAgICAgICAgICAgaWYgbm90IHByb2dyZXNzP1xuICAgICAgICAgICAgICBwcm9ncmVzcyA9IDBcbiAgICAgICAgICAgIG5ld0F0dGFjaGVkVGltZWxpbmUgPVxuICAgICAgICAgICAgICBpZDogdGltZWxpbmVcbiAgICAgICAgICAgICAgcHJvZ3Jlc3M6IHByb2dyZXNzXG4gICAgICAgICAgICBbb2xkQXR0YWNoZWRUaW1lbGluZXMuLi4sIG5ld0F0dGFjaGVkVGltZWxpbmVdXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgb2xkQXR0YWNoZWRUaW1lbGluZXNcblxuXG5cbiAgICBlbHNlIHN0YXRlXG5cblxubW9kdWxlLmV4cG9ydHMgPSBhZGRDaGlsZFJlZHVjZXJzIHJlZHVjZXIsXG4gICd0aW1lbGluZXMnOiB0aW1lbGluZXNSZWR1Y2VyXG4gICdlbnRpdGllcyc6IGVudGl0aWVzUmVkdWNlciIsIl8gPSByZXF1aXJlICdsb2Rhc2gnXG51cGRlZXAgPSByZXF1aXJlICd1cGRlZXAnXG5rID0gcmVxdWlyZSAnLi4vQWN0aW9uVHlwZXMnXG5tYXBBc3NpZ24gPSByZXF1aXJlICcuLi91dGlsL21hcEFzc2lnbidcbmFkZENoaWxkUmVkdWNlcnMgPSByZXF1aXJlICcuLi91dGlsL2FkZENoaWxkUmVkdWNlcnMnXG5cbm1ha2VOZXdFbnRpdHkgPSAoaW5pdGlhbERhdGEgPSB7fSkgLT5cbiAgYXR0YWNoZWRUaW1lbGluZXM6IFtdXG4gIGRhdGE6IGluaXRpYWxEYXRhXG5cbnJlZHVjZXIgPSAoc3RhdGUgPSB7ZGljdDoge30sIF9zcGF3bmVkQ291bnQ6IDB9LCBhY3Rpb24pIC0+XG4gIHN3aXRjaCBhY3Rpb24udHlwZVxuICAgIHdoZW4gay5BZGRFbnRpdHlcbiAgICAgICMgVE9ETzogY2xlYW5lciB3YXkgdG8gZW5hYmxlIG9wdGlvbmFsIGRhdGFcbiAgICAgIGlmIGFjdGlvbi5kYXRhP1xuICAgICAgICB7bmFtZSwgaW5pdGlhbERhdGF9ID0gYWN0aW9uLmRhdGFcblxuICAgICAgaWQgPSBcImVudGl0eS0je3N0YXRlLl9zcGF3bmVkQ291bnR9XCJcblxuICAgICAgY2hhbmdlcyA9XG4gICAgICAgIGRpY3Q6IHt9XG4gICAgICAgIF9zcGF3bmVkQ291bnQ6IHN0YXRlLl9zcGF3bmVkQ291bnQgKyAxXG4gICAgICBjaGFuZ2VzLmRpY3RbaWRdID0gbWFrZU5ld0VudGl0eSBpbml0aWFsRGF0YVxuXG4gICAgICBpZiBuYW1lP1xuICAgICAgICBjaGFuZ2VzLmRpY3RbaWRdLm5hbWUgPSBuYW1lXG5cbiAgICAgIHVwZGVlcCBjaGFuZ2VzLCBzdGF0ZVxuXG4gICAgd2hlbiBrLlVwZGF0ZUVudGl0eURhdGFcbiAgICAgIHtlbnRpdHksIGNoYW5nZXN9ID0gYWN0aW9uLmRhdGFcblxuICAgICAgaWYgc3RhdGUuZGljdFtlbnRpdHldP1xuICAgICAgICBzdGF0ZUNoYW5nZXMgPSBkaWN0OiB7fVxuICAgICAgICBzdGF0ZUNoYW5nZXMuZGljdFtlbnRpdHldID1cbiAgICAgICAgICBkYXRhOiBjaGFuZ2VzXG5cbiAgICAgICAgdXBkZWVwIHN0YXRlQ2hhbmdlcywgc3RhdGVcblxuICAgICAgZWxzZVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCJBdHRlbXB0ZWQgdG8gdXBkYXRlIG5vbi1leGlzdGFudCBlbnRpdHkgI3tlbnRpdHl9LlwiXG5cbiAgICBlbHNlIHN0YXRlXG5cblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y2VyIiwiXyA9IHJlcXVpcmUgJ2xvZGFzaCdcbnVwZGVlcCA9IHJlcXVpcmUgJ3VwZGVlcCdcbmsgPSByZXF1aXJlICcuLi9BY3Rpb25UeXBlcydcbm1hcEFzc2lnbiA9IHJlcXVpcmUgJy4uL3V0aWwvbWFwQXNzaWduJ1xuYWRkQ2hpbGRSZWR1Y2VycyA9IHJlcXVpcmUgJy4uL3V0aWwvYWRkQ2hpbGRSZWR1Y2VycydcblxucmVkdWNlciA9IChzdGF0ZSA9IHtkaWN0OiB7fSwgX3NwYXduZWRDb3VudDogMH0sIGFjdGlvbikgLT5cbiAgc3dpdGNoIGFjdGlvbi50eXBlXG4gICAgd2hlbiBrLkFkZFRpbWVsaW5lXG4gICAgICB7bGVuZ3RoLCBzaG91bGRMb29wfSA9IF8uZGVmYXVsdHMgYWN0aW9uLmRhdGEsXG4gICAgICAgIGxlbmd0aDogMVxuICAgICAgICBzaG91bGRMb29wOiBmYWxzZVxuXG4gICAgICBjaGFuZ2VzID1cbiAgICAgICAgZGljdDoge31cbiAgICAgICAgX3NwYXduZWRDb3VudDogc3RhdGUuX3NwYXduZWRDb3VudCArIDFcbiAgICAgICMgbmV3IGVudGl0eVxuICAgICAgY2hhbmdlcy5kaWN0W1widGltZWxpbmUtI3tzdGF0ZS5fc3Bhd25lZENvdW50fVwiXSA9XG4gICAgICAgIGxlbmd0aDogbGVuZ3RoXG4gICAgICAgIHNob3VsZExvb3A6IHNob3VsZExvb3BcbiAgICAgICAgdHJpZ2dlcnM6IFtdXG4gICAgICAgIG1hcHBpbmdzOiBbXVxuXG4gICAgICB1cGRlZXAgY2hhbmdlcywgc3RhdGVcblxuXG4gICAgd2hlbiBrLkFkZFRyaWdnZXJcbiAgICAgIHt0aW1lbGluZSwgcG9zaXRpb24sIGFjdGlvbn0gPSBhY3Rpb24uZGF0YVxuICAgICAgbWFwQXNzaWduIChfLmNsb25lRGVlcCBzdGF0ZSksXG4gICAgICAgIFwiZGljdC4je3RpbWVsaW5lfS50cmlnZ2Vyc1wiLFxuICAgICAgICAob2xkVHJpZ2dlcnMpIC0+IFtvbGRUcmlnZ2Vycy4uLiwge3Bvc2l0aW9uOiBwb3NpdGlvbiwgYWN0aW9uOiBhY3Rpb259XVxuXG5cbiAgICB3aGVuIGsuQWRkTWFwcGluZ1xuICAgICAge3RpbWVsaW5lLCBtYXBwaW5nfSA9IGFjdGlvbi5kYXRhXG4gICAgICBtYXBBc3NpZ24gKF8uY2xvbmVEZWVwIHN0YXRlKSxcbiAgICAgICAgXCJkaWN0LiN7dGltZWxpbmV9Lm1hcHBpbmdzXCIsXG4gICAgICAgIChvbGRNYXBwaW5ncykgLT4gW29sZE1hcHBpbmdzLi4uLCBtYXBwaW5nXVxuXG5cbiAgICB3aGVuIGsuU2V0VGltZWxpbmVMb29wXG4gICAgICB7dGltZWxpbmUsIHNob3VsZExvb3B9ID0gYWN0aW9uLmRhdGFcbiAgICAgIG1hcEFzc2lnbiAoXy5jbG9uZURlZXAgc3RhdGUpLFxuICAgICAgICBcImRpY3QuI3t0aW1lbGluZX0uc2hvdWxkTG9vcFwiLFxuICAgICAgICAoKSAtPiBzaG91bGRMb29wXG5cbiAgICBlbHNlIHN0YXRlXG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWNlciIsIl8gPSByZXF1aXJlICdsb2Rhc2gnXG5cbm1vZHVsZS5leHBvcnRzID0gYWRkQ2hpbGRSZWR1Y2VycyA9IChiYXNlUmVkdWNlciwgY2hpbGRSZWR1Y2VycyA9IHt9KSAtPlxuICAoc3RhdGUgPSB7fSwgYWN0aW9uKSAtPlxuICAgICMgYGFjY2Agd2lsbCBob2xkIG91ciBzdGF0ZSBhcyBpdCBnZXRzIHVwZGF0ZWQgYnkgZWFjaCByZWR1Y2VyXG4gICAgIyBga2V5YCBpcyB0aGUga2V5IG9mIHRoZSByZWR1Y2VyLCBhcyB3ZWxsIGFzIHRoZSBzdWJzdGF0ZSdzIHBhdGhcbiAgICByZWR1Y2VPdmVyQ2hpbGRyZW4gPSAoYWNjLCBrZXkpIC0+XG4gICAgICBjaGFuZ2VkU3RhdGUgPSB7fVxuICAgICAgY2hhbmdlZFN0YXRlW2tleV0gPSBjaGlsZFJlZHVjZXJzW2tleV0gYWNjW2tleV0sIGFjdGlvblxuXG4gICAgICBfLmFzc2lnbiB7fSwgYWNjLCBjaGFuZ2VkU3RhdGVcblxuICAgICMgdGhpcyB3YXkgbWlnaHQgYmUgZmFzdGVyXG4gICAgIyAgIF8uYXNzaWduIGFjYywgY2hhbmdlZFN0YXRlXG4gICAgIyBzdGF0ZSA9IF8uYXNzaWduIHt9LCBzdGF0ZVxuXG4gICAgcmVzdWx0ID0gT2JqZWN0LmtleXMgY2hpbGRSZWR1Y2Vyc1xuICAgICAgLnJlZHVjZSByZWR1Y2VPdmVyQ2hpbGRyZW4sIHN0YXRlXG5cbiAgICByZXN1bHQgPSBiYXNlUmVkdWNlciByZXN1bHQsIGFjdGlvblxuXG4gICAgIyBmcmVlemUgdGhpcyB0byBlbnN1cmUgd2UncmUgbm90IGFjY2lkZW50YWxseSBtdXRhdGluZ1xuICAgIE9iamVjdC5mcmVlemUgcmVzdWx0XG4gICAgcmV0dXJuIHJlc3VsdCIsIm1vZHVsZS5leHBvcnRzID0gY2xhbXAgPSAobG93LCBoaWdoLCBuKSAtPlxuICBmbiA9IChuKSAtPiBNYXRoLm1pbiBoaWdoLCAoTWF0aC5tYXggbG93LCBuKVxuXG4gIGlmIG4/XG4gIHRoZW4gZm4gblxuICBlbHNlIGZuIiwidHJhbnNsYXRlM2QgPSAoeCwgeSwgeiwgZWxlbWVudCkgLT5cbiAgWyctd2Via2l0LScsICctbW96LScsICctby0nLCAnJ10uZm9yRWFjaCAocHJlZml4KSAtPlxuICAgIGVsZW1lbnQuc3R5bGVbXCIje3ByZWZpeH10cmFuc2Zvcm1cIl0gPSBcInRyYW5zbGF0ZTNkKCN7eH0sICN7eX0sICN7en0pXCJcblxub2Zmc2V0ID0gKGxlZnQsIHRvcCwgZWxlbWVudCkgLT5cbiAgZWxlbWVudC5sZWZ0ID0gbGVmdFxuICBlbGVtZW50LnRvcCA9IHRvcFxuXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgJ3RyYW5zbGF0ZTNkJzogdHJhbnNsYXRlM2QiLCIjIFRPRE86IFNob3VsZCB3ZSBiZSB1c2luZyB1cGRlZXAgaW5zdGVhZD9cbiMgaHR0cHM6Ly9naXRodWIuY29tL3N1YnN0YW50aWFsL3VwZGVlcFxuIyBNYXBwaW5nIG92ZXIgZGVlcCBvYmplY3RzIC8gYXJyYXlzIHNlZW1zIHByZXR0eSBjdW1iZXJzb21lIGNvbXBhcmVkIHRvXG4jICAgYG1hcEFzc2lnbigpYCdzIHdpbGRjYXJkIHBhcmFkaWdtOyBidXQgdGhlIHdpbGRjYXJkcyBtaWdodCBiZSBsZXNzIGVmZmljaWVudFxuIyAgIHRoYW4gYHVwZGVlcGAncyBgbWFwKClgLlxuIyBgdXBkZWVwYCBhbHNvIHNlZW1zIGJldHRlciBmb3IgZWRpdGluZyBtdWx0aXBsZSBwYXRocy5cbiNcbiMgSSdtIHVzaW5nIGEgbWl4IGZvciBub3cuIGBtYXBBc3NpZ24oKWAgc2VlbXMgcHJldHR5IGNvbnZlbmllbnQgd2hlbiBlZGl0aW5nIGFcbiMgICBzaW5nbGUgdmFsdWUgcGF0aC5cblxuIyMjXG5VdGlsaXR5IGZvciBtYXBwaW5nIGBPYmplY3QuYXNzaWduKClgIG92ZXIgYXJyYXlzIGFuZCBvYmplY3RzLlxuXG5AcGFyYW0gb2JqIFtPYmplY3RdIFNvdXJjZSBvYmplY3QgdG8gbWFwIG92ZXIgYW5kIG11dGF0ZS5cbkBwYXJhbSBwYXRoIFtTdHJpbmddIFByb3BlcnR5IHBhdGggZm9yIG1hcHBpbmc7IGNhbiBpbmNsdWRlIHByb3BlcnR5IG5hbWVzLFxuICBhcnJheSBpbmRpY2VzIChhcyBudW1lcmFscyksIGFuZCB3aWxkY2FyZHMgKGAqYCksIGRlbGltaXRlZCBieSBgLmAuXG5AcGFyYW0gbWFrZVZhbHVlIFtGdW5jdGlvbl0gRnVuY3Rpb24gdG8gZGV0ZXJtaW5lIG5ldyB2YWx1ZSB0byBiZSBwbGFjZWQgYXRcbiAgYHBhdGhgLiBQYXJhbWV0ZXJzIGFyZTpcbiAgICB2YWx1ZSAtIFRoZSBjdXJyZW50IHZhbHVlIGF0IGBwYXRoYCwgb3IgYHVuZGVmaW5lZGAgaWYgcGF0aCBkb2Vzbid0IGV4aXN0XG4gICAgICB5ZXQuXG4gICAgd2lsZGNhcmRWYWx1ZXMgLSBBbiBhcnJheSBvZiB2YWx1ZXMgYXQgZWFjaCBzdWJwYXRoIGVuZGluZyBpbiBhIHdpbGRjYXJkLFxuICAgICAgYmFzZWQgb24gdGhlIGN1cnJlbnQgaXRlcmF0aW9uLlxuICAgIHdpbGRjYXJkcyAtIEFuIGFycmF5IG9mIHByb3BlcnR5IG5hbWVzIG9yIGluZGljZXMgb2YgdGhlIHdpbGRjYXJkcywgYmFzZWRcbiAgICAgIG9uIHRoZSBjdXJyZW50IGl0ZXJhdGlvbi5cblxuQGV4YW1wbGVcblxuICAgIG9iaiA9XG4gICAgICBhOiAxXG4gICAgICBiOiBbXG4gICAgICAgIHtjOiB7cDE6IDF9fVxuICAgICAgICB7Yzoge3AyOiAyLCBwMzogM319XG4gICAgICBdXG5cbiAgICByZXN1bHQgPVxuICAgICAgbWFwQXNzaWduIG9iaiwgJ2IuKi5jLionLCAodmFsdWUsIHdpbGRjYXJkc1ZhbHVlcywgd2lsZGNhcmRzKSAtPlxuICAgICAgICBjb25zb2xlLmxvZyAnPT09PT09PT09PSdcbiAgICAgICAgY29uc29sZS5sb2cgJ3ZhbHVlOicsIHZhbHVlXG4gICAgICAgIGNvbnNvbGUubG9nICd3aWxkY2FyZFZhbHVlczonLCB3aWxkY2FyZFZhbHVlc1xuICAgICAgICBjb25zb2xlLmxvZyAnd2lsZGNhcmRzOicsIHdpbGRjYXJkc1xuICAgICAgICByZXR1cm4gdmFsdWUgKyAxXG5cbiAgICAjIE91dHB1dDpcbiAgICAjID09PT09PT09PT1cbiAgICAjIHZhbHVlOiAxXG4gICAgIyB3aWxkY2FyZFZhbHVlczogW3tjOiB7cDE6IDF9fSwgMV1cbiAgICAjIHdpbGRjYXJkczogWzAsICdwMSddXG4gICAgIyA9PT09PT09PT09XG4gICAgIyB2YWx1ZTogMlxuICAgICMgd2lsZGNhcmRWYWx1ZXM6IFt7Yzoge3AyOiAyLCBwMzogM319LCAyXVxuICAgICMgd2lsZGNhcmRzOiBbMCwgJ3AyJ11cbiAgICAjID09PT09PT09PT1cbiAgICAjIHZhbHVlOiAzXG4gICAgIyB3aWxkY2FyZFZhbHVlczogW3tjOiB7cDI6IDIsIHAzOiAzfX0sIDNdXG4gICAgIyB3aWxkY2FyZHM6IFsxLCAncDMnXVxuXG5cbiAgICAjIHRydWVcbiAgICByZXN1bHQgPT1cbiAgICAgIGE6IDFcbiAgICAgIGI6IFtcbiAgICAgICAge2M6IHtwMTogMn19XG4gICAgICAgIHtjOiB7cDI6IDMsIHAzOiA0fX1cbiAgICAgIF1cblxuIyMjXG5cbm1vZHVsZS5leHBvcnRzID0gbWFwQXNzaWduID0gKG9iaiwgcGF0aFN0cmluZywgbWFrZVZhbHVlKSAtPlxuICByID0gKHBhdGgsIG5vZGUsIHdpbGRjYXJkVmFsdWVzID0gW10sIHdpbGRjYXJkcyA9IFtdKSAtPlxuICAgIGlmIHBhdGgubGVuZ3RoIGlzIDBcbiAgICAgIHJldHVybiBub2RlXG5cbiAgICBpZiBub3Qgbm9kZT9cbiAgICAgICMgcGFzcyB0aHJvdWdoXG4gICAgICByZXR1cm4ge1xuICAgICAgICBub2RlOiBub2RlXG4gICAgICAgIHdpbGRjYXJkVmFsdWVzOiB3aWxkY2FyZFZhbHVlc1xuICAgICAgICB3aWxkY2FyZHM6IHdpbGRjYXJkc1xuICAgICAgfVxuXG5cbiAgICBbZmlyc3QsIHRhaWwuLi5dID0gcGF0aFxuICAgIFtuZXh0LCBfLi4uXSA9IHRhaWxcblxuICAgIHN3aXRjaCBmaXJzdFxuICAgICAgIyBXaWxkY2FyZCB0YWdcbiAgICAgIHdoZW4gJyonXG4gICAgICAgIGtleXMgPVxuICAgICAgICAgIGlmIG5vZGUuY29uc3RydWN0b3IgaXMgQXJyYXlcbiAgICAgICAgICB0aGVuIFswLi4ubm9kZS5sZW5ndGhdXG4gICAgICAgICAgZWxzZSBPYmplY3Qua2V5cyBub2RlXG5cblxuICAgICAgICBmb3Iga2V5IGluIGtleXNcbiAgICAgICAgICBlbG0gPSBub2RlW2tleV1cbiAgICAgICAgICBuZXdXaWxkY2FyZFZhbHVlcyA9IFt3aWxkY2FyZFZhbHVlcy4uLiwgZWxtXVxuICAgICAgICAgIG5ld1dpbGRjYXJkcyA9IFt3aWxkY2FyZHMuLi4sIGtleV1cblxuICAgICAgICAgIGlmIG5leHQ/XG4gICAgICAgICAgICAjIHdlIGFyZW4ndCBhc3NpZ25pbmcgeWV0OyBqdXN0IHJlY3VyXG4gICAgICAgICAgICByIHRhaWwsIGVsbSwgbmV3V2lsZGNhcmRWYWx1ZXMsIG5ld1dpbGRjYXJkc1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICMgbm8gbW9yZSB0YWdzOyBzbyBnbyBhaGVhZCBhbmQgYXNzaWduXG4gICAgICAgICAgICBub2RlW2tleV0gPSBtYWtlVmFsdWUgZWxtLCBuZXdXaWxkY2FyZFZhbHVlcywgbmV3V2lsZGNhcmRzXG5cbiAgICAgICMgTm9ybWFsIHRhZ1xuICAgICAgZWxzZVxuICAgICAgICBrZXkgPVxuICAgICAgICAgIGlmIG5vZGUuY29uc3RydWN0b3IgaXMgQXJyYXlcbiAgICAgICAgICB0aGVuIGRvIC0+XG4gICAgICAgICAgICB0cnlcbiAgICAgICAgICAgICAgcGFyc2VJbnQgZWxtXG4gICAgICAgICAgICBjYXRjaCBlXG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvciAnQXR0ZW1wdGVkIHRvIGluZGV4IGludG8gYW4gYXJyYXkgd2l0aCBhIG5vbi1pbnRlZ2VyIHZhbHVlLidcbiAgICAgICAgICBlbHNlIGZpcnN0XG5cbiAgICAgICAgaWYgbmV4dD9cbiAgICAgICAgICAjIHdlIGFyZW4ndCBhc3NpZ25pbmcgeWV0OyBqdXN0IHJlY3VyXG5cbiAgICAgICAgICAjIGdldCBlbGVtZW50LCBtYWtpbmcgbmV3IG5vZGUgaWYgbmVjZXNzYXJ5XG4gICAgICAgICAgZWxtID1cbiAgICAgICAgICAgIGlmIG5vZGVba2V5XT9cbiAgICAgICAgICAgIHRoZW4gbm9kZVtrZXldXG4gICAgICAgICAgICBlbHNlIGRvIC0+XG4gICAgICAgICAgICAgICMgaXMgYG5leHRgIGZvcm1hdHRlZCBhcyBhIG51bWJlcixcbiAgICAgICAgICAgICAgIyAgIGFuZCBzbyByZXF1aXJpbmcgYW4gYXJyYXk/XG4gICAgICAgICAgICAgIG5vZGVba2V5XSA9XG4gICAgICAgICAgICAgICAgIyAobm90IChpcyBub3QgYSBudW1iZXIpID09IGlzIGEgbnVtYmVyKVxuICAgICAgICAgICAgICAgIGlmIG5vdCBpc05hTiBuZXh0XG4gICAgICAgICAgICAgICAgdGhlbiBbXVxuICAgICAgICAgICAgICAgIGVsc2Uge31cbiAgICAgICAgICAgICAgcmV0dXJuIG5vZGVba2V5XVxuXG4gICAgICAgICAgciB0YWlsLCBlbG0sIHdpbGRjYXJkVmFsdWVzLCB3aWxkY2FyZHNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICMgbm8gbW9yZSB0YWdzOyBzbyBnbyBhaGVhZCBhbmQgYXNzaWduXG4gICAgICAgICAgbm9kZVtrZXldID0gbWFrZVZhbHVlIG5vZGVba2V5XSwgd2lsZGNhcmRWYWx1ZXMsIHdpbGRjYXJkc1xuXG4gIHIgKHBhdGhTdHJpbmcuc3BsaXQgJy4nKSwgb2JqXG4gIHJldHVybiBvYmoiLCIjIFRPRE86IHNob3VsZCBwcm9iYWJseSB0ZXN0IHRoaXNcbm1vZHVsZS5leHBvcnRzID0gd3JhcCA9IChsb3csIGhpZ2gsIG4pIC0+XG4gIGZuID0gKG4pIC0+XG4gICAgcmFuZ2UgPSBoaWdoIC0gbG93XG4gICAgdCA9IG4gLSBsb3dcbiAgICB3aGlsZSB0IDwgMFxuICAgICAgdCArPSByYW5nZVxuICAgIHQgPSB0ICUgcmFuZ2VcbiAgICByZXR1cm4gdCArIGxvd1xuXG4gIGlmIG4/XG4gIHRoZW4gZm4gblxuICBlbHNlIGZuIl19

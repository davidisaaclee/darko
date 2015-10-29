_ = require 'lodash'
{createStore} = require 'redux'
k = require '../src/ActionTypes'
hpReducer = require '../src/reducers/base'

Scene = require '../src/model/scene'
Entity = require '../src/model/entity'
Timeline = require '../src/model/timeline'
Timelines = require '../src/model/timelines/Timelines'
KeyframeTimeline = require '../src/model/timelines/KeyframeTimeline'

vtable = require '../src/util/vtable'

describe 'KeyframeTimeline', () ->
  beforeEach () ->
    @store = createStore hpReducer


  it 'can be constructed', () ->
    kt = KeyframeTimeline.withKeyframes 1,
      '0': 1
      '1': 2
    @store.dispatch
      type: k.AddTimeline
      data:
        id: 'kt1'
        timeline: kt

    expect (Scene.getAllTimelines @store.getState()).length
      .toBe 1
    expect Scene.getTimelineById @store.getState(), 'kt1'
      .toBeDefined()
    expect Timelines.typeOf (Scene.getTimelineById @store.getState(), 'kt1')
      .toBe KeyframeTimeline.type


  it 'can be created and added', () ->
    kt = KeyframeTimeline.withKeyframes 1,
      '0': 1
      '1': 2
    @store.dispatch
      type: k.AddTimeline
      data:
        id: 'kt1'
        timeline: kt

    expect (Scene.getAllTimelines @store.getState()).length
      .toBe 1
    expect Scene.getTimelineById @store.getState(), 'kt1'
      .toBeDefined()


  it 'can progress', () ->
    frames =
      '0':
        foo: 1
      '1':
        foo: 2
    kt = KeyframeTimeline.withKeyframes 1, frames

    @store.dispatch
      type: k.AddTimeline
      data:
        id: 'kt1'
        timeline: kt
    @store.dispatch
      type: k.AddEntity
      data:
        id: 'kiddo'
        initialData:
          foo: 10

    kt = Scene.getTimelineById @store.getState(), 'kt1'
    kiddo = Scene.getEntityById @store.getState(), 'kiddo'

    expect kt
      .toBeDefined()
    expect kt.id
      .toBe 'kt1'
    expect kiddo
      .toBeDefined()
    expect kiddo.id
      .toBe 'kiddo'

    expect (Entity.getData kiddo).foo
      .toBe 10

    @store.dispatch
      type: k.AttachEntityToTimeline
      data:
        entity: kiddo.id
        timeline: kt.id
        progress: 0

    kt = Scene.getTimelineById @store.getState(), 'kt1'
    kiddo = Scene.getEntityById @store.getState(), 'kiddo'

    expect (Entity.getData kiddo).foo
      .toBe 11

    @store.dispatch
      type: k.ProgressEntityTimeline
      data:
        timeline: kt.id
        entity: kiddo.id
        delta: 0.5

    kt = Scene.getTimelineById @store.getState(), 'kt1'
    kiddo = Scene.getEntityById @store.getState(), 'kiddo'

    expect (Entity.getData kiddo).foo
      .toBeCloseTo 11.5
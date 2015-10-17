{createStore} = require 'redux'
k = require '../src/ActionTypes'
hpReducer = require '../src/honeypower'

ObjectSubsetMatcher = require './util/ObjectSubsetMatcher'
assertPure = require './util/assertPure'


describe 'timeline actions', () ->
  beforeEach () ->
    # Add the custom object matcher.
    # (see `./util/ObjectSubsetMatcher` for description of this matcher)
    ObjectSubsetMatcher jasmine

    # Make our initial store.
    @store = createStore hpReducer,
      timelines:
        'timeline1':
          length: 2
          triggers: []
          mappings: []
      entities:
        'entity1':
          attachedTimelines: [
            id: 'timeline1'
            progress: 0
          ]


  it 'can progress timelines', () ->
    expect @store.getState().entities['entity1'].attachedTimelines[0].progress
      .toBe 0

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.ProgressEntityTimeline
        data:
          entity: 'entity1'
          timelines: ['timeline1']
          delta: 1

    expect @store.getState().entities['entity1'].attachedTimelines[0].progress
      .toBe 0.5

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.ProgressEntityTimeline
        data:
          entity: 'entity1'
          timelines: ['timeline1']
          delta: 1

    expect @store.getState().entities['entity1'].attachedTimelines[0].progress
      .toBe 1


  it 'can add new triggers', () ->
    expect @store.getState().timelines['timeline1'].triggers.length
      .toBe 0

    triggerActionSpy = jasmine.createSpy 'TriggerAction'
    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.AddTrigger
        data:
          timeline: 'timeline1'
          position: 0.6
          action: triggerActionSpy

    expect @store.getState().timelines['timeline1'].triggers.length
      .toBe 1
    expect @store.getState().timelines['timeline1'].triggers[0]
      .toMatchObject
        position: 0.6
        action: triggerActionSpy

    expect triggerActionSpy.calls.count()
      .toBe 0


  it 'should trigger events when passed over', () ->
    triggerActionSpy = jasmine.createSpy 'TriggerAction'

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.AddTrigger
        data:
          timeline: 'timeline1'
          position: 0.6
          action: triggerActionSpy

      @store.dispatch
        type: k.ProgressEntityTimeline
        data:
          entity: 'entity1'
          timelines: ['timeline1']
          delta: 1

    expect @store.getState().entities['entity1'].attachedTimelines[0].progress
      .toBe 0.5
    expect triggerActionSpy.calls.count()
      .toBe 0

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.ProgressEntityTimeline
        data:
          entity: 'entity1'
          timelines: ['timeline1']
          delta: 1

    expect @store.getState().entities['entity1'].attachedTimelines[0].progress
      .toBe 1
    expect triggerActionSpy.calls.count()
      .toBe 1
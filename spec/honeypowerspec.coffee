{createStore} = require 'redux'
k = require '../src/ActionTypes'
hp = require '../src/honeypower'

ObjectSubsetMatcher = require './util/ObjectSubsetMatcher'


describe 'timeline actions', () ->
  beforeEach () ->
    # Add the custom object matcher.
    # (see `./util/ObjectSubsetMatcher` for description of this matcher)
    ObjectSubsetMatcher jasmine

    # Make our initial store.
    @store = createStore hp.timelineReducer,
      timelines:
        'timeline1':
          length: 2
          triggers: [
            position: 0.6
            action: (entity) -> _.assign entity.transform.position
          ]
          mappings: []
      entities:
        'entity1':
          attachedTimelines: [
            id: 'timeline1'
            progress: 0
          ]


  it 'should respond to delta time', () ->
    expect @store.getState().entities['entity1'].attachedTimelines[0].progress
      .toBe 0

    @store.dispatch
      type: k.DeltaTime
      data:
        delta: 1
    expect @store.getState().entities['entity1'].attachedTimelines[0].progress
      .toBe 0.5

    @store.dispatch
      type: k.DeltaTime
      data:
        delta: 1
    expect @store.getState().entities['entity1'].attachedTimelines[0].progress
      .toBe 1


  xit 'can add new triggers', () ->
    expect @store.getState().timelines['timeline1'].triggers.length
      .toBe 0

    triggerActionSpy = jasmine.createSpy 'TriggerAction'
    @store.dispatch
      type: k.AddTrigger
      data:
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


  # it 'should trigger events when passed over', () ->
  #   @store.
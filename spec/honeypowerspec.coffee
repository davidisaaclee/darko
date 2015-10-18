{createStore} = require 'redux'
k = require '../src/ActionTypes'
# hpReducer = require '../src/honeypower'
hpReducer = require '../src/reducers/base'

ObjectSubsetMatcher = require './util/ObjectSubsetMatcher'
assertPure = require './util/assertPure'


describe 'timeline construction', () ->
  beforeEach () ->
    # Add the custom object matcher.
    # (see `./util/ObjectSubsetMatcher` for description of this matcher)
    ObjectSubsetMatcher jasmine

    # Make our initial store.
    @store = createStore hpReducer


  it 'can add new entities', () ->
    expect (Object.keys @store.getState().entities.dict).length
      .toBe 0

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.AddEntity

    expect (Object.keys @store.getState().entities.dict).length
      .toBe 1


  it 'can add new timelines', () ->
    expect (Object.keys @store.getState().timelines.dict).length
      .toBe 0

    @store.dispatch
      type: k.AddTimeline
      data:
        length: 2

    expect (Object.keys @store.getState().timelines.dict).length
      .toBe 1


  it 'can attach entities to timelines', () ->
    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.AddEntity
      @store.dispatch
        type: k.AddTimeline
        data:
          length: 1

    state = @store.getState()
    entityKey = (Object.keys state.entities.dict)[0]
    timelineKey = (Object.keys state.timelines.dict)[0]

    expect state.entities.dict[entityKey].attachedTimelines.length
      .toBe 0

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.AttachEntityToTimeline
        data:
          entity: entityKey
          timeline: timelineKey

    state = @store.getState()

    expect state.entities.dict[entityKey].attachedTimelines.length
      .toBe 1
    expect state.entities.dict[entityKey].attachedTimelines[0].id
      .toBe timelineKey
    expect state.entities.dict[entityKey].attachedTimelines[0].progress
      .toBe 0



describe 'timeline actions', () ->
  beforeEach () ->
    # Add the custom object matcher.
    # (see `./util/ObjectSubsetMatcher` for description of this matcher)
    ObjectSubsetMatcher jasmine

    # Make our initial store.
    @store = createStore hpReducer

    # Populate with a timeline and entity.
    @store.dispatch
      type: k.AddTimeline
      data:
        length: 2

    @store.dispatch
      type: k.AddEntity

    # now kiss
    @store.dispatch
      type: k.AttachEntityToTimeline
      data:
        entity: (Object.keys @store.getState().entities.dict)[0]
        timeline: (Object.keys @store.getState().timelines.dict)[0]

  it 'can progress timelines', () ->
    expect @store.getState().entities.dict['entity-0'].attachedTimelines[0].progress
      .toBe 0

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.ProgressEntityTimeline
        data:
          entity: 'entity-0'
          timelines: ['timeline-0']
          delta: 1

    expect @store.getState().entities.dict['entity-0'].attachedTimelines[0].progress
      .toBe 0.5

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.ProgressEntityTimeline
        data:
          entity: 'entity-0'
          timelines: ['timeline-0']
          delta: 1

    expect @store.getState().entities.dict['entity-0'].attachedTimelines[0].progress
      .toBe 1


  it 'can add new triggers', () ->
    expect @store.getState().timelines.dict['timeline-0'].triggers.length
      .toBe 0

    triggerActionSpy = jasmine.createSpy 'TriggerAction'
    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.AddTrigger
        data:
          timeline: 'timeline-0'
          position: 0.6
          action: triggerActionSpy

    expect @store.getState().timelines.dict['timeline-0'].triggers.length
      .toBe 1
    expect @store.getState().timelines.dict['timeline-0'].triggers[0]
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
          timeline: 'timeline-0'
          position: 0.6
          action: triggerActionSpy

      @store.dispatch
        type: k.ProgressEntityTimeline
        data:
          entity: 'entity-0'
          timelines: ['timeline-0']
          delta: 1

    expect @store.getState().entities.dict['entity-0'].attachedTimelines[0].progress
      .toBeCloseTo 0.5
    expect triggerActionSpy.calls.count()
      .toBe 0

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.ProgressEntityTimeline
        data:
          entity: 'entity-0'
          timelines: ['timeline-0']
          delta: 1

    expect @store.getState().entities.dict['entity-0'].attachedTimelines[0].progress
      .toBeCloseTo 1
    expect triggerActionSpy.calls.count()
      .toBe 1
    expect triggerActionSpy.calls.mostRecent().args
      .toEqual ['entity-0']


  it 'should trigger predicate-driven events', () ->
    triggerActionSpy = jasmine.createSpy 'TriggerAction'

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.AddTrigger
        data:
          timeline: 'timeline-0'
          position: (progress, prevProgress) ->
            (progress isnt prevProgress) and
            (progress % 0.2) is 0
          action: triggerActionSpy

      @store.dispatch
        type: k.ProgressEntityTimeline
        data:
          entity: 'entity-0'
          timelines: ['timeline-0']
          delta: 0.2

    expect @store.getState().entities.dict['entity-0'].attachedTimelines[0].progress
      .toBeCloseTo 0.1
    expect triggerActionSpy.calls.count()
      .toBe 0

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.ProgressEntityTimeline
        data:
          entity: 'entity-0'
          timelines: ['timeline-0']
          delta: 0.2

    expect @store.getState().entities.dict['entity-0'].attachedTimelines[0].progress
      .toBeCloseTo 0.2
    expect triggerActionSpy.calls.count()
      .toBe 1
    expect triggerActionSpy.calls.mostRecent().args
      .toEqual ['entity-0']

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.ProgressEntityTimeline
        data:
          entity: 'entity-0'
          timelines: ['timeline-0']
          delta: 0.2

    expect @store.getState().entities.dict['entity-0'].attachedTimelines[0].progress
      .toBeCloseTo 0.3
    expect triggerActionSpy.calls.count()
      .toBe 1

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.ProgressEntityTimeline
        data:
          entity: 'entity-0'
          timelines: ['timeline-0']
          delta: 0.2

    expect @store.getState().entities.dict['entity-0'].attachedTimelines[0].progress
      .toBeCloseTo 0.4
    expect triggerActionSpy.calls.count()
      .toBe 2
    expect triggerActionSpy.calls.mostRecent().args
      .toEqual ['entity-0']


  it 'can map values', () ->
    # we'll push values to this variable in the mapping
    outputStream = 0

    expect @store.getState().timelines.dict['timeline-0'].mappings.length
      .toBe 0

    mappingFn = (progress, prevProgress, entityId) -> outputStream = progress
    mappingFn = jasmine.createSpy 'mappingFn', mappingFn
      .and.callThrough()

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.AddMapping
        data:
          timeline: 'timeline-0'
          mapping: mappingFn

    expect @store.getState().timelines.dict['timeline-0'].mappings.length
      .toBe 1
    expect mappingFn.calls.count()
      .toBe 0

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.ProgressEntityTimeline
        data:
          entity: 'entity-0'
          timelines: ['timeline-0']
          delta: 2

    expect mappingFn.calls.count()
      .toBe 1
    expect mappingFn.calls.mostRecent().args
      .toEqual [1, 0, 'entity-0']
    expect outputStream
      .toBe 2 / @store.getState().timelines.dict['timeline-0'].length

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.ProgressEntityTimeline
        data:
          entity: 'entity-0'
          timelines: ['timeline-0']
          delta: 1

    expect outputStream
      .toBe 3 / @store.getState().timelines.dict['timeline-0'].length
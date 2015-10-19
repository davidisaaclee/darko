_ = require 'lodash'
{createStore} = require 'redux'
k = require '../src/ActionTypes'
hpReducer = require '../src/reducers/base'

ObjectSubsetMatcher = require './util/ObjectSubsetMatcher'
assertPure = require './util/assertPure'

getEntityByName = (entityDict, name) ->
  _.find (_.keys entityDict), (id) ->
    entityDict[id].name is name

describe 'construction', () ->
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

    initialData =
      color: 'green'
      position:
        x: 1
        y: -1

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.AddEntity
        data:
          initialData: initialData
          name: 'stephen'

    expect (Object.keys @store.getState().entities.dict).length
      .toBe 2
    mostRecentKey = 'entity-1'
    expect @store.getState().entities.dict[mostRecentKey].data
      .toEqual initialData
    expect @store.getState().entities.dict[mostRecentKey].name
      .toEqual 'stephen'


  it 'can add new timelines', () ->
    expect (Object.keys @store.getState().timelines.dict).length
      .toBe 0

    @store.dispatch
      type: k.AddTimeline
      data:
        length: 2

    expect (Object.keys @store.getState().timelines.dict).length
      .toBe 1
    expect @store.getState().timelines.dict['timeline-0']
      .toMatchObject
        length: 2
        shouldLoop: false


    @store.dispatch
      type: k.AddTimeline
      data:
        length: 1
        shouldLoop: true

    expect (Object.keys @store.getState().timelines.dict).length
      .toBe 2
    expect @store.getState().timelines.dict['timeline-1']
      .toMatchObject
        length: 1
        shouldLoop: true


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

    # doesn't re-add timeline to entity
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



describe 'honeypower', () ->
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


  it 'can progress timelines by entity', () ->
    expect @store.getState().entities.dict['entity-0'].attachedTimelines[0].progress
      .toBe 0
    timelineId = @store.getState().entities.dict['entity-0'].attachedTimelines[0].id
    expect @store.getState().timelines.dict[timelineId].shouldLoop
      .toBe false

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.ProgressEntityTimeline
        data:
          entity: 'entity-0'
          timeline: 'timeline-0'
          delta: 1

    expect @store.getState().entities.dict['entity-0'].attachedTimelines[0].progress
      .toBe 0.5

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.ProgressEntityTimeline
        data:
          entity: 'entity-0'
          timeline: 'timeline-0'
          delta: 1

    expect @store.getState().entities.dict['entity-0'].attachedTimelines[0].progress
      .toBe 1

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.ProgressEntityTimeline
        data:
          entity: 'entity-0'
          timeline: 'timeline-0'
          delta: 1

    expect @store.getState().entities.dict['entity-0'].attachedTimelines[0].progress
      .toBe 1

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.ProgressEntityTimeline
        data:
          entity: 'entity-0'
          timeline: 'timeline-0'
          delta: -3

    expect @store.getState().entities.dict['entity-0'].attachedTimelines[0].progress
      .toBe 0




  it 'can loop timelines', () ->
    expect @store.getState().entities.dict['entity-0'].attachedTimelines[0].progress
      .toBe 0
    timelineId = @store.getState().entities.dict['entity-0'].attachedTimelines[0].id
    expect @store.getState().timelines.dict[timelineId].shouldLoop
      .toBe false

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.SetTimelineLoop
        data:
          timeline: timelineId
          shouldLoop: true

    expect @store.getState().timelines.dict[timelineId].shouldLoop
      .toBe true

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.ProgressEntityTimeline
        data:
          entity: 'entity-0'
          timeline: 'timeline-0'
          delta: 1

    expect @store.getState().entities.dict['entity-0'].attachedTimelines[0].progress
      .toBe 0.5

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.ProgressEntityTimeline
        data:
          entity: 'entity-0'
          timeline: 'timeline-0'
          delta: 1

    expect @store.getState().entities.dict['entity-0'].attachedTimelines[0].progress
      .toBe 0

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.ProgressEntityTimeline
        data:
          entity: 'entity-0'
          timeline: 'timeline-0'
          delta: -3

    expect @store.getState().entities.dict['entity-0'].attachedTimelines[0].progress
      .toBe 0.5


  it 'can add new triggers', () ->
    expect @store.getState().timelines.dict['timeline-0'].triggers.length
      .toBe 0

    triggerActionSpy = (progress, id, data) -> data
    triggerActionSpy = jasmine.createSpy 'TriggerAction', triggerActionSpy
      .and.callThrough()
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
    triggerActionSpy = (progress, entityId, data) ->
      _.assign {}, data,
        foo: data.foo + 1
    triggerActionSpy = jasmine.createSpy 'TriggerAction', triggerActionSpy
      .and.callThrough()

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.UpdateEntityData
        data:
          entity: 'entity-0'
          changes:
            foo: 0

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
          timeline: 'timeline-0'
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
          timeline: 'timeline-0'
          delta: 1

    expect @store.getState().entities.dict['entity-0'].attachedTimelines[0].progress
      .toBeCloseTo 1
    expect triggerActionSpy.calls.count()
      .toBe 1
    expect triggerActionSpy.calls.mostRecent().args
      .toEqual [1, 'entity-0', foo: 0]
    expect @store.getState().entities.dict['entity-0'].data
      .toMatchObject
        foo: 1

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.ProgressEntityTimeline
        data:
          entity: 'entity-0'
          timeline: 'timeline-0'
          delta: -1

    expect @store.getState().entities.dict['entity-0'].attachedTimelines[0].progress
      .toBeCloseTo 0.5
    expect triggerActionSpy.calls.count()
      .toBe 2
    expect triggerActionSpy.calls.mostRecent().args
      .toEqual [0.5, 'entity-0', foo: 1]
    expect @store.getState().entities.dict['entity-0'].data
      .toMatchObject
        foo: 2



  it 'should trigger predicate-driven events', () ->
    triggerActionSpy = (progress, id, data) -> data
    triggerActionSpy = jasmine.createSpy 'TriggerAction', triggerActionSpy
      .and.callThrough()

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
          timeline: 'timeline-0'
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
          timeline: 'timeline-0'
          delta: 0.2

    expect @store.getState().entities.dict['entity-0'].attachedTimelines[0].progress
      .toBeCloseTo 0.2
    expect triggerActionSpy.calls.count()
      .toBe 1
    expect triggerActionSpy.calls.mostRecent().args
      .toEqual [0.2, 'entity-0', @store.getState().entities.dict['entity-0'].data]

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.ProgressEntityTimeline
        data:
          entity: 'entity-0'
          timeline: 'timeline-0'
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
          timeline: 'timeline-0'
          delta: 0.2

    expect @store.getState().entities.dict['entity-0'].attachedTimelines[0].progress
      .toBeCloseTo 0.4
    expect triggerActionSpy.calls.count()
      .toBe 2
    expect triggerActionSpy.calls.mostRecent().args
      .toEqual [0.4, 'entity-0', @store.getState().entities.dict['entity-0'].data]


  it 'can map values', () ->
    expect @store.getState().timelines.dict['timeline-0'].mappings.length
      .toBe 0

    mappingFn = (progress, entityId, data) ->
      progress: progress
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

    delta = 1.7
    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.ProgressEntityTimeline
        data:
          entity: 'entity-0'
          timeline: 'timeline-0'
          delta: delta

    expectedProgress =
      delta / @store.getState().timelines.dict['timeline-0'].length

    expect mappingFn.calls.count()
      .toBe 1
    expect mappingFn.calls.mostRecent().args
      .toEqual [expectedProgress, 'entity-0', {}]
    expect @store.getState().entities.dict['entity-0'].data.progress
      .toBe expectedProgress

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.ProgressEntityTimeline
        data:
          entity: 'entity-0'
          timeline: 'timeline-0'
          delta: 1

    expect @store.getState().entities.dict['entity-0'].data.progress
      .toBe 1 # clamped


  it 'can update entity data', () ->
    expect @store.getState().entities.dict['entity-0'].data.color
      .toBeUndefined

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.UpdateEntityData
        data:
          entity: 'entity-0'
          changes:
            color: 'red'

    expect @store.getState().entities.dict['entity-0'].data.color
      .toBe 'red'

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.UpdateEntityData
        data:
          entity: 'entity-0'
          changes:
            color: 'blue'

    expect @store.getState().entities.dict['entity-0'].data.color
      .toBe 'blue'

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.UpdateEntityData
        data:
          entity: 'entity-0'
          changes:
            position:
              x: -1
              y: 1

    expect @store.getState().entities.dict['entity-0'].data.position
      .toEqual x: -1, y: 1
    expect @store.getState().entities.dict['entity-0'].data.color
      .toBe 'blue'

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.UpdateEntityData
        data:
          entity: 'entity-0'
          changes:
            color: 'green'
            position:
              x: 1
              y: -1

    expect @store.getState().entities.dict['entity-0'].data.position
      .toEqual x: 1, y: -1
    expect @store.getState().entities.dict['entity-0'].data.color
      .toBe 'green'


  xit 'can progress timelines by timelines', () ->
    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.AddEntity
        data:
          name: 'bob'

      @store.dispatch
        type: k.AddEntity
        data:
          name: 'sue'

    bobId = getEntityByName @store.getState().entities.dict, 'bob'
    sueId = getEntityByName @store.getState().entities.dict, 'sue'

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.AttachEntityToTimeline
        data:
          entity: bobId
          timeline: 'timeline-0'

    expect @store.getState().entities.dict[bobId].attachedTimelines.length
      .toBe 1
    expect @store.getState().entities.dict[bobId].attachedTimelines[0]
      .toMatchObject
        progress: 0
        id: 'timeline-0'

    assertPure (() => @store.getState), () =>
      @store.dispatch
        type: k.ProgressTimeline
        data:
          timeline: 'timeline-0'
          delta: 1

    expect @store.getState().entities.dict[sueId].attachedTimelines[0]
      .toMatchObject
        progress: 0.5
        id: 'timeline-0'

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.AttachEntityToTimeline
        data:
          entity: sueId
          timeline: 'timeline-0'
    expect @store.getState().entities.dict[sueId].attachedTimelines.length
      .toBe 1
    expect @store.getState().entities.dict[sueId].attachedTimelines[0]
      .toMatchObject
        progress: 0
        id: 'timeline-0'

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.ProgressTimeline
        data:
          timeline: 'timeline-0'
          delta: 1

    # bob was further along, so his progress is different from sue's
    expect @store.getState().entities.dict[bobId].attachedTimelines[0]
      .toMatchObject
        progress: 1
        id: 'timeline-0'
    expect @store.getState().entities.dict[sueId].attachedTimelines[0]
      .toMatchObject
        progress: 0.5
        id: 'timeline-0'
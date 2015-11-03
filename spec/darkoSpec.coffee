###
To test:
- timeline looping
###

_ = require 'lodash'
{createStore} = require 'redux'
k = require '../src/ActionTypes'
hpReducer = require '../src/reducers/SceneReducer'

Scene = require '../src/model/Scene'
Entity = require '../src/model/Entity'
Timeline = require '../src/model/timelines/Timeline'
GenericTimeline = require '../src/model/timelines/GenericTimeline'

Timelines = require '../src/model/timelines/Timelines'

ObjectSubsetMatcher = require './util/ObjectSubsetMatcher'
clamp = require '../src/util/clamp'
# assertPure = require './util/assertPure'
assertPure = (__, p) -> do p # silly

getEntityByName = (entityDict, name) ->
  _.find (_.keys entityDict), (id) ->
    entityDict[id].name is name

describe 'SceneReducer:', () ->
  beforeEach () ->
    # Add the custom object matcher.
    # (see `./util/ObjectSubsetMatcher` for description of this matcher)
    ObjectSubsetMatcher jasmine

    # Make our initial store.
    @store = createStore hpReducer


  it 'AddEntity', () ->
    expect @store.getState().entities.size
      .toBe 0

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.AddEntity

    expect (Scene.getAllEntities @store.getState()).length
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
          id: 'stephenId'
          initialData: initialData
          name: 'stephen'

    scene = @store.getState()
    expect (Scene.getAllEntities scene).length
      .toBe 2
    expect Entity.getData (Scene.getEntity scene, 'stephenId')
      .toEqual initialData
    expect Entity.getId (Scene.getEntity scene, 'stephenId')
      .toEqual 'stephenId'
    expect Entity.getName (Scene.getEntity scene, 'stephenId')
      .toEqual 'stephen'


  # Removes the entity with the specified ID from the database.
  #
  #   id: String
  xit 'RemoveEntity', () ->
    @store.dispatch
      type: k.AddEntity
      data:
        id: 'e1'
        initialData:
          foo: 4
    @store.dispatch
      type: k.AddEntity
      data:
        id: 'e2'
        initialData:
          foo: 3

    expect (Scene.getAllEntities @store.getState()).length
      .toBe 2

    @store.dispatch
      type: k.RemoveEntity
      data:
        id: 'e1'

    expect (Scene.getAllEntities @store.getState()).length
      .toBe 1

    expect (Scene.getEntity @store.getState(), 'e1')
      .toBeUndefined()
    expect (Scene.getEntity @store.getState(), 'e2')
      .toBeDefined()
    expect Entity.getData (Scene.getEntity @store.getState(), 'e2')
      .toEqual foo: 3


  # Adds the specified timeline to the database.
  #
  #   [id: String]
  #   timeline: Timeline
  it 'AddTimeline', () ->
    expect (Scene.getAllEntities @store.getState()).length
      .toBe 0

    timeline1 = new GenericTimeline()

    @store.dispatch
      type: k.AddTimeline
      data:
        id: 'timeline1'
        timeline: timeline1

    expect (Scene.getAllTimelines @store.getState()).length
      .toBe 1
    expect (Scene.getTimeline @store.getState(), 'timeline1')
      .toBeDefined()


  it 'AttachEntityToTimeline', () ->
    timeline1 = new GenericTimeline 1, _.identity
    entityKey = 'myEntity'
    timelineKey = 'myTimeline'

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.AddEntity
        data:
          id: entityKey
      @store.dispatch
        type: k.AddTimeline
        data:
          id: timelineKey
          timeline: timeline1

    expect (Entity.getAttachedTimelines (Scene.getEntity @store.getState(), entityKey)).length
      .toBe 0

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.AttachEntityToTimeline
        data:
          entity: entityKey
          timeline: timelineKey

    state = @store.getState()

    expect (Entity.getAttachedTimelines (Scene.getEntity state, entityKey)).length
      .toBe 1
    hd = (Entity.getAttachedTimelines (Scene.getEntity state, entityKey))[0]
    expect hd.timeline
      .toBe timelineKey
    expect hd.progress
      .toBe 0

    # doesn't re-add timeline to entity
    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.AttachEntityToTimeline
        data:
          entity: entityKey
          timeline: timelineKey

    state = @store.getState()

    expect (Entity.getAttachedTimelines (Scene.getEntity state, entityKey)).length
      .toBe 1
    hd = (Entity.getAttachedTimelines (Scene.getEntity state, entityKey))[0]
    expect hd.timeline
      .toBe timelineKey
    expect hd.progress
      .toBe 0

  # this doesn't actually test that timelines reduce in order...
  it 'AttachEntityToTimeline (stack manipulation)', () ->
    timeline1 = new GenericTimeline 1, _.identity
    timeline2 = new GenericTimeline 2, _.identity
    timeline3 = new GenericTimeline 3, _.identity

    entityKey = 'myEntity'

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.AddEntity
        data:
          id: entityKey
      @store.dispatch
        type: k.AddTimeline
        data:
          id: 'timeline1'
          timeline: timeline1
      @store.dispatch
        type: k.AddTimeline
        data:
          id: 'timeline2'
          timeline: timeline2
      @store.dispatch
        type: k.AddTimeline
        data:
          id: 'timeline3'
          timeline: timeline3

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.AttachEntityToTimeline
        data:
          entity: entityKey
          timeline: 'timeline1'
          stackPosition: 0
      @store.dispatch
        type: k.AttachEntityToTimeline
        data:
          entity: entityKey
          timeline: 'timeline2'
          stackPosition: 0
      @store.dispatch
        type: k.AttachEntityToTimeline
        data:
          entity: entityKey
          timeline: 'timeline3'
          stackPosition: 1

    scene = @store.getState()
    entity = Scene.getEntity scene, entityKey
    expect _.map (Entity.getAttachedTimelines entity), 'timeline'
      .toEqual ['timeline2', 'timeline3', 'timeline1']



describe 'darko', () ->
  beforeEach () ->
    # Add the custom object matcher.
    # (see `./util/ObjectSubsetMatcher` for description of this matcher)
    ObjectSubsetMatcher jasmine

    # Make our initial store.
    @store = createStore hpReducer

    # Populate with a timeline and entity.
    @timelineFn = (progress, data) ->
      _.assign {}, data,
        foo: progress * 2
    myTimeline = new GenericTimeline 2, @timelineFn

    @timelineId = 'myTimeline'
    @entityId = 'myEntity'

    @store.dispatch
      type: k.AddTimeline
      data:
        id: @timelineId
        timeline: myTimeline

    @store.dispatch
      type: k.AddEntity
      data:
        id: @entityId

    # now kiss
    @store.dispatch
      type: k.AttachEntityToTimeline
      data:
        entity: @entityId
        timeline: @timelineId


  it 'can progress timelines by entity', () ->
    ent = Scene.getEntity @store.getState(), @entityId
    expect (Entity.getAttachedTimelines ent)[0].progress
      .toBe 0
    # expect (Scene.getTimeline @timelineId).shouldLoop
    #   .toBe false

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.ProgressEntityTimeline
        data:
          entity: @entityId
          timeline: @timelineId
          delta: 1

    scene = @store.getState()
    ent = Scene.getEntity scene, @entityId
    expect (Entity.getAttachedTimelines ent)[0].progress
      .toBe 0.5

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.ProgressEntityTimeline
        data:
          entity: @entityId
          timeline: @timelineId
          delta: 1

    scene = @store.getState()
    ent = Scene.getEntity scene, @entityId
    expect (Entity.getAttachedTimelines ent)[0].progress
      .toBe 1

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.ProgressEntityTimeline
        data:
          entity: @entityId
          timeline: @timelineId
          delta: 1

    scene = @store.getState()
    ent = Scene.getEntity scene, @entityId
    expect (Entity.getAttachedTimelines ent)[0].progress
      .toBe 1

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.ProgressEntityTimeline
        data:
          entity: @entityId
          timeline: @timelineId
          delta: -3

    scene = @store.getState()
    ent = Scene.getEntity scene, @entityId
    expect (Entity.getAttachedTimelines ent)[0].progress
      .toBe 0


  it 'can loop timelines', () ->
    scene = @store.getState()
    entity = Scene.getEntity scene, @entityId
    expect (Entity.getAttachedTimelines entity)[0].progress
      .toBe 0
    expect Timeline.getShouldLoop (Scene.getTimeline scene, @timelineId)
      .toBe false

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.SetTimelineLoop
        data:
          timeline: @timelineId
          shouldLoop: true

    scene = @store.getState()
    expect Timeline.getShouldLoop (Scene.getTimeline scene, @timelineId)
      .toBe true

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.ProgressEntityTimeline
        data:
          entity: @entityId
          timeline: @timelineId
          delta: 1

    scene = @store.getState()
    entity = Scene.getEntity scene, @entityId
    expect (Entity.getAttachedTimelines entity)[0].progress
      .toBe 0.5

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.ProgressEntityTimeline
        data:
          entity: @entityId
          timeline: @timelineId
          delta: 1

    scene = @store.getState()
    entity = Scene.getEntity scene, @entityId
    expect (Entity.getAttachedTimelines entity)[0].progress
      .toBe 0

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.ProgressEntityTimeline
        data:
          entity: @entityId
          timeline: @timelineId
          delta: -3

    scene = @store.getState()
    entity = Scene.getEntity scene, @entityId
    expect (Entity.getAttachedTimelines entity)[0].progress
      .toBe 0.5


  it 'updates entity data', () ->
    delta = 1
    preData = Entity.getData (Scene.getEntity @store.getState(), @entityId)

    # console.log Scene.getEntity @store.getState(), @entityId

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.ProgressEntityTimeline
        data:
          entity: @entityId
          timeline: @timelineId
          delta: delta

    expectedProgress =
      delta / (Scene.getTimeline @store.getState(), @timelineId).length
    expectedData = @timelineFn expectedProgress, preData

    expect Entity.getData Scene.getEntity @store.getState(), @entityId
      .toEqual expectedData

    delta2 = 1.2
    preData = Entity.getData (Scene.getEntity @store.getState(), @entityId)
    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.ProgressEntityTimeline
        data:
          entity: @entityId
          timeline: @timelineId
          delta: delta2

    ###
    Timeline length: 2
    Deltas: 1 + 1.2 = 2.2
    Progressed = Deltas / Timeline length = 1.1
      (Timeline doesn't loop, so should clamp to 1.)
    ###

    ent = Scene.getEntity @store.getState(), @entityId
    timelineLength = (Scene.getTimeline @store.getState(), @timelineId).length
    deltas = delta + delta2
    expectedProgress =
      deltas / timelineLength
    expectedProgress = clamp 0, 1, expectedProgress
    expectedData = @timelineFn expectedProgress, preData
    expect Entity.getData ent
      .toEqual expectedData

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.ProgressEntityTimeline
        data:
          entity: @entityId
          timeline: @timelineId
          delta: delta2
    ent = Scene.getEntity @store.getState(), @entityId
    timelineLength = (Scene.getTimeline @store.getState(), @timelineId).length
    expectedProgress =
      (delta + delta2) / timelineLength
    expectedProgress =
      clamp 0, 1, expectedProgress
    expect (Entity.getAttachedTimeline ent, @timelineId).progress
      .toEqual expectedProgress
    expectedData = @timelineFn expectedProgress, preData
    expect Entity.getData ent
      .toEqual expectedData

  it 'SetEntityLocalData', () ->
    scene = @store.getState()
    entity = Scene.getEntity scene, @entityId
    expect Entity.getLocalData entity
      .toEqual {}

    @store.dispatch
      type: k.SetEntityLocalData
      data:
        entity: @entityId
        localData:
          foo: 3

    scene = @store.getState()
    entity = Scene.getEntity scene, @entityId
    expect Entity.getLocalData entity
      .toEqual foo: 3

    @store.dispatch
      type: k.AddEntity
      data:
        id: 'michael'
        initialData:
          frog: 'drink'

    @store.dispatch
      type: k.SetEntityLocalData
      data:
        entity: @entityId
        localData:
          foo: 4

    scene = @store.getState()
    entity = Scene.getEntity scene, @entityId
    expect Entity.getLocalData entity
      .toEqual foo: 4

    # michael = Scene.getEntity scene, 'michael'
    # expect Entity.getLocalData michael
    #   .toEqual frog: 'drink'

    # @store.dispatch
    #   type: k.SetEntityLocalData
    #   data:
    #     entity: 'michael'
    #     localData:
    #       foo: 1

    # scene = @store.getState()
    # michael = Scene.getEntity scene, 'michael'
    # expect Entity.getLocalData michael
    #   .toEqual foo: 1

    # @store.dispatch
    #   type: k.SetEntityLocalData
    #   data:
    #     entity: @entityId
    #     localData:
    #       bar: true

    # scene = @store.getState()
    # entity = Scene.getEntity scene, @entityId
    # expect Entity.getLocalData entity
    #   .toEqual bar: true
    # michael = Scene.getEntity scene, 'michael'
    # expect Entity.getLocalData michael
    #   .toEqual foo: 1


  xit 'can update entity data', () ->
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
        timeline: 'timeline-0'

    assertPure (() => @store.getState()), () =>
      @store.dispatch
        type: k.ProgressTimeline
        data:
          timeline: 'timeline-0'
          delta: 1

    expect @store.getState().entities.dict[bobId].attachedTimelines[0]
      .toMatchObject
        progress: 0.5
        timeline: 'timeline-0'

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
        timeline: 'timeline-0'

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
        timeline: 'timeline-0'
    expect @store.getState().entities.dict[sueId].attachedTimelines[0]
      .toMatchObject
        progress: 0.5
        timeline: 'timeline-0'








  ###
  here be dead spec
  ###


  # xit 'can add new triggers', () ->
  #   expect @store.getState().timelines.dict['timeline-0'].triggers.length
  #     .toBe 0

  #   triggerActionSpy = (progress, id, data) -> data
  #   triggerActionSpy = jasmine.createSpy 'TriggerAction', triggerActionSpy
  #     .and.callThrough()
  #   assertPure (() => @store.getState()), () =>
  #     @store.dispatch
  #       type: k.AddTrigger
  #       data:
  #         timeline: 'timeline-0'
  #         position: 0.6
  #         action: triggerActionSpy

  #   expect @store.getState().timelines.dict['timeline-0'].triggers.length
  #     .toBe 1
  #   expect @store.getState().timelines.dict['timeline-0'].triggers[0]
  #     .toMatchObject
  #       position: 0.6
  #       action: triggerActionSpy

  #   expect triggerActionSpy.calls.count()
  #     .toBe 0


  # xit 'should trigger events when passed over', () ->
  #   triggerActionSpy = (progress, entityId, data) ->
  #     _.assign {}, data,
  #       foo: data.foo + 1
  #   triggerActionSpy = jasmine.createSpy 'TriggerAction', triggerActionSpy
  #     .and.callThrough()

  #   assertPure (() => @store.getState()), () =>
  #     @store.dispatch
  #       type: k.UpdateEntityData
  #       data:
  #         entity: 'entity-0'
  #         changes:
  #           foo: 0

  #   assertPure (() => @store.getState()), () =>
  #     @store.dispatch
  #       type: k.AddTrigger
  #       data:
  #         timeline: 'timeline-0'
  #         position: 0.6
  #         action: triggerActionSpy

  #     @store.dispatch
  #       type: k.ProgressEntityTimeline
  #       data:
  #         entity: 'entity-0'
  #         timeline: 'timeline-0'
  #         delta: 1

  #   expect @store.getState().entities.dict['entity-0'].attachedTimelines[0].progress
  #     .toBeCloseTo 0.5
  #   expect triggerActionSpy.calls.count()
  #     .toBe 0

  #   assertPure (() => @store.getState()), () =>
  #     @store.dispatch
  #       type: k.ProgressEntityTimeline
  #       data:
  #         entity: 'entity-0'
  #         timeline: 'timeline-0'
  #         delta: 1

  #   expect @store.getState().entities.dict['entity-0'].attachedTimelines[0].progress
  #     .toBeCloseTo 1
  #   expect triggerActionSpy.calls.count()
  #     .toBe 1
  #   expect triggerActionSpy.calls.mostRecent().args
  #     .toEqual [1, 'entity-0', foo: 0]
  #   expect @store.getState().entities.dict['entity-0'].data
  #     .toMatchObject
  #       foo: 1

  #   assertPure (() => @store.getState()), () =>
  #     @store.dispatch
  #       type: k.ProgressEntityTimeline
  #       data:
  #         entity: 'entity-0'
  #         timeline: 'timeline-0'
  #         delta: -1

  #   expect @store.getState().entities.dict['entity-0'].attachedTimelines[0].progress
  #     .toBeCloseTo 0.5
  #   expect triggerActionSpy.calls.count()
  #     .toBe 2
  #   expect triggerActionSpy.calls.mostRecent().args
  #     .toEqual [0.5, 'entity-0', foo: 1]
  #   expect @store.getState().entities.dict['entity-0'].data
  #     .toMatchObject
  #       foo: 2


  # xit 'should respect trigger order within progress change', () ->
  #   triggerActionFn = (callId) -> (progress, entityId, data) ->
  #     _.assign {}, data,
  #       callOrder: [data.callOrder..., callId]
  #   triggerActionSpy0 = jasmine.createSpy 'TriggerAction', (triggerActionFn 'spy0')
  #     .and.callThrough()
  #   triggerActionSpy1 = jasmine.createSpy 'TriggerAction', (triggerActionFn 'spy1')
  #     .and.callThrough()
  #   triggerActionSpy2 = jasmine.createSpy 'TriggerAction', (triggerActionFn 'spy2')
  #     .and.callThrough()

  #   assertPure (() => @store.getState()), () =>
  #     @store.dispatch
  #       type: k.UpdateEntityData
  #       data:
  #         entity: 'entity-0'
  #         changes:
  #           callOrder: []

  #     @store.dispatch
  #       type: k.AddTrigger
  #       data:
  #         timeline: 'timeline-0'
  #         position: 0.6
  #         action: triggerActionSpy0

  #     @store.dispatch
  #       type: k.AddTrigger
  #       data:
  #         timeline: 'timeline-0'
  #         position: 0.65
  #         action: triggerActionSpy1

  #     @store.dispatch
  #       type: k.AddTrigger
  #       data:
  #         timeline: 'timeline-0'
  #         position: 0.62
  #         action: triggerActionSpy2

  #     @store.dispatch
  #       type: k.ProgressEntityTimeline
  #       data:
  #         entity: 'entity-0'
  #         timeline: 'timeline-0'
  #         delta: 2

  #   expect @store.getState().entities.dict['entity-0'].data.callOrder
  #     .toEqual ['spy0', 'spy2', 'spy1']

  #   assertPure (() => @store.getState()), () =>
  #     @store.dispatch
  #       type: k.UpdateEntityData
  #       data:
  #         entity: 'entity-0'
  #         changes:
  #           callOrder: []

  #     @store.dispatch
  #       type: k.ProgressEntityTimeline
  #       data:
  #         entity: 'entity-0'
  #         timeline: 'timeline-0'
  #         delta: -1

  #   expect @store.getState().entities.dict['entity-0'].data.callOrder
  #     .toEqual ['spy1', 'spy2', 'spy0']


  # # TODO: Uncertain about this spec now. Maybe xit should be changed to edge
  # #       detection? Or maybe keep xit simple.
  # xit 'should trigger predicate-driven events', () ->
  #   triggerActionSpy = (progress, id, data) -> data
  #   triggerActionSpy = jasmine.createSpy 'TriggerAction', triggerActionSpy
  #     .and.callThrough()

  #   assertPure (() => @store.getState()), () =>
  #     @store.dispatch
  #       type: k.AddTrigger
  #       data:
  #         timeline: 'timeline-0'
  #         position: (progress, prevProgress) ->
  #           (progress isnt prevProgress) and
  #           (progress % 0.2) is 0
  #         action: triggerActionSpy

  #     @store.dispatch
  #       type: k.ProgressEntityTimeline
  #       data:
  #         entity: 'entity-0'
  #         timeline: 'timeline-0'
  #         delta: 0.2

  #   expect @store.getState().entities.dict['entity-0'].attachedTimelines[0].progress
  #     .toBeCloseTo 0.1
  #   expect triggerActionSpy.calls.count()
  #     .toBe 0

  #   assertPure (() => @store.getState()), () =>
  #     @store.dispatch
  #       type: k.ProgressEntityTimeline
  #       data:
  #         entity: 'entity-0'
  #         timeline: 'timeline-0'
  #         delta: 0.2

  #   expect @store.getState().entities.dict['entity-0'].attachedTimelines[0].progress
  #     .toBeCloseTo 0.2
  #   expect triggerActionSpy.calls.count()
  #     .toBe 1
  #   expect triggerActionSpy.calls.mostRecent().args
  #     .toEqual [0.2, 'entity-0', @store.getState().entities.dict['entity-0'].data]

  #   assertPure (() => @store.getState()), () =>
  #     @store.dispatch
  #       type: k.ProgressEntityTimeline
  #       data:
  #         entity: 'entity-0'
  #         timeline: 'timeline-0'
  #         delta: 0.2

  #   expect @store.getState().entities.dict['entity-0'].attachedTimelines[0].progress
  #     .toBeCloseTo 0.3
  #   expect triggerActionSpy.calls.count()
  #     .toBe 1

  #   assertPure (() => @store.getState()), () =>
  #     @store.dispatch
  #       type: k.ProgressEntityTimeline
  #       data:
  #         entity: 'entity-0'
  #         timeline: 'timeline-0'
  #         delta: 0.2

  #   expect @store.getState().entities.dict['entity-0'].attachedTimelines[0].progress
  #     .toBeCloseTo 0.4
  #   expect triggerActionSpy.calls.count()
  #     .toBe 2
  #   expect triggerActionSpy.calls.mostRecent().args
  #     .toEqual [0.4, 'entity-0', @store.getState().entities.dict['entity-0'].data]

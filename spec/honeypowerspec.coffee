{createStore} = require 'redux'
k = require '../src/actionTypes'
hp = require '../src/honeypower'


describe 'timeline actions', () ->
  beforeEach () ->
    @store = createStore hp.timelineReducer

  it 'should respond to delta time', () ->
    expect @store.getState().entities['entity1'].attachedTimelines[0].progress
      .toBe 0

    @store.dispatch {type: k.DeltaTime, delta: 1}
    expect @store.getState().entities['entity1'].attachedTimelines[0].progress
      .toBe 0.5

    @store.dispatch {type: k.DeltaTime, delta: 1}
    expect @store.getState().entities['entity1'].attachedTimelines[0].progress
      .toBe 1
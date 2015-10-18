_ = require 'lodash'
redux = require 'redux'
k = require '../../src/ActionTypes'
reducer = require '../../src/reducers/base'

domState = {}
container = document.getElementById 'container'


update = (state, dispatch) ->
  console.log state
  {added, removed} = diffKeys domState, state.entities.dict
  added.forEach (key) ->
    elt = document.createElement 'div'
    elt.classList.add 'entity'
    container.appendChild elt
    domState[key] = elt

    dispatch
      type: k.AttachEntityToTimeline
      data:
        entity: key
        timeline: 'timeline-0'
  removed.forEach (key) ->
    domState[key].remove()
    delete domState[key]

  Object.keys domState
    .forEach (key) ->
      position = state.entities.dict[key].data.position
      domState[key].style.left = "#{position.x}px"
      domState[key].style.top = "#{position.y}px"


diffKeys = (previous, current) ->
  added: (Object.keys current).filter (key) -> not previous[key]?
  removed: (Object.keys previous).filter (key) -> not current[key]?

setup = () ->
  store = redux.createStore reducer

  setupTimelines store.dispatch
  setupInteractions store.dispatch, store

  store.subscribe () ->
    update store.getState(), store.dispatch

setupTimelines = (dispatch) ->
  dispatch
    type: k.AddTimeline
    data:
      length: 1
      loop: true

  dispatch
    type: k.AddMapping
    data:
      timeline: 'timeline-0'
      mapping: (progress, entityId, entityData) ->
        _.assign {}, entityData,
          position:
            x: progress * 100
            y: progress * 100

setupInteractions = (dispatch, store) ->
  addEntityButton = document.getElementById 'add-entity'
  addEntityButton.addEventListener 'click', () ->
    dispatch
      type: k.AddEntity
      data:
        initialData:
          position:
            x: 0
            y: 0

    mostRecentEntityKey =
      _.last (Object.keys store.getState().entities.dict)

    # dispatch
    #   type: k.AttachEntityToTimeline
    #   data:
    #     entity: mostRecentEntityKey
    #     timeline: 'timeline-0'

  timelineSlider = document.getElementById 'timeline-slider'
  getTimelineValue = () -> timelineSlider.value / 100
  previousSliderValue = getTimelineValue()
  timelineSlider.addEventListener 'input', (evt) ->
    Object.keys domState
      .forEach (entityId) ->
        dispatch
          type: k.ProgressEntityTimeline
          data:
            entity: entityId
            timelines: ['timeline-0']
            delta: getTimelineValue() - previousSliderValue

    previousSliderValue = getTimelineValue()

do setup
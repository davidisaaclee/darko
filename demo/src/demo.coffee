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
      data = state.entities.dict[key].data
      domState[key].style.left = "#{data.position.x}px"
      domState[key].style.top = "#{data.position.y}px"
      domState[key].style.strokeColor = data.strokeColor


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
      shouldLoop: true

  dispatch
    type: k.AddMapping
    data:
      timeline: 'timeline-0'
      mapping: (progress, entityId, entityData) ->
        _.assign {}, entityData,
          position:
            x: progress * 100
            y: progress * 100

  dispatch
    type: k.AddTrigger
    data:
      timeline: 'timeline-0'
      position: 0.5
      action: (progress, entityId, entityData) ->
        _.assign {}, entityData,
          strokeColor: randomColor()

setupInteractions = (dispatch, store) ->
  addEntityButton = document.getElementById 'add-entity'
  addEntityButton.addEventListener 'click', () ->
    dispatch
      type: k.AddEntity
      data:
        initialData:
          strokeColor: 'black'
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



# --- Helpers

randomColor = () ->
  "rgba(#{Math.random()}, #{Math.random()}, #{Math.random()}, 0.3)"
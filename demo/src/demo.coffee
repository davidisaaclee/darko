_ = require 'lodash'
redux = require 'redux'
k = require '../../src/ActionTypes'
reducer = require '../../src/reducers/base'

domState = {}

update = (state, dispatch) ->
  console.log state
  # {added, removed} = diffKeys domState, state.entities.dict
  # added.forEach (key) ->
  #   elt = document.createElement 'div'
  #   elt.
  #   domState[key] =


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
      mapping: (progress, prevProgress, entity) ->
        dispatch
          type: k.UpdateEntityData
          data:
            entity: entity
            changes:
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

    dispatch
      type: k.AttachEntityToTimeline
      data:
        entity: mostRecentEntityKey
        timeline: 'timeline-0'

  timelineSlider = document.getElementById 'timeline-slider'
  getTimelineValue = () -> timelineSlider.value / 100
  previousSliderValue = getTimelineValue()
  timelineSlider.addEventListener 'input', (evt) ->
    dispatch
      type: k.ProgressEntityTimeline
      data:
        entity: 'entity-0'
        timelines: ['timeline-0']
        delta: getTimelineValue() - previousSliderValue

    previousSliderValue = getTimelineValue()

do setup
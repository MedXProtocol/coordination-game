import { createStore, applyMiddleware, compose } from 'redux'
import sagas from './sagas'
import reducers from './reducers'
import { sagaMiddleware }  from './sagaMiddleware'

const debug = require('debug')('actions')

function logger({ getState }) {
  return next => action => {
    debug(action.type, action)
    return next(action)
  }
}

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export const store = createStore(
  reducers,
  composeEnhancers(applyMiddleware(logger, sagaMiddleware))
)

sagaMiddleware.run(sagas)

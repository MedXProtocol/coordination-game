import { combineReducers } from 'redux'
import { reducers as sagaGenesis } from 'saga-genesis'
import { reducer as toastr } from 'react-redux-toastr'

export default combineReducers({
  toastr,
  sagaGenesis
})

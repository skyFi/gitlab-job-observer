import { combineReducers, createStore } from 'redux';
import project from './project';
const rootReducer = combineReducers({
  project,
});

export default initialState => {
  return createStore(rootReducer, initialState);
};

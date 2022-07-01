import productReducer from './productReducer';
import { combineReducers } from 'redux';

const rootReducer = combineReducers({
  prods: productReducer
});

export default rootReducer;

import { getAllProducts } from '../../api/jenkins';

export const preLoadprods = () => {
  return (dispatch, getState) => {
    getAllProducts()
      .then(response => {
        if (response.data.length > 0) {
          dispatch({ type: 'PRELOAD_SUCCESS', productList: response.data });
        }
      })
      .catch(err => {
        console.log('error', err);
        dispatch({ type: 'PRELOAD_FAILED' });
      });
  };
};

export const selectProd = selectedProd => {
  return (dispatch, getState) => {
    dispatch({ type: 'SELECT_PROD', selectedProd: selectedProd });
  };
};

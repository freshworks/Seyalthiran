const initState = {
  productList: [],
  selectedProd: null
};

const productReducer = (state = initState, action) => {
  switch (action.type) {
    case 'PRELOAD_SUCCESS':
      return {
        ...state,
        productList: action.productList
      };
    case 'PRELOAD_FAILED':
      return state;
    case 'SELECT_PROD':
      return {
        ...state,
        selectedProd: action.selectedProd
      };
    default:
      return state;
  }
};

export default productReducer;

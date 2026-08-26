export { speechRecognitionService } from './speechRecognitionService';
export { fetchLiveLocation, ensureLocationPermission, getCurrentCoordinates, reverseGeocodeGoogle } from './locationService';
export { sendOtp, verifyOtp, refreshSession } from './authService';
export { apiRequest, ApiError, getApiBaseUrl } from './apiClient';
export {
  getValidAccessToken,
  refreshAuthSession,
  authenticatedApiRequest,
  authenticatedFetch,
} from './authTokenManager';
export {
  saveAuthSession,
  loadAuthSession,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  clearAuthSession,
} from './tokenStorage';
export type { AuthSession } from './tokenStorage';
export {
  fetchAddressesFromApi,
  createAddressOnApi,
  updateAddressOnApi,
  deleteAddressOnApi,
} from './addressApiService';
export {
  createCheckoutOrder,
  fetchOrders,
  fetchOrderById,
  peekOrdersCache,
  invalidateOrdersCache,
  seedOrderInCache,
} from './orderService';
export {
  fetchProducts,
  fetchProductsPage,
  fetchProductById,
  searchProducts,
  searchProductsPage,
  fetchSimilarProducts,
  fetchCategories,
} from './productService';
export {
  getSavedAddresses,
  getCachedAddresses,
  saveAddress,
  deleteAddress,
  setDefaultAddress,
  getSelectedAddressId,
  setSelectedAddressId,
  getSelectedAddress,
  loadAddressSnapshot,
  readAddressSnapshotFromCache,
} from './addressStorage';

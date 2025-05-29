import axios, { InternalAxiosRequestConfig, AxiosError } from 'axios';
import * as Keychain from 'react-native-keychain';
import store from '../store'; // Import store to access state and dispatch actions
import { loginSuccess, logout } from '../store/slices/authSlice'; // Import actions
import { Platform } from 'react-native'; // Import Platform
// Import the base URL from .env
// Note: Ensure you have run `npm install --save-dev react-native-dotenv`
// and configured babel.config.js with the 'module:react-native-dotenv' plugin.
import { API_BASE_URL } from '@env';

// Define the base URL for the API
const ANDROID_EMULATOR_HOST = '10.0.2.2';
const IOS_SIMULATOR_HOST = 'localhost';
const DEFAULT_PORT = '8000';

// Determine host based on platform
const host = Platform.OS === 'android' ? ANDROID_EMULATOR_HOST : IOS_SIMULATOR_HOST;

// Use API_BASE_URL from .env if available, otherwise construct based on platform
const envApiBaseUrl = API_BASE_URL || `http://${host}:${DEFAULT_PORT}`;

// Ensure the URL ends with /api
const effectiveApiBaseUrl = envApiBaseUrl.endsWith('/api')
  ? envApiBaseUrl
  : `${envApiBaseUrl.replace(/\/$/, '')}/api`; // Remove trailing slash before adding /api

console.log(`Using API Base URL: ${effectiveApiBaseUrl}`); // Log the URL being used

// Create an Axios instance
const apiClient = axios.create({
  baseURL: effectiveApiBaseUrl, // Use the determined URL
  headers: {
    'Content-Type': 'application/json',
  },
  // timeout: 10000, // Optional timeout
});

// Flag to prevent multiple concurrent token refresh attempts
let isRefreshing = false;
// Array to hold requests waiting for token refresh
let failedQueue: { resolve: (value: unknown) => void; reject: (reason?: any) => void }[] = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// --- Request Interceptor ---
// Adds the current access token to the Authorization header of outgoing requests.
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = store.getState().auth.token; // Get token from Redux store
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Response Interceptor ---
// Handles API errors, specifically 401 Unauthorized for token refresh.
apiClient.interceptors.response.use(
  (response) => {
    // Any status code within the range of 2xx causes this function to trigger
    return response;
  },
  async (error: AxiosError) => {
    // Any status codes outside the range of 2xx cause this function to trigger
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Check if it's a 401 error and not a retry already
    if (error.response?.status === 401 && !originalRequest._retry) {

      if (isRefreshing) {
        // If already refreshing, queue the failed request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return apiClient(originalRequest); // Retry with new token
        }).catch(err => {
          return Promise.reject(err); // Propagate refresh error
        });
      }

      originalRequest._retry = true; // Mark as retry
      isRefreshing = true;

      try {
        console.log('Attempting token refresh via interceptor...');
        // Retrieve the refresh token (assuming it was stored during login/startup check)
        // It might be safer to get it from Keychain again if the store could be stale
        const refreshCredentials = await Keychain.getGenericPassword({ service: 'refreshToken' });
        const storedRefreshToken = refreshCredentials ? refreshCredentials.password : null;
        // Fallback to store if needed, though Keychain is preferred for persistence
        const refreshToken = storedRefreshToken ?? store.getState().auth.refreshToken;


        if (!refreshToken) {
          console.error('No refresh token available for refresh attempt.');
          store.dispatch(logout()); // Logout if no refresh token
          isRefreshing = false;
          processQueue(error, null); // Reject queued requests
          return Promise.reject(error);
        }

        // Call the refresh endpoint (ensure this endpoint doesn't use the interceptor to avoid loops)
        // One way is to create a separate Axios instance for refresh, or configure this one carefully.
        // For simplicity here, we assume the refresh endpoint itself doesn't require the expiring token.
        // Use effectiveApiBaseUrl for the refresh call as well
        const refreshResponse = await axios.post(`${effectiveApiBaseUrl}/auth/refresh/`, { refresh: refreshToken });
        const newAccessToken = refreshResponse.data.access;
        // Note: The refresh endpoint might also return a new refresh token if rotation is enabled. Handle that if necessary.
        const newRefreshToken = refreshResponse.data.refresh ?? refreshToken; // Use new if provided, else keep old

        if (!newAccessToken) {
          throw new Error('Invalid response from refresh endpoint.');
        }

        console.log('Token refresh successful via interceptor.');

        // Update the stored tokens and Redux state
        const currentUser = store.getState().auth.user; // Get current user data
        if (currentUser) {
            const userIdOrEmail = currentUser.id.toString() || currentUser.email;
            await Keychain.setGenericPassword(userIdOrEmail, newAccessToken, { service: 'accessToken' });
            if (newRefreshToken !== refreshToken) { // Store new refresh token if rotated
                await Keychain.setGenericPassword(userIdOrEmail, newRefreshToken, { service: 'refreshToken' });
            }
            // Dispatch loginSuccess to update token in Redux state AND update default header
            store.dispatch(loginSuccess({ user: currentUser, token: newAccessToken, refreshToken: newRefreshToken }));
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

            // Process the queue with the new token
            processQueue(null, newAccessToken);

            // Retry the original request with the new token
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
        } else {
             throw new Error('User data not found during token refresh.');
        }

      } catch (refreshError: any) {
        console.error('Token refresh failed via interceptor:', refreshError.response?.data || refreshError.message || refreshError);
        // If refresh fails, clear tokens, log out, reject queue
        await Keychain.resetGenericPassword({ service: 'accessToken' });
        await Keychain.resetGenericPassword({ service: 'refreshToken' });
        delete apiClient.defaults.headers.common['Authorization'];
        store.dispatch(logout());
        processQueue(refreshError, null);
        isRefreshing = false;
        return Promise.reject(refreshError); // Reject the original request's promise
      } finally {
        isRefreshing = false; // Ensure flag is reset
      }
    }

    // Handle other errors (e.g., network errors, non-401 status codes)
    console.error('API Error (Interceptor):', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error); // Reject the promise for non-401 errors or if retry failed
  }
);

export default apiClient;

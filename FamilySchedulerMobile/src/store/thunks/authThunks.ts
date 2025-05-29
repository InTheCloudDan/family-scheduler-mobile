import { createAsyncThunk } from '@reduxjs/toolkit';
import * as Keychain from 'react-native-keychain';
import apiClient from '../../services/api';
import { loginSuccess, logout } from '../slices/authSlice'; // Import actions

// Define the type for the user object returned by the /users/me/ endpoint
// Adjust based on the actual API response structure
interface UserProfile {
  id: number;
  email: string;
  first_name: string; // Assuming snake_case from Django API
  last_name: string;
  // Add other fields as returned by the API
}

// Thunk to check for stored auth token on app startup
export const checkAuthToken = createAsyncThunk(
  'auth/checkAuthToken',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // 1. Attempt to retrieve the access token from Keychain
      const credentials = await Keychain.getGenericPassword({ service: 'accessToken' });

      if (!credentials || !credentials.password) {
        // No token found, user is not logged in
        console.log('No stored access token found.');
        // Dispatch logout just in case there's lingering state (optional but safe)
        dispatch(logout());
        return { isAuthenticated: false }; // Indicate check complete, not authenticated
      }

      const accessToken = credentials.password;
      console.log('Stored access token found.');

      // 2. Set the token in the apiClient header for validation request
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      try {
        // 3. Validate the token by fetching user profile
        const validationUrl = `${apiClient.defaults.baseURL}/users/me/`;
        console.log(`Attempting to validate token via GET: ${validationUrl}`); // Log the full URL
        const response = await apiClient.get<UserProfile>('/users/me/');
        const user = response.data;

        // Map snake_case to camelCase if needed by the User interface in authSlice
        const mappedUser = {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            // map other fields...
        };

        console.log('Access token validated successfully.');

        // 4. If valid, dispatch loginSuccess with user data and token
        // Retrieve refresh token if stored separately (optional)
        const refreshCredentials = await Keychain.getGenericPassword({ service: 'refreshToken' });
        const refreshToken = refreshCredentials ? refreshCredentials.password : null;

        // Ensure refreshToken is string or undefined, not null
        dispatch(loginSuccess({ user: mappedUser, token: accessToken, refreshToken: refreshToken ?? undefined }));
        return { isAuthenticated: true }; // Indicate check complete, authenticated

      } catch (validationError: any) {
        console.log('Access token validation failed:', validationError.response?.status);

        // --- Token Refresh Logic (Optional but Recommended) ---
        if (validationError.response?.status === 401) { // Unauthorized, likely expired token
          console.log('Attempting token refresh...');
          try {
            const refreshCredentials = await Keychain.getGenericPassword({ service: 'refreshToken' });
            if (!refreshCredentials || !refreshCredentials.password) {
              throw new Error('No refresh token available.');
            }
            const refreshToken = refreshCredentials.password;

            // Call the refresh endpoint
            const refreshResponse = await apiClient.post('/auth/refresh/', { refresh: refreshToken });
            const newAccessToken = refreshResponse.data.access;

            if (!newAccessToken) {
              throw new Error('Invalid response from refresh endpoint.');
            }

            console.log('Token refresh successful.');

            // Store the new access token
            // Use the same username (user ID or email) used when storing initially
            const userIdOrEmail = credentials.username; // Get username used to store original token
            await Keychain.setGenericPassword(userIdOrEmail, newAccessToken, { service: 'accessToken' });

            // Update apiClient header with the new token
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

            // Retry fetching user profile with the new token
            const retryResponse = await apiClient.get<UserProfile>('/users/me/');
            const user = retryResponse.data;
            const mappedUser = {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
            };

            // Dispatch loginSuccess with new token and user data
            // Ensure refreshToken is string or undefined, not null
            dispatch(loginSuccess({ user: mappedUser, token: newAccessToken, refreshToken: refreshToken ?? undefined })); // Keep old refresh token for now, API might rotate it
            return { isAuthenticated: true };

          } catch (refreshError: any) {
            console.error('Token refresh failed:', refreshError.message || refreshError);
            // If refresh fails, clear tokens and log out
            await Keychain.resetGenericPassword({ service: 'accessToken' });
            await Keychain.resetGenericPassword({ service: 'refreshToken' });
            delete apiClient.defaults.headers.common['Authorization'];
            dispatch(logout());
            return { isAuthenticated: false };
          }
        } else {
          // Handle other validation errors (e.g., network error, server error)
          throw validationError; // Re-throw other errors
        }
      }
    } catch (error: any) {
      console.error('Error during auth check:', error);
      // Ensure cleanup and logout on any unexpected error
      await Keychain.resetGenericPassword({ service: 'accessToken' });
      await Keychain.resetGenericPassword({ service: 'refreshToken' });
      delete apiClient.defaults.headers.common['Authorization'];
      dispatch(logout());
      // Use rejectWithValue to pass error info if needed, but for startup check, just ensuring logout might be enough
      return rejectWithValue(error.message || 'Authentication check failed');
    }
  }
);

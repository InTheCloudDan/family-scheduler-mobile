import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { checkAuthToken } from '../thunks/authThunks'; // Import the async thunk
// Import RootState if needed for selectors, but usually not directly in the slice
// import type { RootState } from '../rootReducer';

// Define the shape of the user data (adjust based on actual API response)
interface User {
  id: number;
  email: string;
  firstName: string; // Assuming these fields exist
  lastName: string;
  // Add other relevant user fields
}

// Define the shape of the authentication state
interface AuthState {
  user: User | null;
  token: string | null; // Store the access token
  refreshToken: string | null; // Store the refresh token if applicable
  isAuthenticated: boolean;
  isLoading: boolean; // For login/register specific loading
  isAppLoading: boolean; // For initial app load/token check loading
  error: string | null;
}

// Define the initial state
const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  isAppLoading: true, // Start as true until initial check is done
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Action to indicate login process is starting
    loginStart(state) {
      state.isLoading = true;
      state.isAppLoading = false; // Ensure app loading is false if login starts
      state.error = null;
    },
    // Action for successful login
    loginSuccess(state, action: PayloadAction<{ user: User; token: string; refreshToken?: string }>) {
      state.isLoading = false;
      state.isAppLoading = false; // Ensure app loading is false on success
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken ?? null; // Handle optional refresh token
      state.error = null;
    },
    // Action for login failure
    loginFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.error = action.payload;
      state.isAppLoading = false; // Ensure app loading is false on failure
    },
    // Action for logout
    logout(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.error = null;
      state.isLoading = false;
      state.isAppLoading = false; // Ensure app loading is false on logout
    },
    // Action to indicate initial token check is complete
    appLoadComplete(state) {
      state.isAppLoading = false;
    },
    // Action to clear authentication errors
    clearAuthError(state) {
      state.error = null;
    },
    // Potentially add actions for registration, token refresh, loading persisted token etc.
  },
  // Handle lifecycle actions for async thunks
  extraReducers: (builder) => {
    builder
      .addCase(checkAuthToken.pending, (_state) => { // Prefix unused state
        // Optionally handle pending state if needed, though isAppLoading is already true initially
        // _state.isAppLoading = true; // Ensure it's true when check starts
      })
      .addCase(checkAuthToken.fulfilled, (state, _action) => { // Prefix unused action
        // Check is done, whether successful or not in finding a token
        state.isAppLoading = false;
        // Note: loginSuccess or logout is dispatched *within* the thunk,
        // so we don't need to set isAuthenticated here based on action.payload.isAuthenticated
      })
      .addCase(checkAuthToken.rejected, (state, action) => {
        // Check failed (e.g., network error before validation, or rejectWithValue called)
        state.isAppLoading = false;
        state.isAuthenticated = false; // Ensure logged out on rejection
        state.error = action.payload as string ?? action.error.message ?? 'Failed to check authentication status.';
        console.error("Auth check rejected:", action.payload || action.error);
      });
    // Add cases for other async thunks here if needed
  },
});

// Export actions
export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  appLoadComplete, // Export new action
  clearAuthError,
} = authSlice.actions;

// Export reducer
export default authSlice.reducer;

// Optional: Selectors (can also be defined elsewhere)
// export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
// export const selectUser = (state: RootState) => state.auth.user;
// export const selectAuthLoading = (state: RootState) => state.auth.isLoading;
// export const selectAuthError = (state: RootState) => state.auth.error;

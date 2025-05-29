import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../services/api';
import { RootState } from '../rootReducer';

// Define the shape of a single notification (adjust based on API)
interface Notification {
  id: number;
  recipient: number; // User ID
  verb: string; // e.g., 'invited you to', 'assigned task'
  target_content_type?: string; // e.g., 'events.event'
  target_object_id?: number;
  action_object_content_type?: string;
  action_object_object_id?: number;
  created_at: string; // ISO 8601 format string (Corrected field)
  updated_at: string; // ISO 8601 format string (Corrected field)
  unread: boolean;
  // Add description or other fields if provided by API
  description?: string; // Example: "John Doe invited you to 'Team Meeting'"
  // Add other fields seen in the screenshot if needed
  data?: any; // Generic data field seen in screenshot
  notification_type?: string; // e.g., "vacation_quest_completed"
  object_id?: number; // Seems redundant with target_object_id, but present
  priority?: string; // e.g., "MEDIUM"
  read_at?: string | null; // Seen in screenshot
  source_object_type?: string; // e.g., "vacationplan"
  title?: string; // e.g., "Vacation Quest Completed"
  message?: string; // e.g., "You've completed the quest..."
  is_read?: boolean; // Seems redundant with unread, but present
}

// Define the shape of the notifications state
interface NotificationsState {
  items: Notification[]; // Store recent notifications
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

// Async thunk to fetch recent notifications
// Adjust API endpoint and parameters as needed
export const fetchRecentNotifications = createAsyncThunk<
  { results: Notification[], unread_count: number }, // Expected API response structure
  void,
  { state: RootState; rejectValue: string }
>(
  'notifications/fetchRecent',
  async (_, { rejectWithValue }) => {
    try {
      // Example: Fetch latest 10 notifications, including unread count
      const response = await apiClient.get('/notifications/?limit=10');
      // Assuming API returns { results: [...], unread_count: number }
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch recent notifications:", error);
      const message = error.response?.data?.detail || error.message || 'Failed to fetch notifications';
      return rejectWithValue(message);
    }
  }
);

// TODO: Add thunk/action for marking notifications as read

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearNotificationsError(state) {
        state.error = null;
    }
    // Add other notification-related reducers later (markAsRead, etc.)
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecentNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRecentNotifications.fulfilled, (state, action: PayloadAction<{ results: Notification[], unread_count: number }>) => {
        state.isLoading = false;
        state.items = action.payload.results; // Store fetched recent notifications
        state.unreadCount = action.payload.unread_count;
        state.error = null;
      })
      .addCase(fetchRecentNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to fetch recent notifications';
      });
  },
});

export const { clearNotificationsError } = notificationsSlice.actions;
export default notificationsSlice.reducer;

import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../services/api';
import { RootState } from '../rootReducer'; // Import RootState for thunk typings
import { Platform } from 'react-native';

// Define user structure (simplified for associated users)
interface AssociatedUser {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string; // Assuming API might provide this
}

// Define calendar structure (simplified)
interface CalendarInfo {
    id: number | string; // Internal (number) or External (string) ID
    name: string;
    associated_users?: AssociatedUser[]; // Users associated with this calendar
    // Add other relevant calendar fields if needed (e.g., color, source_type)
}

// Define the shape of a single event, including its calendar context
export interface Event {
  id: number;
  title: string;
  start_time: string; // ISO 8601 format string
  end_time: string;   // ISO 8601 format string
  description?: string;
  location?: string;
  calendar?: CalendarInfo; // Nested calendar object with associated users
  // Note: Removed 'participants' as it's distinct from calendar-associated users
}

// Define the shape of event media based on backend serializer
export interface EventMedia {
  id: number;
  event: number; // Event ID
  uploaded_by: number; // User ID
  uploaded_by_name: string;
  media_type: 'IMAGE' | 'VIDEO'; // Extend if backend adds AUDIO
  original_filename: string;
  caption: string;
  uploaded_at: string; // ISO 8601 format string
  file_size: number; // In bytes
  content_type: string; // MIME type
  presigned_url: string; // URL to access the media
}

// Define the shape of the events state
interface EventsState {
  items: Event[]; // For lists (dashboard, events screen)
  isLoading: boolean;
  error: string | null;
  // Media specific state
  currentEventMedia: EventMedia[];
  isMediaLoading: boolean;
  mediaError: string | null;
  isUploading: boolean;
  uploadError: string | null;
  isDeletingMedia: boolean;
  deleteMediaError: string | null;
}

// Initial state
const initialState: EventsState = {
  items: [],
  isLoading: false,
  error: null,
  // Media initial state
  currentEventMedia: [],
  isMediaLoading: false,
  mediaError: null,
  isUploading: false,
  uploadError: null,
  isDeletingMedia: false,
  deleteMediaError: null,
};

// --- Event Thunks ---

// Async thunk to fetch events (e.g., upcoming events for dashboard)
// Adjust API endpoint and parameters as needed
export const fetchUpcomingEvents = createAsyncThunk<
  Event[], // Return type of the payload creator
  void, // First argument to the payload creator (void means no args)
  { state: RootState; rejectValue: string } // Thunk options
>(
  'events/fetchUpcoming',
  async (_, { rejectWithValue }) => {
    try {
      // Example: Fetch first page of upcoming events, sorted by start time
      // The actual endpoint might differ based on backend implementation
      const response = await apiClient.get('/events/?ordering=start_time&limit=5'); // Fetch 5 upcoming
      // Assuming the API returns data in a structure like { results: [...] } for pagination
      return response.data.results || response.data; // Adapt based on actual API response
    } catch (error: any) {
      console.error("Failed to fetch upcoming events:", error);
      const message = error.response?.data?.detail || error.message || 'Failed to fetch events';
      return rejectWithValue(message);
    }
  }
);

// Async thunk to fetch events for a specific month
export const fetchEventsByMonth = createAsyncThunk<
  Event[],
  { monthString: string }, // Argument: e.g., '2025-03'
  { state: RootState; rejectValue: string }
>(
  'events/fetchByMonth',
  async ({ monthString }, { rejectWithValue }) => {
    try {
      // Calculate start and end dates for the month
      const year = parseInt(monthString.substring(0, 4), 10);
      const month = parseInt(monthString.substring(5, 7), 10); // Month is 1-based
      const startDate = `${monthString}-01`;
      // Get the last day of the month
      const lastDay = new Date(year, month, 0).getDate(); // Day is 0-based for last day
      const endDate = `${monthString}-${lastDay.toString().padStart(2, '0')}`;

      // Fetch events within the date range
      // Adjust API endpoint/params based on backend capabilities (e.g., start_date__gte, end_date__lte)
      const response = await apiClient.get(`/events/?start_time__gte=${startDate}&start_time__lte=${endDate}T23:59:59`);
      return response.data.results || response.data;
    } catch (error: any) {
      console.error(`Failed to fetch events for month ${monthString}:`, error);
      const message = error.response?.data?.detail || error.message || 'Failed to fetch events for month';
      return rejectWithValue(message);
    }
  }
);


// REMOVED fetchEventDetails thunk as we assume list provides necessary data for now


// Async thunk to fetch a list of events (potentially paginated)
export const fetchEvents = createAsyncThunk<
  // TODO: Define a more specific return type if pagination is used (e.g., { results: Event[], count: number, next: string|null, previous: string|null })
  Event[],
  { page?: number; searchQuery?: string }, // Optional arguments for pagination/search
  { state: RootState; rejectValue: string }
>(
  'events/fetchList',
  async ({ page = 1, searchQuery = '' }, { rejectWithValue }) => {
    try {
      let url = `/events/?page=${page}`;
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`; // Use backend search (FTS)
      }
      // Add other filters like date range, calendar ID etc. as needed
      const response = await apiClient.get(url);
      // Adapt based on actual API response (paginated or simple list)
      return response.data.results || response.data;
    } catch (error: any) {
      console.error(`Failed to fetch events list:`, error);
      const message = error.response?.data?.detail || error.message || 'Failed to fetch events list';
      return rejectWithValue(message);
    }
  }
);

// Async thunk to fetch details for a single event
export const fetchEventDetail = createAsyncThunk<
  Event, // Return type
  number, // Argument: eventId
  { state: RootState; rejectValue: string }
>(
  'events/fetchDetail',
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/events/${eventId}/`);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to fetch details for event ${eventId}:`, error);
      const message = error.response?.data?.detail || error.message || 'Failed to fetch event details';
      return rejectWithValue(message);
    }
  }
);

// --- Event Create/Update Thunks ---

// Define the input type for creating an event
interface CreateEventData {
  title: string;
  start_time: string; // ISO 8601 format string
  end_time: string;   // ISO 8601 format string
  description?: string;
  location?: string;
  // TODO: Add required fields like calendar_id, visibility, etc.
  // calendar: number; // Example: Assuming a calendar ID is needed
}

export const createEvent = createAsyncThunk<
  Event, // Return the newly created event
  CreateEventData, // Argument type
  { state: RootState; rejectValue: string }
>(
  'events/create',
  async (eventData, { getState, rejectWithValue }) => { // Add getState
    const state = getState(); // Get the current Redux state
    const creatorId = state.auth.user?.id; // Get the logged-in user's ID

    if (!creatorId) {
      return rejectWithValue('User not authenticated'); // Cannot create event without user ID
    }

    const payload = {
      ...eventData,
      creator: creatorId, // Add the creator ID to the payload
    };

    try {
      const response = await apiClient.post('/events/', payload); // Send payload with creator ID
      return response.data;
    } catch (error: any) {
      console.error("Failed to create event:", error);
      const message = error.response?.data?.detail || JSON.stringify(error.response?.data) || error.message || 'Failed to create event';
      return rejectWithValue(message);
    }
  }
);

// Define the input type for updating an event (Partial allows optional fields)
interface UpdateEventData extends Partial<CreateEventData> {
  id: number; // ID of the event to update
}

export const updateEvent = createAsyncThunk<
  Event, // Return the updated event
  UpdateEventData, // Argument type
  { state: RootState; rejectValue: string }
>(
  'events/update',
  async (eventData, { rejectWithValue }) => {
    const { id, ...dataToUpdate } = eventData;
    try {
      // Using PATCH for partial updates
      const response = await apiClient.patch(`/events/${id}/`, dataToUpdate);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to update event ${id}:`, error);
      const message = error.response?.data?.detail || JSON.stringify(error.response?.data) || error.message || 'Failed to update event';
      return rejectWithValue(message);
    }
  }
);


// --- Media Thunks ---

// Async thunk to fetch media for a specific event
export const fetchEventMedia = createAsyncThunk<
  EventMedia[],
  { eventId: number },
  { state: RootState; rejectValue: string }
>(
  'events/fetchMedia',
  async ({ eventId }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/media/event_media/?event_id=${eventId}`);
      return response.data; // Assuming API returns the list directly
    } catch (error: any) {
      console.error(`Failed to fetch media for event ${eventId}:`, error);
      const message = error.response?.data?.detail || error.message || 'Failed to fetch event media';
      return rejectWithValue(message);
    }
  }
);

// Async thunk to upload media for an event
export const uploadEventMedia = createAsyncThunk<
  EventMedia, // Return the newly created media object
  { eventId: number; fileUri: string; fileName: string; fileType: string; caption?: string },
  { state: RootState; rejectValue: string }
>(
  'events/uploadMedia',
  async ({ eventId, fileUri, fileName, fileType, caption }, { rejectWithValue }) => {
    const formData = new FormData();
    formData.append('event', eventId.toString());
    if (caption) {
      formData.append('caption', caption);
    }
    // Append the file correctly for react-native
    formData.append('file', {
      uri: Platform.OS === 'android' ? fileUri : fileUri.replace('file://', ''),
      name: fileName,
      type: fileType,
    } as any); // Use 'any' to bypass strict type checking for FormData file structure

    try {
      const response = await apiClient.post('/media/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error(`Failed to upload media for event ${eventId}:`, error);
      const message = error.response?.data?.detail || error.response?.data?.error || error.message || 'Failed to upload media';
      return rejectWithValue(message);
    }
  }
);

// Async thunk to delete media
export const deleteEventMedia = createAsyncThunk<
  number, // Return the ID of the deleted media
  { mediaId: number },
  { state: RootState; rejectValue: string }
>(
  'events/deleteMedia',
  async ({ mediaId }, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/media/${mediaId}/`);
      return mediaId;
    } catch (error: any) {
      console.error(`Failed to delete media ${mediaId}:`, error);
      const message = error.response?.data?.detail || error.response?.data?.error || error.message || 'Failed to delete media';
      return rejectWithValue(message);
    }
  }
);


const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    clearEventsError(state) {
        state.error = null;
    },
    clearMediaError(state) {
        state.mediaError = null;
    },
    clearUploadError(state) {
        state.uploadError = null;
    },
    clearDeleteMediaError(state) {
        state.deleteMediaError = null;
    },
    clearCurrentEventMedia(state) {
        state.currentEventMedia = [];
    }
    // Removed detail-specific reducers
    // clearEventDetailError(state) { ... },
    // clearCurrentEvent(state) { ... }
  },
  extraReducers: (builder) => {
    builder
      // --- List Fetching ---
      .addCase(fetchUpcomingEvents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUpcomingEvents.fulfilled, (state, action: PayloadAction<Event[]>) => {
        state.isLoading = false;
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchUpcomingEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to fetch upcoming events';
      })
      .addCase(fetchEventsByMonth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEventsByMonth.fulfilled, (state, action: PayloadAction<Event[]>) => {
        state.isLoading = false;
        // Replace items with the fetched month's events.
        // Consider merging or storing separately if needed for different views.
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchEventsByMonth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to fetch month events';
      })
      .addCase(fetchEvents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action: PayloadAction<Event[]>) => {
        state.isLoading = false;
        // Replace or append based on pagination strategy
        state.items = action.payload; // Simple replace for now
        state.error = null;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to fetch events list';
      })
      // --- Media Fetching ---
      .addCase(fetchEventMedia.pending, (state) => {
        state.isMediaLoading = true;
        state.mediaError = null;
      })
      .addCase(fetchEventMedia.fulfilled, (state, action: PayloadAction<EventMedia[]>) => {
        state.isMediaLoading = false;
        state.currentEventMedia = action.payload;
        state.mediaError = null;
      })
      .addCase(fetchEventMedia.rejected, (state, action) => {
        state.isMediaLoading = false;
        state.mediaError = action.payload ?? 'Failed to fetch event media';
      })
      // --- Media Uploading ---
      .addCase(uploadEventMedia.pending, (state) => {
        state.isUploading = true;
        state.uploadError = null;
      })
      .addCase(uploadEventMedia.fulfilled, (state, action: PayloadAction<EventMedia>) => {
        state.isUploading = false;
        state.currentEventMedia.push(action.payload); // Add new media to the list
        state.uploadError = null;
      })
      .addCase(uploadEventMedia.rejected, (state, action) => {
        state.isUploading = false;
        state.uploadError = action.payload ?? 'Failed to upload media';
      })
      // --- Media Deleting ---
      .addCase(deleteEventMedia.pending, (state) => {
        state.isDeletingMedia = true;
        state.deleteMediaError = null;
      })
      .addCase(deleteEventMedia.fulfilled, (state, action: PayloadAction<number>) => {
        state.isDeletingMedia = false;
        // Remove deleted media from the list
        state.currentEventMedia = state.currentEventMedia.filter(
          (media) => media.id !== action.payload
        );
        state.deleteMediaError = null;
      })
      .addCase(deleteEventMedia.rejected, (state, action) => {
        state.isDeletingMedia = false;
        state.deleteMediaError = action.payload ?? 'Failed to delete media';
      })
      // --- Event Creation ---
      .addCase(createEvent.pending, (state) => {
        state.isLoading = true; // Use main loading state or add specific createLoading state
        state.error = null;
      })
      .addCase(createEvent.fulfilled, (state, action: PayloadAction<Event>) => {
        state.isLoading = false;
        // Add the new event to the list. Consider sorting or placement strategy.
        state.items.push(action.payload);
        // Optionally sort items again if order matters
        state.items.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        state.error = null;
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to create event';
      })
      // --- Event Update ---
      .addCase(updateEvent.pending, (state) => {
        state.isLoading = true; // Use main loading state or add specific updateLoading state
        state.error = null;
      })
      .addCase(updateEvent.fulfilled, (state, action: PayloadAction<Event>) => {
        state.isLoading = false;
        // Find and update the event in the list
        const index = state.items.findIndex(event => event.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        } else {
          // Optionally add if not found, though update implies it should exist
          state.items.push(action.payload);
          // Optionally sort items again
          state.items.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        }
        state.error = null;
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to update event';
      })
      // --- Event Detail Fetching ---
      .addCase(fetchEventDetail.pending, (state) => {
        // We might use a different loading state for detail fetching if needed
        // For now, reuse the main one or rely on the component's 'isFetching' state
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEventDetail.fulfilled, (state, _action: PayloadAction<Event>) => { // Prefix unused action
        state.isLoading = false;
        // We don't store the single fetched event in the main 'items' list here.
        // The component calling this thunk will handle the result directly.
        // We could add a 'currentEvent' field to the state if needed globally.
        state.error = null;
      })
      .addCase(fetchEventDetail.rejected, (state, action) => {
        state.isLoading = false;
        // Set error, potentially a specific detailError field if preferred
        state.error = action.payload ?? 'Failed to fetch event details';
      });
      // REMOVED Detail Fetching lifecycle cases
  },
});

export const {
    clearEventsError,
    clearMediaError,
    clearUploadError,
    clearDeleteMediaError,
    clearCurrentEventMedia
} = eventsSlice.actions;
export default eventsSlice.reducer;

// --- Selectors ---
export const selectEvents = (state: RootState) => state.events.items;
export const selectEventsLoading = (state: RootState) => state.events.isLoading;
export const selectEventsError = (state: RootState) => state.events.error;
// Media Selectors
export const selectCurrentEventMedia = (state: RootState) => state.events.currentEventMedia;
export const selectIsMediaLoading = (state: RootState) => state.events.isMediaLoading;
export const selectMediaError = (state: RootState) => state.events.mediaError;
export const selectIsUploadingMedia = (state: RootState) => state.events.isUploading;
export const selectUploadMediaError = (state: RootState) => state.events.uploadError;
export const selectIsDeletingMedia = (state: RootState) => state.events.isDeletingMedia;
export const selectDeleteMediaError = (state: RootState) => state.events.deleteMediaError;

// Note: No specific selector for "upcoming" as the 'items' array holds either upcoming or search results.
// The component logic determines which thunk was called last.

import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../services/api'; // Assuming apiClient is configured - Uncommented
import { RootState } from '../rootReducer'; // Import RootState from rootReducer
import { FamilyGroup, User } from './familySlice'; // Import User from familySlice
import { fetchFamilyGroups } from './familySlice'; // Import fetchFamilyGroups thunk

// --- Interfaces ---

// Interface for Internal Calendar (adjust based on actual API response)
export interface InternalCalendar {
    id: number;
    name: string;
    color: string; // Assuming color is added by backend
    // Add other relevant fields if needed (e.g., type, owner)
}

// Interface for External Calendar Account (adjust based on actual API response)
export interface ExternalCalendarAccount {
    id: number;
    provider: string; // e.g., 'google'
    email: string;
    calendar_id: string; // The actual ID used by the provider
    name: string; // User-defined name or fetched name
    color?: string; // Optional color
    // Add other relevant fields if needed
}

// Interface for Calendar Filters
export interface CalendarFilters {
    internalCalendars: number[]; // IDs of selected InternalCalendar
    externalCalendars: number[]; // IDs of selected ExternalCalendarAccount
    families: number[]; // IDs of selected FamilyGroup
    visibilities: ('PUBLIC' | 'PRIVATE' | 'PERSONAL')[];
    members: number[]; // IDs of selected User (participants)
}

// Interface for Calendar State
interface CalendarState {
    selectedFilters: CalendarFilters;
    availableInternalCalendars: InternalCalendar[];
    availableExternalCalendars: ExternalCalendarAccount[];
    availableFamilies: FamilyGroup[]; // Use FamilyGroup from familySlice
    availableMembers: User[]; // Users in the user's families
    loadingFilters: boolean;
    loadingAddIcs: boolean; // Loading state for adding ICS calendar
    error: string | null;
    errorAddIcs: string | null; // Error state for adding ICS calendar
}

// --- Initial State ---

const initialState: CalendarState = {
    selectedFilters: {
        internalCalendars: [],
        externalCalendars: [],
        families: [],
        visibilities: [],
        members: [],
    },
    availableInternalCalendars: [],
    availableExternalCalendars: [],
    availableFamilies: [],
    availableMembers: [],
    loadingFilters: false,
    loadingAddIcs: false, // Initialize loading state
    error: null,
    errorAddIcs: null, // Initialize error state
};

// --- Async Thunks (Placeholder - Need API Endpoints) ---

// Thunk to fetch data needed for filter options
export const fetchFilterOptions = createAsyncThunk(
    'calendar/fetchFilterOptions',
    async (_, { rejectWithValue, dispatch, getState: _getState }) => { // Prefix getState with _
        try {
            // --- TODO: Replace placeholders with actual API calls when backend endpoints are ready ---
            // Fetch Internal Calendars (Endpoint confirmed: /api/calendars/internal/)
            // const internalPromise = apiClient.get<InternalCalendar[]>('/calendars/internal/');

            // Fetch External Calendar Accounts (Endpoint confirmed: /api/calendars/external/)
            // const externalPromise = apiClient.get<ExternalCalendarAccount[]>('/calendars/external/');

            // Fetch Families (Using existing thunk) - Dispatch is done below before awaiting

            // Fetch All Members Across User's Families (Requires new backend endpoint: e.g., /api/users/my-family-members/)
            // const membersPromise = apiClient.get<User[]>('/users/my-family-members/');
            // --- End TODO ---


            // --- Placeholder data for now ---
            const internalCalendars: InternalCalendar[] = [
                { id: 1, name: 'My Calendar', color: '#FF0000' },
                { id: 2, name: 'Work', color: '#0000FF' },
            ];
            const externalCalendars: ExternalCalendarAccount[] = [
                 { id: 10, provider: 'google', email: 'test@gmail.com', calendar_id: 'google_cal_1', name: 'Google Primary', color: '#00FF00' },
            ];
            // Assuming fetchFamilyGroups exists and returns { payload: FamilyGroup[] }
            const familiesResult = await dispatch(fetchFamilyGroupsIfNeeded()); // Need a way to get families if not loaded
            const families = (familiesResult.payload as FamilyGroup[]) || [];

            // Placeholder for members - requires backend endpoint
            const members: User[] = [
                // Fetch actual members based on families (Placeholder)
            ];

            // --- Await promises (when using actual API calls) ---
            // const [internalRes, externalRes, familiesResult, membersRes] = await Promise.all([
            //     internalPromise,
            //     externalPromise,
            //     familiesPromise, // Already awaited if dispatched
            //     membersPromise
            // ]);
            // const families = (familiesResult.payload as FamilyGroup[]) || []; // Extract payload if needed
            // --- End Await ---

            // Using placeholder data for now:
            // const familiesResult = await familiesPromise; // Await the helper thunk result - Already awaited above if using real API call logic
            // Removed duplicate declaration: const families = await familiesPromise;


            return {
                internalCalendars: internalCalendars, // Replace with internalRes.data,
                externalCalendars: externalCalendars, // Replace with externalRes.data,
                families: families,
                members: members, // membersRes.data,
            };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || error.message || 'Failed to fetch filter options');
        }
    }
);

// Thunk to add an external calendar via ICS URL
interface AddIcsPayload {
    account_name: string;
    ical_url: string;
}
export const addIcsCalendar = createAsyncThunk<
    ExternalCalendarAccount, // Return the newly created calendar account
    AddIcsPayload,
    { rejectValue: string }
>('calendar/addIcsCalendar', async (payload, { rejectWithValue }) => {
    try {
        // Use the endpoint identified in calendars/api.py: /api/calendars/connect/apple/
        // The backend uses 'apple' route name but handles generic ical_url
        const response = await apiClient.post<ExternalCalendarAccount>('/calendars/connect/apple/', payload);
        return response.data;
    } catch (error: any) {
        const message =
            error.response?.data?.detail || JSON.stringify(error.response?.data) || error.message || 'Failed to add calendar via URL';
        return rejectWithValue(message);
    }
});


// Helper thunk to ensure family groups are loaded (adapt as needed)
const fetchFamilyGroupsIfNeeded = createAsyncThunk(
    'calendar/fetchFamilyGroupsIfNeeded',
    async (_, { getState, dispatch }) => {
        const state = getState() as RootState;
        // Use familyGroups instead of items
        if (state.family.familyGroups.length === 0 && !state.family.loading.list) {
             // Assuming fetchFamilyGroups is the correct thunk in familySlice
            const resultAction = await dispatch(fetchFamilyGroups());
            if (fetchFamilyGroups.fulfilled.match(resultAction)) {
                return resultAction.payload;
            } else {
                // Handle error or return empty array
                return [];
            }
        }
        // Return familyGroups instead of items
        return state.family.familyGroups;
    }
);


// --- Slice Definition ---

const calendarSlice = createSlice({
    name: 'calendar',
    initialState,
    reducers: {
        setFilters(state, action: PayloadAction<Partial<CalendarFilters>>) {
            state.selectedFilters = { ...state.selectedFilters, ...action.payload };
            state.error = null; // Clear error on filter change
        },
        resetFilters(state) {
            state.selectedFilters = initialState.selectedFilters;
            state.error = null;
        },
        clearCalendarError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Filter Options
            .addCase(fetchFilterOptions.pending, (state) => {
                state.loadingFilters = true;
                state.error = null;
            })
            .addCase(fetchFilterOptions.fulfilled, (state, action) => {
                state.loadingFilters = false;
                state.availableInternalCalendars = action.payload.internalCalendars;
                state.availableExternalCalendars = action.payload.externalCalendars;
                state.availableFamilies = action.payload.families;
                state.availableMembers = action.payload.members;
            })
            .addCase(fetchFilterOptions.rejected, (state, action) => {
                state.loadingFilters = false;
                state.error = action.payload as string;
            })
            // Add ICS Calendar
            .addCase(addIcsCalendar.pending, (state) => {
                state.loadingAddIcs = true;
                state.errorAddIcs = null;
            })
            .addCase(addIcsCalendar.fulfilled, (state, action) => {
                state.loadingAddIcs = false;
                // Add the new calendar to the available list
                state.availableExternalCalendars.push(action.payload);
            })
            .addCase(addIcsCalendar.rejected, (state, action) => {
                state.loadingAddIcs = false;
                state.errorAddIcs = action.payload as string;
            });
    },
});

// --- Export Actions and Reducer ---

export const { setFilters, resetFilters, clearCalendarError } = calendarSlice.actions;

export default calendarSlice.reducer;

// --- Selectors ---

export const selectCalendarFilters = (state: RootState) => state.calendar.selectedFilters;
export const selectAvailableInternalCalendars = (state: RootState) => state.calendar.availableInternalCalendars;
export const selectAvailableExternalCalendars = (state: RootState) => state.calendar.availableExternalCalendars;
export const selectAvailableFamiliesForFilter = (state: RootState) => state.calendar.availableFamilies;
export const selectAvailableMembersForFilter = (state: RootState) => state.calendar.availableMembers;
export const selectIsLoadingFilters = (state: RootState) => state.calendar.loadingFilters;
export const selectIsLoadingAddIcs = (state: RootState) => state.calendar.loadingAddIcs; // Selector for add ICS loading
export const selectCalendarError = (state: RootState) => state.calendar.error;
export const selectAddIcsError = (state: RootState) => state.calendar.errorAddIcs; // Selector for add ICS error

// Re-export needed thunks
// export { fetchFamilyGroups } from './familySlice'; // Already imported at top

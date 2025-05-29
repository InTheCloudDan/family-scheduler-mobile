import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from '../../services/api'; // Assuming apiClient is configured
import { RootState } from '../rootReducer';
import { FamilyGroup, User } from './familySlice'; // Corrected import names

// --- Interfaces ---

// Basic vacation info for lists
interface VacationBase {
  id: number;
  name: string;
  description?: string;
  start_date: string; // Assuming ISO string format
  end_date: string;
}

// Detailed vacation info including nested structures
interface VacationDetail extends VacationBase {
  location: string;
  region: number;
  region_details: { id: number; name: string; description: string };
  description: string;
  creator: number;
  creator_details: { id: number; username: string; first_name: string; last_name: string };
  members: Array<{
    id: number;
    user: number;
    user_details: { id: number; username: string; first_name: string; last_name: string };
    arrival_date: string;
    departure_date: string;
  }>;
  quest_progress: Array<{
    id: number;
    quest: string;
    completed: boolean;
    completed_at: string | null;
  }>;
  // Add properties, family_groups etc. if needed for display
}

// Packing List structure (based on serializer)
export interface PackingList { // Added export
  id: number;
  vacation: number;
  name: string;
  description?: string;
  is_group: boolean;
  owner: number;
  owner_details?: { id: number; username: string }; // Optional details
  items?: PackingItem[]; // Items are nested
  completion_percentage?: number;
}

// Packing Item structure (based on serializer)
export interface PackingItem { // Added export
  id: number;
  packing_list: number;
  name: string;
  description?: string;
  is_completed: boolean;
  assigned_to?: number | null;
  assigned_to_details?: { id: number; username: string } | null;
  created_by?: number;
  created_by_details?: { id: number; username: string };
  quantity?: number;
  category?: number | null; // Corrected type to number | null
}

// Grocery List structure (based on serializer)
export interface GroceryList { // Added export
    id: number;
    vacation: number;
    name: string;
    description?: string;
    is_group: boolean;
    owner: number;
    owner_details?: { id: number; username: string };
    items?: GroceryItem[]; // Items are nested
    completion_percentage?: number;
}

// Grocery Item structure (based on serializer)
export interface GroceryItem { // Added export
    id: number;
    grocery_list: number;
    name: string;
    description?: string;
    is_completed: boolean;
    assigned_to?: number | null;
    assigned_to_details?: { id: number; username: string } | null;
    created_by?: number;
    created_by_details?: { id: number; username: string };
    quantity?: number;
    unit?: string;
    category?: number | null; // Corrected type to number | null
}

// Vacation Invite structure (based on API spec)
export interface VacationInvite {
  id: number;
  vacation: number | { id: number; name: string }; // Can be ID or nested object
  inviting_family: FamilyGroup; // Corrected type
  invited_family?: FamilyGroup; // Corrected type, Optional, might not be present on pending list
  inviting_user: User; // Corrected type
  token: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  created_at: string; // ISO string
  accept_url?: string; // Only present on creation response
}


// Define the state structure for this slice
interface VacationsState {
  vacations: VacationBase[]; // List uses base info
  selectedVacation: VacationDetail | null;
  packingLists: PackingList[]; // Items are nested within PackingList
  groceryLists: GroceryList[]; // Items are nested within GroceryList
  pendingInvites: VacationInvite[]; // For invites received by user's families
  loadingList: boolean;
  loadingDetail: boolean;
  loadingPackingLists: boolean;
  loadingGroceryLists: boolean;
  loadingPendingInvites: boolean;
  sendingInvite: boolean;
  respondingToInvite: boolean;
  acceptingInviteByToken: boolean;
  loadingCreate: boolean; // Added
  loadingUpdate: boolean; // Added
  loadingItemUpdate: boolean; // Added for item operations (create/update/delete)
  error: string | null; // General error for list/detail/packing/grocery
  errorCreate: string | null; // Added
  errorUpdate: string | null; // Added
  errorItemUpdate: string | null; // Added for item operations
  inviteError: string | null; // Specific error for invite actions
}

// Initial state
const initialState: VacationsState = {
  vacations: [],
  selectedVacation: null,
  packingLists: [],
  groceryLists: [],
  pendingInvites: [],
  loadingList: false,
  loadingDetail: false,
  loadingPackingLists: false,
  loadingGroceryLists: false,
  loadingPendingInvites: false,
  sendingInvite: false,
  respondingToInvite: false,
  acceptingInviteByToken: false,
  loadingCreate: false, // Added
  loadingUpdate: false, // Added
  loadingItemUpdate: false, // Added
  error: null,
  errorCreate: null, // Added
  errorUpdate: null, // Added
  errorItemUpdate: null, // Added
  inviteError: null,
};

// --- Async Thunks ---

// Thunk to fetch the list of vacations
export const fetchVacations = createAsyncThunk<
  VacationBase[], // Return type: Array of base vacation info
  void,
  { rejectValue: string }
>('vacations/fetchVacations', async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get<{ results: VacationBase[] }>('/vacation-plans/');
    return response.data.results;
  } catch (error: any) {
    const message =
      error.response?.data?.detail || error.message || 'Failed to fetch vacations';
    return rejectWithValue(message);
  }
});

// Thunk to create a new vacation
interface CreateVacationPayload {
  name: string;
  location: string;
  description?: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  region?: string | number; // Allow string for name or number for ID if API supports it
  family_groups: number[]; // Array of family group IDs
}
export const createVacation = createAsyncThunk<
  VacationDetail, // Return the created vacation detail
  CreateVacationPayload,
  { rejectValue: string }
>('vacations/createVacation', async (payload, { rejectWithValue }) => {
  try {
    const response = await apiClient.post<VacationDetail>('/vacation-plans/', payload);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.detail || JSON.stringify(error.response?.data) || error.message || 'Failed to create vacation';
    return rejectWithValue(message);
  }
});

// Thunk to update an existing vacation
interface UpdateVacationPayload extends Partial<CreateVacationPayload> { // Can update subset of fields
  id: number; // ID is required for update
}
export const updateVacation = createAsyncThunk<
  VacationDetail, // Return the updated vacation detail
  UpdateVacationPayload,
  { rejectValue: string }
>('vacations/updateVacation', async (payload, { rejectWithValue }) => {
  const { id, ...updateData } = payload;
  try {
    // Use PATCH for partial updates
    const response = await apiClient.patch<VacationDetail>(`/vacation-plans/${id}/`, updateData);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.detail || JSON.stringify(error.response?.data) || error.message || 'Failed to update vacation';
    return rejectWithValue(message);
  }
});


// Thunk to fetch details for a single vacation
export const fetchVacationDetail = createAsyncThunk<
  VacationDetail, // Return type: Full vacation detail
  number,         // Argument type: vacationId
  { rejectValue: string }
>('vacations/fetchVacationDetail', async (vacationId, { rejectWithValue }) => {
  try {
    const response = await apiClient.get<VacationDetail>(`/vacation-plans/${vacationId}/`);
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.detail || error.message || 'Failed to fetch vacation details';
    return rejectWithValue(message);
  }
});

// Thunk to fetch packing lists for a specific vacation
export const fetchPackingLists = createAsyncThunk<
  PackingList[], // Return type
  number,        // Argument: vacationId
  { rejectValue: string }
>('vacations/fetchPackingLists', async (vacationId, { rejectWithValue }) => {
  try {
    // Expect paginated response
    const response = await apiClient.get<{ results: PackingList[] }>(`/packing-lists/?vacation=${vacationId}`);
    // Return the results array
    return response.data.results;
  } catch (error: any) {
    const message = error.response?.data?.detail || error.message || 'Failed to fetch packing lists';
    return rejectWithValue(message);
  } // Correctly closed catch block
});

// Thunk to toggle packing item completion
export const togglePackingItem = createAsyncThunk<
  PackingItem, // Return the updated item
  { itemId: number; is_completed: boolean }, // Argument: item ID and new status
  { rejectValue: string; state: RootState } // Include state to potentially update optimistically
>(
  'vacations/togglePackingItem',
  async ({ itemId, is_completed }, { rejectWithValue }) => {
    try {
       // Using PATCH as toggle_completion action wasn't confirmed in router/viewset for items
       const response = await apiClient.patch<PackingItem>(`/packing-items/${itemId}/`, { is_completed });
       return response.data; // Assuming PATCH returns the full updated item
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to toggle packing item';
      return rejectWithValue(message);
    }
  }
);

// Thunk to fetch grocery lists for a specific vacation
export const fetchGroceryLists = createAsyncThunk<
  GroceryList[], // Return type
  number,        // Argument: vacationId
  { rejectValue: string }
>('vacations/fetchGroceryLists', async (vacationId, { rejectWithValue }) => {
  try {
    // Expect paginated response
    const response = await apiClient.get<{ results: GroceryList[] }>(`/grocery-lists/?vacation=${vacationId}`);
    // Return the results array
    return response.data.results;
  } catch (error: any) {
    const message = error.response?.data?.detail || error.message || 'Failed to fetch grocery lists';
    return rejectWithValue(message);
  } // Correctly closed catch block
});

// Thunk to toggle grocery item completion
export const toggleGroceryItem = createAsyncThunk<
  GroceryItem, // Return the updated item
  { itemId: number; is_completed: boolean }, // Argument
  { rejectValue: string; state: RootState }
>(
  'vacations/toggleGroceryItem',
  async ({ itemId, is_completed }, { rejectWithValue }) => {
    try {
      // Assuming PATCH is the method, adjust if toggle endpoint exists
      const response = await apiClient.patch<GroceryItem>(`/grocery-items/${itemId}/`, { is_completed });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to toggle grocery item';
      return rejectWithValue(message);
    }
  }
);

// Thunk to create a new packing list
export const createPackingList = createAsyncThunk<
  PackingList, // Return the newly created list
  { vacationId: number; name: string; description?: string; is_group?: boolean }, // Arguments
  { rejectValue: string }
>('vacations/createPackingList', async (listData, { rejectWithValue }) => {
  try {
    const response = await apiClient.post<PackingList>('/packing-lists/', {
        vacation: listData.vacationId,
        name: listData.name,
        description: listData.description || '',
        is_group: listData.is_group ?? true, // Default to group list
    });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.detail || error.message || 'Failed to create packing list';
    return rejectWithValue(message);
  }
});

// Thunk to create a new packing item
interface CreatePackingItemPayload {
  packing_list: number;
  name: string;
  description?: string;
  quantity?: number;
  category?: number | null;
  assigned_to?: number | null;
}
export const createPackingItem = createAsyncThunk<
  PackingItem,
  CreatePackingItemPayload,
  { rejectValue: string }
>('vacations/createPackingItem', async (payload, { rejectWithValue }) => {
  try {
    const response = await apiClient.post<PackingItem>('/packing-items/', payload);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.detail || JSON.stringify(error.response?.data) || error.message || 'Failed to create packing item';
    return rejectWithValue(message);
  }
});

// Thunk to update a packing item
interface UpdatePackingItemPayload extends Partial<Omit<CreatePackingItemPayload, 'packing_list'>> {
  id: number; // Item ID required
  is_completed?: boolean; // Added for toggling
}
export const updatePackingItem = createAsyncThunk<
  PackingItem,
  UpdatePackingItemPayload,
  { rejectValue: string }
>('vacations/updatePackingItem', async (payload, { rejectWithValue }) => {
  const { id, ...updateData } = payload;
  try {
    const response = await apiClient.patch<PackingItem>(`/packing-items/${id}/`, updateData);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.detail || JSON.stringify(error.response?.data) || error.message || 'Failed to update packing item';
    return rejectWithValue(message);
  }
});

// Thunk to delete a packing item
export const deletePackingItem = createAsyncThunk<
  { itemId: number; listId: number }, // Return item and list ID for reducer
  number, // Argument: itemId
  { rejectValue: string }
>('vacations/deletePackingItem', async (itemId, { rejectWithValue, getState }) => {
  try {
    // Find the list ID before deleting, needed for reducer update
    const state = getState() as RootState;
    let listId: number | undefined;
    for (const list of state.vacations.packingLists) {
        if (list.items?.some(item => item.id === itemId)) {
            listId = list.id;
            break;
        }
    }
    if (!listId) {
        throw new Error('Could not find packing list for item');
    }

    await apiClient.delete(`/packing-items/${itemId}/`);
    return { itemId, listId }; // Return ID on success
  } catch (error: any) {
    const message = error.response?.data?.detail || error.message || 'Failed to delete packing item';
    return rejectWithValue(message);
  }
});


// Thunk to create a new grocery list
export const createGroceryList = createAsyncThunk<
  GroceryList, // Return the newly created list
  { vacationId: number; name: string; description?: string; is_group?: boolean }, // Arguments
  { rejectValue: string }
>('vacations/createGroceryList', async (listData, { rejectWithValue }) => {
  try {
    const response = await apiClient.post<GroceryList>('/grocery-lists/', {
        vacation: listData.vacationId,
        name: listData.name,
        description: listData.description || '',
        is_group: listData.is_group ?? true, // Default to group list
    });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.detail || error.message || 'Failed to create grocery list';
    return rejectWithValue(message);
  }
});

// Thunk to create a new grocery item
interface CreateGroceryItemPayload {
  grocery_list: number;
  name: string;
  description?: string;
  quantity?: number;
  unit?: string;
  category?: number | null;
  assigned_to?: number | null;
}
export const createGroceryItem = createAsyncThunk<
  GroceryItem,
  CreateGroceryItemPayload,
  { rejectValue: string }
>('vacations/createGroceryItem', async (payload, { rejectWithValue }) => {
  try {
    const response = await apiClient.post<GroceryItem>('/grocery-items/', payload);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.detail || JSON.stringify(error.response?.data) || error.message || 'Failed to create grocery item';
    return rejectWithValue(message);
  }
});

// Thunk to update a grocery item
interface UpdateGroceryItemPayload extends Partial<Omit<CreateGroceryItemPayload, 'grocery_list'>> {
  id: number; // Item ID required
  is_completed?: boolean; // Added for toggling
}
export const updateGroceryItem = createAsyncThunk<
  GroceryItem,
  UpdateGroceryItemPayload,
  { rejectValue: string }
>('vacations/updateGroceryItem', async (payload, { rejectWithValue }) => {
  const { id, ...updateData } = payload;
  try {
    const response = await apiClient.patch<GroceryItem>(`/grocery-items/${id}/`, updateData);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.detail || JSON.stringify(error.response?.data) || error.message || 'Failed to update grocery item';
    return rejectWithValue(message);
  }
});

// Thunk to delete a grocery item
export const deleteGroceryItem = createAsyncThunk<
  { itemId: number; listId: number }, // Return item and list ID for reducer
  number, // Argument: itemId
  { rejectValue: string; state: RootState } // Add state type
>('vacations/deleteGroceryItem', async (itemId, { rejectWithValue, getState }) => {
  try {
     // Find the list ID before deleting, needed for reducer update
    const state = getState(); // No need for type assertion here
    let listId: number | undefined;
    for (const list of state.vacations.groceryLists) {
        if (list.items?.some(item => item.id === itemId)) {
            listId = list.id;
            break;
        }
    }
     if (!listId) {
        throw new Error('Could not find grocery list for item');
    }

    await apiClient.delete(`/grocery-items/${itemId}/`);
    return { itemId, listId }; // Return ID on success
  } catch (error: any) {
    const message = error.response?.data?.detail || error.message || 'Failed to delete grocery item';
    return rejectWithValue(message);
  }
});


// --- Vacation Invite Thunks ---

// Thunk to send a vacation invitation
export const sendVacationInvite = createAsyncThunk<
  VacationInvite, // Return the created invite object (includes accept_url)
  { vacationId: number; invitedFamilyName: string }, // Arguments
  { rejectValue: string }
>('vacations/sendInvite', async ({ vacationId, invitedFamilyName }, { rejectWithValue }) => {
  try {
    const response = await apiClient.post<VacationInvite>(`/vacations/${vacationId}/invites/`, {
      invited_family_name: invitedFamilyName,
    });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.detail || error.response?.data?.invited_family_name || error.message || 'Failed to send invitation';
    return rejectWithValue(message);
  }
});

// Thunk to fetch pending vacation invitations for the current user's families
export const fetchPendingVacationInvites = createAsyncThunk<
  VacationInvite[], // Return type
  void,
  { rejectValue: string }
>('vacations/fetchPendingInvites', async (_, { rejectWithValue }) => {
  try {
    // Assuming this endpoint is paginated like others, extract results
    const response = await apiClient.get<{ results: VacationInvite[] }>('/vacations/invites/pending/');
    return response.data.results;
  } catch (error: any) {
    const message = error.response?.data?.detail || error.message || 'Failed to fetch pending invitations';
    return rejectWithValue(message);
  }
});

// Thunk to respond (accept/decline) to a specific invitation
export const respondToVacationInvite = createAsyncThunk<
  VacationInvite, // Return the updated invite object
  { inviteId: number; response: 'accept' | 'decline' }, // Arguments
  { rejectValue: string }
>('vacations/respondToInvite', async ({ inviteId, response }, { rejectWithValue }) => {
  try {
    const responseData = await apiClient.post<VacationInvite>(`/vacations/invites/${inviteId}/respond/`, {
      response: response,
    });
    return responseData.data;
  } catch (error: any) {
    const message = error.response?.data?.detail || error.response?.data?.response || error.message || 'Failed to respond to invitation';
    return rejectWithValue(message);
  }
});

// Thunk to accept an invitation via a token (deep link)
export const acceptVacationInviteByToken = createAsyncThunk<
  VacationInvite, // Return the updated invite object
  string,         // Argument: token
  { rejectValue: string }
>('vacations/acceptInviteByToken', async (token, { rejectWithValue }) => {
  try {
    const response = await apiClient.post<VacationInvite>(`/vacations/accept-invite/${token}/`);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.detail || error.message || 'Failed to accept invitation via token';
    return rejectWithValue(message);
  }
});


// --- Slice Definition ---

const vacationsSlice = createSlice({
  name: 'vacations',
  initialState,
  reducers: {
    clearVacationError: (state) => { // Clears general list/detail/packing/grocery error
      state.error = null;
    },
    clearCreateVacationError: (state) => { // Added
      state.errorCreate = null;
    },
    clearUpdateVacationError: (state) => { // Added
      state.errorUpdate = null;
    },
    clearItemUpdateError: (state) => { // Added
        state.errorItemUpdate = null;
    },
    clearInviteError: (state) => {
        state.inviteError = null;
    },
    // Action to clear selected vacation when navigating away from detail/form
    clearSelectedVacation: (state) => {
        state.selectedVacation = null;
        state.packingLists = [];
        state.groceryLists = [];
        state.error = null; // Clear general error too
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchVacations (List) cases
      .addCase(fetchVacations.pending, (state) => {
        state.loadingList = true;
        state.error = null;
      })
      .addCase(fetchVacations.fulfilled, (state, action: PayloadAction<VacationBase[]>) => {
        state.loadingList = false;
        state.vacations = action.payload;
      })
      .addCase(fetchVacations.rejected, (state, action) => {
        state.loadingList = false;
        if (typeof action.payload === 'string') {
          state.error = action.payload;
        } else {
          state.error = action.error?.message || 'An unknown error occurred fetching vacations list';
        }
      })
      // fetchVacationDetail cases
      .addCase(fetchVacationDetail.pending, (state) => {
        state.loadingDetail = true;
        state.selectedVacation = null; // Clear previous detail
        state.packingLists = []; // Clear previous lists
        state.groceryLists = []; // Clear previous lists
        state.error = null;
      })
      .addCase(fetchVacationDetail.fulfilled, (state, action: PayloadAction<VacationDetail>) => {
        state.loadingDetail = false;
        state.selectedVacation = action.payload;
      })
      .addCase(fetchVacationDetail.rejected, (state, action) => {
        state.loadingDetail = false;
        if (typeof action.payload === 'string') {
          state.error = action.payload;
        } else {
          state.error = action.error?.message || 'An unknown error occurred fetching vacation details';
        }
      })
      // fetchPackingLists cases
      .addCase(fetchPackingLists.pending, (state) => {
        state.loadingPackingLists = true;
        state.error = null;
      })
      .addCase(fetchPackingLists.fulfilled, (state, action: PayloadAction<PackingList[]>) => {
        state.loadingPackingLists = false;
        state.packingLists = action.payload; // Store the fetched lists (which include items)
      })
      .addCase(fetchPackingLists.rejected, (state, action) => {
        state.loadingPackingLists = false;
        state.error = action.payload ?? 'Failed to load packing lists';
      })
      // togglePackingItem cases
      .addCase(togglePackingItem.pending, (_state, _action) => {
        // Optional: Optimistic update
      })
      .addCase(togglePackingItem.fulfilled, (state, action: PayloadAction<PackingItem>) => {
          const updatedItem = action.payload;
          const listIndex = state.packingLists.findIndex(list => list.id === updatedItem.packing_list);
          if (listIndex !== -1 && state.packingLists[listIndex].items) {
              const itemIndex = state.packingLists[listIndex].items!.findIndex(item => item.id === updatedItem.id);
              if (itemIndex !== -1) {
                  state.packingLists[listIndex].items![itemIndex] = updatedItem;
                  // TODO: Recalculate completion percentage?
              }
          }
      })
      .addCase(togglePackingItem.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to toggle packing item';
      })
      // fetchGroceryLists cases
      .addCase(fetchGroceryLists.pending, (state) => {
        state.loadingGroceryLists = true;
        state.error = null;
      })
      .addCase(fetchGroceryLists.fulfilled, (state, action: PayloadAction<GroceryList[]>) => {
        state.loadingGroceryLists = false;
        state.groceryLists = action.payload; // Store the fetched lists (which include items)
      })
      .addCase(fetchGroceryLists.rejected, (state, action) => {
        state.loadingGroceryLists = false;
        state.error = action.payload ?? 'Failed to load grocery lists';
      })
      // toggleGroceryItem cases
      .addCase(toggleGroceryItem.pending, (_state, _action) => {
        // Optional: Optimistic update
      })
      .addCase(toggleGroceryItem.fulfilled, (state, action: PayloadAction<GroceryItem>) => {
          const updatedItem = action.payload;
          const listIndex = state.groceryLists.findIndex(list => list.id === updatedItem.grocery_list);
           if (listIndex !== -1 && state.groceryLists[listIndex].items) {
              const itemIndex = state.groceryLists[listIndex].items!.findIndex(item => item.id === updatedItem.id);
              if (itemIndex !== -1) {
                  state.groceryLists[listIndex].items![itemIndex] = updatedItem;
                  // TODO: Recalculate completion percentage?
              }
          }
      })
      .addCase(toggleGroceryItem.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to toggle grocery item';
      })
      // createPackingList cases
      .addCase(createPackingList.pending, (state) => {
          // Optionally set a specific loading state for creation
          state.error = null;
      })
      .addCase(createPackingList.fulfilled, (state, _action: PayloadAction<PackingList>) => { // Prefix action
          // Re-fetch will be handled in the component
          state.error = null;
      })
      .addCase(createPackingList.rejected, (state, action) => {
          state.error = action.payload ?? 'Failed to create packing list';
      })
      // createGroceryList cases
      .addCase(createGroceryList.pending, (state) => {
          // Optionally set a specific loading state for creation
          state.error = null;
      })
      .addCase(createGroceryList.fulfilled, (state, _action: PayloadAction<GroceryList>) => { // Prefix action
          // Re-fetch will be handled in the component
          state.error = null;
      })
      .addCase(createGroceryList.rejected, (state, action) => {
          state.error = action.payload ?? 'Failed to create grocery list';
      })
      // sendVacationInvite cases
      .addCase(sendVacationInvite.pending, (state) => {
        state.sendingInvite = true;
        state.inviteError = null;
      })
      .addCase(sendVacationInvite.fulfilled, (state, _action: PayloadAction<VacationInvite>) => {
        state.sendingInvite = false;
        // Optionally store the created invite details if needed immediately,
        // but usually success message is enough in the component.
      })
      .addCase(sendVacationInvite.rejected, (state, action) => {
        state.sendingInvite = false;
        state.inviteError = action.payload ?? 'Failed to send invite';
      })
      // fetchPendingVacationInvites cases
      .addCase(fetchPendingVacationInvites.pending, (state) => {
        state.loadingPendingInvites = true;
        state.inviteError = null;
      })
      .addCase(fetchPendingVacationInvites.fulfilled, (state, action: PayloadAction<VacationInvite[]>) => {
        state.loadingPendingInvites = false;
        state.pendingInvites = action.payload;
      })
      .addCase(fetchPendingVacationInvites.rejected, (state, action) => {
        state.loadingPendingInvites = false;
        state.inviteError = action.payload ?? 'Failed to fetch pending invites';
      })
      // respondToVacationInvite cases
      .addCase(respondToVacationInvite.pending, (state) => {
        state.respondingToInvite = true;
        state.inviteError = null;
      })
      .addCase(respondToVacationInvite.fulfilled, (state, action: PayloadAction<VacationInvite>) => {
        state.respondingToInvite = false;
        // Remove the responded invite from the pending list
        state.pendingInvites = state.pendingInvites.filter(invite => invite.id !== action.payload.id);
      })
      .addCase(respondToVacationInvite.rejected, (state, action) => {
        state.respondingToInvite = false;
        state.inviteError = action.payload ?? 'Failed to respond to invite';
      })
      // acceptVacationInviteByToken cases
      .addCase(acceptVacationInviteByToken.pending, (state) => {
        state.acceptingInviteByToken = true;
        state.inviteError = null;
      })
      .addCase(acceptVacationInviteByToken.fulfilled, (state, _action: PayloadAction<VacationInvite>) => {
        state.acceptingInviteByToken = false;
        // Invite is accepted, pending list might be stale now,
        // but the component handling this will likely navigate away or refresh data.
      })
      .addCase(acceptVacationInviteByToken.rejected, (state, action) => {
        state.acceptingInviteByToken = false;
        state.inviteError = action.payload ?? 'Failed to accept invite by token';
      })
      // createVacation cases
      .addCase(createVacation.pending, (state) => {
        state.loadingCreate = true;
        state.errorCreate = null;
      })
      .addCase(createVacation.fulfilled, (state, _action: PayloadAction<VacationDetail>) => {
        state.loadingCreate = false;
        // Don't add to list here, let list screen re-fetch for consistency
      })
      .addCase(createVacation.rejected, (state, action) => {
        state.loadingCreate = false;
        state.errorCreate = action.payload ?? 'Failed to create vacation';
      })
      // updateVacation cases
      .addCase(updateVacation.pending, (state) => {
        state.loadingUpdate = true;
        state.errorUpdate = null;
      })
      .addCase(updateVacation.fulfilled, (state, action: PayloadAction<VacationDetail>) => {
        state.loadingUpdate = false;
        state.selectedVacation = action.payload; // Update selected detail if it was the one edited
        // Update in the main list as well
        const index = state.vacations.findIndex(v => v.id === action.payload.id);
        if (index !== -1) {
          // Update with base info from the detailed payload
          state.vacations[index] = {
            id: action.payload.id,
            name: action.payload.name,
            description: action.payload.description,
            start_date: action.payload.start_date,
            end_date: action.payload.end_date,
          };
        }
      })
      .addCase(updateVacation.rejected, (state, action) => {
        state.loadingUpdate = false;
        state.errorUpdate = action.payload ?? 'Failed to update vacation';
      })
      // Create Packing Item
      .addCase(createPackingItem.pending, (state) => {
        state.loadingItemUpdate = true;
        state.errorItemUpdate = null;
      })
      .addCase(createPackingItem.fulfilled, (state, action: PayloadAction<PackingItem>) => {
        state.loadingItemUpdate = false;
        const listIndex = state.packingLists.findIndex(list => list.id === action.payload.packing_list);
        if (listIndex !== -1) {
          if (!state.packingLists[listIndex].items) {
            state.packingLists[listIndex].items = [];
          }
          state.packingLists[listIndex].items!.push(action.payload);
          // TODO: Recalculate completion percentage?
        }
      })
      .addCase(createPackingItem.rejected, (state, action) => {
        state.loadingItemUpdate = false;
        state.errorItemUpdate = action.payload ?? 'Failed to create packing item';
      })
      // Update Packing Item (handles toggle and other updates)
      .addCase(updatePackingItem.pending, (state) => {
        state.loadingItemUpdate = true; // Use item update loading
        state.errorItemUpdate = null;
      })
      .addCase(updatePackingItem.fulfilled, (state, action: PayloadAction<PackingItem>) => {
        state.loadingItemUpdate = false;
        const updatedItem = action.payload;
        const listIndex = state.packingLists.findIndex(list => list.id === updatedItem.packing_list);
        if (listIndex !== -1 && state.packingLists[listIndex].items) {
            const itemIndex = state.packingLists[listIndex].items!.findIndex(item => item.id === updatedItem.id);
            if (itemIndex !== -1) {
                state.packingLists[listIndex].items![itemIndex] = updatedItem;
                // TODO: Recalculate completion percentage?
            }
        }
      })
      .addCase(updatePackingItem.rejected, (state, action) => {
        state.loadingItemUpdate = false;
        state.errorItemUpdate = action.payload ?? 'Failed to update packing item';
      })
       // Delete Packing Item
      .addCase(deletePackingItem.pending, (state) => {
        state.loadingItemUpdate = true;
        state.errorItemUpdate = null;
      })
      .addCase(deletePackingItem.fulfilled, (state, action: PayloadAction<{ itemId: number; listId: number }>) => {
        state.loadingItemUpdate = false;
        const { itemId, listId } = action.payload;
        const listIndex = state.packingLists.findIndex(list => list.id === listId);
        if (listIndex !== -1 && state.packingLists[listIndex].items) {
          state.packingLists[listIndex].items = state.packingLists[listIndex].items!.filter(item => item.id !== itemId);
          // TODO: Recalculate completion percentage?
        }
      })
      .addCase(deletePackingItem.rejected, (state, action) => {
        state.loadingItemUpdate = false;
        state.errorItemUpdate = action.payload ?? 'Failed to delete packing item';
      })
      // Create Grocery Item
      .addCase(createGroceryItem.pending, (state) => {
        state.loadingItemUpdate = true;
        state.errorItemUpdate = null;
      })
      .addCase(createGroceryItem.fulfilled, (state, action: PayloadAction<GroceryItem>) => {
        state.loadingItemUpdate = false;
        const listIndex = state.groceryLists.findIndex(list => list.id === action.payload.grocery_list);
        if (listIndex !== -1) {
          if (!state.groceryLists[listIndex].items) {
            state.groceryLists[listIndex].items = [];
          }
          state.groceryLists[listIndex].items!.push(action.payload);
          // TODO: Recalculate completion percentage?
        }
      })
      .addCase(createGroceryItem.rejected, (state, action) => {
        state.loadingItemUpdate = false;
        state.errorItemUpdate = action.payload ?? 'Failed to create grocery item';
      })
      // Update Grocery Item (handles toggle and other updates)
      .addCase(updateGroceryItem.pending, (state) => {
        state.loadingItemUpdate = true; // Use item update loading
        state.errorItemUpdate = null;
      })
      .addCase(updateGroceryItem.fulfilled, (state, action: PayloadAction<GroceryItem>) => {
        state.loadingItemUpdate = false;
        const updatedItem = action.payload;
        const listIndex = state.groceryLists.findIndex(list => list.id === updatedItem.grocery_list);
         if (listIndex !== -1 && state.groceryLists[listIndex].items) {
            const itemIndex = state.groceryLists[listIndex].items!.findIndex(item => item.id === updatedItem.id);
            if (itemIndex !== -1) {
                state.groceryLists[listIndex].items![itemIndex] = updatedItem;
                // TODO: Recalculate completion percentage?
            }
        }
      })
      .addCase(updateGroceryItem.rejected, (state, action) => {
        state.loadingItemUpdate = false;
        state.errorItemUpdate = action.payload ?? 'Failed to update grocery item';
      })
      // Delete Grocery Item
      .addCase(deleteGroceryItem.pending, (state) => {
        state.loadingItemUpdate = true;
        state.errorItemUpdate = null;
      })
      .addCase(deleteGroceryItem.fulfilled, (state, action: PayloadAction<{ itemId: number; listId: number }>) => {
        state.loadingItemUpdate = false;
        const { itemId, listId } = action.payload;
        const listIndex = state.groceryLists.findIndex(list => list.id === listId);
        if (listIndex !== -1 && state.groceryLists[listIndex].items) {
          state.groceryLists[listIndex].items = state.groceryLists[listIndex].items!.filter(item => item.id !== itemId);
          // TODO: Recalculate completion percentage?
        }
      })
      .addCase(deleteGroceryItem.rejected, (state, action) => {
        state.loadingItemUpdate = false;
        state.errorItemUpdate = action.payload ?? 'Failed to delete grocery item';
      });
      // Note: togglePackingItem and toggleGroceryItem are handled by updatePackingItem/updateGroceryItem now
  },
});

// --- Export Actions and Reducer ---
export const {
    clearVacationError,
    clearCreateVacationError, // Added
    clearUpdateVacationError, // Added
    clearItemUpdateError, // Added
    clearInviteError,
    clearSelectedVacation, // Added
} = vacationsSlice.actions;
export default vacationsSlice.reducer; // Ensure default export exists

// --- Selectors ---
export const selectAllVacations = (state: RootState) => state.vacations.vacations;
export const selectSelectedVacation = (state: RootState) => state.vacations.selectedVacation;
export const selectVacationsLoadingList = (state: RootState) => state.vacations.loadingList;
export const selectVacationsLoadingDetail = (state: RootState) => state.vacations.loadingDetail;
export const selectVacationsLoadingCreate = (state: RootState) => state.vacations.loadingCreate; // Added
export const selectVacationsLoadingUpdate = (state: RootState) => state.vacations.loadingUpdate; // Added
export const selectItemUpdateLoading = (state: RootState) => state.vacations.loadingItemUpdate; // Added
export const selectVacationsError = (state: RootState) => state.vacations.error; // General error
export const selectCreateVacationError = (state: RootState) => state.vacations.errorCreate; // Added
export const selectUpdateVacationError = (state: RootState) => state.vacations.errorUpdate; // Added
export const selectItemUpdateError = (state: RootState) => state.vacations.errorItemUpdate; // Added
export const selectInviteError = (state: RootState) => state.vacations.inviteError; // Invite specific error

// Packing List Selectors
export const selectPackingListsForVacation = (state: RootState) => state.vacations.packingLists;
export const selectPackingListsLoading = (state: RootState) => state.vacations.loadingPackingLists;
// Selector to find a specific list and its items from the already fetched lists
export const selectPackingListById = (listId: number) => (state: RootState) =>
  state.vacations.packingLists.find(list => list.id === listId);


// Grocery List Selectors
export const selectGroceryListsForVacation = (state: RootState) => state.vacations.groceryLists;
export const selectGroceryListsLoading = (state: RootState) => state.vacations.loadingGroceryLists;
// Selector to find a specific list and its items from the already fetched lists
export const selectGroceryListById = (listId: number) => (state: RootState) =>
  state.vacations.groceryLists.find(list => list.id === listId);

// Vacation Invite Selectors
export const selectPendingVacationInvites = (state: RootState) => state.vacations.pendingInvites;
export const selectPendingInvitesLoading = (state: RootState) => state.vacations.loadingPendingInvites;
export const selectSendingInvite = (state: RootState) => state.vacations.sendingInvite;
export const selectRespondingToInvite = (state: RootState) => state.vacations.respondingToInvite;
export const selectAcceptingInviteByToken = (state: RootState) => state.vacations.acceptingInviteByToken;

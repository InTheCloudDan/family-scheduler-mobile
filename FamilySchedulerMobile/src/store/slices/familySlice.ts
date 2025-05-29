import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from '../../services/api';
import { RootState } from '../rootReducer';

// --- TypeScript Interfaces based on Backend Serializers ---

export interface User { // Added export
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
  avatar_url: string | null;
}

// Define the shape of a single family group item
export interface FamilyGroup { // Added export
  id: number;
  name: string;
  referral_code: string; // Read-only
  created_at: string; // Read-only
  updated_at: string; // Read-only
  // Add other relevant fields if needed from the API response
}

export interface FamilyMembership { // Export the interface
  id: number;
  user: User;
  family: FamilyGroup; // Simplified for now, might need full FamilyGroup later
  role: 'PARENT' | 'CHILD' | 'GUARDIAN' | 'RELATIVE' | 'OTHER'; // Adjust based on actual choices in models.py
  is_admin: boolean;
  joined_at: string; // Read-only
}

interface FamilyInvite {
  id: number;
  family: FamilyGroup; // Simplified
  email: string;
  role: 'PARENT' | 'CHILD' | 'GUARDIAN' | 'RELATIVE' | 'OTHER'; // Adjust based on actual choices
  invited_by: User;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'; // Adjust based on actual choices
  created_at: string; // Read-only
  expires_at: string;
}

export interface Child { // Added export
  id: number;
  first_name: string;
  last_name: string;
  birth_date: string | null; // Date string or null
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY'; // Adjust based on actual choices
  family: FamilyGroup; // Simplified
  added_by: User;
  user_account: User | null; // Can be linked to a user or not
  created_at: string; // Read-only
  updated_at: string; // Read-only
  age: number | null; // Calculated field
  profile_picture: string | null; // URL or null
}

// Define the shape of the paginated API response for families
interface PaginatedFamilyResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: FamilyGroup[];
}

// Define the state structure for this slice
interface FamilyState {
  familyGroups: FamilyGroup[]; // List of families user belongs to
  currentFamily: FamilyGroup | null; // Details of the currently viewed family
  members: FamilyMembership[]; // Members of the current family
  children: Child[]; // Children of the current family
  invites: FamilyInvite[]; // Invites for the current family (if admin)
  loading: {
    list: boolean;
    detail: boolean;
    members: boolean;
    children: boolean;
    invites: boolean;
    createFamily: boolean;
    updateFamily: boolean;
    deleteFamily: boolean;
    createInvite: boolean;
    acceptInvite: boolean;
    declineInvite: boolean;
    addChild: boolean;
    updateChild: boolean; // Added
    deleteChild: boolean; // Added
    updateMembership: boolean; // For role update
    // deleteFamily: boolean; // Already added above
    // createInvite: boolean; // Already added above
    // acceptInvite: boolean; // Already added above
    // declineInvite: boolean; // Already added above
    // addChild: boolean; // Already added above
    // updateChild: boolean; // Already added above
    // deleteChild: boolean; // Already added above
    // updateMembership: boolean; // REMOVE THIS DUPLICATE
    deleteMembership: boolean; // Added deleteMembership
  };
  error: {
    list: string | null;
    detail: string | null;
    members: string | null;
    children: string | null;
    invites: string | null;
    createFamily: string | null;
    updateFamily: string | null; // Added
    deleteFamily: string | null;
    createInvite: string | null;
    acceptInvite: string | null;
    declineInvite: string | null;
    addChild: string | null;
    updateChild: string | null; // Added
    deleteChild: string | null; // Added
    updateMembership: string | null; // For role update
    // deleteFamily: string | null; // Already added above
    // updateMembership: string | null; // REMOVE THIS DUPLICATE
    deleteMembership: string | null; // Added deleteMembership error
  };
}

// Initial state
const initialState: FamilyState = {
  familyGroups: [],
  currentFamily: null,
  members: [],
  children: [],
  invites: [],
  loading: {
    list: false,
    detail: false,
    members: false,
    children: false,
    invites: false,
    createFamily: false,
    updateFamily: false, // Added
    deleteFamily: false,
    createInvite: false,
    acceptInvite: false,
    declineInvite: false,
    addChild: false,
    updateChild: false, // Added
    deleteChild: false, // Added
    updateMembership: false, // For role update
    // deleteFamily: false, // Already added above
    // updateMembership: false, // REMOVE THIS DUPLICATE
    deleteMembership: false, // Added deleteMembership loading
  },
  error: {
    list: null,
    detail: null,
    members: null,
    children: null,
    invites: null,
    createFamily: null,
    updateFamily: null, // Added
    deleteFamily: null,
    createInvite: null,
    acceptInvite: null,
    declineInvite: null,
    addChild: null,
    updateChild: null, // Added
    deleteChild: null, // Added
    updateMembership: null, // For role update
    // deleteFamily: null, // Already added above
    // updateMembership: null, // REMOVE THIS DUPLICATE
    deleteMembership: null, // Added deleteMembership error
  },
};

// --- Async Thunks ---

// Thunk to fetch family groups from the API
export const fetchFamilyGroups = createAsyncThunk<
  FamilyGroup[], // Return Type
  void, // Argument Type
  { rejectValue: string }
>('family/fetchFamilyGroups', async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get<PaginatedFamilyResponse>('/families/');
    return response.data.results; // Remember pagination!
  } catch (error: any) {
    const message =
      error.response?.data?.detail || error.message || 'Failed to fetch family groups';
    return rejectWithValue(message);
  }
});

// Thunk to fetch details for a specific family group
export const fetchFamilyDetail = createAsyncThunk<
  FamilyGroup, // Return Type
  number, // Argument Type: familyId
  { rejectValue: string }
>('family/fetchFamilyDetail', async (familyId, { rejectWithValue }) => {
  try {
    const response = await apiClient.get<FamilyGroup>(`/families/${familyId}/`);
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.detail || error.message || 'Failed to fetch family details';
    return rejectWithValue(message);
  }
});

// Thunk to fetch members for a specific family group
export const fetchFamilyMembers = createAsyncThunk<
  FamilyMembership[], // Return Type
  number, // Argument Type: familyId
  { rejectValue: string }
>('family/fetchFamilyMembers', async (familyId, { rejectWithValue }) => {
  try {
    // Assuming the endpoint is /api/families/{id}/members/
    const response = await apiClient.get<FamilyMembership[]>(`/families/${familyId}/members/`);
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.detail || error.message || 'Failed to fetch family members';
    return rejectWithValue(message);
  }
});

// Thunk to fetch children for a specific family group
export const fetchFamilyChildren = createAsyncThunk<
  Child[], // Return Type
  number, // Argument Type: familyId
  { rejectValue: string }
>('family/fetchFamilyChildren', async (familyId, { rejectWithValue }) => {
  try {
    // Assuming the endpoint is /api/families/{id}/children/
    const response = await apiClient.get<Child[]>(`/families/${familyId}/children/`);
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.detail || error.message || 'Failed to fetch family children';
    return rejectWithValue(message);
  }
});

// Thunk to create a new family group
export const createFamily = createAsyncThunk<
  FamilyGroup, // Return Type
  { name: string }, // Argument Type
  { rejectValue: string }
>('family/createFamily', async (familyData, { rejectWithValue }) => {
  try {
    const response = await apiClient.post<FamilyGroup>('/families/create/', familyData);
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.detail || error.message || 'Failed to create family';
    return rejectWithValue(message);
  }
});

// Thunk to create an invite
export const createInvite = createAsyncThunk<
  FamilyInvite, // Return Type
  { familyId: number; email: string; role: string }, // Argument Type
  { rejectValue: string }
>('family/createInvite', async ({ familyId, email, role }, { rejectWithValue }) => {
  try {
    const response = await apiClient.post<FamilyInvite>(`/families/${familyId}/invite/`, { email, role });
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.detail || error.message || 'Failed to create invite';
    return rejectWithValue(message);
  }
});

// Thunk to accept an invite
export const acceptInvite = createAsyncThunk<
  { detail: string }, // Return Type (API returns a detail message)
  string, // Argument Type: invite_code
  { rejectValue: string }
>('family/acceptInvite', async (inviteCode, { rejectWithValue }) => {
  try {
    const response = await apiClient.post<{ detail: string }>(`/invites/accept/${inviteCode}/`);
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.detail || error.message || 'Failed to accept invite';
    return rejectWithValue(message);
  }
});

// Thunk to decline an invite
export const declineInvite = createAsyncThunk<
  { detail: string }, // Return Type
  string, // Argument Type: invite_code
  { rejectValue: string }
>('family/declineInvite', async (inviteCode, { rejectWithValue }) => {
  try {
    const response = await apiClient.post<{ detail: string }>(`/invites/decline/${inviteCode}/`);
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.detail || error.message || 'Failed to decline invite';
    return rejectWithValue(message);
  }
});

// Thunk to add a child
// Define the argument type explicitly for clarity
interface AddChildPayload {
  familyId: number;
  firstName: string;
  lastName: string;
  birthDate?: string; // Optional
  gender?: string; // Optional
}
export const addChild = createAsyncThunk<
  Child, // Return Type
  AddChildPayload, // Argument Type using the interface
  { rejectValue: string }
>('family/addChild', async (childData, { rejectWithValue }) => {
    const { familyId, firstName, lastName, birthDate, gender } = childData;
    // Construct payload based on backend expectations (likely snake_case)
    const payload: any = {
        family: familyId, // Use 'family' as per ChildCreateSerializer
        first_name: firstName,
        last_name: lastName,
    };
    if (birthDate) payload.birth_date = birthDate;
    if (gender) payload.gender = gender;

    try {
        // Assuming endpoint is /api/children/ based on ChildViewSet
        const response = await apiClient.post<Child>('/children/', payload);
        return response.data;
    } catch (error: any) {
        const message =
            error.response?.data?.detail || JSON.stringify(error.response?.data) || error.message || 'Failed to add child';
        return rejectWithValue(message);
    }
});

// Thunk to update a family group
interface UpdateFamilyPayload {
  id: number;
  name: string;
  // Add other updatable fields if necessary
}
export const updateFamily = createAsyncThunk<
  FamilyGroup, // Return Type
  UpdateFamilyPayload, // Argument Type
  { rejectValue: string }
>('family/updateFamily', async (familyData, { rejectWithValue }) => {
  try {
    // Use PATCH for partial updates, PUT if replacing the whole object
    const response = await apiClient.patch<FamilyGroup>(`/families/${familyData.id}/`, { name: familyData.name });
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.detail || JSON.stringify(error.response?.data) || error.message || 'Failed to update family';
    return rejectWithValue(message);
  }
});

// Thunk to delete a family group
export const deleteFamily = createAsyncThunk<
  number, // Return Type: ID of the deleted family
  number, // Argument Type: familyId
  { rejectValue: string }
>('family/deleteFamily', async (familyId, { rejectWithValue }) => {
  try {
    await apiClient.delete(`/families/${familyId}/`);
    return familyId; // Return the ID on success
  } catch (error: any) {
    const message =
      error.response?.data?.detail || JSON.stringify(error.response?.data) || error.message || 'Failed to delete family';
    return rejectWithValue(message);
  }
});

// Thunk to update a membership (e.g., change role)
interface UpdateMembershipPayload {
  membershipId: number;
  role: string; // Or specific role type 'PARENT' | 'CHILD' etc.
  // Add other fields like is_admin if needed
}
export const updateMembership = createAsyncThunk<
  FamilyMembership, // Return Type
  UpdateMembershipPayload, // Argument Type
  { rejectValue: string }
>('family/updateMembership', async (membershipData, { rejectWithValue }) => {
  const { membershipId, ...payload } = membershipData;
  try {
    const response = await apiClient.patch<FamilyMembership>(`/memberships/${membershipId}/`, payload);
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.detail || JSON.stringify(error.response?.data) || error.message || 'Failed to update membership';
    return rejectWithValue(message);
  }
});

// Thunk to update a child's details
interface UpdateChildPayload {
  id: number;
  familyId: number; // Needed for potential re-fetch or context
  // Payload can be either the standard fields OR FormData
  formData?: FormData; // Optional FormData for image upload
  firstName?: string; // Used if formData is not present
  lastName?: string; // Used if formData is not present
  birthDate?: string | null; // Used if formData is not present
  gender?: string; // Used if formData is not present
}
export const updateChild = createAsyncThunk<
  Child, // Return Type
  UpdateChildPayload, // Argument Type
  { rejectValue: string }
>('family/updateChild', async (childData, { rejectWithValue }) => {
  const { id, formData, ...updatePayload } = childData;

  try {
    let response;
    if (formData) {
      // Send FormData with appropriate headers
      response = await apiClient.patch<Child>(`/children/${id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } else {
      // Send JSON payload for non-image updates
      const payload: any = {};
      if (updatePayload.firstName !== undefined) payload.first_name = updatePayload.firstName;
      if (updatePayload.lastName !== undefined) payload.last_name = updatePayload.lastName;
      if (updatePayload.birthDate !== undefined) payload.birth_date = updatePayload.birthDate;
      if (updatePayload.gender !== undefined) payload.gender = updatePayload.gender;
      response = await apiClient.patch<Child>(`/children/${id}/`, payload);
    }
    return response.data;
  } catch (error: any) {
    // Improved error message parsing
    let message = 'Failed to update child';
    if (error.response?.data) {
        if (typeof error.response.data === 'string') {
            message = error.response.data;
        } else if (error.response.data.detail) {
            message = error.response.data.detail;
        } else {
            // Try to format object errors
            try {
                message = Object.entries(error.response.data)
                                .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                                .join('; ');
            } catch {
                 message = JSON.stringify(error.response.data);
            }
        }
    } else if (error.message) {
        message = error.message;
    }
    return rejectWithValue(message);
  }
});

// Thunk to delete a child
export const deleteChild = createAsyncThunk<
  number, // Return Type: ID of the deleted child
  number, // Argument Type: childId
  { rejectValue: string }
>('family/deleteChild', async (childId, { rejectWithValue }) => {
  try {
    await apiClient.delete(`/children/${childId}/`);
    return childId; // Return the ID on success
  } catch (error: any) {
    const message =
      error.response?.data?.detail || JSON.stringify(error.response?.data) || error.message || 'Failed to delete child';
    return rejectWithValue(message);
  }
});


// Thunk to remove a family membership (delete a member)
export const removeMembership = createAsyncThunk<
  number, // Return Type: ID of the deleted membership
  number, // Argument Type: membershipId
  { rejectValue: string }
>('family/removeMembership', async (membershipId, { rejectWithValue }) => {
  try {
    // Assuming endpoint is /api/memberships/{id}/ based on FamilyMembershipViewSet
    await apiClient.delete(`/memberships/${membershipId}/`);
    return membershipId; // Return the ID on success
  } catch (error: any) {
    const message =
      error.response?.data?.detail || JSON.stringify(error.response?.data) || error.message || 'Failed to remove member';
    return rejectWithValue(message);
  }
});


// Add more thunks later for update/delete operations as needed

// --- Slice Definition ---

const familySlice = createSlice({
  name: 'family',
  initialState,
  reducers: {
    // Clear specific errors
    clearFamilyListError: (state) => { state.error.list = null; },
    clearFamilyDetailError: (state) => { state.error.detail = null; },
    clearFamilyMembersError: (state) => { state.error.members = null; },
    clearFamilyChildrenError: (state) => { state.error.children = null; },
    clearFamilyInvitesError: (state) => { state.error.invites = null; },
    clearCreateFamilyError: (state) => { state.error.createFamily = null; },
    clearCreateInviteError: (state) => { state.error.createInvite = null; },
    clearAcceptInviteError: (state) => { state.error.acceptInvite = null; },
    clearDeclineInviteError: (state) => { state.error.declineInvite = null; },
    clearAddChildError: (state) => { state.error.addChild = null; },
    clearUpdateFamilyError: (state) => { state.error.updateFamily = null; },
    clearDeleteFamilyError: (state) => { state.error.deleteFamily = null; },
    clearUpdateMembershipError: (state) => { state.error.updateMembership = null; }, // Added
    clearUpdateChildError: (state) => { state.error.updateChild = null; }, // Added
    clearDeleteChildError: (state) => { state.error.deleteChild = null; }, // Added
    clearDeleteMembershipError: (state) => { state.error.deleteMembership = null; }, // Added
    // Action to clear current family detail when navigating away
    clearCurrentFamily: (state) => {
        state.currentFamily = null;
        state.members = [];
        state.children = [];
        state.invites = [];
        state.error.detail = null;
        state.error.members = null;
        state.error.children = null;
        state.error.invites = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchFamilyGroups cases - Ensure fetchFamilyGroups is correctly referenced
      .addCase(fetchFamilyGroups.pending, (state) => {
        state.loading.list = true;
        state.error.list = null;
      })
      .addCase(fetchFamilyGroups.fulfilled, (state, action: PayloadAction<FamilyGroup[]>) => {
        console.log('API Response for /families/ results:', JSON.stringify(action.payload, null, 2));
        state.loading.list = false;
        state.familyGroups = Array.isArray(action.payload) ? action.payload : [];
        state.error.list = null;
      })
      .addCase(fetchFamilyGroups.rejected, (state, action) => {
        state.loading.list = false;
        state.familyGroups = [];
        state.error.list = action.payload ?? 'An unknown error occurred fetching family list';
      })

      // fetchFamilyDetail cases - These seem okay
      .addCase(fetchFamilyDetail.pending, (state) => {
        state.loading.detail = true;
        state.error.detail = null;
        state.currentFamily = null; // Clear previous detail
      })
      .addCase(fetchFamilyDetail.fulfilled, (state, action: PayloadAction<FamilyGroup>) => {
        state.loading.detail = false;
        state.currentFamily = action.payload;
      })
      .addCase(fetchFamilyDetail.rejected, (state, action) => {
        state.loading.detail = false;
        state.error.detail = action.payload ?? 'An unknown error occurred fetching family details';
      })

      // fetchFamilyMembers cases
      .addCase(fetchFamilyMembers.pending, (state) => {
        state.loading.members = true;
        state.error.members = null;
        state.members = []; // Clear previous members
      })
      .addCase(fetchFamilyMembers.fulfilled, (state, action: PayloadAction<FamilyMembership[]>) => {
        state.loading.members = false;
        state.members = action.payload;
      })
      .addCase(fetchFamilyMembers.rejected, (state, action) => {
        state.loading.members = false;
        state.error.members = action.payload ?? 'An unknown error occurred fetching members';
      })

      // fetchFamilyChildren cases
      .addCase(fetchFamilyChildren.pending, (state) => {
        state.loading.children = true;
        state.error.children = null;
        state.children = []; // Clear previous children
      })
      .addCase(fetchFamilyChildren.fulfilled, (state, action: PayloadAction<Child[]>) => {
        state.loading.children = false;
        state.children = action.payload;
      })
      .addCase(fetchFamilyChildren.rejected, (state, action) => {
        state.loading.children = false;
        state.error.children = action.payload ?? 'An unknown error occurred fetching children';
      })

      // createFamily cases
      .addCase(createFamily.pending, (state) => {
        state.loading.createFamily = true;
        state.error.createFamily = null;
      })
      .addCase(createFamily.fulfilled, (state, _action: PayloadAction<FamilyGroup>) => { // Prefix action
        state.loading.createFamily = false;
        state.error.createFamily = null; // Clear error
        // Re-fetch will be handled in the component
      })
      .addCase(createFamily.rejected, (state, action) => {
        state.loading.createFamily = false;
        state.error.createFamily = action.payload ?? 'An unknown error occurred creating family';
      })

      // createInvite cases
      .addCase(createInvite.pending, (state) => {
        state.loading.createInvite = true;
        state.error.createInvite = null;
      })
      .addCase(createInvite.fulfilled, (state, action: PayloadAction<FamilyInvite>) => {
        state.loading.createInvite = false;
        state.invites.push(action.payload); // Add to invites list if needed
        // Display success message to user
      })
      .addCase(createInvite.rejected, (state, action) => {
        state.loading.createInvite = false;
        state.error.createInvite = action.payload ?? 'An unknown error occurred creating invite';
      })

      // acceptInvite cases
      .addCase(acceptInvite.pending, (state) => {
        state.loading.acceptInvite = true;
        state.error.acceptInvite = null;
      })
      .addCase(acceptInvite.fulfilled, (state) => {
        state.loading.acceptInvite = false;
        // Need to re-fetch family list or update state manually if possible
      })
      .addCase(acceptInvite.rejected, (state, action) => {
        state.loading.acceptInvite = false;
        state.error.acceptInvite = action.payload ?? 'An unknown error occurred accepting invite';
      })

      // declineInvite cases
      .addCase(declineInvite.pending, (state) => {
        state.loading.declineInvite = true;
        state.error.declineInvite = null;
      })
      .addCase(declineInvite.fulfilled, (state) => {
        state.loading.declineInvite = false;
        // Maybe remove invite from a list if displayed
      })
      .addCase(declineInvite.rejected, (state, action) => {
        state.loading.declineInvite = false;
        state.error.declineInvite = action.payload ?? 'An unknown error occurred declining invite';
      })

      // addChild cases - Ensure addChild is correctly referenced
      .addCase(addChild.pending, (state) => {
        state.loading.addChild = true;
        state.error.addChild = null;
      })
      .addCase(addChild.fulfilled, (state, _action: PayloadAction<Child>) => { // Prefix action with _
        state.loading.addChild = false;
        state.error.addChild = null; // Clear error on success
        // We will re-fetch the children list in the component instead of manually adding here
        // This ensures consistency with the backend data.
      })
      .addCase(addChild.rejected, (state, action) => {
        state.loading.addChild = false;
        state.error.addChild = action.payload ?? 'An unknown error occurred adding child';
      })

      // updateFamily cases
      .addCase(updateFamily.pending, (state) => {
        state.loading.updateFamily = true;
        state.error.updateFamily = null;
      })
      .addCase(updateFamily.fulfilled, (state, action: PayloadAction<FamilyGroup>) => {
        state.loading.updateFamily = false;
        // Update the family in the list
        const index = state.familyGroups.findIndex(f => f.id === action.payload.id);
        if (index !== -1) {
          state.familyGroups[index] = action.payload;
        }
        // Update the current family if it's the one being edited
        if (state.currentFamily && state.currentFamily.id === action.payload.id) {
          state.currentFamily = action.payload;
        }
      })
      .addCase(updateFamily.rejected, (state, action) => {
        state.loading.updateFamily = false;
        state.error.updateFamily = action.payload ?? 'An unknown error occurred updating family';
      })

      // deleteFamily cases
      .addCase(deleteFamily.pending, (state) => {
        state.loading.deleteFamily = true;
        state.error.deleteFamily = null;
      })
      .addCase(deleteFamily.fulfilled, (state, _action: PayloadAction<number>) => { // Prefix action
        state.loading.deleteFamily = false;
        state.error.deleteFamily = null; // Clear error
        // Re-fetch will be handled in the component
        // Clear current family if it was the one deleted
        if (state.currentFamily && state.currentFamily.id === _action.payload) {
          state.currentFamily = null;
          state.members = [];
          state.children = [];
          state.invites = [];
        }
      })
      .addCase(deleteFamily.rejected, (state, action) => {
        state.loading.deleteFamily = false;
        state.error.deleteFamily = action.payload ?? 'An unknown error occurred deleting family';
      })

      // removeMembership cases
      .addCase(removeMembership.pending, (state) => {
        state.loading.deleteMembership = true;
        state.error.deleteMembership = null;
      })
      .addCase(removeMembership.fulfilled, (state, _action: PayloadAction<number>) => { // Prefix action
        state.loading.deleteMembership = false;
        state.error.deleteMembership = null; // Clear error
        // Re-fetch will be handled in the component
      })
      .addCase(removeMembership.rejected, (state, action) => {
        state.loading.deleteMembership = false;
        state.error.deleteMembership = action.payload ?? 'An unknown error occurred removing member';
      })

      // updateChild cases
      .addCase(updateChild.pending, (state) => {
        state.loading.updateChild = true;
        state.error.updateChild = null;
      })
      .addCase(updateChild.fulfilled, (state, action: PayloadAction<Child>) => {
        state.loading.updateChild = false;
        // Update the child in the list
        const index = state.children.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.children[index] = action.payload;
        }
      })
      .addCase(updateChild.rejected, (state, action) => {
        state.loading.updateChild = false;
        state.error.updateChild = action.payload ?? 'An unknown error occurred updating child';
      })

      // deleteChild cases
      .addCase(deleteChild.pending, (state) => {
        state.loading.deleteChild = true;
        state.error.deleteChild = null;
      })
      .addCase(deleteChild.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading.deleteChild = false;
        // Remove the child from the list
        state.children = state.children.filter(c => c.id !== action.payload);
      })
      .addCase(deleteChild.rejected, (state, action) => {
        state.loading.deleteChild = false;
        state.error.deleteChild = action.payload ?? 'An unknown error occurred deleting child';
      })

      // updateMembership cases
      .addCase(updateMembership.pending, (state) => {
        state.loading.updateMembership = true;
        state.error.updateMembership = null;
      })
      .addCase(updateMembership.fulfilled, (state, action: PayloadAction<FamilyMembership>) => {
        state.loading.updateMembership = false;
        // Update the member in the list
        const index = state.members.findIndex(m => m.id === action.payload.id);
        if (index !== -1) {
          state.members[index] = action.payload;
        }
      })
      .addCase(updateMembership.rejected, (state, action) => {
        state.loading.updateMembership = false;
        state.error.updateMembership = action.payload ?? 'An unknown error occurred updating membership';
      });
  },
});

// --- Export Actions and Reducer ---
export const { // Corrected exports
  clearFamilyListError,
  clearFamilyDetailError,
  clearFamilyMembersError,
  clearFamilyChildrenError,
  clearFamilyInvitesError,
  clearCreateFamilyError,
  clearCreateInviteError,
  clearAcceptInviteError,
  clearDeclineInviteError,
  clearAddChildError,
  clearUpdateFamilyError,
  clearDeleteFamilyError,
  clearUpdateMembershipError, // Added
  clearUpdateChildError, // Added
  clearDeleteChildError, // Added
  clearDeleteMembershipError, // Added
  clearCurrentFamily,
} = familySlice.actions;
export default familySlice.reducer;

// --- Selectors ---
export const selectAllFamilyGroups = (state: RootState) => state.family.familyGroups;
export const selectCurrentFamilyDetail = (state: RootState) => state.family.currentFamily;
export const selectCurrentFamilyMembers = (state: RootState) => state.family.members;
export const selectCurrentFamilyChildren = (state: RootState) => state.family.children;
export const selectCurrentFamilyInvites = (state: RootState) => state.family.invites;

export const selectFamilyLoading = (state: RootState) => state.family.loading; // Combined loading state
export const selectFamilyError = (state: RootState) => state.family.error; // Combined error state

// Individual loading selectors
export const selectFamilyListLoading = (state: RootState) => state.family.loading.list;
export const selectFamilyDetailLoading = (state: RootState) => state.family.loading.detail;
export const selectFamilyMembersLoading = (state: RootState) => state.family.loading.members;
export const selectFamilyChildrenLoading = (state: RootState) => state.family.loading.children;
export const selectCreateFamilyLoading = (state: RootState) => state.family.loading.createFamily;
export const selectCreateInviteLoading = (state: RootState) => state.family.loading.createInvite;
export const selectAcceptInviteLoading = (state: RootState) => state.family.loading.acceptInvite;
export const selectDeclineInviteLoading = (state: RootState) => state.family.loading.declineInvite;
export const selectAddChildLoading = (state: RootState) => state.family.loading.addChild;
export const selectUpdateFamilyLoading = (state: RootState) => state.family.loading.updateFamily;
export const selectDeleteFamilyLoading = (state: RootState) => state.family.loading.deleteFamily;
export const selectUpdateMembershipLoading = (state: RootState) => state.family.loading.updateMembership; // Added
export const selectUpdateChildLoading = (state: RootState) => state.family.loading.updateChild; // Added
export const selectDeleteChildLoading = (state: RootState) => state.family.loading.deleteChild; // Added
export const selectDeleteMembershipLoading = (state: RootState) => state.family.loading.deleteMembership; // Added

// Individual error selectors
export const selectFamilyListError = (state: RootState) => state.family.error.list;
export const selectFamilyDetailError = (state: RootState) => state.family.error.detail;
export const selectFamilyMembersError = (state: RootState) => state.family.error.members;
export const selectFamilyChildrenError = (state: RootState) => state.family.error.children;
export const selectCreateFamilyError = (state: RootState) => state.family.error.createFamily;
export const selectCreateInviteError = (state: RootState) => state.family.error.createInvite;
export const selectAcceptInviteError = (state: RootState) => state.family.error.acceptInvite;
export const selectDeclineInviteError = (state: RootState) => state.family.error.declineInvite;
export const selectAddChildError = (state: RootState) => state.family.error.addChild;
export const selectUpdateFamilyError = (state: RootState) => state.family.error.updateFamily;
export const selectDeleteFamilyError = (state: RootState) => state.family.error.deleteFamily;
export const selectUpdateMembershipError = (state: RootState) => state.family.error.updateMembership; // Added
export const selectUpdateChildError = (state: RootState) => state.family.error.updateChild; // Added
export const selectDeleteChildError = (state: RootState) => state.family.error.deleteChild; // Added
export const selectDeleteMembershipError = (state: RootState) => state.family.error.deleteMembership; // Added

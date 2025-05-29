import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../services/api';
import { RootState } from '../rootReducer';

// Define the shape of a single task (adjust based on API)
export interface Task { // Add export keyword
  id: number;
  title: string;
  description?: string;
  due_date?: string | null; // ISO 8601 format string or null
  completed: boolean;
  assignee?: number | null; // User ID
  event?: number | null; // Event ID
  // Add other relevant fields
}

// Define the shape of the tasks state
interface TasksState {
  items: Task[]; // Could be all tasks, or just relevant ones (e.g., pending)
  isLoading: boolean; // For fetching
  isUpdating: boolean; // For updating status
  error: string | null; // For fetching
  updateError: string | null; // For updating status
}

// Initial state
const initialState: TasksState = {
  items: [],
  isLoading: false,
  isUpdating: false, // Added
  error: null,
  updateError: null, // Added
};

// Async thunk to fetch pending tasks assigned to the current user
// Adjust API endpoint and parameters as needed
export const fetchPendingTasks = createAsyncThunk<
  Task[],
  void,
  { state: RootState; rejectValue: string }
>(
  'tasks/fetchPending',
  async (_, { getState, rejectWithValue }) => {
    const userId = getState().auth.user?.id; // Get current user ID
    if (!userId) {
      return rejectWithValue('User not authenticated');
    }
    try {
      // Example: Fetch tasks assigned to user, not completed, limit 5 for dashboard
      const response = await apiClient.get(`/tasks/?assignee=${userId}&completed=false&limit=5`);
      return response.data.results || response.data;
    } catch (error: any) {
      console.error("Failed to fetch pending tasks:", error);
      const message = error.response?.data?.detail || error.message || 'Failed to fetch tasks';
      return rejectWithValue(message);
    }
  }
);

// Async thunk to update task status (completed field)
export const updateTaskStatus = createAsyncThunk<
  Task, // Return the updated task
  { taskId: number; completed: boolean }, // Arguments
  { rejectValue: string }
>(
  'tasks/updateStatus',
  async ({ taskId, completed }, { rejectWithValue }) => {
    try {
      // Assuming PATCH request to update the completed status
      const response = await apiClient.patch<Task>(`/tasks/${taskId}/`, { completed });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to update task status';
      return rejectWithValue(message);
    }
  }
);


const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearTasksError(state) { // Clears fetch error
        state.error = null;
    },
    clearUpdateTaskError(state) { // Added: Clears update error
        state.updateError = null;
    }
    // Add other task-related reducers later (addTask, deleteTask, etc.)
  },
  extraReducers: (builder) => {
    builder
      // Fetch Pending Tasks
      .addCase(fetchPendingTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPendingTasks.fulfilled, (state, action: PayloadAction<Task[]>) => {
        state.isLoading = false;
        state.items = action.payload; // Store fetched pending tasks
        state.error = null;
      })
      .addCase(fetchPendingTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to fetch pending tasks';
      })
      // Update Task Status
      .addCase(updateTaskStatus.pending, (state) => {
        state.isUpdating = true;
        state.updateError = null;
      })
      .addCase(updateTaskStatus.fulfilled, (state, action: PayloadAction<Task>) => {
        state.isUpdating = false;
        // Find and update the task in the items array
        const index = state.items.findIndex(task => task.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        // If the task list represents only pending tasks, completed tasks should be removed
        // Consider if this slice should hold ALL tasks and filter in selectors/components
        // For now, assuming `items` might hold mixed tasks or needs filtering after update
        // state.items = state.items.filter(task => !task.completed); // Example if only showing pending
      })
      .addCase(updateTaskStatus.rejected, (state, action) => {
        state.isUpdating = false;
        state.updateError = action.payload ?? 'Failed to update task status';
      });
  },
});

export const { clearTasksError, clearUpdateTaskError } = tasksSlice.actions; // Added clearUpdateTaskError
export default tasksSlice.reducer;

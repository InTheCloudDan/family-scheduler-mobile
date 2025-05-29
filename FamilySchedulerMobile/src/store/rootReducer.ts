import { combineReducers } from '@reduxjs/toolkit';

// Import your slice reducers here when you create them
import authReducer from './slices/authSlice';
import eventsReducer from './slices/eventsSlice'; // Import events reducer
import tasksReducer from './slices/tasksSlice'; // Import tasks reducer
import notificationsReducer from './slices/notificationsSlice'; // Import notifications reducer
import vacationsReducer from './slices/vacationsSlice'; // Import vacations reducer
import familyReducer from './slices/familySlice'; // Import family reducer
import calendarReducer from './slices/calendarSlice'; // Import calendar reducer

const rootReducer = combineReducers({
  auth: authReducer,
  events: eventsReducer,
  tasks: tasksReducer,
  notifications: notificationsReducer,
  vacations: vacationsReducer,
  family: familyReducer,
  calendar: calendarReducer, // Add calendar reducer
  // Add other reducers here as needed
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;

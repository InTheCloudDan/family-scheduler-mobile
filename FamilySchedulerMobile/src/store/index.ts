import { configureStore } from '@reduxjs/toolkit';
import rootReducer, { RootState } from './rootReducer';

const store = configureStore({
  reducer: rootReducer,
  // Middleware can be added here if needed (e.g., for logging, async actions)
  // middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logger),
});

// Infer the `AppDispatch` type from the store itself
export type AppDispatch = typeof store.dispatch;

export default store;

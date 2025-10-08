import { createSlice } from "@reduxjs/toolkit";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";

const initialState = {
  mode: "dark", // Set the initial mode to "dark"
};

export const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    setMode: (state) => {
      state.mode = state.mode === "light" ? "dark" : "light"; // Toggle between light and dark mode
    },
  },
});

// Export the action to toggle the mode
export const { setMode } = globalSlice.actions;

// Configure the Redux store
export const store = configureStore({
  reducer: {
    global: globalSlice.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({
    serializableCheck: false
  }),
});

// Export the reducer as default
export default globalSlice.reducer;

// Optionally export `globalReducer` for consistent naming
export const globalReducer = globalSlice.reducer;

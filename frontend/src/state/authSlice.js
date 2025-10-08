import { createSlice } from "@reduxjs/toolkit";

// Retrieve token and user info from localStorage
const token = localStorage.getItem("token");
const user = localStorage.getItem("user");

// Safely parse the user data if it exists
const parsedUser = user ? JSON.parse(user) : null; // Avoid parsing undefined

const initialState = {
  isAuthenticated: !!token,
  token: token || null,
  user: parsedUser,  // Safely parse user data
  role: parsedUser ? parsedUser.role : null,  // Safely access the role if the user exists
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login(state, action) {
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.role = action.payload.user.role;  // Save role in Redux state

      // Persist to localStorage
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("user", JSON.stringify(action.payload.user));  // Safely store user object
    },
    logout(state) {
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      state.role = null;

      // Remove from localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
    updateUser(state, action) {
      // Update user data in state
      state.user = {
        ...state.user,
        ...action.payload
      };
      
      // Update localStorage
      localStorage.setItem("user", JSON.stringify(state.user));
    },
  },
});

export const { login, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;

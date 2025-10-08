import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { Provider } from "react-redux";
import { setupListeners } from "@reduxjs/toolkit/query";
import { store } from "./state"; // Import store from state/index.js
import authService from "./services/authService"; // Import auth service

// Initialize authentication service with the token if it exists
const token = localStorage.getItem("token");
if (token) {
  authService.setAuthToken(token);
}

// Set up RTK Query listeners
setupListeners(store.dispatch);

// Render the application
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);

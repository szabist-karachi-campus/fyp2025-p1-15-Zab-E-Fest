import { CssBaseline } from "@mui/material";
import { themeSettings } from "./theme";
import { useMemo, useEffect } from "react";
import { createTheme } from "@mui/material/styles";
import { useSelector, useDispatch } from "react-redux";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./scenes/dashboard";
import Layout from "./scenes/layout";
import EventManagement from "./scenes/Event";
import ModuleManagement  from "./scenes/Modules";
import { ParticipantManagement } from "./scenes/Participant_management";
import PaymentProcessing from "./scenes/payment";
import PermissionManagement from "./scenes/PermissionManagement";
import { NotificationManagement } from "./scenes/Notification";
import Results from "./scenes/Results";
import { ThemeProvider } from "@mui/material/styles";
import LoginPage from "./scenes/LoginPage";
import ForgotPassword from "./scenes/ForgotPassword";
import ResetPassword from "./scenes/ResetPassword";
import { login } from "./state/authSlice";
import RegistrationTeam from "./registrationTeam/RegistrationTeam"; // Registration Team Dashboard component
import ModuleHeadDashboard from "./moduleRole/moduleHead/ModuleHeadDashboard"; // Module Head Dashboard
import ModuleLeaderDashboard from "./moduleRole/moduleLeader/ModuleLeaderDashboard"; // Module Leader Dashboard
import ProtectedRoute from "./components/ProtectedRoute"; // Import the new ProtectedRoute component
import authService from "./services/authService"; // Import the authentication service

function App() {
  const dispatch = useDispatch();
  const mode = useSelector((state) => state.global.mode);
  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const userRole = useSelector((state) => state.auth.role); // Track the user's role

  // Check for token and user data in localStorage on initial load
  useEffect(() => {
    // Initialize auth service and validate token
    const userData = authService.initializeAuth();
    
    if (userData) {
      dispatch(
        login({
          token: localStorage.getItem("token"),
          user: userData,
        })
      );
    }
  }, [dispatch]);

  // Helper function to redirect based on role
  const getRedirectPath = () => {
    switch (userRole) {
      case "registrationTeam":
        return "/registrationTeam";
      case "ModuleHead":
        return "/moduleHeadDashboard";
      case "ModuleLeader":
        return "/moduleLeaderDashboard";
      case "admin":
        return "/admindashboard";
      default:
        return "/login";
    }
  };

  return (
    <div className="app">
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/" 
              element={!isAuthenticated ? <LoginPage /> : <Navigate to={getRedirectPath()} replace />} 
            />
            
            <Route 
              path="/login" 
              element={!isAuthenticated ? <LoginPage /> : <Navigate to={getRedirectPath()} replace />} 
            />

            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Admin Routes */}
            <Route 
              element={
                <ProtectedRoute 
                  allowedRoles={["admin"]} 
                  redirectTo="/login"
                />
              }
            >
              <Route element={<Layout />}>
                <Route path="/admindashboard" element={<Dashboard />} />
                <Route path="/events" element={<EventManagement />} />
                <Route path="/modules" element={<ModuleManagement />} />
                <Route path="/participants" element={<ParticipantManagement />} />
                <Route path="/payments" element={<PaymentProcessing />} />
                <Route path="/permissions" element={<PermissionManagement />} />
                <Route path="/results" element={<Results />} />
                <Route path="/notifications" element={<NotificationManagement />} />
              </Route>
            </Route>

            {/* Registration Team Routes */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["registrationTeam"]}
                  redirectTo="/login"
                />
              }
            >
              <Route path="/registrationTeam" element={<RegistrationTeam />} />
            </Route>

            {/* Module Head Routes */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["ModuleHead"]}
                  redirectTo="/login"
                />
              }
            >
              <Route path="/moduleHeadDashboard" element={<ModuleHeadDashboard />} />
            </Route>

            {/* Module Leader Routes */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["ModuleLeader"]}
                  redirectTo="/login"
                />
              }
            >
              <Route path="/moduleLeaderDashboard" element={<ModuleLeaderDashboard />} />
            </Route>

            {/* Universal redirect for dashboard path */}
            <Route
              path="/dashboard"
              element={<Navigate to={getRedirectPath()} replace />}
            />

            {/* 404 Not Found - Catch-all route */}
            <Route 
              path="*" 
              element={
                isAuthenticated 
                  ? <Navigate to={getRedirectPath()} replace /> 
                  : <Navigate to="/login" replace />
              } 
            />
          </Routes>
        </ThemeProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;

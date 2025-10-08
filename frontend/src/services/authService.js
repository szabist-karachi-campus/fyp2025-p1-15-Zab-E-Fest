import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { store } from '../state';
import { logout } from '../state/authSlice';

// Configure default axios settings
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Helper function to check the token format and fix if needed
const formatToken = (token) => {
  if (!token) return null;
  
  // If token already has 'Bearer ' prefix, return as is
  if (token.startsWith('Bearer ')) {
    return token;
  }
  
  // Otherwise add the prefix
  return `Bearer ${token}`;
};

/**
 * Authentication service for handling tokens and API requests
 */
const authService = {
  /**
   * Set the authentication token for all future axios requests
   * @param {string} token - JWT token
   */
  setAuthToken: (token) => {
    if (token) {
      const formattedToken = formatToken(token);
      axios.defaults.headers.common['Authorization'] = formattedToken;
      localStorage.setItem('token', token); // Store without Bearer prefix
      console.log('Auth token set:', formattedToken ? 'Yes' : 'No');
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
      console.log('Auth token cleared');
    }
  },

  /**
   * Check if the current token is valid
   * @returns {boolean} - Is token valid
   */
  isTokenValid: () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const decoded = jwtDecode(token);
      // Check if token is expired
      const currentTime = Date.now() / 1000;
      const isValid = decoded.exp > currentTime;
      console.log('Token validation:', isValid ? 'Valid' : 'Expired');
      return isValid;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  },

  /**
   * Secure API request with automatic token handling
   * @param {string} method - Request method
   * @param {string} url - API endpoint
   * @param {Object} data - Request payload
   * @returns {Promise} - API response
   */
  secureRequest: async (method, url, data = null) => {
    console.log(`SecureRequest - ${method.toUpperCase()} ${url}`);
    
    try {
      // Check token validity before making request
      if (!authService.isTokenValid()) {
        console.log('SecureRequest - Token invalid, forcing logout');
        // Force logout if token is invalid
        store.dispatch(logout());
        throw new Error('Session expired. Please login again.');
      }

      // Ensure token is correctly set in headers
      const token = localStorage.getItem('token');
      if (token) {
        axios.defaults.headers.common['Authorization'] = formatToken(token);
      }

      // Set up request configuration
      const config = {
        method,
        url,
        ...(data && { data })
      };

      console.log('SecureRequest - Config:', {
        method,
        url,
        hasData: !!data
      });

      const response = await axios(config);
      console.log('SecureRequest - Success:', {
        status: response.status,
        statusText: response.statusText
      });
      return response;
    } catch (error) {
      console.error('SecureRequest - Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Handle 401 Unauthorized errors
      if (error.response && error.response.status === 401) {
        console.log('SecureRequest - 401 Unauthorized, logging out');
        store.dispatch(logout());
      }
      throw error;
    }
  },

  /**
   * Initialize authentication from stored token
   * @returns {Object|null} - Decoded user data or null
   */
  initializeAuth: () => {
    const token = localStorage.getItem('token');
    if (token && authService.isTokenValid()) {
      authService.setAuthToken(token);
      try {
        return jwtDecode(token);
      } catch (error) {
        localStorage.removeItem('token');
        return null;
      }
    } else if (token) {
      // Remove invalid token
      localStorage.removeItem('token');
    }
    return null;
  },

  /**
   * Get the appropriate dashboard path based on user role
   * @param {string} role - User role
   * @returns {string} - Dashboard path
   */
  getDashboardByRole: (role) => {
    switch (role) {
      case 'admin':
        return '/admindashboard';
      case 'registrationTeam':
        return '/registrationTeam';
      case 'ModuleHead':
        return '/moduleHeadDashboard';
      case 'ModuleLeader':
        return '/moduleLeaderDashboard';
      default:
        return '/login';
    }
  },

  /**
   * Change user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise} - API response
   */
  changePassword: async (currentPassword, newPassword) => {
    return authService.secureRequest('post', '/api/admin/change-password', {
      currentPassword,
      newPassword
    });
  },

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update (name, email)
   * @returns {Promise} - API response
   */
  updateProfile: async (profileData) => {
    return authService.secureRequest('post', '/api/admin/update-profile', profileData);
  },

  /**
   * Get user profile
   * @param {string} userId - User ID (optional)
   * @returns {Promise} - API response
   */
  getProfile: async (userId = null) => {
    const url = userId ? `/api/admin/profile/${userId}` : '/api/admin/profile';
    return authService.secureRequest('get', url);
  },

  /**
   * Upload profile image
   * @param {File} imageFile - Image file to upload
   * @returns {Promise} - API response
   */
  uploadProfileImage: async (imageFile) => {
    // Check token validity
    if (!authService.isTokenValid()) {
      store.dispatch(logout());
      throw new Error('Session expired. Please login again.');
    }

    const formData = new FormData();
    formData.append('profileImage', imageFile);

    try {
      const response = await axios.post('/api/admin/update-profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response;
    } catch (error) {
      // Handle 401 Unauthorized errors
      if (error.response && error.response.status === 401) {
        store.dispatch(logout());
      }
      throw error;
    }
  }
};

// Intercept all axios responses to handle authentication errors
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Auto logout on 401 responses
      store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

export default authService; 
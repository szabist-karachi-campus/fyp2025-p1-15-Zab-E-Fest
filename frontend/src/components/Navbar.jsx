import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  useTheme,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Typography,
  Slider,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  FormControl,
  Select,
  InputLabel,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Link,
  Alert,
  CircularProgress,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Search from "@mui/icons-material/Search";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import ArrowDropDownOutlined from "@mui/icons-material/ArrowDropDownOutlined";
import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlined from "@mui/icons-material/LightModeOutlined";
import NotificationsOutlined from "@mui/icons-material/NotificationsOutlined";
import LockOutlined from "@mui/icons-material/LockOutlined";
import HelpOutlineOutlined from "@mui/icons-material/HelpOutlineOutlined";
import AccountCircleOutlined from "@mui/icons-material/AccountCircleOutlined";
import EmailOutlined from "@mui/icons-material/EmailOutlined";
import PhoneOutlined from "@mui/icons-material/PhoneOutlined";
import ChatOutlined from "@mui/icons-material/ChatOutlined";
import ArticleOutlined from "@mui/icons-material/ArticleOutlined";
import FlexBetween from "./FlexBetween";
import InputBase from "@mui/material/InputBase";
import { useDispatch, useSelector } from "react-redux";
import { setMode } from "../state";
import profileImagePlaceholder from "../assets/karan.jpg";
import { useNavigate } from "react-router-dom";
import { logout, updateUser } from "../state/authSlice";
import axios from "axios";
import authService from "../services/authService"; // Import auth service

const Navbar = ({ isSidebarOpen, setIsSidebarOpen, sidebarItems }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Get user data from Redux store
  const user = useSelector((state) => state.auth?.user) || { name: "Admin User" };
  const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  
  const [adminName, setAdminName] = useState(user.name);
  // Admin notifications list
  const [notifications, setNotifications] = useState([]);
  const [profileImage, setProfileImage] = useState(profileImagePlaceholder);
  const [fontSize, setFontSize] = useState(14);
  const [fontFamily, setFontFamily] = useState("Roboto");
  const [anchorEl, setAnchorEl] = useState(null);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  
  // New state variables for change password and help & support
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [helpFormData, setHelpFormData] = useState({
    subject: "",
    message: "",
    email: user.email || ""
  });
  const [helpSubmitted, setHelpSubmitted] = useState(false);
  const [profileEmail, setProfileEmail] = useState(user.email || "admin@example.com");
  // Note: notifications and setNotifications are defined above

  const openProfileMenu = Boolean(anchorEl);
  const openNotificationMenu = Boolean(notificationAnchorEl);

  const handleDropdownClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationClick = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleLogout = () => {
    // Clear auth token before dispatching logout
    authService.setAuthToken(null);
    dispatch(logout());
    navigate("/login");
  };

  const handleProfileImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Upload image to server using authService
      try {
        setIsSubmitting(true);
        
        // Use authService to upload profile image
        const response = await authService.uploadProfileImage(file);
        
        console.log('Image upload response:', response.data);
        
        // Update profile image state with the server path
        if (response.data && response.data.profileImage) {
          // Update local state with the returned image path
          setProfileImage(response.data.profileImage);
          
          // Update Redux store with new profile image
          dispatch(updateUser({
            profileImage: response.data.profileImage
          }));
        }
        
        setIsSubmitting(false);
      } catch (error) {
        console.error('Image upload error:', error.response?.data || error.message);
        setIsSubmitting(false);
      }
    }
  };

  const handleNameChange = async (newName) => {
    setAdminName(newName);
  };
  
  const handleSearch = (value) => {
    setSearchValue(value);
    
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }
    
    // Search through sidebar items
    if (sidebarItems && sidebarItems.length > 0) {
      const results = sidebarItems.filter(item => 
        item.name.toLowerCase().includes(value.toLowerCase())
      );
      setSearchResults(results);
    }
  };
  
  const handleSearchItemClick = (path) => {
    setSearchValue("");
    setSearchResults([]);
    
    // Verify if user has access to this path based on role
    const userRole = user?.role || '';
    
    // Check if path is allowed for this role
    if (
      (path.startsWith('/admin') && userRole !== 'admin') ||
      (path.startsWith('/moduleHead') && userRole !== 'ModuleHead') ||
      (path.startsWith('/moduleLeader') && userRole !== 'ModuleLeader') ||
      (path.startsWith('/registration') && userRole !== 'registrationTeam')
    ) {
      // If not allowed, redirect to their dashboard
      navigate(authService.getDashboardByRole(userRole));
    } else {
      // If allowed, navigate to the path
      navigate(path);
    }
  };
  
  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Reset states
    setPasswordError("");
    setPasswordSuccess("");
    
    // Validate passwords
    if (!currentPassword) {
      setPasswordError("Current password is required");
      return;
    }
    
    if (!newPassword) {
      setPasswordError("New password is required");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Use authService to change password
      const response = await authService.changePassword(currentPassword, newPassword);
      
      console.log('Password change response:', response.data);
      
      setPasswordSuccess("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        setPasswordDialogOpen(false);
        setPasswordSuccess("");
      }, 2000);
      
    } catch (error) {
      console.error('Password change error:', error.response?.data || error.message);
      setPasswordError(error.response?.data?.message || "Failed to change password");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle help & support form submission
  const handleHelpFormChange = (e) => {
    const { name, value } = e.target;
    setHelpFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleHelpSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      // Use secure request for support submission
      await authService.secureRequest(
        'post', 
        '/api/admin/support', 
        helpFormData
      );
      
      setHelpSubmitted(true);
      setHelpFormData({
        subject: "",
        message: "",
        email: user.email || ""
      });
      
      // Close dialog after 3 seconds
      setTimeout(() => {
        setHelpDialogOpen(false);
        setHelpSubmitted(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting help request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      // Use authService to update profile with both name and email
      const profileData = {
        name: adminName,
        email: profileEmail
      };
      
      console.log('Profile update data:', profileData);
      
      const response = await authService.updateProfile(profileData);
      
      console.log('Profile update response:', response.data);
      
      // Update Redux store with new user data
      if (response.data && response.data.user) {
        // Update the user in Redux store to keep it in sync
        dispatch(updateUser({
          name: response.data.user.name,
          email: response.data.user.email
        }));
      }
      
      setIsSubmitting(false);
      setProfileDialogOpen(false);
    } catch (error) {
      console.error('Profile update error:', error.response?.data || error.message);
      setIsSubmitting(false);
    }
  };

  // Apply font settings to the entire app
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    document.documentElement.style.fontFamily = fontFamily;
  }, [fontSize, fontFamily]);
  
  // Fetch the latest notifications for the current user. If the user is an admin,
  // fetch all notifications; otherwise, fetch notifications specific to the user's role.
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Determine the endpoint based on role
        let endpoint;
        const role = user?.role;
        if (!role || role.toLowerCase() === 'admin') {
          // Admin sees all notifications they have sent
          endpoint = '/api/notifications';
        } else {
          endpoint = `/api/notifications/role/${role}`;
        }
        const res = await axios.get(endpoint);
        const data = res.data || [];
        // Reverse to show latest first and take only the first 5 items
        setNotifications(data.reverse().slice(0, 5));
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };
    fetchNotifications();
  }, [user?.role]);

  // Fetch user profile data when component mounts
  useEffect(() => {
    // Check if user is authenticated before fetching profile
    if (user && user.id && isAuthenticated) {
      const fetchUserProfile = async () => {
        try {
          const response = await authService.getProfile(user.id);
          
          if (response.data) {
            // Update local state with fetched data
            if (response.data.name) setAdminName(response.data.name);
            if (response.data.email) setProfileEmail(response.data.email);
            if (response.data.profileImage) setProfileImage(response.data.profileImage);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      };
      
      fetchUserProfile();
    }
  }, [user, isAuthenticated]);
  
  // If not authenticated, don't render navbar
  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppBar
      sx={{
        position: "static",
        background: "none",
        boxShadow: "none",
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        {/* Left Side */}
        <FlexBetween>
          <IconButton onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ position: "relative" }}>
            <FlexBetween
              backgroundColor={theme.palette.background.alt}
              borderRadius="9px"
              gap="1rem"
              p="0.1rem 1.5rem"
            >
              <InputBase 
                placeholder="Search" 
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                sx={{ fontSize: `${fontSize}px` }} 
              />
              <IconButton>
                <Search />
              </IconButton>
            </FlexBetween>
            
            {searchResults.length > 0 && searchValue && (
              <Box 
                sx={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  width: "100%",
                  zIndex: 1000,
                  backgroundColor: theme.palette.background.alt,
                  borderRadius: "0 0 9px 9px",
                  boxShadow: 3,
                  mt: 0.5,
                  maxHeight: "300px",
                  overflow: "auto"
                }}
              >
                {searchResults.map((result, index) => (
                  <MenuItem 
                    key={index} 
                    onClick={() => handleSearchItemClick(result.path)}
                    sx={{ fontSize: `${fontSize}px` }}
                  >
                    {result.name}
                  </MenuItem>
                ))}
              </Box>
            )}
          </Box>
        </FlexBetween>

        {/* Right Side */}
        <FlexBetween gap="1.5rem">
          {/* Notifications */}
          <IconButton onClick={handleNotificationClick}>
            <Badge
              badgeContent={notifications.length}
              color="error"
              overlap="circular"
            >
              <NotificationsOutlined sx={{ fontSize: "25px" }} />
            </Badge>
          </IconButton>
         <Menu
  anchorEl={notificationAnchorEl}
  open={openNotificationMenu}
  onClose={() => setNotificationAnchorEl(null)}
  PaperProps={{
    style: {
      width: "320px",
      maxHeight: "400px",
      overflowY: "auto",
    },
  }}
>
  {notifications.length > 0 ? (
    notifications.map((notif, index) => (
      <MenuItem key={index} onClick={() => setNotificationAnchorEl(null)}>
        <Box>
          <Typography fontSize={14} fontWeight="500">
            {notif.message || notif}
          </Typography>
          {typeof notif === 'object' && (
            <Typography variant="caption" color="text.secondary">
              {notif.date
                ? new Date(notif.date).toLocaleString()
                : notif.createdAt
                ? new Date(notif.createdAt).toLocaleString()
                : ''}
            </Typography>
          )}
        </Box>
      </MenuItem>
    ))
  ) : (
    <MenuItem>No Notifications</MenuItem>
  )}
</Menu>


          {/* Theme Toggle */}
          <IconButton onClick={() => dispatch(setMode())}>
            {theme.palette.mode === "dark" ? (
              <DarkModeOutlined sx={{ fontSize: "25px" }} />
            ) : (
              <LightModeOutlined sx={{ fontSize: "25px" }} />
            )}
          </IconButton>

          {/* Profile Section */}
          <FlexBetween>
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
              <Typography variant="body1" fontWeight="bold">
                {adminName}
              </Typography>
            </Box>
            <IconButton>
              <Avatar src={profileImage} alt="User Profile" />
            </IconButton>
            <IconButton onClick={handleDropdownClick}>
              <ArrowDropDownOutlined sx={{ fontSize: "25px" }} />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={openProfileMenu}
              onClose={() => setAnchorEl(null)}
            >
              <MenuItem onClick={() => {
                setAnchorEl(null);
                setProfileDialogOpen(true);
              }}>
                <AccountCircleOutlined sx={{ mr: 1 }} /> Edit Profile
              </MenuItem>
              <MenuItem onClick={() => {
                setAnchorEl(null);
                setSettingsDialogOpen(true);
              }}>
                <SettingsOutlined sx={{ mr: 1 }} /> Settings
              </MenuItem>
              <MenuItem onClick={() => {
                setAnchorEl(null);
                setPasswordDialogOpen(true);
              }}>
                <LockOutlined sx={{ mr: 1 }} /> Change Password
              </MenuItem>
              <MenuItem onClick={() => {
                setAnchorEl(null);
                setHelpDialogOpen(true);
              }}>
                <HelpOutlineOutlined sx={{ mr: 1 }} /> Help & Support
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </FlexBetween>
        </FlexBetween>
      </Toolbar>

      {/* Profile Dialog */}
      <Dialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, my: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar src={profileImage} alt="User Profile" sx={{ width: 80, height: 80 }} />
              <Button 
                variant="contained" 
                component="label"
                disabled={isSubmitting}
              >
                Upload New Image
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleProfileImageChange}
                  disabled={isSubmitting}
                />
              </Button>
            </Box>
            
            <TextField
              label="Admin Name"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              fullWidth
              variant="outlined"
              margin="normal"
              disabled={isSubmitting}
            />
            
            <TextField
              label="Email"
              value={profileEmail}
              fullWidth
              variant="outlined"
              margin="normal"
              name="email"
              onChange={(e) => setProfileEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setProfileDialogOpen(false)} 
            color="secondary"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleProfileUpdate} 
            color="primary" 
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Settings Dialog */}
      <Dialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Display Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, my: 2 }}>
            <Box>
              <Typography variant="body1" gutterBottom>Font Size</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2">Small</Typography>
                <Slider
                  value={fontSize}
                  onChange={(e, newValue) => setFontSize(newValue)}
                  min={10}
                  max={20}
                  sx={{ flexGrow: 1 }}
                />
                <Typography variant="body2">Large</Typography>
              </Box>
            </Box>
            
            <FormControl fullWidth>
              <InputLabel>Font Style</InputLabel>
              <Select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                label="Font Style"
              >
                <MenuItem value="Roboto">Roboto</MenuItem>
                <MenuItem value="Arial">Arial</MenuItem>
                <MenuItem value="Helvetica">Helvetica</MenuItem>
                <MenuItem value="Verdana">Verdana</MenuItem>
                <MenuItem value="Tahoma">Tahoma</MenuItem>
                <MenuItem value="Trebuchet MS">Trebuchet MS</MenuItem>
                <MenuItem value="Times New Roman">Times New Roman</MenuItem>
                <MenuItem value="Georgia">Georgia</MenuItem>
                <MenuItem value="Garamond">Garamond</MenuItem>
                <MenuItem value="Courier New">Courier New</MenuItem>
                <MenuItem value="Brush Script MT">Brush Script MT</MenuItem>
                <MenuItem value="Lucida Sans">Lucida Sans</MenuItem>
                <MenuItem value="Segoe UI">Segoe UI</MenuItem>
                <MenuItem value="Calibri">Calibri</MenuItem>
                <MenuItem value="Cambria">Cambria</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button 
            onClick={() => setSettingsDialogOpen(false)} 
            color="primary" 
            variant="contained"
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Change Password Dialog */}
      <Dialog
        open={passwordDialogOpen}
        onClose={() => !isSubmitting && setPasswordDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handlePasswordChange} sx={{ mt: 2 }}>
            {passwordError && (
              <Alert severity="error" sx={{ mb: 2 }}>{passwordError}</Alert>
            )}
            {passwordSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>{passwordSuccess}</Alert>
            )}
            
            <TextField
              label="Current Password"
              type="password"
              fullWidth
              margin="normal"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={isSubmitting}
              required
            />
            
            <TextField
              label="New Password"
              type="password"
              fullWidth
              margin="normal"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isSubmitting}
              required
              helperText="Password must be at least 8 characters long"
            />
            
            <TextField
              label="Confirm New Password"
              type="password"
              fullWidth
              margin="normal"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setPasswordDialogOpen(false)} 
            color="secondary"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handlePasswordChange} 
            color="primary" 
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isSubmitting ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Help & Support Dialog */}
      <Dialog
        open={helpDialogOpen}
        onClose={() => !isSubmitting && setHelpDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Help & Support</DialogTitle>
        <DialogContent>
          {helpSubmitted ? (
            <Alert severity="success" sx={{ my: 2 }}>
              Your request has been submitted. Our support team will contact you soon.
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', mt: 2 }}>
              <Box sx={{ width: '40%', pr: 3, borderRight: 1, borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom>Contact Support</Typography>
                
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <EmailOutlined />
                    </ListItemIcon>
                    <ListItemText primary="Email" secondary="support@example.com" />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <PhoneOutlined />
                    </ListItemIcon>
                    <ListItemText primary="Phone" secondary="+1 (123) 456-7890" />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <ChatOutlined />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Live Chat" 
                      secondary={
                        <Link href="#" underline="hover">
                          Start Chat
                        </Link>
                      }
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <ArticleOutlined />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Documentation" 
                      secondary={
                        <Link href="#" underline="hover">
                          View Docs
                        </Link>
                      }
                    />
                  </ListItem>
                </List>
              </Box>
              
              <Box sx={{ width: '60%', pl: 3 }}>
                <Typography variant="h6" gutterBottom>Submit a Support Request</Typography>
                
                <Box component="form" onSubmit={handleHelpSubmit}>
                  <TextField
                    name="email"
                    label="Email"
                    value={helpFormData.email}
                    onChange={handleHelpFormChange}
                    fullWidth
                    margin="normal"
                    disabled={isSubmitting}
                  />
                  
                  <TextField
                    name="subject"
                    label="Subject"
                    value={helpFormData.subject}
                    onChange={handleHelpFormChange}
                    fullWidth
                    margin="normal"
                    disabled={isSubmitting}
                    required
                  />
                  
                  <TextField
                    name="message"
                    label="Message"
                    value={helpFormData.message}
                    onChange={handleHelpFormChange}
                    fullWidth
                    margin="normal"
                    multiline
                    rows={4}
                    disabled={isSubmitting}
                    required
                  />
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setHelpDialogOpen(false)} 
            color="secondary"
            disabled={isSubmitting}
          >
            Close
          </Button>
          {!helpSubmitted && (
            <Button 
              onClick={handleHelpSubmit} 
              color="primary" 
              variant="contained"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </AppBar>
  );
};

export default Navbar;

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Box, 
  Button, 
  Typography, 
  TextField, 
  Fade, 
  Slide, 
  InputAdornment,
  IconButton,
  FormControlLabel,
  Checkbox,
  Container,
  Alert,
  LinearProgress,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  Divider,
  Tooltip,
  CircularProgress
} from "@mui/material";
import { useDispatch } from "react-redux";
import { login } from "../state/authSlice";
import "./LoginPage.css";

// Import icons
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CelebrationIcon from "@mui/icons-material/Celebration";
import EventIcon from "@mui/icons-material/Event";
import SecurityIcon from "@mui/icons-material/Security";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import GroupIcon from "@mui/icons-material/Group";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleIcon from "@mui/icons-material/People";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ShieldIcon from "@mui/icons-material/Shield";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";

// Import background image
import backgroundImage from "../assets/1448.jpg";

const LoginPage = () => {
  const [role, setRole] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeLeft, setBlockTimeLeft] = useState(0);
  const [events, setEvents] = useState([]);
  const [eventStats, setEventStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalParticipants: 0,
    upcomingEvents: 0
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Security configurations
  const MAX_LOGIN_ATTEMPTS = 3;
  const BLOCK_DURATION = 300000; // 5 minutes in milliseconds

  // Custom styles for background image
  const loginContainerStyle = {
    backgroundImage: `linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(20, 20, 20, 0.7) 50%, rgba(40, 40, 40, 0.8) 100%), url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  // Role configurations with enhanced styling
  const roleConfigs = {
    admin: {
      icon: <AdminPanelSettingsIcon />,
      color: "linear-gradient(45deg, #1a1a1a 0%, #333333 100%)",
      description: "Full system access and management",
      permissions: ["User Management", "Event Creation", "System Settings", "Reports"]
    },
    registrationTeam: {
      icon: <GroupIcon />,
      color: "linear-gradient(45deg, #2c3e50 0%, #34495e 100%)",
      description: "Participant registration and management",
      permissions: ["Registration", "Participant Management", "Payment Processing"]
    },
    ModuleHead: {
      icon: <SupervisorAccountIcon />,
      color: "linear-gradient(45deg, #27ae60 0%, #2ecc71 100%)",
      description: "Module oversight and coordination",
      permissions: ["Module Management", "Team Oversight", "Event Planning"]
    },
    ModuleLeader: {
      icon: <ManageAccountsIcon />,
      color: "linear-gradient(45deg, #8e44ad 0%, #9b59b6 100%)",
      description: "Direct module execution and leadership",
      permissions: ["Module Execution", "Team Leadership", "Participant Guidance"]
    }
  };

  // Fetch events and statistics
  useEffect(() => {
    fetchEventData();
  }, []);

  // Load remembered credentials
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }

    // Check if user is blocked
    const blockEndTime = localStorage.getItem("loginBlockEndTime");
    if (blockEndTime && new Date().getTime() < parseInt(blockEndTime)) {
      setIsBlocked(true);
      const timeLeft = parseInt(blockEndTime) - new Date().getTime();
      setBlockTimeLeft(Math.ceil(timeLeft / 1000));
      startBlockTimer(timeLeft);
    }

    // Get login attempts
    const attempts = localStorage.getItem("loginAttempts");
    if (attempts) {
      setLoginAttempts(parseInt(attempts));
    }
  }, []);

  // Block timer
  const startBlockTimer = (duration) => {
    const timer = setInterval(() => {
      setBlockTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsBlocked(false);
          setLoginAttempts(0);
          localStorage.removeItem("loginBlockEndTime");
          localStorage.removeItem("loginAttempts");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Fetch event data for display
  const fetchEventData = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/events");
      if (response.ok) {
        const eventsData = await response.json();
        setEvents(eventsData.slice(0, 3)); // Show only 3 recent events
        
        // Calculate statistics
        const now = new Date();
        const activeEvents = eventsData.filter(event => new Date(event.date) >= now);
        const upcomingEvents = eventsData.filter(event => {
          const eventDate = new Date(event.date);
          const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          return eventDate >= now && eventDate <= nextWeek;
        });

        setEventStats({
          totalEvents: eventsData.length,
          activeEvents: activeEvents.length,
          totalParticipants: eventsData.reduce((sum, event) => sum + (event.cap || 0), 0),
          upcomingEvents: upcomingEvents.length
        });
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError("Email is required");
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  // Password strength calculation
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    return Math.min(strength, 100);
  };

  // Password validation
  const validatePassword = (password) => {
    if (!password) {
      setPasswordError("Password is required");
      return false;
    }
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleRoleSelection = (selectedRole) => {
    setRole(selectedRole);
    setMessage("");
  };

  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    validateEmail(newEmail);
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(calculatePasswordStrength(newPassword));
    validatePassword(newPassword);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    // Check if blocked
    if (isBlocked) {
      setMessage(`Too many failed attempts. Please wait ${Math.ceil(blockTimeLeft / 60)} minutes.`);
      setMessageType("error");
      return;
    }

    // Validate inputs
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);
    setMessage("");

    // Debugging logs to check the role and endpoint
    console.log("Selected role:", role);
    let endpoint;

    // Select the appropriate API endpoint based on the role
    if (role === "ModuleHead" || role === "ModuleLeader") {
      endpoint = "http://localhost:5000/api/moduleRole/login";
    } else if (role === "admin" || role === "registrationTeam") {
      endpoint = "http://localhost:5000/api/admin/auth/login";
    }

    console.log("Using endpoint:", endpoint);

    try {
      // Make the POST request to login
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      console.log("Login successful, user data:", data);

      // Reset login attempts on successful login
      setLoginAttempts(0);
      localStorage.removeItem("loginAttempts");
      localStorage.removeItem("loginBlockEndTime");

      // Dispatch to redux store to keep user authenticated
      dispatch(
        login({
          token: data.token,
          user: { ...data.user, role },
        })
      );

      // Store JWT token and user data in localStorage
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      setMessage("Login successful! Redirecting...");
      setMessageType("success");

      // Redirect based on role
      setTimeout(() => {
        if (role === "admin") {
          navigate("/admindashboard");
        } else if (role === "registrationTeam") {
          navigate("/registrationTeam");
        } else if (role === "ModuleHead") {
          navigate("/moduleHeadDashboard");
        } else if (role === "ModuleLeader") {
          navigate("/moduleLeaderDashboard");
        }
      }, 1500);

    } catch (error) {
      console.error("Login error:", error);
      
      // Handle failed login attempts
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      localStorage.setItem("loginAttempts", newAttempts.toString());

      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        const blockEndTime = new Date().getTime() + BLOCK_DURATION;
        localStorage.setItem("loginBlockEndTime", blockEndTime.toString());
        setIsBlocked(true);
        setBlockTimeLeft(BLOCK_DURATION / 1000);
        startBlockTimer(BLOCK_DURATION);
        setMessage(`Too many failed attempts. Account blocked for 5 minutes.`);
      } else {
        setMessage(`${error.message}. ${MAX_LOGIN_ATTEMPTS - newAttempts} attempts remaining.`);
      }
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get password strength color
  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return "#f44336";
    if (passwordStrength < 50) return "#ff9800";
    if (passwordStrength < 75) return "#2196f3";
    return "#4caf50";
  };

  // Get password strength label
  const getPasswordStrengthLabel = () => {
    if (passwordStrength < 25) return "Weak";
    if (passwordStrength < 50) return "Fair";
    if (passwordStrength < 75) return "Good";
    return "Strong";
  };

  // Animated particles for event management theme
  const Particles = () => (
    <div className="particles">
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
    </div>
  );

  // Security indicators
  const SecurityIndicators = () => (
    <Box className="security-indicators">
      <Tooltip title="SSL Encrypted Connection">
        <ShieldIcon className="security-icon" />
      </Tooltip>
      <Tooltip title="Multi-Factor Authentication Ready">
        <VerifiedUserIcon className="security-icon" />
      </Tooltip>
      <Tooltip title="Secure Login Attempts Monitoring">
        <SecurityIcon className="security-icon" />
      </Tooltip>
    </Box>
  );

  return (
    <Container maxWidth="xl" className="login-container" style={loginContainerStyle}>
      <Particles />
      <SecurityIndicators />
      
      {/* Event Statistics Banner */}
      <Fade in={true} timeout={1000}>
        <Box className="event-stats-banner">
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box className="stat-item">
                <EventIcon className="stat-icon" />
                <Typography variant="h6">{eventStats.totalEvents}</Typography>
                <Typography variant="caption">Total Events</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box className="stat-item">
                <TrendingUpIcon className="stat-icon" />
                <Typography variant="h6">{eventStats.activeEvents}</Typography>
                <Typography variant="caption">Active Events</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box className="stat-item">
                <PeopleIcon className="stat-icon" />
                <Typography variant="h6">{eventStats.totalParticipants}</Typography>
                <Typography variant="caption">Participants</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box className="stat-item">
                <CalendarTodayIcon className="stat-icon" />
                <Typography variant="h6">{eventStats.upcomingEvents}</Typography>
                <Typography variant="caption">This Week</Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Fade>

      <Grid container spacing={4} alignItems="center" justifyContent="center" sx={{ minHeight: '80vh' }}>
        {/* Event Display Panel */}
        <Grid item xs={12} lg={6}>
          <Fade in={role === null} timeout={1000}>
            <Card className="event-display-panel">
              <CardContent>
                <Box className="event-title-section">
                  <CelebrationIcon sx={{ fontSize: 50, color: '#ffd700', mr: 2 }} />
                  <Box>
                    <Typography variant="h3" className="event-main-title">
                      Zab E-Fest 2025
                    </Typography>
                    <Typography variant="h6" className="event-subtitle">
                      Premier Event Management System
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom className="section-title">
                  <EventIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Upcoming Events
                </Typography>

                {events.length > 0 ? (
                  <Box className="events-list">
                    {events.map((event, index) => (
                      <Card key={event._id} className="event-card" sx={{ mb: 2 }}>
                        <CardContent sx={{ py: 2 }}>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={8}>
                              <Typography variant="h6" className="event-name">
                                {event.title}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                <CalendarTodayIcon sx={{ fontSize: 16, mr: 1, color: '#666' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {formatDate(event.date)}
                                </Typography>
                                <LocationOnIcon sx={{ fontSize: 16, ml: 2, mr: 1, color: '#666' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {event.location}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={4} sx={{ textAlign: 'right' }}>
                              <Chip 
                                label={`${event.cap || 0} Participants`}
                                color="primary"
                                variant="outlined"
                                size="small"
                              />
                              {event.fee && (
                                <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                                  PKR {event.fee}
                                </Typography>
                              )}
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                    No upcoming events at the moment
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        {/* Login Panel */}
        <Grid item xs={12} lg={6}>
          <Fade in={role === null} timeout={1000}>
            <div className="fade-role-selection" style={{ display: role === null ? 'block' : 'none' }}>
              <div className="login-header">
                <Typography variant="h4" className="login-heading">
                  Admin Portal Access
                </Typography>
                <Typography variant="h6" className="login-subheading">
                  Select your role to continue
                </Typography>
              </div>

              <div className="role-buttons-grid">
                {Object.entries(roleConfigs).map(([roleKey, config]) => (
                  <Card 
                    key={roleKey}
                    className="role-card"
                    onClick={() => handleRoleSelection(roleKey)}
                    sx={{ 
                      background: config.color,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                      }
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', color: 'white' }}>
                      <Avatar sx={{ 
                        bgcolor: 'rgba(255,255,255,0.2)', 
                        width: 60, 
                        height: 60, 
                        mx: 'auto', 
                        mb: 2 
                      }}>
                        {config.icon}
                      </Avatar>
                      <Typography variant="h6" gutterBottom>
                        {roleKey === "admin" ? "Admin" :
                         roleKey === "registrationTeam" ? "Registration Team" :
                         roleKey === "ModuleHead" ? "Module Head" : "Module Leader"}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                        {config.description}
                      </Typography>
                      <Box>
                        {config.permissions.map((permission, index) => (
                          <Chip 
                            key={index}
                            label={permission}
                            size="small"
                            sx={{ 
                              m: 0.5, 
                              bgcolor: 'rgba(255,255,255,0.2)',
                              color: 'white',
                              fontSize: '0.7rem'
                            }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </Fade>

          <Slide in={role !== null} direction="up" timeout={1000}>
            <Box className="login-form-container" style={{ display: role !== null ? 'block' : 'none' }}>
              <Button 
                className="back-button"
                onClick={() => setRole(null)}
                startIcon={<ArrowBackIcon />}
              >
                Back to Role Selection
              </Button>
              
              <div className="form-title">
                <Avatar sx={{ 
                  bgcolor: roleConfigs[role]?.color || '#333', 
                  width: 50, 
                  height: 50, 
                  mr: 2 
                }}>
                  {roleConfigs[role]?.icon}
                </Avatar>
                <Box>
                  <Typography variant="h5" className="login-form-heading">
                    Sign In as{" "}
                    <span className="role-highlight">
                      {role === "admin" ? "Admin" :
                       role === "ModuleHead" ? "Module Head" :
                       role === "ModuleLeader" ? "Module Leader" :
                       "Registration Team"}
                    </span>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {roleConfigs[role]?.description}
                  </Typography>
                </Box>
              </div>

              {message && (
                <Alert 
                  severity={messageType} 
                  sx={{ mb: 2 }}
                  className="login-alert"
                >
                  {message}
                </Alert>
              )}

              {isBlocked && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Account temporarily blocked. Time remaining: {Math.floor(blockTimeLeft / 60)}:{(blockTimeLeft % 60).toString().padStart(2, '0')}
                </Alert>
              )}

              <form onSubmit={handleLogin} className="login-form">
                <TextField
                  label="Email Address"
                  name="email"
                  type="email"
                  fullWidth
                  required
                  margin="normal"
                  value={email}
                  onChange={handleEmailChange}
                  error={!!emailError}
                  helperText={emailError}
                  InputLabelProps={{ className: "textfield-label" }}
                  className="textfield-input"
                  placeholder="Enter your email address"
                  disabled={isBlocked}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon className="input-icon" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  fullWidth
                  required
                  margin="normal"
                  value={password}
                  onChange={handlePasswordChange}
                  error={!!passwordError}
                  helperText={passwordError}
                  InputLabelProps={{ className: "textfield-label" }}
                  className="textfield-input"
                  placeholder="Enter your password"
                  disabled={isBlocked}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon className="input-icon" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                          sx={{ color: "#333" }}
                        >
                          {showPassword ? 
                            <VisibilityOff sx={{ fontSize: "1.2rem" }} /> : 
                            <Visibility sx={{ fontSize: "1.2rem" }} />
                          }
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {password && (
                  <Box sx={{ mt: 1, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" sx={{ mr: 1 }}>
                        Password Strength:
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: getPasswordStrengthColor(),
                          fontWeight: 'bold'
                        }}
                      >
                        {getPasswordStrengthLabel()}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={passwordStrength} 
                      sx={{
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getPasswordStrengthColor(),
                          borderRadius: 2,
                        }
                      }}
                    />
                  </Box>
                )}

                <div className="form-options">
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="remember-checkbox"
                        disabled={isBlocked}
                        sx={{ 
                          color: "#444",
                          '&.Mui-checked': {
                            color: "#333",
                          },
                        }}
                      />
                    }
                    label="Remember me"
                  />
                  <Link to="/forgot-password" className="forgot-password">
                    Forgot Password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  className="sign-in-button"
                  disabled={isLoading || isBlocked || !!emailError || !!passwordError}
                  sx={{
                    background: roleConfigs[role]?.color || 'linear-gradient(45deg, #000000 0%, #434343 100%)',
                    position: 'relative'
                  }}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Sign In Securely"
                  )}
                </Button>

                {loginAttempts > 0 && !isBlocked && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block', 
                      textAlign: 'center', 
                      mt: 1,
                      color: 'warning.main'
                    }}
                  >
                    {MAX_LOGIN_ATTEMPTS - loginAttempts} attempts remaining
                  </Typography>
                )}
              </form>
            </Box>
          </Slide>
        </Grid>
      </Grid>
    </Container>
  );
};

export default LoginPage;

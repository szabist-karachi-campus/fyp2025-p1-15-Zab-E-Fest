import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
  Paper,
  Container
} from '@mui/material';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LockIcon from "@mui/icons-material/Lock";
import LockResetIcon from '@mui/icons-material/LockReset';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import './LoginPage.css';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Get role from query parameters
  const queryParams = new URLSearchParams(location.search);
  const role = queryParams.get('role');

  useEffect(() => {
    if (!token || !role) {
      setMessage({ 
        type: 'error', 
        text: 'Invalid reset link. Please request a new password reset.' 
      });
    }
  }, [token, role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Determine the endpoint based on role
      let endpoint;
      if (role === 'admin' || role === 'registrationTeam') {
        endpoint = `http://localhost:5000/api/admin/auth/reset-password/${token}`;
      } else if (role === 'ModuleHead' || role === 'ModuleLeader') {
        endpoint = `http://localhost:5000/api/moduleRole/reset-password/${token}`;
      } else {
        throw new Error('Invalid user role');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      setMessage({ 
        type: 'success', 
        text: 'Password reset successful. You can now login with your new password.' 
      });
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
      
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <Box className="login-container">
      <div className="particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>

      <Container maxWidth="sm">
        <Paper 
          elevation={10}
          sx={{
            p: 4,
            borderRadius: 3,
            background: '#ffffff',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            animation: 'formAppear 0.8s ease-out',
            position: 'relative'
          }}
        >
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Button 
              startIcon={<ArrowBackIcon />} 
              sx={{ 
                position: 'absolute',
                top: 16,
                left: 16,
                color: 'primary.main',
                fontWeight: 'medium',
                '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' }
              }}
            >
              Back to Login
            </Button>
          </Link>

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <LockResetIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" fontWeight="bold" color="#000000" gutterBottom>
              Reset Password
            </Typography>
            
            <Typography variant="body1" color="#333333" sx={{ textAlign: 'center', mb: 3, maxWidth: '80%' }}>
              Please enter your new password
            </Typography>
          </Box>

          {message.text && (
            <Alert 
              severity={message.type} 
              variant="filled"
              sx={{ 
                mb: 3, 
                width: '100%',
                animation: message.type === 'error' ? 'errorShake 0.5s' : 'fadeIn 0.5s'
              }}
            >
              {message.text}
            </Alert>
          )}

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <TextField
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              margin="normal"
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="primary" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleTogglePassword}
                      edge="end"
                      color="primary"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.23)',
                    borderWidth: 1,
                  },
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                    borderWidth: 2,
                  },
                },
                '& .MuiInputBase-input': {
                  color: '#000000',
                  fontWeight: 500,
                  fontSize: '1rem',
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(0, 0, 0, 0.7)',
                  fontWeight: 500,
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: 'primary.main',
                  fontWeight: 600,
                }
              }}
            />

            <TextField
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              margin="normal"
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="primary" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleToggleConfirmPassword}
                      edge="end"
                      color="primary"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.23)',
                    borderWidth: 1,
                  },
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                    borderWidth: 2,
                  },
                },
                '& .MuiInputBase-input': {
                  color: '#000000',
                  fontWeight: 500,
                  fontSize: '1rem',
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(0, 0, 0, 0.7)',
                  fontWeight: 500,
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: 'primary.main',
                  fontWeight: 600,
                }
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading || !token || !role}
              sx={{ 
                mt: 2,
                mb: 2,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 'bold',
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 6px 15px rgba(25, 118, 210, 0.4)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
            </Button>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="#333333" fontWeight={500}>
                Remember your password?{' '}
                <Link to="/" style={{ color: '#1976d2', fontWeight: 'bold', textDecoration: 'none' }}>
                  Back to Login
                </Link>
              </Typography>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default ResetPassword; 
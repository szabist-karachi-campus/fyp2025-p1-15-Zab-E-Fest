import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Container,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Link } from 'react-router-dom';
import EmailIcon from '@mui/icons-material/Email';
import LockResetIcon from '@mui/icons-material/LockReset';
import PersonIcon from '@mui/icons-material/Person';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import './LoginPage.css'; // Reuse login page styles

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !role) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Determine the endpoint based on role
      let endpoint;
      if (role === 'admin' || role === 'registrationTeam') {
        endpoint = 'http://localhost:5000/api/admin/auth/forgot-password';
      } else if (role === 'ModuleHead' || role === 'ModuleLeader') {
        endpoint = 'http://localhost:5000/api/moduleRole/forgot-password';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      setMessage({ 
        type: 'success', 
        text: 'Password reset link sent to your email. Please check your inbox.' 
      });
      
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
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
              Forgot Password
            </Typography>
            
            <Typography variant="body1" color="#333333" sx={{ textAlign: 'center', mb: 3, maxWidth: '80%' }}>
              Enter your email address and select your role. We'll send you a link to reset your password.
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
              label="Email Address"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              margin="normal"
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="primary" />
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

            <FormControl 
              fullWidth 
              margin="normal"
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
                },
                '& .MuiSelect-icon': {
                  color: 'rgba(0, 0, 0, 0.7)',
                }
              }}
            >
              <InputLabel>Role</InputLabel>
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                label="Role"
                startAdornment={
                  <InputAdornment position="start">
                    <PersonIcon color="primary" />
                  </InputAdornment>
                }
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: '#ffffff',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    }
                  }
                }}
              >
                <MenuItem value="admin" sx={{ color: '#000000', fontWeight: 500 }}>Admin</MenuItem>
                <MenuItem value="registrationTeam" sx={{ color: '#000000', fontWeight: 500 }}>Registration Team</MenuItem>
                <MenuItem value="ModuleHead" sx={{ color: '#000000', fontWeight: 500 }}>Module Head</MenuItem>
                <MenuItem value="ModuleLeader" sx={{ color: '#000000', fontWeight: 500 }}>Module Leader</MenuItem>
              </Select>
            </FormControl>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
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
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
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

export default ForgotPassword; 
// imports/accounts/client/components/LoginForm.jsx

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Alert,
  Paper,
  Link,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import { logger } from '../../lib/AccountsLogger';

export function LoginForm({ onSuccess, onSignupClick, onForgotPasswordClick }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userExists, setUserExists] = useState(null);
  const [checkingUser, setCheckingUser] = useState(false);
  const navigate = useNavigate();

  // Check if user exists when username changes
  useEffect(() => {
    if (!username || username.length < 3) {
      setUserExists(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      setCheckingUser(true);
      
      Meteor.call('accounts.checkUserExists', username, (error, result) => {
        setCheckingUser(false);
        if (error) {
          logger.error('Error checking user:', error);
        } else {
          setUserExists(result.exists);
          if (!result.exists) {
            setError('');  // Clear any previous errors
          }
        }
      });
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
  }, [username]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    logger.group('LoginForm.handleSubmit');
    logger.log('Login attempt started');
    logger.debug('Username/email:', username);

    try {
      logger.info('Calling Meteor.loginWithPassword');
      logger.debug('User exists check before login:', userExists);
      
      // Login with username or email using Meteor's built-in method
      await new Promise((resolve, reject) => {
        Meteor.loginWithPassword(username, password, (error) => {
          if (error) {
            logger.error('Login error:', error);
            logger.error('Error details:', {
              error: error.error,
              reason: error.reason,
              message: error.message,
              details: error.details,
              errorType: error.errorType || error.constructor.name
            });
            
            // Additional logging for generic 403 errors
            if (error.error === 403 && error.reason === 'Something went wrong. Please check your credentials.') {
              logger.warn('Generic 403 error detected - this usually means:');
              logger.warn('1. User does not exist');
              logger.warn('2. Password is incorrect');
              logger.warn('3. Account is locked or restricted');
              logger.debug('Checking if user exists...');
              
              // Double-check user existence
              Meteor.call('accounts.checkUserExists', username, (checkError, checkResult) => {
                if (!checkError && checkResult) {
                  logger.info('User existence check result:', checkResult);
                  setUserExists(checkResult.exists);
                }
              });
            }
            
            reject(error);
          } else {
            logger.info('Login successful');
            resolve();
          }
        });
      });
      
      logger.log('Redirecting after successful login');
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/');
      }
    } catch (err) {
      logger.group('Login Error Analysis', true);
      
      // Provide more specific error messages
      let errorMessage = 'Invalid username or password';
      
      if (err.error === 403) {
        if (err.reason === 'User not found') {
          errorMessage = 'No account found with that username or email';
          setUserExists(false);
        } else if (err.reason === 'Incorrect password') {
          errorMessage = 'Incorrect password';
        } else if (err.reason && err.reason.includes('too many requests')) {
          errorMessage = 'Too many login attempts. Please try again later.';
        } else if (err.reason === 'Something went wrong. Please check your credentials.') {
          // This is Meteor's generic error - check if user exists
          if (userExists === false) {
            errorMessage = 'No account found with that username or email';
          } else {
            errorMessage = 'Invalid password';
          }
        }
      } else if (err.error === 400) {
        errorMessage = 'Please enter both username and password';
      } else {
        errorMessage = err.reason || err.message || 'Login failed';
      }
      
      logger.error('Setting error message:', errorMessage);
      logger.groupEnd();
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      logger.log('Login attempt completed');
      logger.groupEnd();
    }
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 5, 
        maxWidth: 440, 
        mx: 'auto',
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2
      }}
    >
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          fontWeight: 500,
          mb: 4,
          textAlign: 'center'
        }}
      >
        Sign In
      </Typography>
      
      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Username or Email"
            name="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            autoFocus
            error={userExists === false}
            variant="outlined"
            InputLabelProps={{ 
              shrink: true,
              sx: { 
                position: 'relative',
                transform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'text.secondary',
                mb: 1
              }
            }}
            label="Username or Email *"
            InputProps={{
              sx: { 
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: userExists === false ? 'error.main' : 'divider'
                }
              },
              endAdornment: checkingUser ? (
                <InputAdornment position="end">
                  <CircularProgress size={16} />
                </InputAdornment>
              ) : null
            }}
            FormHelperTextProps={{
              sx: { 
                position: 'absolute',
                bottom: -22,
                mx: 0
              }
            }}
            helperText={userExists === false ? 'No account found with this username/email' : ''}
          />
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            disabled={userExists === false}
            variant="outlined"
            InputLabelProps={{ 
              shrink: true,
              sx: { 
                position: 'relative',
                transform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'text.secondary',
                mb: 1
              }
            }}
            label="Password *"
            InputProps={{
              sx: { 
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'divider'
                }
              }
            }}
          />
        </Box>
        
        {userExists === false && (
          <Alert 
            severity="info" 
            icon={false}
            sx={{ 
              mb: 3,
              bgcolor: '#e3f2fd',
              border: '1px solid #90caf9',
              '& .MuiAlert-message': {
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }
            }}
          >
            <Typography variant="body2" component="span">
              ℹ️ No account found. Would you like to{' '}
              <Link
                component="button"
                onClick={(e) => {
                  e.preventDefault();
                  onSignupClick ? onSignupClick() : navigate('/register');
                }}
                sx={{ 
                  color: 'primary.main',
                  fontWeight: 500,
                  textDecoration: 'underline',
                  verticalAlign: 'baseline'
                }}
              >
                create a new account
              </Link>?
            </Typography>
          </Alert>
        )}
        
        {error && error !== 'No account found with that username or email' && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
          >
            {error}
          </Alert>
        )}
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading || userExists === false || checkingUser}
          sx={{ 
            mb: 3,
            py: 1.5,
            textTransform: 'uppercase',
            fontWeight: 600,
            fontSize: '0.875rem',
            letterSpacing: '0.5px',
            backgroundColor: '#f0ad4e',
            color: '#000',
            '&:hover': {
              backgroundColor: '#ec971f'
            },
            '&:disabled': {
              backgroundColor: '#e0e0e0',
              color: '#999'
            }
          }}
        >
          {loading ? 'Signing in...' : 
           checkingUser ? 'Checking...' : 
           userExists === false ? 'Account Not Found' : 'Sign In'}
        </Button>
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          pt: 2,
          borderTop: '1px solid',
          borderColor: 'divider'
        }}>
          <Link
            component="button"
            variant="body2"
            onClick={(e) => {
              e.preventDefault();
              onForgotPasswordClick?.();
            }}
            sx={{ 
              color: '#f0ad4e',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            Forgot password?
          </Link>
          
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{' '}
            <Link
              component="button"
              onClick={(e) => {
                e.preventDefault();
                onSignupClick ? onSignupClick() : navigate('/register');
              }}
              sx={{ 
                color: '#f0ad4e',
                textDecoration: 'none',
                fontWeight: 500,
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              Sign Up
            </Link>
          </Typography>
        </Box>
      </form>
    </Paper>
  );
}
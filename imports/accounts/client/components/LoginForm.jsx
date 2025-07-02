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
    <Paper sx={{ p: 4, maxWidth: 400, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Sign In
      </Typography>
      
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Username or Email"
          name="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          margin="normal"
          required
          autoComplete="username"
          autoFocus
          error={userExists === false}
          helperText={
            checkingUser ? 'Checking...' : 
            userExists === false ? 'No account found with this username/email' : ''
          }
          InputProps={{
            endAdornment: checkingUser ? (
              <InputAdornment position="end">
                <CircularProgress size={20} />
              </InputAdornment>
            ) : null
          }}
        />
        
        {userExists === false && (
          <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
            <Typography variant="body2">
              No account found. Would you like to{' '}
              <Link
                component="button"
                onClick={(e) => {
                  e.preventDefault();
                  onSignupClick ? onSignupClick() : navigate('/register');
                }}
              >
                create a new account
              </Link>
              ?
            </Typography>
          </Alert>
        )}
        
        <TextField
          fullWidth
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
          required
          autoComplete="current-password"
          disabled={userExists === false}
        />
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
            {error.includes('password') && (
              <Box sx={{ mt: 1 }}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={(e) => {
                    e.preventDefault();
                    onForgotPasswordClick?.();
                  }}
                >
                  Forgot your password?
                </Link>
              </Box>
            )}
          </Alert>
        )}
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={loading || userExists === false || checkingUser}
        >
          {loading ? 'Signing in...' : 
           checkingUser ? 'Checking...' : 
           userExists === false ? 'Account Not Found' : 'Sign In'}
        </Button>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Link
            component="button"
            variant="body2"
            onClick={(e) => {
              e.preventDefault();
              onForgotPasswordClick?.();
            }}
          >
            Forgot password?
          </Link>
          
          <Link
            component="button"
            variant="body2"
            onClick={(e) => {
              e.preventDefault();
              onSignupClick ? onSignupClick() : navigate('/register');
            }}
          >
            Don't have an account? Sign Up
          </Link>
        </Box>
      </form>
    </Paper>
  );
}
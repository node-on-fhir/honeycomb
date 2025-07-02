// imports/accounts/client/components/SignupForm.jsx

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper,
  Link
} from '@mui/material';
import { logger } from '../../lib/AccountsLogger';

export function SignupForm({ onSuccess, onLoginClick }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState({
    checking: false,
    usernameAvailable: null,
    emailAvailable: null,
    suggestions: []
  });
  const [fieldErrors, setFieldErrors] = useState({
    username: '',
    email: ''
  });
  const navigate = useNavigate();

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific errors when user types
    if (field === 'username' || field === 'email') {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Check availability when username or email changes
  useEffect(() => {
    if (!formData.username || !formData.email) return;
    
    const timeoutId = setTimeout(() => {
      setAvailability(prev => ({ ...prev, checking: true }));
      
      Meteor.call('accounts.checkAvailability', formData.username, formData.email, (error, result) => {
        if (error) {
          logger.error('Availability check error:', error);
        } else {
          setAvailability({
            checking: false,
            usernameAvailable: result.usernameAvailable,
            emailAvailable: result.emailAvailable,
            suggestions: result.suggestions
          });
          
          // Set field-specific errors
          if (!result.usernameAvailable) {
            setFieldErrors(prev => ({ 
              ...prev, 
              username: 'Username is already taken' 
            }));
          }
          if (!result.emailAvailable) {
            setFieldErrors(prev => ({ 
              ...prev, 
              email: 'Email is already registered' 
            }));
          }
        }
      });
    }, 500); // Debounce for 500ms
    
    return () => clearTimeout(timeoutId);
  }, [formData.username, formData.email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    logger.group('SignupForm.handleSubmit');
    logger.log('Form submission started');
    logger.debug('Form data:', formData);

    // Check if username/email are available
    if (fieldErrors.username || fieldErrors.email) {
      logger.warn('Form has field errors', fieldErrors);
      setError('Please fix the errors above before submitting');
      logger.groupEnd();
      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      logger.warn('Password validation failed: passwords do not match');
      setError('Passwords do not match');
      logger.groupEnd();
      return;
    } else {
      logger.log('Password validation passed');
    }

    setLoading(true);
    logger.time('createUser');

    try {
      logger.info('Calling Accounts.createUser with:', {
        username: formData.username,
        email: formData.email,
        password: '[REDACTED]',
        passwordLength: formData.password.length
      });

      // Create user account using Meteor's built-in method
      await new Promise((resolve, reject) => {
        Accounts.createUser({
          username: formData.username,
          email: formData.email,
          password: formData.password
        }, (error) => {
          if (error) {
            logger.error('Accounts.createUser callback error:', error);
            reject(error);
          } else {
            logger.info('Accounts.createUser succeeded');
            resolve();
          }
        });
      });
      
      logger.timeEnd('createUser');
      logger.log('User created successfully');
      
      if (onSuccess) {
        logger.log('Calling onSuccess callback');
        onSuccess();
      } else {
        logger.log('Navigating to home page');
        navigate('/');
      }
    } catch (err) {
      logger.timeEnd('createUser');
      logger.group('Registration Error Details', true);
      logger.error('Registration failed:', err);
      logger.error('Error type:', err.constructor.name);
      logger.error('Error code:', err.error);
      logger.error('Error reason:', err.reason);
      logger.error('Error message:', err.message);
      logger.error('Error details:', err.details);
      logger.error('Full error object:', err);
      logger.groupEnd();
      
      // Handle specific error cases
      if (err.error === 403) {
        logger.warn('403 Forbidden error received');
        if (err.reason && err.reason.includes('Username')) {
          logger.info('Error type: Username already exists');
          setError('Username already exists');
        } else if (err.reason && err.reason.includes('Email')) {
          logger.info('Error type: Email already registered');
          setError('Email address already registered');
        } else {
          logger.warn('Generic 403 error:', err.reason);
          setError(err.reason || 'Registration failed');
        }
      } else {
        logger.warn('Non-403 error:', err.error);
        setError(err.reason || err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
      logger.log('Form submission completed');
      logger.groupEnd();
    }
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 400, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Register
      </Typography>
      
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Username"
          name="username"
          value={formData.username}
          onChange={handleChange('username')}
          margin="normal"
          required
          autoComplete="username"
          inputProps={{ minLength: 3 }}
          error={!!fieldErrors.username}
          helperText={
            fieldErrors.username || 
            (availability.checking && formData.username ? 'Checking availability...' : 'At least 3 characters')
          }
        />
        
        {fieldErrors.username && availability.suggestions.length > 0 && (
          <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
            <Typography variant="body2">
              Suggestions: {availability.suggestions.join(', ')}
            </Typography>
          </Alert>
        )}
        
        {(fieldErrors.username || fieldErrors.email) && (
          <Alert severity="warning" sx={{ mt: 1, mb: 2 }}>
            <Typography variant="body2">
              Already have an account?{' '}
              <Link
                component="button"
                onClick={(e) => {
                  e.preventDefault();
                  onLoginClick ? onLoginClick() : navigate('/login');
                }}
              >
                Sign in instead
              </Link>
            </Typography>
          </Alert>
        )}
        
        <TextField
          fullWidth
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange('email')}
          margin="normal"
          required
          autoComplete="email"
          error={!!fieldErrors.email}
          helperText={
            fieldErrors.email || 
            (availability.checking && formData.email ? 'Checking availability...' : '')
          }
        />
        
        <TextField
          fullWidth
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange('password')}
          margin="normal"
          required
          autoComplete="new-password"
          inputProps={{ minLength: 8 }}
          helperText="At least 8 characters"
        />
        
        <TextField
          fullWidth
          label="Confirm Password"
          name="confirm"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange('confirmPassword')}
          margin="normal"
          required
          autoComplete="new-password"
          error={Boolean(formData.confirmPassword && formData.password !== formData.confirmPassword)}
          helperText={formData.confirmPassword && formData.password !== formData.confirmPassword ? 'Passwords do not match' : ''}
          data-testid={formData.confirmPassword && formData.password !== formData.confirmPassword ? 'password-mismatch' : undefined}
        />
        
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={
            loading || 
            !formData.username || 
            !formData.email || 
            !formData.password || 
            !formData.confirmPassword ||
            !!fieldErrors.username ||
            !!fieldErrors.email ||
            availability.checking
          }
        >
          {loading ? 'Creating account...' : 'Register'}
        </Button>
        
        <Box sx={{ textAlign: 'center' }}>
          <Link
            component="button"
            variant="body2"
            onClick={(e) => {
              e.preventDefault();
              onLoginClick ? onLoginClick() : navigate('/login');
            }}
          >
            Already have an account? Sign In
          </Link>
        </Box>
      </form>
    </Paper>
  );
}
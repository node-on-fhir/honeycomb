// imports/accounts/client/components/ForgotPasswordForm.jsx

import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper,
  Link
} from '@mui/material';

export function ForgotPasswordForm({ onSuccess, onBackToLogin }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      // Use Meteor's built-in password reset
      await new Promise((resolve, reject) => {
        Accounts.forgotPassword({ email }, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
      
      setSuccess(true);
      if (onSuccess) {
        onSuccess(email);
      }
    } catch (err) {
      // Handle specific error cases
      if (err.error === 403) {
        setError('Email address not found');
      } else {
        setError(err.reason || err.message || 'Failed to send reset email');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 400, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Reset Password
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Enter your email address and we'll send you a link to reset your password.
      </Typography>
      
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          margin="normal"
          required
          autoComplete="email"
          disabled={success}
        />
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Password reset instructions have been sent to {email}
          </Alert>
        )}
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={loading || success}
        >
          {loading ? 'Sending...' : 'Send Reset Email'}
        </Button>
        
        <Box sx={{ textAlign: 'center' }}>
          <Link
            component="button"
            variant="body2"
            onClick={(e) => {
              e.preventDefault();
              onBackToLogin?.();
            }}
          >
            Back to Sign In
          </Link>
        </Box>
      </form>
    </Paper>
  );
}
// imports/accounts/client/pages/RegisterPage.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import { SignupForm } from '../components/SignupForm';

export function RegisterPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Redirect to home after successful registration
    navigate('/');
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <SignupForm 
          onSuccess={handleSuccess}
          onLoginClick={handleLoginClick}
        />
      </Box>
    </Container>
  );
}
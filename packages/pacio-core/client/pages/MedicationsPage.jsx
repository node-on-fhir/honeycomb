// /packages/pacio-core/client/pages/MedicationsPage.jsx

import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box,
  Card,
  CardHeader,
  CardContent,
  Button,
  Grid
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get } from 'lodash';

export function MedicationsPage() {
  const [selectedPatientId, setSelectedPatientId] = useState('');
  
  // Get selected patient from session
  useEffect(function() {
    const patientId = Session.get('selectedPatientId');
    if (patientId) {
      setSelectedPatientId(patientId);
    }
  }, []);
  
  const { medications, loading } = useTracker(function() {
    // Access Medications collection from Meteor.Collections
    const Medications = get(Meteor, 'Collections.Medications');
    if (!Medications) {
      return { medications: [], loading: false };
    }
    
    const subscription = Meteor.subscribe('medications');
    
    let query = {};
    if (selectedPatientId) {
      query['subject.reference'] = `Patient/${selectedPatientId}`;
    }
    
    return {
      medications: Medications.find(query, { sort: { _id: -1 } }).fetch(),
      loading: !subscription.ready()
    };
  }, [selectedPatientId]);

  function handleAddMedication() {
    Session.set('mainAppDialogJson', {
      title: 'Add Medication',
      message: 'Add medication functionality coming soon'
    });
  }

  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Medications
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {medications.length} medications found
              {selectedPatientId && ' for selected patient'}
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddMedication}
            >
              Add Medication
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  }

  function renderTable() {
    if (loading) {
      return (
        <Card>
          <Box p={3} textAlign="center">
            <Typography>Loading medications...</Typography>
          </Box>
        </Card>
      );
    }
    
    if (!medications || medications.length === 0) {
      return (
        <Container maxWidth="sm" style={{display: 'flex', flexDirection: 'column', flexWrap: 'nowrap', height: '100%', justifyContent: 'center'}}>
          <Card>
            <CardHeader 
              title={get(Meteor, 'settings.public.defaults.noData.defaultTitle', "No Data Available")} 
              subheader={get(Meteor, 'settings.public.defaults.noData.defaultMessage', "No records were found in the client data cursor. To debug, check the data cursor in the client console, then check subscriptions and publications, and relevant search queries. If the data is not loaded in, use a tool like Mongo Compass to load the records directly into the Mongo database, or use the FHIR API interfaces.")} 
            />
          </Card>
        </Container>
      );
    }
    
    // Since MedicationsTable doesn't exist, show a simple list
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Medications List
          </Typography>
          <Typography variant="body2" color="textSecondary">
            The medications table component is not yet implemented. 
            {medications.length > 0 && ` Found ${medications.length} medications.`}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <div id="medicationsPage" style={{ paddingTop: '80px' }}>
      <Container maxWidth="xl">
        {renderHeader()}
        {renderTable()}
      </Container>
    </div>
  );
}
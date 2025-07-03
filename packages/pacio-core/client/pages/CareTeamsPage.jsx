// /packages/pacio-core/client/pages/CareTeamsPage.jsx

import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box,
  Card,
  CardHeader,
  Button,
  Grid
} from '@mui/material';
import { Groups as GroupsIcon } from '@mui/icons-material';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get } from 'lodash';

export function CareTeamsPage() {
  const [selectedPatientId, setSelectedPatientId] = useState('');
  
  // Get selected patient from session
  useEffect(function() {
    const patientId = Session.get('selectedPatientId');
    if (patientId) {
      setSelectedPatientId(patientId);
    }
  }, []);
  
  const { careTeams, loading } = useTracker(function() {
    // Access CareTeams collection from Meteor.Collections
    const CareTeams = get(Meteor, 'Collections.CareTeams');
    if (!CareTeams) {
      return { careTeams: [], loading: false };
    }
    
    const subscription = Meteor.subscribe('careTeams');
    
    let query = {};
    if (selectedPatientId) {
      query['subject.reference'] = `Patient/${selectedPatientId}`;
    }
    
    return {
      careTeams: CareTeams.find(query, { sort: { _id: -1 } }).fetch(),
      loading: !subscription.ready()
    };
  }, [selectedPatientId]);

  function handleAddCareTeam() {
    Session.set('mainAppDialogJson', {
      title: 'Add Care Team',
      message: 'Add care team functionality coming soon'
    });
  }

  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Care Teams
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {careTeams.length} care teams found
              {selectedPatientId && ' for selected patient'}
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<GroupsIcon />}
              onClick={handleAddCareTeam}
            >
              Add Care Team
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
            <Typography>Loading care teams...</Typography>
          </Box>
        </Card>
      );
    }
    
    if (!careTeams || careTeams.length === 0) {
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
    
    // Get CareTeamsTable from Meteor.Tables
    const CareTeamsTable = get(Meteor, 'Tables.CareTeamsTable');
    if (!CareTeamsTable) {
      return (
        <Card>
          <Box p={3}>
            <Typography>CareTeamsTable component not available</Typography>
          </Box>
        </Card>
      );
    }
    
    return (
      <Card>
        <CareTeamsTable
          careTeams={careTeams}
          onRowClick={(id) => console.log('Care team clicked:', id)}
          showStatus={true}
          showCategory={true}
          tableRowSize="medium"
        />
      </Card>
    );
  }

  return (
    <div id="careTeamsPage" style={{ paddingTop: '80px' }}>
      <Container maxWidth="xl">
        {renderHeader()}
        {renderTable()}
      </Container>
    </div>
  );
}
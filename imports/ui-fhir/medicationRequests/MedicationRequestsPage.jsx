import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';

import { 
  Grid, 
  Container,
  Divider,
  Card,
  CardHeader,
  CardContent,
  Button,
  Box,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add'; 

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

// import MedicationRequestDetail from './MedicationRequestDetail';
import MedicationRequestsTable from './MedicationRequestsTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

//=============================================================================================================================================
// DATA CURSORS

Meteor.startup(function(){
  MedicationRequests = Meteor.Collections.MedicationRequests;
})


//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedMedicationRequestId', false);


Session.setDefault('medicationRequestPageTabIndex', 1); 
Session.setDefault('medicationRequestSearchFilter', ''); 
Session.setDefault('selectedMedicationRequestId', false);
Session.setDefault('selectedMedicationRequest', false)
Session.setDefault('MedicationRequestsPage.onePageLayout', true)
Session.setDefault('MedicationRequestsPage.defaultQuery', {})
Session.setDefault('MedicationRequestsTable.hideCheckbox', true)
Session.setDefault('MedicationRequestsTable.medicationRequestsIndex', 0)

//=============================================================================================================================================
// MAIN COMPONENT

export function MedicationRequestsPage(props){

  let data = {
    currentMedicationRequestId: '',
    selectedMedicationRequest: null,
    medicationRequests: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    medicationRequestsIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('MedicationRequestsPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('MedicationRequestsTable.hideCheckbox');
  }, [])
  data.selectedMedicationRequestId = useTracker(function(){
    return Session.get('selectedMedicationRequestId');
  }, [])
  data.selectedMedicationRequest = useTracker(function(){
    return MedicationRequests.findOne({_id: Session.get('selectedMedicationRequestId')});
  }, [])
  data.medicationRequests = useTracker(function(){
    return MedicationRequests.find().fetch();
  }, [])
  data.medicationRequestsIndex = useTracker(function(){
    return Session.get('MedicationRequestsTable.medicationRequestsIndex')
  }, [])
  data.showSystemIds = useTracker(function(){
    return Session.get('showSystemIds');
  }, [])
  data.showFhirIds = useTracker(function(){
    return Session.get('showFhirIds');
  }, [])


  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();
  
  let noDataImage = get(Meteor, 'settings.public.defaults.noData.noDataImagePath', "packages/clinical_hl7-fhir-data-infrastructure/assets/NoData.png");  
  let noDataCardStyle = {};

  function handleAddMedicationRequest(){
    console.log('Add Medication Request button clicked');
    // Add logic for adding a new medication request
  }

  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Medication Requests
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.medicationRequests.length} requests found
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddMedicationRequest}
            >
              Add Request
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  }

  let layoutContent;
  if(data.medicationRequests.length > 0){
    layoutContent = <Card 
      sx={{ 
        width: '100%',
        borderRadius: 3,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden'
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <MedicationRequestsTable 
          id='medicationRequestsTable'
          medicationRequests={data.medicationRequests}
          count={data.medicationRequests.length}  
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()} 
          actionButtonLabel="Remove"
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.MedicationRequests.hideRemoveButtonOnTable', true)}
          onActionButtonClick={function(selectedId){
            MedicationRequests._collection.remove({_id: selectedId})
          }}
          onSetPage={function(index){
            Session.set('MedicationRequestsTable.medicationRequestsIndex', index)
          }}        
          page={data.medicationRequestsIndex}
        />
      </CardContent>
    </Card>
  } else {
    layoutContent = <Box 
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        textAlign: 'center'
      }}
    >
      <Card 
        sx={{ 
          maxWidth: '600px',
          width: '100%',
          borderRadius: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}
      >
        <CardContent sx={{ p: 6 }}>
          <Box sx={{ mb: 3 }}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 500,
                color: 'text.primary',
                mb: 2
              }}
            >
              {get(Meteor, 'settings.public.defaults.noData.defaultTitle', "No Data Available")}
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'text.secondary',
                lineHeight: 1.7,
                maxWidth: '480px',
                mx: 'auto'
              }}
            >
              {get(Meteor, 'settings.public.defaults.noData.defaultMessage', "No records were found in the client data cursor. To debug, check the data cursor in the client console, then check subscriptions and publications, and relevant search queries. If the data is not loaded in, use a tool like Mongo Compass to load the records directly into the Mongo database, or use the FHIR API interfaces.")}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddMedicationRequest}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              py: 1,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2
              }
            }}
          >
            Add Your First Request
          </Button>
        </CardContent>
      </Card>
    </Box>
  }
  
  return (
    <Box 
      id="medicationRequestsPage" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      { data.medicationRequests.length > 0 && renderHeader() }
      { layoutContent }
    </Box>
  );
}

export default MedicationRequestsPage;
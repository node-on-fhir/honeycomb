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

// import ConditionDetail from './ConditionDetail';
import ConditionsTable from './ConditionsTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

 
//=============================================================================================================================================
// DATA CURSORS

Meteor.startup(function(){
  Conditions = Meteor.Collections.Conditions;
})

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedConditionId', false);


Session.setDefault('conditionPageTabIndex', 1); 
Session.setDefault('conditionSearchFilter', ''); 
Session.setDefault('selectedConditionId', false);
Session.setDefault('selectedCondition', false)
Session.setDefault('ConditionsPage.onePageLayout', true)
Session.setDefault('ConditionsPage.defaultQuery', {})
Session.setDefault('ConditionsTable.hideCheckbox', true)
Session.setDefault('ConditionsTable.conditionsIndex', 0)


//=============================================================================================================================================
// MAIN COMPONENT

export function ConditionsPage(props){

  let data = {
    currentConditionId: '',
    selectedCondition: null,
    conditions: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    conditionsIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('ConditionsPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('ConditionsTable.hideCheckbox');
  }, [])
  data.selectedConditionId = useTracker(function(){
    return Session.get('selectedConditionId');
  }, [])
  data.selectedCondition = useTracker(function(){
    return Conditions.findOne({_id: Session.get('selectedConditionId')});
  }, [])
  data.conditions = useTracker(function(){
    return Conditions.find().fetch();
  }, [])
  data.conditionsIndex = useTracker(function(){
    return Session.get('ConditionsTable.conditionsIndex')
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

  function handleAddCondition(){
    console.log('Add Condition button clicked');
    // Add logic for adding a new condition
  }

  function renderHeader() {
    return (
      <Box mb={2}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={6}>
            <Typography variant="h4">
              Conditions
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {data.conditions.length} conditions found
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddCondition}
            >
              Add Condition
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  }

  let layoutContent;
  if(data.conditions.length > 0){
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
        <ConditionsTable 
          id='conditionsTable'
          conditions={data.conditions}
          count={data.conditions.length}  
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()} 
          actionButtonLabel="Remove"
          hideClinicalStatus={true}
          hideEvidence={true}
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.Conditions.hideRemoveButtonOnTable', true)}
          onActionButtonClick={function(selectedId){
            Conditions._collection.remove({_id: selectedId})
          }}
          onSetPage={function(index){
            setConditionsPageIndex(index)
          }}        
          page={data.conditionsIndex}
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
            onClick={handleAddCondition}
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
            Add Your First Condition
          </Button>
        </CardContent>
      </Card>
    </Box>
  }
  
  return (
    <Box 
      id="conditionsPage" 
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 }
      }}
    >
      <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
        { data.conditions.length > 0 && renderHeader() }
        { layoutContent }
      </Box>
    </Box>
  );
}



export default ConditionsPage;

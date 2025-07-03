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
    layoutContent = <Card sx={{ width: '100%' }}>
      <CardContent>
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
    layoutContent = <Box style={{display: 'flex', flexDirection: 'column', flexWrap: 'nowrap', height: '100%', justifyContent: 'center'}}>
      <Card sx={{ width: '100%' }}>
        <CardHeader 
          title={get(Meteor, 'settings.public.defaults.noData.defaultTitle', "No Data Available")} 
          subheader={get(Meteor, 'settings.public.defaults.noData.defaultMessage', "No records were found in the client data cursor.  To debug, check the data cursor in the client console, then check subscriptions and publications, and relevant search queries.  If the data is not loaded in, use a tool like Mongo Compass to load the records directly into the Mongo database, or use the FHIR API interfaces.")} 
        />
      </Card>
    </Box>
  }
  
  return (
    <div id="conditionsPage">
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        { renderHeader() }
        { layoutContent }
      </Container>
    </div>
  );
}



export default ConditionsPage;

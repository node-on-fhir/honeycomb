import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';

import { 
  Grid, 
  Container,
  Divider,
  Card,
  CardHeader,
  CardContent,
  Button
} from '@mui/material'; 

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

// import ActivityDefinitionDetail from './ActivityDefinitionDetail';
import ActivityDefinitionsTable from './ActivityDefinitionsTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';


//=============================================================================================================================================
// DATA CURSORS

Meteor.startup(function(){
  ActivityDefinitions = Meteor.Collections.ActivityDefinitions;
})

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedActivityDefinitionId', false);


Session.setDefault('evidencePageTabIndex', 1); 
Session.setDefault('evidenceSearchFilter', ''); 
Session.setDefault('selectedActivityDefinitionId', false);
Session.setDefault('selectedActivityDefinition', false)
Session.setDefault('ActivityDefinitionsPage.onePageLayout', true)
Session.setDefault('ActivityDefinitionsPage.defaultQuery', {})
Session.setDefault('ActivityDefinitionsTable.hideCheckbox', true)
Session.setDefault('ActivityDefinitionsTable.activityDefinitionIndex', 0)


//=============================================================================================================================================
// MAIN COMPONENT

export function ActivityDefinitionsPage(props){

  let data = {
    currentActivityDefinitionId: '',
    selectedActivityDefinition: null,
    activityDefinition: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    activityDefinitionIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('ActivityDefinitionsPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('ActivityDefinitionsTable.hideCheckbox');
  }, [])
  data.selectedActivityDefinitionId = useTracker(function(){
    return Session.get('selectedActivityDefinitionId');
  }, [])
  data.selectedActivityDefinition = useTracker(function(){
    return ActivityDefinitions.findOne({_id: Session.get('selectedActivityDefinitionId')});
  }, [])
  data.activityDefinition = useTracker(function(){
    return ActivityDefinitions.find().fetch();
  }, [])
  data.activityDefinitionIndex = useTracker(function(){
    return Session.get('ActivityDefinitionsTable.activityDefinitionIndex')
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

  let layoutContainer;
  if(data.activityDefinition.length > 0){
    layoutContainer = <Card height="auto" scrollable={true} margin={20}>
      <CardHeader title={ data.activityDefinition.length + " ActivityDefinitions"} />
      <CardContent>
        <ActivityDefinitionsTable 
          id='activityDefinitionTable'
          activityDefinition={data.activityDefinition}
          count={data.activityDefinition.length}  
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()} 
          actionButtonLabel="Remove"
          hideClinicalStatus={true}
          hideActivityDefinition={true}
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.ActivityDefinitions.hideRemoveButtonOnTable', true)}
          onActionButtonClick={function(selectedId){
            ActivityDefinitions._collection.remove({_id: selectedId})
          }}
          onSetPage={function(index){
            setActivityDefinitionsPageIndex(index)
          }}        
          page={data.activityDefinitionIndex}
        />
      </CardContent>
    </Card>
  } else {
    layoutContainer = <Container maxWidth="sm" style={{display: 'flex', flexDirection: 'column', flexWrap: 'nowrap', height: '100%', justifyContent: 'center'}}>
      {/* <img src={Meteor.absoluteUrl() + noDataImage} style={{width: '100%'}} />     */}
      <CardContent>
        <CardHeader 
          title={get(Meteor, 'settings.public.defaults.noData.defaultTitle', "No Data Available")} 
          subheader={get(Meteor, 'settings.public.defaults.noData.defaultMessage', "No records were found in the client data cursor.  To debug, check the data cursor in the client console, then check subscriptions and publications, and relevant search queries.  If the data is not loaded in, use a tool like Mongo Compass to load the records directly into the Mongo database, or use the FHIR API interfaces.")} 
        />
      </CardContent>
    </Container>
  }
  
  return (
    <div id="activityDefinitionPage" style={{padding: "20px"}}>
      { layoutContainer }
    </div>
  );
}



export default ActivityDefinitionsPage;

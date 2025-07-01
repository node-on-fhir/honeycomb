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

// import PlanDefinitionDetail from './PlanDefinitionDetail';
import PlanDefinitionsTable from './PlanDefinitionsTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';


//=============================================================================================================================================
// DATA CURSORS

Meteor.startup(function(){
  PlanDefinitions = Meteor.Collections.PlanDefinitions;
})

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedPlanDefinitionId', false);


Session.setDefault('planDefinitionPageTabIndex', 1); 
Session.setDefault('planDefinitionSearchFilter', ''); 
Session.setDefault('selectedPlanDefinitionId', false);
Session.setDefault('selectedPlanDefinition', false)
Session.setDefault('PlanDefinitionsPage.onePageLayout', true)
Session.setDefault('PlanDefinitionsPage.defaultQuery', {})
Session.setDefault('PlanDefinitionsTable.hideCheckbox', true)
Session.setDefault('PlanDefinitionsTable.planDefinitionsIndex', 0)


//=============================================================================================================================================
// MAIN COMPONENT

export function PlanDefinitionsPage(props){

  let data = {
    currentPlanDefinitionId: '',
    selectedPlanDefinition: null,
    planDefinitions: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    planDefinitionsIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('PlanDefinitionsPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('PlanDefinitionsTable.hideCheckbox');
  }, [])
  data.selectedPlanDefinitionId = useTracker(function(){
    return Session.get('selectedPlanDefinitionId');
  }, [])
  data.selectedPlanDefinition = useTracker(function(){
    return PlanDefinitions.findOne({_id: Session.get('selectedPlanDefinitionId')});
  }, [])
  data.planDefinitions = useTracker(function(){
    return PlanDefinitions.find().fetch();
  }, [])
  data.planDefinitionsIndex = useTracker(function(){
    return Session.get('PlanDefinitionsTable.planDefinitionsIndex')
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
  if(data.planDefinitions.length > 0){
    layoutContainer = <Card height="auto" scrollable={true} margin={20}>
      <CardHeader title={ data.planDefinitions.length + " PlanDefinitions"} />
      <CardContent>
        <PlanDefinitionsTable 
          id='planDefinitionsTable'
          planDefinitions={data.planDefinitions}
          count={data.planDefinitions.length}  
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()} 
          actionButtonLabel="Remove"
          hideClinicalStatus={true}
          hidePlanDefinition={true}
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.PlanDefinitions.hideRemoveButtonOnTable', true)}
          onActionButtonClick={function(selectedId){
            PlanDefinitions._collection.remove({_id: selectedId})
          }}
          onSetPage={function(index){
            setPlanDefinitionsPageIndex(index)
          }}        
          page={data.planDefinitionsIndex}
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
    <div id="planDefinitionsPage" style={{padding: "20px"}}>
      { layoutContainer }
    </div>
  );
}



export default PlanDefinitionsPage;

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

// import GuidanceResponseDetail from './GuidanceResponseDetail';
import GuidanceResponsesTable from './GuidanceResponsesTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';



//=============================================================================================================================================
// DATA CURSORS

Meteor.startup(function(){
  GuidanceResponses = Meteor.Collections.GuidanceResponses;
})

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedGuidanceResponseId', false);


Session.setDefault('guidanceResponsePageTabIndex', 1); 
Session.setDefault('guidanceResponseSearchFilter', ''); 
Session.setDefault('selectedGuidanceResponseId', false);
Session.setDefault('selectedGuidanceResponse', false)
Session.setDefault('GuidanceResponsesPage.onePageLayout', true)
Session.setDefault('GuidanceResponsesPage.defaultQuery', {})
Session.setDefault('GuidanceResponsesTable.hideCheckbox', true)
Session.setDefault('GuidanceResponsesTable.guidanceResponsesIndex', 0)


//=============================================================================================================================================
// MAIN COMPONENT

export function GuidanceResponsesPage(props){

  let data = {
    currentGuidanceResponseId: '',
    selectedGuidanceResponse: null,
    guidanceResponses: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    guidanceResponsesIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('GuidanceResponsesPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('GuidanceResponsesTable.hideCheckbox');
  }, [])
  data.selectedGuidanceResponseId = useTracker(function(){
    return Session.get('selectedGuidanceResponseId');
  }, [])
  data.selectedGuidanceResponse = useTracker(function(){
    return GuidanceResponses.findOne({_id: Session.get('selectedGuidanceResponseId')});
  }, [])
  data.guidanceResponses = useTracker(function(){
    return GuidanceResponses.find().fetch();
  }, [])
  data.guidanceResponsesIndex = useTracker(function(){
    return Session.get('GuidanceResponsesTable.guidanceResponsesIndex')
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
  if(data.guidanceResponses.length > 0){
    layoutContainer = <Card height="auto" scrollable={true} margin={20}>
      <CardHeader title={ data.guidanceResponses.length + " GuidanceResponses"} />
      <CardContent>
        <GuidanceResponsesTable 
          id='guidanceResponsesTable'
          guidanceResponses={data.guidanceResponses}
          count={data.guidanceResponses.length}  
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()} 
          actionButtonLabel="Remove"
          hideClinicalStatus={true}
          hideGuidanceResponse={true}
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.GuidanceResponses.hideRemoveButtonOnTable', true)}
          onActionButtonClick={function(selectedId){
            GuidanceResponses._collection.remove({_id: selectedId})
          }}
          onSetPage={function(index){
            setGuidanceResponsesPageIndex(index)
          }}        
          page={data.guidanceResponsesIndex}
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
    <div id="guidanceResponsesPage" style={{padding: "20px"}}>
      { layoutContainer }
    </div>
  );
}



export default GuidanceResponsesPage;

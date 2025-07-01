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

// import OperationOutcomeDetail from './OperationOutcomeDetail';
import OperationOutcomesTable from './OperationOutcomesTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

//=============================================================================================================================================
// DATA CURSORS

Meteor.startup(function(){
  OperationOutcomes = Meteor.Collections.OperationOutcomes;
})

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedOperationOutcomeId', false);


Session.setDefault('operationOutcomePageTabIndex', 1); 
Session.setDefault('operationOutcomeSearchFilter', ''); 
Session.setDefault('selectedOperationOutcomeId', false);
Session.setDefault('selectedOperationOutcome', false)
Session.setDefault('OperationOutcomesPage.onePageLayout', true)
Session.setDefault('OperationOutcomesPage.defaultQuery', {})
Session.setDefault('OperationOutcomesTable.hideCheckbox', true)
Session.setDefault('OperationOutcomesTable.operationOutcomesIndex', 0)


//=============================================================================================================================================
// MAIN COMPONENT

export function OperationOutcomesPage(props){

  let data = {
    currentOperationOutcomeId: '',
    selectedOperationOutcome: null,
    operationOutcomes: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    operationOutcomesIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('OperationOutcomesPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('OperationOutcomesTable.hideCheckbox');
  }, [])
  data.selectedOperationOutcomeId = useTracker(function(){
    return Session.get('selectedOperationOutcomeId');
  }, [])
  data.selectedOperationOutcome = useTracker(function(){
    return OperationOutcomes.findOne({_id: Session.get('selectedOperationOutcomeId')});
  }, [])
  data.operationOutcomes = useTracker(function(){
    return OperationOutcomes.find().fetch();
  }, [])
  data.operationOutcomesIndex = useTracker(function(){
    return Session.get('OperationOutcomesTable.operationOutcomesIndex')
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
  if(data.operationOutcomes.length > 0){
    layoutContainer = <Card height="auto" scrollable={true} margin={20}>
      <CardHeader title={ data.operationOutcomes.length + " OperationOutcomes"} />
      <CardContent>
        <OperationOutcomesTable 
          id='operationOutcomesTable'
          operationOutcomes={data.operationOutcomes}
          count={data.operationOutcomes.length}  
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()} 
          actionButtonLabel="Remove"
          hideClinicalStatus={true}
          hideOperationOutcome={true}
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.OperationOutcomes.hideRemoveButtonOnTable', true)}
          onActionButtonClick={function(selectedId){
            OperationOutcomes._collection.remove({_id: selectedId})
          }}
          onSetPage={function(index){
            setOperationOutcomesPageIndex(index)
          }}        
          page={data.operationOutcomesIndex}
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
    <div id="operationOutcomesPage" style={{padding: "20px"}}>
      { layoutContainer }
    </div>
  );
}



export default OperationOutcomesPage;

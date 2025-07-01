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

// import EvidenceDetail from './EvidenceDetail';
import EvidencesTable from './EvidencesTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';


//=============================================================================================================================================
// DATA CURSORS

Meteor.startup(function(){
  Evidences = Meteor.Collections.Evidences;
})


//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedEvidenceId', false);


Session.setDefault('evidencePageTabIndex', 1); 
Session.setDefault('evidenceSearchFilter', ''); 
Session.setDefault('selectedEvidenceId', false);
Session.setDefault('selectedEvidence', false)
Session.setDefault('EvidencesPage.onePageLayout', true)
Session.setDefault('EvidencesPage.defaultQuery', {})
Session.setDefault('EvidencesTable.hideCheckbox', true)
Session.setDefault('EvidencesTable.evidencesIndex', 0)


//=============================================================================================================================================
// MAIN COMPONENT

export function EvidencesPage(props){

  let data = {
    currentEvidenceId: '',
    selectedEvidence: null,
    evidences: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    evidencesIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('EvidencesPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('EvidencesTable.hideCheckbox');
  }, [])
  data.selectedEvidenceId = useTracker(function(){
    return Session.get('selectedEvidenceId');
  }, [])
  data.selectedEvidence = useTracker(function(){
    return Evidences.findOne({_id: Session.get('selectedEvidenceId')});
  }, [])
  data.evidences = useTracker(function(){
    return Evidences.find().fetch();
  }, [])
  data.evidencesIndex = useTracker(function(){
    return Session.get('EvidencesTable.evidencesIndex')
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
  if(data.evidences.length > 0){
    layoutContainer = <Card height="auto" scrollable={true} margin={20}>
      <CardHeader title={ data.evidences.length + " Evidences"} />
      <CardContent>
        <EvidencesTable 
          id='evidencesTable'
          evidences={data.evidences}
          count={data.evidences.length}  
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()} 
          actionButtonLabel="Remove"
          hideClinicalStatus={true}
          hideEvidence={true}
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.Evidences.hideRemoveButtonOnTable', true)}
          onActionButtonClick={function(selectedId){
            Evidences._collection.remove({_id: selectedId})
          }}
          onSetPage={function(index){
            setEvidencesPageIndex(index)
          }}        
          page={data.evidencesIndex}
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
    <div id="evidencesPage" style={{padding: "20px"}}>
      { layoutContainer }
    </div>
  );
}



export default EvidencesPage;

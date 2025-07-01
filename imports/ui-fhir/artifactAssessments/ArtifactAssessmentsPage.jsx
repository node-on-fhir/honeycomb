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

// import ArtifactAssessmentDetail from './ArtifactAssessmentDetail';
import ArtifactAssessmentsTable from './ArtifactAssessmentsTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';


//=============================================================================================================================================
// DATA CURSORS

Meteor.startup(function(){
  ArtifactAssessments = Meteor.Collections.ArtifactAssessments;
})


//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedArtifactAssessmentId', false);


Session.setDefault('artifactAssessmentsPageTabIndex', 1); 
Session.setDefault('artifactAssessmentsSearchFilter', ''); 
Session.setDefault('selectedArtifactAssessmentId', false);
Session.setDefault('selectedArtifactAssessment', false)
Session.setDefault('ArtifactAssessmentsPage.onePageLayout', true)
Session.setDefault('ArtifactAssessmentsPage.defaultQuery', {})
Session.setDefault('ArtifactAssessmentsTable.hideCheckbox', true)
Session.setDefault('ArtifactAssessmentsTable.artifactAssessmentsIndex', 0)


//=============================================================================================================================================
// MAIN COMPONENT

export function ArtifactAssessmentsPage(props){

  let data = {
    currentArtifactAssessmentId: '',
    selectedArtifactAssessment: null,
    artifactAssessments: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    artifactAssessmentsIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('ArtifactAssessmentsPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('ArtifactAssessmentsTable.hideCheckbox');
  }, [])
  data.selectedArtifactAssessmentId = useTracker(function(){
    return Session.get('selectedArtifactAssessmentId');
  }, [])
  data.selectedArtifactAssessment = useTracker(function(){
    return ArtifactAssessments.findOne({_id: Session.get('selectedArtifactAssessmentId')});
  }, [])
  data.artifactAssessments = useTracker(function(){
    return ArtifactAssessments.find().fetch();
  }, [])
  data.artifactAssessmentsIndex = useTracker(function(){
    return Session.get('ArtifactAssessmentsTable.artifactAssessmentsIndex')
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
  if(data.artifactAssessments.length > 0){
    layoutContainer = <Card height="auto" scrollable={true} margin={20}>
      <CardHeader title={ data.artifactAssessments.length + " ArtifactAssessments"} />
      <CardContent>
        <ArtifactAssessmentsTable 
          id='artifactAssessmentsTable'
          artifactAssessments={data.artifactAssessments}
          count={data.artifactAssessments.length}  
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()} 
          actionButtonLabel="Remove"
          hideClinicalStatus={true}
          hideArtifactAssessment={true}
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.ArtifactAssessments.hideRemoveButtonOnTable', true)}
          onActionButtonClick={function(selectedId){
            ArtifactAssessments._collection.remove({_id: selectedId})
          }}
          onSetPage={function(index){
            setArtifactAssessmentsPageIndex(index)
          }}        
          page={data.artifactAssessmentsIndex}
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
    <div id="artifactAssessmentsPage" style={{padding: "20px"}}>
      { layoutContainer }
    </div>
  );
}



export default ArtifactAssessmentsPage;

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

// import ResearchSubjectDetail from './ResearchSubjectDetail';
import ResearchSubjectsTable from './ResearchSubjectsTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';

//=============================================================================================================================================
// DATA CURSORS

Meteor.startup(function(){
  ResearchSubjects = Meteor.Collections.ResearchSubjects;
})


//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedResearchSubjectId', false);


Session.setDefault('researchSubjectPageTabIndex', 1); 
Session.setDefault('researchSubjectSearchFilter', ''); 
Session.setDefault('selectedResearchSubjectId', false);
Session.setDefault('selectedResearchSubject', false)
Session.setDefault('ResearchSubjectsPage.onePageLayout', true)
Session.setDefault('ResearchSubjectsPage.defaultQuery', {})
Session.setDefault('ResearchSubjectsTable.hideCheckbox', true)
Session.setDefault('ResearchSubjectsTable.researchSubjectsIndex', 0)


//=============================================================================================================================================
// MAIN COMPONENT

export function ResearchSubjectsPage(props){

  let data = {
    currentResearchSubjectId: '',
    selectedResearchSubject: null,
    researchSubjects: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    researchSubjectsIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('ResearchSubjectsPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('ResearchSubjectsTable.hideCheckbox');
  }, [])
  data.selectedResearchSubjectId = useTracker(function(){
    return Session.get('selectedResearchSubjectId');
  }, [])
  data.selectedResearchSubject = useTracker(function(){
    return ResearchSubjects.findOne({_id: Session.get('selectedResearchSubjectId')});
  }, [])
  data.researchSubjects = useTracker(function(){
    return ResearchSubjects.find().fetch();
  }, [])
  data.researchSubjectsIndex = useTracker(function(){
    return Session.get('ResearchSubjectsTable.researchSubjectsIndex')
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
  if(data.researchSubjects.length > 0){
    layoutContainer = <Card height="auto" scrollable={true} margin={20}>
      <CardHeader title={ data.researchSubjects.length + " ResearchSubjects"} />
      <CardContent>
        <ResearchSubjectsTable 
          id='researchSubjectsTable'
          researchSubjects={data.researchSubjects}
          count={data.researchSubjects.length}  
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()} 
          actionButtonLabel="Remove"
          hideClinicalStatus={true}
          hideResearchSubject={true}
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.ResearchSubjects.hideRemoveButtonOnTable', true)}
          onActionButtonClick={function(selectedId){
            ResearchSubjects._collection.remove({_id: selectedId})
          }}
          onSetPage={function(index){
            setResearchSubjectsPageIndex(index)
          }}        
          page={data.researchSubjectsIndex}
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
    <div id="researchSubjectsPage" style={{padding: "20px"}}>
      { layoutContainer }
    </div>
  );
}



export default ResearchSubjectsPage;

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

// import ResearchStudyDetail from './ResearchStudyDetail';
import ResearchStudiesTable from './ResearchStudiesTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';


//===========================================================================

Meteor.startup(function(){
  ResearchStudies = Meteor.Collections.ResearchStudies;
})

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedResearchStudyId', false);


Session.setDefault('researchStudiesPageTabIndex', 1); 
Session.setDefault('researchStudiesSearchFilter', ''); 
Session.setDefault('selectedResearchStudyId', false);
Session.setDefault('selectedResearchStudy', false)
Session.setDefault('ResearchStudiesPage.onePageLayout', true)
Session.setDefault('ResearchStudiesPage.defaultQuery', {})
Session.setDefault('ResearchStudiesTable.hideCheckbox', true)
Session.setDefault('ResearchStudiesTable.researchStudiesIndex', 0)


//=============================================================================================================================================
// MAIN COMPONENT

export function ResearchStudiesPage(props){

  let data = {
    currentResearchStudyId: '',
    selectedResearchStudy: null,
    researchStudies: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    researchStudiesIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('ResearchStudiesPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('ResearchStudiesTable.hideCheckbox');
  }, [])
  data.selectedResearchStudyId = useTracker(function(){
    return Session.get('selectedResearchStudyId');
  }, [])
  data.selectedResearchStudy = useTracker(function(){
    return ResearchStudies.findOne({_id: Session.get('selectedResearchStudyId')});
  }, [])
  data.researchStudies = useTracker(function(){
    return ResearchStudies.find().fetch();
  }, [])
  data.researchStudiesIndex = useTracker(function(){
    return Session.get('ResearchStudiesTable.researchStudiesIndex')
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
  if(data.researchStudies.length > 0){
    layoutContainer = <Card height="auto" scrollable={true} margin={20}>
      <CardHeader title={ data.researchStudies.length + " ResearchStudies"} />
      <CardContent>
        <ResearchStudiesTable 
          id='researchStudiesTable'
          researchStudies={data.researchStudies}
          count={data.researchStudies.length}  
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()} 
          actionButtonLabel="Remove"
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.ResearchStudies.hideRemoveButtonOnTable', true)}
          onActionButtonClick={function(selectedId){
            ResearchStudies._collection.remove({_id: selectedId})
          }}
          onSetPage={function(index){
            setResearchStudiesPageIndex(index)
          }}        
          page={data.researchStudiesIndex}
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
    <div id="researchStudiesPage" style={{padding: "20px"}}>
      { layoutContainer }
    </div>
  );
}



export default ResearchStudiesPage;

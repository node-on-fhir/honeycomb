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

// import LibraryDetail from './LibraryDetail';
import LibrariesTable from './LibrariesTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get } from 'lodash';



//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('selectedLibraryId', false);


Session.setDefault('libraryPageTabIndex', 1); 
Session.setDefault('librarySearchFilter', ''); 
Session.setDefault('selectedLibraryId', false);
Session.setDefault('selectedLibrary', false)
Session.setDefault('LibrariesPage.onePageLayout', true)
Session.setDefault('LibrariesPage.defaultQuery', {})
Session.setDefault('LibrariesTable.hideCheckbox', true)
Session.setDefault('LibrariesTable.librariesIndex', 0)


//=============================================================================================================================================
// MAIN COMPONENT

export function LibrariesPage(props){

  let data = {
    currentLibraryId: '',
    selectedLibrary: null,
    libraries: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    librariesIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('LibrariesPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('LibrariesTable.hideCheckbox');
  }, [])
  data.selectedLibraryId = useTracker(function(){
    return Session.get('selectedLibraryId');
  }, [])
  data.selectedLibrary = useTracker(function(){
    return Libraries.findOne({_id: Session.get('selectedLibraryId')});
  }, [])
  data.libraries = useTracker(function(){
    return Libraries.find().fetch();
  }, [])
  data.librariesIndex = useTracker(function(){
    return Session.get('LibrariesTable.librariesIndex')
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
  if(data.libraries.length > 0){
    layoutContainer = <Card height="auto" scrollable={true} margin={20}>
      <CardHeader title={ data.libraries.length + " Libraries"} />
      <CardContent>
        <LibrariesTable 
          id='librariesTable'
          libraries={data.libraries}
          count={data.libraries.length}  
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()} 
          actionButtonLabel="Remove"
          hideClinicalStatus={true}
          hideLibrary={true}
          hideActionButton={get(Meteor, 'settings.public.modules.fhir.Libraries.hideRemoveButtonOnTable', true)}
          onActionButtonClick={function(selectedId){
            Libraries._collection.remove({_id: selectedId})
          }}
          onSetPage={function(index){
            setLibrariesPageIndex(index)
          }}        
          page={data.librariesIndex}
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
    <div id="librariesPage" style={{padding: "20px"}}>
      { layoutContainer }
    </div>
  );
}



export default LibrariesPage;

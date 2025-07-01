import { 
  Grid, 
  Container,
  Divider,
  Card,
  CardHeader,
  CardContent,
  Button,
  Tab, 
  Tabs,
  Typography,
  Box
} from '@mui/material';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';

// import EncounterDetail from './EncounterDetail';
import EncountersTable from './EncountersTable';
import LayoutHelpers from '../../lib/LayoutHelpers';


import { get, cloneDeep } from 'lodash';



//=============================================================================================================================================
// DATA CURSORS

Meteor.startup(function(){
  Encounters = Meteor.Collections.Encounters;
})


//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('encounterPageTabIndex', 0);
Session.setDefault('encounterSearchFilter', '');
Session.setDefault('selectedEncounterId', false);
Session.setDefault('fhirVersion', 'v1.0.2');
Session.setDefault('encountersArray', []);

//=============================================================================================================================================
// GLOBAL THEMING



  // This is necessary for the Material UI component render layer
  let theme = {
    primaryColor: "rgb(177, 128, 13)",
    primaryText: "rgba(255, 255, 255, 1) !important",

    secondaryColor: "rgb(177, 128, 13)",
    secondaryText: "rgba(255, 255, 255, 1) !important",

    cardColor: "rgba(255, 255, 255, 1) !important",
    cardTextColor: "rgba(0, 0, 0, 1) !important",

    errorColor: "rgb(128,20,60) !important",
    errorText: "#ffffff !important",

    appBarColor: "#f5f5f5 !important",
    appBarTextColor: "rgba(0, 0, 0, 1) !important",

    paperColor: "#f5f5f5 !important",
    paperTextColor: "rgba(0, 0, 0, 1) !important",

    backgroundCanvas: "rgba(255, 255, 255, 1) !important",
    background: "linear-gradient(45deg, rgb(177, 128, 13) 30%, rgb(150, 202, 144) 90%)",

    nivoTheme: "greens"
  }

  // if we have a globally defined theme from a settings file
  if(get(Meteor, 'settings.public.theme.palette')){
    theme = Object.assign(theme, get(Meteor, 'settings.public.theme.palette'));
  }




//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('encounterPageTabIndex', 1); 
Session.setDefault('encounterSearchFilter', ''); 
Session.setDefault('selectedEncounterId', false);
Session.setDefault('selectedEncounter', false)
Session.setDefault('EncountersPage.onePageLayout', true)
Session.setDefault('EncountersPage.defaultQuery', {})
Session.setDefault('EncountersTable.hideCheckbox', true)
Session.setDefault('EncountersTable.encountersIndex', 0)




//=============================================================================================================================================
// MAIN COMPONENT

export function EncountersPage(props){


  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();
  let noDataImage = get(Meteor, 'settings.public.defaults.noData.noDataImagePath', "packages/clinical_hl7-fhir-data-infrastructure/assets/NoData.png");  
  
  let cardWidth = window.innerWidth - paddingWidth;

  
  let data = {
    selectedEncounterId: '',
    selectedEncounter: null,
    encounters: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    encountersIndex: 0
  };

  data.selectedEncounterId = useTracker(function(){
    return Session.get('selectedEncounterId');
  }, [])
  data.selectedEncounter = useTracker(function(){
    return Encounters.findOne(Session.get('selectedEncounterId'));
  }, [])
  data.encounters = useTracker(function(){
    return Encounters.find().fetch();
  }, [])
  data.encountersIndex = useTracker(function(){
    return Session.get('EncountersTable.encountersIndex')
  }, [])
  data.showSystemIds = useTracker(function(){
    return Session.get('showSystemIds');
  }, [])
  data.showFhirIds = useTracker(function(){
    return Session.get('showFhirIds');
  }, [])


  function setEncountersIndex(newIndex){
    Session.set('EncountersTable.encountersIndex', newIndex)
  }
  
  const rowsPerPage = get(Meteor, 'settings.public.defaults.rowsPerPage', 20);


  let layoutContent;
  if(data.encounters.length > 0){
    layoutContent = <Card height="auto" scrollable={true} margin={20} width={cardWidth + 'px'}>
      <CardHeader
        title={ data.encounters.length + " Encounters"}
      />
      <CardContent>
        <EncountersTable 
          hideIdentifier={true} 
          hideCheckboxes={true} 
          hideSubjects={false}
          actionButtonLabel="Send"
          hideClassCode={false}
          hideReasonCode={false}
          hideReason={false}
          hideHistory={false}
          encounters={ data.encounters }
          count={data.encountersCount}      
          showMinutes={true}
          hideActionIcons={true}
          hideBarcode={false}
          rowsPerPage={LayoutHelpers.calcTableRows()}
          onSetPage={function(index){
            setEncountersIndex(index)
          }}                  
          page={data.encountersIndex}
        />
      </CardContent>
  </Card>
  } else {
    layoutContent = <Container maxWidth="sm" style={{display: 'flex', flexDirection: 'column', flexWrap: 'nowrap', height: '100%', justifyContent: 'center'}}>
      {/* <img src={Meteor.absoluteUrl() + noDataImage} style={{width: '100%'}}  /> */}
      <CardContent>
        <CardHeader 
          title={get(Meteor, 'settings.public.defaults.noData.defaultTitle', "No Data Available")} 
          subheader={get(Meteor, 'settings.public.defaults.noData.defaultMessage', "No records were found in the client data cursor.  To debug, check the data cursor in the client console, then check subscriptions and publications, and relevant search queries.  If the data is not loaded in, use a tool like Mongo Compass to load the records directly into the Mongo database, or use the FHIR API interfaces.")} 
        />
      </CardContent>
    </Container>
  }

  return (
    <div id="encountersPage" style={{padding: "20px"}} >
      { layoutContent }
    </div>
  );
}


export default EncountersPage;
import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';

import { 
  Grid, 
  Card,
  Container,
  CardHeader,
  CardContent,
  Button,
  Tab, 
  Tabs,
  Typography,
  Box
} from '@mui/material';

import MedicationAdministrationsTable from './MedicationAdministrationsTable.jsx';

import LayoutHelpers from '../../lib/LayoutHelpers';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import FhirDehydrator from '../../lib/FhirDehydrator';

import { get, set } from 'lodash';
import { MedicationAdministrations } from '../../lib/schemas/SimpleSchemas/MedicationAdministrations';

//=============================================================================================================================================
// DATA CURSORS

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
// Session Variables

Session.setDefault('fhirVersion', 'v1.0.2');
Session.setDefault('selectedMedicationAdministrationId', false);
Session.setDefault('selectedMedicationAdministration', false);
Session.setDefault('medicationAdministrationPageTabIndex', 1); 
Session.setDefault('medicationAdministrationSearchFilter', ''); 
Session.setDefault('MedicationAdministrationsPage.onePageLayout', true)
Session.setDefault('MedicationAdministrationsPage.defaultQuery', {})
Session.setDefault('MedicationAdministrationsTable.hideCheckbox', true)
Session.setDefault('DevicesTable.medicationAdministrationsIndex', 0)

//=============================================================================================================================================
// MAIN COMPONENT

function MedicationAdministrationsPage(props){

  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();

  let [medicationAdministrationsPageIndex, setMedicationAdministrationsPageIndex] = useState(0);

  // Data fetching
  let data = {
    selectedMedicationAdministrationId: '',
    selectedMedicationAdministration: null,
    medicationAdministrations: []
  };

  data.selectedMedicationAdministrationId = useTracker(function(){
    return Session.get('selectedMedicationAdministrationId');
  }, []);
  
  data.selectedMedicationAdministration = useTracker(function(){
    return MedicationAdministrations.findOne({id: Session.get('selectedMedicationAdministrationId')});
  }, []);
  
  data.medicationAdministrations = useTracker(function(){
    return MedicationAdministrations.find().fetch();
  }, []);

  let layoutContents;
  if(formFactor === "desktop"){
    layoutContents = <Grid container spacing={3} style={{marginBottom: '100px'}}>
      <Grid item md={12} style={{paddingLeft: '20px', paddingRight: '20px'}}>
        <CardHeader title="Medication Administrations" />
        <CardContent>
          <MedicationAdministrationsTable 
            medicationAdministrations={data.medicationAdministrations}
            hideCheckbox={true} 
            hideActionIcons={true}
            hideIdentifier={true}
            hideStatus={false}
            hideName={false}
            paginationLimit={10}
            count={data.medicationAdministrations.length}
          />
        </CardContent>
      </Grid>
    </Grid>
  }

  return (
    <div id="medicationAdministrationsPage" style={{paddingTop: headerHeight + 'px', paddingBottom: '100px'}}>
      <Container maxWidth="xl" style={{paddingBottom: '80px'}}>
        { layoutContents }
      </Container>
    </div>
  );
}

export default MedicationAdministrationsPage;
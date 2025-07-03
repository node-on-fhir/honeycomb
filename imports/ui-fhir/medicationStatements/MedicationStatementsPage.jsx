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

import MedicationStatementsTable from './MedicationStatementsTable.jsx';

import LayoutHelpers from '../../lib/LayoutHelpers';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import FhirDehydrator from '../../lib/FhirDehydrator';

import { get, set } from 'lodash';

//=============================================================================================================================================
// DATA CURSORS

Meteor.startup(function(){
  MedicationStatements = Meteor.Collections.MedicationStatements;
})

//=============================================================================================================================================
// GLOBAL THEMING

// This is necessary for the Material UI component render layer
let theme = {
  primaryColor: "rgb(1177, 128, 13)",
  primaryText: "rgba(255, 255, 255, 1) !important",

  secondaryColor: "rgb(1177, 128, 13)",
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
  background: "linear-gradient(45deg, rgb(1177, 128, 13) 30%, rgb(150, 202, 144) 90%)",

  nivoTheme: "greens"
}

// if we have a globally defined theme from a settings file
if(get(Meteor, 'settings.public.theme.palette')){
  theme = Object.assign(theme, get(Meteor, 'settings.public.theme.palette'));
}

//=============================================================================================================================================
// Session Variables

Session.setDefault('fhirVersion', 'v1.0.2');
Session.setDefault('selectedMedicationStatementId', false);
Session.setDefault('selectedMedicationStatement', false);
Session.setDefault('medicationStatementPageTabIndex', 1); 
Session.setDefault('medicationStatementSearchFilter', ''); 
Session.setDefault('MedicationStatementsPage.onePageLayout', true)
Session.setDefault('MedicationStatementsPage.defaultQuery', {})
Session.setDefault('MedicationStatementsTable.hideCheckbox', true)
Session.setDefault('DevicesTable.medicationStatementsIndex', 0)

//=============================================================================================================================================
// MAIN COMPONENT

export function MedicationStatementsPage(props){

  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();

  let [medicationStatementsPageIndex, setMedicationStatementsPageIndex] = useState(0);

  let layoutContents;
  if(formFactor === "desktop"){
    layoutContents = <Grid container spacing={3} style={{marginBottom: '100px'}}>
      <Grid item md={12} style={{paddingLeft: '20px', paddingRight: '20px'}}>
        <CardHeader title="Medication Statements" />
        <CardContent>
          <MedicationStatementsTable 
            hideCheckbox={true} 
            hideActionIcons={true}
            hideIdentifier={true}
            hideStatus={false}
            hideName={false}
            paginationLimit={10}
          />
        </CardContent>
      </Grid>
    </Grid>
  }

  return (
    <div id="medicationStatementsPage" style={{paddingTop: headerHeight + 'px', paddingBottom: '100px'}}>
      <Container maxWidth="xl" style={{paddingBottom: '80px'}}>
        { layoutContents }
      </Container>
    </div>
  );
}

export default MedicationStatementsPage;
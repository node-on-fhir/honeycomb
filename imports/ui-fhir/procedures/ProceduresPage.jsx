import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';

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

// import ProcedureDetail from './ProcedureDetail';
import ProceduresTable from './ProceduresTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get, cloneDeep } from 'lodash';

import { MuiThemeProvider, createTheme } from '@mui/material/styles';

//=============================================================================================================================================
// DATA CURSORS

Meteor.startup(function(){
  Procedures = Meteor.Collections.Procedures;
})

//=============================================================================================================================================

  // Global Theming 
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

Session.setDefault('procedurePageTabIndex', 1); 
Session.setDefault('procedureSearchFilter', ''); 
Session.setDefault('selectedProcedureId', false);
Session.setDefault('selectedProcedure', false)
Session.setDefault('ProceduresPage.onePageLayout', true)
Session.setDefault('ProceduresPage.defaultQuery', {})
Session.setDefault('ProceduresTable.hideCheckbox', true)
Session.setDefault('ProceduresTable.proceduresIndex', 0)


//=============================================================================================================================================
// MAIN COMPONENT

export function ProceduresPage(props){
  let data = {
    selectedProcedureId: '',
    selectedProcedure: null,
    procedures: [],
    onePageLayout: true
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('ProceduresPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('ProceduresTable.hideCheckbox');
  }, [])
  data.selectedProcedureId = useTracker(function(){
    return Session.get('selectedProcedureId');
  }, [])
  data.selectedProcedure = useTracker(function(){
    return Procedures.findOne(Session.get('selectedProcedureId'));
  }, [])
  data.procedures = useTracker(function(){
    return Procedures.find().fetch();
  }, [])
  data.proceduresIndex = useTracker(function(){
    return Session.get('ProceduresTable.proceduresIndex')
  }, [])
  data.showSystemIds = useTracker(function(){
    return Session.get('showSystemIds');
  }, [])
  data.showFhirIds = useTracker(function(){
    return Session.get('showFhirIds');
  }, [])


  if(process.env.NODE_ENV === "test") console.log('In ProceduresPage render');

  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();

  let cardWidth = window.innerWidth - paddingWidth;
  let proceduresTitle = data.procedures.length + " Procedures";
  let noDataImage = get(Meteor, 'settings.public.defaults.noData.noDataImagePath', "packages/clinical_hl7-fhir-data-infrastructure/assets/NoData.png");  


  let layoutContent;
  if(data.procedures.length > 0){
    layoutContent = <Card height="auto" scrollable={true} margin={20} width={cardWidth + 'px'}>
      <CardHeader title={proceduresTitle} />
        <CardContent>
          <ProceduresTable 
            procedures={data.procedures}
            count={data.procedures.length}
            tableRowSize="medium"
            formFactorLayout={formFactor}
            rowsPerPage={ LayoutHelpers.calcTableRows("medium",  props.appHeight) }
            onSetPage={function(index){
              setProceduresIndex(index)
            }}  
            page={data.proceduresIndex}
            size="small"

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
    <div id="proceduresPage" style={{padding: "20px"}} >
      { layoutContent }
    </div>
  );
}

export default ProceduresPage;
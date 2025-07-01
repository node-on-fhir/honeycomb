import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';

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

// import DeviceDetail from './DeviceDetail';
import DevicesTable from './DevicesTable';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get } from 'lodash';

import LayoutHelpers from '../../lib/LayoutHelpers';



//=============================================================================================================================================
// DATA CURSORS

Meteor.startup(function(){
  Devices = Meteor.Collections.Devices;
})

//=============================================================================================================================================
// Session Variables

Session.setDefault('fhirVersion', 'v1.0.2');
Session.setDefault('selectedDeviceId', false);


Session.setDefault('devicePageTabIndex', 1); 
Session.setDefault('deviceSearchFilter', ''); 
Session.setDefault('selectedDeviceId', false);
Session.setDefault('selectedDevice', false)
Session.setDefault('DevicesPage.onePageLayout', true)
Session.setDefault('DevicesPage.defaultQuery', {})
Session.setDefault('DevicesTable.hideCheckbox', true)
Session.setDefault('DevicesTable.devicesIndex', 0)



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
// COMPONENTS

export function DevicesPage(props){
  if(process.env.NODE_ENV === "test") console.log('In DevicesPage render');

  let data = {
    selectedDeviceId: '',
    selectedDevice: false,
    devices: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    devicesIndex: 0
  };


  data.selectedDeviceId = useTracker(function(){
    return Session.get('selectedDeviceId');
  }, [])
  data.selectedDevice = useTracker(function(){
    return Devices.findOne(Session.get('selectedDeviceId'));
  }, [])
  data.devices = useTracker(function(){
    return Devices.find().fetch()
  }, [])
  data.devicesIndex = useTracker(function(){
    return Session.get('DevicesTable.devicesIndex')
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
  
  let cardWidth = window.innerWidth - paddingWidth;
  
  let layoutContent;
  if(data.devices.length > 0){
    layoutContent = <Card height="auto" scrollable={true} margin={20} width={cardWidth + 'px'}>
      <CardHeader title={data.devices.length + ' Devices'} />
      <CardContent>
        <DevicesTable 
          devices={data.devices}
          count={data.devices.length}
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()}
          onSetPage={function(index){
            setDevicesPageIndex(index)
          }}                
          page={data.devicesIndex}
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
    <div id="devicesPage" style={{padding: "20px"}} >
      { layoutContent }        
    </div>
  );
}


export default DevicesPage;
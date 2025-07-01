import React, { useState } from 'react';

import { 
  Card,
  CardHeader,
  CardContent,
  Tab, 
  Tabs,
  Typography,
  Container,
  Box
} from '@mui/material';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import CarePlansTable from './CarePlansTable';

import LayoutHelpers from '../../lib/LayoutHelpers';

import { useTracker } from 'meteor/react-meteor-data';
import FhirDehydrator from '../../lib/FhirDehydrator';

import { get } from 'lodash';


//=============================================================================================================================================
// DATA CURSORS

Meteor.startup(function(){
  CarePlans = Meteor.Collections.CarePlans;
})


//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('carePlanPageTabIndex', 1); 
Session.setDefault('carePlanSearchFilter', ''); 
Session.setDefault('selectedCarePlanId', false);
Session.setDefault('selectedCarePlan', false)
Session.setDefault('CarePlansPage.onePageLayout', true)
Session.setDefault('CarePlansPage.defaultQuery', {})
Session.setDefault('CarePlansTable.hideCheckbox', true)
Session.setDefault('CarePlansTable.carePlansIndex', 0)


//=============================================================================================================================================
// COMPONENT

function CarePlansPage(props){

  let data = {    
    selectedCarePlanId: null,
    carePlans: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    carePlansIndex: 0
  };

  data.selectedCarePlanId = useTracker(function(){
    return Session.get('selectedCarePlanId');
  }, [])
  data.carePlans = useTracker(function(){
    return CarePlans.find().fetch();
  }, [])
  data.carePlansIndex = useTracker(function(){
    return Session.get('CarePlansTable.carePlansIndex')
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

  let carePlansContent;
  if(data.carePlans.length > 0){
    carePlansContent = <Card height='auto' width={cardWidth + 'px'} margin={20} >
      <CardHeader title={ data.carePlans.length + ' CarePlans'} />
      <CardContent>
        <CarePlansTable 
          carePlans={ data.carePlans}
          count={ data.carePlans.length}
          formFactorLayout={formFactor}
          rowsPerPage={LayoutHelpers.calcTableRows()}
          onSetPage={function(index){
            setCarePlansPageIndex(index)
          }}  
          page={data.carePlansIndex}
        />
      </CardContent>
    </Card>
  } else {
    carePlansContent = <Container maxWidth="sm" style={{display: 'flex', flexDirection: 'column', flexWrap: 'nowrap', height: '100%', justifyContent: 'center'}}>
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
    <div id='carePlansPage' style={{padding: "20px"}} >
      { carePlansContent }      
    </div>
  );
}


export default CarePlansPage;
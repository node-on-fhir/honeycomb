import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';

import { 
  Grid,
  Card,
  Button,
  CardHeader,
  CardContent,
  CardActions,
  Typography,
  TextField,
  Container
} from '@mui/material'; 


// import ImmunizationDetail from './ImmunizationDetail';
import ImmunizationsTable from './ImmunizationsTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { Session } from 'meteor/session';

import { get } from 'lodash';


//=============================================================================================================================================
// DATA CURSORS

Meteor.startup(function(){
  Immunizations = Meteor.Collections.Immunizations;
})



//=============================================================================================================================================
// COMPONENT


Session.setDefault('fhirVersion', 'v1.0.2');

export function ImmunizationsPage(props){

  let data = {
    selectedImmunizationId: Session.get('selectedImmunizationId'),
    selectedImmunization: false,
    immunizations: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    immunizationsIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('ImmunizationsPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('ImmunizationsTable.hideCheckbox');
  }, [])
  data.selectedImmunizationId = useTracker(function(){
    return Session.get('selectedImmunizationId');
  }, [])
  data.selectedImmunization = useTracker(function(){
    return Immunizations.findOne({_id: Session.get('selectedImmunizationId')});
  }, [])
  data.immunizations = useTracker(function(){
    return Immunizations.find().fetch();
  }, [])
  data.immunizationsIndex = useTracker(function(){
    return Session.get('ImmunizationsTable.immunizationsIndex')
  }, [])
  data.showSystemIds = useTracker(function(){
    return Session.get('showSystemIds');
  }, [])
  data.showFhirIds = useTracker(function(){
    return Session.get('showFhirIds');
  }, [])


  // if(process.env.NODE_ENV === "test") console.log('ImmunizationsPage.render()', data);

  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();

  let cardWidth = window.innerWidth - paddingWidth;

  let noDataImage = get(Meteor, 'settings.public.defaults.noData.noDataImagePath', "packages/clinical_hl7-fhir-data-infrastructure/assets/NoData.png");  
  let noDataCardStyle = {};

  // let [immunizationsPageIndex, setImmunizationsPageIndex] = useState(0);

  let layoutContent;
  if(data.immunizations.length > 0){
    layoutContent = <Card height="auto" scrollable={true} margin={20} width={cardWidth + 'px'}>
      <CardHeader title={data.immunizations.length + ' Immunizations'} />
      <CardContent>
        <Grid container>
          <Grid item md={12}>
            <ImmunizationsTable 
              immunizations={data.immunizations }    
              count={ data.immunizations.length }    
              formFactorLayout={formFactor}
              rowsPerPage={LayoutHelpers.calcTableRows()} 
              onSetPage={function(index){
                setImmunizationsPageIndex(index)
              }}    
              page={data.immunizationsIndex}                      
            />
          </Grid>
        </Grid>
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
    <div id='immunizationsPage' style={{padding: "20px"}} >      
      { layoutContent }
    </div>
  );
}



export default ImmunizationsPage;
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

import CompositionDetail from './CompositionDetail';
import CompositionsTable from './CompositionsTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { get, cloneDeep } from 'lodash';


//=============================================================================================================================================
// DATA CURSORS

Meteor.startup(function(){
  Compositions = Meteor.Collections.Compositions;
})

//=============================================================================================================================================
// SESSION VARIABLES

Session.setDefault('compositionPageTabIndex', 0);
Session.setDefault('compositionSearchFilter', '');
Session.setDefault('selectedCompositionId', false);
Session.setDefault('selectedComposition', false);
Session.setDefault('fhirVersion', 'v1.0.2');
Session.setDefault('compositionsArray', []);
Session.setDefault('selectedCompositionId', '')

Session.setDefault('CompositionsPage.onePageLayout', false)
Session.setDefault('CompositionsPage.defaultQuery', {})
Session.setDefault('CompositionsTable.hideCheckbox', true)
Session.setDefault('CompositionsTable.devicesIndex', 0)

//=============================================================================================================================================
// MAIN COMPONENT

export function CompositionsPage(props){

  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();
  let noDataImage = get(Meteor, 'settings.public.defaults.noData.noDataImagePath', "packages/clinical_hl7-fhir-data-infrastructure/assets/NoData.png");  
  

  let data = {
    selectedCompositionId: Session.get("selectedCompositionId"),
    selectedComposition: false,
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    compositionsIndex: 0,
    selected: [],
    compositions: [],
    selectedComposition: {}
  };

  data.selectedCompositionId = useTracker(function(){
    return Session.get('selectedCompositionId');
  }, [])
  data.selectedComposition = useTracker(function(){
    return Compositions.findOne({id: Session.get('selectedCompositionId')});
  }, [])
  data.compositions = useTracker(function(){
    return Compositions.find().fetch();
  }, [])
  data.compositionsIndex = useTracker(function(){
    return Session.get('CompositionsTable.compositionsIndex')
  }, [])
  data.showSystemIds = useTracker(function(){
    return Session.get('showSystemIds');
  }, [])
  data.showFhirIds = useTracker(function(){
    return Session.get('showFhirIds');
  }, [])

  data.onePageLayout = useTracker(function(){
    return Session.get('CompositionsPage.onePageLayout');
  }, [])


  function compositionRowClick(id){
    console.log('compositionRowClick', id)
    Session.set('selectedCompositionId', id)
  }


  let layoutContent;
  if(data.compositions.length > 0){
    if(data.onePageLayout){
      layoutContent = <Card height="auto" scrollable={true} margin={20}>
        <CardHeader
          title="Compositions"
        />
        <CardContent>
          <CompositionsTable 
            compositions={ data.compositions }
            paginationLimit={10}
            />
        </CardContent>
      </Card>
    } else {
  
      let sectionCards = [];
      let componentSections = get(data.selectedComposition, 'section', []);
      if(Array.isArray(componentSections)){
        componentSections.forEach(function(section){
          sectionCards.push(<Card>
            <CardHeader title={get(section, 'title', '')} />
            <CardContent style={{maxHeight: '200px'}} >
              <div className="dangerouslySetInnerHTML" dangerouslySetInnerHTML={{__html: get(section, 'text.div', '')}} style={{width: '100%'}}></div>
            </CardContent>      
          </Card>)
          sectionCards.push(<DynamicSpacer />)
        })
      }
  
      layoutContent = <Grid container spacing={3}>
        <Grid item md={8}>
          <Card height="auto" scrollable={true} margin={20}>
            <CardHeader
              title="Compositions"
            />
            <CardContent>
              <CompositionsTable 
                compositions={ data.compositions }
                paginationLimit={10}
                hideBarcode={true}
                hideIdentifier={true}
                hideSubjectReference={true}
                onRowClick={compositionRowClick.bind(this)}
                onSetPage={function(index){
                  setCompositionsPageIndex(index)
                }}        
                page={data.compositionsIndex}
              />            
            </CardContent>
          </Card>
  
        </Grid>
        <Grid item md={4}>
          <Card scrollable={true} margin={20}>
            <h2 className="barcode barcodes">{data.selectedCompositionId}</h2>            
          </Card>
          <DynamicSpacer />
          {/* <Card scrollable={true} margin={20}>
            <CardContent style={{maxHeight: '200px'}}>
              <pre>
                {JSON.stringify(data.selectedComposition, null, 2)}
              </pre>
            </CardContent>      
          </Card>
          <DynamicSpacer /> */}
  
          <Card scrollable={true} margin={20} style={{paddingBottom: '20px'}}>
            <CardHeader title="Metadata" />
            <CardContent style={{maxHeight: '200px', paddingBottom: '20px'}}>
              <CompositionDetail 
                composition={data.selectedComposition}
              />
            </CardContent>      
          </Card>
          <DynamicSpacer />
          { sectionCards }
        </Grid>
      </Grid> 
    }
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
    <div id="compositionsPage" style={{padding: "20px"}} >
      { layoutContent }
    </div>
  );
}


export default CompositionsPage;
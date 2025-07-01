import React  from 'react';
import { useTracker } from 'meteor/react-meteor-data';

import { 
  Grid,
  Card,
  CardHeader,
  CardContent,
  Container
} from '@mui/material';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import CareTeamDetail from './CareTeamDetail';
import CareTeamsTable from './CareTeamsTable';

import FhirDehydrator from '../../lib/FhirDehydrator';


import LayoutHelpers from '../../lib/LayoutHelpers';

import { get, cloneDeep } from 'lodash';


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



//---------------------------------------------------------------
// Session Variables


Session.setDefault('careTeamPageTabIndex', 0);
Session.setDefault('careTeamSearchFilter', '');
Session.setDefault('selectedCareTeamId', '');
Session.setDefault('selectedCareTeam', false);
Session.setDefault('CareTeamsPage.onePageLayout', true)
Session.setDefault('CareTeamsTable.hideCheckbox', true)



//=============================================================================================================================================
// COMPONENT

function CareTeamsPage(props){

  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();
  let noDataImage = get(Meteor, 'settings.public.defaults.noData.noDataImagePath', "packages/clinical_hl7-fhir-data-infrastructure/assets/NoData.png");  
  
  let cardWidth = window.innerWidth - paddingWidth;


  let data = {    
    selectedCareTeam: null,
    selectedCareTeamId: '',
    onePageLayout: true,
    hideCheckbox: true,
    careTeams: []
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('CareTeamsPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('CareTeamsTable.hideCheckbox');
  }, [])

  data.selectedCareTeam = useTracker(function(){
    return CareTeams.findOne({id: Session.get('selectedCareTeamId')});
  }, [])
  data.selectedCareTeamId = useTracker(function(){
    return Session.get('selectedCareTeamId');
  }, [])
  data.careTeams = useTracker(function(){
    return CareTeams.find().fetch();
  }, [])

  function handleRowClick(careTeamId){
    console.log('CareTeamsPage.handleRowClick', careTeamId)
    let careTeam = CareTeams.findOne({id: careTeamId});

    if(careTeam){
      Session.set('selectedCareTeamId', get(careTeam, 'id'));
      Session.set('selectedCareTeam', careTeam);
      Session.set('CareTeam.Current', careTeam);
      
      let showModals = true;
      if(showModals){
        Session.set('mainAppDialogOpen', true);
        Session.set('mainAppDialogComponent', "CareTeamDetail");
        Session.set('mainAppDialogMaxWidth', "sm");
        if(Meteor.currentUserId()){
          Session.set('mainAppDialogTitle', "Edit Team");
        } else {
          Session.set('mainAppDialogTitle', "View Team");
        }
      }      
    } else {
      console.log('No careteam found...')
    }
  }

  let layoutContents;
  if(data.careTeams.length > 0){
    if(data.onePageLayout){
      layoutContents = <Card height='auto' width={cardWidth + 'px'} margin={20} >
        <CardHeader title={ data.careTeams.length + ' Care Teams'} />
        <CardContent>
          <CareTeamsTable 
            formFactorLayout={formFactor}  
            careTeams={ data.careTeams}
            count={data.careTeams.length}
            selectedCarePlanId={ data.selectedCarePlanId }
            hideCheckbox={data.hideCheckbox}
            rowsPerPage={ LayoutHelpers.calcTableRows("medium",  props.appHeight) }
            onRowClick={ handleRowClick.bind(this) }
            size="small"
          />
        </CardContent>
      </Card>
    } else {
      layoutContents = <Grid container spacing={3}>
        <Grid item lg={6}>
          <Card height="auto" margin={20} >
            <CardHeader title={data.careTeams.length + " Care Teams"} />
            <CardContent>
              <CareTeamsTable 
                careTeams={ data.careTeams}
                count={ data.careTeams.length}
                hideCheckbox={data.hideCheckbox}
                formFactorLayout={formFactor}
                rowsPerPage={ LayoutHelpers.calcTableRows("medium",  props.appHeight) }
                onRowClick={ handleRowClick.bind(this) }
                size="medium"
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item lg={4}>
          <Card height="auto" margin={20} scrollable>
            <h1 className="barcode" style={{fontWeight: 100}}>{data.selectedCareTeamId }</h1>
            {/* <CardHeader title={data.selectedCareTeamId } className="helveticas barcode" /> */}
            <CardContent>
              <CardContent>
                <CareTeamDetail 
                  id='careTeamDetails'                 
                  careTeam={ data.selectedCareTeam }
                  careTeamId={ data.selectedCareTeamId } 
                />
              </CardContent>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    }
  } else {
    layoutContents = <Container maxWidth="sm" style={{display: 'flex', flexDirection: 'column', flexWrap: 'nowrap', height: '100%', justifyContent: 'center'}}>
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
    <div id='careTeamsPage' style={{padding: "20px"}} >
      { layoutContents }
    </div>
  );
}


export default CareTeamsPage;
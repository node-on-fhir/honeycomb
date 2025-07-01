import { 
  Grid, 
  Container,
  Divider,
  Card,
  CardHeader,
  CardContent,
  Button,
  Dialog,
  TextField
} from '@mui/material'; 



// import ServiceRequestDetail from './ServiceRequestDetail';
import ServiceRequestsTable from './ServiceRequestsTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import React, { useEffect, useState }  from 'react';
import { useTracker } from 'meteor/react-meteor-data';


import { get, set } from 'lodash';


let defaultServiceRequest = {
  index: 2,
  id: '',
  username: '',
  email: '',
  given: '',
  family: '',
  gender: ''
};


//=============================================================================================================================================
// DATA CURSORS

Meteor.startup(function(){
  ServiceRequests = Meteor.Collections.ServiceRequests;
})

//=============================================================================================================================================
// SESSION VARIABLES


Session.setDefault('serviceRequestFormData', defaultServiceRequest);
Session.setDefault('serviceRequestSearchFilter', '');
Session.setDefault('serviceRequestSearchQuery', {});
Session.setDefault('serviceRequestDialogOpen', false);
Session.setDefault('selectedServiceRequestId', false);
Session.setDefault('fhirVersion', 'v1.0.2');




//===============================================================================================================
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
// MAIN COMPONENT

export function ServiceRequestsPage(props){


  //---------------------------------------------------------------------------------------------------------
  // State

  let data = {
    tabIndex: Session.get('serviceRequestPageTabIndex'),
    serviceRequest: defaultServiceRequest,
    serviceRequestSearchFilter: '',
    currentServiceRequest: null,
    serviceRequestSearchQuery: {},
    dialogOpen: Session.get('serviceRequestDialogOpen'), 
    selectedServiceRequestId: Session.get('selectedServiceRequestId'),
    selectedServiceRequest: false,
    serviceRequests: [],
    serviceRequestsIndex: 0
  };


  //---------------------------------------------------------------------------------------------------------
  // Trackers

  data.serviceRequest = useTracker(function(){
    return Session.get('serviceRequestFormData');
  })
  data.serviceRequestSearchFilter = useTracker(function(){
    return Session.get('serviceRequestSearchFilter');
  })
  data.serviceRequestSearchFilter = useTracker(function(){
    return Session.get('serviceRequestSearchFilter');
  })
  data.serviceRequestSearchQuery = useTracker(function(){
    return Session.get('serviceRequestSearchQuery');
  })
  data.selectedServiceRequest = useTracker(function(){
    return Session.get('selectedServiceRequest');
  })
  data.selectedServiceRequestId = useTracker(function(){
    return Session.get('selectedServiceRequestId');
  })

  data.serviceRequests = useTracker(function(){
    return ServiceRequests.find().fetch()
  })


  // ???????
  if(get(this, 'props.params.serviceRequestId')){
    data.selectedServiceRequest = ServiceRequests.findOne({id: get(this, 'props.params.serviceRequestId')});
    Session.set('serviceRequestPageTabIndex', 2);
  } else if (Session.get('selectedServiceRequestId')){
    data.selectedServiceRequest = ServiceRequests.findOne({_id: Session.get('selectedServiceRequestId')});
  } else {
    data.selectedServiceRequest = false;
  }




  //---------------------------------------------------------------------------------------------------------
  // Lifecycle

  // useEffect(function(){
  // //   if(get(this, 'props.params.serviceRequestId')){
  // //     Session.set('selectedServiceRequestId', get(this, 'props.params.serviceRequestId'))
  // //     Session.set('serviceRequestPageTabIndex', 2);
  // //   }
  // }, [])

  function handleTabChange(index){
    Session.set('serviceRequestPageTabIndex', index);
  }

  function onNewTab(){
    Session.set('selectedServiceRequest', false);
    Session.set('serviceRequestUpsert', false);
  }
  function handleClose(){
    Session.set('serviceRequestDialogOpen', false);
  }
  function handleSearch(){
    console.log('handleSearch', get(this, 'state.searchForm'));

    Session.set('serviceRequestSearchQuery', {
      "$and": [
        {"serviceRequestingParty.display": {"$regex": get(this, 'state.searchForm.familyName')}}, 
        {"serviceRequestingParty.display": {"$regex": get(this, 'state.searchForm.givenName')}}
      ]
    });
    handleClose();
  }

  function changeSelectedCategory(event, value){
    console.log('changeSelectedCategory', event, value)

    let searchForm = state.searchForm;
    searchForm.category = value;

    // setState({searchForm: searchForm})
  }
  function updateFormData(formData, field, textValue){
    if(process.env.NODE_ENV === "test") console.log("ServiceRequestDetail.updateFormData", formData, field, textValue);

    switch (field) {
      case "givenName":
        set(formData, 'givenName', textValue)
        break;
      case "familyName":
        set(formData, 'familyName', textValue)
        break;        
      case "category":
        set(formData, 'category', textValue)
        break;
    }

    if(process.env.NODE_ENV === "test") console.log("formData", formData);
    return formData;
  }
  function updateSearch(serviceRequestData, field, textValue){
    if(process.env.NODE_ENV === "test") console.log("ServiceRequestDetail.updateServiceRequest", serviceRequestData, field, textValue);

    // switch (field) {
    //   case "givenName":
    //     set(serviceRequestData, 'givenName', textValue)
    //     break;
    //   case "familyName":
    //     set(serviceRequestData, 'familyName', textValue)
    //     break;        
    //   case "category":
    //     set(serviceRequestData, 'category.text', textValue)
    //     break;  
    // }
    return serviceRequestData;
  }
  function changeState(field, event, textValue){
    if(process.env.NODE_ENV === "test") console.log("   ");
    if(process.env.NODE_ENV === "test") console.log("ServiceRequestDetail.changeState", field, textValue);
    if(process.env.NODE_ENV === "test") console.log("state", state);

    let searchForm = Object.assign({}, state.searchForm);
    let searchQuery = Object.assign({}, state.searchQuery);

    searchForm = updateFormData(searchForm, field, textValue);
    searchQuery = updateSearch(searchQuery, field, textValue);

    if(process.env.NODE_ENV === "test") console.log("searchQuery", searchQuery);
    if(process.env.NODE_ENV === "test") console.log("searchForm", searchForm);

    // setState({searchQuery: searchQuery})
    // setState({searchForm: searchForm})
  }


  //=============================================================================================================================================
  // Renders
  console.log('React.version: ' + React.version);
  console.log('ServiceRequestsPage.props', props);

  const actions = [
    <Button
      label="Cancel"
      color="primary"
      onClick={handleClose}
    />,
    <Button
      label="Search"
      color="primary"
      keyboardFocused={true}
      onClick={handleSearch.bind(this) }
    />
  ];

  // let [serviceRequestsIndex, setServiceRequestsIndex] = setState(0);

  let serviceRequestPageContent;
  if(true){
    serviceRequestPageContent = <ServiceRequestsTable 
      showBarcodes={true} 
      hideIdentifier={true}
      serviceRequests={data.serviceRequests}
      hideRequestorReference={true}
      noDataMessage={false}
      rowsPerPage={LayoutHelpers.calcTableRows()}
      onSetPage={function(index){
        // setServiceRequestsIndex(index)
      }}  
      page={data.serviceRequestsIndex}
      sort="occurrenceDateTime"
    />
  }

  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();

  let cardWidth = window.innerWidth - paddingWidth;

  return (
      <div id="serviceRequestsPage" style={{padding: "20px"}} >
        <Card height="auto" width={cardWidth + 'px'} margin={20} >
          <CardHeader
            title={ data.serviceRequests.length + " Service Requests"}
          />
          <CardContent>
            { serviceRequestPageContent }
          </CardContent>
        </Card>
        
      </div>
  );

}



export default ServiceRequestsPage;
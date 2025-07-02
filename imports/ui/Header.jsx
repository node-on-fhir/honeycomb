import React, { useState } from 'react';

import PropTypes from 'prop-types';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';

import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';


import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { get, has } from 'lodash';
import moment from 'moment';

import { useTracker } from 'meteor/react-meteor-data';
import { FhirUtilities } from '../FhirUtilities';

import { logger } from '../Logger';

import { useNavigate } from "react-router-dom";
// import { history, useTheme } from './App';

// import { useNavigation } from './NavigationContext';


//----------------------------------------------------------------------
// Helper Components

let DynamicSpacer;
let useTheme;
Meteor.startup(function(){
  DynamicSpacer = Meteor.DynamicSpacer;
  useTheme = Meteor.useTheme;
})

// ==============================================================================
// Icons  
import { Icon } from 'react-icons-kit';
import {ic_menu} from 'react-icons-kit/md/ic_menu';
import {ic_donut_large} from 'react-icons-kit/md/ic_donut_large';
import {ic_track_changes} from 'react-icons-kit/md/ic_track_changes';
import {ic_gps_not_fixed} from 'react-icons-kit/md/ic_gps_not_fixed';
import {ic_gps_off} from 'react-icons-kit/md/ic_gps_off';
import {ic_radio_button_checked} from 'react-icons-kit/md/ic_radio_button_checked';
import {ic_radio_button_unchecked} from 'react-icons-kit/md/ic_radio_button_unchecked';

let headerMenuIcon = ic_radio_button_checked;

// ==============================================================================
// Dynamic Imports 

let headerWorkflows = [];


// dynamic dialog components
Object.keys(Package).forEach(function(packageName){
  if(Package[packageName].WorkflowTabs){
    // we try to build up a route from what's specified in the package
    Package[packageName].WorkflowTabs.forEach(function(componentReference){
      headerWorkflows.push(componentReference);      
    });    
  }
});

// ==============================================================================
// Main Component

function Header({ drawerIsOpen, handleDrawerOpen, lastUpdated }) {

  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // if(typeof logger === "undefined"){
  //   logger = logger;
  // }
  
  // if(logger){
  //   console.debug('package.care-cards.client.layout.Header');  
  // }

  // let [drawerIsOpen, setDrawerIsOpen] = useState(false);
  let [currentUser, setCurrentUser] = useState({
    givenName: 'Anonymous'
  });

  

  // ------------------------------------------------------------
  // Trackers

  let selectedStartDate;
  let selectedEndDate;
  let useDateRangeInQueries;
  let currentPatientId = "";
  let currentPatient = null;  
  let workflowTabs = "default";  
  let displayNavbars = true;  

  if(Meteor.isClient){
    selectedStartDate = useTracker(function(){
      return Session.get("fhirKitClientStartDate");
    }, [lastUpdated]);
    selectedEndDate = useTracker(function(){
      return Session.get("fhirKitClientEndDate");
    }, [lastUpdated]);
  
    useDateRangeInQueries = useTracker(function(){
      return Session.get("useDateRangeInQueries");
    }, [lastUpdated]);
  
    currentPatientId = useTracker(function(){
      return Session.get("currentPatientId");
    }, [lastUpdated]);
  
    currentPatient = useTracker(function(){  
      return Session.get("currentPatient");  
    }, [lastUpdated]);  
  
    workflowTabs = useTracker(function(){  
      return Session.get("workflowTabs");  
    }, [lastUpdated]);  
  
  
    displayNavbars = useTracker(function(){  
      return Session.get("displayNavbars");  
    }, []);  

    // Get the actual Meteor user
    const meteorUser = useTracker(() => {
      const user = Meteor.user();
      console.log('Meteor.user():', user);
      console.log('Meteor.userId():', Meteor.userId());
      return user;
    });
    
    // Use the Meteor user directly
    currentUser = meteorUser;
  } // Close the if(Meteor.isClient) block

  // if(!displayNavbars){
  //   componentStyles.headerNavContainer.top = '-128px'
  // }
  // if(get(Meteor, 'settings.public.defaults.disableHeader')){
  //   componentStyles.headerNavContainer.display = 'none'
  // }


  // ------------------------------------------------------------  
  // Layout  

  // if(Meteor.isClient && drawerIsOpen){
  //   componentStyles.headerNavContainer.width = window.innerWidth - drawerWidth;
  //   componentStyles.headerNavContainer.left = drawerWidth;
  // }

  let workflowTabsToRender;
  let selectedWorkflow;
  if(get(Meteor, 'settings.public.defaults.prominantHeader', false)){    
    if(Meteor.isClient){
      headerWorkflows.forEach(function(workflow){
        if(Array.isArray(workflow.matchingPaths)){
          if(workflow.matchingPaths.includes(window.location.pathname)){
            // console.log('Found a matching workflow component to render.')
            
            // did we find a matching component?
            workflowTabsToRender = workflow.component;  
          }  

          if(workflowTabsToRender){
            workflowTabsToRender = React.cloneElement(
              workflowTabsToRender, props 
            );
          }
        }
      })
    }     
  }




  // ------------------------------------------------------------
  // Helper Methods

  function parseTitle(){
    let titleText = get(Meteor, 'settings.public.title', 'Honeycomb');
    let secondaryTitleText = get(Meteor, 'settings.public.secondaryTitle', '');
    let selectedPatient;

    if(Meteor.isClient){
      if(get(Meteor, 'settings.public.defaults.showPatientNameInHeader')){
        if(Session.get("selectedPatient")){
          selectedPatient = Session.get("selectedPatient");
  
          // titleText = FhirUtilities.pluckName(selectedPatient); 
          titleText = FhirUtilities.pluckName(selectedPatient); 
          logger.verbose("Selected patients name that we're displaying in the Title: " + titleText)
        } else {

          if(!Meteor.isCordova){      
            titleText = titleText + secondaryTitleText;
          }
        }
      } else {
        if(!Meteor.isCordova){      
          titleText = titleText + secondaryTitleText;
        }

      }
    }

    return titleText;    
  }

  
  function parseId(){
    let patientId = '';
    if(Meteor.isClient){
      patientId = get(Session.get('selectedPatient'), 'id');
    }
    return patientId;
  }


  function getSearchDateRange(){
    return moment(selectedStartDate).format("MMM DD, YYYY") + " until " + moment(selectedEndDate).format("MMM DD, YYYY")
  }
  // console.log('AuthContext.loginWithService()', service, credentials);


  function toggleLoginDialog(){
    // console.log('Toggle login dialog open/close.')
    Session.set('mainAppDialogJson', false);
    Session.set('mainAppDialogMaxWidth', "sm");

    if(Session.get('currentUser')){
      Session.set('mainAppDialogTitle', "Logout");
      Session.set('mainAppDialogComponent', "LogoutDialog");
    } else {
      Session.set('mainAppDialogTitle', "Login");
      Session.set('mainAppDialogComponent', "LoginDialog");      
    }

    Session.toggle('mainAppDialogOpen');
  }

  function toggleLoginDialog(){
    console.log('Toggle login dialog open/close.')
    Session.set('mainAppDialogJson', false);
    Session.set('mainAppDialogMaxWidth', "sm");

    if(Session.get('currentUser')){
      Session.set('mainAppDialogTitle', "Logout");
      Session.set('mainAppDialogComponent', "LogoutDialog");
    } else {
      Session.set('mainAppDialogTitle', "Login");
      Session.set('mainAppDialogComponent', "LoginDialog");      
    }

    Session.toggle('mainAppDialogOpen');
  }


  let demographicItems;
  let dateTimeItems;
  let userItems;



  if(Meteor.isClient){
    // console.log('Header.Meteor.isClient')
    // if we have a selected patient, we show that info
    if(!Meteor.isCordova){
      // console.log('Header.Meteor.!isCordova')
      if(get(Meteor, 'settings.public.defaults.enablePatientOveride')){
        if(Session.get('selectedPatient')){
          demographicItems = <div style={{float: 'right', top: '10px', position: 'absolute', right: '20px'}}>
            <Typography variant="h6" color="inherit" >Patient ID: </Typography>
            <Typography variant="h6" color="inherit" noWrap className="barcode" >
              <span className="barcode helvetica">
                { parseId() }
              </span>
            </Typography>
          </div>     
        }
      } else {
        // console.log('Header.Meteor.!patientId')
        // otherwise, we default to population/search level info to display
        if(useDateRangeInQueries){
          if(selectedStartDate && selectedEndDate){
            dateTimeItems = <div style={{float: 'right', top: '10px', position: 'absolute', right: '20px'}}>
              <Typography variant="h6" color="inherit" >Date Range: </Typography>
              <Typography variant="h6" color="inherit" noWrap >
                { getSearchDateRange() }
              </Typography>
            </div>   
          }      
        }
        if(get(Meteor, 'settings.public.defaults.displayUserNameInHeader')){
          userItems = <div style={{float: 'right', top: '5px', position: 'absolute', right: '20px', cursor: 'pointer'}} onClick={toggleLoginDialog.bind(this)}>
          <Typography variant="h6" color="inherit" >User: </Typography>
          <Typography variant="h6" color="inherit" noWrap >
            { currentUser }
          </Typography>
        </div>             
        }
      }
    }
  }



  function handleClickHomeButton(){

    if(typeof handleDrawerOpen === "function"){
      handleDrawerOpen();
    } else {
      let homeUrl = get(Meteor, 'settings.public.defaults.homePageUrl', '/home');
      navigate(homeUrl, { replace: true });      
    }
  }

  
  let appStyle = {
    position: "relative",
    zIndex: 10000
  };
  // if(theme === 'light'){
  //   appStyle.background = get(Meteor, 'settings.public.theme.palette.appBarColor'); 
  //   appStyle.color = get(Meteor, 'settings.public.theme.palette.appBarTextColor'); 
  // } else if(theme === 'dark'){
  //   appStyle.background = get(Meteor, 'settings.public.theme.palette.appBarColorDark'); 
  //   appStyle.color = get(Meteor, 'settings.public.theme.palette.appBarTextColorDark'); 
  // }

  return (
    <Box id="header" sx={{ flexGrow: 1, zIndex: 1000, position: 'relative' }}>
      <AppBar id="headerContent" position="static" >
        <Toolbar>
          <IconButton
            id="sidebarMenuButton"
            size="large"
            edge="start"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={handleClickHomeButton}
          >
            <MenuIcon color="standard" />
          </IconButton>
          <Typography id="headerTitle" variant="h6" component="div" sx={{ flexGrow: 1 }} color="standard.main">
          { parseTitle() }
          </Typography>
          <IconButton  onClick={toggleTheme}>
            {theme === 'light' ? <Brightness4Icon color="standard" /> : <Brightness7Icon color="standard" />}
          </IconButton>
          {/* { userItems }
          { dateTimeItems }        
          { demographicItems }
          { workflowTabsToRender }
          */}
          {(console.log('currentUser in render:', currentUser), currentUser) ? (
            <>
              <Typography variant="body2" sx={{ mr: 2 }}>
                {currentUser.username || currentUser.emails?.[0]?.address}
              </Typography>
              <Button color="standard" onClick={() => {
                console.log('Logout clicked');
                Meteor.logout((err) => {
                  if (err) {
                    console.error('Logout error:', err);
                  } else {
                    console.log('Logged out successfully');
                    navigate('/');
                  }
                });
              }}>Logout</Button>
            </>
          ) : (
            <Button color="standard" onClick={() => navigate('/login')}>Login</Button>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
}


export default Header;

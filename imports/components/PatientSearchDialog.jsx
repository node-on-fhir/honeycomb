import React, { useState } from 'react';

import { makeStyles, withStyles } from '@material-ui/core/styles';

import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,    
  TextField,
  Input,
  InputAdornment,
  InputLabel,
  FormControl,
  IconButton
} from '@material-ui/core';

import PropTypes from 'prop-types';

import Grid from '@material-ui/core/Grid';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import SearchIcon from '@material-ui/icons/Search';

import { get, has } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { HTTP } from 'meteor/http';
import JSON5 from 'json5';

import moment from 'moment';
import clsx from 'clsx';
import { ReactMeteorData, useTracker } from 'meteor/react-meteor-data';

import { PageCanvas, StyledCard, PatientsTable, FhirUtilities, LayoutHelpers } from 'fhir-starter';

import { Patients } from 'meteor/clinical:hl7-fhir-data-infrastructure';


//==============================================================================================
// THEMING

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  githubIcon: {
    margin: '0px'
  }
}));

//==============================================================================================
// MAIN COMPONENT

function PatientSearchDialog(props){

  let { 
    children,
    defaultSearchTerm, 
    onSelect,
    hideFhirBarcode,
    ...otherProps 
  } = props;

  const classes = useStyles();
  const [searchTerm, setSearchTerm] = React.useState(defaultSearchTerm);

  let patients = useTracker(function(){
    return Patients.find({'name.text': {$regex: searchTerm }}).fetch();
  });

  console.log("PatientSearchDialog.searchTerm", searchTerm)
  console.log("PatientSearchDialog.patients", patients)


  function changeInput(variable, event, value){
    // console.log('changeInput', variable, event, event.currentTarget.value);
    setSearchTerm(event.currentTarget.value);
  }  
  function handleFilterPatients(event, foo){
    console.log('handleFilterPatients', event, foo)
  }



  return (
    <DialogContent dividers={scroll === 'paper'} style={{minWidth: '100%', minHeight: '650px', fontSize: '120%'}}>
      <FormControl className={clsx(classes.margin, classes.textField)} fullWidth>
        {/* <InputLabel htmlFor="title-input" shrink={true}>Patient Search</InputLabel> */}
        <Input
          id="patientSearchField"
          placeholder="Jane Doe"
          onChange={ changeInput.bind(this, 'patientSearchField')}
          value={ searchTerm }
          fullWidth        
          InputLabelProps={{ shrink: true }}
          endAdornment={
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={ handleFilterPatients.bind(this) }
              >
                <SearchIcon />
              </IconButton>
            </InputAdornment>
          }  
        />
      </FormControl>
      <PatientsTable 
        hideActionIcons={true}
        hideActive={true}
        hideAddress={true}
        hideCity={true}
        hideState={true}
        hideCountry={true}
        hidePostalCode={true}
        hideMaritalStatus={true}
        hideLanguage={true}
        hideIdentifier={true}
        hideSystemBarcode={true}
        hideFhirBarcode={hideFhirBarcode}
        patients={patients}
        paginationCount={patients.length}        
        rowsPerPage={20}
        rowClickMode="id"
        onRowClick={function(selectedPatientId){
          console.log('PatientSearchDialog.PatientsTable.onRowClick', selectedPatientId);

          
          if(typeof onSelect === "function"){
            onSelect(selectedPatientId)
          }
        }}
      />
    </DialogContent>
  );
}



PatientSearchDialog.propTypes = { 
  hideFhirBarcode: PropTypes.bool,
  defaultSearchTerm: PropTypes.string,
  onSelect: PropTypes.func
};

PatientSearchDialog.defaultProps = {
  defaultSearchTerm: "",
  hideFhirBarcode: true
}

export default PatientSearchDialog
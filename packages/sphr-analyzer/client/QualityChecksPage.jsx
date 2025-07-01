import React, { useState } from 'react';

import { get } from 'lodash';

import { Button, Grid, CardHeader, CardContent, Typography } from '@mui/material';

import { useTracker } from 'meteor/react-meteor-data';
import { browserHistory } from 'react-router';

import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';

let Patients;
let Compositions;
let DynamicSpacer;
let DocumentManifests;

Meteor.startup(function(){
  Patients = Meteor.Collections.Patients;
  Compositions = Meteor.Collections.Compositions;
  DynamicSpacer = Meteor.DynamicSpacer;
  DocumentManifests = Meteor.Collections.DocumentManifests;
})



export function QualityChecksPage(props){

  // let headerHeight = 84;
  // if(get(Meteor, 'settings.public.defaults.prominantHeader')){
  //   headerHeight = 148;
  // }


  // let [heightPage, setHeightPage] = useState(0);
  // let [weightPage, setWeightPage] = useState(0);
  
  let data = {
    chart: {
      width: Session.get('appWidth') * 0.5,  
      height: 400
    },
    organizations: {
      image: "/pages/provider-directory/organizations.jpg"
    },
    bmi: {
      height: 0,
      weight: 0
    },
    heightObservations: [],
    weightObservations: [],
    compositionsCount: 0,
    documentManifestsCount: 0,
    patientCount: 0
  };


  data.chart.width = useTracker(function(){
    return Session.get('appWidth') * 0.5;
  }, [])
  data.bmi.weight = useTracker(function(){
      let recentWeight = Observations.find({'code.text': 'Weight'}, {sort: {effectiveDateTime: 1}}).fetch()[0];
      return get(recentWeight, 'valueQuantity.value', null);
  }, []);
  data.bmi.height = useTracker(function(){
    let recentHeight = Observations.find({'code.text': 'Height'}, {sort: {effectiveDateTime: 1}}).fetch()[0];
    return get(recentHeight, 'valueQuantity.value', null);
  }, []);
  data.heightObservations = useTracker(function(){
    return Observations.find({'code.text': 'Height'}, {sort: {effectiveDateTime: 1}}).fetch();
  }, []);
  data.weightObservations = useTracker(function(){
    return Observations.find({'code.text': 'Weight'}, {sort: {effectiveDateTime: 1}}).fetch();
  }, []);
  data.compositionsCount = useTracker(function(){
    return Compositions.find().count();
  }, []);
  data.documentManifestsCount = useTracker(function(){
    // return DocumentManifests.find().count();
    return 0;
  }, []);
  data.patientCount = useTracker(function(){
    return Patients.find().count();
  }, []);



  function openLink(url){
    console.log("openLink", url);
    browserHistory.push(url);
  }
  function handleInitializeData(){
    // alert('Initialize!')
    Meteor.call('initializeBodyMassIndexData')
  }
  function handleCreateComposition(){
    // alert('Create composition!')

    Compositions._collection.insert({
      resourceType: "Composition"
    })
    // Meteor.call('initializeBodyMassIndexData')
  }
  function handleCreateDocumentManifest(){
    // alert('Create document manifest!')
    // Meteor.call('initializeBodyMassIndexData')
    DocumentManifests._collection.insert({
      resourceType: "DocumentManifests"
    })
  }


  let compositionElements;
  if(data.compositionsCount > 0){
    compositionElements = <Grid item sm={8} smOffset={4}>
      <CardHeader title="✔ Cover Page" subheader='Cover page is present.' style={{color: 'green'}} />
    </Grid>
  } else {
    compositionElements = <Grid item sm={8} smOffset={4}>
      <CardHeader title="✘ Cover Page not present" subheader='A .sphr file needs a Composition record, which works like a cover page.' style={{color: 'darkorange'}} />
    </Grid>
  }

  let documentManifestElements;
  if(data.documentManifestsCount > 0){
    documentManifestElements = <Grid item sm={8} smOffset={4}>
      <CardHeader title="✔ Document Manifest" subheader='Document Manifest and table of contents is present.' style={{color: 'green'}} />
    </Grid>
  } else {
    documentManifestElements = <Grid item sm={8} smOffset={4}>
      <CardHeader title="✘ Document Manifest not present" subheader='A .sphr file needs a Composition record, which works like a cover page.' style={{color: 'darkorange'}} />
    </Grid>
  }

  let securityElements;
  if(false){
    securityElements = <Grid item sm={8} smOffset={4}>
      <CardHeader title="✔ Signed and Notarized" subheader='A document manifest exists for the Personal Health Record.' style={{color: 'green'}} />
    </Grid>
  } else {
    securityElements = <Grid item sm={8} smOffset={4}>
      <CardHeader title="✘ Signature and Notarization not present" subheader='X.509 asymmetrical cryptography keys are recommended.' style={{color: 'red'}} />
    </Grid>
  }


  let advancedDirectiveElements;
  if(false){
    advancedDirectiveElements = <Grid item sm={8} smOffset={4}>
      <CardHeader title="✔ Health Record has Advanced Directives" subheader='A document manifest exists for the Personal Health Record.' style={{color: 'green'}} />
    </Grid>
  } else {
    advancedDirectiveElements = <Grid item sm={8} smOffset={4}>
      <CardHeader title="✘ Advanced Directives not present" subheader='X.509 asymmetrical cryptography keys are recommended.' style={{color: 'goldenrod'}} />
    </Grid>
  }


  let patientSummaryElements;
  if(false){
    patientSummaryElements = <Grid item sm={8} smOffset={4}>
      <CardHeader title="✔ Patient Summary" subheader='The international patient summary contains core data needed for international travel.' style={{color: 'green'}} />
    </Grid>
  } else {
    patientSummaryElements = <Grid item sm={8} smOffset={4}>
      <CardHeader title="✘ Patient Summary not present" subheader='The international patient summary contains core data needed for international travel.' style={{color: 'goldenrod'}}  />
    </Grid>
  }


  let patientDemographicsElements;
  if(data.patientCount > 0){
    patientDemographicsElements = <Grid item sm={8} smOffset={4}>
      <CardHeader title="✔ Patient Demographics" subheader='The PHR has minimal demographics, including name and date of birth.' style={{color: 'green'}} />
    </Grid>
  } else {
    patientDemographicsElements = <Grid item sm={8} smOffset={4}>
      <CardHeader title="✘ Patient Demographics not present" subheader='The file does not contain a Patient resource.  Cannot find name or date of birth.' style={{color: 'red'}} />
    </Grid>
  }


  let patientIdElements;
  if(false){
    patientIdElements = <Grid item sm={8} smOffset={4}>
      <CardHeader title="✔ Patient Identifiers" subheader='All patient identifiers in the record are consistent.' style={{color: 'green'}} />
    </Grid>
  } else {
    patientIdElements = <Grid item sm={8} smOffset={4}>
      <CardHeader title="✘ Inconsistent patient identifiers" subheader='The file contains more than a single patient.' style={{color: 'darkorange'}} />
    </Grid>
  }


  let timestampElements;
  if(false){
    timestampElements = <Grid item sm={8} smOffset={4}>
      <CardHeader title="✔ Coherent Timestamps" subheader='All timestamps are valid and coherent.' style={{color: 'green'}} />
    </Grid>
  } else {
    timestampElements = <Grid item sm={8} smOffset={4}>
      <CardHeader title="✘ Incoherent timestamps" subheader='The file contains records with missing or incoherent timestamps.' style={{color: 'darkorange'}} />
    </Grid>
  }

  let noMarginsPaddingStyle = {marginTop: '0px', marginBottom: '0px', paddingTop: '0px', paddingBottom: '0px'}

  return (
      <div id='QualityChecksPage'>
        <Grid justify="center" container spacing={8} style={{marginTop: '0px', marginBottom: '0px'}}>            


          <Grid item xs={4} style={noMarginsPaddingStyle}>
            <Button 
              disabled={true}
              variant="contained"
              onClick={handleCreateDocumentManifest.bind(this)}
              style={{float: 'right', marginTop: '20px'}}
              >Add Demographics</Button>
          </Grid>
          <Grid item xs={8} style={noMarginsPaddingStyle}>
          { patientDemographicsElements }            
          </Grid>

          <Grid item xs={4} style={noMarginsPaddingStyle}>
            <Button 
              disabled={true}
              variant="contained"
              onClick={handleCreateDocumentManifest.bind(this)}
              style={{float: 'right', marginTop: '20px'}}
              >Encrypt Files</Button>
          </Grid>
          <Grid item xs={8} style={noMarginsPaddingStyle}>
          { securityElements }            
          </Grid>

          <Grid item xs={4} style={noMarginsPaddingStyle} >
            <Button 
              variant="contained"
              // color="primary"
              onClick={handleCreateComposition.bind(this)}
              style={{float: 'right', marginTop: '20px'}}
              >Create Composition</Button>
          </Grid>
          <Grid item xs={8} style={noMarginsPaddingStyle}>
          { compositionElements }
          </Grid>
          <Grid item xs={4} style={noMarginsPaddingStyle}>
            <Button 
              variant="contained"
              // color="primary"
              onClick={handleCreateDocumentManifest.bind(this)}
              style={{float: 'right', marginTop: '20px'}}
              >Create Document Manifest</Button>
          </Grid>
          <Grid item xs={8} style={noMarginsPaddingStyle}>
          { documentManifestElements }
          </Grid>


          <Grid item xs={4} style={noMarginsPaddingStyle}>
            <Button 
              disabled={true}
              variant="contained"
              onClick={handleCreateDocumentManifest.bind(this)}
              style={{float: 'right', marginTop: '20px'}}
              >Rewrite Patient IDs</Button>
          </Grid>
          <Grid item xs={8} style={noMarginsPaddingStyle}>
          { patientIdElements }            
          </Grid>

          <Grid item xs={4} style={noMarginsPaddingStyle}>
            <Button 
              disabled={true}
              variant="contained"
              onClick={handleCreateDocumentManifest.bind(this)}
              style={{float: 'right', marginTop: '20px'}}
              >Add Timestimes</Button>
          </Grid>
          <Grid item xs={8} style={noMarginsPaddingStyle}>
          { timestampElements }            
          </Grid>

          <Grid item xs={4} style={noMarginsPaddingStyle}>
            <Button 
              disabled={true}
              variant="contained"
              onClick={handleCreateDocumentManifest.bind(this)}
              style={{float: 'right', marginTop: '20px'}}
              >Add Power of Attorney and Will</Button>
          </Grid>
          <Grid item xs={8} style={noMarginsPaddingStyle}>
          { patientSummaryElements }
          </Grid>
          <Grid item xs={4} style={noMarginsPaddingStyle}>
            <Button 
              disabled={true}
              variant="contained"
              onClick={handleCreateDocumentManifest.bind(this)}
              style={{float: 'right', marginTop: '20px'}}
              >Add Power of Attorney and Will</Button>
          </Grid>
          <Grid item xs={8} style={noMarginsPaddingStyle}>
          { advancedDirectiveElements }
          </Grid>


        </Grid>        
        <DynamicSpacer />
        <DynamicSpacer />
      </div>
  );
}

export default QualityChecksPage;
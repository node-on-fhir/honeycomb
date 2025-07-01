import React, { useState, useEffect, StrictMode } from 'react';
import { useTracker } from 'meteor/react-meteor-data';

import { get, set, has, concat, pullAt } from 'lodash';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { Alert, Button, Grid, Box, MenuItem, Select, Card, CardMedia, CardHeader, CardContent, CardActions, Typography } from '@mui/material';


import "ace-builds";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";

import { GPTTokens } from 'gpt-tokens';

import { useLocation, useNavigate } from "react-router-dom";

import PractitionersTable from './PractitionersTable';


//====================================================================================
// Session Variables

Session.setDefault('foo', 'bar');


//====================================================================================
// Shared Components

let DynamicSpacer;
let useTheme;
let FhirUtilities;
let LayoutHelpers;

let ConditionsTable;
let PersonsTable;

Meteor.startup(function(){
  DynamicSpacer = Meteor.DynamicSpacer;
  FhirUtilities = Meteor.FhirUtilities;
  LayoutHelpers = Meteor.LayoutHelpers;
  useTheme = Meteor.useTheme;

  PersonsTable = Meteor.Tables.PersonsTable;
})


//====================================================================================
// Data Cursors



let AllergyIntolerances;
let CarePlans;
let CareTeams;
let Consents;
let Compositions;
let Conditions;
let Devices;
let Encounters;
let Immunizations;
let Locations;
let Medications;
let MedicationRequests;
let Observations;
let Procedures;
let Patients;
let Questionnaires;
let QuestionnaireResponses;

Meteor.startup(async function(){
  AllergyIntolerances = Meteor.Collections.AllergyIntolerances;
  CarePlans = Meteor.Collections.CarePlans;
  CareTeams = Meteor.Collections.CareTeams;
  Consents = Meteor.Collections.Consents;
  Compositions = Meteor.Collections.Compositions;
  Conditions = Meteor.Collections.Conditions;
  Encounters = Meteor.Collections.Encounters;
  Immunizations = Meteor.Collections.Immunizations;
  Locations = Meteor.Collections.Locations;
  Medications = Meteor.Collections.Medications;
  MedicationRequests = Meteor.Collections.MedicationRequests;
  Observations = Meteor.Collections.Observations;
  Patients = Meteor.Collections.Patients;
  Procedures = Meteor.Collections.Procedures;
  Questionnaires = Meteor.Collections.Questionnaires;
  QuestionnaireResponses = Meteor.Collections.QuestionnaireResponses;
})

//====================================================================================
// Main Function  

function LeaderboardPage(props){
  const navigate = useNavigate();
  const { mode, toggleTheme } = useTheme();
  
  let searchParams = new URLSearchParams(window.location.search);

  let headerHeight = 84;
  if(get(Meteor, 'settings.public.defaults.prominantHeader')){
    headerHeight = 148;
  }  
  let isMobile = false
  if(window.innerWidth < 920){
      isMobile = true;
  }


  //----------------------------------------------------------------------
  // State Variables

  let [practitionersPage, setPersonsPage] = useState(0);
  let [practitioners, setPersons] = useState(true);

  let [selectedPipeline, setSelectedPipeline] = useState(searchParams.get('pipeline') ? parseInt(searchParams.get('pipeline')) : 1);
  let [globalPrompt, setGlobalPrompt] = useState("You are a helpful assistant. Your task is to read a clinical summary, and then answer a question about it.  Instructions for answering clinical questions:  Be brief and concise when possible.  Full sentance answers are not necessary.  You do not need to mention the patient in the answer; presume the reader knows you are talking about the patient.  If there is any mention of death or a death certificate, that may override answers to other questions, so include that information when appropriate.");

  let [editorText, setEditorText] = useState("");
  let [textNormalForm, setTextNormalForm] = useState("");
  let [llfFriendlyNdjsonString, setLlfFriendlyNdjsonString] = useState("");
  let [patientNarrative, setPatientNarrative] = useState("");

  let [openAiApiKey, setOpenAiApiKey] = useState("");
  let [relayUrl, setRelayUrl] = useState(get(Meteor, 'settings.public.interfaces.fhirServer.channel.endpoint', ""));
  let [showApiError, setShowApiError] = useState(false);
  let [summaryWordWrap, setSummaryWordWrap] = useState(false);

  let [clinicalSummaryTokens, setClinicalSummaryTokens] = useState(0);


  //----------------------------------------------------------------------
  // SMART on FHIR State Variables

  import jwt from 'jsonwebtoken';
  import moment from 'moment';

  let [serverCapabilityStatement, setServerCapabilityStatement] = useState("");
  let [wellKnownSmartConfig, setWellKnownSmartConfig] = useState("");
  let [smartAccessToken, setSmartAccessToken] = useState("");
  let [fhirPatient, setFhirPatient] = useState("");

  //----------------------------------------------------------------------
  // Data Trackers

  let data = {
    allergyIntolerances: [],
    careTeams: [],
    carePlans: [],
    conditions: [],
    consents: [],
    devices: [],
    encounters: [],
    immunizations: [],
    locations: [],
    medications: [],
    observations: [],
    procedures: [],
    selectedPatientId: '',
    selectedPatient: null,
    patients: [],
    questionnaires: [],
    questionnaireResponses: [],
    basicQuery: {}
  }

  data.selectedPatientId = useTracker(function(){
    return Session.get('selectedPatientId');
  }, []);
  data.selectedPatient = useTracker(function(){
      if(Session.get('selectedPatientId')){
          return Patients.findOne({id: Session.get('selectedPatientId')});
      } else if(get(Session.get('currentUser'), 'patientId')){
          return Patients.findOne({id: get(Session.get('currentUser'), 'patientId')});
      }   
  }, []);
  data.basicQuery = useTracker(function(){
    return FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'));
  }, []);


  let selectedPatient = useTracker(function(){
    return Session.get('selectedPatient');
  }, [])

  let innerWidth = useTracker(function(){
    return Session.get('innerWidth');
  }, [])

  useTracker(function(){
    setTextNormalForm(Session.get('textNormalForm'))
  }, [])

  useTracker(function(){

    setTextNormalForm(Session.get('textNormalForm'));    

    const usageInfo = new GPTTokens({
      model   : 'gpt-4',
      messages: [
          { 'role' :'system', 'content': 'You are a helpful, pattern-following assistant that translates corporate jargon into plain English.' },
          { 'role' :'user',   'content': Session.get('textNormalForm') },
      ]
    })
    console.info('Used tokens: ', usageInfo.usedTokens)
    setClinicalSummaryTokens(usageInfo.usedTokens);

  }, [])

  useTracker(function(){
    setOpenAiApiKey(Session.get('openAiApiKey'))
  }, [])

  useEffect(function(){
    setOpenAiApiKey(Session.get('openAiApiKey'));

    Meteor.call('fetchOpenAiApiKeyForIps', function(error, result){
      if(result){
        setOpenAiApiKey(result)
      }
    })

    console.log('LeaderboardPage.useEffect()', editorText)
    // QuestionnaireResponses._collection.insert(form8500Response, {filter: false, validate: false});


    // SmartOnFhir.fetchCapabilityStatement();
    fetchCapabilityStatement();

    Session.set('QuestionnaireResponsesPage.onePageLayout', false);
  }, [])


  
  //------------------------------------------------------------------------------------------------------
  // Data Cursors
  
  if(AllergyIntolerances){
    data.allergyIntolerances = useTracker(function(){
      return AllergyIntolerances.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
    }, [])    
  }
  if(CareTeams){
    data.careTeams = useTracker(function(){
      return CareTeams.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
    }, [])    
  }
  if(CarePlans){
      data.carePlans = useTracker(function(){
        return CarePlans.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
      }, [])    
  }
  if(Consents){
      data.consents = useTracker(function(){
        return Consents.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
      }, [])    
  }
  if(Conditions){
      data.practitioners = useTracker(function(){
        return Conditions.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
      }, [])    
  }
  if(Devices){
    data.devices = useTracker(function(){
        return Devices.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
    }, [])    
  }
  if(Encounters){
      data.encounters = useTracker(function(){
          return Encounters.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
      }, [])   
  }
  if(Immunizations){
      data.immunizations = useTracker(function(){
          return Immunizations.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
      }, [])   
  }
  if(Locations){
      data.locations = useTracker(function(){
          return Locations.find().fetch()
      }, [])   
  }
  if(Medications){
    data.medications = useTracker(function(){
        return Medications.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
    }, [])    
  }
  if(Procedures){
      data.procedures = useTracker(function(){
          return Procedures.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
      }, [])   
  }
  if(Observations){
      data.observations = useTracker(function(){
          return Observations.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
      }, [])   
  }

  if(Questionnaires){
      data.questionnaires = useTracker(function(){
          return Questionnaires.find().fetch()
      }, [])   
  }
  if(QuestionnaireResponses){
      data.questionnaireResponses = useTracker(function(){
          return QuestionnaireResponses.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
      }, [])   
  }

  //----------------------------------------------------------------------
  // Functions

  function openLink(url){
    console.log("openLink", url);

    if(typeof Package["symptomatic:data-importer"] === "object"){
      navigate(url, {replace: true});
    } else {
      // TODO:  load Daniel_Gaitan directly      
    }
  }

  async function fetchCapabilityStatement(){
    console.log('fetchCapabilityStatement');

    await fetch(get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', '') + "/metadata?_format=json", {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "Epic-Client-ID": get(Meteor, 'settings.public.smartOnFhir[0].client_id', ''),
      }
    }).then(response => response.json())
    .then(result => {
      console.log('fetch.get /metadata result', result)
      if(result){
        setServerCapabilityStatement(result);
        fetchWellKnownSmartConfig();
      } 
    }).catch((error) => {
      console.error('fetch.get /metadata error', error)
    });

  }
  async function fetchWellKnownSmartConfig(callback){
    console.log('fetchWellKnownSmartConfig');

    await fetch(get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', '') + "/.well-known/smart-configuration", {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(response => response.json())
    .then(async function(result){
      console.log('fetch.get /.well-known/smart-configuration result', result)
      setWellKnownSmartConfig(result);

      exchangeCodeForAccessToken(result);

    }).catch((error) => {
      console.error('fetch.get /.well-known/smart-configuration error', error)
    });
  }
  async function exchangeCodeForAccessToken(wellKnownSmartConfig){
    console.info('exchangeCodeForAccessToken')
    console.info('exchangeCodeForAccessToken.url', get(wellKnownSmartConfig, 'token_endpoint'))


    // Retrieve from Local Storage
    const codeVerifier = localStorage.getItem('pkce_code_verifier');

    // // OR Retrieve from Session Storage
    // const codeVerifier = sessionStorage.getItem('pkce_code_verifier');

    
    let payload = {
      code: encodeURIComponent(searchParams.get('code')),
      grant_type: encodeURIComponent('authorization_code'),
      redirect_uri: encodeURIComponent(get(Meteor, 'settings.public.smartOnFhir[0].redirect_uri', '')),
      client_id: encodeURIComponent(get(Meteor, 'settings.public.smartOnFhir[0].client_id', ''))
      // scope: encodeURIComponent(get(firstSmartConfig, 'scope', 'openid profile fhirUser'))
    }

    if(codeVerifier){
      payload.code_verifier = encodeURIComponent(codeVerifier)
    }

    console.info('exchangeCodeForAccessToken.code', searchParams.get('code'))
    console.info('exchangeCodeForAccessToken.payload', payload)
    
    const decodedCode = jwt.decode(searchParams.get('code'));
    console.info('exchangeCodeForAccessToken.decodedCode', decodedCode);

    // Convert to human-readable dates
    if(get(decodedCode, 'iat')){
      const issuedAtDate = moment.unix(decodedCode.iat).format('YYYY-MM-DD HH:mm:ss');
      console.log(`Issued At:  ${issuedAtDate}`);
    }

    const nowDate = moment().format('YYYY-MM-DD HH:mm:ss');
    console.log(`Now:        ${nowDate}`);

    if(get(decodedCode, 'exp')){
      const expirationDate = moment.unix(decodedCode.exp).format('YYYY-MM-DD HH:mm:ss');
      console.log(`Expiration: ${expirationDate}`);
    }


    // code_verifier
    // 47f39e65a70db0e5a707f8dc2e58ee938b598c23617ebe3fcce657b77a2ed6b0
  
    
    // code-challenge
    // CUbiZl2t0ZPNYsclnnfFARcMuMUbQ0Qbsom-dUgz4EA
    
    // let stringEncodedData = "grant_type=authorization_code&code=" + searchParams.get('code') + '&redirect_uri=' + encodeURIComponent(get(Meteor, 'settings.public.smartOnFhir[0].redirect_uri', '')) + '&client_id=' + encodeURIComponent(get(Meteor, 'settings.public.smartOnFhir[0].client_id', '')) + '&scope=' + encodeURIComponent(get(firstSmartConfig, 'scope', 'openid profile fhirUser'))
    let stringEncodedData = "grant_type=authorization_code&code=" + searchParams.get('code') + '&redirect_uri=' + encodeURIComponent(get(Meteor, 'settings.public.smartOnFhir[0].redirect_uri', '')) + '&client_id=' + encodeURIComponent(get(Meteor, 'settings.public.smartOnFhir[0].client_id', '')) + '&code_verifier=' + encodeURIComponent(codeVerifier) 
    console.info('exchangeCodeForAccessToken.stringEncodedData', stringEncodedData);


    // grant_type=authorization_code&code=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJ1cm46b2lkOjEuMi44NDAuMTE0MzUwLjEuMTMuMC4xLjcuMy42ODg4ODQuMTAwIiwiY2xpZW50X2lkIjoiZGI2ODNlZGYtOGM1Ny00MzIyLThlMmItZGZjMGM0YWM2MmY2IiwiZXBpYy5lY2kiOiJ1cm46ZXBpYzpPcGVuLkVwaWMtY3VycmVudCIsImVwaWMubWV0YWRhdGEiOiJfSGkteTFsQ051cVZhV3NZSEM2SU12UFI1aDEwZDdwV1hKUTZhR0YxbDdIcnotVVc1aDNRaU1va3pWQUJVVGdYN3NTbjF5dmtTb1ZqTTVNR3RPRTlIOEpXQkRCSFk0ZTQ2OEE4S2FpVFhaTnJhSHFGeFFQTF96Yk1md1p2NzJ2bSIsImVwaWMudG9rZW50eXBlIjoiY29kZSIsImV4cCI6MTcyNTExNTg4MywiaWF0IjoxNzI1MTE1NTgzLCJpc3MiOiJ1cm46b2lkOjEuMi44NDAuMTE0MzUwLjEuMTMuMC4xLjcuMy42ODg4ODQuMTAwIiwianRpIjoiOWY5ODg5ZTAtZWQ5NC00NjkxLWJlM2QtMTU1MzBjNGNkNzZiIiwibmJmIjoxNzI1MTE1NTgzLCJzdWIiOiJlYjRHaWE3RnlpanRQbVhrcnRqUnBQdzMifQ.VfyPMjE-9ekfgJiEUk6M5b0ChL7kDhZQfAePRgPbm_lkJPYtmMemGK_Or-YxTCa0to0OkEYj9WvObl4Nj0gicbNevEpgOh1lKrt0JhPeUINU6n28xYzR96g3HvY9YmC1L9vo10Qpza1qiHK_9TBU5B4UuRQSWLkT9skx8pvkAk-KrGpwKuh6bdcEFWcVHJ1lqqFJRPSJBo65XYODEZgn7GLNdYtzMKLooBMvypwmCkXDUD10HgooRScdOzvQYa1n5crnfrfVnSUxSH84-5EALL38MTBZGRZfgme8nrcsSDa_k31Ahvq3L9v2bmbQ0Tkz2TI8fQ-tv9qRpkx4xzJl9g&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcms-home-page&client_id=db683edf-8c57-4322-8e2b-dfc0c4ac62f6&scope=openid%20profile%20fhirUser



    // we don't want to generate failed authentication attempts from basic page renders
    if(searchParams.get('code')){


      // try {
      //   const response = await fetch(get(wellKnownSmartConfig, 'token_endpoint'), {
      //     method: 'POST',
      //     body: stringEncodedData,
      //     headers: {
      //       'Content-Type': 'application/x-www-form-urlencoded'
      //     },
      //     agent: httpsAgent // Use httpAgent if your endpoint is HTTP
      //   });
        
      //   const result = await response.json();
      
      //   if (response.ok) {
      //     console.log('Token exchange successful:', result);
      //     // Handle success
      //   } else {
      //     console.error('Token exchange failed:', result);
      //     // Handle error
      //   }
      // } catch (error) {
      //   console.error('Fetch error:', error);
      // }
      
      // okay, we have a code, let's try to exchange it for an access token
      await HTTP.post(get(wellKnownSmartConfig, 'token_endpoint'), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        content: stringEncodedData
        // content: new URLSearchParams(payload).toString()
      }, function(error, result){
        if(error){
          console.error('HTTP.post /token error', error)
        }
        if(result){
          console.log('HTTP.post /token result', result)
          setSmartAccessToken(get(result, 'data'));
  
          fetchPatient(get(result, 'data.patient'), get(result, 'data.access_token'));
        }
      });
    }
  }
  async function fetchPatient(patientId, accessToken){
    console.log('fetchPatient')
    console.log('fetchPatient.url', get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', '') + "/Patient")
    console.log('fetchPatient.url', accessToken)

    await fetch(get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', '') + "/Patient/" + patientId + "?_format=json", {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + accessToken
      }
    }).then(response => response.json())
    .then(async function(result){
      console.log('fetch.get /Patient result', result)
      if(result){
        if(typeof result === "object"){
          setFhirPatient(result);
  
          fetchPatientData(result, accessToken)
  
          Session.set('selectedPatientId', get(result, 'id'));
          Session.set('selectedPatient', result);
  
          if(!Patients.findOne({id: get(result, 'id')})){
            await Patients._collection.insertAsync(result);     
          }
        } else if (typeof result === "string") {
          setFhirPatient(JSON.parse(result));
  
          fetchPatientData(JSON.parse(result), accessToken)
  
          Session.set('selectedPatientId', get(JSON.parse(result), 'id'));
          Session.set('selectedPatient', JSON.parse(result));
  
          if(!Patients.findOne({id: get(JSON.parse(result), 'id')})){
            await Patients._collection.insertAsync(JSON.parse(result));     
            setLastUpdated(new Date());
          }
        }
      } else {
        console.log('no result return')
      }
      
    }).catch((error) => {
      console.error('fetch.get /Patient error', error)
    });

  }
  async function fetchPatientData(fhirPatient, accessToken) {
    console.log("---------------------------------------------------------------------")
    console.log("SMART ON FHIR");
    console.log("fhirPatient", fhirPatient);
  
    if(fhirPatient){
      //try {
  
      var httpHeaders = { headers: {
        'Accept': "application/json,application/fhir+json",
        "Authorization": "Bearer " + accessToken
      }}

      console.log('----------------------------  Condition  -------------------------------')

      const conditionQuery = new URLSearchParams();
      conditionQuery.set("patient", get(fhirPatient, 'id'));
      console.debug('Condition Query', conditionQuery);
  
      // without leading slash seems to work with Cerner, but not with Epic (?)
      let conditionUrl = '/Condition?' + conditionQuery.toString()
      console.debug('conditionUrl', conditionUrl);
  
      let conditionUrlAssembled = get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', '') + "/Condition?patient=" + get(fhirPatient, 'id');
      console.info('FaaPage.conditionUrlAssembled:    ', conditionUrlAssembled);
  
      if(conditionUrlAssembled){        

        console.debug('FaaPage.conditionUrlAssembled.httpHeaders:    ', httpHeaders);
        
        await fetch(conditionUrlAssembled, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': "application/json,application/fhir+json",
            "Authorization": "Bearer " + accessToken    
          }
        }).then(response => response.json())
        .then(async function(result){
          let parsedConditionBundle;
          
          if(typeof result === "string"){
            parsedConditionBundle = JSON.parse(result);
          } else if (typeof result === "object"){
            parsedConditionBundle = result;

            console.info('CmsPage.parsedConditionBundle', parsedConditionBundle);       
          
            if(parsedConditionBundle.resourceType === "Bundle"){
              parsedConditionBundle.entry.forEach(async function(entry){
                if(!Conditions.findOne({id: get(entry, 'resource.id')}) && get(entry, 'resource.resourceType') === 'Condition'){
                  await Conditions._collection.upsertAsync({id: get(entry, 'resource.id ')}, {$set: get(entry, 'resource')}, {validate: false, filter: false});     
                  setLastUpdated(new Date());
                }
              });
            }  
          }
        }).catch((error) => {
          console.error('fetch.get().conditionUrlAssembled.error', error);
        });
      }
        
  
      console.log('----------------------------  Encounter  -------------------------------')

      const encounterQuery = new URLSearchParams();
      encounterQuery.set("patient", get(fhirPatient, 'id'));
      // console.log('Encounter Query', encounterQuery);

      // without leading slash seems to work with Cerner, but not with Epic (?)
      // let encounterUrl = '/Encounter?' + encounterQuery.toString();
      // console.log('encounterUrl', encounterUrl);
  
      let encounterUrlAssembled = get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', '') + "/Encounter?patient=" + get(fhirPatient, 'id');
      console.info('FaaPage.encounterUrlAssembled:    ', encounterUrlAssembled);
  
      if(encounterUrlAssembled){        

        console.debug('FaaPage.encounterUrlAssembled.httpHeaders:    ', httpHeaders);
        
        await fetch(encounterUrlAssembled, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': "application/json,application/fhir+json",
            "Authorization": "Bearer " + accessToken    
          }
        }).then(response => response.json())
        .then(async function(result){
          let parsedEncounterBundle;
          if(typeof result === "string"){
            parsedEncounterBundle = JSON.parse(result);
          } else if (typeof result === "object"){
            parsedEncounterBundle = result;

            console.info('CmsPage.parsedEncounterBundle', parsedEncounterBundle);       
          
            if(parsedEncounterBundle.resourceType === "Bundle"){
              parsedEncounterBundle.entry.forEach(async function(entry){
                if(!Encounters.findOne({id: get(entry, 'resource.id')}) && get(entry, 'resource.resourceType') === 'Encounter'){
                  await Encounters._collection.upsertAsync({id: get(entry, 'resource.id ')}, {$set: get(entry, 'resource')}, {validate: false, filter: false});     
                  setLastUpdated(new Date());
                }
              });
            }  
          }          
        }).catch((error) => {
          console.error('fetch.get().encounterUrlAssembled.error', error)
        });
      }

        
  
  
      console.log('----------------------------  Immunization  -------------------------------')
        
      const immunizationQuery = new URLSearchParams();
      immunizationQuery.set("patient", get(fhirPatient, 'id'));
      // console.log('Immunization Query', immunizationQuery);
  
      // without leading slash seems to work with Cerner, but not with Epic (?)
      let immunizationUrl = '/Immunization?' + immunizationQuery
      // console.log('immunizationUrl', immunizationUrl);
  
      let immunizationUrlAssembled = get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', '') + "/Immunization?patient=" + get(fhirPatient, 'id');
      console.info('FaaPage.immunizationUrlAssembled:    ', immunizationUrlAssembled);
  
      if(immunizationUrlAssembled){        

        console.debug('FaaPage.immunizationUrlAssembled.httpHeaders:    ', httpHeaders);
        
        await fetch(immunizationUrlAssembled, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': "application/json,application/fhir+json",
            "Authorization": "Bearer " + accessToken    
          }
        }).then(response => response.json())
        .then(async function(result){

          let parsedImmunizationBundle;
          if(typeof result === "string"){
            parsedImmunizationBundle = JSON.parse(result);
          } else if (typeof result === "object"){
            parsedImmunizationBundle = result;

            console.info('FaaPage.parsedImmunizationBundle', parsedImmunizationBundle);       
          
            if(parsedImmunizationBundle.resourceType === "Bundle"){
              parsedImmunizationBundle.entry.forEach(async function(entry){
                if(!Immunizations.findOne({id: get(entry, 'resource.id')}) && get(entry, 'resource.resourceType') === 'Immunization'){
                  await Immunizations._collection.upsertAsync({id: get(entry, 'resource.id ')}, {$set: get(entry, 'resource')}, {validate: false, filter: false});     
                  setLastUpdated(new Date());
                }
              });
            }
          }          
        }).catch((error) => {
          console.error('fetch.get().encounterUrlAssembled.error', error)
        });
      }


          
      console.log('----------------------------  MedicationRequest  -------------------------------')

      const medicationRequestQuery = new URLSearchParams();
      medicationRequestQuery.set("patient", get(fhirPatient, 'id'));
      // console.log('MedicationRequest Query', medicationRequestQuery);

      // without leading slash seems to work with Cerner, but not with Epic (?)
      let medicationRequestUrl = '/MedicationRequest?' + medicationRequestQuery
      // console.log('medicationRequestUrl', medicationRequestUrl);
  

      let medicationRequestUrlAssembled = get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', '') + "/MedicationRequest?patient=" + get(fhirPatient, 'id');
      console.info('FaaPage.medicationRequestUrlAssembled:    ', medicationRequestUrlAssembled);
  
      if(medicationRequestUrlAssembled){        

        console.debug('FaaPage.medicationRequestUrlAssembled.httpHeaders:    ', httpHeaders); 
        
        await fetch(medicationRequestUrlAssembled, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': "application/json,application/fhir+json",
            "Authorization": "Bearer " + accessToken    
          }
        }).then(response => response.json())
        .then(async function(result){
          let parsedMedicationRequestBundle;
          if(typeof result === "string"){
            parsedMedicationRequestBundle = JSON.parse(result);
          } else if (typeof result === "object"){
            parsedMedicationRequestBundle = result;

            console.info('FaaPage.parsedMedicationRequestBundle', parsedMedicationRequestBundle);       
          
            if(parsedMedicationRequestBundle.resourceType === "Bundle"){
              parsedMedicationRequestBundle.entry.forEach(async function(entry){
                if(!MedicationRequests.findOne({id: get(entry, 'resource.id')}) && get(entry, 'resource.resourceType') === 'MedicationRequest'){
                  await MedicationRequests._collection.upsertAsync({id: get(entry, 'resource.id ')}, {$set: get(entry, 'resource')}, {validate: false, filter: false});     
                  setLastUpdated(new Date());
                }
              });
            }
          }          
        }).catch((error) => {
          console.error('fetch.get().medicationRequestUrlAssembled.error', error)
        });

      }

          
        console.log('----------------------------  Observation  -------------------------------')

  
          const observationQuery = new URLSearchParams();
  
          observationQuery.set("patient", get(fhirPatient, 'id'));
          observationQuery.set("category", "vital-signs");    
  
          // console.log('Vital Signs Query', observationQuery);
      
          // without leading slash seems to work with Cerner, but not with Epic (?)
          let vitalSignsUrl = '/Observation?' + observationQuery.toString();
          // console.log('vitalSignsUrl', vitalSignsUrl);
  
          // client.request(vitalSignsUrl, { pageLimit: 0, flat: true }).then(observations => {
          //   if(observations){
          //     // console.log('PatientAutoDashboard.observations.vital-signs', observations)
          //     observations.forEach(observation => {
          //       Observations._collection.upsert({id: observation.id}, {$set: observation}, {validate: false, filter: false});
          //     });
          //   }
          // });
  
          observationQuery.delete("category");    
          observationQuery.set("category", "laboratory");    
  
          // console.log('Vital Signs Query', observationQuery);
      
          // without leading slash seems to work with Cerner, but not with Epic (?)
          let laboratoryUrl = '/Observation?' + observationQuery.toString();
          // console.log('laboratoryUrl', laboratoryUrl);
  
          // client.request(laboratoryUrl, { pageLimit: 0, flat: true }).then(observations => {
          //   if(observations){
          //     // console.log('PatientAutoDashboard.observations.laboratory', observations)
          //     observations.forEach(observation => {
          //       Observations._collection.upsert({id: observation.id}, {$set: observation}, {validate: false, filter: false});
          //     });
          //   }
          // });
        
  
          console.log('----------------------------  Procedure  -------------------------------')

        
          const procedureQuery = new URLSearchParams();
          procedureQuery.set("patient", get(fhirPatient, 'id'));
          // console.log('Procedure Query', procedureQuery);
  
          // without leading slash seems to work with Cerner, but not with Epic (?)
          let procedureUrl = '/Procedure?' + procedureQuery
          // console.log('procedureUrl', procedureUrl);
  

          let procedureUrlAssembled = get(Meteor, 'settings.public.smartOnFhir[0].fhirServiceUrl', '') + "/Procedure?patient=" + get(fhirPatient, 'id');
          console.info('FaaPage.procedureUrlAssembled:    ', procedureUrlAssembled);
      
          if(procedureUrlAssembled){        
    
            console.debug('FaaPage.procedureUrlAssembled.httpHeaders:    ', httpHeaders);
            
            await fetch(procedureUrlAssembled, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Accept': "application/json,application/fhir+json",
                "Authorization": "Bearer " + accessToken    
              }
            }).then(response => response.json())
            .then(async function(result){
              let parsedProcedureBundle;
              if(typeof result === "string"){
                parsedProcedureBundle = JSON.parse(result);
              } else if (typeof result === "object"){
                parsedProcedureBundle = result;

                console.info('FaaPage.parsedProcedureBundle', parsedProcedureBundle);       
              
                if(parsedProcedureBundle.resourceType === "Bundle"){
                  parsedProcedureBundle.entry.forEach(async function(entry){
                    if(!Procedures.findOne({id: get(entry, 'resource.id')}) && get(entry, 'resource.resourceType') === 'Procedure'){
                      await Procedures._collection.upsertAsync({id: get(entry, 'resource.id ')}, {$set: get(entry, 'resource')}, {validate: false, filter: false});     
                      setLastUpdated(new Date());
                    }
                  });
                }  
              }              
            }).catch((error) => {
              console.error('fetch.get().procedureUrlAssembled.error', error)
            });
          }

      // } catch (error) {
      //     alert("We had an error fetching data.", error)
      // }
    }
  }


  //----------------------------------------------------------------------
  // Cards



  let practitionersContent = [];

  practitionersContent.push(<Card>
    <CardHeader title={"Leaderboard"} />
    <CardContent>
      <PractitionersTable
          practitioners={data.practitioners}
          hideCheckbox={true}
          hideActionIcons={true}
          hidePatientName={true}
          hidePatientReference={true}
          hideAsserterName={true}
          hideEvidence={true}
          hideBarcode={true}
          hideDates={false}
          hideTextIcon={true}
          count={data.practitioners.length}
          page={practitionersPage}
          rowsPerPage={5}
          onSetPage={function(newPage){
              setPersonsPage(newPage);
          }}
      />                                        
    </CardContent>
    <CardActions>
      <Button size="small" color={practitioners ? "primary" : "inherit"} onClick={function(){
        setPersons(!practitioners);
      }}>Include: {practitioners ? "YES" : "NO"} </Button>
      {/* <Button size="small" color="primary" onClick={function(){
        handleParseCollectionOfResources(Conditions.find().fetch())
      }}>Create text</Button> */}
    </CardActions>
  </Card>)   
  practitionersContent.push(<DynamicSpacer />)              


  //----------------------------------------------------------------------
  // Helper Functions







  //----------------------------------------------------------------------
  // Page Styling and Layout

  let containerStyle = {
    marginBottom: '84px', 
    paddingBottom: '84px'
  }

  let pageStyle = {};

  if(window.innerWidth < 800){
    pageStyle.padingLeft = '0px !important';
    pageStyle.paddingRight = '0px !important';
  } else {
    pageStyle.padingLeft = '100px';
    pageStyle.paddingRight = '100px';
  }

  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();

  let tokensUsed = 0;

  let relayOptions = [];
  let preprocessElements;
  let cardWidth = 4;
  let interfacesObject = get(Meteor, 'settings.public.interfaces');
  if(interfacesObject){
    Object.keys(interfacesObject).forEach(function(key, index){
      let interfaceKey = interfacesObject[key];
      if(has(interfaceKey, 'channel.endpoint') && (get(interfaceKey, 'status') === "active")){
        relayOptions.push(<MenuItem value={get(interfaceKey, 'channel.endpoint')} id={"relay-menu-item-" + index} key={"relay-menu-item-" + index} >{get(interfaceKey, 'name')}</MenuItem>)
      }
    });  
  } else {
    console.log('WARNING:  No interfaces defined!')
  }
  


  //----------------------------------------------------------------------
  // Page Content

  let patientChartContent;
  // if(data.selectedPatient == undefined || data.selectedPatient == null || data.selectedPatient == ""){
  //   patientChartContent = <Card style={{marginBottom: '120px', width: '100%'}}>
  //     <CardHeader title="No Patient Data Found" />         
  //     <CardContent>
  //       <Button fullWidth variant="contained" color="primary" onClick={openLink.bind(this, '/import-data?next=moonshot-patient-chart')}>Select Patient File</Button>
  //     </CardContent>     
  //   </Card> 
  // } else if(typeof data.selectedPatient == "object"){
    
    patientChartContent = <div style={{marginBottom: '120px'}}>    
      {practitionersContent}           
    </div>                
  // }

  let missingTextWarning = [];


  let nextPageElements;

  let nextUrl =  get(Meteor, 'settings.public.defaults.dataExporterNextPageUrl', '');
  if(searchParams.get('next')){
    nextUrl = "/" + searchParams.get('next');
  }

  if(searchParams.get('next')){
    nextPageElements = <div>
      <DynamicSpacer />
      <Button
        color="primary"
        variant="contained" 
        fullWidth
        onClick={openLink.bind(this, nextUrl)}
      >Next</Button> 
    </div>
  }

  //----------------------------------------------------------------------
  // Main Render Method  

  return (
    <div id='LeaderboardPage' style={{overflow: 'scroll', height: window.innerHeight, padding: '20px'}}>
        <Grid container spacing={3} justifyContent="center" style={{marginBottom: '80px'}}>
          <Grid item md={12} lg={8} style={{width: '100%'}}>
            
            <DynamicSpacer />
            { patientChartContent } 
          </Grid>
          { preprocessElements }   
        </Grid>
    </div>
  );
}

export default LeaderboardPage;
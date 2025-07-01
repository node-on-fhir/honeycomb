// EPIC ENDPOINTS
// https://open.epic.com/Endpoints/R4

// CERNER ENDPOINTS - PATIENT LAUNCH
// https://github.com/oracle-samples/ignite-endpoints/blob/main/millennium_patient_r4_endpoints.json

// CERNER ENDPOINTS - PROVIDER LAUNCH
// https://github.com/oracle-samples/ignite-endpoints/blob/main/millennium_provider_r4_endpoints.json



import React, { useState, useEffect } from 'react';
import { Random } from 'meteor/random'

import { useFormik, FormikErrors } from 'formik';

import { 
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardHeader,
  CardContent,
  CardMedia,
  Container,
  Grid,  
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Image,
  Typography,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputAdornment,
  Input,
  InputLabel,
  IconButton
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import ClassIcon from '@mui/icons-material/Class';
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';
import LocalPlayIcon from '@mui/icons-material/LocalPlay';
import LocationOnIcon from '@mui/icons-material/LocationOn';

import { get, has } from 'lodash';

import { useTracker } from 'meteor/react-meteor-data';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import jwt from 'jsonwebtoken';

import { Icon } from 'react-icons-kit';
import { home } from 'react-icons-kit/icomoon/home';
import {ic_vpn_key} from 'react-icons-kit/md/ic_vpn_key';

import {keyOutline} from 'react-icons-kit/typicons/keyOutline'
import {key} from 'react-icons-kit/typicons/key'

import "ace-builds";
import 'ace-builds/src-noconflict/mode-json'

import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";

import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/theme-monokai";


import { fetch, Headers } from 'meteor/fetch';

import forge from 'node-forge';

let pki = forge.pki;

import { Endpoints } from '../lib/schemas/SimpleSchemas/Endpoints';
import { SubscriptionsTable } from './SubscriptionsTable';

import { useNavigate } from "react-router-dom";


//----------------------------------------------------------------------
// Helper Components

let DynamicSpacer;
let useTheme;
Meteor.startup(function(){
  DynamicSpacer = Meteor.DynamicSpacer;
  useTheme = Meteor.useTheme;
})


function ServerConfigurationPage(props){
  
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  let [ wellKnownUdapUrl, setWellKnownUdapUrl ] = useState(Meteor.absoluteUrl() + ".well-known/udap");
  let [ certificate, setCertificate ] = useState([]);
  let [ publicKey, setPublicKey ] = useState("");
  let [ privateKey, setPrivateKey ] = useState("");
  let [ serverHasPublicKey, setServerHasPublicKey] = useState(false);
  let [ serverHasPrivateKey, setServerHasPrivateKey] = useState(false);
  let [ serverHasPublicCert, setServerHasPublicCert] = useState(false);

  let [ publicKeyText, setPublicKeyText ] = useState("");
  let [ privateKeyText, setPrivateKeyText ] = useState("");
  let [ publicCertPem, setPublicCertPem ] = useState("");

  let [checked, setChecked] = React.useState(true);
  let [defaultDirectoryQuery, setDefaultDirectoryQuery] = React.useState(get(Meteor, 'settings.public.interfaces.upstreamDirectory.channel.path', ""));
  
  let handleChange = (event) => {
    setChecked(event.target.checked);
  };

  let serverConfigComponents = []
  Object.keys(Package).forEach(function(packageName){
    if(Package[packageName].ServerConfigs){
      Package[packageName].ServerConfigs.forEach(function(component){
        serverConfigComponents.push(component);      
      });    
    }
  });

  useEffect(function(){
    if(Meteor.isClient){
      Meteor.call('hasServerKeys', function(error, result){
        if(result){
          // console.log('.ServerConfigurationPage.useEffect', result);
          setServerHasPublicKey(get(result, 'x509.publicKey'));
          setServerHasPrivateKey(get(result, 'x509.privateKey'));
          setServerHasPublicCert(get(result, 'x509.publicCertPem'))
          setPublicKeyText(get(result, 'x509.publicKey'))
          setPublicCertPem(get(result, 'x509.publicCertPem'))
        }
      })  
    }    


  }, []);

  let currentUser = useTracker(function(){
    return Session.get('currentUser');
  }, []);

  let subscriptionChannelResourceType = useTracker(function(){
    return Session.get('SubscriptionChannelResourceType');
  }, []);

  defaultDirectoryQuery = useTracker(function(){
    return Session.get('MainSearch.defaultDirectoryQuery');
  }, []);

  function openExternalPage(url){
    logger.debug('client.app.layout.ServerConfigurationPage.openExternalPage', url);
    window.open(url);
    // navigate(url, { replace: true });
  }


  //----------------------------------------------------------------------
  // Main Render Method  

  

  let tagLineStyle = {
    fontWeight: 'normal',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: '0px',
    marginBottom: '40px'
  }

  let featureRowStyle = {
    height: '52px'
  }

  function openPage(url){
    navigate(url, { replace: true });
  }

  function handelUpdateWellKnownUdapUrl(event){
    setWellKnownUdapUrl(event.currentTarget.value)
  }
  async function handleFetchWellknownUdap(){
    console.log('wellKnownUdapUrl', wellKnownUdapUrl);

    // HTTP.get(wellKnownUdapUrl, function(error, result){
    //   if(error){
    //     console.log('handleFetchWellknownUdap.error', error)
    //   }
    //   if(result){
    //     console.log('handleFetchWellknownUdap.result.data', get(result, 'data'))

    //     alert(result.data.x5c[0]);
        
    //     if(Array.isArray(get(result, 'data.x5c'))){
    //       console.log('x.509 cert: ' + result.data.x5c[0]);
    //       setCertificate(result.data.x5c);          
    //     }
        
    //   }
    // })

    await fetch(wellKnownUdapUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(response => response.json())
    .then(result => {
      console.log('Success:', result);
      
      console.log('handleFetchWellknownUdap.result.data', get(result, 'data'))

      alert(result.data.x5c[0]);
      
      if(Array.isArray(get(result, 'data.x5c'))){
        console.log('x.509 cert: ' + result.data.x5c[0]);
        setCertificate(result.data.x5c);          
      }
    }).catch((error) => {
      console.error('Error:', error);
    });
  }
  function generateKeys(){
    let keys = pki.rsa.generateKeyPair(2048);
    console.log('keys', keys)

    var publicKeyText = pki.publicKeyToPem(keys.publicKey);
    console.log('publicKeyText', JSON.stringify(publicKeyText))

    setPublicKeyText(JSON.stringify(publicKeyText))

    var privateKeyText = pki.privateKeyToPem(keys.privateKey);
    console.log('privateKeyText', JSON.stringify(privateKeyText));

    setPrivateKeyText(JSON.stringify(privateKeyText))
  }
  function handleGenerateCert(){
    console.log("Generating certificate...");

    Meteor.call('generateCertificate', function(error, certificatePem){
      if(error){
        console.error('error', error)
      }
      if(certificatePem){
        console.log('certificatePem', certificatePem)

        setPublicCertPem(certificatePem)
      }
    })
  }
  function handleSyncLantern(){
    console.log("Syncing lantern...")

    Meteor.call('syncLantern', function(error, result){
      if(error){
        console.error('error', error)
      }
      if(result){
        console.log('result', result)
      }
    })
  }
  function handleSyncProviderDirectory(){
    console.log("Syncing provider directory...")

    Meteor.call('syncProviderDirectory', function(error, result){
      if(error){
        console.error('error', error)
      }
      if(result){
        console.log('result', result)
      }
    })
  }
  function fetchTefcaEndpoints(){
    console.log('fetchTefcaEndpoints'); 

    
    Meteor.call('syncTefcaEndpoints', function(error, result){
      if(error){
        console.error('error', error)
      }
      if(result){
        console.log('result', result)
      }
    });

  }
  function handleSyncUpstreamDirectory(){
    console.log("Syncing upstream directory...");

    let options = {};

    Session.get('SubscriptionChannelResourceType');

    if(Session.get('SubscriptionChannelResourceType')){
      options.resourceType = Session.get('SubscriptionChannelResourceType');
    }

    console.log('options', options)

    Meteor.call('syncUpstreamDirectory', options, function(error, result){
      if(error){
        console.error('error', error)
      }
      if(result){
        console.log('result', result)
      }
    })
  }
  function initCodeSystems(){
    console.log("Initializing code systems...");

    Meteor.call('initCodeSystems', function(error, result){
      if(error){
        console.error('error', error)
      }
      if(result){
        console.log('result', result)
      }
    })
  }
  function initUsCore(){
    console.log("Initializing US Core...");

    Meteor.call('initUsCore', function(error, result){
      if(error){
        console.error('error', error)
      }
      if(result){
        console.log('result', result)
      }
    })
  }
  function initSearchParameters(){
    console.log("Initializing search parameters...");

    Meteor.call('initSearchParameters', function(error, result){
      if(error){
        console.error('error', error)
      }
      if(result){
        console.log('result', result)
      }
    })
  }
  function initStructureDefinitions(){
    console.log("Initializing structure definitions...");

    Meteor.call('initStructureDefinitions', function(error, result){
      if(error){
        console.error('error', error)
      }
      if(result){
        console.log('result', result)
      }
    })
  }
  function initValueSets(){
    console.log("Initializing value sets...");

    Meteor.call('initValueSets', function(error, result){
      if(error){
        console.error('error', error)
      }
      if(result){
        console.log('result', result)
      }
    })
  }

  function fetchDefaultQuery(){
    
    let upstreamDirectory = get(Meteor, 'settings.public.interfaces.upstreamDirectory.channel.endpoint', '');
    console.log('------------------------------------------');
    console.log('Fetch Default Query');
    console.log('');
    console.log('FHIR Server Base: ', upstreamDirectory);    
    console.log('Default Query:    ', defaultDirectoryQuery);
    console.log('');

    Meteor.call('fetchDefaultDirectoryQuery', function(error, result){
      if(error){
        alert(error.message)
      }
      if(result){
        console.log('result', result);
      }
    })
  }

  

  function handleOpenResourceTypes(){
    Session.set('mainAppDialogTitle', "Select Resource Types");
    Session.set('mainAppDialogComponent', "SearchResourceTypesDialog");
    Session.set('lastUpdated', new Date());
    Session.set('mainAppDialogMaxWidth', "md");
    Session.set('mainAppDialogOpen', true);
  }

  // let headerHeight = LayoutHelpers.calcHeaderHeight();
  // let formFactor = LayoutHelpers.determineFormFactor();
  // let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();

  let serverPublicKeyElems = [];
  if(serverHasPublicKey){
    serverPublicKeyElems.push(<Card margin={20} style={{width: '100%', fontSize: '80%'}}  >      
      <CardHeader avatar={<Icon icon={key} size={32} />} title="Public Key Configured!" />    
      <CardContent>
        <TextField
          fullWidth={true}
          id="publicKey"
          type="publicKey"
          value={publicKeyText}
          style={{marginBottom: '10px'}}
          multiline
          InputProps={{
            style: {
              fontSize: '120%',
              fontFamily: 'monospace'
            },
            disableUnderline: true
          }}
          disabled
        />
      </CardContent>
    </Card>);
    serverPublicKeyElems.push(<DynamicSpacer />);
  }

  let serverPublicCertElems =[];
  if(serverHasPublicCert){
    serverPublicCertElems.push(<Card margin={20} style={{width: '100%', fontSize: '80%'}}  >      
      <CardHeader avatar={<Icon icon={key} size={32} />} title="Public Cert Available!" />    
      <CardContent>
        <TextField
          fullWidth={true}
          id="publicCert"
          type="publicCert"
          value={publicCertPem}
          style={{marginBottom: '10px'}}
          multiline
          InputProps={{
            style: {
              fontSize: '120%',
              fontFamily: 'monospace'
            },
            disableUnderline: true
          }}
          disabled
        />
      </CardContent>
    </Card>);
    serverPublicCertElems.push(<DynamicSpacer />);
  }

  let serverPrivateKeyElems = [];
  if(serverHasPrivateKey){
    serverPrivateKeyElems.push(<Card key={Random.id()} margin={20} style={{width: '100%', fontSize: '80%'}}  >
      <CardHeader avatar={<Icon icon={keyOutline} size={32} />} title="Private Key Configured!" />    
    </Card>)
    serverPrivateKeyElems.push(<DynamicSpacer key={Random.id()} />);
  }


  let smartOnFhirElems = [];
  // if(get(Meteor, 'settings.public.interfaces.smartOnFhir')){
  smartOnFhirElems.push(<Card key={Random.id()} margin={20} style={{width: '100%', fontSize: '80%'}}  >
    <CardHeader title="SMART on FHIR" subheader="This server is configured to support SMART on FHIR applications." />
    <CardContent>
      <AceEditor
        mode="json"
        theme={theme === 'light' ? "tomorrow" : "monokai"}
        wrapEnabled={false}
        // onChange={onUpdateLlmFriendlyNdjsonString}
        name="synthesisEditor"
        editorProps={{ $blockScrolling: true }}
        value={JSON.stringify(get(Meteor, 'settings.public.smartOnFhir'), null, 2)}
        style={{width: '100%', position: 'relative', height: '300px', minHeight: '300px', borderColor: '#ccc', borderRadius: '4px', lineHeight: '16px'}}        
      /> 
      <Button
        variant="contained"
        color="primary"
        style={{marginTop: '10px', marginRight: '20px'}}
        onClick={openExternalPage.bind(this, Meteor.absoluteUrl() + ".well-known/smart-configuration")}
      >View .well-known/smart-configuration</Button>
      <Button
        variant="contained"
        color="primary"
        style={{marginTop: '10px'}}
        onClick={openExternalPage.bind(this, "https://launch.smarthealthit.org/")}
      >SMART Launcher</Button>
    </CardContent>
  </Card>)
  smartOnFhirElems.push(<DynamicSpacer key={Random.id()} />);

  // }

  let generateKeyElems = [];
  if(!serverHasPublicKey && !serverHasPrivateKey){
    generateKeyElems.push(<Card key={Random.id()} margin={20} style={{width: '100%', fontSize: '80%'}}  >
      <CardHeader title="Generate Keys" subheader="No X.509 keys were detected on the server. You will want to generate keys and then copy them to the Meteor settings file.  Be sure to include the /n newline characters!" />
      <CardContent >
        <TextField
          label="Public Key"
          fullWidth={true}
          id="publicKey"
          type="publicKey"
          value={publicKeyText}
          style={{marginBottom: '10px'}}
          multiline
          InputProps={{
            style: {
              fontSize: '120%',
              fontFamily: 'monospace'
            }
          }}
        />
        <TextField
          label="Private Key"
          fullWidth={true}
          id="privateKey"
          type="privateKey"
          value={privateKeyText}
          style={{marginBottom: '10px'}}
          multiline
          InputProps={{
            style: {
              fontSize: '120%',
              fontFamily: 'monospace'
            }
          }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={generateKeys.bind(this)}
        >Generate Keys</Button>
      </CardContent>
    </Card>)
    generateKeyElems.push(<DynamicSpacer key={Random.id()} />);    
  }

  let generateCertButton;
  let generateCertElems = [];
  let initSampleDataElements;
  let isDisabled = true;

  
  if(!serverHasPublicCert){
    generateCertButton = <Button
      variant="contained"
      color="primary"
      onClick={handleGenerateCert.bind(this)}
      // disabled={currentUser ? false : true}
    >Generate Cert</Button>
  } 

  generateCertElems.push(<Card key={Random.id()} margin={20} style={{width: '100%', fontSize: '80%'}}  >
    <CardHeader title="Generate Cert" subheader="No X.509 certificates were detected on the server. You will want to generate the certificate and then copy it to the Meteor settings file. " />
    <CardContent >
      <TextField
        label="Public Cert"
        fullWidth={true}
        id="publicCert"
        type="publicCert"
        value={JSON.stringify(publicCertPem)}
        style={{marginBottom: '10px'}}
        multiline
        InputProps={{
          style: {
            fontSize: '120%',
            fontFamily: 'monospace'
          }
        }}
        disabled={currentUser ? false : true}
      />
      { generateCertButton }          
    </CardContent>
  </Card>)
  generateCertElems.push(<DynamicSpacer key={Random.id()} />)
  

  if(currentUser){
    isDisabled = false;
  
    initSampleDataElements = <Card key={Random.id()} margin={20} style={{marginBottom: '20px', width: '100%'}}>
      <CardContent>        
        <Button
          variant="contained"
          fullWidth
          onClick={ initUsCore.bind(this) }
        >Init US Core</Button>
        <br />
        <Button
          variant="contained"
          fullWidth
          onClick={ initCodeSystems.bind(this) }
        >Init Code Systems</Button>
        <br />
        <Button
          variant="contained"
          fullWidth
          onClick={ initSearchParameters.bind(this) }
        >Init Search Parameters</Button>
        <br />
        <Button
          variant="contained"
          fullWidth
          onClick={ initStructureDefinitions.bind(this) }
        >Init Structure Definitions</Button>
        <br />
        <Button
          variant="contained"
          fullWidth
          onClick={ initValueSets.bind(this) }
        >Init Value Sets</Button>
        <br />
        <Button
          variant="contained"
          fullWidth
          onClick={ handleSyncLantern.bind(this) }
        >Sync Lantern</Button>
        <br />
        <Button
          variant="contained"
          fullWidth
          onClick={ handleSyncProviderDirectory.bind(this) }
        >Sync Provider Directory</Button>
        
      </CardContent>
    </Card>
  }


  let upstreamServerSyncButton = <Button

    variant="contained"
    fullWidth
    onClick={ handleSyncUpstreamDirectory.bind(this) }
    disabled={isDisabled}
  >Subscribe to Upstream Directory</Button>

  let fetchDefaultDirectoryQueryButton = <Button variant="contained" fullWidth onClick={fetchDefaultQuery.bind(this)} disabled={isDisabled}>Fetch Default Query</Button>

  let tefcaEndpoints = get(Meteor, 'settings.public.interfaces.tefcaEndpoints', [
      "https://open.epic.com/Endpoints/R4",
      "https://raw.githubusercontent.com/oracle-samples/ignite-endpoints/main/millennium_patient_r4_endpoints.json",
      "https://raw.githubusercontent.com/oracle-samples/ignite-endpoints/main/millennium_provider_r4_endpoints.json"
  ])
  let tefcaEndpointsElements = []
  tefcaEndpointsElements.push(<Card key={Random.id()} margin={20} style={{width: '100%'}}  >
    <CardHeader title="Sync TEFCA Endpoints" />
    <CardContent>
          
      <Grid container spacing={3} justify="center" style={{paddingTop: '20px'}}>
        <Grid item xs={12}>
            <TextField
              label="Endpoints Found"
              fullWidth={true}
              id="upstreamDirectory"
              type="upstreamDirectory"
              // value={Endpoints.find().count()}
              value={0}
              style={{marginBottom: '10px'}}
              disabled={true}
            />      
            <TextField
              label="Upstream Directory"
              fullWidth={true}
              id="upstreamDirectory"
              type="upstreamDirectory"
              multiline={true}
              value={tefcaEndpoints.join("\n")}
              style={{marginBottom: '10px'}}
              disabled={true}
            />                                  
        </Grid>
      </Grid>

      <Button variant="contained" fullWidth onClick={fetchTefcaEndpoints.bind(this)} >Fetch TEFCA Endpoints</Button>
      <br />
    </CardContent>
  </Card>)
  tefcaEndpointsElements.push(<DynamicSpacer key={Random.id()} />);

  let upstreamServer = get(Meteor, 'settings.public.interfaces.upstreamDirectory.channel.endpoint', '')
  let upstreamServerElements = [];
  upstreamServerElements.push(<Card key={Random.id()} margin={20} style={{width: '100%'}}  >
    <CardHeader title="Upstream Directory" />
    <CardContent>
          
      <Grid container spacing={3} justify="center" style={{paddingTop: '20px'}}>
        <Grid item xs={12} >
            <TextField
              label="Upstream Directory"
              fullWidth={true}
              id="upstreamDirectory"
              type="upstreamDirectory"
              value={upstreamServer}
              style={{marginBottom: '10px'}}
              disabled={isDisabled}
            />         
            <TextField
              label="Default Query"
              fullWidth={true}
              id="defaultDirectoryQuery"
              type="defaultDirectoryQuery"
              value={defaultDirectoryQuery}
              style={{marginBottom: '10px'}}
              disabled={isDisabled}
            />              
        </Grid>
      </Grid>

      { fetchDefaultDirectoryQueryButton }
      <br />
    </CardContent>
  </Card>);
  upstreamServerElements.push(<DynamicSpacer key={Random.id()} />);

  let subscribeUpstreamCard = [];
  subscribeUpstreamCard.push(<Card key={Random.id()}>
    <CardHeader title="Subscribe Upstream" />
    <CardContent>
      <Grid container>
            <Grid item xs={12}>
              <FormControl style={{width: '100%', marginTop: '40px', marginBottom: '0px'}}>
                <InputLabel shrink={true} >Resource Type</InputLabel>
                <Input
                  id="resourceType"
                  name="resourceType"
                  // className={classes.input}   
                  value={subscriptionChannelResourceType}
                  // value={FhirUtilities.pluckCodeableConcept(get(activeHealthcareService, 'type[0]'))}
                  // onChange={updateField.bind(this, 'type[0].text')}
                  fullWidth    
                  type="text"
                  placeholder="Organization"
                  disabled={isDisabled}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle type select"
                        onClick={ handleOpenResourceTypes.bind(this) }
                      >
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  }           
                />
              </FormControl>  
            </Grid>
          </Grid>

          <Grid container spacing={3} justify="center" style={{paddingTop: '00px'}}>
            <Grid item xs={12} style={{paddingTop: '20px', paddingBottom: '20px'}}>
              <FormControlLabel
                control={<Checkbox checked={true} onChange={handleChange} />}
                label="Realtime"
                disabled={isDisabled}
              />
              <FormControlLabel
                control={<Checkbox checked={false} onChange={handleChange} />}
                label="Daily"
                disabled={true}
                // disabled={isDisabled}
              />
              <FormControlLabel
                control={<Checkbox checked={false} onChange={handleChange} />}
                label="Weekly"
                disabled={true}
                // disabled={isDisabled}
              />
              <FormControlLabel
                control={<Checkbox checked={false} onChange={handleChange} />}
                label="Monthly"
                disabled={true}
                // disabled={isDisabled}
              />
              <FormControlLabel
                control={<Checkbox checked={false} onChange={handleChange} />}
                label="Last Updated"
                disabled={true}
                // disabled={isDisabled}
              />
            </Grid>
          </Grid>


          <br height={40} />

          { upstreamServerSyncButton }
    </CardContent>
  </Card>);
  subscribeUpstreamCard.push(<DynamicSpacer key={Random.id()} />);

  let subscriptionsCard = <Card key={Random.id()} style={{marginBottom: '20px'}}>
      <CardHeader title="Subscriptions" />
      <CardContent>
        SubscriptionsTable disabled...
        {/* <SubscriptionsTable
            hideContact={true}
            hideEnd={true}
        /> */}
      </CardContent>
    </Card>




  return (
    <div id='ServerConfigurationPage' style={{'height': window.innerHeight, 'overflow': "auto", paddingBottom: '128px', paddingTop: '20px'}} >
      
      <Container maxWidth="lg" style={{paddingBottom: '80px'}}>
        <Grid container spacing={3} justify="center" style={{marginBottom: '20px'}}>
          <Grid item xs={10} sm={10}>
            { serverPrivateKeyElems }
            { serverPublicKeyElems }
            { serverPublicCertElems }
            { generateKeyElems }
            { generateCertElems }
            { smartOnFhirElems }
            { upstreamServerElements }
            { subscribeUpstreamCard }
            { subscriptionsCard }
            { tefcaEndpointsElements }
            { initSampleDataElements }
            { serverConfigComponents }
          </Grid>
        </Grid>
      </Container>

    </div>
  );
}

export default ServerConfigurationPage;
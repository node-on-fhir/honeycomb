// import './ServerSideRendering.js';
// import './AccountsServer.js';
// import './SmartHealthCards.js';
// import './ProxyMethods.js';
// import './ProxyHttpRelay.js';

// import './WebsocketPublications.js';
// import './HipaaLogging.js';

// need to upgrade mongoose, mongo, and the kerberose dependency
// then we can re-enable
// import './FhirSchemaImporter.js';

import './Cron.js';
import './ConsentEngineMethods.js';
import './ConsentEngineHttp.js';
import './CdsHooksEndpoints.js';
import './Methods.js';
import './Metadata.js';
import './RestEndpoints.js';
import './FhirEndpoints.js';
import './OAuthEndpoints.js';
import './ProxyRelay.js';
import './VaultServer.js';
import '../imports/lib/UdapMethods.js';




import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { WebApp } from 'meteor/webapp';
import { get } from 'lodash';

import mongoose from 'mongoose';
import { Mongo } from '@accounts/mongo';
import { AccountsServer } from '@accounts/server';

import { LinksCollection } from '/imports/collections/LinksCollection';
import { OAuthClients } from '/imports/collections/OAuthClients';


//===============================================================================================================
// Data Cursors



import { AllergyIntolerances } from '../imports/lib/schemas/SimpleSchemas/AllergyIntolerances';
import { Bundles } from '../imports/lib/schemas/SimpleSchemas/Bundles';
import { CarePlans } from '../imports/lib/schemas/SimpleSchemas/CarePlans';
import { Claims } from '../imports/lib/schemas/SimpleSchemas/Claims';
import { Conditions } from '../imports/lib/schemas/SimpleSchemas/Conditions';
import { Communications } from '../imports/lib/schemas/SimpleSchemas/Communications';
import { CommunicationRequests } from '../imports/lib/schemas/SimpleSchemas/CommunicationRequests';
import { Compositions } from '../imports/lib/schemas/SimpleSchemas/Compositions';
import { Devices } from '../imports/lib/schemas/SimpleSchemas/Devices';
import { Encounters } from '../imports/lib/schemas/SimpleSchemas/Encounters';
import { Endpoints } from '../imports/lib/schemas/SimpleSchemas/Endpoints';
import { ExplanationOfBenefits } from '../imports/lib/schemas/SimpleSchemas/ExplanationOfBenefits';
import { Immunizations } from '../imports/lib/schemas/SimpleSchemas/Immunizations';
import { Lists } from '../imports/lib/schemas/SimpleSchemas/Lists';
import { Locations } from '../imports/lib/schemas/SimpleSchemas/Locations';
import { Medications } from '../imports/lib/schemas/SimpleSchemas/Medications';
import { MedicationRequests } from '../imports/lib/schemas/SimpleSchemas/MedicationRequests';
import { MedicationStatements } from '../imports/lib/schemas/SimpleSchemas/MedicationStatements';
import { Measures } from '../imports/lib/schemas/SimpleSchemas/Measures';
import { MeasureReports } from '../imports/lib/schemas/SimpleSchemas/MeasureReports';
import { MessageHeaders } from '../imports/lib/schemas/SimpleSchemas/MessageHeaders';
import { Organizations } from '../imports/lib/schemas/SimpleSchemas/Organizations';
import { Observations } from '../imports/lib/schemas/SimpleSchemas/Observations';
import { Patients } from '../imports/lib/schemas/SimpleSchemas/Patients';
import { Procedures } from '../imports/lib/schemas/SimpleSchemas/Procedures';
import { Questionnaires } from '../imports/lib/schemas/SimpleSchemas/Questionnaires';
import { QuestionnaireResponses } from '../imports/lib/schemas/SimpleSchemas/QuestionnaireResponses';
import { Tasks } from '../imports/lib/schemas/SimpleSchemas/Tasks';

import { FhirUtilities } from '../imports/lib/FhirUtilities.js'
import { FhirDehydrator } from '../imports/lib/FhirDehydrator.js'

import { LayoutHelpers } from '../imports/lib/LayoutHelpers.js'


Meteor.Collections = {
  AllergyIntolerances,
  Bundles,
  CarePlans,
  Claims,
  Conditions,
  Claims,
  Communications,
  CommunicationRequests,
  Compositions,
  Devices,
  Encounters,
  Endpoints,
  ExplanationOfBenefits,
  Immunizations,
  Lists,
  Locations,
  Medications,
  MedicationRequests,
  MedicationStatements,
  MessageHeaders,
  Measures,
  MeasureReports,
  Organizations,
  Observations,
  Patients,
  Procedures,
  Questionnaires,
  QuestionnaireResponses,
  Tasks
}

global.FhirUtilities = FhirUtilities;
global.FhirDehydrator = FhirDehydrator;
global.LayoutHelpers = LayoutHelpers;

global.Collections = {
  AllergyIntolerances,
  Bundles,
  CarePlans,
  Claims,
  Conditions,
  Communications,
  CommunicationRequests,
  Compositions,
  Devices,
  Encounters,
  Endpoints,
  ExplanationOfBenefits,
  Immunizations,
  Lists,
  Locations,
  Medications,
  MedicationRequests,
  MedicationStatements,
  MessageHeaders,
  Measures,
  MeasureReports,
  Organizations,
  Observations,
  Patients,
  Procedures,
  Questionnaires,
  QuestionnaireResponses,
  Tasks
}



global.Conditions = Conditions;
global.Claims = Claims;
global.Encounters = Encounters;
global.Endpoints = Endpoints;
global.ExplanationOfBenefits = ExplanationOfBenefits;
global.Immunizations = Immunizations;
global.Observations = Observations;
global.Procedures = Procedures;
global.MedicationRequests = MedicationRequests;
global.MeasureReports = MeasureReports;
global.Patients = Patients;
global.Questionnaires = Questionnaires;
global.QuestionnaireResponses = QuestionnaireResponses;
global.LinksCollection = LinksCollection;

//===============================================================================================================

let accountsServer;
Meteor.startup(async function(){
  // Need to add a default language for accessibility purposes
  WebApp.addHtmlAttributeHook(function() {
    return {
      "lang": "en"
    }
  })

  // Establish a database connection
  mongoose.connect(process.env.MONGO_URL, {
    useUnifiedTopology: true,
    useNewUrlParser: true
  });

  const db = mongoose.connection;
  
  let accountsMongo = new Mongo(db, {
    // options
  });

  // Connect to the accounts server for authentication 
  accountsServer = new AccountsServer(
    {
      db: accountsMongo,
      tokenSecret: get(Meteor, 'settings.private.accountServerTokenSecret', Random.secret()) 
    }
  );
});

export async function parseRpcAuthorization(accessToken){
  process.env.DEBUG && console.log("Parsing user authorization....")

  let isAuthorized = true;

  if(get(Meteor, 'settings.private.accessControl.enableRpcAccessRestrictions')){
    process.env.DEBUG && console.log("parseRpcAuthorization().accessToken", accessToken)
    
    try {
      const session = await accountsServer.findSessionByAccessToken(accessToken);
      process.env.DEBUG && console.log("parseRpcAuthorization().session", session);

      // const sessionUser = await accountsServer.findUserById(userId);
      // process.env.DEBUG && console.log("parseRpcAuthorization().sessionUser", sessionUser)
  
      if(session){
        isAuthorized = true;
      }        
    } catch (error) {
      console.log('findSessionByAccessToken.error', error)
      isAuthorized = false;
    }
  }
  return isAuthorized;
}




async function insertLink({ title, url }) {
  await LinksCollection.insertAsync({ title, url, createdAt: new Date() });
}

Meteor.startup(async () => {
  // If the Links collection is empty, add some data.
  if (await LinksCollection.find().countAsync() === 0) {
    await insertLink({
      title: 'Getting Started',
      url: '/getting-started'
    });

    await insertLink({
      title: 'Static Files',
      url: '/static-files'
    });

    await insertLink({
      title: 'SMART Launcher Debugger',
      url: '/smart-launcher-debugger'
    });

    await insertLink({
      title: 'SMART Sample App',
      url: '/smart-sample-app'
    });

    await insertLink({
      title: 'SMART App Debugger',
      url: '/smart-app-debugger'
    });

    await insertLink({
      title: 'Server Configuration',
      url: '/server-configuration'
    });

    await insertLink({
      title: 'UDAP Registration',
      url: '/udap-registration'
    });
  }

  // We publish the entire Links collection to all clients.
  // In order to be fetched in real-time to the clients
  Meteor.publish("links", function () {
    return LinksCollection.find();
  });

  Meteor.publish("OAuthClients", function () {
    return OAuthClients.find();
  });

});
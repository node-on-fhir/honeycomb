import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { WebApp } from "meteor/webapp";

import express from 'express';


import RestHelpers from './RestHelpers.js';

import { get, has, set, unset, cloneDeep, capitalize, findIndex, countBy } from 'lodash';
import moment from 'moment';

import OAuthClientComponents from '../imports/collections/OAuthClients.js';
import OAuthServerConfig from './OAuthServer.js';



import jwt from 'jsonwebtoken';
import forge from 'node-forge';

import base64url from 'base64-url';

import { Bundle } from '../imports/lib/schemas/SimpleSchemas/Bundles'

import { AllergyIntolerances } from '../imports/lib/schemas/SimpleSchemas/AllergyIntolerances';
import { AuditEvents } from '../imports/lib/schemas/SimpleSchemas/AuditEvents';
import { Bundles } from '../imports/lib/schemas/SimpleSchemas/Bundles';
import { CarePlans } from '../imports/lib/schemas/SimpleSchemas/CarePlans';
import { CareTeams } from '../imports/lib/schemas/SimpleSchemas/CareTeams';
import { CodeSystems } from '../imports/lib/schemas/SimpleSchemas/CodeSystems';
import { Communications } from '../imports/lib/schemas/SimpleSchemas/Communications';
import { CommunicationRequests } from '../imports/lib/schemas/SimpleSchemas/CommunicationRequests';
import { Compositions } from '../imports/lib/schemas/SimpleSchemas/Compositions';
import { Consents } from '../imports/lib/schemas/SimpleSchemas/Consents';
import { Conditions } from '../imports/lib/schemas/SimpleSchemas/Conditions';
import { Devices } from '../imports/lib/schemas/SimpleSchemas/Devices';
import { DiagnosticReports } from '../imports/lib/schemas/SimpleSchemas/DiagnosticReports';
import { DocumentReferences } from '../imports/lib/schemas/SimpleSchemas/DocumentReferences';
import { Encounters } from '../imports/lib/schemas/SimpleSchemas/Encounters';
import { Endpoints } from '../imports/lib/schemas/SimpleSchemas/Endpoints';
import { Goals } from '../imports/lib/schemas/SimpleSchemas/Goals';
import { Groups } from '../imports/lib/schemas/SimpleSchemas/Groups';
import { HealthcareServices } from '../imports/lib/schemas/SimpleSchemas/HealthcareServices';
import { Immunizations } from '../imports/lib/schemas/SimpleSchemas/Immunizations';
import { InsurancePlans } from '../imports/lib/schemas/SimpleSchemas/InsurancePlans';
import { Lists } from '../imports/lib/schemas/SimpleSchemas/Lists';
import { Locations } from '../imports/lib/schemas/SimpleSchemas/Locations';
import { Medications } from '../imports/lib/schemas/SimpleSchemas/Medications';
import { MedicationOrders } from '../imports/lib/schemas/SimpleSchemas/MedicationOrders';
import { Measures } from '../imports/lib/schemas/SimpleSchemas/Measures';
import { MeasureReports } from '../imports/lib/schemas/SimpleSchemas/MeasureReports';
import { NutritionOrders } from '../imports/lib/schemas/SimpleSchemas/NutritionOrders';
import { NutritionIntakes } from '../imports/lib/schemas/SimpleSchemas/NutritionIntakes';
import { Networks } from '../imports/lib/schemas/SimpleSchemas/Networks';
import { Observations } from '../imports/lib/schemas/SimpleSchemas/Observations';
import { OrganizationAffiliations } from '../imports/lib/schemas/SimpleSchemas/OrganizationAffiliations';
import { Organizations } from '../imports/lib/schemas/SimpleSchemas/Organizations';
import { Patients } from '../imports/lib/schemas/SimpleSchemas/Patients';
import { Practitioners } from '../imports/lib/schemas/SimpleSchemas/Practitioners';
import { PractitionerRoles } from '../imports/lib/schemas/SimpleSchemas/PractitionerRoles';
import { Procedures } from '../imports/lib/schemas/SimpleSchemas/Procedures';
import { Provenances } from '../imports/lib/schemas/SimpleSchemas/Provenances';
import { Questionnaires } from '../imports/lib/schemas/SimpleSchemas/Questionnaires';
import { QuestionnaireResponses } from '../imports/lib/schemas/SimpleSchemas/QuestionnaireResponses';
import { Restrictions } from '../imports/lib/schemas/SimpleSchemas/Restrictions';
import { RelatedPersons } from '../imports/lib/schemas/SimpleSchemas/RelatedPersons';
import { RiskAssessments } from '../imports/lib/schemas/SimpleSchemas/RiskAssessments';
import { SearchParameters } from '../imports/lib/schemas/SimpleSchemas/SearchParameters';
import { ServiceRequests } from '../imports/lib/schemas/SimpleSchemas/ServiceRequests';
import { StructureDefinitions } from '../imports/lib/schemas/SimpleSchemas/StructureDefinitions';
import { Subscriptions } from '../imports/lib/schemas/SimpleSchemas/Subscriptions';
import { Tasks } from '../imports/lib/schemas/SimpleSchemas/Tasks';
import { ValueSets } from '../imports/lib/schemas/SimpleSchemas/ValueSets';

import FhirUtilities from '../imports/lib/FhirUtilities.js';

//------------------------------------------------------------------------------------------
// Rate Limiter

import { RateLimiter } from "limiter";

const limiter = new RateLimiter({ tokensPerInterval: 150, interval: "hour" });

//------------------------------------------------------------------------------------------
// Accounts Subsystem 
// Access the Mongo database directly; 
// we want to fully integrate with @accountsjs
// and that means getting user sessions!

import mongoose from 'mongoose';
import { AccountsServer } from '@accounts/server';
import { Mongo } from '@accounts/mongo';


Meteor.startup(async function(){
  mongoose.connect(process.env.MONGO_URL, {
    useUnifiedTopology: true,
    useNewUrlParser: true
  });

  const db = mongoose.connection;
  let accountsMongo = new Mongo(db, {
    // options
  });

  let accountsServer = new AccountsServer(
    {
      db: accountsMongo,
      tokenSecret: get(Meteor, 'settings.private.accountServerTokenSecret', Random.secret())
    }
  );

  // wrapMeteorServer(Meteor, accountsServer);
});

//------------------------------------------------------------------------------------------
import { AccessControl } from 'role-acl';

let accessControlList = [];
Consents.find({'category.coding.code': 'IDSCL'}).forEach(function(consentRecord){
  // console.log('consentRecord', consentRecord)
  accessControlList.push(FhirUtilities.consentIntoAccessControl(consentRecord));
})

let accessControlListsInitialized = false;

if(accessControlList.length > 0){
  accessControlListsInitialized = true;
}
const acl = new AccessControl(accessControlList);

//------------------------------------------------------------------------------------------




// console.log("&&&&&&&&&&", OAuthClientComponents.OAuthClients)

// import { create } from 'ipfs-http-client';

// import * as IPFS from 'ipfs-core';
// import { AbortController } from "node-abort-controller";
// import { concat } from 'uint8arrays/concat';
// import { toString } from 'uint8arrays/to-string';

let defaultQuery = {};
let defaultOptions = {
    limit: get(Meteor, 'settings.private.fhir.publicationLimit', 1000)
}
if(get(Meteor, 'settings.private.accessControl.enableHttpAccessRestrictions')){
  defaultOptions.fields = {
      address: 0
  };
}

let ipfsNode;
if(process.env.ENABLE_IPFS){
  // connect to the default API
  ipfsNode = await IPFS.create({ host: 'localhost', port: '3005', protocol: 'http' })
  // ipfsNode = create({ host: 'localhost', port: '3005', protocol: 'http' });
  
  // ipfsNode = create();

  // console.log('ipfs.getEndpointConfig', ipfsNode.getEndpointConfig())
} 

//==========================================================================================
// Collections Namespace  

// These data cursors 

let Collections = {};

if(Meteor.isClient){
  Collections = window;
}
if(Meteor.isServer){
  Collections.AllergyIntolerances = AllergyIntolerances;
  Collections.AuditEvents = AuditEvents;
  Collections.Bundles = Bundles;
  Collections.CarePlans = CarePlans;
  Collections.CareTeams = CareTeams;
  Collections.CodeSystems = CodeSystems;
  Collections.Communications = Communications;
  Collections.CommunicationRequests = CommunicationRequests;
  Collections.Compositions = Compositions;
  Collections.Conditions = Conditions;
  Collections.Consents = Consents;
  Collections.Devices = Devices;
  Collections.DiagnosticReports = DiagnosticReports;
  Collections.DocumentReferences = DocumentReferences;
  Collections.Encounters = Encounters;
  Collections.Endpoints = Endpoints;
  Collections.Goals = Goals;
  Collections.Groups = Goals;
  Collections.HealthcareServices = HealthcareServices;
  Collections.Immunizations = Immunizations;
  Collections.InsurancePlans = InsurancePlans;
  Collections.Lists = Lists;
  Collections.Locations = Locations;
  Collections.Networks = Networks;
  Collections.NutritionIntakes = NutritionIntakes;
  Collections.NutritionOrders = NutritionOrders;
  Collections.Observations = Observations;
  Collections.Organizations = Organizations;
  Collections.OrganizationAffiliations = OrganizationAffiliations;
  Collections.OAuthClients = OAuthClientComponents.OAuthClients;
  Collections.Medications = Medications;
  Collections.MedicationOrders = MedicationOrders;
  Collections.Measures = Measures;
  Collections.MeasureReports = MeasureReports;
  Collections.Patients = Patients;
  Collections.Practitioners = Practitioners;
  Collections.PractitionerRoles = PractitionerRoles;
  Collections.Provenances = Provenances;
  Collections.Procedures = Procedures;
  Collections.Questionnaires = Questionnaires;
  Collections.QuestionnaireResponses = QuestionnaireResponses;
  Collections.Restrictions = Restrictions;
  Collections.RelatedPersons = RelatedPersons;
  Collections.RiskAssessments = RiskAssessments;
  Collections.SearchParameters = SearchParameters;
  Collections.ServiceRequests = ServiceRequests;
  Collections.StructureDefinitions = StructureDefinitions;
  Collections.Subscriptions = Subscriptions;
  Collections.Tasks = Tasks;
  Collections.ValueSets = ValueSets;
  // Collections.VerificationResults = VerificationResults;
}


//==========================================================================================
// Middleware


let fhirPath = get(Meteor, 'settings.private.fhir.fhirPath', 'baseR4');
let fhirVersion = get(Meteor, 'settings.private.fhir.fhirVersion', 'R4');
let containerAccessTokenOverride = get(Meteor, 'settings.private.fhir.accessToken', false);

// if(typeof OAuthServerConfig === 'object'){
//   // TODO:  double check that this is needed; and that the /api/ route is correct
//   JsonRoutes.Middleware.use(
//     // '/api/*',
//     '/baseR4/*',
//     OAuthServerConfig.oauthserver.authorise()   // OAUTH FLOW - A7.1
//   );
// } else {
//   console.log("No OAuthServerConfig found.")
// }

// WebApp.handlers.use(express.json());
// WebApp.handlers.use(OAuthServerConfig.oauthserver.authorise());

// WebApp.handlers.use(
//   '/baseR4/*', 
//   express.json()
// );

// WebApp.handlers.use(
//   '/oauth/getIdentity',
//   OAuthServerConfig.oauthserver.authorize()
// );
//==========================================================================================
// Helper Methods

async function parseUserAuthorization(req){
  process.env.DEBUG && console.log("Core FHIR API parsing user authorization....")


  let authorizationContext = false;
  let authorizationContextToExport = false;

  // BASIC AUTH
  if(get(Meteor, 'settings.private.accessControl.enableBasicAuth')){
    if(get(req, "headers.authorization")){
      let encodedAuth = get(req, "headers.authorization");
      let decodedAuth = base64url.decode(encodedAuth.replace("Basic ", ""))
      console.log('decodedAuth: ' + decodedAuth)
  
      let authParts = decodedAuth.split(":");
      if(authParts[0] && Collections["OAuthClients"]){
        let clientRegistration = await Collections["OAuthClients"].findOneAsync({client_id: authParts[0]})
        console.log('clientRegistration', clientRegistration)
        if(clientRegistration && authParts[1]){
          if(get(clientRegistration, 'client_secret') === authParts[1]){
            authorizationContext = {
              role: "healthcare provider",
              userId: authParts[0]
            };;
            console.log('User presented registered client_secret via Basic Auth. Granting system access.');

          }          
        }
      } else {
        console.log("For some reason the OAuthClients collection doesn't exist.")
      }
    }  
  }

  // BACKEND SERVICES (JWT)
  if(get(Meteor, 'settings.private.accessControl.enableJwtBackendServices')){
    if(get(req, "headers.authorization")){
      let encodedAuth = get(req, "headers.authorization");

      authorizationContext = {
        role: "system",
        userId: "system"
      };
      authorizationContextToExport = true;
      

    //   let decodedAuth = base64url.decode(encodedAuth.replace("Basic ", ""))
    //   console.log('decodedAuth: ' + decodedAuth)
  
    //   let authParts = decodedAuth.split(":");
    //   if(authParts[0] && Collections["OAuthClients"]){
    //     let clientRegistration = Collections["OAuthClients"].findOneAsync({client_id: authParts[0]})
    //     if(clientRegistration && authParts[1]){
    //       if(get(clientRegistration, 'client_secret') === authParts[1]){
    //         authorizationContext = true;

    //         console.log('User presented registered client_secret via Basic Auth. Granting system access.');

    //         // system access; 
    //         // replace with JWT and SMART Backend Services
    //       } else if(get(clientRegistration, 'client_secret') === "system:1234567890"){
    //         authorizationContext = true;
    //         console.log('User presented registered client_secret via JWT. Granting system access.');
    //       }          

    //     }
    //   } else {
    //     console.log("For some reason the OAuthClients collection doesn't exist.")
    //   }
    }  
  }

  // SMART on FHIR (OAUTH) 

  if(typeof OAuthServerConfig !== "object"){
    console.log('OAuthServerConfig does not exist.')
  }

  process.env.TRACE && console.log("")
  process.env.TRACE && console.log("req.query");
  process.env.TRACE && console.log(req.query);
  process.env.TRACE && console.log("")
  process.env.TRACE && console.log("req.body")
  process.env.TRACE && console.log(req.body);

  console.log('>>> Lets try SMART on FHIR OAuth...')
  let sessionToken = get(req, 'headers.session');
  
  // let accessTokenStr = (req.params && req.params.access_token) || (req.query && req.query.access_token);
  console.log('>>> SmartOnFHIR.sessionToken', sessionToken)
  console.log('>>> SmartOnFHIR.req.query', req.query)

  let decodedSessionToken = jwt.decode(sessionToken, {complete: true});
  console.log('>>> SmartOnFHIR.decodedSessionToken', decodedSessionToken)

  let authToken = get(decodedSessionToken, 'payload.data.token');
  let userId = get(decodedSessionToken, 'payload.data.userId');
  console.warn('>>> SmartOnFHIR.authToken', authToken)
  console.warn('>>> SmartOnFHIR.userId', userId)
  console.warn('>>> the above userId and authToken were extracted with jwt.decode() ')
  console.warn('>>> jwt.decode() should be replaced with jwt.verify()')

  // console.log('>>> SmartOnFHIR.OAuthServerConfig', OAuthServerConfig)
  if(typeof OAuthServerConfig === 'object' && sessionToken){
    // let accessToken = OAuthServerConfig.collections.accessToken.findOneAsync({accessToken: accessTokenStr})
    // console.log('>>> SmartOnFHIR.accessToken', accessToken)

    let sessionUser;
    if(userId){
      sessionUser = await accountsServer.findUserById(userId);
    } else {
      let session = await accountsServer.findSessionByAccessToken(authToken);
      // const session = await accountsServer.findSessionByAccessToken(get(sessionToken, 'payload.data.token'));
      process.env.DEBUG_ACCOUNTS && console.log('>>> SmartOnFHIR.session', session)
  
      sessionUser = await accountsServer.findUserById(get(session, 'userId'));
    }

    process.env.DEBUG_ACCOUNTS && console.log('>>> SmartOnFHIR.sessionUser', sessionUser)
    process.env.DEBUG_ACCOUNTS && console.log('>>> SmartOnFHIR.sessionUserRole', get(sessionUser, 'roles[0]'))

    authorizationContext = {
      role: get(sessionUser, 'roles[0]', 'citizen'),
      userId: get(sessionUser, '_id', ''),
      patientId: get(sessionUser, 'patientId', ''),
      practitionerId: get(sessionUser, 'practitionerId', '')
    };
  }

  if (get(Meteor, 'settings.private.fhir.disableOauth') === true) {
    authorizationContext = {
      role: 'noauth',
      userId: null
    };;
  }

  if (process.env.NOAUTH) {
    authorizationContext = {
      role: 'noauth',
      userId: null
    };
  }

  return authorizationContext;
}
async function isAuthorized(authorizationContext){
  if(['noauth', 'system', 'patient', 'healthcare practitioner'].includes(get(authorizationContext, 'role'))){
    return true;
  } else {
    return false;
  }
}
async function logToInboundQueue(request){
  process.env.DEBUG && console.log('request.query', request.query)
  process.env.DEBUG && console.log('request.params', request.params)
  process.env.DEBUG && console.log('request.headers', request.headers)

  if(get(Meteor, 'settings.private.fhir.inboundQueue') === true){
    process.env.EXHAUSTIVE && console.log('Inbound request', request)
    if(typeof InboundRequests === "object"){
      await InboundRequests.insertAsync({
        date: new Date(),
        method: get(request, 'method'),
        url: get(request, 'url'),
        body: get(request, 'body'),
        originalUrl: get(request, 'originalUrl'),
        headers: get(request, 'headers')
      });
    }
  }

  return request;
}
async function signProvenance(record){
  let publicKey = get(Meteor, 'settings.private.x509.publicKey');
  let privateKey = get(Meteor, 'settings.private.x509.privateKey');

  if(record){
    delete record._document;
    delete record._id;
  
    process.env.DEBUG && console.log('signProvenance', record)  
  }

  if(privateKey){
    var token = jwt.sign(JSON.stringify(record), privateKey, { algorithm: 'RS256'})

    let provenanceRecord = {
      resourceType: "Provenance",                  
      target: [],
      recorded: new Date(),
      signature: [{
        type: [{
          system: 'urn:iso-astm:E1762-95:2013',
          code: '1.2.840.10065.1.12.1.14',
          display: 'Source Signature'
        }],
        when: new Date(),
        who: {
          display: 'National Directory'
        },
        data: token
      }]
    }
  
    if(Array.isArray(record)){
      record.forEach(function(rec){
        provenanceRecord.target.push({
          display: get(rec, 'name', ''),
          reference: get(rec, 'id'),
          type: get(rec, 'resourceType'),
        });  
      })
    } else {
      provenanceRecord.target.push({
        display: get(record, 'name', ''),
        reference: get(record, 'id'),
        type: get(record, 'resourceType'),
      });  
    }
    
    if(get(Meteor, 'settings.private.fhir.generateProvenanceIndex')){
      await Provenances.insertAsync(provenanceRecord);
    }
  
    return JSON.stringify(provenanceRecord)
  
  } else {
    return null;
  }
}





//==========================================================================================
// Route Manifest  


WebApp.handlers.post("/" + fhirPath + "/ping", async (req, res) => {

  console.log("POST /" + fhirPath + "ping");

  res.setHeader('Content-type', 'application/json');
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.setHeader('Content-type', 'application/json');
  res.setHeader("Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS");

  const remainingRequests = await limiter.removeTokens(1);
  if (remainingRequests < 0) {
    res.status(429).json({message: "Too Many Requests - your IP is being rate limited'"});
  } else {
    let returnPayload = {
      code: 200,
      data: "PONG!!!"
    }
    if(process.env.TRACE){
      console.log('return payload', returnPayload);
    }
    res.json(returnPayload);
  }
});


//==========================================================================================
// Route Manifest  

// If no settings file is provided, we will default to a Public Health Server with no PHI
let serverRouteManifest = get(Meteor, 'settings.private.fhir.rest', {
  "MeasureReport": {
    "interactions": ["read", "create", "update", "delete"]
  },
  "Measure": {
    "interactions": ["read", "create", "update", "delete"]
  },
  "Location": {
    "interactions": ["read", "create", "update", "delete"]
  },
  "Organization": {
    "interactions": ["read", "create", "update", "delete"]
  }
});


// checking if we're in strict validation mode, or if we're promiscuous  
let schemaValidationConfig = get(Meteor, 'settings.private.fhir.schemaValidation', {});

if(typeof serverRouteManifest === "object"){
  console.log('==========================================================================================');
  console.log('Initializing FHIR Server.');
  Object.keys(serverRouteManifest).forEach(async function(routeResourceType){

    let collectionName = FhirUtilities.pluralizeResourceName(routeResourceType);
    console.log('Setting up routes for the ' + collectionName + ' collection.');

    // console.log('FhirServer is initializing search parameters...')
    SearchParameters.find({'base': routeResourceType}).forEach(function(parameter){
      console.log('  SearchParameter: ' + get(parameter, 'id'))
    })

    if(Array.isArray(serverRouteManifest[routeResourceType].interactions)){
      
      // vread 
      // https://www.hl7.org/fhir/http.html#vread
      if(serverRouteManifest[routeResourceType].interactions.includes('vread')){
        

        WebApp.handlers.get("/" + fhirPath + "/" + routeResourceType + "/:id/_history/:versionId", async (req, res) => {
          if(get(Meteor, 'settings.private.debug') === true) { console.log('> GET /' + fhirPath + '/' + routeResourceType + '/' + req.params.id + '/_history/' + + req.params.versionId); }
  
          logToInboundQueue(req);

          res.setHeader("content-type", 'application/fhir+json;charset=utf-8');
          res.setHeader("ETag", fhirVersion);

          const remainingRequests = await limiter.removeTokens(1);
          if (remainingRequests < 0) {
            res.status(429).json({message: "429 Too Many Requests - your IP is being rate limited"});
          } else {
            let authorizationContext = await parseUserAuthorization(req)
            if (isAuthorized(authorizationContext)){
              if(get(Meteor, 'settings.private.debug') === true) { console.log('Security checks completed'); }
  
              process.env.DEBUG && console.log('req.query', req.query)
              process.env.DEBUG && console.log('req.params', req.params)
  
              let record = await Collections[collectionName].findOneAsync({
                'id': get(req, 'params.id'), 
                'meta.versionId': get(req, 'params.versionId')
              });            
              if(get(Meteor, 'settings.private.trace') === true) { console.log('record', record); }
              
              res.setHeader("Last-Modified", moment(get(record, 'meta.lastUpdated')).toDate());
              
              if(record){
                // Success
                res.status(200).json(RestHelpers.prepForFhirTransfer(record));
              } else {
                // Success
                res.status(404).json();

              }
            }
          }   
        });


      } else {
        WebApp.handlers.get("/" + fhirPath + "/" + routeResourceType + "/:id/_history/:versionId", async (req, res) => {
          res.setHeader('Content-type', 'application/fhir+json;charset=utf-8');
          res.setHeader("ETag", fhirVersion);
          
          const remainingRequests = await limiter.removeTokens(1);
          if (remainingRequests < 0) {
            res.status(429).json({message: "429 Too Many Requests - your IP is being rate limited"});
          } else {
            res.status(501).json();
          }
        });

      }

      // read
      // https://www.hl7.org/fhir/http.html#read
      if(serverRouteManifest[routeResourceType].interactions.includes('read')){
        // read 
        WebApp.handlers.get("/" + fhirPath + "/" + routeResourceType + "/:id", async (req, res) => {
          if(get(Meteor, 'settings.private.debug') === true) { console.log('GET /' + fhirPath + '/' + routeResourceType + '/' + req.params.id); }
  
          logToInboundQueue(req);

          res.setHeader("content-type", 'application/fhir+json;charset=utf-8');
          res.setHeader("ETag", fhirVersion);

          const remainingRequests = await limiter.removeTokens(1);
          if (remainingRequests < 0) {
            res.status(429).json({message: "429 Too Many Requests - your IP is being rate limited"});
          } else {
            // is this person authorized?
            let authorizationContext = await parseUserAuthorization(req)
            if (isAuthorized(authorizationContext)){
              if(get(Meteor, 'settings.private.debug') === true) { console.log('Security checks completed'); }

              // the person is authorized and known; but do they have permission to access?
              let userRole = {
                role: 'citizen',
                userId: null
              };
              
              // TODO:  if logged in, user role becomes 'healthcare provider' etc.


              // const permission = acl.can(userRole.role.role).execute('access').with({'securityLevel': 'restricted'}).sync().on(routeResourceType);

              let records;
              let lastModified = moment().subtract(100, 'years');
              let hasVersionedLastModified = false;

              process.env.DEBUG && console.log('req.query', req.query)
              process.env.DEBUG && console.log('req.params', req.params)

              // AUTHENTICATION NEEDED:  BULK DATA ACCESS
              if((req.params.id === "$export") && (authorizationContextToExport)){

                console.log(collectionName + " records: " + await Collections[collectionName].find().countAsync());
                
                if(["json", "application/json", "application/fhir+json", "bundle", "Bundle"].includes(get(req, 'query._outputFormat'))){
                  let jsonPayload = [];

                  await Collections[collectionName].find(defaultQuery, defaultOptions).forEach(function(record){

                    // check for security labels; otherwise assume normal access patterns
                    let recordSecurityLevel = get(record, 'meta.security[0].display', 'normal');
                    let accessGranted = false;
                    let permission;
    
                    if (get(Meteor, 'settings.private.fhir.disableAccessControl') === true) {
                      accessGranted = true;
                    } else {
                      permission = acl.can(userRole).execute('access').with({'securityLevel': recordSecurityLevel}).sync().on(routeResourceType);
                      console.log('permission.granted: ' + permission.granted);
    
                      accessGranted = permission.granted;
                    }
    

                    if(accessGranted){
                      jsonPayload.push({
                        fullUrl: routeResourceType + '/' + get(record, 'id'),
                        resource: RestHelpers.prepForFhirTransfer(record)
                      });  
                    } 
                  });
    
                  process.env.DEBUG && console.log('jsonPayload', jsonPayload);

                  res.setHeader('Content-disposition', 'attachment; filename=' + collectionName + ".fhir");
                  res.setHeader("x-provenance", signProvenance(jsonPayload));

                  // Success
                  res.status(200).json(Bundle.generate(jsonPayload));
                  
                } else {

                  // BULK DATA EXPORT 
                  // what are security access patterns for bulk data?  

                  let ndJsonPayload = "[";

                  res.setHeader("content-type", 'application/ndjson');
                  res.setHeader('Content-disposition', 'attachment; filename=' + collectionName + ".ndjson");
                  
                  await Collections[collectionName].find().forEach(function(record, index){
                    res.write( JSON.stringify(RestHelpers.prepForFhirTransfer(record)) + "\n" );                  
                  });  

                  // Success
                  res.status(202).json(Bundle.generate(jsonPayload));
                }
              } else {

                // not exporting; just a regular read

                records = await Collections[collectionName].find({id: req.params.id}, defaultOptions).fetch();

                // plain ol regular approach
                if(get(Meteor, 'settings.private.debug') === true) { console.log('records', records); }
    
                // could we find it?
                if(Array.isArray(records)){
                  if(records.length === 0){
                    // no content
                    res.status(204).json()
                  } else if (records.length === 1){
                    res.setHeader("Content-type", 'application/fhir+json');
                    res.setHeader("Last-Modified", lastModified);
                    res.setHeader("x-provenance", signProvenance(records[0]));

                    // check for security labels; otherwise assume normal access patterns
                    let recordSecurityLevel = get(records[0], 'meta.security[0].display', 'normal');
                    let accessGranted = false;
                    let permission;
    
                    if (get(Meteor, 'settings.private.fhir.disableAccessControl') === true) {
                      accessGranted = true;
                    } else {
                      permission = acl.can(userRole).execute('access').with({'securityLevel': recordSecurityLevel}).sync().on(routeResourceType);    
                      accessGranted = permission.granted;
                    }
    
                    console.log('accessGranted: ' + accessGranted);
                    if(accessGranted){
                      res.status(200).json(RestHelpers.prepForFhirTransfer(records[0]));
                    } else {
                      res.status(403).json();
                    }
                  } else if (records.length > 1){
                    // Success
                    res.setHeader("Content-type", 'application/fhir+json');

                    let mostRecentRecord;

                    if(get(Meteor, 'settings.private.fhir.rest.' + routeResourceType + '.versioning') === "versioned"){

                      if(get(Meteor, 'settings.private.trace') === true) { console.log('records', records); }

                      // and generate a Bundle payload
                      payload = [];

                      // loop through each matching version
                      records.forEach(function(recordVersion){
                        console.log('recordVersion', recordVersion)

                        // look for a meta.versionId that is equal to the number of records
                        // this should be the most-recent record
                        // NOTE:  this algorithm breaks if we ever delete a version from history
                        if(parseInt(get(recordVersion, 'meta.versionId')) === records.length){
                            mostRecentRecord = recordVersion;

                            if(get(recordVersion, 'meta.lastUpdated')){
                              hasVersionedLastModified = true;
                              if(moment(get(recordVersion, 'meta.lastUpdated')) > moment(lastModified)){
                                lastModified = moment(get(recordVersion, 'meta.lastUpdated')).toDate();
                              }
                            } 
                        }                       
                      });  
                      
                      if(hasVersionedLastModified){
                        res.setHeader("Last-Modified", lastModified);
                      }
                    }

                    // check for security labels on the most recent record
                    let recordSecurityLevel = get(mostRecentRecord, 'meta.security[0].display', 'normal');
                    let accessGranted = false;
                    let permission;
    
                    if (get(Meteor, 'settings.private.fhir.disableAccessControl') === true) {
                      accessGranted = true;
                    } else {
                      permission = acl.can(userRole).execute('access').with({'securityLevel': recordSecurityLevel}).sync().on(routeResourceType);
                      console.log('permission.granted: ' + permission.granted);
    
                      accessGranted = permission.granted;
                    }
    

                    if(accessGranted){
                      res.setHeader("x-provenance", signProvenance(mostRecentRecord));
                      res.status(200).json(RestHelpers.prepForFhirTransfer(mostRecentRecord));
                    } else {
                      res.status(403).json();
                    }
                  }
                  
                } else {
                  // search didn't find an error; something is broken
                  // Not Found
                  res.status(404).json();
                }
              }
      
            } else {

              // Unauthorized
              res.status(401).json();
            }
          }
        });



        // Search Interaction
        WebApp.handlers.get("/" + fhirPath + "/" + routeResourceType, async (req, res) => {
          if(get(Meteor, 'settings.private.debug') === true) { console.log('-------------------------------------------------------'); }
          if(get(Meteor, 'settings.private.debug') === true) { console.log('>> GET ' + fhirPath + "/" + routeResourceType, req.query); }

          if(get(Meteor, 'settings.private.debug') === true) { 
            console.log('Resource Type: ' + routeResourceType);               
          }

          const remainingRequests = await limiter.removeTokens(1);
          if (remainingRequests < 0) {
            res.status(429).json({message: "429 Too Many Requests - your IP is being rate limited"});
          } else {

            let mongoQuery = {$and: [
              {'meta.security.display': {$eq: 'unrestricted'}}
              // {'meta.security.display': {$ne: 'restricted'}}
            ]}
            let chainedIds;

            // first scan the query for any chained queries
            process.env.DEBUG && console.log('--------------------------------------')
            process.env.DEBUG && console.log('Checking for chained queries (GET)....')
            process.env.DEBUG && console.log('req.query', req.query);

            Object.keys(req.query).forEach(async function(key){
              let queryParts = key.split(".");
              if(Array.isArray(queryParts)){
                let isChained = false;
                process.env.TRACE && console.log("queryParts.length", queryParts.length);
                if(queryParts.length === 2){
                  isChained = true;
                  let newQueryUrl = "";
                  // console.log('queryParts[0]', queryParts[0])
                  let softTarget = capitalize(queryParts[0]);
                  if(queryParts[0] === "providedBy"){
                    softTarget = "Organization";
                  } 
                  let chainedCollectionName = FhirUtilities.pluralizeResourceName(softTarget)
                  newQueryUrl = softTarget + "?" + queryParts[1] + "=" + req.query[key]
                  process.env.DEBUG && console.log('newQueryUrl', newQueryUrl);

                  // look up search parameter for chained query
                  let chainQuery = {code: queryParts[1], target: softTarget};
                  console.log('chainQuery', chainQuery);

                  let chainedSearchParams = await SearchParameters.findOneAsync(chainQuery);
                  if(chainedSearchParams){
                    if(chainedSearchParams){
                      process.env.DEBUG && console.log('chainedSearchParams.expression', chainedSearchParams.expression)
                      process.env.DEBUG && console.log('chainedSearchParams.xpath', chainedSearchParams.xpath)
                      process.env.DEBUG && console.log('chainedCollectionName', chainedCollectionName)
                    }
    
                    if(Collections[chainedCollectionName]){
                      let chainedQuery = {};
                      chainedQuery[chainedSearchParams.xpath] = req.query[key]
                      process.env.DEBUG && console.log('chainedQuery', chainedQuery)
                      
                      // map the ids of any records that are found into an array
                      chainedIds = await Collections[chainedCollectionName].find(chainedQuery).map(function(record){
                        return softTarget + "/" + record.id;
                      })
    
                      // the create the JOIN equivalent by matching the chain reference 
                      // to any of the ids included in the array
                      mongoQuery[queryParts[0] + ".reference"] = {$in: chainedIds}
                    }
    
                  }
                }
              }
            })

            process.env.TRACE && console.log('chainedIds', chainedIds);

            // now search through the query for regular run-of-the-mill queries
            SearchParameters.find({base: routeResourceType}).forEach(function(searchParameter){
              process.env.DEBUG && console.log('------------------------------------------------------')
              // process.env.DEBUG && console.log('req.query', req.query);
              process.env.DEBUG && console.log('SearchParameter');
              process.env.DEBUG && console.log('id:         ' + get(searchParameter, 'id'));
              process.env.DEBUG && console.log('code:       ' + get(searchParameter, 'code'));
              process.env.DEBUG && console.log('expression: ' + get(searchParameter, 'expression'));
              process.env.DEBUG && console.log('base        ' + get(searchParameter, 'base'));
              process.env.DEBUG && console.log('target      ' + get(searchParameter, 'target[0]'));
              process.env.DEBUG && console.log('xpath:      ' + get(searchParameter, 'xpath'));
              process.env.DEBUG && console.log(' ');

              Object.keys(req.query).forEach(function(queryKey){              
                // for query keys that dont have a value
                // just build a mongo query that searches if the key exists or not
                if(Object.hasOwnProperty(queryKey) && (Object[queryKey] === "")){
                  let fieldExistsQuery = {};
                  fieldExistsQuery[queryKey] = {$exists: true};
                  Object.assign(mongoQuery, fieldExistsQuery);
                } else if(get(searchParameter, 'code') === queryKey){
                  // otherwise, map the fhirpath to mongo
                  Object.assign(mongoQuery, RestHelpers.fhirPathToMongo(searchParameter, queryKey, req))
                }                
              })       
              
              if(get(Meteor, 'settings.private.debug') === true) { console.log('SearchParameters::mongoQuery', JSON.stringify(mongoQuery)); }
            }) 

            process.env.DEBUG && console.log('Original Url:  ' + req.originalUrl)
            process.env.DEBUG && console.log('Generated Mongo query: ', mongoQuery);
            process.env.DEBUG && console.log('--------------------------------------')

            logToInboundQueue(req);

            // res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader('Content-type', 'application/fhir+json;charset=utf-8');
            res.setHeader("ETag", fhirVersion);
            
            let authorizationContext = {
              role: 'citizen',
              userId: null
            };


            authorizationContext = await parseUserAuthorization(req);

            if (isAuthorized(authorizationContext)){
              
              let userRole = get(authorizationContext, 'role', 'citizen');


              if(get(Meteor, 'settings.private.debug') === true) { console.log('authorizationContext', authorizationContext); }
              if(get(Meteor, 'settings.private.debug') === true) { console.log('CollectionName: ' + collectionName); }
              if(get(Meteor, 'settings.private.debug') === true) { console.log('userRole: ' + userRole); }



              if(userRole){
                let hipaaAccess = {};
                if(accessControlList.length > 0){
                  if(userRole === "noauth"){
                    // authorization is disabled; grant access
                    hipaaAccess = {
                      granted: true
                    }
                  } else {
                    hipaaAccess = acl.can(userRole).execute('access').with({securityLabel: 'normal'}).sync().on(routeResourceType);    
                  }
                } else {
                  // console.log('acl', acl)
                  // console.log('Access Control List initialized with ' + accessControlList.length + ' records.')
                  res.status(501).json({message: 'Access control lists not initialized.  Have the administrator initialize some Consent records to allow access to the repository.  INITIALIZE_CONSENT_ENGINE environment variable may be of help.'})
                }
                
                console.log(routeResourceType + '.publish().permission', hipaaAccess)
                console.log(routeResourceType + '.publish().permission.granted', hipaaAccess.granted)
                if(hipaaAccess.granted){
                  mongoQuery = {$or: [
                    // {'meta.security.display': {$ne: 'restricted'}}
                    {'meta.security.display': {$eq: 'unrestricted'}}
                  ]}
                  if(routeResourceType === "Patient"){
                    if(get(authorizationContext, 'patientId')){
                      mongoQuery.$or.push({'id': get(authorizationContext, 'patientId')})
                    }  
                    if(get(authorizationContext, 'practitionerId')){
                      mongoQuery.$or.push({'generalPractitioner.reference': {$regex: get(authorizationContext, 'practitionerId')}})
                    }
                  } else {
                    if(get(authorizationContext, 'patientId')){
                      mongoQuery.$or.push({'subject.reference': 'Patient/' + get(authorizationContext, 'patientId')})
                    }  
                  }
                }    

                if(userRole === "noauth"){
                  mongoQuery = {}
                }
                
                let databaseOptions = RestHelpers.generateMongoSearchOptions(req.query, routeResourceType);

                let payload = [];
    
                if(get(Meteor, 'settings.private.debug') === true) { console.log('mongoQuery', JSON.stringify(mongoQuery, null, 2)); }
                if(get(Meteor, 'settings.private.debug') === true) { console.log('mongoQuery.compressed', JSON.stringify(mongoQuery)); }
                if(get(Meteor, 'settings.private.debug') === true) { console.log('databaseOptions', databaseOptions); }
                // time to use the generated mongo query and go fetch actual records
                if(Collections[collectionName]){
    
                  let selectedPatientId = get(authorizationContext, 'userId');
                  // let totalMatches = await Collections[collectionName].find(mongoQuery).countAsync();
                  let records;                  
                  records = await Collections[collectionName].find(mongoQuery, databaseOptions).fetch();

                  process.env.DEBUG && console.log('records', records)
                  // if(collectionName === "Patients"){
                  //   records = await Collections[collectionName].find(mongoQuery, databaseOptions).fetch();
                  // } else {
                  //   records = await Collections[collectionName].find(FhirUtilities.addPatientFilterToQuery(selectedPatientId, mongoQuery), databaseOptions).fetch();
                  // }
                  
                  // if(get(Meteor, 'settings.private.debug') === true) { console.log('Found ' + records.length + ' records matching the query on the ' + routeResourceType + ' endpoint.'); }
                  process.env.DEBUG && console.log('Found ' + records.length + ' records matching the query on the ' + routeResourceType + ' endpoint.'); 
    
                  process.env.DEBUG && console.log('AccessControlLists - Current userRole: ' + userRole)
                  // payload entries
                  records.forEach(function(record){
    
                    // check for security labels; otherwise assume normal access patterns
                    let recordSecurityLabel = get(record, 'meta.security[0].display', 'normal');
                    console.log('---------------------------------------------------')
                    console.log('routeResourceType:   ' + routeResourceType)
                    console.log('authorization.role:  ' + get(authorizationContext, 'role'))
                    console.log('recordSecurityLabel: ' + recordSecurityLabel)
    
                    
                    let accessGranted = false;
                    let permission;
    
                    if (get(authorizationContext, 'role') === 'noauth') { 
                      accessGranted = true;
                    } else {
                      permission = acl.can(get(authorizationContext, 'role', 'citizen')).execute('access').with({'securityLabel': recordSecurityLabel}).sync().on(routeResourceType);
                      console.log('permission.granted:  ' + permission.granted);
    
                      accessGranted = permission.granted;
                    }
    
                    if(accessGranted){
                      let newEntry = {
                        fullUrl: routeResourceType + "/" + get(record, 'id'),
                        resource: RestHelpers.prepForFhirTransfer(record),
                        search: {
                          mode: "match"
                        }
                      }
                      payload.push(newEntry);
                    } 
    
                    
                    // lets check for any _include references
                    // process.env.DEBUG && console.log('req.query', req.query);
                    if(Array.isArray(req.query._include)){
                      req.query._include.forEach(async function(_includeRef){
                        let includeParts = _includeRef.split(":");
                        let referenceBase;
                        if(includeParts.length === 2){
                          referenceBase = includeParts[1];
                        } else if (includeParts.length === 2){
                          referenceBase = includeParts[0];
                        }
    
                        if(get(record, referenceBase + ".reference")){
                          console.log("_include reference: ", get(record, referenceBase + ".reference"))
    
                          let includeReferenceParts = (get(record, referenceBase + ".reference")).split("/");
                          console.log('includeReferenceParts.length', includeReferenceParts.length);
    
                          let pluralizedReferenceBase = FhirUtilities.pluralizeResourceName(capitalize(referenceBase));
                          console.log('pluralizedReferenceBase', pluralizedReferenceBase);
    
                          if(Collections[pluralizedReferenceBase]){
                            if(includeReferenceParts.length = 2){
                              let _includeReferenceRecord = await Collections[pluralizedReferenceBase].findOneAsync({id: includeReferenceParts[1]})
                              if(_includeReferenceRecord){
                                let newEntry = {
                                  fullUrl: get(record, referenceBase + ".reference"),
                                  resource: RestHelpers.prepForFhirTransfer(_includeReferenceRecord),
                                  search: {
                                    mode: "include"
                                  }
                                }
                                payload.push(newEntry);
                              }
                            }
                          }
                        }
                      })
                    }
                  });
    
    
                  // add some pagination logic
                  let links = [];
                  links.push({
                    "relation": "self",
                    "url": req.originalUrl
                  });  
    
                  // // if matches are greater than _count?
                  // if(totalMatches > payload.length){
                  //   links.push({
                  //     "relation": "next",
                  //     "url": fhirPath + "/" + '?_skip=' + (parseInt(databaseOptions.skip) + payload.length)
                  //   });  
                  // }
    
                  // Success
                  res.status(200).json(Bundle.generate(payload, "searchset", payload.length, links));                  

                  // res.end(Bundle.generate(payload, "searchset", payload.length, links));
                } else {
                  // Not Implemented
                  res.status(501).json();
                } 
              } else {
                
                // Unauthorized
                res.status(418).json();
              }
            } else {
              console.log('User not authorized...')
              // enable public access unclassified data
              if(get(Meteor, 'settings.private.enablePublicUnrestrictedData')){
                console.log('Providing public unrestricted data instead...')
                let records = await Collections[collectionName].find({'meta.security.display': {$eq: 'unrestricted'}});

                let payload = [];
                records.forEach(function(record){
                  payload.push({
                    fullUrl: routeResourceType + "/" + get(record, 'id'),
                    resource: RestHelpers.prepForFhirTransfer(record),
                    search: {
                      mode: "match"
                    }
                  });
                })      
                let links = [];
                links.push({
                  "relation": "self",
                  "url": req.originalUrl
                });          

                res.status(200).json(Bundle.generate(payload, "searchset", payload.length, links));
              } else {
                // Unauthorized
                res.status(401).json();
              }
            }
          }
        });
      } else {
        // NOT IMPLEMENTED
        WebApp.handlers.get("/" + fhirPath + "/" + routeResourceType + "/:id", async (req, res) => {
          res.setHeader('Content-type', 'application/fhir+json;charset=utf-8');
          res.setHeader("ETag", fhirVersion);
          
          res.status(501).json();
        });

        // NOT IMPLEMENTED
        WebApp.handlers.get("/" + fhirPath + "/" + routeResourceType, async (req, res) => {
          res.setHeader('Content-type', 'application/fhir+json;charset=utf-8');
          res.setHeader("ETag", fhirVersion);

          res.status(501).json();
        });
      }

      // History-instance
      // https://www.hl7.org/fhir/http.html#history-instance
      if(serverRouteManifest[routeResourceType].interactions.includes('history-instance')){
        // history-instance
        WebApp.handlers.get("/" + fhirPath + "/" + routeResourceType + "/:id/_history", async (req, res) => {
          if(get(Meteor, 'settings.private.debug') === true) { console.log('GET /' + fhirPath + '/' + routeResourceType + '/' + req.params.id + '/_history'); }
  
          process.env.TRACE && console.log('req', req);
          logToInboundQueue(req);

          res.setHeader("content-type", 'application/fhir+json;charset=utf-8');
          res.setHeader("ETag", fhirVersion);

          const remainingRequests = await limiter.removeTokens(1);
          if (remainingRequests < 0) {
            res.status(429).json({message: "429 Too Many Requests - your IP is being rate limited"});
          } else {
            let authorizationContext = await parseUserAuthorization(req)
            if (isAuthorized(authorizationContext)){
              if(get(Meteor, 'settings.private.debug') === true) { console.log('Security checks completed'); }
  
              let record;
              let lastModified = moment().subtract(100, 'years');
              let hasVersionedLastModified = false;
  
              process.env.DEBUG && console.log('req.query', req.query)
              process.env.DEBUG && console.log('req.params', req.params)
  
              let records = await Collections[collectionName].find({id: req.params.id});
              if(get(Meteor, 'settings.private.trace') === true) { console.log('records', records); }
  
              // and generate a Bundle payload
              payload = [];
  
              records.forEach(function(recordVersion){
                payload.push({
                  fullUrl: "Organization/" + get(recordVersion, 'id'),
                  resource: RestHelpers.prepForFhirTransfer(recordVersion),
                  request: {
                    method: "GET",
                    url: '/' + fhirPath + '/' + routeResourceType + '/' + req.params.id + '/_history'
                  },
                  response: {
                    status: "200"
                  }
                });
                if(get(recordVersion, 'meta.lastUpdated')){
                  hasVersionedLastModified = true;
                  if(moment(get(recordVersion, 'meta.lastUpdated')) > lastModified){
                    lastModified = moment(get(recordVersion, 'meta.lastUpdated'));
                  }
                } 
              });  
  
              res.setHeader("content-type", 'application/fhir+json');
              if(hasVersionedLastModified){
                res.setHeader("Last-Modified", lastModified.toDate());
              }
              
              // res.setHeader('Content-type', 'application/fhir+json;charset=utf-8');
  
              // Success
              res.status(200).json(Bundle.generate(payload, "history"));
            }  
          }
        });      
      }

      // Update-create 
      // https://www.hl7.org/fhir/http.html#create
      if(serverRouteManifest[routeResourceType].interactions.includes('create')){
        WebApp.handlers.post("/" + fhirPath + "/" + routeResourceType, async (req, res) => {
          if(get(Meteor, 'settings.private.debug') === true) { console.log('================================================================'); }
          if(get(Meteor, 'settings.private.debug') === true) { console.log('POST /' + fhirPath + '/' + routeResourceType); }

          process.env.TRACE && console.log('req', req);
          logToInboundQueue(req);
          
          res.setHeader('Content-type', 'application/fhir+json;charset=utf-8');
          res.setHeader("ETag", fhirVersion);          

          const remainingRequests = await limiter.removeTokens(1);
          if (remainingRequests < 0) {
            res.status(429).json({message: "429 Too Many Requests - your IP is being rate limited"});
          } else {
            let accessTokenStr = get(req, 'params.access_token') || get(req, 'params.access_token');

            let authorizationContext = await parseUserAuthorization(req)
            if (isAuthorized(authorizationContext)){
  
              //------------------------------------------------------------------------------------------------
  
              if(get(req, 'headers.x-provenance')){
                let xProvenance = JSON.parse(get(req, 'headers.x-provenance'));
  
                if(Collections["Provenances"]){
                  console.log("Received an x-provenance record.  Writing it to the Provenances collection....");
                  await Collections["Provenances"].insertAsync(xProvenance);
                }
              }
  
              if (get(req, 'body')) {
                newRecord = req.body;
                if(get(Meteor, 'settings.private.trace') === true) { console.log('req.body', req.body); }
                
  
                let newlyAssignedId = Random.id();
  
                // https://www.hl7.org/fhir/http.html#create            
  
                if(get(newRecord, 'meta.versionId')){
                  set(newRecord, 'meta.versionId', (parseInt(newRecord.meta.versionId) + 1).toString());
                } else {
                  set(newRecord, 'meta.versionId', "1");
                }
                if(get(newRecord, 'meta.lastUpdated')){
                  set(newRecord, 'meta.lastUpdated', new Date());
                }
  
  
                if(get(newRecord, 'resourceType')){
                  if(get(newRecord, 'resourceType') !== routeResourceType){
                    // Unsupported Media Type
                    res.status(415).json({message: 'Wrong FHIR Resource.  Please check your endpoint.'});
                  } else {
                    newRecord.resourceType = routeResourceType;
                    newRecord._id = newlyAssignedId;
  
                    if(!get(newRecord, 'id')){
                      newRecord.id = newlyAssignedId;
                    }
                    
      
                    newRecord = RestHelpers.toMongo(newRecord);
                    newRecord = RestHelpers.prepForUpdate(newRecord);
      
                    if(get(Meteor, 'settings.private.debug') === true) { console.log('newRecord', newRecord); }
      
                    
                    if(! await Collections[collectionName].findOneAsync({id: newlyAssignedId})){
                      if(get(Meteor, 'settings.private.debug') === true) { console.log('No ' + routeResourceType + ' found.  Creating one.'); }
      
                      await Collections[collectionName].insertAsync(newRecord, schemaValidationConfig, async function(error, result){
                        if (error) {
                          if(get(Meteor, 'settings.private.trace') === true) { console.log('PUT /fhir/MeasureReport/' + req.params.id + "[error]", error); }
      
                          // Bad Request
                          res.status(400).json({message: error.message});
                        }
                        if (result) {
                          if(get(Meteor, 'settings.private.trace') === true) { console.log('result', result); }
                          res.setHeader("Last-Modified", new Date());
                          res.setHeader("ETag", fhirVersion);
  
                          // Now that the record is written; if it was a Provenance, lets check the payload
                          if(collectionName === "Provenances"){
  
                            let xProvenanceData = get(newRecord, 'signature[0].data');
  
                            let decodedProvenanceData = jwt.decode(xProvenanceData, {complete: true})
                            console.log('decodedProvenanceData', decodedProvenanceData);
                
                            let provenancePayloadResourceType = get(decodedProvenanceData, 'payload.resourceType');
                            console.log('provenancePayload.resourceType', provenancePayloadResourceType);
                
                            let provenancePayload = get(decodedProvenanceData, 'payload');
                            console.log('provenancePayload.payload', provenancePayload);
                
                            if(provenancePayloadResourceType){
                              let collectionName = FhirUtilities.pluralizeResourceName(provenancePayloadResourceType)
                              if(Collections[collectionName]){
                                console.log('Adding a new ' + provenancePayloadResourceType + ' which was found in the x-provenance header payload.')
                                if(! await Collections[collectionName].findOneAsync({id: provenancePayload.id})){
                                  await Collections[collectionName].insertAsync(provenancePayload)
                                }
                              }
                            }
                          }
  
                          // Re-enable the following for Abacus & SANER
                          // But document accordingly, and need to include Provenance stamping
                          // res.setHeader("MeasureReport", fhirPath + "/MeasureReport/" + result);
                          // res.setHeader("Location", "/MeasureReport/" + result);
      
                          let resourceRecords = await Collections[collectionName].find({id: newlyAssignedId});
                          let payload = [];
      
                          resourceRecords.forEach(function(record){
                            payload.push(RestHelpers.prepForFhirTransfer(record));
                          });
                          
                          if(get(Meteor, 'settings.private.trace') === true) { console.log("payload", payload); }
      
                          // created!
                          res.status(201).json(Bundle.generate(payload));
                        }
                      }); 
                    } else {
                      // Already Exists
                      res.status(412).json();
                    }
                  } 
                }
              } else {
                // No body; Unprocessable Entity
                res.status(422).json();
              }
            } else {
              // Unauthorized
              res.status(401).json();
            }            
          }
        });
      }

      // Update 
      // https://www.hl7.org/fhir/http.html#update
      if(serverRouteManifest[routeResourceType].interactions.includes('update')){
        WebApp.handlers.put("/" + fhirPath + "/" + routeResourceType + "/:id", async (req, res) => {
          if(get(Meteor, 'settings.private.debug') === true) { console.log('================================================================'); }
          if(get(Meteor, 'settings.private.debug') === true) { console.log('PUT /' + fhirPath + '/' + routeResourceType + '/' + req.params.id); }
        
          process.env.TRACE && console.log('req', req);
          logToInboundQueue(req);
          
          res.setHeader('Content-type', 'application/fhir+json;charset=utf-8');
          res.setHeader("ETag", fhirVersion);

          const remainingRequests = await limiter.removeTokens(1);
          if (remainingRequests < 0) {
            res.status(429).json({message: "429 Too Many Requests - your IP is being rate limited"});
          } else {
            let accessTokenStr = (req.params && req.params.access_token) || (req.query && req.query.access_token);
          
            let authorizationContext = await parseUserAuthorization(req)
            
            if (isAuthorized(authorizationContext)){
        
              if (req.body) {
                let newRecord = cloneDeep(req.body);
        
                if(get(Meteor, 'settings.private.trace') === true) { console.log('req.body', req.body); }
        
                newRecord.resourceType = routeResourceType;
                newRecord = RestHelpers.toMongo(newRecord);
        
        
                newRecord = RestHelpers.prepForUpdate(newRecord);
        
                if(get(Meteor, 'settings.private.debug') === true) { console.log('-----------------------------------------------------------'); }
                if(get(Meteor, 'settings.private.debug') === true) { console.log('Received a new record to PUT into the database', JSON.stringify(newRecord, null, 2));             }
        

                if(typeof Collections[collectionName] === "object"){
                  let numRecordsToUpdate = await Collections[collectionName].find({id: req.params.id}).countAsync();

                  if(get(Meteor, 'settings.private.debug') === true) { console.log('Number of records found matching the id: ', numRecordsToUpdate); } 
                  
                  let newlyAssignedId;
          
                  if(numRecordsToUpdate > 0){
                    if(get(Meteor, 'settings.private.debug') === true) { console.log('Found existing records; this is an update interaction, not a create interaction'); }
                    if(get(Meteor, 'settings.private.debug') === true) { console.log(numRecordsToUpdate + ' records found...'); }
    
                    // don't need to send internal _ids
                    unset(newRecord, '_id');

                    // versioned, means we have prior versions and need to add a new one
                    if(get(Meteor, 'settings.private.fhir.rest.' + routeResourceType + ".versioning") === "versioned"){
                    // if(get(Meteor, 'settings.private.recordVersioningEnabled')){
                      if(get(Meteor, 'settings.private.debug') === true) { console.log('Versioned Collection: Trying to add another versioned record to the main Task collection.') }
    
                      if(get(Meteor, 'settings.private.debug') === true) { console.log("Lets set a new version ID"); }
                      if(!get(newRecord, 'meta.versionId')){
                        set(newRecord, 'meta.versionId', (numRecordsToUpdate + 1).toString());  
                      }
        
                      if(get(Meteor, 'settings.private.debug') === true) { console.log("And add it to the history"); }
                      newlyAssignedId = await Collections[collectionName].insertAsync(newRecord, schemaValidationConfig, async function(error, resultId){
                        if (error) {
                          if(get(Meteor, 'settings.private.trace') === true) { console.log('PUT /fhir/' + routeResourceType + '/' + req.params.id + "[error]", error); }
            
                          // Bad Request
                          res.status(400).json({message: error.message});
                        }
                        if (resultId) {
                          if(get(Meteor, 'settings.private.trace') === true) { console.log('resultId', resultId); }

                          // this MeasureReport header was used in the SANER specification, I think
                          // don't remove, but it needs a conditional statement so it's not included on everything else
                          // res.setHeader("MeasureReport", fhirPath + "/" + routeResourceType + "/" + resultId);
                          res.setHeader("Last-Modified", new Date());
                          
            
                          let updatedRecord = await Collections[collectionName].findOneAsync({_id: resultId});
            
                          if(get(Meteor, 'settings.private.trace') === true) { console.log("updatedRecord", updatedRecord); }
            
                          let operationOutcome = {
                            "resourceType": "OperationOutcome",
                            "issue" : [{ // R!  A single issue associated with the action
                              "severity" : "information", // R!  fatal | error | warning | information
                              "code" : "informational", // R!  Error or warning code
                              "details" : { 
                                "text": resultId,
                                "coding": [{
                                  "system": "http://terminology.hl7.org/CodeSystem/operation-outcome",
                                  "code": "MSG_UPDATED",
                                  "display": "existing resource updated",
                                  "userSelected": false
                                }]
                              }
                            }]
                          }

                          if(updatedRecord){
                            // success!
                            res.status(200).json(RestHelpers.prepForFhirTransfer(updatedRecord));
                          } else {
                            // success!
                            res.status(400).json();
                          }
                        }
                      });    
                    } else {
                      console.log("There's existing records, but we're not a versioned collection");
                      console.log("So we just need to update the record");

                      if(get(Meteor, 'settings.private.debug') === true) { console.log('Nonversioned Collection: Trying to update the existing record.') }
                        newlyAssignedId = await Collections[collectionName].updateAsync({id: req.params.id}, {$set: newRecord },  schemaValidationConfig, async function(error, result){
                        if (error) {
                          if(get(Meteor, 'settings.private.trace') === true) { console.log('PUT /fhir/' + routeResourceType + '/' + req.params.id + "[error]", error); }
            
                          // Bad Request
                          res.status(400).json({message: error.message});
                        }
                        if (result) {
                          if(get(Meteor, 'settings.private.trace') === true) { console.log('result', result); }
                          // keep the following; needed for SANER
                          // needs a conditional clause
                          // res.setHeader("MeasureReport", fhirPath + "/" + routeResourceType + "/" + result);
                          res.setHeader("Last-Modified", new Date());
                          res.setHeader("ETag", fhirVersion);
            
                          // this isn't a versioned collection, so we expect only a single record
                          let updatedRecord = await Collections[collectionName].findOneAsync({id: req.params.id});
            
                          if(updatedRecord){
                            if(get(Meteor, 'settings.private.trace') === true) { console.log("updatedRecord", updatedRecord); }
            
                            // success!
                            res.status(200).json(RestHelpers.prepForFhirTransfer(updatedRecord));
                          } else {
                            // success!
                            res.status(500).json({message: error.message});
                          }
                          
                        }
                      });
                    }
                    
                  // no existing records found, this is a create interaction
                  } else {        
                    if(get(Meteor, 'settings.private.debug') === true) { console.log('No matching records found.  Creating one.'); }
    
                    if(get(Meteor, 'settings.private.fhir.rest.' + routeResourceType + '.versioning') === "versioned"){
                      set(newRecord, 'meta.versionId', "1")
                    }

                    if(get(Meteor, 'settings.private.debug') === true) { console.log(newRecord); }
    
                    newlyAssignedId = await Collections[collectionName].insertAsync(newRecord, schemaValidationConfig, async function(error, resultId){
                      if (error) {
                        if(get(Meteor, 'settings.private.trace') === true) { console.log('PUT /fhir/' + routeResourceType + '/' + req.params.id + "[error]", error); }
          
                        // Bad Request
                        res.status(400).json({message: error.message});
                      }
                      if (resultId) {
                        if(get(Meteor, 'settings.private.trace') === true) { console.log('resultId', resultId); }
                        res.setHeader("MeasureReport", fhirPath + "/" + routeResourceType + "/" + resultId);
                        res.setHeader("Last-Modified", new Date());
                        res.setHeader("ETag", fhirVersion);
          
                        let updatedRecord = await Collections[collectionName].findOneAsync({_id: resultId});
          
                        // Created!                        
                        res.status(201).json(RestHelpers.prepForFhirTransfer(updatedRecord));
                      }
                    }); 
                   
                  }  
                } else {
                  console.log(collectionName + ' collection not found.')
                }
              } else {
                // no body; Unprocessable Entity
                res.status(422).json();
              }
            } else {
              // Unauthorized
              res.status(401).json();
            }
          }
        });
      }

      // Patch Interaction
      // https://www.hl7.org/fhir/http.html#update
      // https://stackoverflow.com/questions/31683075/how-to-do-a-deep-comparison-between-2-objects-with-lodash  

      if(serverRouteManifest[routeResourceType].interactions.includes('patch')){
        WebApp.handlers.patch("/" + fhirPath + "/" + routeResourceType + "/:id", async (req, res) => {
          process.env.DEBUG && console.log('================================================================'); 
          process.env.DEBUG && console.log('PATCH /' + fhirPath + '/' + routeResourceType + '/' + req.params.id); 
        
          process.env.TRACE && console.log('req', req);
          logToInboundQueue(req);

          res.setHeader('Content-type', 'application/fhir+json;charset=utf-8');
          res.setHeader("ETag", fhirVersion);

          const remainingRequests = await limiter.removeTokens(1);
          if (remainingRequests < 0) {
            res.status(429).json({message: "429 Too Many Requests - your IP is being rate limited"});
          } else {
            let accessTokenStr = (req.params && req.params.access_token) || (req.query && req.query.access_token);
        
            let authorizationContext = await parseUserAuthorization(req)
            if (isAuthorized(authorizationContext)){
  
              if (req.body) {
                let incomingRecord = cloneDeep(req.body);
        
                process.env.TRACE && console.log('req.body', req.body); 
        
                incomingRecord.resourceType = routeResourceType;
                incomingRecord = RestHelpers.toMongo(incomingRecord);
                incomingRecord = RestHelpers.prepForUpdate(incomingRecord);
        
                process.env.DEBUG && console.log('-----------------------------------------------------------'); 
                process.env.DEBUG && console.log('Received a new record to PATCH into the database', JSON.stringify(newRecord, null, 2));             
        
  
                if(typeof Collections[collectionName] === "object"){
                  let numRecordsToUpdate = await Collections[collectionName].find({id: req.params.id}).countAsync();
  
                  process.env.DEBUG && console.log('Number of records found matching the id: ', numRecordsToUpdate); 
                  
                  let newlyAssignedId;
          
                  if(numRecordsToUpdate > 1){
                    if(get(Meteor, 'settings.private.debug') === true) { console.log('Found existing records; this is an update interaction, not a create interaction'); }
                    if(get(Meteor, 'settings.private.debug') === true) { console.log(numRecordsToUpdate + ' records found...'); }
  
                    if(process.env.DEBUG){
                      console.log('req.query', req.query);
                      console.log('req.params', req.params);
                      console.log('req.body', req.body);  
                    }
                    
                    let setObjectPatch = {};
                    Object.keys(req.query).forEach(function(key){
                      setObjectPatch[key] = get(req.body, key);
                    })
  
                    
                    if(get(Meteor, 'settings.private.debug') === true) { console.log('setObjectPatch', setObjectPatch); }
                    let result = await Collections[collectionName].updateAsync({id: req.params.id}, {$set: setObjectPatch}, {multi: true});
  
                    // Unauthorized
                    res.status(200).json({message: result + " record(s) updated."});
  
                  } else if (numRecordsToUpdate === 1) {
                    if(get(Meteor, 'settings.private.debug') === true) { console.log('Trying to patch an existing record.') }
  
                    let currentRecord = await Collections[collectionName].findOneAsync({id: req.params.id});
  
                    delete currentRecord._document;
  
                    // let patchedRecord = Object.assign(currentRecord, incomingRecord);                  
  
                    let setObjectPatch = {};
                    Object.keys(req.query).forEach(function(key){
                      setObjectPatch[key] = get(req.body, key);
                    })
                    if(get(Meteor, 'settings.private.debug') === true) { console.log('setObjectPatch', setObjectPatch); }
  
                    
                    await Collections[collectionName].updateAsync({_id: setObjectPatch._id}, {$set: setObjectPatch});
  
                    delete setObjectPatch._document;
                    delete setObjectPatch._id;
  
                    res.status(204).json(setObjectPatch);
                  } else if (numRecordsToUpdate === 0){
                    res.status(404).json();
                  }
                } else {
                  console.log(collectionName + ' collection not found.')
                  res.status(500).json({message: collectionName + ' collection not found.'});
                }
              } else {
                // no body; Unprocessable Entity
                res.status(422).json();
              }
            } else {
              // Unauthorized
              res.status(401).json();
            }            
          }
        });
      } else {
        WebApp.handlers.patch("/" + fhirPath + "/" + routeResourceType + "/:id", async (req, res) => {
          res.setHeader('Content-type', 'application/fhir+json;charset=utf-8');
          res.setHeader("ETag", fhirVersion);
          
          res.status(501).json();
        });
      }

      // Delete Interaction
      // https://www.hl7.org/fhir/http.html#delete
      if(serverRouteManifest[routeResourceType].interactions.includes('delete')){
        WebApp.handlers.delete("/" + fhirPath + "/" + routeResourceType + "/:id", async (req, res) => {
          if(get(Meteor, 'settings.private.debug') === true) { console.log('================================================================'); }
          if(get(Meteor, 'settings.private.debug') === true) { console.log('DELETE /' + fhirPath + '/' + routeResourceType + '/' + req.params.id); }

          process.env.TRACE && console.log('req', req);
          logToInboundQueue(req);
          
          res.setHeader('Content-type', 'application/fhir+json;charset=utf-8');
          res.setHeader("ETag", fhirVersion);     
          
          const remainingRequests = await limiter.removeTokens(1);
          if (remainingRequests < 0) {
            res.status(429).json({message: "429 Too Many Requests - your IP is being rate limited"});
          } else {
            let authorizationContext = await parseUserAuthorization(req)
            if (isAuthorized(authorizationContext)){
              if(get(Meteor, 'settings.private.trace') === true) { 
                console.log('Searching ' + collectionName + ' for ' + req.params.id, Collections[collectionName].find({_id: req.params.id}).countAsync()); 
              }
  
              if (await Collections[collectionName].find({id: req.params.id}).countAsync() === 0) {
  
                // Not Found
                res.status(404).json();
  
              } else {
                Collections[collectionName].remove({id: req.params.id}, function(error, result){
                  if (result) {
                    // No Content
                    res.status(204).json();
                  }
                  if (error) {
                    // Conflict
                    res.status(409).json();
                  }
                });
              }
            } else {
              // Unauthorized
              res.status(401).json();
            }            
          }
        });
      }  else {
        WebApp.handlers.delete("/" + fhirPath + "/" + routeResourceType + "/:id", async (req, res) => {
          res.setHeader('Content-type', 'application/fhir+json;charset=utf-8');
          res.setHeader("ETag", fhirVersion);
          
          res.status(501).json();
        });
      }

      // Search Interaction
      // https://www.hl7.org/fhir/http.html#search
      if(serverRouteManifest[routeResourceType].search){
        WebApp.handlers.post("/" + fhirPath + "/" + routeResourceType + "/:param", async (req, res) => {
          if(get(Meteor, 'settings.private.debug') === true) { console.log('================================================================'); }
          if(get(Meteor, 'settings.private.debug') === true) { console.log('POST /' + fhirPath + '/' + routeResourceType + '/' + JSON.stringify(req.query)); }
          
          logToInboundQueue(req);

          process.env.DEBUG && console.log('---------------------------------------')
          process.env.DEBUG && console.log('Checking for chained queries (POST)....')
          process.env.DEBUG && console.log('req.query', req.query);

          const remainingRequests = await limiter.removeTokens(1);
          if (remainingRequests < 0) {
            res.status(429).json({message: "429 Too Many Requests - your IP is being rate limited"});
          } else {
            Object.keys(req.query).forEach(function(key){
              let result = 0;
              let queryParts = key.split(".");
              if(Array.isArray(queryParts)){
                result = queryParts.length;
                if(queryParts.length === 2){
                  
                }
              }
  
              return result;
            })
  
            res.setHeader('Content-type', 'application/fhir+json;charset=utf-8');
            res.setHeader("ETag", fhirVersion);
  
            let authorizationContext = await parseUserAuthorization(req)
            if (isAuthorized(authorizationContext)){
              let matchingRecords = [];
              let payload = [];
              let searchLimit = 1;
  
              if (get(req, 'query._count')) {
                searchLimit = parseInt(get(req, 'query._count'));
              }
  
              if (req.params.param.includes('_search')) {
  
                let databaseQuery = RestHelpers.generateMongoSearchQuery(req.query, routeResourceType);
                if(get(Meteor, 'settings.private.debug') === true) { console.log('Collections[collectionName].databaseQuery', databaseQuery); }
  
                matchingRecords = await Collections[collectionName].find(databaseQuery, {limit: searchLimit}).fetch();
                console.log('matchingRecords', matchingRecords);
                
                let payload = [];
  
                matchingRecords.forEach(function(record){
  
                  // check for security labels; otherwise assume normal access patterns
                  let recordSecurityLevel = get(record, 'meta.security[0].display', 'normal');
  
                  let accessGranted = false;
                  let permission;
  
                  if (get(Meteor, 'settings.private.fhir.disableAccessControl') === true) {
                    accessGranted = true;
                  } else {
                    permission = acl.can(userRole).execute('access').with({'securityLevel': recordSecurityLevel}).sync().on(routeResourceType);
                    console.log('permission.granted: ' + permission.granted);
  
                    accessGranted = permission.granted;
                  }
  
                  if(accessGranted){                  
                      payload.push({
                      fullUrl: routeResourceType + "/" + get(record, 'id'),
                      resource: RestHelpers.prepForFhirTransfer(record),
                      request: {
                        method: "POST",
                        url: '/' + fhirPath + '/' + routeResourceType + '/' + JSON.stringify(req.query)
                      },
                      response: {
                        status: "200"
                      }
                    });
                  }                
                });
  
                console.log('payload', payload);
  
                // Success
                res.status(200).json(Bundle.generate(payload));
  
              //==============================================================================
              // this is operator logic, and will probably need to go into a switch statement
  
              // post /Organization/$match
              } else if (req.params.param.includes('$match')) {
                console.log("$MATCH!!!!");
  
                console.log('req.body.name', get(req, 'body.name'));
  
                let generatedQuery = {};
                let weighting = 0;
  
                // full name - weighting: .50
                if(typeof get(req, 'body.name') === "string"){
                  weighting = .5;
                  generatedQuery["name"] = {$regex: get(req, 'body.name')}
                }               
  
                // full name - weighting: .50
                if(typeof get(req, 'body.name[0].text') === "string"){
                  weighting = .5;
                  generatedQuery["name.text"] = {$regex: get(req, 'body.name[0].text')}
                }               
  
                // NPI number - weighting: .99
                if(typeof get(req, 'body.identifier[0].value') === "string"){
                  weighting = .99;
                  generatedQuery["identifier.value"] = get(req, 'body.identifier[0].value')
                } 
                
  
                console.log('generatedQuery', generatedQuery);
                matchingRecords = await Collections[collectionName].find(generatedQuery).fetch();
                console.log('matchingRecords.length', matchingRecords.length);
  
                let payload = [];
  
                if(matchingRecords.length === 0 ){
                  res.status(400).json({
                    "resourceType": "OperationOutcome",
                    "severity": "warning",
                    "code": "invalid",
                    "details": {
                      "text": "No Resource found matching the query",
                      "coding": {
                        "system": "http://terminology.hl7.org/CodeSystem/operation-outcome",
                        "value": "MSG_NO_MATCH",
                        "display": "No Resource found matching the query"
                      }
                    }                
                  });
                } else {
                  matchingRecords.forEach(function(record){
                    // console.log('record', get(record, 'name'))
  
                    record.extension = [{
                      url: "https://build.fhir.org/ig/HL7/fhir-directory-attestation/match-quality",
                      valueDecimal: weighting
                    }];
  
                    delete record.text;
  
  
                    payload.push({
                      fullUrl: routeResourceType + "/" + get(record, 'id'),
                      resource: RestHelpers.prepForFhirTransfer(record),
                      request: {
                        method: "POST",
                        url: '/' + fhirPath + '/' + routeResourceType + '/' + JSON.stringify(req.query)
                      },
                      response: {
                        status: "200"
                      }
                    });
                  });
    
                  console.log('payload', payload);
  
                  let payloadBundle = Bundle.generate(payload);
                  
    
                  // Success
                  res.status(200).json(payloadBundle)
                }
              } 

            } else {
              // Unauthorized
              res.status(401).json()
            }            
          }
        });

        // Search Interaction
        WebApp.handlers.get("/" + fhirPath + "/" + routeResourceType + "/:param", async (req, res) => {
          if(get(Meteor, 'settings.private.debug') === true) { console.log('-----------------------------------------------------------------------------'); }
          if(get(Meteor, 'settings.private.debug') === true) { console.log('??? GET /' + fhirPath + '/' + routeResourceType + '?' + JSON.stringify(req.query)); }
          if(get(Meteor, 'settings.private.debug') === true) { console.log('params', req.params); }


          logToInboundQueue(req);
          
          process.env.DEBUG && console.log('--------------------------------------')
          process.env.DEBUG && console.log('Checking for chained queries (GET)....')
          process.env.DEBUG && console.log('req.query', req.query);
          
          const remainingRequests = await limiter.removeTokens(1);
          if (remainingRequests < 0) {
            res.status(429).json({message: "429 Too Many Requests - your IP is being rate limited"})
          } else {
            Object.keys(req.query).forEach(function(key){
              let result = 0;
              let queryParts = key.split(".");
              if(Array.isArray(queryParts)){
                result = queryParts.length;
                if(queryParts.length === 2){
                  
                }
              }
  
              return result;
            })
  
            res.setHeader('Content-type', 'application/fhir+json;charset=utf-8');
  
            let authorizationContext = await parseUserAuthorization(req)
            if (isAuthorized(authorizationContext)){
  
              let resourceRecords = [];
  
              if (req.params.param.includes('_search')) {
                let searchLimit = 1;
                if (get(req, 'query._count')) {
                  searchLimit = parseInt(get(req, 'query._count'));
                }
                let databaseQuery = RestHelpers.generateMongoSearchQuery(req.query, routeResourceType);
                if(get(Meteor, 'settings.private.debug') === true) { console.log('Generated the following query for the ' + routeResourceType + ' collection.', databaseQuery); }
  
                resourceRecords = await Collections[collectionName].find(databaseQuery, {limit: searchLimit}).fetch();
  
                let payload = [];
  
                resourceRecords.forEach(function(record){
  
                  // check for security labels; otherwise assume normal access patterns
                  let recordSecurityLevel = get(record, 'meta.security[0].display', 'normal');
                  
                  let accessGranted = false;
                  let permission;
  
                  if (get(Meteor, 'settings.private.fhir.disableAccessControl') === true) {
                    accessGranted = true;
                  } else {
                    permission = acl.can(userRole).execute('access').with({'securityLevel': recordSecurityLevel}).sync().on(routeResourceType);
                    console.log('permission.granted: ' + permission.granted);
  
                    accessGranted = permission.granted;
                  }
  
                  if(accessGranted){
                    payload.push({
                      fullUrl: routeResourceType + "/" + get(record, 'id'),
                      resource: RestHelpers.prepForFhirTransfer(record)
                    });  
                  }                                
                });
              }
  
              // Success
              res.status(200).json(Bundle.generate(payload))

            } else {
              // Unauthorized
              res.status(401).json()
            } 
          }
        });
      }

      
    }
  });

  console.log('FHIR Server is online.');
} else {
  console.log('FHIR Server is offline.  Settings file and route manifest not available.');
  WebApp.handlers.get("/" + fhirPath + "/" + routeResourceType, async (req, res) => {
    res.status(501).json();
  });
}
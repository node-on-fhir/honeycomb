

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { fetch } from 'meteor/fetch';
import { get, has, set } from 'lodash';

import forge from 'node-forge';
import base64url from 'base64-url';

let pki = forge.pki;

import jwt from 'jsonwebtoken';

import ndjsonParser from 'ndjson-parse';

let Endpoints;
Meteor.startup(function(){
    Endpoints = Meteor.Collections.Endpoints;
})

// import {
//     FhirUtilities,
//     AllergyIntolerances,
//     Bundles,
//     CarePlans,
//     CodeSystems,
//     Conditions,
//     Communications,
//     CommunicationRequests,
//     CommunicationResponses,
//     Devices,
//     Encounters,
//     Endpoints,
//     Immunizations,
//     Lists,
//     Locations,
//     Medications,
//     MedicationOrders,
//     MedicationStatements,
//     MessageHeaders,
//     Measures,
//     MeasureReports,
//     Organizations,
//     Observations,
//     Patients,
//     Practitioners,
//     Procedures,
//     Questionnaires,
//     QuestionnaireResponses,
//     SearchParameters,
//     StructureDefinitions,
//     ValueSets,
//     Tasks





// //---------------------------------------------------------------------------
// // Collections

// // this is a little hacky, but it works to access our collections.
// // we use to use Mongo.Collection.get(collectionName), but in Meteor 1.3, it was deprecated
// // we then started using window[collectionName], but that only works on the client
// // so we now take the window and

// let Collections = {};

// if(Meteor.isClient){
//   Collections = window;
// }
// if(Meteor.isServer){
//   Collections.AllergyIntolerances = AllergyIntolerances;
//   Collections.Bundles = Bundles;
//   Collections.CarePlans = CarePlans;
//   Collections.Conditions = Conditions;
//   Collections.Communications = Communications;
//   Collections.CommunicationRequests = CommunicationRequests;
//   Collections.CommunicationResponses = CommunicationResponses;
//   Collections.Devices = Devices;
//   Collections.Encounters = Encounters;
//   Collections.Immunizations = Immunizations;
//   Collections.Lists = Lists;
//   Collections.Locations = Locations;
//   Collections.Medications = Medications;
//   Collections.MedicationOrders = MedicationOrders;
//   Collections.MedicationStatements = MedicationStatements;
//   Collections.MessageHeaders = MessageHeaders;
//   Collections.Measures = Measures;
//   Collections.MeasureReports = MeasureReports;
//   Collections.Organizations = Organizations;
//   Collections.Observations = Observations;
//   Collections.Patients = Patients;
//   Collections.Practitioners = Practitioners;
//   Collections.Procedures = Procedures;
//   Collections.Questionnaires = Questionnaires;
//   Collections.QuestionnaireResponses = QuestionnaireResponses;
//   Collections.Tasks = Tasks;
// }

let UdapUtilities = {
    parseCertAttributes: function(certActor){
        let result = "";
        if(has(certActor, 'attributes')){
          if(Array.isArray(certActor.attributes)){
            certActor.attributes.forEach(function(attribute){
              result = result + "  " + attribute["shortName"] + "=" + attribute["value"]
            })
          }
        }
        return result;
    }
}


if(Meteor.isServer){



    Meteor.methods({
        syncTefcaEndpoints: function(){

            console.log('Synchronizing TEFCA endpoints...')

            // CERNER ENDPOINTS - PATIENT LAUNCH
            // https://github.com/oracle-samples/ignite-endpoints/blob/main/millennium_patient_r4_endpoints.json

            // CERNER ENDPOINTS - PROVIDER LAUNCH
            // https://github.com/oracle-samples/ignite-endpoints/blob/main/millennium_provider_r4_endpoints.json

            // EPIC ENDPOINTS
            // https://open.epic.com/Endpoints/R4

            let tefcaEndpointUrls = [
                "https://open.epic.com/Endpoints/R4",
                "https://raw.githubusercontent.com/oracle-samples/ignite-endpoints/main/millennium_patient_r4_endpoints.json",
                "https://raw.githubusercontent.com/oracle-samples/ignite-endpoints/main/millennium_provider_r4_endpoints.json"
            ]

            tefcaEndpointUrls.forEach(async function(url){

                return await fetch(url, {
                    method: 'GET',
                }).then(response => response.json())
                .then(result => {
                    console.log('Success:', result);

                    // received endpoints; parse them and put them in the Endpoints collection


                    if(Array.isArray(result.entry)){
                        result.entry.forEach(async function(entry){
                            console.log('entry', entry);
                            if(has(entry, 'resource')){
                                console.log('entry.resource', entry.resource);
                                if(get(entry, 'resource.resourceType') === "Endpoint"){

                                    let endpoint = get(entry, 'resource');
                                    if(!get(endpoint, 'managingOrganization.display')){
                                        set(endpoint, 'managingOrganization.reference', "Organization/" + get(endpoint, 'contained[0].id'));
                                        set(endpoint, 'managingOrganization.display', get(endpoint, 'contained[0].name'));

                                        // set(endpoint, 'managingOrganization', {
                                        //     display: get(endpoint, 'contained[0].name'),
                                        //     reference: "Organization/" + get(endpoint, 'contained[0].id')
                                        // })
                                        // set(endpoint, 'address', get(endpoint, 'contained[0].address'))
                                    }

                                    endpoint.environmentType = [{
                                        text: "Production",
                                        coding: [{
                                            system: "http://hl7.org/fhir/endpoint-environment",
                                            code: "prod",
                                            display: "Production"
                                        }]
                                    }]

                                    endpoint.connectionType = [{
                                        text: "HL7 FHIR - R4",
                                        coding: [{
                                            system: "http://terminology.hl7.org/CodeSystem/endpoint-connection-type",
                                            code: "hl7-fhir-rest",
                                            display: "HL7 FHIR"
                                        }, {
                                            system: "http://hl7.org/fhir/FHIR-version",
                                            code: "4.0.1",
                                            display: "R4"
                                        }]
                                    }]

                                    set(endpoint, 'status', 'off');
                                    set(endpoint, 'name', get(endpoint, 'connectionType[0].text'));

                                    console.log('endpoint', endpoint);
                                    await Endpoints._collection.upsertAsync({id: get(endpoint, 'id')}, {$set: endpoint})
                                }
                            }
                        })
                    }

                    return result;
                }).catch((error) => {
                    console.warn('Error:', error);
                    // error checking if we have a corporate firewall
                    if(get(error, 'code') === "UNABLE_TO_GET_ISSUER_CERT_LOCALLY"){
                        console.error('You are likely running from behind a corporate firewall.  Try running with the NODE_CA_EXTRA_CERTS environment variable.  Or in a worst case scenario, try NODE_TLS_REJECT_UNAUTHORIZED=0')
                    }
                    return error;
                })

            });
        },
        sendSoftwareStatement: async function(options){
            console.log('fetchWellKnownUdap', options);

            // return await HTTP.post(options.url, {
            //     data: options.data
            // })

            const response = await fetch(options.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(options.data),
            });
            const body = await response.text();

            console.log(body);

            return body;

        },
        fetchPublicX509Key: async function(){
            console.log('fetchPublicX509Key');

            return get(Meteor, 'settings.private.x509.publicKey')
        },
        async fetchWellKnownUdap(wellKnownUdapUrl){
            console.log('fetchWellKnownUdap', wellKnownUdapUrl);


            // await HTTP.get(wellKnownUdapUrl, function(error, result){
            //     if(error){
            //         console.error('error', error)
            //     }
            //     if(result){
            //         console.log('result.data', result.data)
            //         return result.data;
            //     }
            // })

            const response = await fetch(wellKnownUdapUrl);
            const body = await response.text();

            console.log(body);

            return body;
        },
        async generateAndSignJwt(jwtObject){
            console.log("--------------------------------------------------------------")
            console.log("Signing JWT...")
            console.log("")
            console.log('jwtHeader', get(jwtObject, 'jwtHeader'));
            console.log('jwtPayload', get(jwtObject, 'jwtPayload'));
            console.log("")

            let result = {};

            let privateKeyPem = get(Meteor, 'settings.private.x509.privateKey');
            console.log('privateKeyPem')
            console.log(privateKeyPem)

            await jwt.sign(get(jwtObject, 'jwtPayload'), privateKeyPem.trim(), {
                algorithm: 'RS256',
                header: get(jwtObject, 'jwtHeader')
            }, function(error, token){
                if(error){
                    console.error('error', error)
                }
                if(token){
                    console.log('token', token)
                    result.token = token;
                }
            });
            console.log("--------------------------------------------------------------")
            return result;
        },
        decodeJwt: function(encodedJwt){
            console.log("--------------------------------------------------------------")
            console.log("Decoding JWT...")
            console.log("")
            console.log('encodedJwt', encodedJwt);
            console.log("")

            let decoded = jwt.decode(encodedJwt, {complete: true});
            console.log("decoded", decoded)
            console.log("--------------------------------------------------------------")
            return decoded;
        },
        decodeCertificate: function(encodedCertificate){
            console.log("--------------------------------------------------------------")
            console.log("Decoding certificate...")
            console.log("")
            process.env.DEBUG && console.log('encodedCertificate', encodedCertificate);
            process.env.DEBUG && console.log("")


            var cert = pki.certificateFromPem(encodedCertificate);
            console.log('cert', cert);

            console.log('cert.serialNumber:  ', cert.serialNumber)
            console.log('cert.subject:       ', UdapUtilities.parseCertAttributes(cert.subject))
            console.log('cert.issuer:        ', UdapUtilities.parseCertAttributes(cert.issuer))


            // let caStore = pki.createCaStore([]);
            // console.log('caStore', caStore);

            // caStore.addCertificate(encodedCertificate);
            // console.log('caStore', caStore);


            // // let issuerCert = caStore.getIssuer(encodedCertificate);
            // let issuerCert = caStore.getIssuer(encodedCertificate);
            // console.log('issuerCert', issuerCert);

            // let publicKey = pki.publicKeyFromPem(encodedCertificate);
            // console.log('publicKey', publicKey);

            // let decoded = jwt.decode(encodedJwt, {complete: true});
            // console.log("decoded", decoded)
            console.log("--------------------------------------------------------------")
            // return decoded;
            return cert;
        },
        getCertificateIssuer: function(decodedCertificate){
            console.log("--------------------------------------------------------------")
            console.log("Getting certificate issuer...")
            console.log("")
            console.log('decodedCertificate', decodedCertificate);
            console.log("")



            // let caStore = pki.createCaStore([]);
            // console.log('caStore', caStore);

            // caStore.addCertificate(encodedCertificate);
            // console.log('caStore', caStore);


            // // let issuerCert = caStore.getIssuer(encodedCertificate);
            // let issuerCert = caStore.getIssuer(encodedCertificate);
            // console.log('issuerCert', issuerCert);

            // let publicKey = pki.publicKeyFromPem(encodedCertificate);
            // console.log('publicKey', publicKey);

            // let decoded = jwt.decode(encodedJwt, {complete: true});
            // console.log("decoded", decoded)
            console.log("--------------------------------------------------------------")
            // return decoded;
            return cert;
        },
        generateCertificate: function(){
            console.log("Generate certificate...")

            let privateKeyPem = get(Meteor, 'settings.private.x509.privateKey');
            let publicKeyPem = get(Meteor, 'settings.private.x509.publicKey');

            if(privateKeyPem){

                let privateKey = pki.privateKeyFromPem(privateKeyPem)
                let publicKey = pki.publicKeyFromPem(publicKeyPem)

                var certificatePem = "";

                console.log('privateKey', privateKey)
                console.log('publicKey', publicKey)

                let cert = pki.createCertificate();

                cert.publicKey = publicKey;
                cert.serialNumber = '01';
                cert.validity.notBefore = new Date();
                cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

                var attrs = [{
                    name: 'commonName',
                    value: 'example.org' // QWERTY - removed domain
                    }, {
                    name: 'countryName',
                    value: 'US'
                    }, {
                    shortName: 'ST',
                    value: 'Illinois'
                    }, {
                    name: 'localityName',
                    value: 'Chicago'
                    }, {
                    name: 'organizationName',
                    value: 'Example Organization' // QWERTY - removed organizationName
                    }, {
                    shortName: 'OU',
                    value: 'EXAMPLE' // QWERTY - removed OU
                }];
                // cert.setSubject(attrs);
                cert.setIssuer(attrs);
                cert.sign(privateKey);

                console.log('cert', cert);

                certificatePem = pki.certificateToPem(cert);
                console.log('certificatePem', certificatePem)
            } else {
                console.error('No private key found in settings.private.x509.privateKey')
            }

            return certificatePem;
        },
    })
}

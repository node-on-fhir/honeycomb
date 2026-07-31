// imports/collections/ConnectedSources.js
//
// Provenance record for each EHR a user has connected via the SMART
// standalone patient launch (Patient Records Connect). NO TOKENS are ever
// stored here — access tokens live only in the in-memory Meteor.EhrTokenVault
// for the duration of a pull and are discarded (campaign constraint: no token
// persistence, no refresh in v1).
//
// shape: { _id, userId, endpointId, vendor, fhirBaseUrl, patientFhirId,
//          lastConnectedAt,
//          lastPull: { resourceCounts, deniedResourceTypes, startedAt,
//                      finishedAt, ok, error, mode: '$everything'|'uscdi-sweep' },
//          status: 'connected' | 'reauth_required' | 'error' }

import { Mongo } from 'meteor/mongo';

export const ConnectedSources = new Mongo.Collection('ConnectedSources');

export default ConnectedSources;

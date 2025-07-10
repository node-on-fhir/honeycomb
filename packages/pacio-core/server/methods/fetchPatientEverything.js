// /packages/pacio-core/server/methods/fetchPatientEverything.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';
import { fetch } from 'meteor/fetch';
import moment from 'moment';

let FhirUtilities;
Meteor.startup(function(){
  FhirUtilities = Meteor.FhirUtilities;
});

// Helper function to process a single bundle
async function processBundleEntries(bundle, resourceCounts, totalProcessed) {
  let resourcesProcessed = 0;
  let patientResource = null;
  
  if (bundle.entry && Array.isArray(bundle.entry)) {
    for (const entry of bundle.entry) {
      const resource = entry.resource;
      
      if (!resource || !resource.resourceType) {
        console.warn('Skipping entry without resource');
        continue;
      }
      
      // Track resource counts
      resourceCounts[resource.resourceType] = (resourceCounts[resource.resourceType] || 0) + 1;
      
      // Handle Patient resource specially
      if (resource.resourceType === 'Patient') {
        patientResource = resource;
        
        // Get the collection
        const PatientCollection = await global.Collections.Patients;
        if (PatientCollection) {
          // Check if patient exists
          const existingPatient = await PatientCollection.findOneAsync({ id: resource.id });
          
          if (existingPatient) {
            // Update existing patient
            await PatientCollection.updateAsync(
              { id: resource.id },
              { $set: resource }
            );
            console.log('Updated patient:', resource.id);
          } else {
            // Insert new patient
            await PatientCollection.insertAsync(resource);
            console.log('Inserted new patient:', resource.id);
          }
        }
      } else {
        // Handle other resources
        const collectionName = resource.resourceType + 's';
        const Collection = await global.Collections[collectionName];
        
        if (Collection) {
          try {
            // Check if resource exists
            const existingResource = await Collection.findOneAsync({ id: resource.id });
            
            if (existingResource) {
              // Update existing resource
              await Collection.updateAsync(
                { id: resource.id },
                { $set: resource }
              );
            } else {
              // Insert new resource
              await Collection.insertAsync(resource);
            }
            
            resourcesProcessed++;
          } catch (err) {
            console.error(`Error processing ${resource.resourceType} ${resource.id}:`, err);
          }
        } else {
          console.warn(`No collection found for resource type: ${resource.resourceType}`);
        }
      }
    }
  }
  
  return { resourcesProcessed, patientResource };
}

// Helper function to fetch and process all pages
async function fetchAllPages(initialUrl, includeDetails = false) {
  let currentUrl = initialUrl;
  let pageNumber = 1;
  let totalEntries = 0;
  let totalProcessed = 0;
  let patientResource = null;
  const resourceCounts = {};
  const resourceDetails = [];
  const allEntries = [];
  
  while (currentUrl) {
    console.log(`Fetching page ${pageNumber} from: ${currentUrl}`);
    
    const response = await fetch(currentUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/fhir+json',
        'Content-Type': 'application/fhir+json'
      }
    });
    
    if (!response.ok) {
      throw new Meteor.Error('fetch-failed', `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const bundle = await response.json();
    
    if (!bundle || bundle.resourceType !== 'Bundle') {
      throw new Meteor.Error('invalid-response', 'Expected a FHIR Bundle resource');
    }
    
    const entriesInPage = bundle.entry?.length || 0;
    console.log(`Page ${pageNumber}: Received ${entriesInPage} entries`);
    totalEntries += entriesInPage;
    
    // Store all entries for the complete bundle
    if (bundle.entry && Array.isArray(bundle.entry)) {
      allEntries.push(...bundle.entry);
      
      // Collect resource details if requested
      if (includeDetails) {
        bundle.entry.forEach(entry => {
          if (entry.resource && entry.resource.resourceType && entry.resource.id) {
            resourceDetails.push({
              resourceType: entry.resource.resourceType,
              id: entry.resource.id
            });
          }
        });
      }
    }
    
    // Process entries in this bundle
    const result = await processBundleEntries(bundle, resourceCounts, totalProcessed);
    totalProcessed += result.resourcesProcessed;
    
    if (result.patientResource) {
      patientResource = result.patientResource;
    }
    
    // Look for next link
    currentUrl = null;
    if (bundle.link && Array.isArray(bundle.link)) {
      const nextLink = bundle.link.find(link => link.relation === 'next');
      if (nextLink && nextLink.url) {
        currentUrl = nextLink.url;
        pageNumber++;
      }
    }
    
    if (!currentUrl) {
      console.log('No more pages to fetch');
    }
  }
  
  // Create a complete bundle with all entries
  const completeBundle = {
    resourceType: 'Bundle',
    type: 'searchset',
    total: totalEntries,
    entry: allEntries
  };
  
  return {
    totalEntries,
    totalProcessed,
    resourceCounts,
    patientResource,
    pagesFetched: pageNumber,
    resourceDetails: includeDetails ? resourceDetails : undefined,
    bundle: completeBundle
  };
}

Meteor.methods({
  'pacio.fetchPatientEverything': async function(url, patientId) {
    check(url, String);
    check(patientId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }
    
    console.log('Starting patient data fetch from:', url);
    
    try {
      // Fetch all pages recursively
      // Only include details if we have a reasonable number of resources (< 100)
      const includeDetails = true; // Could make this configurable
      const result = await fetchAllPages(url, includeDetails);
      
      console.log('=== Fetch Summary ===');
      console.log(`Total pages fetched: ${result.pagesFetched}`);
      console.log(`Total entries received: ${result.totalEntries}`);
      console.log(`Total resources processed: ${result.totalProcessed}`);
      console.log('Resource counts:', result.resourceCounts);
      
      // Limit resource details to prevent overwhelming the UI
      const maxDetailsToShow = 100;
      const resourceDetails = result.resourceDetails && result.resourceDetails.length > maxDetailsToShow 
        ? result.resourceDetails.slice(0, maxDetailsToShow) 
        : result.resourceDetails;
      
      return {
        success: true,
        resourceCount: result.totalEntries,
        resourcesProcessed: result.totalProcessed,
        resourceCounts: result.resourceCounts,
        pagesFetched: result.pagesFetched,
        patientId: result.patientResource?.id || patientId,
        patientResource: result.patientResource,
        timestamp: new Date(),
        resourceDetails: resourceDetails,
        bundle: result.bundle
      };
      
    } catch (error) {
      console.error('Error in fetchPatientEverything:', error);
      throw new Meteor.Error('fetch-error', error.message || 'Failed to fetch patient data');
    }
  }
});
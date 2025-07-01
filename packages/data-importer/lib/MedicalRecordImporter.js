import { get, has, set } from 'lodash';
import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';


//---------------------------------------------------------------------------
// Collections

// this is a little hacky, but it works to access our collections.
// we use to use Mongo.Collection.get(collectionName), but in Meteor 1.3, it was deprecated
// we then started using window[collectionName], but that only works on the client
// so we now take the window and 

let Collections;

Meteor.startup(function(){

  // does this work?
  // Collections = Meteor.Collections;
  
  if(Meteor.isClient){
    Collections = window.Collections;
  }
  if(Meteor.isServer){
    Collections = global.Collections;
  }  
})

//---------------------------------------------------------------------------
// Cordova / Healthkit Callback

var callback = function (msg) {
  // wrapping in a timeout because of a possbile native UI element blocking the webview
  setTimeout(function () {
    // alert(JSON.stringify(msg))
    console.log(JSON.stringify(msg))
  }, 0);
};

//---------------------------------------------------------------------------
// Main Application  

MedicalRecordImporter = {
  healthRecord: function(){
    console.log('=====================================================')
    console.log('MedicalRecordImporter.healthRecord()', JSON.stringify(window.plugins));

      window.plugins.healthkit.available(
          callback,
          callback
      );

      // or any of these HKClinicalType for readTypes 

      // 'HKCharacteristicTypeIdentifierFitzpatrickSkinType',
      // 'HKCharacteristicTypeIdentifierWheelchairUse',

      // 'HKCharacteristicTypeIdentifierDateOfBirth',
      // 'HKCharacteristicTypeIdentifierBiologicalSex',
      // 'HKCharacteristicTypeIdentifierBloodType',

      // 'HKFHIRResourceTypeAllergyIntolerance',
      // 'HKFHIRResourceTypeImmunization',
      // 'HKFHIRResourceTypeMedicationDispense',
      // 'HKFHIRResourceTypeMedicationOrder',
      // 'HKFHIRResourceTypeMedicationStatement',
      // 'HKFHIRResourceTypeObservation',
      // 'HKFHIRResourceTypeProcedure'

      window.plugins.healthkit.requestAuthorization(
          {
            readTypes: [
              'HKClinicalTypeIdentifierAllergyRecord',
              'HKClinicalTypeIdentifierConditionRecord',
              'HKClinicalTypeIdentifierImmunizationRecord',
              'HKClinicalTypeIdentifierLabResultRecord',
              'HKClinicalTypeIdentifierMedicationRecord',

              'HKClinicalTypeIdentifierProcedureRecord',
              'HKClinicalTypeIdentifierVitalSignRecord'
            ],
            writeTypes: []
          },
          function(msg){console.log('requestAuthorization.ok', msg)},
          function(msg){console.log('requestAuthorization.nok', msg)}
      );

      // console.log('-------------------------------------------')
      // console.log('queryClinicalSampleType')
      // window.plugins.healthkit.queryClinicalSampleType(
      //   {
      //     'startDate': new Date(new Date().getTime() - 365 * 24 * 60 * 60 * 1000 * 10) , // 365 days ago
      //     'endDate': new Date(), // now
      //     sampleType: 'HKClinicalTypeIdentifierAllergyRecord'
      //     // fhirResourceType: 'HKFHIRResourceTypeAllergyIntolerance'
      //   },
      //   function(results){
      //     console.log('HKFHIRResourceTypeAllergyIntolerance.ok', JSON.stringify(results))
      //     results.forEach(function(record){
      //       if(get(record, 'FHIRResource.data.resourceType') === "AllergyIntolerance"){
      //         AllergyIntolerances._collection.insert(get(record, 'FHIRResource.data'));
      //       }
      //     })
      //   },
      // function(msg){console.log('HKFHIRResourceTypeAllergyIntolerance.nok', msg)}
      // );

      console.log('-------------------------------------------')
      console.log('HKFHIRResourceTypeAllergyIntolerance')
      window.plugins.healthkit.queryForClinicalRecordsWithFHIRResourceType(
        {
          fhirResourceType: 'HKFHIRResourceTypeAllergyIntolerance',
          sampleType: 'HKClinicalTypeIdentifierAllergyRecord'
        },
        function(results){
          console.log('HKFHIRResourceTypeAllergyIntolerance.ok', JSON.stringify(results))
          results.forEach(async function(record){
            if(get(record, 'FHIRResource.data.resourceType') === "AllergyIntolerance"){
              //AllergyIntolerances._collection.insert(get(record, 'FHIRResource.data'));
              await HealthKitImport._collection.insertAsync(get(record, 'FHIRResource.data'));
            }
          })
        },
      function(msg){console.log('HKFHIRResourceTypeAllergyIntolerance.nok', msg)}
      );

      console.log('-------------------------------------------')
      console.log('HKFHIRResourceTypeCondition')
      window.plugins.healthkit.queryForClinicalRecordsWithFHIRResourceType(
        {
          fhirResourceType: 'HKFHIRResourceTypeCondition',
          sampleType: 'HKClinicalTypeIdentifierConditionRecord'
        },
        function(results){
          console.log('HKFHIRResourceTypeCondition.ok', JSON.stringify(results))
          results.forEach(async function(record){
            if(get(record, 'FHIRResource.data.resourceType') === "Condition"){
              // Conditions._collection.insert(get(record, 'FHIRResource.data'));
              await HealthKitImport._collection.insertAsync(get(record, 'FHIRResource.data'));
            }
          })
        },
        function(msg){console.log('HKFHIRResourceTypeCondition.nok', msg)}
      );

      console.log('-------------------------------------------')
      console.log('HKFHIRResourceTypeImmunization')
      window.plugins.healthkit.queryForClinicalRecordsWithFHIRResourceType(
        {
          fhirResourceType: 'HKFHIRResourceTypeImmunization',
          sampleType: 'HKClinicalTypeIdentifierImmunizationRecord'
        },
        function(results){
          console.log('HKFHIRResourceTypeImmunization.ok', JSON.stringify(results))
          results.forEach(async function(record){
            if(get(record, 'FHIRResource.data.resourceType') === "Immunization"){
              // Immunizations._collection.insert(get(record, 'FHIRResource.data'));
              await HealthKitImport._collection.insertAsync(get(record, 'FHIRResource.data'));
            }
          })
        },
        function(msg){console.log('HKFHIRResourceTypeImmunization.nok', msg)}
      );


      console.log('-------------------------------------------')
      console.log('HKFHIRResourceTypeObservation')
      window.plugins.healthkit.queryForClinicalRecordsWithFHIRResourceType(
        {
          'fhirResourceType': 'HKFHIRResourceTypeObservation',
          'sampleType': 'HKClinicalTypeIdentifierLabResultRecord'
          // 'startDate': new Date(new Date().getTime() - 365 * 24 * 60 * 60 * 1000), // 365 days ago
          // 'endDate': new Date(), // now
        },
        function(results){
          console.log('HKClinicalTypeIdentifierLabResultRecord.ok', JSON.stringify(results))
          results.forEach(function(record){
            if(get(record, 'FHIRResource.data.resourceType') === "Observation"){
              // Observations._collection.insert(get(record, 'FHIRResource.data'));
              HealthKitImport._collection.insert(get(record, 'FHIRResource.data'));
            }
          })
        },
        function(){console.log('HKFHIRResourceTypeObservation.nok')}
      );

      console.log('-------------------------------------------')
      console.log('HKFHIRResourceTypeMedicationOrder')
      window.plugins.healthkit.queryForClinicalRecordsWithFHIRResourceType(
        {
          'fhirResourceType': 'HKFHIRResourceTypeMedicationOrder',
          'sampleType': 'HKClinicalTypeIdentifierMedicationRecord'
        },
        function(results){
          console.log('HKFHIRResourceTypeMedicationOrder.ok', JSON.stringify(results))
          results.forEach(async function(record){
            if(get(record, 'FHIRResource.data.resourceType') === "MedicationOrder"){
              // MedicationOrders._collection.insert(get(record, 'FHIRResource.data'));
              await HealthKitImport._collection.insertAsync(get(record, 'FHIRResource.data'));            }
          })
        },
        function(){console.log('HKFHIRResourceTypeMedicationOrder.nok')}
      );

      console.log('-------------------------------------------')
      console.log('HKFHIRResourceTypeMedicationStatement')
      window.plugins.healthkit.queryForClinicalRecordsWithFHIRResourceType(
        {
          'fhirResourceType': 'HKFHIRResourceTypeMedicationStatement',
          'sampleType': 'HKClinicalTypeIdentifierMedicationRecord'
        },
        function(results){
          console.log('HKFHIRResourceTypeMedicationStatement.ok', JSON.stringify(results))
          results.forEach(function(record){
            if(get(record, 'FHIRResource.data.resourceType') === "MedicationStatement"){
              // MedicationStatements._collection.insert(get(record, 'FHIRResource.data'));
              HealthKitImport._collection.insert(get(record, 'FHIRResource.data'));
            }
          })
        },
        function(){console.log('HKFHIRResourceTypeMedicationStatement.nok')}
      );

      console.log('-------------------------------------------')
      console.log('HKFHIRResourceTypeProcedure')
      window.plugins.healthkit.queryForClinicalRecordsWithFHIRResourceType(
        {
          fhirResourceType: 'HKFHIRResourceTypeProcedure',
          sampleType: 'HKClinicalTypeIdentifierProcedureRecord'
        },
        function(results){
          console.log('HKFHIRResourceTypeProcedure.ok', JSON.stringify(results))
          results.forEach(async function(record){
            if(get(record, 'FHIRResource.data.resourceType') === "Procedure"){
              // Procedures._collection.insert(get(record, 'FHIRResource.data'));
              await HealthKitImport._collection.insertAsync(get(record, 'FHIRResource.data'));
            }
          })
        },
        function(){console.log('HKFHIRResourceTypeProcedure.nok')}
      );

      console.log('-------------------------------------------')
      console.log('HKClinicalTypeIdentifierVitalSignRecord')
      window.plugins.healthkit.queryForClinicalRecordsWithFHIRResourceType({
        'fhirResourceType': 'HKFHIRResourceTypeObservation',
        'sampleType': 'HKClinicalTypeIdentifierVitalSignRecord'
        },
        function(results){
          console.log('HKFHIRResourceTypeObservation.ok', JSON.stringify(results))
          results.forEach(async function(record){
            if(get(record, 'FHIRResource.data.resourceType') === "Observation"){
              // Observations._collection.insert(get(record, 'FHIRResource.data'));
              await HealthKitImport._collection.insertAsync(get(record, 'FHIRResource.data'));
            }
          })
        },
        function(){console.log('HKFHIRResourceTypeObservation.nok')}
      );
      
      // // or any of these other HKFHIRResourceType
      // // HKFHIRResourceTypeAllergyIntolerance',
      // // HKFHIRResourceTypeImmunization
      // // HKFHIRResourceTypeMedicationDispense
      // // HKFHIRResourceTypeMedicationOrder
      // // HKFHIRResourceTypeMedicationStatement
      // // HKFHIRResourceTypeObservation
      // // HKFHIRResourceTypeProcedure
      // // or any of these other HKClinicalType
      // // HKClinicalTypeIdentifierImmunizationRecord
      // // HKClinicalTypeIdentifierLabResultRecord
      // // HKClinicalTypeIdentifierMedicationRecord
      // // HKClinicalTypeIdentifierProcedureRecord
      // // HKClinicalTypeIdentifierVitalSignRecord


      // window.plugins.healthkit.readDateOfBirth(
      //   function(data){console.log('readDateOfBirth.ok', JSON.stringify(data))},
      //   function(){console.log('readDateOfBirth.nok')}
      // );
      // window.plugins.healthkit.readGender(
      //   function(data){console.log('readGender.ok', JSON.stringify(data))},
      //   function(){console.log('readGender.nok')}
      // );
      // window.plugins.healthkit.readBloodType(
      //   function(data){console.log('readBloodType.ok', JSON.stringify(data))},
      //   function(){console.log('readBloodType.nok')}
      // );
      // window.plugins.healthkit.readFitzpatrickSkinType(
      //   function(data){console.log('readFitzpatrickSkinType.ok', JSON.stringify(data))},
      //   function(){console.log('readFitzpatrickSkinType.nok')}
      // );
      // window.plugins.healthkit.readWeight({
      //     'requestWritePermission': true, // use if your app doesn't need to write
      //     'unit': 'kg'
      //   },
      //   function(data){console.log('readWeight.ok', JSON.stringify(data))},
      //   function(){console.log('readWeight.nok')}
      // );
      // window.plugins.healthkit.readHeight({
      //     'requestWritePermission': false,
      //     'unit': 'cm' // m|cm|mm|in|ft
      //   },
      //   function(data){console.log('readHeight.ok', JSON.stringify(data))},
      //   function(){console.log('readHeight.nok')}
      // );

      let importRecordEvent = { 
        "resourceType" : "AuditEvent",
        "action" : 'Health Record Importer',
        "recorded" : new Date(), 
        "outcome" : 'Success',
        "outcomeDesc" : 'User imported records from Apple Health Records.',
        "agent" : [{
          "altId" : Meteor.userId() ? Meteor.userId() : '', // Alternative User id e.g. authentication
          "name" : Meteor.user() ? Meteor.user().fullName() : '', // Human-meaningful name for the agent
          "requestor" : true  
        }],
        "source" : { 
          "site" : Meteor.absoluteUrl(),
          "identifier": {
            "value": 'Accounts Subsystem'
          }
        },
        "entity": []
      }      

      // HipaaLogger.logEvent({eventType: "update", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Procedures", recordId: self.state.procedureId });

      if(typeof HipaaLogger === "object"){
        HipaaLogger.logAuditEvent(importRecordEvent, {validate: get(Meteor, 'settings.public.defaults.schemas.validate', false)}, function(error, result){
          if(error) console.error('HipaaLogger.logEvent.error.invalidKeys', error.invalidKeys)
          if(result) console.error(result)
        });   
      }

      if(Meteor.users){
        Meteor.users.update({_id: Meteor.userId()}, {$set: {
          needHealthRecordsAuth: false
        }})  
      }

  },
  coreBiomarkers: function(){
    console.log('=====================================================')
    console.log('MedicalRecordImporter.coreBiomarkers()', window.plugins)

      window.plugins.healthkit.available(
          callback,
          callback
      );
      // or any of these HKClinicalType for readTypes 

      // 'HKCharacteristicTypeIdentifierDateOfBirth',
      // 'HKCharacteristicTypeIdentifierBiologicalSex',
      // 'HKCharacteristicTypeIdentifierBloodType',
      // 'HKCharacteristicTypeIdentifierFitzpatrickSkinType',
      // 'HKCharacteristicTypeIdentifierWheelchairUse',

      // 'HKFHIRResourceTypeAllergyIntolerance',
      // 'HKFHIRResourceTypeImmunization',
      // 'HKFHIRResourceTypeMedicationDispense',
      // 'HKFHIRResourceTypeMedicationOrder',
      // 'HKFHIRResourceTypeMedicationStatement',
      // 'HKFHIRResourceTypeObservation',
      // 'HKFHIRResourceTypeProcedure'

      window.plugins.healthkit.requestAuthorization(
          {
            readTypes: [
              'HKClinicalTypeIdentifierAllergyRecord',
              'HKClinicalTypeIdentifierConditionRecord',
              'HKClinicalTypeIdentifierImmunizationRecord',
              'HKClinicalTypeIdentifierLabResultRecord',
              'HKClinicalTypeIdentifierMedicationRecord',

              'HKClinicalTypeIdentifierProcedureRecord',
              'HKClinicalTypeIdentifierVitalSignRecord',

              'HKCharacteristicTypeIdentifierDateOfBirth',
              'HKCharacteristicTypeIdentifierBiologicalSex',
              'HKCharacteristicTypeIdentifierBloodType',
              'HKCharacteristicTypeIdentifierFitzpatrickSkinType',
              'HKCharacteristicTypeIdentifierWheelchairUse'
            ],
            writeTypes: []
          },
          function(msg){console.log('requestAuthorization.ok', msg)},
          function(msg){console.log('requestAuthorization.nok', msg)}
      );

      // // or any of these other HKFHIRResourceType
      // // HKFHIRResourceTypeAllergyIntolerance',
      // // HKFHIRResourceTypeImmunization
      // // HKFHIRResourceTypeMedicationDispense
      // // HKFHIRResourceTypeMedicationOrder
      // // HKFHIRResourceTypeMedicationStatement
      // // HKFHIRResourceTypeObservation
      // // HKFHIRResourceTypeProcedure
      // // or any of these other HKClinicalType
      // // HKClinicalTypeIdentifierImmunizationRecord
      // // HKClinicalTypeIdentifierLabResultRecord
      // // HKClinicalTypeIdentifierMedicationRecord
      // // HKClinicalTypeIdentifierProcedureRecord
      // // HKClinicalTypeIdentifierVitalSignRecord

      window.plugins.healthkit.readDateOfBirth(
        function(data){
          console.log('readDateOfBirth.ok', JSON.stringify(data));
          Session.set('HKCharacteristicTypeIdentifierDateOfBirth', data)      
        },
        function(){console.log('readDateOfBirth.nok')}
      );
      window.plugins.healthkit.readGender(
        function(data){
          console.log('readGender.ok', JSON.stringify(data))
          Session.set('HKCharacteristicTypeIdentifierBiologicalSex', data)
        },
        function(){console.log('readGender.nok')}
      );
      window.plugins.healthkit.readBloodType(
        function(data){
          console.log('readBloodType.ok', JSON.stringify(data))
          Session.set('HKCharacteristicTypeIdentifierBloodType', data)
        },
        function(){console.log('readBloodType.nok')}
      );
      window.plugins.healthkit.readFitzpatrickSkinType(
        function(data){
          console.log('readFitzpatrickSkinType.ok', JSON.stringify(data))
          Session.set('HKCharacteristicTypeIdentifierFitzpatrickSkinType', data)
          Session.set('selectedFitzpatrick', data)
        },
        function(){console.log('readFitzpatrickSkinType.nok')}
      );
      window.plugins.healthkit.readWheelchairUse(
        function(data){
          console.log('readWheelchairUse.ok', JSON.stringify(data))
          Session.set('HKCharacteristicTypeIdentifierWheelchairUse', data)
        },
        function(){console.log('readWheelchairUse.nok')}
      );

      // window.plugins.healthkit.readWeight({
      //     'requestWritePermission': true, // use if your app doesn't need to write
      //     'unit': 'kg'
      //   },
      //   function(data){console.log('readWeight.ok', JSON.stringify(data))},
      //   function(){console.log('readWeight.nok')}
      // );
      // window.plugins.healthkit.readHeight({
      //     'requestWritePermission': false,
      //     'unit': 'cm' // m|cm|mm|in|ft
      //   },
      //   function(data){console.log('readHeight.ok', JSON.stringify(data))},
      //   function(){console.log('readHeight.nok')}
      // );

      // HipaaLogger.logEvent({eventType: "update", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Procedures", recordId: self.state.procedureId });
  },
  pluralizeResourceName: function(resourceType){
    var pluralized = '';
    switch (resourceType) {
      case 'Binary':          
        pluralized = 'Binaries';
        break;
      case 'Library':      
        pluralized = 'Libraries';
        break;
      case 'SupplyDelivery':      
        pluralized = 'SupplyDeliveries';
        break;
      case 'ImagingStudy':      
        pluralized = 'ImagingStudies';
        break;        
      case 'FamilyMemberHistory':      
        pluralized = 'FamilyMemberHistories';
        break;        
      case 'ResearchStudy':      
        pluralized = 'ResearchStudies';
        break;        
      default:
        pluralized = resourceType + 's';
        break;
    }

    return pluralized;
  },
  importNdjson: async function(dataContent){
    console.log('--------------------------------------------------------')
    console.log('MedicalRecordImporter.importNdjson');

    if(typeof dataContent === "string"){
      dataContent = dataContent.split('\n');
    }

    console.log("dataContent.length", dataContent.length)

    if(Array.isArray(dataContent)){
      dataContent.forEach(async function(record){

        let parsedRecord;

        if(typeof record === "object"){
          parsedRecord = record
        } else if (typeof record === "string"){
          try {
            if(JSON.parse(record)){
              parsedRecord = JSON.parse(record);
            }              
          } catch (error) {
            console.log('Doesnt seem that record was a parseable string.  No object found.', error)
          }

        }

        if(get(parsedRecord, 'resourceType')){
          console.log('Found a ' + get(parsedRecord, 'resourceType'));

          var newRecord = parsedRecord;
          // console.log('newRecord', newRecord)


          if(!newRecord.id){
            if(newRecord._id){
              newRecord.id = parsedRecord._id;
            } else {
              let newId = Random.id();
              newRecord.id = newId;
              newRecord._id = newId;
            }
          }

          // if there is an issued timestamp
          if(get(newRecord, 'issued')){
            // convert it from a String to Date, so we can sort it
            newRecord.issued = Date.parse(newRecord.issued);
          } else {
            // if there is no issued timestamp, but there is an effective timestamp
            // use that instead
            if(get(newRecord, 'effectiveDateTime')){
              newRecord.issued = Date.parse(get(newRecord, 'effectiveDateTime'));
            } 
          }


          if(Collections[MedicalRecordImporter.pluralizeResourceName(get(parsedRecord, 'resourceType'))]){
            if(!Collections[MedicalRecordImporter.pluralizeResourceName(get(parsedRecord, 'resourceType'))]._collection.findOne({_id: newRecord._id})){                  
              console.log('Couldnt find parsedRecord; attempting to insert.')
              await Collections[MedicalRecordImporter.pluralizeResourceName(get(parsedRecord, 'resourceType'))]._collection.insertAsync(newRecord, {validate: false, filter: false}, function(error){
                if(error) {
                  console.log('window(self.pluralizeResourceName(entry.resource.resourceType))._collection.insert.error', error)
                }
              });   
            }
          }
        }
      });
    }
  },
  importBundle: async function(dataContent, proxyUrl){    
    console.log('----------------------------------------------------');
    // console.log('MedicalRecordImporter.importBundle', typeof dataContent);
    // console.log('MedicalRecordImporter.importBundle.dataContent', dataContent);
    // console.log('MedicalRecordImporter.Collections', Collections);

    let self = this;

    let parsedResults = {};

    if(typeof dataContent === "string"){
      parsedResults = JSON.parse(dataContent);          
    } else if(typeof dataContent === "object"){
      if(has(dataContent, 'content') && !has(dataContent, 'resourceType')){
        if(typeof dataContent.content === "string"){
          parsedResults = JSON.parse(dataContent.content);
        } else {
          parsedResults = dataContent.content;
        }
      } else {
        parsedResults = dataContent;
      }
    } 
     
    console.log('MedicalRecordImporter.importBundle.dataContent', parsedResults);

    console.log('Parsed results:  ', parsedResults);
       

    if(get(parsedResults, 'resourceType') === "Bundle"){
      console.log('Found a FHIR bundle! There appear to be ' + parsedResults.entry.length + ' resources in the bundle.  Attempting import...')


      // as a Bundle, we know it's going to have an entries array
      // so, we're going to loop through each entry, looking for it's resources
      if(Array.isArray(parsedResults.entry)){
        parsedResults.entry.forEach(async function(entry){          
          if(get(entry, 'resource.resourceType')){
            console.debug('Found a ' + get(entry, 'resource.resourceType'), entry.resource);
  
            var newRecord = entry.resource;
            // console.log('newRecord', newRecord)
  
            if(!newRecord.id){
              if(newRecord._id){
                newRecord.id = entry.resource._id;
              } else {
                let newId = Random.id();
                newRecord.id = newId;
                newRecord._id = newId;
              }
            }

            if(get(entry.resource, 'resourceType') === "Patient"){
              console.log(Meteor.FhirUtilities.assembleName(get(entry.resource, 'name[0]')))
              set(newRecord, 'name[0].text', Meteor.FhirUtilities.assembleName(get(entry.resource, 'name[0]')));
            }


            // // if there is an issued timestamp
            // if(get(newRecord, 'issued')){
            //   // convert it from a String to Date, so we can sort it
            //   newRecord.issued = Date.parse(newRecord.issued);
            // } else {
            //   // if there is no issued timestamp, but there is an effective timestamp
            //   // use that instead
            //   if(get(newRecord, 'effectiveDateTime')){
            //     newRecord.issued = Date.parse(get(newRecord, 'effectiveDateTime'));
            //   } 
            // }

  
            if(Collections[self.pluralizeResourceName(get(entry, 'resource.resourceType'))]){
  
              // checking if there's a pub/sub
              let subscriptionActivated = false;

              Object.keys( Meteor.connection._subscriptions).forEach(function(key) {
                var record = Meteor.connection._subscriptions[key];
                if(record.name === self.pluralizeResourceName(get(entry, 'resource.resourceType'))){
                  subscriptionActivated = true;
                }
              });
                            
              console.log('Trying to import the following record', newRecord)
              console.debug('Subscription is active: ' + subscriptionActivated)
              if(Meteor.isClient && subscriptionActivated){
                if(proxyUrl){
                  let assembledUrl = proxyUrl;
                  if(has(entry, 'resource.id')){
                      assembledUrl = proxyUrl + '/' + get(entry, 'resource.resourceType') + '/' + get(entry, 'resource.id');
                      console.log('PUT ' + assembledUrl)
                      HTTP.put(assembledUrl, {data: get(entry, 'resource')}, function(error, result){
                          if(error){
                              alert(JSON.stringify(error.message));
                          }
                      })
                  } else {
                      assembledUrl = proxyUrl + '/' + get(entry, 'resource.resourceType');
                      console.log('POST ' + assembledUrl)
                      HTTP.post(assembledUrl, {data: get(entry, 'resource')}, function(error, result){
                          if(error){
                              alert(JSON.stringify(error.message));
                          }
                      })
                  }    
                }
              } else {
                // this should only be run if there's not a pubsub, and the cursors are effectively running offline
                console.debug('Cursor appears to be inactive.')
                if(!Collections[self.pluralizeResourceName(get(entry, 'resource.resourceType'))]._collection.findOne({_id: newRecord._id})){                  
                  console.debug('Couldnt find record; attempting to insert.')
                  await Collections[self.pluralizeResourceName(get(entry, 'resource.resourceType'))]._collection.insertAsync(newRecord, {validate: false, filter: false}, function(error){
                    if(error) {
                      console.error('window(self.pluralizeResourceName(entry.resource.resourceType))._collection.insert.error', error)
                    }
                  });   
                }
              }
            }
          }
        })
      }


    // if it's not an array...
    } else {
      if(get(parsedResults, 'resourceType')){
        console.info('Found a ' + get(parsedResults, 'resourceType'));

        if(Meteor.isClient){
          // console.log('parsedResults', parsedResults)
          // console.log('parsedResults.resource.resourceType', get(parsedResults, 'resource.resourceType'))
          // console.log('parsedResults.resource.resourceType.pluralized',self.pluralizeResourceName(get(parsedResults, 'resourceType')))
          // console.log('Collections[parsedResults.resource.resourceType.pluralized]', Collections[self.pluralizeResourceName(get(parsedResults, 'resourceType'))])
  
          // // Maybe works better on server
          // if(self.pluralizeResourceName(get(parsedResults, 'resource.resourceType'))){
          //   Collections[self.pluralizeResourceName(get(parsedResults, 'resourceType'))].upsert({id: parsedResults.id}, {$set: parsedResults}, {validate: false, filter: false},  function(error){          
          //     if(error) console.log('Collections[self.pluralizeResourceName(dataContent.resourceType))._collection.insert.error', error)
          //   });    
          // } else {
          //   console.log("Couldnt find the " + self.pluralizeResourceName(get(entry, 'resource.resourceType')) + ' collection.  Is it imported?')
          // }
  
          
  
          // // if there is an issued timestamp
          // if(get(parsedResults, 'issued')){
          //   // convert it from a String to Date, so we can sort it
          //   parsedResults.issued = Date.parse(parsedResults.issued);
          // } else {
          //   // if there is no issued timestamp, but there is an effective timestamp
          //   // use that instead
          //   if(get(parsedResults, 'effectiveDateTime')){
          //     parsedResults.issued = Date.parse(get(parsedResults, 'effectiveDateTime'));
          //   } 
          // }
  
          let pluralizedCollectionName = self.pluralizeResourceName(get(parsedResults, 'resourceType'));
          // console.debug('pluralizedCollectionName', pluralizedCollectionName)
  
          // This might work better on the client; but needs allow/deny rules to be set
          if(Collections[pluralizedCollectionName]){          
            if(!Collections[pluralizedCollectionName].findOne({id: parsedResults.id})){
              await Collections[pluralizedCollectionName]._collection.insertAsync(parsedResults, function(error){          
                if(error) console.error('Collections[self.pluralizeResourceName(dataContent.resourceType))._collection.insert.error', error);              
              });        
              // Collections[pluralizedCollectionName]._collection.insert(parsedResults, {validate: false, filter: false},  function(error){          
              //   if(error) console.log('Collections[self.pluralizeResourceName(dataContent.resourceType))._collection.insert.error', error);              
              // });        
            } else {
              console.info("Couldnt find any records in the " + pluralizedCollectionName + ' collection.')
            }
          } else {
            console.warn("Couldnt find the " + pluralizedCollectionName + ' collection.  Is it imported?')
          }
  
        } else {
          console.info('Not running on Client.  Skipping.')
        }  
      }
    }    
    return true
  },
  importBundleAsBundle: async function(dataContent, proxyUrl){    
    console.log('----------------------------------------------------');
    console.log('Importing Bundle into Bundle collection...')

    let self = this;

    let parsedResults = {};

    if(typeof dataContent === "string"){
      parsedResults = JSON.parse(dataContent);          
    } else if(typeof dataContent === "object"){
      if(has(dataContent, 'content') && !has(dataContent, 'resourceType')){
        if(typeof dataContent.content === "string"){
          parsedResults = JSON.parse(dataContent.content);
        } else {
          parsedResults = dataContent.content;
        }
      } else {
        parsedResults = dataContent;
      }
    } 
     
    console.log('MedicalRecordImporter.importBundle.dataContent', parsedResults);

    console.log('Parsed results:  ', parsedResults);
       
    if(get(parsedResults, 'resourceType') === "Bundle"){
      console.log('Found a FHIR bundle!  Attempting import...')

      console.debug('Cursor appears to be inactive.')
      if(!Meteor.Collections.Bundles._collection.findOne({_id: parsedResults._id})){                  
        console.debug('Couldnt find record; attempting to insert.')
        await Meteor.Collections.Bundles._collection.insertAsync(parsedResults, {validate: false, filter: false}, function(error){
          if(error) {
            console.error('window(self.pluralizeResourceName(entry.resource.resourceType))._collection.insert.error', error)
          }
        });   
      }
    }
    
    return true
  },
  parseExcelWorkbook: async function(importBuffer){
    console.log('parseExcelWorkbook', importBuffer);
  
    let results = [];
    let worksheet = [];
    let orgs = [];
  
  
    if(mappingAlgorithm < algorithmCount){
      switch (mappingAlgorithm) {
        case 8:  // FHIR Endpoints
  
          Object.keys(importBuffer).forEach(async function(cell){ 
  
            // remove all non-numeric characters from the string
            let rowIndex = cell.replace(/\D/g,'');
  
            let row = {};
            if(worksheet[rowIndex]){
              row = worksheet[rowIndex];
            }
  
            let newOrganization = {
              resourceType: "Organization",
              active: true,
              name: "",
              telecom: [],
              address: [],
              contact: [],
              endpoint: []
            }
  
            let orgAddress = {
              use: 'work', 
              type: 'both',
              line: '',
              city: '',
              state: '',
              postalCode: '',
              country: ''
            }
            let cmioContact = {
              name: {
                text: ''
              },
              telecom: [{
                value: '',
                system: 'url',
                use: 'work'
              }]
            }
  
            if(orgs[rowIndex]){
              newOrganization = orgs[rowIndex];
  
              if(get(newOrganization, 'address[0]')){
                orgAddress = get(newOrganization, 'address[0]');
                newOrganization.address = [];
              }
              if(get(newOrganization, 'contact[0]')){
                cmioContact = get(newOrganization, 'contact[0]');
                newOrganization.contact = [];
              }
            }
  
  
            if(cell.includes('A')){
              row.organization = importBuffer[cell].v;  // each spreadsheet cell contains v, w, x, y, z properties
              newOrganization.name = importBuffer[cell].v;
            }
            if(cell.includes('B')){
              row.website = importBuffer[cell].v;  
  
              let endpointId = await Endpoints.insertAsync({
                resourceType: "Endpoint",
                url: importBuffer[cell].v
              })
              if(endpointId){
                newOrganization.endpoint.push({
                  display: "Homepage",
                  reference: "Endpoint/" + endpointId
                })  
              }
            }
            if(cell.includes('C')){
              row.state = importBuffer[cell].v; 
              orgAddress.state = importBuffer[cell].v; 
            }
            if(cell.includes('D')){
              row.city = importBuffer[cell].v;  
              orgAddress.city = importBuffer[cell].v; 
            }
            if(cell.includes('E')){
              row.zipcode = importBuffer[cell].v;  
              orgAddress.postalCode = importBuffer[cell].v; 
            }
            if(cell.includes('F')){
              row.street = importBuffer[cell].v;  
              orgAddress.line = importBuffer[cell].v; 
            }
            if(cell.includes('G')){
              row.cmio = importBuffer[cell].v;  
              cmioContact.name.text = importBuffer[cell].v;
            }
            if(cell.includes('H')){
              row.cmio_linkedin = importBuffer[cell].v;  
              cmioContact.telecom[0].value = importBuffer[cell].v;
            }
  
            if(get(cmioContact, 'name.text')){
              newOrganization.contact.push(cmioContact)
            }
            if(orgAddress){
              newOrganization.address.push(orgAddress)
            }
  
            worksheet[rowIndex] = row;
            orgs[rowIndex] = newOrganization;
          });
  
          console.log('worksheet', worksheet)
          console.log('orgs', orgs);
          
  
          let count = 0;
          let orgId;
          let endpointString = '';
          let endpointId;
  
          orgs.forEach(async function(newOrg){
            if(count > 0){
              orgId = await Organizations.insertAsync(newOrg, {validate: false, filter: false});  
              console.log('orgId', orgId);
              if(get(newOrg, 'endpoint[0].reference')){
                endpointString = get(newOrg, 'endpoint[0].reference');
                if(endpointString.includes("/")){
                  endpointId = endpointString.split("/")[1];
                } else {
                  endpointId = endpointString;
                }
                await Endpoints.updateAsync({_id: endpointId}, {$set: {
                  managingOrganization: {
                    display: newOrg.name,
                    reference: "Organization/" + orgId
                  }
                }})
              }         
            }
            count++;
          })
  
          break;     
        default:
          MedicalRecordImporter.importBundle(importBuffer);
          break;
      }
  
    } else {
      // we have a half dozen defaults, and then we drop into dynamicly loaded algorithms
      let packageCardinalityIndex = mappingAlgorithm - algorithmCount + 1;
      console.log('packageCardinalityIndex', packageCardinalityIndex);
  
      // specifically, the mappingAlgorithm is the half-dozen defaults plus the cardinality of the packages with ImportAlgorithms in alphabetical order
        let cardinality = 1;
        // to get the specified import algorithm, we loop through all the packages alphabetically, while counting up from 1
        Object.keys(Package).forEach(function(packageName){
        if(Package[packageName].ImportAlgorithm){
          console.log('Package[packageName]', Package[packageName])
          // if the cardinality of the alphabetical package matches that of the cardinality index
          if(cardinality === packageCardinalityIndex){
            console.log('found a match... ' + cardinality)
            // then we run that particular algorithm
            let importAlgorithm = Package[packageName].ImportAlgorithm;
            importAlgorithm.run(importBuffer, function(){
              browserHistory.push('/questionnaires')
            })
          } else {
            // otherwise, we increment the cardinality counter (but only for those packages exporting an ImportAlgorithm)
            cardinality++;
            console.log('incrementing... ' + cardinality)
          }
        }    
      });
    }
  
    console.log('results', results)           
  },  
  parseExcelWorkbook2: async function(importBuffer){
    console.log('parseExcelWorkbook', importBuffer);
  
    let results = [];
    let worksheet = [];
    let orgs = [];
  
  
    if(mappingAlgorithm < algorithmCount){
      switch (mappingAlgorithm) {
        case 8:  // FHIR Endpoints
  
          Object.keys(importBuffer).forEach(async function(cell){ 
  
            // remove all non-numeric characters from the string
            let rowIndex = cell.replace(/\D/g,'');
  
            let row = {};
            if(worksheet[rowIndex]){
              row = worksheet[rowIndex];
            }
  
            let newOrganization = {
              resourceType: "Organization",
              active: true,
              name: "",
              telecom: [],
              address: [],
              contact: [],
              endpoint: []
            }
  
            let orgAddress = {
              use: 'work', 
              type: 'both',
              line: '',
              city: '',
              state: '',
              postalCode: '',
              country: ''
            }
            let cmioContact = {
              name: {
                text: ''
              },
              telecom: [{
                value: '',
                system: 'url',
                use: 'work'
              }]
            }
  
            if(orgs[rowIndex]){
              newOrganization = orgs[rowIndex];
  
              if(get(newOrganization, 'address[0]')){
                orgAddress = get(newOrganization, 'address[0]');
                newOrganization.address = [];
              }
              if(get(newOrganization, 'contact[0]')){
                cmioContact = get(newOrganization, 'contact[0]');
                newOrganization.contact = [];
              }
            }
  
  
            if(cell.includes('A')){
              row.organization = importBuffer[cell].v;  // each spreadsheet cell contains v, w, x, y, z properties
              newOrganization.name = importBuffer[cell].v;
            }
            if(cell.includes('B')){
              row.website = importBuffer[cell].v;  
  
              let endpointId = await Endpoints.insertAsync({
                resourceType: "Endpoint",
                url: importBuffer[cell].v
              })
              if(endpointId){
                newOrganization.endpoint.push({
                  display: "Homepage",
                  reference: "Endpoint/" + endpointId
                })  
              }
            }
            if(cell.includes('C')){
              row.state = importBuffer[cell].v; 
              orgAddress.state = importBuffer[cell].v; 
            }
            if(cell.includes('D')){
              row.city = importBuffer[cell].v;  
              orgAddress.city = importBuffer[cell].v; 
            }
            if(cell.includes('E')){
              row.zipcode = importBuffer[cell].v;  
              orgAddress.postalCode = importBuffer[cell].v; 
            }
            if(cell.includes('F')){
              row.street = importBuffer[cell].v;  
              orgAddress.line = importBuffer[cell].v; 
            }
            if(cell.includes('G')){
              row.cmio = importBuffer[cell].v;  
              cmioContact.name.text = importBuffer[cell].v;
            }
            if(cell.includes('H')){
              row.cmio_linkedin = importBuffer[cell].v;  
              cmioContact.telecom[0].value = importBuffer[cell].v;
            }
  
            if(get(cmioContact, 'name.text')){
              newOrganization.contact.push(cmioContact)
            }
            if(orgAddress){
              newOrganization.address.push(orgAddress)
            }
  
            worksheet[rowIndex] = row;
            orgs[rowIndex] = newOrganization;
          });
  
          console.log('worksheet', worksheet)
          console.log('orgs', orgs);
          
  
          let count = 0;
          let orgId;
          let endpointString = '';
          let endpointId;
  
          orgs.forEach(async function(newOrg){
            if(count > 0){
              orgId = await Organizations.insertAsync(newOrg, {validate: false, filter: false});  
              console.log('orgId', orgId);
              if(get(newOrg, 'endpoint[0].reference')){
                endpointString = get(newOrg, 'endpoint[0].reference');
                if(endpointString.includes("/")){
                  endpointId = endpointString.split("/")[1];
                } else {
                  endpointId = endpointString;
                }
                await Endpoints.updateAsync({_id: endpointId}, {$set: {
                  managingOrganization: {
                    display: newOrg.name,
                    reference: "Organization/" + orgId
                  }
                }})
              }         
            }
            count++;
          })
  
          break;     
        default:
          MedicalRecordImporter.importBundle(importBuffer);
          break;
      }
  
    } else {
      // we have a half dozen defaults, and then we drop into dynamicly loaded algorithms
      let packageCardinalityIndex = mappingAlgorithm - algorithmCount + 1;
      console.log('packageCardinalityIndex', packageCardinalityIndex);
  
      // specifically, the mappingAlgorithm is the half-dozen defaults plus the cardinality of the packages with ImportAlgorithms in alphabetical order
        let cardinality = 1;
        // to get the specified import algorithm, we loop through all the packages alphabetically, while counting up from 1
        Object.keys(Package).forEach(function(packageName){
        if(Package[packageName].ImportAlgorithm){
          console.log('Package[packageName]', Package[packageName])
          // if the cardinality of the alphabetical package matches that of the cardinality index
          if(cardinality === packageCardinalityIndex){
            console.log('found a match... ' + cardinality)
            // then we run that particular algorithm
            let importAlgorithm = Package[packageName].ImportAlgorithm;
            importAlgorithm.run(importBuffer, function(){
              browserHistory.push('/questionnaires')
            })
          } else {
            // otherwise, we increment the cardinality counter (but only for those packages exporting an ImportAlgorithm)
            cardinality++;
            console.log('incrementing... ' + cardinality)
          }
        }    
      });
    }
  
    console.log('results', results)           
  },
  parseCsvFile: function(importBuffer){
    console.log('parseCsvFile', importBuffer);
    console.log('mappingAlgorithm', mappingAlgorithm);

    let results = [];
    let worksheet = [];
    let orgs = [];

    if(mappingAlgorithm >= algorithmCount){
      // we have a half dozen defaults, and then we drop into dynamicly loaded algorithms
      let packageCardinalityIndex = mappingAlgorithm - algorithmCount + 1;
      console.log('packageCardinalityIndex', packageCardinalityIndex);

      // specifically, the mappingAlgorithm is the half-dozen defaults plus the cardinality of the packages with ImportAlgorithms in alphabetical order
        let cardinality = 1;
        // to get the specified import algorithm, we loop through all the packages alphabetically, while counting up from 1
        Object.keys(Package).forEach(function(packageName){
        if(Package[packageName].ImportAlgorithm){
          console.log('Package[packageName]', Package[packageName])
          // if the cardinality of the alphabetical package matches that of the cardinality index
          if(cardinality === packageCardinalityIndex){
            console.log('found a match... ' + cardinality)
            // then we run that particular algorithm
            let importAlgorithm = Package[packageName].ImportAlgorithm;
            importAlgorithm.run(importBuffer, function(){
              browserHistory.push('/questionnaires')
            })
          } else {
            // otherwise, we increment the cardinality counter (but only for those packages exporting an ImportAlgorithm)
            cardinality++;
            console.log('incrementing... ' + cardinality)
          }
        }    
      });
    }
  }
}

export default MedicalRecordImporter;
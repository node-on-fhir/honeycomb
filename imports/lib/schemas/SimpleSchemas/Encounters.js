if(Package['clinical:autopublish']){
  console.log("*****************************************************************************")
  console.log("HIPAA WARNING:  Your app has the 'clinical-autopublish' package installed.");
  console.log("Any protected health information (PHI) stored in this app should be audited."); 
  console.log("Please consider writing secure publish/subscribe functions and uninstalling.");  
  console.log("");  
  console.log("meteor remove clinical:autopublish");  
  console.log("");  
}
if(Package['autopublish']){
  console.log("*****************************************************************************")
  console.log("HIPAA WARNING:  DO NOT STORE PROTECTED HEALTH INFORMATION IN THIS APP. ");  
  console.log("Your application has the 'autopublish' package installed.  Please uninstall.");
  console.log("");  
  console.log("meteor remove autopublish");  
  console.log("meteor add clinical:autopublish");  
  console.log("");  
}

import { get } from 'lodash';
import validator from 'validator';

import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// REFACTOR:  we want to deprecate meteor/clinical:hl7-resource-datatypes
// so please remove references from the following line
// and replace with import from ../../datatypes/*
import { BaseSchema, DomainResourceSchema, IdentifierSchema, ContactPointSchema, AddressSchema, ReferenceSchema, SignatureSchema } from 'meteor/clinical:hl7-resource-datatypes';



// // create the object using our BaseModel
let Encounter = BaseModel.extend();

export let Encounters = new Mongo.Collection('Encounters');

// //Assign a collection so the object knows how to perform CRUD operations
Encounter.prototype._collection = Encounters;

// Create a persistent data store for addresses to be stored.
// HL7.Resources.Patients = new Mongo.Collection('HL7.Resources.Patients');

// if(typeof Encounters === 'undefined'){
//   if(Package['clinical:autopublish']){
//     Encounters = new Mongo.Collection('Encounters');
//   } else if(Package['clinical:desktop-publish']){
//     Encounters = new Mongo.Collection('Encounters');
//   } else {
//     Encounters = new Mongo.Collection('Encounters', {connection: null});
//   }
// }




// //Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Encounters._transform = function (document) {
  return new Encounter(document);
};



let EncounterSchemaDstu2 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "Encounter"
  },
  "id" : {
    optional: true,
    type:  String
    },
  "meta" : {
    optional: true,
    blackbox: true,
    type:  Object
  },
  "text" : {
    optional: true,
    blackbox: true,
    type:  Object
  },
  "identifier" : {
    optional: true,
    type:  Array
    },
  "identifier.$" : {
    optional: true,
    type:  IdentifierSchema 
    },
  "extension" : {
    optional: true,
    type:  Array
    },
  "extension.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
    },
  "modifierExtension" : {
    optional: true,
    type:  Array
    },
  "modifierExtension.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
    },
  "status" : {
    optional: true,
    allowedValues: ['planned', 'arrived', 'in-progress', 'onleave', 'finished', 'cancelled'],
    type: String
  },
  "statusHistory" : {
    optional: true,
    type: Array
  },
  "statusHistory.$" : {
    optional: true,
    type: Object
  },
  "statusHistory.$.status" : {
    optional: true,
    type: Array
  },
  "statusHistory.$.status.$" : {
    optional: true,
    type: String,
    allowedValues: ['planned', 'arrived', 'in-progress', 'onleave', 'finished', 'cancelled']
  },
  "statusHistory.$.period" : {
    optional: true,
    type: PeriodSchema
  },
  "class" : {
    optional: true,
    allowedValues: ['inpatient', 'outpatient', 'ambulatory', 'emergency', 'home', 'field', 'daytime', 'virtual', 'other'],
    type: String
  },

  "type" : {
    optional: true,
    type:  Array
    },
  "type.$" : {
    optional: true,
    type:  CodeableConceptSchema 
    },
  "priority" : {
    optional: true,
    type:  CodeableConceptSchema
    },
  "patient" : {
    optional: true,
    type:  ReferenceSchema
    },


  "episodeOfCare" : {
    optional: true,
    type:  Array
    },
  "episodeOfCare.$" : {
    optional: true,
    type:  ReferenceSchema 
    },

  "incomingReferral" : {
    optional: true,
    type:  Array
    },
  "incomingReferral.$" : {
    optional: true,
    type:  ReferenceSchema 
    },
    

  "participant" : {
    optional: true,
    type:  Array
    },
  "participant.$" : {
    optional: true,
    type:  ReferenceSchema 
    },
   
  "participant.$.type" : {
    optional: true,
    type:  Array
    },
  "participant.$.type.$" : {
    optional: true,
    type:  CodeableConceptSchema 
    },
  "participant.$.period" : {
    optional: true,
    type:  Array
    },
  "participant.$.period.$" : {
    optional: true,
    type:  PeriodSchema 
    },

  "participant.$.individual" : {
    optional: true,
    type:  Array
    },
  "participant.$.individual.$" : {
    optional: true,
    type:  ReferenceSchema 
    },

  "appointment" : {
    optional: true,
    type:  ReferenceSchema
    },


  "period" : {
    optional: true,
    type:  PeriodSchema
    },
  
  "length" : {
    optional: true,
    type:  QuantitySchema
    },

  "reason" : {
    optional: true,
    type:  Array
    },
  "reason.$" : {
    optional: true,
    type:  CodeableConceptSchema 
    },

  "indication" : {
    optional: true,
    type:  Array
    },
  "indication.$" : {
    optional: true,
    type:  ReferenceSchema 
    },

  "hospitalization" : {
    optional: true,
    type:  Object
    },
  "hospitalization.preAdmissionIdentifier" : {
    optional: true,
    type:  IdentifierSchema
    },
  "hospitalization.origin" : {
    optional: true,
    type:  ReferenceSchema
    },
  "hospitalization.admitSource" : {
    optional: true,
    type:  CodeableConceptSchema
    },
  "hospitalization.admittingDiagnosis" : {
    optional: true,
    type:  Array
    },
  "hospitalization.admittingDiagnosis.$" : {
    optional: true,
    type:  ReferenceSchema
    },      
  "hospitalization.reAdmission" : {
    optional: true,
    type:  CodeableConceptSchema
    },
    
  "hospitalization.dietPreference" : {
    optional: true,
    type:  Array
    },
  "hospitalization.dietPreference.$" : {
    optional: true,
    type:  CodeableConceptSchema
    },      
  
  "hospitalization.specialCourtesy" : {
    optional: true,
    type:  Array
    },
  "hospitalization.specialCourtesy.$" : {
    optional: true,
    type:  CodeableConceptSchema
    },  

  "hospitalization.specialArrangement" : {
    optional: true,
    type:  Array
    },
  "hospitalization.specialArrangement.$" : {
    optional: true,
    type:  CodeableConceptSchema
    }, 

  "hospitalization.destination" : {
    optional: true,
    type:  ReferenceSchema
    },
  "hospitalization.dischargeDisposition" : {
    optional: true,
    type:  CodeableConceptSchema
    }, 
  "hospitalization.dischargeDiagnosis" : {
    optional: true,
    type:  Array
    },
  "hospitalization.dischargeDiagnosis.$" : {
    optional: true,
    type:  ReferenceSchema
    }, 
  "location" : {
    optional: true,
    type:  Array
    },
  "location.$" : {
    optional: true,
    type:  Object
    }, 
  "location.$.location" : {
    optional: true,
    type:  ReferenceSchema
    }, 
  "location.$.status" : {
    optional: true,
    type:  String,
    allowedValues: ['planned', 'active', 'reserved', 'completed'],
    }, 
  "location.$.period" : {
    optional: true,
    type:  PeriodSchema
    }, 
  "serviceProvider" : {
    optional: true,
    type:  ReferenceSchema
    },
  "partOf" : {
    optional: true,
    type:  ReferenceSchema
    }
});



// // ===================================================

let EncounterSchemaStu3 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "Encounter"
  },
  "id" : {
    optional: true,
    type:  String
    },
  "meta" : {
    optional: true,
    blackbox: true,
    type:  Object
  },
  "text" : {
    optional: true,
    blackbox: true,
    type:  Object
  },
  "identifier" : {
    optional: true,
    type:  Array
    },
  "identifier.$" : {
    optional: true,
    type:  IdentifierSchema 
    },
  "extension" : {
    optional: true,
    type:  Array
    },
  "extension.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
    },
  "modifierExtension" : {
    optional: true,
    type:  Array
    },
  "modifierExtension.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
    },
  "status" : {
    optional: true,
    allowedValues: ['planned', 'arrived', 'triaged', 'in-progress', 'onleave', 'finished', 'cancelled', 'entered-in-error', 'unknown'],
    type: String
  },
  "statusHistory" : {
    optional: true,
    type: Array
  },
  "statusHistory.$" : {
    optional: true,
    type: Object
  },
  "statusHistory.$.status" : {
    optional: true,
    type: Array
  },
  "statusHistory.$.status.$" : {
    optional: true,
    type: String,
    allowedValues: ['planned', 'arrived', 'in-progress', 'onleave', 'finished', 'cancelled']
  },
  "statusHistory.$.period" : {
    optional: true,
    type: PeriodSchema
  },
  "class" : {
    optional: true,
    allowedValues: ['ambulatory', 'emergency',  'field', 'home health', 'inpatient encounter', 'inpatient acute', 'inpatient non-acute', 'pre-admission', 'short stay', 'virtual', 'other', 'EMERGENCY'],
    type: String
  },

  "type" : {
    optional: true,
    type:  Array
    },
  "type.$" : {
    optional: true,
    type:  CodeableConceptSchema 
    },
  "priority" : {
    optional: true,
    type:  CodeableConceptSchema
    },
  "subject" : {
    optional: true,
    type:  ReferenceSchema
    },


  "episodeOfCare" : {
    optional: true,
    type:  Array
    },
  "episodeOfCare.$" : {
    optional: true,
    type:  ReferenceSchema 
    },

  "incomingReferral" : {
    optional: true,
    type:  Array
    },
  "incomingReferral.$" : {
    optional: true,
    type:  ReferenceSchema 
    },
    

  "participant" : {
    optional: true,
    type:  Array
    },
  "participant.$" : {
    optional: true,
    type:  ReferenceSchema 
    },
   
  "participant.$.type" : {
    optional: true,
    type:  Array
    },
  "participant.$.type.$" : {
    optional: true,
    type:  CodeableConceptSchema 
    },
  "participant.$.period" : {
    optional: true,
    type:  Array
    },
  "participant.$.period.$" : {
    optional: true,
    type:  PeriodSchema 
    },

  "participant.$.individual" : {
    optional: true,
    type:  Array
    },
  "participant.$.individual.$" : {
    optional: true,
    type:  ReferenceSchema 
    },

  "appointment" : {
    optional: true,
    type:  ReferenceSchema
    },


  "period" : {
    optional: true,
    type:  PeriodSchema
    },
  
  "length" : {
    optional: true,
    type:  QuantitySchema
    },

  "reason" : {
    optional: true,
    type:  Array
    },
  "reason.$" : {
    optional: true,
    type:  CodeableConceptSchema 
    },

  "diagnosis" : {
    optional: true,
    type:  Array
    },
  "diagnosis.$" : {
    optional: true,
    type:  Object 
    },
  "diagnosis.$.condition" : {
    optional: true,
    type:  ReferenceSchema 
    },
  "diagnosis.$.role" : {
    optional: true,
    type:  ReferenceSchema 
    },
  "diagnosis.$.rank" : {
    optional: true,
    type:  Number 
    },
      
  "hospitalization" : {
    optional: true,
    type:  Object
    },
  "hospitalization.preAdmissionIdentifier" : {
    optional: true,
    type:  IdentifierSchema
    },
  "hospitalization.origin" : {
    optional: true,
    type:  ReferenceSchema
    },
  "hospitalization.admitSource" : {
    optional: true,
    type:  CodeableConceptSchema
    },
  "hospitalization.admittingDiagnosis" : {
    optional: true,
    type:  Array
    },
  "hospitalization.admittingDiagnosis.$" : {
    optional: true,
    type:  ReferenceSchema
    },      
  "hospitalization.reAdmission" : {
    optional: true,
    type:  CodeableConceptSchema
    },
    
  "hospitalization.dietPreference" : {
    optional: true,
    type:  Array
    },
  "hospitalization.dietPreference.$" : {
    optional: true,
    type:  CodeableConceptSchema
    },      
  
  "hospitalization.specialCourtesy" : {
    optional: true,
    type:  Array
    },
  "hospitalization.specialCourtesy.$" : {
    optional: true,
    type:  CodeableConceptSchema
    },  

  "hospitalization.specialArrangement" : {
    optional: true,
    type:  Array
    },
  "hospitalization.specialArrangement.$" : {
    optional: true,
    type:  CodeableConceptSchema
    }, 

  "hospitalization.destination" : {
    optional: true,
    type:  ReferenceSchema
    },
  "hospitalization.dischargeDisposition" : {
    optional: true,
    type:  CodeableConceptSchema
    }, 
  "hospitalization.dischargeDiagnosis" : {
    optional: true,
    type:  Array
    },
  "hospitalization.dischargeDiagnosis.$" : {
    optional: true,
    type:  ReferenceSchema
    }, 
  "location" : {
    optional: true,
    type:  Array
    },
  "location.$" : {
    optional: true,
    type:  Object
    }, 
  "location.$.location" : {
    optional: true,
    type:  ReferenceSchema
    }, 
  "location.$.status" : {
    optional: true,
    type:  String,
    allowedValues: ['planned', 'active', 'reserved', 'completed'],
    }, 
  "location.$.period" : {
    optional: true,
    type:  PeriodSchema
    }, 
  "serviceProvider" : {
    optional: true,
    type:  ReferenceSchema
    },
  "partOf" : {
    optional: true,
    type:  ReferenceSchema
    }
});



// // ===================================================

let EncounterSchemaR4 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "Encounter"
  },
  "id" : {
    optional: true,
    type:  String
    },
  "meta" : {
    optional: true,
    blackbox: true,
    type:  Object
  },
  "text" : {
    optional: true,
    blackbox: true,
    type:  Object
  },
  "identifier" : {
    optional: true,
    type:  Array
    },
  "identifier.$" : {
    optional: true,
    type:  IdentifierSchema 
    },
  "extension" : {
    optional: true,
    type:  Array
    },
  "extension.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
    },
  "modifierExtension" : {
    optional: true,
    type:  Array
    },
  "modifierExtension.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
    },
  "status" : {
    optional: true,
    allowedValues: ['planned', 'arrived', 'triaged', 'in-progress', 'onleave', 'finished', 'cancelled', 'entered-in-error', 'unknown'],
    type: String
  },
  "statusHistory" : {
    optional: true,
    type: Array
  },
  "statusHistory.$" : {
    optional: true,
    type: Object
  },
  "statusHistory.$.status" : {
    optional: true,
    type: Array
  },
  "statusHistory.$.status.$" : {
    optional: true,
    type: String,
    allowedValues: ['planned', 'arrived', 'in-progress', 'onleave', 'finished', 'cancelled']
  },
  "statusHistory.$.period" : {
    optional: true,
    type: PeriodSchema
  },
  "class" : {
    optional: true,
    allowedValues: ['ambulatory', 'emergency',  'field', 'home health', 'inpatient encounter', 'inpatient acute', 'inpatient non-acute', 'pre-admission', 'short stay', 'virtual', 'other', 'EMERGENCY'],
    type: String
  },

  "type" : {
    optional: true,
    type:  Array
    },
  "type.$" : {
    optional: true,
    type:  CodeableConceptSchema 
    },
  "priority" : {
    optional: true,
    type:  CodeableConceptSchema
    },
  "subject" : {
    optional: true,
    type:  ReferenceSchema
    },


  "episodeOfCare" : {
    optional: true,
    type:  Array
    },
  "episodeOfCare.$" : {
    optional: true,
    type:  ReferenceSchema 
    },

  "incomingReferral" : {
    optional: true,
    type:  Array
    },
  "incomingReferral.$" : {
    optional: true,
    type:  ReferenceSchema 
    },
    

  "participant" : {
    optional: true,
    type:  Array
    },
  "participant.$" : {
    optional: true,
    type:  ReferenceSchema 
    },
   
  "participant.$.type" : {
    optional: true,
    type:  Array
    },
  "participant.$.type.$" : {
    optional: true,
    type:  CodeableConceptSchema 
    },
  "participant.$.period" : {
    optional: true,
    type:  Array
    },
  "participant.$.period.$" : {
    optional: true,
    type:  PeriodSchema 
    },

  "participant.$.individual" : {
    optional: true,
    type:  Array
    },
  "participant.$.individual.$" : {
    optional: true,
    type:  ReferenceSchema 
    },

  "appointment" : {
    optional: true,
    type:  ReferenceSchema
    },


  "period" : {
    optional: true,
    type:  PeriodSchema
    },
  
  "length" : {
    optional: true,
    type:  QuantitySchema
    },

  "reason" : {
    optional: true,
    type:  Array
    },
  "reason.$" : {
    optional: true,
    type:  CodeableConceptSchema 
    },

  "diagnosis" : {
    optional: true,
    type:  Array
    },
  "diagnosis.$" : {
    optional: true,
    type:  Object 
    },
  "diagnosis.$.condition" : {
    optional: true,
    type:  ReferenceSchema 
    },
  "diagnosis.$.role" : {
    optional: true,
    type:  ReferenceSchema 
    },
  "diagnosis.$.rank" : {
    optional: true,
    type:  Number 
    },
      
  "hospitalization" : {
    optional: true,
    type:  Object
    },
  "hospitalization.preAdmissionIdentifier" : {
    optional: true,
    type:  IdentifierSchema
    },
  "hospitalization.origin" : {
    optional: true,
    type:  ReferenceSchema
    },
  "hospitalization.admitSource" : {
    optional: true,
    type:  CodeableConceptSchema
    },
  "hospitalization.admittingDiagnosis" : {
    optional: true,
    type:  Array
    },
  "hospitalization.admittingDiagnosis.$" : {
    optional: true,
    type:  ReferenceSchema
    },      
  "hospitalization.reAdmission" : {
    optional: true,
    type:  CodeableConceptSchema
    },
    
  "hospitalization.dietPreference" : {
    optional: true,
    type:  Array
    },
  "hospitalization.dietPreference.$" : {
    optional: true,
    type:  CodeableConceptSchema
    },      
  
  "hospitalization.specialCourtesy" : {
    optional: true,
    type:  Array
    },
  "hospitalization.specialCourtesy.$" : {
    optional: true,
    type:  CodeableConceptSchema
    },  

  "hospitalization.specialArrangement" : {
    optional: true,
    type:  Array
    },
  "hospitalization.specialArrangement.$" : {
    optional: true,
    type:  CodeableConceptSchema
    }, 

  "hospitalization.destination" : {
    optional: true,
    type:  ReferenceSchema
    },
  "hospitalization.dischargeDisposition" : {
    optional: true,
    type:  CodeableConceptSchema
    }, 
  "hospitalization.dischargeDiagnosis" : {
    optional: true,
    type:  Array
    },
  "hospitalization.dischargeDiagnosis.$" : {
    optional: true,
    type:  ReferenceSchema
    }, 
  "location" : {
    optional: true,
    type:  Array
    },
  "location.$" : {
    optional: true,
    type:  Object
    }, 
  "location.$.location" : {
    optional: true,
    type:  ReferenceSchema
    }, 
  "location.$.status" : {
    optional: true,
    type:  String,
    allowedValues: ['planned', 'active', 'reserved', 'completed'],
    }, 
  "location.$.period" : {
    optional: true,
    type:  PeriodSchema
    }, 
  "serviceProvider" : {
    optional: true,
    type:  ReferenceSchema
    },
  "partOf" : {
    optional: true,
    type:  ReferenceSchema
    }
});


let EncounterSchema = EncounterSchemaR4;
// Encounters.attachSchema(EncounterSchema);


export { Encounter, ncounterSchemaDstu2, EncounterSchema, EncounterSchemaStu3 }


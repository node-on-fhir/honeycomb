import { get } from 'lodash';
import validator from 'validator';

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

import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import { IdentifierSchema, CodeableConceptSchema, AnnotationSchema, ReferenceSchema } from 'meteor/clinical:hl7-resource-datatypes';

// import ReferenceSchema from '../../../datatypes/Reference';
// import CodeableConceptSchema from '../../datatypes/CodeableConcept';
// import IdentifierSchema from '../../datatypes/Identifier';
// import AnnotationSchema from '../../datatypes/Annotation';
// import PeriodSchema from '../../datatypes/Period';
// import Code from '../../datatypes/Code';
// import Range from '../../datatypes/Range';




// create the object using our BaseModel
let AllergyIntolerance = BaseModel.extend();



// Create a persistent data store for addresses to be stored.
// HL7.Resources.Patients = new Mongo.Collection('HL7.Resources.Patients');
// if(typeof AllergyIntolerances === 'undefined'){
//   if(Package['clinical:autopublish']){
//     AllergyIntolerances = new Mongo.Collection('AllergyIntolerances');
//   } else if(Package['clinical:desktop-publish']){
//     AllergyIntolerances = new Mongo.Collection('AllergyIntolerances');
//   } else {
//     AllergyIntolerances = new Mongo.Collection('AllergyIntolerances', {connection: null});
//   }
// }
export let AllergyIntolerances = new Mongo.Collection('AllergyIntolerances');

//Assign a collection so the object knows how to perform CRUD operations
AllergyIntolerance.prototype._collection = AllergyIntolerances;


// //Add the transform to the collection since Meteor.users is pre-defined by the accounts package
AllergyIntolerances._transform = function (document) {
  return new AllergyIntolerance(document);
};

let AllergyIntoleranceDstu2 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "AllergyIntolerance"
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
  "onset" : {
      optional: true,
      type: Date
  },
  "recordedDate" : {
    optional: true,
    type: Date
  },  
  "recorder" : {
    optional: true,
    blackbox: true,
    type: ReferenceSchema
  },
  "patient" : {
    optional: true,
    blackbox: true,
    type: ReferenceSchema
  },
  "reporter" : {
    optional: true,
    blackbox: true,
    type: ReferenceSchema
  },
  "substance" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "status" : {
    optional: true,
    type: String,
    allowedValues: ['unconfirmed', 'confirmed', 'refuted', 'entered-in-error'],
    defaultValue: 'unconfirmed'
  },
  "type" : {
    optional: true,
    type: String,
    allowedValues: ['allergy', 'intolerance']
  },
  "criticality" : {
    optional: true,
    type: String,
    allowedValues: ['CRITL', 'CRITH', 'CRITU'] // DSTU2
    // allowedValues: ['low', 'high', 'unable-to-assess'] // DSTU3
  },
  "category" : {
    optional: true,
    type: String ,
    allowedValues: ['food', 'medication', 'environment', 'other']
  },
  "lastOccurence" : {
    optional: true,
    type: Date
  },
  "note" : {
    optional: true,
    type: AnnotationSchema
  },  
  "reaction" : {
    optional: true,
    type: Array
  },
  "reaction.$" : {
    optional: true,
    type: Object
  },
  "reaction.$.substance" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "reaction.$.certainty" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "reaction.$.manifestation" : {
    optional: true,
    type: Array
  },
  "reaction.$.manifestation.$" : {
    optional: true,
    type: CodeableConceptSchema 
  },  
  "reaction.$.description" : {
    optional: true,
    type: String
  },
  "reaction.$.onset" : {
    optional: true,
    type: Date
  },
  "reaction.$.severity" : {
    optional: true,
    type: String
  },
  "reaction.$.exposureRoute" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "reaction.$.note" : {
    optional: true,
    type: AnnotationSchema
  }
});


let AllergyIntoleranceStu3 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "AllergyIntolerance"
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
  "identifier" : {
    optional: true,
    type:  Array
    },
  "identifier.$" : {
    optional: true,
    type:  IdentifierSchema 
    },
  "clinicalStatus" : {
    optional: true,
    type: String,
    allowedValues: ['active', 'inactive', 'resolved']
  },
  "verificationStatus" : {
    optional: true,
    type: String,
    allowedValues: ['unconfirmed', 'confirmed', 'refuted', 'entered-in-error'],
    defaultValue: 'unconfirmed'
  },
  "type" : {
    optional: true,
    type: String,
    allowedValues: ['allergy', 'intolerance']
  },
  "category" : {
    optional: true,
    type: Array
  },
  "category.$" : {
    optional: true,
    type: String ,
    allowedValues: ['food', 'medication', 'environment', 'biologic']
  },
  "criticality" : {
    optional: true,
    type: String,
    allowedValues: ['low', 'high', 'unable-to-assess']
  },
  "code" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "patient" : {
    optional: true,
    blackbox: true,
    type: Object
  },
  "patient" : {
    optional: true,
    blackbox: true,
    type: ReferenceSchema
  },
  "onsetDateTime" : {
    optional: true,
    type: Date
  },
  "onsetAge" : {
    optional: true,
    type: Number
  },
  "onsetPeriod" : {
    optional: true,
    type: PeriodSchema
  },
  "onsetRange" : {
    optional: true,
    type: Range
  },
  "onsetString" : {
    optional: true,
    type: String
  },
  "recorder" : {
    optional: true,
    blackbox: true,
    type: ReferenceSchema
  },
  "asserter" : {
    optional: true,
    blackbox: true,
    type: ReferenceSchema
  },
  "lastOccurence" : {
    optional: true,
    type: Date
  },
  "note" : {
    optional: true,
    type: Array
  },
  "note.$" : {
    optional: true,
    type: AnnotationSchema
  },  
  "reaction" : {
    optional: true,
    type: Array
  },
  "reaction.$" : {
    optional: true,
    type: Object
  },
  "reaction.$.substance" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "reaction.$.manifestation" : {
    optional: true,
    type: Array
  },
  "reaction.$.manifestation.$" : {
    optional: true,
    type: CodeableConceptSchema 
  },  
  "reaction.$.description" : {
    optional: true,
    type: String
  },
  "reaction.$.onset" : {
    optional: true,
    type: Date
  },
  "reaction.$.severity" : {
    optional: true,
    type: String
  },
  "reaction.$.exposureRoute" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "reaction.$.note" : {
    optional: true,
    type: AnnotationSchema
  }
});

let AllergyIntoleranceSchema = AllergyIntoleranceStu3;

// BaseSchema.extend(AllergyIntoleranceSchema);
// DomainResourceSchema.extend(AllergyIntoleranceSchema);
// AllergyIntolerances.attachSchema(AllergyIntoleranceSchema);


export default { AllergyIntolerance, AllergyIntolerances, AllergyIntoleranceSchema, AllergyIntoleranceStu3, AllergyIntoleranceDstu2 };
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

// REFACTOR:  we want to deprecate meteor/clinical:hl7-resource-datatypes
// so please remove references from the following line
// and replace with import from ../../datatypes/*
import { BaseSchema, DomainResourceSchema, IdentifierSchema, ContactPointSchema, AddressSchema, ReferenceSchema, SignatureSchema } from 'meteor/clinical:hl7-resource-datatypes';


// create the object using our BaseModel
let MedicationStatement = BaseModel.extend();

export let MedicationStatements = new Mongo.Collection('MedicationStatements');

//Assign a collection so the object knows how to perform CRUD operations
MedicationStatement.prototype._collection = MedicationStatements;

// // Create a persistent data store for addresses to be stored.
// // HL7.Resources.Patients = new Mongo.Collection('HL7.Resources.Patients');

// if(typeof MedicationStatements === 'undefined'){
//   if(Package['clinical:autopublish']){
//     let MedicationStatements = new Mongo.Collection('MedicationStatements');
//   } else if(Package['clinical:desktop-publish']){    
//     MedicationStatements = new Mongo.Collection('MedicationStatements');
//   } else {
//     MedicationStatements = new Mongo.Collection('MedicationStatements', {connection: null});
//   }
// }

//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
MedicationStatements._transform = function (document) {
  return new MedicationStatement(document);
};



let MedicationStatementDstu2 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "MedicationStatement"
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
  "patient" : {
    type: ReferenceSchema
  },
  "informationSource" : {
    optional: true,
    type: ReferenceSchema
  },
  "dateAsserted" : {
    optional: true,
    type: Date,
    defaultValue: new Date()    
  },
  "status" : {
    type: String,
    allowedValues: ['active', 'completed', 'entered-in-error', 'intended'],
    defaultValue: 'active'
  },
  "wasNotTaken" : {
    optional: true,
    type: Boolean,
    defaultValue: true
  },

  "reasonNotTaken" : {
    optional: true,
    type: Array
  },
  "reasonNotTaken.$" : {
    optional: true,
    type: CodeableConceptSchema 
  },
  "reasonForUseCodeableConcept" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "reasonForUseReference" : {
    optional: true,
    type: ReferenceSchema 
  },
  "effectiveDateTime" : {
    optional: true,
    type: Date,
    defaultValue: new Date()
  },
  "effectivePeriod" : {
    optional: true,
    type: PeriodSchema
  },
  "note" : {
    optional: true,
    type: String 
  },
  "supportingInformation" : {
    optional: true,
    type: Array 
  },
  "supportingInformation.$" : {
    optional: true,
    type: ReferenceSchema 
  },
  "medicationCodeableConcept" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "medicationReference" : {
    optional: true,
    type: ReferenceSchema
  },
  "dosage" : {
    optional: true,
    type: Array
  },
  "dosage.$" : {
    optional: true,
    blackbox: true,
    type: Object 
  },
  "dosage.$.text" : {
    optional: true,
    type: String 
  },
  "dosage.$.timing" : {
    optional: true,
    type: TimingSchema 
  },
  "dosage.$.asNeededBoolean" : {
    optional: true,
    type: Boolean 
  },
  "dosage.$.asNeededCodeableConcept" : {
    optional: true,
    type: CodeableConceptSchema 
  },
  "dosage.$.siteCodeableConcept" : {
    optional: true,
    type: CodeableConceptSchema 
  },
  "dosage.$.route" : {
    optional: true,
    type: CodeableConceptSchema 
  },
  "dosage.$.method" : {
    optional: true,
    type: CodeableConceptSchema 
  },
  "dosage.$.quantityQuantity" : {
    optional: true,
    type: QuantitySchema 
  },
  "dosage.$.quantityRange" : {
    optional: true,
    type: RangeSchema 
  },
  "dosage.$.rateRatio" : {
    optional: true,
    type: RatioSchema 
  },
  "dosage.$.rateRange" : {
    optional: true,
    type: RangeSchema 
  },
  "dosage.$.maxDosePerPeriod" : {
    optional: true,
    type: RatioSchema 
  }
});




let MedicationStatementStu3 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "MedicationStatement"
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
  "basedOn" : {
    optional: true,
    type: Array
  },
  "basedOn.$" : {
    optional: true,
    type: ReferenceSchema 
  },
  "partOf" : {
    optional: true,
    type: Array
  },  
  "partOf.$" : {
    optional: true,
    type: ReferenceSchema 
  },  
  "context" : {
    optional: true,
    type: ReferenceSchema
  },
  "status" : {
    type: String,
    allowedValues: ['active', 'completed', 'entered-in-error', 'intended', 'stopped', 'on-hold'],
    defaultValue: 'active'
  },
  "category" : {
    optional: true,
    type: CodeableConcept
  },  
  "medicationCodeableConcept" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "medicationReference" : {
    optional: true,
    type: ReferenceSchema
  },
  "effectiveDateTime" : {
    optional: true,
    type: Date,
    defaultValue: new Date()
  },
  "effectivePeriod" : {
    optional: true,
    type: PeriodSchema
  },
  "dateAsserted" : {
    optional: true,
    type: Date,
    defaultValue: new Date()    
  },
  "informationSource" : {
    optional: true,
    type: ReferenceSchema
  },
  "subject" : {
    type: ReferenceSchema
  },
  "derivedFrom" : {
    optional: true,
    type: Array
  },
  "derivedFrom.$" : {
    optional: true,
    type: ReferenceSchema
  },
  "taken" : {
    type: String,
    allowedValues: ['y', 'n', 'unk', 'na'],
    defaultValue: 'y'
  },
  "reasonNotTaken" : {
    optional: true,
    type: Array
  },
  "reasonNotTaken.$" : {
    optional: true,
    type: CodeableConceptSchema 
  },
  "reasonCode" : {
    optional: true,
    type: Array
  },
  "reasonCode" : {
    optional: true,
    type: CodeableConceptSchema 
  },
  "note" : {
    optional: true,
    type: Array
  },
  "note.$" : {
    optional: true,
    type: AnnotationSchema 
  },
  "dosage" : {
    optional: true,
    type: Array
  },
  "dosage.$" : {
    optional: true,
    blackbox: true,
    type: Object 
  }
});

let MedicationStatementSchema = MedicationStatementDstu2;

// MedicationStatementSchema.extend(BaseSchema);
// MedicationStatementSchema.extend(DomainResourceSchema);

// MedicationStatements.attachSchema(MedicationStatementSchema);

export default { MedicationStatement, MedicationStatements, MedicationStatementSchema, MedicationStatementDstu2, MedicationStatementStu3 };
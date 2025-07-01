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


// // create the object using our BaseModel
let Composition = BaseModel.extend();

// // Create a persistent data store for addresses to be stored.
export let Compositions = new Mongo.Collection('Compositions');


// //Assign a collection so the object knows how to perform CRUD operations
Composition.prototype._collection = Compositions;



// //Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Compositions._transform = function (document) {
  return new Composition(document);
};



let CompositionSchemaR4 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "Composition"
  },
  "_id" : {
    type: String,
    optional: true
  },
  "id" : {
    type: String,
    optional: true
  },
  "meta" : {
    type: Object,
    optional: true,
    blackbox: true
  },
  "identifier" : { 
    optional: true,
    type: IdentifierSchema
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
  "masterIdentifier" : {
    optional: true,
    type:  Array
    },
  "masterIdentifier.$" : {
    optional: true,
    type:  IdentifierSchema 
    },
  "status" : {
    optional: true,
    type: String
  }, 
  "type" : { 
    optional: true,
    type: CodeableConceptSchema
  }, 
  "category" : {
    optional: true,
    type:  Array
  },
  "category.$" : {
    optional: true,
    type: CodeableConceptSchema
  },
  "subject" : { 
    optional: true,
    type: ReferenceSchema 
  }, 
  "encounter" : { 
    optional: true,
    type: ReferenceSchema
  }, 
  "date" : {
    optional: true,
    type: Date
  }, 
  "author" : {
    optional: true,
    type:  Array
  }, 
  "author.$" : {
    optional: true,
    type: ReferenceSchema 
  }, 
  "title" : {
    optional: true,
    type: String
  }, 
  "confidentiality" : {
    optional: true,
    type: Code
  }, 
  "attester" : {
    optional: true,
    type: Object 
  }, 
  "attester.mode" : {
    optional: true,
    type: Code 
  }, 
  "attester.time" : {
    optional: true,
    type: Date
  }, 
  "attester.party" : { 
    optional: true,
    type: ReferenceSchema
  },
  "custodian" : { 
    optional: true,
    type: ReferenceSchema
  }, 
  "relatesTo" : {
    optional: true,
    type:  Array
  }, 
  "relatesTo.$" : {
    optional: true,
    type:  Object
  }, 
  "relatesTo.$.code" : {
    optional: true,
    type: Code
  },     
  "relatesTo.$.targetIdentifier" : { 
    optional: true,
    type: IdentifierSchema 
  },
  "relatesTo.$.targetReference" : { 
    optional: true,
    type: ReferenceSchema 
  },
  "event" : {
    optional: true,
    type:  Array
  }, 
  "event.$" : {
    optional: true,
    type:  Object
  }, 
  "event.$.code" : {
    optional: true,
    type: CodeableConceptSchema 
  }, 
  "event.$.period" : { 
    optional: true,
    type: PeriodSchema 
  }, 
  "event.$.detail" : {
    optional: true,
    type: ReferenceSchema 
  }, 
  "section" : {
    optional: true,
    type: Array
  }, 
  "section.$" : {
    optional: true,
    type: Object
  }, 
  "section.$.title" : {
    optional: true,
    type: String
  }, 
  "section.$.code" : { 
    optional: true,
    type: CodeableConceptSchema 
  }, 
  "section.$.text" : { 
    optional: true,
    type: NarrativeSchema 
  }, 
  "section.$.mode" : {
    optional: true,
    type: Code
  }, 
  "section.$.orderedBy" : { 
    optional: true,
    type: CodeableConceptSchema 
  }, 
  "section.$.entry" : {
    optional: true,
    type: ReferenceSchema 
  }, 
  "section.$.emptyReason" : { 
    optional: true,
    type: CodeableConceptSchema 
  },
  "section.$.section" : {
    optional: true,
    blackbox: true,
    type: Object 
  } 
});

// Compositions.attachSchema(CompositionSchemaR4);
let CompositionSchema = CompositionSchemaR4;

export default { Composition, Compositions, CompositionSchema, CompositionSchemaR4 };


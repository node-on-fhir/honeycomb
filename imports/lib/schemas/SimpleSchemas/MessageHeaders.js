import SimpleSchema from 'simpl-schema';

// if(Package['clinical:autopublish']){
//   console.log("*****************************************************************************")
//   console.log("HIPAA WARNING:  Your app has the 'clinical-autopublish' package installed.");
//   console.log("Any protected health information (PHI) stored in this app should be audited."); 
//   console.log("Please consider writing secure publish/subscribe functions and uninstalling.");  
//   console.log("");  
//   console.log("meteor remove clinical:autopublish");  
//   console.log("");  
// }
// if(Package['autopublish']){
//   console.log("*****************************************************************************")
//   console.log("HIPAA WARNING:  DO NOT STORE PROTECTED HEALTH INFORMATION IN THIS APP. ");  
//   console.log("Your application has the 'autopublish' package installed.  Please uninstall.");
//   console.log("");  
//   console.log("meteor remove autopublish");  
//   console.log("meteor add clinical:autopublish");  
//   console.log("");  
// }

import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';


// create the object using our BaseModel
let MessageHeader = BaseModel.extend();

export let MessageHeaders = new Mongo.Collection('MessageHeaders');

//Assign a collection so the object knows how to perform CRUD operations
MessageHeader.prototype._collection = MessageHeaders;



//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
MessageHeaders._transform = function (document) {
  return new MessageHeader(document);
};


let MessageHeaderR4 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "MessageHeader"
  },
  "_id" : {
    optional: true,
    type: String
    },
  "id" : {
    optional: true,
    type: String
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
});


let MessageHeaderSchema = MessageHeaderR4;

BaseSchema.extend(MessageHeaderR4);
DomainResourceSchema.extend(MessageHeaderR4);

// MessageHeaders.attachSchema(MessageHeaderR4);


MessageHeader.prototype.toFhir = function(){
  console.log('MessageHeader.toFhir()');

  return EJSON.stringify(this.name);
}

/**
 * @summary Search the MessageHeaders collection for those sent by a specific userId.
 * @memberOf MessageHeaders
 * @name findMessageHeadersSentByUserId
 * @version 1.2.3
 * @returns array of communications
 * @example
 * ```js
 *  let communications = MessageHeaders.findMessageHeadersSentByUserId(Meteor.userId());
 *  let communication = communications[0];
 * ```
 */

MessageHeaders.findMessageHeadersSentByUserId = function (userId) {
  process.env.TRACE && console.log("MessageHeaders.findMessageHeadersSentByUserId()");
  return MessageHeaders.find({'sender.value': userId});
};

/**
 * @summary Search the MessageHeaders collection for those sent by a specific userId.
 * @memberOf MessageHeaders
 * @name findMessageHeadersSentToUserId
 * @version 1.2.3
 * @returns array of communications
 * @example
 * ```js
 *  let communications = MessageHeaders.findMessageHeadersSentByUserId(Meteor.userId());
 *  let communication = communications[0];
 * ```
 */
MessageHeaders.findMessageHeadersSentToUserId = function (userId) {
  process.env.TRACE && console.log("MessageHeaders.findMessageHeadersSentToUserId()");
  return MessageHeaders.find({'recipient.value': userId});
};


/**
 * @summary Search the MessageHeaders collection for a specific Meteor.userId().
 * @memberOf MessageHeaders
 * @name findMrn
 * @version 1.2.3
 * @returns {Boolean}
 * @example
 * ```js
 *  let communications = MessageHeaders.findMrn('12345').fetch();
 * ```
 */
MessageHeaders.findConversation = function (conversationId, sort=1) {
  process.env.TRACE && console.log("MessageHeaders.findMrn()");  
  return MessageHeaders.find(
    { 'partOf.identifier.value': conversationId}, 
    { 'sort': { 'received': sort } });
};

/**
 * @summary Search the MessageHeaders collection for a specific query.
 * @memberOf MessageHeaders
 */

MessageHeaders.fetchBundle = function (query, parameters, callback) {
  process.env.TRACE && console.log("MessageHeaders.fetchBundle()");  
  var communicationArray = MessageHeaders.find(query, parameters, callback).map(function(communication){
    communication.id = communication._id;
    delete communication._document;
    return communication;
  });

  // console.log("communicationArray", communicationArray);

  var result = Bundle.generate(communicationArray);

  // console.log("result", result.entry[0]);

  return result;
};




// MessageHeaders.prototype.insertUnique = function(record){
//   console.log('MessageHeaders.prototype.insertUnique');

//   if(MessageHeaders.findConversation(record._id)){
//     MessageHeaders.insert(record)    
//   }
// }

MessageHeaders.insertUnique = function (record) {
  console.log("MessageHeaders.insertUnique()");
  console.log("MessageHeaders.findOne(record._id)", MessageHeaders.findOne(record._id));

  if(!MessageHeaders.findOne(record._id)){
    let collectionConfig = {};
    if(Meteor.isClient){
      collectionConfig = { validate: false, filter: false }
    }
    let communicationId = MessageHeaders.insert(record, collectionConfig);    
    console.log('MessageHeader created: ' + communicationId);
    return communicationId;
  }
};


export default { MessageHeader, MessageHeaders, MessageHeaderR4, MessageHeaderSchema };
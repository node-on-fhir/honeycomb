import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

/*
var hipaaEvent = {
  eventType: "",
  userId: "",
  userName: "",
  collectionName: "",
  recordId: "",
  patientId: "",
  patientName: "",
  message: ""
};
*/


HipaaLogger = {
  /**
  * @summary Detects if a specific environment variable was exposed from the server.
  * @locus Client
  * @memberOf HipaaLogger
  * @name logAuditEvent
  * @param AuditEvent
  * @version 1.2.3
  */

  logAuditEvent: function(auditEvent){
    check(auditEvent, Object);

    process.env.DEBUG && console.log('auditEvent', auditEvent);    

    return Meteor.call("logAuditEvent", auditEvent, function (error, result){
      if (error){
        console.log("error", error);
      }
      if (result){
         return result
      }
    });
  },
  /**
  * @summary Detects if a specific environment variable was exposed from the server.
  * @locus Client
  * @memberOf HipaaLogger
  * @name logEvent
  * @param hipaaEvent.eventType
  * @param hipaaEvent.userId
  * @param hipaaEvent.userName
  * @param hipaaEvent.collectionName
  * @param hipaaEvent.recordId
  * @param hipaaEvent.patientId
  * @param hipaaEvent.patientName
  * @param hipaaEvent.message
  * @version 1.2.3
  * @example
  * ```js
  * var hipaaEvent = {
  *   eventType: "update",
  *   userId: Meteor.userId(),
  *   userName: Meteor.user().fullName(),
  *   collectionName: "Medications",
  *   recordId: Random.id(),
  *   patientId: Session.get('currentPatientId'),
  *   patientName: Session.get('currentPatientName')
  * };
  * HipaaLogger.logEvent(hipaaEvent);
  * ```
  */
  logEvent: function(hipaaEvent){
    check(hipaaEvent, Object);

    return Meteor.call("logEvent", hipaaEvent, function (error, result){
      if (error){
        console.log("error", error);
      }
      if (result){
         return result
      }
    });
  }
};

import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';
import { Accounts } from 'meteor/accounts-base';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

convertDatesToValidDate = function(document){
  // we need to check if the birthdate is a valid string
  let newDate = moment(document.birthDate).toDate();

  // moment() is a champ for doing this, but will return an Invalid Date object
  // which we have to check for with this wacky function
  if ( Object.prototype.toString.call(newDate) === "[object Date]" ) {
    // it is a date
    if ( isNaN( newDate.getTime() ) ) {  // d.valueOf() could also work
      // date is not valid
      delete document.birthDate;
    }
    else {
      // date is valid
      document.birthDate = newDate;
    }
  }
  else {
    // not a date
    delete document.birthDate;
  }
  return document;
};

export const insertCommunication = new ValidatedMethod({
  name: 'communications.insert',
  validate: new SimpleSchema({
    'name.$.text': { type: String },
    'identifier': { type: [ String ], optional: true },
    'gender': { type: String, optional: true },
    'active': { type: Boolean, optional: true },
    'birthDate': { type: String, optional: true },
    'photo.$.url': { type: String, optional: true }
  }).validator(),
  run(document) {

    console.log("insertCommunication", document);

    document = convertDatesToValidDate(document);
    console.log("convertDatesToValidDate", document);

    if (process.env.NODE_ENV === "test") {
      document.test = true;
    } else {
      document.test = false;
    }

    // now that's all done, we can insert the document
    return Communications.insert(document);
  }
});

export const updateCommunication = new ValidatedMethod({
  name: 'communications.update',
  validate: new SimpleSchema({
    _id: { type: String },
    'update': { type: Object, blackbox: true, optional: true}
  }).validator(),
  run({ _id, update }) {
    console.log("updateCommunication");
    console.log("_id", _id);
    console.log("update", update);

    update = convertDatesToValidDate(update);

    let communication = Communications.findOne({_id: _id});

    delete communication._id;
    delete communication._document;
    delete communication._super_;
    delete communication._collection;

    console.log("update.name", update.name);
    update.name[0].resourceType = 'HumanName';



    communication.name = [];
    communication.name.push(update.name[0]);
    communication.gender = update.gender;
    communication.photo = [];

    if (update.birthDate) {
      communication.birthDate = update.birthDate;
    }
    if (update && update.photo && update.photo[0] && update.photo[0].url) {
      communication.photo.push({
        url: update.photo[0].url
      });
    }

    console.log("diffedCommunication", communication);
    return Communications.update({_id: _id}, { $set: communication });
  }
});

export const removeCommunicationById = new ValidatedMethod({
  name: 'communications.removeById',
  validate: new SimpleSchema({
    _id: { type: String }
  }).validator(),
  run({ _id }) {
    console.log("Removing user " + _id);
    return Communications.remove({_id: _id});
  }
});



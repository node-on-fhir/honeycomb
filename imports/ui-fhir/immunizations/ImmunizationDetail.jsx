import { 
  Grid,
  Card,
  Button,
  CardHeader,
  CardContent,
  CardActions,
  Typography,
  TextField,
  DatePicker
} from '@mui/material';


import React from 'react';
import { useTracker } from 'meteor/react-meteor-data';

import { get, set } from 'lodash';
import PropTypes from 'prop-types';


Session.setDefault('selectedImmunization', false);

export class ImmunizationDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      immunizationId: false,
      immunization: {
        resourceType: "Immunization",
        status: 'completed',
        wasNotGiven: false,
        identifier: [{
          use: 'official',
          value: ''
        }],
        vaccineCode: {
          text: ''
        },
        date: null,
        patient: {
          reference: "",
          display: ""
        }
      },
      form: {
        patientDisplay: '',
        patientReference: '',
        performerDisplay: '',
        performerReference: '',
        identifier: '',
        status: '',
        vaccineCode: '',
        reported: true,
        date: ''
      }
    }
  }
  dehydrateFhirResource(immunization) {
    let formData = Object.assign({}, this.state.form);

    formData.patientDisplay = get(immunization, 'patient.display')
    formData.patientReference = get(immunization, 'patient.reference')
    formData.performerDisplay = get(immunization, 'performer.display')    
    formData.performerReference = get(immunization, 'performer.reference')    
    formData.identifier = get(immunization, 'identifier[0].value')
    formData.status = get(immunization, 'status')
    formData.vaccineCode = get(immunization, 'vaccineCode.text')
    formData.reported = get(immunization, 'reported')
    formData.date = get(immunization, 'date')

    return formData;
  }
  shouldComponentUpdate(nextProps){
    process.env.NODE_ENV === "test" && console.log('ImmunizationDetail.shouldComponentUpdate()', nextProps, this.state)
    let shouldUpdate = true;

    // both false; don't take any more updates
    if(nextProps.immunization === this.state.immunization){
      shouldUpdate = false;
    }

    // received an allergie from the table; okay lets update again
    if(nextProps.immunizationId !== this.state.immunizationId){
      this.setState({immunizationId: nextProps.immunizationId})    
      
      if(nextProps.immunization){
        this.setState({immunization: nextProps.immunization})     
        this.setState({form: this.dehydrateFhirResource(nextProps.immunization)})       
      }
      shouldUpdate = true;
    }
 
    return shouldUpdate;
  }
  getMeteorData() {
    let data = {
      immunizationId: this.props.immunizationId,
      immunization: false,
      form: this.state.form,
      showDatePicker: false
    };

    if(this.props.showDatePicker){
      data.showDatePicker = this.props.showDatePicker
    }

    if(this.props.immunization){
      data.immunization = this.props.immunization;
      data.form = this.dehydrateFhirResource(this.props.immunization);
    }

    console.log('ImmunizationDetail[data]', data);
    return data;
  }
  renderDatePicker(showDatePicker, effectiveDateTime){
    if (typeof effectiveDateTime === "string"){
      effectiveDateTime = moment(effectiveDateTime);
    }
    if (showDatePicker) {
      return(<div></div>)
      // return (
      //   <DatePicker 
      //     name='datePicker'
      //     hintText={this.setHint("Date of Administration" )}
      //     container="inline" 
      //     mode="landscape"
      //     value={ effectiveDateTime ? effectiveDateTime : ''}    
      //     onChange={ this.changeState.bind(this, 'date')}      
      //     />
      // );
    }
  }
  setHint(text){
    if(this.props.showHints !== false){
      return text;
    } else {
      return '';
    }
  }
  render() {
    if(process.env.NODE_ENV === "test") console.log('ImmunizationDetail.render()', this.state)
    let formData = this.data.form;

    return (
      <div id={this.props.id} className="immunizationDetail">
        <CardContent>
          <Row>
            <Col md={6}>
              <TextField
                id='identifierInput'
                ref='identifier'
                name='identifier'
                floatingLabelText='Identifier'
                value={ get(formData, 'identifier', '') }
                onChange={ this.changeState.bind(this, 'identifier')}
                floatingLabelFixed={true}
                hintText={this.setHint('Measles, Mumps, and Rubella')}
                fullWidth
                /><br/>
            </Col>
            <Col md={2}>
              <TextField
                id='vaccineCodeInput'
                ref='vaccineCode'
                name='vaccineCode'ß
                floatingLabelText='Vaccine Code'
                value={ get(formData, 'vaccineCode', '') }
                onChange={ this.changeState.bind(this, 'vaccineCode')}
                floatingLabelFixed={true}
                hintText={this.setHint('MMR')}
                fullWidth
                /><br/>
            </Col>
            <Col md={4}>
              <TextField
                id='statusInput'
                ref='status'
                name='status'
                floatingLabelText='Status'
                value={ get(formData, 'status', '') }
                onChange={ this.changeState.bind(this, 'status')}
                floatingLabelFixed={true}
                hintText={this.setHint('in-progress | on-hold | completed')}
                fullWidth
                /><br/>
            </Col>
          </Row>
          <Row>
            <Col md={3}>
              <TextField
                id='patientDisplayInput'
                ref='patientDisplay'
                name='patientDisplay'
                floatingLabelText='Patient Name'
                value={ get(formData, 'patientDisplay', '') }
                onChange={ this.changeState.bind(this, 'patientDisplay')}
                floatingLabelFixed={true}
                hintText={this.setHint('Jane Doe')}
                fullWidth
                /><br/>
            </Col>
            <Col md={3}>
              <TextField
                id='patientReferenceInput'
                ref='patientReference'
                name='patientReference'
                floatingLabelText='Patient Reference'
                value={ get(formData, 'patientReference', '') }
                onChange={ this.changeState.bind(this, 'patientReference')}
                floatingLabelFixed={true}
                hintText={this.setHint('Patient/1234567890')}
                fullWidth
                /><br/>
            </Col>
            <Col md={3}>
              <TextField
                id='performerDisplayInput'
                ref='performerDisplay'
                name='performerDisplay'
                floatingLabelText='Performer Name'
                value={ get(formData, 'performerDisplay', '') }
                onChange={ this.changeState.bind(this, 'performerDisplay')}
                floatingLabelFixed={true}
                hintText={this.setHint('Nurse Jackie')}
                fullWidth
                /><br/>
            </Col>
            <Col md={3}>
              <TextField
                id='performerReferenceInput'
                ref='performerReference'
                name='performerReference'
                floatingLabelText='Performer Reference'
                value={ get(formData, 'performerReference', '') }
                onChange={ this.changeState.bind(this, 'performerReference')}
                floatingLabelFixed={true}
                hintText={this.setHint('Practitioner/555')}
                fullWidth
                /><br/>
            </Col>
          </Row>

            <br/>
            { this.renderDatePicker(this.data.showDatePicker, get(this, 'data.immunizationForm.datePicker') ) }
            <br/>

        </CardContent>
        <CardActions>
          { this.determineButtons(this.data.immunizationId) }
        </CardActions>
      </div>
    );
  }

  determineButtons(immunizationId){
    if (immunizationId) {
      return (
        <div>
          <Button id="updateImmunizationButton" primary={true} onClick={this.handleSaveButton.bind(this)} style={{marginRight: '20px'}} >Save</Button>
          <Button id="deleteImmunizationButton" onClick={this.handleDeleteButton.bind(this)} >Delete</Button>
        </div>
      );
    } else {
      return(
        <Button id="saveImmunizationButton" primary={true} onClick={this.handleSaveButton.bind(this)} >Save</Button>
      );
    }
  }

  updateFormData(formData, field, textValue){
    if(process.env.NODE_ENV === "test") console.log("ImmunizationDetail.updateFormData", formData, field, textValue);

    switch (field) {
      case "patientDisplay":
        set(formData, 'patientDisplay', textValue)
        break;
      case "patientReference":
        set(formData, 'patientReference', textValue)
        break;
      case "performerDisplay":
        set(formData, 'performerDisplay', textValue)
        break;        
      case "performerReference":
        set(formData, 'performerReference', textValue)
        break;        
      case "identifier":
        set(formData, 'identifier', textValue)
        break;
      case "status":
        set(formData, 'status', textValue)
        break;
      case "vaccineCode":
        set(formData, 'vaccineCode', textValue)
        break;
      case "reported":
        set(formData, 'reported', textValue)
        break;
      case "date":
        set(formData, 'date', textValue)
        break;
      default:
    }

    if(process.env.NODE_ENV === "test") console.log("formData", formData);
    return formData;
  }
  updateImmunization(immunizationData, field, textValue){
    if(process.env.NODE_ENV === "test") console.log("ImmunizationDetail.updateImmunization", immunizationData, field, textValue);

    switch (field) {
      case "patientDisplay":
        set(immunizationData, 'patient.display', textValue)
        break;
      case "patientReference":
        set(immunizationData, 'patient.reference', textValue)
        break;
      case "performerDisplay":
        set(immunizationData, 'performer.display', textValue)
        break;        
      case "performerReference":
        set(immunizationData, 'performer.reference', textValue)
        break;        
      case "identifier":
        set(immunizationData, 'identifier[0].value', textValue)
        break;
      case "status":
        set(immunizationData, 'status', textValue)
        break;
      case "vaccineCode":
        set(immunizationData, 'vaccineCode.text', textValue)
        break;
      case "reported":
        set(immunizationData, 'reported', textValue)
        break;
      case "date":
        set(immunizationData, 'date', textValue)
        break;    
    }
    return immunizationData;
  }
  componentDidUpdate(props){
    if(process.env.NODE_ENV === "test") console.log('ImmunizationDetail.componentDidUpdate()', props, this.state)
  }

  // this could be a mixin
  changeState(field, event, textValue){
    if(process.env.NODE_ENV === "test") console.log("   ");
    if(process.env.NODE_ENV === "test") console.log("ImmunizationDetail.changeState", field, textValue);
    if(process.env.NODE_ENV === "test") console.log("this.state", this.state);

    let formData = Object.assign({}, this.state.form);
    let immunizationData = Object.assign({}, this.state.immunization);

    formData = this.updateFormData(formData, field, textValue);
    immunizationData = this.updateImmunization(immunizationData, field, textValue);

    if(process.env.NODE_ENV === "test") console.log("immunizationData", immunizationData);
    if(process.env.NODE_ENV === "test") console.log("formData", formData);

    this.setState({immunization: immunizationData})
    this.setState({form: formData})
  }

  handleSaveButton(){
    if(process.env.NODE_ENV === "test") console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^&&')
    console.log('Saving a new Immunization...', this.state)

    let self = this;
    let fhirImmunizationData = Object.assign({}, this.state.immunization);

    if(process.env.NODE_ENV === "test") console.log('fhirImmunizationData', fhirImmunizationData);


    let immunizationValidator = ImmunizationSchema.newContext();
    immunizationValidator.validate(fhirImmunizationData)

    console.log('IsValid: ', immunizationValidator.isValid())
    console.log('ValidationErrors: ', immunizationValidator.validationErrors());


    if (this.props.immunizationId) {
      if(process.env.NODE_ENV === "test") console.log("Updating immunization...");
      delete fhirImmunizationData._id;

      Immunizations._collection.update(
        {_id: this.props.immunizationId}, {$set: fhirImmunizationData }, function(error, result) {
          if (error) {
            console.log("error", error);

            // Bert.alert(error.reason, 'danger');
          }
          if (result) {
            HipaaLogger.logEvent({eventType: "update", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Immunizations", recordId: self.props.immunizationId});
            Session.set('immunizationPageTabIndex', 1);
            Session.set('selectedImmunization', false);
            Session.set('immunizationUpsert', false);
            // Bert.alert('Immunization updated!', 'success');
          }
        });
    } else {

      if(process.env.NODE_ENV === "test") console.log("Create a new Immunization", fhirImmunizationData);

      // var fhirImmunizationData = {
      //   "resourceType": "Immunization",
      //   'notGiven': true,
      //   'identifier': [],
      //   'vaccineCode': {
      //     'text': fhirImmunizationData.vaccineCode
      //   }
      // };

      // fhirImmunizationData.identifier.push({
      //   'use': 'official',
      //   'type': {
      //     'text': fhirImmunizationData.identifier
      //   }
      // });
      // fhirImmunizationData.identifier.push({
      //   'use': 'secondary',
      //   'type': {
      //     'text': fhirImmunizationData.vaccine
      //   }
      // });

      Immunizations._collection.insert(fhirImmunizationData, function(error, result) {
        if (error) {
          console.log("error", error);
          // Bert.alert(error.reason, 'danger');
        }
        if (result) {
          HipaaLogger.logEvent({eventType: "create", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Immunizations", recordId: result});
          Session.set('immunizationPageTabIndex', 1);
          Session.set('selectedImmunization', false);
          // Bert.alert('Immunization added!', 'success');
        }
      });
    }
  }

  handleCancelButton(){
    Session.set('immunizationPageTabIndex', 1);
  }

  handleDeleteButton(){
    let self = this;
    Immunizations._collection.remove({_id: this.props.immunizationId}, function(error, result){
      if (error) {
        // Bert.alert(error.reason, 'danger');
      }
      if (result) {
        HipaaLogger.logEvent({eventType: "delete", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Immunizations", recordId: self.props.immunizationId});
        Session.set('immunizationPageTabIndex', 1);
        Session.set('selectedImmunization', false);
        // Bert.alert('Immunization removed!', 'success');
      }
    });
  }
}

ImmunizationDetail.propTypes = {
  id: PropTypes.string,
  fhirVersion: PropTypes.string,
  immunizationId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  immunization: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  showPatientInputs: PropTypes.bool,
  showHints: PropTypes.bool,
  onInsert: PropTypes.func,
  onUpdate: PropTypes.func,
  onRemove: PropTypes.func,
  onCancel: PropTypes.func
};


export default ImmunizationDetail;
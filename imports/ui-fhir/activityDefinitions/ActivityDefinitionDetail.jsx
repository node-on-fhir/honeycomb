// =======================================================================
// Using DSTU2  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//
// https://www.hl7.org/fhir/DSTU2/activityDefinitions.html
//
//
// =======================================================================

import React from 'react';
import PropTypes from 'prop-types';

import { useTracker } from 'meteor/react-meteor-data';

import { 
  Button,
  Card,
  Checkbox,
  CardActions,
  CardContent,
  CardHeader,
  Grid,
  TextField,
  Select,
  MenuItem,
} from '@mui/material';

import { get, set } from 'lodash';


export class ActivityDefinitionDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activityDefinitionId: false,
      activityDefinition: {
        resourceType: "ActivityDefinition",
        patient: {
          reference: "",
          display: ""
        },
        asserter: {
          reference: "",
          display: ""
        },
        dateRecorded: null,
        code: {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: "",
              display: ""
            }
          ]
        },
        clinicalStatus: "active",
        verificationStatus: "confirmed",
        activityDefinition: [],
        onsetDateTime: null
      }, 
      form: {
        patientDisplay: '',
        asserterDisplay: '',
        snomedCode: '',
        snomedDisplay: '',
        clinicalStatus: '',
        verificationStatus: '',
        activityDefinitionDisplay: '',
        onsetDateTime: ''
      }
    }
  }
  dehydrateFhirResource(activityDefinition) {
    let formData = Object.assign({}, this.state.form);

    formData.patientDisplay = get(activityDefinition, 'patient.display')
    formData.asserterDisplay = get(activityDefinition, 'asserter.display')    
    formData.snomedCode = get(activityDefinition, 'code.coding[0].code')
    formData.snomedDisplay = get(activityDefinition, 'code.coding[0].display')
    formData.clinicalStatus = get(activityDefinition, 'clinicalStatus')
    formData.verificationStatus = get(activityDefinition, 'verificationStatus')
    formData.onsetDateTime = get(activityDefinition, 'onsetDateTime')

    return formData;
  }
  shouldComponentUpdate(nextProps){
    get(Meteor, 'settings.public.logging') === "debug" && console.log('ActivityDefinitionDetail.shouldComponentUpdate()', nextProps, this.state)
    let shouldUpdate = true;

    // received an activityDefinition from the table; okay lets update again
    if(nextProps.activityDefinitionId !== this.state.activityDefinitionId){
      
      if(nextProps.activityDefinition){
        this.setState({activityDefinition: nextProps.activityDefinition})     
        this.setState({form: this.dehydrateFhirResource(nextProps.activityDefinition)})       
      }

      this.setState({activityDefinitionId: nextProps.activityDefinitionId})
      shouldUpdate = true;
    }

    // both false; don't take any more updates
    if(nextProps.activityDefinition === this.state.activityDefinition){
      shouldUpdate = false;
    }
 
    return shouldUpdate;
  }

  getMeteorData() {
    let data = {
      activityDefinitionId: this.props.activityDefinitionId,
      activityDefinition: false,
      showDatePicker: false,
      form: this.state.form
    };

    if(this.props.showDatePicker){
      data.showDatePicker = this.props.showDatePicker
    }
    if(this.props.activityDefinition){
      data.activityDefinition = this.props.activityDefinition;
      data.form = this.dehydrateFhirResource(this.props.activityDefinition);
    }

    return data;
  }
  renderDatePicker(showDatePicker, form){
    let datePickerValue;

    if(get(form, 'onsetDateTime')){
      datePickerValue = get(form, 'onsetDateTime');
    }
    if(get(form, 'onsetPeriod.start')){
      datePickerValue = get(form, 'onsetPeriod.start');
    }
    if (typeof datePickerValue === "string"){
      datePickerValue = new Date(datePickerValue);
    }
    if (showDatePicker) {
      return (<div></div>)
      // return (
      //   <DatePicker 
      //     name='onsetDateTime'
      //     hintText="Onset Date" 
      //     container="inline" 
      //     mode="landscape"
      //     value={ datePickerValue ? datePickerValue : null }    
      //     onChange={ this.changeState.bind(this, 'onsetDateTime')}      
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
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('ActivityDefinitionDetail.render()', this.state)

    return (
      <div id={this.props.id} className="activityDefinitionDetail">
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={6}>
              <TextField
                id='patientDisplayInput'
                name='patientDisplay'
                label='Patient'
                value={ get(this, 'data.form.patientDisplay', '') }
                onChange={ this.changeState.bind(this, 'patientDisplay')}
                hintText={ this.setHint('Jane Doe') }
                //floatingLabelFixed={true}
                fullWidth
                /><br/>

              <TextField
                id='asserterDisplayInput'
                name='asserterDisplay'
                label='Asserter'
                value={ get(this, 'data.form.asserterDisplay', '') }
                onChange={ this.changeState.bind(this, 'asserterDisplay')}
                hintText={ this.setHint('Nurse Jackie') }
                //floatingLabelFixed={true}
                fullWidth
                /><br/>

              <TextField
                id='snomedCodeInput'
                name='snomedCode'
                label='SNOMED Code'
                value={ get(this, 'data.form.snomedCode', '') }
                hintText={ this.setHint('307343001') }
                onChange={ this.changeState.bind(this, 'snomedCode')}
                //floatingLabelFixed={true}
                fullWidth
                /><br/>

              <TextField
                id='snomedDisplayInput'
                name='snomedDisplay'
                label='SNOMED Display'
                value={ get(this, 'data.form.snomedDisplay', '') }
                onChange={ this.changeState.bind(this, 'snomedDisplay')}
                hintText={ this.setHint('Acquired hemoglobin H disease (disorder)') }
                //floatingLabelFixed={true}
                fullWidth
                /><br/>

              <TextField
                id='clinicalStatusInput'
                name='clinicalStatus'
                label='Clinical Status'
                value={ get(this, 'data.form.clinicalStatus', '') }
                hintText={ this.setHint('active | recurrence | inactive | remission | resolved') }
                onChange={ this.changeState.bind(this, 'clinicalStatus')}
                //floatingLabelFixed={true}
                fullWidth
                /><br/>

              <TextField
                id='verificationStatusInput'
                name='verificationStatus'
                label='Verification Status'
                value={ get(this, 'data.form.verificationStatus', '') }
                hintText={ this.setHint('provisional | differential | confirmed | refuted | entered-in-error | unknown') }
                onChange={ this.changeState.bind(this, 'verificationStatus')}
                //floatingLabelFixed={true}
                fullWidth
                /><br/>
            </Grid>
            <Grid item xs={6}>
            </Grid>
          </Grid>

          <br/>
          { this.renderDatePicker(this.data.showDatePicker, get(this, 'data.form') ) }
          <br/>

          <a href='http://browser.ihtsdotools.org/?perspective=full&conceptId1=404684003&edition=us-edition&release=v20180301&server=https://prod-browser-exten.ihtsdotools.org/api/snomed&langRefset=900000000000509007'>Lookup codes with the SNOMED CT Browser</a>

        </CardContent>
        <CardActions>
          { this.determineButtons(this.state.activityDefinitionId) }
        </CardActions>
      </div>
    );
  }

  determineButtons(activityDefinitionId){
    if (activityDefinitionId) {
      return (
        <div>
          <Button id="updateActivityDefinitionButton" primary={true} onClick={this.handleSaveButton.bind(this)} style={{marginRight: '20px'}} >Save</Button>
          <Button id="deleteActivityDefinitionButton" onClick={this.handleDeleteButton.bind(this)} >Delete</Button>
        </div>
      );
    } else {
      return(
        <Button id="saveActivityDefinitionButton" primary={true} onClick={this.handleSaveButton.bind(this)} >Save</Button>
      );
    }
  }


  updateFormData(formData, field, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("ActivityDefinitionDetail.updateFormData", formData, field, textValue);

    switch (field) {
      case "patientDisplay":
        set(formData, 'patientDisplay', textValue)
        break;
      case "asserterDisplay":
        set(formData, 'asserterDisplay', textValue)
        break;        
      case "verificationStatus":
        set(formData, 'verificationStatus', textValue)
        break;
      case "clinicalStatus":
        set(formData, 'clinicalStatus', textValue)
        break;
      case "snomedCode":
        set(formData, 'snomedCode', textValue)
        break;
      case "snomedDisplay":
        set(formData, 'snomedDisplay', textValue)
        break;
      case "activityDefinitionDisplay":
        set(formData, 'activityDefinitionDisplay', textValue)
        break;
      case "onsetDateTime":
        set(formData, 'onsetDateTime', textValue)
        break;
      default:
    }

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("formData", formData);
    return formData;
  }
  updateActivityDefinition(activityDefinitionData, field, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("ActivityDefinitionDetail.updateActivityDefinition", activityDefinitionData, field, textValue);

    switch (field) {
      case "patientDisplay":
        set(activityDefinitionData, 'patient.display', textValue)
        break;
      case "asserterDisplay":
        set(activityDefinitionData, 'asserter.display', textValue)
        break;
      case "verificationStatus":
        set(activityDefinitionData, 'verificationStatus', textValue)
        break;
      case "clinicalStatus":
        set(activityDefinitionData, 'clinicalStatus', textValue)
        break;
      case "snomedCode":
        set(activityDefinitionData, 'code.coding[0].code', textValue)
        break;
      case "snomedDisplay":
        set(activityDefinitionData, 'code.coding[0].display', textValue)
        break;
      case "activityDefinitionDisplay":
        set(activityDefinitionData, 'activityDefinition[0].detail[0].display', textValue)
        break;  
      case "datePicker":
        set(activityDefinitionData, 'onsetDateTime', textValue)
        break;
      case "onsetDateTime":
        set(activityDefinitionData, 'onsetDateTime', textValue)
        break;
  
    }
    return activityDefinitionData;
  }
  componentDidUpdate(props){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('ActivityDefinitionDisplay.componentDidUpdate()', props, this.state)
  }
  // this could be a mixin
  changeState(field, event, textValue){

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("   ");
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("ActivityDefinitionDetail.changeState", field, textValue);
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("this.state", this.state);

    let formData = Object.assign({}, this.state.form);
    let activityDefinitionData = Object.assign({}, this.state.activityDefinition);

    formData = this.updateFormData(formData, field, textValue);
    activityDefinitionData = this.updateActivityDefinition(activityDefinitionData, field, textValue);

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("activityDefinitionData", activityDefinitionData);
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("formData", formData);

    this.setState({activityDefinition: activityDefinitionData})
    this.setState({form: formData})

  }

  handleSaveButton(){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^&&')
    console.log('Saving a new ActivityDefinition...', this.state)

    let self = this;
    let fhirActivityDefinitionData = Object.assign({}, this.state.activityDefinition);

    if(get(Meteor, 'settings.public.logging') === "debug") console.log('fhirActivityDefinitionData', fhirActivityDefinitionData);


    let activityDefinitionValidator = ActivityDefinitionSchema.newContext();
    activityDefinitionValidator.validate(fhirActivityDefinitionData)

    console.log('IsValid: ', activityDefinitionValidator.isValid())
    console.log('ValidationErrors: ', activityDefinitionValidator.validationErrors());

    if (this.state.activityDefinitionId) {
      if(get(Meteor, 'settings.public.logging') === "debug") console.log("Updating ActivityDefinition...");
      delete fhirActivityDefinitionData._id;

      ActivityDefinitions._collection.update(
        {_id: this.state.activityDefinitionId}, {$set: fhirActivityDefinitionData }, function(error, result) {
          if (error) {
            console.log("error", error);
            // Bert.alert(error.reason, 'danger');
          }
          if (result) {
            if(self.props.onUpdate){
              self.props.onUpdate(self.data.activityDefinitionId);
            }
            // Bert.alert('ActivityDefinition updated!', 'success');
          }
        });
    } else {

      if(get(Meteor, 'settings.public.logging') === "debug") console.log("Create a new ActivityDefinition", fhirActivityDefinitionData);

      ActivityDefinitions._collection.insert(fhirActivityDefinitionData, function(error, result) {
        if (error) {
          console.log("error", error);
          // Bert.alert(error.reason, 'danger');
        }
        if (result) {
          if(self.props.onInsert){
            self.props.onInsert(self.data.activityDefinitionId);
          }
          // Bert.alert('ActivityDefinition added!', 'success');
        }
      });
    }
  }

  handleCancelButton(){
    if(this.props.onCancel){
      this.props.onCancel();
    }
  }

  handleDeleteButton(){
    console.log('ActivityDefinitionDetail.handleDeleteButton()', this.state.activityDefinitionId)

    let self = this;
    ActivityDefinitions._collection.remove({_id: this.state.activityDefinitionId}, function(error, result){
      if (error) {
        // Bert.alert(error.reason, 'danger');
      }
      if (result) {
        if(this.props.onInsert){
          this.props.onInsert(self.data.activityDefinitionId);
        }
        // Bert.alert('ActivityDefinition removed!', 'success');
      }
    });
  }
}

ActivityDefinitionDetail.propTypes = {
  id: PropTypes.string,
  activityDefinitionId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  activityDefinition: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  showDatePicker: PropTypes.bool,
  showHints: PropTypes.bool,
  onInsert: PropTypes.func,
  onUpdate: PropTypes.func,
  onRemove: PropTypes.func,
  onCancel: PropTypes.func
};

export default ActivityDefinitionDetail;
// =======================================================================
// Using DSTU2  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//
// https://www.hl7.org/fhir/DSTU2/conditions.html
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

  
export class ConditionDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      conditionId: false,
      condition: {
        resourceType: "Condition",
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
        evidence: [],
        onsetDateTime: null
      }, 
      form: {
        patientDisplay: '',
        asserterDisplay: '',
        snomedCode: '',
        snomedDisplay: '',
        clinicalStatus: '',
        verificationStatus: '',
        evidenceDisplay: '',
        onsetDateTime: ''
      }
    }
  }
  dehydrateFhirResource(condition) {
    let formData = Object.assign({}, this.state.form);

    formData.patientDisplay = get(condition, 'patient.display')
    formData.asserterDisplay = get(condition, 'asserter.display')    
    formData.snomedCode = get(condition, 'code.coding[0].code')
    formData.snomedDisplay = get(condition, 'code.coding[0].display')
    formData.clinicalStatus = get(condition, 'clinicalStatus')
    formData.verificationStatus = get(condition, 'verificationStatus')
    formData.onsetDateTime = get(condition, 'onsetDateTime')

    return formData;
  }
  shouldComponentUpdate(nextProps){
    get(Meteor, 'settings.public.logging') === "debug" && console.log('ConditionDetail.shouldComponentUpdate()', nextProps, this.state)
    let shouldUpdate = true;

    // received an condition from the table; okay lets update again
    if(nextProps.conditionId !== this.state.conditionId){
      
      if(nextProps.condition){
        this.setState({condition: nextProps.condition})     
        this.setState({form: this.dehydrateFhirResource(nextProps.condition)})       
      }

      this.setState({conditionId: nextProps.conditionId})
      shouldUpdate = true;
    }

    // both false; don't take any more updates
    if(nextProps.condition === this.state.condition){
      shouldUpdate = false;
    }
 
    return shouldUpdate;
  }

  getMeteorData() {
    let data = {
      conditionId: this.props.conditionId,
      condition: false,
      showDatePicker: false,
      form: this.state.form
    };

    if(this.props.showDatePicker){
      data.showDatePicker = this.props.showDatePicker
    }
    if(this.props.condition){
      data.condition = this.props.condition;
      data.form = this.dehydrateFhirResource(this.props.condition);
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
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('ConditionDetail.render()', this.state)

    return (
      <div id={this.props.id} className="conditionDetail">
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
          { this.determineButtons(this.state.conditionId) }
        </CardActions>
      </div>
    );
  }

  determineButtons(conditionId){
    if (conditionId) {
      return (
        <div>
          <Button id="updateConditionButton" primary={true} onClick={this.handleSaveButton.bind(this)} style={{marginRight: '20px'}} >Save</Button>
          <Button id="deleteConditionButton" onClick={this.handleDeleteButton.bind(this)} >Delete</Button>
        </div>
      );
    } else {
      return(
        <Button id="saveConditionButton" primary={true} onClick={this.handleSaveButton.bind(this)} >Save</Button>
      );
    }
  }


  updateFormData(formData, field, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("ConditionDetail.updateFormData", formData, field, textValue);

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
      case "evidenceDisplay":
        set(formData, 'evidenceDisplay', textValue)
        break;
      case "onsetDateTime":
        set(formData, 'onsetDateTime', textValue)
        break;
      default:
    }

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("formData", formData);
    return formData;
  }
  updateCondition(conditionData, field, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("ConditionDetail.updateCondition", conditionData, field, textValue);

    switch (field) {
      case "patientDisplay":
        set(conditionData, 'patient.display', textValue)
        break;
      case "asserterDisplay":
        set(conditionData, 'asserter.display', textValue)
        break;
      case "verificationStatus":
        set(conditionData, 'verificationStatus', textValue)
        break;
      case "clinicalStatus":
        set(conditionData, 'clinicalStatus', textValue)
        break;
      case "snomedCode":
        set(conditionData, 'code.coding[0].code', textValue)
        break;
      case "snomedDisplay":
        set(conditionData, 'code.coding[0].display', textValue)
        break;
      case "evidenceDisplay":
        set(conditionData, 'evidence[0].detail[0].display', textValue)
        break;  
      case "datePicker":
        set(conditionData, 'onsetDateTime', textValue)
        break;
      case "onsetDateTime":
        set(conditionData, 'onsetDateTime', textValue)
        break;
  
    }
    return conditionData;
  }
  componentDidUpdate(props){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('ConditionDisplay.componentDidUpdate()', props, this.state)
  }
  // this could be a mixin
  changeState(field, event, textValue){

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("   ");
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("ConditionDetail.changeState", field, textValue);
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("this.state", this.state);

    let formData = Object.assign({}, this.state.form);
    let conditionData = Object.assign({}, this.state.condition);

    formData = this.updateFormData(formData, field, textValue);
    conditionData = this.updateCondition(conditionData, field, textValue);

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("conditionData", conditionData);
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("formData", formData);

    this.setState({condition: conditionData})
    this.setState({form: formData})

  }

  handleSaveButton(){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^&&')
    console.log('Saving a new Condition...', this.state)

    let self = this;
    let fhirConditionData = Object.assign({}, this.state.condition);

    if(get(Meteor, 'settings.public.logging') === "debug") console.log('fhirConditionData', fhirConditionData);


    let conditionValidator = ConditionSchema.newContext();
    conditionValidator.validate(fhirConditionData)

    console.log('IsValid: ', conditionValidator.isValid())
    console.log('ValidationErrors: ', conditionValidator.validationErrors());

    if (this.state.conditionId) {
      if(get(Meteor, 'settings.public.logging') === "debug") console.log("Updating Condition...");
      delete fhirConditionData._id;

      Conditions._collection.update(
        {_id: this.state.conditionId}, {$set: fhirConditionData }, function(error, result) {
          if (error) {
            console.log("error", error);
            // Bert.alert(error.reason, 'danger');
          }
          if (result) {
            if(self.props.onUpdate){
              self.props.onUpdate(self.data.conditionId);
            }
            // Bert.alert('Condition updated!', 'success');
          }
        });
    } else {

      if(get(Meteor, 'settings.public.logging') === "debug") console.log("Create a new Condition", fhirConditionData);

      Conditions._collection.insert(fhirConditionData, function(error, result) {
        if (error) {
          console.log("error", error);
          // Bert.alert(error.reason, 'danger');
        }
        if (result) {
          if(self.props.onInsert){
            self.props.onInsert(self.data.conditionId);
          }
          // Bert.alert('Condition added!', 'success');
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
    console.log('ConditionDetail.handleDeleteButton()', this.state.conditionId)

    let self = this;
    Conditions._collection.remove({_id: this.state.conditionId}, function(error, result){
      if (error) {
        // Bert.alert(error.reason, 'danger');
      }
      if (result) {
        if(this.props.onInsert){
          this.props.onInsert(self.data.conditionId);
        }
        // Bert.alert('Condition removed!', 'success');
      }
    });
  }
}

ConditionDetail.propTypes = {
  id: PropTypes.string,
  conditionId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  condition: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  showDatePicker: PropTypes.bool,
  showHints: PropTypes.bool,
  onInsert: PropTypes.func,
  onUpdate: PropTypes.func,
  onRemove: PropTypes.func,
  onCancel: PropTypes.func
};

export default ConditionDetail;
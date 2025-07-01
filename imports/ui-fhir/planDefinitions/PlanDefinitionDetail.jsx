// =======================================================================
// Using DSTU2  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//
// https://www.hl7.org/fhir/DSTU2/planDefinitions.html
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


export class PlanDefinitionDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      planDefinitionId: false,
      planDefinition: {
        resourceType: "PlanDefinition",
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
        planDefinition: [],
        onsetDateTime: null
      }, 
      form: {
        patientDisplay: '',
        asserterDisplay: '',
        snomedCode: '',
        snomedDisplay: '',
        clinicalStatus: '',
        verificationStatus: '',
        planDefinitionDisplay: '',
        onsetDateTime: ''
      }
    }
  }
  dehydrateFhirResource(planDefinition) {
    let formData = Object.assign({}, this.state.form);

    formData.patientDisplay = get(planDefinition, 'patient.display')
    formData.asserterDisplay = get(planDefinition, 'asserter.display')    
    formData.snomedCode = get(planDefinition, 'code.coding[0].code')
    formData.snomedDisplay = get(planDefinition, 'code.coding[0].display')
    formData.clinicalStatus = get(planDefinition, 'clinicalStatus')
    formData.verificationStatus = get(planDefinition, 'verificationStatus')
    formData.onsetDateTime = get(planDefinition, 'onsetDateTime')

    return formData;
  }
  shouldComponentUpdate(nextProps){
    get(Meteor, 'settings.public.logging') === "debug" && console.log('PlanDefinitionDetail.shouldComponentUpdate()', nextProps, this.state)
    let shouldUpdate = true;

    // received an planDefinition from the table; okay lets update again
    if(nextProps.planDefinitionId !== this.state.planDefinitionId){
      
      if(nextProps.planDefinition){
        this.setState({planDefinition: nextProps.planDefinition})     
        this.setState({form: this.dehydrateFhirResource(nextProps.planDefinition)})       
      }

      this.setState({planDefinitionId: nextProps.planDefinitionId})
      shouldUpdate = true;
    }

    // both false; don't take any more updates
    if(nextProps.planDefinition === this.state.planDefinition){
      shouldUpdate = false;
    }
 
    return shouldUpdate;
  }

  getMeteorData() {
    let data = {
      planDefinitionId: this.props.planDefinitionId,
      planDefinition: false,
      showDatePicker: false,
      form: this.state.form
    };

    if(this.props.showDatePicker){
      data.showDatePicker = this.props.showDatePicker
    }
    if(this.props.planDefinition){
      data.planDefinition = this.props.planDefinition;
      data.form = this.dehydrateFhirResource(this.props.planDefinition);
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
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('PlanDefinitionDetail.render()', this.state)

    return (
      <div id={this.props.id} className="planDefinitionDetail">
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
          { this.determineButtons(this.state.planDefinitionId) }
        </CardActions>
      </div>
    );
  }

  determineButtons(planDefinitionId){
    if (planDefinitionId) {
      return (
        <div>
          <Button id="updatePlanDefinitionButton" primary={true} onClick={this.handleSaveButton.bind(this)} style={{marginRight: '20px'}} >Save</Button>
          <Button id="deletePlanDefinitionButton" onClick={this.handleDeleteButton.bind(this)} >Delete</Button>
        </div>
      );
    } else {
      return(
        <Button id="savePlanDefinitionButton" primary={true} onClick={this.handleSaveButton.bind(this)} >Save</Button>
      );
    }
  }


  updateFormData(formData, field, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("PlanDefinitionDetail.updateFormData", formData, field, textValue);

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
      case "planDefinitionDisplay":
        set(formData, 'planDefinitionDisplay', textValue)
        break;
      case "onsetDateTime":
        set(formData, 'onsetDateTime', textValue)
        break;
      default:
    }

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("formData", formData);
    return formData;
  }
  updatePlanDefinition(planDefinitionData, field, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("PlanDefinitionDetail.updatePlanDefinition", planDefinitionData, field, textValue);

    switch (field) {
      case "patientDisplay":
        set(planDefinitionData, 'patient.display', textValue)
        break;
      case "asserterDisplay":
        set(planDefinitionData, 'asserter.display', textValue)
        break;
      case "verificationStatus":
        set(planDefinitionData, 'verificationStatus', textValue)
        break;
      case "clinicalStatus":
        set(planDefinitionData, 'clinicalStatus', textValue)
        break;
      case "snomedCode":
        set(planDefinitionData, 'code.coding[0].code', textValue)
        break;
      case "snomedDisplay":
        set(planDefinitionData, 'code.coding[0].display', textValue)
        break;
      case "planDefinitionDisplay":
        set(planDefinitionData, 'planDefinition[0].detail[0].display', textValue)
        break;  
      case "datePicker":
        set(planDefinitionData, 'onsetDateTime', textValue)
        break;
      case "onsetDateTime":
        set(planDefinitionData, 'onsetDateTime', textValue)
        break;
  
    }
    return planDefinitionData;
  }
  componentDidUpdate(props){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('PlanDefinitionDisplay.componentDidUpdate()', props, this.state)
  }
  // this could be a mixin
  changeState(field, event, textValue){

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("   ");
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("PlanDefinitionDetail.changeState", field, textValue);
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("this.state", this.state);

    let formData = Object.assign({}, this.state.form);
    let planDefinitionData = Object.assign({}, this.state.planDefinition);

    formData = this.updateFormData(formData, field, textValue);
    planDefinitionData = this.updatePlanDefinition(planDefinitionData, field, textValue);

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("planDefinitionData", planDefinitionData);
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("formData", formData);

    this.setState({planDefinition: planDefinitionData})
    this.setState({form: formData})

  }

  handleSaveButton(){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^&&')
    console.log('Saving a new PlanDefinition...', this.state)

    let self = this;
    let fhirPlanDefinitionData = Object.assign({}, this.state.planDefinition);

    if(get(Meteor, 'settings.public.logging') === "debug") console.log('fhirPlanDefinitionData', fhirPlanDefinitionData);


    let planDefinitionValidator = PlanDefinitionSchema.newContext();
    planDefinitionValidator.validate(fhirPlanDefinitionData)

    console.log('IsValid: ', planDefinitionValidator.isValid())
    console.log('ValidationErrors: ', planDefinitionValidator.validationErrors());

    if (this.state.planDefinitionId) {
      if(get(Meteor, 'settings.public.logging') === "debug") console.log("Updating PlanDefinition...");
      delete fhirPlanDefinitionData._id;

      PlanDefinitions._collection.update(
        {_id: this.state.planDefinitionId}, {$set: fhirPlanDefinitionData }, function(error, result) {
          if (error) {
            console.log("error", error);
            // Bert.alert(error.reason, 'danger');
          }
          if (result) {
            if(self.props.onUpdate){
              self.props.onUpdate(self.data.planDefinitionId);
            }
            // Bert.alert('PlanDefinition updated!', 'success');
          }
        });
    } else {

      if(get(Meteor, 'settings.public.logging') === "debug") console.log("Create a new PlanDefinition", fhirPlanDefinitionData);

      PlanDefinitions._collection.insert(fhirPlanDefinitionData, function(error, result) {
        if (error) {
          console.log("error", error);
          // Bert.alert(error.reason, 'danger');
        }
        if (result) {
          if(self.props.onInsert){
            self.props.onInsert(self.data.planDefinitionId);
          }
          // Bert.alert('PlanDefinition added!', 'success');
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
    console.log('PlanDefinitionDetail.handleDeleteButton()', this.state.planDefinitionId)

    let self = this;
    PlanDefinitions._collection.remove({_id: this.state.planDefinitionId}, function(error, result){
      if (error) {
        // Bert.alert(error.reason, 'danger');
      }
      if (result) {
        if(this.props.onInsert){
          this.props.onInsert(self.data.planDefinitionId);
        }
        // Bert.alert('PlanDefinition removed!', 'success');
      }
    });
  }
}

PlanDefinitionDetail.propTypes = {
  id: PropTypes.string,
  planDefinitionId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  planDefinition: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  showDatePicker: PropTypes.bool,
  showHints: PropTypes.bool,
  onInsert: PropTypes.func,
  onUpdate: PropTypes.func,
  onRemove: PropTypes.func,
  onCancel: PropTypes.func
};

export default PlanDefinitionDetail;
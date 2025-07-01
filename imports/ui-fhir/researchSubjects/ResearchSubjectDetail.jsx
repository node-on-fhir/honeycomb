// =======================================================================
// Using DSTU2  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//
// https://www.hl7.org/fhir/DSTU2/researchSubjects.html
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


export class ResearchSubjectDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      researchSubjectId: false,
      researchSubject: {
        resourceType: "ResearchSubject",
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
        researchSubject: [],
        onsetDateTime: null
      }, 
      form: {
        patientDisplay: '',
        asserterDisplay: '',
        snomedCode: '',
        snomedDisplay: '',
        clinicalStatus: '',
        verificationStatus: '',
        researchSubjectDisplay: '',
        onsetDateTime: ''
      }
    }
  }
  dehydrateFhirResource(researchSubject) {
    let formData = Object.assign({}, this.state.form);

    formData.patientDisplay = get(researchSubject, 'patient.display')
    formData.asserterDisplay = get(researchSubject, 'asserter.display')    
    formData.snomedCode = get(researchSubject, 'code.coding[0].code')
    formData.snomedDisplay = get(researchSubject, 'code.coding[0].display')
    formData.clinicalStatus = get(researchSubject, 'clinicalStatus')
    formData.verificationStatus = get(researchSubject, 'verificationStatus')
    formData.onsetDateTime = get(researchSubject, 'onsetDateTime')

    return formData;
  }
  shouldComponentUpdate(nextProps){
    get(Meteor, 'settings.public.logging') === "debug" && console.log('ResearchSubjectDetail.shouldComponentUpdate()', nextProps, this.state)
    let shouldUpdate = true;

    // received an researchSubject from the table; okay lets update again
    if(nextProps.researchSubjectId !== this.state.researchSubjectId){
      
      if(nextProps.researchSubject){
        this.setState({researchSubject: nextProps.researchSubject})     
        this.setState({form: this.dehydrateFhirResource(nextProps.researchSubject)})       
      }

      this.setState({researchSubjectId: nextProps.researchSubjectId})
      shouldUpdate = true;
    }

    // both false; don't take any more updates
    if(nextProps.researchSubject === this.state.researchSubject){
      shouldUpdate = false;
    }
 
    return shouldUpdate;
  }

  getMeteorData() {
    let data = {
      researchSubjectId: this.props.researchSubjectId,
      researchSubject: false,
      showDatePicker: false,
      form: this.state.form
    };

    if(this.props.showDatePicker){
      data.showDatePicker = this.props.showDatePicker
    }
    if(this.props.researchSubject){
      data.researchSubject = this.props.researchSubject;
      data.form = this.dehydrateFhirResource(this.props.researchSubject);
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
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('ResearchSubjectDetail.render()', this.state)

    return (
      <div id={this.props.id} className="researchSubjectDetail">
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
          { this.determineButtons(this.state.researchSubjectId) }
        </CardActions>
      </div>
    );
  }

  determineButtons(researchSubjectId){
    if (researchSubjectId) {
      return (
        <div>
          <Button id="updateResearchSubjectButton" primary={true} onClick={this.handleSaveButton.bind(this)} style={{marginRight: '20px'}} >Save</Button>
          <Button id="deleteResearchSubjectButton" onClick={this.handleDeleteButton.bind(this)} >Delete</Button>
        </div>
      );
    } else {
      return(
        <Button id="saveResearchSubjectButton" primary={true} onClick={this.handleSaveButton.bind(this)} >Save</Button>
      );
    }
  }


  updateFormData(formData, field, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("ResearchSubjectDetail.updateFormData", formData, field, textValue);

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
      case "researchSubjectDisplay":
        set(formData, 'researchSubjectDisplay', textValue)
        break;
      case "onsetDateTime":
        set(formData, 'onsetDateTime', textValue)
        break;
      default:
    }

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("formData", formData);
    return formData;
  }
  updateResearchSubject(researchSubjectData, field, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("ResearchSubjectDetail.updateResearchSubject", researchSubjectData, field, textValue);

    switch (field) {
      case "patientDisplay":
        set(researchSubjectData, 'patient.display', textValue)
        break;
      case "asserterDisplay":
        set(researchSubjectData, 'asserter.display', textValue)
        break;
      case "verificationStatus":
        set(researchSubjectData, 'verificationStatus', textValue)
        break;
      case "clinicalStatus":
        set(researchSubjectData, 'clinicalStatus', textValue)
        break;
      case "snomedCode":
        set(researchSubjectData, 'code.coding[0].code', textValue)
        break;
      case "snomedDisplay":
        set(researchSubjectData, 'code.coding[0].display', textValue)
        break;
      case "researchSubjectDisplay":
        set(researchSubjectData, 'researchSubject[0].detail[0].display', textValue)
        break;  
      case "datePicker":
        set(researchSubjectData, 'onsetDateTime', textValue)
        break;
      case "onsetDateTime":
        set(researchSubjectData, 'onsetDateTime', textValue)
        break;
  
    }
    return researchSubjectData;
  }
  componentDidUpdate(props){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('ResearchSubjectDisplay.componentDidUpdate()', props, this.state)
  }
  // this could be a mixin
  changeState(field, event, textValue){

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("   ");
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("ResearchSubjectDetail.changeState", field, textValue);
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("this.state", this.state);

    let formData = Object.assign({}, this.state.form);
    let researchSubjectData = Object.assign({}, this.state.researchSubject);

    formData = this.updateFormData(formData, field, textValue);
    researchSubjectData = this.updateResearchSubject(researchSubjectData, field, textValue);

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("researchSubjectData", researchSubjectData);
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("formData", formData);

    this.setState({researchSubject: researchSubjectData})
    this.setState({form: formData})

  }

  handleSaveButton(){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^&&')
    console.log('Saving a new ResearchSubject...', this.state)

    let self = this;
    let fhirResearchSubjectData = Object.assign({}, this.state.researchSubject);

    if(get(Meteor, 'settings.public.logging') === "debug") console.log('fhirResearchSubjectData', fhirResearchSubjectData);


    let researchSubjectValidator = ResearchSubjectSchema.newContext();
    researchSubjectValidator.validate(fhirResearchSubjectData)

    console.log('IsValid: ', researchSubjectValidator.isValid())
    console.log('ValidationErrors: ', researchSubjectValidator.validationErrors());

    if (this.state.researchSubjectId) {
      if(get(Meteor, 'settings.public.logging') === "debug") console.log("Updating ResearchSubject...");
      delete fhirResearchSubjectData._id;

      ResearchSubjects._collection.update(
        {_id: this.state.researchSubjectId}, {$set: fhirResearchSubjectData }, function(error, result) {
          if (error) {
            console.log("error", error);
            // Bert.alert(error.reason, 'danger');
          }
          if (result) {
            if(self.props.onUpdate){
              self.props.onUpdate(self.data.researchSubjectId);
            }
            // Bert.alert('ResearchSubject updated!', 'success');
          }
        });
    } else {

      if(get(Meteor, 'settings.public.logging') === "debug") console.log("Create a new ResearchSubject", fhirResearchSubjectData);

      ResearchSubjects._collection.insert(fhirResearchSubjectData, function(error, result) {
        if (error) {
          console.log("error", error);
          // Bert.alert(error.reason, 'danger');
        }
        if (result) {
          if(self.props.onInsert){
            self.props.onInsert(self.data.researchSubjectId);
          }
          // Bert.alert('ResearchSubject added!', 'success');
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
    console.log('ResearchSubjectDetail.handleDeleteButton()', this.state.researchSubjectId)

    let self = this;
    ResearchSubjects._collection.remove({_id: this.state.researchSubjectId}, function(error, result){
      if (error) {
        // Bert.alert(error.reason, 'danger');
      }
      if (result) {
        if(this.props.onInsert){
          this.props.onInsert(self.data.researchSubjectId);
        }
        // Bert.alert('ResearchSubject removed!', 'success');
      }
    });
  }
}

ResearchSubjectDetail.propTypes = {
  id: PropTypes.string,
  researchSubjectId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  researchSubject: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  showDatePicker: PropTypes.bool,
  showHints: PropTypes.bool,
  onInsert: PropTypes.func,
  onUpdate: PropTypes.func,
  onRemove: PropTypes.func,
  onCancel: PropTypes.func
};

export default ResearchSubjectDetail;
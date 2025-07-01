// =======================================================================
// Using DSTU2  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//
// https://www.hl7.org/fhir/DSTU2/researchStudys.html
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


export class ResearchStudyDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      researchStudyId: false,
      researchStudy: {
        resourceType: "ResearchStudy",
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
        researchStudy: [],
        onsetDateTime: null
      }, 
      form: {
        patientDisplay: '',
        asserterDisplay: '',
        snomedCode: '',
        snomedDisplay: '',
        clinicalStatus: '',
        verificationStatus: '',
        researchStudyDisplay: '',
        onsetDateTime: ''
      }
    }
  }
  dehydrateFhirResource(researchStudy) {
    let formData = Object.assign({}, this.state.form);

    formData.patientDisplay = get(researchStudy, 'patient.display')
    formData.asserterDisplay = get(researchStudy, 'asserter.display')    
    formData.snomedCode = get(researchStudy, 'code.coding[0].code')
    formData.snomedDisplay = get(researchStudy, 'code.coding[0].display')
    formData.clinicalStatus = get(researchStudy, 'clinicalStatus')
    formData.verificationStatus = get(researchStudy, 'verificationStatus')
    formData.onsetDateTime = get(researchStudy, 'onsetDateTime')

    return formData;
  }
  shouldComponentUpdate(nextProps){
    get(Meteor, 'settings.public.logging') === "debug" && console.log('ResearchStudyDetail.shouldComponentUpdate()', nextProps, this.state)
    let shouldUpdate = true;

    // received an researchStudy from the table; okay lets update again
    if(nextProps.researchStudyId !== this.state.researchStudyId){
      
      if(nextProps.researchStudy){
        this.setState({researchStudy: nextProps.researchStudy})     
        this.setState({form: this.dehydrateFhirResource(nextProps.researchStudy)})       
      }

      this.setState({researchStudyId: nextProps.researchStudyId})
      shouldUpdate = true;
    }

    // both false; don't take any more updates
    if(nextProps.researchStudy === this.state.researchStudy){
      shouldUpdate = false;
    }
 
    return shouldUpdate;
  }

  getMeteorData() {
    let data = {
      researchStudyId: this.props.researchStudyId,
      researchStudy: false,
      showDatePicker: false,
      form: this.state.form
    };

    if(this.props.showDatePicker){
      data.showDatePicker = this.props.showDatePicker
    }
    if(this.props.researchStudy){
      data.researchStudy = this.props.researchStudy;
      data.form = this.dehydrateFhirResource(this.props.researchStudy);
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
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('ResearchStudyDetail.render()', this.state)

    return (
      <div id={this.props.id} className="researchStudyDetail">
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
          { this.determineButtons(this.state.researchStudyId) }
        </CardActions>
      </div>
    );
  }

  determineButtons(researchStudyId){
    if (researchStudyId) {
      return (
        <div>
          <Button id="updateResearchStudyButton" primary={true} onClick={this.handleSaveButton.bind(this)} style={{marginRight: '20px'}} >Save</Button>
          <Button id="deleteResearchStudyButton" onClick={this.handleDeleteButton.bind(this)} >Delete</Button>
        </div>
      );
    } else {
      return(
        <Button id="saveResearchStudyButton" primary={true} onClick={this.handleSaveButton.bind(this)} >Save</Button>
      );
    }
  }


  updateFormData(formData, field, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("ResearchStudyDetail.updateFormData", formData, field, textValue);

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
      case "researchStudyDisplay":
        set(formData, 'researchStudyDisplay', textValue)
        break;
      case "onsetDateTime":
        set(formData, 'onsetDateTime', textValue)
        break;
      default:
    }

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("formData", formData);
    return formData;
  }
  updateResearchStudy(researchStudyData, field, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("ResearchStudyDetail.updateResearchStudy", researchStudyData, field, textValue);

    switch (field) {
      case "patientDisplay":
        set(researchStudyData, 'patient.display', textValue)
        break;
      case "asserterDisplay":
        set(researchStudyData, 'asserter.display', textValue)
        break;
      case "verificationStatus":
        set(researchStudyData, 'verificationStatus', textValue)
        break;
      case "clinicalStatus":
        set(researchStudyData, 'clinicalStatus', textValue)
        break;
      case "snomedCode":
        set(researchStudyData, 'code.coding[0].code', textValue)
        break;
      case "snomedDisplay":
        set(researchStudyData, 'code.coding[0].display', textValue)
        break;
      case "researchStudyDisplay":
        set(researchStudyData, 'researchStudy[0].detail[0].display', textValue)
        break;  
      case "datePicker":
        set(researchStudyData, 'onsetDateTime', textValue)
        break;
      case "onsetDateTime":
        set(researchStudyData, 'onsetDateTime', textValue)
        break;
  
    }
    return researchStudyData;
  }
  componentDidUpdate(props){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('ResearchStudyDisplay.componentDidUpdate()', props, this.state)
  }
  // this could be a mixin
  changeState(field, event, textValue){

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("   ");
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("ResearchStudyDetail.changeState", field, textValue);
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("this.state", this.state);

    let formData = Object.assign({}, this.state.form);
    let researchStudyData = Object.assign({}, this.state.researchStudy);

    formData = this.updateFormData(formData, field, textValue);
    researchStudyData = this.updateResearchStudy(researchStudyData, field, textValue);

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("researchStudyData", researchStudyData);
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("formData", formData);

    this.setState({researchStudy: researchStudyData})
    this.setState({form: formData})

  }

  handleSaveButton(){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^&&')
    console.log('Saving a new ResearchStudy...', this.state)

    let self = this;
    let fhirResearchStudyData = Object.assign({}, this.state.researchStudy);

    if(get(Meteor, 'settings.public.logging') === "debug") console.log('fhirResearchStudyData', fhirResearchStudyData);


    let researchStudyValidator = ResearchStudySchema.newContext();
    researchStudyValidator.validate(fhirResearchStudyData)

    console.log('IsValid: ', researchStudyValidator.isValid())
    console.log('ValidationErrors: ', researchStudyValidator.validationErrors());

    if (this.state.researchStudyId) {
      if(get(Meteor, 'settings.public.logging') === "debug") console.log("Updating ResearchStudy...");
      delete fhirResearchStudyData._id;

      ResearchStudies._collection.update(
        {_id: this.state.researchStudyId}, {$set: fhirResearchStudyData }, function(error, result) {
          if (error) {
            console.log("error", error);
            // Bert.alert(error.reason, 'danger');
          }
          if (result) {
            if(self.props.onUpdate){
              self.props.onUpdate(self.data.researchStudyId);
            }
            // Bert.alert('ResearchStudy updated!', 'success');
          }
        });
    } else {

      if(get(Meteor, 'settings.public.logging') === "debug") console.log("Create a new ResearchStudy", fhirResearchStudyData);

      ResearchStudies._collection.insert(fhirResearchStudyData, function(error, result) {
        if (error) {
          console.log("error", error);
          // Bert.alert(error.reason, 'danger');
        }
        if (result) {
          if(self.props.onInsert){
            self.props.onInsert(self.data.researchStudyId);
          }
          // Bert.alert('ResearchStudy added!', 'success');
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
    console.log('ResearchStudyDetail.handleDeleteButton()', this.state.researchStudyId)

    let self = this;
    ResearchStudies._collection.remove({_id: this.state.researchStudyId}, function(error, result){
      if (error) {
        // Bert.alert(error.reason, 'danger');
      }
      if (result) {
        if(this.props.onInsert){
          this.props.onInsert(self.data.researchStudyId);
        }
        // Bert.alert('ResearchStudy removed!', 'success');
      }
    });
  }
}

ResearchStudyDetail.propTypes = {
  id: PropTypes.string,
  researchStudyId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  researchStudy: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  showDatePicker: PropTypes.bool,
  showHints: PropTypes.bool,
  onInsert: PropTypes.func,
  onUpdate: PropTypes.func,
  onRemove: PropTypes.func,
  onCancel: PropTypes.func
};

export default ResearchStudyDetail;
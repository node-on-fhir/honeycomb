import { 
  Button,
  CardHeader,
  CardContent,
  CardActions,
  TextField,
  Grid,
  Select,
  MenuItem,
  DatePicker,
  Toggle
} from '@mui/material';


import React from 'react';
import { useTracker } from 'meteor/react-meteor-data';

import { get, set } from 'lodash';
import PropTypes from 'prop-types';


const styles = {
  block: {
    maxWidth: 250,
  },
  toggle: {
    marginTop: 16,
  },
  thumbOff: {
    backgroundColor: '#ffcccc',
  },
  trackOff: {
    backgroundColor: '#ff9d9d',
  },
  thumbSwitched: {
    backgroundColor: 'red',
  },
  trackSwitched: {
    backgroundColor: '#ff9d9d',
  },
  labelStyle: {
    color: 'red',
  },
}; 


export class ProcedureDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      procedureId: false,
      procedure: {
        resourceType: 'Procedure',
        identifier: [{
          type: {
            coding: [
              {
                system: "",
                code: ""
              }
            ],
            text: "Serial Number"
          },
          value: ""
        }],
        status: 'unknown',
        notPerformed: false,
        identifier: [{
          use: 'official',
          value: ''
        }],
        subject: {
          reference: '',
          display: ''
        },
        performer:{
          reference: '',
          display: ''
        },
        bodySite:{
          reference: '',
          display: ''
        },
        code: {
          text: '',
          coding: [{
            system: '',
            code: '',
            display: ''
          }]
        },
        category: {
          text: '',
          coding: [{
            system: '',
            code: '',
            display: ''
          }]
        },
        notes: [{
          time: null,
          text: ''
        }]
      },
      form: {
        identifier: '',
        categoryCode: '',
        categoryDisplay: '',
        procedureCode: '',
        procedureCodeDisplay: '',
        bodySiteDisplay: '',
        bodySiteReference: '',
        performedDateTime: '',
        performedDate: null,
        performedTime: null,
        notPerformed: false,
        performerDisplay: '',
        performerReference: '',
        subjectDisplay: '',
        subjectReference: '',
        noteTime: '',
        noteText: ''
      }
    }
  }
  dehydrateFhirResource(procedure) {
    let formData = Object.assign({}, this.state.form);

    formData.identifier = get(procedure, 'identifier[0].value')
    formData.categoryCode = get(procedure, 'category.coding[0].code')
    formData.categoryDisplay = get(procedure, 'category.coding[0].display')    
    formData.procedureCode = get(procedure, 'code.coding[0].code')
    formData.procedureCodeDisplay = get(procedure, 'code.coding[0].display')
    formData.bodySiteDisplay = get(procedure, 'bodySite.display')
    formData.bodySiteReference = get(procedure, 'bodySite.reference')
    formData.performedDateTime = get(procedure, 'performedDateTime')
    formData.performedDate = get(procedure, 'performedDate')
    formData.performedTime = get(procedure, 'performedTime')
    formData.notPerformed = get(procedure, 'notPerformed')
    formData.performerDisplay = get(procedure, 'performer.display')
    formData.performerReference = get(procedure, 'performer.reference')
    formData.subjectDisplay = get(procedure, 'subject.display')
    formData.subjectReference = get(procedure, 'subject.reference')
    formData.noteTime = get(procedure, 'notes[0].time')
    formData.noteText = get(procedure, 'notes[0].text')

    return formData;
  }
  shouldComponentUpdate(nextProps){
    process.env.NODE_ENV === "test" && console.log('ProcedureDetail.shouldComponentUpdate()', nextProps, this.state)
    let shouldUpdate = true;

    // received an procedure from the table; okay lets update again
    if(nextProps.procedureId !== this.state.procedureId){
      
      if(nextProps.procedure){
        this.setState({procedure: nextProps.procedure})     
        this.setState({form: this.dehydrateFhirResource(nextProps.procedure)})       
      }

      this.setState({procedureId: nextProps.procedureId})
      shouldUpdate = true;
    }

    // both false; don't take any more updates
    if(nextProps.procedure === this.state.procedure){
      shouldUpdate = false;
    }

    // // both false; don't take any more updates
    // if(nextProps.procedure === this.state.procedure){
    //   shouldUpdate = false;
    // }

    // // received an procedure from the table; okay lets update again
    // if(nextProps.procedureId !== this.state.procedureId){
    //   this.setState({procedureId: nextProps.procedureId})
      
    //   if(nextProps.procedure){
    //     this.setState({procedure: nextProps.procedure})     
    //     this.setState({form: this.dehydrateFhirResource(nextProps.procedure)})       
    //   }
    //   shouldUpdate = true;
    // }
 
    return shouldUpdate;
  }
  getMeteorData() {
    let data = {
      procedureId: this.props.procedureId,
      procedure: false,
      showDatePicker: false,
      form: this.state.form
    };

    if(this.props.showDatePicker){
      data.showDatePicker = this.props.showDatePicker;
    }

    if(this.props.procedure){
      data.procedure = this.props.procedure;
      data.form = this.dehydrateFhirResource(this.props.procedure);
    }  

    console.log('ProcedureDetail[data]', data);
    return data;
  }

  renderDatePicker(showDatePicker, form){
    let datePickerValue;

    if(get(form, 'performedDateTime')){
      datePickerValue = get(form, 'performedDateTime');
    }
    if(get(form, 'performedPeriod.start')){
      datePickerValue = get(form, 'performedPeriod.start');
    }
    if (typeof datePickerValue === "string"){
      datePickerValue = new Date(datePickerValue);
    }

    if (showDatePicker) {
      return(<div></div>)
      // return (
      //   <DatePicker 
      //     name='performedDateTime'
      //     hintText="Performed Date/Time" 
      //     container="inline" 
      //     mode="landscape"
      //     value={ datePickerValue ? datePickerValue : ''}    
      //     onChange={ this.changeState.bind(this, 'performedDateTime')}      
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
    if(process.env.NODE_ENV === "test") console.log('ProcedureDetail.render()', this.state)

    let link;
    let notes;
    
    if(!this.state.procedureId){
      link = <a href='http://browser.ihtsdotools.org/?perspective=full&conceptId1=404684003&edition=us-edition&release=v20180301&server=https://prod-browser-exten.ihtsdotools.org/api/snomed&langRefset=900000000000509007'>Lookup codes with the SNOMED CT Browser</a>
    } 
    
    // this is a proof-of-concept feature for evidence based medicine lookup
    // needs to be refactored out eventually
    if(get(this, 'data.form.procedureCode') === "74160"){
      link = <a href='https://www.healthdecision.org/tool#/tool/lungca' target="_blank">Lung Cancer - Clinical Decision Support Tools</a>
    }

    if(get(this, 'data.form.noteText')){
      notes = <Row>
        <Col md={12}>
          <TextField
            id='noteTextInput'                
            name='noteText'
            label='Note Text'
            value={  get(this, 'data.form.noteText', '') }
            onChange={ this.changeState.bind(this, 'noteText')}
            //floatingLabelFixed={true}
            hintText={this.setHint('Routine follow-up.  No complications.')}
            multiLine={true}          
            rows={5}
            fullWidth
            /><br/>  
        </Col>
      </Row>

    }

    return (
      <div id={this.props.id} className="procedureDetail">
        <CardContent>
          
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <TextField
                id='identifierInput'                
                name='identifier'
                label='Identifier'
                value={  get(this, 'data.form.identifier') }
                onChange={ this.changeState.bind(this, 'identifier')}
                hintText={this.setHint('IR-28376481')}
                //floatingLabelFixed={true}
                fullWidth
                /><br/>
              <TextField
                id='categoryDisplayInput'                
                name='categoryDisplay'
                label='Procedure Category'
                value={  get(this, 'data.form.categoryDisplay') }
                onChange={ this.changeState.bind(this, 'categoryDisplay')}
                hintText={this.setHint('Interventional Radiology')}
                //floatingLabelFixed={true}
                fullWidth
              /><br/>

              <TextField
                id='categoryCodeInput'                
                name='categoryCode'
                label='Category Code'
                value={  get(this, 'data.form.categoryCode') }
                onChange={ this.changeState.bind(this, 'categoryCode')}
                hintText={this.setHint('240917005')}
                //floatingLabelFixed={true}
                fullWidth
                /><br/>

              <TextField
                id='procedureCodeDisplayInput'                
                name='procedureCodeDisplay'
                label='Procedure'
                value={  get(this, 'data.form.procedureCodeDisplay') }
                onChange={ this.changeState.bind(this, 'procedureCodeDisplay')}
                hintText={this.setHint('Biliary drainage intervention')}
                //floatingLabelFixed={true}
                fullWidth
                /><br/>

              <TextField
                id='procedureCodeInput'                
                name='procedureCode'
                label='Procedure Code'
                value={  get(this, 'data.form.procedureCode') }
                onChange={ this.changeState.bind(this, 'procedureCode')}
                hintText={this.setHint('277566006')}
                //floatingLabelFixed={true}
                fullWidth
                /><br/>

              <TextField
                id='subjectDisplayInput'                
                name='subjectDisplay'
                label='Subject'
                value={  get(this, 'data.form.subjectDisplay') }
                onChange={ this.changeState.bind(this, 'subjectDisplay')}
                hintText={this.setHint('Jane Doe')}
                //floatingLabelFixed={true}
                fullWidth
                /><br/>

              <TextField
                id='subjectReferenceInput'                
                name='subjectReference'
                label='Subject Reference'
                value={  get(this, 'data.form.subjectReference') }
                onChange={ this.changeState.bind(this, 'subjectReference')}
                hintText={this.setHint('Patient/12345')}
                //floatingLabelFixed={true}
                fullWidth
                /><br/>

              <TextField
                id='bodySiteDisplayInput'                
                name='bodySiteDisplay'
                label='Body Site'
                value={  get(this, 'data.form.bodySiteDisplay') }
                onChange={ this.changeState.bind(this, 'bodySiteDisplay')}
                hintText={this.setHint('Billiary Ducts')}
                //floatingLabelFixed={true}
                fullWidth
                /><br/>

              <TextField
                id='bodySiteReferenceInput'                
                name='bodySiteReference'
                label='Body Site Reference'
                value={  get(this, 'data.form.bodySiteReference') }
                onChange={ this.changeState.bind(this, 'bodySiteReference')}
                hintText={this.setHint('BodySite/222244')}
                //floatingLabelFixed={true}
                fullWidth
                /><br/>

              <TextField
                id='performerDisplayInput'                
                name='performerDisplay'
                label='Performed By'
                value={  get(this, 'data.form.performerDisplay') }
                onChange={ this.changeState.bind(this, 'performerDisplay')}
                //floatingLabelFixed={true}
                hintText={this.setHint('Chris Taub')}
                fullWidth
                /><br/>

              <TextField
                id='performerReferenceInput'                
                name='performerReference'
                label='Performer Reference'
                value={  get(this, 'data.form.performerReference') }
                onChange={ this.changeState.bind(this, 'performerReference')}
                hintText={this.setHint('Practitioner/77777')}
                //floatingLabelFixed={true}
                fullWidth
                /><br/>

              <Toggle
                label="Not Performed"
                labelPosition="right"
                defaultToggled={false}
                style={styles.toggle}
              />

              <TextField
                id='noteTimeInput'                
                name='noteTime'
                type='date'
                label='Time'
                value={  get(this, 'data.form.noteTime') }
                onChange={ this.changeState.bind(this, 'noteTime')}
                //floatingLabelFixed={true}
                fullWidth
                /><br/>
          </Grid>
          <Grid item xs={4}>
            {/* <Col md={2}>
              <TextField
                id='performedDateInput'                
                name='performedDate'
                type='date'
                label='Performed Date'
                value={  get(this, 'data.form.performedDate') }
                onChange={ this.changeState.bind(this, 'performedDate')}
                //floatingLabelFixed={true}
                fullWidth
                /><br/>
            </Col>    */}
            {/* <Col md={2}>
              <TextField
                id='performedTimeInput'                
                name='performedTime'
                type='time'
                label='Performed Date'
                value={  get(this, 'data.form.performedTime') }
                onChange={ this.changeState.bind(this, 'performedTime')}
                //floatingLabelFixed={true}
                fullWidth
                /><br/>
            </Col>    */}
          </Grid>
        </Grid>
          
          { notes } 
          { link }

          <br/>
          { this.renderDatePicker(this.data.showDatePicker, get(this, 'data.form') ) }
          <br/>

        </CardContent>
        <CardActions>
          { this.determineButtons(this.data.procedureId) }
        </CardActions>
      </div>
    );
  }


 
  determineButtons(procedureId){
    if(!this.props.hideButtons){
      if (procedureId) {
        return (
          <div>
            <Button id="updateProcedureButton" primary={true} onClick={this.handleSaveButton.bind(this)} style={{marginRight: '20px'}}>Save</Button>
            <Button id="deleteProcedureButton" onClick={this.handleDeleteButton.bind(this)} >Delete</Button>
          </div>
        );
      } else {
        return(
          <Button id="saveProcedureButton" primary={true} onClick={this.handleSaveButton.bind(this)} >Save</Button>
        );
      }
    }
  }


  updateFormData(formData, field, textValue){
    if(process.env.NODE_ENV === "test") console.log("PatientDetail.updateFormData", formData, field, textValue);

    switch (field) {
      case "identifier":
        set(formData, 'identifier', textValue)
        break;
      case "categoryCode":
        set(formData, 'categoryCode', textValue)
        break;
      case "categoryDisplay":
        set(formData, 'categoryDisplay', textValue)
        break;        
      case "procedureCode":
        set(formData, 'procedureCode', textValue)
        break;
      case "procedureCodeDisplay":
        set(formData, 'procedureCodeDisplay', textValue)
        break;
      case "bodySiteDisplay":
        set(formData, 'bodySiteDisplay', textValue)
        break;
      case "bodySiteReference":
        set(formData, 'bodySiteReference', textValue)
        break;
      case "notPerformed":
        set(formData, 'notPerformed', textValue)
        break;
      case "performerDisplay":
        set(formData, 'performerDisplay', textValue)
        break;
      case "performerReference":
        set(formData, 'performerReference', textValue)
        break;
      case "subjectDisplay":
        set(formData, 'subjectDisplay', textValue)
        break;
      case "subjectReference":
        set(formData, 'subjectReference', textValue)
        break;
      case "noteTime":
        set(formData, 'noteTime', textValue)
        break;
      case "noteText":
        set(formData, 'noteText', textValue)
        break;
      case "performedDateTime":
        set(formData, 'performedDateTime', textValue)
        break;   
    }

    if(process.env.NODE_ENV === "test") console.log("formData", formData);
    return formData;
  }

  updateProcedure(procedureData, field, textValue){
    if(process.env.NODE_ENV === "test") console.log("PatientDetail.updateProcedure", procedureData, field, textValue);

    let telecomArray = get(procedureData, 'telecom');

    switch (field) {
      case "identifier":
        set(procedureData, 'identifier[0].value', textValue)
        break;
      case "categoryCode":
        set(procedureData, 'category.coding[0].code', textValue)
        break;
      case "categoryDisplay":
        set(procedureData, 'category.coding[0].display', textValue)
        break;        
      case "procedureCode":
        set(procedureData, 'code.coding[0].code', textValue)
        break;
      case "procedureCodeDisplay":
        set(procedureData, 'code.coding[0].display', textValue)
        break;
      case "bodySiteDisplay":
        set(procedureData, 'bodySite.display', textValue)
        break;
      case "bodySiteReference":
        set(procedureData, 'bodySite.reference', )
        break;
      case "notPerformed":
        set(procedureData, 'notPerformed', textValue)
        break;
      case "performerDisplay":
        set(procedureData, 'performer.display', textValue)
        break;
      case "performerReference":
        set(procedureData, 'performer.reference', textValue)
        break;
      case "subjectDisplay":
        set(procedureData, 'subject.display', textValue)
        break;
      case "subjectReference":
        set(procedureData, 'subject.reference', textValue)
        break;
      case "noteTime":
        set(procedureData, 'notes[0].time', textValue)
        break;
      case "noteText":
        set(procedureData, 'notes[0].text', textValue)
        break;
      case "performedDateTime":
        set(procedureData, 'performedDateTime', textValue)
        break;
      }
    return procedureData;
  }

  changeState(field, event, textValue){

    if(process.env.NODE_ENV === "test") console.log("   ");
    if(process.env.NODE_ENV === "test") console.log("ProcedureDetail.changeState", field, textValue);
    if(process.env.NODE_ENV === "test") console.log("this.state", this.state);

    let formData = Object.assign({}, this.state.form);
    let procedureData = Object.assign({}, this.state.procedure);

    formData = this.updateFormData(formData, field, textValue);
    procedureData = this.updateProcedure(procedureData, field, textValue);

    if(process.env.NODE_ENV === "test") console.log("procedureData", procedureData);
    if(process.env.NODE_ENV === "test") console.log("formData", formData);

    this.setState({procedure: procedureData})
    this.setState({form: formData})
  }


  handleSaveButton(){
    if(process.env.NODE_ENV === "test") console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^&&')
    console.log('Saving a new Procedure...', this.state)

    let self = this;
    let fhirProcedureData = Object.assign({}, this.state.procedure);

    if(process.env.NODE_ENV === "test") console.log('fhirProcedureData', fhirProcedureData);


    let procedureValidator = ProcedureSchema.newContext();
    procedureValidator.validate(fhirProcedureData)

    console.log('IsValid: ', procedureValidator.isValid())
    console.log('ValidationErrors: ', procedureValidator.validationErrors());


    if (this.state.procedureId) {
      if(process.env.NODE_ENV === "test") console.log("Updating Procedure...");
      delete fhirProcedureData._id;

      // not sure why we're having to respecify this; fix for a bug elsewhere
      fhirProcedureData.resourceType = 'Procedure';

      Procedures._collection.update(
        {_id: this.state.procedureId}, {$set: fhirProcedureData }, function(error, result) {
          if (error) {
            console.log("error", error);

            // Bert.alert(error.reason, 'danger');
          }
          if (result) {
            HipaaLogger.logEvent({eventType: "update", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Procedures", recordId: self.state.procedureId });
            Session.set('procedurePageTabIndex', 1);
            Session.set('selectedProcedureId', false);
            Session.set('procedureUpsert', false);
            // Bert.alert('Procedure updated!', 'success');
          }
        });
    } else {

      if(process.env.NODE_ENV === "test") console.log("create a new procedure", fhirProcedureData);

      if(get(fhirProcedureData, 'code.coding[0].display')){
        fhirProcedureData.code.text = get(fhirProcedureData, 'code.coding[0].display');
      }

      Procedures._collection.insert(fhirProcedureData, function(error, result) {
        if (error) {
          console.log("error", error);
          // Bert.alert(error.reason, 'danger');
        }
        if (result) {
          HipaaLogger.logEvent({eventType: "create", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Procedures", recordId: self.state.procedureId });
          Session.set('procedurePageTabIndex', 1);
          Session.set('selectedProcedureId', false);
          Session.set('procedureUpsert', false);
          // Bert.alert('Procedure added!', 'success');
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
    let self = this;
    Procedures._collection.remove({_id: this.state.procedureId}, function(error, result){
      if (error) {
        // Bert.alert(error.reason, 'danger');
      }
      if (result) {
        HipaaLogger.logEvent({eventType: "delete", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Procedures", recordId: self.state.procedureId});
        Session.set('procedurePageTabIndex', 1);
        Session.set('selectedProcedureId', false);
        // Bert.alert('Procedure removed!', 'success');
      }
    });
  }
}


ProcedureDetail.propTypes = {
  id: PropTypes.string,
  fhirVersion: PropTypes.string,
  procedureId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  procedure: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  showPatientInputs: PropTypes.bool,
  hideButtons: PropTypes.bool,
  hideNotes: PropTypes.bool,
  showHints: PropTypes.bool,
  onInsert: PropTypes.func,
  onUpdate: PropTypes.func,
  onRemove: PropTypes.func,
  onCancel: PropTypes.func
};

export default ProcedureDetail;
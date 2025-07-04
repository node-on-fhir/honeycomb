// =======================================================================
// Using FHIR R4
//
// https://www.hl7.org/fhir/medicationadministration.html
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

  
export class MedicationAdministrationDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      medicationAdministrationId: false,
      medicationAdministration: {
        resourceType: "MedicationAdministration",
        status: "completed",
        subject: {
          reference: "",
          display: ""
        },
        effectiveDateTime: null,
        medicationCodeableConcept: {
          coding: [
            {
              system: "http://www.nlm.nih.gov/research/umls/rxnorm",
              code: "",
              display: ""
            }
          ],
          text: ""
        },
        performer: [{
          actor: {
            reference: "",
            display: ""
          }
        }],
        dosage: {
          text: "",
          route: {
            coding: [{
              system: "http://snomed.info/sct",
              code: "",
              display: ""
            }]
          },
          dose: {
            value: null,
            unit: "",
            system: "http://unitsofmeasure.org",
            code: ""
          }
        }
      }, 
      form: {
        subjectDisplay: '',
        status: 'completed',
        medicationDisplay: '',
        medicationCode: '',
        effectiveDateTime: '',
        performerDisplay: '',
        dosageText: '',
        dosageValue: '',
        dosageUnit: '',
        routeDisplay: ''
      }
    }
  }
  dehydrateFhirResource(medicationAdministration) {
    let formData = Object.assign({}, this.state.form);

    formData.subjectDisplay = get(medicationAdministration, 'subject.display', '')
    formData.status = get(medicationAdministration, 'status', 'completed')
    formData.medicationDisplay = get(medicationAdministration, 'medicationCodeableConcept.text', get(medicationAdministration, 'medicationCodeableConcept.coding[0].display', ''))
    formData.medicationCode = get(medicationAdministration, 'medicationCodeableConcept.coding[0].code', '')
    formData.effectiveDateTime = get(medicationAdministration, 'effectiveDateTime', '')
    formData.performerDisplay = get(medicationAdministration, 'performer[0].actor.display', '')
    formData.dosageText = get(medicationAdministration, 'dosage.text', '')
    formData.dosageValue = get(medicationAdministration, 'dosage.dose.value', '')
    formData.dosageUnit = get(medicationAdministration, 'dosage.dose.unit', '')
    formData.routeDisplay = get(medicationAdministration, 'dosage.route.coding[0].display', '')

    return formData;
  }
  shouldComponentUpdate(nextProps){
    get(Meteor, 'settings.public.logging') === "debug" && console.log('MedicationAdministrationDetail.shouldComponentUpdate()', nextProps, this.state)
    let shouldUpdate = true;

    // received a medication administration from the table; okay lets update again
    if(nextProps.medicationAdministrationId !== this.state.medicationAdministrationId){
      
      if(nextProps.medicationAdministration){
        this.setState({medicationAdministration: nextProps.medicationAdministration})     
        this.setState({form: this.dehydrateFhirResource(nextProps.medicationAdministration)})       
      }

      this.setState({medicationAdministrationId: nextProps.medicationAdministrationId})
      shouldUpdate = true;
    }

    // both false; don't take any more updates
    if(nextProps.medicationAdministration === this.state.medicationAdministration){
      shouldUpdate = false;
    }
 
    return shouldUpdate;
  }

  getMeteorData() {
    let data = {
      medicationAdministrationId: this.props.medicationAdministrationId,
      medicationAdministration: false,
      form: this.state.form
    };

    if(this.props.medicationAdministration){
      data.medicationAdministration = this.props.medicationAdministration;
      data.form = this.dehydrateFhirResource(this.props.medicationAdministration);
    }

    return data;
  }

  renderDatePicker(showDatePicker, datePickerValue){
    if (showDatePicker) {
      return (
        <TextField
          id='effectiveDateTimeInput'
          name='effectiveDateTime'
          label='Administration Date/Time'
          type='datetime-local'
          value={datePickerValue}
          onChange={this.changeState.bind(this, 'effectiveDateTime')}
          fullWidth
          InputLabelProps={{
            shrink: true,
          }}
        />
      );
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
    get(Meteor, 'settings.public.logging') === "debug" && console.log('MedicationAdministrationDetail.render()', this.state)
    let formData = this.state.form;

    return (
      <div id={this.props.id} className="medicationAdministrationDetail">
        <Card>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  id='subjectDisplayInput'
                  name='subjectDisplay'
                  label='Patient'
                  value={formData.subjectDisplay}
                  onChange={this.changeState.bind(this, 'subjectDisplay')}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  id='medicationDisplayInput'
                  name='medicationDisplay'
                  label='Medication'
                  value={formData.medicationDisplay}
                  onChange={this.changeState.bind(this, 'medicationDisplay')}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  id='medicationCodeInput'
                  name='medicationCode'
                  label='Medication Code'
                  value={formData.medicationCode}
                  onChange={this.changeState.bind(this, 'medicationCode')}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={4}>
                <Select
                  id='statusInput'
                  name='status'
                  label='Status'
                  value={formData.status}
                  onChange={this.changeState.bind(this, 'status')}
                  fullWidth
                >
                  <MenuItem value="in-progress">In Progress</MenuItem>
                  <MenuItem value="not-done">Not Done</MenuItem>
                  <MenuItem value="on-hold">On Hold</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="entered-in-error">Entered in Error</MenuItem>
                  <MenuItem value="stopped">Stopped</MenuItem>
                  <MenuItem value="unknown">Unknown</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={8}>
                { this.renderDatePicker(true, formData.effectiveDateTime) }
              </Grid>
              <Grid item xs={12}>
                <TextField
                  id='performerDisplayInput'
                  name='performerDisplay'
                  label='Administered By'
                  value={formData.performerDisplay}
                  onChange={this.changeState.bind(this, 'performerDisplay')}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  id='dosageTextInput'
                  name='dosageText'
                  label='Dosage Instructions'
                  value={formData.dosageText}
                  onChange={this.changeState.bind(this, 'dosageText')}
                  placeholder={this.setHint("Take 2 tablets by mouth every 6 hours")}
                  fullWidth
                  multiline
                  rows={2}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  id='dosageValueInput'
                  name='dosageValue'
                  label='Dose Amount'
                  type='number'
                  value={formData.dosageValue}
                  onChange={this.changeState.bind(this, 'dosageValue')}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  id='dosageUnitInput'
                  name='dosageUnit'
                  label='Dose Unit'
                  value={formData.dosageUnit}
                  onChange={this.changeState.bind(this, 'dosageUnit')}
                  placeholder={this.setHint("mg, mL, tablets, etc.")}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  id='routeDisplayInput'
                  name='routeDisplay'
                  label='Route'
                  value={formData.routeDisplay}
                  onChange={this.changeState.bind(this, 'routeDisplay')}
                  placeholder={this.setHint("oral, IV, IM, etc.")}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
          <CardActions>
            { this.determineButtons(formData) }
          </CardActions>
        </Card>
      </div>
    );
  }

  determineButtons(formData){
    if (this.props.medicationAdministrationId) {
      return (
        <div>
          <Button 
            id="updateMedicationAdministrationButton"
            color="primary" 
            variant="contained" 
            onClick={this.handleSaveButton.bind(this)}
            style={{marginRight: '20px'}}
          >
            Save
          </Button>
          <Button 
            id="deleteMedicationAdministrationButton"
            onClick={this.handleDeleteButton.bind(this)}
          >
            Delete
          </Button>
        </div>
      );
    } else {
      return(
        <Button 
          id="saveMedicationAdministrationButton" 
          color="primary" 
          variant="contained" 
          onClick={this.handleSaveButton.bind(this)}
        >
          Save
        </Button>
      );
    }
  }

  updateFormData(formData, field, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("MedicationAdministrationDetail.updateFormData", formData, field, textValue);

    switch (field) {
      case "subjectDisplay":
        set(formData, 'subjectDisplay', textValue)
        break;
      case "status":
        set(formData, 'status', textValue)
        break;
      case "medicationDisplay":
        set(formData, 'medicationDisplay', textValue)
        break;
      case "medicationCode":
        set(formData, 'medicationCode', textValue)
        break;        
      case "effectiveDateTime":
        set(formData, 'effectiveDateTime', textValue)
        break;
      case "performerDisplay":
        set(formData, 'performerDisplay', textValue)
        break;
      case "dosageText":
        set(formData, 'dosageText', textValue)
        break;
      case "dosageValue":
        set(formData, 'dosageValue', textValue)
        break;
      case "dosageUnit":
        set(formData, 'dosageUnit', textValue)
        break;
      case "routeDisplay":
        set(formData, 'routeDisplay', textValue)
        break;
      default:
    }

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("formData", formData);
    return formData;
  }
  updateMedicationAdministration(medicationAdministrationData, field, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("MedicationAdministrationDetail.updateMedicationAdministration", medicationAdministrationData, field, textValue);

    switch (field) {
      case "subjectDisplay":
        set(medicationAdministrationData, 'subject.display', textValue)
        break;
      case "status":
        set(medicationAdministrationData, 'status', textValue)
        break;
      case "medicationDisplay":
        set(medicationAdministrationData, 'medicationCodeableConcept.text', textValue)
        break;
      case "medicationCode":
        set(medicationAdministrationData, 'medicationCodeableConcept.coding[0].code', textValue)
        break;        
      case "effectiveDateTime":
        set(medicationAdministrationData, 'effectiveDateTime', textValue)
        break;
      case "performerDisplay":
        set(medicationAdministrationData, 'performer[0].actor.display', textValue)
        break;
      case "dosageText":
        set(medicationAdministrationData, 'dosage.text', textValue)
        break;
      case "dosageValue":
        set(medicationAdministrationData, 'dosage.dose.value', parseFloat(textValue))
        break;
      case "dosageUnit":
        set(medicationAdministrationData, 'dosage.dose.unit', textValue)
        break;
      case "routeDisplay":
        set(medicationAdministrationData, 'dosage.route.coding[0].display', textValue)
        break;
    }
    return medicationAdministrationData;
  }

  changeState(field, event, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("   ");
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("MedicationAdministrationDetail.changeState", field, textValue);
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("this.state", this.state);

    let formData = Object.assign({}, this.state.form);
    let medicationAdministrationData = Object.assign({}, this.state.medicationAdministration);

    formData = this.updateFormData(formData, field, textValue);
    medicationAdministrationData = this.updateMedicationAdministration(medicationAdministrationData, field, textValue);

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("medicationAdministrationData", medicationAdministrationData);
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("formData", formData);

    this.setState({form: formData})
    this.setState({medicationAdministration: medicationAdministrationData})
  }

  handleSaveButton(){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('MedicationAdministrationDetail.handleSaveButton()');
    let self = this;
    if(this.props.onUpsert){
      this.props.onUpsert(self);
    }
  }

  handleCancelButton(){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('MedicationAdministrationDetail.handleCancelButton()');
  }

  handleDeleteButton(){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('MedicationAdministrationDetail.handleDeleteButton()');
    let self = this;
    if(this.props.onDelete){
      this.props.onDelete(self);
    }
  }
}

MedicationAdministrationDetail.propTypes = {
  id: PropTypes.string,
  medicationAdministrationId: PropTypes.string,
  medicationAdministration: PropTypes.object,
  showHints: PropTypes.bool,
  onDelete: PropTypes.func,
  onUpsert: PropTypes.func,
  onCancel: PropTypes.func,
  showDatePicker: PropTypes.bool
};

export default MedicationAdministrationDetail;
// =======================================================================
// Using FHIR R4
//
// https://www.hl7.org/fhir/medicationrequest.html
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

  
export class MedicationRequestDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      medicationRequestId: false,
      medicationRequest: {
        resourceType: "MedicationRequest",
        status: "active",
        intent: "order",
        subject: {
          reference: "",
          display: ""
        },
        authoredOn: null,
        requester: {
          reference: "",
          display: ""
        },
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
        priority: "routine",
        dosageInstruction: [{
          text: "",
          timing: {
            repeat: {
              frequency: 1,
              period: 1,
              periodUnit: "d"
            }
          },
          route: {
            coding: [{
              system: "http://snomed.info/sct",
              code: "",
              display: ""
            }]
          },
          doseAndRate: [{
            doseQuantity: {
              value: null,
              unit: "",
              system: "http://unitsofmeasure.org",
              code: ""
            }
          }]
        }],
        dispenseRequest: {
          validityPeriod: {
            start: null,
            end: null
          },
          quantity: {
            value: null,
            unit: ""
          }
        }
      }, 
      form: {
        subjectDisplay: '',
        status: 'active',
        intent: 'order',
        priority: 'routine',
        medicationDisplay: '',
        medicationCode: '',
        authoredOn: '',
        requesterDisplay: '',
        dosageInstructionText: '',
        dosageValue: '',
        dosageUnit: '',
        frequency: '',
        period: '',
        periodUnit: 'd',
        routeDisplay: '',
        dispenseQuantity: '',
        dispenseUnit: '',
        validityStart: '',
        validityEnd: ''
      }
    }
  }
  dehydrateFhirResource(medicationRequest) {
    let formData = Object.assign({}, this.state.form);

    formData.subjectDisplay = get(medicationRequest, 'subject.display', '')
    formData.status = get(medicationRequest, 'status', 'active')
    formData.intent = get(medicationRequest, 'intent', 'order')
    formData.priority = get(medicationRequest, 'priority', 'routine')
    formData.medicationDisplay = get(medicationRequest, 'medicationCodeableConcept.text', get(medicationRequest, 'medicationCodeableConcept.coding[0].display', ''))
    formData.medicationCode = get(medicationRequest, 'medicationCodeableConcept.coding[0].code', '')
    formData.authoredOn = get(medicationRequest, 'authoredOn', '')
    formData.requesterDisplay = get(medicationRequest, 'requester.display', '')
    formData.dosageInstructionText = get(medicationRequest, 'dosageInstruction[0].text', '')
    formData.dosageValue = get(medicationRequest, 'dosageInstruction[0].doseAndRate[0].doseQuantity.value', '')
    formData.dosageUnit = get(medicationRequest, 'dosageInstruction[0].doseAndRate[0].doseQuantity.unit', '')
    formData.frequency = get(medicationRequest, 'dosageInstruction[0].timing.repeat.frequency', '')
    formData.period = get(medicationRequest, 'dosageInstruction[0].timing.repeat.period', '')
    formData.periodUnit = get(medicationRequest, 'dosageInstruction[0].timing.repeat.periodUnit', 'd')
    formData.routeDisplay = get(medicationRequest, 'dosageInstruction[0].route.coding[0].display', '')
    formData.dispenseQuantity = get(medicationRequest, 'dispenseRequest.quantity.value', '')
    formData.dispenseUnit = get(medicationRequest, 'dispenseRequest.quantity.unit', '')
    formData.validityStart = get(medicationRequest, 'dispenseRequest.validityPeriod.start', '')
    formData.validityEnd = get(medicationRequest, 'dispenseRequest.validityPeriod.end', '')

    return formData;
  }
  shouldComponentUpdate(nextProps){
    get(Meteor, 'settings.public.logging') === "debug" && console.log('MedicationRequestDetail.shouldComponentUpdate()', nextProps, this.state)
    let shouldUpdate = true;

    // received a medication request from the table; okay lets update again
    if(nextProps.medicationRequestId !== this.state.medicationRequestId){
      
      if(nextProps.medicationRequest){
        this.setState({medicationRequest: nextProps.medicationRequest})     
        this.setState({form: this.dehydrateFhirResource(nextProps.medicationRequest)})       
      }

      this.setState({medicationRequestId: nextProps.medicationRequestId})
      shouldUpdate = true;
    }

    // both false; don't take any more updates
    if(nextProps.medicationRequest === this.state.medicationRequest){
      shouldUpdate = false;
    }
 
    return shouldUpdate;
  }

  getMeteorData() {
    let data = {
      medicationRequestId: this.props.medicationRequestId,
      medicationRequest: false,
      form: this.state.form
    };

    if(this.props.medicationRequest){
      data.medicationRequest = this.props.medicationRequest;
      data.form = this.dehydrateFhirResource(this.props.medicationRequest);
    }

    return data;
  }

  setHint(text){
    if(this.props.showHints !== false){
      return text;
    } else {
      return '';
    }
  }

  render() {
    get(Meteor, 'settings.public.logging') === "debug" && console.log('MedicationRequestDetail.render()', this.state)
    let formData = this.state.form;

    return (
      <div id={this.props.id} className="medicationRequestDetail">
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
              <Grid item xs={3}>
                <Select
                  id='statusInput'
                  name='status'
                  label='Status'
                  value={formData.status}
                  onChange={this.changeState.bind(this, 'status')}
                  fullWidth
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="on-hold">On Hold</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="entered-in-error">Entered in Error</MenuItem>
                  <MenuItem value="stopped">Stopped</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="unknown">Unknown</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={3}>
                <Select
                  id='intentInput'
                  name='intent'
                  label='Intent'
                  value={formData.intent}
                  onChange={this.changeState.bind(this, 'intent')}
                  fullWidth
                >
                  <MenuItem value="proposal">Proposal</MenuItem>
                  <MenuItem value="plan">Plan</MenuItem>
                  <MenuItem value="order">Order</MenuItem>
                  <MenuItem value="original-order">Original Order</MenuItem>
                  <MenuItem value="reflex-order">Reflex Order</MenuItem>
                  <MenuItem value="filler-order">Filler Order</MenuItem>
                  <MenuItem value="instance-order">Instance Order</MenuItem>
                  <MenuItem value="option">Option</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={3}>
                <Select
                  id='priorityInput'
                  name='priority'
                  label='Priority'
                  value={formData.priority}
                  onChange={this.changeState.bind(this, 'priority')}
                  fullWidth
                >
                  <MenuItem value="routine">Routine</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                  <MenuItem value="asap">ASAP</MenuItem>
                  <MenuItem value="stat">STAT</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={3}>
                <TextField
                  id='authoredOnInput'
                  name='authoredOn'
                  label='Authored On'
                  type='date'
                  value={formData.authoredOn}
                  onChange={this.changeState.bind(this, 'authoredOn')}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  id='requesterDisplayInput'
                  name='requesterDisplay'
                  label='Requester'
                  value={formData.requesterDisplay}
                  onChange={this.changeState.bind(this, 'requesterDisplay')}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  id='dosageInstructionTextInput'
                  name='dosageInstructionText'
                  label='Dosage Instructions'
                  value={formData.dosageInstructionText}
                  onChange={this.changeState.bind(this, 'dosageInstructionText')}
                  placeholder={this.setHint("Take 2 tablets by mouth every 6 hours")}
                  fullWidth
                  multiline
                  rows={2}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={3}>
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
              <Grid item xs={3}>
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
              <Grid item xs={2}>
                <TextField
                  id='frequencyInput'
                  name='frequency'
                  label='Frequency'
                  type='number'
                  value={formData.frequency}
                  onChange={this.changeState.bind(this, 'frequency')}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={2}>
                <TextField
                  id='periodInput'
                  name='period'
                  label='Period'
                  type='number'
                  value={formData.period}
                  onChange={this.changeState.bind(this, 'period')}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={2}>
                <Select
                  id='periodUnitInput'
                  name='periodUnit'
                  label='Period Unit'
                  value={formData.periodUnit}
                  onChange={this.changeState.bind(this, 'periodUnit')}
                  fullWidth
                >
                  <MenuItem value="s">Second</MenuItem>
                  <MenuItem value="min">Minute</MenuItem>
                  <MenuItem value="h">Hour</MenuItem>
                  <MenuItem value="d">Day</MenuItem>
                  <MenuItem value="wk">Week</MenuItem>
                  <MenuItem value="mo">Month</MenuItem>
                  <MenuItem value="a">Year</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={3}>
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
              <Grid item xs={3}>
                <TextField
                  id='dispenseQuantityInput'
                  name='dispenseQuantity'
                  label='Dispense Quantity'
                  type='number'
                  value={formData.dispenseQuantity}
                  onChange={this.changeState.bind(this, 'dispenseQuantity')}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  id='dispenseUnitInput'
                  name='dispenseUnit'
                  label='Dispense Unit'
                  value={formData.dispenseUnit}
                  onChange={this.changeState.bind(this, 'dispenseUnit')}
                  placeholder={this.setHint("tablets, mL, etc.")}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  id='validityStartInput'
                  name='validityStart'
                  label='Valid From'
                  type='date'
                  value={formData.validityStart}
                  onChange={this.changeState.bind(this, 'validityStart')}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  id='validityEndInput'
                  name='validityEnd'
                  label='Valid Until'
                  type='date'
                  value={formData.validityEnd}
                  onChange={this.changeState.bind(this, 'validityEnd')}
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
    if (this.props.medicationRequestId) {
      return (
        <div>
          <Button 
            id="updateMedicationRequestButton"
            color="primary" 
            variant="contained" 
            onClick={this.handleSaveButton.bind(this)}
            style={{marginRight: '20px'}}
          >
            Save
          </Button>
          <Button 
            id="deleteMedicationRequestButton"
            onClick={this.handleDeleteButton.bind(this)}
          >
            Delete
          </Button>
        </div>
      );
    } else {
      return(
        <Button 
          id="saveMedicationRequestButton" 
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
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("MedicationRequestDetail.updateFormData", formData, field, textValue);

    switch (field) {
      case "subjectDisplay":
        set(formData, 'subjectDisplay', textValue)
        break;
      case "status":
        set(formData, 'status', textValue)
        break;
      case "intent":
        set(formData, 'intent', textValue)
        break;
      case "priority":
        set(formData, 'priority', textValue)
        break;
      case "medicationDisplay":
        set(formData, 'medicationDisplay', textValue)
        break;
      case "medicationCode":
        set(formData, 'medicationCode', textValue)
        break;        
      case "authoredOn":
        set(formData, 'authoredOn', textValue)
        break;
      case "requesterDisplay":
        set(formData, 'requesterDisplay', textValue)
        break;
      case "dosageInstructionText":
        set(formData, 'dosageInstructionText', textValue)
        break;
      case "dosageValue":
        set(formData, 'dosageValue', textValue)
        break;
      case "dosageUnit":
        set(formData, 'dosageUnit', textValue)
        break;
      case "frequency":
        set(formData, 'frequency', textValue)
        break;
      case "period":
        set(formData, 'period', textValue)
        break;
      case "periodUnit":
        set(formData, 'periodUnit', textValue)
        break;
      case "routeDisplay":
        set(formData, 'routeDisplay', textValue)
        break;
      case "dispenseQuantity":
        set(formData, 'dispenseQuantity', textValue)
        break;
      case "dispenseUnit":
        set(formData, 'dispenseUnit', textValue)
        break;
      case "validityStart":
        set(formData, 'validityStart', textValue)
        break;
      case "validityEnd":
        set(formData, 'validityEnd', textValue)
        break;
      default:
    }

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("formData", formData);
    return formData;
  }
  updateMedicationRequest(medicationRequestData, field, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("MedicationRequestDetail.updateMedicationRequest", medicationRequestData, field, textValue);

    switch (field) {
      case "subjectDisplay":
        set(medicationRequestData, 'subject.display', textValue)
        break;
      case "status":
        set(medicationRequestData, 'status', textValue)
        break;
      case "intent":
        set(medicationRequestData, 'intent', textValue)
        break;
      case "priority":
        set(medicationRequestData, 'priority', textValue)
        break;
      case "medicationDisplay":
        set(medicationRequestData, 'medicationCodeableConcept.text', textValue)
        break;
      case "medicationCode":
        set(medicationRequestData, 'medicationCodeableConcept.coding[0].code', textValue)
        break;        
      case "authoredOn":
        set(medicationRequestData, 'authoredOn', textValue)
        break;
      case "requesterDisplay":
        set(medicationRequestData, 'requester.display', textValue)
        break;
      case "dosageInstructionText":
        set(medicationRequestData, 'dosageInstruction[0].text', textValue)
        break;
      case "dosageValue":
        set(medicationRequestData, 'dosageInstruction[0].doseAndRate[0].doseQuantity.value', parseFloat(textValue))
        break;
      case "dosageUnit":
        set(medicationRequestData, 'dosageInstruction[0].doseAndRate[0].doseQuantity.unit', textValue)
        break;
      case "frequency":
        set(medicationRequestData, 'dosageInstruction[0].timing.repeat.frequency', parseInt(textValue))
        break;
      case "period":
        set(medicationRequestData, 'dosageInstruction[0].timing.repeat.period', parseInt(textValue))
        break;
      case "periodUnit":
        set(medicationRequestData, 'dosageInstruction[0].timing.repeat.periodUnit', textValue)
        break;
      case "routeDisplay":
        set(medicationRequestData, 'dosageInstruction[0].route.coding[0].display', textValue)
        break;
      case "dispenseQuantity":
        set(medicationRequestData, 'dispenseRequest.quantity.value', parseFloat(textValue))
        break;
      case "dispenseUnit":
        set(medicationRequestData, 'dispenseRequest.quantity.unit', textValue)
        break;
      case "validityStart":
        set(medicationRequestData, 'dispenseRequest.validityPeriod.start', textValue)
        break;
      case "validityEnd":
        set(medicationRequestData, 'dispenseRequest.validityPeriod.end', textValue)
        break;
    }
    return medicationRequestData;
  }

  changeState(field, event, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("   ");
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("MedicationRequestDetail.changeState", field, textValue);
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("this.state", this.state);

    let formData = Object.assign({}, this.state.form);
    let medicationRequestData = Object.assign({}, this.state.medicationRequest);

    formData = this.updateFormData(formData, field, textValue);
    medicationRequestData = this.updateMedicationRequest(medicationRequestData, field, textValue);

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("medicationRequestData", medicationRequestData);
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("formData", formData);

    this.setState({form: formData})
    this.setState({medicationRequest: medicationRequestData})
  }

  handleSaveButton(){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('MedicationRequestDetail.handleSaveButton()');
    let self = this;
    if(this.props.onUpsert){
      this.props.onUpsert(self);
    }
  }

  handleCancelButton(){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('MedicationRequestDetail.handleCancelButton()');
  }

  handleDeleteButton(){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('MedicationRequestDetail.handleDeleteButton()');
    let self = this;
    if(this.props.onDelete){
      this.props.onDelete(self);
    }
  }
}

MedicationRequestDetail.propTypes = {
  id: PropTypes.string,
  medicationRequestId: PropTypes.string,
  medicationRequest: PropTypes.object,
  showHints: PropTypes.bool,
  onDelete: PropTypes.func,
  onUpsert: PropTypes.func,
  onCancel: PropTypes.func
};

export default MedicationRequestDetail;
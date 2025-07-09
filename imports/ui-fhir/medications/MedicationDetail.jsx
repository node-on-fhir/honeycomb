// =======================================================================
// Using FHIR R4
//
// https://www.hl7.org/fhir/medication.html
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

  
export class MedicationDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      medicationId: false,
      medication: {
        resourceType: "Medication",
        code: {
          coding: [
            {
              system: "http://www.nlm.nih.gov/research/umls/rxnorm",
              code: "",
              display: ""
            }
          ],
          text: ""
        },
        status: "active",
        manufacturer: {
          reference: "",
          display: ""
        },
        form: {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: "",
              display: ""
            }
          ]
        },
        ingredient: [],
        batch: {
          lotNumber: "",
          expirationDate: null
        }
      }, 
      form: {
        medicationCode: '',
        medicationDisplay: '',
        medicationText: '',
        status: 'active',
        manufacturerDisplay: '',
        formDisplay: '',
        ingredientDisplay: '',
        lotNumber: '',
        expirationDate: ''
      }
    }
  }
  dehydrateFhirResource(medication) {
    let formData = Object.assign({}, this.state.form);

    formData.medicationCode = get(medication, 'code.coding[0].code', '')
    formData.medicationDisplay = get(medication, 'code.coding[0].display', '')    
    formData.medicationText = get(medication, 'code.text', '')
    formData.status = get(medication, 'status', 'active')
    formData.manufacturerDisplay = get(medication, 'manufacturer.display', '')
    formData.formDisplay = get(medication, 'form.coding[0].display', get(medication, 'form.text', ''))
    formData.lotNumber = get(medication, 'batch.lotNumber', '')
    formData.expirationDate = get(medication, 'batch.expirationDate', '')

    // Handle ingredients
    let ingredients = get(medication, 'ingredient', []);
    if(ingredients.length > 0){
      let ingredientList = ingredients.map(ing => {
        return get(ing, 'itemCodeableConcept.coding[0].display', get(ing, 'itemCodeableConcept.text', ''));
      }).join(', ');
      formData.ingredientDisplay = ingredientList;
    }

    return formData;
  }
  shouldComponentUpdate(nextProps){
    get(Meteor, 'settings.public.logging') === "debug" && console.log('MedicationDetail.shouldComponentUpdate()', nextProps, this.state)
    let shouldUpdate = true;

    // received a medication from the table; okay lets update again
    if(nextProps.medicationId !== this.state.medicationId){
      
      if(nextProps.medication){
        this.setState({medication: nextProps.medication})     
        this.setState({form: this.dehydrateFhirResource(nextProps.medication)})       
      }

      this.setState({medicationId: nextProps.medicationId})
      shouldUpdate = true;
    }

    // both false; don't take any more updates
    if(nextProps.medication === this.state.medication){
      shouldUpdate = false;
    }
 
    return shouldUpdate;
  }

  getMeteorData() {
    let data = {
      medicationId: this.props.medicationId,
      medication: false,
      form: this.state.form
    };

    if(this.props.medication){
      data.medication = this.props.medication;
      data.form = this.dehydrateFhirResource(this.props.medication);
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
    get(Meteor, 'settings.public.logging') === "debug" && console.log('MedicationDetail.render()', this.state)
    let formData = this.state.form;

    return (
      <div id={this.props.id} className="medicationDetail">
        <Card>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  id='medicationTextInput'
                  name='medicationText'
                  label='Medication Name'
                  value={formData.medicationText}
                  onChange={this.changeState.bind(this, 'medicationText')}
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
                  label='RxNorm Code'
                  value={formData.medicationCode}
                  onChange={this.changeState.bind(this, 'medicationCode')}
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
                  label='Display Name'
                  value={formData.medicationDisplay}
                  onChange={this.changeState.bind(this, 'medicationDisplay')}
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
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="entered-in-error">Entered in Error</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={4}>
                <TextField
                  id='formDisplayInput'
                  name='formDisplay'
                  label='Form'
                  value={formData.formDisplay}
                  onChange={this.changeState.bind(this, 'formDisplay')}
                  placeholder={this.setHint("tablet, capsule, liquid, etc.")}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  id='manufacturerDisplayInput'
                  name='manufacturerDisplay'
                  label='Manufacturer'
                  value={formData.manufacturerDisplay}
                  onChange={this.changeState.bind(this, 'manufacturerDisplay')}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  id='ingredientDisplayInput'
                  name='ingredientDisplay'
                  label='Ingredients'
                  value={formData.ingredientDisplay}
                  onChange={this.changeState.bind(this, 'ingredientDisplay')}
                  fullWidth
                  multiline
                  rows={2}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  id='lotNumberInput'
                  name='lotNumber'
                  label='Lot Number'
                  value={formData.lotNumber}
                  onChange={this.changeState.bind(this, 'lotNumber')}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  id='expirationDateInput'
                  name='expirationDate'
                  label='Expiration Date'
                  type='date'
                  value={formData.expirationDate}
                  onChange={this.changeState.bind(this, 'expirationDate')}
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
    if (this.props.medicationId) {
      return (
        <div>
          <Button 
            id="updateMedicationButton"
            color="primary" 
            variant="contained" 
            onClick={this.handleSaveButton.bind(this)}
            style={{marginRight: '20px'}}
          >
            Save
          </Button>
          <Button 
            id="deleteMedicationButton"
            onClick={this.handleDeleteButton.bind(this)}
          >
            Delete
          </Button>
        </div>
      );
    } else {
      return(
        <Button 
          id="saveMedicationButton" 
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
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("MedicationDetail.updateFormData", formData, field, textValue);

    switch (field) {
      case "medicationText":
        set(formData, 'medicationText', textValue)
        break;
      case "medicationCode":
        set(formData, 'medicationCode', textValue)
        break;
      case "medicationDisplay":
        set(formData, 'medicationDisplay', textValue)
        break;        
      case "status":
        set(formData, 'status', textValue)
        break;
      case "manufacturerDisplay":
        set(formData, 'manufacturerDisplay', textValue)
        break;
      case "formDisplay":
        set(formData, 'formDisplay', textValue)
        break;
      case "ingredientDisplay":
        set(formData, 'ingredientDisplay', textValue)
        break;
      case "lotNumber":
        set(formData, 'lotNumber', textValue)
        break;
      case "expirationDate":
        set(formData, 'expirationDate', textValue)
        break;
      default:
    }

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("formData", formData);
    return formData;
  }
  updateMedication(medicationData, field, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("MedicationDetail.updateMedication", medicationData, field, textValue);

    switch (field) {
      case "medicationText":
        set(medicationData, 'code.text', textValue)
        break;
      case "medicationCode":
        set(medicationData, 'code.coding[0].code', textValue)
        break;
      case "medicationDisplay":
        set(medicationData, 'code.coding[0].display', textValue)
        break;        
      case "status":
        set(medicationData, 'status', textValue)
        break;
      case "manufacturerDisplay":
        set(medicationData, 'manufacturer.display', textValue)
        break;
      case "formDisplay":
        set(medicationData, 'form.coding[0].display', textValue)
        set(medicationData, 'form.text', textValue)
        break;
      case "ingredientDisplay":
        // This would need more complex handling for the array
        break;
      case "lotNumber":
        set(medicationData, 'batch.lotNumber', textValue)
        break;
      case "expirationDate":
        set(medicationData, 'batch.expirationDate', textValue)
        break;
    }
    return medicationData;
  }

  changeState(field, event, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("   ");
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("MedicationDetail.changeState", field, textValue);
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("this.state", this.state);

    let formData = Object.assign({}, this.state.form);
    let medicationData = Object.assign({}, this.state.medication);

    formData = this.updateFormData(formData, field, textValue);
    medicationData = this.updateMedication(medicationData, field, textValue);

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("medicationData", medicationData);
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("formData", formData);

    this.setState({form: formData})
    this.setState({medication: medicationData})
  }

  handleSaveButton(){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('MedicationDetail.handleSaveButton()');
    let self = this;
    if(this.props.onUpsert){
      this.props.onUpsert(self);
    }
  }

  handleCancelButton(){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('MedicationDetail.handleCancelButton()');
  }

  handleDeleteButton(){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('MedicationDetail.handleDeleteButton()');
    let self = this;
    if(this.props.onDelete){
      this.props.onDelete(self);
    }
  }
}

MedicationDetail.propTypes = {
  id: PropTypes.string,
  medicationId: PropTypes.string,
  medication: PropTypes.object,
  showHints: PropTypes.bool,
  onDelete: PropTypes.func,
  onUpsert: PropTypes.func,
  onCancel: PropTypes.func
};

export default MedicationDetail;
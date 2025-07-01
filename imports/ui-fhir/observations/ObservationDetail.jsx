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


import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';

import { get, set } from 'lodash';
import moment from 'moment';


Meteor.startup(function(){
  FhirDehydrator = Meteor.FhirDehydrator
})


export function ObservationDetail(props){
  
  let state = {
    selectedObservationId: false,
    observation: {
      resourceType: 'Observation',
      status: 'preliminary',
      category: {
        text: ''
      },
      effectiveDateTime: '',
      subject: {                        
        display: '',
        reference: ''
      },
      performer: [],
      device: {
        display: '',
        reference: ''
      },
      valueQuantity: {
        value: '',
        unit: '',
        system: 'http://unitsofmeasure.org'
      },
      valueString: ''
    },
    form: {
      category: '',
      code: '',
      value: '',
      quantity: '',
      unit: '',
      deviceDisplay: '',
      subjectDisplay: '',
      subjectReference: '',
      effectiveDateTime: '',
      loincCode: '',
      loincCodeText: '',
      loincCodeDisplay: '',
      status: ''
    }
  }

  let data = {
    selectedObservationId: get(props, 'selectedObservationId', ''),
    observation: false,
    form: state.form,
    displayDatePicker: false
  };

  if(props.displayDatePicker){
    data.displayDatePicker = props.displayDatePicker;
  }
  
  if(props.observation){
    data.observation = props.observation;
    data.form = FhirDehydrator.flattenObservation(get(props, 'observation'));
  }


  console.log("ObservationDetail.data", data)





  //--------------------------------------------------------------------------------
  // Helper Functions

  function renderDatePicker(displayDatePicker, effectiveDateTime){
    console.log('renderDatePicker', displayDatePicker, effectiveDateTime)
    if(typeof effectiveDateTime === "string"){
      effectiveDateTime = moment(effectiveDateTime);
    }
    if (displayDatePicker) {
      return(<div></div>)
      // return (
      //   <DatePicker 
      //     name='effectiveDateTime'
      //     label={ setHint("Date of Administration") } 
      //     container="inline" 
      //     mode="landscape"
      //     value={ effectiveDateTime ? effectiveDateTime : null}    
      //     onChange={ changeState.bind(this, 'effectiveDateTime')}      
      //     fullWidth
      //   />
      // );
    }
  }
  function setHint(text){
    if(props.showHints !== false){
      return text;
    } else {
      return '';
    }
  }
  function determineButtons(selectedObservationId) {
    if (selectedObservationId) {
      return (
        <div>
          <Button id="updateObservationButton" className="saveObservationButton" color='primary' variant='contained' onClick={handleSaveButton.bind(this)} style={{marginRight: '20px'}} >Save</Button>
          <Button id="deleteObservationButton" onClick={handleDeleteButton.bind(this)} >Delete</Button>
        </div>        
      );
    } else {
      return (
        <Button id="saveObservationButton" color='primary' variant='contained' onClick={handleSaveButton.bind(this)} >Save</Button>
      );
    }
  }
  function updateFormData(formData, field, textValue){
    if(process.env.NODE_ENV === "test") console.log("ObservationDetail.updateFormData", formData, field, textValue);

    switch (field) {
      case "category":
        set(formData, 'category', textValue)
        break;
      case "code":
        set(formData, 'code', textValue)
        break;        
      case "value":
        set(formData, 'value', textValue)
        break;        
      case "comparator":
        set(formData, 'comparator', textValue)
        break;
      case "quantity":
        set(formData, 'quantity', textValue)
        break;
      case "unit":
        set(formData, 'unit', textValue)
        break;
      case "deviceDisplay":
        set(formData, 'deviceDisplay', textValue)
        break;
      case "subjectDisplay":
        set(formData, 'subjectDisplay', textValue)
        break;
      case "subjectReference":
        set(formData, 'subjectReference', textValue)
        break;
      case "effectiveDateTime":
        set(formData, 'effectiveDateTime', textValue)
        break;
      case "status":
        set(formData, 'status', textValue)
        break;
      case "loincCode":
        set(formData, 'loincCode', textValue)
        break;
      case "loincCodeText":
        set(formData, 'loincCodeText', textValue)
        break;
      case "loincCodeDisplay":
        set(formData, 'loincCodeDisplay', textValue)
        break;
    }

    if(process.env.NODE_ENV === "test") console.log("formData", formData);
    return formData;
  }
  function updateObservation(observationData, field, textValue){
    if(process.env.NODE_ENV === "test") console.log("ObservationDetail.updateObservation", observationData, field, textValue);

    switch (field) {
      case "category":
        set(observationData, 'category.text', textValue)
        break;
      case "code":
        set(observationData, 'code.text', textValue)
        break;        
      case "value":
        set(observationData, 'valueString', textValue)
        break;        
      case "comparator":
        set(observationData, 'valueQuantity.comparator', textValue)
        break;        
      case "quantity":
        set(observationData, 'valueQuantity.value', textValue)
        break;
      case "unit":
        set(observationData, 'valueQuantity.unit', textValue)
        break;
      case "deviceDisplay":
        set(observationData, 'device.display', textValue)
        break;
      case "subjectDisplay":
        set(observationData, 'subject.display', textValue)
        break;
      case "subjectReference":
        set(observationData, 'subject.reference', textValue)
        break;
      case "effectiveDateTime":
        set(observationData, 'effectiveDateTime', textValue)
        break;    
      case "status":
        set(observationData, 'status', textValue)
        break;    
      case "loincCode":
        set(observationData, 'code.coding[0].code', textValue)
        break;
      case "loincCodeText":
        set(observationData, 'code.text', textValue)
        break;
      case "loincCodeDisplay":
        set(observationData, 'code.coding[0].display', textValue)
        break;
    }
    return observationData;
  }

  function handleSaveButton(){
    let self = this;
    if(props.onUpsert){
      props.onUpsert(self);
    }
  }
  function handleCancelButton(){
    let self = this;
    if(props.onCancel){
      props.onCancel(self);
    }
  }
  function handleDeleteButton(){
    let self = this;
    if(props.onDelete){
      props.onDelete(self);
    }
  }

  //--------------------------------------------------------------------------------
  // Render

  console.log('ObservationDetail.render()', state);
    //let formData = state.form;

    var patientInputs;
    if(props.showPatientInputs !== false){
      patientInputs = <Grid container spacing={3}>
        <Grid item xs={6}>
          <TextField
            id='subjectDisplayInput'                
            name='subjectDisplay'
            label='Patient Name'
            // TimelineSidescrollPage dialog popup
            // Getting the following when passing an observation in via props
            // A component is changing a controlled input of type text to be uncontrolled. Input elements should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled input element for the lifetime of the component. 
            value={ get(data, 'form.subject', '') }
            // onChange={ changeState.bind(data, 'subject')}
            // label={ setHint('Jane Doe') }
            //floatingLabelFixed={true}
            fullWidth
            InputLabelProps={{
              shrink: true
            }}
            /><br/>            
        </Grid>
        <Grid item xs={6}>
          <TextField
            id='subjectIdInput'                
            name='subjectReference'
            label='Patient ID'
            value={ get(data, 'form.subjectReference', '') }
            // label={ setHint('Patient/12345') }
            // onChange={ changeState.bind(data, 'subjectReference')}
            //floatingLabelFixed={true}
            fullWidth
            InputLabelProps={{
              shrink: true
            }}
            /><br/>
        </Grid>
        
      </Grid>
    }


    var deviceInputs;
    if(props.showDeviceInputs !== false){
      deviceInputs = <Grid container spacing={3}>
        <Grid item xs={6}>
          <TextField
            id='deviceDisplayInput'                
            name='deviceDisplay'
            label='Device'
            value={ get(data, 'form.device', '') }
            //onChange={ changeState.bind(data, 'deviceDisplay')}
            // label={ setHint('iHealth Blood Pressure Cuff') }
            //floatingLabelFixed={true}
            fullWidth
            InputLabelProps={{
              shrink: true
            }}  
            /><br/>
        </Grid>
        <Grid item xs={6}>
          <TextField
            id='deviceReferenceInput'                
            name='deviceReference'
            label='Device Reference'
            value={ get(data, 'form.deviceReference', '') }
            // onChange={ changeState.bind(data, 'deviceReference')}
            // label={ setHint('Device/444') }
            //floatingLabelFixed={true}
            fullWidth
            InputLabelProps={{
              shrink: true
            }}  
            /><br/>
        </Grid>
        <Grid item xs={3}>
          <br />
          { renderDatePicker(data.displayDatePicker, get(data, 'form.effectiveDateTime') ) }
        </Grid>
      </Grid>
    }


  return (
    <div id={props.id} className="observationDetail">
      <CardContent>
        { patientInputs }
        <Grid container spacing={3}>
        <Grid item xs={4}>
            <TextField
              id='categoryTextInput'                
              name='category'
              label='Category'
              value={ get(data, 'form.category', '') }
              // label={ setHint('Vital Signs') }
              fullWidth
              InputLabelProps={{
                shrink: true
              }}
              /><br/>
          </Grid>
          <Grid item xs={4}>
            <TextField
              id='statusInput'                
              name='status'
              label='Status'
              value={ get(data, 'form.status', '') }
              // label={ setHint('preliminary | final') }
              fullWidth
              InputLabelProps={{
                shrink: true
              }}  
              /><br/>
          </Grid>
          <Grid item xs={4}>
            <TextField
              id='effectiveDateTimeInput'                
              name='effectiveDateTime'
              label='Effective Date'
              value={ get(data, 'form.effectiveDateTime', '') }
              // label={ setHint('Effective Date') }
              fullWidth
              InputLabelProps={{
                shrink: true
              }}  
              /><br/>
          </Grid>
          {/* <Grid item xs={3}>
            <TextField
                id='loincCodeTextInput'                
                name='loincCodeText'
                label='LOINC Code Text'
                value={ get(data, 'form.loincCodeText') }
                label={ setHint('HbA1c') }
                fullWidth
                InputLabelProps={{
                  shrink: true
                }}
                /><br/>
          </Grid> */}
          <Grid item xs={4}>
            <TextField
              id='loincCodeInput'                
              name='loincCode'
              label='LOINC Code'
              value={ get(data, 'form.codeValue', '') }
              //onChange={ changeState.bind(data, 'loincCode')}
              label='LOINC Code'
              //floatingLabelFixed={true}
              fullWidth
              InputLabelProps={{
                shrink: true
              }}  
              /><br/>
          </Grid>
          <Grid item xs={8}>
            <TextField
              id='loincDisplayInput'                
              name='loincCodeText'
              label='LOINC Display'
              value={ get(data, 'form.codeDisplay', '') }
              //onChange={ changeState.bind(data, 'loincCodeText')}
              label='LOINC Description'
              //floatingLabelFixed={true}
              fullWidth
              InputLabelProps={{
                shrink: true
              }}  
              /><br/>
          </Grid>
        </Grid>
        <Grid container spacing={3}>
          {/* <Grid item xs={2}>
            <TextField
              id='comparatorInput'                
              name='valueQuantity.comparator'
              label='Comparator'
              label={ setHint('< | <= | >= | >') }
              value={ get(data, 'form.comparator') }
              //onChange={ changeState.bind(data, 'comparator')}
              //floatingLabelFixed={true}
              fullWidth
              InputLabelProps={{
                shrink: true
              }}  
              /><br/> 
          </Grid> */}
          <Grid item xs={4}>
            {/* <TextField
              id='statusInput'                
              name='status'
              label='Status'
              value={ get(data, 'form.status') }
              label={ setHint('preliminary | final') }
              fullWidth
              InputLabelProps={{
                shrink: true
              }}  
              /><br/> */}
          </Grid>

          {/* <Grid item xs={2}>
            <TextField
              id='valueQuantityInput'                
              name='valueQuantity.value'
              label='Quantity'
              label={ setHint('70.0') }
              value={ get(data, 'form.value') }
              //onChange={ changeState.bind(data, 'quantity')}
              //floatingLabelFixed={true}
              fullWidth
              InputLabelProps={{
                shrink: true
              }}  
              /><br/>
          </Grid>
          <Grid item xs={2}>
            <TextField
              id='valueQuantityUnitInput'                
              name='valueQuantity.unit'
              label='Unit'
              label={ setHint('kg') }
              value={ get(data, 'form.unit') }
              //onChange={ changeState.bind(data, 'unit')}
              //floatingLabelFixed={true}
              fullWidth
              InputLabelProps={{
                shrink: true
              }}  
              /><br/>
          </Grid> */}
          <Grid item xs={8}>
            <TextField
              id='valueStringInput'                
              name='value'
              label='Value'
              // label={ setHint('AB+; pos; neg') }
              value={ get(data, 'form.value', '') }
              //onChange={ changeState.bind(data, 'value')}
              //floatingLabelFixed={true}
              fullWidth
              InputLabelProps={{
                shrink: true
              }}  
              /><br/>
          </Grid>
          
        </Grid>
        { deviceInputs } 
      </CardContent>
      {/* <CardActions>
        { determineButtons(data.selectedObservationId) }
      </CardActions> */}
    </div>
  );
}



// export class ObservationDetail extends React.Component {
//   shouldComponentUpdate(nextProps){
//     process.env.NODE_ENV === "test" && console.log('ObservationDetail.shouldComponentUpdate()', nextProps, state)
//     let shouldUpdate = true;

//     // received an observation from the table; okay lets update again
//     if(nextProps.selectedObservationId !== state.selectedObservationId){

//       if(nextProps.observation){
//         setState({observation: nextProps.observation})     
//         setState({form: dehydrateFhirResource(nextProps.observation)})       
//       }

//       setState({selectedObservationId: nextProps.selectedObservationId})      
//       shouldUpdate = true;
//     }

//     // both false; don't take any more updates
//     if(nextProps.observation === state.observation){
//       shouldUpdate = false;
//     }
    
//     return shouldUpdate;
//   }

//   changeState(field, event, textValue){
//     if(process.env.NODE_ENV === "test") console.log("   ");
//     if(process.env.NODE_ENV === "test") console.log("ObservationDetail.changeState", field, textValue);
//     if(process.env.NODE_ENV === "test") console.log("state", state);

//     let formData = Object.assign({}, state.form);
//     let observationData = Object.assign({}, state.observation);

//     formData = updateFormData(formData, field, textValue);
//     observationData = updateObservation(observationData, field, textValue);

//     if(process.env.NODE_ENV === "test") console.log("observationData", observationData);
//     if(process.env.NODE_ENV === "test") console.log("formData", formData);

//     setState({observation: observationData})
//     setState({form: formData})
//   }
// }

ObservationDetail.propTypes = {
  id: PropTypes.string,
  fhirVersion: PropTypes.string,
  selectedselectedObservationId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  observation: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  showPatientInputs: PropTypes.bool,
  showDeviceInputs: PropTypes.bool,
  showHints: PropTypes.bool,
  onInsert: PropTypes.func,
  onUpsert: PropTypes.func,
  onRemove: PropTypes.func,
  onCancel: PropTypes.func
};

export default ObservationDetail;
// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/ui-fhir/locations/LocationDetail.jsx

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

  
export class LocationDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      locationId: false,
      location: {
        resourceType: "Location",
        name: "",
        status: "active",
        mode: "instance",
        type: {
          coding: [{
            system: "http://terminology.hl7.org/CodeSystem/v3-RoleCode",
            code: "",
            display: ""
          }]
        },
        telecom: [],
        address: {
          use: "work",
          type: "both",
          line: [],
          city: "",
          state: "",
          postalCode: "",
          country: ""
        },
        physicalType: {
          coding: [{
            system: "http://terminology.hl7.org/CodeSystem/location-physical-type",
            code: "",
            display: ""
          }]
        },
        position: {
          longitude: null,
          latitude: null,
          altitude: null
        },
        managingOrganization: {
          reference: "",
          display: ""
        },
        partOf: {
          reference: "",
          display: ""
        }
      }, 
      form: {
        name: '',
        status: 'active',
        mode: 'instance',
        typeCode: '',
        typeDisplay: '',
        addressLine: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        telecom: '',
        physicalTypeCode: '',
        physicalTypeDisplay: '',
        latitude: '',
        longitude: '',
        altitude: '',
        managingOrganizationDisplay: '',
        partOfDisplay: ''
      }
    }
  }
  dehydrateFhirResource(location) {
    let formData = Object.assign({}, this.state.form);

    formData.name = get(location, 'name', '')
    formData.status = get(location, 'status', 'active')
    formData.mode = get(location, 'mode', 'instance')
    formData.typeCode = get(location, 'type.coding[0].code', '')
    formData.typeDisplay = get(location, 'type.coding[0].display', '')
    formData.addressLine = get(location, 'address.line[0]', '')
    formData.city = get(location, 'address.city', '')
    formData.state = get(location, 'address.state', '')
    formData.postalCode = get(location, 'address.postalCode', '')
    formData.country = get(location, 'address.country', '')
    formData.telecom = get(location, 'telecom[0].value', '')
    formData.physicalTypeCode = get(location, 'physicalType.coding[0].code', '')
    formData.physicalTypeDisplay = get(location, 'physicalType.coding[0].display', '')
    formData.latitude = get(location, 'position.latitude', '')
    formData.longitude = get(location, 'position.longitude', '')
    formData.altitude = get(location, 'position.altitude', '')
    formData.managingOrganizationDisplay = get(location, 'managingOrganization.display', '')
    formData.partOfDisplay = get(location, 'partOf.display', '')

    return formData;
  }
  shouldComponentUpdate(nextProps){
    get(Meteor, 'settings.public.logging') === "debug" && console.log('LocationDetail.shouldComponentUpdate()', nextProps, this.state)
    let shouldUpdate = true;

    // received a location from the table; okay lets update again
    if(nextProps.locationId !== this.state.locationId){
      
      if(nextProps.location){
        this.setState({location: nextProps.location})     
        this.setState({form: this.dehydrateFhirResource(nextProps.location)})       
      }

      this.setState({locationId: nextProps.locationId})
      shouldUpdate = true;
    }

    // both false; don't take any more updates
    if(nextProps.location === this.state.location){
      shouldUpdate = false;
    }
 
    return shouldUpdate;
  }

  getMeteorData() {
    let data = {
      locationId: this.props.locationId,
      location: false,
      form: this.state.form
    };

    if(this.props.location){
      data.location = this.props.location;
      data.form = this.dehydrateFhirResource(this.props.location);
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
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('LocationDetail.render()', this.state)

    return (
      <div id={this.props.id} className="locationDetail">
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={6}>
              <TextField
                id='nameInput'
                name='name'
                label='Name'
                value={ get(this, 'data.form.name', '') }
                onChange={ this.changeState.bind(this, 'name')}
                hintText={ this.setHint('Emergency Room') }
                fullWidth
                /><br/>

              <Select
                id='statusInput'
                name='status'
                label='Status'
                value={ get(this, 'data.form.status', 'active') }
                onChange={ this.changeState.bind(this, 'status')}
                fullWidth
                >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select><br/>

              <Select
                id='modeInput'
                name='mode'
                label='Mode'
                value={ get(this, 'data.form.mode', 'instance') }
                onChange={ this.changeState.bind(this, 'mode')}
                fullWidth
                >
                <MenuItem value="instance">Instance</MenuItem>
                <MenuItem value="kind">Kind</MenuItem>
              </Select><br/>

              <TextField
                id='typeCodeInput'
                name='typeCode'
                label='Type Code'
                value={ get(this, 'data.form.typeCode', '') }
                hintText={ this.setHint('ER') }
                onChange={ this.changeState.bind(this, 'typeCode')}
                fullWidth
                /><br/>

              <TextField
                id='typeDisplayInput'
                name='typeDisplay'
                label='Type Display'
                value={ get(this, 'data.form.typeDisplay', '') }
                onChange={ this.changeState.bind(this, 'typeDisplay')}
                hintText={ this.setHint('Emergency Room') }
                fullWidth
                /><br/>

              <TextField
                id='physicalTypeCodeInput'
                name='physicalTypeCode'
                label='Physical Type Code'
                value={ get(this, 'data.form.physicalTypeCode', '') }
                hintText={ this.setHint('ro') }
                onChange={ this.changeState.bind(this, 'physicalTypeCode')}
                fullWidth
                /><br/>

              <TextField
                id='physicalTypeDisplayInput'
                name='physicalTypeDisplay'
                label='Physical Type Display'
                value={ get(this, 'data.form.physicalTypeDisplay', '') }
                onChange={ this.changeState.bind(this, 'physicalTypeDisplay')}
                hintText={ this.setHint('Room') }
                fullWidth
                /><br/>

              <TextField
                id='managingOrganizationDisplayInput'
                name='managingOrganizationDisplay'
                label='Managing Organization'
                value={ get(this, 'data.form.managingOrganizationDisplay', '') }
                onChange={ this.changeState.bind(this, 'managingOrganizationDisplay')}
                hintText={ this.setHint('General Hospital') }
                fullWidth
                /><br/>

              <TextField
                id='partOfDisplayInput'
                name='partOfDisplay'
                label='Part Of'
                value={ get(this, 'data.form.partOfDisplay', '') }
                onChange={ this.changeState.bind(this, 'partOfDisplay')}
                hintText={ this.setHint('Main Building') }
                fullWidth
                /><br/>
            </Grid>
            <Grid item xs={6}>
              <TextField
                id='addressLineInput'
                name='addressLine'
                label='Address Line'
                value={ get(this, 'data.form.addressLine', '') }
                onChange={ this.changeState.bind(this, 'addressLine')}
                hintText={ this.setHint('123 Main St') }
                fullWidth
                /><br/>

              <TextField
                id='cityInput'
                name='city'
                label='City'
                value={ get(this, 'data.form.city', '') }
                onChange={ this.changeState.bind(this, 'city')}
                hintText={ this.setHint('Chicago') }
                fullWidth
                /><br/>

              <TextField
                id='stateInput'
                name='state'
                label='State'
                value={ get(this, 'data.form.state', '') }
                onChange={ this.changeState.bind(this, 'state')}
                hintText={ this.setHint('IL') }
                fullWidth
                /><br/>

              <TextField
                id='postalCodeInput'
                name='postalCode'
                label='Postal Code'
                value={ get(this, 'data.form.postalCode', '') }
                onChange={ this.changeState.bind(this, 'postalCode')}
                hintText={ this.setHint('60601') }
                fullWidth
                /><br/>

              <TextField
                id='countryInput'
                name='country'
                label='Country'
                value={ get(this, 'data.form.country', '') }
                onChange={ this.changeState.bind(this, 'country')}
                hintText={ this.setHint('USA') }
                fullWidth
                /><br/>

              <TextField
                id='telecomInput'
                name='telecom'
                label='Phone'
                value={ get(this, 'data.form.telecom', '') }
                onChange={ this.changeState.bind(this, 'telecom')}
                hintText={ this.setHint('312-555-1234') }
                fullWidth
                /><br/>

              <TextField
                id='latitudeInput'
                name='latitude'
                label='Latitude'
                value={ get(this, 'data.form.latitude', '') }
                onChange={ this.changeState.bind(this, 'latitude')}
                hintText={ this.setHint('41.8781') }
                fullWidth
                /><br/>

              <TextField
                id='longitudeInput'
                name='longitude'
                label='Longitude'
                value={ get(this, 'data.form.longitude', '') }
                onChange={ this.changeState.bind(this, 'longitude')}
                hintText={ this.setHint('-87.6298') }
                fullWidth
                /><br/>

              <TextField
                id='altitudeInput'
                name='altitude'
                label='Altitude'
                value={ get(this, 'data.form.altitude', '') }
                onChange={ this.changeState.bind(this, 'altitude')}
                hintText={ this.setHint('0') }
                fullWidth
                /><br/>
            </Grid>
          </Grid>

          <br/>
          <a href='https://www.hl7.org/fhir/valueset-c80-facilitycodes.html'>Location Type Codes</a>
          <br/>
          <a href='https://www.hl7.org/fhir/valueset-location-physical-type.html'>Physical Type Codes</a>

        </CardContent>
        <CardActions>
          { this.determineButtons(this.state.locationId) }
        </CardActions>
      </div>
    );
  }

  determineButtons(locationId){
    if (locationId) {
      return (
        <div>
          <Button id="updateLocationButton" primary={true} onClick={this.handleSaveButton.bind(this)} style={{marginRight: '20px'}} >Save</Button>
          <Button id="deleteLocationButton" onClick={this.handleDeleteButton.bind(this)} >Delete</Button>
        </div>
      );
    } else {
      return(
        <Button id="saveLocationButton" primary={true} onClick={this.handleSaveButton.bind(this)} >Save</Button>
      );
    }
  }


  updateFormData(formData, field, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("LocationDetail.updateFormData", formData, field, textValue);

    switch (field) {
      case "name":
        set(formData, 'name', textValue)
        break;
      case "status":
        set(formData, 'status', textValue)
        break;        
      case "mode":
        set(formData, 'mode', textValue)
        break;
      case "typeCode":
        set(formData, 'typeCode', textValue)
        break;
      case "typeDisplay":
        set(formData, 'typeDisplay', textValue)
        break;
      case "addressLine":
        set(formData, 'addressLine', textValue)
        break;
      case "city":
        set(formData, 'city', textValue)
        break;
      case "state":
        set(formData, 'state', textValue)
        break;
      case "postalCode":
        set(formData, 'postalCode', textValue)
        break;
      case "country":
        set(formData, 'country', textValue)
        break;
      case "telecom":
        set(formData, 'telecom', textValue)
        break;
      case "physicalTypeCode":
        set(formData, 'physicalTypeCode', textValue)
        break;
      case "physicalTypeDisplay":
        set(formData, 'physicalTypeDisplay', textValue)
        break;
      case "latitude":
        set(formData, 'latitude', textValue)
        break;
      case "longitude":
        set(formData, 'longitude', textValue)
        break;
      case "altitude":
        set(formData, 'altitude', textValue)
        break;
      case "managingOrganizationDisplay":
        set(formData, 'managingOrganizationDisplay', textValue)
        break;
      case "partOfDisplay":
        set(formData, 'partOfDisplay', textValue)
        break;
      default:
    }

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("formData", formData);
    return formData;
  }
  updateLocation(locationData, field, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("LocationDetail.updateLocation", locationData, field, textValue);

    switch (field) {
      case "name":
        set(locationData, 'name', textValue)
        break;
      case "status":
        set(locationData, 'status', textValue)
        break;
      case "mode":
        set(locationData, 'mode', textValue)
        break;
      case "typeCode":
        set(locationData, 'type.coding[0].code', textValue)
        break;
      case "typeDisplay":
        set(locationData, 'type.coding[0].display', textValue)
        break;
      case "addressLine":
        set(locationData, 'address.line[0]', textValue)
        break;
      case "city":
        set(locationData, 'address.city', textValue)
        break;  
      case "state":
        set(locationData, 'address.state', textValue)
        break;
      case "postalCode":
        set(locationData, 'address.postalCode', textValue)
        break;
      case "country":
        set(locationData, 'address.country', textValue)
        break;
      case "telecom":
        set(locationData, 'telecom[0].value', textValue)
        if(!get(locationData, 'telecom[0].system')){
          set(locationData, 'telecom[0].system', 'phone')
        }
        break;
      case "physicalTypeCode":
        set(locationData, 'physicalType.coding[0].code', textValue)
        break;
      case "physicalTypeDisplay":
        set(locationData, 'physicalType.coding[0].display', textValue)
        break;
      case "latitude":
        set(locationData, 'position.latitude', parseFloat(textValue))
        break;
      case "longitude":
        set(locationData, 'position.longitude', parseFloat(textValue))
        break;
      case "altitude":
        set(locationData, 'position.altitude', parseFloat(textValue))
        break;
      case "managingOrganizationDisplay":
        set(locationData, 'managingOrganization.display', textValue)
        break;
      case "partOfDisplay":
        set(locationData, 'partOf.display', textValue)
        break;
    }
    return locationData;
  }
  componentDidUpdate(props){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('LocationDisplay.componentDidUpdate()', props, this.state)
  }
  // this could be a mixin
  changeState(field, event, textValue){

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("   ");
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("LocationDetail.changeState", field, textValue);
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("this.state", this.state);

    let formData = Object.assign({}, this.state.form);
    let locationData = Object.assign({}, this.state.location);

    formData = this.updateFormData(formData, field, textValue);
    locationData = this.updateLocation(locationData, field, textValue);

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("locationData", locationData);
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("formData", formData);

    this.setState({location: locationData})
    this.setState({form: formData})

  }

  handleSaveButton(){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^&&')
    console.log('Saving a new Location...', this.state)

    let self = this;
    let fhirLocationData = Object.assign({}, this.state.location);

    if(get(Meteor, 'settings.public.logging') === "debug") console.log('fhirLocationData', fhirLocationData);


    let locationValidator = LocationSchema.newContext();
    locationValidator.validate(fhirLocationData)

    console.log('IsValid: ', locationValidator.isValid())
    console.log('ValidationErrors: ', locationValidator.validationErrors());

    if (this.state.locationId) {
      if(get(Meteor, 'settings.public.logging') === "debug") console.log("Updating Location...");
      delete fhirLocationData._id;

      Locations._collection.update(
        {_id: this.state.locationId}, {$set: fhirLocationData }, function(error, result) {
          if (error) {
            console.log("error", error);
            // Bert.alert(error.reason, 'danger');
          }
          if (result) {
            if(self.props.onUpdate){
              self.props.onUpdate(self.data.locationId);
            }
            // Bert.alert('Location updated!', 'success');
          }
        });
    } else {

      if(get(Meteor, 'settings.public.logging') === "debug") console.log("Create a new Location", fhirLocationData);

      Locations._collection.insert(fhirLocationData, function(error, result) {
        if (error) {
          console.log("error", error);
          // Bert.alert(error.reason, 'danger');
        }
        if (result) {
          if(self.props.onInsert){
            self.props.onInsert(self.data.locationId);
          }
          // Bert.alert('Location added!', 'success');
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
    console.log('LocationDetail.handleDeleteButton()', this.state.locationId)

    let self = this;
    Locations._collection.remove({_id: this.state.locationId}, function(error, result){
      if (error) {
        // Bert.alert(error.reason, 'danger');
      }
      if (result) {
        if(this.props.onInsert){
          this.props.onInsert(self.data.locationId);
        }
        // Bert.alert('Location removed!', 'success');
      }
    });
  }
}

LocationDetail.propTypes = {
  id: PropTypes.string,
  locationId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  location: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  showHints: PropTypes.bool,
  onInsert: PropTypes.func,
  onUpdate: PropTypes.func,
  onRemove: PropTypes.func,
  onCancel: PropTypes.func
};

export default LocationDetail;
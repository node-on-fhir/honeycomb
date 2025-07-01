// =======================================================================
// Using DSTU2  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//
// https://www.hl7.org/fhir/DSTU2/device.html
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

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';


Session.setDefault('deviceUpsert', false);

export class DeviceDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      deviceId: false,
      device: {
        resourceType: "Device",
        identifier: [{
          type: {
            coding: [
              {
                system: "http://hl7.org/fhir/identifier-type",
                code: "SNO"
              }
            ],
            text: "Serial Number"
          },
          value: ""
        }],
        type: {
          text: ""
        },
        status: "available",
        manufacturer: "",
        model: "",
        lotNumber: "",
        contact: [{
          resourceType: "ContactPoint",
          system: "phone",
          value: ""
        }]
      },
      form: {
        deviceType: '',
        manufacturer: '',
        model: '',
        serialNumber: ''
      }
    }
  }
  dehydrateFhirResource(device) {
    let formData = Object.assign({}, this.state.form);

    formData.deviceType = get(device, 'type.text')
    formData.manufacturer = get(device, 'manufacturer')    
    formData.model = get(device, 'model')
    formData.serialNumber = get(device, 'identifier[0].value')

    return formData;
  }
  shouldComponentUpdate(nextProps){
    process.env.NODE_ENV === "test" && console.log('DeviceDetail.shouldComponentUpdate()', nextProps, this.state)
    let shouldUpdate = true;

    // both false; don't take any more updates
    if(nextProps.device === this.state.device){
      shouldUpdate = false;
    }

    // received an device from the table; okay lets update again
    if(nextProps.deviceId !== this.state.deviceId){
      this.setState({deviceId: nextProps.deviceId})
      
      if(nextProps.device){
        this.setState({device: nextProps.device})     
        this.setState({form: this.dehydrateFhirResource(nextProps.device)})       
      }
      shouldUpdate = true;
    }
 
    return shouldUpdate;
  }
  getMeteorData() {
    let data = {
      deviceId: this.props.deviceId,
      device: false,
      form: this.state.form
    };

    if(this.props.device){
      data.device = this.props.device;
    }

    return data;
  }

  render() {
    if(process.env.NODE_ENV === "test") console.log('DeviceDetail.render()', this.state)
    let formData = this.state.form;

    return (
      <div id={this.props.id} className="deviceDetail">
        <CardContent>
          <TextField
            id='deviceTypeInput'
            ref='deviceType'
            name='deviceType'
            floatingLabelText='Device Type'
            hintText="Floor Scale"
            value={ get(formData, 'deviceType', '') }
            onChange={ this.changeState.bind(this, 'deviceType')}
            floatingLabelFixed={true}
            fullWidth
            /><br/>
          <TextField
            id='manufacturerInput'
            ref='manufacturer'
            name='manufacturer'
            floatingLabelText='Manufacturer'
            hintText="Withings"
            value={ get(formData, 'manufacturer', '') }
            onChange={ this.changeState.bind(this, 'manufacturer')}
            floatingLabelFixed={true}
            fullWidth
            /><br/>
          <TextField
            id='deviceModelInput'
            ref='deviceModel'
            name='deviceModel'
            floatingLabelText='Model'
            hintText='Cardio WiFi'
            value={ get(formData, 'model', '') }
            onChange={ this.changeState.bind(this, 'deviceModel')}
            floatingLabelFixed={true}
            fullWidth
            /><br/>
          <TextField
            id='serialNumberInput'
            ref='serialNumber'
            name='serialNumber'
            hintText='GN-23-01'
            floatingLabelText='Serial Number'
            value={ get(formData, 'serialNumber', '') }
            onChange={ this.changeState.bind(this, 'serialNumber')}
            floatingLabelFixed={true}
            fullWidth
            /><br/>
        </CardContent>
        <CardActions>
          { this.determineButtons(this.data.deviceId) }
        </CardActions>
      </div>
    );
  }

  determineButtons(deviceId){
    if (deviceId) {
      return (
        <div>
          <Button id="saveDeviceButton" label="Save" color="primary" variant="contained" onClick={this.handleSaveButton.bind(this)} style={{marginRight: '20px'}}  />
          <Button id="deleteDeviceButton" label="Delete" color="primary" onClick={this.handleDeleteButton.bind(this)} />
        </div>
      );
    } else {
      return(
        <Button id="saveDeviceButton" label="Save" primary={true} onClick={this.handleSaveButton.bind(this)} />
      );
    }
  }
  updateFormData(formData, field, textValue){
    if(process.env.NODE_ENV === "test") console.log("DeviceDetail.updateFormData", formData, field, textValue);

    switch (field) {
      case "deviceType":
        set(formData, 'deviceType', textValue)
        break;
      case "manufacturer":
        set(formData, 'manufacturer', textValue)
        break;        
      case "deviceModel":
        set(formData, 'model', textValue)
        break;
      case "serialNumber":
        set(formData, 'serialNumber', textValue)
        break;
      default:
    }

    if(process.env.NODE_ENV === "test") console.log("formData", formData);
    return formData;
  }
  updateDevice(deviceData, field, textValue){
    if(process.env.NODE_ENV === "test") console.log("DeviceDetail.updateDevice", deviceData, field, textValue);

    switch (field) {
      case "deviceType":
        set(deviceData, 'type.text', textValue)
        break;
      case "manufacturer":
        set(deviceData, 'manufacturer', textValue)
        break;
      case "deviceModel":
        set(deviceData, 'model', textValue)
        break;
      case "serialNumber":
        set(deviceData, 'identifier[0].value', textValue)
        break;      
    }
    return deviceData;
  }
  componentDidUpdate(props){
    if(process.env.NODE_ENV === "test") console.log('DeviceDetail.componentDidUpdate()', props, this.state)
  }
  changeState(field, event, textValue){
    if(process.env.NODE_ENV === "test") console.log("   ");
    if(process.env.NODE_ENV === "test") console.log("DeviceDetail.changeState", field, textValue);
    if(process.env.NODE_ENV === "test") console.log("this.state", this.state);

    let formData = Object.assign({}, this.state.form);
    let deviceData = Object.assign({}, this.state.device);

    formData = this.updateFormData(formData, field, textValue);
    deviceData = this.updateDevice(deviceData, field, textValue);

    if(process.env.NODE_ENV === "test") console.log("deviceData", deviceData);
    if(process.env.NODE_ENV === "test") console.log("formData", formData);

    this.setState({device: deviceData})
    this.setState({form: formData})
  }

  handleSaveButton(){
    if(process.env.NODE_ENV === "test") console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^&&')
    console.log('Saving a new Device...', this.state)

    let self = this;
    let fhirDeviceData = Object.assign({}, this.state.device);

    if(process.env.NODE_ENV === "test") console.log('fhirDeviceData', fhirDeviceData);


    let deviceValidator = DeviceSchema.newContext();
    deviceValidator.validate(fhirDeviceData)

    console.log('IsValid: ', deviceValidator.isValid())
    console.log('ValidationErrors: ', deviceValidator.validationErrors());

    if (this.data.deviceId) {
      if(process.env.NODE_ENV === "test") console.log("Updating device...");
      delete fhirDeviceData._id;

      Devices._collection.update(
        {_id: this.data.deviceId}, {$set: fhirDeviceData }, function(error, result) {
          if (error) {
            console.log("error", error);

            Bert.alert(error.reason, 'danger');
          }
          if (result) {
            HipaaLogger.logEvent({eventType: "update", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Devices", recordId: self.data.deviceId});
            Session.set('devicePageTabIndex', 1);
            Session.set('selectedDevice', false);
            Session.set('deviceUpsert', false);
            Bert.alert('Device updated!', 'success');
          }
        });
    } else {

      if(process.env.NODE_ENV === "test") console.log("create a new device", fhirDeviceData);

      Devices._collection.insert(fhirDeviceData, function(error, result) {
        if (error) {
          Bert.alert(error.reason, 'danger');
        }
        if (result) {
          HipaaLogger.logEvent({eventType: "create", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Devices", recordId: self.data.deviceId});
          Session.set('devicePageTabIndex', 1);
          Session.set('selectedDevice', false);
          Session.set('deviceUpsert', false);
          Bert.alert('Device added!', 'success');
        }
      });
    }
  }

  handleCancelButton(){
    Session.set('devicePageTabIndex', 1);
  }

  handleDeleteButton(){
    let self = this;
    Devices._collection.remove({_id: this.data.deviceId}, function(error, result){
      if (error) {
        Bert.alert(error.reason, 'danger');
      }
      if (result) {
        HipaaLogger.logEvent({eventType: "delete", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Devices", recordId: self.data.deviceId});
        Session.set('devicePageTabIndex', 1);
        Session.set('selectedDevice', false);
        Session.set('deviceUpsert', false);
        Bert.alert('Device removed!', 'success');
      }
    });
  }
}


DeviceDetail.propTypes = {
  id: PropTypes.string,
  fhirVersion: PropTypes.string,
  deviceId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  device: PropTypes.oneOfType([PropTypes.object, PropTypes.bool])
};


export default DeviceDetail;
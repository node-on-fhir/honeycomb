import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { 
  Button,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableFooter,
  TablePagination,
} from '@mui/material';

import moment from 'moment'
import { get, set, has, findIndex } from 'lodash';

import { FhirUtilities } from '../lib/FhirUtilities';
import { FhirDehydrator } from '../lib/FhirDehydrator';

import { Session } from 'meteor/session';


//===========================================================================
// SESSION VARIABLES

Session.setDefault('selectedLocations', []);



//===========================================================================
// MAIN COMPONENT




export function LocationsTable(props){
  logger.debug('Rendering the LocationsTable');
  logger.verbose('clinical:hl7-resource-locations.client.LocationsTable');
  logger.data('LocationsTable.props', {data: props}, {source: "LocationsTable.jsx"});

  // console.log('LocationsTable', props)


  let { 
    children, 
    id,

    data,
    locations,
    selectedLocationId,
    query,
    paginationLimit,
    disablePagination,

    hideIdentifier,
    hideName,
    hideAddress,
    hideCity,
    hideState,
    hidePostalCode,
    hideCountry,
    hideType,
    hideExtensions,
    hideLatitude,
    hideLongitude,
    hideLatLng,
    hideActionIcons,
    hideFhirId,

    simplifiedAddress,
    extensionUrl,
    extensionLabel,
    extensionUnit,

    showMinutes,
    dateFormat,

    rowsPerPage,

    page,
    onSetPage,

    formFactorLayout,
    tableRowSize,

    count,
    multiline,


    ...otherProps 
  } = props;



  // ------------------------------------------------------------------------
  // Form Factors

  if(formFactorLayout){
    switch (formFactorLayout) {
      case "phone":
        hideActionIcons = true;
        break;
      case "tablet":
        hideActionIcons = true;
        break;
      case "web":
        hideActionIcons = true;
        break;
      case "desktop":
        hideActionIcons = true;
        break;
      case "videowall":
        hideActionIcons = true;
        break;            
    }
  }


  // ------------------------------------------------------------------------

  // Pagination

  let rows = [];

  let paginationCount = 101;
  if(count){
    paginationCount = count;
  } else {
    paginationCount = rows.length;
  }

  function handleChangePage(event, newPage){
    if(typeof onSetPage === "function"){
      onSetPage(newPage);
    }
  }

  let paginationFooter;
  if(!disablePagination){
    paginationFooter = <TablePagination
      component="div"
      // rowsPerPageOptions={[5, 10, 25, 100]}
      rowsPerPageOptions={[5, 10, 25, 100]}
      colSpan={3}
      count={paginationCount}
      rowsPerPage={rowsPerPage}
      page={page}
      onPageChange={handleChangePage}
      style={{float: 'right', border: 'none', userSelect: 'none'}}
    />
  }

  //---------------------------------------------------------------------
  // Methods


  function renderNameHeader(){
    if (!hideName) {
      return (
        <TableCell className="name">Name</TableCell>
      );
    }
  }
  function renderName(name, address, latitude, longitude){
    if (!hideName) {
      let cellContents = [];

      if(Number.isFinite(latitude)){
        latitude = latitude.toFixed(6);
      }
      if(Number.isFinite(longitude)){
        longitude = longitude.toFixed(6);
      }

      let addressString = "";
      if(typeof address === "object"){
        addressString = FhirUtilities.stringifyAddress(address, {noPrefix: true});
      } else if (typeof address === "string"){
        addressString = address;
      }

      if(multiline){
        cellContents.push(<div key='location_name' className="location_name">{name}</div>)
        cellContents.push(<div key='location_address' className="location_address" style={{color: '#222222'}}>{addressString}</div>)
        cellContents.push(<div key='location_latlng' className="location_latlng" style={{color: 'cornflowerblue', fontSize: '80%'}}>{longitude}, {latitude}</div>)
      } else {
        cellContents.push(<div key='location_name' className="location_name">{name}</div>)
      }
      return (
        <TableCell className='name'>
          { cellContents }   
        </TableCell>
      );  
    }
  }
  function renderIdentifierHeader(){
    if (!hideIdentifier) {
      return (
        <TableCell className="identifier">Identifier</TableCell>
      );
    }
  }
  function renderIdentifier(identifier){
    if (!hideIdentifier) {
      return (
        <TableCell className='identifier'>{ identifier }</TableCell>
      );  
    }
  }
  function renderFhirId(fhirId){
    if (!hideFhirId) {
      return (
        <TableCell className='fhirId'>{ fhirId }</TableCell>
      );
    }
  }
  function renderFhirIdHeader(){
    if (!hideFhirId) {
      return (
        <TableCell className='fhirId'>FHIR ID</TableCell>
      );
    }
  }
  function renderAddressHeader(){
    if (!hideAddress) {
      return (
        <TableCell className="address">Address</TableCell>
      );
    }
  }
  function renderAddress(address){
    if (!hideAddress) {

      let addressString = "";
      if(typeof address === "object"){
        addressString = FhirUtilities.stringifyAddress(address, {noPrefix: true});
      } else if (typeof address === "string"){
        addressString = address;
      }

      return (
        <TableCell className='address'>{ addressString }</TableCell>
      );  
    }
  }
  function renderCityHeader(){
    if (!hideCity) {
      return (
        <TableCell className="city">City</TableCell>
      );
    }
  }
  function renderCity(city){
    if (!hideCity) {
      return (
        <TableCell className='city'>{ city }</TableCell>
      );  
    }
  }
  function renderStateHeader(){
    if (!hideState) {
      return (
        <TableCell className="state">State</TableCell>
      );
    }
  }
  function renderState(state){
    if (!hideState) {
      return (
        <TableCell className='state'>{ state }</TableCell>
      );  
    }
  }
  function renderPostalCodeHeader(){
    if (!hidePostalCode) {
      
      return (
        <TableCell className="postalCode">Postal Code</TableCell>
      );
    }
  }
  function renderPostalCode(postalCode){
    if (!hidePostalCode) {
      let postalCodeString = postalCode
      if(postalCode.length === 9){
        postalCodeString = postalCode.substring(0,5) + "-" + postalCode.substring(5,9)
      }

      return (
        <TableCell className='postalCode'>{ postalCodeString }</TableCell>
      );  
    }
  }
  function renderCountryHeader(){
    if (!hideCountry) {
      return (
        <TableCell className="country">Country</TableCell>
      );
    }
  }
  function renderCountry(country){
    if (!hideCountry) {
      return (
        <TableCell className='country'>{ country }</TableCell>
      );  
    }
  }
  function renderTypeHeader(){
    if (!hideType) {
      return (
        <TableCell className="type">Type</TableCell>
      );
    }
  }
  function renderType(type){
    if (!hideType) {
      return (
        <TableCell className='type'>{ type }</TableCell>
      );  
    }
  }
  function renderLatitudeHeader(){
    if (!hideLatitude) {
      return (
        <TableCell className="latitude">Latitude</TableCell>
      );
    }
  }
  function renderLatitude(latitude){
    if (!hideLatitude) {
      return (
        <TableCell className='latitude'>{ latitude }</TableCell>
      );  
    }
  }
  function renderLatLngHeader(){
    if (!hideLatLng) {
      return (
        <TableCell className="latitude">Distance</TableCell>
      );
    }
  }
  function renderLatLng(latitude, longitude, distance){
    if (!hideLatLng) {
      let textStyle = {
        color: '#bbbbbb'
      }
      if(Number.isFinite(latitude)){
        latitude = latitude.toFixed(6);
      }
      if(Number.isFinite(longitude)){
        longitude = longitude.toFixed(6);
      }
      return (
        <TableCell className='latlng' style={{verticalAlign: 'top'}} >
          <div>{distance} miles</div>
          {/* <div style={{color: 'cornflowerblue', fontSize: '80%', marginRight: '10px'}}>{longitude}, {latitude}</div> */}
        </TableCell>
      );  
    }
  }
  function renderLongitudeHeader(){
    if (!hideLongitude) {
      return (
        <TableCell className="longitude">Longitude</TableCell>
      );
    }
  }
  function renderLongitude(longitude){
    if (!hideLongitude) {
      return (
        <TableCell className='longitude'>{ longitude }</TableCell>
      );  
    }
  }

  function renderExtensionsHeader(){
    if (!hideExtensions) {
      return (
        <TableCell className="extensions">{extensionLabel}</TableCell>
      );
    }
  }
  function renderExtensions(extensions){
    if (!hideExtensions) {
      let cellText = "";
      if(extensionUnit){
        cellText = extensions + " " + extensionUnit;
      } else {
        cellText = extensions;
      }
      return (
        <TableCell className='extensions'>{ cellText }</TableCell>
      );  
    }
  }

  //---------------------------------------------------------------------
  // Methods  

  function rowClick(id){
    // Session.set('selectedConditionId', id);
    // Session.set('locationPageTabIndex', 2);
  };

  //---------------------------------------------------------------------
  // Array Parsing  

  let tableRows = [];
  let locationsToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(dateFormat){
    internalDateFormat = dateFormat;
  }


  if(locations){
    if(locations.length > 0){     
      let count = 0;    

      locations.forEach(function(location){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          locationsToRender.push(FhirDehydrator.dehydrateLocation(location, simplifiedAddress, extensionUrl));
        }
        count++;
      });  
    }
  }

  let rowStyle = {
    cursor: 'pointer', 
    height: '55px'
  }

  if(locationsToRender.length === 0){
    // logger.trace('LocationsTable: No locations to render.');
    console.log('LocationsTable: No locations to render.');
    // footer = <TableNoData noDataPadding={ noDataMessagePadding } />
  } else {
    console.log('selectedLocationId', selectedLocationId)
    for (var i = 0; i < locationsToRender.length; i++) {
      logger.trace('locationsToRender[i]', locationsToRender[i])

      let isSelected = false;
      if(get(locationsToRender[i], 'id') === selectedLocationId){
        isSelected = true;
      }
      if(get(locationsToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }

      console.log('locationsToRender[i]', locationsToRender[i])

      tableRows.push(
        <TableRow 
          className='locationRow' 
          key={i} 
          onClick={ rowClick.bind(this, get(locationsToRender[i], "_id")) } 
          hover={true} 
          selected={isSelected}
          style={rowStyle} >
           { renderFhirId(get(locationsToRender[i], "id")) }
           { renderIdentifier(get(locationsToRender[i], "identifier")) }
           { renderName(get(locationsToRender[i], "name"), get(locationsToRender[i], "address"), get(locationsToRender[i], "latitude"), get(locationsToRender[i], "longitude")) }
           { renderAddress(get(locationsToRender[i], "address")) }
           { renderCity(get(locationsToRender[i], "city")) }
           { renderState(get(locationsToRender[i], "state")) }
           { renderPostalCode(get(locationsToRender[i], "postalCode")) }
           { renderCountry(get(locationsToRender[i], "country")) }
           { renderType(get(locationsToRender[i], "type")) }
           { renderLatitude(get(locationsToRender[i], "latitude")) }
           { renderLongitude(get(locationsToRender[i], "longitude")) }
           { renderLatLng(get(locationsToRender[i], "latitude"), get(locationsToRender[i], "longitude"), get(locationsToRender[i], "distance")) }
           { renderExtensions(get(locationsToRender[i], "selectedExtension")) }
        </TableRow>
      );
    }
  }

  

  return(
    <div id={id} className="tableWithPagination">
      <Table className='locationsTable' size={tableRowSize} aria-label="a size table" { ...otherProps }>
        <TableHead>
          <TableRow >
            { renderFhirIdHeader() }
            { renderIdentifierHeader() }
            { renderNameHeader() }
            { renderAddressHeader() }
            { renderCityHeader() }
            { renderStateHeader() }
            { renderPostalCodeHeader() }
            { renderCountryHeader() }
            { renderTypeHeader() }
            { renderLatitudeHeader() }
            { renderLongitudeHeader() }
            { renderLatLngHeader() }
            { renderExtensionsHeader() }
          </TableRow>
        </TableHead>
        <TableBody>
          { tableRows }
        </TableBody>
      </Table>
    { paginationFooter }
    </div>
  );
}


LocationsTable.propTypes = {
  locations: PropTypes.array,
  selectedLocationId: PropTypes.string,

  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,
  rowsPerPage: PropTypes.number,
  count: PropTypes.number,

  page: PropTypes.number,
  onSetPage: PropTypes.func,

  hideFhirId: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideName: PropTypes.bool,
  hideAddress: PropTypes.bool,
  hideCity: PropTypes.bool,
  hideState: PropTypes.bool,
  hidePostalCode: PropTypes.bool,
  hideCountry: PropTypes.bool,
  hideType: PropTypes.bool,
  hideExtensions: PropTypes.bool,
  hideLatLng: PropTypes.bool,
  hideLongitude: PropTypes.bool,
  hideLatLng: PropTypes.bool,
  simplifiedAddress: PropTypes.bool,
  extensionUrl: PropTypes.string,
  extensionLabel: PropTypes.string,
  extensionUnit: PropTypes.string,
  multiline: PropTypes.bool,

  showMinutes: PropTypes.bool,
  dateFormat: PropTypes.string,

  formFactorLayout: PropTypes.string,
  tableRowSize: PropTypes.string
}

// LocationsTable.defaultProps = {
//   selectedLocationId: '',
//   hideFhirId: true,
//   hideIdentifier: true,
//   hideName: false,
//   hideAddress: false,
//   hideCity: false,
//   hideState: false,
//   hidePostalCode: false,
//   hideCountry: false,
//   hideExtensions: true,
//   hideType: false,
//   hideLongitude: false,
//   hideLatLng: true,
//   showMinutes: false,
//   extensionUrl: '',
//   extensionLabel: 'Extension',
//   extensionUnit: '',
//   simplifiedAddress: true,
//   multiline: false,
//   tableRowSize: 'medium',
//   page: 0,
//   rowsPerPage: 5,
//   dateFormat: "YYYY-MM-DD",
//   tableRowSize: 'medium'
// }

export default LocationsTable;
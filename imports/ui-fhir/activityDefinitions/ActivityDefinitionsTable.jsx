import React, { useState, useEffect } from 'react';
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
  TablePagination
} from '@mui/material';


import moment from 'moment';
import { get } from 'lodash';

// import { Icon } from 'react-icons-kit'
// import { tag } from 'react-icons-kit/fa/tag'
// import {iosTrashOutline} from 'react-icons-kit/ionicons/iosTrashOutline'

import { FhirUtilities } from '../../lib/FhirUtilities';

import { FhirDehydrator } from '../../lib/FhirDehydrator';


//===========================================================================
// THEMING




//===========================================================================
// MAIN COMPONENT

function ActivityDefinitionsTable(props){
  logger.info('Rendering the ActivityDefinitionsTable');
  

  let { 
    id,
    children, 

    data,
    activityDefinitions,
    selectedActivityDefinitionId,

    query,
    paginationLimit,
    disablePagination,
  
    hideCheckbox,
    hideActionIcons,
    hideIdentifier,

    hideBarcode,
    hideTextIcon,
  
    onCellClick,
    onRowClick,
    onMetaClick,
    onRemoveRecord,
    onActionButtonClick,
    hideActionButton,
    actionButtonLabel,
  
    autoColumns,
    rowsPerPage,
    tableRowSize,
    dateFormat,
    showMinutes,
    hideEnteredInError,
    formFactorLayout,
    count,
    labels,

    defaultCheckboxValue,

    page,
    onSetPage,

    ...otherProps 
  } = props;


    // ------------------------------------------------------------------------
  // Form Factors

  if(formFactorLayout){
    logger.verbose('formFactorLayout', formFactorLayout + ' ' + window.innerWidth);
    switch (formFactorLayout) {
      case "phone":
        hideCheckbox = true;
        hideActionIcons = true;
        hidePatientName = true;
        hidePatientReference = true;
        hideClinicalStatus = true;
        hideSnomedCode = true;
        hideSnomedDisplay = false;
        hideVerification = false;
        hideSeverity = true;
        hideActivityDefinition = true;
        hideDates = true;
        hideEndDate = true;
        hideBarcode = true;  
        multiline = true;
        hideTextIcon = false
        break;
      case "tablet":
        hideCheckbox = true;
        hideActionIcons = true;
        hidePatientName = false;
        hidePatientReference = true;
        hideClinicalStatus = true;
        hideSnomedCode = false;
        hideSnomedDisplay = false;
        hideVerification = true;
        hideSeverity = true;
        hideActivityDefinition = true;
        hideDates = false;
        hideEndDate = true;
        hideBarcode = false;   
        multiline = false;
        hideTextIcon = false
        hideTextIcon = false
        break;
      case "web":
        hideClinicalStatus = true;
        hideSnomedCode = false;
        hideSnomedDisplay = false;
        hidePatientName = false;
        hideVerification = true;
        hideSeverity = true;
        hideActivityDefinition = true;
        hideDates = true;
        hideEndDate = false;
        hideBarcode = false;
        multiline = false;
        hideTextIcon = false
        break;
      case "desktop":
        hideClinicalStatus = true;
        hidePatientName = false;
        hideSnomedCode = false;
        hideSnomedDisplay = false;
        hideVerification = true;
        hideSeverity = true;
        hideActivityDefinition = true;
        hideDates = false;
        hideEndDate = true;
        hideBarcode = false;
        multiline = false;
        hideTextIcon = true;
        break;
      case "hdmi":
        hideClinicalStatus = false;
        hideSnomedCode = false;
        hideSnomedDisplay = false;
        hideVerification = false;
        hideSeverity = false;
        hideActivityDefinition = false;
        hideDates = false;
        hideEndDate = false;
        hideBarcode = false;
        multiline = false;
        hideTextIcon = true;
        break;            
    }
  }



  //--------------------------------------------------------------------------------
  // Autocolumns  

    
  // if(Array.isArray(activityDefinitions)){
    // if(!hasInitializedAutoColumns){
    //   let columnHasData = {
    //     identifier: false,
    //     patientName: false,
    //     patientReference: false,
    //     asserterName: false,
    //     clinicalStatus: false,
    //     snomedCode: false,
    //     snomedDisplay: false,
    //     verification: false,
    //     serverity: false,
    //     activityDefinition: false,
    //     dates: false,
    //     endDate: false,
    //     barcode: false
    //   }
      
    //   let dehydrateedCollection = activityDefinitions.map(function(record){
    //     return dehydrateActivityDefinition(record, "YYYY-MM-DD");
    //   });      
  
    //   dehydrateedCollection.forEach(function(row){
    //     if(get(row, 'id')){
    //       columnHasData.barcode = true;
    //     }
    //     if(get(row, 'identifier')){
    //       columnHasData.identifier = true;
    //     }
    //     if(get(row, 'clinicalStatus')){
    //       columnHasData.clinicalStatus = true;
    //     }
    //     if(get(row, 'verificationStatus')){
    //       columnHasData.barcode = true;
    //     }
    //     if(get(row, 'verificationStatus')){
    //       columnHasData.barcode = true;
    //     }
    //     if(get(row, 'patientDisplay')){
    //       columnHasData.patientName = true;
    //     }
    //     if(get(row, 'patientReference')){
    //       columnHasData.patientReference = true;
    //     }
    //     if(get(row, 'severity')){
    //       columnHasData.severity = true;
    //     }
    //     if(get(row, 'snomedCode')){
    //       columnHasData.snomedCode = true;
    //     }
    //     if(get(row, 'snomedDisplay')){
    //       columnHasData.snomedDisplay = true;
    //     }
    //     if(get(row, 'activityDefinitionDisplay')){
    //       columnHasData.barcode = true;
    //     }
    //     if(get(row, 'activityDefinition')){
    //       columnHasData.barcode = true;
    //     }
    //     if(get(row, 'onsetDateTime')){
    //       columnHasData.dates = true;
    //     }
    //     if(get(row, 'abatementDateTime')){
    //       columnHasData.endDate = true;
    //     }
    //   })
  
    //   setHasInitializedAutoColumns(true);
    //   setAutoColumns(columnHasData)
    // }
  //}


  //---------------------------------------------------------------------
  // Helper Functions

  function handleToggle(index){
    console.log('Toggling entry ' + index)
    if(props.onToggle){
      props.onToggle(index);
    }
  }

  function removeRecord(_id){
    console.log('removeRecord')
  }
  function handleRowClick(id){
    

    if(props && (typeof onRowClick === "function")){
      onRowClick(id);
    }
  }
  function handleActionButtonClick(_id){
    if(typeof onActionButtonClick === "function"){
      onActionButtonClick(_id);
    }
  }
  
  //---------------------------------------------------------------------
  // Column Rendering

  function renderCheckboxHeader(){
    if (!hideCheckbox) {
      return (
        <TableCell className="toggle" style={{width: '60px'}} >{get(labels, 'checkbox', 'Checkbox')}</TableCell>
      );
    }
  }
  function renderCheckbox(index){
    if (!hideCheckbox) {
      return (
        <TableCell className="toggle" style={{padding: '0px'}}>
          <Checkbox
            defaultChecked={defaultCheckboxValue}
            onChange={ handleToggle.bind(this, index)} 
          />
        </TableCell>
      );
    }
  }
  function renderDateHeader(){
    if (!hideDates) {
      return (
        <TableCell className='date' style={{minWidth: '140px'}}>Start</TableCell>
      );
    }
  }
  function renderEndDateHeader(){
    if ((!hideDates && !hideEndDate)) {
      return (
        <TableCell className='date' style={{minWidth: '140px'}}>End</TableCell>
      );
    }
  }
  function renderStartDate(startDate ){
    if (!hideDates) {
      return (
        <TableCell className='date' style={{minWidth: '140px'}}>{ moment(startDate).format('YYYY-MM-DD') }</TableCell>
      );
    }
  }
  function renderEndDate(endDate ){
    if ((!hideDates && !hideEndDate)) {
      return (
        <TableCell className='date' style={{minWidth: '140px'}}>{ moment(endDate).format('YYYY-MM-DD') }</TableCell>
      );
    }
  }

  function renderTextIconHeader(){
    if (!hideTextIcon) {
      return (
        <TableCell className='textIcon'>Text</TableCell>
      );
    }
  }
  function renderTextIcon(textDiv ){

    let textIcon = "None";
    if((typeof textDiv === "string" && (textDiv.length > 0))){
      textIcon = "Text"
    }

    if (!hideTextIcon) {
      return (
        <TableCell className='textIcon' style={{minWidth: '140px'}}>{ textIcon }</TableCell>
      );
    }
  }
  function renderPatientNameHeader(){
    if (!hidePatientName) {
      return (
        <TableCell className='patientDisplay'>Patient</TableCell>
      );
    }
  }
  function renderPatientName(patientDisplay ){
    if (!hidePatientName) {
      return (
        <TableCell className='patientDisplay' style={{minWidth: '140px'}}>{ patientDisplay }</TableCell>
      );
    }
  }
  function renderPatientReferenceHeader(){
    if (!hidePatientReference) {
      return (
        <TableCell className='patientReference'>Patient Reference</TableCell>
      );
    }
  }
  function renderPatientReference(patientReference ){
    if (!hidePatientReference) {
      return (
        <TableCell className='patientReference' style={{maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis',  whiteSpace: 'nowrap'}}>
          { FhirUtilities.pluckReferenceId(patientReference) }
        </TableCell>
      );
    }
  }
  function renderAsserterNameHeader(){
    if (!hideAsserterName) {
      return (
        <TableCell className='asserterDisplay'>Asserter</TableCell>
      );
    }
  }
  function renderAsserterName(asserterDisplay ){
    if (!hideAsserterName) {
      return (
        <TableCell className='asserterDisplay' style={{minWidth: '140px'}}>{ asserterDisplay }</TableCell>
      );
    }
  }  
  function renderSeverityHeader(){
    if (!hideSeverity) {
      return (
        <TableCell className='renderSeverity'>Severity</TableCell>
      );
    }
  }
  function renderSeverity(severity ){
    if (!hideSeverity) {
      return (
        <TableCell className='severity'>{ severity }</TableCell>
      );
    }
  } 
  function renderActivityDefinitionHeader(){
    if (!hideActivityDefinition) {
      return (
        <TableCell className='activityDefinition'>ActivityDefinition</TableCell>
      );
    }
  }
  function renderActivityDefinition(activityDefinitionDisplay ){
    if (!hideActivityDefinition) {
      return (
        <TableCell className='activityDefinition'>{ activityDefinitionDisplay }</TableCell>
      );
    }
  } 
  function renderIdentifierHeader(){
    if (!hideIdentifier) {
      return (
        <TableCell className='identifier'>Identifier</TableCell>
      );
    }
  }
  function renderIdentifier(identifier ){
    if (!hideIdentifier) {
      return (
        <TableCell className='identifier'>{ identifier }</TableCell>
      );
    }
  } 
  function renderClinicalStatus(clinicalStatus){
    if (!hideClinicalStatus) {
      return (
        <TableCell className='clinicalStatus'>{ clinicalStatus }</TableCell>
      );
    }
  }
  function renderClinicalStatusHeader(){
    if (!hideClinicalStatus) {
      return (
        <TableCell className='clinicalStatus'>Clinical Status</TableCell>
      );
    }
  }
  function renderSnomedCode(snomedCode){
    if (!hideSnomedCode) {
      return (
        <TableCell className='snomedCode' style={{width: '180px'}}>{ snomedCode }</TableCell>
      );
    }
  }
  function renderSnomedCodeHeader(){
    if (!hideSnomedCode) {
      return (
        <TableCell className='snomedCode' style={{width: '180px'}}>{get(labels, 'snomedCode', 'SNOMED Code')}</TableCell>
      );
    }
  }
  function renderSnomedDisplay(snomedDisplay, snomedCode){
    if (!hideSnomedDisplay) {
      if(multiline){
        return (<TableCell className='snomedDisplay'>
          <span style={{fontWeight: 400}}>{snomedDisplay }</span> <br />
          <span style={{color: 'gray'}}>{ snomedCode }</span>
        </TableCell>)
      } else {
        return (
          <TableCell className='snomedDisplay' style={{whiteSpace: 'nowrap'}} >{ snomedDisplay }</TableCell>
        );  
      }
    }
  }
  function renderSnomedDisplayHeader(){
    if (!hideSnomedDisplay) {
      return (
        <TableCell className='snomedDisplay'>{get(labels, 'snomedDisplay', 'SNOMED Display')}</TableCell>
      );
    }
  }
  function renderVerification(verificationStatus){
    if (!hideVerification) {
      return (
        <TableCell className='verificationStatus' >{ verificationStatus }</TableCell>
      );
    }
  }
  function renderVerificationHeader(){
    if (!hideVerification) {
      return (
        <TableCell className='verificationStatus' >Verification</TableCell>
      );
    }
  }
  function renderActionIconsHeader(){
    if (!hideActionIcons) {
      return (
        <TableCell className='actionIcons'>Actions</TableCell>
      );
    }
  }
  function renderActionIcons( activityDefinition ){
    if (!hideActionIcons) {

      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{width: '120px'}}>
          {/* <Icon icon={tag} style={iconStyle} onClick={showSecurityDialog.bind(this, activityDefinition)} />
          <Icon icon={iosTrashOutline} style={iconStyle} onClick={removeRecord.bind(this, activityDefinition._id)} /> */}
        </TableCell>
      );
    }
  } 

  function renderBarcode(id){
    if (!hideBarcode) {
      return (
        <TableCell><span className="barcode helveticas">{id}</span></TableCell>
      );
    }
  }
  function renderBarcodeHeader(){
    if (!hideBarcode) {
      return (
        <TableCell>System ID</TableCell>
      );
    }
  }
  function renderActionButtonHeader(){
    if (!hideActionButton) {
      return (
        <TableCell className='ActionButton' >Action</TableCell>
      );
    }
  }
  function renderActionButton(activityDefinitionId){
    if (!hideActionButton) {
      return (
        <TableCell className='ActionButton' >
          <Button onClick={ handleActionButtonClick.bind(this, activityDefinitionId)}>{ get(props, "actionButtonLabel", "") }</Button>
        </TableCell>
      );
    }
  }

  function rowClick(id){
    // Session.set('selectedActivityDefinitionId', id);
    // Session.set('activityDefinitionPageTabIndex', 2);
  };


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
        style={{float: 'right', border: 'none'}}
      />
    }

  
  //---------------------------------------------------------------------
  // Table Rows

  let tableRows = [];
  let activityDefinitionsToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(dateFormat){
    internalDateFormat = dateFormat;
  }

  if(activityDefinitions){
    if(activityDefinitions.length > 0){     
      let count = 0;    

      activityDefinitions.forEach(function(activityDefinition){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          activityDefinitionsToRender.push(FhirDehydrator.dehydrateActivityDefinition(activityDefinition, internalDateFormat));
        }
        count++;
      });  
    }
  }

  let rowStyle = {
    cursor: 'pointer',
    height: '52px'
  }

  if(activityDefinitionsToRender.length === 0){
    logger.trace('ActivityDefinitionsTable: No activityDefinitions to render.');
  } else {
    for (var i = 0; i < activityDefinitionsToRender.length; i++) {
      let selected = false;
      if(activityDefinitionsToRender[i].id === selectedActivityDefinitionId){
        selected = true;
      }
      if(get(activityDefinitionsToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }
      logger.trace('activityDefinitionsToRender[i]', activityDefinitionsToRender[i])

      if(get(activityDefinitionsToRender[i], "resourceType") === "OperationOutcome"){
        tableRows.push(
          <TableRow 
          className="immunizationRow" 
          key={i} 
          style={rowStyle} 
          onClick={ handleRowClick.bind(this, activityDefinitionsToRender[i].id)} 
          hover={true} 
          style={{height: '53px', background: "repeating-linear-gradient( 45deg, rgba(253,184,19, 0.9), rgba(253,184,19, 0.9) 10px, rgba(253,184,19, 0.75) 10px, rgba(253,184,19, 0.75) 20px ), url(http://s3-us-west-2.amazonaws.com/s.cdpn.io/3/old_map_@2X.png)"}} >            
            <TableCell className='actionIcons' style={{width: '100%', whiteSpace: 'nowrap'}}>
              {get(activityDefinitionsToRender[i], 'issue[0].text', 'OperationOutcome: No data returned.')}
            </TableCell>
            <TableCell className='actionIcons' ></TableCell>
            <TableCell className='actionIcons' ></TableCell>           
          </TableRow>
        ); 
      } else {
        tableRows.push(
          <TableRow className="activityDefinitionRow" key={i} style={rowStyle} onClick={ handleRowClick.bind(this, activityDefinitionsToRender[i]._id)} style={rowStyle} hover={true} selected={selected} >            
            { renderCheckbox(i) }
            { renderActionIcons(activityDefinitionsToRender[i]) }
            { renderTextIcon(get(activityDefinitionsToRender[i], "text.div", "")) }
            { renderIdentifier(get(activityDefinitionsToRender[i], "identifier", "")) }
            { renderPatientName(get(activityDefinitionsToRender[i], "patientDisplay", "")) } 
            { renderPatientReference(get(activityDefinitionsToRender[i], "patientReference", "")) }           
            { renderAsserterName(get(activityDefinitionsToRender[i], "asserterDisplay", "")) } 
            { renderClinicalStatus(get(activityDefinitionsToRender[i], "clinicalStatus", ""))}
            { renderSnomedCode(get(activityDefinitionsToRender[i], "snomedCode", ""))}
            { renderSnomedDisplay(get(activityDefinitionsToRender[i], "snomedDisplay", ""), get(activityDefinitionsToRender[i], "snomedCode", ""))}
            { renderVerification(get(activityDefinitionsToRender[i], "verificationStatus", "")) } 
            { renderSeverity(get(activityDefinitionsToRender[i], "severity", "")) }
            { renderActivityDefinition(get(activityDefinitionsToRender[i], "activityDefinitionDisplay", "")) }
            { renderStartDate(get(activityDefinitionsToRender[i], "onsetDateTime", "")) }
            { renderEndDate(get(activityDefinitionsToRender[i], "abatementDateTime", "")) }
            { renderBarcode(get(activityDefinitionsToRender[i], "_id", ""))}
            { renderActionButton(get(activityDefinitionsToRender[i], "_id", "")) }
          </TableRow>
        );   
      }

       
    }
  }

  

  //---------------------------------------------------------------------
  // Actual Render Method

  
  return(
    <div id={id} className="tableWithPagination">
      <Table className='activityDefinitionsTable' size={tableRowSize} aria-label="a dense table" { ...otherProps }>
        <TableHead>
          <TableRow>
            { renderCheckboxHeader() } 
            { renderActionIconsHeader() }
            { renderTextIconHeader() }
            { renderIdentifierHeader() }

            { renderBarcodeHeader() }
            { renderActionButtonHeader() }
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


ActivityDefinitionsTable.propTypes = {
  id: PropTypes.string,
  data: PropTypes.array,
  activityDefinitions: PropTypes.array,
  selectedActivityDefinitionId: PropTypes.string,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideIdentifier: PropTypes.bool,

  hideBarcode: PropTypes.bool,
  hideTextIcon: PropTypes.bool,

  defaultCheckboxValue: PropTypes.bool,

  onCellClick: PropTypes.func,
  onRowClick: PropTypes.func,
  onMetaClick: PropTypes.func,
  onRemoveRecord: PropTypes.func,
  onActionButtonClick: PropTypes.func,
  onSetPage: PropTypes.func,

  page: PropTypes.number,
  hideActionButton: PropTypes.bool,
  actionButtonLabel: PropTypes.string,

  rowsPerPage: PropTypes.number,
  dateFormat: PropTypes.string,
  showMinutes: PropTypes.bool,
  hideEnteredInError: PropTypes.bool,
  count: PropTypes.number,
  tableRowSize: PropTypes.string,
  formFactorLayout: PropTypes.string,

  labels: PropTypes.object
};

ActivityDefinitionsTable.defaultProps = {
  tableRowSize: 'medium',
  rowsPerPage: 5,
  dateFormat: "YYYY-MM-DD hh:mm:ss",
  hideCheckbox: true,
  hideActionIcons: true,
  hideIdentifier: true,

  hideTextIcon: true,
  hideBarcode: false,
  hideActionButton: true,
  disablePagination: false,  
  activityDefinitions: [],
  labels: {
    checkbox: "Checkbox",
    snomedDisplay: "SNOMED Display",
    snomedCode: "SNOMED Code"
  },
  defaultCheckboxValue: false
}

export default ActivityDefinitionsTable;

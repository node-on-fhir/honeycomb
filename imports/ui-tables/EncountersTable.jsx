import React, { useState } from 'react';
import PropTypes from 'prop-types';

// import { logger } from 'winston';

import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';


import moment from 'moment'
import _ from 'lodash';
let get = _.get;
let set = _.set;

import { FhirUtilities } from '../lib/FhirUtilities';
import { FhirDehydrator } from '../lib/FhirDehydrator';





export function EncountersTable(props){
  logger.info('Rendering the EncountersTable');
  
  // logger.data('EncountersTable.props', {data: props}, {source: "EncountersTable.jsx"});

  let { 
    id,
    children, 
    
    barcodes,
    encounters,
    selectedEncounterId,
    query,
    paginationLimit,
    disablePagination,
  
    hideCategory,
    hideClassCode,
    hideType,
    hideTypeCode,
    hideReason,
    hideReasonCode,
    hideSubjects,
    hideCheckboxes,
    hideActionIcons,
    hideIdentifier,
    hideStatus,
    hideHistory,
    hideBarcode,
    calculateDuration,
    enteredInError,
    multiline,
    onCellClick,
    onRowClick,
    onMetaClick,
    onRemoveRecord,
    onActionButtonClick,
    actionButtonLabel,
    hideEndDateTime,
    hideStartDateTime,
  
    showActionButton,
  
    rowsPerPage,
    dateFormat,
    showMinutes,
    tableRowSize,
    formFactorLayout,

    page,
    onSetPage,
    
    count,

    ...otherProps 
  } = props;

  let rows = [];




  let paginationCount = 101;
  if(props.count){
    paginationCount = props.count;
  } else {
    paginationCount = rows.length;
  }

  //---------------------------------------------------------------------
  // Render Methods


  function rowClick(id){
    // console.log('EncountersTable.rowClick', id);

    if(props && (typeof props.onRowClick === "function")){
      props.onRowClick(id);
    }
  }
  function renderActionIconsHeader(){
    if (!props.hideActionIcons) {
      return (
        <TableCell className='actionIcons' style={{width: '100px'}}>Actions</TableCell>
      );
    }
  }
  function renderActionIcons(encounter ){
    if (!props.hideActionIcons) {
      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{minWidth: '120px'}}>
          {/* <Icon icon={tag} style={iconStyle} onClick={ onMetaClick.bind(encounter)}  />
          <Icon icon={iosTrashOutline} style={iconStyle} onClick={ removeRecord.bind(encounter._id)} /> */}
        </TableCell>
      );
    }
  } 


  function removeRecord(_id){
    console.log('Remove encounter ', _id)
    if(props.onRemoveRecord){
      props.onRemoveRecord(_id);
    }
  }
  function handleActionButtonClick(id){
    if(typeof props.onActionButtonClick === "function"){
      props.onActionButtonClick(id);
    }
  }
  function cellClick(id){
    if(typeof props.onCellClick === "function"){
      props.onCellClick(id);
    }
  }

  function handleMetaClick(patient){
    let self = this;
    if(props.onMetaClick){
      props.onMetaClick(self, patient);
    }
  }
  function renderBarcode(id){
    if (!props.hideBarcode) {
      return (
        <TableCell><span className="barcode helvetica">{id}</span></TableCell>
      );
    }
  }
  function renderBarcodeHeader(){
    if (!props.hideBarcode) {
      return (
        <TableCell>System ID</TableCell>
      );
    }
  }
  function renderSubject(name, type){
    if (!props.hideSubjects) {
      let result;
      if(props.multiline){
        result = <TableCell className='name'>
          <span style={{color: 'grey', fontSize: '80%'}}>{ name }</span><br/>
          <span style={{fontSize: '120%'}}>{ type }</span>
        </TableCell>;
      } else {
        result = <TableCell className='name'>{ name }</TableCell>;
      }
      return (result);
    }
  }
  function renderSubjectHeader(){
    if (!props.hideSubjects) {
      return (
        <TableCell className='name'>Subject</TableCell>
      );
    }
  }
  function renderStatus(valueString){
    if (!props.hideStatus) {
      return (
        <TableCell className='value'>{ valueString }</TableCell>
      );
    }
  }
  function renderStatusHeader(){
    if (!props.hideStatus) {
      return (
        <TableCell className='value'>Status</TableCell>
      );
    }
  }

  function renderHistory(valueString){
    if (!props.hideHistory) {
      return (
        <TableCell className='history'>{ valueString }</TableCell>
      );
    }
  }
  function renderHistoryHeader(){
    if (!props.hideHistory) {
      return (
        <TableCell className='history'>History</TableCell>
      );
    }
  }

  function renderTypeCodeHeader(){
    if (!props.hideTypeCode) {
      return (
        <TableCell className='typecode'>TypeCode</TableCell>
      );
    }
  }
  function renderTypeCode(code){
    if (!props.hideTypeCode) {
      return (
        <TableCell className='typecode'>{ code }</TableCell>
      );  
    }
  }
  function renderTypeHeader(){
    if (!props.hideType) {
      return (
        <TableCell className='typeDisplay'>Type</TableCell>
      );
    }
  }
  function renderType(type){
    if (!props.hideType) {
      return (
        <TableCell className='typeDisplay'>{ type }</TableCell>
      );  
    }
  }
  function renderClassCodeHeader(){
    if (!props.hideClassCode) {
      return (
        <TableCell className='classcode'>Class</TableCell>
      );
    }
  }
  function renderClassCode(code){
    if (!props.hideClassCode) {
      return (
        <TableCell className='classcode'>{ code }</TableCell>
      );  
    }
  }
  function renderReasonCodeHeader(){
    if (!props.hideReasonCode) {
      return (
        <TableCell className='reasoncode'>ReasonCode</TableCell>
      );
    }
  }
  function renderReasonCode(code){
    if (!props.hideReasonCode) {
      return (
        <TableCell className='reasoncode'>{ code }</TableCell>
      );  
    }
  }
  function renderReasonHeader(){
    if (!props.hideReason) {
      return (
        <TableCell className='reason'>Reason</TableCell>
      );
    }
  }
  function renderReason(code){
    if (!props.hideReason) {
      return (
        <TableCell className='reason'>{ code }</TableCell>
      );  
    }
  }
  function renderCategoryHeader(){
    if (!props.hideCategory) {
      return (
        <TableCell className='category'>Category</TableCell>
      );
    }
  }
  function renderCategory(category){
    if (!props.hideCategory) {
      return (
        <TableCell className='category'>{ category }</TableCell>
      );
    }
  }
  function renderToggleHeader(){
    if (!props.hideCheckboxes) {
      return (
        <TableCell className="toggle" style={{width: '60px'}} >Toggle</TableCell>
      );
    }
  }
  function renderToggle(){
    if (!props.hideCheckboxes) {
      return (
        <TableCell className="toggle" style={{width: '60px'}}>
            {/* <Checkbox
              defaultChecked={true}
            /> */}
        </TableCell>
      );
    }
  }
  function renderStartDateHeader(){
    if (!props.hideStartDateTime) {
      return (
        <TableCell className='start' style={{minWidth: '140px'}}>Start</TableCell>
      );
    }
  }
  function renderStartDate(periodStart){
    if (!props.hideStartDateTime) {
      return (
        <TableCell className='periodStart' style={{minWidth: '140px'}}>{ periodStart }</TableCell>
      );
    }
  }
  function renderEndDateHeader(){
    if (!props.hideEndDateTime) {
      return (
        <TableCell className='end' style={{minWidth: '140px'}}>End</TableCell>
      );
    }
  }
  function renderEndDate(periodEnd){
    if (!props.hideEndDateTime) {
      return (
        <TableCell className='periodEnd' style={{minWidth: '140px'}}>{ periodEnd }</TableCell>
      );
    }
  }
  function renderDurationHeader(){
    if (props.calculateDuration) {
      return (
        <TableCell className='duration'>Duration</TableCell>
      );
    }
  }
  function renderDuration(duration){
    if (props.calculateDuration) {
      return (
        <TableCell className='duration'>{ duration }</TableCell>
      );  
    }
  }
  function handleActionButtonClick(id){
    console.log('onActionButtonClick', id, props);

    if(typeof props.onActionButtonClick === "function"){
      props.onActionButtonClick(id);
    }
  }
  function renderActionButtonHeader(){
    if (props.showActionButton === true) {
      return (
        <TableCell className='ActionButton' >Action</TableCell>
      );
    }
  }
  function renderActionButton(patient){
    if (props.showActionButton === true) {
      return (
        <TableCell className='ActionButton' >
          <Button onClick={ handleActionButtonClick.bind(this, patient[i]._id)}>{ get(props, "actionButtonLabel", "") }</Button>
        </TableCell>
      );
    }
  }


  //---------------------------------------------------------------------
  // Table Rows

  let tableRows = [];
  let encountersToRender = [];
  let proceduresToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(props.showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(props.internalDateFormat){
    internalDateFormat = props.dateFormat;
  }

  if(props.encounters){
    if(props.encounters.length > 0){     
      let count = 0;    
      props.encounters.forEach(function(encounter){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          encountersToRender.push(FhirDehydrator.dehydrateEncounter(encounter, internalDateFormat));
        }
        count++;
      });  
    }
  }

  let rowStyle = {
    cursor: 'pointer',
    height: '52px'
  }

  if(encountersToRender.length === 0){
    logger.trace('EncountersTable:  No encounters to render.');
  } else {
    for (var i = 0; i < encountersToRender.length; i++) {

      let selected = false;
      if(encountersToRender[i].id === selectedEncounterId){
        selected = true;
      }
      if(get(encountersToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }
      logger.trace('encountersToRender[i]', encountersToRender[i])

      if(props.multiline){
        tableRows.push(
          <TableRow className="encounterRow" key={i} onClick={ rowClick.bind(this, encountersToRender[i]._id)} style={{cursor: 'pointer'}} style={rowStyle} hover={true} selected={selected} >
            { renderToggle() }
            { renderActionIcons(encountersToRender[i]) }
            { renderSubject(encountersToRender[i].subject, encountersToRender[i].typeDisplay)}
            { renderClassCode(encountersToRender[i].classCode) }
            { renderTypeCode(encountersToRender[i].typeCode) }
            { renderType(encountersToRender[i].typeDisplay)}
            { renderReasonCode(encountersToRender[i].reasonCode)}
            { renderReason(encountersToRender[i].reasonDisplay)}
            { renderStatus(encountersToRender[i].status)}
            { renderHistory(encountersToRender[i].statusHistory)}
            { renderStartDate(encountersToRender[i].periodStart)}
            { renderEndDate(encountersToRender[i].periodEnd)}
            { renderDuration(encountersToRender[i].duration)}
            { renderBarcode(encountersToRender[i].id)}
            { renderActionButton(encountersToRender[i]) }
          </TableRow>
        );    
      } else {
        tableRows.push(
          <TableRow className="encounterRow" key={i} onClick={ rowClick.bind(this, encountersToRender[i]._id)} style={{cursor: 'pointer'}} style={rowStyle} hover={true} selected={selected} >            
            { renderToggle() }
            { renderActionIcons(encountersToRender[i]) }
            { renderSubject(encountersToRender[i].subject)}
            { renderClassCode(encountersToRender[i].classCode) }
            { renderTypeCode(encountersToRender[i].typeCode) }
            { renderType(encountersToRender[i].typeDisplay)}
            { renderReasonCode(encountersToRender[i].reasonCode)}
            { renderReason(encountersToRender[i].reasonDisplay)}
            { renderStatus(encountersToRender[i].status)}
            { renderHistory(encountersToRender[i].statusHistory)}
            { renderStartDate(encountersToRender[i].periodStart)}
            { renderEndDate(encountersToRender[i].periodEnd)}
            { renderDuration(encountersToRender[i].duration)}
            { renderBarcode(encountersToRender[i].id)}
            { renderActionButton(encountersToRender[i]) }
          </TableRow>
        );    
      }
    }
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

  return(
    <div id={id} className="tableWithPagination">
      <Table size={tableRowSize} aria-label="a dense table" { ...otherProps } >
        <TableHead>
          <TableRow>
            { renderToggleHeader() }
            { renderActionIconsHeader() }
            { renderSubjectHeader() }
            { renderClassCodeHeader() }
            { renderTypeCodeHeader() }
            { renderTypeHeader() } 
            { renderReasonCodeHeader() }
            { renderReasonHeader() }
            { renderStatusHeader() }
            { renderHistoryHeader() }
            { renderStartDateHeader() }
            { renderEndDateHeader() }
            { renderDurationHeader() }
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

EncountersTable.propTypes = {
  id: PropTypes.string,

  barcodes: PropTypes.bool,
  encounters: PropTypes.array,
  selectedEncounterId: PropTypes.string,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,

  hideCategory: PropTypes.bool,
  hideClassCode: PropTypes.bool,
  hideType: PropTypes.bool,
  hideTypeCode: PropTypes.bool,
  hideReason: PropTypes.bool,
  hideReasonCode: PropTypes.bool,
  hideSubjects: PropTypes.bool,
  hideCheckboxes: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hideHistory: PropTypes.bool,
  hideBarcode: PropTypes.bool,
  calculateDuration: PropTypes.bool,
  enteredInError: PropTypes.bool,
  multiline: PropTypes.bool,
  onCellClick: PropTypes.func,
  onRowClick: PropTypes.func,
  onMetaClick: PropTypes.func,
  onRemoveRecord: PropTypes.func,
  onActionButtonClick: PropTypes.func,
  onSetPage: PropTypes.func,

  page: PropTypes.number,
  actionButtonLabel: PropTypes.string,
  hideEndDateTime: PropTypes.bool,
  hideStartDateTime: PropTypes.bool,
  showActionButton: PropTypes.bool,

  rowsPerPage: PropTypes.number,
  dateFormat: PropTypes.string,
  showMinutes: PropTypes.bool,
  count: PropTypes.number,

  formFactorLayout: PropTypes.string
};

// EncountersTable.defaultProps = {
//   hideBarcode: true,
//   hideSubjects: false,
//   encounters: [],
//   rowsPerPage: 5,
//   count: 0
// }


export default EncountersTable; 
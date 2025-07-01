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

import { Session } from 'meteor/session';

import moment from 'moment'
import _ from 'lodash';
let get = _.get;
let set = _.set;


import { FhirDehydrator } from '../lib/FhirDehydrator';


//===========================================================================
// THEMING



//===========================================================================
// MAIN COMPONENT


//===========================================================================
// MAIN COMPONENT

export function BundlesTable(props){
  logger.info('Rendering the BundlesTable');

  let { 
    children, 
    id,
    
    data,
    bundles,
    selectedBundleId,
    query,
    paginationLimit,
    disablePagination,
    count,
  
    hideCheckboxes,
    hideIdentifier,
    hideActionIcons,
    hideType,
    hideNumLinks,
    hideNumEntries,
    hideTimestamp,
    hideTotal,
    hideBarcode,    

    onCellClick,
    onRowClick,
    onMetaClick,
    onRemoveRecord,
    onActionButtonClick,
    showActionButton,
    actionButtonLabel,
  
    rowsPerPage,
    tableRowSize,
    dateFormat,
    showMinutes,
    displayEnteredInError,
    formFactorLayout,

    page,
    onSetPage,

    ...otherProps 
  } = props;


  // ------------------------------------------------------------------------
  // Form Factors

  if(formFactorLayout){
    logger.verbose('formFactorLayout', formFactorLayout);

    switch (formFactorLayout) {
      case "phone":
        hideCheckboxes = true;
        hideIdentifier = true;
        hideActionIcons = true;
        hideType = false;
        hideNumLinks = true;
        hideNumEntries = true;
        hideTimestamp = false;
        hideTotal = false;
        hideBarcode = true;      
        break;
      case "tablet":
        hideCheckboxes = true;
        hideIdentifier = true;
        hideActionIcons = true;
        hideType = false;
        hideNumLinks = false;
        hideNumEntries = false;
        hideTimestamp = false;
        hideTotal = false;
        hideBarcode = true;  
        break;
      case "web":
        hideCheckboxes = true;
        hideIdentifier = true;
        hideActionIcons = true;
        hideType = false;
        hideNumLinks = false;
        hideNumEntries = false;
        hideTimestamp = false;
        hideTotal = false;
        hideBarcode = false;  
        break;
      case "desktop":
        hideCheckboxes = true;
        hideIdentifier = true;
        hideActionIcons = true;
        hideType = false;
        hideNumLinks = false;
        hideNumEntries = false;
        hideTimestamp = false;
        hideTotal = false;
        hideBarcode = false;  
        break;
      case "videowall":
        hideCheckboxes = true;
        hideIdentifier = true;
        hideActionIcons = true;
        hideType = false;
        hideNumLinks = false;
        hideNumEntries = false;
        hideTimestamp = false;
        hideTotal = false;
        hideBarcode = false;        
        break;            
    }
  }


  // ------------------------------------------------------------------------
  // Helper Functions


  function handleRowClick(_id){
    // console.log('Clicking row ' + _id)
    if(props.onRowClick){
      props.onRowClick(_id);
    }
  }

  function removeRecord(_id){
    logger.info('Remove measureReport: ' + _id)
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


  // ------------------------------------------------------------------------
  // Column Rendering

  function renderToggleHeader(){
    if (!hideCheckboxes) {
      return (
        <TableCell className="toggle" style={{width: '60px'}} >Toggle</TableCell>
      );
    }
  }
  function renderToggle(){
    if (!hideCheckboxes) {
      return (
        <TableCell className="toggle" style={{width: '60px'}}>
            {/* <Checkbox
              defaultChecked={true}
            /> */}
        </TableCell>
      );
    }
  }
  function renderActionIconsHeader(){
    if (!hideActionIcons) {
      return (
        <TableCell className='actionIcons' style={{width: '100px'}}>Actions</TableCell>
      );
    }
  }
  function renderActionIcons(measureReport ){
    if (!hideActionIcons) {
      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{minWidth: '120px'}}>
          {/* <FaTags style={iconStyle} onClick={ onMetaClick.bind(measureReport)} />
          <GoTrashcan style={iconStyle} onClick={ removeRecord.bind(measureReport._id)} />   */}
        </TableCell>
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
  function renderIdentifierHeader(){
    if (!hideIdentifier) {
      return (
        <TableCell className='identifier'>Identifier</TableCell>
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
  function renderTypeHeader(){
    if (!hideType) {
      return (
        <TableCell className='type'>Type</TableCell>
      );
    }
  }
  function renderNumLinks(numLinks){
    if (!hideNumLinks) {
      return (
        <TableCell className='numLinks'>{ numLinks }</TableCell>
      );
    }
  }
  function renderNumLinksHeader(){
    if (!hideNumLinks) {
      return (
        <TableCell className='numLinks'># Links</TableCell>
      );
    }
  }
  function renderNumEntries(numEntries){
    if (!hideNumEntries) {
      return (
        <TableCell className='numEntries'>{ numEntries }</TableCell>
      );
    }
  }
  function renderNumEntriesHeader(){
    if (!hideNumEntries) {
      return (
        <TableCell className='numEntries'># Entries</TableCell>
      );
    }
  }
  function renderTimestamp(timestamp){
    if (!hideTimestamp) {
      return (
        <TableCell className='timestamp'>{ moment(timestamp).format('YYYY-MM-DD') }</TableCell>
      );
    }
  }
  function renderTimestampHeader(){
    if (!hideTimestamp) {
      return (
        <TableCell className='timestamp'>Timestamp</TableCell>
      );
    }
  }
  function renderTotal(total){
    if (!hideTotal) {
      return (
        <TableCell className='total'>{ total }</TableCell>
      );
    }
  }
  function renderTotalHeader(){
    if (!hideTotal) {
      return (
        <TableCell className='total'>Total</TableCell>
      );
    }
  }

  function renderBarcode(id){
    if (!hideBarcode) {
      return (
        <TableCell><span className="barcode">{id}</span></TableCell>
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



  //---------------------------------------------------------------------
  // Pagination

  let rows = [];
  // const [page, setPage] = useState(0);
  // const [rowsPerPage, setRowsPerPage] = useState(rowsPerPage);


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
  let footer;

  let bundlesToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(internalDateFormat){
    internalDateFormat = dateFormat;
  }

  if(Array.isArray(bundles)){
    bundles.forEach(function(bundle){
      bundlesToRender.push(FhirDehydrator.dehydrateBundle(bundle, internalDateFormat));
    });    
  }

  if(bundlesToRender.length === 0){
    logger.trace('EncountersTable:  No encounters to render.');
    // footer = <TableNoData noDataPadding={ noDataMessagePadding } />
  } else {

    for (var i = 0; i < bundlesToRender.length; i++) {

      let selected = false;
      if(bundlesToRender[i]._id === selectedBundleId){
        selected = true;          
      }
      if(get(bundlesToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }

      tableRows.push(
        <TableRow key={i} selected={selected} className="bundleRow" style={{cursor: "pointer"}} onClick={handleRowClick.bind(this, bundlesToRender[i]._id )} hover={true}>
          { renderToggle() }
          { renderActionIcons(bundlesToRender[i]) }
          { renderIdentifier(bundlesToRender[i].identifier)}

          { renderType(bundlesToRender[i].type)}
          { renderNumLinks(bundlesToRender[i].links)}
          { renderNumEntries(bundlesToRender[i].entries)}
          { renderTimestamp(bundlesToRender[i].timestamp)}
          { renderTotal(bundlesToRender[i].total)}            

          { renderBarcode(bundlesToRender[i]._id)}
        </TableRow>
      );
    }
  }

  return(
    <div id={id} className="tableWithPagination">
      <Table size={tableRowSize} aria-label="a dense table">
        <TableHead>
          <TableRow>
            { renderToggleHeader() }
            { renderActionIconsHeader() }
            { renderIdentifierHeader() }
          
            { renderTypeHeader() }
            { renderNumLinksHeader() }
            { renderNumEntriesHeader() }
            { renderTimestampHeader() }
            { renderTotalHeader() }

            { renderBarcodeHeader() }
          </TableRow>
        </TableHead>
        <TableBody>
          { tableRows }
        </TableBody>
      </Table>
      { paginationFooter }
    </div>
  )
}



// //===========================================================================
// // REACT CLASS

// export class BundlesTable extends React.Component {
//   constructor(props) {
//     super(props);
//   }
//   getMeteorData() {
//     let data = {
//       style: {
//         hideOnPhone: {
//           visibility: 'visible',
//           display: 'table'
//         },
//         cellHideOnPhone: {
//           visibility: 'visible',
//           display: 'table',
//           paddingTop: '16px',
//           maxWidth: '120px'
//         },
//         cell: {
//           paddingTop: '16px'
//         },
//         avatar: {
//           // color: rgb(255, 255, 255);
//           backgroundColor: 'rgb(188, 188, 188)',
//           userSelect: 'none',
//           borderRadius: '2px',
//           height: '40px',
//           width: '40px'
//         }
//       },
//       selected: [],
//       bundles: []
//     };

//     let query = {};
//     let options = {};

//     // number of items in the table should be set globally
//     if (get(Meteor, 'settings.public.defaults.paginationLimit')) {
//       options.limit = get(Meteor, 'settings.public.defaults.paginationLimit');
//     }
//     // but can be over-ridden by props being more explicit
//     if(limit){
//       options.limit = limit;      
//     }

//     if(data){
//       data.bundles = data; 
//     } else if(bundles){
//       data.bundles = bundles;
//     } 

//     logger.trace("BundlesTable[data]", data);
//     return data;
//   }



//   onSend(id){
//     let bundle = Bundles.findOne({_id: id});

//     logger.debug("BundlesTable.onSend()", bundle);

//     var httpEndpoint = "http://localhost:8080";
//     if (get(Meteor, 'settings.public.interfaces.default.channel.endpoint')) {
//       httpEndpoint = get(Meteor, 'settings.public.interfaces.default.channel.endpoint');
//     }
//       data: bundle
//     }, function(error, result){
//       if (error) {
//         logger.error("error", error);
//       }
//       if (result) {
//         logger.trace("result", result);
//       }
//     });
//   }
//   selectBundleRow(bundleId){
//     if(typeof onRowClick === "function"){
//       onRowClick(bundleId);
//     }
//   }
//   render () {

//     let headerHeight = LayoutHelpers.calcHeaderHeight();
    
//     let tableRows = [];
//     let footer;

//     let bundlesToRender = [];
//     let internalDateFormat = "YYYY-MM-DD";

//     if(showMinutes){
//       internalDateFormat = "YYYY-MM-DD hh:mm";
//     }
//     if(internalDateFormat){
//       internalDateFormat = props.dateFormat;
//     }

//     if(Array.isArray(bundles)){
//       bundles.forEach(function(bundle){
//         bundlesToRender.push(dehydrateBundle(bundle, internalDateFormat));
//       });    
//     }

//     if(bundlesToRender.length === 0){
//       logger.trace('EncountersTable:  No encounters to render.');
//       // footer = <TableNoData noDataPadding={ noDataMessagePadding } />
//     } else {

//       for (var i = 0; i < bundlesToRender.length; i++) {

//         let selected = false;
//         if(bundlesToRender[i]._id === selectedBundleId){
//           selected = true;          
//         }
//         if(get(bundlesToRender[i], 'modifierExtension[0]')){
//           rowStyle.color = "orange";
//         }
//         if(tableRowSize === "small"){
//           rowStyle.height = '32px';
//         }

//         tableRows.push(
//           <TableRow key={i} selected={selected} className="bundleRow" style={{cursor: "pointer"}} onClick={this.selectBundleRow.bind(this, bundlesToRender[i]._id )} hover={true}>
//             { renderToggle() }
//             { renderActionIcons(auditEventsToRender[i]) }
//             { renderIdentifier(auditEventsToRender[i].identifier)}

//             { renderType(auditEventsToRender[i].type)}
//             { renderNumLinks(auditEventsToRender[i].links)}
//             { renderNumEntries(auditEventsToRender[i].entries)}
//             { renderTimestamp(auditEventsToRender[i].timestamp)}
//             { renderTotal(auditEventsToRender[i].total)}            

//             { renderBarcode(auditEventsToRender[i]._id)}
//           </TableRow>
//         );
//       }
//     }
    
//     return(
//       <div>
//         <Table id='bundlesTable'>
//           <TableHead>
//             <TableRow>
//               { renderToggleHeader() }
//               { renderActionIconsHeader() }
//               { renderIdentifierHeader() }

//               { renderTypeHeader() }
//               { renderNumLinksHeader() }
//               { renderNumEntriesHeader() }
//               { renderTimestampHeader() }
//               { renderTotalHeader() }

//               { renderBarcodeHeader() }
//             </TableRow>
//           </TableHead>
//           <TableBody>
//             { tableRows }
//           </TableBody>
//         </Table>        
//       </div>
//     );
//   }
// }










BundlesTable.propTypes = {
  id: PropTypes.string,

  count: PropTypes.number,
  data: PropTypes.array,

  bundles: PropTypes.array,
  selectedBundleId: PropTypes.string,

  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,

  hideCheckboxes: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideType: PropTypes.bool,
  hideNumLinks: PropTypes.bool,
  hideNumEntries: PropTypes.bool,
  hideTimestamp: PropTypes.bool,
  hideTotal: PropTypes.bool,
  hideBarcode: PropTypes.bool,


  onCellClick: PropTypes.func,
  onRowClick: PropTypes.func,
  onMetaClick: PropTypes.func,
  onRemoveRecord: PropTypes.func,
  onActionButtonClick: PropTypes.func,
  onSetPage: PropTypes.func,

  page: PropTypes.number,
  showActionButton: PropTypes.bool,
  actionButtonLabel: PropTypes.string,


  noDataMessagePadding: PropTypes.number,
  rowsPerPage: PropTypes.number,
  tableRowSize: PropTypes.string,
  dateFormat: PropTypes.string,
  showMinutes: PropTypes.bool,

  formFactorLayout: PropTypes.string
};

BundlesTable.defaultProps = {
  tableRowSize: 'medium',
  rowsPerPage: 5,
  dateFormat: "YYYY-MM-DD hh:mm:ss",
  hideCheckboxes: false,
  hideIdentifier: false,
  hideActionIcons: false,
  hideType: false,
  hideNumLinks: false,
  hideNumEntries: false,
  hideTimestamp: false,
  hideTotal: false,
  hideBarcode: false,
  bundles: [],
  count: 0
}

export default BundlesTable;
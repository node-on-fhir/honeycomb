

import { Meteor } from 'meteor/meteor';
import React, { useState, useEffect, useCallback } from 'react';
// import Promise from 'promise';

import { 
  Button, 
  CardContent, 
  CardHeader, 
  CardActions,
  Grid, 
  Tab, 
  Tabs, 
  Typography,
  FormControl,
  Input,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress
} from '@mui/material';
import PropTypes from 'prop-types';

import { get, set, has, uniq, cloneDeep } from 'lodash';

import "ace-builds";
import ace from 'ace-builds/src-noconflict/ace';
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/snippets/html"

import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/theme-monokai";

// import 'ace-builds/webpack-resolver'

// //====================================================================================
// // Async Hook


//   const useAsync = (asyncFunction, readyToImport) => {
//     const [showProgressBar, setProgressBarVisible] = useState(false);
//     const [progressValue, setProgressBarValue] = useState(0);
//     const [error, setError] = useState(null);

//     // The parseImportQueue function wraps asyncFunction and
//     // handles setting state for showProgressBar, value, and error.
//     // useCallback ensures the below useEffect is not called
//     // on every render, but only if asyncFunction changes.
//     const parseImportQueue = useCallback(() => {
//       logger.debug('Parsing import queue asynchronously.')

//       setProgressBarVisible(true);
//       setProgressBarValue(0);
//       setError(null);
      
//       return asyncFunction()
//         .then(response => setProgressBarValue(++progressValue))
//         .catch(error => setError(error))
//         .finally(() => setProgressBarVisible(false));
//     }, [asyncFunction]);

//     // Call parseImportQueue if we want to fire it right away.
//     // Otherwise parseImportQueue can be called later, such as
//     // in an onClick handler.
//     useEffect(() => {
//       logger.verbose('DataEditor.useEffect()')
//       if (readyToImport) {
//         logger.verbose('DataEditor.useEffect().readyToImport')
//         parseImportQueue();
//       }
//     }, [parseImportQueue, readyToImport]);

//     return { parseImportQueue, showProgressBar, progressValue, error };
//   };


//====================================================================================
// Shared Components

let useTheme;
Meteor.startup(function(){
  useTheme = Meteor.useTheme;
})



//====================================================================================
// Main Application  


function DataEditor(props){
  // logger.debug('Rendering the DataEditor');
  // logger.verbose('symptomatic:data-management.client.DataEditor');
  // logger.data('DataEditor.props', {data: props}, {source: "DataEditor.jsx"});

  console.debug('Rendering the DataEditor');
  console.debug('symptomatic:data-management.client.DataEditor');
  // console.data('DataEditor.props', {data: props}, {source: "DataEditor.jsx"});


  const { theme, toggleTheme } = useTheme();

  //---------------------------------------------------------------------
  // Component State
  
  const [editorContent, setEditorContent] = useState("");
  const [editorWrap, setEditorWrap] = useState(false);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(0);
  const [detectedFileExtension, setDetectedFileExtension] = useState("json");


  //---------------------------------------------------------------------
  // Props  

  let { 
    children, 
    initialValue = 0, 
    progressValue = 0,
    progressMax = 0, 
    mappingAlgorithm = 0,
    readyToImport = false,
    previewMode = false,
    importBuffer = "", 
    fileExtension = "json",
    onImportFile,
    editorWrapEnabled = false,
    ...otherProps } = props;

    // console.log('DataEditor.props', props)


    useEffect(function(){
      if(['xml', 'xmlx', 'xlsx', 'json', 'ccd', 'bundle', 'txt', 'application/json', 'application/csv', 'application/json+fhir'].includes(fileExtension)){
        // importBufferContents = JSON.stringify(importBuffer, null, 2);
        importBufferContents = importBuffer;
        setSelectedAlgorithm(1);
      } else if(['phr', 'sphr', 'applicaion/x-phr', 'ndjson', 'application/x-ndjson'].includes(fileExtension)){
        // console.log('importBuffer application/x-ndjson', importBuffer);
        console.log('importBuffer typeof', typeof importBuffer);
        console.log('importBuffer', importBuffer);
    
        let parsedBuffer = JSON.parse(importBuffer);
    
        console.log('parsed importBuffer type: ' +  typeof parsedBuffer);
    
        let ndjsonPreview = "";
        if(Array.isArray(parsedBuffer)){
          console.log('importBuffer is an array');
          parsedBuffer.forEach(function(line){
            ndjsonPreview = ndjsonPreview + JSON.stringify(line) + "\n";
          })
        }
    
        console.log('ndjsonPreview', ndjsonPreview)
        importBufferContents = ndjsonPreview;
        setSelectedAlgorithm(3);
      } else {
        setSelectedAlgorithm(1);
        importBufferContents = importBuffer;
      }
      setEditorContent(importBufferContents);
      setDetectedFileExtension(fileExtension)

    }, [props])


  console.debug("DataEditor.importBufferContents", importBufferContents);

  
// 

  // const { parseImportQueue, isImporting, progressValue, error } = useAsync(autoImport, readyToImport);

  // console.log("DataEditor.isImporting", isImporting);

  // //---------------------------------------------------------------------

  // async function autoImport(callback){
  //   logger.debug("Auto importing items from import queue.")
  //   // setProgressCount(0);    

  //   if(Array.isArray(importQueue)){
      
  //     importQueue.forEach(async function(queueItem){
  //       logger.verbose('ImportComponent.autoImport().Promise().queueItem', queueItem);
        
  //       // setProgressCount(++progressValue)
          
  //       if(typeof onImportFile === "function"){
  //         await onImportFile(queueItem);
  //       }
  //     });      
      
  //     // Session.set('lastUpdated', new Date())

  //     if(typeof callback === "function"){
  //       callback()
  //     }
  //   }
  // }


  //---------------------------------------------------------------------
  // Methods and Functions  
  
  
  function handleMapData(){
    if(typeof props.onMapData === "function"){
      props.onMapData();
    }
  }
  function digestData(){
    if(typeof props.onDigestData === "function"){
      props.onDigestData(editorContent, detectedFileExtension, selectedAlgorithm);
    }
  }
  function handleScanData(){
    if(typeof props.onScanData === "function"){
      props.onScanData();
    }
  }
  function handleChangeMappingAlgorithm(event){
    console.log('handleChangeMappingAlgorithm', event)
    console.log('handleChangeMappingAlgorithm.target.value', event.target.value)
    setSelectedAlgorithm(event.target.value)

    if(typeof props.onChangeMappingAlgorithm === "function"){
      props.onChangeMappingAlgorithm(event);
    }
  }
  function handleChangeEditor(event){
    if(typeof props.onEditorChange === "function"){
      props.onEditorChange(event);
    }
  }

  function clearPreviewBuffer(){
    // Session.set("importBuffer", "")
    setEditorContent("");
  }
  function noMapCopyToPreviewBuffer(){
    Session.set('previewBuffer', Session.get('importBuffer'));
  }
  function onChange(newValue){
    console.log('onChange', newValue)
    setEditorContent(newValue)
  }


  //---------------------------------------------------------------------
  // Render Methods  

  logger.trace('DataEditor.progress', progressValue, progressMax)

  let previewButton;
  let digestButton;
  if(previewMode){
    digestButton = <Button 
      id='mapData'
      onClick={ handleMapData.bind(this)}
      // color="primary"
      variant="contained"
      fullWidth                
    >Map</Button>   
    previewButton = <Button id="skipBtn" fullWidth variant="contained" onClick={noMapCopyToPreviewBuffer.bind(this)} >Preview</Button>
  } else {
    digestButton = <Button 
      id='mapData'
      onClick={ digestData.bind(this)}
      // color="primary"
      variant="contained"
      fullWidth                
    >Digest</Button>   
  }
  let percentageComplete = 0;
  let previewComponents;
  

  if(readyToImport){
    // if(progressMax > 0){
    //   percentageComplete = Number(((progressValue / progressMax) * 100).toFixed(0));
    // } 
    previewComponents = <CardContent disabled>
      <CardContent style={{fontSize: '100%', paddingBottom: '28px', paddingTop: '50px', textAlign: 'center'}}>
        <CardHeader 
          title="Preview Unavailable During Import"       
          subheader={"Please wait."}
          style={{fontSize: '100%', whiteSpace: 'nowrap', marginBottom: '40px'}} />
          {/* <LinearProgress variant="determinate" value={percentageComplete} /> */}
          <LinearProgress />
            
      </CardContent>
    </CardContent>
  } else {
    previewComponents = <CardContent>      
      <AceEditor
        mode="json"
        theme={theme === 'light' ? "tomorrow" : "monokai"}
        wrapEnabled={editorWrapEnabled}
        onChange={onChange}
        name="rawDataEditor"
        editorProps={{ $blockScrolling: true }}
        style={{width: '100%', marginBottom: '20px', height: window.innerHeight - 470}}
        value={editorContent}
        defaultValue={JSON.stringify(editorContent, null, 2)}
      />


      <FormControl style={{width: '100%', paddingBottom: '20px', marginTop: '10px'}}>
        <InputLabel id="import-algorithm-label">Mapping Algorithm</InputLabel>
        <Select
          id="import-algorithm-selector"
          value={ selectedAlgorithm}
          onChange={handleChangeMappingAlgorithm.bind(this)}
          fullWidth
          >
          <MenuItem value={1} id="import-algorithm-menu-item-1" key="import-algorithm-menu-item-1" >FHIR Resource</MenuItem>
          <MenuItem value={2} id="import-algorithm-menu-item-2" key="import-algorithm-menu-item-2" >FHIR Bundle</MenuItem>
          <MenuItem value={3} id="import-algorithm-menu-item-3" key="import-algorithm-menu-item-3" >FHIR Bulk Data</MenuItem>
          <MenuItem value={4} id="import-algorithm-menu-item-4" key="import-algorithm-menu-item-4" >FHIR Personal Health Record</MenuItem>
          <MenuItem value={5} id="import-algorithm-menu-item-5" key="import-algorithm-menu-item-5" >Facebook Profile</MenuItem>
          <MenuItem value={6} id="import-algorithm-menu-item-6" key="import-algorithm-menu-item-6" >City of Chicago Data File</MenuItem>
          <MenuItem value={7} id="import-algorithm-menu-item-7" key="import-algorithm-menu-item-7" >Geojson</MenuItem>
          <MenuItem value={8} id="import-algorithm-menu-item-8" key="import-algorithm-menu-item-8" >CDC Reporting Spreadsheet</MenuItem>
          <MenuItem value={9} id="import-algorithm-menu-item-9" key="import-algorithm-menu-item-9" >FEMA Reporting Spreadsheet</MenuItem>
          <MenuItem value={10} id="import-algorithm-menu-item-10" key="import-algorithm-menu-item-10" >Inpatient Prospective Payment System File</MenuItem>
          <MenuItem value={11} id="import-algorithm-menu-item-11" key="import-algorithm-menu-item-11" >SANER Hospital File</MenuItem>
          <MenuItem value={12} id="import-algorithm-menu-item-12" key="import-algorithm-menu-item-12" >LOINC Questionnaire</MenuItem>
          <MenuItem value={13} id="import-algorithm-menu-item-13" key="import-algorithm-menu-item-13" >FHIR Bundle (Collection)</MenuItem>
        </Select>
      </FormControl>


      {/* <pre 
        id="dropzonePreview"
        style={{
          width: '100%', 
          position: 'relative', 
          minHeight: '200px', 
          height: window.innerHeight - 480, 
          backgroundColor: '#f5f5f5', 
          borderColor: '#ccc', 
          borderRadius: '4px', 
          lineHeight: '16px', 
          overflow: 'scroll'
        }} 
      >
        { importBufferContents }
      </pre> */}

      <Grid container>
        <Grid item md={4} style={{paddingRight: '10px'}}>
          { digestButton }
        </Grid>
        <Grid item md={4} style={{paddingLeft: '10px'}}>
          <Button id="clearImportQueueBtn" fullWidth variant="contained" onClick={clearPreviewBuffer.bind(this)} >Clear</Button>             
        </Grid>
        <Grid item md={4} style={{paddingLeft: '10px'}}>
          { previewButton }
        </Grid>
      </Grid>
    </CardContent>
  }

  return previewComponents;
}


DataEditor.propTypes = {
  progressMax: PropTypes.number,
  initialValue: PropTypes.number,
  importBuffer: PropTypes.string,
  fileExtension: PropTypes.string,
  mappingAlgorithm: PropTypes.number,
  readyToImport: PropTypes.bool,
  previewMode: PropTypes.bool,
  progressValue: PropTypes.number,

  onScanData: PropTypes.func,
  onDigestData: PropTypes.func,
  onEditorChange: PropTypes.func,
  onChangeMappingAlgorithm: PropTypes.func,
  onImportFile: PropTypes.func,
  onMapData: PropTypes.func
}


export default DataEditor;
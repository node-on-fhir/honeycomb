// https://www.npmjs.com/package/react-dropzone-component
// http://www.dropzonejs.com/import { 


import { Meteor } from 'meteor/meteor';
import React from 'react';

import { get } from 'lodash';

import { ImportEditorBindings } from './ImportEditorBindings';


//============================================================================
// Main Component  

export function ImportPage(props){

  return(
    <div id="ImportPage" style={{padding: '20px', height: window.innerHeight, overflow: 'scroll', marginBottom: '80px'}}>
        <ImportEditorBindings history={props.history} />
    </div>
  );
}


export default ImportPage;
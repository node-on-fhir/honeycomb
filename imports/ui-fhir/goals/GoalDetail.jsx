import { 
  Grid, 
  Container,
  Button,
  Typography,
  DatePicker,
  FormControl,
  InputLabel,
  Input,
  InputAdornment,
  FormControlLabel,
  Checkbox
} from '@mui/material';


import React from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';

import { Meteor } from 'meteor/meteor';

import moment from 'moment';
import { get, set } from 'lodash';



//===============================================================================================================
// Theming  



//===============================================================================================================
// Main Component

function ListDetail(props){

  let { 
    children, 
    list,
    ...otherProps 
  } = props;


  let renderElements = [];

  let approvedOnDate = '';
  if(get(list, 'approvedDate')){
    approvedOnDate = moment(get(list, 'approvedDate')).format("YYYY-MM-DD")
  }
  let lastEditedDate = '';
  if(get(list, 'date')){
    lastEditedDate = moment(get(list, 'date')).format("YYYY-MM-DD")
  }
  let lastReviewDate = '';
  if(get(list, 'lastReviewDate')){
    lastReviewDate = moment(get(list, 'lastReviewDate')).format("YYYY-MM-DD")
  }

  return(
    <div className='ListDetails'>

        <Grid container spacing={3}>
          <Grid item xs={6}>
            <FormControl style={{width: '100%', marginTop: '20px'}}>
              <InputAdornment>Title</InputAdornment>
              <Input
                id="titleInput"
                name="titleInput"
                placeholder="Lorem ipsum."              
                value={get(list, 'title')}
                //onChange={handleFhirEndpointChange}
                fullWidth              
              />       
            </FormControl>   
            <FormControl style={{width: '100%', marginTop: '20px'}}>
              <InputAdornment>Publisher</InputAdornment>
              <Input
                id="publisherInput"
                name="publisherInput"
                value={get(list, 'publisher')}
                //onChange={handleFhirEndpointChange}
                fullWidth              
              />       
            </FormControl>      
          </Grid>
          <Grid item xs={3}>
            <FormControl style={{width: '100%', marginTop: '20px'}}>
              <InputAdornment>Version</InputAdornment>
              <Input
                id="versionInput"
                name="versionInput"
                placeholder="2020.2"              
                value={get(list, 'version')}
                //onChange={handleFhirEndpointChange}
                fullWidth              
              />          
            </FormControl>
            <FormControl style={{width: '100%', marginTop: '20px'}}>
              <InputAdornment>Identifier</InputAdornment>
              <Input
                id="identifierInput"
                name="identifierInput"
                placeholder="XYZ.1"              
                value={get(list, 'identifier[0].value')}
                //onChange={handleFhirEndpointChange}
                fullWidth              
              />
            </FormControl>     
          </Grid>
          <Grid item xs={3}>
            <FormControl style={{width: '100%', marginTop: '20px'}}>
              <InputAdornment>Status</InputAdornment>
              <Input
                id="statusInput"
                name="statusInput"
                placeholder="active"              
                value={get(list, 'status')}
                //onChange={handleFhirEndpointChange}
                fullWidth              
              />    
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl style={{width: '100%', marginTop: '20px'}}>
              <InputAdornment>Description</InputAdornment>
              <Input
                id="descriptionInput"
                name="descriptionInput"
                placeholder="Lorem ipsum."              
                value={get(list, 'description')}
                //onChange={handleFhirEndpointChange}
                fullWidth           
                multiline   
              />
            </FormControl>                             
          </Grid>          
        </Grid>
    </div>
  );
}

ListDetail.propTypes = {
  id: PropTypes.string,
  fhirVersion: PropTypes.string,
  listId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  list: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  showPatientInputs: PropTypes.bool,
  showHints: PropTypes.bool,
  onInsert: PropTypes.func,
  onUpsert: PropTypes.func,
  onRemove: PropTypes.func,
  onCancel: PropTypes.func
};

export default ListDetail;
import React, { useState, useEffect } from 'react';

import { 
  Button,
  Card,
  CardHeader,
  CardContent,
  Grid,
  ExpansionPanel,
  ExpansionPanelSummary,
  ExpansionPanelDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  FormControl,
  InputLabel,
  Input,
  InputAdornment,
  FormControlLabel,
  Typography,
  Checkbox
} from '@mui/material';


import { get, has, uniq, compact } from 'lodash';
import moment from 'moment';

import PropTypes from 'prop-types';

import { Session } from 'meteor/session';


import { useTracker } from 'meteor/react-meteor-data';
import FhirUtilities from '../../lib/FhirUtilities';
// import { Questionnaires } from '../../lib/schemas/SimpleSchemas/Questionnaires';



let defaultQuestionnaire = {
  "resourceType" : "Questionnaire"
};

// icons
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { Icon } from 'react-icons-kit'
import { ic_reorder } from 'react-icons-kit/md/ic_reorder'


//===========================================================================
// THEMING

let sortableItemStyle = {
  fontSize: '18px', 
  width: '100%',
  listStyleType: 'none',
  padding: '10px',
  margin: '10px',
  borderBottom: '1px solid lightgray'
}



let responseTemplate = {
  "resourceType": "QuestionnaireResponse",
  "identifier": {
    "system": "https://www.symptomatic.io/fhir/Questionnaire/",
    "value": Session.get('selectedResponseId')
  },
  "questionnaire": "Questionnaire/" + Session.get('selectedResponseId'),
  "status": "completed",
  "subject": {
    "display": "Anonymous User",
    "reference": "Patient/Anonymous"
  },
  "authored": new Date(),
  "author": {
    "display": "Anonymous User",
    "reference": "Patient/Anonymous"
  },
  "source": {
    "display": "Symptomatic Gravity App",
    "reference": "https://gravity.symptomatic.healthcare"
  },
  "item": [] 
}

// ====================================================================================================================
// Session Variables  

Session.setDefault('selectedResponse', null);


// ====================================================================================================================
// Main Component  


function SurveyResponseSummary(props){
  console.log('SurveyResponseSummary.props', props)

  let { 
    id,
    children, 
    selectedResponse = null,
    selectedResponseId = null,
    sortableItems,
    ...otherProps 
  } = props;


  // ================================================================================
  // Startup

  // useEffect(function(){
  //   if(selectedResponse){

  //   }
  // }, [props.lastUpdated])

  // ================================================================================
  // Trackers

  let lastUpdated = "";
  lastUpdated = useTracker(function(){
    return Session.get('lastUpdated');
  }, [])


  // ================================================================================
  // Styling

  let styles = {
    identifier: {
      fontWeight: 'bold'
    },
    description: {
      position: 'absolute',
      marginLeft: '120px'
    },
    expansionPanel: {
      marginRight: '40px'
    }
  }

  let questionAnswers = [];


  // we're going to get a question, along with the indices for where it exists in the hierarcy, up to two levels deep
  function parseAnswers(answerArray, answerIndex){
    console.log('Parsing answers', answerArray, answerIndex)
    let stringToRender = ""    

    if(Array.isArray(answerArray)){
      if(get(answerArray[0], 'valueString')){
        stringToRender = get(answerArray[0], 'valueString');
      } else if(get(answerArray[0], 'valueCoding.display')){
        stringToRender = get(answerArray[0], 'valueCoding.display');
      }
    }
                    
    return stringToRender;
  }



  // do we have question items to display in expansion panels
  // console.log('selectedResponse (pre main render)', selectedResponse)
  if(selectedResponse){
    console.log('---------------------------------------------------------------')
    console.log('SurveyResponseSummary.selectedResponse', selectedResponse)

    // should be our sections
    if(Array.isArray(selectedResponse.item)){
      selectedResponse.item.forEach(function(renderItem, renderItemIndex){
        console.log('renderItem', renderItem)

        if(renderItem){
          // should be the questions
          if(Array.isArray(renderItem.item)){
            // questionAnswers.push(<h3 key={'section-' + renderItemIndex} style={{width: '100%', borderTop: '1px solid lightgray', marginTop: '10px'}}>{get(renderItem, 'text')}</h3>)
            
            renderItem.item.forEach(function(questionItem, questionItemIndex){
              questionAnswers.push(<h4 key={'question-' + renderItemIndex + '-' + questionItemIndex} >Q: {get(questionItem, 'text')}</h4>)
              
              if(Array.isArray(questionItem.answer)){
                questionAnswers.push(<p key={'answer-' + renderItemIndex + '-' + questionItemIndex}>{parseAnswers(get(renderItem, 'answer', []))}</p>)
              }     
            });
          } else {
            questionAnswers.push(<h4 key={'section-' + renderItemIndex} >Q: {get(renderItem, 'text')}</h4>)
          }

          if(Array.isArray(renderItem.answer)){
            questionAnswers.push(<p key={'answer-' + renderItemIndex}>{parseAnswers(renderItem.answer)}</p>)
          } 

        }
      });  
    }  
  } else {
    console.log('SurveyResponseSummary.selectedResponse is null.  No data to display.')
  }

  console.log('questionAnswers', questionAnswers)

  let questionnaireId = FhirUtilities.pluckReferenceId(get(selectedResponse, 'questionnaire'));
  console.log('SurveyResponseSummary.questionnaireId', questionnaireId);

  let questionnaire = Questionnaires.findOne({id: questionnaireId});
  console.log('SurveyResponseSummary.questionnaire', questionnaire);



  return (
    <div id={id} className="questionnaireResponseSummary">
      <Grid container>
        <Grid item md={4}>
          <CardHeader title={get(selectedResponse, 'author.display')} subheader={get(selectedResponse, 'author.reference')} />
        </Grid>
        <Grid item md={8}>
          <CardHeader title={get(questionnaire, 'title')} subheader={moment(get(selectedResponse, 'authored')).format("YYYY-MM-DD")} />      
        </Grid>
      </Grid>
      <CardContent id='questionnaireResponseSummary'>
        { questionAnswers }
      </CardContent>
    </div>
  );
}

SurveyResponseSummary.propTypes = {
  id: PropTypes.string,
  selectedResponse: PropTypes.object,
  selectedResponseId: PropTypes.string,
  sortableItems: PropTypes.array
};


export default SurveyResponseSummary;
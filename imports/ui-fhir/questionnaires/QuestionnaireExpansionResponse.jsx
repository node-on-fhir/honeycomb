import React, { useState, useEffect } from 'react';

import { 
  Button,
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

import { useTracker } from 'meteor/react-meteor-data';

import { Session } from 'meteor/session';

let defaultQuestionnaire = {
  "resourceType" : "Questionnaire"
};

// icons
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { Icon } from 'react-icons-kit'
import { ic_reorder } from 'react-icons-kit/md/ic_reorder'


//===========================================================================

Meteor.startup(function(){
  Questionnaires = Meteor.Collections.Questionnaires;
})

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
    "value": Session.get('selectedQuestionnaireId')
  },
  "questionnaire": "Questionnaire/" + Session.get('selectedQuestionnaireId'),
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

Session.setDefault('questionnaireUpsert', false);
Session.setDefault('selectedQuestionnaire', null);
Session.setDefault('sortableItems', []);
Session.setDefault('Questionnaire.draftResponse', responseTemplate);
Session.setDefault('Questionnaire.checkboxChecked', null);
// Session.setDefault('draftResponse', responseTemplate );


// ====================================================================================================================
// Main Component  


export function QuestionnaireExpansionResponse(props){

  let { 
    children, 
    selectedQuestionnaire,
    selectedQuestionnaireId,
    sortableItems,
    ...otherProps 
  } = props;


  let draftResponse = useTracker(function(){
    return Session.get('Questionnaire.draftResponse');
  }, [])

  let checkboxChecked = useTracker(function(){
    return Session.get('Questionnaire.checkboxChecked');
  }, [])



  // ================================================================================
  // Trackers

  // useEffect(function(){
  //   // if(props.selectedQuestionnaire){
  //   //   console.log('useEffect().props.selectedQuestionnaire', props.selectedQuestionnaire)
  //   // }
  // }, []);

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
      fontWeight: 'bold',
      maxWidth: '100px',
      textOverflow: 'elipsis',
      overflow: 'hidden',
      display: 'flex'
    },
    description: {
      position: 'relative',
      marginLeft: '20px',
      marginRight: '20px'
    },
    expansionPanel: {
      //marginRight: '40px'
    },
    summary: {
      content: {
        alignItems: 'center',
        verticalAlign: 'middle'  
      }
    }
  }

  let noWrap = false;
  if(window.innerWidth < 768){
    styles.expansionPanel.marginRight = '0px'
    styles.identifier.display = 'none'
    styles.description.maxWidth = (window.innerWidth - 100) + 'px'
    styles.description.marginLeft = '0px'
    styles.description.marginRight = '0px'
    styles.description.marginTop = '-10px'
    styles.summary.content.verticalAlign = 'top';
    styles.summary.content.height = '56px'
    noWrap = true;
  }



  let questionPanels = [];

  function handleToggleItem(selectedLinkId, selectedValueCoding, event){
    console.log('handleToggleItem', selectedLinkId, selectedValueCoding)
    console.log('handleToggleItem.draftResponse', draftResponse)

    let newResponse = draftResponse;
    
    if(Array.isArray(draftResponse.item)){
      newResponse.item.forEach(function(sectionItem, questionnaireItemIndex){        
        
        if(sectionItem.linkId === selectedLinkId){
          sectionItem.answer = [];
          sectionItem.answer.push({
            valueCoding: selectedValueCoding
          })
        } else {
          if(Array.isArray(sectionItem.item)){
            sectionItem.item.forEach(function(question, questionIndex){
              if(question.linkId === selectedLinkId){
                question.answer = [];
                question.answer.push({
                  valueCoding: selectedValueCoding
                })
              }
            })            
          }
        }              
      })
    }
    
    console.log('newResponse', newResponse)
    Session.set('lastUpdated', new Date())
    setDraftResponse(newResponse)
  }


  function generateAnswerOptions(answerOption, currentQuestion){
    let answerChoices = [];
    if(answerOption){
      if(Array.isArray(answerOption)){

        // does this section element have answers?            
        if(answerOption.length > -1){
          // for each answer we render, we are going to need to figure out 
          // if the answer has been selected
          answerOption.forEach(function(option, index){
            // console.log('QuestionnaireExpansionResponse.answerOptions.option', option)
  
            let optionIsChecked = false;
  
            if(get(currentQuestion, 'answer[0].valueCoding.code') === get(option, 'valueCoding.code')){
              optionIsChecked = true;
            }       
  
            // console.log('currentQuestion.answerOptions.option', question.answerOption, optionIsChecked)
  
            answerChoices.push(<ListItem style={{paddingLeft: '120px'}} key={get(currentQuestion, 'linkId') + '-answer-' + index}>
              <ListItemIcon>
                <Checkbox name="checkedDateRangeEnabled" checked={optionIsChecked} onChange={handleToggleItem.bind(this, get(currentQuestion, 'linkId'), get(option, 'valueCoding'))} />
              </ListItemIcon>
              <ListItemText>
                { get(option, 'valueCoding.display') }
              </ListItemText>
            </ListItem>);
          })
        }
  
      }  
    }
    return answerChoices;
  }

  // we're going to get a question, along with the indices for where it exists in the hierarcy, up to two levels deep
  function parseQuestion(sectionIndex, questionIndex){
    // console.log('Parsing questions', sectionIndex, questionIndex, draftResponse)
    console.log('Parsing questions', sectionIndex, questionIndex, selectedQuestionnaire)
    
    let answerChoices = [];  

    let queryPluckString = "";
                    
    if(typeof questionIndex === "number"){
      queryPluckString = 'item[' + sectionIndex + '].item[' + questionIndex + ']';
    } else {
      queryPluckString = 'item[' + sectionIndex + ']';
    }

    // construct the string for plucking the value
    console.log('queryPluckString', queryPluckString)
    let currentQuestion = get(selectedQuestionnaire, queryPluckString)
    console.log('currentQuestion', currentQuestion)

    // did the pluck string return a valid question?  
    if(currentQuestion){
      
      // does the question have a list of possible answers?
      if(Array.isArray(currentQuestion.answerOption)){

        generateAnswerOptions(answerChoices, currentQuestion);

      } else {

        // assuming this is a subelement        
        if(Array.isArray(currentQuestion.item)){
          currentQuestion.item.forEach(function(subQuestion){
            generateAnswerOptions(answerChoices, subQuestion);
          })
        }
      }

    }

    return answerChoices;
  }



  if(selectedQuestionnaire){
    console.log('====================================================================================================')
    console.log('QuestionnaireExpansionResponse.selectedQuestionnaire', selectedQuestionnaire)

    // responseTemplate.questionnaire = "Questionnaire/" + selectedQuestionnaireId;
    // responseTemplate.item = get(selectedQuestionnaire, 'item', []);

  

    if(Array.isArray(selectedQuestionnaire.item)){
      selectedQuestionnaire.item.forEach(function(questionItem, index){
        questionItem.answer = [];

        if(Array.isArray(questionItem.item)){
          questionItem.item.forEach(function(question, questionIndex){
            question.answer = [];
          });
        }  
      })
    }

      
    // Forms with Functional React Components
    // Pros:  React internal state works really well
    // Cons:  FHIR QuestionnaireResponses store answers in arrays
    // Solution:  Helper methods (eventually)
    // Kludge: In the meantime, we have this gnarly thing to deal with

    if(selectedQuestionnaire){
      if(Array.isArray(selectedQuestionnaire.item)){
        selectedQuestionnaire.item.forEach(function(questionnaireItem, questionnaireItemIndex){
          
          questionPanels = parseItem(questionnaireItem, null, questionnaireItemIndex);                
        });  
      }  
    }  
  }



  return (
    <div id={ get(this, 'props.id', '')} className="questionnaireDetail">
      <div id='questionnaireExpansionPanels'>
        { questionPanels }
      </div>
    </div>
  );

  function parseItem(questionnaireItem, path, questionnaireItemIndex) {
    console.log('--------------------------------------------------------------------')
    console.log(get(questionnaireItem, 'text'))
    console.log('questionnaireItemIndex', questionnaireItemIndex)
    console.log('questionnaireItemType', get(questionnaireItem, 'type'))
    console.log('parseItem', questionnaireItem)
    

    let answerChoices = [];

    if(!path){
      path = "expansionPanel"
    }

    // are we starting with section headers or actual questions
    if(get(questionnaireItem, 'type') === "group"){
      console.log('Found a group')

      let newPath = path + '-' + questionnaireItemIndex;

      questionPanels.push(<ExpansionPanel style={styles.expansionPanel} key={newPath}>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />} aria-controls={newPath + '-summary-' + questionnaireItemIndex} id={newPath + '-summary-' + questionnaireItemIndex} style={styles.summary}>
            <Typography className="group" style={styles.description} noWrap={noWrap}>
              {get(questionnaireItem, 'text')}
            </Typography>
          </ExpansionPanelSummary>
        </ExpansionPanel>
      );

      if (Array.isArray(questionnaireItem.item)) {
        questionnaireItem.item.forEach(function(groupItem, groupItemIndex) {
          parseItem(groupItem, newPath, groupItemIndex);
        });
      }

    } else if(get(questionnaireItem, 'type') === "choice"){
      if (Array.isArray(questionnaireItem.answerOption)) {

        let answerChoiceElements = generateAnswerOptions(questionnaireItem.answerOption, null);  

        let expanded;
        if (typeof props.autoExpand === "boolean") {
          expanded = props.autoExpand;
        }
  
        questionPanels.push(<ExpansionPanel expanded={expanded} style={styles.expansionPanel} key={path + '-choice-' + questionnaireItemIndex}>
          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />} aria-controls={path + '-choice-' + + questionnaireItemIndex + "-content"} id={'expansionPanel-topLevel-' + questionnaireItemIndex + "-header"} style={styles.summary}>
            {/* <Typography className="measure-identifier" style={styles.identifier}>{get(questionnaireItem, 'linkId', questionnaireItemIndex)}</Typography>               */}
            <Typography className="measure-description" style={styles.description} noWrap={noWrap}>
              {get(questionnaireItem, 'text')}
            </Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails className="measure-details" style={{ display: 'block' }}>
            <List>
              {answerChoiceElements}
            </List>
          </ExpansionPanelDetails>
        </ExpansionPanel>);
  
      }
    }

    return questionPanels;
  }
}

QuestionnaireExpansionResponse.propTypes = {
  selectedQuestionnaire: PropTypes.object,
  selectedQuestionnaireId: PropTypes.string,
  sortableItems: PropTypes.array,
  autoExpand: PropTypes.bool
};

QuestionnaireExpansionResponse.defaultProps = {
  selectedQuestionnaire: null,
  autoExpand: null
}

export default QuestionnaireExpansionResponse;
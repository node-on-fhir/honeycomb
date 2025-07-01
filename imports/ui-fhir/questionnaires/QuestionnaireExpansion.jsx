import React, { useState, useEffect } from 'react';

import { 
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondGaryAction,
  FormControl,
  InputLabel,
  Input,
  InputAdornment,
  FormControlLabel,
  Typography,
  Checkbox,
  TextField
} from '@mui/material';

import { get, has, uniq, compact } from 'lodash';
import moment from 'moment';

import PropTypes from 'prop-types';

import { useTracker } from 'meteor/react-meteor-data';

import { Session } from 'meteor/session';


// icons
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';


//===========================================================================
// THEMING

// // A style sheet
// const useStyles = makeStyles({
//   'MuiAccordion-root': {
//     '&:before': {
//       backgroundColor: 'rgba(0,0,0,0)'
//     }
//   },
//   'root': {
//     '&:before': {
//       backgroundColor: 'rgba(0,0,0,0)'
//     }
//   }
// });






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
// Styled Component  


// The `withStyles()` higher-order component is injecting a `classes`
// prop that is used by the `Button` component.
// const StyledAccordion = withStyles({
//   root: {
//     '&:before': {
//       backgroundColor: 'rgba(0,0,0,0)'
//     }
//   }
// })(Accordion);

const StyledAccordion = Accordion;

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


export function QuestionnaireExpansion(props){

  // const classes = useStyles(props);

  let { 
    children, 
    selectedQuestionnaire = null,
    selectedQuestionnaireId,
    sortableItems,
    autoExpand = null,
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

  let lastUpdated = "";
  lastUpdated = useTracker(function(){
    return Session.get('lastUpdated');
  }, [])

  let expandedPanels = useTracker(function(){
    return Session.get('SurveyPage.expandedPanels')    
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
      backgroundColor: 'rgba(0,0,0,0) !important'
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
//     console.log('handleToggleItem', selectedLinkId, selectedValueCoding)
    

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
            
  
            let optionIsChecked = false;
  
            if(get(currentQuestion, 'answer[0].valueCoding.code') === get(option, 'valueCoding.code')){
              optionIsChecked = true;
            }       
  
            
  
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
    
    let answerChoices = [];  

    let queryPluckString = "";
                    
    if(typeof questionIndex === "number"){
      queryPluckString = 'item[' + sectionIndex + '].item[' + questionIndex + ']';
    } else {
      queryPluckString = 'item[' + sectionIndex + ']';
    }

    // construct the string for plucking the value
    
    let currentQuestion = get(selectedQuestionnaire, queryPluckString)
    
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

  // Forms with Functional React Components
  // Pros:  React internal state works really well
  // Cons:  FHIR QuestionnaireResponses store answers in arrays
  // Solution:  Helper methods (eventually)
  // Kludge: In the meantime, we have this gnarly thing to deal with

  // do we have question items to display in expansion panels
  console.log('===========================================================================================')
  console.log('QuestionnaireExpansion.selectedQuestionnaire', selectedQuestionnaire)
  console.log('QuestionnaireExpansion.draftResponse (pre main render)', draftResponse)

  if(selectedQuestionnaire){
    if(Array.isArray(selectedQuestionnaire.item)){
      selectedQuestionnaire.item.forEach(function(renderItem, renderItemIndex){
        
  
        let answerChoices = [];
        
        // are we starting with section headers or actual questions
        // looks like we have actual questions
        if(Array.isArray(renderItem.answerOption)){
          answerChoices = parseQuestion(renderItemIndex, -1);
  
          questionPanels.push(<StyledAccordion expanded={expandedPanels} key={'expansionPanel-topLevel-' + renderItemIndex}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={'expansionPanel-topLevel-' + renderItemIndex + "-content"} id={'expansionPanel-topLevel-' + renderItemIndex + "-array"}  style={styles.summary} >
              {/* <Typography className="measure-identifier" style={styles.identifier}>{get(renderItem, 'linkId', renderItemIndex)}</Typography>               */}
              <Typography className="measure-description" style={styles.description} noWrap={noWrap}>
                {get(renderItem, 'text')}
              </Typography>
            </AccordionSummary>
            <AccordionDetails className="measure-details" style={{display: 'block'}}>
              <List>
                { answerChoices }
              </List>
            </AccordionDetails>
          </StyledAccordion>)   
  
        } else {
          // section titles

          switch (get(renderItem, 'type')) {
            case "date":
              questionPanels.push(<StyledAccordion expanded={expandedPanels} key={'expansionPanel-topLevel-' + renderItemIndex}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={'expansionPanel-topLevel-' + renderItemIndex + "-content"} id={'expansionPanel-topLevel-' + renderItemIndex + "-date"} style={styles.summary}  >
                  <TextField
                    id="standard-basic"
                    label={get(renderItem, 'text')}
                    style={{marginLeft: 'auto'}}
                    defaultValue={new Date()}
                    InputLabelProps={{
                      shrink: true
                    }}
                    type="date"
                    fullWidth
                  />
                </AccordionSummary>            
              </StyledAccordion>)                     
              break; 
            case "string":
              questionPanels.push(<StyledAccordion expanded={expandedPanels} key={'expansionPanel-topLevel-' + renderItemIndex}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={'expansionPanel-topLevel-' + renderItemIndex + "-content"} id={'expansionPanel-topLevel-' + renderItemIndex + "-string"} style={styles.summary}  >
                  <TextField
                    id="standard-basic"
                    label={get(renderItem, 'text')}
                    style={{marginLeft: 'auto'}}
                    fullWidth
                  />
                </AccordionSummary>            
              </StyledAccordion>)                     
              break;      
            case "group":
                questionPanels.push()                     
                break;          
            case "integer":
              questionPanels.push(<StyledAccordion expanded={expandedPanels} key={'expansionPanel-topLevel-' + renderItemIndex}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={'expansionPanel-topLevel-' + renderItemIndex + "-boolean"} id={'expansionPanel-topLevel-' + renderItemIndex + "-string"} style={styles.summary}  >
                  <Typography className="measure-description" style={styles.description} noWrap={noWrap}>
                    {get(renderItem, 'text')}
                  </Typography>
                </AccordionSummary>            
              </StyledAccordion>)                   
              break;  
            case "boolean":
              questionPanels.push(<StyledAccordion expanded={expandedPanels} key={'expansionPanel-topLevel-' + renderItemIndex}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={'expansionPanel-topLevel-' + renderItemIndex + "-boolean"} id={'expansionPanel-topLevel-' + renderItemIndex + "-string"} style={styles.summary}  >
                  <Typography className="measure-description" style={styles.description} noWrap={noWrap}>
                    {get(renderItem, 'text')}
                  </Typography>
                </AccordionSummary>            
              </StyledAccordion>)                   
              break;  
            case "display":
              questionPanels.push(<StyledAccordion expanded={expandedPanels} key={'expansionPanel-topLevel-' + renderItemIndex}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={'expansionPanel-topLevel-' + renderItemIndex + "-content"} id={'expansionPanel-topLevel-' + renderItemIndex + "-display"} style={styles.summary}  >
                  <Typography className="measure-description" style={styles.description} noWrap={noWrap}>
                    {get(renderItem, 'text')}
                  </Typography>
                </AccordionSummary>            
              </StyledAccordion>)                   
              break;          
            default:
              questionPanels.push(<StyledAccordion expanded={expandedPanels} key={'expansionPanel-topLevel-' + renderItemIndex}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={'expansionPanel-topLevel-' + renderItemIndex + "-content"} id={'expansionPanel-topLevel-' + renderItemIndex + "-default"} style={styles.summary}  >
                  <TextField
                    id="standard-basic"
                    label={get(renderItem, 'text')}
                    style={{marginLeft: 'auto'}}
                    fullWidth
                  />
                </AccordionSummary>            
              </StyledAccordion>)       
            break;
          }          
        } 
        
        if (Array.isArray(renderItem.item)){

          // no answers options available, so assume we have section headers
          renderItem.item.forEach(function(question, questionIndex){
            console.log('SurveyAccordions.renderItem.question', question);
            
              answerChoices = parseQuestion(renderItemIndex, questionIndex);
              questionPanels.push(<StyledAccordion expanded={expandedPanels} key={'expansionPanel-question-' + renderItemIndex + '-' + questionIndex}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={'expansionPanel-question-' + renderItemIndex + '-' + questionIndex + '-content'} id={'expansionPanel-question-' + renderItemIndex + '-' + questionIndex + '-array'} style={styles.summary}  >
                  {/* <Typography className="measure-identifier" style={styles.identifier}>{get(question, 'linkId', questionIndex)}</Typography> */}
                  <Typography className="measure-description" style={styles.description} noWrap={noWrap}>
                    {get(question, 'text')}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails className="measure-details" style={{display: 'block'}}>
                  <List>
                    { answerChoices }
                  </List>
                </AccordionDetails>
              </StyledAccordion>)  
          })
        }                
      });  
    }  
  }  



  return (
    <div id={ get(this, 'props.id', '')} className="questionnaireDetail">
      <div id='questionnaireAccordions'>
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

      questionPanels.push(<Accordion key={newPath}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={newPath + '-summary-' + questionnaireItemIndex} id={newPath + '-summary-' + questionnaireItemIndex} style={styles.summary}>
            <Typography className="group" style={styles.description} noWrap={noWrap}>
              {get(questionnaireItem, 'text')}
            </Typography>
          </AccordionSummary>
        </Accordion>
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
  
        questionPanels.push(<Accordion expanded={expanded} key={path + '-choice-' + questionnaireItemIndex}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={path + '-choice-' + + questionnaireItemIndex + "-content"} id={'expansionPanel-topLevel-' + questionnaireItemIndex + "-choice"} style={styles.summary}>
            {/* <Typography className="measure-identifier" style={styles.identifier}>{get(questionnaireItem, 'linkId', questionnaireItemIndex)}</Typography>               */}
            <Typography className="measure-description" style={styles.description} noWrap={noWrap}>
              {get(questionnaireItem, 'text')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails className="measure-details" style={{ display: 'block' }}>
            <List>
              {answerChoiceElements}
            </List>
          </AccordionDetails>
        </Accordion>);
  
      }
    }

    return questionPanels;
  }
}

QuestionnaireExpansion.propTypes = {
  selectedQuestionnaire: PropTypes.object,
  selectedQuestionnaireId: PropTypes.string,
  sortableItems: PropTypes.array,
  autoExpand: PropTypes.bool
};


export default QuestionnaireExpansion;
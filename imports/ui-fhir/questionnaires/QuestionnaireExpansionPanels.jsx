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

import { withStyles, makeStyles } from '@mui/styles';

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



// The `withStyles()` higher-order component is injecting a `classes`
// prop that is used by the `Button` component.
const StyledExpansionPanel = withStyles({
  root: {
    '&:before': {
      backgroundColor: 'rgba(0,0,0,0)'
    }
  }
})(ExpansionPanel);


//===========================================================================

Meteor.startup(function(){
  Questionnaires = Meteor.Collections.Questionnaires;
})

//===========================================================================
// THEMING


// // A style sheet
const useStyles = makeStyles({
  'MuiExpansionPanel-root': {
    '&:before': {
      backgroundColor: 'rgba(0,0,0,0)'
    }
  },
  'root': {
    '&:before': {
      backgroundColor: 'rgba(0,0,0,0)'
    }
  }
});



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
// Session.setDefault('draftResponse', responseTemplate );


// ====================================================================================================================
// Main Component  


export function QuestionnaireExpansionPanels(props){

  const classes = useStyles(props);

  let { 
    children, 
    selectedQuestionnaire,
    selectedQuestionnaireId,
    sortableItems,
    ...otherProps 
  } = props;

  let [draftResponse, setDraftResponse] = useState(responseTemplate);
  let [checkboxChecked, setCheckbox] = useState({item: [{answer: []}, {answer: []}, {answer: []}, {answer: []}, {answer: []}]});


  // ================================================================================
  // Startup

  if(selectedQuestionnaire){

    responseTemplate.questionnaire = "Questionnaire/" + selectedQuestionnaireId;
    responseTemplate.item = get(selectedQuestionnaire, 'item', []);

    if(Array.isArray(responseTemplate.item)){
      responseTemplate.item.forEach(function(sectionItem, index){
        sectionItem.answer = [];

        if(Array.isArray(sectionItem.item)){
          sectionItem.item.forEach(function(question, questionIndex){
            question.answer = [];
          });
        }  
      })
    }

    // setDraftResponse(responseTemplate);
  }

  // useEffect(function(){
  //   if(selectedQuestionnaire){

  //     responseTemplate.questionnaire = "Questionnaire/" + selectedQuestionnaireId;
  //     responseTemplate.item = get(selectedQuestionnaire, 'item', []);

  //     if(Array.isArray(responseTemplate.item)){
  //       responseTemplate.item.forEach(function(sectionItem, index){
  //         sectionItem.answer = [];

  //         if(Array.isArray(sectionItem.item)){
  //           sectionItem.item.forEach(function(question, questionIndex){
  //             question.answer = [];
  //           });
  //         }  
  //       })
  //     }
  
  //     setDraftResponse(responseTemplate);
  //   }
  // }, [props.lastUpdated])

  // useEffect(function(){
  //   console.log('draftResponse[lastUpdated]', draftResponse)
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
      newResponse.item.forEach(function(sectionItem, renderItemIndex){        
        
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

  function handleToggleCheckbox(renderItemIndex, event, newValue){
    console.log('handleToggleCheckbox', renderItemIndex, event, newValue)

    console.log('checkboxChecked', checkboxChecked);
    console.log('!checkboxChecked[renderItemIndex]', !checkboxChecked[renderItemIndex]);

    let newCheckboxObject = {item: []};
    if(Array.isArray(checkboxChecked.item)){
      checkboxChecked.item.forEach(function(questionAnswerItem, index){        
        if(index === renderItemIndex){
          let newAnswer = [];
          if(questionAnswerItem.answer.length > 0){
            newAnswer = [];
          } else {
            newAnswer = ["Foo"]
          }
          newCheckboxObject.item[renderItemIndex] = {answer: newAnswer}
        } else {
          newCheckboxObject.item = {answer: []}
        }
      })
    }
    console.log('newCheckboxObject', newCheckboxObject);

    setCheckbox(newCheckboxObject);
  }

  function generateAnswerOptions(answerChoices, currentQuestion){
    if(Array.isArray(currentQuestion.answerOption)){

      // does this section element have answers?            
      if(currentQuestion.answerOption.length > -1){
        // for each answer we render, we are going to need to figure out 
        // if the answer has been selected
        currentQuestion.answerOption.forEach(function(option, index){
          // console.log('QuestionnaireExpansionPanels.answerOptions.option', option)

          let optionIsChecked = false;

          if(get(currentQuestion, 'answer[0].valueCoding.code') === get(option, 'valueCoding.code')){
            optionIsChecked = true;
          }       

          // console.log('currentQuestion.answerOptions.option', question.answerOption, optionIsChecked)

          answerChoices.push(<ListItem style={{paddingLeft: '120px'}} key={'answer-' + index}>
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

  // we're going to get a question, along with the indices for where it exists in the hierarcy, up to two levels deep
  function parseQuestion(sectionIndex, questionIndex){
    console.log('Parsing questions', sectionIndex, questionIndex, draftResponse)
    let answerChoices = [];  

    let queryPluckString = "";
                    
    if(questionIndex > -1){
      queryPluckString = 'item[' + sectionIndex + '].item[' + questionIndex + ']';
    } else {
      queryPluckString = 'item[' + sectionIndex + ']';
    }

    console.log('queryPluckString', queryPluckString)
    let currentQuestion = get(draftResponse, queryPluckString)
    console.log('currentQuestion', currentQuestion)

    if(currentQuestion){
      // is this a section element?
      if(Array.isArray(currentQuestion.answerOption)){

        generateAnswerOptions(answerChoices, currentQuestion);

        // // does this section element have answers?
        // if(currentQuestion.answerOption.length > -1){
        //   // for each answer we render, we are going to need to figure out 
        //   // if the answer has been selected
        //   currentQuestion.answerOption.forEach(function(option, index){

        //     let optionIsChecked = false;

        //     if(get(currentQuestion, 'answer[0].valueCoding.code') === get(option, 'valueCoding.code')){
        //       optionIsChecked = true;
        //     }          

        //     // console.log('question.answerOptions.option', option, optionIsChecked)

        //     answerChoices.push(<ListItem style={{paddingLeft: '120px'}} key={'answer-' + index}>
        //       <ListItemIcon>
        //         <Checkbox name="checkedDateRangeEnabled" checked={optionIsChecked} onChange={handleToggleItem.bind(this, get(currentQuestion, 'linkId'), get(option, 'valueCoding'))} />
        //       </ListItemIcon>
        //       <ListItemText>
        //         { get(option, 'valueCoding.display') }
        //       </ListItemText>
        //     </ListItem>);
        //   })
        // }

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
  console.log('draftResponse (pre main render)', draftResponse)
  if(draftResponse){
    if(Array.isArray(draftResponse.item)){
      draftResponse.item.forEach(function(renderItem, renderItemIndex){
        // console.log('renderItem', renderItem)
  
        let answerChoices = [];
        
        // are we starting with section headers or actual questions
        // looks like we have actual questions
        if(Array.isArray(renderItem.answerOption)){
          answerChoices = parseQuestion(renderItemIndex, -1);

          let expanded;
          if(typeof props.autoExpand === "boolean"){
            expanded = props.autoExpand;
          }
  
          questionPanels.push(<StyledExpansionPanel expanded={expanded} className={classes.MuiExpansionPanel} key={'expansionPanel-topLevel-' + renderItemIndex}>
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />} aria-controls={'expansionPanel-topLevel-' + renderItemIndex + "-content"} id={'expansionPanel-topLevel-' + renderItemIndex + "-header"}  style={styles.summary} >
              {/* <Typography className="measure-identifier" style={styles.identifier}>{get(renderItem, 'linkId', renderItemIndex)}</Typography>               */}
              <Typography className="measure-description" style={styles.description} noWrap={noWrap}>
                {get(renderItem, 'text')}
              </Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails className="measure-details" style={{display: 'block'}}>
              <List>
                { answerChoices }
              </List>
            </ExpansionPanelDetails>
          </StyledExpansionPanel>)   
  
        } else {
          // section titles

          let itemArray = get(checkboxChecked, 'item');
          let itemChecked = itemArray[renderItemIndex];
          console.log('itemChecked', itemChecked, checkboxChecked);

          questionPanels.push(<StyledExpansionPanel className={classes.MuiExpansionPanel} key={'expansionPanel-topLevel-' + renderItemIndex}>
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />} aria-controls={'expansionPanel-topLevel-' + renderItemIndex + "-content"} id={'expansionPanel-topLevel-' + renderItemIndex + "-header"} style={styles.summary}  >
              {/* <Typography className="measure-identifier" style={styles.identifier}>{get(renderItem, 'linkId', renderItemIndex)}</Typography> */}
              <Typography className="measure-description" style={styles.description} noWrap={noWrap} >
                {/* <Checkbox checked={itemChecked} onChange={handleToggleCheckbox.bind(this, renderItemIndex)} />  */}
                {get(renderItem, 'text')}
              </Typography>
            </ExpansionPanelSummary>            
          </StyledExpansionPanel>)   
        } 
        
        if (Array.isArray(renderItem.item)){
          // no answers options available, so assume we have section headers
          renderItem.item.forEach(function(question, questionIndex){
            console.log('QuestionnaireExpansionPanels.renderItem.question', question)
            answerChoices = parseQuestion(renderItemIndex, questionIndex);
  
              questionPanels.push(<StyledExpansionPanel className={classes.MuiExpansionPanel} key={'expansionPanel-question-' + renderItemIndex + '-' + questionIndex}>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />} aria-controls={'expansionPanel-question-' + renderItemIndex + '-' + questionIndex + '-content'} id={'expansionPanel-question-' + renderItemIndex + '-' + questionIndex + '-header'} style={styles.summary}  >
                  {/* <Typography className="measure-identifier" style={styles.identifier}>{get(question, 'linkId', questionIndex)}</Typography> */}
                  <Typography className="measure-description" style={styles.description} noWrap={noWrap}>
                    {get(question, 'text')}
                  </Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails className="measure-details" style={{display: 'block'}}>
                  <List>
                    { answerChoices }
                  </List>
                </ExpansionPanelDetails>
              </StyledExpansionPanel>)  
          })
        }                
      });  
    }  
  }  

  return (
    <div id={ get(this, 'props.id', '')} className="questionnaireDetail">
      <div id='questionnaireExpansionPanels'>
        { questionPanels }
      </div>
    </div>
  );
}

QuestionnaireExpansionPanels.propTypes = {
  selectedQuestionnaire: PropTypes.object,
  selectedQuestionnaireId: PropTypes.string,
  sortableItems: PropTypes.array,
  autoExpand: PropTypes.bool
};

QuestionnaireExpansionPanels.defaultProps = {
  selectedQuestionnaire: null,
  autoExpand: null
}

export default QuestionnaireExpansionPanels;
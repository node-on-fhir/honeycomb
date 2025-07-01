// import React, { useState, useEffect } from 'react';

// import { 
//   Button,
//   ExpansionPanel,
//   ExpansionPanelSummary,
//   ExpansionPanelDetails,
//   List,
//   ListItem,
//   ListItemIcon,
//   ListItemText,
//   ListItemSecondaryAction,
//   FormControl,
//   InputLabel,
//   Input,
//   InputAdornment,
//   FormControlLabel,
//   Typography,
//   Checkbox
// } from '@mui/material';


// import { get, has, uniq, compact } from 'lodash';
// import moment from 'moment';

// import PropTypes from 'prop-types';

// import { Session } from 'meteor/session';
// import {
//   SortableContainer,
//   SortableElement,
//   arrayMove,
// } from 'react-sortable-hoc';





// let defaultQuestionnaire = {
//   "resourceType" : "Questionnaire"
// };

// // icons
// import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// import { Icon } from 'react-icons-kit'
// import { ic_reorder } from 'react-icons-kit/md/ic_reorder'



// //===========================================================================

// Meteor.startup(function(){
//     Questionnaires = Meteor.Collections.Questionnaires;
// })

// //===========================================================================
// // THEMING

// let sortableItemStyle = {
//   fontSize: '18px', 
//   width: '100%',
//   listStyleType: 'none',
//   padding: '10px',
//   margin: '10px',
//   borderBottom: '1px solid lightgray'
// }



// let responseTemplate = {
//   "resourceType": "QuestionnaireResponse",
//   "identifier": {
//     "system": "https://www.symptomatic.io/fhir/Questionnaire/",
//     "value": Session.get('selectedQuestionnaireId')
//   },
//   "questionnaire": "Questionnaire/" + Session.get('selectedQuestionnaireId'),
//   "status": "completed",
//   "subject": {
//     "display": "Anonymous User",
//     "reference": "Patient/Anonymous"
//   },
//   "authored": new Date(),
//   "author": {
//     "display": "Anonymous User",
//     "reference": "Patient/Anonymous"
//   },
//   "source": {
//     "display": "Symptomatic Gravity App",
//     "reference": "https://gravity.symptomatic.healthcare"
//   },
//   "item": [] 
// }

// // ====================================================================================================================
// // Session Variables  

// Session.setDefault('questionnaireUpsert', false);
// Session.setDefault('selectedQuestionnaire', null);
// Session.setDefault('sortableItems', []);
// // Session.setDefault('draftResponse', responseTemplate );


// // ====================================================================================================================
// // Main Component  


// function SurveyExpansionPanels(props){

//   let { 
//     children, 
//     selectedQuestionnaire,
//     selectedQuestionnaireId,
//     sortableItems,
//     ...otherProps 
//   } = props;

//   let [draftResponse, setDraftResponse] = useState(responseTemplate);
//   let [checkboxChecked, setCheckbox] = useState({item: [{answer: []}, {answer: []}, {answer: []}, {answer: []}, {answer: []}]});


//   // ================================================================================
//   // Startup

//   useEffect(function(){
//     if(selectedQuestionnaire){

//       responseTemplate.questionnaire = "Questionnaire/" + selectedQuestionnaireId;
//       responseTemplate.item = get(selectedQuestionnaire, 'item', []);

//       if(Array.isArray(responseTemplate.item)){
//         responseTemplate.item.forEach(function(sectionItem, index){
//           sectionItem.answer = [];

//           if(Array.isArray(sectionItem.item)){
//             sectionItem.item.forEach(function(question, questionIndex){
//               question.answer = [];
//             });
//           }  
//         })
//       }
  
//       setDraftResponse(responseTemplate);
//     }
//   }, [props.lastUpdated])

//   // useEffect(function(){
//   //   console.log('draftResponse[lastUpdated]', draftResponse)
//   // }, [props.lastUpdated])

//   // ================================================================================
//   // Trackers

//   let lastUpdated = "";
//   lastUpdated = useTracker(function(){
//     return Session.get('lastUpdated');
//   }, [])


//   // ================================================================================
//   // Styling

//   let styles = {
//     identifier: {
//       fontWeight: 'bold'
//     },
//     description: {
//       position: 'absolute',
//       marginLeft: '120px'
//     },
//     expansionPanel: {
//       marginRight: '40px'
//     }
//   }

//   let questionPanels = [];

//   function handleToggleItem(selectedLinkId, selectedValueCoding, event){
//     console.log('handleToggleItem', selectedLinkId, selectedValueCoding)
//     console.log('handleToggleItem.draftResponse', draftResponse)

//     let newResponse = draftResponse;
    
//     if(Array.isArray(draftResponse.item)){
//       newResponse.item.forEach(function(sectionItem, renderItemIndex){        
        
//         if(sectionItem.linkId === selectedLinkId){
//           sectionItem.answer = [];
//           sectionItem.answer.push({
//             valueCoding: selectedValueCoding
//           })
//         } else {
//           if(Array.isArray(sectionItem.item)){
//             sectionItem.item.forEach(function(question, questionIndex){
//               if(question.linkId === selectedLinkId){
//                 question.answer = [];
//                 question.answer.push({
//                   valueCoding: selectedValueCoding
//                 })
//               }
//             })            
//           }
//         }              
//       })
//     }
    
//     console.log('newResponse', newResponse)
//     Session.set('lastUpdated', new Date())
//     setDraftResponse(newResponse)
//   }

//   function handleToggleCheckbox(renderItemIndex, event, newValue){
//     console.log('handleToggleCheckbox', renderItemIndex, event, newValue)

//     console.log('checkboxChecked', checkboxChecked);
//     console.log('!checkboxChecked[renderItemIndex]', !checkboxChecked[renderItemIndex]);

//     let newCheckboxObject = {item: []};
//     if(Array.isArray(checkboxChecked.item)){
//       checkboxChecked.item.forEach(function(questionAnswerItem, index){        
//         if(index === renderItemIndex){
//           let newAnswer = [];
//           if(questionAnswerItem.answer.length > 0){
//             newAnswer = [];
//           } else {
//             newAnswer = ["Foo"]
//           }
//           newCheckboxObject.item[renderItemIndex] = {answer: newAnswer}
//         } else {
//           newCheckboxObject.item = {answer: []}
//         }
//       })
//     }
//     console.log('newCheckboxObject', newCheckboxObject);

//     setCheckbox(newCheckboxObject);
//   }


//   // we're going to get a question, along with the indices for where it exists in the hierarcy, up to two levels deep
//   function parseQuestion(sectionIndex, questionIndex){
//     console.log('Parsing questions', sectionIndex, questionIndex, draftResponse)
//     let answerChoices = [];  

//     let queryPluckString = "";
                    
//     if(questionIndex > -1){
//       queryPluckString = 'item[' + sectionIndex + '].item[' + questionIndex + ']';
//     } else {
//       queryPluckString = 'item[' + sectionIndex + ']';
//     }
//     // console.log('queryPluckString', queryPluckString)

//     let currentQuestion = get(draftResponse, queryPluckString)
//     // console.log('currentQuestion', currentQuestion)


//     // is this a section element?
//     if(Array.isArray(currentQuestion.answerOption)){

//       // does this section element have answers?
//       if(currentQuestion.answerOption.length > -1){
//         // for each answer we render, we are going to need to figure out 
//         // if the answer has been selected
//         currentQuestion.answerOption.forEach(function(option, index){

//           let optionIsChecked = false;

//           if(get(currentQuestion, 'answer[0].valueCoding.code') === get(option, 'valueCoding.code')){
//             optionIsChecked = true;
//           }          

//           // console.log('question.answerOptions.option', option, optionIsChecked)

//           answerChoices.push(<ListItem style={{paddingLeft: '120px'}} key={'answer-' + index}>
//             <ListItemIcon>
//               <Checkbox name="checkedDateRangeEnabled" checked={optionIsChecked} onChange={handleToggleItem.bind(this, get(currentQuestion, 'linkId'), get(option, 'valueCoding'))} />
//             </ListItemIcon>
//             <ListItemText>
//               { get(option, 'valueCoding.display') }
//             </ListItemText>
//           </ListItem>);
//         })
//       }

//     } else {
//       // assuming this is a subelement

//       if(Array.isArray(currentQuestion.item)){
//         currentQuestion.item.forEach(function(subQuestion){

//           if(Array.isArray(subQuestion.answerOption)){

//             // does this section element have answers?            
//             if(subQuestion.answerOption.length > -1){
//               // for each answer we render, we are going to need to figure out 
//               // if the answer has been selected
//               subQuestion.answerOption.forEach(function(option, index){
//                 // console.log('QuestionnaireExpansionPanels.answerOptions.option', option)

//                 let optionIsChecked = false;

//                 if(get(subQuestion, 'answer[0].valueCoding.code') === get(option, 'valueCoding.code')){
//                   optionIsChecked = true;
//                 }       

//                 // console.log('subQuestion.answerOptions.option', question.answerOption, optionIsChecked)

//                 answerChoices.push(<ListItem style={{paddingLeft: '120px'}} key={'answer-' + index}>
//                   <ListItemIcon>
//                     <Checkbox name="checkedDateRangeEnabled" checked={optionIsChecked} onChange={handleToggleItem.bind(this, get(currentQuestionResponse, 'linkId'), get(option, 'valueCoding'))} />
//                   </ListItemIcon>
//                   <ListItemText>
//                     { get(option, 'valueCoding.display') }
//                   </ListItemText>
//                 </ListItem>);
//               })
//             }

//           }

//         })
//       }
//     }

//     return answerChoices;
//   }

//   // Forms with Functional React Components
//   // Pros:  React internal state works really well
//   // Cons:  FHIR QuestionnaireResponses store answers in arrays
//   // Solution:  Helper methods (eventually)
//   // Kludge: In the meantime, we have this gnarly thing to deal with

//   // do we have question items to display in expansion panels
//   console.log('draftResponse (pre main render)', draftResponse)
//   if(draftResponse){
//     if(Array.isArray(draftResponse.item)){
//       draftResponse.item.forEach(function(renderItem, renderItemIndex){
//         // console.log('renderItem', renderItem)
  
//         let answerChoices = [];
        
//         // are we starting with section headers or actual questions
//         // looks like we have actual questions
//         if(Array.isArray(renderItem.answerOption)){
//           answerChoices = parseQuestion(renderItemIndex, false);
  
//           questionPanels.push(<ExpansionPanel style={styles.expansionPanel} key={'expansionPanel-topLevel-' + renderItemIndex}>
//             <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />} aria-controls={'expansionPanel-topLevel-' + renderItemIndex + "-content"} id={'expansionPanel-topLevel-' + renderItemIndex + "-header"} >
//               <Typography className="measure-identifier" style={styles.identifier}>{get(renderItem, 'linkId', renderItemIndex)}</Typography>
//               {/* <Typography id="panel-m2-measure-score" className="measure-score" style={styles.score}>{get(item, 'type')}</Typography>             */}
//               <Typography className="measure-description" style={styles.description}>
//                 {get(renderItem, 'text')}
//               </Typography>
//             </ExpansionPanelSummary>
//             <ExpansionPanelDetails className="measure-details" style={{display: 'block'}}>
//               <List>
//                 { answerChoices }
//               </List>
//             </ExpansionPanelDetails>
//           </ExpansionPanel>)   
  
//         } else {
//           // section titles

//           let itemArray = get(checkboxChecked, 'item');
//           let itemChecked = itemArray[renderItemIndex];
//           console.log('itemChecked', itemChecked, checkboxChecked);

//           questionPanels.push(<ExpansionPanel style={styles.expansionPanel} key={'expansionPanel-topLevel-' + renderItemIndex}>
//             <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />} aria-controls={'expansionPanel-topLevel-' + renderItemIndex + "-content"} id={'expansionPanel-topLevel-' + renderItemIndex + "-header"} >
//               <Typography className="measure-identifier" style={styles.identifier}>{get(renderItem, 'linkId', renderItemIndex)}</Typography>
//               <Typography className="measure-description" style={styles.description}>
//                 {/* <Checkbox checked={itemChecked} onChange={handleToggleCheckbox.bind(this, renderItemIndex)} />  */}
//                 {get(renderItem, 'text')}
//               </Typography>
//             </ExpansionPanelSummary>            
//           </ExpansionPanel>)   
//         } 
        
//         if (Array.isArray(renderItem.item)){
//           // no answers options available, so assume we have section headers
//           renderItem.item.forEach(function(question, questionIndex){
//             console.log('QuestionnaireExpansionPanels.renderItem.question', question)
//             answerChoices = parseQuestion(renderItemIndex, questionIndex);
  
//               questionPanels.push(<ExpansionPanel style={styles.expansionPanel} key={'expansionPanel-question-' + renderItemIndex + '-' + questionIndex}>
//                 <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />} aria-controls={'expansionPanel-question-' + renderItemIndex + '-' + questionIndex + '-content'} id={'expansionPanel-question-' + renderItemIndex + '-' + questionIndex + '-header'} >
//                   <Typography className="measure-identifier" style={styles.identifier}>{get(question, 'linkId', questionIndex)}</Typography>
//                   {/* <Typography id="panel-m2-measure-score" className="measure-score" style={styles.score}>{get(item, 'type')}</Typography>             */}
//                   <Typography className="measure-description" style={styles.description}>
//                     {get(question, 'text')}
//                   </Typography>
//                 </ExpansionPanelSummary>
//                 <ExpansionPanelDetails className="measure-details" style={{display: 'block'}}>
//                   <List>
//                     { answerChoices }
//                   </List>
//                 </ExpansionPanelDetails>
//               </ExpansionPanel>)  
//           })
//         }                
//       });  
//     }  
//   }  

//   return (
//     <div id={ get(this, 'props.id', '')} className="questionnaireDetail">
//       <div id='questionnaireDocument'>
//         { questionPanels }
//       </div>
//     </div>
//   );
// }

// SurveyExpansionPanels.propTypes = {
//   selectedQuestionnaire: PropTypes.object,
//   selectedQuestionnaireId: PropTypes.string,
//   sortableItems: PropTypes.array
// };

// SurveyExpansionPanels.defaultProps = {
//   selectedQuestionnaire: null
// }

// export default SurveyExpansionPanels;
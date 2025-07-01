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


// import { get, uniq, compact } from 'lodash';
// import moment from 'moment';

// // import { ReactMeteorData, useTracker } from 'meteor/react-meteor-data';
// import PropTypes from 'prop-types';

// import { Questionnaires } from '../../lib/schemas/SimpleSchemas/Questionnaires';

// import { Session } from 'meteor/session';



// let defaultQuestionnaire = {
//   "resourceType" : "Questionnaire"
// };

// // icons
// import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// import { Icon } from 'react-icons-kit'
// import { ic_reorder } from 'react-icons-kit/md/ic_reorder'


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


// function QuestionnaireDetailExpansionPanels(props){

//   let { 
//     children, 
//     selectedQuestionnaire,
//     selectedQuestionnaireId,
//     sortableItems,
//     ...otherProps 
//   } = props;

//   // console.log('QuestionnaireDetailExpansionPanels.selectedQuestionnaireId', selectedQuestionnaireId);
//   // console.log('QuestionnaireDetailExpansionPanels.selectedQuestionnaire', selectedQuestionnaire);

//   let [isSorting, setIsSorting] = useState(false);
//   let [currentQuestionnaire, setCurrentQuestionnaire] = useState(selectedQuestionnaire);
//   let [draftResponse, setDraftResponse] = useState(responseTemplate);


//   // ================================================================================
//   // Startup

//   useEffect(function(){
//     if(selectedQuestionnaire){

//       responseTemplate.questionnaire = "Questionnaire/" + selectedQuestionnaireId;
  
//       if(Array.isArray(selectedQuestionnaire.item)){
//         selectedQuestionnaire.item.forEach(function(item, index){
//           let answerItem = {
//             "linkId": get(item, 'linkId', index),
//             "text": get(item, 'text'),
//             "answer": []
//           }
  
//           responseTemplate.item.push(answerItem)
//         })
//       }
  
//       setDraftResponse(responseTemplate);
//     }
//   }, [])

//   useEffect(function(){
//     console.log('draftResponse[lastUpdated]', draftResponse)
//   }, [props.lastUpdated])


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

//   let questionnaireDocument;
//   let questions = [];

//   let questionPanels = [];

//   function handleToggleItem(currentLinkId, selectedValueCoding, event){
//     console.log('handleToggleItem', currentLinkId, selectedValueCoding)
//     console.log('draftResponse', draftResponse)

//     let newResponse = draftResponse;

//     if(Array.isArray(draftResponse.item)){
//       newResponse.item.forEach(function(responseItem){        
//         if(responseItem.linkId === currentLinkId){
//           responseItem.answer = [];
//           responseItem.answer.push({
//             valueCoding: selectedValueCoding
//           })
//         } 
//       })
//     }
    
//     console.log('newResponse', newResponse)
//     setDraftResponse(newResponse)

//     Session.set('lastUpdated', new Date())
//   }


//   function parseQuestion(renderItem){
//     console.log('Parsing questions', renderItem)
//     let answerChoices = [];

//     if(Array.isArray(renderItem.answerOption)){
//       // for each answer we render, we are going to need to figure out 
//     // if the answer has been selected
//     renderItem.answerOption.forEach(function(option, index){
//       console.log('QuestionnaireExpansionPanels.answerOptions', option)

//       let optionIsChecked = false;

//       answerChoices.push(<ListItem style={{paddingLeft: '120px'}} key={'answer-' + index}>
//           <ListItemIcon>
//             <Checkbox name="checkedDateRangeEnabled" checked={optionIsChecked} onChange={handleToggleItem.bind(this, get(renderItem, 'linkId'), get(option, 'valueCoding'))} />
//           </ListItemIcon>
//           <ListItemText>
//             { get(option, 'valueCoding.display') }
//           </ListItemText>
//         </ListItem>);
//       })
//     }

//     return answerChoices;
//   }

//   // Forms with Functional React Components
//   // Pros:  React internal state works really well
//   // Cons:  FHIR QuestionnaireResponses store answers in arrays
//   // Solution:  Helper methods (eventually)
//   // Kludge: In the meantime, we have this gnarly thing to deal with

//   // do we have question items to display in expansion panels
//   if(selectedQuestionnaire){
//     if(Array.isArray(selectedQuestionnaire.item)){
//       selectedQuestionnaire.item.forEach(function(renderItem, renderItemIndex){
//         console.log('QuestionnaireExpansionPanels.renderItem', renderItem)
  
//         let answerChoices = [];
  
        
//         // are we starting with section headers or actual questions
//         // looks like we have actual questions
//         if(Array.isArray(renderItem.answerOption)){
//           answerChoices = parseQuestion(renderItem);
  
//           questionPanels.push(<ExpansionPanel style={styles.expansionPanel} key={'expansionPanel-topLevel-' + renderItemIndex}>
//             <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />} aria-controls={'expansionPanel-topLevel-' + renderItemIndex + "-content"} id={'expansionPanel-topLevel-' + renderItemIndex + "-header"} >
//               <Typography className="measure-identifier" style={styles.identifier}>{get(renderItem, 'linkId', renderItemIndex)}</Typography>
//               {/* <Typography id="panel-m2-measure-score" className="measure-score" style={styles.score}>{get(item, 'type')}</Typography>             */}
//               <Typography className="measure-description" style={styles.description}>
//                 {get(renderItem, 'text')}
//               </Typography>
//             </ExpansionPanelSummary>
//             <ExpansionPanelDetails classNamex="measure-details" style={{display: 'block'}}>
//               <List>
//                 { answerChoices }
//               </List>
//             </ExpansionPanelDetails>
//           </ExpansionPanel>)   
  
//         } else if (Array.isArray(renderItem.item)){
  
//           // no answers options available, so assume we have section headers
//           renderItem.item.forEach(function(question, questionIndex){
//             console.log('QuestionnaireExpansionPanels.renderItem.question', question)
//             answerChoices = parseQuestion(question);
  
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

// QuestionnaireDetailExpansionPanels.propTypes = {
//   selectedQuestionnaire: PropTypes.object,
//   selectedQuestionnaireId: PropTypes.string,
//   sortableItems: PropTypes.array
// };

// QuestionnaireDetailExpansionPanels.defaultProps = {
//   sortableItems: [{
//     text: 'Sample Item 1',
//     linkId: 1
//   }, {
//     text: 'Sample Item 2',
//     linkId: 2
//   }, {
//     text: 'Sample Item 3',
//     linkId: 3
//   }, {
//     text: 'Sample Item 4',
//     linkId: 4
//   }, {
//     text: 'Sample Item 5',
//     linkId: 5
//   }, {
//     text: 'Sample Item 6',
//     linkId: 6
//   }],
//   selectedQuestionnaire: null
// }

// export default QuestionnaireDetailExpansionPanels;
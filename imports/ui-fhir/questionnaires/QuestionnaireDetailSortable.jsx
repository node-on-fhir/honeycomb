// import React, { useState, useEffect } from 'react';

// import { 
//   Button,
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableRow,
//   TablePagination,
//   List,
//   ListItem,
//   ListItemIcon,
//   ListItemText,
//   ListItemSecondaryAction,
//   FormControl,
//   InputLabel,
//   Input,
//   InputAdornment,
//   FormControlLabel
// } from '@mui/material';


// import { get, uniq, compact } from 'lodash';
// import moment from 'moment';

// import PropTypes from 'prop-types';
// import { useTracker } from 'meteor/react-meteor-data';

// import { Questionnaires } from '../../lib/schemas/SimpleSchemas/Questionnaires';

// import { Session } from 'meteor/session';
// import {
//   SortableContainer,
//   SortableElement,
//   arrayMove,
// } from 'react-sortable-hoc';


// let defaultQuestionnaire = {
//   "resourceType" : "Questionnaire"
// };


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



// function ListItemSwitch({value, isSorting, linkId}){
//     function selectedItem(linkId){
//       console.log("Clicked and selected an item", linkId);

//       let currentQuestionnaire = Questionnaires.findOne({_id: Session.get('selectedQuestionnaire')});
//       console.log("currentQuestionnaire", currentQuestionnaire);

//       let currentItem;
//       if (get(currentQuestionnaire, 'item')) {
//         currentQuestionnaire.item.forEach(function(item){
//           if(item.linkId === linkId){
//             currentItem = item;
//           }
//         });
//       }
         
//       Session.set('questionnaireDesignerCurrentQuestion', currentItem);
//       Session.set('activeQuestionLinkId', linkId);     
//     }
//     function removeItemFromQuestionnaire(linkId){
//       console.log("Removing item with linkId: ", linkId);   

//       if (Session.get("selectedQuestionnaire")) {
//         console.log("data.questionnaireId", Session.get('data.questionnaireId'));
  
//         let currentQuestionnaire = Questionnaires.findOne({_id: Session.get('selectedQuestionnaire')});
//         console.log("currentQuestionnaire", currentQuestionnaire);

//         let newArray = [];
//         if(currentQuestionnaire){
//           if(Array.isArray(currentQuestionnaire.item)){
//             currentQuestionnaire.item.forEach(function(item){
//               if(item.linkId !== linkId){
//                 newArray.push(item);
//               }
//             })
//           }
//         }

//         let count = 0;
//         newArray.forEach(function(item){
//           if(count === 0){
//             item.linkId = 1;
//           } else {
//             item.linkId = Random.id()
//           }
//           count++;
//         })
    
//         console.log('newArray', newArray);

//         Questionnaires.update({_id: Session.get('selectedQuestionnaire')}, {$set: {
//           item: newArray   
//         }});      
//       }

//       return; 
//     }

//     let rightIcon;

//     // console.log('ListItemSwitch.isSorting', isSorting)
//     // console.log('ListItemSwitch.linkId', linkId)
//     // console.log('ListItemSwitch.value', value)

//     if(isSorting){
//       rightIcon = <Icon icon={ic_reorder} style={{top: '15px', right: '15px'}} />;
//     } else {
//       rightIcon = <Icon icon={ic_reorder} style={{top: '15px', right: '15px'}} onClick={ removeItemFromQuestionnaire.bind(this, linkId) } />;
//     }
    

//     switch (value) {
//       case 'choice':
//         result = <ListItem 
//                   style={{padding: '5px', backgroundColor: 'cornflowerblue', borderRadius: '3px'}}
//                   primaryText={<p>{value}</p>}
//                   secondaryText={<p>{linkId}</p>}
//                   rightIconButton={rightIcon}
//                   onClick={ selectedItem.bind(this, linkId) }
//                   />          
//         break;
//       case 'update':
//         result = <ListItem 
//                   style={{padding: '5px', backgroundColor: 'yellow', borderRadius: '3px'}}
//                   primaryText={<p>{value}</p>}
//                   secondaryText={<p>{linkId}</p>}
//                   rightIconButton={rightIcon}
//                   onClick={ selectedItem.bind(this, linkId) }
//                   />
//         break;
//       case 'display':
//         result = <ListItem 
//                   style={{padding: '5px', backgroundColor: 'pink', borderRadius: '3px'}}
//                   primaryText={<p>{value}</p>}
//                   secondaryText={<p>{linkId}</p>}
//                   rightIconButton={rightIcon}
//                   onClick={ selectedItem.bind(this, linkId) }
//                   />
//         break;
//       case 'decimal':
//         result = <ListItem 
//                   style={{padding: '5px', backgroundColor: 'lavender', borderRadius: '3px'}}
//                   primaryText={<p>{value}</p>}
//                   secondaryText={<p>{linkId}</p>}
//                   rightIconButton={rightIcon}
//                   onClick={ selectedItem.bind(this, linkId) }
//                   />
//         break;
//       case 'response':
//         result = <ListItem 
//                   style={{padding: '5px', backgroundColor: 'lightgray', borderRadius: '3px'}}
//                   primaryText={<p>{value}</p>}
//                   secondaryText={<p>{linkId}</p>}
//                   onClick={ selectedItem.bind(this, linkId) }
//                   />
//         break;  
//       default:
//         result = <ListItem 
//                   style={sortableItemStyle}
//                   rightIconButton={rightIcon}                  
//                   onClick={ selectedItem.bind(this, linkId) }
//                   className="listItem"
//                   >
//                   {/* <ListItemIcon>{rightIcon}</ListItemIcon> */}
//                   <ListItemText className="listItemText">{value}</ListItemText>
//                 </ListItem>
//         break;
//     }  

//   return result;
// }
// const SortableItem = SortableElement(ListItemSwitch);


// const SortableList = SortableContainer(({items, isSorting}) => {
//   console.log('SortableContainer', items)

//   return (
//     <List style={{cursor: 'pointer', listStyleType: 'none'}}>
//       {items.map(function(value, index){
//         let displayedText = '';

//         if(typeof value === "string"){
//           displayedText = value;
//         } else if(typeof value === "object"){
//           displayedText = get(value, 'text', "");
//         }

//         // console.log('SortableList.displayedText', displayedText);
//         // console.log('SortableList.isSorting', isSorting)

//         let result;
//         if(isSorting){
//           result = <SortableItem key={`item-${index}`} value={displayedText} index={index} isSorting={isSorting} linkId={get(value, 'linkId', "")} />
//         } else {
//           result = <ListItemSwitch key={`item-${index}`} value={displayedText} index={index} isSorting={isSorting} linkId={get(value, 'linkId', "")} />
//         }

//         return result;
//       })}
//     </List>
//   );
// });



// // ====================================================================================================================
// // Session Variables  
// Session.setDefault('questionnaireUpsert', false);
// Session.setDefault('selectedQuestionnaire', false);
// Session.setDefault('sortableItems', []);


// // ====================================================================================================================
// // Main Component  


// function QuestionnaireDetailSortable(props){

//   let { 
//     children, 
//     selectedQuestionnaire,
//     selectedQuestionnaireId,
//     sortableItems,
//     ...otherProps 
//   } = props;

//   // console.log('QuestionnaireDetailSortable.selectedQuestionnaireId', selectedQuestionnaireId);
//   // console.log('QuestionnaireDetailSortable.selectedQuestionnaire', selectedQuestionnaire);


//   const [isSorting, setIsSorting] = useState(false);
//   const [currentQuestionnaire, setCurrentQuestionnaire] = useState(selectedQuestionnaire);
//   const [itemSortOrder, setItemSortOrder] = useState(sortableItems);  


//   function onSortEnd({oldIndex, newIndex}){
//     // this.setState(({items}) => ({
//     //   items: arrayMove(items, oldIndex, newIndex),
//     // }));

//     setItemSortOrder(arrayMove(items, oldIndex, newIndex));

//     Session.set('editedQuestionnaire', {
//       questionnaireId: Session.get('selectedQuestionnaire'),
//       items: arrayMove(items, oldIndex, newIndex)
//     })
//   }

//   // function determineButtons(questionnaireId){
//   //   if (questionnaireId) {
//   //     return (
//   //       <div>
//   //         <Button id='saveQuestionnaireButton' className='saveQuestionnaireButton' primary={true} onClick={this.handleSaveButton.bind(this)} style={{marginRight: '20px'}} >Save</Button>
//   //         <Button onClick={this.handleDeleteButton.bind(this)} >Delete</Button>
//   //       </div>
//   //     );
//   //   } else {
//   //     return(
//   //       <Button id='saveQuestionnaireButton' className='saveQuestionnaireButton' primary={true} onClick={this.handleSaveButton.bind(this)} >Save</Button>
//   //     );
//   //   }
//   // }


//   // // this could be a mixin
//   // function handleSaveButton(){
//   //   if(process.env.NODE_ENV === "test") console.log('handleSaveButton()');
//   //   let questionnaireUpdate = Session.get('questionnaireUpsert', questionnaireUpdate);


//   //   if (questionnaireUpdate.birthDate) {
//   //     questionnaireUpdate.birthDate = new Date(questionnaireUpdate.birthDate);
//   //   }
//   //   if(process.env.NODE_ENV === "test") console.log("questionnaireUpdate", questionnaireUpdate);

//   //   if (Session.get('selectedQuestionnaire')) {
//   //     if(process.env.NODE_ENV === "test") console.log("Updating questionnaire...");

//   //     delete questionnaireUpdate._id;

//   //     // not sure why we're having to respecify this; fix for a bug elsewhere
//   //     questionnaireUpdate.resourceType = 'Questionnaire';

//   //     Questionnaires.update({_id: Session.get('selectedQuestionnaire')}, {$set: questionnaireUpdate }, function(error, result){
//   //       if (error) {
//   //         if(process.env.NODE_ENV === "test") console.log("Questionnaires.insert[error]", error);
//   //         // Bert.alert(error.reason, 'danger');
//   //       }
//   //       if (result) {
//   //         HipaaLogger.logEvent({eventType: "update", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Questionnaires", recordId: Session.get('selectedQuestionnaire')});
//   //         Session.set('questionnaireUpsert', false);
  
//   //         Session.set('questionnairePageTabIndex', 1);
//   //       }
//   //     });
//   //   } else {
//   //     if(process.env.NODE_ENV === "test") console.log("Creating a new questionnaire...", questionnaireUpdate);

//   //     Questionnaires.insert(questionnaireUpdate, function(error, result) {
//   //       if (error) {
//   //         if(process.env.NODE_ENV === "test")  console.log('Questionnaires.insert[error]', error);
//   //       }
//   //       if (result) {
//   //         HipaaLogger.logEvent({eventType: "create", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Questionnaires", recordId: result});
//   //         Session.set('questionnairePageTabIndex', 1);

//   //         Session.set('questionnaireUpsert', false);
//   //       }
//   //     });
//   //   }
//   // }

//   // function handleCancelButton(){
//   //   Session.set('questionnairePageTabIndex', 1);
//   // }

//   // function handleDeleteButton(){
//   //   Questionnaires.remove({_id: Session.get('selectedQuestionnaire')}, function(error, result){
//   //     if (error) {
//   //       if(process.env.NODE_ENV === "test") console.log('Questionnaires.insert[error]', error);
//   //       // Bert.alert(error.reason, 'danger');
//   //     }
//   //     if (result) {
//   //       HipaaLogger.logEvent({eventType: "delete", userId: Meteor.userId(), userName: Meteor.user().fullName(), collectionName: "Questionnaires", recordId: Session.get('selectedQuestionnaire')});
//   //       // Session.set('questionnaireUpdate', defaultQuestionnaire);
//   //       Session.set('questionnaireUpsert', false);
//   //       Session.set('questionnairePageTabIndex', 1);

//   //       // Bert.alert('Questionnaire removed!', 'success');
//   //     }
//   //   });
//   // }


//   let questionnaireDocument;
//   let questions = [];

//   return (
//     <div id={ get(this, 'props.id', '')} className="questionnaireDetail">
//       <div id='questionnaireDocument'>
//         <SortableList items={itemSortOrder} onSortEnd={onSortEnd} isSorting={isSorting}  />
//       </div>
//     </div>
//   );
// }

// QuestionnaireDetailSortable.propTypes = {
//   selectedQuestionnaire: PropTypes.object,
//   selectedQuestionnaireId: PropTypes.string,
//   sortableItems: PropTypes.array
// };

// QuestionnaireDetailSortable.defaultProps = {
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
//   }]
// }

// export default QuestionnaireDetailSortable;
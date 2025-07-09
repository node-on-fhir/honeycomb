// =======================================================================
// Using STU3  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//
// https://www.hl7.org/fhir/STU3/task.html
//
//
// =======================================================================

import React from 'react';
import PropTypes from 'prop-types';

import { useTracker } from 'meteor/react-meteor-data';

import { 
  Button,
  Card,
  Checkbox,
  CardActions,
  CardContent,
  CardHeader,
  Grid,
  TextField,
  Select,
  MenuItem,
} from '@mui/material';

import { get, set } from 'lodash';

  
export class TaskDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      taskId: false,
      task: {
        resourceType: "Task",
        status: "requested",
        intent: "order",
        priority: "routine",
        description: "",
        for: {
          reference: "",
          display: ""
        },
        owner: {
          reference: "",
          display: ""
        },
        requester: {
          reference: "",
          display: ""
        },
        businessStatus: {
          text: ""
        },
        lastModified: null,
        authoredOn: null
      }, 
      form: {
        patientDisplay: '',
        ownerDisplay: '',
        requesterDisplay: '',
        status: 'requested',
        intent: 'order',
        priority: 'routine',
        description: '',
        businessStatus: '',
        lastModified: '',
        authoredOn: ''
      }
    }
  }
  dehydrateFhirResource(task) {
    let formData = Object.assign({}, this.state.form);

    formData.patientDisplay = get(task, 'for.display')
    formData.ownerDisplay = get(task, 'owner.display')
    formData.requesterDisplay = get(task, 'requester.display')    
    formData.status = get(task, 'status')
    formData.intent = get(task, 'intent')
    formData.priority = get(task, 'priority')
    formData.description = get(task, 'description')
    formData.businessStatus = get(task, 'businessStatus.text')
    formData.lastModified = get(task, 'lastModified')
    formData.authoredOn = get(task, 'authoredOn')

    return formData;
  }
  shouldComponentUpdate(nextProps){
    get(Meteor, 'settings.public.logging') === "debug" && console.log('TaskDetail.shouldComponentUpdate()', nextProps, this.state)
    let shouldUpdate = true;

    // received an task from the table; okay lets update again
    if(nextProps.taskId !== this.state.taskId){
      
      if(nextProps.task){
        this.setState({task: nextProps.task})     
        this.setState({form: this.dehydrateFhirResource(nextProps.task)})       
      }

      this.setState({taskId: nextProps.taskId})
      shouldUpdate = true;
    }

    // both false; don't take any more updates
    if(nextProps.task === this.state.task){
      shouldUpdate = false;
    }
 
    return shouldUpdate;
  }

  getMeteorData() {
    let data = {
      taskId: this.props.taskId,
      task: false,
      showDatePicker: false,
      form: this.state.form
    };

    if(this.props.showDatePicker){
      data.showDatePicker = this.props.showDatePicker
    }
    if(this.props.task){
      data.task = this.props.task;
      data.form = this.dehydrateFhirResource(this.props.task);
    }

    return data;
  }
  renderDatePicker(showDatePicker, form){
    let datePickerValue;

    if(get(form, 'authoredOn')){
      datePickerValue = get(form, 'authoredOn');
    }
    if (typeof datePickerValue === "string"){
      datePickerValue = new Date(datePickerValue);
    }
    if (showDatePicker) {
      return (<div></div>)
      // return (
      //   <DatePicker 
      //     name='authoredOn'
      //     hintText="Authored On" 
      //     container="inline" 
      //     mode="landscape"
      //     value={ datePickerValue ? datePickerValue : null }    
      //     onChange={ this.changeState.bind(this, 'authoredOn')}      
      //     />
      // );      
    }
  }
  setHint(text){
    if(this.props.showHints !== false){
      return text;
    } else {
      return '';
    }
  }
  render() {
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('TaskDetail.render()', this.state)

    return (
      <div id={this.props.id} className="taskDetail">
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={6}>
              <TextField
                id='patientDisplayInput'
                name='patientDisplay'
                label='Patient'
                value={ get(this, 'data.form.patientDisplay', '') }
                onChange={ this.changeState.bind(this, 'patientDisplay')}
                hintText={ this.setHint('Jane Doe') }
                //floatingLabelFixed={true}
                fullWidth
                /><br/>

              <TextField
                id='ownerDisplayInput'
                name='ownerDisplay'
                label='Owner'
                value={ get(this, 'data.form.ownerDisplay', '') }
                onChange={ this.changeState.bind(this, 'ownerDisplay')}
                hintText={ this.setHint('Dr. Smith') }
                //floatingLabelFixed={true}
                fullWidth
                /><br/>

              <TextField
                id='requesterDisplayInput'
                name='requesterDisplay'
                label='Requester'
                value={ get(this, 'data.form.requesterDisplay', '') }
                onChange={ this.changeState.bind(this, 'requesterDisplay')}
                hintText={ this.setHint('Dr. Jones') }
                //floatingLabelFixed={true}
                fullWidth
                /><br/>

              <TextField
                id='descriptionInput'
                name='description'
                label='Description'
                value={ get(this, 'data.form.description', '') }
                onChange={ this.changeState.bind(this, 'description')}
                hintText={ this.setHint('Task description') }
                //floatingLabelFixed={true}
                fullWidth
                multiline
                rows={3}
                /><br/>

              <TextField
                id='statusInput'
                name='status'
                label='Status'
                value={ get(this, 'data.form.status', '') }
                hintText={ this.setHint('requested | received | accepted | rejected | ready | cancelled | in-progress | on-hold | failed | completed | entered-in-error') }
                onChange={ this.changeState.bind(this, 'status')}
                //floatingLabelFixed={true}
                fullWidth
                /><br/>

              <TextField
                id='priorityInput'
                name='priority'
                label='Priority'
                value={ get(this, 'data.form.priority', '') }
                hintText={ this.setHint('routine | urgent | asap | stat') }
                onChange={ this.changeState.bind(this, 'priority')}
                //floatingLabelFixed={true}
                fullWidth
                /><br/>

              <TextField
                id='intentInput'
                name='intent'
                label='Intent'
                value={ get(this, 'data.form.intent', '') }
                hintText={ this.setHint('proposal | plan | order | original-order | reflex-order | filler-order | instance-order | option') }
                onChange={ this.changeState.bind(this, 'intent')}
                //floatingLabelFixed={true}
                fullWidth
                /><br/>

              <TextField
                id='businessStatusInput'
                name='businessStatus'
                label='Business Status'
                value={ get(this, 'data.form.businessStatus', '') }
                hintText={ this.setHint('Custom workflow status') }
                onChange={ this.changeState.bind(this, 'businessStatus')}
                //floatingLabelFixed={true}
                fullWidth
                /><br/>
            </Grid>
            <Grid item xs={6}>
            </Grid>
          </Grid>

          <br/>
          { this.renderDatePicker(this.data.showDatePicker, get(this, 'data.form') ) }
          <br/>

        </CardContent>
        <CardActions>
          { this.determineButtons(this.state.taskId) }
        </CardActions>
      </div>
    );
  }

  determineButtons(taskId){
    if (taskId) {
      return (
        <div>
          <Button id="updateTaskButton" primary={true} onClick={this.handleSaveButton.bind(this)} style={{marginRight: '20px'}} >Save</Button>
          <Button id="deleteTaskButton" onClick={this.handleDeleteButton.bind(this)} >Delete</Button>
        </div>
      );
    } else {
      return(
        <Button id="saveTaskButton" primary={true} onClick={this.handleSaveButton.bind(this)} >Save</Button>
      );
    }
  }


  updateFormData(formData, field, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("TaskDetail.updateFormData", formData, field, textValue);

    switch (field) {
      case "patientDisplay":
        set(formData, 'patientDisplay', textValue)
        break;
      case "ownerDisplay":
        set(formData, 'ownerDisplay', textValue)
        break;
      case "requesterDisplay":
        set(formData, 'requesterDisplay', textValue)
        break;        
      case "status":
        set(formData, 'status', textValue)
        break;
      case "intent":
        set(formData, 'intent', textValue)
        break;
      case "priority":
        set(formData, 'priority', textValue)
        break;
      case "description":
        set(formData, 'description', textValue)
        break;
      case "businessStatus":
        set(formData, 'businessStatus', textValue)
        break;
      case "lastModified":
        set(formData, 'lastModified', textValue)
        break;
      case "authoredOn":
        set(formData, 'authoredOn', textValue)
        break;
      default:
    }

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("formData", formData);
    return formData;
  }
  updateTask(taskData, field, textValue){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("TaskDetail.updateTask", taskData, field, textValue);

    switch (field) {
      case "patientDisplay":
        set(taskData, 'for.display', textValue)
        break;
      case "ownerDisplay":
        set(taskData, 'owner.display', textValue)
        break;
      case "requesterDisplay":
        set(taskData, 'requester.display', textValue)
        break;
      case "status":
        set(taskData, 'status', textValue)
        break;
      case "intent":
        set(taskData, 'intent', textValue)
        break;
      case "priority":
        set(taskData, 'priority', textValue)
        break;
      case "description":
        set(taskData, 'description', textValue)
        break;
      case "businessStatus":
        set(taskData, 'businessStatus.text', textValue)
        break;  
      case "lastModified":
        set(taskData, 'lastModified', textValue)
        break;
      case "authoredOn":
        set(taskData, 'authoredOn', textValue)
        break;
      case "datePicker":
        set(taskData, 'authoredOn', textValue)
        break;
  
    }
    return taskData;
  }
  componentDidUpdate(props){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('TaskDisplay.componentDidUpdate()', props, this.state)
  }
  // this could be a mixin
  changeState(field, event, textValue){

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("   ");
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("TaskDetail.changeState", field, textValue);
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("this.state", this.state);

    let formData = Object.assign({}, this.state.form);
    let taskData = Object.assign({}, this.state.task);

    formData = this.updateFormData(formData, field, textValue);
    taskData = this.updateTask(taskData, field, textValue);

    if(get(Meteor, 'settings.public.logging') === "debug") console.log("taskData", taskData);
    if(get(Meteor, 'settings.public.logging') === "debug") console.log("formData", formData);

    this.setState({task: taskData})
    this.setState({form: formData})

  }

  handleSaveButton(){
    if(get(Meteor, 'settings.public.logging') === "debug") console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^&&')
    console.log('Saving a new Task...', this.state)

    let self = this;
    let fhirTaskData = Object.assign({}, this.state.task);

    if(get(Meteor, 'settings.public.logging') === "debug") console.log('fhirTaskData', fhirTaskData);


    let taskValidator = TaskSchema.newContext();
    taskValidator.validate(fhirTaskData)

    console.log('IsValid: ', taskValidator.isValid())
    console.log('ValidationErrors: ', taskValidator.validationErrors());

    if (this.state.taskId) {
      if(get(Meteor, 'settings.public.logging') === "debug") console.log("Updating Task...");
      delete fhirTaskData._id;

      Tasks._collection.update(
        {_id: this.state.taskId}, {$set: fhirTaskData }, function(error, result) {
          if (error) {
            console.log("error", error);
            // Bert.alert(error.reason, 'danger');
          }
          if (result) {
            if(self.props.onUpdate){
              self.props.onUpdate(self.data.taskId);
            }
            // Bert.alert('Task updated!', 'success');
          }
        });
    } else {

      if(get(Meteor, 'settings.public.logging') === "debug") console.log("Create a new Task", fhirTaskData);

      Tasks._collection.insert(fhirTaskData, function(error, result) {
        if (error) {
          console.log("error", error);
          // Bert.alert(error.reason, 'danger');
        }
        if (result) {
          if(self.props.onInsert){
            self.props.onInsert(self.data.taskId);
          }
          // Bert.alert('Task added!', 'success');
        }
      });
    }
  }

  handleCancelButton(){
    if(this.props.onCancel){
      this.props.onCancel();
    }
  }

  handleDeleteButton(){
    console.log('TaskDetail.handleDeleteButton()', this.state.taskId)

    let self = this;
    Tasks._collection.remove({_id: this.state.taskId}, function(error, result){
      if (error) {
        // Bert.alert(error.reason, 'danger');
      }
      if (result) {
        if(this.props.onInsert){
          this.props.onInsert(self.data.taskId);
        }
        // Bert.alert('Task removed!', 'success');
      }
    });
  }
}

TaskDetail.propTypes = {
  id: PropTypes.string,
  taskId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  task: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  showDatePicker: PropTypes.bool,
  showHints: PropTypes.bool,
  onInsert: PropTypes.func,
  onUpdate: PropTypes.func,
  onRemove: PropTypes.func,
  onCancel: PropTypes.func
};

export default TaskDetail;
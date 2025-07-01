import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';

import { 
  Card,
  CardContent, 
  CardHeader,
  Container,
  Grid
} from '@mui/material';


// import QuestionnaireResponseDetail from './QuestionnaireResponseDetail';
import QuestionnaireResponsesTable from './QuestionnaireResponsesTable';
import LayoutHelpers from '../../lib/LayoutHelpers';

import { Session } from 'meteor/session';

import { get } from 'lodash';

import SurveyResponseSummary from './SurveyResponseSummary';


//===========================================================================

Meteor.startup(function(){
  Questionnaires = Meteor.Collections.Questionnaires;
  QuestionnaireResponses = Meteor.Collections.QuestionnaireResponses;
})

//===============================================================================================================
// Session Variables

Session.setDefault('questionnaireResponseFormData', null);
Session.setDefault('questionnaireResponseSearchFilter', '');
Session.setDefault('selectedQuestionnaireResponse', null);
Session.setDefault('selectedQuestionnaireResponseId', '');

Session.setDefault('QuestionnaireResponsesPage.onePageLayout', false)
Session.setDefault('QuestionnaireResponsesPage.defaultQuery', {})
Session.setDefault('QuestionnaireResponsesTable.hideCheckbox', true)
Session.setDefault('QuestionnaireResponsesTable.questionnaireResponsesIndex', 0)


//===============================================================================================================
// Global Theming 
// This is necessary for the Material UI component render layer

let theme = {
  primaryColor: "rgb(177, 128, 13)",
  primaryText: "rgba(255, 255, 255, 1) !important",

  secondaryColor: "rgb(177, 128, 13)",
  secondaryText: "rgba(255, 255, 255, 1) !important",

  cardColor: "rgba(255, 255, 255, 1) !important",
  cardTextColor: "rgba(0, 0, 0, 1) !important",

  errorColor: "rgb(128,20,60) !important",
  errorText: "#ffffff !important",

  appBarColor: "#f5f5f5 !important",
  appBarTextColor: "rgba(0, 0, 0, 1) !important",

  paperColor: "#f5f5f5 !important",
  paperTextColor: "rgba(0, 0, 0, 1) !important",

  backgroundCanvas: "rgba(255, 255, 255, 1) !important",
  background: "linear-gradient(45deg, rgb(177, 128, 13) 30%, rgb(150, 202, 144) 90%)",

  nivoTheme: "greens"
}

// if we have a globally defined theme from a settings file
if(get(Meteor, 'settings.public.theme.palette')){
  theme = Object.assign(theme, get(Meteor, 'settings.public.theme.palette'));
}


export function QuestionnaireResponsesPage(props){


  let data = {
    selectedQuestionnaireResponseId: '',
    selectedQuestionnaireResponse: null,
    questionnaireResponses: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    organizationsIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('QuestionnaireResponsesPage.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('QuestionnaireResponsesTable.hideCheckbox');
  }, [])

  data.selectedQuestionnaireResponseId = useTracker(function(){
    return Session.get('selectedQuestionnaireResponseId');
  }, [])
  data.selectedQuestionnaireResponse = useTracker(function(){
    return QuestionnaireResponses.findOne({id: Session.get('selectedQuestionnaireResponseId')});
  }, [])
  data.questionnaireResponses = useTracker(function(){
    return QuestionnaireResponses.find().fetch();
  }, [])
  data.questionnaireResponseSearchFilter = useTracker(function(){
    return Session.get('questionnaireResponseSearchFilter');
  }, [])
  data.questionnaireResponsesIndex = useTracker(function(){
    return Session.get('QuestionnaireResponsesTable.questionnaireResponsesIndex')
  }, [])
  data.showSystemIds = useTracker(function(){
    return Session.get('showSystemIds');
  }, [])
  data.showFhirIds = useTracker(function(){
    return Session.get('showFhirIds');
  }, [])



  function onRowChecked(questionnaire, event, toggle){
    console.log('onRowChecked', questionnaire, toggle);
    let newStatus = 'draft';

    if(toggle){
      newStatus = 'active';
    } else {
      newStatus = 'draft';
    }

    Questionnaires._collection.update({_id: questionnaire._id}, {$set: {
      'status': newStatus
    }}, function(error, result){
      if(error){
        console.error('Questionnaire Error', error);
      }
    });
  }
  function onSend(id){
    let patient = QuestionnaireResponses.findOne({_id: id});

    console.log("QuestionnaireResponsesTable.onSend()", patient);

    var httpEndpoint = "http://localhost:8080";
    if (get(Meteor, 'settings.public.interfaces.default.channel.endpoint')) {
      httpEndpoint = get(Meteor, 'settings.public.interfaces.default.channel.endpoint');
    }
    HTTP.post(httpEndpoint + '/QuestionnaireResponse', {
      data: patient
    }, function(error, result){
      if (error) {
        console.log("error", error);
      }
      if (result) {
        console.log("result", result);
      }
    });
  }


  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();


  let cardWidth = window.innerWidth - paddingWidth;
  let noDataImage = get(Meteor, 'settings.public.defaults.noData.noDataImagePath', "packages/clinical_hl7-fhir-data-infrastructure/assets/NoData.png");  


  let layoutContent;
  
  
  let layoutContainer;
  if(data.questionnaireResponses.length > 0){
    if(data.onePageLayout){
      layoutContent = <Card height="auto" margin={20} width={cardWidth + 'px'} style={{marginLeft: '20px', marginRight: '20px'}}>
        <CardHeader title={data.questionnaireResponses.length + " Questionnaire Responses"} />
        <CardContent>
          <QuestionnaireResponsesTable 
            questionnaireResponses={data.questionnaireResponses}
            count={data.questionnaireResponses.length}
            onCellClick={function(responseId){
              console.log('responseId', responseId)
              Session.set('selectedQuestionnaireResponse', responseId)
              Session.set('questionnaireResponsePageTabIndex', 2)
            }}
            onRemoveRecord={function(responseId){
              console.log('onRemoveRecord()')
              QuestionnaireResponses.remove({_id: responseId});                      
            }}
            onRowClick={function(responseId){
              console.log('onRowClick()', responseId)
              Session.set('selectedQuestionnaireResponseId', responseId);                  
              Session.set('selectedQuestionnaireResponse', QuestionnaireResponses.findOne(responseId));                  
            }}
            onSetPage={function(index){
              setQuestionaireResponsesIndex(index)
            }}  
            page={data.questionaireResponsesIndex}
            formFactorLayout={formFactor}
            rowsPerPage={ LayoutHelpers.calcTableRows("medium",  props.appHeight) }
            size="medium"
            />
        </CardContent>
      </Card>
    } else {
      layoutContent = <Grid container spacing={3}>
        <Grid item lg={6} style={{width: '100%'}} >
          <Card height="auto" margin={20} width={cardWidth + 'px'}>
            <CardHeader title={data.questionnaireResponses.length + " Responses"} />
            <CardContent>
              <QuestionnaireResponsesTable 
                questionnaireResponses={data.questionnaireResponses}
                count={data.questionnaireResponses.length}
                onCellClick={function(responseId){
                  console.log('responseId', responseId)
                  Session.set('selectedQuestionnaireResponse', responseId)
                  Session.set('selectedQuestionnaireResponseId', responseId)
                  Session.set('questionnaireResponsePageTabIndex', 2)
                }}
                onRemoveRecord={function(responseId){
                  console.log('onRemoveRecord()')
                  QuestionnaireResponses.remove({_id: responseId});                      
                }}
                onRowClick={function(responseId){
                  console.log('onRowClick()', responseId)
                  Session.set('selectedQuestionnaireResponseId', responseId);                  
                  Session.set('selectedQuestionnaireResponse', QuestionnaireResponses._collection.findOne({id: responseId}));                  
                }}
                onSetPage={function(index){
                  setQuestionaireResponsesIndex(index)
                }}  
                page={data.questionaireResponsesIndex}
                formFactorLayout={formFactor}
                rowsPerPage={ LayoutHelpers.calcTableRows("medium",  props.appHeight) }
                size="medium"
                  />
            </CardContent>
          </Card>
        </Grid>
        <Grid item lg={5} style={{width: '100%', marginBottom: '80px'}} >
          <Card height="auto" margin={20} width={cardWidth + 'px'}>
            <h1 className="barcode" style={{fontWeight: 100}}>{data.questionnaireResponseId }</h1>
            <CardContent>
              <CardContent>
                {/* <code>
                  {JSON.stringify(data.questionnaireResponse)}
                </code> */}
  
                <SurveyResponseSummary 
                  id='surveyResponseSummary' 
                  selectedResponse={get(data, 'selectedQuestionnaireResponse', null)} 
                  selectedResponseId={get(data, 'selectedQuestionnaireResponse.id', '')}
                  />
  
              </CardContent>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    }
  } else {
    layoutContent = <Container maxWidth="sm" style={{display: 'flex', flexDirection: 'column', flexWrap: 'nowrap', height: '100%', justifyContent: 'center'}}>
      {/* <img src={Meteor.absoluteUrl() + noDataImage} style={{width: '100%'}}  /> */}
      <CardContent>
        <CardHeader 
          title={get(Meteor, 'settings.public.defaults.noData.defaultTitle', "No Data Available")} 
          subheader={get(Meteor, 'settings.public.defaults.noData.defaultMessage', "No records were found in the client data cursor.  To debug, check the data cursor in the client console, then check subscriptions and publications, and relevant search queries.  If the data is not loaded in, use a tool like Mongo Compass to load the records directly into the Mongo database, or use the FHIR API interfaces.")} 
        />
      </CardContent>
    </Container>
  }


  return (
    <div id="questionnaireResponsesPage" style={{padding: "20px"}} >
      { layoutContent }
    </div>
  );
}



export default QuestionnaireResponsesPage;
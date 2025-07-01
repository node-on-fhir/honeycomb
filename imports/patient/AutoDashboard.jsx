// yes, yes... this is a Class component, instead of a Pure Function
// TODO:  refactor into a <PatientDataQuery /> pure function with hooks, effect, and context

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { useLocation, useParams, useHistory, useNavigate } from "react-router-dom";

import React, {useEffect, useContext, useState} from "react";
import { FhirClientContext } from "../FhirClientContext";


import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';

import { useTracker } from 'meteor/react-meteor-data';


import ImmunizationsTable from '../ui-tables/ImmunizationsTable';
import CarePlansTable from '../ui-tables/CarePlansTable';
import CareTeamsTable from '../ui-tables/CareTeamsTable';
import LocationsTable from '../ui-tables/LocationsTable';
import EncountersTable from '../ui-tables/EncountersTable';
import ProceduresTable from '../ui-tables/ProceduresTable';
import ConditionsTable from '../ui-tables/ConditionsTable';
import ObservationsTable from '../ui-tables/ObservationsTable';
import ConsentsTable from '../ui-tables/ConsentsTable';
import QuestionnairesTable from '../ui-tables/QuestionnairesTable';
import QuestionnaireResponsesTable from '../ui-tables/QuestionnaireResponsesTable';


import { CarePlans } from '../lib/schemas/SimpleSchemas/CarePlans';
import { CareTeams } from '../lib/schemas/SimpleSchemas/CareTeams';
import { Consents } from '../lib/schemas/SimpleSchemas/Consents';
import { Conditions } from '../lib/schemas/SimpleSchemas/Conditions';
import { Encounters } from '../lib/schemas/SimpleSchemas/Encounters';
import { Immunizations } from '../lib/schemas/SimpleSchemas/Immunizations';
import { Locations } from '../lib/schemas/SimpleSchemas/Locations';
import { Observations } from '../lib/schemas/SimpleSchemas/Observations';
import { Patients } from '../lib/schemas/SimpleSchemas/Patients';
import { Procedures } from '../lib/schemas/SimpleSchemas/Procedures';
import { Questionnaires } from '../lib/schemas/SimpleSchemas/Questionnaires';
import { QuestionnaireResponses } from '../lib/schemas/SimpleSchemas/QuestionnaireResponses';

import { get } from 'lodash';

import PatientCard from './PatientCard';
import FhirUtilities from '../FhirUtilities';
import NoDataWrapper from '../ui/NoDataWrapper';



export function AutoDashboard(props){
    logger.info('Rendering the AutoDashboard');
    logger.verbose('app.AutoDashboard');
    logger.data('AutoDashboard.props', {data: props}, {source: "AutoDashboard.jsx"});


    const client = useContext(FhirClientContext);

    let chartWidth = (window.innerWidth - 240) / 3;

    let data = {
        careTeams: [],
        carePlans: [],
        encounters: [],
        procedures: [],
        conditions: [],
        consents: [],
        observations: [],
        locations: [],
        immunizations: [],
        selectedPatientId: '',
        selectedPatient: null,
        patients: [],
        questionnaires: [],
        questionnaireResponses: [],
        quickchartTabIndex: 0,
        basicQuery: {}
    }

    data.selectedPatientId = useTracker(function(){
        return Session.get('selectedPatientId');
    }, []);
    data.selectedPatient = useTracker(function(){
        if(Session.get('selectedPatientId')){
            return Patients.findOne({id: Session.get('selectedPatientId')});
        } else if(get(Session.get('currentUser'), 'patientId')){
            return Patients.findOne({id: get(Session.get('currentUser'), 'patientId')});
        }   
    }, []);
    data.patients = useTracker(function(){
        return Patients.find().fetch();
    }, []);

    let [careTeamsPage, setCareTeamsPage] = useState(0);
    let [carePlansPage, setCarePlansPage] = useState(0);
    let [encountersPage, setEncountersPage] = useState(0);
    let [proceduresPage, setProceduresPage] = useState(0);
    let [conditionsPage, setConditionsPage] = useState(0);
    let [consentsPage,   setConsentsPage] = useState(0);
    let [observationsPage, setObservationsPage] = useState(0);
    let [locationsPage, setLocationsPage] = useState(0);
    let [immunizationsPage, setImmunizationsPage] = useState(0);
    let [patientsPage, setPatientsPage] = useState(0);
    let [questionnairesPage, setQuestionnairesPage] = useState(0);
    let [questionnaireResponsesPage, setQuestionnaireResponsesPage] = useState(0);

    data.selectedPatientId = useTracker(function(){
        return Session.get('selectedPatientId');
    }, []);
    data.selectedPatient = useTracker(function(){
        if(Session.get('selectedPatientId')){
            return Patients.findOne({id: Session.get('selectedPatientId')});
        } else if(get(Session.get('currentUser'), 'patientId')){
            return Patients.findOne({id: get(Session.get('currentUser'), 'patientId')});
        }   
    }, []);
    data.patients = useTracker(function(){
        return Patients.find().fetch();
    }, []);

    data.quickchartTabIndex = useTracker(function(){
        return Session.get('quickchartTabIndex')
    }, []);

    data.careTeamTabIndex = useTracker(function(){
        return Session.get('careTeamTabIndex')
    }, []);
    data.carePlanTabIndex = useTracker(function(){
        return Session.get('carePlanTabIndex')
    }, []);

    console.log('Autodashboard.data.selectedPatientId', data.selectedPatientId)


    // function FhirUtilities.addPatientFilterToQuery(patientId){
    //     let newQUery = {};

    //     if(patientId){
    //         newQUery = {$or: [
    //             {"patient.reference": "Patient/" + patientId},
    //             {"patient.reference": "urn:uuid:Patient/" + patientId},
    //             {"patient.reference": { $regex: ".*Patient/" + patientId}}, 
    //             {"subject.reference": { $regex: ".*Patient/" + patientId}}  
    //         ]}      
    //     } else {
    //         newQUery = {$or: [
    //             {"patient.reference": "Patient/anybody"},
    //             {"patient.reference": "urn:uuid:Patient/anybody"},
    //             {"patient.reference": { $regex: ".*Patient/anybody"}}, 
    //             {"subject.reference": { $regex: ".*Patient/anybody"}}  
    //           ]}
    //     }

    //     return newQUery
    // }

    data.basicQuery = useTracker(function(){
        return FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'));
    }, []);
    
    
    


    console.log('Autodashboard.basicQuery', data.basicQuery)

    if(CareTeams){
        data.careTeams = useTracker(function(){
            return CareTeams.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
        }, [])    
    }
    if(CarePlans){
        data.carePlans = useTracker(function(){
            return CarePlans.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
        }, [])    
    }
    if(Consents){
        data.consents = useTracker(function(){
            return Consents.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
        }, [])    
    }
    if(Conditions){
        data.conditions = useTracker(function(){
            return Conditions.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
        }, [])    
    }
    if(Encounters){
        data.encounters = useTracker(function(){
            return Encounters.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
        }, [])   
    }
    if(Immunizations){
        data.immunizations = useTracker(function(){
            return Immunizations.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
        }, [])   
    }
    if(Locations){
        data.locations = useTracker(function(){
            return Locations.find().fetch()
        }, [])   
    }
    if(Procedures){
        data.procedures = useTracker(function(){
            return Procedures.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
        }, [])   
    }
    if(Observations){
        data.observations = useTracker(function(){
            return Observations.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
        }, [])   
    }

    if(Questionnaires){
        data.questionnaires = useTracker(function(){
            return Questionnaires.find().fetch()
        }, [])   
    }
    if(QuestionnaireResponses){
        data.questionnaireResponses = useTracker(function(){
            return QuestionnaireResponses.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
        }, [])   
    }

    console.log('AutoDashboard.data', data);



    let useLocationSearch = useLocation().search;

    let isMobile = false
    if(window.innerWidth < 920){
        isMobile = true;
    }

    let careTeamContent;
    if(data.careTeams.length > 0){
        careTeamContent = <CardContent>
            <CareTeamsTable
                careTeams={data.careTeams}
                hideCategory={true}
                hideIdentifier={true}
                count={data.careTeams.length}
                page={careTeamsPage}   
                rowsPerPage={5}    
                onSetPage={function(newPage){
                    setCareTeamsPage(newPage);
                }}         
            />
        </CardContent>
    }
    let carePlansContent;
    if(data.carePlans.length > 0){
        carePlansContent = <CardContent>
            <CarePlansTable
                locations={data.locations}
                count={data.locations.length}
                page={carePlansPage}
                rowsPerPage={5}
                onSetPage={function(newPage){
                    setCarePlansPage(newPage);
                }}
            />
        </CardContent>                    
    }

    let consentContent;
    if(data.consents.length > 0){
        consentContent = <CardContent>
            <ConsentsTable
                hideDates={true}
                hidePeriodStart={true}
                hidePeriodEnd={true}
                hideOrganization={true}
                hideCategory={true}
                hidePatientName={isMobile}
                consents={data.consents}
                count={data.consents.length}
                page={consentsPage}
                rowsPerPage={5}
                onSetPage={function(newPage){
                    setConsentsPage(newPage);
                }}
            />
        </CardContent> 
    }

    let encountersContent;
    if(data.encounters.length > 0){
        encountersContent = <CardContent>
            <EncountersTable
                encounters={data.encounters}
                hideCheckboxes={true}
                hideActionIcons={true}
                hideSubjects={true}
                hideType={false}
                hideTypeCode={false}
                hideReason={isMobile}
                hideReasonCode={isMobile}
                hideHistory={true}
                hideEndDateTime={true}
                count={data.encounters.length}
                page={encountersPage}
                rowsPerPage={5}
                onSetPage={function(newPage){
                    setEncountersPage(newPage);
                }}
            />
        </CardContent> 
    }
    let conditionsContent;
    if(data.conditions.length > 0){
        conditionsContent = <CardContent>
            <ConditionsTable
                conditions={data.conditions}
                hideCheckbox={true}
                hideActionIcons={true}
                hidePatientName={true}
                hidePatientReference={true}
                hideAsserterName={true}
                hideEvidence={true}
                hideBarcode={true}
                hideDates={false}
                count={data.conditions.length}
                page={conditionsPage}
                rowsPerPage={5}
                onSetPage={function(newPage){
                    setConditionsPage(newPage);
                }}
            />                                        
        </CardContent>                    
    }
    let locationsContent;
    if(data.locations.length > 0){
        locationsContent = <CardContent>
            <LocationsTable
                locations={data.locations}
                count={data.locations.length}
                page={locationsPage}
                rowsPerPage={5}
                onSetPage={function(newPage){
                    setLocationsPage(newPage);
                }}
            />
        </CardContent>                    
    }
    let immunizationsContent;
    if(data.immunizations.length > 0){
        immunizationsContent = <CardContent>
            <ImmunizationsTable
                immunizations={data.immunizations}
                hideCheckbox={true}
                hideIdentifier={true}
                hideActionIcons={true}
                hidePatient={true}
                hidePerformer={true}
                hideVaccineCode={false}
                hideVaccineCodeText={false}
                count={data.immunizations.length}
                page={immunizationsPage}
                rowsPerPage={5}
                onSetPage={function(newPage){
                    setImmunizationsPage(newPage);
                }}
            />                                        
        </CardContent> 
    }
    let observationsContent;
    if(data.observations.length > 0){
        observationsContent = <CardContent>
            <ObservationsTable 
                observations={data.observations}
                hideCheckbox={true}
                hideActionIcons={true}
                hideSubject={true}
                hideDevices={true}
                hideValue={false}
                hideBarcode={true}
                hideDenominator={true}
                hideNumerator={true}
                multiline={true}
                multiComponentValues={true}
                hideSubjectReference={true}
                count={data.observations.length}
                page={observationsPage}
                onSetPage={function(newPage){
                    setObservationsPage(newPage);
                }}
            />                                                                                                           
        </CardContent>                    
    }
    let proceduresContent;
    if(data.procedures.length > 0){
        proceduresContent = <CardContent>
            <ProceduresTable 
                procedures={data.procedures}
                hideCheckbox={true}
                hideActionIcons={true}
                hideIdentifier={true}
                hideCategory={true}
                hideSubject={true}
                hideBodySite={true}
                hideCode={isMobile}
                hidePerformer={isMobile}
                hidePerformedDateEnd={true}
                hideSubjectReference={true}
                hideNotes={isMobile}
                hideBarcode={true}
                count={data.procedures.length}
                page={proceduresPage}
                onSetPage={function(newPage){
                    setProceduresPage(newPage);
                }}
            />                                                                                                           
        </CardContent>                    
    }


    let questionnairesContent;
    if(data.questionnaires.length > 0){
        questionnairesContent = <CardContent>
            <QuestionnairesTable
                questionnaires={data.questionnaires}
                count={data.questionnaires.length}
                hideSubject={isMobile}
                hideSubjectReference={isMobile}
                hideIdentifier={true}
                page={questionnairesPage}
                onSetPage={function(newPage){
                    setQuestionnairesPage(newPage);
                }}
            />
        </CardContent>                    
    }

    let questionnaireResponsesContent;
    if(data.questionnaireResponses.length > 0){
        questionnaireResponsesContent = <CardContent>
            <QuestionnaireResponsesTable
                questionnaireResponses={data.questionnaireResponses}
                count={data.questionnaireResponses.length}
                hideCheckbox={true}
                hideActionIcons={true}
                hideIdentifier={true}
                hideSourceReference={isMobile}
                page={questionnaireResponsesPage}
                onSetPage={function(newPage){
                    setQuestionnaireResponsesPage(newPage);
                }}
            />
        </CardContent>
    }

    let leftColumnStyle = {
        paddingRight: '10px'
    }
    let centerColumnStyle = {
        paddingRight: '10px', 
        paddingLeft: '10px'
    }
    let rightColumnStyle = {
        paddingLeft: '10px',
        marginBottom: '84px'
    }

    if(window.innerWidth < 768){
        leftColumnStyle.paddingRight = '0px'
        centerColumnStyle.paddingRight = '0px'
        centerColumnStyle.paddingLeft = '0px'
        rightColumnStyle.paddingLeft = '0px'
    }
    
    let patientIntakeLayout = <Grid container justify="center" style={{marginTop: '20px', marginBottom: '84px'}}>
        <Grid item xs={12} md={4} style={leftColumnStyle}>
            <CardHeader title="Who?" />
            <PatientCard patient={data.selectedPatient} showBarcode={true} />
            <br />
            <Card >
                <CardHeader title={data.careTeams.length + " Care Teams"} />
                { careTeamContent }          
            </Card>
            <br />
            <Card >
                <CardHeader title={data.consents.length + " Consents"} />
                { consentContent }  
            </Card>
            <br />
            <CardHeader title="Where?" />
            <Card >
                <CardHeader title={data.encounters.length + " Encounters"} />
                {encountersContent}               
            </Card>
            <br />
            <Card >
                <CardHeader title={data.locations.length + " Locations"} />
                {locationsContent}                
            </Card>            
        </Grid>
        <Grid item xs={12} md={4} style={centerColumnStyle}>
            <CardHeader title="What?" />
            <Card >
                <CardHeader title={data.conditions.length + " Conditions"} />
                {conditionsContent}
            </Card>                
            <br />
            <Card >
                <CardHeader title={data.immunizations.length + " Immunizations"} />
                {immunizationsContent}
            </Card>                
            <br />
            <Card>
                <CardHeader title={data.procedures.length + " Procedures"} />
                {proceduresContent}                
            </Card>                
        </Grid>
        <Grid item xs={12} md={4} style={rightColumnStyle}>
            <CardHeader title="How?" />
            <Card >
                <CardHeader title={data.locations.length + " Care Plans"} />
                {carePlansContent}                
            </Card>
            <br />
            
            <Card >
                <CardHeader title={data.observations.length + " Observations"} />
                {observationsContent}                
            </Card>  

            <br />
            <Card >
                <CardHeader title={data.questionnaires.length + " Questionnaires"} />
                {questionnairesContent}                
            </Card>
            <br />
            <Card >
                <CardHeader title={data.questionnaireResponses.length + " Questionnaire Responses"} />
                {questionnaireResponsesContent}                   
            </Card>

        </Grid>
    </Grid>

    let patientChartLayout = <Grid container style={{marginTop: '20px', paddingBottom: '84px'}} justify="center">
        <Grid item xs={12} sm={12} md={12} lg={6}>
            <PatientCard patient={data.selectedPatient} />
            <br />
            <Card >
                <CardHeader title={data.encounters.length + " Encounters"} />
               {encountersContent}                                
            </Card>
            <br />
            <Card >
                <CardHeader title={data.conditions.length + " Conditions"} />
                {conditionsContent}                
            </Card>                
            <br />
            <Card >
                <CardHeader title={data.immunizations.length + " Immunizations"} />
                {immunizationsContent}                   
            </Card>                
            <br />
            <Card>
                <CardHeader title={data.procedures.length + " Procedures"} />
                {proceduresContent}                            
            </Card>                
            <br />            
            <Card >
                <CardHeader title={data.observations.length + " Observations"} />
                {observationsContent}                        
            </Card>  
            <br />
            <Card >
                <CardHeader title={data.questionnaireResponses.length + " Questionnaire Responses"} />
                {questionnaireResponsesContent}                 
            </Card>
        </Grid>        
    </Grid>

    let autoDashboardContent = patientIntakeLayout;

    switch (data.quickchartTabIndex) {
        case 0:
            autoDashboardContent = patientChartLayout;
            break;
        case 1:
            autoDashboardContent = patientIntakeLayout;
            break;
    }
    
    let autoDashboardNoDataPath = get(Meteor, 'settings.public.smartOnFhir.autoDashboardNoDataPath', '/patients');

    // return (<NoDataWrapper 
    //     dataCount={data.selectedPatient ? 1 : 0} 
    //     noDataImagePath=""
    //     history={props.history} 
    //     title="No Patient Selected"
    //     buttonLabel="Lookup Patient"
    //     redirectPath={autoDashboardNoDataPath}
    //     >
    //         { autoDashboardContent }        
    //     </NoDataWrapper>
    // )
    return (autoDashboardContent)
}

export default AutoDashboard;
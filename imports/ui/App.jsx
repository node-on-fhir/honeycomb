import React, { createContext, useContext, useState, useLayoutEffect, useEffect, useMemo } from 'react';
import { Hello } from './Hello.jsx';

import { get } from 'lodash';

import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';

import { Helmet } from "react-helmet";

import {
  createBrowserRouter,
  RouterProvider,
  useNavigate,
  BrowserRouter as Router, 
  Routes, 
  Route,
  Outlet
} from "react-router-dom";

import { useTracker } from 'meteor/react-meteor-data';
import { Container, Box } from '@mui/material';

// import NotFound from './NotFound.jsx';
// import AppCanvas from './AppCanvas.jsx';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import SideDrawer from './SideDrawer';
// import SettingsPage from './SettingsPage';
// import ContextSlideOut from './ContextSlideOut';


import GettingStartedPage from './GettingStartedPage.jsx';
import MeteorBasic from './MeteorBasic.jsx';
import StaticPatientFileLoaderPage from './StaticPatientFileLoaderPage.jsx';

import SmartLauncher from './SmartLauncher.jsx';
import SmartLaunchDebugger from './SmartLaunchDebugger.jsx';
import SmartAppDebugger from './SmartAppDebugger.jsx';
import SmartSampleApp from './SmartSampleApp.jsx';
import ThemingPage from './ThemingPage.jsx';

import CdsHooksDebugger from './CdsHooksDebugger.jsx';

import NoDataWrapper from './NoDataWrapper.jsx';
import NotSignedInWrapper from './NotSignedInWrapper.jsx';

import HomePage from './HomePage.jsx';
import ServerConfigurationPage from '../ui-vault-server/ServerConfigurationPage.jsx';
import UdapRegistrationPage from '../ui-vault-server/UdapRegistrationPage.jsx';
import OAuthClientsPage from '../ui-vault-server/OAuthClientsPage.jsx';

// Account components (conditionally loaded)
import { LoginPage } from '../accounts/client/pages/LoginPage';
import { RegisterPage } from '../accounts/client/pages/RegisterPage';
import { ForgotPasswordForm } from '../accounts/client/components/ForgotPasswordForm';

import PatientQuickChart from '../patient/PatientQuickChart.jsx';
import PatientChart from '../patient/PatientChart.jsx';


//===============================================================================================================
// Modules

import PatientsDirectory from '../ui-modules/PatientsDirectory.jsx';

//===============================================================================================================
// FHIR Page Components

import ActivityDefinitionsPage from '../ui-fhir/activityDefinitions/ActivityDefinitionsPage.jsx';
import AllergyIntolerancesPage from '../ui-fhir/allergyIntolerances/AllergyIntolerancesPage.jsx';
import ArtifactAssessmentsPage from '../ui-fhir/artifactAssessments/ArtifactAssessmentsPage.jsx';
import BundlesPage from '../ui-fhir/bundles/BundlesPage.jsx';
import CareTeamsPage from '../ui-fhir/careTeams/CareTeamsPage.jsx';
import CarePlansPage from '../ui-fhir/carePlans/CarePlansPage.jsx';
import CodeSystemsPage from '../ui-fhir/codeSystems/CodeSystemsPage.jsx';
import CompositionsPage from '../ui-fhir/compositions/CompositionsPage.jsx';
import ConditionsPage from '../ui-fhir/conditions/ConditionsPage.jsx';
import DevicesPage from '../ui-fhir/devices/DevicesPage.jsx';
import DocumentReferencesPage from '../ui-fhir/documentReferences/DocumentReferencesPage.jsx';
import EncountersPage from '../ui-fhir/encounters/EncountersPage.jsx';
import EvidencesPage from '../ui-fhir/evidences/EvidencesPage.jsx';
import GoalsPage from '../ui-fhir/goals/GoalsPage.jsx';
import GuidanceResponsesPage from '../ui-fhir/guidanceResponses/GuidanceResponsesPage.jsx';
import ImmunizationsPage from '../ui-fhir/immunizations/ImmunizationsPage.jsx';
import LibrariesPage from '../ui-fhir/libraries/LibrariesPage.jsx';
import MedicationsPage from '../ui-fhir/medications/MedicationsPage.jsx';
import MedicationRequestsPage from '../ui-fhir/medicationRequests/MedicationRequestsPage.jsx';
import MedicationAdministrationsPage from '../ui-fhir/medicationAdministrations/MedicationAdministrationsPage.jsx';
import MedicationStatementsPage from '../ui-fhir/medicationStatements/MedicationStatementsPage.jsx';
import NutritionOrdersPage from '../ui-fhir/nutritionOrders/NutritionOrdersPage.jsx';
import ObservationsPage from '../ui-fhir/observations/ObservationsPage.jsx';
import OperationOutcomesPage from '../ui-fhir/operationOutcomes/OperationOutcomesPage.jsx';
import PlanDefinitionsPage from '../ui-fhir/planDefinitions/PlanDefinitionsPage.jsx';
import ProceduresPage from '../ui-fhir/procedures/ProceduresPage.jsx';
import QuestionnairesPage from '../ui-fhir/questionnaires/QuestionnairesPage.jsx';
import QuestionnaireResponsesPage from '../ui-fhir/questionnaireResponses/QuestionnaireResponsesPage.jsx';
import ResearchStudiesPage from '../ui-fhir/researchStudies/ResearchStudiesPage.jsx';
import ResearchSubjectsPage from '../ui-fhir/researchSubjects/ResearchSubjectsPage.jsx';
import ServiceRequestsPage from '../ui-fhir/serviceRequests/ServiceRequestsPage.jsx';
import TasksPage from '../ui-fhir/tasks/TasksPage.jsx';
import ValueSetsPage from '../ui-fhir/valuesets/ValueSetsPage.jsx';
import ClaimsPage from '../ui-claims/claims/ClaimsPage.jsx';

//===============================================================================================================
// PACIO Pages

import MedicationListsPage from '../ui-pacio/MedicationListsPage.jsx';
import TransitionsOfCarePage from '../ui-pacio/TransitionsOfCarePage.jsx';
import AdvancedDirectivesPage from '../ui-pacio/AdvancedDirectivesPage.jsx';

//===============================================================================================================


//===============================================================================================================
// Theming

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import { lightTheme, darkTheme } from './Themes';
Meteor.startup(function(){
  Meteor.lightTheme = lightTheme;
  Meteor.darkTheme = darkTheme;  
})


//===============================================================================================================
// FHIR UI Components
// 
// Not crazy about this coding pattern, and shipping all this UI code to the client
// but it's the way it is for now.  We'll refactor this later, and try to make it
// more modular, or implement some sort of tree shaking;
// Maybe add checks to Meteor.settings.private.fhir.rest.enabled to see if we should
// ship the code to the client or not?

import { AllergyIntolerancesTable } from '../ui-tables/AllergyIntolerancesTable';
import { BundlesTable } from '../ui-tables/BundlesTable';
import { CarePlansTable } from '../ui-tables/CarePlansTable';
import { CareTeamsTable } from '../ui-tables/CareTeamsTable';
import { ConditionsTable } from '../ui-tables/ConditionsTable';
// import { CommunicationsTable } from '../ui-tables/CommunicationsTable';
// import { CommunicationRequestsTable } from '../ui-tables/CommunicationRequestsTable';
// import { CompositionsTable } from '../ui-tables/CompositionsTable';
// import { DevicesTable } from '../ui-tables/DevicesTable';
import { EncountersTable } from '../ui-tables/EncountersTable';
import EndpointsTable from '../ui-tables/EndpointsTable';
import { ImmunizationsTable } from '../ui-tables/ImmunizationsTable';
// import { ListsTable } from '../ui-tables/ListsTable';
import { LocationsTable } from '../ui-tables/LocationsTable';
// import { MedicationsTable } from '../ui-tables/MedicationsTable';
// import { MedicationRequestsTable } from '../ui-tables/MedicationRequestsTable';
// import { MedicationStatementsTable } from '../ui-tables/MedicationStatementsTable';
// import { MeasuresTable } from '../ui-tables/MeasuresTable';
// import { MeasureReportsTable } from '../ui-tables/MeasureReportsTable';
// import { MessageHeadersTable } from '../ui-tables/MessageHeadersTable';
// import { OrganizationsTable } from '../ui-tables/OrganizationsTable';
import { ObservationsTable } from '../ui-tables/ObservationsTable';
import { PatientsTable } from '../ui-tables/PatientsTable';
import { PersonsTable } from '../ui-tables/PersonsTable';
import { ProceduresTable } from '../ui-tables/ProceduresTable';
import { QuestionnairesTable } from '../ui-tables/QuestionnairesTable';
import { QuestionnaireResponsesTable } from '../ui-tables/QuestionnaireResponsesTable';
import { ResearchSubjectsTable } from '../ui-tables/ResearchSubjectsTable';
// import { TasksTable } from '../ui-tables/TasksTable';

Meteor.Tables = {
  AllergyIntolerancesTable,
  BundlesTable,
  CarePlansTable,
  CareTeamsTable,
  ConditionsTable,
  // DevicesTable,
  EncountersTable,
  EndpointsTable,
  ImmunizationsTable,
  LocationsTable,
  ObservationsTable,
  PatientsTable,
  PersonsTable,
  ProceduresTable,
  QuestionnairesTable,
  QuestionnaireResponsesTable,
  ResearchSubjectsTable
}

//===============================================================================================================
// Data Cursors

import { ActivityDefinitions } from '../lib/schemas/SimpleSchemas/ActivityDefinitions';
import { AllergyIntolerances } from '../lib/schemas/SimpleSchemas/AllergyIntolerances';
import { ArtifactAssessments } from '../lib/schemas/SimpleSchemas/ArtifactAssessments';
import { BodyStructures } from '../lib/schemas/SimpleSchemas/BodyStructures';
import { Bundles } from '../lib/schemas/SimpleSchemas/Bundles';
import { CarePlans } from '../lib/schemas/SimpleSchemas/CarePlans';
import { CareTeams } from '../lib/schemas/SimpleSchemas/CareTeams';
import { Conditions } from '../lib/schemas/SimpleSchemas/Conditions';
import { Claims } from '../lib/schemas/SimpleSchemas/Claims';
import { CodeSystems } from '../lib/schemas/SimpleSchemas/CodeSystems';
import { Communications } from '../lib/schemas/SimpleSchemas/Communications';
import { CommunicationRequests } from '../lib/schemas/SimpleSchemas/CommunicationRequests';
import { Compositions } from '../lib/schemas/SimpleSchemas/Compositions';
import { ConceptMaps } from '../lib/schemas/SimpleSchemas/ConceptMaps';
import { Devices } from '../lib/schemas/SimpleSchemas/Devices';
import { DiagnosticReports } from '../lib/schemas/SimpleSchemas/DiagnosticReports';
import { DocumentReferences } from '../lib/schemas/SimpleSchemas/DocumentReferences';
import { Encounters } from '../lib/schemas/SimpleSchemas/Encounters';
import { Evidences } from '../lib/schemas/SimpleSchemas/Evidences';
import { Endpoints } from '../lib/schemas/SimpleSchemas/Endpoints';
import { ExplanationOfBenefits } from '../lib/schemas/SimpleSchemas/ExplanationOfBenefits';
import { FamilyMemberHistories } from '../lib/schemas/SimpleSchemas/FamilyMemberHistories';
import { Goals } from '../lib/schemas/SimpleSchemas/Goals';
import { Groups } from '../lib/schemas/SimpleSchemas/Groups';
import { GuidanceResponses } from '../lib/schemas/SimpleSchemas/GuidanceResponses';
import { Immunizations } from '../lib/schemas/SimpleSchemas/Immunizations';
import { Libraries } from '../lib/schemas/SimpleSchemas/Libraries';
import { Lists } from '../lib/schemas/SimpleSchemas/Lists';
import { Locations } from '../lib/schemas/SimpleSchemas/Locations';
import { Medications } from '../lib/schemas/SimpleSchemas/Medications';
import { MedicationAdministrations } from '../lib/schemas/SimpleSchemas/MedicationAdministrations';
import { MedicationRequests } from '../lib/schemas/SimpleSchemas/MedicationRequests';
import { MedicationStatements } from '../lib/schemas/SimpleSchemas/MedicationStatements';
import { Measures } from '../lib/schemas/SimpleSchemas/Measures';
import { MeasureReports } from '../lib/schemas/SimpleSchemas/MeasureReports';
import { MessageHeaders } from '../lib/schemas/SimpleSchemas/MessageHeaders';
import { Organizations } from '../lib/schemas/SimpleSchemas/Organizations';
import { Observations } from '../lib/schemas/SimpleSchemas/Observations';
import { OperationOutcomes } from '../lib/schemas/SimpleSchemas/OperationOutcomes';
import { Patients } from '../lib/schemas/SimpleSchemas/Patients';
import { PlanDefinitions } from '../lib/schemas/SimpleSchemas/PlanDefinitions';
import { Procedures } from '../lib/schemas/SimpleSchemas/Procedures';
import { Questionnaires } from '../lib/schemas/SimpleSchemas/Questionnaires';
import { QuestionnaireResponses } from '../lib/schemas/SimpleSchemas/QuestionnaireResponses';
import { NutritionOrders } from '../lib/schemas/SimpleSchemas/NutritionOrders';
import { ResearchStudies } from '../lib/schemas/SimpleSchemas/ResearchStudies';
import { ResearchSubjects } from '../lib/schemas/SimpleSchemas/ResearchSubjects';
import { ServiceRequests } from '../lib/schemas/SimpleSchemas/ServiceRequests';
import { StructureDefinitions } from '../lib/schemas/SimpleSchemas/StructureDefinitions';
import { Specimens } from '../lib/schemas/SimpleSchemas/Specimens';
import { Tasks } from '../lib/schemas/SimpleSchemas/Tasks';
import { ValueSets } from '../lib/schemas/SimpleSchemas/ValueSets';

import { PatientCard } from '../patient/PatientCard.jsx'
import { FhirUtilities } from '../lib/FhirUtilities.js'
import { FhirDehydrator } from '../lib/FhirDehydrator.js'
import { LayoutHelpers } from '../lib/LayoutHelpers.js'
import { DynamicSpacer } from './DynamicSpacer'


Meteor.Collections = {
  ActivityDefinitions,
  AllergyIntolerances,
  ArtifactAssessments,
  Bundles,
  BodyStructures,
  CarePlans,
  CareTeams,
  Claims,
  CodeSystems,
  ConceptMaps,
  Conditions,
  Communications,
  CommunicationRequests,
  Compositions,
  Devices,
  DiagnosticReports,
  DocumentReferences,
  Encounters,
  Evidences,
  Endpoints,
  ExplanationOfBenefits,
  FamilyMemberHistories,
  Goals,
  Groups,
  GuidanceResponses,
  Immunizations,
  Libraries,
  Lists,
  Locations,
  Medications,
  MedicationAdministrations,
  MedicationRequests,
  MedicationStatements,
  MessageHeaders,
  Measures,
  MeasureReports,
  NutritionOrders,
  Organizations,
  Observations,
  OperationOutcomes,
  Patients,
  PlanDefinitions,
  Procedures,
  Questionnaires,
  QuestionnaireResponses,
  ResearchStudies,
  ResearchSubjects,
  StructureDefinitions,
  ServiceRequests,
  Specimens,
  Tasks,
  ValueSets
}
Meteor.FhirUtilities = FhirUtilities;
Meteor.FhirDehydrator = FhirDehydrator;
Meteor.LayoutHelpers = LayoutHelpers;
Meteor.DynamicSpacer = DynamicSpacer;
Meteor.NoDataWrapper = NoDataWrapper;
Meteor.NotSignedInWrapper = NotSignedInWrapper;
Meteor.PatientCard = PatientCard;



window.Collections = {
  ActivityDefinitions,
  AllergyIntolerances,
  ArtifactAssessments,
  Bundles,
  BodyStructures,
  CarePlans,
  CareTeams,
  Claims,
  CodeSystems,
  ConceptMaps,
  Conditions,
  Communications,
  CommunicationRequests,
  Compositions,
  Devices,
  DiagnosticReports,
  Encounters,
  Evidences,
  Endpoints,
  FamilyMemberHistories,
  Goals,
  Groups,
  GuidanceResponses,
  Immunizations,
  Lists,
  Locations,
  Libraries,
  Medications,
  MedicationAdministrations,
  MedicationRequests,
  MedicationStatements,
  MessageHeaders,
  Measures,
  MeasureReports,
  NutritionOrders,
  Organizations,
  Observations,
  OperationOutcomes,
  Patients,
  PlanDefinitions,
  Procedures,
  Questionnaires,
  QuestionnaireResponses,
  ResearchStudies,
  ResearchSubjects,
  StructureDefinitions,
  ServiceRequests,
  Specimens,
  Tasks,
  ValueSets,
  FhirDehydrator
}

window.FhirUtilities = FhirUtilities;

// SECURITY TODO:  maybe best to put a guard around this 
// debug only?  or maybe only in development mode?
window.Session = Session;

//===============================================================================================================
// Router History

import { unstable_HistoryRouter as HistoryRouter } from 'react-router-dom';
import { createBrowserHistory } from 'history';
export const history = createBrowserHistory();
import { NavigationProvider, useNavigation } from './NavigationContext';

//===============================================================================================================
// Static Routes



let dynamicRoutes = [
  {
    path: "/home",
    element: <HomePage />
  }, {
    path: "/index",
    element: <HomePage />
  }, {
    path: "/getting-started",
    element: <GettingStartedPage />
  }, {
    path: "/getting-started-checklist",
    element: <GettingStartedPage />
  }, {
    path: "/static-files",
    element: <StaticPatientFileLoaderPage />
  }, {
    path: "/smart-launcher",
    element: <SmartLauncher />
  }, {
    path: "/smart-launcher-debugger",
    element: <SmartLaunchDebugger />
  }, {
    path: "/smart-sample-app",
    element: <SmartSampleApp />
  }, {
    path: "/smart-app-debugger",
    element: <SmartAppDebugger />
  }, {
    path: "/theming",
    element: <ThemingPage />
  }, {
    path: "/cds-hooks-debugger",
    element: <CdsHooksDebugger />
  }, {
    path: "/patient-quickchart",
    element: <PatientQuickChart />
  }, {
    path: "/server-configuration",
    element: <ServerConfigurationPage />
  }, {
    path: "/udap-registration",
    element: <UdapRegistrationPage />
  }, {
    path: "/oauth-clients",
    element: <OAuthClientsPage />
  }, {
    path: "/patient-chart",
    element: <PatientChart />
  }  
]

// Account routes
if(get(Meteor, 'settings.public.modules.accounts.enabled', true)){
  dynamicRoutes.push({
    path: "/login",
    element: <LoginPage />
  });
  dynamicRoutes.push({
    path: "/signin",
    element: <LoginPage />
  });
  dynamicRoutes.push({
    path: "/register", 
    element: <RegisterPage />
  });
  dynamicRoutes.push({
    path: "/signup",
    element: <RegisterPage />
  });
  dynamicRoutes.push({
    path: "/forgot-password",
    element: (
      <Container maxWidth="sm">
        <Box sx={{ pt: 8, pb: 4 }}>
          <ForgotPasswordForm 
            onBackToLogin={() => window.location.href = '/login'}
          />
        </Box>
      </Container>
    )
  });
}

if(get(Meteor, 'settings.public.modules.PatientsDirectory')){
  dynamicRoutes.push({
    path: "/patient-directory",
    element: <PatientsDirectory />
  })
}
if(get(Meteor, 'settings.public.modules.Theming')){
  dynamicRoutes.push({
    path: "/theming",
    element: <ThemingPage />
  })
}









if(get(Meteor, 'settings.public.modules.fhir.AllergyIntolerances')){
  dynamicRoutes.push({
    path: "/allergy-intolerances",
    element: <AllergyIntolerancesPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.ArtifactAssessments')){
  dynamicRoutes.push({
    path: "/artifact-assessments",
    element: <ArtifactAssessmentsPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.ActivityDefinitions')){
  dynamicRoutes.push({
    path: "/activity-definitions",
    element: <ActivityDefinitionsPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.Bundles')){
  dynamicRoutes.push({
    path: "/bundles",
    element: <BundlesPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.CareTeams')){
  dynamicRoutes.push({
    path: "/care-teams",
    element: <CareTeamsPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.CarePlans')){
  dynamicRoutes.push({
    path: "/care-plans",
    element: <CarePlansPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.CodeSystems')){
  dynamicRoutes.push({
    path: "/code-systems",
    element: <CodeSystemsPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.Compositions')){
  dynamicRoutes.push({
    path: "/compositions",
    element: <CompositionsPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.Conditions')){
  dynamicRoutes.push({
    path: "/conditions",
    element: <ConditionsPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.Devices')){
  dynamicRoutes.push({
    path: "/devices",
    element: <DevicesPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.DocumentReferences')){
  dynamicRoutes.push({
    path: "/document-references",
    element: <DocumentReferencesPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.Encounters')){
  dynamicRoutes.push({
    path: "/encounters",
    element: <EncountersPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.Evidences')){
  dynamicRoutes.push({
    path: "/evidences",
    element: <EvidencesPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.Goals')){
  dynamicRoutes.push({
    path: "/goals",
    element: <GoalsPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.GuidanceResponses')){
  dynamicRoutes.push({
    path: "/guidance-responses",
    element: <GuidanceResponsesPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.Immunizations')){
  dynamicRoutes.push({
    path: "/immunizations",
    element: <ImmunizationsPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.Libraries')){
  dynamicRoutes.push({
    path: "/libraries",
    element: <LibrariesPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.Observations')){
  dynamicRoutes.push({
    path: "/observations",
    element: <ObservationsPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.Patients')){
  dynamicRoutes.push({
    path: "/patients",
    element: <PatientsDirectory />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.OperationOutcomes')){
  dynamicRoutes.push({
    path: "/operation-outcomes",
    element: <OperationOutcomesPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.PlanDefinitions')){
  dynamicRoutes.push({
    path: "/plan-definitions",
    element: <PlanDefinitionsPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.Procedures')){
  dynamicRoutes.push({
    path: "/procedures",
    element: <ProceduresPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.Questionnaires')){
  dynamicRoutes.push({
    path: "/questionnaires",
    element: <QuestionnairesPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.QuestionnaireResponses')){
  dynamicRoutes.push({
    path: "/questionnaire-responses",
    element: <QuestionnaireResponsesPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.ResearchSubjects')){
  dynamicRoutes.push({
    path: "/research-subjects",
    element: <ResearchSubjectsPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.ResearchStudies')){
  dynamicRoutes.push({
    path: "/research-studies",
    element: <ResearchStudiesPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.ServiceRequests')){
  dynamicRoutes.push({
    path: "/service-requests",
    element: <ServiceRequestsPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.Tasks')){
  dynamicRoutes.push({
    path: "/tasks",
    element: <TasksPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.ValueSets')){
  dynamicRoutes.push({
    path: "/value-sets",
    element: <ValueSetsPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.MedicationStatements')){
  dynamicRoutes.push({
    path: "/medication-statements",
    element: <MedicationStatementsPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.Medications')){
  dynamicRoutes.push({
    path: "/medications",
    element: <MedicationsPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.MedicationRequests')){
  dynamicRoutes.push({
    path: "/medication-requests",
    element: <MedicationRequestsPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.MedicationAdministrations')){
  dynamicRoutes.push({
    path: "/medication-administrations",
    element: <MedicationAdministrationsPage />
  })
}
if(get(Meteor, 'settings.public.modules.fhir.NutritionOrders')){
  dynamicRoutes.push({
    path: "/nutrition-orders",
    element: <NutritionOrdersPage />
  })
}




if(get(Meteor, 'settings.public.modules.fhir.Claims')){
  dynamicRoutes.push({
    path: "/claims",
    element: <ClaimsPage />
  })
}

// PACIO Routes - Override package routes with our custom implementations
dynamicRoutes.push({
  path: "/medication-lists",
  element: <MedicationListsPage />
});
dynamicRoutes.push({
  path: "/transition-of-care",
  element: <TransitionsOfCarePage />
});
dynamicRoutes.push({
  path: "/advance-directives", 
  element: <AdvancedDirectivesPage />
});

// ==============================================================================
// Dynamic Routes

let homeRoute = {
  path: "/",
  element: <GettingStartedPage />
}

let headerNavigation;
let foundMainPage = false;
Object.keys(Package).forEach(function(packageName){
  if(Package[packageName].DynamicRoutes){
    // we try to build up a route from what's specified in the package
    Package[packageName].DynamicRoutes.forEach(function(route){
      dynamicRoutes.push(route);      
    });    
    if(Package[packageName].MainPage){
      dynamicRoutes.push(Package[packageName].MainPage);      
      foundMainPage = true;
      // if(typeof homeRoute.element === "undefined"){
      //   homeRoute.element = Package[packageName].MainPage
      // } else {
      //   console.warn("Hmmm.  Appears that a package has already loaded a MainPage.  You'll probably want to check Atmosphere packages for more than one package setting MainPage.")
      // }
    }
  }
});
if(!foundMainPage){
  dynamicRoutes.push(homeRoute);      
}

// ==============================================================================
// Router

const router = createBrowserRouter(dynamicRoutes);

const CustomRouter = ({ children }) => {
  return (
    
      <Routes>
        {dynamicRoutes.map((route, index) => (
          <Route key={index} path={route.path} element={route.element} />
        ))}
        {/* Optionally, add a fallback route for 404 Not Found */}
        {/* <Route path="*" element={<NotFound />} /> */}
        <Route path="*" />
      </Routes>
  );
};

// ==============================================================================
// Security Based Routing

// patient authentication function
const requireAuth = (nextState, replace) => {
  // do we even need to authorize?
  if(get(Meteor, 'settings.public.defaults.requireAuthorization')){
    // yes, this is a restricted page
    if (!Meteor.loggingIn() && !Meteor.currentUser()) {
      // we're in the compiled desktop app that somebody purchased or downloaded
      // so no need to go to the landing page
      // lets just take them to the signin page
      if(Meteor.isDesktop){
        replace({
          pathname: '/signin',
          state: { nextPathname: nextState.location.pathname }
        });  
      } else {

        // we're in the general use case
        // user is trying to access a route that requires authorization, but isn't signed in
        // redirect them to the landing page
        if(get(Meteor, 'settings.public.defaults.landingPage')){
          replace({
            pathname: get(Meteor, 'settings.public.defaults.landingPage'),
            state: { nextPathname: nextState.location.pathname }
          });    
        } else {
          replace({
            pathname: '/landing-page',
            state: { nextPathname: nextState.location.pathname }
          });    
        }

      }
    }

  } else {
  // apparently we don't need to authorize;
  // so lets just continue (i.e. everybody is authorized)
    if(get(Meteor, 'settings.public.defaults.route')){
      // hey, a default route is specified
      // lets go there
      replace({
        pathname: get(Meteor, 'settings.public.defaults.route'),
        state: { nextPathname: nextState.location.pathname }
      });  
    }

    // can't find anywhere else to go to, so lets just go to the root path 
    // ¯\_(ツ)_/¯
  }
};

// practitioner authentication function
const requirePractitioner = (nextState, replace) => {
  if (!Roles.userIsInRole(get(Meteor.currentUser(), '_id'), 'practitioner')) {
    replace({
      pathname: '/need-to-be-practitioner',
      state: { nextPathname: nextState.location.pathname }
    });
  }
};
// practitioner authentication function
const requreSysadmin = (nextState, replace) => {
  if (!Roles.userIsInRole(get(Meteor.currentUser(), '_id'), 'sysadmin')) {
    replace({
      pathname: '/need-to-be-sysadmin',
      state: { nextPathname: nextState.location.pathname }
    });
  }
};



//===============================================================================================================
// Analytics

let analyticsTrackingId = get(Meteor, 'settings.public.google.analytics.trackingId')

import ReactGA from "react-ga4";
if(analyticsTrackingId){
  ReactGA.initialize(analyticsTrackingId, {debug: get(Meteor, 'settings.public.google.analytics.debug', false)});
}

function logPageView() {
  if(analyticsTrackingId){
    // ReactGA.pageview(window.location.pathname + window.location.search);
    ReactGA.send({ hitType: "pageview", page: window.location.pathname });
  }
};

function usePageViews() {
  // let location = useLocation();
  React.useEffect(() => {
    if(analyticsTrackingId){
      ReactGA.pageview(window.location.pathname + window.location.search);
      // ReactGA.set({ page: window.location.pathname });  
      ReactGA.send({ hitType: "pageview", page: window.location.pathname });
    }
  }, [window.location]);
}





// ==============================================================================
// Slideout Cards ???


if(Meteor.isClient){
  Session.setDefault('slideOutCardsVisible', true)
}
export function SlideOutCards(props){


  const slideOutCardsVisible = useTracker(function(){
    return Session.get('slideOutCardsVisible')
  }, []);

  console.log('slideOutCardsVisible', slideOutCardsVisible)

  let overlayContainerStyle = {
    position: 'fixed',
    top: '0px',
    left: '0px',
    height: '100%', 
    width: '100%'
  }

  let overlayStyle = {
    position: 'absolute',
    float: 'right',    
    top: '128px',
    right: '73px',
    height: window.innerHeight - 64 + 'px',
    width: '400px',
    transition: '.7s'
  }

  if(slideOutCardsVisible){
    overlayStyle.right = '-473px';
  }


  return <div id='slideoutCardsContainer' style={overlayContainerStyle}>
    <Card id='slideoutCards' style={overlayStyle}>
      <CardHeader title="Slideout" />
    </Card>
  </div>
}



//===============================================================================================================
// Theming


const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);
Meteor.useTheme = useTheme;

// this Provider components enables the useTheme() hook in child components 
export const CustomThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  const muiTheme = theme === 'light' ? lightTheme : darkTheme;

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};



if(Meteor.isClient){
  Session.setDefault('canvasBackgroundColor', "#f2f2f2")
}


const drawerWidth =  get(Meteor, 'settings.public.defaults.drawerWidth', 280);
const defaultCanvasColor =  get(Meteor, 'settings.public.theme.palette.canvasColor', "#f2f2f2");

// custom hook to listen to the resize event
function useWindowSize() {
  const [size, setSize] = useState([0, 0]);

  // useLayoutEffect only works on the client!
  if(Meteor.isClient){
    useLayoutEffect(() => {
      function updateSize() {
        setSize([window.innerWidth, window.innerHeight]);
      }
      window.addEventListener('resize', updateSize);
      updateSize();
      return () => window.removeEventListener('resize', updateSize);
    }, []);  
  }
  return size;
}




// ==============================================================================
// Main App


export function App(props){

  // const { theme, toggleTheme } = useTheme();


  
  // if(typeof logger === "undefined"){
  //   logger = props.logger;
  // }
  
  // logger.debug('Rendering the main App.');
  // logger.verbose('client.app.layout.App');
  // logger.data('App.props', {data: props}, {source: "AppContainer.jsx"});

  // console.info('Rendering the App.');
  // console.debug('client.app.layout.App');
  // console.data('App.props', {data: props}, {source: "AppContainer.jsx"});


  // ------------------------------------------------------------------
  // Props  

  const { staticContext, startAdornment,  ...otherProps } = props;

  // ------------------------------------------------------------------
  // SMART on FHIR Oauth Scope  

  let searchParams = new URLSearchParams(window.location.search);
  if(get(Meteor, 'settings.public.enableEhrLaunchContext')){
    if(searchParams){

      searchParams.forEach(function(value, key){
        console.log(key + ': ' + value); 
      });
  
      if(searchParams.get('iss')){
        Session.set('smartOnFhir_iss', searchParams.get('iss'));
      }
      if(searchParams.get('launch')){
        Session.set('smartOnFhir_launch', searchParams.get('launch'));
      }
      if(searchParams.get('code')){
        Session.set('smartOnFhir_code', searchParams.get('code'));
      }
      if(searchParams.get('scope')){
        Session.set('smartOnFhir_scope', searchParams.get('scope'));
      }
  
      if(searchParams.state){
        Session.set('smartOnFhir_state', searchParams.state);
      }        
    }  
  }

  // forgot why we have this.  I think this is Google Analytics related?
  // usePageViews();


  // ------------------------------------------------------------------
  // App UI State

  const [drawerIsOpen, setDrawerIsOpen] = useState(false);
  const [appWidth, appHeight] = useWindowSize();



  // ------------------------------------------------------------------
  // Pathname Updates

  const navigate = useNavigation();
  useEffect(() => {
    // Storing navigate function globally
    window.globalNavigate = navigate;
  }, [navigate]);

  useEffect(() => {
    if(get(props, 'location.pathname')){
      console.info('Location pathname was changed.  Setting the session variable: ' + props.location.pathname);
      Session.set('pathname', props.location.pathname);  
      logPageView()
    }

    if(document.getElementById("reactCanvas") && !Meteor.isCordova){
      document.getElementById("reactCanvas").setAttribute("style", "bottom: 0px; background: " + defaultCanvasColor + ";");
      document.getElementById("reactCanvas").setAttribute("background", defaultCanvasColor);
    }
  }, [props])


  // ------------------------------------------------------------------
  // User Interface Methods

  function handleDrawerOpen(){
    logger.trace('App.handleDrawerOpen()')
    setDrawerIsOpen(!drawerIsOpen);
  };

  function handleDrawerClose(){
    setDrawerIsOpen(false);
    logger.trace('App.handleDrawerClose()')

  };

  const handleDrawerToggle = () => {
    setDrawerIsOpen(!drawerIsOpen);
  };



  // ------------------------------------------------------------------
  // Social Media Registration  

  let socialmedia = {
    title: get(Meteor, 'settings.public.socialmedia.title', ''),
    type: get(Meteor, 'settings.public.socialmedia.type', ''),
    url: get(Meteor, 'settings.public.socialmedia.url', ''),
    image: get(Meteor, 'settings.public.socialmedia.image', ''),
    description: get(Meteor, 'settings.public.socialmedia.description', ''),
    site_name: get(Meteor, 'settings.public.socialmedia.site_name', ''),
    author: get(Meteor, 'settings.public.socialmedia.author', '')
  }

  let helmet;
  let headerTags = [];
  let themeColor = "";  
  let rawColor = get(Meteor, 'settings.public.theme.palette.appBarColor', "#669f64");

  // all we're doing here is grabing the hex color, and ignoring adornments like !important
  if(rawColor.split(" ")){
    themeColor = rawColor.split(" ")[0];
  } else {
    themeColor = rawColor;
  }

  let initialScale = 1.0; 

  headerTags.push(<meta key='theme' name="theme-color" content={themeColor} />)
  headerTags.push(<meta key='utf-8' charSet="utf-8" />);    
  // headerTags.push(<meta name="viewport" key='viewport' property="viewport" content={"initial-scale=" + initialScale + ", minimal-ui, minimum-scale=" + initialScale + ", maximum-scale=" + initialScale + ", width=device-width, height=device-height, user-scalable=no"} />);
  headerTags.push(<meta name="viewport" key='viewport' property="viewport" content={"initial-scale=" + initialScale + ", minimal-ui, minimum-scale=" + initialScale + ", maximum-scale=" + initialScale + ", width=device-width, height=device-height"} />);
  headerTags.push(<meta name="description" key='description' property="description" content={get(Meteor, 'settings.public.title', "Node on FHIR")} />);
  headerTags.push(<title key='title'>{get(Meteor, 'settings.public.title', "Node on FHIR")}</title>);

  if(get(Meteor, 'settings.public.socialmedia')){
    //headerTags.push(<title>{socialmedia.title}</title>);    
    headerTags.push(<link key='canonical' rel="canonical" href={socialmedia.url} />);    
    headerTags.push(<meta prefix="og: http://ogp.me/ns#" key='og:title' property="og:title" content={socialmedia.title} />);
    headerTags.push(<meta prefix="og: http://ogp.me/ns#" key='og:type' property="og:type" content={socialmedia.type} />);
    headerTags.push(<meta prefix="og: http://ogp.me/ns#" key='og:url' property="og:url" content={socialmedia.url} />);
    headerTags.push(<meta prefix="og: http://ogp.me/ns#" key='og:image' property="og:image" content={socialmedia.image} />);
    headerTags.push(<meta prefix="og: http://ogp.me/ns#" key='og:description' property="og:description" content={socialmedia.description} />);
    headerTags.push(<meta prefix="og: http://ogp.me/ns#" key='og:site_name' property="og:site_name" content={socialmedia.site_name} />);
    headerTags.push(<meta prefix="og: http://ogp.me/ns#" key='og:author' property="og:author" content={socialmedia.author} />);
  }

  helmet = <Helmet>
    { headerTags }
  </Helmet>



  // if(theme === "light"){
  //   mainAppStyle.background = backgroundCanvas;
  // } else {
  //   mainAppStyle.background = backgroundCanvasDark;
  // }


  let renderContents = <div { ...otherProps }>
    {/* { helmet } */}
    <div id='primaryFlexPanel'>
      <CustomThemeProvider>
        <Router>
          <Header 
            drawerIsOpen={drawerIsOpen} 
            handleDrawerOpen={handleDrawerOpen} 
            headerNavigation={headerNavigation} 
            history={window.history}
            { ...otherProps } 
          />
          <SideDrawer 
            drawerIsOpen={drawerIsOpen} 
            onDrawerClose={function(){setDrawerIsOpen(false)}}  
            location={props.location} 
            history={window.history}
            { ...otherProps } />        
          <StyledMainRouter>
            <CustomRouter />
          </StyledMainRouter>
          <Footer 
            drawerIsOpen={drawerIsOpen} 
            location={props.location} 
            history={window.history}
            { ...otherProps } 
          />
        </Router>
      </CustomThemeProvider>      
    </div>
  </div>

  return(renderContents)
};

function StyledMainRouter(props){
  
  const {children, ...otherProps} = props;
  const { theme, toggleTheme } = useTheme();

  let backgroundCanvas = get(Meteor, 'settings.public.theme.palette.backgroundCanvas', "#ffffff");
  let backgroundCanvasDark = get(Meteor, 'settings.public.theme.palette.backgroundCanvasDark', "#ffffff");

  let mainAppStyle = {height: window.innerHeight}

  if(theme === "light"){
    mainAppStyle.background = backgroundCanvas;
  } else {
    mainAppStyle.background = backgroundCanvasDark;
  }

  return (<main id='mainAppRouter' style={mainAppStyle}>
    <CustomRouter />
  </main>)
}
// /packages/pacio-core/index.jsx

import React, { Suspense } from 'react';
import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';
import { CircularProgress, Box } from '@mui/material';

// Loading component
const Loading = () => (
  <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
    <CircularProgress />
  </Box>
);

// Wrap components with Suspense
const withSuspense = (Component) => {
  return (props) => (
    <Suspense fallback={<Loading />}>
      <Component {...props} />
    </Suspense>
  );
};

// Page Components - Lazy loaded
const PatientAdvanceDirectivesLazy = React.lazy(() => 
  import('./client/pages/PatientAdvanceDirectives').then(module => ({ default: module.PatientAdvanceDirectives }))
);
const PatientAdvanceDirectives = withSuspense(PatientAdvanceDirectivesLazy);

const PatientTransitionOfCareLazy = React.lazy(() => 
  import('./client/pages/PatientTransitionOfCare').then(module => ({ default: module.PatientTransitionOfCare }))
);
const PatientTransitionOfCare = withSuspense(PatientTransitionOfCareLazy);

const PatientGoalsLazy = React.lazy(() => 
  import('./client/pages/PatientGoals').then(module => ({ default: module.PatientGoals }))
);
const PatientGoals = withSuspense(PatientGoalsLazy);

const PatientMedicationListsLazy = React.lazy(() => 
  import('./client/pages/PatientMedicationLists').then(module => ({ default: module.PatientMedicationLists }))
);
const PatientMedicationLists = withSuspense(PatientMedicationListsLazy);

const PatientNutritionOrdersLazy = React.lazy(() => 
  import('./client/pages/PatientNutritionOrders').then(module => ({ default: module.PatientNutritionOrders }))
);
const PatientNutritionOrders = withSuspense(PatientNutritionOrdersLazy);

// Detail Views - Lazy loaded
const AdvanceDirectiveDetailLazy = React.lazy(() => 
  import('./client/components/advanceDirectives/AdvanceDirectiveDetail')
);
const AdvanceDirectiveDetail = withSuspense(AdvanceDirectiveDetailLazy);

const AdvanceDirectiveRevokeLazy = React.lazy(() => 
  import('./client/components/advanceDirectives/AdvanceDirectiveRevoke').then(module => ({ default: module.AdvanceDirectiveRevoke }))
);
const AdvanceDirectiveRevoke = withSuspense(AdvanceDirectiveRevokeLazy);

const TransitionOfCareDetailLazy = React.lazy(() => 
  import('./client/components/transitionOfCare/TransitionOfCareDetail')
);
const TransitionOfCareDetail = withSuspense(TransitionOfCareDetailLazy);

// Keep only the local MedicationsPage that's in the package
const MedicationsPageLazy = React.lazy(() => 
  import('./client/pages/MedicationsPage').then(module => ({ default: module.MedicationsPage }))
);
const MedicationsPage = withSuspense(MedicationsPageLazy);

// New stub pages for main workflows
const AdvanceDirectivesPageLazy = React.lazy(() => 
  import('./client/pages/AdvanceDirectivesPage').then(module => ({ default: module.AdvanceDirectivesPage }))
);
const AdvanceDirectivesPage = withSuspense(AdvanceDirectivesPageLazy);

const TransitionOfCarePageLazy = React.lazy(() => 
  import('./client/pages/TransitionOfCarePage').then(module => ({ default: module.TransitionOfCarePage }))
);
const TransitionOfCarePage = withSuspense(TransitionOfCarePageLazy);

const MedicationListsPageLazy = React.lazy(() => 
  import('./client/pages/MedicationListsPage').then(module => ({ default: module.MedicationListsPage }))
);
const MedicationListsPage = withSuspense(MedicationListsPageLazy);

const CareTeamsPageLazy = React.lazy(() => 
  import('./client/pages/CareTeamsPage').then(module => ({ default: module.CareTeamsPage }))
);
const CareTeamsPage = withSuspense(CareTeamsPageLazy);

const MainPageLazy = React.lazy(() => 
  import('./client/pages/MainPage').then(module => ({ default: module.MainPage }))
);
const MainPage = withSuspense(MainPageLazy);

// Lazy load FHIR resource pages
const TasksPageLazy = React.lazy(() => 
  import('/imports/ui-fhir/tasks/TasksPage').then(module => ({ default: module.TasksPage }))
);
const TasksPage = withSuspense(TasksPageLazy);

// Placeholder components for missing pages
const PractitionersPage = () => (
  <Box p={3}>
    <Typography variant="h4">Practitioners</Typography>
    <Typography variant="body1" sx={{ mt: 2 }}>
      Practitioners page is under development.
    </Typography>
  </Box>
);

const ListsPage = () => (
  <Box p={3}>
    <Typography variant="h4">Lists</Typography>
    <Typography variant="body1" sx={{ mt: 2 }}>
      Lists page is under development.
    </Typography>
  </Box>
);

const CommunicationsPage = () => (
  <Box p={3}>
    <Typography variant="h4">Communications</Typography>
    <Typography variant="body1" sx={{ mt: 2 }}>
      Communications page is under development.
    </Typography>
  </Box>
);

// Dynamic Routes
export const DynamicRoutes = [
  // Main dashboard
  {
    name: 'PacioDashboard',
    path: '/pacio-dashboard',
    element: <MainPage />,
    requireAuth: true
  },
  // List routes (no patient ID)
  {
    name: 'AdvanceDirectivesList',
    path: '/advance-directives',
    element: <AdvanceDirectivesPage />,
    requireAuth: true
  },
  {
    name: 'TransitionOfCareList', 
    path: '/transition-of-care',
    element: <TransitionOfCarePage />,
    requireAuth: true
  },
  {
    name: 'MedicationListsList',
    path: '/medication-lists',
    element: <MedicationListsPage />,
    requireAuth: true
  },
  // Patient-specific routes
  {
    path: '/patient/:id/advance-directives',
    element: <PatientAdvanceDirectives />,
    requireAuth: true
  },
  {
    path: '/advance-directive/:id',
    element: <AdvanceDirectiveDetail />,
    requireAuth: true
  },
  {
    path: '/advance-directive/:id/revoke',
    element: <AdvanceDirectiveRevoke />,
    requireAuth: true
  },
  {
    path: '/patient/:id/transition-of-care',
    element: <PatientTransitionOfCare />,
    requireAuth: true
  },
  {
    path: '/transition-of-care/:id',
    element: <TransitionOfCareDetail />,
    requireAuth: true
  },
  {
    path: '/patient/:id/goals',
    element: <PatientGoals />,
    requireAuth: true
  },
  {
    path: '/patient/:id/medication-lists',
    element: <PatientMedicationLists />,
    requireAuth: true
  },
  {
    path: '/patient/:id/nutrition-orders',
    element: <PatientNutritionOrders />,
    requireAuth: true
  },
  {
    path: '/pdf/:binaryId',
    element: Meteor.PdfViewer ? <Meteor.PdfViewer /> : <div>PdfViewer not available</div>,
    requireAuth: true
  }
];

// SidebarWorkflows - PACIO workflow items
export const SidebarWorkflows = [
  {
    primaryText: 'Facility Dashboard',
    to: '/pacio-dashboard',
    iconName: 'Dashboard'
  },
  {
    primaryText: 'Advance Directives',
    to: '/advance-directives',
    iconName: 'Assignment'
  },
  {
    primaryText: 'Transition of Care',
    to: '/transition-of-care',
    iconName: 'SwapHoriz'
  },
  {
    primaryText: 'Medication Lists',
    to: '/medication-lists',
    iconName: 'LocalPharmacy'
  }
];

// Additional FHIR Resources for sidebar (alphabetically ordered)
export const SidebarElements = [
  {
    primaryText: 'Care Teams',
    to: '/care-teams',
    iconName: 'Groups',
    collectionName: 'CareTeams'
  },
  {
    primaryText: 'Communications',
    to: '/communications',
    iconName: 'envelopeO',
    collectionName: 'Communications'
  },
  {
    primaryText: 'Compositions',
    to: '/compositions',
    iconName: 'document',
    collectionName: 'Compositions'
  },
  {
    primaryText: 'Conditions',
    to: '/conditions',
    iconName: 'LocalHospital',
    collectionName: 'Conditions'
  },
  {
    primaryText: 'Document References',
    to: '/document-references',
    iconName: 'document',
    collectionName: 'DocumentReferences'
  },
  {
    primaryText: 'Goals',
    to: '/goals',
    iconName: 'Flag',
    collectionName: 'Goals'
  },
  {
    primaryText: 'Lists',
    to: '/lists',
    iconName: 'list',
    collectionName: 'Lists'
  },
  {
    primaryText: 'Locations',
    to: '/locations',
    iconName: 'location',
    collectionName: 'Locations'
  },
  {
    primaryText: 'Medication Administrations',
    to: '/medication-administrations',
    iconName: 'LocalPharmacy',
    collectionName: 'MedicationAdminstrations'
  },
  {
    primaryText: 'Medication Requests',
    to: '/medication-requests',
    iconName: 'LocalPharmacy',
    collectionName: 'MedicationRequests'
  },
  {
    primaryText: 'Medications',
    to: '/medications',
    iconName: 'LocalPharmacy',
    collectionName: 'Medications'
  },
  {
    primaryText: 'Nutrition Orders',
    to: '/nutrition-orders',
    iconName: 'Restaurant',
    collectionName: 'NutritionOrders'
  },
  {
    primaryText: 'Observations',
    to: '/observations',
    iconName: 'Visibility',
    collectionName: 'Observations'
  },
  {
    primaryText: 'Patients',
    to: '/patients',
    iconName: 'user',
    collectionName: 'Patients'
  },
  {
    primaryText: 'Practitioners',
    to: '/practitioners',
    iconName: 'userMd',
    collectionName: 'Practitioners'
  },
  {
    primaryText: 'Questionnaire Responses',
    to: '/questionnaire-responses',
    iconName: 'Assignment',
    collectionName: 'QuestionnaireResponses'
  },
  {
    primaryText: 'Service Requests',
    to: '/service-requests',
    iconName: 'Build',
    collectionName: 'ServiceRequests'
  },
  {
    primaryText: 'Tasks',
    to: '/tasks',
    iconName: 'ic_playlist_add_check',
    collectionName: 'Tasks'
  }
];

// Footer Elements
export const FooterElements = [
  {
    label: 'Sync Patient Record',
    className: 'sync-patient-record',
    style: {
      color: '#FFF',
      backgroundColor: '#2196F3',
      marginLeft: '10px'
    },
    onClick: function() {
      const patientId = Session.get('selectedPatientId');
      if (!patientId) {
        Session.set('mainAppDialogJson', {
          title: 'No Patient Selected',
          message: 'Please select a patient before syncing records.'
        });
        return;
      }
      
      Session.set('mainAppDialogJson', {
        title: 'Syncing Patient Record',
        message: 'Synchronizing patient data from FHIR server...'
      });
      
      Meteor.call('pacio.syncPatientRecord', patientId, function(error, result) {
        if (error) {
          Session.set('mainAppDialogJson', {
            title: 'Sync Failed',
            message: error.message
          });
        } else {
          Session.set('mainAppDialogJson', {
            title: 'Sync Complete',
            message: `Successfully synchronized ${result.resourcesUpdated} resources.`
          });
        }
      });
    }
  }
];

// Module Config
export const ModuleConfig = {
  name: 'PacioCoreModule',
  version: '0.1.0',
  fhirResources: [
    'DocumentReference',
    'List',
    'NutritionOrder',
    'Composition'
  ],
  settings: {
    enableWatermarking: true,
    enableAdvanceDirectives: true,
    enableTransitionOfCare: true,
    enableEnhancedGoals: true,
    pdfViewerConfig: {
      enablePrint: false,
      enableDownload: true
    }
  }
};

// Export utilities
export { AdvanceDirectiveUtils } from './lib/utilities/AdvanceDirectiveUtils';
export { PdfUtils } from './lib/utilities/PdfUtils';


export { 
  DynamicRoutes,
  SidebarElements,
  SidebarWorkflows,
  FooterElements,
  ModuleConfig,
  AdvanceDirectiveUtils,
  PdfUtils,
  MainPage
};

import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';

import { 
  Card,
  CardHeader,
  CardContent,
  Container,
  Tab, 
  Tabs,
  Typography,
  Box
} from '@mui/material';


import PatientsTable from '../ui-tables/PatientsTable';
import LayoutHelpers from '../lib/LayoutHelpers';

import { get, has, set } from 'lodash';

  
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';



let defaultPatient = {
  index: 2,
  id: '',
  username: '',
  email: '',
  given: '',
  family: '',
  gender: ''
};



//===========================================================================

Meteor.startup(function(){
  Patients = Meteor.Collections.Patients;
})

//===========================================================================
// SESSION VARIABLES

Session.setDefault('patientFormData', defaultPatient);
Session.setDefault('patientSearchFilter', '');
Session.setDefault('selectedPatientId', '');
Session.setDefault('selectedPatient', '');
Session.setDefault('fhirVersion', 'v1.0.2');
Session.setDefault('patientPageTabIndex', 0)
Session.setDefault('PatientsDirectory.onePageLayout', true)
Session.setDefault('PatientsDirectory.defaultQuery', {})
Session.setDefault('PatientsTable.hideCheckbox', true)
Session.setDefault('PatientsTable.patientsIndex', 0)


//===========================================================================
// MAIN COMPONENT  

export function PatientsDirectory(props){

  let data = {
    selectedPatientId: '',
    selectedPatient: null,
    patients: [],
    onePageLayout: true,
    showSystemIds: false,
    showFhirIds: false,
    organizationsIndex: 0
  };

  data.onePageLayout = useTracker(function(){
    return Session.get('PatientsDirectory.onePageLayout');
  }, [])
  data.hideCheckbox = useTracker(function(){
    return Session.get('PatientsTable.hideCheckbox');
  }, [])
  data.selectedPatientId = useTracker(function(){
    return Session.get('selectedPatientId');
  }, [])
  data.selectedPatient = useTracker(function(){
    return Patients.findOne({_id: Session.get('selectedPatientId')});
  }, [])
  data.patients = useTracker(function(){
    return Patients.find().fetch();
  }, [])
  data.patientsIndex = useTracker(function(){
    return Session.get('PatientsTable.patientsIndex')
  }, [])
  data.showSystemIds = useTracker(function(){
    return Session.get('showSystemIds');
  }, [])
  data.showFhirIds = useTracker(function(){
    return Session.get('showFhirIds');
  }, [])

  // let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  // let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();
  
  let noDataImage = get(Meteor, 'settings.public.defaults.noData.noDataImagePath', "packages/clinical_hl7-fhir-data-infrastructure/assets/NoData.png");  


  let layoutContent;
  if(data.patients.length > 0){
    layoutContent = <Card height="auto" scrollable={true} margin={20} >
      <CardHeader title={data.patients.length + " Patients"} />
      <CardContent>
        <PatientsTable 
          noDataMessagePadding={100}
          patients={ data.patients }
          count={data.patients.length}
          rowClickMode="id"
          onRowClick={function(patientId){
            console.log('onTableRowClick', patientId);

            Session.set('selectedPatientId', patientId);
            Session.set('selectedPatient', Patients.findOne({id: patientId}));

            console.log('openUrlOnRowClick', get(Meteor, 'settings.public.modules.fhir.Patients.openUrlOnRowClick', ''))
            if(get(Meteor, 'settings.public.modules.fhir.Patients.openUrlOnRowClick')){
              props.history.replace(get(Meteor, 'settings.public.modules.fhir.Patients.openUrlOnRowClick', '/'))
            }
          }}
          onSetPage={function(index){
            setPatientsIndex(index)
          }}
          page={data.patientsIndex}
          formFactorLayout={formFactor}    
          rowsPerPage={LayoutHelpers.calcTableRows()}      
          logger={window.logger ? window.logger : null}
          size="medium"
        />   
      </CardContent>
    </Card>
  } else {
    layoutContent = <Container maxWidth="sm" >
      {/* <img src={Meteor.absoluteUrl() + noDataImage} style={{width: '100%', marginTop: get(Meteor, 'settings.public.defaults.noData.marginTop', '-200px')}} />     */}
      <CardContent>
        <CardHeader 
          title={get(Meteor, 'settings.public.defaults.noData.defaultTitle', "No Data Available")} 
          subheader={get(Meteor, 'settings.public.defaults.noData.defaultMessage', "No records were found in the client data cursor.  To debug, check the data cursor in the client console, then check subscriptions and publications, and relevant search queries.  If the data is not loaded in, use a tool like Mongo Compass to load the records directly into the Mongo database, or use the FHIR API interfaces.")} 
        />
      </CardContent>
    </Container>
  }

  return (
    <div id="PatientsDirectoryClass" style={{padding: '20px'}}>
      { layoutContent }
    </div>
  );
}


export default PatientsDirectory;



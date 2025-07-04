import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader,
  Typography, 
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  IconButton,
  Breadcrumbs,
  Link,
  Paper,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Alert
} from '@mui/material';

import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab';

import { get } from 'lodash';
import moment from 'moment';

import HomeIcon from '@mui/icons-material/Home';
import TransferWithinAStationIcon from '@mui/icons-material/TransferWithinAStation';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HospitalIcon from '@mui/icons-material/LocalHospital';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import UploadIcon from '@mui/icons-material/Upload';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';

import { Compositions } from '../lib/schemas/SimpleSchemas/Compositions';
import { DocumentReferences } from '../lib/schemas/SimpleSchemas/DocumentReferences';
import { Encounters } from '../lib/schemas/SimpleSchemas/Encounters';
import { Organizations } from '../lib/schemas/SimpleSchemas/Organizations';


const transitionSections = [
  { id: 'patient-info', title: 'Patient Information', required: true },
  { id: 'diagnoses', title: 'Diagnoses & Problems', required: true },
  { id: 'medications', title: 'Medications', required: true },
  { id: 'allergies', title: 'Allergies & Intolerances', required: true },
  { id: 'functional-status', title: 'Functional Status', required: false },
  { id: 'cognitive-status', title: 'Cognitive Status', required: false },
  { id: 'care-preferences', title: 'Care Preferences', required: false },
  { id: 'care-team', title: 'Care Team', required: true },
  { id: 'discharge-instructions', title: 'Discharge Instructions', required: true },
  { id: 'nutrition', title: 'Nutrition Orders', required: false },
  { id: 'skin-conditions', title: 'Skin Conditions', required: false },
  { id: 'immunizations', title: 'Immunizations', required: false },
  { id: 'vital-signs', title: 'Vital Signs', required: false },
  { id: 'social-history', title: 'Social History', required: false },
  { id: 'equipment', title: 'Medical Equipment', required: false },
  { id: 'follow-up', title: 'Follow-up Appointments', required: true }
];

function TransitionsOfCarePage(props) {
  const [selectedTransition, setSelectedTransition] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [completedSections, setCompletedSections] = useState({});
  
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const data = useTracker(() => {
    const patientId = Session.get('selectedPatientId');
    
    let query = {};
    if(patientId){
      query = { 
        'subject.reference': { 
          $in: [`Patient/${patientId}`, `urn:uuid:${patientId}`] 
        } 
      };
    }

    const compositions = Compositions.find({
      ...query,
      'type.coding.code': { $in: ['18842-5', '34133-9'] }
    }).fetch();

    const encounters = Encounters.find(query).fetch();
    const documentReferences = DocumentReferences.find(query).fetch();

    return {
      compositions,
      encounters,
      documentReferences,
      patientId
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCCDA = () => {
    console.log('C-CDA export hook - implement connection to external module');
  };

  const handleImportCCDA = () => {
    console.log('C-CDA import hook - implement connection to external module');
  };

  const getEncounterIcon = (encounter) => {
    const type = get(encounter, 'class.code', '');
    if(type.includes('hosp')) return <HospitalIcon />;
    if(type.includes('home')) return <HomeWorkIcon />;
    return <TransferWithinAStationIcon />;
  };

  const getEncounterLocation = (encounter) => {
    const location = get(encounter, 'location[0].location.display', '');
    const org = get(encounter, 'serviceProvider.display', '');
    return location || org || 'Unknown Location';
  };

  const getSectionCompleteness = () => {
    const total = transitionSections.length;
    const completed = Object.values(completedSections).filter(v => v).length;
    return Math.round((completed / total) * 100);
  };

  return (
    <Container maxWidth="xl" sx={{ pt: 3, pb: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link 
            color="inherit" 
            href="/" 
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Home
          </Link>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
            <TransferWithinAStationIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Transitions of Care
          </Typography>
        </Breadcrumbs>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Care Journey Timeline" />
            <CardContent>
              <Timeline position="alternate">
                {data.encounters.map((encounter, index) => (
                  <TimelineItem key={encounter._id}>
                    <TimelineOppositeContent color="text.secondary">
                      {moment(get(encounter, 'period.start')).format('MMM DD, YYYY')}
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot color={index === 0 ? 'primary' : 'grey'}>
                        {getEncounterIcon(encounter)}
                      </TimelineDot>
                      {index < data.encounters.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Paper 
                        elevation={3} 
                        sx={{ p: 2, cursor: 'pointer' }}
                        onClick={() => setSelectedTransition(encounter)}
                      >
                        <Typography variant="subtitle2" component="h6">
                          {getEncounterLocation(encounter)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {get(encounter, 'type[0].text', get(encounter, 'type[0].coding[0].display', 'Care Episode'))}
                        </Typography>
                      </Paper>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader 
              title="Continuity of Care Documents"
              subheader={selectedTransition ? 
                `${getEncounterLocation(selectedTransition)} - ${moment(get(selectedTransition, 'period.start')).format('MMMM DD, YYYY')}` : 
                'Select a transition from the timeline'
              }
              action={
                <Box>
                  <IconButton onClick={handleImportCCDA} title="Import C-CDA">
                    <UploadIcon />
                  </IconButton>
                  <IconButton onClick={handleExportCCDA} title="Export C-CDA">
                    <DownloadIcon />
                  </IconButton>
                  <IconButton onClick={handlePrint}>
                    <PrintIcon />
                  </IconButton>
                </Box>
              }
            />
            <CardContent>
              {selectedTransition ? (
                <>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Document Completeness: {getSectionCompleteness()}%
                  </Alert>
                  
                  {transitionSections.map((section) => (
                    <Accordion 
                      key={section.id}
                      expanded={expandedSections[section.id] || false}
                      onChange={() => toggleSection(section.id)}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <Checkbox
                            checked={completedSections[section.id] || false}
                            onChange={(e) => {
                              e.stopPropagation();
                              setCompletedSections(prev => ({
                                ...prev,
                                [section.id]: !prev[section.id]
                              }));
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Typography sx={{ flexGrow: 1 }}>
                            {section.title}
                          </Typography>
                          {section.required && (
                            <Chip 
                              label="Required" 
                              size="small" 
                              color="primary" 
                              sx={{ mr: 1 }}
                            />
                          )}
                          {completedSections[section.id] ? (
                            <CheckCircleIcon color="success" />
                          ) : (
                            <PendingIcon color="action" />
                          )}
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography color="text.secondary">
                          Section content for {section.title} would be displayed here.
                          This would include relevant FHIR resources and forms.
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <TransferWithinAStationIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Select a care transition from the timeline to view details
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default TransitionsOfCarePage;
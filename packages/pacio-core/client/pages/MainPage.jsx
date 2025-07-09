// /packages/pacio-core/client/pages/MainPage.jsx

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';
import moment from 'moment';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  AvatarGroup,
  Tooltip,
  Badge,
  ToggleButton,
  ToggleButtonGroup,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction
} from '@mui/material';
import {
  People as PeopleIcon,
  LocalHospital as LocalHospitalIcon,
  Bed as BedIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  LocationOn as LocationOnIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  SwapHoriz as SwapHorizIcon,
  Assignment as AssignmentIcon,
  Group as GroupIcon,
  Map as MapIcon,
  MoreVert as MoreVertIcon,
  CalendarToday as CalendarTodayIcon,
  Hotel as HotelIcon,
  PersonOff as PersonOffIcon,
  Cleaning as CleaningIcon,
  Build as BuildIcon,
  Emergency as EmergencyIcon,
  Notifications as NotificationsIcon,
  GridView as GridViewIcon,
  ViewList as ViewListIcon,
  Circle as CircleIcon,
  Info as InfoIcon,
  LocalPharmacy as LocalPharmacyIcon
} from '@mui/icons-material';

export function MainPage() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [bedStatusHeight, setBedStatusHeight] = useState(600);

  // Calculate dynamic height for bed status area
  useEffect(() => {
    const calculateHeight = () => {
      // Header ~80px, Top metrics ~120px, padding ~32px, margin ~32px
      const reservedHeight = 80 + 120 + 32 + 32;
      const availableHeight = window.innerHeight - reservedHeight;
      setBedStatusHeight(Math.max(400, availableHeight)); // Minimum 400px
    };

    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    
    return () => window.removeEventListener('resize', calculateHeight);
  }, []);

  // Mock data for medical home dashboard (1-16 beds)
  const facilityData = useTracker(() => {
    return {
      facility: {
        id: 'mh-001',
        name: 'Willow Creek Medical Home',
        type: 'Medical Home',
        address: '789 Healing Way, Springfield, IL 62704',
        lat: 39.7895,
        lng: -89.6387,
        totalBeds: 16,
        occupiedBeds: 14,
        staff: {
          nurses: 3,
          cnas: 4,
          therapists: 2,
          other: 2
        }
      },
      beds: generateBedData(),
      recentAlerts: [
        { id: 1, bedId: 'B03', type: 'medical', message: 'Abnormal vitals detected - Bed 3', time: moment().subtract(8, 'minutes'), priority: 'high' },
        { id: 2, bedId: 'B07', type: 'call', message: 'Call button activated - Bed 7', time: moment().subtract(15, 'minutes'), priority: 'medium' },
        { id: 3, bedId: 'B12', type: 'medical', message: 'Medication due - Bed 12', time: moment().subtract(25, 'minutes'), priority: 'low' },
        { id: 4, bedId: 'B01', type: 'fall', message: 'Fall prevention protocol - Bed 1', time: moment().subtract(45, 'minutes'), priority: 'high' }
      ]
    };
  }, []);

  // Generate mock bed data for medical home
  function generateBedData() {
    const beds = [];
    const totalBeds = 16;
    
    for (let bedNum = 1; bedNum <= totalBeds; bedNum++) {
      const bedId = `B${bedNum.toString().padStart(2, '0')}`;
      const isOccupied = bedNum <= 14; // 14 out of 16 beds occupied
      
      beds.push({
        id: bedId,
        number: bedNum,
        status: isOccupied ? 'occupied' : 'vacant',
        patient: isOccupied ? generatePatient(bedId) : null,
        lastUpdated: moment().subtract(Math.random() * 120, 'minutes')
      });
    }
    
    return beds;
  }

  function generatePatient(bedId) {
    const firstNames = ['John', 'Mary', 'Robert', 'Patricia', 'James', 'Barbara', 'William', 'Elizabeth', 'Michael', 'Linda'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Martinez'];
    const conditions = ['Diabetes Management', 'Post-Surgical Recovery', 'Cardiac Monitoring', 'Respiratory Care', 'Wound Care', 'Physical Therapy'];
    const physicians = ['Dr. Sarah Chen', 'Dr. James Wilson', 'Dr. Maria Rodriguez', 'Dr. David Thompson'];
    
    return {
      name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
      age: Math.floor(Math.random() * 40) + 50,
      mrn: `MRN-${Math.floor(Math.random() * 900000) + 100000}`,
      admitDate: moment().subtract(Math.floor(Math.random() * 30), 'days'),
      primaryCondition: conditions[Math.floor(Math.random() * conditions.length)],
      physician: physicians[Math.floor(Math.random() * physicians.length)],
      acuityLevel: ['Stable', 'Stable', 'Monitoring', 'Critical'][Math.floor(Math.random() * 4)],
      vitals: {
        bp: `${110 + Math.floor(Math.random() * 30)}/${70 + Math.floor(Math.random() * 20)}`,
        hr: 60 + Math.floor(Math.random() * 40),
        temp: (97.5 + Math.random() * 2).toFixed(1),
        o2: 94 + Math.floor(Math.random() * 6),
        rr: 12 + Math.floor(Math.random() * 8),
        lastChecked: moment().subtract(Math.floor(Math.random() * 60), 'minutes')
      },
      medications: {
        nextDue: moment().add(Math.floor(Math.random() * 240), 'minutes'),
        count: Math.floor(Math.random() * 5) + 2
      },
      labs: {
        pending: Math.floor(Math.random() * 3),
        critical: Math.random() > 0.8 ? 1 : 0
      },
      tasks: {
        pending: Math.floor(Math.random() * 5),
        overdue: Math.random() > 0.7 ? Math.floor(Math.random() * 2) + 1 : 0
      },
      fallRisk: Math.random() > 0.6,
      isolation: Math.random() > 0.85,
      dietRestrictions: Math.random() > 0.5 ? ['NPO', 'Low Sodium', 'Diabetic', 'Pureed'][Math.floor(Math.random() * 4)] : null
    };
  }

  // Filter beds based on selection
  const filteredBeds = facilityData.beds.filter(bed => {
    if (selectedFilter === 'occupied' && bed.status !== 'occupied') return false;
    if (selectedFilter === 'vacant' && bed.status !== 'vacant') return false;
    if (selectedFilter === 'critical' && bed.patient?.acuityLevel !== 'Critical') return false;
    return true;
  });

  // Get acuity level color
  const getAcuityColor = (level) => {
    const colors = {
      'Stable': '#4caf50',
      'Monitoring': '#ff9800',
      'Critical': '#f44336'
    };
    return colors[level] || '#757575';
  };

  // Get vital status color
  const getVitalColor = (vital, value) => {
    switch(vital) {
      case 'o2':
        return value < 95 ? '#f44336' : '#4caf50';
      case 'hr':
        return (value < 60 || value > 100) ? '#ff9800' : '#4caf50';
      case 'temp':
        return (parseFloat(value) < 97.0 || parseFloat(value) > 99.5) ? '#ff9800' : '#4caf50';
      default:
        return '#4caf50';
    }
  };

  // Get alert icon
  const getAlertIcon = (type) => {
    switch(type) {
      case 'fall': return <WarningIcon color="error" />;
      case 'call': return <NotificationsIcon color="primary" />;
      case 'medical': return <LocalHospitalIcon color="warning" />;
      default: return <InfoIcon />;
    }
  };

  return (
    <Box sx={{ p: 2, height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h4" component="h1">
            {facilityData.facility.name}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            <LocationOnIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            {facilityData.facility.address}
          </Typography>
        </Box>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Filter</InputLabel>
            <Select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              label="Filter"
            >
              <MenuItem value="all">All Beds</MenuItem>
              <MenuItem value="occupied">Occupied</MenuItem>
              <MenuItem value="vacant">Vacant</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<PeopleIcon />}
            size="small"
          >
            New Admission
          </Button>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {facilityData.facility.occupiedBeds}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Occupied Beds
                  </Typography>
                </Box>
                <BedIcon color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {((facilityData.facility.occupiedBeds / facilityData.facility.totalBeds) * 100).toFixed(0)}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Occupancy Rate
                  </Typography>
                </Box>
                <TrendingUpIcon color="success" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {facilityData.recentAlerts.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Active Alerts
                  </Typography>
                </Box>
                <Badge badgeContent={facilityData.recentAlerts.filter(a => a.priority === 'high').length} color="error">
                  <NotificationsIcon color="warning" />
                </Badge>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {facilityData.facility.staff.nurses + facilityData.facility.staff.cnas}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Staff on Duty
                  </Typography>
                </Box>
                <GroupIcon color="info" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* Bed Status Cards */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: `${bedStatusHeight}px`, overflow: 'auto' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Bed Status ({filteredBeds.length} beds)
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Last updated: {moment().format('h:mm A')}
              </Typography>
            </Box>
            
            <Grid container spacing={2}>
              {filteredBeds.map(bed => (
                <Grid item xs={12} key={bed.id}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      borderLeft: bed.patient ? `4px solid ${getAcuityColor(bed.patient.acuityLevel)}` : '4px solid #e0e0e0',
                      '&:hover': { boxShadow: 2 }
                    }}
                  >
                    <CardContent>
                      {bed.patient ? (
                        <Box>
                          {/* Header Row */}
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                            <Box>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="h6" component="span">
                                  Bed {bed.number}
                                </Typography>
                                <Chip 
                                  label={bed.patient.acuityLevel} 
                                  size="small" 
                                  sx={{ 
                                    bgcolor: getAcuityColor(bed.patient.acuityLevel),
                                    color: 'white'
                                  }}
                                />
                                {bed.patient.isolation && (
                                  <Chip 
                                    label="Isolation" 
                                    size="small" 
                                    color="error"
                                    icon={<WarningIcon />}
                                  />
                                )}
                              </Box>
                              <Typography variant="body1" fontWeight="medium">
                                {bed.patient.name}, {bed.patient.age}y
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {bed.patient.mrn} • Admitted {bed.patient.admitDate.fromNow()}
                              </Typography>
                            </Box>
                            <IconButton size="small">
                              <MoreVertIcon />
                            </IconButton>
                          </Box>

                          {/* Main Content Grid */}
                          <Grid container spacing={2}>
                            {/* Patient Info Column */}
                            <Grid item xs={12} sm={4}>
                              <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                                PRIMARY CONDITION
                              </Typography>
                              <Typography variant="body2" gutterBottom>
                                {bed.patient.primaryCondition}
                              </Typography>
                              <Typography variant="caption" color="textSecondary" display="block" mt={1}>
                                ATTENDING
                              </Typography>
                              <Typography variant="body2">
                                {bed.patient.physician}
                              </Typography>
                              {bed.patient.dietRestrictions && (
                                <>
                                  <Typography variant="caption" color="textSecondary" display="block" mt={1}>
                                    DIET
                                  </Typography>
                                  <Typography variant="body2">
                                    {bed.patient.dietRestrictions}
                                  </Typography>
                                </>
                              )}
                            </Grid>

                            {/* Vitals Column */}
                            <Grid item xs={12} sm={4}>
                              <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                                VITALS ({bed.patient.vitals.lastChecked.fromNow()})
                              </Typography>
                              <Box display="flex" flexWrap="wrap" gap={1}>
                                <Chip 
                                  label={`BP: ${bed.patient.vitals.bp}`} 
                                  size="small" 
                                  variant="outlined"
                                />
                                <Chip 
                                  label={`HR: ${bed.patient.vitals.hr}`} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ borderColor: getVitalColor('hr', bed.patient.vitals.hr) }}
                                />
                                <Chip 
                                  label={`Temp: ${bed.patient.vitals.temp}°F`} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ borderColor: getVitalColor('temp', bed.patient.vitals.temp) }}
                                />
                                <Chip 
                                  label={`O2: ${bed.patient.vitals.o2}%`} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ borderColor: getVitalColor('o2', bed.patient.vitals.o2) }}
                                />
                                <Chip 
                                  label={`RR: ${bed.patient.vitals.rr}`} 
                                  size="small" 
                                  variant="outlined"
                                />
                              </Box>
                              <Box display="flex" gap={1} mt={1}>
                                {bed.patient.fallRisk && (
                                  <Chip 
                                    label="Fall Risk" 
                                    size="small" 
                                    color="warning"
                                    icon={<WarningIcon />}
                                  />
                                )}
                              </Box>
                            </Grid>

                            {/* Workflow Column */}
                            <Grid item xs={12} sm={4}>
                              <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                                WORKFLOW
                              </Typography>
                              <Box display="flex" flexDirection="column" gap={0.5}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <LocalPharmacyIcon fontSize="small" color="action" />
                                  <Typography variant="body2">
                                    Next med: {bed.patient.medications.nextDue.format('h:mm A')}
                                  </Typography>
                                </Box>
                                {bed.patient.labs.pending > 0 && (
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <AssessmentIcon fontSize="small" color="action" />
                                    <Typography variant="body2">
                                      {bed.patient.labs.pending} lab{bed.patient.labs.pending > 1 ? 's' : ''} pending
                                      {bed.patient.labs.critical > 0 && (
                                        <Chip 
                                          label="Critical" 
                                          size="small" 
                                          color="error"
                                          sx={{ ml: 1, height: 20 }}
                                        />
                                      )}
                                    </Typography>
                                  </Box>
                                )}
                                {bed.patient.tasks.pending > 0 && (
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <AssignmentIcon fontSize="small" color={bed.patient.tasks.overdue > 0 ? 'error' : 'action'} />
                                    <Typography variant="body2" color={bed.patient.tasks.overdue > 0 ? 'error' : 'textPrimary'}>
                                      {bed.patient.tasks.pending} task{bed.patient.tasks.pending > 1 ? 's' : ''}
                                      {bed.patient.tasks.overdue > 0 && ` (${bed.patient.tasks.overdue} overdue)`}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                      ) : (
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar sx={{ bgcolor: 'grey.300' }}>
                              <BedIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="h6">
                                Bed {bed.number}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Vacant
                              </Typography>
                            </Box>
                          </Box>
                          <Button variant="outlined" size="small" startIcon={<PeopleIcon />}>
                            Assign Patient
                          </Button>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Right Side - Map and Alerts */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={2}>
            {/* Map View */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, height: `${(bedStatusHeight - 10) / 2}px` }}>
                <Typography variant="h6" gutterBottom>
                  Facility Location
                </Typography>
                <Box 
                  sx={{ 
                    height: 'calc(100% - 40px)', 
                    bgcolor: 'grey.200', 
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Map placeholder - in real implementation, use Google Maps or similar */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundImage: `url("https://api.mapbox.com/styles/v1/mapbox/light-v10/static/${facilityData.facility.lng},${facilityData.facility.lat},14,0/400x240@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw")`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                  <LocationOnIcon 
                    sx={{ 
                      fontSize: 40, 
                      color: 'error.main',
                      zIndex: 1,
                      filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
                    }} 
                  />
                </Box>
              </Paper>
            </Grid>

            {/* Recent Alerts */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, height: `${(bedStatusHeight - 10) / 2}px`, overflow: 'auto' }}>
                <Typography variant="h6" gutterBottom>
                  Recent Alerts
                </Typography>
                <List dense>
                  {facilityData.recentAlerts.map((alert) => (
                    <ListItem key={alert.id}>
                      <ListItemIcon>
                        {getAlertIcon(alert.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={alert.message}
                        secondary={alert.time.fromNow()}
                        primaryTypographyProps={{
                          variant: 'body2',
                          color: alert.priority === 'high' ? 'error' : 'textPrimary'
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          </Grid>
        </Grid>

      </Grid>
    </Box>
  );
}
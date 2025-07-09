// imports/ui/App.jsx
import React, { useState, useMemo, useCallback } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { makeStyles } from '@mui/styles';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
  CircularProgress,
  Box,
  Chip,
} from '@mui/material';
import { CloudUpload, Image, LocalHospital } from '@mui/icons-material';
import { DicomFiles, DicomStudies, DicomSeries } from '../api/dicom/collection';
import DicomViewer from './components/DicomViewer';
import MultiFormatUploader from './components/MultiFormatUploader';
import { get } from 'lodash';
import moment from 'moment';

const useStyles = makeStyles(function(theme) {
  return {
    root: {
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
    },
    appBar: {
      zIndex: theme.zIndex.drawer + 1,
    },
    content: {
      flex: 1,
      padding: theme.spacing(2),
      overflow: 'hidden',
    },
    sidebar: {
      height: 'calc(100vh - 120px)',
      overflow: 'auto',
    },
    viewer: {
      height: 'calc(100vh - 120px)',
    },
    uploadButton: {
      margin: theme.spacing(2),
    },
    studyItem: {
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
    seriesItem: {
      paddingLeft: theme.spacing(4),
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
    imageItem: {
      paddingLeft: theme.spacing(6),
    },
    selectedItem: {
      backgroundColor: theme.palette.action.selected,
    },
    conversionChip: {
      marginLeft: theme.spacing(1),
      height: 20,
    },
  };
});

function App() {
  const classes = useStyles();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [expandedStudy, setExpandedStudy] = useState(null);
  const [expandedSeries, setExpandedSeries] = useState(null);
  const [bulkUploading, setBulkUploading] = useState(false);

  // PERFORMANCE FIX: Throttle subscriptions during bulk upload
  const { studies, series, images, loading, conversionStats } = useTracker(function() {
    // Reduce subscription frequency during bulk operations
    if (bulkUploading) {
      return {
        studies: [],
        series: [],
        images: [],
        loading: true,
        conversionStats: null
      };
    }

    const studiesHandle = Meteor.subscribe('dicom.studies');
    const seriesHandle = expandedStudy ? Meteor.subscribe('dicom.series', expandedStudy) : { ready: function() { return true; } };
    const imagesHandle = expandedSeries ? Meteor.subscribe('dicom.seriesImages', expandedSeries) : { ready: function() { return true; } };

    // Get basic conversion statistics
    const totalFiles = DicomFiles.find({}).count();
    const convertedFiles = DicomFiles.find({ wasConverted: true }).count();

    return {
      studies: DicomStudies.find({}, { sort: { studyDate: -1, studyTime: -1 } }).fetch(),
      series: expandedStudy ? DicomSeries.find({ studyInstanceUID: expandedStudy }).fetch() : [],
      images: expandedSeries ? DicomFiles.find({ seriesInstanceUID: expandedSeries }, { sort: { instanceNumber: 1 } }).fetch() : [],
      loading: !studiesHandle.ready() || !seriesHandle.ready() || !imagesHandle.ready(),
      conversionStats: {
        total: totalFiles,
        converted: convertedFiles,
        native: totalFiles - convertedFiles
      }
    };
  }, [expandedStudy, expandedSeries, bulkUploading]);

  const selectedFileData = useTracker(function() {
    if (!selectedFile) return null;
    
    const handle = Meteor.subscribe('dicom.fileData', selectedFile._id);
    if (!handle.ready()) return null;
    
    return DicomFiles.findOne({ _id: selectedFile._id });
  }, [selectedFile]);

  // PERFORMANCE FIX: Memoize event handlers
  const handleStudyClick = useCallback(function(study) {
    if (expandedStudy === study.studyInstanceUID) {
      setExpandedStudy(null);
      setExpandedSeries(null);
      setSelectedFile(null);
    } else {
      setExpandedStudy(study.studyInstanceUID);
      setExpandedSeries(null);
      setSelectedFile(null);
    }
  }, [expandedStudy]);

  const handleSeriesClick = useCallback(function(seriesItem) {
    if (expandedSeries === seriesItem.seriesInstanceUID) {
      setExpandedSeries(null);
      setSelectedFile(null);
    } else {
      setExpandedSeries(seriesItem.seriesInstanceUID);
      setSelectedFile(null);
    }
  }, [expandedSeries]);

  const handleImageClick = useCallback(function(image) {
    setSelectedFile(image);
  }, []);

  const handleUploadComplete = useCallback(function() {
    setUploadDialogOpen(false);
    setBulkUploading(false);
    // Refresh data by resetting expanded states
    setExpandedStudy(null);
    setExpandedSeries(null);
    setSelectedFile(null);
  }, []);

  const handleUploadStart = useCallback(function() {
    setBulkUploading(true);
  }, []);

  // PERFORMANCE FIX: Memoize date formatting
  const formatStudyDate = useMemo(function() {
    return function(dateString) {
      if (!dateString || dateString === 'Unknown Date') {
        return 'Unknown Date';
      }
      
      // Try to parse the date safely
      const parsed = moment(dateString, 'YYYY-MM-DD', true);
      if (parsed.isValid()) {
        return parsed.format('MMM DD, YYYY');
      }
      
      return dateString;
    };
  }, []);

  // DOM FIX: Create proper secondary text component that avoids nesting issues
  const StudySecondaryText = useCallback(function({ study }) {
    const patientId = get(study, 'patientId', 'No ID');
    const studyDate = formatStudyDate(get(study, 'studyDate'));
    const modality = get(study, 'modality', 'Unknown');
    const studyDescription = get(study, 'studyDescription', 'No Description');
    
    // Add conversion indicator
    const hasConvertedImages = get(study, 'hasConvertedImages', false);
    const conversionIndicator = hasConvertedImages ? ' • Contains converted images' : '';
    
    // Return a simple string instead of nested components to avoid DOM nesting issues
    return `${patientId} • ${studyDate} - ${modality} • ${studyDescription}${conversionIndicator}`;
  }, [formatStudyDate]);

  const SeriesSecondaryText = useCallback(function({ seriesItem }) {
    const modality = get(seriesItem, 'modality', 'Unknown');
    const hasConverted = get(seriesItem, 'hasConvertedImages', false);
    const conversionSource = get(seriesItem, 'conversionSource', '');
    
    let text = `${modality} Series`;
    if (hasConverted && conversionSource) {
      text += ` • Converted from ${conversionSource.toUpperCase()}`;
    }
    
    return text;
  }, []);

  return (
    <div className={classes.root}>
      <AppBar position="static" className={classes.appBar}>
        <Toolbar>
          <Typography variant="h6" style={{ flexGrow: 1 }}>
            DICOM Viewer
          </Typography>
          
          {/* Show conversion stats */}
          {conversionStats && conversionStats.total > 0 && (
            <Box display="flex" alignItems="center" mr={2}>
              <Chip
                icon={<LocalHospital />}
                label={`${conversionStats.native} DICOM`}
                size="small"
                color="primary"
                variant="outlined"
                style={{ marginRight: 8 }}
              />
              {conversionStats.converted > 0 && (
                <Chip
                  icon={<Image />}
                  label={`${conversionStats.converted} Converted`}
                  size="small"
                  color="secondary"
                  variant="outlined"
                />
              )}
            </Box>
          )}
          
          <Button
            color="inherit"
            startIcon={<CloudUpload />}
            onClick={function() { setUploadDialogOpen(true); }}
            disabled={bulkUploading}
          >
            {bulkUploading ? 'Processing...' : 'Upload Images'}
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth={false} className={classes.content}>
        <Grid container spacing={2} style={{ height: '100%' }}>
          <Grid item xs={4}>
            <Paper className={classes.sidebar}>
              {loading ? (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress />
                </Box>
              ) : (
                <List dense>
                  {studies.map(function(study) {
                    const isExpanded = expandedStudy === study.studyInstanceUID;
                    return (
                      <div key={study._id}>
                        <ListItem
                          button
                          onClick={function() { handleStudyClick(study); }}
                          className={classes.studyItem}
                        >
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center">
                                {get(study, 'patientName', 'Unknown Patient')}
                                {get(study, 'hasConvertedImages', false) && (
                                  <Chip
                                    label="Mixed"
                                    size="small"
                                    color="secondary"
                                    className={classes.conversionChip}
                                  />
                                )}
                              </Box>
                            }
                            secondary={<StudySecondaryText study={study} />}
                          />
                        </ListItem>
                        
                        {isExpanded && series.map(function(seriesItem) {
                          const isSeriesExpanded = expandedSeries === seriesItem.seriesInstanceUID;
                          return (
                            <div key={seriesItem._id}>
                              <ListItem
                                button
                                onClick={function() { handleSeriesClick(seriesItem); }}
                                className={classes.seriesItem}
                              >
                                <ListItemText
                                  primary={
                                    <Box display="flex" alignItems="center">
                                      {get(seriesItem, 'seriesDescription', 'No Description')}
                                      {get(seriesItem, 'hasConvertedImages', false) && (
                                        <Chip
                                          label={get(seriesItem, 'conversionSource', 'IMG').toUpperCase()}
                                          size="small"
                                          color="secondary"
                                          className={classes.conversionChip}
                                        />
                                      )}
                                    </Box>
                                  }
                                  secondary={<SeriesSecondaryText seriesItem={seriesItem} />}
                                />
                              </ListItem>
                              
                              {isSeriesExpanded && images.map(function(image) {
                                const isSelected = selectedFile && selectedFile._id === image._id;
                                return (
                                  <ListItem
                                    key={image._id}
                                    button
                                    onClick={function() { handleImageClick(image); }}
                                    className={`${classes.imageItem} ${isSelected ? classes.selectedItem : ''}`}
                                  >
                                    <ListItemText
                                      primary={
                                        <Box display="flex" alignItems="center">
                                          {`Instance ${get(image, 'instanceNumber', '1')}`}
                                          {get(image, 'wasConverted', false) && (
                                            <Chip
                                              label={get(image, 'originalFormat', 'IMG').toUpperCase()}
                                              size="small"
                                              color="secondary"
                                              className={classes.conversionChip}
                                            />
                                          )}
                                        </Box>
                                      }
                                      secondary={
                                        get(image, 'wasConverted', false) 
                                          ? get(image, 'originalFileName', 'Unknown File')
                                          : get(image, 'fileName', 'Unknown File')
                                      }
                                    />
                                  </ListItem>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </List>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={8}>
            <div className={classes.viewer}>
              {selectedFile && selectedFileData && !bulkUploading ? (
                <DicomViewer 
                  imageData={get(selectedFileData, 'fileData')}
                  fileName={
                    get(selectedFileData, 'wasConverted', false) 
                      ? `${get(selectedFileData, 'originalFileName', 'Unknown')} (converted)`
                      : get(selectedFileData, 'fileName', 'Unknown')
                  }
                />
              ) : (
                <Paper style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      {bulkUploading ? 'Processing upload...' : 'Select a medical image to view'}
                    </Typography>
                    {!bulkUploading && conversionStats && conversionStats.total === 0 && (
                      <Typography variant="body2" color="textSecondary">
                        Upload DICOM files or images (JPG, PNG) to get started
                      </Typography>
                    )}
                  </Box>
                </Paper>
              )}
            </div>
          </Grid>
        </Grid>
      </Container>

      <MultiFormatUploader
        open={uploadDialogOpen}
        onClose={function() { setUploadDialogOpen(false); }}
        onUploadComplete={handleUploadComplete}
        onUploadStart={handleUploadStart}
      />
    </div>
  );
}

export default App;
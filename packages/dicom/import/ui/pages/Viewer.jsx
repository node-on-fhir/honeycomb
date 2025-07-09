import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useDicom } from '/imports/ui/contexts/DicomContext';
import { useViewer } from '/imports/ui/contexts/ViewerContext';

/**
 * Main DICOM viewer page
 */
export default function Viewer() {
  const { currentStudy, currentSeries } = useDicom();
  const { layout, activeTool } = useViewer();
  
  if (!currentStudy) {
    return (
      <Box p={3} textAlign="center">
        <Typography variant="h6" color="text.secondary">
          No study selected
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please select a study from the study list to view DICOM images.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Viewer Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">
          {currentStudy.patientName} - {currentStudy.studyDescription}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Study Date: {currentStudy.studyDate ? new Date(currentStudy.studyDate).toLocaleDateString() : 'Unknown'}
          {currentSeries && ` | Series: ${currentSeries.seriesDescription || 'Unknown'}`}
        </Typography>
      </Box>
      
      {/* Viewer Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Main Viewport Area */}
        <Box sx={{ flexGrow: 1, position: 'relative', bgcolor: 'black' }}>
          <Paper 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: '#000',
              color: 'white',
            }}
            elevation={0}
          >
            <Box textAlign="center">
              <Typography variant="h4" gutterBottom>
                🏥
              </Typography>
              <Typography variant="h6" gutterBottom>
                DICOM Viewer
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cornerstone3D viewport will be initialized here
              </Typography>
              <Box mt={2}>
                <Typography variant="caption" display="block">
                  Current Layout: {layout}
                </Typography>
                <Typography variant="caption" display="block">
                  Active Tool: {activeTool}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
        
        {/* Side Panel (optional) */}
        <Box sx={{ width: 300, borderLeft: 1, borderColor: 'divider', display: { xs: 'none', md: 'block' } }}>
          <Box p={2}>
            <Typography variant="subtitle1" gutterBottom>
              Study Information
            </Typography>
            <Typography variant="body2" gutterBottom>
              Patient: {currentStudy.patientName}
            </Typography>
            <Typography variant="body2" gutterBottom>
              Patient ID: {currentStudy.patientId}
            </Typography>
            <Typography variant="body2" gutterBottom>
              Study Description: {currentStudy.studyDescription || 'N/A'}
            </Typography>
            <Typography variant="body2" gutterBottom>
              Accession: {currentStudy.accessionNumber || 'N/A'}
            </Typography>
            <Typography variant="body2" gutterBottom>
              Series Count: {currentStudy.seriesCount || 0}
            </Typography>
            <Typography variant="body2">
              Images: {currentStudy.instanceCount || 0}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
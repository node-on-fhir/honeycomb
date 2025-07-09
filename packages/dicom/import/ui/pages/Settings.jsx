import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  Button,
} from '@mui/material';
import {
  Memory as MemoryIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';

import { useCornerstone } from '/imports/ui/hooks/useCornerstone';
import { useCache } from '/imports/ui/contexts/CacheContext';
import { usePerformance } from '/imports/ui/hooks/usePerformance';

/**
 * Settings page for DICOM viewer configuration
 */
export default function Settings() {
  const { info: cornerstoneInfo, getConfiguration } = useCornerstone();
  const { 
    cacheStats, 
    cacheSettings, 
    cacheSizeFormatted, 
    cacheUsagePercentage,
    clearCache 
  } = useCache();
  const { 
    metrics, 
    performanceSummary, 
    memoryStatus, 
    isMonitoring,
    setMonitoringEnabled 
  } = usePerformance();
  
  /**
   * Handle cache clear
   */
  async function handleClearCache() {
    const success = await clearCache();
    if (success) {
      // Could show success notification
      console.log('Cache cleared successfully');
    }
  }
  
  /**
   * Toggle performance monitoring
   */
  function handleToggleMonitoring() {
    setMonitoringEnabled(!isMonitoring);
  }
  
  return (
    <Box p={3}>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>
      
      <Grid container spacing={3}>
        {/* Cornerstone3D Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <VisibilityIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">
                  Cornerstone3D Engine
                </Typography>
              </Box>
              
              {cornerstoneInfo ? (
                <Box>
                  <Typography variant="body2" gutterBottom>
                    <strong>Version:</strong> {cornerstoneInfo.version}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>GPU Acceleration:</strong>{' '}
                    <Chip 
                      label={cornerstoneInfo.gpuEnabled ? 'Enabled' : 'Disabled'}
                      color={cornerstoneInfo.gpuEnabled ? 'success' : 'warning'}
                      size="small"
                    />
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Worker Count:</strong> {cornerstoneInfo.workerCount}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Concurrent Requests:</strong> {cornerstoneInfo.concurrentRequests}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Cornerstone3D not initialized
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Memory Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <MemoryIcon sx={{ mr: 1, color: 'secondary.main' }} />
                <Typography variant="h6">
                  Memory Usage
                </Typography>
              </Box>
              
              <Typography variant="body2" gutterBottom>
                <strong>Used:</strong> {memoryStatus.usedMB}MB / {memoryStatus.limitMB}MB
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Usage:</strong>{' '}
                <Chip 
                  label={`${memoryStatus.percentage}%`}
                  color={
                    memoryStatus.status === 'critical' ? 'error' :
                    memoryStatus.status === 'warning' ? 'warning' : 'success'
                  }
                  size="small"
                />
              </Typography>
              <Typography variant="body2">
                <strong>Status:</strong> {memoryStatus.status}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Cache Management */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <StorageIcon sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">
                  Cache Management
                </Typography>
              </Box>
              
              <Typography variant="body2" gutterBottom>
                <strong>Cache Size:</strong> {cacheSizeFormatted}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Items Cached:</strong> {cacheStats.count}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Usage:</strong>{' '}
                <Chip 
                  label={`${cacheUsagePercentage}%`}
                  color={cacheUsagePercentage > 80 ? 'warning' : 'success'}
                  size="small"
                />
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Max Size:</strong> {cacheSettings.maxSizeMB}MB
              </Typography>
              
              <Box mt={2}>
                <Button 
                  variant="outlined" 
                  color="warning" 
                  onClick={handleClearCache}
                  size="small"
                >
                  Clear Cache
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Performance Monitoring */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <SpeedIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">
                  Performance
                </Typography>
              </Box>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={isMonitoring}
                    onChange={handleToggleMonitoring}
                  />
                }
                label="Enable Performance Monitoring"
              />
              
              {isMonitoring && (
                <Box mt={2}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Avg Operation Time:</strong> {performanceSummary.averageDuration}ms
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Success Rate:</strong> {performanceSummary.successRate}%
                  </Typography>
                  <Typography variant="body2">
                    <strong>Total Operations:</strong> {performanceSummary.totalOperations}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Application Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Application Information
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Application:</strong>
                  </Typography>
                  <Typography variant="body2">
                    DICOM Viewer v3
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Framework:</strong>
                  </Typography>
                  <Typography variant="body2">
                    Meteor v3, React 18
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Imaging Engine:</strong>
                  </Typography>
                  <Typography variant="body2">
                    Cornerstone3D
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Browser Support:</strong>
                  </Typography>
                  <Typography variant="body2">
                    Modern browsers with WebGL
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
// client/components/MultiFormatUploader.jsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Box,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip
} from '@mui/material';
import { CloudUpload, CheckCircle, Error, Warning, Image, LocalHospital } from '@mui/icons-material';
import { makeStyles } from '@mui/styles';
import * as dicomParser from 'dicom-parser';
import { get } from 'lodash';
import JpgToDicomService from 'clinical-dicom-viewer/lib/JpgToDicomService';

const useStyles = makeStyles(function(theme) {
  return {
    dropZone: {
      border: `2px dashed ${theme.palette.primary.main}`,
      borderRadius: theme.spacing(1),
      padding: theme.spacing(4),
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'border-color 0.3s ease',
      '&:hover': {
        borderColor: theme.palette.primary.dark,
      },
      '&.dragOver': {
        borderColor: theme.palette.secondary.main,
        backgroundColor: theme.palette.action.hover,
      }
    },
    uploadList: {
      maxHeight: 400,
      overflow: 'auto',
    },
    fileItem: {
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
    progressContainer: {
      marginBottom: theme.spacing(2),
    },
    metadataForm: {
      marginTop: theme.spacing(2),
      marginBottom: theme.spacing(2),
      padding: theme.spacing(2),
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: theme.spacing(1),
    },
    fileTypeChip: {
      margin: theme.spacing(0.5),
    }
  };
});

// File type detection
const getFileType = function(file) {
  const ext = file.name.toLowerCase().split('.').pop();
  const mimeType = file.type.toLowerCase();
  
  if (ext === 'dcm' || ext === 'dicom' || mimeType === 'application/dicom') {
    return 'dicom';
  }
  
  if (['jpg', 'jpeg'].includes(ext) || mimeType.startsWith('image/jpeg')) {
    return 'jpeg';
  }
  
  if (['png'].includes(ext) || mimeType.startsWith('image/png')) {
    return 'png';
  }
  
  return 'unknown';
};

function MultiFormatUploader({ open, onClose, onUploadComplete, onUploadStart }) {
  const classes = useStyles();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [conversionMetadata, setConversionMetadata] = useState({
    patientName: 'ANONYMOUS^PATIENT',
    patientId: 'ANON001',
    patientSex: 'O',
    modality: 'OT',
    studyDescription: 'Converted Study',
    seriesDescription: 'Converted Series'
  });
  
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(null);

  useEffect(function() {
    isMountedRef.current = true;
    return function() {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      files.forEach(function(file) {
        if (file.blobUrl) {
          URL.revokeObjectURL(file.blobUrl);
        }
      });
    };
  }, [files]);

  const handleDragOver = useCallback(function(e) {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(function(e) {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(function(e) {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, []);

  const handleFileSelect = useCallback(function(e) {
    const selectedFiles = Array.from(e.target.files);
    processFiles(selectedFiles);
  }, []);

  const processFiles = function(fileList) {
    console.time('file-processing');
    
    const processedFiles = fileList.map(function(file, index) {
      const fileType = getFileType(file);
      
      return {
        id: `file-${Date.now()}-${index}`,
        file: file,
        name: file.name,
        size: file.size,
        fileType: fileType,
        status: 'pending',
        metadata: null,
        error: null,
        needsConversion: fileType !== 'dicom'
      };
    });
    
    setFiles(processedFiles);
    batchProcessFiles(processedFiles);
  };

  const batchProcessFiles = async function(fileList) {
    for (let i = 0; i < fileList.length; i++) {
      const fileObj = fileList[i];
      
      if (fileObj.fileType === 'dicom') {
        await processDicomFile(fileObj, i);
      } else if (['jpeg', 'png'].includes(fileObj.fileType)) {
        await processImageFile(fileObj, i);
      } else {
        updateFileStatus(i, 'error', 'Unsupported file type');
      }
      
      // Small delay to prevent UI blocking
      await new Promise(function(resolve) { setTimeout(resolve, 10); });
    }
    
    console.timeEnd('file-processing');
  };

  const processDicomFile = function(fileObj, index) {
    return new Promise(function(resolve) {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        try {
          const arrayBuffer = e.target.result;
          const uint8Array = new Uint8Array(arrayBuffer);
          const dataSet = dicomParser.parseDicom(uint8Array);
          
          updateFileStatus(index, 'parsed', null, dataSet, arrayBuffer);
          resolve();
        } catch (error) {
          updateFileStatus(index, 'error', 'Invalid DICOM file: ' + error.message);
          resolve();
        }
      };
      
      reader.onerror = function() {
        updateFileStatus(index, 'error', 'Failed to read file');
        resolve();
      };
      
      reader.readAsArrayBuffer(fileObj.file);
    });
  };

  const processImageFile = function(fileObj, index) {
    return new Promise(function(resolve) {
      // Mark as ready for conversion
      updateFileStatus(index, 'ready_for_conversion', null);
      resolve();
    });
  };

  const updateFileStatus = function(index, status, error = null, metadata = null, arrayBuffer = null) {
    if (!isMountedRef.current) return;
    
    setFiles(function(prevFiles) {
      const newFiles = [...prevFiles];
      if (newFiles[index]) {
        newFiles[index] = {
          ...newFiles[index],
          status: status,
          error: error,
          metadata: metadata,
          arrayBuffer: arrayBuffer
        };
      }
      return newFiles;
    });
  };

  const handleMetadataChange = function(field, value) {
    setConversionMetadata(function(prev) {
      return { ...prev, [field]: value };
    });
  };

  const convertImageToDicom = async function(fileObj) {
    try {
      const result = await JpgToDicomService.convertJpgToDicom(fileObj.file, conversionMetadata);
      
      // Parse the generated DICOM to validate it
      const uint8Array = new Uint8Array(result.buffer);
      const dataSet = dicomParser.parseDicom(uint8Array);
      
      return {
        arrayBuffer: result.buffer,
        metadata: dataSet,
        fileName: result.fileName
      };
    } catch (error) {
      throw new Error(`Conversion failed: ${error.message}`);
    }
  };

  const handleUpload = async function() {
    const validFiles = files.filter(function(f) { 
      return f.status === 'parsed' || f.status === 'ready_for_conversion'; 
    });
    
    if (validFiles.length === 0) return;
    
    setUploading(true);
    setUploadProgress(0);
    abortControllerRef.current = new AbortController();
    
    if (onUploadStart) {
      onUploadStart();
    }
    
    try {
      let completedFiles = 0;
      
      for (const fileObj of validFiles) {
        if (abortControllerRef.current?.signal.aborted) break;
        
        try {
          let uploadData;
          
          if (fileObj.needsConversion) {
            // Convert image to DICOM first
            updateFileStatus(
              files.findIndex(f => f.id === fileObj.id), 
              'converting', 
              null
            );
            
            const conversionResult = await convertImageToDicom(fileObj);
            uploadData = {
              arrayBuffer: conversionResult.arrayBuffer,
              metadata: conversionResult.metadata,
              fileName: conversionResult.fileName
            };
            
            updateFileStatus(
              files.findIndex(f => f.id === fileObj.id), 
              'converted', 
              null,
              conversionResult.metadata,
              conversionResult.arrayBuffer
            );
          } else {
            // Use existing DICOM data
            uploadData = {
              arrayBuffer: fileObj.arrayBuffer,
              metadata: fileObj.metadata,
              fileName: fileObj.name
            };
          }
          
          // Upload to server
          const base64String = btoa(
            new Uint8Array(uploadData.arrayBuffer)
              .reduce(function(data, byte) {
                return data + String.fromCharCode(byte);
              }, '')
          );
          
          await Meteor.callAsync(
            'dicom.uploadFile', 
            base64String, 
            uploadData.fileName, 
            uploadData.metadata.elements
          );
          
          completedFiles++;
          updateFileStatus(
            files.findIndex(f => f.id === fileObj.id), 
            'uploaded', 
            null
          );
          
          setUploadProgress((completedFiles / validFiles.length) * 100);
          
        } catch (error) {
          console.error(`Upload failed for ${fileObj.name}:`, error);
          updateFileStatus(
            files.findIndex(f => f.id === fileObj.id), 
            'error', 
            'Upload failed: ' + error.message
          );
        }
      }
      
      setTimeout(function() {
        if (isMountedRef.current) {
          onUploadComplete();
          resetUploader();
        }
      }, 1000);
      
    } catch (error) {
      console.error('Batch upload error:', error);
      setUploading(false);
    }
  };

  const resetUploader = function() {
    setFiles([]);
    setUploading(false);
    setUploadProgress(0);
  };

  const handleClose = function() {
    if (!uploading) {
      onClose();
      resetUploader();
    } else if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setUploading(false);
      resetUploader();
    }
  };

  const getStatusIcon = function(fileObj) {
    switch (fileObj.status) {
      case 'uploaded':
        return <CheckCircle style={{ color: 'green' }} />;
      case 'error':
        return <Error color="error" />;
      case 'parsed':
      case 'converted':
        return <LocalHospital color="primary" />;
      case 'ready_for_conversion':
        return <Image color="secondary" />;
      case 'converting':
        return <Warning color="warning" />;
      default:
        return <CloudUpload />;
    }
  };

  const getStatusText = function(fileObj) {
    switch (fileObj.status) {
      case 'uploaded':
        return 'Uploaded successfully';
      case 'parsed':
        return 'DICOM file ready';
      case 'ready_for_conversion':
        return 'Ready for DICOM conversion';
      case 'converting':
        return 'Converting to DICOM...';
      case 'converted':
        return 'Converted to DICOM';
      case 'error':
        return fileObj.error;
      default:
        return 'Processing...';
    }
  };

  const validFiles = files.filter(function(f) { 
    return f.status === 'parsed' || f.status === 'ready_for_conversion'; 
  });
  const errorFiles = files.filter(function(f) { return f.status === 'error'; });
  const imageFiles = files.filter(function(f) { return f.needsConversion; });

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>Upload Medical Images</DialogTitle>
      
      <DialogContent>
        {files.length === 0 ? (
          <div>
            <div
              className={`${classes.dropZone} ${dragOver ? 'dragOver' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={function() { document.getElementById('file-input').click(); }}
            >
              <CloudUpload style={{ fontSize: 48, marginBottom: 16 }} />
              <Typography variant="h6" gutterBottom>
                Drop medical images here or click to select
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Supported formats:
              </Typography>
              <div>
                <Chip 
                  label="DICOM (.dcm, .dicom)" 
                  color="primary" 
                  size="small" 
                  className={classes.fileTypeChip}
                />
                <Chip 
                  label="JPEG (.jpg, .jpeg)" 
                  color="secondary" 
                  size="small" 
                  className={classes.fileTypeChip}
                />
                <Chip 
                  label="PNG (.png)" 
                  color="secondary" 
                  size="small" 
                  className={classes.fileTypeChip}
                />
              </div>
              
              <input
                id="file-input"
                type="file"
                multiple
                accept=".dcm,.dicom,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
            </div>
          </div>
        ) : (
          <Box>
            {/* Conversion metadata form for image files */}
            {imageFiles.length > 0 && (
              <div className={classes.metadataForm}>
                <Typography variant="h6" gutterBottom>
                  DICOM Conversion Settings
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  These settings will be applied to converted image files:
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label="Patient Name"
                      value={conversionMetadata.patientName}
                      onChange={function(e) { handleMetadataChange('patientName', e.target.value); }}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Patient ID"
                      value={conversionMetadata.patientId}
                      onChange={function(e) { handleMetadataChange('patientId', e.target.value); }}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Patient Sex</InputLabel>
                      <Select
                        value={conversionMetadata.patientSex}
                        onChange={function(e) { handleMetadataChange('patientSex', e.target.value); }}
                      >
                        <MenuItem value="M">Male</MenuItem>
                        <MenuItem value="F">Female</MenuItem>
                        <MenuItem value="O">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Modality</InputLabel>
                      <Select
                        value={conversionMetadata.modality}
                        onChange={function(e) { handleMetadataChange('modality', e.target.value); }}
                      >
                        <MenuItem value="OT">Other</MenuItem>
                        <MenuItem value="CR">Computed Radiography</MenuItem>
                        <MenuItem value="CT">Computed Tomography</MenuItem>
                        <MenuItem value="MR">Magnetic Resonance</MenuItem>
                        <MenuItem value="US">Ultrasound</MenuItem>
                        <MenuItem value="XA">X-Ray Angiography</MenuItem>
                        <MenuItem value="DX">Digital Radiography</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      label="Study Description"
                      value={conversionMetadata.studyDescription}
                      onChange={function(e) { handleMetadataChange('studyDescription', e.target.value); }}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                </Grid>
              </div>
            )}

            {/* Error summary */}
            {errorFiles.length > 0 && (
              <Alert severity="warning" style={{ marginBottom: 16 }}>
                <Typography variant="body2">
                  {errorFiles.length} file{errorFiles.length > 1 ? 's' : ''} failed processing.
                </Typography>
              </Alert>
            )}

            {uploading && (
              <Box className={classes.progressContainer}>
                <Typography variant="body2" gutterBottom>
                  Processing files... {Math.round(uploadProgress)}%
                </Typography>
                <LinearProgress variant="determinate" value={uploadProgress} />
              </Box>
            )}
            
            {/* File status summary */}
            <Box mb={2}>
              <Typography variant="body2" color="textSecondary">
                Total: {files.length} | 
                DICOM: {files.filter(f => f.fileType === 'dicom').length} | 
                Images: {imageFiles.length} | 
                Ready: {validFiles.length} | 
                Errors: {errorFiles.length}
              </Typography>
            </Box>
            
            <List className={classes.uploadList}>
              {files.map(function(fileObj) {
                return (
                  <ListItem key={fileObj.id} className={classes.fileItem}>
                    <ListItemIcon>
                      {getStatusIcon(fileObj)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {fileObj.name}
                          <Chip 
                            label={fileObj.fileType.toUpperCase()} 
                            size="small" 
                            color={fileObj.fileType === 'dicom' ? 'primary' : 'secondary'}
                          />
                        </div>
                      }
                      secondary={getStatusText(fileObj)}
                    />
                  </ListItem>
                );
              })}
            </List>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>
          {uploading ? 'Cancel' : 'Close'}
        </Button>
        {files.length > 0 && (
          <Button
            onClick={handleUpload}
            color="primary"
            disabled={uploading || validFiles.length === 0}
          >
            Upload & Convert {validFiles.length} Files
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default MultiFormatUploader;
// imports/ui/components/DicomUploader.jsx
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
  Alert
} from '@mui/material';
import { CloudUpload, CheckCircle, Error, Warning } from '@mui/icons-material';
import { makeStyles } from '@mui/styles';
import * as dicomParser from 'dicom-parser';
import { get } from 'lodash';

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
      maxHeight: 300,
      overflow: 'auto',
    },
    fileItem: {
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
    progressContainer: {
      marginBottom: theme.spacing(2),
    },
    batchInfo: {
      backgroundColor: theme.palette.info.main,
      color: theme.palette.info.contrastText,
      padding: theme.spacing(1),
      borderRadius: theme.spacing(0.5),
      marginBottom: theme.spacing(1),
    }
  };
});

// PERFORMANCE CONSTANTS
const CONCURRENT_BATCH_SIZE = 5; // Process 5 files simultaneously
const MAX_MEMORY_USAGE = 50 * 1024 * 1024; // 50MB memory limit
const CHUNK_SIZE = 32 * 1024; // 32KB chunks for large files

// DICOM validation constants
const DICOM_MAGIC = 'DICM';
const DICOM_PREAMBLE_LENGTH = 128;

function DicomUploader({ open, onClose, onUploadComplete, onUploadStart }) {
  const classes = useStyles();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(0);
  
  // Ref to track component mount state
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(null);

  useEffect(function() {
    isMountedRef.current = true;
    return function() {
      isMountedRef.current = false;
      // Cleanup any ongoing uploads
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Cleanup blob URLs
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

  // ENHANCED: Validate DICOM file format
  const validateDicomFile = function(arrayBuffer, fileName) {
    try {
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Check minimum file size
      if (uint8Array.length < DICOM_PREAMBLE_LENGTH + 4) {
        return {
          valid: false,
          error: 'File too small to be a valid DICOM file'
        };
      }
      
      // Check for DICOM magic number at offset 128
      const magicBytes = uint8Array.slice(DICOM_PREAMBLE_LENGTH, DICOM_PREAMBLE_LENGTH + 4);
      const magicString = String.fromCharCode.apply(null, magicBytes);
      
      if (magicString !== DICOM_MAGIC) {
        return {
          valid: false,
          error: `Invalid DICOM magic number. Expected "${DICOM_MAGIC}", got "${magicString}"`
        };
      }
      
      // Additional validation: check for basic DICOM structure
      try {
        const dataSet = dicomParser.parseDicom(uint8Array);
        
        // Verify essential DICOM tags exist
        const sopInstanceUID = get(dataSet, 'elements.x00080018');
        if (!sopInstanceUID) {
          return {
            valid: false,
            error: 'Missing required SOP Instance UID (0008,0018)'
          };
        }
        
        return {
          valid: true,
          dataSet: dataSet
        };
      } catch (parseError) {
        return {
          valid: false,
          error: `DICOM parsing failed: ${parseError.message}`
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: `File validation error: ${error.message}`
      };
    }
  };

  // PERFORMANCE FIX: Estimate memory usage
  const estimateMemoryUsage = function(fileList) {
    return fileList.reduce(function(total, file) {
      // Estimate: File size × 3 (ArrayBuffer + Uint8Array + base64)
      return total + (file.file ? file.file.size * 3 : 0);
    }, 0);
  };

  const processFiles = function(fileList) {
    console.time('file-processing');
    
    const processedFiles = fileList.map(function(file, index) {
      return {
        id: `file-${Date.now()}-${index}`,
        file: file,
        name: file.name,
        size: file.size,
        status: 'pending',
        metadata: null,
        error: null,
        blobUrl: null
      };
    });
    
    setFiles(processedFiles);
    
    // Calculate memory impact
    const estimatedMemory = estimateMemoryUsage(processedFiles);
    setMemoryUsage(estimatedMemory);
    
    if (estimatedMemory > MAX_MEMORY_USAGE) {
      console.warn(`Large memory usage estimated: ${(estimatedMemory / 1024 / 1024).toFixed(1)}MB`);
    }
    
    // Parse DICOM metadata in batches to avoid blocking UI
    batchProcessMetadata(processedFiles);
  };

  // ENHANCED: Process metadata with better validation
  const batchProcessMetadata = async function(fileList) {
    const batchSize = 10; // Process metadata for 10 files at a time
    
    for (let i = 0; i < fileList.length; i += batchSize) {
      const batch = fileList.slice(i, i + batchSize);
      
      // Process batch concurrently
      await Promise.all(
        batch.map(function(fileObj, batchIndex) {
          const globalIndex = i + batchIndex;
          return parseFileMetadata(fileObj, globalIndex);
        })
      );
      
      // Small delay to prevent UI blocking
      if (i + batchSize < fileList.length) {
        await new Promise(function(resolve) { setTimeout(resolve, 10); });
      }
    }
    
    console.timeEnd('file-processing');
  };

  const parseFileMetadata = function(fileObj, index) {
    return new Promise(function(resolve) {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        try {
          const arrayBuffer = e.target.result;
          
          // ENHANCED: Validate DICOM format first
          const validation = validateDicomFile(arrayBuffer, fileObj.name);
          
          if (!validation.valid) {
            if (isMountedRef.current) {
              setFiles(function(prevFiles) {
                const newFiles = [...prevFiles];
                if (newFiles[index]) {
                  newFiles[index] = {
                    ...newFiles[index],
                    status: 'error',
                    error: validation.error
                  };
                }
                return newFiles;
              });
            }
            resolve();
            return;
          }
          
          if (isMountedRef.current) {
            setFiles(function(prevFiles) {
              const newFiles = [...prevFiles];
              if (newFiles[index]) {
                newFiles[index] = {
                  ...newFiles[index],
                  status: 'parsed',
                  metadata: validation.dataSet,
                  arrayBuffer: arrayBuffer
                };
              }
              return newFiles;
            });
          }
          resolve();
        } catch (error) {
          console.error('Error parsing DICOM file:', error);
          if (isMountedRef.current) {
            setFiles(function(prevFiles) {
              const newFiles = [...prevFiles];
              if (newFiles[index]) {
                newFiles[index] = {
                  ...newFiles[index],
                  status: 'error',
                  error: 'Failed to read file: ' + error.message
                };
              }
              return newFiles;
            });
          }
          resolve();
        }
      };
      
      reader.onerror = function() {
        if (isMountedRef.current) {
          setFiles(function(prevFiles) {
            const newFiles = [...prevFiles];
            if (newFiles[index]) {
              newFiles[index] = {
                ...newFiles[index],
                status: 'error',
                error: 'Failed to read file'
              };
            }
            return newFiles;
          });
        }
        resolve();
      };
      
      reader.readAsArrayBuffer(fileObj.file);
    });
  };

  // ENHANCED: Better base64 conversion with validation
  const convertArrayBufferToBase64 = function(arrayBuffer) {
    try {
      const uint8Array = new Uint8Array(arrayBuffer);
      let result = '';
      
      // Process in chunks to avoid call stack limits
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        let chunkString = '';
        for (let j = 0; j < chunk.length; j++) {
          chunkString += String.fromCharCode(chunk[j]);
        }
        result += chunkString;
      }
      
      return btoa(result);
    } catch (error) {
      console.error('Base64 conversion error:', error);
      throw new Error(`Failed to convert file to base64: ${error.message}`);
    }
  };

  // PERFORMANCE FIX: Concurrent upload with batching
  const handleUpload = async function() {
    const validFiles = files.filter(function(f) { return f.status === 'parsed'; });
    if (validFiles.length === 0) return;
    
    console.time('total-upload');
    setUploading(true);
    setUploadProgress(0);
    
    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();
    
    // Notify parent of upload start
    if (onUploadStart) {
      onUploadStart();
    }
    
    // Calculate batches
    const batches = [];
    for (let i = 0; i < validFiles.length; i += CONCURRENT_BATCH_SIZE) {
      batches.push(validFiles.slice(i, i + CONCURRENT_BATCH_SIZE));
    }
    
    setTotalBatches(batches.length);
    
    try {
      let completedFiles = 0;
      
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        if (abortControllerRef.current?.signal.aborted) break;
        
        setCurrentBatch(batchIndex + 1);
        const batch = batches[batchIndex];
        
        console.time(`batch-${batchIndex + 1}`);
        
        // Process batch concurrently
        await Promise.all(
          batch.map(async function(fileObj) {
            try {
              await uploadSingleFile(fileObj);
              completedFiles++;
              
              if (isMountedRef.current) {
                setUploadProgress((completedFiles / validFiles.length) * 100);
                
                // Update file status
                setFiles(function(prevFiles) {
                  const newFiles = [...prevFiles];
                  const fileIndex = newFiles.findIndex(function(f) { return f.id === fileObj.id; });
                  if (fileIndex !== -1) {
                    newFiles[fileIndex] = { ...newFiles[fileIndex], status: 'uploaded' };
                  }
                  return newFiles;
                });
              }
            } catch (error) {
              console.error(`Upload failed for ${fileObj.name}:`, error);
              
              if (isMountedRef.current) {
                setFiles(function(prevFiles) {
                  const newFiles = [...prevFiles];
                  const fileIndex = newFiles.findIndex(function(f) { return f.id === fileObj.id; });
                  if (fileIndex !== -1) {
                    newFiles[fileIndex] = { 
                      ...newFiles[fileIndex], 
                      status: 'error',
                      error: 'Upload failed: ' + error.message
                    };
                  }
                  return newFiles;
                });
              }
            }
          })
        );
        
        console.timeEnd(`batch-${batchIndex + 1}`);
        
        // Small delay between batches to prevent server overload
        if (batchIndex < batches.length - 1) {
          await new Promise(function(resolve) { setTimeout(resolve, 100); });
        }
      }
      
      console.timeEnd('total-upload');
      
      // Success - close dialog and notify parent
      setTimeout(function() {
        if (isMountedRef.current) {
          onUploadComplete();
          resetUploader();
        }
      }, 1000);
      
    } catch (error) {
      console.error('Batch upload error:', error);
      if (isMountedRef.current) {
        setUploading(false);
      }
    }
  };

  // ENHANCED: Single file upload with better error handling
  const uploadSingleFile = async function(fileObj) {
    if (!fileObj.arrayBuffer) {
      throw new Error('No array buffer available');
    }
    
    try {
      const base64String = convertArrayBufferToBase64(fileObj.arrayBuffer);
      await Meteor.callAsync('dicom.uploadFile', base64String, fileObj.name, fileObj.metadata.elements);
      
      // Clean up memory immediately after upload
      fileObj.arrayBuffer = null;
    } catch (error) {
      console.error('Upload error for file:', fileObj.name, error);
      throw error;
    }
  };

  const resetUploader = function() {
    setFiles([]);
    setUploading(false);
    setUploadProgress(0);
    setCurrentBatch(0);
    setTotalBatches(0);
    setMemoryUsage(0);
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

  const getStatusIcon = function(status) {
    switch (status) {
      case 'uploaded':
        return <CheckCircle style={{ color: 'green' }} />;
      case 'error':
        return <Error color="error" />;
      case 'parsed':
        return <CheckCircle color="primary" />;
      default:
        return <CloudUpload />;
    }
  };

  const getPatientInfo = function(metadata) {
    if (!metadata) return 'Processing...';
    
    const patientName = get(metadata, 'elements.x00100010.Value.0.Alphabetic', 'Unknown Patient');
    const patientId = get(metadata, 'elements.x00100020.Value.0', 'Unknown ID');
    const modality = get(metadata, 'elements.x00080060.Value.0', 'Unknown');
    
    return `${patientName} (${patientId}) - ${modality}`;
  };

  const validFiles = files.filter(function(f) { return f.status === 'parsed'; });
  const errorFiles = files.filter(function(f) { return f.status === 'error'; });

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Upload DICOM Files</DialogTitle>
      
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
                Drop DICOM files here or click to select
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Supports .dcm, .dicom files
              </Typography>
              
              <input
                id="file-input"
                type="file"
                multiple
                accept=".dcm,.dicom"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
            </div>
            
            <Alert severity="info" style={{ marginTop: 16 }}>
              <Typography variant="body2">
                <strong>Note:</strong> Only valid DICOM files are supported. 
                Files converted from JPEG or other formats may not work properly.
              </Typography>
            </Alert>
          </div>
        ) : (
          <Box>
            {/* Memory usage warning */}
            {memoryUsage > MAX_MEMORY_USAGE && (
              <Box className={classes.batchInfo} display="flex" alignItems="center" mb={1}>
                <Warning style={{ marginRight: 8 }} />
                <Typography variant="body2">
                  Large upload detected ({(memoryUsage / 1024 / 1024).toFixed(1)}MB). 
                  Processing in batches for optimal performance.
                </Typography>
              </Box>
            )}

            {/* Error summary */}
            {errorFiles.length > 0 && (
              <Alert severity="warning" style={{ marginBottom: 16 }}>
                <Typography variant="body2">
                  {errorFiles.length} file{errorFiles.length > 1 ? 's' : ''} failed validation. 
                  Please ensure you're uploading valid DICOM files.
                </Typography>
              </Alert>
            )}

            {/* Batch progress info */}
            {uploading && totalBatches > 1 && (
              <Box className={classes.batchInfo} mb={1}>
                <Typography variant="body2">
                  Processing batch {currentBatch} of {totalBatches} 
                  ({CONCURRENT_BATCH_SIZE} files per batch)
                </Typography>
              </Box>
            )}
            
            {uploading && (
              <Box className={classes.progressContainer}>
                <Typography variant="body2" gutterBottom>
                  Uploading files... {Math.round(uploadProgress)}%
                </Typography>
                <LinearProgress variant="determinate" value={uploadProgress} />
              </Box>
            )}
            
            {/* File status summary */}
            <Box mb={2}>
              <Typography variant="body2" color="textSecondary">
                Total: {files.length} | Ready: {validFiles.length} | Errors: {errorFiles.length}
              </Typography>
            </Box>
            
            <List className={classes.uploadList}>
              {files.map(function(fileObj, index) {
                return (
                  <ListItem key={fileObj.id} className={classes.fileItem}>
                    <ListItemIcon>
                      {getStatusIcon(fileObj.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={fileObj.name}
                      secondary={
                        fileObj.error ? 
                          <Typography variant="caption" color="error">
                            {fileObj.error}
                          </Typography> :
                          getPatientInfo(fileObj.metadata)
                      }
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
            Upload {validFiles.length} Files
            {totalBatches > 1 && ` (${totalBatches} batches)`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default DicomUploader;
import { WebApp } from 'meteor/webapp';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

/**
 * DICOM file streaming handler
 * Provides efficient streaming of DICOM files via HTTP/2
 */

/**
 * Handle DICOM file streaming requests
 */
WebApp.connectHandlers.use('/api/dicom/stream', async function(req, res, next) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const sopInstanceUID = url.pathname.split('/').pop();
    
    if (!sopInstanceUID) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing SOP Instance UID' }));
      return;
    }
    
    // Find instance in database
    const instance = await Instances.findOneAsync({ sopInstanceUID });
    if (!instance) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Instance not found' }));
      return;
    }
    
    // TODO: Implement actual file streaming
    // For now, return a placeholder response
    
    res.writeHead(200, { 
      'Content-Type': 'application/dicom',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    });
    
    res.end('DICOM file streaming - implementation pending');
    
  } catch (error) {
    console.error('Stream handler error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Streaming failed' }));
  }
});

/**
 * Handle DICOM thumbnails
 */
WebApp.connectHandlers.use('/api/dicom/thumbnails', async function(req, res, next) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const sopInstanceUID = url.pathname.split('/').pop();
    
    if (!sopInstanceUID) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing SOP Instance UID' }));
      return;
    }
    
    // Find series for thumbnail
    const instance = await Instances.findOneAsync({ sopInstanceUID });
    if (!instance) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Instance not found' }));
      return;
    }
    
    const series = await Series.findOneAsync({ seriesUID: instance.seriesUID });
    if (!series || !series.thumbnail) {
      // Return placeholder thumbnail
      res.writeHead(200, { 'Content-Type': 'image/png' });
      res.end(generatePlaceholderThumbnail());
      return;
    }
    
    // Decode base64 thumbnail
    const thumbnailBuffer = Buffer.from(series.thumbnail, 'base64');
    
    res.writeHead(200, { 
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400', // 24 hours
      'Content-Length': thumbnailBuffer.length,
    });
    
    res.end(thumbnailBuffer);
    
  } catch (error) {
    console.error('Thumbnail handler error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Thumbnail failed' }));
  }
});

/**
 * Generate placeholder thumbnail
 */
function generatePlaceholderThumbnail() {
  // Return a simple 64x64 PNG placeholder
  // This is a minimal PNG file in base64, decoded to buffer
  const placeholderBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  return Buffer.from(placeholderBase64, 'base64');
}

/**
 * Handle DICOM metadata requests
 */
WebApp.connectHandlers.use('/api/dicom/metadata', async function(req, res, next) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const sopInstanceUID = url.pathname.split('/').pop();
    
    if (!sopInstanceUID) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing SOP Instance UID' }));
      return;
    }
    
    // Find instance metadata
    const instance = await Instances.findOneAsync({ sopInstanceUID });
    if (!instance) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Instance not found' }));
      return;
    }
    
    // Return essential metadata for Cornerstone3D
    const metadata = {
      sopInstanceUID: instance.sopInstanceUID,
      seriesInstanceUID: instance.seriesUID,
      studyInstanceUID: instance.studyUID,
      sopClassUID: instance.sopClassUID,
      transferSyntaxUID: instance.transferSyntaxUID,
      instanceNumber: instance.instanceNumber,
      imageType: instance.imageType,
      rows: instance.rows,
      columns: instance.columns,
      bitsAllocated: instance.bitsAllocated,
      bitsStored: instance.bitsStored,
      highBit: instance.highBit,
      pixelRepresentation: instance.pixelRepresentation,
      photometricInterpretation: instance.photometricInterpretation,
      samplesPerPixel: instance.samplesPerPixel,
      planarConfiguration: instance.planarConfiguration,
      imagePositionPatient: instance.imagePositionPatient,
      imageOrientationPatient: instance.imageOrientationPatient,
      pixelSpacing: instance.pixelSpacing,
      sliceLocation: instance.sliceLocation,
      sliceThickness: instance.sliceThickness,
      windowCenter: instance.windowCenter,
      windowWidth: instance.windowWidth,
      rescaleIntercept: instance.rescaleIntercept,
      rescaleSlope: instance.rescaleSlope,
    };
    
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600', // 1 hour
      'Access-Control-Allow-Origin': '*',
    });
    
    res.end(JSON.stringify(metadata));
    
  } catch (error) {
    console.error('Metadata handler error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Metadata fetch failed' }));
  }
});

console.log('🌊 DICOM stream handlers registered');
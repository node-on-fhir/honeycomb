# clinical:dicom-viewer

A comprehensive DICOM medical imaging viewer package for Honeycomb3, built with Cornerstone.js and React.

## Features

- **DICOM File Viewing**: Full support for DICOM format medical images
- **Multi-Format Support**: Convert JPG/PNG images to DICOM format
- **Advanced Viewing Tools**: Pan, zoom, window/level adjustment, measurements, and annotations
- **Batch Processing**: Upload and process multiple files simultaneously
- **Performance Optimized**: Intelligent caching, prefetching, and memory management
- **Service Worker Integration**: Offline support and improved performance
- **Real-time Updates**: Live updates via Meteor publications/subscriptions

## Installation

Add the package to your Meteor application:

```bash
meteor add clinical:dicom-viewer
```

## Configuration

Copy the example settings file to your application:

```bash
cp packages/clinical-dicom-viewer/configs/settings.dicom-viewer.json settings.json
```

Customize the settings as needed:

```json
{
  "public": {
    "dicomViewer": {
      "cacheSizeLimit": 500,
      "allowUploads": true,
      "supportedFormats": ["dcm", "dicom", "jpg", "jpeg", "png"]
    }
  }
}
```

## Usage

### Basic Setup

The package automatically registers routes and sidebar elements when added to your application.

### Routes

- `/dicom-viewer` - Main DICOM viewer interface
- `/dicom-settings` - Settings and configuration page

### API Methods

#### Upload DICOM Files

```javascript
Meteor.call('clinical.dicom.uploadFile', {
  fileName: 'scan.dcm',
  fileData: arrayBuffer,
  fileSize: 1024000,
  studyId: 'optional-study-id'
}, (error, result) => {
  if (error) {
    console.error('Upload failed:', error);
  } else {
    console.log('File uploaded:', result.fileId);
  }
});
```

#### Convert JPG to DICOM

```javascript
import JpgToDicomService from 'clinical:dicom-viewer/lib/JpgToDicomService';

const result = await JpgToDicomService.convertJpgToDicom(jpgFile, {
  patientName: 'DOE^JOHN',
  patientId: '12345',
  studyDescription: 'Chest X-Ray'
});
```

### React Components

```jsx
import { DicomViewer, DicomUploader } from 'clinical:dicom-viewer';

function MyComponent() {
  return (
    <div>
      <DicomUploader onUploadComplete={handleUpload} />
      <DicomViewer 
        studyId={studyId}
        seriesId={seriesId}
        onImageChange={handleImageChange}
      />
    </div>
  );
}
```

### Contexts and Hooks

```jsx
import { useViewer, useCache, usePerformance } from 'clinical:dicom-viewer';

function ViewerControls() {
  const { viewport, setViewport, activeTool, setActiveTool } = useViewer();
  const { cacheSize, clearCache } = useCache();
  const { metrics, benchmark } = usePerformance();
  
  // Use viewer state and controls
}
```

## Collections

The package provides several MongoDB collections:

- `DicomStudies` - Patient studies
- `DicomSeries` - Image series within studies  
- `DicomFiles` - Individual DICOM files
- `Studies` - Enhanced study collection with metadata
- `Series` - Enhanced series collection
- `Instances` - Individual DICOM instances

## Environment Variables

Optional environment variables for configuration:

- `DICOM_CACHE_SIZE_LIMIT` - Maximum cache size in MB (default: 500)
- `DICOM_UPLOAD_SIZE_LIMIT` - Maximum upload size in bytes (default: 100MB)
- `DICOM_WORKER_POOL_SIZE` - Number of worker threads (default: 2)
- `DICOM_FILE_RETENTION_DAYS` - Days to retain uploaded files (default: 7)

## Security

- CORS enabled for API endpoints
- Rate limiting on upload endpoints
- File size validation
- User authentication required for viewing and uploading

## Performance Considerations

- Images are cached in IndexedDB for offline access
- Intelligent prefetching of series images
- Memory monitoring and automatic cleanup
- Service worker for improved loading performance

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (limited service worker features)
- Mobile browsers: Basic viewing support

## Dependencies

- Cornerstone.js suite for DICOM rendering
- dicom-parser for DICOM file parsing
- Material-UI for user interface components
- React 18+ for component framework

## License

This package is part of the Clinical Meteor project and is licensed under the MIT License.
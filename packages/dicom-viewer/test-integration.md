# Testing the clinical:dicom-viewer Package

## Quick Integration Test

1. **Add the package to your app:**
   ```bash
   meteor add clinical:dicom-viewer
   ```

2. **Verify routes are registered:**
   - Navigate to `/dicom-viewer` - Should show the DICOM viewer page
   - Navigate to `/dicom-settings` - Should show the settings page

3. **Check sidebar integration:**
   - Look for "DICOM Viewer" in the sidebar under FHIR resources
   - Look for "Medical Imaging" in the workflow section

4. **Test basic functionality:**
   - Click the "Upload DICOM" footer button
   - Try uploading a DICOM file
   - Try uploading a JPG/PNG file (should convert to DICOM)

## Manual Package Testing

If the package isn't published yet, you can test locally:

1. **Symlink the package:**
   ```bash
   cd /path/to/your-app/packages
   ln -s /Volumes/SonicMagic/Code/honeycomb-public-release/packages/clinical-dicom-viewer .
   ```

2. **Add to .meteor/packages:**
   ```
   clinical:dicom-viewer
   ```

3. **Start your app:**
   ```bash
   meteor
   ```

## Verify Collections

In the browser console:
```javascript
// Check if collections are available
await global.Collections.DicomStudies
await global.Collections.DicomSeries
await global.Collections.DicomFiles
```

## Test Methods

```javascript
// Test file upload
Meteor.call('clinical.dicom.test', (err, res) => {
  console.log('Test result:', res);
});
```

## Troubleshooting

1. **Missing dependencies:** Check that all npm packages in package.js are installed
2. **Route conflicts:** Ensure no other packages use `/dicom-viewer` route
3. **Collection conflicts:** Check for existing DicomStudies/Series/Files collections
4. **Settings:** Copy the example settings file if settings are missing
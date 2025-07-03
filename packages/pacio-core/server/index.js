// /packages/pacio-core/server/index.js

// Import server methods
import './methods/syncPatientRecord';
import './methods/revokeAdvanceDirective';
import './methods/generateWatermarkedPdf';

// Import publications
import './publications/pacioPublications';

// Export server utilities if needed
export * from '../lib/utilities/AdvanceDirectiveUtils';
export * from '../lib/utilities/PdfUtils';
export * from '../lib/collections/PacioCollections';

console.log('PACIO Core package server initialized');
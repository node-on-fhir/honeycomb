import { Meteor } from 'meteor/meteor';

// Initialize database indexes
import './database-indexes';

// Initialize DICOM settings
import './dicom-settings';

// Initialize security settings
import './security';

// Initialize cleanup scheduler
import './file-cleanup';

console.log('🚀 Server startup modules loaded');
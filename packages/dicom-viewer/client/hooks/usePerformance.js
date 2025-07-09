import { useContext } from 'react';
import { PerformanceContext } from '/packages/clinical-dicom-viewer/client/contexts/PerformanceContext';

/**
 * Hook to use performance monitoring
 * Re-export from context for convenience
 */
export function usePerformance() {
  return useContext(PerformanceContext);
}
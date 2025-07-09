import { useContext } from 'react';
import { PerformanceContext } from '/imports/ui/contexts/PerformanceContext';

/**
 * Hook to use performance monitoring
 * Re-export from context for convenience
 */
export function usePerformance() {
  return useContext(PerformanceContext);
}
import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook to register background processes that should prevent session timeout
 * 
 * Usage:
 * ```tsx
 * const { startProcess, endProcess } = useBackgroundProcess();
 * 
 * // When starting a batch search, deep analysis, or cron job:
 * const processId = startProcess('batch-search');
 * 
 * // When the process completes:
 * endProcess(processId);
 * ```
 */
export const useBackgroundProcess = () => {
  const { registerBackgroundProcess, unregisterBackgroundProcess } = useAuth();
  const activeProcesses = useRef<Set<string>>(new Set());

  // Cleanup all processes on unmount
  useEffect(() => {
    return () => {
      activeProcesses.current.forEach(processId => {
        unregisterBackgroundProcess(processId);
      });
      activeProcesses.current.clear();
    };
  }, [unregisterBackgroundProcess]);

  const startProcess = (
    processType: 'batch-search' | 'deep-analysis' | 'cron-job' | 'background-task'
  ): string => {
    const processId = `${processType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    registerBackgroundProcess(processId, processType);
    activeProcesses.current.add(processId);
    
    return processId;
  };

  const endProcess = (processId: string): void => {
    if (activeProcesses.current.has(processId)) {
      unregisterBackgroundProcess(processId);
      activeProcesses.current.delete(processId);
    }
  };

  return {
    startProcess,
    endProcess,
  };
};

/**
 * Hook to automatically track a background process for the component's lifecycle
 * 
 * Usage:
 * ```tsx
 * // This will register the process on mount and unregister on unmount
 * useAutoBackgroundProcess('deep-analysis', isProcessRunning);
 * ```
 */
export const useAutoBackgroundProcess = (
  processType: 'batch-search' | 'deep-analysis' | 'cron-job' | 'background-task',
  isActive: boolean
) => {
  const { registerBackgroundProcess, unregisterBackgroundProcess } = useAuth();
  const processIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isActive && !processIdRef.current) {
      // Start tracking
      const processId = `${processType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      processIdRef.current = processId;
      registerBackgroundProcess(processId, processType);
    } else if (!isActive && processIdRef.current) {
      // Stop tracking
      unregisterBackgroundProcess(processIdRef.current);
      processIdRef.current = null;
    }
  }, [isActive, processType, registerBackgroundProcess, unregisterBackgroundProcess]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (processIdRef.current) {
        unregisterBackgroundProcess(processIdRef.current);
        processIdRef.current = null;
      }
    };
  }, [unregisterBackgroundProcess]);
};

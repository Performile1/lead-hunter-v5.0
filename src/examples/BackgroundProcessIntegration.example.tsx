/**
 * EXAMPLE: Background Process Integration
 * 
 * This file shows how to integrate background process tracking
 * to prevent session timeout during long-running operations.
 * 
 * Copy these patterns into your actual components.
 */

import React, { useState } from 'react';
import { useBackgroundProcess, useAutoBackgroundProcess } from '../hooks/useBackgroundProcess';

// ============================================================================
// EXAMPLE 1: Batch Search with Manual Process Tracking
// ============================================================================

export const BatchSearchExample = () => {
  const { startProcess, endProcess } = useBackgroundProcess();
  const [isSearching, setIsSearching] = useState(false);

  const runBatchSearch = async (searchQuery: string) => {
    // Register the process BEFORE starting
    const processId = startProcess('batch-search');
    setIsSearching(true);
    
    try {
      console.log('Starting batch search...');
      
      // Your batch search logic here
      const response = await fetch('/api/batch-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      
      const results = await response.json();
      console.log('Batch search completed:', results);
      
    } catch (error) {
      console.error('Batch search failed:', error);
    } finally {
      // ALWAYS unregister in finally block
      endProcess(processId);
      setIsSearching(false);
    }
  };

  return (
    <div>
      <button onClick={() => runBatchSearch('transport companies')}>
        {isSearching ? 'Searching...' : 'Start Batch Search'}
      </button>
    </div>
  );
};

// ============================================================================
// EXAMPLE 2: Deep Analysis with Multiple Leads
// ============================================================================

export const DeepAnalysisExample = () => {
  const { startProcess, endProcess } = useBackgroundProcess();
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);

  const analyzeLeads = async (leads: any[]) => {
    const processId = startProcess('deep-analysis');
    setAnalyzing(true);
    
    try {
      for (let i = 0; i < leads.length; i++) {
        const lead = leads[i];
        
        // Analyze each lead
        await fetch(`/api/leads/${lead.id}/analyze`, {
          method: 'POST'
        });
        
        // Update progress
        setProgress(Math.round(((i + 1) / leads.length) * 100));
      }
      
      console.log('All leads analyzed!');
      
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      endProcess(processId);
      setAnalyzing(false);
      setProgress(0);
    }
  };

  return (
    <div>
      {analyzing && <div>Analyzing... {progress}%</div>}
    </div>
  );
};

// ============================================================================
// EXAMPLE 3: Cron Job Execution
// ============================================================================

export const CronJobExample = () => {
  const { startProcess, endProcess } = useBackgroundProcess();

  const executeCronJob = async (jobId: string) => {
    const processId = startProcess('cron-job');
    
    try {
      const response = await fetch(`/api/cronjobs/${jobId}/execute`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Cron job execution failed');
      }
      
      console.log('Cron job completed successfully');
      
    } catch (error) {
      console.error('Cron job error:', error);
    } finally {
      endProcess(processId);
    }
  };

  return (
    <button onClick={() => executeCronJob('job-123')}>
      Execute Cron Job
    </button>
  );
};

// ============================================================================
// EXAMPLE 4: Auto-tracking with Component State
// ============================================================================

export const AutoTrackingExample = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Automatically tracks the process while isProcessing is true
  // No need to manually call startProcess/endProcess
  useAutoBackgroundProcess('background-task', isProcessing);

  const startLongRunningTask = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate long-running task
      await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minute
      console.log('Task completed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button onClick={startLongRunningTask} disabled={isProcessing}>
      {isProcessing ? 'Processing...' : 'Start Task'}
    </button>
  );
};

// ============================================================================
// EXAMPLE 5: Multiple Concurrent Processes
// ============================================================================

export const MultipleProcessesExample = () => {
  const { startProcess, endProcess } = useBackgroundProcess();
  const [activeProcesses, setActiveProcesses] = useState<string[]>([]);

  const startMultipleProcesses = async () => {
    const processes = [
      { type: 'batch-search' as const, duration: 30000 },
      { type: 'deep-analysis' as const, duration: 45000 },
      { type: 'cron-job' as const, duration: 20000 }
    ];

    const processPromises = processes.map(async ({ type, duration }) => {
      const processId = startProcess(type);
      setActiveProcesses(prev => [...prev, processId]);
      
      try {
        // Simulate process
        await new Promise(resolve => setTimeout(resolve, duration));
        console.log(`${type} completed`);
      } finally {
        endProcess(processId);
        setActiveProcesses(prev => prev.filter(id => id !== processId));
      }
    });

    await Promise.all(processPromises);
    console.log('All processes completed');
  };

  return (
    <div>
      <button onClick={startMultipleProcesses}>
        Start Multiple Processes
      </button>
      <div>Active processes: {activeProcesses.length}</div>
    </div>
  );
};

// ============================================================================
// EXAMPLE 6: Error Handling with Process Tracking
// ============================================================================

export const ErrorHandlingExample = () => {
  const { startProcess, endProcess } = useBackgroundProcess();

  const processWithErrorHandling = async () => {
    const processId = startProcess('batch-search');
    
    try {
      // This might fail
      const response = await fetch('/api/risky-operation', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Operation failed');
      }
      
      const data = await response.json();
      return data;
      
    } catch (error) {
      console.error('Error during process:', error);
      // Handle error appropriately
      alert('Process failed: ' + error.message);
      throw error; // Re-throw if needed
      
    } finally {
      // CRITICAL: Always unregister, even on error
      endProcess(processId);
    }
  };

  return (
    <button onClick={processWithErrorHandling}>
      Run Risky Operation
    </button>
  );
};

// ============================================================================
// EXAMPLE 7: Integration with Existing Batch Job Manager
// ============================================================================

export const BatchJobManagerIntegration = () => {
  const { startProcess, endProcess } = useBackgroundProcess();

  const executeJob = async (jobId: string) => {
    // Start tracking before API call
    const processId = startProcess('batch-search');
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/batch-jobs/${jobId}/execute`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('✅ Batch-jobb startat!');
        
        // If the job runs asynchronously on the server,
        // you might want to poll for completion
        await pollJobCompletion(jobId);
      } else {
        alert('❌ Kunde inte starta batch-jobb');
      }
    } catch (error) {
      console.error('Failed to execute job:', error);
      alert('❌ Nätverksfel');
    } finally {
      // Unregister when done
      endProcess(processId);
    }
  };

  const pollJobCompletion = async (jobId: string) => {
    // Poll every 5 seconds until job completes
    while (true) {
      const response = await fetch(`/api/batch-jobs/${jobId}/status`);
      const { status } = await response.json();
      
      if (status === 'completed' || status === 'failed') {
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  };

  return (
    <button onClick={() => executeJob('job-123')}>
      Execute Batch Job
    </button>
  );
};

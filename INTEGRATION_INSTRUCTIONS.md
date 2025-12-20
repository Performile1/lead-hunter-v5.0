# Session Timeout Integration Instructions

## Quick Start

The session timeout system is now implemented and ready to use. Follow these steps to integrate it with your existing components.

## ✅ What's Already Done

1. **Session Timeout Service** (`src/services/sessionTimeout.ts`)
   - Tracks user activity (mouse, keyboard, scroll, etc.)
   - 30-minute inactivity timeout
   - 2-minute warning before logout
   - Pauses during background processes

2. **AuthContext Integration** (`src/contexts/AuthContext.tsx`)
   - Automatically initializes timeout on login
   - Provides `registerBackgroundProcess()` and `unregisterBackgroundProcess()`
   - Shows warning modal before timeout
   - Cleans up on logout

3. **Warning Modal** (`src/components/SessionTimeoutWarning.tsx`)
   - Displays countdown timer
   - "Fortsätt" button to extend session
   - "Logga ut" button for immediate logout

4. **React Hooks** (`src/hooks/useBackgroundProcess.ts`)
   - `useBackgroundProcess()` - Manual process tracking
   - `useAutoBackgroundProcess()` - Automatic tracking

## 🔧 Integration Steps

### Step 1: Update Batch Job Manager

Add to `src/components/admin/BatchJobManager.tsx`:

```tsx
import { useBackgroundProcess } from '../../hooks/useBackgroundProcess';

export const BatchJobManager: React.FC = () => {
  const { startProcess, endProcess } = useBackgroundProcess();
  
  const executeJob = async (jobId: string) => {
    const processId = startProcess('batch-search');
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/batch-jobs/${jobId}/execute`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('✅ Batch-jobb startat!');
        loadJobs();
      }
    } catch (error) {
      console.error('Failed to execute job:', error);
    } finally {
      endProcess(processId);
    }
  };
  
  // Rest of component...
};
```

### Step 2: Update Cron Jobs Panel

Add to `src/components/admin/CronJobsPanel.tsx`:

```tsx
import { useBackgroundProcess } from '../../hooks/useBackgroundProcess';

export const CronJobsPanel: React.FC<CronJobsPanelProps> = ({ userRole, onBack }) => {
  const { startProcess, endProcess } = useBackgroundProcess();

  const runJob = async (id: string) => {
    const processId = startProcess('cron-job');
    
    try {
      await fetch(`${API_BASE_URL}/cronjobs/${id}/run`, { method: 'POST' });
      fetchJobs();
    } catch (error) {
      console.error('Failed to run job:', error);
    } finally {
      endProcess(processId);
    }
  };
  
  // Rest of component...
};
```

### Step 3: Update Deep Analysis Components

For any component that performs deep analysis:

```tsx
import { useBackgroundProcess } from '../hooks/useBackgroundProcess';

const DeepAnalysisComponent = () => {
  const { startProcess, endProcess } = useBackgroundProcess();

  const analyzeLeads = async (leads: Lead[]) => {
    const processId = startProcess('deep-analysis');
    
    try {
      for (const lead of leads) {
        await fetch(`/api/leads/${lead.id}/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('eurekai_token')}`
          }
        });
      }
    } finally {
      endProcess(processId);
    }
  };
};
```

### Step 4: Update Input Form (if it triggers batch operations)

Add to `components/InputForm.tsx`:

```tsx
import { useBackgroundProcess } from '../src/hooks/useBackgroundProcess';

export const InputForm = () => {
  const { startProcess, endProcess } = useBackgroundProcess();

  const handleBatchSearch = async (searchData: any) => {
    const processId = startProcess('batch-search');
    
    try {
      // Your batch search logic
      await performSearch(searchData);
    } finally {
      endProcess(processId);
    }
  };
};
```

## 📋 Testing Checklist

After integration, test these scenarios:

### ✅ Normal Timeout
1. Login to the application
2. Don't interact for 28 minutes
3. **Expected:** Warning modal appears
4. Wait 2 more minutes without clicking
5. **Expected:** Automatic logout

### ✅ Session Extension
1. Login and wait for warning modal
2. Click "Fortsätt" button
3. **Expected:** Modal closes, session extends for 30 more minutes

### ✅ Background Process Protection
1. Login and start a batch search
2. Don't interact with the application
3. **Expected:** No timeout while batch search runs
4. Wait for batch search to complete
5. **Expected:** Timeout resumes after completion

### ✅ Activity Tracking
1. Login
2. Move mouse or type every few minutes
3. **Expected:** No timeout as long as you're active

### ✅ Multiple Processes
1. Start multiple batch jobs simultaneously
2. **Expected:** Timeout paused until ALL processes complete

## 🐛 Debugging

Enable console logging to see what's happening:

```javascript
// Open browser console (F12)
// You'll see logs like:

🕐 Session timeout service initialized (30 min inactivity)
🔄 Background process registered: batch-search (batch-search-1703...)
   Active processes: 1
⏸️ Session timeout paused - background processes running
✅ Background process completed: batch-search-1703...
   Active processes: 0
🔄 All background processes complete - resuming session timeout
⏰ Session timeout - logging out due to inactivity
```

## 🔒 Security Notes

- Session tokens are cleared on logout
- LocalStorage is cleaned up completely
- All event listeners are properly removed
- Background processes don't extend session indefinitely
- Users must explicitly extend their session when warned

## 📝 Common Patterns

### Pattern 1: Simple API Call
```tsx
const { startProcess, endProcess } = useBackgroundProcess();

const processId = startProcess('batch-search');
try {
  await apiCall();
} finally {
  endProcess(processId);
}
```

### Pattern 2: Auto-tracking with State
```tsx
const [isProcessing, setIsProcessing] = useState(false);
useAutoBackgroundProcess('deep-analysis', isProcessing);
```

### Pattern 3: Multiple Sequential Operations
```tsx
const processId = startProcess('batch-search');
try {
  await operation1();
  await operation2();
  await operation3();
} finally {
  endProcess(processId);
}
```

## ❓ FAQ

**Q: What if I forget to call `endProcess()`?**  
A: The process will remain registered and prevent timeout. Always use try/finally blocks.

**Q: Can I have multiple processes running at once?**  
A: Yes! The service tracks all active processes. Timeout resumes only when ALL complete.

**Q: What counts as "user activity"?**  
A: Mouse movement, clicks, keyboard input, scrolling, and touch events.

**Q: Can I change the timeout duration?**  
A: Yes, edit `TIMEOUT_DURATION` in `src/services/sessionTimeout.ts`.

**Q: Does this work with server-side sessions?**  
A: This is client-side only. For full security, implement server-side session validation too.

## 🚀 Next Steps

1. Integrate the hooks into your batch job components
2. Test thoroughly with the checklist above
3. Monitor console logs during testing
4. Deploy and monitor in production

## 📞 Support

Check the detailed guide: `docs/SESSION_TIMEOUT_GUIDE.md`  
See examples: `src/examples/BackgroundProcessIntegration.example.tsx`

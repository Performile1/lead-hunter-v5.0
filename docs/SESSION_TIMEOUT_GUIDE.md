# Session Timeout Implementation Guide

## Overview

The application now implements automatic logout after **30 minutes of user inactivity**. This ensures security while not interrupting critical background processes.

## Key Features

✅ **30-minute inactivity timeout** - Users are logged out after 30 minutes of no activity  
✅ **2-minute warning** - Users get a warning 2 minutes before logout  
✅ **Activity tracking** - Mouse movements, clicks, keyboard input, scrolling all count as activity  
✅ **Background process protection** - Batch searches, deep analyses, and cron jobs are NOT interrupted  
✅ **Session extension** - Users can click "Continue" to extend their session  

## How It Works

### User Activity Tracking

The system tracks these user interactions:
- Mouse movements
- Mouse clicks
- Keyboard input
- Scrolling
- Touch events

Any of these activities resets the 30-minute timer.

### Background Process Protection

When a background process is running, the session timeout is **paused**. This includes:
- **Batch searches** - Scheduled searches that run overnight
- **Deep analyses** - AI-powered lead analysis
- **Cron jobs** - Scheduled maintenance tasks
- **Background API calls** - Long-running data operations

The timeout automatically resumes when all background processes complete.

## Integration Guide

### For Batch Searches

```tsx
import { useBackgroundProcess } from '../hooks/useBackgroundProcess';

const MyBatchSearchComponent = () => {
  const { startProcess, endProcess } = useBackgroundProcess();

  const runBatchSearch = async () => {
    // Register the process to prevent logout
    const processId = startProcess('batch-search');
    
    try {
      // Run your batch search
      await performBatchSearch();
    } finally {
      // Always unregister when done
      endProcess(processId);
    }
  };
};
```

### For Deep Analysis

```tsx
import { useBackgroundProcess } from '../hooks/useBackgroundProcess';

const DeepAnalysisComponent = () => {
  const { startProcess, endProcess } = useBackgroundProcess();

  const analyzeLeads = async (leads) => {
    const processId = startProcess('deep-analysis');
    
    try {
      for (const lead of leads) {
        await analyzeLead(lead);
      }
    } finally {
      endProcess(processId);
    }
  };
};
```

### For Cron Jobs

```tsx
import { useBackgroundProcess } from '../hooks/useBackgroundProcess';

const CronJobManager = () => {
  const { startProcess, endProcess } = useBackgroundProcess();

  const executeCronJob = async (jobId) => {
    const processId = startProcess('cron-job');
    
    try {
      await runCronJob(jobId);
    } finally {
      endProcess(processId);
    }
  };
};
```

### Auto-tracking with Component Lifecycle

For processes that run for the entire component lifecycle:

```tsx
import { useAutoBackgroundProcess } from '../hooks/useBackgroundProcess';

const LongRunningProcess = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Automatically tracks while isProcessing is true
  useAutoBackgroundProcess('background-task', isProcessing);

  return (
    <button onClick={() => setIsProcessing(true)}>
      Start Process
    </button>
  );
};
```

## User Experience

### Normal Flow
1. User logs in
2. Session timeout starts (30 minutes)
3. User interacts with the app (timer resets)
4. User continues working

### Inactivity Warning
1. User is inactive for 28 minutes
2. Warning modal appears: "Session utgår snart"
3. User has 2 minutes to decide:
   - Click **"Fortsätt"** to extend session
   - Click **"Logga ut"** to logout immediately
   - Do nothing → auto-logout after 2 minutes

### With Background Process
1. User starts a batch search
2. Process is registered (session timeout paused)
3. User can leave the computer
4. Batch search completes
5. Process is unregistered (session timeout resumes)
6. If still inactive for 30 more minutes → logout

## Technical Details

### Files Created/Modified

**New Files:**
- `src/services/sessionTimeout.ts` - Core timeout service
- `src/components/SessionTimeoutWarning.tsx` - Warning modal
- `src/hooks/useBackgroundProcess.ts` - React hooks for process tracking
- `docs/SESSION_TIMEOUT_GUIDE.md` - This guide

**Modified Files:**
- `src/contexts/AuthContext.tsx` - Integrated timeout service

### Configuration

The timeout duration can be adjusted in `sessionTimeout.ts`:

```typescript
// 30 minutes in milliseconds
private readonly TIMEOUT_DURATION = 30 * 60 * 1000;

// Show warning 2 minutes before timeout
private readonly WARNING_BEFORE_TIMEOUT = 2 * 60 * 1000;
```

### Debugging

The service logs all activity to the console:

```
🕐 Session timeout service initialized (30 min inactivity)
🔄 Background process registered: batch-search (batch-search-1234567890-abc123)
   Active processes: 1
⏸️ Session timeout paused - background processes running: ['batch-search-1234567890-abc123']
✅ Background process completed: batch-search-1234567890-abc123
   Active processes: 0
🔄 All background processes complete - resuming session timeout
⏰ Session expired - logging out
```

## Security Considerations

- Session tokens are cleared on logout
- LocalStorage is cleaned up
- All event listeners are removed
- Background processes are tracked but don't extend the session indefinitely
- Users must explicitly extend their session when warned

## Testing

To test the implementation:

1. **Test normal timeout:**
   - Login and don't interact for 28 minutes
   - Warning should appear
   - Wait 2 more minutes → auto-logout

2. **Test session extension:**
   - Login and wait for warning
   - Click "Fortsätt"
   - Session should extend for another 30 minutes

3. **Test background process:**
   - Start a batch search
   - Don't interact with the app
   - Batch search should complete without logout
   - After completion, normal timeout resumes

4. **Test activity tracking:**
   - Login
   - Move mouse every few minutes
   - Should never timeout while active

## Migration Notes

### Removing SessionController

The previous `SessionController` for super admin tenant switching has been **removed**. Super admins no longer need to switch between tenants as this was a security concern.

Instead, the focus is on:
- Proper session management with inactivity timeout
- Background process protection
- Better security through automatic logout

## Support

For issues or questions, check the console logs which provide detailed information about:
- When processes are registered/unregistered
- When the session timeout is paused/resumed
- When warnings are shown
- When logout occurs

# 🔄 Batch Analysis System - Complete Guide

## 📊 Översikt

Batch Analysis System låter dig köra teknisk analys (scraping, Puppeteer, Google) på flera leads samtidigt, antingen manuellt eller som schemalagda cronjobs.

---

## 🎯 Funktioner

### **1. Batch Processing**
- Analysera flera leads samtidigt (upp till 100 per batch)
- Olika analystyper: Tech Analysis, Checkout Scraping, Full Analysis
- Progress tracking i realtid
- Retry-logik vid fel
- Automatisk sparning till databas

### **2. Scheduled Jobs (Cronjobs)**
- Schemalägg analyser att köra automatiskt
- Cron-uttryck för flexibel schemaläggning
- Dagliga, veckovisa eller custom schedules
- Automatisk körning i bakgrunden

### **3. Analystyper**
- **tech_analysis** - Teknologier och e-handelsplattform
- **checkout_scraping** - Checkout-lösningar och transportörer
- **full_analysis** - Komplett analys (tech + checkout)
- **ecommerce_detection** - Endast e-handelsplattform
- **carrier_detection** - Endast transportörer

---

## 🗄️ Databas

### **Migration: 013_add_batch_analysis_jobs.sql**

**Tabeller:**
1. `batch_analysis_jobs` - Batch jobb
2. `batch_analysis_items` - Individuella leads i batch

**Functions:**
- `create_batch_analysis_job()` - Skapa nytt batch jobb
- `get_next_batch_item()` - Hämta nästa lead att processa
- `update_batch_item_status()` - Uppdatera status för lead
- `get_scheduled_jobs_to_run()` - Hämta schemalagda jobb
- `calculate_next_run()` - Beräkna nästa körning

### **Kör migration:**
```sql
-- I Supabase SQL Editor:
-- Kopiera och kör: server/migrations/013_add_batch_analysis_jobs.sql
```

---

## 📡 API Endpoints

### **1. Skapa Batch Job**
```http
POST /api/batch-analysis/jobs
Authorization: Bearer <token>

{
  "job_name": "Nightly Tech Analysis",
  "job_type": "tech_analysis",
  "lead_ids": ["uuid1", "uuid2", "uuid3"],
  "analysis_config": {
    "use_firecrawl": true,
    "use_puppeteer": true,
    "timeout": 20000
  },
  "is_scheduled": false
}
```

**Response:**
```json
{
  "job_id": "uuid",
  "message": "Batch job started",
  "status": "running"
}
```

### **2. Skapa Scheduled Job (Cronjob)**
```http
POST /api/batch-analysis/jobs

{
  "job_name": "Daily Checkout Scraping",
  "job_type": "checkout_scraping",
  "lead_ids": ["uuid1", "uuid2"],
  "is_scheduled": true,
  "schedule_cron": "0 2 * * *"
}
```

**Cron Expressions:**
- `0 2 * * *` - Dagligen kl 02:00
- `0 */6 * * *` - Var 6:e timme
- `0 * * * *` - Varje timme
- `0 0 * * 0` - Varje söndag midnatt

### **3. Lista Batch Jobs**
```http
GET /api/batch-analysis/jobs?status=running&limit=50&offset=0
```

**Response:**
```json
{
  "jobs": [
    {
      "id": "uuid",
      "job_name": "Tech Analysis",
      "job_type": "tech_analysis",
      "status": "running",
      "progress": 45,
      "total_leads": 100,
      "successful_count": 40,
      "failed_count": 5,
      "created_at": "2025-12-18T22:00:00Z"
    }
  ],
  "total": 10,
  "limit": 50,
  "offset": 0
}
```

### **4. Hämta Job Status**
```http
GET /api/batch-analysis/jobs/:id
```

**Response:**
```json
{
  "job": {
    "id": "uuid",
    "job_name": "Tech Analysis",
    "status": "running",
    "progress": 45,
    "total_leads": 100,
    "successful_count": 40,
    "failed_count": 5,
    "items": [
      {
        "id": "item-uuid",
        "lead_id": "lead-uuid",
        "company_name": "Acme AB",
        "status": "completed",
        "duration_seconds": 12
      }
    ]
  }
}
```

### **5. Avbryt Job**
```http
POST /api/batch-analysis/jobs/:id/cancel
```

### **6. Trigga Scheduled Job Manuellt**
```http
POST /api/batch-analysis/jobs/:id/trigger
```

### **7. Quick Analysis (Snabbanalys)**
```http
POST /api/batch-analysis/quick-analyze

{
  "lead_ids": ["uuid1", "uuid2"],
  "analysis_type": "tech_analysis"
}
```

### **8. Scheduler Status (Admin)**
```http
GET /api/batch-analysis/scheduler/status
```

**Response:**
```json
{
  "scheduler": {
    "running": true,
    "processing": false,
    "check_interval_seconds": 60
  },
  "upcoming_jobs": [
    {
      "id": "uuid",
      "job_name": "Daily Analysis",
      "next_run_at": "2025-12-19T02:00:00Z",
      "schedule_cron": "0 2 * * *"
    }
  ]
}
```

---

## 🔧 Backend Services

### **1. batchAnalysisService.js**
Processar batch jobb:
- `processBatchJob(jobId)` - Kör batch jobb
- `getBatchJobStatus(jobId)` - Hämta status
- `cancelBatchJob(jobId)` - Avbryt jobb

### **2. batchSchedulerService.js**
Hanterar schemalagda jobb:
- `startScheduler()` - Starta scheduler (körs automatiskt)
- `stopScheduler()` - Stoppa scheduler
- `triggerScheduledJob(jobId)` - Manuell trigger
- `getSchedulerStatus()` - Status

### **3. Integrering**
Scheduler startar automatiskt i `server/index.js`:
```javascript
import { startScheduler as startBatchScheduler } from './services/batchSchedulerService.js';

app.listen(PORT, () => {
  startBatchScheduler();
});
```

---

## 🎨 Frontend Integration

### **Exempel: Batch Analysis Button i Lead List**

```tsx
import { useState } from 'react';
import { Play, Clock, CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';

export const LeadListBatchActions = ({ selectedLeads }) => {
  const [batchJobId, setBatchJobId] = useState(null);
  const [status, setStatus] = useState(null);
  
  const startBatchAnalysis = async (analysisType) => {
    try {
      const token = localStorage.getItem('eurekai_token');
      const response = await fetch(`${API_BASE_URL}/batch-analysis/quick-analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lead_ids: selectedLeads.map(l => l.id),
          analysis_type: analysisType
        })
      });
      
      const data = await response.json();
      setBatchJobId(data.job_id);
      
      // Poll for status
      pollJobStatus(data.job_id);
      
    } catch (error) {
      console.error('Error starting batch analysis:', error);
    }
  };
  
  const pollJobStatus = async (jobId) => {
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('eurekai_token');
        const response = await fetch(`${API_BASE_URL}/batch-analysis/jobs/${jobId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        setStatus(data.job);
        
        if (data.job.status === 'completed' || data.job.status === 'failed') {
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Error polling status:', error);
        clearInterval(interval);
      }
    }, 3000); // Poll every 3 seconds
  };
  
  return (
    <div className="space-y-4">
      {/* Batch Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => startBatchAnalysis('tech_analysis')}
          disabled={selectedLeads.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          <Play className="w-4 h-4" />
          Tech Analysis ({selectedLeads.length} leads)
        </button>
        
        <button
          onClick={() => startBatchAnalysis('checkout_scraping')}
          disabled={selectedLeads.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          <Play className="w-4 h-4" />
          Checkout Scraping
        </button>
        
        <button
          onClick={() => startBatchAnalysis('full_analysis')}
          disabled={selectedLeads.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        >
          <Play className="w-4 h-4" />
          Full Analysis
        </button>
      </div>
      
      {/* Status Display */}
      {status && (
        <div className="bg-white border rounded p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold">{status.job_name}</h3>
            <span className={`px-2 py-1 rounded text-sm ${
              status.status === 'completed' ? 'bg-green-100 text-green-800' :
              status.status === 'failed' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {status.status}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>{status.progress} / {status.total_leads}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(status.progress / status.total_leads) * 100}%` }}
              ></div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>{status.successful_count} successful</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-red-600">✗</span>
              <span>{status.failed_count} failed</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## 📋 Användningsexempel

### **1. Manuell Batch Analysis**
```javascript
// Från lead list, välj leads och kör analys
const selectedLeadIds = ['uuid1', 'uuid2', 'uuid3'];

fetch('/api/batch-analysis/quick-analyze', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    lead_ids: selectedLeadIds,
    analysis_type: 'tech_analysis'
  })
});
```

### **2. Skapa Scheduled Job**
```javascript
// Skapa ett jobb som körs dagligen kl 02:00
fetch('/api/batch-analysis/jobs', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    job_name: 'Daily Tech Analysis',
    job_type: 'tech_analysis',
    lead_ids: allLeadIds,
    is_scheduled: true,
    schedule_cron: '0 2 * * *'
  })
});
```

### **3. Övervaka Job Status**
```javascript
// Poll för status var 3:e sekund
const pollStatus = setInterval(async () => {
  const response = await fetch(`/api/batch-analysis/jobs/${jobId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  
  if (data.job.status === 'completed') {
    clearInterval(pollStatus);
    console.log('Job completed!');
  }
}, 3000);
```

---

## 🚀 Implementation Checklist

### **Backend:**
- [x] Skapa migration `013_add_batch_analysis_jobs.sql`
- [x] Skapa `batchAnalysisService.js`
- [x] Skapa `batchSchedulerService.js`
- [x] Skapa `routes/batchAnalysis.js`
- [x] Integrera i `server/index.js`
- [ ] Kör migration i Supabase

### **Frontend:**
- [ ] Lägg till batch action buttons i lead list
- [ ] Skapa batch job status component
- [ ] Lägg till scheduled jobs management UI
- [ ] Visa progress i realtid

### **Testing:**
- [ ] Testa manuell batch analysis
- [ ] Testa scheduled jobs
- [ ] Testa error handling och retry
- [ ] Verifiera data sparas korrekt

---

## 🔍 Troubleshooting

### **Scheduler körs inte:**
1. Kolla server logs: `Batch scheduler started`
2. Verifiera scheduled jobs: `GET /api/batch-analysis/scheduler/status`
3. Kolla `next_run_at` i databasen

### **Batch job fastnar:**
1. Kolla job status: `GET /api/batch-analysis/jobs/:id`
2. Kolla individual items: Se `items` array i response
3. Avbryt om nödvändigt: `POST /api/batch-analysis/jobs/:id/cancel`

### **Leads analyseras inte:**
1. Verifiera att leads har `domain` kolumn
2. Kolla error messages i `batch_analysis_items`
3. Testa manuellt: `scrapeWebsite(url)`

---

## 📊 Databas Queries

### **Visa alla batch jobs:**
```sql
SELECT 
  id,
  job_name,
  job_type,
  status,
  progress,
  total_leads,
  created_at
FROM batch_analysis_jobs
ORDER BY created_at DESC
LIMIT 20;
```

### **Visa scheduled jobs:**
```sql
SELECT 
  id,
  job_name,
  schedule_cron,
  next_run_at,
  last_run_at
FROM batch_analysis_jobs
WHERE is_scheduled = TRUE
ORDER BY next_run_at ASC;
```

### **Visa failed items:**
```sql
SELECT 
  bi.id,
  l.company_name,
  bi.error_message,
  bi.retry_count
FROM batch_analysis_items bi
JOIN leads l ON bi.lead_id = l.id
WHERE bi.status = 'failed'
ORDER BY bi.started_at DESC;
```

---

Systemet är nu redo att användas! 🎉



import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AuthWrapper } from './components/AuthWrapper';
import { useAuth } from './src/contexts/AuthContext';
import { Header } from './components/Header';
import InputForm from './components/InputForm';
import LeadCard from './components/LeadCard';
import ResultsTable from './components/ResultsTable'; 
import { ExclusionManager } from './components/ExclusionManager';
import { InclusionManager } from './components/InclusionManager';
import { CacheManager } from './components/CacheManager'; 
import { ManualAddModal } from './components/ManualAddModal'; 
import { BackupManager } from './components/BackupManager'; 
import { OnboardingTour } from './components/OnboardingTour'; 
import { DailyBriefing } from './components/DailyBriefing'; 
import { QuotaTimer } from './components/QuotaTimer';
import { RateLimitOverlay } from './components/RateLimitOverlay'; 
import { ProcessingStatusBanner } from './components/ProcessingStatusBanner';
import { RemovalAnalysisModal, RemovalReason } from './components/RemovalAnalysisModal';
import { CustomerList } from './components/CustomerList';
import { CustomerDetail } from './components/CustomerDetail';
import { CronJobsPanel } from './src/components/admin/CronJobsPanel';
import { DashboardRouter } from './components/DashboardRouter';
import { AdminSettings } from './components/AdminSettings'; 
import { generateLeads, findPersonOnLinkedIn, generateDeepDiveSequential } from './services/geminiService';
import { SearchFormData, LeadData, Segment } from './types';
import { AlertCircle, Search, Database } from 'lucide-react';

// Helper to ensure list has unique IDs AND Sanitize Data Statuses
const sanitizeLeads = (list: any[]): any[] => {
  if (!Array.isArray(list)) return [];
  const seenIds = new Set<string>();
  
  return list.map(item => {
    // 1. ID Fix
    let id = item.id;
    if (!id || seenIds.has(id)) {
      id = crypto.randomUUID();
    }
    seenIds.add(id);

    // 2. Status Fix (The "Manuellt inlagd" cleanup)
    let status = item.legalStatus;
    // If it says "Manuellt inlagd" but source is NOT manual -> Reset to 'Aktivt' (assumed import/AI)
    if (status === 'Manuellt inlagd' && item.source !== 'manual') {
        status = 'Aktivt';
    }

    // 3. FORCE DATE IF MISSING (Prevent Re-analysis loop)
    // If we load from storage/backup and it has no date, give it NOW.
    const analysisDate = item.analysisDate || new Date().toISOString();

    // 4. Data Format Fix (Org.nummer och omsättning) - GEMINI FEEDBACK
    let orgNumber = item.orgNumber;
    let revenue = item.revenue;
    
    // Validera org.nummer som exakt 10 siffror
    if (orgNumber && typeof orgNumber === 'string') {
        const cleanedOrg = orgNumber.replace(/[^0-9]/g, ''); // Ta bort allt utom siffror
        if (cleanedOrg.length !== 10) {
            console.warn(`⚠️ Org.nummer sanerat till ogiltigt format: ${orgNumber}`);
            orgNumber = ''; // Töm istället för felmeddelande
        } else {
            orgNumber = cleanedOrg;
        }
    }
    
    // Validera omsättning (konvertera till nummer om string)
    if (revenue && typeof revenue !== 'number' && typeof revenue === 'string') {
        // Försök konvertera till nummer, annars sätt till null
        const numRevenue = parseInt(revenue.replace(/[^0-9]/g, ''), 10);
        revenue = isNaN(numRevenue) ? null : numRevenue;
    }

    return { ...item, id, legalStatus: status, analysisDate, orgNumber, revenue };
  });
};

const AppContent: React.FC = () => {
  const { user } = useAuth();
  
  // --- STATE: LEADS (PERSISTENT SESSION) ---
  const [leads, setLeads] = useState<LeadData[]>(() => {
    try {
      const saved = localStorage.getItem('dhl_active_leads');
      if (saved) {
        const parsed = JSON.parse(saved);
        // STRICT SANITIZATION ON LOAD
        return sanitizeLeads(parsed);
      }
      return [];
    } catch (e) {
      console.warn("Failed to load active leads", e);
      return [];
    }
  });

  const [deepDiveLead, setDeepDiveLead] = useState<LeadData | null>(null);
  const [loading, setLoading] = useState(false);
  const [deepDiveLoading, setDeepDiveLoading] = useState(false);
  const [analyzingCompany, setAnalyzingCompany] = useState<string | null>(null); 
  const [backgroundAnalysisResult, setBackgroundAnalysisResult] = useState<LeadData | null>(null); 

  const [isEnriching, setIsEnriching] = useState(false); 
  const [linkedInSearching, setLinkedInSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const deepDiveLeadRef = useRef<LeadData | null>(null);
  useEffect(() => {
    deepDiveLeadRef.current = deepDiveLead;
  }, [deepDiveLead]);

  // ERROR STATES
  const [quotaError, setQuotaError] = useState(false); 
  const [rateLimitError, setRateLimitError] = useState(false); 
  const [quotaWaitTime, setQuotaWaitTime] = useState<number | null>(null); 

  const [hasSearched, setHasSearched] = useState(() => {
    return !!localStorage.getItem('dhl_active_leads');
  });
  
  const [batchProgress, setBatchProgress] = useState<{current: number, total: number} | null>(null);
  const [batchDeepDiveProgress, setBatchDeepDiveProgress] = useState<{current: number, total: number, currentName: string} | null>(null);
  const [usedCacheCount, setUsedCacheCount] = useState(0); 
  const [resetTrigger, setResetTrigger] = useState(0); 

  // GLOBAL PROTOCOL STATE
  // Added 'deep_pro' to supported modes
  const [protocolMode, setProtocolMode] = useState<'quick' | 'deep' | 'deep_pro' | 'groq_fast' | 'groq_deep' | 'batch_prospecting'>(() => {
    try {
      const saved = localStorage.getItem('dhl_protocol_mode');
      return (saved as any) || 'deep';
    } catch (e) { return 'deep'; }
  }); 

  // --- API CALL COUNTER & TIMESTAMP ---
  const [apiCallCount, setApiCallCount] = useState(() => {
    try {
      const savedCount = localStorage.getItem('dhl_api_call_count');
      const savedTimestamp = localStorage.getItem('dhl_api_call_timestamp');
      
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (savedCount && savedTimestamp) {
        const timeDiff = now - parseInt(savedTimestamp, 10);
        if (timeDiff < twentyFourHours) {
          return parseInt(savedCount, 10);
        }
      }
      return 0;
    } catch (e) {
      return 0;
    }
  });

  // --- PERSISTENT LISTS ---
  const [existingCustomers, setExistingCustomers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dhl_existing_customers');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [downloadedLeads, setDownloadedLeads] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dhl_downloaded_leads');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [includedKeywords, setIncludedKeywords] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dhl_included_keywords');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [candidateCache, setCandidateCache] = useState<LeadData[]>(() => {
    try {
      const saved = localStorage.getItem('dhl_candidate_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        // STRICT SANITIZATION ON LOAD
        return sanitizeLeads(parsed);
      }
      return [];
    } catch (e) { 
      console.warn("Failed to load cache", e);
      return []; 
    }
  });
  
  // --- INTERNAL BACKUPS STATE ---
  const [internalBackups, setInternalBackups] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('dhl_internal_backups');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [isExclusionModalOpen, setIsExclusionModalOpen] = useState(false);
  const [isInclusionModalOpen, setIsInclusionModalOpen] = useState(false);
  const [isCacheModalOpen, setIsCacheModalOpen] = useState(false); 
  const [isManualAddOpen, setIsManualAddOpen] = useState(false); 
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false); 
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isBriefingOpen, setIsBriefingOpen] = useState(false); 
  const [demoDataTrigger, setDemoDataTrigger] = useState<{ type: 'single' | 'batch', timestamp: number } | null>(null);
  
  // REMOVAL MODAL STATE
  const [isRemovalModalOpen, setIsRemovalModalOpen] = useState(false);
  const [pendingRemovalLeads, setPendingRemovalLeads] = useState<LeadData[]>([]);

  // CUSTOMER LIST STATE
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  
  // CRONJOBS STATE
  const [showCronjobs, setShowCronjobs] = useState(false);
  
  // ADMIN SETTINGS STATE
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  
  // DASHBOARD STATE - Only show dashboard for super admin by default
  const [showDashboard, setShowDashboard] = useState(() => {
    // Super admin sees dashboard, tenant admin sees lead search
    return user?.isSuperAdmin === true;
  });

  const [formDataState, setFormDataState] = useState<SearchFormData | null>(() => {
    try {
      const saved = localStorage.getItem('dhl_last_form_data');
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });

  // --- PERSISTENCE EFFECTS ---
  useEffect(() => { 
    try { localStorage.setItem('dhl_active_leads', JSON.stringify(leads)); } catch(e) { console.error("LS Error", e); }
  }, [leads]);
  
  useEffect(() => { 
    try { localStorage.setItem('dhl_candidate_cache', JSON.stringify(candidateCache)); } catch(e) { console.error("LS Error", e); }
  }, [candidateCache]);
  
  useEffect(() => { 
    try { localStorage.setItem('dhl_existing_customers', JSON.stringify(existingCustomers)); } catch(e) { console.error("LS Error", e); }
  }, [existingCustomers]);
  
  useEffect(() => { 
    try { localStorage.setItem('dhl_downloaded_leads', JSON.stringify(downloadedLeads)); } catch(e) { console.error("LS Error", e); }
  }, [downloadedLeads]);
  
  useEffect(() => { 
    try { localStorage.setItem('dhl_included_keywords', JSON.stringify(includedKeywords)); } catch(e) { console.error("LS Error", e); }
  }, [includedKeywords]);
  
  useEffect(() => { 
    try { localStorage.setItem('dhl_protocol_mode', protocolMode); } catch(e) { console.error("LS Error", e); }
  }, [protocolMode]);
  
  useEffect(() => { 
    try { localStorage.setItem('dhl_internal_backups', JSON.stringify(internalBackups)); } catch(e) { console.error("LS Error", e); }
  }, [internalBackups]);
  
  useEffect(() => { 
    if (formDataState) {
        try { localStorage.setItem('dhl_last_form_data', JSON.stringify(formDataState)); } catch(e) { console.error("LS Error", e); }
    }
  }, [formDataState]);

  useEffect(() => {
    try {
      localStorage.setItem('dhl_api_call_count', apiCallCount.toString());
    } catch(e) { console.error("LS Error", e); }
  }, [apiCallCount]);

  useEffect(() => {
    const checkRollingWindow = () => {
      try {
        const savedTimestamp = localStorage.getItem('dhl_api_call_timestamp');
        if (savedTimestamp) {
          const now = Date.now();
          const twentyFourHours = 24 * 60 * 60 * 1000;
          if (now - parseInt(savedTimestamp, 10) > twentyFourHours) {
            setApiCallCount(0);
            localStorage.setItem('dhl_api_call_timestamp', now.toString());
          }
        }
      } catch (e) { console.error("Timer Error", e); }
    };
    checkRollingWindow();
    const interval = setInterval(checkRollingWindow, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('dhl_has_seen_tour');
    if (!hasSeenTour) {
      setIsTourOpen(true);
      localStorage.setItem('dhl_has_seen_tour', 'true');
    }
  }, []);

  // --- AUTOMATIC SYSTEM BACKUP ---
  const stateRef = useRef({
    leads,
    candidateCache,
    existingCustomers,
    downloadedLeads,
    includedKeywords,
    apiCallCount,
    protocolMode
  });

  useEffect(() => {
    stateRef.current = {
      leads,
      candidateCache,
      existingCustomers,
      downloadedLeads,
      includedKeywords,
      apiCallCount,
      protocolMode
    };
  }, [leads, candidateCache, existingCustomers, downloadedLeads, includedKeywords, apiCallCount, protocolMode]);

  useEffect(() => {
    const checkAndPerformBackup = () => {
      try {
        const lastBackupStr = localStorage.getItem('dhl_last_auto_backup');
        const lastBackup = lastBackupStr ? parseInt(lastBackupStr, 10) : 0;
        const now = Date.now();
        const INTERVAL_MS = 60 * 60 * 1000;

        if (now - lastBackup > INTERVAL_MS) {
          const state = stateRef.current;
          
          if (state.leads.length === 0 && state.candidateCache.length === 0 && state.existingCustomers.length === 0) return;

          const dateStr = new Date().toLocaleString('sv-SE', {
             year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
          });
          const backupName = `State ${dateStr}`;

          const systemState = {
            version: "4.4",
            timestamp: new Date().toISOString(),
            leads: state.leads,
            candidateCache: state.candidateCache,
            existingCustomers: state.existingCustomers,
            downloadedLeads: state.downloadedLeads,
            includedKeywords: state.includedKeywords,
            apiCallCount: state.apiCallCount,
            protocolMode: state.protocolMode
          };

          const newBackup = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            name: backupName,
            timestamp: systemState.timestamp,
            leadCount: state.leads.length + state.candidateCache.length,
            data: systemState
          };

          setInternalBackups(prev => {
             const updated = [newBackup, ...prev].slice(30);
             return updated;
          });

          localStorage.setItem('dhl_last_auto_backup', now.toString());
        }
      } catch (e) {
        console.error("Auto Backup Failed:", e);
      }
    };

    const intervalId = setInterval(checkAndPerformBackup, 60000); 
    return () => clearInterval(intervalId);
  }, []);


  const handleTourClose = () => {
    setIsTourOpen(false);
  };

  const incrementApiCount = () => {
    setApiCallCount(prev => {
      const newCount = prev + 1;
      if (prev === 0) {
        localStorage.setItem('dhl_api_call_timestamp', Date.now().toString());
      }
      return newCount;
    });
  };

  const addToCache = (newLeads: LeadData[]) => {
    setCandidateCache(prev => {
      const leadMap = new Map(prev.map(l => [l.companyName.toLowerCase(), l]));
      newLeads.forEach(l => {
        leadMap.set(l.companyName.toLowerCase(), l);
      });
      return Array.from(leadMap.values());
    });
  };

  const handleUpdateLead = (updatedLead: LeadData) => {
    setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
    if (deepDiveLead && deepDiveLead.id === updatedLead.id) {
        setDeepDiveLead(updatedLead);
    }
    setCandidateCache(prev => {
        const idx = prev.findIndex(c => c.id === updatedLead.id);
        if (idx >= 0) {
            const newCache = [...prev];
            newCache[idx] = updatedLead;
            return newCache;
        }
        return prev;
    });
  };

  const handleReset = () => {
    setLoading(false);
    setDeepDiveLoading(false);
    setAnalyzingCompany(null);
    setBackgroundAnalysisResult(null);
    setIsEnriching(false);
    setLeads([]);
    setDeepDiveLead(null);
    setBatchProgress(null);
    setBatchDeepDiveProgress(null);
    setError(null);
    setQuotaError(false); 
    setRateLimitError(false);
    setQuotaWaitTime(null);
    setHasSearched(false);
    setUsedCacheCount(0);
    setFormDataState(null);
    localStorage.removeItem('dhl_last_form_data');
    localStorage.removeItem('dhl_active_leads');
    setResetTrigger(prev => prev + 1);
  };

  // --- BACKUP MANAGER LOGIC ---

  const getSystemState = () => ({
    version: "4.4",
    timestamp: new Date().toISOString(),
    leads,
    candidateCache,
    existingCustomers,
    downloadedLeads,
    includedKeywords,
    apiCallCount,
    protocolMode
  });

  const handleCreateInternalBackup = (name: string) => {
    try {
      const state = getSystemState();
      const newBackup = {
        id: crypto.randomUUID(),
        name: name,
        timestamp: state.timestamp,
        leadCount: leads.length + candidateCache.length,
        data: state
      };
      
      const updatedBackups = [newBackup, ...internalBackups];
      const jsonString = JSON.stringify(updatedBackups);
      if (jsonString.length > 4500000) { 
         alert("Varning: Dina backups tar mycket plats. Radera gamla backups för att undvika fel.");
      }
      setInternalBackups(updatedBackups);
    } catch (e) {
      alert("Kunde inte spara backup. Lagringsutrymmet är fullt?");
      console.error(e);
    }
  };

  const handleRestoreInternalBackup = (backup: any) => {
      try {
        const state = backup.data;
        // SANITIZE ON RESTORE
        if (state.leads) {
           const sanitized = sanitizeLeads(state.leads).map(l => ({
               ...l,
               // STRICTLY FORCE DATE if missing on restore to prevent re-analysis loops
               // If it's in a backup, we treat it as analyzed.
               analysisDate: l.analysisDate || new Date().toISOString()
           }));
           setLeads(sanitized);
        }
        if (state.candidateCache) setCandidateCache(sanitizeLeads(state.candidateCache));
        
        if (state.existingCustomers) setExistingCustomers(state.existingCustomers);
        if (state.downloadedLeads) setDownloadedLeads(state.downloadedLeads);
        if (state.includedKeywords) setIncludedKeywords(state.includedKeywords);
        if (typeof state.apiCallCount === 'number') setApiCallCount(state.apiCallCount);
        if (state.protocolMode) setProtocolMode(state.protocolMode);
        
        setHasSearched(true);
      } catch (err) {
        console.error(err);
        alert("Kunde inte återställa. Datan verkar skadad.");
      }
  };

  const handleDeleteInternalBackup = (id: string) => {
    if (window.confirm("Radera denna backup permanent?")) {
      setInternalBackups(prev => prev.filter(b => b.id !== id));
    }
  };

  const handleImportBackupFile = async (file: File) => {
    try {
      const text = await file.text();
      const state = JSON.parse(text);
      const wrapper = { data: state };
      handleRestoreInternalBackup(wrapper);
      alert("Backup importerad och återställd!");
    } catch (e) {
      alert("Fel filformat. Kunde inte importera.");
    }
  };

  const handleDownloadCurrent = () => {
      const state = getSystemState();
      const backupWrapper = {
        id: crypto.randomUUID(),
        name: "Direct_Download",
        timestamp: state.timestamp,
        leadCount: leads.length + candidateCache.length,
        data: state
      };
      const jsonString = JSON.stringify(backupWrapper, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `DHL_System_Backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // --- ACTIONS ---

  const handleConvertToCustomer = async (lead: LeadData) => {
    try {
      console.log(`🔄 Konverterar ${lead.companyName} till kund...`);
      
      // Extrahera revenue som nummer
      let revenueTkr = null;
      if (lead.revenue) {
        const revenueMatch = lead.revenue.match(/[\d\s]+/);
        if (revenueMatch) {
          revenueTkr = parseInt(revenueMatch[0].replace(/\s/g, ''));
        }
      }

      // Skapa customer-objekt från lead (matchar backend schema)
      const customer = {
        company_name: lead.companyName,
        org_number: lead.orgNumber,
        address: lead.address || '',
        phone: lead.phoneNumber || '',
        email: lead.email || '',
        website_url: lead.websiteUrl || '',
        segment: lead.segment || 'general',
        customer_since: new Date().toISOString().split('T')[0],
        account_manager_id: user?.id || null,
        annual_contract_value: null,
        monitor_checkout: false,
        monitor_frequency: 'daily',
        monitor_times: ['09:00', '15:00', '21:00'],
        decision_makers: lead.decisionMakers || [],
        revenue_tkr: revenueTkr,
        employees: lead.employees ? parseInt(lead.employees) : null
      };

      // Försök spara till backend (om API finns)
      let savedToBackend = false;
      try {
        const response = await fetch('http://localhost:3001/api/customers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('dhl_token')}`
          },
          body: JSON.stringify(customer)
        });

        if (response.ok) {
          const savedCustomer = await response.json();
          console.log('✅ Kund sparad till backend:', savedCustomer);
          savedToBackend = true;
        } else {
          const errorData = await response.json();
          console.warn('⚠️ Backend API fel:', errorData);
        }
      } catch (error) {
        console.warn('⚠️ Backend API inte tillgänglig:', error);
      }

      // Lägg till i existing customers för att filtrera bort från leads
      setExistingCustomers(prev => [...prev, lead.companyName]);

      // Ta bort från leads
      setLeads(prev => prev.filter(l => l.id !== lead.id));
      setCandidateCache(prev => prev.filter(l => l.id !== lead.id));

      // Stäng lead card om öppen
      setDeepDiveLead(null);

      // Visa success-meddelande
      const message = savedToBackend 
        ? `✅ ${lead.companyName} har konverterats till kund!\n\n✓ Sparad i databasen\n✓ Finns nu i kundlistan\n✓ Borttagen från leads`
        : `✅ ${lead.companyName} har konverterats till kund!\n\n⚠️ Backend API inte tillgänglig\n✓ Sparad lokalt\n✓ Borttagen från leads`;
      
      alert(message);

    } catch (error) {
      console.error('❌ Fel vid konvertering till kund:', error);
      alert('❌ Kunde inte konvertera till kund. Försök igen.');
    }
  };

  const handleReportError = (lead: LeadData) => {
    setPendingRemovalLeads([lead]);
    setIsRemovalModalOpen(true);
  };

  const handleExcludeSelected = (selectedLeads: LeadData[]) => {
    setPendingRemovalLeads(selectedLeads);
    setIsRemovalModalOpen(true);
    return false; // Return false to wait for modal confirmation
  };

  const handleConfirmRemoval = (reason: RemovalReason) => {
    const idsToRemove = new Set(pendingRemovalLeads.map(l => l.id));
    
    // Execute Removal from Views
    setLeads(prev => prev.filter(l => !idsToRemove.has(l.id)));
    setCandidateCache(prev => prev.filter(l => !idsToRemove.has(l.id)));

    // Handle Logic based on Reason
    if (reason === 'EXISTING_CUSTOMER') {
      const names = pendingRemovalLeads.map(l => l.companyName);
      setExistingCustomers(prev => [...prev, ...names]);
    } else if (reason === 'ALREADY_DOWNLOADED') {
      const names = pendingRemovalLeads.map(l => l.companyName);
      setDownloadedLeads(prev => [...prev, ...names]);
    } else if (reason === 'NOT_RELEVANT') {
      const names = pendingRemovalLeads.map(l => l.companyName);
      setExistingCustomers(prev => [...prev, ...names]);
    } else if (reason === 'INCORRECT_DATA') {
      // Create strict negative match string
      const negativeMatches = pendingRemovalLeads.map(l => 
        `NEGATIV MATCH: ${l.companyName} ; ${l.orgNumber || 'Saknas'}`
      );
      setExistingCustomers(prev => [...prev, ...negativeMatches]);

      // --- AUTOMATIC RETRY LOGIC ---
      // If we are removing a single lead due to bad data, 
      // automatically initiate a fresh search to find the correct data.
      if (pendingRemovalLeads.length === 1) {
         const companyToRetry = pendingRemovalLeads[0].companyName;
         
         // Use timeout to ensure state update has propagated/closures are fresh enough 
         // and to give the UI a moment to clear the old card.
         setTimeout(() => {
             console.log("Auto-retrying deep dive for:", companyToRetry);
             handleDeepDive(companyToRetry, true); // Force refresh
         }, 1000);
      }
    }

    // If the removed lead was the currently open one, close it
    if (deepDiveLead && idsToRemove.has(deepDiveLead.id)) {
        setDeepDiveLead(null);
    }

    setIsRemovalModalOpen(false);
    setPendingRemovalLeads([]);
  };

  const handleDeepDiveSelected = async (selectedLeads: LeadData[]) => {
    if (loading || deepDiveLoading) return;
    
    const count = selectedLeads.length;
    setBatchDeepDiveProgress({ current: 0, total: count, currentName: 'Förbereder...' });
    setDeepDiveLoading(true);

    try {
      let processedCount = 0;
      
      for (const lead of selectedLeads) {
        setBatchDeepDiveProgress({ 
          current: processedCount + 1, 
          total: count, 
          currentName: lead.companyName 
        });
        
        // Setup form data for this specific lead
        const tempFormData: SearchFormData = {
          companyNameOrOrg: lead.companyName, // Use name primarily for search context
          geoArea: '',
          financialScope: '',
          triggers: '',
          leadCount: 1,
          focusRole1: 'Logistikchef', 
          focusRole2: 'VD',
          focusRole3: 'Ekonomichef',
          icebreakerTopic: '',
          batchMode: protocolMode, 
          specificPerson: '',
          // Important: Pass Org Number via exclude/include hacks or just rely on name search in deep dive
        };

        try {
          // Use sequential deep dive
          const enrichedLead = await generateDeepDiveSequential(tempFormData, (partialLead) => {
              // Update UI with partial data
              handleUpdateLead({ ...lead, ...partialLead, id: lead.id }); // Preserve ID
          });
          
          // Final Update
          handleUpdateLead({ ...lead, ...enrichedLead, id: lead.id });
          incrementApiCount();
          
        } catch (err: any) {
           console.error(`Failed deep dive for ${lead.companyName}:`, err);
           // Handle 429 specifically in batch loop? 
           if (err.message.includes('429') || err.message.includes('QUOTA')) {
              setQuotaError(true);
              break; // Stop batch on quota error
           }
        }
        
        processedCount++;
        // Small pause between leads in batch to be safe
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10s delay in batch deep dive
      }

    } catch (e) {
      console.error("Batch deep dive error", e);
    } finally {
      setDeepDiveLoading(false);
      setBatchDeepDiveProgress(null);
    }
  };

  const handleDeepDive = async (companyName: string, forceRefresh = false) => {
    setAnalyzingCompany(companyName);
    setError(null);
    
    // Reset enriching state if starting fresh
    if (forceRefresh) setIsEnriching(false); 

    const currentLead = leads.find(l => l.companyName === companyName);
    
    // CRITICAL FIX: PREVENT UNNECESSARY RE-ANALYSIS ON BACKUP/EXISTING DATA
    if (currentLead && !forceRefresh) {
        // If the lead already has an analysis date, it's considered "done".
        // Just open it without triggering loading states.
        if (currentLead.analysisDate) {
            console.log("Lead already analyzed. Opening without re-analysis.");
            setDeepDiveLead(currentLead);
            setAnalyzingCompany(null);
            return;
        }
    }
    
    // Set loading states ONLY if we are actually proceeding
    setLoading(true);
    setDeepDiveLoading(true);

    // If we have a current lead and forceRefresh is true, use it as base
    // BUT potentially clear analysisDate locally to show that it is reprocessing
    if (currentLead) {
        if (forceRefresh) {
            // Temporarily clear analysis date in the view to indicate freshness
            setDeepDiveLead({ ...currentLead, analysisDate: undefined });
        } else {
            setDeepDiveLead(currentLead);
        }
    }

    try {
      const formData: SearchFormData = {
        companyNameOrOrg: companyName,
        geoArea: '',
        financialScope: '',
        triggers: '',
        leadCount: 1,
        focusRole1: 'Logistikchef', 
        focusRole2: 'VD',
        focusRole3: 'Ekonomichef',
        icebreakerTopic: '',
        batchMode: protocolMode // Use global mode
      };
      
      if (formDataState) {
          formData.focusRole1 = formDataState.focusRole1;
          formData.focusRole2 = formDataState.focusRole2;
          formData.focusRole3 = formDataState.focusRole3;
          formData.triggers = formDataState.triggers;
      }

      const result = await generateDeepDiveSequential(formData, (partialLead) => {
           // Live Update Callback
           // Only update if we are still looking at this company
           const merged = currentLead ? { ...currentLead, ...partialLead } : partialLead;
           setDeepDiveLead(merged);
           setIsEnriching(true); // Show skeletons for missing parts
           
           // Update in list too
           handleUpdateLead(merged);
      });

      // Explicitly timestamp the analysis if missing
      // CRITICAL: Ensure analysisDate is present
      if (!result.analysisDate) {
          result.analysisDate = new Date().toISOString();
      }

      const finalMerged = currentLead ? { ...currentLead, ...result } : result;
      setDeepDiveLead(finalMerged);
      handleUpdateLead(finalMerged); // Update the main list with new data
      
      incrementApiCount();
      setIsEnriching(false); // Done enriching

      // SHOW SUCCESS BANNER IN STATUS BAR
      setBackgroundAnalysisResult(finalMerged);
      // Auto dismiss after 5 seconds
      setTimeout(() => setBackgroundAnalysisResult(null), 5000);

    } catch (err: any) {
      console.error(err);
      setError("Kunde inte genomföra djupanalysen. Försök igen.");
      if (err.message.includes('429')) {
         setRateLimitError(true);
      }
      if (err.message.startsWith('QUOTA_GROUNDING:')) {
         const seconds = parseInt(err.message.split(':')[1]);
         setQuotaWaitTime(seconds);
         setQuotaError(true);
      }
    } finally {
      setLoading(false);
      setDeepDiveLoading(false);
      setAnalyzingCompany(null);
    }
  };

  const handleRefreshAnalysis = async (lead: LeadData) => {
      // Re-run deep dive for an existing lead, forcing refresh
      await handleDeepDive(lead.companyName, true);
  };

  const handleSearch = async (formData: SearchFormData) => {
    setLoading(true);
    setError(null);
    setDeepDiveLead(null);
    setBatchProgress(null);
    setBatchDeepDiveProgress(null);
    setFormDataState(formData);
    setQuotaError(false);
    setRateLimitError(false);
    setQuotaWaitTime(null);
    
    // Reset "Used Cache" counter for new search
    setUsedCacheCount(0);

    const isDeepMode = formData.batchMode === 'deep' || formData.batchMode === 'deep_pro' || (!formData.batchMode && !formData.companyNameOrOrg);
    const isSingleSearch = formData.companyNameOrOrg.trim().length > 0;

    try {
      if (isSingleSearch) {
        // --- SINGLE SEARCH ---
        // Protocol: Deep Dive
        setAnalyzingCompany(formData.companyNameOrOrg);
        
        await generateDeepDiveSequential(formData, (partialLead) => {
             // Immediate feedback logic
             setDeepDiveLead(partialLead);
             setIsEnriching(true);
        })
        .then((result) => {
             // Ensure analysis timestamp
             if (!result.analysisDate) result.analysisDate = new Date().toISOString();

             setDeepDiveLead(result);
             setLeads(prev => {
                // If ID exists update, else add top
                if (prev.some(l => l.id === result.id)) return prev.map(l => l.id === result.id ? result : l);
                return [result, ...prev];
             });
             incrementApiCount();

             // SHOW SUCCESS BANNER
             setBackgroundAnalysisResult(result);
             setTimeout(() => setBackgroundAnalysisResult(null), 5000);
        })
        .finally(() => {
             setIsEnriching(false);
             setAnalyzingCompany(null);
        });

      } else {
        // --- BATCH SEARCH (WATERFALL LOGIC) ---
        
        // 1. FILTER CACHE (Local Reservoir)
        const cachedMatches = candidateCache.filter(item => {
           // Basic filtering: Match Geo if present in address
           const geoMatch = !formData.geoArea || (item.address && item.address.toLowerCase().includes(formData.geoArea.toLowerCase()));
           // Exclude if in Exclusion List
           const isExcluded = existingCustomers.some(ex => item.companyName.toLowerCase().includes(ex.toLowerCase()));
           const isDownloaded = downloadedLeads.includes(item.companyName);
           // Exclude if already in Active Leads
           const isActive = leads.some(l => l.companyName === item.companyName);

           // Match Financial Scope (Optional, but good for precision)
           let scopeMatch = true;
           if (formData.financialScope !== 'Alla' && formData.financialScope) {
               scopeMatch = item.segment === formData.financialScope;
           }

           return geoMatch && !isExcluded && !isDownloaded && !isActive && scopeMatch;
        });

        // 2. FILL FROM CACHE FIRST
        const needed = formData.leadCount;
        const fromCache = cachedMatches.slice(0, needed);
        let remainingNeeded = needed - fromCache.length;

        if (fromCache.length > 0) {
            setLeads(prev => [...fromCache, ...prev]);
            // Remove used from cache? No, keep in cache but mark as "Active" visually in CacheManager.
            // But we should probably remove them from candidateCache to avoid re-adding?
            // Let's keep them in cache but filter them out in the logic above (isActive check).
            setUsedCacheCount(fromCache.length);
        }

        // 3. FETCH FROM API IF MORE NEEDED
        if (remainingNeeded > 0) {
             console.log('[BATCH] Fetching from API, needed:', remainingNeeded);
             const apiFormData = { ...formData, leadCount: remainingNeeded };
             
             // Inject global exclusions into form data
             // Join all exclusion lists
             const allExclusions = [...existingCustomers, ...downloadedLeads, ...leads.map(l => l.companyName)];
             // Limit exclusion string length to avoid token limit?
             apiFormData.excludeCompanies = allExclusions.slice(-50).join(', '); // Send last 50 exclusions to prompt
             apiFormData.includedKeywords = includedKeywords.join(', ');

             console.log('[BATCH] API Form Data:', { 
               leadCount: apiFormData.leadCount, 
               geoArea: apiFormData.geoArea,
               batchMode: apiFormData.batchMode,
               financialScope: apiFormData.financialScope
             });

             try {
               const newLeads = await generateLeads(apiFormData);
               console.log('[BATCH] Received leads from API:', newLeads.length);
               
               // Filter out any API duplicates that slipped through
               const uniqueNewLeads = newLeads.filter(nl => 
                   !leads.some(l => l.companyName === nl.companyName) && 
                   !fromCache.some(c => c.companyName === nl.companyName)
               );

               console.log('[BATCH] Unique new leads:', uniqueNewLeads.length);
               setLeads(prev => [...uniqueNewLeads, ...prev]);
               incrementApiCount();
             } catch (apiError: any) {
               console.error('[BATCH] API Error:', apiError);
               throw apiError; // Re-throw to be caught by outer try-catch
             }
        } else {
             console.log('[BATCH] All leads from cache, no API call needed');
        }

        // 4. BACKGROUND DEEP DIVE (If Batch Deep Mode selected)
        // Note: generateLeads only does Quick Scan or Prospecting. 
        // If 'deep' mode was requested in batch, we typically run generateLeads (which does quick scan) 
        // and THEN we might want to auto-deep-dive? 
        // Current implementation of generateLeads handles DEEP instruction too, but sequential is better for 429.
        // For now, Batch Search just uses generateLeads which is 1-shot.
      }
      
      setHasSearched(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ett fel uppstod vid sökningen.");
      
      if (err.message.includes('429') || err.message.includes('RATE_LIMIT_HIT')) {
          setRateLimitError(true);
      }
      else if (err.message.startsWith('QUOTA_GROUNDING:')) {
          const seconds = parseInt(err.message.split(':')[1]);
          setQuotaWaitTime(seconds);
          setQuotaError(true);
      }
      else if (err.message === 'QUOTA_EXHAUSTED') {
          setQuotaWaitTime(null); // Until midnight
          setQuotaError(true);
      }
    } finally {
      setLoading(false);
      setDeepDiveLoading(false);
      setAnalyzingCompany(null);
    }
  };

  const handleDownloadSingle = (lead: LeadData, shouldUpdateState = true) => {
    const csvContent = [
      ['Företag', 'Org.nr', 'Omsättning', 'Segment', 'Adress', 'Postort', 'Beslutsfattare', 'Titel', 'Telefon', 'Email', 'Logistikprofil', 'DHL', 'Transportörer', 'Tech', 'Källa'],
      [
        lead.companyName,
        lead.orgNumber,
        lead.revenue,
        lead.segment,
        lead.address,
        lead.address.split(',').pop()?.trim() || '',
        lead.decisionMakers[0]?.name || '',
        lead.decisionMakers[0]?.title || '',
        lead.decisionMakers[0]?.directPhone || lead.phoneNumber || '',
        lead.decisionMakers[0]?.email || '',
        lead.logisticsProfile,
        lead.usesDhl,
        lead.carriers,
        lead.ecommercePlatform,
        lead.source
      ]
    ].map(e => e.join(";")).join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Lead_${lead.companyName.replace(/\s+/g, '_')}.csv`;
    link.click();
    
    if (shouldUpdateState) {
        // Add to downloaded list & Remove from view
        setDownloadedLeads(prev => [...prev, lead.companyName]);
        setLeads(prev => prev.filter(l => l.id !== lead.id));
        setCandidateCache(prev => prev.filter(l => l.id !== lead.id));
    }
  };

  // NEW: Handle Batch Download Action (Atomic update to avoid race conditions)
  const handleBatchDownloadAction = (selectedLeads: LeadData[]) => {
      // 1. Download Files (Looping downloads is acceptable for browser UX)
      selectedLeads.forEach(l => handleDownloadSingle(l, false)); // false = don't update state individually

      // 2. ATOMIC STATE UPDATE
      const names = selectedLeads.map(l => l.companyName);
      const ids = new Set(selectedLeads.map(l => l.id));

      setDownloadedLeads(prev => [...prev, ...names]);
      setLeads(prev => prev.filter(l => !ids.has(l.id)));
      setCandidateCache(prev => prev.filter(l => !ids.has(l.id)));
      
      alert(`${selectedLeads.length} företag laddades ner och flyttades till historik.`);
  };

  const handleRunLinkedInSearch = async (role: string) => {
    if (!deepDiveLead) return;
    setLinkedInSearching(true);
    try {
      const person = await findPersonOnLinkedIn(deepDiveLead.companyName, role);
      if (person) {
        setDeepDiveLead(prev => {
           if (!prev) return null;
           // Append new person
           const updated = { ...prev, decisionMakers: [...prev.decisionMakers, person] };
           // Update in list too
           setLeads(list => list.map(l => l.id === prev.id ? updated : l));
           return updated;
        });
      } else {
        alert("Ingen specifik person hittades för den rollen.");
      }
    } catch (e) {
      console.error(e);
      alert("Kunde inte söka på LinkedIn just nu.");
    } finally {
      setLinkedInSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <OnboardingTour 
        isOpen={isTourOpen} 
        onClose={handleTourClose} 
        onDemoFill={(type) => setDemoDataTrigger({ type, timestamp: Date.now() })}
      />
      
      <Header 
        onOpenExclusions={() => setIsExclusionModalOpen(true)}
        onOpenInclusions={() => setIsInclusionModalOpen(true)}
        onOpenCache={() => setIsCacheModalOpen(true)}
        onOpenBriefing={() => setIsBriefingOpen(true)}
        onOpenBackups={() => setIsBackupModalOpen(true)}
        onOpenCronjobs={() => {
          setShowDashboard(false);
          setShowCustomerList(false);
          setShowCronjobs(true);
          setShowAdminSettings(false);
        }}
        onOpenSettings={() => {
          setShowDashboard(false);
          setShowCustomerList(false);
          setShowCronjobs(false);
          setShowAdminSettings(true);
        }}
        onNavigateToDashboard={() => {
          setShowDashboard(true);
          setShowCustomerList(false);
          setShowCronjobs(false);
          setShowAdminSettings(false);
        }}
        inclusionCount={includedKeywords.length}
        exclusionCount={existingCustomers.length}
        cacheCount={candidateCache.length}
        protocolMode={protocolMode}
        setProtocolMode={setProtocolMode}
        onReset={handleReset}
        showCustomerList={showCustomerList}
        onToggleCustomerList={() => {
          setShowDashboard(false);
          setShowCronjobs(false);
          setShowAdminSettings(false);
          setShowCustomerList(!showCustomerList);
        }}
      />
      
      {/* DASHBOARD VIEW */}
      {showDashboard ? (
        <DashboardRouter 
          leads={leads}
          onNavigateToLeads={() => setShowDashboard(false)}
          onNavigateToCustomers={() => {
            setShowDashboard(false);
            setShowCustomerList(true);
          }}
          onNavigateToCronjobs={() => {
            setShowDashboard(false);
            setShowCronjobs(true);
          }}
        />
      ) : showCronjobs ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <CronJobsPanel 
            userRole={user?.role as any}
            onBack={() => {
              setShowCronjobs(false);
              setShowDashboard(true);
            }}
          />
        </div>
      ) : showAdminSettings ? (
        <AdminSettings 
          onBack={() => {
            setShowAdminSettings(false);
            setShowDashboard(true);
          }}
          isSuperAdmin={user?.isSuperAdmin === true}
        />
      ) : showCustomerList ? (
        selectedCustomerId ? (
          <CustomerDetail 
            customerId={selectedCustomerId}
            onBack={() => setSelectedCustomerId(null)}
          />
        ) : (
          <CustomerList 
            onSelectCustomer={(id) => setSelectedCustomerId(id)}
            onBack={() => {
              setShowCustomerList(false);
              setShowDashboard(true);
            }}
          />
        )
      ) : (
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* LAYOUT GRID: SIDEBAR (3) / MAIN CONTENT (9) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* LEFT SIDEBAR: INPUT & FILTERS */}
          <div className="xl:col-span-3 space-y-6">
            <InputForm 
              onSubmit={handleSearch} 
              isLoading={loading}
              protocolMode={protocolMode}
              setProtocolMode={setProtocolMode}
              onOpenTour={() => setIsTourOpen(true)}
              demoDataTrigger={demoDataTrigger}
              resetTrigger={resetTrigger}
              apiCallCount={apiCallCount}
            />

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 animate-fadeIn">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700 font-bold">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Cache Alert - Show if we filled from cache */}
            {usedCacheCount > 0 && !loading && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 animate-fadeIn shadow-sm">
                <div className="flex">
                   <div className="flex-shrink-0">
                      <Database className="h-5 w-5 text-green-600" />
                   </div>
                   <div className="ml-3">
                      <p className="text-xs text-green-800">
                         <strong>Effektivitet:</strong> {usedCacheCount} leads hämtades direkt från din lokala reservoar (0 API-anrop).
                      </p>
                   </div>
                </div>
              </div>
            )}
          </div>
          
          {/* RIGHT MAIN CONTENT: STATUS, CARD, TABLE */}
          <div className="xl:col-span-9 space-y-6 w-full min-w-0">
             
             {/* 1. Processing Banner */}
             <ProcessingStatusBanner 
                loading={loading}
                deepDiveLoading={deepDiveLoading}
                analyzingCompany={analyzingCompany}
                batchProgress={batchProgress}
                batchDeepDiveProgress={batchDeepDiveProgress}
                analysisResult={backgroundAnalysisResult}
                onOpenResult={() => {
                   if (backgroundAnalysisResult) {
                     setDeepDiveLead(backgroundAnalysisResult);
                     setBackgroundAnalysisResult(null); 
                   }
                }}
                onDismiss={() => setBackgroundAnalysisResult(null)}
             />

             {/* 2. Rate Limit & Quota Overlays */}
             {rateLimitError && (
               <RateLimitOverlay onComplete={() => setRateLimitError(false)} />
             )}

             {quotaError && (
               <QuotaTimer 
                 onComplete={() => setQuotaError(false)} 
                 customWaitSeconds={quotaWaitTime}
               />
             )}
             
             {/* 3. ACTIVE LEAD CARD */}
             {deepDiveLead && (
               <div id="lead-card-container" className="animate-slideDown">
                 <LeadCard 
                    data={deepDiveLead} 
                    prio1Role={formDataState?.focusRole1} 
                    onRunLinkedInSearch={handleRunLinkedInSearch}
                    isSearchingLinkedIn={linkedInSearching}
                    isEnriching={isEnriching}
                    onUpdateLead={handleUpdateLead}
                    onRefreshAnalysis={handleRefreshAnalysis}
                    onReportError={handleReportError}
                    onConvertToCustomer={handleConvertToCustomer}
                    onClose={() => setDeepDiveLead(null)}
                 />
               </div>
             )}

             {/* 4. RESULTS TABLE (Always Visible below card if searched) */}
             {(leads.length > 0 || hasSearched) && (
               <div className="animate-fadeIn w-full">
                 <ResultsTable 
                   data={leads} 
                   onDeepDive={handleDeepDive} 
                   initialFilterScope={formDataState?.financialScope}
                   allExclusions={[...existingCustomers, ...downloadedLeads]}
                   existingCustomers={existingCustomers}
                   downloadedLeads={downloadedLeads}
                   onDownloadSingle={(lead) => handleDownloadSingle(lead, true)} // Default to update state for single click
                   onDownloadSelected={handleBatchDownloadAction} 
                   onExcludeSelected={handleExcludeSelected}
                   onDeepDiveSelected={handleDeepDiveSelected}
                   onReportError={handleReportError}
                   initialSearchGeo={formDataState?.geoArea}
                 />
               </div>
             )}

             {/* Empty State */}
             {!hasSearched && !loading && leads.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-sm">
                  <Search className="w-12 h-12 mb-2 opacity-20" />
                  <p className="text-sm font-medium">Redo för sökning. Konfigurera till vänster.</p>
                </div>
             )}
          </div>
        </div>

      {/* MODALS */}
      <ExclusionManager 
        isOpen={isExclusionModalOpen} 
        onClose={() => setIsExclusionModalOpen(false)}
        existingCustomers={existingCustomers}
        setExistingCustomers={setExistingCustomers}
        downloadedLeads={downloadedLeads}
        setDownloadedLeads={setDownloadedLeads}
      />
      
      <InclusionManager 
        isOpen={isInclusionModalOpen}
        onClose={() => setIsInclusionModalOpen(false)}
        includedKeywords={includedKeywords}
        setIncludedKeywords={setIncludedKeywords}
      />

      <CacheManager
        isOpen={isCacheModalOpen}
        onClose={() => setIsCacheModalOpen(false)}
        cacheData={candidateCache}
        setCacheData={setCandidateCache}
        activeLeads={leads}
        existingCustomers={existingCustomers}
        downloadedLeads={downloadedLeads}
        onMoveToActive={(movedLeads) => {
           setLeads(prev => [...movedLeads, ...prev]);
        }}
        onDownloadAndExclude={(lead) => {
           handleDownloadSingle(lead, true);
        }}
        onDownloadAll={() => {
           // Download entire cache as CSV
           if (candidateCache.length === 0) return;
           // Reuse single download logic loop
           candidateCache.forEach(c => handleDownloadSingle(c, true));
        }}
      />
      
      <ManualAddModal 
        isOpen={isManualAddOpen}
        onClose={() => setIsManualAddOpen(false)}
        onAdd={(newLead) => {
           setLeads(prev => [newLead, ...prev]);
        }}
      />

      <BackupManager
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        backups={internalBackups}
        onCreateBackup={handleCreateInternalBackup}
        onRestoreBackup={handleRestoreInternalBackup}
        onDeleteBackup={handleDeleteInternalBackup}
        onImportBackup={handleImportBackupFile}
        onDownloadCurrent={handleDownloadCurrent}
      />

      <DailyBriefing 
        isOpen={isBriefingOpen}
        onClose={() => setIsBriefingOpen(false)}
        cacheCount={candidateCache.length}
      />

      <RemovalAnalysisModal 
         isOpen={isRemovalModalOpen}
         onClose={() => {
            setIsRemovalModalOpen(false);
            setPendingRemovalLeads([]);
         }}
         onConfirm={handleConfirmRemoval}
         count={pendingRemovalLeads.length}
      />
      </main>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthWrapper>
      <AppContent />
    </AuthWrapper>
  );
};

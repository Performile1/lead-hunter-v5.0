import React from 'react';
import { Loader2, Activity, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { LeadData } from '../types';

interface ProcessingStatusBannerProps {
  loading: boolean;
  deepDiveLoading: boolean;
  batchProgress: { current: number; total: number } | null;
  batchDeepDiveProgress: { current: number; total: number; currentName: string } | null;
  analyzingCompany?: string | null;
  analysisResult?: LeadData | null; // New: The finished result waiting to be opened
  onOpenResult?: () => void; // New: Action to open the result
  onDismiss?: () => void; // New: Action to dismiss result
}

export const ProcessingStatusBanner: React.FC<ProcessingStatusBannerProps> = ({
  loading,
  deepDiveLoading,
  batchProgress,
  batchDeepDiveProgress,
  analyzingCompany,
  analysisResult,
  onOpenResult,
  onDismiss
}) => {
  // If we have a result ready, show the SUCCESS banner
  if (analysisResult) {
    return (
      <div className="bg-green-900 text-white shadow-lg border-b-4 border-green-500 sticky top-0 z-[60] animate-slideDown cursor-pointer" onClick={onOpenResult}>
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-green-500 p-2 rounded-full">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold uppercase tracking-wider truncate flex items-center gap-2">
                Analys Klar: {analysisResult.companyName}
              </h3>
              <p className="text-xs text-green-200 truncate hidden sm:block font-mono">
                Data hämtad och verifierad. Klicka för att visa.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenResult) onOpenResult();
              }}
              className="flex items-center gap-2 bg-white text-green-900 px-4 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider hover:bg-green-50 transition-colors shadow-sm whitespace-nowrap"
            >
              Öppna Analysen
              <ArrowRight className="w-4 h-4" />
            </button>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (onDismiss) onDismiss();
              }}
              className="p-1.5 hover:bg-green-800 rounded-sm text-green-200 hover:text-white transition-colors"
              title="Stäng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Standard PROCESSING banner
  if (!loading && !deepDiveLoading && !batchProgress && !batchDeepDiveProgress && !analyzingCompany) return null;

  let message = "";
  let subMessage = "";
  let progressPercent = 0;
  let isBatch = false;

  if (batchDeepDiveProgress) {
    message = `Djupanalys pågår: ${batchDeepDiveProgress.currentName}`;
    subMessage = `Bearbetar företag ${batchDeepDiveProgress.current} av ${batchDeepDiveProgress.total}`;
    progressPercent = (batchDeepDiveProgress.current / batchDeepDiveProgress.total) * 100;
    isBatch = true;
  } else if (batchProgress) {
    message = "Batch-sökning pågår...";
    subMessage = `Hittat ${batchProgress.current} av ${batchProgress.total} företag`;
    progressPercent = (batchProgress.current / batchProgress.total) * 100;
    isBatch = true;
  } else if (analyzingCompany) {
    message = `Analyserar: ${analyzingCompany}`;
    subMessage = "Verifierar logistikprofil, tech-stack och beslutsfattare...";
    progressPercent = 100;
  } else if (deepDiveLoading) {
    message = "Utför Djupanalys...";
    subMessage = "Hämtar data...";
    progressPercent = 100; 
  } else if (loading) {
    message = "Söker...";
    subMessage = "Hämtar data från källor.";
  }

  return (
    <div className="bg-slate-900 text-white shadow-lg border-b-4 sticky top-0 z-40 animate-slideDown">
      <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
        
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-black p-2 rounded-full animate-pulse">
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold uppercase tracking-wider truncate flex items-center gap-2">
              {message}
            </h3>
            <p className="text-xs text-slate-400 truncate hidden sm:block font-mono">
              {subMessage}
            </p>
          </div>
        </div>

        {isBatch && (
          <div className="flex items-center gap-3 flex-shrink-0">
             <div className="text-right hidden sm:block">
                <span className="text-xs font-bold text-[#4F46E5]">
                    {Math.round(progressPercent)}%
                </span>
             </div>
             <div className="w-32 sm:w-48 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-black transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                ></div>
             </div>
          </div>
        )}
        
        {!isBatch && (
           <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase flex-shrink-0">
              <Activity className="w-4 h-4 text-black" />
              Bearbetar Data
           </div>
        )}
      </div>
    </div>
  );
};
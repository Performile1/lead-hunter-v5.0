
import React from 'react';
import { X, Trash2, Copy, UserCheck, Ban, History, AlertTriangle } from 'lucide-react';

export type RemovalReason = 'DUPLICATE' | 'EXISTING_CUSTOMER' | 'NOT_RELEVANT' | 'ALREADY_DOWNLOADED' | 'INCORRECT_DATA';

interface RemovalAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: RemovalReason) => void;
  count: number;
}

export const RemovalAnalysisModal: React.FC<RemovalAnalysisModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  count
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-lg shadow-2xl border-t-4 border-black relative rounded-sm">
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 p-1 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <h2 className="text-lg font-black italic uppercase flex items-center gap-2 text-black mb-2">
            <Trash2 className="w-5 h-5 text-black" />
            Ta bort {count} företag
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Varför vill du ta bort dessa företag från listan? Ditt val avgör hur systemet hanterar datan framöver.
          </p>

          <div className="grid grid-cols-1 gap-3">
            
            <button
              onClick={() => onConfirm('DUPLICATE')}
              className="flex items-center gap-4 p-4 border border-slate-200 hover:border-black hover:bg-yellow-50 transition-all text-left group"
            >
              <div className="bg-yellow-100 p-2 rounded-full group-hover:bg-black transition-colors">
                <Copy className="w-5 h-5 text-yellow-700 group-hover:text-black" />
              </div>
              <div>
                <span className="block text-sm font-bold text-slate-800 uppercase">Det är en dublett</span>
                <span className="block text-xs text-slate-500">Tar bort denna rad men behåller andra förekomster av företaget. Svartlistar INTE namnet.</span>
              </div>
            </button>

            <button
              onClick={() => onConfirm('EXISTING_CUSTOMER')}
              className="flex items-center gap-4 p-4 border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
            >
              <div className="bg-blue-100 p-2 rounded-full group-hover:bg-blue-500 transition-colors">
                <UserCheck className="w-5 h-5 text-blue-700 group-hover:text-white" />
              </div>
              <div>
                <span className="block text-sm font-bold text-slate-800 uppercase">Befintlig Kund</span>
                <span className="block text-xs text-slate-500">Tar bort och lägger till namnet i "Befintliga Kunder". Kommer ej upp i framtida sökningar.</span>
              </div>
            </button>

            <button
              onClick={() => onConfirm('INCORRECT_DATA')}
              className="flex items-center gap-4 p-4 border border-slate-200 hover:border-orange-500 hover:bg-orange-50 transition-all text-left group"
            >
              <div className="bg-orange-100 p-2 rounded-full group-hover:bg-orange-500 transition-colors">
                <AlertTriangle className="w-5 h-5 text-orange-700 group-hover:text-white" />
              </div>
              <div>
                <span className="block text-sm font-bold text-slate-800 uppercase">Felaktig Data / Hallucination</span>
                <span className="block text-xs text-slate-500">AI:n har hittat fel företag eller org.nr. Blockerar detta namn/nummer permanent (Negativ Prompt).</span>
              </div>
            </button>

            <button
              onClick={() => onConfirm('NOT_RELEVANT')}
              className="flex items-center gap-4 p-4 border border-slate-200 hover:border-black hover:bg-red-50 transition-all text-left group"
            >
              <div className="bg-red-100 p-2 rounded-full group-hover:bg-black transition-colors">
                <Ban className="w-5 h-5 text-black group-hover:text-white" />
              </div>
              <div>
                <span className="block text-sm font-bold text-slate-800 uppercase">Ej Relevant / Konkurs</span>
                <span className="block text-xs text-slate-500">Tar bort och blockerar företaget från framtida sökningar.</span>
              </div>
            </button>
            
            <button
              onClick={() => onConfirm('ALREADY_DOWNLOADED')}
              className="flex items-center gap-4 p-4 border border-slate-200 hover:border-green-500 hover:bg-green-50 transition-all text-left group"
            >
              <div className="bg-green-100 p-2 rounded-full group-hover:bg-green-500 transition-colors">
                <History className="w-5 h-5 text-green-700 group-hover:text-white" />
              </div>
              <div>
                <span className="block text-sm font-bold text-slate-800 uppercase">Redan Bearbetad (Manuell)</span>
                <span className="block text-xs text-slate-500">Lägger till i "Nedladdad Historik" utan att ladda ner fil.</span>
              </div>
            </button>

          </div>
        </div>
        
        <div className="bg-slate-50 p-3 border-t border-slate-200 text-center">
          <button 
            onClick={onClose}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase"
          >
            Avbryt
          </button>
        </div>
      </div>
    </div>
  );
};

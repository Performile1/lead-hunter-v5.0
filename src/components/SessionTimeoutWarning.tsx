import React, { useState, useEffect } from 'react';
import { Clock, LogOut, RefreshCw } from 'lucide-react';

interface SessionTimeoutWarningProps {
  remainingSeconds: number;
  onExtendSession: () => void;
  onLogout: () => void;
}

export const SessionTimeoutWarning: React.FC<SessionTimeoutWarningProps> = ({
  remainingSeconds,
  onExtendSession,
  onLogout
}) => {
  const [seconds, setSeconds] = useState(remainingSeconds);

  useEffect(() => {
    setSeconds(remainingSeconds);
    
    const interval = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingSeconds]);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-yellow-100 rounded-full">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Session utgår snart</h3>
            <p className="text-sm text-gray-600">På grund av inaktivitet</p>
          </div>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-gray-700 mb-2">
            Du kommer att loggas ut om:
          </p>
          <div className="text-4xl font-bold text-yellow-600 text-center">
            {minutes}:{secs.toString().padStart(2, '0')}
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Vill du fortsätta vara inloggad? Klicka på "Fortsätt" för att förlänga din session.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onLogout}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-sm font-bold uppercase transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logga ut
          </button>
          <button
            onClick={onExtendSession}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-black hover:bg-[#FFC400] hover:text-black text-white rounded-sm font-bold uppercase transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Fortsätt
          </button>
        </div>
      </div>
    </div>
  );
};

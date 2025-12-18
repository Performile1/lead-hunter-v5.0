import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface FinancialGaugeProps {
  label: string;
  value: number | null;
  unit?: string;
  type: 'kassalikviditet' | 'vinstmarginal' | 'soliditet';
}

export const FinancialGauge: React.FC<FinancialGaugeProps> = ({ label, value, unit = '%', type }) => {
  if (value === null || value === undefined) {
    return (
      <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
        <p className="text-sm text-gray-600 mb-2 font-semibold">{label}</p>
        <p className="text-gray-400">N/A</p>
      </div>
    );
  }

  // Bestäm färg och position baserat på värde och typ
  const getGaugeData = () => {
    switch (type) {
      case 'kassalikviditet':
        // Kassalikviditet: <100% = Röd, 100-150% = Gul, >150% = Grön
        if (value < 100) return { color: 'bg-red-500', textColor: 'text-red-700', position: (value / 200) * 100, status: 'Låg' };
        if (value < 150) return { color: 'bg-yellow-500', textColor: 'text-yellow-700', position: (value / 200) * 100, status: 'OK' };
        return { color: 'bg-green-500', textColor: 'text-green-700', position: Math.min((value / 200) * 100, 100), status: 'Bra' };
      
      case 'vinstmarginal':
        // Vinstmarginal: <0% = Röd, 0-5% = Gul, >5% = Grön
        if (value < 0) return { color: 'bg-red-500', textColor: 'text-red-700', position: 0, status: 'Förlust' };
        if (value < 5) return { color: 'bg-yellow-500', textColor: 'text-yellow-700', position: (value / 20) * 100, status: 'Låg' };
        return { color: 'bg-green-500', textColor: 'text-green-700', position: Math.min((value / 20) * 100, 100), status: 'Bra' };
      
      case 'soliditet':
        // Soliditet: <20% = Röd, 20-40% = Gul, >40% = Grön
        if (value < 20) return { color: 'bg-red-500', textColor: 'text-red-700', position: (value / 100) * 100, status: 'Låg' };
        if (value < 40) return { color: 'bg-yellow-500', textColor: 'text-yellow-700', position: (value / 100) * 100, status: 'OK' };
        return { color: 'bg-green-500', textColor: 'text-green-700', position: Math.min((value / 100) * 100, 100), status: 'Bra' };
      
      default:
        return { color: 'bg-gray-500', textColor: 'text-gray-700', position: 50, status: 'N/A' };
    }
  };

  const { color, textColor, position, status } = getGaugeData();

  const getTrendIcon = () => {
    if (type === 'kassalikviditet' && value >= 150) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (type === 'vinstmarginal' && value >= 5) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (type === 'soliditet' && value >= 40) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-yellow-600" />;
  };

  return (
    <div className="bg-white border border-gray-200 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-700 font-semibold">{label}</p>
        {getTrendIcon()}
      </div>
      
      <div className="flex items-baseline gap-2 mb-3">
        <p className={`text-3xl font-bold ${textColor}`}>
          {value.toFixed(1)}{unit}
        </p>
        <span className={`text-xs font-semibold ${textColor} uppercase`}>
          {status}
        </span>
      </div>

      {/* Gauge Bar */}
      <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-30"></div>
        
        {/* Indicator */}
        <div 
          className={`absolute top-0 left-0 h-full ${color} transition-all duration-500 rounded-full`}
          style={{ width: `${position}%` }}
        ></div>
      </div>

      {/* Scale markers */}
      <div className="flex justify-between mt-1 text-xs text-gray-500">
        <span>Låg</span>
        <span>Medel</span>
        <span>Hög</span>
      </div>
    </div>
  );
};

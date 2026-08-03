import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ label = 'Loading resource data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-3 text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
      <p className="text-xs font-medium">{label}</p>
    </div>
  );
};

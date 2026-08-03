import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Failed to load inventory data',
  message,
  onRetry,
}) => {
  return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-red-400 flex items-start space-x-4">
      <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="font-semibold text-sm mb-1">{title}</h4>
        <p className="text-xs text-red-300/80 leading-relaxed mb-4">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Operation</span>
          </button>
        )}
      </div>
    </div>
  );
};

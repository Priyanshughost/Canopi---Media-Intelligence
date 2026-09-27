import React from 'react';
import { ExternalLink } from 'lucide-react';

export const DerivativesTab = ({ derivatives = [] }) => {
  return (
    <div className="space-y-3 flex-1 overflow-y-auto max-h-[360px] pr-1">
      <p className="text-xs text-gray-500">
        Traceability chain of all derived assets transformed from this master file:
      </p>
      {derivatives.length > 0 ? (
        derivatives.map((deriv, idx) => (
          <div
            key={idx}
            className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5 text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-800 uppercase tracking-wider text-[10px] px-2 py-0.5 bg-gray-200 rounded">
                {deriv.purpose}
              </span>
              <a
                href={deriv.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 text-[11px]"
              >
                <span>Open Derived Asset</span>
                <ExternalLink size={10} />
              </a>
            </div>
            <p className="font-mono text-[10px] text-gray-600 bg-white p-1 rounded border border-gray-100 truncate">
              {deriv.transformation}
            </p>
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>Linked to: {deriv.linkedToOriginal}</span>
              <span>{new Date(deriv.createdAt).toLocaleTimeString()}</span>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-gray-400 text-xs">
          No derived transformations registered yet.
        </div>
      )}
    </div>
  );
};

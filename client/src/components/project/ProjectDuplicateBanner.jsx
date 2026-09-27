import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export const ProjectDuplicateBanner = ({ duplicateAlert, onClose }) => {
  if (!duplicateAlert) return null;

  return (
    <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-start justify-between gap-3 shadow-sm animate-in fade-in duration-300">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="text-sm font-bold text-amber-900">
            ⚠️ Near-Duplicate Media Detected ({duplicateAlert.count} match found)
          </h4>
          <p className="text-xs text-amber-800 mt-0.5">
            The photo <code className="font-mono bg-amber-100 px-1 rounded">{duplicateAlert.filename}</code> has a perceptual visual fingerprint (pHash) matching existing photos in this project.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {duplicateAlert.duplicates.map((dup, i) => (
              <span
                key={i}
                className="text-[11px] bg-white border border-amber-200 text-amber-900 px-2 py-0.5 rounded-md font-medium"
              >
                Match: {dup.originalFilename || 'Existing Photo'} ({dup.similarityPercentage}% similarity)
              </span>
            ))}
          </div>
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};

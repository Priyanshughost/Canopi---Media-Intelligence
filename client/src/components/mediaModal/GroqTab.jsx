import React from 'react';

export const GroqTab = ({ asset }) => {
  return (
    <div className="space-y-4 flex-1">
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
          Visual Description
        </h4>
        <p className="text-sm text-gray-800 leading-relaxed bg-gray-50 p-3.5 rounded-xl border border-gray-100">
          {asset.aiAnalysis?.description || 'AI analysis is currently processing...'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Observed Activities
          </h4>
          <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 min-h-[60px] flex flex-wrap gap-1">
            {asset.aiAnalysis?.activities?.length > 0 ? (
              asset.aiAnalysis.activities.map((act, i) => (
                <span
                  key={i}
                  className="text-[11px] bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded-md"
                >
                  {act}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400 italic">None detected</span>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Detected Objects
          </h4>
          <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 min-h-[60px] flex flex-wrap gap-1">
            {asset.aiAnalysis?.objects?.length > 0 ? (
              asset.aiAnalysis.objects.map((obj, i) => (
                <span
                  key={i}
                  className="text-[11px] bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded-md"
                >
                  {obj}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400 italic">None detected</span>
            )}
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
          Impact Tags
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {(asset.aiAnalysis?.tags || []).map((tag, i) => (
            <span
              key={i}
              className="text-xs bg-slate-100 text-slate-800 font-medium px-2.5 py-1 rounded-lg"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

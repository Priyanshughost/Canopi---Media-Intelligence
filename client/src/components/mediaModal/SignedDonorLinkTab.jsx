import React from 'react';
import { Lock, Loader2, Sparkles, Check, Copy } from 'lucide-react';

export const SignedDonorLinkTab = ({
  signedDuration,
  setSignedDuration,
  generatingSigned,
  signedData,
  copiedLink,
  onGenerateSignedUrl,
  onCopySignedUrl,
}) => {
  return (
    <div className="space-y-4 flex-1 flex flex-col justify-between">
      <div className="space-y-3">
        <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-2xl">
          <h4 className="text-xs font-bold text-emerald-900 flex items-center space-x-1.5">
            <Lock size={14} className="text-emerald-600" />
            <span>Authenticated & Signed Donor Delivery</span>
          </h4>
          <p className="text-[11px] text-emerald-800/80 mt-1 leading-relaxed">
            Generate a cryptographic time-limited URL for external donors and audit portals without exposing unrestricted CDN endpoints.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-700">Link Validity Duration</label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: '1 Hour', seconds: 3600 },
              { label: '24 Hours', seconds: 86400 },
              { label: '7 Days', seconds: 604800 },
              { label: '30 Days', seconds: 2592000 },
            ].map((dur) => (
              <button
                key={dur.seconds}
                type="button"
                onClick={() => setSignedDuration(dur.seconds)}
                className={`py-2 text-xs font-medium rounded-xl border transition-all ${
                  signedDuration === dur.seconds
                    ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {dur.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onGenerateSignedUrl}
          disabled={generatingSigned}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/10 transition-all disabled:opacity-50"
        >
          {generatingSigned ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Sparkles size={14} />
          )}
          <span>
            {generatingSigned
              ? 'Generating Cryptographic Link...'
              : 'Generate Signed Donor Link'}
          </span>
        </button>

        {signedData && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-700">Signed URL:</span>
              <span className="text-[10px] text-gray-500">
                Expires: {new Date(signedData.expiresAt).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={signedData.signedUrl}
                className="flex-1 text-[10px] font-mono bg-white border border-gray-200 p-2 rounded-lg text-gray-600 truncate select-all"
              />
              <button
                onClick={onCopySignedUrl}
                className="px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs rounded-lg flex items-center space-x-1 font-medium"
              >
                {copiedLink ? (
                  <Check size={12} className="text-emerald-400" />
                ) : (
                  <Copy size={12} />
                )}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

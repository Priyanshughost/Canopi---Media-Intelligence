import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Layers,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';

export const ProjectClaimsTab = ({
  claimsData,
  loading,
  checking,
  onRecheckClaims,
  onSelectAsset,
  projectDescription,
}) => {
  const claims = claimsData?.claims || [];
  const summary = claimsData?.summary || {
    total: 0,
    supported: 0,
    partiallySupported: 0,
    unsupported: 0,
    insufficientEvidence: 0,
  };

  const getVerdictBadge = (verdict) => {
    switch (verdict) {
      case 'SUPPORTED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 size={14} className="stroke-[2.5]" />
            <span>SUPPORTED</span>
          </span>
        );
      case 'PARTIALLY_SUPPORTED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle size={14} className="stroke-[2.5]" />
            <span>PARTIALLY SUPPORTED</span>
          </span>
        );
      case 'UNSUPPORTED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
            <XCircle size={14} className="stroke-[2.5]" />
            <span>UNSUPPORTED / MISMATCH</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <HelpCircle size={14} />
            <span>INSUFFICIENT EVIDENCE</span>
          </span>
        );
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'quantity':
        return (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
            Metric / Quantity
          </span>
        );
      case 'outcome':
        return (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
            Outcome
          </span>
        );
      default:
        return (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
            Activity
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Action */}
      <div className="bw-card-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <ShieldCheck size={20} className="text-emerald-600" />
            <h3 className="text-lg font-bold text-slate-800">Claim Consistency Check</h3>
          </div>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            Cross-verifies project goals and stated descriptions against actual visual evidence to detect
            unsubstantiated claims and greenwashing. Adheres strictly to the{' '}
            <strong className="text-slate-800 font-semibold">"Observation != Proof"</strong> rule.
          </p>
        </div>

        <button
          onClick={onRecheckClaims}
          disabled={checking || loading}
          className="bw-btn-black px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 flex-shrink-0 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
          <span>{checking ? 'Analyzing Claims...' : 'Re-check Claims'}</span>
        </button>
      </div>

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bw-card-white p-4 rounded-2xl border border-gray-100 text-center">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Total Claims
          </span>
          <span className="text-2xl font-black text-slate-800">{summary.total || 0}</span>
        </div>
        <div className="bw-card-white p-4 rounded-2xl border border-emerald-100 bg-emerald-50/30 text-center">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block mb-1">
            Supported
          </span>
          <span className="text-2xl font-black text-emerald-700">{summary.supported || 0}</span>
        </div>
        <div className="bw-card-white p-4 rounded-2xl border border-amber-100 bg-amber-50/30 text-center">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block mb-1">
            Partial
          </span>
          <span className="text-2xl font-black text-amber-700">
            {summary.partiallySupported || 0}
          </span>
        </div>
        <div className="bw-card-white p-4 rounded-2xl border border-red-100 bg-red-50/30 text-center">
          <span className="text-[11px] font-semibold text-red-700 uppercase tracking-wider block mb-1">
            Mismatch
          </span>
          <span className="text-2xl font-black text-red-700">{summary.unsupported || 0}</span>
        </div>
        <div className="bw-card-white p-4 rounded-2xl border border-slate-200 bg-slate-50/50 text-center col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Insufficient
          </span>
          <span className="text-2xl font-black text-slate-600">
            {summary.insufficientEvidence || 0}
          </span>
        </div>
      </div>

      {/* Claims List */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 text-sm">
          Loading claims consistency analysis...
        </div>
      ) : claims.length === 0 ? (
        <div className="bw-card-white p-12 text-center rounded-3xl border border-gray-100 flex flex-col items-center justify-center">
          <ShieldCheck size={40} className="text-slate-300 mb-3" />
          <h4 className="text-base font-bold text-slate-700 mb-1">No Claims Checked Yet</h4>
          <p className="text-xs text-slate-500 max-w-md mb-6">
            Extract discrete claims from the project description and verify them against uploaded media
            assets using Cloudinary AI Vision.
          </p>
          <button
            onClick={onRecheckClaims}
            disabled={checking}
            className="bw-btn-black px-6 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2"
          >
            <Sparkles size={14} />
            <span>Run Initial Claims Check</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim, idx) => {
            const assets = claim.supportingAssetIds || [];

            return (
              <div
                key={claim._id || idx}
                className="bw-card-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    {getTypeBadge(claim.claimType)}
                    {claim.subject && (
                      <span className="text-xs text-slate-500 font-medium">
                        Subject: <strong className="text-slate-700">{claim.subject}</strong>
                      </span>
                    )}
                  </div>
                  <div>{getVerdictBadge(claim.verdict)}</div>
                </div>

                {/* Stated Claim Statement */}
                <div className="mb-4">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Stated Project Claim
                  </span>
                  <p className="text-sm font-bold text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    "{claim.claimText}"
                  </p>
                </div>

                {/* Verification Reasoning */}
                <div className="mb-4">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Evidence Verification Reasoning
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed bg-emerald-50/20 p-3.5 rounded-xl border border-emerald-100">
                    {claim.reasoning}
                  </p>
                </div>

                {/* Supporting Visual Evidence Assets */}
                {assets.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Matched Visual Evidence ({assets.length})
                    </span>
                    <div className="flex flex-wrap gap-3">
                      {assets.map((asset) => {
                        const thumbUrl =
                          asset.derivatives?.find((d) => d.purpose === 'thumbnail')?.url ||
                          asset.cloudinary?.secureUrl;

                        return (
                          <div
                            key={asset._id}
                            onClick={() => onSelectAsset && onSelectAsset(asset)}
                            className="group relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 cursor-pointer shadow-sm hover:shadow-md transition-all flex-shrink-0"
                            title={asset.originalFilename}
                          >
                            <img
                              src={thumbUrl}
                              alt={asset.originalFilename}
                              className="w-full h-full object-cover transition-transform group-hover:scale-110"
                            />
                            {asset.verified && (
                              <div className="absolute top-1 right-1 bg-emerald-600 text-white p-0.5 rounded-full shadow">
                                <CheckCircle2 size={10} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

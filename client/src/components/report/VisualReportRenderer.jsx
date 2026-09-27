import React from 'react';
import { Sparkles, MapPin, Printer, ExternalLink, ShieldCheck } from 'lucide-react';

export const VisualReportRenderer = ({ report }) => {
  if (!report) return null;

  const handlePrint = () => {
    window.print();
  };

  const blocks = report.reportBlocks && report.reportBlocks.length > 0 ? report.reportBlocks : null;

  return (
    <div className="space-y-6 print:space-y-4 print:p-0">
      {/* Print / Export Action Header */}
      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200/60 print:hidden">
        <span className="text-xs text-slate-600 font-medium flex items-center space-x-1.5">
          <Sparkles size={14} className="text-cyan-500" />
          <span>Visual Editorial Report Layout (Embedded Verified Evidence)</span>
        </span>
        <button
          onClick={handlePrint}
          className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-xl flex items-center space-x-1.5 shadow-sm transition-all"
        >
          <Printer size={13} />
          <span>Print / Export PDF</span>
        </button>
      </div>

      {/* Visual Report Container */}
      <div className="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 shadow-sm space-y-8 print:shadow-none print:border-none print:p-0">
        
        {/* Report Header */}
        <div className="border-b border-gray-100 pb-6 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-cyan-600 uppercase tracking-wider">
            <ShieldCheck size={16} />
            <span>Verified Impact Assessment</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">
            {report.title}
          </h1>
          <p className="text-xs text-gray-500">
            Project: <strong className="text-gray-800">{report.projectId?.name || 'Canopi Project'}</strong> • Published: {new Date(report.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Structured Report Blocks */}
        {blocks ? (
          blocks.map((block, idx) => {
            if (block.type === 'heading') {
              if (block.headingLevel === 1) return null; // Already rendered as main title
              if (block.headingLevel === 2) {
                return (
                  <h2 key={idx} className="text-xl font-bold text-gray-900 pt-4 border-t border-gray-50">
                    {block.content}
                  </h2>
                );
              }
              return (
                <h3 key={idx} className="text-base font-bold text-gray-800 pt-2">
                  {block.content}
                </h3>
              );
            }

            if (block.type === 'callout') {
              return (
                <div key={idx} className="p-6 bg-cyan-50/60 border-l-4 border-cyan-500 rounded-2xl space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-800">
                    {block.caption || 'Executive Summary'}
                  </span>
                  <p className="text-sm text-slate-800 leading-relaxed font-serif italic text-base">
                    "{block.content}"
                  </p>
                </div>
              );
            }

            if (block.type === 'image') {
              return (
                <div key={idx} className="space-y-2 my-6">
                  <div className="rounded-2xl overflow-hidden bg-gray-900 border border-gray-200 shadow-md relative group">
                    <img
                      src={block.url}
                      alt={block.caption || 'Evidence Visual'}
                      className="w-full max-h-[420px] object-cover"
                    />
                    <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-white font-medium flex items-center space-x-1">
                      <Sparkles size={11} className="text-cyan-400" />
                      <span>{block.purpose === 'report_crop' ? '16:9 Report Crop' : block.purpose === 'enhanced' ? 'AI Enhanced' : 'Verified Evidence'}</span>
                    </div>
                  </div>
                  {block.caption && (
                    <p className="text-xs text-gray-500 italic text-center px-4">
                      {block.caption}
                    </p>
                  )}
                </div>
              );
            }

            if (block.type === 'text') {
              return (
                <p key={idx} className="text-sm text-gray-700 leading-relaxed">
                  {block.content}
                </p>
              );
            }

            return null;
          })
        ) : (
          /* Fallback if older report without blocks */
          <div className="space-y-6">
            <div className="p-5 bg-gray-50 rounded-2xl">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Executive Summary
              </h3>
              <p className="text-sm text-gray-800 leading-relaxed font-serif">
                {report.executiveSummary}
              </p>
            </div>
            {report.keyFindings?.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-base font-bold text-gray-900">Key Findings</h3>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
                  {report.keyFindings.map((kf, i) => (
                    <li key={i}>{kf}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

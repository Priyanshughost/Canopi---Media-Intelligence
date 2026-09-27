import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Download, Sparkles, Share2 } from 'lucide-react';

export const CampaignPostsView = ({ campaignPosts = [], rawContent = '' }) => {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 3000);
  };

  if (!campaignPosts || campaignPosts.length === 0) {
    if (rawContent) {
      return (
        <div className="p-5 bg-gradient-to-br from-slate-50 to-indigo-50/40 rounded-2xl border border-indigo-100/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900 flex items-center space-x-1.5">
              <Sparkles size={14} className="text-indigo-600" />
              <span>Generated Campaign Post</span>
            </span>
            <button
              onClick={() => handleCopy(rawContent, 0)}
              className="px-3 py-1 bg-white border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-lg flex items-center space-x-1 hover:bg-indigo-50"
            >
              {copiedIndex === 0 ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              <span>{copiedIndex === 0 ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">{rawContent}</p>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="space-y-4 pt-4 border-t border-gray-100">
      <div className="flex items-center space-x-2">
        <Sparkles size={16} className="text-indigo-600" />
        <h3 className="text-sm font-bold text-gray-900">
          Campaign-Ready Social Content ({campaignPosts.length} formats)
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campaignPosts.map((post, idx) => (
          <div
            key={idx}
            className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              {/* Platform Header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 uppercase tracking-wider">
                  {post.platform || 'Social Post'}
                </span>
                <button
                  onClick={() => handleCopy(post.caption, idx)}
                  className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg flex items-center space-x-1 transition-all"
                >
                  {copiedIndex === idx ? (
                    <Check size={12} className="text-emerald-500" />
                  ) : (
                    <Copy size={12} />
                  )}
                  <span>{copiedIndex === idx ? 'Copied' : 'Copy Caption'}</span>
                </button>
              </div>

              {/* Linked Visual Preview */}
              {post.suggestedImageUrl && (
                <div className="relative rounded-xl overflow-hidden aspect-video bg-gray-900 border border-gray-100">
                  <img
                    src={post.suggestedImageUrl}
                    alt="Campaign Visual"
                    className="w-full h-full object-cover"
                  />
                  <a
                    href={post.suggestedImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-2 right-2 px-2 py-1 bg-black/75 backdrop-blur-md text-white rounded-md text-[10px] flex items-center space-x-1 hover:bg-black transition-colors"
                  >
                    <span>Download Visual</span>
                    <Download size={10} />
                  </a>
                </div>
              )}

              {/* Caption Text */}
              <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">
                {post.caption}
              </p>
            </div>

            {/* Hashtags */}
            {post.hashtags?.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2 border-t border-gray-100">
                {post.hashtags.map((h, i) => (
                  <span
                    key={i}
                    className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded"
                  >
                    #{h}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

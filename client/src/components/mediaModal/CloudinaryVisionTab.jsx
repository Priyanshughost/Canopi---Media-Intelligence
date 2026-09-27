import React from 'react';
import { Loader2, Send } from 'lucide-react';

export const CloudinaryVisionTab = ({
  visionAnalysis,
  customQuestion,
  setCustomQuestion,
  askingVision,
  onAskVision,
}) => {
  const questionsList =
    visionAnalysis?.questions || visionAnalysis?.answers || [];

  return (
    <div className="space-y-4 flex-1 flex flex-col">
      <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1">
        {questionsList.length > 0 ? (
          questionsList.map((qa, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-cyan-50/50 border border-cyan-100 rounded-xl space-y-1"
            >
              <p className="text-xs font-bold text-cyan-900 flex items-center space-x-1.5">
                <span className="w-4 h-4 rounded-full bg-cyan-200 text-cyan-800 text-[10px] flex items-center justify-center">
                  Q
                </span>
                <span>{qa.question}</span>
              </p>
              <p className="text-xs text-slate-700 pl-5 leading-relaxed">{qa.answer}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-400 text-xs">
            No Visual Question Answering results yet. Ask a question below!
          </div>
        )}
      </div>

      {/* Interactive VQA input form */}
      <form onSubmit={onAskVision} className="pt-2 border-t border-gray-100 flex gap-2">
        <input
          type="text"
          value={customQuestion}
          onChange={(e) => setCustomQuestion(e.target.value)}
          placeholder="Ask Cloudinary Vision (e.g. 'How many trees are visible?')"
          className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
          disabled={askingVision}
        />
        <button
          type="submit"
          disabled={askingVision || !customQuestion.trim()}
          className="bw-btn-black px-4 py-2 text-xs font-medium rounded-xl flex items-center space-x-1 disabled:opacity-50"
        >
          {askingVision ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Send size={14} />
          )}
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
};

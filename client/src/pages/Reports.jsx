import { API_URL } from '../config.js';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { FileText, Share2, Download, Sparkles } from 'lucide-react';

export const Reports = () => {
  const [reports, setReports] = useState([]);
  const [projects, setProjects] = useState([]);
  const [evidenceList, setEvidenceList] = useState([]);
  
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [campaignData, setCampaignData] = useState({});
  const [generatingCampaignId, setGeneratingCampaignId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [repsRes, projsRes, evRes] = await Promise.all([
          fetch(`${API_URL}/api/reports`),
          fetch(`${API_URL}/api/projects`),
          fetch(`${API_URL}/api/evidence`)
        ]);
        
        if (!repsRes.ok) throw new Error('Failed to load reports');
        
        setReports(await repsRes.json());
        setProjects(await projsRes.json());
        setEvidenceList(await evRes.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleGenerate = async () => {
    if (!selectedProjectId) {
      alert("Please select a project first.");
      return;
    }
    
    // Find all verified evidence for this project
    const projEvidence = evidenceList.filter(e => e.projectId === selectedProjectId && e.verified);
    if (projEvidence.length === 0) {
      alert("No verified evidence found for this project. Please verify some evidence first.");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`${API_URL}/api/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          evidenceIds: projEvidence.map(e => e._id)
        })
      });
      
      if (!response.ok) throw new Error('Generation failed');
      const newReport = await response.json();
      
      setReports(prev => [newReport, ...prev]);
      alert("Report successfully generated!");
    } catch (err) {
      alert(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateCampaign = async (report) => {
    if (!report.evidenceUsed || report.evidenceUsed.length === 0) {
      alert("No evidence linked to this report to generate campaign.");
      return;
    }
    
    setGeneratingCampaignId(report._id);
    try {
      const response = await fetch(`${API_URL}/api/reports/campaign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: report._id,
          projectId: typeof report.projectId === 'object' ? report.projectId._id : report.projectId,
          evidenceId: report.evidenceUsed[0] // Just use the first one for MVP
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate campaign');
      const data = await response.json();
      
      setCampaignData(prev => ({
        ...prev,
        [report._id]: data.content
      }));
    } catch (err) {
      alert(err.message);
    } finally {
      setGeneratingCampaignId(null);
    }
  };

  const handleShare = (report) => {
    const text = `Check out this Impact Report: ${report.title}\n\n${report.executiveSummary}`;
    if (navigator.share) {
      navigator.share({
        title: report.title,
        text: text
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text);
      alert('Report summary copied to clipboard!');
    }
  };

  const handleDownload = (report) => {
    let content = `# ${report.title}\n\n`;
    content += `**Project:** ${report.projectId?.name || 'Unknown'}\n`;
    content += `**Generated on:** ${new Date(report.createdAt).toLocaleDateString()}\n\n`;
    content += `## Executive Summary\n${report.executiveSummary}\n\n`;
    content += `## Key Findings\n`;
    report.keyFindings?.forEach(finding => {
      content += `- ${finding}\n`;
    });
    content += `\n## AI Limitations\n${report.limitations}\n`;
    
    if (campaignData[report._id] || report.campaignContent) {
       content += `\n\n## Campaign Post\n\n${campaignData[report._id] || report.campaignContent}\n`;
    }

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/\\s+/g, '_').toLowerCase()}_report.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-700 mb-2">Impact Reports & Stories</h1>
          <p className="text-gray-600">Synthesize verified evidence into comprehensive reports.</p>
        </div>
        
        <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
          <select 
            value={selectedProjectId} 
            onChange={e => setSelectedProjectId(e.target.value)}
            className="p-2 border-none outline-none text-gray-700 bg-transparent font-medium"
          >
            <option value="">-- Select Project --</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          
          <button 
            onClick={handleGenerate}
            disabled={isGenerating || !selectedProjectId}
            className="bw-btn-black px-5 py-2.5 rounded-xl text-gray-100 font-semibold flex items-center space-x-2 disabled:opacity-50"
          >
            <Sparkles size={18} className={isGenerating ? 'animate-pulse text-cyan-400' : 'text-cyan-400'} />
            <span>{isGenerating ? 'Synthesizing...' : 'Generate'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {loading ? (
           <div className="text-center py-10 text-gray-500">Loading reports...</div>
        ) : error ? (
           <div className="text-center py-10 text-red-500">{error}</div>
        ) : reports.length === 0 ? (
           <div className="text-center py-20 text-gray-500 bw-card-white">No reports generated yet.</div>
        ) : reports.map(report => (
          <div key={report._id} className="bw-card-white p-8 group">
            <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-6">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 rounded-lg bg-gray-100 text-slate-700 group-hover:bg-black group-hover:text-white transition-colors">
                    <FileText size={20} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-700">{report.title}</h2>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Project: {report.projectId?.name || 'Unknown'} • Generated on {new Date(report.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button onClick={() => handleShare(report)} title="Share Summary" className="p-2 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
                  <Share2 size={18} />
                </button>
                <button onClick={() => handleDownload(report)} title="Download Report as Markdown" className="p-2 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
                  <Download size={18} />
                </button>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Executive Summary</h3>
                <p className="text-gray-700 leading-relaxed">{report.executiveSummary}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Key Findings</h3>
                <ul className="space-y-3">
                  {report.keyFindings?.map((finding, idx) => (
                    <li key={idx} className="flex items-start space-x-3 text-gray-700 bg-gray-50 p-4 rounded-xl">
                      <span className="text-slate-800 font-bold mt-0.5">•</span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-5 mt-6">
                <h3 className="text-xs font-bold text-orange-800 uppercase tracking-wider mb-2">AI Limitations</h3>
                <p className="text-sm text-orange-900 leading-relaxed">{report.limitations}</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-black/5">
              {!(campaignData[report._id] || report.campaignContent) ? (
                <button 
                  onClick={() => handleGenerateCampaign(report)}
                  disabled={generatingCampaignId === report._id}
                  className="bw-btn-white px-5 py-2.5 text-sm font-semibold text-gray-800 flex items-center space-x-2 disabled:opacity-50 border border-gray-200"
                >
                  <Sparkles size={16} className={generatingCampaignId === report._id ? "animate-spin text-cyan-400" : "text-cyan-400"} />
                  <span>{generatingCampaignId === report._id ? 'Drafting...' : 'Generate Campaign Post for Social Media'}</span>
                </button>
              ) : (
                <div className="bg-cyan-50/50 border border-cyan-100 rounded-xl p-5">
                  <h3 className="text-xs font-bold text-cyan-800 uppercase tracking-wider mb-3 flex items-center space-x-2">
                    <Sparkles size={14} /> <span>Campaign Ready</span>
                  </h3>
                  <div className="text-gray-800 text-sm leading-relaxed max-w-none">
                    <ReactMarkdown
                      components={{
                        h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-3 text-slate-800" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-5 mb-2 text-slate-800" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-lg font-bold mt-5 mb-2 text-slate-800" {...props} />,
                        p: ({node, ...props}) => <p className="mb-4" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />,
                        li: ({node, ...props}) => <li className="text-gray-700" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold text-gray-900" {...props} />,
                        hr: ({node, ...props}) => <hr className="my-6 border-cyan-100" {...props} />
                      }}
                    >
                      {campaignData[report._id] || report.campaignContent}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

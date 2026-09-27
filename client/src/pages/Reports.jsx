import { API_URL } from '../config.js';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  FileText,
  Share2,
  Download,
  Sparkles,
  Layers,
  LayoutTemplate,
  FileCode,
  Loader2,
  Film,
} from 'lucide-react';
import { VisualReportRenderer } from '../components/report/VisualReportRenderer';
import { CampaignPostsView } from '../components/report/CampaignPostsView';
import { VisualStoryViewer } from '../components/report/VisualStoryViewer';
import { CarouselPostViewer } from '../components/report/CarouselPostViewer';
import { HighlightReelViewer } from '../components/report/HighlightReelViewer';
import { SocialReelViewer } from '../components/report/SocialReelViewer';
import { useStepSuccess } from '../context/StepSuccessContext';

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
  const [viewModes, setViewModes] = useState({}); // { [reportId]: 'visual' | 'markdown' }
  const { triggerStepSuccess } = useStepSuccess();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [repsRes, projsRes, evRes] = await Promise.all([
          fetch(`${API_URL}/api/reports`),
          fetch(`${API_URL}/api/projects`),
          fetch(`${API_URL}/api/evidence`),
        ]);

        if (!repsRes.ok) throw new Error('Failed to load reports');

        const reps = await repsRes.json();
        setReports(reps);
        setProjects(await projsRes.json());
        setEvidenceList(await evRes.json());

        // Default all reports to 'visual' view mode
        const initialModes = {};
        reps.forEach((r) => {
          initialModes[r._id] = 'visual';
        });
        setViewModes(initialModes);
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
      alert('Please select a project first.');
      return;
    }

    const projEvidence = evidenceList.filter((e) => {
      const pId = typeof e.projectId === 'object' && e.projectId !== null ? e.projectId._id : e.projectId;
      return pId === selectedProjectId && e.verified;
    });

    if (projEvidence.length === 0) {
      const totalForProj = evidenceList.filter((e) => {
        const pId = typeof e.projectId === 'object' && e.projectId !== null ? e.projectId._id : e.projectId;
        return pId === selectedProjectId;
      }).length;

      if (totalForProj > 0) {
        alert(`Found ${totalForProj} evidence item(s) for this project, but none are verified yet. Please go to Evidence & Verification to verify your evidence first.`);
      } else {
        alert('No evidence found for this project yet. Please create a Before / After Comparison first to draft evidence.');
      }
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`${API_URL}/api/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          evidenceIds: projEvidence.map((e) => e._id),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Report generation failed');
      }
      const newReport = await response.json();

      setReports((prev) => [newReport, ...prev]);
      setViewModes((prev) => ({ ...prev, [newReport._id]: 'visual' }));

      // Trigger Step Success confirmation toast
      triggerStepSuccess({
        title: 'Visual Report Generated',
        message: 'Impact report created with verified visuals, derivatives, and structured blocks.',
        nextStepLabel: 'Generate Campaign Cards',
        autoAdvanceSeconds: 5,
        onNext: () => {
          handleGenerateCampaign(newReport);
        },
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateCampaign = async (report) => {
    if (!report.evidenceUsed || report.evidenceUsed.length === 0) {
      alert('No evidence linked to this report to generate campaign.');
      return;
    }

    setGeneratingCampaignId(report._id);
    try {
      const targetEvidenceId =
        typeof report.evidenceUsed[0] === 'object'
          ? report.evidenceUsed[0]._id
          : report.evidenceUsed[0];

      const response = await fetch(`${API_URL}/api/reports/campaign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: report._id,
          projectId:
            typeof report.projectId === 'object'
              ? report.projectId._id
              : report.projectId,
          evidenceId: targetEvidenceId,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate campaign');
      const data = await response.json();

      setCampaignData((prev) => ({
        ...prev,
        [report._id]: data,
      }));

      // Update report in local list
      if (data.report) {
        setReports((prev) =>
          prev.map((r) => (r._id === report._id ? data.report : r))
        );
      }

      // Trigger Step Success confirmation toast
      triggerStepSuccess({
        title: 'Campaign Content Ready',
        message: 'Social campaign cards paired with ready-to-post visuals and copy.',
        nextStepLabel: 'View Social Cards',
        autoAdvanceSeconds: 5,
        onNext: () => {
          const section = document.getElementById(`report-${report._id}`);
          if (section) section.scrollIntoView({ behavior: 'smooth' });
        },
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setGeneratingCampaignId(null);
    }
  };

  const handleShare = (report) => {
    const text = `Check out this Impact Report: ${report.title}\n\n${report.executiveSummary}`;
    if (navigator.share) {
      navigator
        .share({
          title: report.title,
          text: text,
        })
        .catch(console.error);
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
    report.keyFindings?.forEach((finding) => {
      content += `- ${finding}\n`;
    });
    content += `\n## AI Limitations\n${report.limitations}\n`;

    if (report.campaignContent) {
      content += `\n\n## Campaign Post\n\n${report.campaignContent}\n`;
    }

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/\s+/g, '_').toLowerCase()}_report.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleViewMode = (reportId) => {
    setViewModes((prev) => ({
      ...prev,
      [reportId]: prev[reportId] === 'markdown' ? 'visual' : 'markdown',
    }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 mb-2">
            Visual Impact Reports & Stories
          </h1>
          <p className="text-gray-600">
            Synthesize verified evidence into rich visual reports with embedded media derivatives and campaign copy.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-2 rounded-2xl shadow-xs border border-gray-100">
          <div className="flex items-center space-x-2">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="p-2 border border-gray-200 rounded-xl outline-hidden text-gray-700 bg-white font-semibold text-xs shadow-xs"
            >
              <option value="">-- Select Project to Report --</option>
              {projects.map((p) => {
                const count = evidenceList.filter((e) => {
                  const pId = typeof e.projectId === 'object' && e.projectId !== null ? e.projectId._id : e.projectId;
                  return pId === p._id && e.verified;
                }).length;
                return (
                  <option key={p._id} value={p._id}>
                    {p.title || p.name} ({count} verified evidence)
                  </option>
                );
              })}
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedProjectId}
            className="bw-btn-black px-5 py-2.5 rounded-xl text-gray-100 text-xs font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {isGenerating ? (
              <Loader2 size={16} className="animate-spin text-cyan-400" />
            ) : (
              <Sparkles size={16} className="text-cyan-400" />
            )}
            <span>{isGenerating ? 'Synthesizing...' : 'Generate Visual Report'}</span>
          </button>
        </div>
      </div>

      {/* Reports List */}
      <div className="grid grid-cols-1 gap-8">
        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading reports...</div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bw-card-white rounded-3xl border border-gray-100">
            No reports generated yet. Select a project above with verified evidence to generate visual reports.
          </div>
        ) : (
          reports.map((report) => {
            const currentMode = viewModes[report._id] || 'visual';
            const campaignDataForReport = campaignData[report._id];
            const campaignPosts =
              campaignDataForReport?.campaignPosts || report.campaignPosts || [];
            const campaignContent =
              campaignDataForReport?.content || report.campaignContent || '';

            return (
              <div
                key={report._id}
                className="bw-card-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6 group"
              >
                {/* Report Header Bar */}
                <div className="flex flex-wrap justify-between items-start gap-4 border-b border-gray-100 pb-5">
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <div className="p-2 rounded-xl bg-gray-100 text-slate-800 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                        <FileText size={18} />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-800">{report.title}</h2>
                    </div>
                    <p className="text-xs text-gray-500">
                      Project: <strong className="text-gray-700">{report.projectId?.name || 'Canopi Project'}</strong> • Generated on {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions & View Mode Toggle */}
                  <div className="flex items-center space-x-2">
                    {/* Visual vs Story vs Markdown Mode Switcher */}
                    <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                      <button
                        onClick={() =>
                          setViewModes((prev) => ({ ...prev, [report._id]: 'visual' }))
                        }
                        className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-all ${
                          currentMode === 'visual'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <LayoutTemplate size={13} />
                        <span>Visual Report</span>
                      </button>

                      <button
                        onClick={() =>
                          setViewModes((prev) => ({ ...prev, [report._id]: 'story' }))
                        }
                        className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-all ${
                          currentMode === 'story'
                            ? 'bg-cyan-600 text-white shadow-sm'
                            : 'text-cyan-700 hover:text-cyan-900 bg-cyan-50/60'
                        }`}
                      >
                        <Sparkles size={13} />
                        <span>Visual Story</span>
                        {report.visualStory?.slides?.length > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${currentMode === 'story' ? 'bg-white/20 text-white' : 'bg-cyan-200 text-cyan-800'}`}>
                            {report.visualStory.slides.length}
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() =>
                          setViewModes((prev) => ({ ...prev, [report._id]: 'carousel' }))
                        }
                        className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-all ${
                          currentMode === 'carousel'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-indigo-700 hover:text-indigo-900 bg-indigo-50/60'
                        }`}
                      >
                        <Layers size={13} />
                        <span>Carousel Post</span>
                      </button>

                      <button
                        onClick={() =>
                          setViewModes((prev) => ({ ...prev, [report._id]: 'reel' }))
                        }
                        className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-all ${
                          currentMode === 'reel'
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'text-purple-700 hover:text-purple-900 bg-purple-50/60'
                        }`}
                      >
                        <Film size={13} />
                        <span>Highlight Reel</span>
                      </button>

                      <button
                        onClick={() =>
                          setViewModes((prev) => ({ ...prev, [report._id]: 'social_reels' }))
                        }
                        className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-all ${
                          currentMode === 'social_reels'
                            ? 'bg-pink-600 text-white shadow-sm'
                            : 'text-pink-700 hover:text-pink-900 bg-pink-50/60'
                        }`}
                      >
                        <Sparkles size={13} />
                        <span>Social Reels</span>
                      </button>

                      <button
                        onClick={() =>
                          setViewModes((prev) => ({ ...prev, [report._id]: 'markdown' }))
                        }
                        className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-all ${
                          currentMode === 'markdown'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <FileCode size={13} />
                        <span>Markdown</span>
                      </button>
                    </div>

                    <button
                      onClick={() => handleShare(report)}
                      title="Share Summary"
                      className="p-2 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
                    >
                      <Share2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDownload(report)}
                      title="Download Markdown"
                      className="p-2 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>

                {/* Report Content Body: Visual vs Story vs Carousel vs Reel vs Social Reels vs Markdown */}
                {currentMode === 'visual' ? (
                  <VisualReportRenderer report={report} />
                ) : currentMode === 'story' ? (
                  <VisualStoryViewer
                    report={report}
                    onStoryUpdated={(updatedReport) =>
                      setReports((prev) =>
                        prev.map((r) => (r._id === updatedReport._id ? updatedReport : r))
                      )
                    }
                  />
                ) : currentMode === 'carousel' ? (
                  <CarouselPostViewer
                    reportId={report._id}
                    projectId={
                      typeof report.projectId === 'object'
                        ? report.projectId._id
                        : report.projectId
                    }
                  />
                ) : currentMode === 'reel' ? (
                  <HighlightReelViewer
                    reportId={report._id}
                    projectId={
                      typeof report.projectId === 'object'
                        ? report.projectId._id
                        : report.projectId
                    }
                  />
                ) : currentMode === 'social_reels' ? (
                  <SocialReelViewer
                    reportId={report._id}
                    projectId={
                      typeof report.projectId === 'object'
                        ? report.projectId._id
                        : report.projectId
                    }
                  />
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Executive Summary
                      </h3>
                      <p className="text-gray-700 text-sm leading-relaxed font-serif">
                        {report.executiveSummary}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Key Findings
                      </h3>
                      <ul className="space-y-2">
                        {report.keyFindings?.map((finding, idx) => (
                          <li
                            key={idx}
                            className="flex items-start space-x-3 text-gray-700 bg-gray-50 p-3 rounded-xl text-sm"
                          >
                            <span className="text-slate-800 font-bold mt-0.5">•</span>
                            <span>{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {report.limitations && (
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                        <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
                          AI Limitations & Observations
                        </h3>
                        <p className="text-xs text-amber-900 leading-relaxed">
                          {report.limitations}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Campaign Posts Section */}
                <div className="pt-6 border-t border-gray-100">
                  {campaignPosts.length > 0 || campaignContent ? (
                    <CampaignPostsView
                      campaignPosts={campaignPosts}
                      rawContent={campaignContent}
                    />
                  ) : (
                    <button
                      onClick={() => handleGenerateCampaign(report)}
                      disabled={generatingCampaignId === report._id}
                      className="bw-btn-white px-5 py-2.5 text-xs font-semibold text-gray-800 flex items-center space-x-2 disabled:opacity-50 border border-gray-200 rounded-xl hover:bg-gray-50"
                    >
                      {generatingCampaignId === report._id ? (
                        <Loader2 size={15} className="animate-spin text-cyan-500" />
                      ) : (
                        <Sparkles size={15} className="text-cyan-500" />
                      )}
                      <span>
                        {generatingCampaignId === report._id
                          ? 'Drafting Visual Campaign...'
                          : 'Generate Campaign-Ready Social Posts with Visuals'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

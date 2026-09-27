import { API_URL } from '../config.js';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle,
  ShieldAlert,
  FileText,
  Image as ImageIcon,
  ShieldCheck,
  Folder,
  Layers,
  Filter,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useStepSuccess } from '../context/StepSuccessContext';
import { TrustScoreBadge } from '../components/common/TrustScoreBadge';

export const Evidence = () => {
  const [evidenceList, setEvidenceList] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'VERIFIED' | 'PENDING'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { triggerStepSuccess } = useStepSuccess();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [evRes, projRes] = await Promise.all([
          fetch(`${API_URL}/api/evidence`),
          fetch(`${API_URL}/api/projects`),
        ]);

        if (!evRes.ok) throw new Error('Failed to load evidence records');
        const evData = await evRes.json();
        setEvidenceList(Array.isArray(evData) ? evData : []);

        if (projRes.ok) {
          const projData = await projRes.json();
          setProjects(Array.isArray(projData) ? projData : []);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleVerify = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/evidence/${id}/verify`, { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to verify');
      setEvidenceList((prev) =>
        prev.map((ev) => (ev._id === id ? { ...ev, verified: true } : ev))
      );

      // Trigger Step Success confirmation toast with Next Step guidance
      triggerStepSuccess({
        title: 'Evidence Verified',
        message: 'Evidence claim has been verified and marked as trusted for impact storytelling.',
        nextStepLabel: 'Generate Impact Report',
        autoAdvanceSeconds: 5,
        onNext: () => navigate('/reports'),
      });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/evidence/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to reject');
      setEvidenceList((prev) => prev.filter((ev) => ev._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  // Filter evidence by selected project & verification status
  const filteredEvidence = evidenceList.filter((evidence) => {
    const projId = typeof evidence.projectId === 'object' ? evidence.projectId?._id : evidence.projectId;
    const matchesProject = selectedProjectId === 'ALL' || projId === selectedProjectId;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'VERIFIED' && evidence.verified) ||
      (statusFilter === 'PENDING' && !evidence.verified);
    return matchesProject && matchesStatus;
  });

  const selectedProject = projects.find((p) => p._id === selectedProjectId);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-800 font-semibold mb-2">
            Evidence & Verification
          </h1>
          <p className="text-gray-600">
            Review and verify AI-generated observations to create trusted impact stories across your projects.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/comparison')}
            className="bw-btn-black px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center space-x-2"
          >
            <Sparkles size={15} />
            <span>New AI Comparison</span>
          </button>
        </div>
      </div>

      {/* Project & Status Filter Bar */}
      <div className="bg-gray-50/80 border border-gray-200/80 rounded-3xl p-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Project Selector */}
          <div className="flex items-center space-x-3 flex-1">
            <div className="flex items-center space-x-2 text-xs font-bold text-gray-700">
              <Folder size={16} className="text-gray-500" />
              <span>Project:</span>
            </div>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="flex-1 max-w-xs md:max-w-md bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 shadow-xs focus:ring-2 focus:ring-black focus:outline-hidden"
            >
              <option value="ALL">All Projects ({projects.length})</option>
              {projects.map((proj) => (
                <option key={proj._id} value={proj._id}>
                  {proj.title || proj.name} {proj.location ? `— ${proj.location}` : ''}
                </option>
              ))}
            </select>

            {selectedProjectId !== 'ALL' && selectedProject && (
              <Link
                to={`/projects/${selectedProject._id}`}
                className="text-xs text-gray-500 hover:text-black font-semibold flex items-center space-x-1"
                title="View full project details"
              >
                <span>View Project</span>
                <ExternalLink size={12} />
              </Link>
            )}
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center space-x-1.5 bg-white p-1 rounded-2xl border border-gray-200">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({evidenceList.length})
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending ({evidenceList.filter((e) => !e.verified).length})
            </button>
            <button
              onClick={() => setStatusFilter('VERIFIED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === 'VERIFIED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Verified ({evidenceList.filter((e) => e.verified).length})
            </button>
          </div>
        </div>
      </div>

      {/* Evidence Records List */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-gray-500 py-16 text-center">Loading evidence & projects...</div>
        ) : error ? (
          <div className="text-red-500 py-16 text-center">{error}</div>
        ) : filteredEvidence.length === 0 ? (
          <div className="bw-card-white rounded-3xl p-12 text-center text-gray-500 flex flex-col items-center space-y-3">
            <Layers size={40} className="text-gray-300 mb-1" />
            <h3 className="text-lg font-bold text-gray-800">
              {selectedProjectId === 'ALL'
                ? 'No evidence records found'
                : `No evidence found for "${selectedProject?.title || selectedProject?.name || 'this project'}"`}
            </h3>
            <p className="text-xs text-gray-500 max-w-md">
              Create before/after comparisons using media from this project to generate AI-audited evidence.
            </p>
            <div className="pt-3 flex items-center space-x-3">
              <button
                onClick={() => navigate('/comparison')}
                className="bw-btn-black px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center space-x-1.5"
              >
                <Sparkles size={14} />
                <span>Create Comparison</span>
              </button>
              {selectedProjectId !== 'ALL' && (
                <button
                  onClick={() => setSelectedProjectId('ALL')}
                  className="px-4 py-2.5 rounded-2xl text-xs font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Show All Projects
                </button>
              )}
            </div>
          </div>
        ) : (
          filteredEvidence.map((evidence) => {
            const sourceAssets = Array.isArray(evidence.sourceAssets) ? evidence.sourceAssets : [];
            const primaryAsset = sourceAssets[0];
            const avgScore =
              sourceAssets.length > 0
                ? Math.round(
                    sourceAssets.reduce((sum, a) => sum + (a?.trustScore ?? 70), 0) /
                      sourceAssets.length
                  )
                : 70;
            const combinedBreakdown = primaryAsset?.trustScoreBreakdown || [];

            // Resolve Project details from populated object or projects array
            const matchedProj =
              typeof evidence.projectId === 'object' && evidence.projectId !== null
                ? evidence.projectId
                : projects.find((p) => p._id === evidence.projectId);

            return (
              <div
                key={evidence._id}
                className="bw-card-white rounded-3xl p-6 relative overflow-hidden border border-gray-100 shadow-sm"
              >
                {/* Status Indicator Bar */}
                <div
                  className={`absolute top-0 left-0 w-1.5 h-full ${
                    evidence.verified
                      ? 'bg-cyan-500'
                      : 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]'
                  }`}
                ></div>

                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                  <div className="space-y-4 flex-1">
                    {/* Meta Row: Project Badge + Type + Date */}
                    <div className="flex flex-wrap items-center gap-2">
                      {matchedProj && (
                        <Link
                          to={`/projects/${matchedProj._id}`}
                          className="px-2.5 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-full text-gray-800 flex items-center space-x-1.5 transition-colors"
                        >
                          <Folder size={12} className="text-gray-500" />
                          <span>{matchedProj.title || matchedProj.name}</span>
                        </Link>
                      )}

                      <span className="px-3 py-1 text-xs font-medium bg-white border border-gray-200 rounded-full text-gray-600 uppercase">
                        {evidence.type}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(evidence.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{evidence.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{evidence.description}</p>
                    </div>

                    {/* Linked Source Assets Preview */}
                    {sourceAssets.length > 0 && (
                      <div className="mt-3 p-3 bg-gray-50/80 rounded-2xl border border-gray-100">
                        <div className="text-xs font-semibold text-gray-600 mb-2 flex items-center justify-between">
                          <span className="flex items-center space-x-1.5">
                            <ImageIcon size={13} className="text-gray-500" />
                            <span>Linked Source Visuals ({sourceAssets.length})</span>
                          </span>
                          <span className="text-[11px] text-gray-400">
                            Click badge for audit breakdown
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {sourceAssets.map((asset, idx) => (
                            <div
                              key={asset._id || idx}
                              className="bg-white p-2 rounded-xl border border-gray-100 shadow-xs flex flex-col space-y-1.5"
                            >
                              {asset.cloudinary?.secureUrl ? (
                                <img
                                  src={asset.cloudinary.secureUrl}
                                  alt={asset.originalFilename || 'Source visual'}
                                  className="w-full h-16 object-cover rounded-lg"
                                />
                              ) : (
                                <div className="w-full h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                                  Visual {idx + 1}
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <span
                                  className="text-[10px] text-gray-500 truncate max-w-[80px]"
                                  title={asset.originalFilename}
                                >
                                  {asset.originalFilename || `Asset ${idx + 1}`}
                                </span>
                                <TrustScoreBadge
                                  score={asset.trustScore ?? 70}
                                  breakdown={asset.trustScoreBreakdown || []}
                                  size="sm"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Observations */}
                    {evidence.observations && evidence.observations.length > 0 && (
                      <div className="mt-4 bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-800 mb-3">AI Observations</h4>
                        <ul className="space-y-2">
                          {evidence.observations.map((obs, idx) => (
                            <li key={idx} className="text-sm text-gray-600">
                              <span className="text-cyan-600 font-medium capitalize">
                                {obs.category}:{' '}
                              </span>
                              <span className="text-gray-700">Change identified as </span>
                              <strong className="text-gray-800 font-semibold">{obs.change}</strong>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center space-x-2 text-xs text-gray-500 pt-1">
                      <FileText size={14} />
                      <span>
                        Generated by {evidence.generatedBy?.provider || 'AI Engine'} (
                        {evidence.generatedBy?.model || 'Vision-Model'})
                      </span>
                    </div>
                  </div>

                  {/* Right Action Panel with Prominent Trust Score Badge */}
                  <div className="flex flex-col space-y-3 min-w-[240px] bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
                    {/* Trust Score Reviewer Decision Aid */}
                    <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-700 flex items-center space-x-1">
                          <ShieldCheck size={14} className="text-cyan-600" />
                          <span>Evidence Trust Score</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <TrustScoreBadge
                          score={avgScore}
                          breakdown={combinedBreakdown}
                          size="md"
                        />
                        <span className="text-[10px] text-gray-400 italic">
                          {avgScore >= 80
                            ? 'High Confidence'
                            : avgScore >= 50
                            ? 'Moderate'
                            : 'Needs Scrutiny'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-tight pt-1">
                        Advisory confidence score combining forensic duplicate check, GPS/EXIF
                        consistency & dual AI analysis.
                      </p>
                    </div>

                    {evidence.verified ? (
                      <div className="flex items-center space-x-2 text-emerald-700 bg-emerald-50 px-4 py-3 rounded-2xl border border-emerald-200">
                        <CheckCircle size={20} className="text-emerald-600 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-xs block">Verified Evidence</span>
                          <span className="text-[10px] text-emerald-600">
                            Approved for impact storytelling
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-1.5 text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200 text-xs">
                          <ShieldAlert size={14} className="flex-shrink-0" />
                          <span className="text-[11px] font-medium">
                            Pending Human Verification
                          </span>
                        </div>
                        <button
                          onClick={() => handleVerify(evidence._id)}
                          className="w-full py-2.5 px-4 rounded-xl text-white font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] shadow-xs hover:shadow transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          <CheckCircle size={15} />
                          <span>Verify Claim</span>
                        </button>
                        <button
                          onClick={() => handleReject(evidence._id)}
                          className="w-full py-2 px-4 rounded-xl text-red-600 font-medium text-xs border border-red-200 hover:bg-red-50 transition-all cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => navigate('/media')}
                      className="flex items-center justify-center space-x-1.5 text-xs text-gray-600 hover:text-gray-900 transition-colors py-1.5"
                    >
                      <ImageIcon size={14} />
                      <span>View All Media Explorer</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

import { API_URL } from '../config.js';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ShieldAlert, FileText, Image as ImageIcon, ShieldCheck } from 'lucide-react';
import { useStepSuccess } from '../context/StepSuccessContext';
import { TrustScoreBadge } from '../components/common/TrustScoreBadge';

export const Evidence = () => {
  const [evidenceList, setEvidenceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { triggerStepSuccess } = useStepSuccess();

  useEffect(() => {
    fetch(`${API_URL}/api/evidence`)
      .then(res => res.json())
      .then(data => setEvidenceList(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleVerify = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/evidence/${id}/verify`, { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to verify');
      setEvidenceList(prev => prev.map(ev => 
        ev._id === id ? { ...ev, verified: true } : ev
      ));

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
      setEvidenceList(prev => prev.filter(ev => ev._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-800 font-semibold mb-2">Evidence & Verification</h1>
          <p className="text-gray-600">Review and verify AI-generated observations to create trusted impact stories.</p>
        </div>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="text-gray-500 py-10 text-center">Loading evidence...</div>
        ) : error ? (
          <div className="text-red-500 py-10 text-center">{error}</div>
        ) : evidenceList.length === 0 ? (
          <div className="text-gray-500 py-10 text-center">No evidence found. Generate some in Comparisons.</div>
        ) : evidenceList.map((evidence) => {
          const sourceAssets = Array.isArray(evidence.sourceAssets) ? evidence.sourceAssets : [];
          const primaryAsset = sourceAssets[0];
          const avgScore = sourceAssets.length > 0
            ? Math.round(sourceAssets.reduce((sum, a) => sum + (a?.trustScore ?? 70), 0) / sourceAssets.length)
            : 70;
          const combinedBreakdown = primaryAsset?.trustScoreBreakdown || [];

          return (
            <div key={evidence._id} className="bw-card-white rounded-3xl p-6 relative overflow-hidden">
              {/* Status Indicator */}
              <div className={`absolute top-0 left-0 w-1.5 h-full ${evidence.verified ? 'bg-cyan-500' : 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]'}`}></div>
              
              <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="px-3 py-1 text-xs font-medium bg-white border border-gray-200 rounded-full text-gray-600 uppercase">
                      {evidence.type}
                    </span>
                    <span className="text-xs text-gray-500">{new Date(evidence.createdAt).toLocaleDateString()}</span>
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
                        <span className="text-[11px] text-gray-400">Click badge for audit breakdown</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {sourceAssets.map((asset, idx) => (
                          <div key={asset._id || idx} className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex flex-col space-y-1.5">
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
                              <span className="text-[10px] text-gray-500 truncate max-w-[80px]" title={asset.originalFilename}>
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
                            <span className="text-cyan-600 font-medium capitalize">{obs.category}: </span>
                            <span className="text-gray-700">Change identified as </span>
                            <strong className="text-gray-800 font-semibold">{obs.change}</strong>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2 text-xs text-gray-500 pt-1">
                    <FileText size={14} />
                    <span>Generated by {evidence.generatedBy?.provider || 'AI Engine'} ({evidence.generatedBy?.model || 'Vision-Model'})</span>
                  </div>
                </div>
                
                {/* Right Action Panel with Prominent Trust Score Badge */}
                <div className="flex flex-col space-y-3 min-w-[240px] bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
                  {/* Trust Score Reviewer Decision Aid */}
                  <div className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm space-y-1.5">
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
                        {avgScore >= 80 ? 'High Confidence' : avgScore >= 50 ? 'Moderate' : 'Needs Scrutiny'}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-tight pt-1">
                      Advisory confidence score combining forensic duplicate check, GPS/EXIF consistency & dual AI analysis.
                    </p>
                  </div>

                  {evidence.verified ? (
                    <div className="flex items-center space-x-2 text-emerald-700 bg-emerald-50 px-4 py-3 rounded-2xl border border-emerald-200">
                      <CheckCircle size={20} className="text-emerald-600 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-xs block">Verified Evidence</span>
                        <span className="text-[10px] text-emerald-600">Approved for impact storytelling</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-1.5 text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200 text-xs">
                        <ShieldAlert size={14} className="flex-shrink-0" />
                        <span className="text-[11px] font-medium">Pending Human Verification</span>
                      </div>
                      <button 
                        onClick={() => handleVerify(evidence._id)}
                        className="w-full py-2.5 px-4 rounded-xl text-white font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] shadow-sm hover:shadow transition-all flex items-center justify-center space-x-1.5"
                      >
                        <CheckCircle size={15} />
                        <span>Verify Claim</span>
                      </button>
                      <button 
                        onClick={() => handleReject(evidence._id)}
                        className="w-full py-2 px-4 rounded-xl text-red-600 font-medium text-xs border border-red-200 hover:bg-red-50 transition-all"
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
        })}
      </div>
    </div>
  );
};

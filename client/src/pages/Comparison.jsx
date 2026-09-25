import { API_URL } from '../config.js';
import { useState, useEffect } from 'react';
import { ArrowRight, Wand2 } from 'lucide-react';

export const Comparison = () => {
  const [assets, setAssets] = useState([]);
  const [beforeAssetId, setBeforeAssetId] = useState('');
  const [afterAssetId, setAfterAssetId] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [draftEvidence, setDraftEvidence] = useState(null);
  const [error, setError] = useState(null);
  const [drafting, setDrafting] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/assets`)
      .then(res => res.json())
      .then(data => setAssets(data.filter(a => a.mediaType === 'image')))
      .catch(err => console.error("Failed to load assets", err));
  }, []);

  const beforeAsset = assets.find(a => a._id === beforeAssetId);
  const afterAsset = assets.find(a => a._id === afterAssetId);

  const handleCompare = async () => {
    if (!beforeAssetId || !afterAssetId) return;
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch(`${API_URL}/api/comparisons/before-after`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beforeAssetId, afterAssetId })
      });
      
      if (!response.ok) throw new Error('Comparison failed');
      const data = await response.json();
      setResult(data.comparison);
      setDraftEvidence(data.draftEvidence);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };



  const handleDraftEvidence = async () => {
    if (!draftEvidence) return;
    setDrafting(true);
    try {
      const response = await fetch(`${API_URL}/api/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draftEvidence)
      });
      if (!response.ok) throw new Error('Failed to draft evidence');
      alert('Drafted successfully! Go to the Evidence tab to review and verify.');
    } catch (err) {
      alert(err.message);
    } finally {
      setDrafting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-800 font-semibold mb-2">Before / After Comparison</h1>
          <p className="text-gray-600">Analyze visual changes over time using Gemini Multimodal intelligence.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Before Asset Selection (Mocked) */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wider pl-2">Before Asset</h3>
          <div className="bw-card-white rounded-3xl h-64 border border-dashed border-gray-300 flex flex-col items-center justify-center text-center p-2 relative overflow-hidden">
            {beforeAsset ? (
              <img src={beforeAsset.cloudinary?.secureUrl} className="w-full h-full object-cover rounded-2xl" alt="Before" />
            ) : (
              <div className="text-gray-400 font-medium">Select baseline image</div>
            )}
          </div>
          <select 
            className="w-full p-3 rounded-xl border border-gray-200"
            value={beforeAssetId}
            onChange={(e) => setBeforeAssetId(e.target.value)}
          >
            <option value="">-- Choose Asset --</option>
            {assets.map(a => <option key={a._id} value={a._id}>{a.originalFilename}</option>)}
          </select>
        </div>

        {/* After Asset Selection (Mocked) */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wider pl-2">After Asset</h3>
          <div className="bw-card-white rounded-3xl h-64 border border-dashed border-gray-300 flex flex-col items-center justify-center text-center p-2 relative overflow-hidden">
            {afterAsset ? (
              <img src={afterAsset.cloudinary?.secureUrl} className="w-full h-full object-cover rounded-2xl" alt="After" />
            ) : (
              <div className="text-gray-400 font-medium">Select recent image</div>
            )}
          </div>
          <select 
            className="w-full p-3 rounded-xl border border-gray-200"
            value={afterAssetId}
            onChange={(e) => setAfterAssetId(e.target.value)}
          >
            <option value="">-- Choose Asset --</option>
            {assets.map(a => <option key={a._id} value={a._id}>{a.originalFilename}</option>)}
          </select>
        </div>
      </div>

      <div className="flex justify-center py-6">
        <button 
          onClick={handleCompare}
          disabled={isAnalyzing || !beforeAssetId || !afterAssetId}
          className="bw-btn-black px-10 py-4 rounded-3xl text-gray-100 font-semibold flex items-center space-x-3 text-lg disabled:opacity-50"
        >
          <Wand2 size={24} className={isAnalyzing ? "animate-spin" : ""} />
          <span>{isAnalyzing ? "Gemini is analyzing changes..." : "Generate AI Comparison"}</span>
        </button>
      </div>

      {error && <div className="text-red-500 text-center">{error}</div>}

      {result && (
        <div className="bw-card-white rounded-3xl p-8 animate-in slide-in-from-bottom-10 fade-in duration-500">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
            <h2 className="text-2xl font-bold text-gray-800 font-semibold">AI Analysis Results</h2>
          </div>
          
          <p className="text-lg text-slate-700 font-bold mb-8 leading-relaxed border-l-2 border-cyan-500/50 pl-4">{result.summary}</p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Detailed Observations</h4>
              {result.observations.map((obs, idx) => (
                <div key={idx} className="bg-white/50 border border-white/60 border border-white/5 rounded-3xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-800 font-semibold font-medium capitalize">{obs.category}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${obs.change === 'decrease' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-800 font-semibold'}`}>
                      {obs.change}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-start"><span className="w-16 text-gray-500">Before:</span> <span>{obs.before}</span></div>
                    <div className="flex items-start"><span className="w-16 text-gray-500">After:</span> <span>{obs.after}</span></div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-yellow-500/70 uppercase tracking-wider">AI Limitations & Caveats</h4>
              {result.limitations.map((lim, idx) => (
                <div key={idx} className="bg-yellow-500/10 border border-yellow-500/20 rounded-3xl p-4 text-sm text-yellow-500/90 leading-relaxed">
                  {lim}
                </div>
              ))}
              
              <div className="pt-8">
                <button 
                  onClick={handleDraftEvidence} 
                  disabled={drafting}
                  className="bw-btn-black w-full py-4 rounded-3xl text-gray-100 font-semibold border-cyan-500/30 flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <span>{drafting ? 'Saving...' : 'Draft as Evidence'}</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

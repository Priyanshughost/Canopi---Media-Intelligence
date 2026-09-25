import { API_URL } from '../config.js';
import { useState, useEffect } from 'react';
import { Filter, Image as ImageIcon, Video, Search, Loader2 } from 'lucide-react';

export const Media = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await fetch(`${API_URL}/api/assets`);
        if (!response.ok) throw new Error('Failed to fetch media assets');
        const data = await response.json();
        setAssets(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, []);

  // Real-time polling for processing assets
  useEffect(() => {
    const isProcessing = assets.some(a => !['READY', 'FAILED'].includes(a.processingStatus));
    if (isProcessing) {
      const interval = setInterval(() => {
        fetch(`${API_URL}/api/assets`)
          .then(res => res.json())
          .then(data => setAssets(data))
          .catch(console.error);
      }, 2000); // Poll every 2 seconds for real-time feel
      return () => clearInterval(interval);
    }
  }, [assets]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'READY': return 'bg-green-500';
      case 'FAILED': return 'bg-red-500';
      case 'ANALYZING': return 'bg-purple-500';
      case 'EMBEDDING': 
      case 'INDEXING': return 'bg-blue-500';
      default: return 'bg-yellow-500'; // UPLOADING / UPLOADED
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-700 mb-2">Media Explorer</h1>
          <p className="text-gray-600">Browse all visual evidence across all projects.</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search descriptions..." 
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>
          <button className="bw-btn-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center space-x-2 border border-gray-200">
            <Filter size={16} />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500 py-20 text-center">Loading media...</div>
      ) : error ? (
        <div className="text-red-500 py-20 text-center">{error}</div>
      ) : assets.length === 0 ? (
        <div className="bw-card-white p-20 text-center text-gray-500 flex flex-col items-center">
          <ImageIcon size={48} className="mb-4 opacity-20" />
          <p className="text-lg font-medium text-gray-700">No media found.</p>
          <p className="text-sm">Upload media inside a project to see it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {assets.map(asset => (
            <div key={asset._id} className="bw-card-white overflow-hidden group cursor-pointer hover:shadow-xl transition-all">
              <div className="aspect-square bg-gray-100 relative overflow-hidden">
                {asset.mediaType === 'video' ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <Video size={32} className="text-gray-400" />
                  </div>
                ) : (
                  <img 
                    src={asset.cloudinary?.secureUrl} 
                    alt={asset.originalFilename}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                )}
                
                {/* Overlay info on hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <p className="text-white text-xs font-medium line-clamp-3 mb-2">
                    {asset.aiAnalysis?.description || 'No analysis available'}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(asset.aiAnalysis?.tags || []).slice(0, 2).map((tag, i) => (
                      <span key={i} className="text-[9px] uppercase tracking-wider bg-white/20 text-white px-1.5 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className={`absolute top-2 right-2 px-2 py-1 ${getStatusColor(asset.processingStatus)} text-white rounded-md text-[9px] font-bold uppercase tracking-wider shadow-md flex items-center space-x-1`}>
                  {!['READY', 'FAILED'].includes(asset.processingStatus) && (
                    <Loader2 size={10} className="animate-spin" />
                  )}
                  <span>{asset.processingStatus}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

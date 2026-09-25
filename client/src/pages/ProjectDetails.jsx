import { API_URL } from '../config.js';
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Upload, Image as ImageIcon, Video, Activity, Loader2, Trash2 } from 'lucide-react';

export const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const [projRes, assetsRes] = await Promise.all([
        fetch(`${API_URL}/api/projects/${id}`),
        fetch(`${API_URL}/api/assets?projectId=${id}`)
      ]);
      
      if (!projRes.ok) throw new Error('Project not found');
      
      const projData = await projRes.json();
      const assetsData = await assetsRes.json();
      
      setProject(projData);
      setAssets(assetsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Real-time polling for processing assets
  useEffect(() => {
    const isProcessing = assets.some(a => !['READY', 'FAILED'].includes(a.processingStatus));
    if (isProcessing) {
      const interval = setInterval(() => {
        fetch(`${API_URL}/api/assets?projectId=${id}`)
          .then(res => res.json())
          .then(data => setAssets(data))
          .catch(console.error);
      }, 2000); // Poll every 2 seconds for real-time feel
      return () => clearInterval(interval);
    }
  }, [assets, id]);

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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', id);

    try {
      const response = await fetch(`${API_URL}/api/assets/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      
      // Refresh assets after upload
      await fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleProjectDelete = async () => {
    if (!confirm('Are you sure you want to delete this project and all its assets permanently?')) return;
    try {
      const res = await fetch(`${API_URL}/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete project');
      navigate('/projects');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAssetDelete = async (assetId) => {
    if (!confirm('Are you sure you want to delete this asset permanently?')) return;
    try {
      const res = await fetch(`${API_URL}/api/assets/${assetId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete asset');
      setAssets(assets.filter(a => a._id !== assetId));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-500">Loading project data...</div>;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!project) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="bw-card-white p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">
                {project.status}
              </span>
              <span className="text-sm text-gray-500">{project.organization}</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-700 mb-4">{project.name}</h1>
            <p className="text-gray-600 max-w-2xl">{project.description}</p>
            
            <div className="flex items-center space-x-6 mt-6">
              {project.locations?.length > 0 && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin size={16} />
                  <span>{project.locations.join(', ')}</span>
                </div>
              )}
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar size={16} />
                <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <div className="flex-shrink-0 flex items-center space-x-3">
            <button 
              onClick={handleProjectDelete}
              className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-red-100 bg-white"
              title="Delete Project"
            >
              <Trash2 size={18} />
            </button>
            <label className="bw-btn-black px-6 py-3 font-semibold flex items-center space-x-2 cursor-pointer transition-all hover:scale-105 active:scale-95">
              {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              <span>{uploading ? 'Uploading...' : 'Upload Media'}</span>
              <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>
        </div>
      </div>

      {/* Media Gallery */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-700 flex items-center space-x-2">
            <ImageIcon size={20} />
            <span>Project Media ({assets.length})</span>
          </h2>
        </div>

        {assets.length === 0 ? (
          <div className="bw-card-white p-12 text-center text-gray-500 flex flex-col items-center justify-center">
            <Upload size={32} className="mb-4 opacity-50" />
            <p className="mb-2">No media uploaded yet.</p>
            <p className="text-sm opacity-75">Upload evidence to start AI analysis.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {assets.map(asset => (
              <div key={asset._id} className="bw-card-white overflow-hidden group">
                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                  {asset.mediaType === 'video' ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <Video size={32} className="text-gray-400" />
                    </div>
                  ) : (
                    <img 
                      src={asset.cloudinary?.secureUrl} 
                      alt={asset.originalFilename}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  )}
                  <div className="absolute top-2 right-2 flex flex-col space-y-2">
                    <div className={`px-2 py-1 ${getStatusColor(asset.processingStatus)} text-white rounded-md text-[10px] font-semibold uppercase tracking-wider shadow-lg flex items-center space-x-1`}>
                      {!['READY', 'FAILED'].includes(asset.processingStatus) && (
                        <Loader2 size={10} className="animate-spin mr-1" />
                      )}
                      <span>{asset.processingStatus}</span>
                    </div>
                    <button 
                      onClick={() => handleAssetDelete(asset._id)}
                      className="p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100 self-end"
                      title="Delete Asset"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="text-xs text-gray-500 mb-2 truncate" title={asset.originalFilename}>
                    {asset.originalFilename}
                  </div>
                  
                  {asset.aiAnalysis?.description ? (
                    <p className="text-sm text-gray-800 line-clamp-2 leading-relaxed">
                      {asset.aiAnalysis.description}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Analysis pending or unavailable</p>
                  )}
                  
                  {asset.aiAnalysis?.tags?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {asset.aiAnalysis.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded uppercase font-semibold">
                          {tag}
                        </span>
                      ))}
                      {asset.aiAnalysis.tags.length > 3 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded uppercase font-semibold">
                          +{asset.aiAnalysis.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

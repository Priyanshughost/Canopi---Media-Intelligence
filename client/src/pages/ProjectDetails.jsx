import { API_URL } from '../config.js';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LayoutGrid, Clock, MapPin } from 'lucide-react';
import { MediaDetailModal } from '../components/MediaDetailModal';
import { useStepSuccess } from '../context/StepSuccessContext';
import {
  ProjectHeader,
  ProjectDuplicateBanner,
  ProjectGalleryTab,
  ProjectTimelineTab,
  ProjectLocationsTab,
} from '../components/project';

export const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [duplicateAlert, setDuplicateAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('gallery'); // 'gallery' | 'timeline' | 'locations'

  // Timeline State
  const [timelineData, setTimelineData] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [groupBy, setGroupBy] = useState('day');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Locations State
  const [locationsData, setLocationsData] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [projRes, assetsRes] = await Promise.all([
        fetch(`${API_URL}/api/projects/${id}`),
        fetch(`${API_URL}/api/assets?projectId=${id}`),
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

  const fetchTimeline = useCallback(async () => {
    setTimelineLoading(true);
    try {
      const params = new URLSearchParams({
        groupBy,
        verifiedOnly: String(verifiedOnly),
      });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(`${API_URL}/api/projects/${id}/timeline?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load timeline');
      const data = await res.json();
      setTimelineData(data.timeline || []);
    } catch (err) {
      console.error('Timeline fetch error:', err);
    } finally {
      setTimelineLoading(false);
    }
  }, [id, groupBy, verifiedOnly, startDate, endDate]);

  const fetchLocations = useCallback(async () => {
    setLocationsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/projects/${id}/locations`);
      if (!res.ok) throw new Error('Failed to load locations');
      const data = await res.json();
      setLocationsData(data.clusters || []);
    } catch (err) {
      console.error('Locations fetch error:', err);
    } finally {
      setLocationsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'timeline') {
      fetchTimeline();
    } else if (activeTab === 'locations') {
      fetchLocations();
    }
  }, [activeTab, fetchTimeline, fetchLocations]);

  // Real-time polling for processing assets
  useEffect(() => {
    const isProcessing = assets.some((a) => !['READY', 'FAILED'].includes(a.processingStatus));
    if (isProcessing) {
      const interval = setInterval(() => {
        fetch(`${API_URL}/api/assets?projectId=${id}`)
          .then((res) => res.json())
          .then((data) => setAssets(data))
          .catch(console.error);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [assets, id]);

  const { triggerStepSuccess } = useStepSuccess();

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setDuplicateAlert(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', id);

    try {
      const res = await fetch(`${API_URL}/api/assets/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const newAsset = await res.json();

      if (newAsset.possibleDuplicates?.length > 0) {
        setDuplicateAlert({
          count: newAsset.possibleDuplicates.length,
          filename: newAsset.originalFilename,
          duplicates: newAsset.possibleDuplicates,
        });
      }

      setAssets((prev) => [newAsset, ...prev]);

      // Trigger persistent confirmation toast (no auto-jump timer, allowing multiple uploads)
      triggerStepSuccess({
        title: 'Media Uploaded',
        message: `"${file.name}" uploaded successfully. Upload more or proceed to comparison.`,
        nextStepLabel: 'Go to Comparison',
        autoAdvance: false,
        onNext: () => navigate('/comparison'),
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleProjectDelete = async () => {
    if (!confirm('Are you sure you want to delete this project and all its assets?')) return;
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
      setAssets((prev) => prev.filter((a) => a._id !== assetId));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-500">Loading project data...</div>;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!project) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Project Header */}
      <ProjectHeader
        project={project}
        uploading={uploading}
        onFileUpload={handleFileUpload}
        onProjectDelete={handleProjectDelete}
      />

      {/* Near-Duplicate Alert Banner */}
      <ProjectDuplicateBanner
        duplicateAlert={duplicateAlert}
        onClose={() => setDuplicateAlert(null)}
      />

      {/* Tab Navigation Controls */}
      <div className="flex items-center space-x-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab('gallery')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center space-x-2 transition-all ${
            activeTab === 'gallery'
              ? 'bg-gray-900 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <LayoutGrid size={15} />
          <span>Gallery ({assets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center space-x-2 transition-all ${
            activeTab === 'timeline'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Clock size={15} />
          <span>Timeline</span>
        </button>

        <button
          onClick={() => setActiveTab('locations')}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center space-x-2 transition-all ${
            activeTab === 'locations'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <MapPin size={15} />
          <span>Locations</span>
        </button>
      </div>

      {/* Tab 1: Gallery */}
      {activeTab === 'gallery' && (
        <ProjectGalleryTab
          assets={assets}
          onSelectAsset={setSelectedAsset}
          onAssetDelete={handleAssetDelete}
        />
      )}

      {/* Tab 2: Timeline */}
      {activeTab === 'timeline' && (
        <ProjectTimelineTab
          timelineData={timelineData}
          timelineLoading={timelineLoading}
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          verifiedOnly={verifiedOnly}
          setVerifiedOnly={setVerifiedOnly}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          onSelectAsset={setSelectedAsset}
          assets={assets}
        />
      )}

      {/* Tab 3: Locations */}
      {activeTab === 'locations' && (
        <ProjectLocationsTab
          locationsData={locationsData}
          locationsLoading={locationsLoading}
        />
      )}

      {/* Media Detail Modal Inspector */}
      {selectedAsset && (
        <MediaDetailModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onAssetUpdated={(updated) => {
            setSelectedAsset(updated);
            setAssets((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));
          }}
        />
      )}
    </div>
  );
};

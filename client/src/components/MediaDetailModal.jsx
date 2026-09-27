import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ShieldAlert,
  CheckCircle,
  Layers,
  Bot,
  Sparkles,
  Lock,
} from 'lucide-react';
import { API_URL } from '../config.js';
import {
  MediaPreviewPanel,
  GroqTab,
  CloudinaryVisionTab,
  DerivativesTab,
  SignedDonorLinkTab,
} from './mediaModal';
import { TrustScoreBadge } from './common/TrustScoreBadge';

export const MediaDetailModal = ({ asset, onClose, onAssetUpdated }) => {
  const [activeTab, setActiveTab] = useState('groq'); // 'groq' | 'cloudinary_vision' | 'derivatives' | 'signed_url'
  const [viewEnhanced, setViewEnhanced] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const [askingVision, setAskingVision] = useState(false);
  const [visionAnalysis, setVisionAnalysis] = useState(asset?.cloudinaryVisionAnalysis);
  const [duplicates, setDuplicates] = useState(null);
  const [loadingDuplicates, setLoadingDuplicates] = useState(false);
  const [signedDuration, setSignedDuration] = useState(86400);
  const [signedData, setSignedData] = useState(null);
  const [generatingSigned, setGeneratingSigned] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!asset) return null;

  const hasEnhanced = Boolean(asset.enhancedVersion);
  const isExifLocation = asset.location?.source === 'exif';
  const hasGps = asset.location?.lat !== undefined || asset.location?.latitude !== undefined;
  const lat = asset.location?.lat ?? asset.location?.latitude;
  const lng = asset.location?.lng ?? asset.location?.longitude;

  const currentDisplayUrl =
    viewEnhanced && asset.enhancedVersion ? asset.enhancedVersion : asset.cloudinary?.secureUrl;

  const handleAskCloudinaryVision = async (e) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;

    setAskingVision(true);
    try {
      const res = await fetch(`${API_URL}/api/assets/${asset._id}/analyze-vision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: [customQuestion] }),
      });
      if (!res.ok) throw new Error('Vision analysis failed');
      const data = await res.json();
      setVisionAnalysis(data.cloudinaryVisionAnalysis);
      setCustomQuestion('');
      if (onAssetUpdated) {
        onAssetUpdated({ ...asset, cloudinaryVisionAnalysis: data.cloudinaryVisionAnalysis });
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setAskingVision(false);
    }
  };

  const handleCheckDuplicates = async () => {
    setLoadingDuplicates(true);
    try {
      const res = await fetch(`${API_URL}/api/assets/${asset._id}/duplicates?threshold=8`);
      if (!res.ok) throw new Error('Failed to check duplicates');
      const data = await res.json();
      setDuplicates(data.duplicates || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingDuplicates(false);
    }
  };

  const handleGenerateSignedUrl = async () => {
    setGeneratingSigned(true);
    setCopiedLink(false);
    try {
      const res = await fetch(`${API_URL}/api/assets/${asset._id}/signed-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresInSeconds: Number(signedDuration) }),
      });
      if (!res.ok) throw new Error('Failed to generate signed URL');
      const data = await res.json();
      setSignedData(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setGeneratingSigned(false);
    }
  };

  const handleCopySignedUrl = () => {
    if (!signedData?.signedUrl) return;
    navigator.clipboard.writeText(signedData.signedUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border border-gray-100">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-gray-800 truncate max-w-md">
              {asset.originalFilename || 'Media Asset Intelligence'}
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
              {asset.mediaType?.toUpperCase()}
            </span>
            {asset.flaggedForReview && (
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 flex items-center space-x-1">
                <ShieldAlert size={12} />
                <span>Review Flagged</span>
              </span>
            )}
            {asset.verified && (
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800 flex items-center space-x-1">
                <CheckCircle size={12} />
                <span>Verified Impact</span>
              </span>
            )}
            <TrustScoreBadge
              score={asset.trustScore ?? 70}
              breakdown={asset.trustScoreBreakdown || []}
              size="md"
            />
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Preview Panel */}
          <MediaPreviewPanel
            asset={asset}
            currentDisplayUrl={currentDisplayUrl}
            viewEnhanced={viewEnhanced}
            setViewEnhanced={setViewEnhanced}
            hasEnhanced={hasEnhanced}
            hasGps={hasGps}
            isExifLocation={isExifLocation}
            lat={lat}
            lng={lng}
            duplicates={duplicates}
            loadingDuplicates={loadingDuplicates}
            onCheckDuplicates={handleCheckDuplicates}
          />

          {/* Right: AI Intelligence Hub */}
          <div className="lg:col-span-7 flex flex-col">
            {/* Tabs Navigation */}
            <div className="flex border-b border-gray-200 space-x-1 mb-4">
              <button
                onClick={() => setActiveTab('groq')}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'groq'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Bot size={14} />
                <span>Groq AI</span>
              </button>
              <button
                onClick={() => setActiveTab('cloudinary_vision')}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'cloudinary_vision'
                    ? 'border-cyan-600 text-cyan-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Sparkles size={14} className="text-cyan-500" />
                <span>Cloudinary Vision</span>
              </button>
              <button
                onClick={() => setActiveTab('derivatives')}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'derivatives'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Layers size={14} />
                <span>Derivatives</span>
              </button>
              <button
                onClick={() => setActiveTab('signed_url')}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'signed_url'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Lock size={14} className="text-emerald-500" />
                <span>Donor Link</span>
              </button>
            </div>

            {activeTab === 'groq' && <GroqTab asset={asset} />}
            {activeTab === 'cloudinary_vision' && (
              <CloudinaryVisionTab
                visionAnalysis={visionAnalysis}
                customQuestion={customQuestion}
                setCustomQuestion={setCustomQuestion}
                askingVision={askingVision}
                onAskVision={handleAskCloudinaryVision}
              />
            )}
            {activeTab === 'derivatives' && (
              <DerivativesTab derivatives={asset.derivatives || []} />
            )}
            {activeTab === 'signed_url' && (
              <SignedDonorLinkTab
                signedDuration={signedDuration}
                setSignedDuration={setSignedDuration}
                generatingSigned={generatingSigned}
                signedData={signedData}
                copiedLink={copiedLink}
                onGenerateSignedUrl={handleGenerateSignedUrl}
                onCopySignedUrl={handleCopySignedUrl}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <span>Public ID:</span>
            <code className="font-mono bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-700">
              {asset.cloudinary?.publicId}
            </code>
          </div>
          <button
            onClick={onClose}
            className="bw-btn-black px-5 py-2 text-xs font-semibold rounded-xl"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

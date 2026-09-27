import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Download,
  ChevronLeft,
  ChevronRight,
  Layers,
  Search,
  SlidersHorizontal,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Share2,
  Grid3X3,
  Sliders,
} from 'lucide-react';
import { API_URL } from '../../config.js';

export const CarouselPostViewer = ({
  projectId,
  reportId,
  initialCarousel = null,
  onCarouselUpdated,
}) => {
  const [carousel, setCarousel] = useState(initialCarousel);
  const [loading, setLoading] = useState(!initialCarousel && Boolean(projectId || reportId));
  const [generating, setGenerating] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedAltIndex, setCopiedAltIndex] = useState(null);
  const [copiedIndividualIndex, setCopiedIndividualIndex] = useState(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [viewMode, setViewMode] = useState('carousel'); // 'carousel' | 'grid'
  const [searchQuery, setSearchQuery] = useState('');
  const [slideCount, setSlideCount] = useState(5);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialCarousel) {
      setCarousel(initialCarousel);
      return;
    }

    const fetchExisting = async () => {
      setLoading(true);
      try {
        const endpoint = reportId
          ? `${API_URL}/api/reports/${reportId}/carousel`
          : `${API_URL}/api/projects/${projectId}/carousel`;

        const res = await fetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          setCarousel(data);
        }
      } catch (err) {
        // Not yet generated is normal
      } finally {
        setLoading(false);
      }
    };

    if (projectId || reportId) {
      fetchExisting();
    }
  }, [projectId, reportId, initialCarousel]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const endpoint = reportId
        ? `${API_URL}/api/reports/${reportId}/carousel`
        : `${API_URL}/api/projects/${projectId}/carousel`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery.trim() || undefined,
          count: Number(slideCount),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to generate carousel post');
      }

      const data = await res.json();
      setCarousel(data);
      setCurrentSlideIndex(0);
      if (onCarouselUpdated) {
        onCarouselUpdated(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyPost = () => {
    if (!carousel) return;
    const fullPost = `${carousel.carouselCaption}\n\n${(carousel.hashtags || []).join(' ')}`;
    navigator.clipboard.writeText(fullPost);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2500);
  };

  const handleCopyIndividual = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndividualIndex(idx);
    setTimeout(() => setCopiedIndividualIndex(null), 2000);
  };

  const handleCopyAlt = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedAltIndex(idx);
    setTimeout(() => setCopiedAltIndex(null), 2000);
  };

  const handleDownloadImage = (img) => {
    if (!img?.imageUrl) return;
    const a = document.createElement('a');
    a.href = img.imageUrl;
    a.target = '_blank';
    a.download = `canopi_carousel_${img.order}_${img.publicId.replace(/\//g, '_')}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500 bg-slate-50 rounded-3xl border border-slate-200/80">
        Loading Carousel Post Intelligence...
      </div>
    );
  }

  if (!carousel) {
    return (
      <div className="p-8 bg-slate-50 rounded-3xl border border-slate-200/80 space-y-6">
        <div className="text-center max-w-lg mx-auto space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center mx-auto mb-3">
            <Layers size={24} />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Multi-Image Social Carousel Generator</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Pulls verified media from <strong>both Comparisons and Media Gallery</strong> using Pinecone semantic search and pHash diversity filtering, paired with Cloudinary AI Vision SEO copy.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl max-w-lg mx-auto">
            {error}
          </div>
        )}

        {/* Generator Controls */}
        <div className="max-w-xl mx-auto bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Semantic Focus Query (Optional)
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. community planting, coastal mangrove restore, biodiversity"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Slide Count</label>
              <select
                value={slideCount}
                onChange={(e) => setSlideCount(Number(e.target.value))}
                className="px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-white"
              >
                <option value={3}>3 Slides (Minimal)</option>
                <option value={4}>4 Slides</option>
                <option value={5}>5 Slides (Recommended)</option>
                <option value={6}>6 Slides</option>
                <option value={8}>8 Slides (Deep Dive)</option>
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white flex items-center space-x-2 transition-all shadow-sm disabled:opacity-50 mt-4"
            >
              <Sparkles size={14} className={generating ? 'animate-spin' : ''} />
              <span>{generating ? 'Selecting & Synthesizing...' : 'Generate Carousel Post'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const images = carousel.images || [];
  const currentImg = images[currentSlideIndex];

  return (
    <div className="space-y-6">
      {/* Top Banner & Multi-Source Intelligence Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900 text-white rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold rounded-lg uppercase tracking-wider flex items-center space-x-1">
              <Sparkles size={11} />
              <span>Semantic Cross-Source Carousel</span>
            </span>
            <span className="text-[10px] text-gray-400 bg-white/10 px-2 py-0.5 rounded-md font-mono">
              {images.length} Verified Slides
            </span>
          </div>
          <p className="text-xs text-white/80">
            Selected via Pinecone semantic search across <strong>Comparisons + Media Library</strong> with Cloudinary AI Vision SEO copy.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-white/10 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setViewMode('carousel')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center space-x-1 ${
                viewMode === 'carousel' ? 'bg-white text-gray-900 font-bold' : 'text-white/70 hover:text-white'
              }`}
            >
              <Sliders size={12} />
              <span>Swipe Preview</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center space-x-1 ${
                viewMode === 'grid' ? 'bg-white text-gray-900 font-bold' : 'text-white/70 hover:text-white'
              }`}
            >
              <Grid3X3 size={12} />
              <span>All Assets</span>
            </button>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center space-x-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={generating ? 'animate-spin' : ''} />
            <span>{generating ? 'Regenerating...' : 'Regenerate'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
          {error}
        </div>
      )}

      {/* Main Two-Column Layout: Visual Viewer + SEO Copy Block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Carousel Visual Canvas (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {viewMode === 'carousel' ? (
            <div className="bg-black rounded-3xl overflow-hidden shadow-xl border border-gray-800 flex flex-col relative">
              {/* Top Slide Meta Tag */}
              <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${
                      currentImg?.source === 'comparison'
                        ? 'bg-purple-950/80 text-purple-300 border-purple-500/30'
                        : 'bg-blue-950/80 text-blue-300 border-blue-500/30'
                    }`}
                  >
                    {currentImg?.source === 'comparison' ? '🔄 Comparison Evidence' : '🖼️ Media Library'}
                  </span>
                  <span className="px-1.5 py-0.5 bg-black/60 backdrop-blur-md text-emerald-400 text-[10px] font-mono rounded-md border border-white/10">
                    {currentImg?.semanticScore}% match
                  </span>
                </div>

                <span className="px-2 py-0.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-mono rounded-md border border-white/10">
                  {currentSlideIndex + 1} / {images.length}
                </span>
              </div>

              {/* Main Image Display */}
              <div className="aspect-[4/5] relative bg-gray-950 flex items-center justify-center">
                {currentImg?.imageUrl ? (
                  <img
                    src={currentImg.imageUrl}
                    alt={currentImg.altText}
                    className="w-full h-full object-cover select-none animate-in fade-in duration-300"
                  />
                ) : (
                  <div className="text-gray-500 text-xs flex flex-col items-center">
                    <ImageIcon size={32} className="mb-2 opacity-50" />
                    <span>Image unavailable</span>
                  </div>
                )}

                {/* Left / Right Navigation Buttons */}
                <button
                  onClick={() =>
                    setCurrentSlideIndex((prev) => (prev - 1 + images.length) % images.length)
                  }
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-sm transition-all z-20"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setCurrentSlideIndex((prev) => (prev + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-sm transition-all z-20"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Slide Thumbnail Navigation Strip */}
              <div className="p-3 bg-gray-950 border-t border-gray-800 flex items-center space-x-2 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlideIndex(idx)}
                    className={`relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                      idx === currentSlideIndex
                        ? 'border-cyan-400 scale-105 shadow-md'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                    <span className="absolute bottom-0.5 right-0.5 text-[8px] bg-black/80 text-white px-1 rounded font-mono">
                      {idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Grid View of All Selected Images */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm space-y-2 flex flex-col justify-between"
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/70 text-white text-[9px] font-bold rounded">
                      #{img.order}
                    </span>
                    <span
                      className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                        img.source === 'comparison'
                          ? 'bg-purple-600 text-white'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {img.source === 'comparison' ? 'Compare' : 'Media'}
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px]">
                    <p className="text-gray-700 line-clamp-2 italic leading-tight">
                      "{img.individualCaption}"
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                      <button
                        onClick={() => handleCopyIndividual(img.individualCaption, idx)}
                        className="text-[10px] text-cyan-700 font-semibold hover:underline"
                      >
                        {copiedIndividualIndex === idx ? 'Copied!' : 'Copy Caption'}
                      </button>
                      <button
                        onClick={() => handleDownloadImage(img)}
                        className="text-gray-400 hover:text-gray-700 p-1"
                      >
                        <Download size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active Slide Alt Text & Individual Standalone Copy Card */}
          {viewMode === 'carousel' && currentImg && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 flex items-center space-x-1.5">
                  <FileText size={13} className="text-cyan-600" />
                  <span>Slide {currentImg.order} Standalone Posting Details</span>
                </span>
                <button
                  onClick={() => handleDownloadImage(currentImg)}
                  className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-medium flex items-center space-x-1 transition-colors shadow-sm"
                >
                  <Download size={12} />
                  <span>Download Slide</span>
                </button>
              </div>

              {/* Alt Text (Accessibility & SEO) */}
              <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Accessibility & SEO Alt Text (Cloudinary AI Vision)
                  </span>
                  <button
                    onClick={() => handleCopyAlt(currentImg.altText, currentSlideIndex)}
                    className="text-[11px] text-cyan-600 font-semibold hover:underline flex items-center space-x-1"
                  >
                    {copiedAltIndex === currentSlideIndex ? <Check size={11} /> : <Copy size={11} />}
                    <span>{copiedAltIndex === currentSlideIndex ? 'Copied' : 'Copy Alt'}</span>
                  </button>
                </div>
                <p className="text-xs text-gray-700 font-mono leading-relaxed">{currentImg.altText}</p>
              </div>

              {/* Individual Single-Image Caption */}
              <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Standalone Image Caption
                  </span>
                  <button
                    onClick={() =>
                      handleCopyIndividual(currentImg.individualCaption, currentSlideIndex)
                    }
                    className="text-[11px] text-cyan-600 font-semibold hover:underline flex items-center space-x-1"
                  >
                    {copiedIndividualIndex === currentSlideIndex ? (
                      <Check size={11} />
                    ) : (
                      <Copy size={11} />
                    )}
                    <span>
                      {copiedIndividualIndex === currentSlideIndex ? 'Copied' : 'Copy Caption'}
                    </span>
                  </button>
                </div>
                <p className="text-xs text-gray-800 leading-relaxed font-medium">
                  {currentImg.individualCaption}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Overarching SEO Carousel Copy Block (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 bg-white rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h4 className="text-sm font-bold text-gray-800 flex items-center space-x-1.5">
                <Share2 size={15} className="text-cyan-600" />
                <span>Overarching Carousel Post Copy</span>
              </h4>
              <button
                onClick={handleCopyPost}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
              >
                {copiedCaption ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedCaption ? 'Copied Full Post!' : 'Copy Post'}</span>
              </button>
            </div>

            {/* Post Caption Body */}
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Social Caption & Hook (SEO Optimized)
              </span>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-gray-800 font-sans whitespace-pre-wrap leading-relaxed">
                {carousel.carouselCaption}
              </div>
            </div>

            {/* Verified Hashtags */}
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Sector & Semantic Tags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(carousel.hashtags || []).map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-cyan-50 text-cyan-800 border border-cyan-200/60 rounded-lg text-xs font-semibold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Source Distribution Breakdown */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 space-y-1.5 text-xs text-gray-600">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Source Composition Breakdown
              </span>
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center space-x-1 text-purple-700 font-medium">
                  <span>🔄 Comparison Evidence:</span>
                </span>
                <span className="font-mono font-bold">
                  {images.filter((i) => i.source === 'comparison').length} slides
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center space-x-1 text-blue-700 font-medium">
                  <span>🖼️ Media Explorer Gallery:</span>
                </span>
                <span className="font-mono font-bold">
                  {images.filter((i) => i.source === 'media_library').length} slides
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

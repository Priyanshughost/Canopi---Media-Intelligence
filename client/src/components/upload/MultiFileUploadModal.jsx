import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileImage,
  Film,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Plus,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { API_URL } from '../../config.js';

export const MultiFileUploadModal = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  onAssetUploaded,
  onComplete,
}) => {
  const [fileQueue, setFileQueue] = useState([]); // [{ id, file, name, size, type, previewUrl, status, progress, result, error }]
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Clean up object URLs when modal unmounts or queue items change
  useEffect(() => {
    return () => {
      fileQueue.forEach((item) => {
        if (item.previewUrl && item.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, []);

  if (!isOpen) return null;

  const handleFilesSelected = (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newItems = Array.from(selectedFiles).map((file) => {
      const isVideo = file.type.startsWith('video/');
      return {
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        name: file.name,
        size: file.size,
        type: isVideo ? 'video' : 'image',
        previewUrl: URL.createObjectURL(file),
        status: 'pending', // 'pending' | 'uploading' | 'processing' | 'completed' | 'error'
        progress: 0,
        result: null,
        error: null,
      };
    });

    setFileQueue((prev) => [...prev, ...newItems]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const removeFileFromQueue = (id) => {
    setFileQueue((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.previewUrl && item.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const uploadSingleFile = (queueItem) => {
    return new Promise((resolve) => {
      const formData = new FormData();
      formData.append('file', queueItem.file);
      formData.append('projectId', projectId);

      const xhr = new XMLHttpRequest();

      // Track upload progress (0% - 95%)
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 90);
          setFileQueue((prev) =>
            prev.map((item) =>
              item.id === queueItem.id
                ? { ...item, status: 'uploading', progress: percent }
                : item
            )
          );
        }
      };

      // When upload bytes finish and backend starts Cloudinary AI processing
      xhr.upload.onload = () => {
        setFileQueue((prev) =>
          prev.map((item) =>
            item.id === queueItem.id
              ? { ...item, status: 'processing', progress: 95 }
              : item
          )
        );
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const asset = JSON.parse(xhr.responseText);
            setFileQueue((prev) =>
              prev.map((item) =>
                item.id === queueItem.id
                  ? {
                      ...item,
                      status: 'completed',
                      progress: 100,
                      result: asset,
                      previewUrl:
                        asset.thumbnailUrl ||
                        asset.cloudinary?.secureUrl ||
                        item.previewUrl,
                    }
                  : item
              )
            );

            // Immediately update the parent/gallery in real-time as each asset completes!
            if (onAssetUploaded) {
              onAssetUploaded(asset);
            }
            resolve({ success: true, asset });
          } catch (err) {
            setFileQueue((prev) =>
              prev.map((item) =>
                item.id === queueItem.id
                  ? {
                      ...item,
                      status: 'error',
                      error: 'Failed to parse response',
                    }
                  : item
              )
            );
            resolve({ success: false, error: 'Parse error' });
          }
        } else {
          let errorMsg = 'Upload failed';
          try {
            const errObj = JSON.parse(xhr.responseText);
            errorMsg = errObj.error || errorMsg;
          } catch (e) {
            errorMsg = `HTTP Error ${xhr.status}`;
          }
          setFileQueue((prev) =>
            prev.map((item) =>
              item.id === queueItem.id
                ? { ...item, status: 'error', error: errorMsg }
                : item
            )
          );
          resolve({ success: false, error: errorMsg });
        }
      };

      xhr.onerror = () => {
        setFileQueue((prev) =>
          prev.map((item) =>
            item.id === queueItem.id
              ? { ...item, status: 'error', error: 'Network error occurred' }
              : item
          )
        );
        resolve({ success: false, error: 'Network error' });
      };

      xhr.open('POST', `${API_URL}/api/assets/upload`, true);
      xhr.send(formData);
    });
  };

  const startBatchUpload = async () => {
    const pendingItems = fileQueue.filter(
      (item) => item.status === 'pending' || item.status === 'error'
    );
    if (pendingItems.length === 0) return;

    setIsUploading(true);

    // Upload files concurrently (2 at a time for optimal Cloudinary ingestion & bandwidth)
    const CONCURRENCY = 2;
    const queueToProcess = [...pendingItems];

    const worker = async () => {
      while (queueToProcess.length > 0) {
        const item = queueToProcess.shift();
        if (item) {
          await uploadSingleFile(item);
        }
      }
    };

    const workers = Array.from(
      { length: Math.min(CONCURRENCY, queueToProcess.length) },
      () => worker()
    );
    await Promise.all(workers);

    setIsUploading(false);
  };

  const completedCount = fileQueue.filter((i) => i.status === 'completed').length;
  const totalCount = fileQueue.length;
  const overallProgress =
    totalCount > 0
      ? Math.round(
          fileQueue.reduce((acc, curr) => acc + (curr.progress || 0), 0) /
            totalCount
        )
      : 0;

  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white rounded-t-3xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Upload size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Batch Media Upload</h2>
              <p className="text-xs text-slate-400">
                Project:{' '}
                <strong className="text-slate-200">{projectName || 'Selected Project'}</strong> •
                Select multiple photos & videos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-cyan-500 bg-cyan-50/50 scale-[1.01]'
                : 'border-gray-200 hover:border-gray-400 bg-slate-50/60 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => handleFilesSelected(e.target.files)}
              disabled={isUploading}
            />
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-cyan-600">
                <Upload size={26} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">
                  Click to select multiple files or drag & drop here
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supports multiple <strong>photos</strong> (JPG, PNG, WEBP) & <strong>videos</strong> (MP4, MOV, WEBM up to 100MB)
                </p>
              </div>
            </div>
          </div>

          {/* Overall Batch Progress Header */}
          {totalCount > 0 && (
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-700">
                  Upload Status: {completedCount} of {totalCount} Completed
                </span>
                <span className="font-mono font-bold text-cyan-600">
                  {overallProgress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-cyan-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload Queue / Processed Media List */}
          {fileQueue.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Selected Media Queue ({fileQueue.length})
                </h3>
                {!isUploading && (
                  <button
                    onClick={() => setFileQueue([])}
                    className="text-[11px] text-gray-500 hover:text-red-600 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {fileQueue.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center space-x-3.5 ${
                      item.status === 'completed'
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : item.status === 'error'
                        ? 'bg-red-50/40 border-red-200'
                        : item.status === 'processing'
                        ? 'bg-purple-50/40 border-purple-200'
                        : item.status === 'uploading'
                        ? 'bg-cyan-50/40 border-cyan-200'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    {/* Thumbnail Preview */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-900 flex-shrink-0 relative">
                      <img
                        src={item.previewUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      {item.type === 'video' && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                          <Film size={16} />
                        </div>
                      )}
                    </div>

                    {/* File Info & Live Progress */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-800 truncate" title={item.name}>
                          {item.name}
                        </p>
                        <span className="text-[10px] text-gray-500 font-mono flex-shrink-0 ml-2">
                          {formatFileSize(item.size)}
                        </span>
                      </div>

                      {/* State Display */}
                      {item.status === 'pending' && (
                        <div className="flex items-center space-x-1 text-[11px] text-gray-500">
                          <span className="w-2 h-2 rounded-full bg-gray-400" />
                          <span>Ready to upload</span>
                        </div>
                      )}

                      {item.status === 'uploading' && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-cyan-700 font-medium">
                            <span className="flex items-center space-x-1">
                              <Loader2 size={12} className="animate-spin" />
                              <span>Uploading to Cloudinary...</span>
                            </span>
                            <span className="font-mono">{item.progress}%</span>
                          </div>
                          <div className="w-full bg-cyan-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-cyan-500 h-full transition-all duration-150"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {item.status === 'processing' && (
                        <div className="flex items-center space-x-1.5 text-[11px] text-purple-700 font-semibold">
                          <Sparkles size={13} className="animate-spin text-purple-600" />
                          <span>Analyzing with Cloudinary AI & Pinecone indexing...</span>
                        </div>
                      )}

                      {item.status === 'completed' && item.result && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center space-x-1">
                            <CheckCircle2 size={11} />
                            <span>Uploaded & Verified</span>
                          </span>

                          {item.result.trustScore !== undefined && (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-full flex items-center space-x-1">
                              <ShieldCheck size={11} className="text-cyan-600" />
                              <span>Trust: {item.result.trustScore}/100</span>
                            </span>
                          )}

                          {item.result.possibleDuplicates?.length > 0 && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full flex items-center space-x-1">
                              <ShieldAlert size={11} />
                              <span>{item.result.possibleDuplicates.length} Similar Asset(s)</span>
                            </span>
                          )}

                          {item.result.mediaType === 'video' && item.result.videoTranscript?.length > 0 && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-full">
                              {item.result.videoTranscript.length} Scene Transcripts
                            </span>
                          )}
                        </div>
                      )}

                      {item.status === 'error' && (
                        <div className="flex items-center space-x-1 text-[11px] text-red-600">
                          <AlertCircle size={13} />
                          <span>{item.error || 'Upload error'}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions Right */}
                    <div className="flex-shrink-0 flex items-center space-x-1">
                      {item.status === 'pending' && !isUploading && (
                        <button
                          onClick={() => removeFileFromQueue(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                          title="Remove from queue"
                        >
                          <X size={16} />
                        </button>
                      )}

                      {item.status === 'error' && !isUploading && (
                        <button
                          onClick={() => uploadSingleFile(item)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-xs font-semibold flex items-center space-x-1"
                          title="Retry this file"
                        >
                          <RefreshCw size={14} />
                          <span>Retry</span>
                        </button>
                      )}

                      {item.status === 'completed' && (
                        <div className="p-1 text-emerald-600">
                          <CheckCircle2 size={18} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/80 flex flex-wrap items-center justify-between gap-3 rounded-b-3xl">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-all shadow-sm disabled:opacity-50"
            >
              <Plus size={14} />
              <span>Add More Files</span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              disabled={isUploading}
              className="px-5 py-2.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
            >
              {completedCount > 0 ? 'Done' : 'Cancel'}
            </button>

            {fileQueue.some((i) => i.status === 'pending' || i.status === 'error') ? (
              <button
                onClick={startBatchUpload}
                disabled={isUploading || fileQueue.length === 0}
                className="bw-btn-black px-6 py-2.5 text-xs font-semibold text-white rounded-xl flex items-center space-x-2 shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 size={15} className="animate-spin text-cyan-400" />
                ) : (
                  <Upload size={15} className="text-cyan-400" />
                )}
                <span>
                  {isUploading
                    ? 'Uploading Files...'
                    : `Upload ${fileQueue.filter((i) => i.status === 'pending' || i.status === 'error').length} Selected File(s)`}
                </span>
              </button>
            ) : completedCount > 0 ? (
              <button
                onClick={() => {
                  if (onComplete) onComplete();
                  onClose();
                }}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-all shadow-md"
              >
                <CheckCircle2 size={15} />
                <span>All Finished ({completedCount} Uploaded)</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

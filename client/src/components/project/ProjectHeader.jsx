import React from 'react';
import { MapPin, Calendar, Trash2, Loader2, Upload } from 'lucide-react';

export const ProjectHeader = ({
  project,
  uploading,
  onFileUpload,
  onOpenUploadModal,
  onProjectDelete,
}) => {
  if (!project) return null;

  return (
    <div className="bw-card-white p-8 rounded-3xl border border-gray-100 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <span className="px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">
              {project.status}
            </span>
            <span className="text-sm text-gray-500">{project.organization}</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-4">{project.name}</h1>
          <p className="text-gray-600 max-w-2xl leading-relaxed">{project.description}</p>

          <div className="flex items-center space-x-6 mt-6">
            {project.locations?.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin size={16} className="text-emerald-500" />
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
            onClick={onProjectDelete}
            className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-red-100 bg-white"
            title="Delete Project"
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={onOpenUploadModal || onFileUpload}
            className="bw-btn-black px-6 py-3 font-semibold flex items-center space-x-2 transition-all hover:scale-105 active:scale-95 shadow-md"
          >
            <Upload size={18} className="text-cyan-400" />
            <span>Upload Media (Photos & Videos)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

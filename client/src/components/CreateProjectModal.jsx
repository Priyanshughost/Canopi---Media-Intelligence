import { API_URL } from '../config.js';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Sparkles, Languages, Undo2, Check } from 'lucide-react';

export const CreateProjectModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    description: '',
    location: '',
    status: 'ACTIVE'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isParaphrasing, setIsParaphrasing] = useState(false);
  const [originalDescription, setOriginalDescription] = useState('');
  const [paraphrasedNotice, setParaphrasedNotice] = useState(false);

  if (!isOpen) return null;

  const handleParaphrase = async () => {
    if (!formData.description || !formData.description.trim()) {
      setError('Please write some notes or description in your local language first.');
      return;
    }
    setError(null);
    setIsParaphrasing(true);
    try {
      const res = await fetch(`${API_URL}/api/projects/paraphrase-description`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: formData.description,
          name: formData.name,
          organization: formData.organization,
          location: formData.location,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to paraphrase description');
      }

      const data = await res.json();
      if (data.paraphrased) {
        setOriginalDescription(formData.description);
        setFormData((prev) => ({ ...prev, description: data.paraphrased }));
        setParaphrasedNotice(true);
        setTimeout(() => setParaphrasedNotice(false), 6000);
      }
    } catch (err) {
      setError(err.message || 'Error occurred while paraphrasing');
    } finally {
      setIsParaphrasing(false);
    }
  };

  const handleRestoreOriginal = () => {
    if (originalDescription) {
      setFormData((prev) => ({ ...prev, description: originalDescription }));
      setOriginalDescription('');
      setParaphrasedNotice(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const locations = formData.location ? [formData.location] : [];
      const payload = { ...formData, locations };

      const res = await fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to create project');
      const newProj = await res.json();
      if (typeof onSuccess === 'function') {
        onSuccess(newProj);
      }
      onClose();
      // Reset form
      setFormData({
        name: '',
        organization: '',
        description: '',
        location: '',
        status: 'ACTIVE'
      });
      setOriginalDescription('');
      setParaphrasedNotice(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200">
      <div className="bg-[#18181B] rounded-2xl p-8 max-w-lg w-full shadow-2xl relative border border-zinc-800 max-h-[90vh] overflow-y-auto hide-scrollbar">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors">
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold mb-2 text-white">Create New Project</h2>
        <p className="text-sm mb-6 text-gray-400">Initialize a new impact tracking initiative.</p>

        {error && <div className="mb-6 p-4 bg-red-900/30 border border-red-800 text-red-400 rounded-xl text-sm font-medium">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-300">Project Name</label>
            <input required type="text" className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-colors placeholder:text-gray-500" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Community Afforestation" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-300">Organization</label>
            <input required type="text" className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-colors placeholder:text-gray-500" value={formData.organization} onChange={e => setFormData({ ...formData, organization: e.target.value })} placeholder="e.g. Green Canopy NGO" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                Description
              </label>
              <div className="flex items-center space-x-2">
                {originalDescription && (
                  <button
                    type="button"
                    onClick={handleRestoreOriginal}
                    className="text-[11px] text-zinc-400 hover:text-white flex items-center space-x-1 transition-colors px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700"
                    title="Revert to original local language text"
                  >
                    <Undo2 size={12} />
                    <span>Undo AI</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleParaphrase}
                  disabled={isParaphrasing || !formData.description.trim()}
                  className="px-2.5 py-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/40 text-cyan-300 text-[11px] font-semibold rounded-lg flex items-center space-x-1.5 transition-all shadow-sm hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                  title="Paraphrase & translate local language to professional English using AI"
                >
                  {isParaphrasing ? (
                    <>
                      <Loader2 size={12} className="animate-spin text-cyan-400" />
                      <span>Paraphrasing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={12} className="text-cyan-400" />
                      <Languages size={12} className="text-cyan-400" />
                      <span>Paraphrase to English</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <textarea
              required
              rows="3"
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-cyan-500 outline-none resize-none transition-colors placeholder:text-gray-500"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter description or field notes (supports local languages, regional notes, or drafts)..."
            />
            <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1 px-1">
              <span>Write in your local language or draft notes, then click <b>Paraphrase to English</b>.</span>
              {paraphrasedNotice && (
                <span className="text-emerald-400 flex items-center space-x-1 font-medium animate-in fade-in duration-300">
                  <Check size={12} />
                  <span>English generated by AI</span>
                </span>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-300">Location</label>
            <input required type="text" className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-colors placeholder:text-gray-500" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="e.g. Jharkhand, Sector 4, Village A" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-300">Status</label>
            <select className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-colors cursor-pointer" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
              <option value="PLANNED">Planned</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div className="pt-6 flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-5 py-3 text-sm font-bold text-gray-400 hover:text-white transition-colors">Cancel</button>
            <button type="submit" disabled={loading || isParaphrasing} className="bg-white text-slate-800 px-8 py-3 rounded-xl text-sm font-bold flex items-center space-x-2 disabled:opacity-70 transition-transform hover:scale-105 active:scale-95 shadow-md">
              {loading && <Loader2 size={16} className="animate-spin" />}
              <span>{loading ? 'Creating...' : 'Create Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

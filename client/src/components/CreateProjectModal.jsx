import { API_URL } from '../config.js';
import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

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

  if (!isOpen) return null;

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
      onSuccess(newProj);
      onClose();
      // Reset form
      setFormData({
        name: '',
        organization: '',
        description: '',
        location: '',
        status: 'ACTIVE'
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200">
      <div className="bg-[#18181B] rounded-2xl p-8 max-w-md w-full shadow-2xl relative border border-zinc-800 max-h-[90vh] overflow-y-auto hide-scrollbar">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors">
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold mb-2 text-gray-400">Create New Project</h2>
        <p className="text-sm mb-8 text-gray-400">Initialize a new impact tracking initiative.</p>

        {error && <div className="mb-6 p-4 bg-red-900/30 border border-red-800 text-red-400 rounded-xl text-sm font-medium">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-300">Project Name</label>
            <input required type="text" className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-white outline-none transition-colors placeholder:text-gray-800" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Community Afforestation" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-300">Organization</label>
            <input required type="text" className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-white outline-none transition-colors placeholder:text-gray-600" value={formData.organization} onChange={e => setFormData({ ...formData, organization: e.target.value })} placeholder="e.g. Green Canopy NGO" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-300">Description</label>
            <textarea required rows="3" className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-white outline-none resize-none transition-colors placeholder:text-gray-600" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the initiative..." />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-300">Location</label>
            <input required type="text" className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-white outline-none transition-colors placeholder:text-gray-600" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="e.g. Jharkhand, Sector 4, Village A" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-300">Status</label>
            <select className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-white outline-none transition-colors cursor-pointer" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
              <option value="PLANNED">Planned</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div className="pt-6 flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-5 py-3 text-sm font-bold text-gray-400 hover:text-white transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="bg-white text-slate-800 px-8 py-3 rounded-xl text-sm font-bold flex items-center space-x-2 disabled:opacity-70 transition-transform hover:scale-105 active:scale-95 shadow-md">
              {loading && <Loader2 size={16} className="animate-spin" />}
              <span>{loading ? 'Creating...' : 'Create Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

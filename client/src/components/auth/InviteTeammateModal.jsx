import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, UserPlus, Loader2, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const InviteTeammateModal = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);

  const { inviteTeammate, organization } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await inviteTeammate({ name, email, password: password || undefined });
      setSuccessData(res);
    } catch (err) {
      setError(err.message || 'Failed to add teammate.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!successData) return;
    const text = `Workspace: ${organization?.name}\nEmail: ${successData.user?.email}\nPassword: ${successData.temporaryPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleResetAndClose = () => {
    setName('');
    setEmail('');
    setPassword('');
    setError('');
    setSuccessData(null);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#18181B] rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative border border-zinc-800 max-h-[90vh] overflow-y-auto hide-scrollbar text-white">
        <button
          onClick={handleResetAndClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
            <UserPlus size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Add Teammate</h2>
            <p className="text-xs text-gray-400">
              Join {organization?.name || 'Organization Workspace'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle size={15} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {successData ? (
          <div className="mt-5 space-y-4 animate-in fade-in">
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-xs space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                <CheckCircle2 size={16} />
                <span>Teammate Added Successfully!</span>
              </div>
              <p className="text-slate-300">
                Share these login credentials with <b>{successData.user?.name}</b> so they can access the workspace:
              </p>
              <div className="bg-black/60 p-3 rounded-xl border border-zinc-700 font-mono text-[11px] text-slate-200 space-y-1">
                <div>Email: <span className="text-cyan-400">{successData.user?.email}</span></div>
                <div>Password: <span className="text-emerald-400">{successData.temporaryPassword}</span></div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyCredentials}
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all shadow-sm"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Credentials Copied!' : 'Copy Login Details'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetAndClose}
              className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Teammate Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Ranger"
                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-colors placeholder:text-gray-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Teammate Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@organization.org"
                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-colors placeholder:text-gray-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Initial Password (Optional)
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to auto-generate"
                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-colors placeholder:text-gray-600"
              />
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2.5 text-xs font-bold text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl flex items-center space-x-2 transition-all shadow-md disabled:opacity-50"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                <span>{loading ? 'Adding...' : 'Add Teammate'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};

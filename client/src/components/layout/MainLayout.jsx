import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Folder, 
  Image, 
  Search as SearchIcon, 
  ShieldCheck, 
  SlidersHorizontal, 
  FileText, 
  Activity,
  LogOut,
  UserPlus,
  Building,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authFetch } from '../../services/api';
import { InviteTeammateModal } from '../auth/InviteTeammateModal';

const NavItem = ({ to, icon: Icon, label, active, count }) => (
  <Link
    to={to}
    className={`flex items-center justify-between px-5 py-3.5 my-1.5 rounded-2xl text-sm font-semibold transition-all duration-300 ${
      active
        ? 'shadow-sm'
        : 'text-gray-500 hover:text-gray-900 hover:bg-black/5'
    }`}
    style={{
      backgroundColor: active ? 'var(--sidebar-active-bg)' : 'transparent',
      color: active ? 'var(--sidebar-active-text)' : undefined,
    }}
  >
    <div className="flex items-center space-x-3.5">
      <Icon size={18} className={active ? 'text-gray-900' : 'text-gray-500'} />
      <span className="tracking-tight">{label}</span>
    </div>
    {count !== undefined && (
      <span 
        className="px-2 py-0.5 text-[10px] font-bold rounded-full transition-colors"
        style={{
          backgroundColor: active ? 'rgba(0,0,0,0.1)' : 'var(--card-primary-shadow-dark)',
          color: active ? 'var(--sidebar-active-text)' : 'inherit'
        }}
      >
        {count}
      </span>
    )}
  </Link>
);

export const MainLayout = () => {
  const location = useLocation();
  const { user, organization, logout } = useAuth();
  const [counts, setCounts] = useState({ projects: 0, evidence: 0 });
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Derive dynamic greeting based on system time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [projsRes, evRes] = await Promise.all([
          authFetch('/api/projects'),
          authFetch('/api/evidence')
        ]);
        if (projsRes.ok && evRes.ok) {
          const projs = await projsRes.json();
          const evs = await evRes.json();
          setCounts({ 
            projects: Array.isArray(projs) ? projs.length : 0, 
            evidence: Array.isArray(evs) ? evs.filter(e => !e.verified).length : 0
          });
        }
      } catch (err) {
        console.error('Failed to fetch sidebar counts:', err);
      }
    };
    fetchCounts();
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-white overflow-hidden p-0 m-0">
      {/* Outer Container holding the entire app */}
      <div className="w-full h-full flex overflow-hidden relative z-10 bg-white">

        {/* Sidebar */}
        <aside 
          className="w-72 my-3 ml-3 rounded-3xl flex flex-col z-20 h-[calc(100vh-1.5rem)] overflow-y-auto hide-scrollbar shadow-sm transition-colors duration-300 shrink-0 border border-slate-200/50" 
          style={{ backgroundColor: 'var(--sidebar-bg)' }}
        >
          {/* Logo Area */}
          <div className="p-6 md:p-8 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors shadow-sm" style={{ backgroundColor: 'var(--sidebar-active-bg)' }}>
              <Activity size={18} style={{ color: 'var(--sidebar-active-text)' }} />
            </div>
            <span className="text-2xl font-extrabold font-heading tracking-tight" style={{ color: 'var(--sidebar-active-bg)' }}>Canopi</span>
          </div>

          <nav className="flex-1 px-4 py-2 overflow-y-auto space-y-6 hide-scrollbar">
            <div>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-5 mb-3">Intelligence</h4>
              <NavItem to="/" icon={Home} label="Dashboard" active={location.pathname === '/'} />
              <NavItem to="/projects" icon={Folder} label="Projects" active={location.pathname.startsWith('/projects')} count={counts.projects || undefined} />
              <NavItem to="/media" icon={Image} label="Media" active={location.pathname.startsWith('/media')} />
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-5 mb-3">Analysis</h4>
              <NavItem to="/search" icon={SearchIcon} label="Semantic Search" active={location.pathname === '/search'} />
              <NavItem to="/evidence" icon={ShieldCheck} label="Evidence" active={location.pathname === '/evidence'} count={counts.evidence || undefined} />
              <NavItem to="/comparison" icon={SlidersHorizontal} label="Comparisons" active={location.pathname === '/comparison'} />
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-5 mb-3">Output</h4>
              <NavItem to="/reports" icon={FileText} label="Reports" active={location.pathname.startsWith('/reports')} />
            </div>
          </nav>

          {/* User Profile & Org Card in Sidebar Bottom */}
          <div className="p-4 mx-3 mb-3 bg-white/70 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm space-y-2 mt-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 truncate">
                <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-gray-800 truncate">{user?.name || 'User'}</div>
                  <div className="text-[10px] text-gray-500 truncate">{organization?.name || 'Workspace'}</div>
                </div>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(true)}
                title="Add teammate"
                className="p-1.5 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors shrink-0"
              >
                <UserPlus size={14} />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 h-full overflow-y-auto z-10 p-6 md:p-8 hide-scrollbar bg-white">
          {/* Top Bar for profile and generic actions */}
          <header className="flex justify-between items-center mb-8 flex-wrap gap-4">
            <div className="text-2xl text-slate-700 font-questrial">
              {greeting}, <span className="text-cyan-600 font-semibold">{user?.name || 'Innovator'}</span>
            </div>
            <div className="flex items-center space-x-3">
              {organization && (
                <div className="hidden sm:flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-cyan-50 border border-cyan-200/60 text-cyan-800 text-xs font-semibold shadow-sm">
                  <Building size={13} className="text-cyan-600" />
                  <span>{organization.name}</span>
                  <span className="px-1.5 py-0.2 text-[9px] bg-cyan-200/60 rounded-md font-bold uppercase">{organization.type || 'NGO'}</span>
                </div>
              )}

              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="px-3.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl flex items-center space-x-1.5 shadow-sm transition-all hover:scale-105 active:scale-95"
              >
                <UserPlus size={13} className="text-cyan-600" />
                <span>Invite Teammate</span>
              </button>

              <button
                onClick={logout}
                className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center space-x-1.5 shadow-sm transition-all hover:scale-105 active:scale-95"
              >
                <LogOut size={13} />
                <span>Logout</span>
              </button>
            </div>
          </header>

          <Outlet />
        </main>
      </div>

      <InviteTeammateModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </div>
  );
};

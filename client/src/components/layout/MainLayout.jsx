import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { API_URL } from '../../config.js';
import { Home, Folder, Image, FileText, SearchIcon, ShieldCheck, SlidersHorizontal, Settings, Users, Activity } from 'lucide-react';

const NavItem = ({ to, icon: Icon, label, active, count }) => (
  <Link
    to={to}
    className={`flex items-center justify-between px-5 py-3.5 rounded-full mb-2 transition-all duration-300 ${active
      ? 'shadow-md'
      : 'hover:opacity-80'
      }`}
    style={{
      backgroundColor: active ? 'var(--sidebar-active-bg)' : 'transparent',
      color: active ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)'
    }}
  >
    <div className="flex items-center space-x-4">
      <Icon size={20} strokeWidth={active ? 2.5 : 2} />
      <span className="font-semibold text-sm">{label}</span>
    </div>
    {count !== undefined && (
      <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: active ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', color: active ? 'inherit' : 'var(--sidebar-text)' }}>
        {count}
      </span>
    )}
  </Link>
);

export const MainLayout = () => {
  const location = useLocation();
  const [counts, setCounts] = useState({ projects: 0, evidence: 0 });
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [projsRes, evRes] = await Promise.all([
          fetch(`${API_URL}/api/projects`),
          fetch(`${API_URL}/api/evidence`)
        ]);
        if (projsRes.ok && evRes.ok) {
          const projs = await projsRes.json();
          const evs = await evRes.json();
          setCounts({ 
            projects: projs.length, 
            evidence: evs.filter(e => !e.verified).length // Count pending evidence
          });
        }
      } catch (err) {
        console.error('Failed to fetch sidebar counts:', err);
      }
    };
    fetchCounts();
  }, [location.pathname]); // Refresh counts on navigation

  return (
    <div className="flex h-screen bg-transparent overflow-hidden p-4 md:p-6 lg:p-8">

      {/* Outer Glass Container holding the entire app */}
      <div className="w-full h-full bw-glass-container flex overflow-hidden p-2 space-x-4 relative z-10">

        {/* Sidebar */}
        <aside className="w-72 rounded-3xl flex flex-col z-20 h-full overflow-y-auto hide-scrollbar shadow-sm transition-colors duration-300" style={{ backgroundColor: 'var(--sidebar-bg)' }}>
          {/* Logo Area */}
          <div className="p-8 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ backgroundColor: 'var(--sidebar-active-bg)' }}>
              <Activity size={18} style={{ color: 'var(--sidebar-active-text)' }} />
            </div>
            <span className="text-2xl font-extrabold font-heading tracking-tight" style={{ color: 'var(--sidebar-active-bg)' }}>Canopi</span>
          </div>

          <nav className="flex-1 px-4 py-2 overflow-y-auto space-y-8 hide-scrollbar">
            <div>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-5 mb-4">Intelligence</h4>
              <NavItem to="/" icon={Home} label="Dashboard" active={location.pathname === '/'} />
              <NavItem to="/projects" icon={Folder} label="Projects" active={location.pathname.startsWith('/projects')} count={counts.projects || undefined} />
              <NavItem to="/media" icon={Image} label="Media" active={location.pathname.startsWith('/media')} />
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-5 mb-4">Analysis</h4>
              <NavItem to="/search" icon={SearchIcon} label="Semantic Search" active={location.pathname === '/search'} />
              <NavItem to="/evidence" icon={ShieldCheck} label="Evidence" active={location.pathname === '/evidence'} count={counts.evidence || undefined} />
              <NavItem to="/comparison" icon={SlidersHorizontal} label="Comparisons" active={location.pathname === '/comparison'} />
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-5 mb-4">Output</h4>
              <NavItem to="/reports" icon={FileText} label="Reports" active={location.pathname.startsWith('/reports')} />
            </div>
          </nav>

          <div className="p-6 mt-auto">
            {/* Settings removed per user request */}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 h-full overflow-y-auto z-10 p-4 md:p-6 hide-scrollbar">
          {/* Top Bar for profile and generic actions */}
          <header className="flex justify-between items-center mb-8">
            <div className="text-2xl text-slate-700 font-questrial">
              {greeting}, <span className="text-cyan-600">Innovator</span>
            </div>
            <div className="flex items-center space-x-4">
              {/* Removed useless action buttons */}
            </div>
          </header>

          <Outlet />
        </main>
      </div>
    </div>
  );
};

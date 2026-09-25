import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
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

  return (
    <div className="flex h-screen bg-transparent overflow-hidden p-4 md:p-6 lg:p-8">

      {/* Outer Glass Container holding the entire app */}
      <div className="w-full h-full bw-glass-container flex overflow-hidden p-2 space-x-4">

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
              <NavItem to="/projects" icon={Folder} label="Projects" active={location.pathname.startsWith('/projects')} count={12} />
              <NavItem to="/media" icon={Image} label="Media" active={location.pathname.startsWith('/media')} />
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-5 mb-4">Analysis</h4>
              <NavItem to="/search" icon={SearchIcon} label="Semantic Search" active={location.pathname === '/search'} />
              <NavItem to="/evidence" icon={ShieldCheck} label="Evidence" active={location.pathname === '/evidence'} count={3} />
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
            <div className="text-2xl font-bold text-slate-700">
              {/* Dynamic greeting could go here */}
            </div>
            <div className="flex items-center space-x-4">
              <button className="bw-btn-white flex items-center space-x-2">
                <span>+ Create</span>
              </button>
              <button className="w-10 h-10 rounded-full bw-btn-white flex items-center justify-center hover:opacity-80">
                <SearchIcon size={18} />
              </button>
              <div className="w-10 h-10 rounded-full border-2 overflow-hidden flex items-center justify-center" style={{ borderColor: 'var(--glass-border)', backgroundColor: 'var(--sidebar-bg)' }}>
                <Users size={20} style={{ color: 'var(--sidebar-text)' }} />
              </div>
            </div>
          </header>

          <Outlet />
        </main>
      </div>
    </div>
  );
};

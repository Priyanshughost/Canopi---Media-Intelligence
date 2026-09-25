import { API_URL } from '../config.js';
import { Link } from 'react-router-dom';
import { Plus, ArrowRight, Activity, MapPin } from 'lucide-react';
import { CreateProjectModal } from '../components/CreateProjectModal';

import { useState, useEffect } from 'react';

export const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ activeProjects: 0, totalAssets: 0, verifiedEvidence: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const [projRes, statsRes] = await Promise.all([
          fetch(`${API_URL}/api/projects`),
          fetch(`${API_URL}/api/projects/stats`)
        ]);
        if (!projRes.ok || !statsRes.ok) throw new Error('Failed to fetch data');
        
        const projData = await projRes.json();
        const statsData = await statsRes.json();
        
        setProjects(projData);
        setStats(statsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleNewProjectSuccess = (newProj) => {
    setProjects([newProj, ...projects]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-800 font-semibold mb-2">Projects Overview</h1>
          <p className="text-gray-600">Monitor and analyze environmental impact intelligence.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bw-btn-white px-5 py-2.5 rounded-xl text-sm font-medium text-gray-800 font-semibold flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>New Project</span>
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Active Projects', value: stats.activeProjects.toLocaleString() },
          { label: 'Total Media Assets', value: stats.totalAssets.toLocaleString() },
          { label: 'Verified Evidence', value: stats.verifiedEvidence.toLocaleString() }
        ].map((stat, i) => (
          <div key={i} className="bw-card-white rounded-3xl p-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">{stat.label}</h3>
            <div className="text-3xl font-light text-slate-700 font-semibold tracking-tight">{loading ? '-' : stat.value}</div>
          </div>
        ))}
      </div>

      {/* Projects Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-700">Recent Projects</h2>
          <Link to="/projects" className="text-sm text-gray-600 hover:text-slate-700 flex items-center space-x-1 transition-colors">
            <span>View All</span>
            <ArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div className="text-gray-500 py-10 text-center">Loading projects from database...</div>
        ) : error ? (
          <div className="text-red-500 py-10 text-center">{error}</div>
        ) : projects.length === 0 ? (
          <div className="text-gray-500 py-10 text-center">No projects found. Database is empty.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {projects.map(project => (
              <Link key={project._id} to={`/projects/${project._id}`} className="block group">
                <div className="bw-card-black rounded-3xl p-6 h-full border border-transparent hover:border-gray-700 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 rounded-xl bg-gray-800 text-white group-hover:bg-white group-hover:text-slate-800 transition-colors">
                      <Activity size={20} />
                    </div>
                    <span className="px-2.5 py-1 text-xs font-medium bg-white text-slate-800 rounded-full">
                      {project.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-zinc-50 mb-1">{project.name}</h3>
                  <p className="text-xs text-gray-400 mb-6">
                    {project.description ? project.description.substring(0, 60) + '...' : `Updated ${new Date(project.updatedAt).toLocaleDateString()}`}
                  </p>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-800">
                    <div>
                      <div className="text-lg font-light text-white font-semibold">0</div>
                      <div className="text-[10px] uppercase text-gray-400 tracking-wider">Assets</div>
                    </div>
                    <div>
                      <div className="text-lg font-light text-white font-semibold">{project.locations?.length || 0}</div>
                      <div className="text-[10px] uppercase text-gray-400 tracking-wider">Locs</div>
                    </div>
                    <div>
                      <div className="text-lg font-light text-white font-semibold">-</div>
                      <div className="text-[10px] uppercase text-gray-400 tracking-wider">Tags</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleNewProjectSuccess} 
      />
    </div>
  );
};

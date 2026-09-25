import { API_URL } from '../config.js';
import { Link } from 'react-router-dom';
import { Plus, ArrowRight, Activity, MapPin, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';


import { CreateProjectModal } from '../components/CreateProjectModal';

import { useState, useEffect } from 'react';

export const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [graphData, setGraphData] = useState([]);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({ activeProjects: 0, totalAssets: 0, verifiedEvidence: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const [projRes, statsRes, assetsRes] = await Promise.all([
          fetch(`${API_URL}/api/projects`),
          fetch(`${API_URL}/api/projects/stats`),
          fetch(`${API_URL}/api/assets`)
        ]);
        if (!projRes.ok || !statsRes.ok) throw new Error('Failed to fetch data');
        
        const projData = await projRes.json();
        const statsData = await statsRes.json();
        let allProjects = projData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setProjects(allProjects.slice(0, 3));
        setStats(statsData);

        if (assetsRes?.ok) {
          const assets = await assetsRes.json();
          
          // Generate Graph Data (Last 7 days)
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const counts = {};
          
          for(let i=6; i>=0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            counts[days[d.getDay()]] = 0;
          }

          assets.forEach(asset => {
             const d = new Date(asset.createdAt);
             const now = new Date();
             const diffTime = Math.abs(now - d);
             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
             if(diffDays <= 7) {
                 const dayName = days[d.getDay()];
                 if(counts[dayName] !== undefined) counts[dayName]++;
             }
          });
          
          const gData = Object.keys(counts).map(k => ({ name: k, assets: counts[k] }));
          setGraphData(gData);

          // Generate Activities Feed
          const allActs = [];
          allProjects.slice(0, 5).forEach(p => {
             allActs.push({
                 text: `New Project "${p.name.substring(0,15)}" created`,
                 date: new Date(p.createdAt),
                 icon: <Plus size={14} className="text-cyan-600"/>,
                 color: 'bg-cyan-100'
             });
          });
          assets.slice(0, 15).forEach(a => {
             if(a.processingStatus === 'READY') {
               allActs.push({
                   text: `Analyzed media for "${a.originalFilename.substring(0,15)}..."`,
                   date: new Date(a.updatedAt || a.createdAt),
                   icon: <Activity size={14} className="text-purple-600"/>,
                   color: 'bg-purple-100'
               });
             }
             if(a.verified) {
               allActs.push({
                   text: `Evidence Verified`,
                   date: new Date(a.updatedAt || a.createdAt),
                   icon: <CheckCircle size={14} className="text-emerald-600"/>,
                   color: 'bg-emerald-100'
               });
             }
          });

          allActs.sort((a,b) => b.date - a.date);
          
          const timeSince = (date) => {
            const seconds = Math.floor((new Date() - date) / 1000);
            let interval = seconds / 31536000;
            if (interval > 1) return Math.floor(interval) + " years ago";
            interval = seconds / 2592000;
            if (interval > 1) return Math.floor(interval) + " months ago";
            interval = seconds / 86400;
            if (interval > 1) return Math.floor(interval) + " days ago";
            interval = seconds / 3600;
            if (interval > 1) return Math.floor(interval) + " hours ago";
            interval = seconds / 60;
            if (interval > 1) return Math.floor(interval) + " mins ago";
            return "just now";
          };

          const finalActs = allActs.slice(0, 4).map(act => ({
              ...act,
              time: timeSince(act.date)
          }));
          
          setActivities(finalActs);
        }
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Graph */}
        <div className="lg:col-span-2 bw-card-white rounded-3xl p-6">
          <h2 className="text-xl font-semibold text-slate-700 mb-6">Media Upload Activity</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graphData}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="assets" fill="#0891b2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Recent Activity Feed */}
        <div className="bw-card-white rounded-3xl p-6 flex flex-col">
          <h2 className="text-xl font-semibold text-slate-700 mb-6">Recent Activity</h2>
          <div className="space-y-6 flex-1">
            {activities.length === 0 ? <p className="text-gray-400 text-sm mt-4">No recent activity.</p> : activities.map((activity, i) => (
              <div key={i} className="flex items-start space-x-4">
                <div className={`p-2 rounded-full ${activity.color}`}>
                  {activity.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{activity.text}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
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

import { API_URL } from '../config.js';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Plus, Trash2 } from 'lucide-react';
import { CreateProjectModal } from '../components/CreateProjectModal';

export const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(`${API_URL}/api/projects`);
        if (!response.ok) throw new Error('Failed to fetch projects');
        const data = await response.json();
        setProjects(data);
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

  const handleProjectDelete = async (e, projectId) => {
    e.preventDefault(); // Prevent navigating to the project page
    if (!confirm('Are you sure you want to delete this project and all its assets permanently?')) return;
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete project');
      setProjects(projects.filter(p => p._id !== projectId));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-700 mb-2">Projects</h1>
          <p className="text-gray-600">All sustainability and impact initiatives.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bw-btn-black px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>New Project</span>
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500 py-10 text-center">Loading projects...</div>
      ) : error ? (
        <div className="text-red-500 py-10 text-center">{error}</div>
      ) : projects.length === 0 ? (
        <div className="text-gray-500 py-10 text-center">No projects found.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map(project => (
            <Link key={project._id} to={`/projects/${project._id}`} className="block group">
              <div className="bw-card-white rounded-3xl p-6 h-full transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 rounded-xl bg-gray-100 text-slate-700 group-hover:bg-black group-hover:text-white transition-colors">
                    <Activity size={20} />
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full">
                      {project.status}
                    </span>
                    <button 
                      onClick={(e) => handleProjectDelete(e, project._id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-slate-700 mb-2">{project.name}</h3>
                <p className="text-sm text-gray-600 mb-6 line-clamp-2">
                  {project.description || 'No description provided.'}
                </p>
                
                <div className="pt-4 border-t border-black/5 flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Org: {project.organization || 'Unknown'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {project.locations?.length || 0} Locations
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleNewProjectSuccess} 
      />
    </div>
  );
};

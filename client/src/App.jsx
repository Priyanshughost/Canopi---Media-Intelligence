import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Search } from './pages/Search';
import { Evidence } from './pages/Evidence';
import { Comparison } from './pages/Comparison';
import { Reports } from './pages/Reports';
import { Projects } from './pages/Projects';
import { ProjectDetails } from './pages/ProjectDetails';
import { Media } from './pages/Media';

// Placeholder components for routing
const Placeholder = ({ title }) => (
  <div className="flex items-center justify-center h-full">
    <div className="brutal-card-elevated p-8 rounded-3xl text-center">
      <h2 className="text-xl text-white/90 font-medium mb-2">{title}</h2>
      <p className="text-slate-800 font-medium">Module under construction in Phase 2/3.</p>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetails />} />
          <Route path="media" element={<Media />} />
          <Route path="search" element={<Search />} />
          <Route path="evidence" element={<Evidence />} />
          <Route path="comparison" element={<Comparison />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

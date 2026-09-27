import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { StepSuccessProvider } from './context/StepSuccessContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Search } from './pages/Search';
import { Evidence } from './pages/Evidence';
import { Comparison } from './pages/Comparison';
import { Reports } from './pages/Reports';
import { Projects } from './pages/Projects';
import { ProjectDetails } from './pages/ProjectDetails';
import { Media } from './pages/Media';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StepSuccessProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Workspace Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
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
        </StepSuccessProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

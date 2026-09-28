import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Global fetch interceptor to automatically attach JWT Bearer token
const originalFetch = window.fetch;
window.fetch = async (input, init = {}) => {
  const token = localStorage.getItem('canopi_token');
  
  let headers;
  if (init.headers instanceof Headers) {
    headers = new Headers(init.headers);
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  } else if (Array.isArray(init.headers)) {
    headers = new Headers(init.headers);
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  } else {
    headers = {
      ...(init.headers || {}),
    };
    if (token && !headers['Authorization'] && !headers['authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const newInit = {
    ...init,
    headers,
  };

  const response = await originalFetch(input, newInit);

  // If receiving 401 Unauthorized on non-auth routes, clear token and redirect
  if (response.status === 401) {
    const isAuthRoute =
      window.location.pathname.startsWith('/login') ||
      window.location.pathname.startsWith('/signup') ||
      (typeof input === 'string' &&
        (input.includes('/api/auth/login') ||
          input.includes('/api/auth/signup') ||
          input.includes('/api/auth/demo-credentials') ||
          input.includes('/api/auth/me')));

    if (!isAuthRoute) {
      localStorage.removeItem('canopi_token');
      localStorage.removeItem('canopi_user');
      localStorage.removeItem('canopi_org');
      window.location.href = '/login';
    }
  }

  return response;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

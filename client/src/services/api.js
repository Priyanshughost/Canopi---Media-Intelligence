import { API_URL } from '../config.js';

/**
 * Authenticated fetch helper that automatically attaches JWT from localStorage
 */
export const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem('canopi_token');
  const headers = {
    ...(options.headers || {}),
  };

  // If body is not FormData, default to application/json if not already set
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If token expired or invalid, clear local auth and redirect if not on public routes
    if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/signup')) {
      localStorage.removeItem('canopi_token');
      localStorage.removeItem('canopi_user');
      localStorage.removeItem('canopi_org');
      window.location.href = '/login';
    }
  }

  return response;
};

/**
 * Client API & Asset Resolver
 * 
 * Provides centralized URL resolution for decoupled architectures:
 * - Frontend hosted on GitHub Pages (https://gandupradeep2026.github.io/tuc-badminton-website/)
 * - Backend hosted on Laptop Home Server (Node.js/Express via Cloudflare Tunnel or localtunnel)
 */

// Determine base API URL:
// 1. Check localStorage for admin-configured live tunnel URL
// 2. Check Vite environment variable VITE_API_BASE_URL
// 3. In local development (localhost), default to http://localhost:5000
const getStoredBackendUrl = () => {
  try {
    return localStorage.getItem('tuc_custom_backend_url') || '';
  } catch (e) {
    return '';
  }
};

export function setCustomBackendUrl(url) {
  try {
    if (!url) {
      localStorage.removeItem('tuc_custom_backend_url');
    } else {
      localStorage.setItem('tuc_custom_backend_url', url.trim().replace(/\/+$/, ''));
    }
    window.dispatchEvent(new Event('backend-url-changed'));
  } catch (e) {
    console.error('Failed to set custom backend URL:', e);
  }
}

export function getBaseApiUrl() {
  const customUrl = getStoredBackendUrl();
  if (customUrl) return customUrl;

  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // If in local dev environment
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000';
  }

  return '';
}

/**
 * Resolve full API endpoint URL
 * @param {string} endpoint - e.g. '/api/players' or 'api/tournaments'
 * @returns {string} Fully qualified URL
 */
export function getApiUrl(endpoint) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const baseUrl = getBaseApiUrl();

  if (baseUrl) {
    return `${baseUrl}${cleanEndpoint}`;
  }

  return cleanEndpoint;
}

/**
 * Resolve asset and upload media URLs (photos, PDFs)
 * @param {string} path - e.g. '/uploads/tournament_2026/winners.jpeg'
 * @returns {string} Fully qualified or normalized asset URL
 */
export function getUploadUrl(path) {
  if (!path) return '';
  
  // External or already absolute URLs
  if (/^(https?:|\/\/|data:|blob:)/i.test(path)) {
    return path;
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = getBaseApiUrl();

  // If backend base URL is configured and server is live, resolve against backend
  if (baseUrl && cleanPath.startsWith('/uploads')) {
    return `${baseUrl}${cleanPath}`;
  }

  // Fallback to bundled static assets in GitHub Pages dist
  const basePath = import.meta.env.BASE_URL || './';
  const relativePath = cleanPath.replace(/^\//, '');
  return `${basePath}${relativePath}`.replace(/\/{2,}/g, '/');
}

/**
 * Unified API Fetch helper with automatic base URL, JSON parsing and timeout
 */
export async function apiFetch(endpoint, options = {}) {
  const url = getApiUrl(endpoint);
  const { timeout = 12000, ...fetchOptions } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(id);

    // Parse JSON or text
    const contentType = res.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    if (!res.ok) {
      const errorMsg = (typeof data === 'object' && data?.error) ? data.error : `HTTP ${res.status}: ${res.statusText}`;
      const error = new Error(errorMsg);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    clearTimeout(id);
    if (err.name === 'AbortError') {
      throw new Error('Zeitüberschreitung bei der Verbindung zum Server (Timeout 12s).');
    }
    throw err;
  }
}

// -------------------------------------------------------------
// Transparent Fetch Interceptor for Decoupled Deployments
// Automatically routes all relative `/api/...` calls to backend tunnel
// -------------------------------------------------------------
if (typeof window !== 'undefined' && !window.__tuc_fetch_interceptor_installed) {
  window.__tuc_fetch_interceptor_installed = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = function (resource, init) {
    if (typeof resource === 'string' && (resource.startsWith('/api') || resource.startsWith('api/'))) {
      const resolvedUrl = getApiUrl(resource);
      return originalFetch(resolvedUrl, init);
    }
    return originalFetch(resource, init);
  };
}


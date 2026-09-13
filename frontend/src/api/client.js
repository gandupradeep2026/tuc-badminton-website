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
    const val = localStorage.getItem('tuc_custom_backend_url') || '';
    if (val.includes('onrender.com')) {
      localStorage.removeItem('tuc_custom_backend_url');
      return '';
    }
    return val;
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

  // Live Cloud Backend default (Oracle Cloud Always Free VM with Let's Encrypt HTTPS)
  return 'https://130-61-242-26.sslip.io';
}

/**
 * Check if the backend is configured or if we are purely offline on static GitHub Pages
 */
export function isBackendConfigured() {
  return !!getBaseApiUrl();
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
  if (!path || typeof path !== 'string' || path.includes('images.unsplash.com')) return '';
  
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
 * Safely parse a response body as JSON without throwing SyntaxError on HTML 404s
 */
export async function safeParseJson(res) {
  if (!res) return { isJson: false, data: null, text: '' };

  const contentType = res.headers ? (res.headers.get('content-type') || '') : '';
  const isJson = contentType.includes('application/json');

  let text = '';
  try {
    text = await res.text();
  } catch (e) {
    return { isJson: false, data: null, text: '' };
  }

  if (isJson || (text.trim().startsWith('{') && text.trim().endsWith('}')) || (text.trim().startsWith('[') && text.trim().endsWith(']'))) {
    try {
      const data = JSON.parse(text);
      return { isJson: true, data, text };
    } catch (e) {
      return { isJson: false, data: null, text };
    }
  }

  return { isJson: false, data: null, text };
}

/**
 * Safe fetch helper that:
 * 1. Checks content-type before parsing
 * 2. Never throws "Unexpected token <" SyntaxError
 * 3. Gracefully identifies offline/unreachable states
 * 
 * Returns: { ok: boolean, status: number, data: any, error: string | null, isOffline: boolean, isHtml: boolean }
 */
export async function safeFetchJson(endpointOrUrl, options = {}) {
  const url = endpointOrUrl.startsWith('http://') || endpointOrUrl.startsWith('https://')
    ? endpointOrUrl
    : getApiUrl(endpointOrUrl);

  const { timeout = 12000, ...fetchOptions } = options;

  // If on static GitHub Pages and no backend URL is configured, flag as offline immediately
  if (!isBackendConfigured() && typeof window !== 'undefined' && window.location.hostname.endsWith('.github.io')) {
    return {
      ok: false,
      status: 404,
      data: null,
      error: 'Der Universitätsserver ist derzeit offline.',
      isOffline: true,
      isHtml: true,
    };
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(id);

    const { isJson, data, text } = await safeParseJson(res);
    const isHtml = !isJson && (text.includes('<html') || text.includes('<!DOCTYPE') || (res.headers.get('content-type') || '').includes('text/html'));
    const isOffline = res.status === 404 || res.status === 502 || res.status === 503 || res.status === 504 || isHtml;

    if (!res.ok) {
      const errorMsg = (data && data.error)
        ? data.error
        : (data && data.message)
        ? data.message
        : (isOffline ? 'Der Universitätsserver ist derzeit offline.' : `HTTP-Fehler ${res.status}`);

      return {
        ok: false,
        status: res.status,
        data,
        error: errorMsg,
        isOffline,
        isHtml,
      };
    }

    return {
      ok: true,
      status: res.status,
      data: isJson ? data : text,
      error: null,
      isOffline: false,
      isHtml: false,
    };
  } catch (err) {
    clearTimeout(id);
    const isAbort = err.name === 'AbortError';
    return {
      ok: false,
      status: 0,
      data: null,
      error: isAbort ? 'Zeitüberschreitung (Timeout 12s).' : 'Verbindung zum Server fehlgeschlagen (offline).',
      isOffline: true,
      isHtml: false,
    };
  }
}

/**
 * Unified API Fetch helper with automatic base URL, JSON parsing and timeout
 */
export async function apiFetch(endpoint, options = {}) {
  const result = await safeFetchJson(endpoint, options);
  if (!result.ok) {
    const error = new Error(result.error || `Fehler bei der Abfrage (${result.status})`);
    error.status = result.status;
    error.data = result.data;
    error.isOffline = result.isOffline;
    throw error;
  }
  return result.data;
}

// -------------------------------------------------------------
// Offline Submission Queue Management
// Preserves player & trainer registrations when backend is offline
// -------------------------------------------------------------
const QUEUE_STORAGE_KEY = 'tuc_offline_submissions';

export function getOfflineSubmissions() {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveOfflineSubmission(submission) {
  try {
    const list = getOfflineSubmissions();
    const item = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      createdAt: new Date().toISOString(),
      synced: false,
      ...submission,
    };
    list.push(item);
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('offline-submissions-updated', { detail: list.length }));
    return item;
  } catch (e) {
    console.error('Failed to save offline submission:', e);
    return null;
  }
}

export function removeOfflineSubmission(id) {
  try {
    const list = getOfflineSubmissions().filter((s) => s.id !== id);
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('offline-submissions-updated', { detail: list.length }));
  } catch (e) {
    console.error('Failed to remove offline submission:', e);
  }
}

export function clearOfflineSubmissions() {
  try {
    localStorage.removeItem(QUEUE_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('offline-submissions-updated', { detail: 0 }));
  } catch (e) {
    console.error('Failed to clear offline submissions:', e);
  }
}

/**
 * Synchronize all pending offline registrations to backend
 */
export async function syncOfflineSubmissions() {
  const list = getOfflineSubmissions();
  if (list.length === 0) return { total: 0, synced: 0, failed: 0 };

  const baseUrl = getBaseApiUrl();
  if (!baseUrl) return { total: list.length, synced: 0, failed: list.length, reason: 'no-backend' };

  let synced = 0;
  let failed = 0;

  for (const item of list) {
    try {
      let endpoint = '';
      let bodyData = null;
      let headers = {};

      if (item.type === 'player') {
        endpoint = '/api/register/player';
        const formData = new FormData();
        for (const [key, val] of Object.entries(item.data || {})) {
          formData.append(key, val);
        }
        if (item.photoDataUrl) {
          formData.append('photo_url_input', item.photoDataUrl);
        }
        bodyData = formData;
      } else if (item.type === 'trainer') {
        endpoint = '/api/register/trainer';
        const formData = new FormData();
        for (const [key, val] of Object.entries(item.data || {})) {
          formData.append(key, val);
        }
        if (item.photoDataUrl) {
          formData.append('photo_url_input', item.photoDataUrl);
        }
        bodyData = formData;
      } else if (item.type === 'registration' || item.type === 'inquiry') {
        endpoint = item.type === 'inquiry' ? '/api/inquiries' : '/api/registrations';
        headers = { 'Content-Type': 'application/json' };
        bodyData = JSON.stringify(item.data || {});
      } else if (item.type === 'gallery') {
        endpoint = '/api/gallery/submit';
        const formData = new FormData();
        for (const [key, val] of Object.entries(item.data || {})) {
          formData.append(key, val);
        }
        if (item.photoDataUrl) {
          formData.append('photo_url_input', item.photoDataUrl);
        }
        bodyData = formData;
      }

      if (endpoint && bodyData) {
        const res = await safeFetchJson(endpoint, {
          method: 'POST',
          headers,
          body: bodyData,
        });

        if (res.ok) {
          removeOfflineSubmission(item.id);
          synced++;
        } else {
          failed++;
        }
      }
    } catch (err) {
      failed++;
    }
  }

  return { total: list.length, synced, failed };
}

/**
 * Utility: Convert a File or Blob into a base64 Data URL for persistent offline storage
 */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
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



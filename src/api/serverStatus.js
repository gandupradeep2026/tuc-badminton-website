import { getApiUrl, getBaseApiUrl, safeParseJson, syncOfflineSubmissions } from './client.js';

let currentStatus = {
  state: 'checking', // 'online' | 'offline' | 'checking'
  latency: null,
  timestamp: null,
  venue: null,
  error: null,
  backendUrl: getBaseApiUrl(),
};

const listeners = new Set();

export function subscribeServerStatus(callback) {
  listeners.add(callback);
  callback(currentStatus);
  return () => listeners.delete(callback);
}

function notifyListeners() {
  listeners.forEach((cb) => {
    try {
      cb(currentStatus);
    } catch (e) {
      console.error('Error in status subscriber:', e);
    }
  });
}

export async function checkServerHealth() {
  const startTime = Date.now();
  currentStatus.backendUrl = getBaseApiUrl();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(getApiUrl('/api/health'), {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timer);

    const { isJson, data } = await safeParseJson(res);

    if (res.ok && isJson && data && data.status === 'ok') {
      currentStatus = {
        state: 'online',
        latency: Date.now() - startTime,
        timestamp: data.timestamp || Date.now(),
        venue: data.venue || '12 Badminton-Spielfelder • Thüringer Weg 11',
        error: null,
        backendUrl: getBaseApiUrl(),
      };
      // Trigger background sync for any queued submissions
      syncOfflineSubmissions().catch(() => {});
    } else {
      currentStatus = {
        state: 'offline',
        latency: null,
        timestamp: null,
        venue: null,
        error: res.status === 404 ? 'Server offline (404)' : `HTTP ${res.status}`,
        backendUrl: getBaseApiUrl(),
      };
    }
  } catch (err) {
    currentStatus = {
      state: 'offline',
      latency: null,
      timestamp: null,
      venue: null,
      error: err.message || 'Verbindung fehlgeschlagen',
      backendUrl: getBaseApiUrl(),
    };
  }

  notifyListeners();
  return currentStatus;
}

// Automatically initiate health checks
if (typeof window !== 'undefined') {
  checkServerHealth();
  // Check every 45 seconds
  setInterval(checkServerHealth, 45000);

  // Re-check when user updates tunnel URL
  window.addEventListener('backend-url-changed', () => {
    currentStatus.state = 'checking';
    notifyListeners();
    checkServerHealth();
  });
}

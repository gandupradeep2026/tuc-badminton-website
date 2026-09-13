import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Settings, 
  CheckCircle2, 
  AlertCircle, 
  Server,
  ExternalLink,
  X
} from 'lucide-react';
import { subscribeServerStatus, checkServerHealth } from '../api/serverStatus';
import { getBaseApiUrl, setCustomBackendUrl } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

export default function ServerStatusBadge() {
  const { language } = useLanguage();
  const isDe = language === 'de';

  const [status, setStatus] = useState({
    state: 'checking',
    latency: null,
    backendUrl: getBaseApiUrl(),
  });
  const [showConfig, setShowConfig] = useState(false);
  const [tunnelInput, setTunnelInput] = useState(getBaseApiUrl());
  const [savedMessage, setSavedMessage] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeServerStatus((newStatus) => {
      setStatus(newStatus);
      setTunnelInput(newStatus.backendUrl || '');
    });
    return unsubscribe;
  }, []);

  const handleSaveTunnel = (e) => {
    e.preventDefault();
    setCustomBackendUrl(tunnelInput);
    setSavedMessage(isDe ? 'Tunnel-URL gespeichert!' : 'Tunnel URL saved!');
    setTimeout(() => setSavedMessage(null), 3000);
  };

  const handleResetTunnel = () => {
    setCustomBackendUrl('');
    setTunnelInput('');
    setSavedMessage(isDe ? 'Auf Standard zurückgesetzt.' : 'Reset to default.');
    setTimeout(() => setSavedMessage(null), 3000);
  };

  return (
    <>
      {/* Floating or Embedded Status Pill */}
      <button
        onClick={() => setShowConfig(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all border shadow-xs cursor-pointer select-none ${
          status.state === 'online'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            : status.state === 'checking'
            ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
        }`}
        title={isDe ? 'Klicken für Server- & Tunnel-Details' : 'Click for server & tunnel details'}
      >
        {status.state === 'online' ? (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Wifi className="w-3 h-3 text-emerald-600" />
            <span>{isDe ? 'Live Server' : 'Server Online'}</span>
            {status.latency && <span className="opacity-75 text-[10px]">({status.latency}ms)</span>}
          </>
        ) : status.state === 'checking' ? (
          <>
            <RefreshCw className="w-3 h-3 text-amber-600 animate-spin" />
            <span>{isDe ? 'Verbindung...' : 'Connecting...'}</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <WifiOff className="w-3 h-3 text-rose-600" />
            <span>{isDe ? 'Server Offline' : 'Server Offline'}</span>
          </>
        )}
      </button>

      {/* Configuration & Diagnostic Modal */}
      {showConfig && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 text-slate-900 space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#005A36]/10 text-[#005A36]">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-black text-base sm:text-lg leading-tight">
                    {isDe ? 'TU Chemnitz Server & Cloud Status' : 'TU Chemnitz Server & Cloud Status'}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold">
                    TU Chemnitz Badminton Infrastructure
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfig(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live State Banner */}
            <div className={`p-4 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed ${
              status.state === 'online'
                ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
                : status.state === 'checking'
                ? 'bg-amber-50 text-amber-950 border-amber-200'
                : 'bg-rose-50 text-rose-950 border-rose-200'
            }`}>
              {status.state === 'online' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : status.state === 'checking' ? (
                <RefreshCw className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5 animate-spin" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold">
                  {status.state === 'online'
                    ? (isDe ? 'Verbunden mit Live-Server (Synchron)' : 'Connected to Live Server (Synced)')
                    : status.state === 'checking'
                    ? (isDe ? 'Überprüfe Serververbindung...' : 'Checking server connectivity...')
                    : (isDe ? 'Server derzeit offline (Fallback-Modus aktiv)' : 'Server currently offline (Fallback mode active)')}
                </p>
                <p className="mt-1 text-[11px] opacity-90">
                  {status.state === 'online'
                    ? (status.venue || '12 Spielfelder • Sporthalle Thüringer Weg 11')
                    : (isDe 
                        ? 'Alle Turnierspieler und Trainer werden aus dem lokalen Speicher geladen. Nach dem Start des Render-Cloud-Servers oder Tunnels verbindet sich die Seite automatisch.'
                        : 'All tournament players and coaches are loaded from local cache. When your Render cloud service or tunnel is active, it connects automatically.')}
                </p>
              </div>
            </div>

            {/* Custom Tunnel URL Configuration */}
            <form onSubmit={handleSaveTunnel} className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                {isDe ? 'Live-Backend URL (Render Cloud oder Tunnel):' : 'Live Backend URL (Render Cloud or Tunnel):'}
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://tuc-badminton-backend.onrender.com"
                  value={tunnelInput}
                  onChange={(e) => setTunnelInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:border-[#005A36] focus:ring-1 focus:ring-[#005A36]"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-xl bg-[#005A36] hover:bg-[#004328] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  {isDe ? 'Speichern' : 'Save'}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                {isDe 
                  ? 'Geben Sie hier Ihre Render-Cloud-Adresse oder Cloudflare-Tunnel-URL ein, um Änderungen in Echtzeit zwischen Laptop und Smartphone abzugleichen.'
                  : 'Enter your Render cloud address or Cloudflare tunnel URL here to sync changes in real time between laptop and phone.'}
              </p>
            </form>

            {savedMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 text-center">
                {savedMessage}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleResetTunnel}
                className="text-xs text-slate-500 hover:text-rose-600 font-bold transition-colors cursor-pointer"
              >
                {isDe ? 'Standard wiederherstellen' : 'Reset to default'}
              </button>
              <button
                type="button"
                onClick={() => checkServerHealth()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isDe ? 'Neu prüfen' : 'Check Now'}</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

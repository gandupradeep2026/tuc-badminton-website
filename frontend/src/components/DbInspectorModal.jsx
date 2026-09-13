import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  RefreshCw, 
  Trash2, 
  CheckCircle, 
  Clock, 
  User, 
  Mail, 
  Award, 
  FileText,
  Layers,
  AlertCircle
} from 'lucide-react';

export default function DbInspectorModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('registrations'); // 'registrations' | 'inquiries'
  const [registrations, setRegistrations] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const [regRes, inqRes] = await Promise.all([
        fetch('/api/registrations'),
        fetch('/api/inquiries'),
      ]);

      if (!regRes.ok || !inqRes.ok) throw new Error('Failed to retrieve SQLite database records');

      const regData = await regRes.json();
      const inqData = await inqRes.json();

      setRegistrations(regData);
      setInquiries(inqData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRecords();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDeleteRegistration = async (id) => {
    if (!window.confirm(`Delete registration record #${id}?`)) return;
    setDeleteId(id);
    try {
      const res = await fetch(`/api/registrations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete registration');
      setRegistrations((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-tuc-100 dark:bg-tuc-950 text-tuc-700 dark:text-emerald-400 flex items-center justify-center border border-tuc-200 dark:border-tuc-800">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-lg text-slate-900 dark:text-white">
                  Local SQLite Database Inspector
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  data/badminton.sqlite
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct view of rows stored in the local SQLite engine (Node.js DatabaseSync)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchRecords}
              disabled={loading}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              title="Refresh database records"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="px-6 pt-4 pb-2 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('registrations')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'registrations'
                ? 'border-tuc-600 dark:border-emerald-400 text-tuc-800 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Table: registrations</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
              {registrations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('inquiries')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'inquiries'
                ? 'border-tuc-600 dark:border-emerald-400 text-tuc-800 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Table: inquiries</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
              {inquiries.length}
            </span>
          </button>
        </div>

        {/* Records Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Registrations List */}
          {activeTab === 'registrations' && (
            <div className="space-y-3">
              {registrations.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No registrations found in database.
                </div>
              ) : (
                registrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors text-xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          #{reg.id}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {reg.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-tuc-100 dark:bg-tuc-950 text-tuc-800 dark:text-tuc-300 border border-tuc-200 dark:border-tuc-800">
                          {reg.affiliation}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          reg.session_type === 'tournament'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {reg.session_type}
                        </span>
                        <button
                          onClick={() => handleDeleteRegistration(reg.id)}
                          disabled={deleteId === reg.id}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                          title="Delete record from SQLite"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600 dark:text-slate-400 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Email:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{reg.email}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Skill Level:</span>
                        <span className="font-medium capitalize text-slate-800 dark:text-slate-200">{reg.skill_level}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Preferred Day:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{reg.preferred_day}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Racket Loan:</span>
                        <span className={`font-medium ${reg.racket_needed ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-500'}`}>
                          {reg.racket_needed ? 'Yes (Loaner)' : 'Has own racket'}
                        </span>
                      </div>
                    </div>

                    {reg.message && (
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 text-[11px] italic">
                        "{reg.message}"
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                      <span>Status: <strong className="text-emerald-600 dark:text-emerald-400 uppercase">{reg.status}</strong></span>
                      <span>Recorded: {reg.created_at}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Inquiries List */}
          {activeTab === 'inquiries' && (
            <div className="space-y-3">
              {inquiries.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No inquiries recorded yet.
                </div>
              ) : (
                inquiries.map((inq) => (
                  <div
                    key={inq.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          #{inq.id}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {inq.subject}
                        </h4>
                      </div>
                      <span className="text-[10px] text-slate-400">{inq.created_at}</span>
                    </div>

                    <div className="text-slate-600 dark:text-slate-400 flex items-center gap-3 text-[11px]">
                      <span><strong>From:</strong> {inq.name}</span>
                      <span><strong>Email:</strong> {inq.email}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 text-[11px]">
                      {inq.message}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

        {/* Footer info bar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Engine: Node.js 24 SQLite `DatabaseSync`</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
}

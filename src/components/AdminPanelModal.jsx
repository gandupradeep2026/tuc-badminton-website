import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Users, 
  Trophy, 
  Film, 
  CheckCircle2, 
  AlertCircle,
  LogOut,
  RefreshCw
} from 'lucide-react';
import { safeFetchJson, fileToDataUrl } from '../api/client';
import { DEFAULT_PLAYERS, DEFAULT_TRAINERS, TERMINE_LIST, DEFAULT_GALLERY } from '../data/mockData';

export default function AdminPanelModal({ isOpen, onClose, onDataChanged }) {
  // Authentication state
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('tuc_admin_token') || '');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Active Management Tab
  const [activeTab, setActiveTab] = useState('trainers'); // 'trainers' | 'tournaments' | 'media'

  // Data lists
  const [trainers, setTrainers] = useState([]);
  const [players, setPlayers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Form States
  const [playerForm, setPlayerForm] = useState({
    name: '',
    gender: 'men',
    study_program: '',
    specialization: '',
    team: '1. Mannschaft (Sachsenliga)',
    email: '',
    photoFile: null,
  });

  const [trainerForm, setTrainerForm] = useState({
    name: '',
    role: '',
    email: '',
    focus_areas: '',
    photoFile: null,
  });

  const [tourneyForm, setTourneyForm] = useState({
    title: '',
    date: '',
    deadline: '',
    location: 'Sporthalle Thüringer Weg 11, Chemnitz',
    description: '',
    docFile: null,
  });

  const [mediaForm, setMediaForm] = useState({
    title: '',
    type: 'photo',
    caption: '',
    mediaFile: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all admin data
  const fetchAllData = async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const deletedPlayerIds = (JSON.parse(localStorage.getItem('tuc_deleted_player_ids') || '[]')).map(String);
      const customPlayers = JSON.parse(localStorage.getItem('tuc_custom_players') || '[]');

      const deletedTrainerIds = (JSON.parse(localStorage.getItem('tuc_deleted_trainer_ids') || '[]')).map(String);
      const customTrainers = JSON.parse(localStorage.getItem('tuc_custom_trainers') || '[]');

      const deletedTourneyIds = (JSON.parse(localStorage.getItem('tuc_deleted_tournament_ids') || '[]')).map(String);
      const customTourneys = JSON.parse(localStorage.getItem('tuc_custom_tournaments') || '[]');

      const deletedGalleryIds = (JSON.parse(localStorage.getItem('tuc_deleted_gallery_ids') || '[]')).map(String);
      const customGallery = JSON.parse(localStorage.getItem('tuc_custom_gallery') || '[]');

      const [tRes, pRes, tourRes, mRes] = await Promise.all([
        safeFetchJson('/api/trainers'),
        safeFetchJson('/api/players'),
        safeFetchJson('/api/tournaments'),
        safeFetchJson('/api/media'),
      ]);

      let tList = (tRes.ok && Array.isArray(tRes.data)) ? tRes.data : [...DEFAULT_TRAINERS];
      setTrainers(tList);

      let pList = (pRes.ok && Array.isArray(pRes.data)) ? pRes.data : [...DEFAULT_PLAYERS];
      setPlayers(pList);

      let toList = (tourRes.ok && Array.isArray(tourRes.data) && tourRes.data.length > 0) ? tourRes.data : [...(TERMINE_LIST || [])];
      const toMap = new Map();
      toList.forEach(to => toMap.set(String(to.id), to));
      customTourneys.forEach(to => toMap.set(String(to.id), to));
      setTournaments(Array.from(toMap.values()).filter(to => !deletedTourneyIds.includes(String(to.id))));

      let mList = (mRes.ok && Array.isArray(mRes.data) && mRes.data.length > 0) ? mRes.data : [...DEFAULT_GALLERY];
      const mMap = new Map();
      mList.forEach(m => mMap.set(String(m.id), m));
      customGallery.forEach(m => mMap.set(String(m.id), m));
      setMediaList(Array.from(mMap.values()).filter(m => !deletedGalleryIds.includes(String(m.id))));
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && authToken) {
      fetchAllData();
    }
  }, [isOpen, authToken]);

  if (!isOpen) return null;

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await safeFetchJson('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        if (res.isOffline) {
          throw new Error('Der Laptop-Server ist derzeit offline. Bitte starten Sie start-server.bat auf dem Heimserver.');
        }
        throw new Error(res.error || 'Authentication failed');
      }

      setAuthToken(res.data.token);
      localStorage.setItem('tuc_admin_token', res.data.token);
      setPassword('');
      fetchAllData();
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthToken('');
    localStorage.removeItem('tuc_admin_token');
  };

  // Submit Player
  const handlePlayerSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      let photoUrl = '';
      if (playerForm.photoFile) {
        try {
          photoUrl = await fileToDataUrl(playerForm.photoFile);
        } catch (err) {
          console.warn('Could not encode photo:', err);
        }
      }

      const newId = Date.now();
      const newPlayer = {
        id: newId,
        name: playerForm.name.trim(),
        gender: playerForm.gender,
        study_program: playerForm.study_program.trim(),
        specialization: playerForm.specialization.trim(),
        team: playerForm.team.trim() || '1. Mannschaft (Sachsenliga)',
        email: playerForm.email.trim().toLowerCase(),
        photo_url: photoUrl || (playerForm.gender === 'women'
          ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80'
          : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80')
      };

      const customPlayers = JSON.parse(localStorage.getItem('tuc_custom_players') || '[]');
      customPlayers.push(newPlayer);
      localStorage.setItem('tuc_custom_players', JSON.stringify(customPlayers));

      const deletedIds = (JSON.parse(localStorage.getItem('tuc_deleted_player_ids') || '[]')).map(String);
      localStorage.setItem('tuc_deleted_player_ids', JSON.stringify(deletedIds.filter(id => id !== String(newId))));

      setPlayers(prev => [...prev, newPlayer]);
      setFeedback({ type: 'success', message: `Player ${newPlayer.name} added successfully!` });
      setPlayerForm({
        name: '',
        gender: 'men',
        study_program: '',
        specialization: '',
        team: '1. Mannschaft (Sachsenliga)',
        email: '',
        photoFile: null,
      });
      window.dispatchEvent(new Event('storage'));
      if (onDataChanged) onDataChanged();

      const formData = new FormData();
      formData.append('name', newPlayer.name);
      formData.append('gender', newPlayer.gender);
      formData.append('study_program', newPlayer.study_program);
      formData.append('specialization', newPlayer.specialization);
      formData.append('team', newPlayer.team);
      formData.append('email', newPlayer.email);
      if (playerForm.photoFile) {
        formData.append('photo', playerForm.photoFile);
      }

      safeFetchJson('/api/players', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      }).then(res => {
        if (res.ok && res.data && res.data.player) {
          const currentCustom = JSON.parse(localStorage.getItem('tuc_custom_players') || '[]');
          const idx = currentCustom.findIndex(p => p.id === newId);
          if (idx !== -1) {
            currentCustom[idx] = res.data.player;
            localStorage.setItem('tuc_custom_players', JSON.stringify(currentCustom));
          }
          fetchAllData();
        }
      }).catch(() => {});
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Player
  const handleDeletePlayer = async (id) => {
    if (!window.confirm('Are you sure you want to remove this player?')) return;
    try {
      const deletedIds = (JSON.parse(localStorage.getItem('tuc_deleted_player_ids') || '[]')).map(String);
      if (!deletedIds.includes(String(id))) {
        deletedIds.push(String(id));
        localStorage.setItem('tuc_deleted_player_ids', JSON.stringify(deletedIds));
      }
      const customPlayers = JSON.parse(localStorage.getItem('tuc_custom_players') || '[]').filter(p => String(p.id) !== String(id));
      localStorage.setItem('tuc_custom_players', JSON.stringify(customPlayers));

      setPlayers(prev => prev.filter(p => String(p.id) !== String(id)));
      setFeedback({ type: 'success', message: 'Player removed.' });
      window.dispatchEvent(new Event('storage'));
      if (onDataChanged) onDataChanged();

      safeFetchJson(`/api/players/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      }).catch(() => {});
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Submit Trainer
  const handleTrainerSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      let photoUrl = '';
      if (trainerForm.photoFile) {
        try {
          photoUrl = await fileToDataUrl(trainerForm.photoFile);
        } catch (err) {
          console.warn('Could not encode photo:', err);
        }
      }

      const newId = Date.now();
      const newTrainer = {
        id: newId,
        name: trainerForm.name.trim(),
        role: trainerForm.role.trim(),
        email: trainerForm.email.trim().toLowerCase(),
        focus_areas: trainerForm.focus_areas.trim(),
        photo_url: photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
      };

      const customTrainers = JSON.parse(localStorage.getItem('tuc_custom_trainers') || '[]');
      customTrainers.push(newTrainer);
      localStorage.setItem('tuc_custom_trainers', JSON.stringify(customTrainers));

      const deletedIds = (JSON.parse(localStorage.getItem('tuc_deleted_trainer_ids') || '[]')).map(String);
      localStorage.setItem('tuc_deleted_trainer_ids', JSON.stringify(deletedIds.filter(id => id !== String(newId))));

      setTrainers(prev => [...prev, newTrainer]);
      setFeedback({ type: 'success', message: `Trainer ${newTrainer.name} added successfully!` });
      setTrainerForm({ name: '', role: '', email: '', focus_areas: '', photoFile: null });
      window.dispatchEvent(new Event('storage'));
      if (onDataChanged) onDataChanged();

      const formData = new FormData();
      formData.append('name', newTrainer.name);
      formData.append('role', newTrainer.role);
      formData.append('email', newTrainer.email);
      formData.append('focus_areas', newTrainer.focus_areas);
      if (trainerForm.photoFile) {
        formData.append('photo', trainerForm.photoFile);
      }

      safeFetchJson('/api/trainers', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      }).then(res => {
        if (res.ok && res.data && res.data.trainer) {
          const currentCustom = JSON.parse(localStorage.getItem('tuc_custom_trainers') || '[]');
          const idx = currentCustom.findIndex(t => t.id === newId);
          if (idx !== -1) {
            currentCustom[idx] = res.data.trainer;
            localStorage.setItem('tuc_custom_trainers', JSON.stringify(currentCustom));
          }
          fetchAllData();
        }
      }).catch(() => {});
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Trainer
  const handleDeleteTrainer = async (id) => {
    if (!window.confirm('Are you sure you want to remove this trainer profile?')) return;
    try {
      const deletedIds = (JSON.parse(localStorage.getItem('tuc_deleted_trainer_ids') || '[]')).map(String);
      if (!deletedIds.includes(String(id))) {
        deletedIds.push(String(id));
        localStorage.setItem('tuc_deleted_trainer_ids', JSON.stringify(deletedIds));
      }
      const customTrainers = JSON.parse(localStorage.getItem('tuc_custom_trainers') || '[]').filter(t => String(t.id) !== String(id));
      localStorage.setItem('tuc_custom_trainers', JSON.stringify(customTrainers));

      setTrainers(prev => prev.filter(t => String(t.id) !== String(id)));
      setFeedback({ type: 'success', message: 'Trainer removed.' });
      window.dispatchEvent(new Event('storage'));
      if (onDataChanged) onDataChanged();

      safeFetchJson(`/api/trainers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      }).catch(() => {});
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Submit Tournament
  const handleTourneySubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const newId = Date.now();
      const newTourney = {
        id: newId,
        title: tourneyForm.title.trim(),
        date: tourneyForm.date.trim(),
        deadline: tourneyForm.deadline.trim(),
        location: tourneyForm.location.trim() || 'Sporthalle Thüringer Weg 11, Chemnitz',
        description: tourneyForm.description.trim(),
        document_url: '',
      };

      const customTourneys = JSON.parse(localStorage.getItem('tuc_custom_tournaments') || '[]');
      customTourneys.push(newTourney);
      localStorage.setItem('tuc_custom_tournaments', JSON.stringify(customTourneys));

      const deletedIds = (JSON.parse(localStorage.getItem('tuc_deleted_tournament_ids') || '[]')).map(String);
      localStorage.setItem('tuc_deleted_tournament_ids', JSON.stringify(deletedIds.filter(id => id !== String(newId))));

      setTournaments(prev => [...prev, newTourney]);
      setFeedback({ type: 'success', message: 'Tournament announcement posted successfully!' });
      setTourneyForm({
        title: '',
        date: '',
        deadline: '',
        location: 'Sporthalle Thüringer Weg 11, Chemnitz',
        description: '',
        docFile: null,
      });
      window.dispatchEvent(new Event('storage'));
      if (onDataChanged) onDataChanged();

      const formData = new FormData();
      formData.append('title', newTourney.title);
      formData.append('date', newTourney.date);
      formData.append('deadline', newTourney.deadline);
      formData.append('location', newTourney.location);
      formData.append('description', newTourney.description);
      if (tourneyForm.docFile) {
        formData.append('document', tourneyForm.docFile);
      }

      safeFetchJson('/api/tournaments', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      }).catch(() => {});
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Tournament
  const handleDeleteTourney = async (id) => {
    if (!window.confirm('Delete this tournament notice?')) return;
    try {
      const deletedIds = (JSON.parse(localStorage.getItem('tuc_deleted_tournament_ids') || '[]')).map(String);
      if (!deletedIds.includes(String(id))) {
        deletedIds.push(String(id));
        localStorage.setItem('tuc_deleted_tournament_ids', JSON.stringify(deletedIds));
      }
      const customTourneys = JSON.parse(localStorage.getItem('tuc_custom_tournaments') || '[]').filter(t => String(t.id) !== String(id));
      localStorage.setItem('tuc_custom_tournaments', JSON.stringify(customTourneys));

      setTournaments(prev => prev.filter(t => String(t.id) !== String(id)));
      setFeedback({ type: 'success', message: 'Tournament removed.' });
      window.dispatchEvent(new Event('storage'));
      if (onDataChanged) onDataChanged();

      safeFetchJson(`/api/tournaments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      }).catch(() => {});
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Submit Media
  const handleMediaSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      let photoUrl = '';
      if (mediaForm.mediaFile) {
        try {
          photoUrl = await fileToDataUrl(mediaForm.mediaFile);
        } catch (err) {
          console.warn('Could not encode media file:', err);
        }
      }

      const newId = Date.now();
      const newMedia = {
        id: newId,
        tournament_name: mediaForm.title.trim(),
        result: 'Tournament Media',
        caption: mediaForm.caption.trim(),
        photo_url: photoUrl,
        is_approved: 1,
        status: 'approved',
      };

      const customGallery = JSON.parse(localStorage.getItem('tuc_custom_gallery') || '[]');
      customGallery.unshift(newMedia);
      localStorage.setItem('tuc_custom_gallery', JSON.stringify(customGallery));

      const deletedIds = (JSON.parse(localStorage.getItem('tuc_deleted_gallery_ids') || '[]')).map(String);
      localStorage.setItem('tuc_deleted_gallery_ids', JSON.stringify(deletedIds.filter(id => id !== String(newId))));

      setMediaList(prev => [newMedia, ...prev]);
      setFeedback({ type: 'success', message: 'Media item saved and published!' });
      setMediaForm({ title: '', type: 'photo', caption: '', mediaFile: null });
      window.dispatchEvent(new Event('storage'));
      if (onDataChanged) onDataChanged();

      const formData = new FormData();
      formData.append('title', mediaForm.title);
      formData.append('type', mediaForm.type);
      formData.append('caption', mediaForm.caption);
      if (mediaForm.mediaFile) {
        formData.append('file', mediaForm.mediaFile);
      }

      safeFetchJson('/api/media', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      }).catch(() => {});
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Media
  const handleDeleteMedia = async (id) => {
    if (!window.confirm('Delete this media item?')) return;
    try {
      const deletedIds = (JSON.parse(localStorage.getItem('tuc_deleted_gallery_ids') || '[]')).map(String);
      if (!deletedIds.includes(String(id))) {
        deletedIds.push(String(id));
        localStorage.setItem('tuc_deleted_gallery_ids', JSON.stringify(deletedIds));
      }
      const customGallery = JSON.parse(localStorage.getItem('tuc_custom_gallery') || '[]').filter(g => String(g.id) !== String(id));
      localStorage.setItem('tuc_custom_gallery', JSON.stringify(customGallery));

      setMediaList(prev => prev.filter(m => String(m.id) !== String(id)));
      setFeedback({ type: 'success', message: 'Media item removed.' });
      window.dispatchEvent(new Event('storage'));
      if (onDataChanged) onDataChanged();

      safeFetchJson(`/api/media/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      }).catch(() => {});
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="p-5 sm:p-6 bg-tuc-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-lg tracking-tight">
                  TUC Badminton Admin Portal
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white">
                  Restricted
                </span>
              </div>
              <p className="text-xs text-white/80">
                Manage coaches, Ausschreibung documents, and community media
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {authToken && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Log out from admin session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {!authToken ? (
          /* Login Card */
          <div className="p-8 sm:p-12 max-w-md mx-auto w-full space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-tuc-100 dark:bg-tuc-950 text-tuc-800 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="font-display font-black text-2xl text-slate-900 dark:text-white">
                Admin Authentication
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter the TU Chemnitz Badminton master password to manage portal content and file uploads.
              </p>
            </div>

            {authError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Master Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Default: tuc-badminton-admin"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tuc-700"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 rounded-xl text-sm font-bold text-white bg-tuc-800 hover:bg-tuc-700 shadow-md transition-all disabled:opacity-50"
              >
                {authLoading ? 'Verifying...' : 'Authenticate & Open Dashboard'}
              </button>
            </form>

            <div className="text-center text-[11px] text-slate-400">
              Passcode configured in project environment: <code className="font-mono font-bold text-slate-600 dark:text-slate-300">tuc-badminton-admin</code>
            </div>
          </div>
        ) : (
          /* Dashboard Layout */
          <div className="flex flex-col flex-1 overflow-hidden">
            
            {/* Tab Navigation */}
            <div className="px-6 pt-3 pb-1 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
              <div className="flex items-center gap-1 overflow-x-auto">
                <button
                  onClick={() => { setActiveTab('players'); setFeedback(null); }}
                  className={`px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                    activeTab === 'players'
                      ? 'bg-tuc-800 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Spielerliste & Kader ({players.length})</span>
                </button>

                <button
                  onClick={() => { setActiveTab('trainers'); setFeedback(null); }}
                  className={`px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                    activeTab === 'trainers'
                      ? 'bg-tuc-800 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Trainers & Coaches ({trainers.length})</span>
                </button>

                <button
                  onClick={() => { setActiveTab('tournaments'); setFeedback(null); }}
                  className={`px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                    activeTab === 'tournaments'
                      ? 'bg-tuc-800 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Tournaments & Ausschreibung ({tournaments.length})</span>
                </button>

                <button
                  onClick={() => { setActiveTab('media'); setFeedback(null); }}
                  className={`px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                    activeTab === 'media'
                      ? 'bg-tuc-800 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Media Gallery ({mediaList.length})</span>
                </button>
              </div>

              <button
                onClick={fetchAllData}
                disabled={loading}
                className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg"
                title="Refresh lists"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Notification Banner */}
            {feedback && (
              <div className={`mx-6 mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400'
              }`}>
                {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Tab Body */}
            <div className="p-6 overflow-y-auto space-y-8 flex-1">
              
              {/* TAB 0: PLAYERS (SPIELER & KADER) */}
              {activeTab === 'players' && (
                <div className="grid lg:grid-cols-12 gap-8">
                  {/* Left: Add Player Form */}
                  <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
                    <h4 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <Plus className="w-4 h-4 text-tuc-700 dark:text-emerald-400" />
                      <span>Neuen Spieler / Spielerin eintragen</span>
                    </h4>

                    <form onSubmit={handlePlayerSubmit} className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Name *</label>
                        <input
                          type="text"
                          required
                          value={playerForm.name}
                          onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })}
                          placeholder="e.g. Lukas Weber"
                          className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Bereich / Gender *</label>
                          <select
                            value={playerForm.gender}
                            onChange={(e) => setPlayerForm({ ...playerForm, gender: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                          >
                            <option value="men">Herren (Men)</option>
                            <option value="women">Damen (Women)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Mannschaft / Team</label>
                          <select
                            value={playerForm.team}
                            onChange={(e) => setPlayerForm({ ...playerForm, team: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                          >
                            <option value="1. Mannschaft (Sachsenliga)">1. Mannschaft (Sachsenliga)</option>
                            <option value="2. Mannschaft (Bezirksliga)">2. Mannschaft (Bezirksliga)</option>
                            <option value="Hobbymannschaft">Hobbymannschaft</option>
                            <option value="Hochschulsport Grundkurs">Hochschulsport Grundkurs</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Studiengang (What does he/she study?) *</label>
                        <input
                          type="text"
                          required
                          value={playerForm.study_program}
                          onChange={(e) => setPlayerForm({ ...playerForm, study_program: e.target.value })}
                          placeholder="e.g. B.Sc. Informatik, M.Sc. Sports Engineering"
                          className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Spezialisierung (Singles / Doubles / Mixed) *</label>
                        <input
                          type="text"
                          required
                          value={playerForm.specialization}
                          onChange={(e) => setPlayerForm({ ...playerForm, specialization: e.target.value })}
                          placeholder="e.g. Men's Singles (MS), Mixed Doubles (MX)"
                          className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">E-Mail Adresse *</label>
                        <input
                          type="email"
                          required
                          value={playerForm.email}
                          onChange={(e) => setPlayerForm({ ...playerForm, email: e.target.value })}
                          placeholder="name@s2024.tu-chemnitz.de"
                          className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Foto Upload (JPG/PNG/WebP)</label>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => setPlayerForm({ ...playerForm, photoFile: e.target.files[0] })}
                          className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-tuc-100 file:text-tuc-800"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-tuc-800 hover:bg-tuc-700 transition-all disabled:opacity-50"
                      >
                        {isSubmitting ? 'Speichere...' : 'Spieler speichern'}
                      </button>
                    </form>
                  </div>

                  {/* Right: Current Players List */}
                  <div className="lg:col-span-7 space-y-3">
                    <h4 className="font-display font-bold text-base text-slate-900 dark:text-white">
                      Aktuelle Spielerliste ({players.length})
                    </h4>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                      {players.map((p) => (
                        <div
                          key={p.id}
                          className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={p.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                              alt={p.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span>{p.name}</span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                  p.gender === 'women' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {p.gender}
                                </span>
                              </div>
                              <div className="text-slate-500 font-medium">{p.study_program} • {p.specialization}</div>
                              <div className="text-[10px] text-tuc-700 dark:text-emerald-400">{p.email}</div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeletePlayer(p.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
                            title="Spieler löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 1: TRAINERS */}
              {activeTab === 'trainers' && (
                <div className="grid lg:grid-cols-12 gap-8">
                  {/* Left: Add Trainer Form */}
                  <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
                    <h4 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <Plus className="w-4 h-4 text-tuc-700 dark:text-emerald-400" />
                      <span>Add New Trainer Profile</span>
                    </h4>

                    <form onSubmit={handleTrainerSubmit} className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Name *</label>
                        <input
                          type="text"
                          required
                          value={trainerForm.name}
                          onChange={(e) => setTrainerForm({ ...trainerForm, name: e.target.value })}
                          placeholder="e.g. Jonas Richter"
                          className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Role / License *</label>
                        <input
                          type="text"
                          required
                          value={trainerForm.role}
                          onChange={(e) => setTrainerForm({ ...trainerForm, role: e.target.value })}
                          placeholder="e.g. Assistant Coach (DBV C-Trainer)"
                          className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Contact Email *</label>
                        <input
                          type="email"
                          required
                          value={trainerForm.email}
                          onChange={(e) => setTrainerForm({ ...trainerForm, email: e.target.value })}
                          placeholder="jonas.richter@tu-chemnitz.de"
                          className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Focus Areas</label>
                        <input
                          type="text"
                          value={trainerForm.focus_areas}
                          onChange={(e) => setTrainerForm({ ...trainerForm, focus_areas: e.target.value })}
                          placeholder="Footwork, Smash Defense, Doubles"
                          className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Profile Photo Upload (JPG/PNG/WebP)</label>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => setTrainerForm({ ...trainerForm, photoFile: e.target.files[0] })}
                          className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-tuc-100 file:text-tuc-800"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-tuc-800 hover:bg-tuc-700 transition-all disabled:opacity-50"
                      >
                        {isSubmitting ? 'Saving...' : 'Save Trainer Profile'}
                      </button>
                    </form>
                  </div>

                  {/* Right: Current Trainers List */}
                  <div className="lg:col-span-7 space-y-3">
                    <h4 className="font-display font-bold text-base text-slate-900 dark:text-white">
                      Current Coaching Staff ({trainers.length})
                    </h4>
                    <div className="space-y-2">
                      {trainers.map((t) => (
                        <div
                          key={t.id}
                          className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={t.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                              alt={t.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">{t.name}</div>
                              <div className="text-slate-500">{t.role}</div>
                              <div className="text-[10px] text-tuc-700 dark:text-emerald-400">{t.email}</div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteTrainer(t.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
                            title="Delete trainer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TOURNAMENTS */}
              {activeTab === 'tournaments' && (
                <div className="grid lg:grid-cols-12 gap-8">
                  {/* Left: Add Tournament Form */}
                  <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
                    <h4 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <Plus className="w-4 h-4 text-tuc-700 dark:text-emerald-400" />
                      <span>Post Tournament & Ausschreibung</span>
                    </h4>

                    <form onSubmit={handleTourneySubmit} className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Tournament Title *</label>
                        <input
                          type="text"
                          required
                          value={tourneyForm.title}
                          onChange={(e) => setTourneyForm({ ...tourneyForm, title: e.target.value })}
                          placeholder="e.g. 15. Chemnitzer Pokalturnier 2026"
                          className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Event Date *</label>
                          <input
                            type="text"
                            required
                            value={tourneyForm.date}
                            onChange={(e) => setTourneyForm({ ...tourneyForm, date: e.target.value })}
                            placeholder="e.g. 05. Dezember 2026"
                            className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Meldeschluss *</label>
                          <input
                            type="text"
                            required
                            value={tourneyForm.deadline}
                            onChange={(e) => setTourneyForm({ ...tourneyForm, deadline: e.target.value })}
                            placeholder="e.g. 20. November 2026"
                            className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Location</label>
                        <input
                          type="text"
                          value={tourneyForm.location}
                          onChange={(e) => setTourneyForm({ ...tourneyForm, location: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Description</label>
                        <textarea
                          rows={2}
                          value={tourneyForm.description}
                          onChange={(e) => setTourneyForm({ ...tourneyForm, description: e.target.value })}
                          placeholder="Disziplinen, Spielmodus, Teilnahmegebuehr..."
                          className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 resize-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Upload Ausschreibung Document (PDF / Flyer)</label>
                        <input
                          type="file"
                          accept="application/pdf,image/jpeg,image/png"
                          onChange={(e) => setTourneyForm({ ...tourneyForm, docFile: e.target.files[0] })}
                          className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-tuc-100 file:text-tuc-800"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-tuc-800 hover:bg-tuc-700 transition-all disabled:opacity-50"
                      >
                        {isSubmitting ? 'Uploading...' : 'Publish Tournament Notice'}
                      </button>
                    </form>
                  </div>

                  {/* Right: Existing Tournaments */}
                  <div className="lg:col-span-7 space-y-3">
                    <h4 className="font-display font-bold text-base text-slate-900 dark:text-white">
                      Posted Tournament Announcements ({tournaments.length})
                    </h4>
                    <div className="space-y-2">
                      {tournaments.map((to) => (
                        <div
                          key={to.id}
                          className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="font-bold text-slate-900 dark:text-white">{to.title}</div>
                            <div className="text-slate-500 text-[11px]">
                              Datum: {to.date} • Meldeschluss: <span className="font-bold text-amber-600">{to.deadline}</span>
                            </div>
                            {to.document_url && (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                                Document linked: {to.document_url}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => handleDeleteTourney(to.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
                            title="Delete announcement"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: MEDIA GALLERY */}
              {activeTab === 'media' && (
                <div className="grid lg:grid-cols-12 gap-8">
                  {/* Left: Upload Media Form */}
                  <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
                    <h4 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <Upload className="w-4 h-4 text-tuc-700 dark:text-emerald-400" />
                      <span>Upload Community Media</span>
                    </h4>

                    <form onSubmit={handleMediaSubmit} className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Title / Label *</label>
                        <input
                          type="text"
                          required
                          value={mediaForm.title}
                          onChange={(e) => setMediaForm({ ...mediaForm, title: e.target.value })}
                          placeholder="e.g. Smash Defense Practice Rally"
                          className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Media Category</label>
                        <select
                          value={mediaForm.type}
                          onChange={(e) => setMediaForm({ ...mediaForm, type: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                        >
                          <option value="photo">Photo (JPG, PNG, WebP)</option>
                          <option value="video">Short Video Clip (MP4, WebM)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Caption</label>
                        <input
                          type="text"
                          value={mediaForm.caption}
                          onChange={(e) => setMediaForm({ ...mediaForm, caption: e.target.value })}
                          placeholder="Optional context or description..."
                          className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">File Selection *</label>
                        <input
                          type="file"
                          required
                          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                          onChange={(e) => setMediaForm({ ...mediaForm, mediaFile: e.target.files[0] })}
                          className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-tuc-100 file:text-tuc-800"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-tuc-800 hover:bg-tuc-700 transition-all disabled:opacity-50"
                      >
                        {isSubmitting ? 'Uploading to uploads/...' : 'Upload & Publish to Gallery'}
                      </button>
                    </form>
                  </div>

                  {/* Right: Existing Media */}
                  <div className="lg:col-span-7 space-y-3">
                    <h4 className="font-display font-bold text-base text-slate-900 dark:text-white">
                      Published Media ({mediaList.length})
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {mediaList.map((m) => (
                        <div
                          key={m.id}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5"
                        >
                          <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden relative">
                            {m.type === 'video' ? (
                              <video src={m.file_url} className="w-full h-full object-cover" />
                            ) : (
                              <img src={m.file_url} alt={m.title} className="w-full h-full object-cover" />
                            )}
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-black/70 text-white">
                              {m.type}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="font-bold truncate text-slate-900 dark:text-white max-w-[160px]">{m.title}</span>
                            <button
                              onClick={() => handleDeleteMedia(m.id)}
                              className="p-1 text-slate-400 hover:text-red-500 rounded"
                              title="Delete media"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom status bar */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>SQLite DB: <code className="font-mono text-[11px]">badminton_community.db</code> | Multer: <code className="font-mono text-[11px]">uploads/</code></span>
              </span>

              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                Close Dashboard
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

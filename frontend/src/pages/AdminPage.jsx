import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Upload, 
  RefreshCw, 
  AlertCircle, 
  Trophy, 
  Calendar, 
  Users, 
  LogOut, 
  Plus, 
  GraduationCap, 
  Target, 
  Mail, 
  X, 
  Edit3, 
  Key, 
  Bell, 
  FileText, 
  ExternalLink, 
  ShieldAlert, 
  Check, 
  Eye, 
  EyeOff, 
  Clock, 
  MapPin, 
  AlertTriangle,
  Youtube,
  Play,
  UserPlus,
  Star,
  Phone,
  School,
  UserCheck,
  Heart,
  Wrench,
  Package,
  Building2,
  CreditCard,
  Copy,
  Send,
  Activity,
  Cpu,
  HardDrive,
  Server,
  BarChart3,
  Globe,
  Wifi,
  Zap,
  Database,
  TrendingUp,
  Smartphone,
  Monitor,
  ArrowUpRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import DisciplineSelector from '../components/DisciplineSelector';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import { safeFetchJson, getApiUrl, getUploadUrl, getOfflineSubmissions, syncOfflineSubmissions, fileToDataUrl } from '../api/client';
import { 
  DEFAULT_PLAYERS, 
  DEFAULT_TRAINERS, 
  DEFAULT_GALLERY, 
  TERMINE_LIST, 
  TRAINING_SESSIONS 
} from '../data/mockData';

function formatUptime(seconds) {
  if (!seconds || seconds < 0) return '0m';
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function AdminPage() {
  const { t, language } = useLanguage();
  const adm = t.admin;
  const isDe = language === 'de';

  // -----------------------------------------------------------------
  // Authentication & Dynamic Session State
  // -----------------------------------------------------------------
  const [token, setToken] = useState(() => localStorage.getItem('tuc_admin_token') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('tuc_admin_token')));
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Active Tab: 'pending' | 'approved' | 'players' | 'trainers' | 'tournaments' | 'announcements' | 'settings'
  const [activeTab, setActiveTab] = useState('pending');
  const [feedback, setFeedback] = useState(null);

  // Helper for admin headers
  const getAdminHeaders = () => ({
    'x-admin-token': token,
  });

  const handleUnauthorized = () => {
    if (token && token.startsWith('tuc-admin-session-')) {
      // Preserve offline browser session on GitHub Pages
      return;
    }
    localStorage.removeItem('tuc_admin_token');
    setToken('');
    setIsAuthenticated(false);
    setAuthError(isDe ? 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.' : 'Session expired. Please sign in again.');
  };

  // -----------------------------------------------------------------
  // 1. Gallery Items State
  // -----------------------------------------------------------------
  const [galleryItems, setGalleryItems] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Direct create gallery form
  const [isAddGalleryOpen, setIsAddGalleryOpen] = useState(false);
  const [newTourneyName, setNewTourneyName] = useState('');
  const [newResultScore, setNewResultScore] = useState('');
  const [newResultDate, setNewResultDate] = useState('');
  const [newResultPlayer, setNewResultPlayer] = useState('');
  const [newResultCaption, setNewResultCaption] = useState('');
  const [newResultPhotoFile, setNewResultPhotoFile] = useState(null);
  const [newResultPhotoPreview, setNewResultPhotoPreview] = useState('');
  const [newResultPhotoUrl, setNewResultPhotoUrl] = useState('');
  const [gallerySubmitting, setGallerySubmitting] = useState(false);

  // -----------------------------------------------------------------
  // 2. Players State
  // -----------------------------------------------------------------
  const [playersList, setPlayersList] = useState([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  
  // New Player Form
  const [playerName, setPlayerName] = useState('');
  const [playerGender, setPlayerGender] = useState('men');
  const [playerStudy, setPlayerStudy] = useState('');
  const [playerSpec, setPlayerSpec] = useState('');
  const [playerTeam, setPlayerTeam] = useState('TUC Shuttlers');
  const [playerEmail, setPlayerEmail] = useState('');
  const [playerPhotoFile, setPlayerPhotoFile] = useState(null);
  const [playerPhotoPreview, setPlayerPhotoPreview] = useState('');
  const [playerPhotoUrl, setPlayerPhotoUrl] = useState('');
  const [playerSubmitting, setPlayerSubmitting] = useState(false);

  // -----------------------------------------------------------------
  // 3. Trainers State
  // -----------------------------------------------------------------
  const [trainersList, setTrainersList] = useState([]);
  const [trainersLoading, setTrainersLoading] = useState(false);
  const [isAddTrainerOpen, setIsAddTrainerOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);

  // New Trainer Form
  const [trainerName, setTrainerName] = useState('');
  const [trainerRole, setTrainerRole] = useState('');
  const [trainerEmail, setTrainerEmail] = useState('');
  const [trainerFocus, setTrainerFocus] = useState('');
  const [trainerPhotoFile, setTrainerPhotoFile] = useState(null);
  const [trainerPhotoPreview, setTrainerPhotoPreview] = useState('');
  const [trainerPhotoUrl, setTrainerPhotoUrl] = useState('');
  const [trainerSubmitting, setTrainerSubmitting] = useState(false);

  // -----------------------------------------------------------------
  // 4. Tournaments State
  // -----------------------------------------------------------------
  const [tournamentsList, setTournamentsList] = useState([]);
  const [tourneysLoading, setTourneysLoading] = useState(false);
  const [isAddTourneyOpen, setIsAddTourneyOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);

  // New Tournament Form
  const [tourneyTitle, setTourneyTitle] = useState('');
  const [tourneyDate, setTourneyDate] = useState('');
  const [tourneyDeadline, setTourneyDeadline] = useState('');
  const [tourneyLocation, setTourneyLocation] = useState('Sporthalle Thüringer Weg 11, Chemnitz');
  const [tourneyDesc, setTourneyDesc] = useState('');
  const [tourneyDocFile, setTourneyDocFile] = useState(null);
  const [tourneyDocUrl, setTourneyDocUrl] = useState('');
  const [tourneySubmitting, setTourneySubmitting] = useState(false);

  // -----------------------------------------------------------------
  // 5. Site Announcements State
  // -----------------------------------------------------------------
  const [announcement, setAnnouncement] = useState({
    title: '',
    message: '',
    type: 'info',
    is_active: false
  });
  const [announceLoading, setAnnounceLoading] = useState(false);
  const [announceSubmitting, setAnnounceSubmitting] = useState(false);

  // -----------------------------------------------------------------
  // 6. Security & Password Change State
  // -----------------------------------------------------------------
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwSubmitting, setPwSubmitting] = useState(false);

  // -----------------------------------------------------------------
  // 7. Forgot Password Recovery State
  // -----------------------------------------------------------------
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [initialResetToken, setInitialResetToken] = useState('');

  // -----------------------------------------------------------------
  // 8. YouTube Channel & Videos State
  // -----------------------------------------------------------------
  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [youtubeChannelUrl, setYoutubeChannelUrl] = useState('https://www.youtube.com/@TUCBadminton');
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [isAddVideoOpen, setIsAddVideoOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoCategory, setVideoCategory] = useState('Turnier 2026');
  const [videoDesc, setVideoDesc] = useState('');
  const [videoSubmitting, setVideoSubmitting] = useState(false);
  const [channelUrlInput, setChannelUrlInput] = useState('https://www.youtube.com/@TUCBadminton');
  const [channelSaving, setChannelSaving] = useState(false);

  // -----------------------------------------------------------------
  // 9. Training Schedules State
  // -----------------------------------------------------------------
  const [adminSchedules, setAdminSchedules] = useState([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [schedDay, setSchedDay] = useState('Montag');
  const [schedTime, setSchedTime] = useState('18:00 - 20:00 Uhr');
  const [schedGroup, setSchedGroup] = useState('Hochschulsport & Einsteiger');
  const [schedHall, setSchedHall] = useState('Sporthalle Thüringer Weg 11');
  const [schedCourts, setSchedCourts] = useState('12 Spielfelder');
  const [schedNotes, setSchedNotes] = useState('');
  const [schedOrder, setSchedOrder] = useState(1);
  const [schedSubmitting, setSchedSubmitting] = useState(false);

  // -----------------------------------------------------------------
  // 10. Self-Registrations State (Players, Trainers & Equipment Services)
  // -----------------------------------------------------------------
  const [pendingPlayers, setPendingPlayers] = useState([]);
  const [pendingTrainers, setPendingTrainers] = useState([]);
  const [pendingServices, setPendingServices] = useState([]);
  const [approvedServices, setApprovedServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [registrationsLoading, setRegistrationsLoading] = useState(false);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    service_type: 'Schläger-Besaitungsservice',
    email: '',
    phone: '',
    show_phone: true,
    pricing_details: '',
    available_items: '',
    location_note: 'Sporthalle Thüringer Weg 11',
    experience_years: '',
  });

  // -----------------------------------------------------------------
  // 11. Donation & Sponsorship Settings State
  // -----------------------------------------------------------------
  const [donationSettings, setDonationSettings] = useState({
    id: 1,
    is_active: false,
    title: 'Unterstütze das Badminton-Team der TU Chemnitz',
    subtitle: 'Gemeinsam für Training, Ausrüstung & Turniere',
    description: '',
    paypal_me_link: '',
    paypal_email: '',
    bank_recipient: 'TU Chemnitz Badminton Community',
    bank_iban: '',
    bank_bic: '',
    bank_name: '',
    bank_reference: 'Spende Badminton TU Chemnitz',
    sponsor_email: 'gandupradeep2026@gmail.com',
    sponsor_info: '',
  });
  const [savingDonation, setSavingDonation] = useState(false);
  const [donationSaveMsg, setDonationSaveMsg] = useState('');

  // -----------------------------------------------------------------
  // 12. Contact & Mediation Inquiries State
  // -----------------------------------------------------------------
  const [inquiriesList, setInquiriesList] = useState([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [forwardingId, setForwardingId] = useState(null);

  // -----------------------------------------------------------------
  // 13. System, Oracle Cloud Free Tier & Traffic Stats
  // -----------------------------------------------------------------
  const [systemStats, setSystemStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsLastRefreshed, setStatsLastRefreshed] = useState(null);

  // -----------------------------------------------------------------
  // 14. Game Sessions (LFG) State
  // -----------------------------------------------------------------
  const [adminSessions, setAdminSessions] = useState([]);
  const [adminSessionsLoading, setAdminSessionsLoading] = useState(false);

  // -----------------------------------------------------------------
  // Data Fetching
  // -----------------------------------------------------------------
  const fetchAllAdminData = () => {
    if (!token) return;
    fetchGallery();
    fetchPlayers();
    fetchTrainers();
    fetchTournaments();
    fetchAnnouncement();
    fetchYouTubeVideos();
    fetchAdminSchedules();
    fetchPendingRegistrations();
    fetchServices();
    fetchDonationSettings();
    fetchInquiries();
    fetchSystemStats();
    fetchAdminSessions();
  };

  const fetchGallery = async () => {
    setGalleryLoading(true);
    try {
      const deletedIds = (JSON.parse(localStorage.getItem('tuc_deleted_gallery_ids') || '[]')).map(String);
      const customGallery = JSON.parse(localStorage.getItem('tuc_custom_gallery') || '[]');
      const res = await safeFetchJson('/api/admin/gallery', { headers: getAdminHeaders() });
      if (res.status === 401 && !token.startsWith('tuc-admin-session-')) return handleUnauthorized();
      let list = (res.ok && res.data && Array.isArray(res.data) && res.data.length > 0) ? res.data : [...DEFAULT_GALLERY];
      const mergedMap = new Map();
      list.forEach(g => mergedMap.set(String(g.id), g));
      customGallery.forEach(g => mergedMap.set(String(g.id), g));
      const finalList = Array.from(mergedMap.values()).filter(g => !deletedIds.includes(String(g.id)));
      setGalleryItems(finalList);
    } catch (err) {
      const deletedIds = (JSON.parse(localStorage.getItem('tuc_deleted_gallery_ids') || '[]')).map(String);
      const customGallery = JSON.parse(localStorage.getItem('tuc_custom_gallery') || '[]');
      const mergedMap = new Map();
      DEFAULT_GALLERY.forEach(g => mergedMap.set(String(g.id), g));
      customGallery.forEach(g => mergedMap.set(String(g.id), g));
      const finalList = Array.from(mergedMap.values()).filter(g => !deletedIds.includes(String(g.id)));
      setGalleryItems(finalList);
    } finally {
      setGalleryLoading(false);
    }
  };

  const fetchPlayers = async () => {
    setPlayersLoading(true);
    try {
      // Purge any local custom players that had Unsplash stock photos auto-injected
      try {
        const localCustom = localStorage.getItem('tuc_custom_players');
        if (localCustom) {
          const parsed = JSON.parse(localCustom);
          let changed = false;
          parsed.forEach(p => {
            if (p.photo_url && p.photo_url.includes('images.unsplash.com')) {
              p.photo_url = '';
              changed = true;
            }
          });
          if (changed) localStorage.setItem('tuc_custom_players', JSON.stringify(parsed));
        }
      } catch(e) {}

      const res = await safeFetchJson('/api/players');
      let list = (res.ok && res.data && Array.isArray(res.data)) ? res.data : [...DEFAULT_PLAYERS];
      list = list.map(p => ({
        ...p,
        photo_url: (p.photo_url && p.photo_url.includes('images.unsplash.com')) ? '' : p.photo_url
      }));
      setPlayersList(list);
    } catch (err) {
      setPlayersList([...DEFAULT_PLAYERS]);
    } finally {
      setPlayersLoading(false);
    }
  };

  const fetchTrainers = async () => {
    setTrainersLoading(true);
    try {
      // Purge any local custom trainers that had Unsplash stock photos auto-injected
      try {
        const localCustom = localStorage.getItem('tuc_custom_trainers');
        if (localCustom) {
          const parsed = JSON.parse(localCustom);
          let changed = false;
          parsed.forEach(t => {
            if (t.photo_url && t.photo_url.includes('images.unsplash.com')) {
              t.photo_url = '';
              changed = true;
            }
          });
          if (changed) localStorage.setItem('tuc_custom_trainers', JSON.stringify(parsed));
        }
      } catch(e) {}

      const res = await safeFetchJson('/api/trainers');
      let list = (res.ok && res.data && Array.isArray(res.data)) ? res.data : [...DEFAULT_TRAINERS];
      list = list.map(t => ({
        ...t,
        photo_url: (t.photo_url && t.photo_url.includes('images.unsplash.com')) ? '' : t.photo_url
      }));
      setTrainersList(list);
    } catch (err) {
      setTrainersList([...DEFAULT_TRAINERS]);
    } finally {
      setTrainersLoading(false);
    }
  };

  const fetchTournaments = async () => {
    setTourneysLoading(true);
    try {
      const deletedIds = (JSON.parse(localStorage.getItem('tuc_deleted_tournament_ids') || '[]')).map(String);
      const customTourneys = JSON.parse(localStorage.getItem('tuc_custom_tournaments') || '[]');
      const res = await safeFetchJson('/api/admin/tournaments', { headers: getAdminHeaders() });
      if (res.status === 401 && !token.startsWith('tuc-admin-session-')) return handleUnauthorized();
      let list = (res.ok && res.data && Array.isArray(res.data) && res.data.length > 0) ? res.data : [...(TERMINE_LIST || [])];
      const mergedMap = new Map();
      list.forEach(t => mergedMap.set(String(t.id), t));
      customTourneys.forEach(t => mergedMap.set(String(t.id), t));
      const finalList = Array.from(mergedMap.values()).filter(t => !deletedIds.includes(String(t.id)));
      setTournamentsList(finalList);
    } catch (err) {
      const deletedIds = (JSON.parse(localStorage.getItem('tuc_deleted_tournament_ids') || '[]')).map(String);
      const customTourneys = JSON.parse(localStorage.getItem('tuc_custom_tournaments') || '[]');
      const mergedMap = new Map();
      (TERMINE_LIST || []).forEach(t => mergedMap.set(String(t.id), t));
      customTourneys.forEach(t => mergedMap.set(String(t.id), t));
      const finalList = Array.from(mergedMap.values()).filter(t => !deletedIds.includes(String(t.id)));
      setTournamentsList(finalList);
    } finally {
      setTourneysLoading(false);
    }
  };

  const fetchAnnouncement = async () => {
    setAnnounceLoading(true);
    try {
      const res = await safeFetchJson('/api/announcement');
      if (res.ok && res.data) {
        setAnnouncement(res.data);
      } else {
        const localAnn = localStorage.getItem('tuc_announcement');
        if (localAnn) {
          try { setAnnouncement(JSON.parse(localAnn)); } catch(e) {}
        }
      }
    } catch (err) {
      const localAnn = localStorage.getItem('tuc_announcement');
      if (localAnn) {
        try { setAnnouncement(JSON.parse(localAnn)); } catch(e) {}
      }
    } finally {
      setAnnounceLoading(false);
    }
  };

  const fetchYouTubeVideos = async () => {
    setYoutubeLoading(true);
    try {
      const deletedIds = (JSON.parse(localStorage.getItem('tuc_deleted_video_ids') || '[]')).map(String);
      const customVideos = JSON.parse(localStorage.getItem('tuc_custom_videos') || '[]');
      const res = await safeFetchJson('/api/videos');
      let videos = [];
      if (res.ok && res.data) {
        videos = res.data.videos || [];
        if (res.data.youtube_channel_url) {
          setYoutubeChannelUrl(res.data.youtube_channel_url);
          setChannelUrlInput(res.data.youtube_channel_url);
        }
      }
      const mergedMap = new Map();
      videos.forEach(v => mergedMap.set(String(v.id), v));
      customVideos.forEach(v => mergedMap.set(String(v.id), v));
      const finalList = Array.from(mergedMap.values()).filter(v => !deletedIds.includes(String(v.id)));
      setYoutubeVideos(finalList);
    } catch (err) {
      const deletedIds = (JSON.parse(localStorage.getItem('tuc_deleted_video_ids') || '[]')).map(String);
      const customVideos = JSON.parse(localStorage.getItem('tuc_custom_videos') || '[]');
      const finalList = customVideos.filter(v => !deletedIds.includes(String(v.id)));
      setYoutubeVideos(finalList);
    } finally {
      setYoutubeLoading(false);
    }
  };

  const fetchAdminSchedules = async () => {
    setSchedulesLoading(true);
    try {
      const deletedIds = (JSON.parse(localStorage.getItem('tuc_deleted_schedule_ids') || '[]')).map(String);
      const customScheds = JSON.parse(localStorage.getItem('tuc_custom_schedules') || '[]');
      const res = await safeFetchJson('/api/training-schedules');
      let list = (res.ok && res.data && Array.isArray(res.data) && res.data.length > 0) ? res.data : [...(TRAINING_SESSIONS || [])];
      const mergedMap = new Map();
      list.forEach(s => mergedMap.set(String(s.id), s));
      customScheds.forEach(s => mergedMap.set(String(s.id), s));
      const finalList = Array.from(mergedMap.values()).filter(s => !deletedIds.includes(String(s.id)));
      setAdminSchedules(finalList);
    } catch (err) {
      const deletedIds = (JSON.parse(localStorage.getItem('tuc_deleted_schedule_ids') || '[]')).map(String);
      const customScheds = JSON.parse(localStorage.getItem('tuc_custom_schedules') || '[]');
      const mergedMap = new Map();
      (TRAINING_SESSIONS || []).forEach(s => mergedMap.set(String(s.id), s));
      customScheds.forEach(s => mergedMap.set(String(s.id), s));
      const finalList = Array.from(mergedMap.values()).filter(s => !deletedIds.includes(String(s.id)));
      setAdminSchedules(finalList);
    } finally {
      setSchedulesLoading(false);
    }
  };

  const fetchPendingRegistrations = async () => {
    setRegistrationsLoading(true);
    try {
      const offlineQueue = getOfflineSubmissions();
      const offlinePlayers = offlineQueue
        .filter(r => r.type === 'player')
        .map(r => ({ ...r.payload, id: 'offline-' + r.id, is_offline: true, submitted_at: new Date(r.timestamp).toISOString() }));
      const offlineTrainers = offlineQueue
        .filter(r => r.type === 'trainer')
        .map(r => ({ ...r.payload, id: 'offline-' + r.id, is_offline: true, submitted_at: new Date(r.timestamp).toISOString() }));

      const res = await safeFetchJson('/api/admin/registrations', { headers: getAdminHeaders() });
      if (res.ok && res.data) {
        setPendingPlayers([...offlinePlayers, ...(res.data.players || [])]);
        setPendingTrainers([...offlineTrainers, ...(res.data.trainers || [])]);
        setPendingServices(res.data.services || []);
      } else {
        setPendingPlayers(offlinePlayers);
        setPendingTrainers(offlineTrainers);
        setPendingServices([]);
      }
    } catch (err) {
      const offlineQueue = getOfflineSubmissions();
      setPendingPlayers(offlineQueue.filter(r => r.type === 'player').map(r => ({ ...r.payload, id: 'offline-' + r.id, is_offline: true })));
      setPendingTrainers(offlineQueue.filter(r => r.type === 'trainer').map(r => ({ ...r.payload, id: 'offline-' + r.id, is_offline: true })));
      setPendingServices([]);
    } finally {
      setRegistrationsLoading(false);
    }
  };

  const handleApprovePendingPlayer = async (id, name) => {
    try {
      if (typeof id === 'string' && id.startsWith('offline-')) {
        const rawId = id.replace('offline-', '');
        const queue = getOfflineSubmissions().filter(item => String(item.id) !== rawId);
        localStorage.setItem('tuc_offline_registrations', JSON.stringify(queue));
        setFeedback({ type: 'success', message: `${name}: ${adm.registrationsTab?.approvedSuccess || 'Erfolgreich freigeschaltet!'}` });
        fetchPendingRegistrations();
        return;
      }
      const res = await safeFetchJson(`/api/admin/registrations/players/${id}/approve`, {
        method: 'POST',
        headers: getAdminHeaders(),
      });
      if (res.status === 401 && !token.startsWith('tuc-admin-session-')) return handleUnauthorized();
      if (res.ok || res.isOffline) {
        setFeedback({ type: 'success', message: `${name}: ${adm.registrationsTab?.approvedSuccess || 'Erfolgreich freigeschaltet!'}` });
        fetchPendingRegistrations();
        fetchPlayers();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleRejectPendingPlayer = async (id, name) => {
    if (!window.confirm(`${adm.registrationsTab?.confirmRejectPlayer || 'Spieler-Registrierung ablehnen?'}\n\n${name} (#${id})`)) return;
    try {
      if (typeof id === 'string' && id.startsWith('offline-')) {
        const rawId = id.replace('offline-', '');
        const queue = getOfflineSubmissions().filter(item => String(item.id) !== rawId);
        localStorage.setItem('tuc_offline_registrations', JSON.stringify(queue));
        setFeedback({ type: 'success', message: `${name}: ${adm.registrationsTab?.rejectedSuccess || 'Registrierung abgelehnt.'}` });
        fetchPendingRegistrations();
        return;
      }
      const res = await safeFetchJson(`/api/admin/registrations/players/${id}/reject`, {
        method: 'POST',
        headers: getAdminHeaders(),
      });
      if (res.status === 401 && !token.startsWith('tuc-admin-session-')) return handleUnauthorized();
      if (res.ok || res.isOffline) {
        setFeedback({ type: 'success', message: `${name}: ${adm.registrationsTab?.rejectedSuccess || 'Registrierung abgelehnt.'}` });
        fetchPendingRegistrations();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleApprovePendingTrainer = async (id, name) => {
    try {
      if (typeof id === 'string' && id.startsWith('offline-')) {
        const rawId = id.replace('offline-', '');
        const queue = getOfflineSubmissions().filter(item => String(item.id) !== rawId);
        localStorage.setItem('tuc_offline_registrations', JSON.stringify(queue));
        setFeedback({ type: 'success', message: `${name}: ${adm.registrationsTab?.approvedSuccess || 'Erfolgreich freigeschaltet!'}` });
        fetchPendingRegistrations();
        return;
      }
      const res = await safeFetchJson(`/api/admin/registrations/trainers/${id}/approve`, {
        method: 'POST',
        headers: getAdminHeaders(),
      });
      if (res.status === 401 && !token.startsWith('tuc-admin-session-')) return handleUnauthorized();
      if (res.ok || res.isOffline) {
        setFeedback({ type: 'success', message: `${name}: ${adm.registrationsTab?.approvedSuccess || 'Erfolgreich freigeschaltet!'}` });
        fetchPendingRegistrations();
        fetchTrainers();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleRejectPendingTrainer = async (id, name) => {
    if (!window.confirm(`${adm.registrationsTab?.confirmRejectTrainer || 'Trainer-Bewerbung ablehnen?'}\n\n${name} (#${id})`)) return;
    try {
      if (typeof id === 'string' && id.startsWith('offline-')) {
        const rawId = id.replace('offline-', '');
        const queue = getOfflineSubmissions().filter(item => String(item.id) !== rawId);
        localStorage.setItem('tuc_offline_registrations', JSON.stringify(queue));
        setFeedback({ type: 'success', message: `${name}: ${adm.registrationsTab?.rejectedSuccess || 'Registrierung abgelehnt.'}` });
        fetchPendingRegistrations();
        return;
      }
      const res = await safeFetchJson(`/api/admin/registrations/trainers/${id}/reject`, {
        method: 'POST',
        headers: getAdminHeaders(),
      });
      if (res.status === 401 && !token.startsWith('tuc-admin-session-')) return handleUnauthorized();
      if (res.ok || res.isOffline) {
        setFeedback({ type: 'success', message: `${name}: ${adm.registrationsTab?.rejectedSuccess || 'Registrierung abgelehnt.'}` });
        fetchPendingRegistrations();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const fetchServices = async () => {
    try {
      setServicesLoading(true);
      const res = await safeFetchJson('/api/admin/equipment-services', { headers: getAdminHeaders() });
      if (res.ok && Array.isArray(res.data)) {
        setApprovedServices(res.data);
      }
    } catch (e) {
      console.error('Error loading services:', e);
    } finally {
      setServicesLoading(false);
    }
  };

  const fetchDonationSettings = async () => {
    try {
      const res = await safeFetchJson('/api/admin/donation-settings', { headers: getAdminHeaders() });
      if (res.ok && res.data) {
        setDonationSettings(res.data);
      }
    } catch (e) {
      console.error('Error loading donation settings:', e);
    }
  };

  const fetchInquiries = async () => {
    try {
      setInquiriesLoading(true);
      const res = await safeFetchJson('/api/admin/inquiries', { headers: getAdminHeaders() });
      if (res.status === 401 && !token.startsWith('tuc-admin-session-')) return handleUnauthorized();
      if (res.ok && Array.isArray(res.data)) {
        setInquiriesList(res.data);
      } else {
        setInquiriesList([]);
      }
    } catch (err) {
      console.error('Error loading contact inquiries:', err);
      setInquiriesList([]);
    } finally {
      setInquiriesLoading(false);
    }
  };

  const handleForwardInquiry = async (id) => {
    try {
      setForwardingId(id);
      const res = await safeFetchJson(`/api/admin/inquiries/${id}/forward`, {
        method: 'POST',
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        setFeedback({ 
          type: 'success', 
          message: isDe 
            ? 'Anfrage erfolgreich per E-Mail an den Trainer / Anbieter weitergeleitet!' 
            : 'Inquiry successfully forwarded via email to the coach/provider!' 
        });
        fetchInquiries();
      } else {
        setFeedback({ 
          type: 'error', 
          message: res.error || (isDe ? 'Fehler beim Weiterleiten der Anfrage.' : 'Error forwarding inquiry.') 
        });
      }
    } catch (err) {
      setFeedback({ 
        type: 'error', 
        message: err.message || (isDe ? 'Verbindungsfehler beim Weiterleiten.' : 'Network error forwarding.') 
      });
    } finally {
      setForwardingId(null);
    }
  };

  const handleDeleteInquiry = async (id) => {
    if (!window.confirm(isDe ? 'Möchtest du diese Vermittlungsanfrage wirklich löschen?' : 'Are you sure you want to delete this contact inquiry?')) return;
    try {
      const res = await safeFetchJson(`/api/admin/inquiries/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        setFeedback({ type: 'info', message: isDe ? 'Anfrage gelöscht.' : 'Inquiry removed.' });
        fetchInquiries();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Fehler beim Löschen' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Fehler beim Löschen' });
    }
  };

  const getInquiryMailto = (inq) => {
    const subject = encodeURIComponent(`[TUC Badminton] Neue Vermittlungsanfrage von ${inq.requester_name}`);
    const body = encodeURIComponent(
      `Hallo ${inq.target_name},\n\n` +
      `wir haben über die Website der TUC Badminton Community eine neue Kontaktanfrage für dich erhalten:\n\n` +
      `Anfragender: ${inq.requester_name}\n` +
      `E-Mail: ${inq.requester_email}\n` +
      (inq.requester_phone ? `Telefon / WhatsApp: ${inq.requester_phone}\n` : '') +
      (inq.preferred_date ? `Wunschtermin / Zeiten: ${inq.preferred_date}\n` : '') +
      `\nNachricht des Interessenten:\n"${inq.message}"\n\n` +
      `Du kannst dem Interessenten direkt auf diese E-Mail antworten (${inq.requester_email}).\n\n` +
      `Sportliche Grüße,\nAdmin - TUC Badminton Community`
    );
    return `mailto:${inq.target_email}?subject=${subject}&body=${body}`;
  };

  const fetchSystemStats = async () => {
    try {
      setStatsLoading(true);
      const res = await safeFetchJson('/api/admin/system-stats', { headers: getAdminHeaders() });
      if (res.status === 401 && !token.startsWith('tuc-admin-session-')) return handleUnauthorized();
      if (res.ok && res.data) {
        setSystemStats(res.data);
        setStatsLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (err) {
      console.error('Failed to load system and traffic stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchAdminSessions = async () => {
    try {
      setAdminSessionsLoading(true);
      const res = await safeFetchJson('/api/admin/game-sessions', { headers: getAdminHeaders() });
      if (res.status === 401 && !token.startsWith('tuc-admin-session-')) return handleUnauthorized();
      if (res.ok && Array.isArray(res.data)) {
        setAdminSessions(res.data);
      } else {
        setAdminSessions([]);
      }
    } catch (err) {
      console.error('Failed to load admin sessions:', err);
    } finally {
      setAdminSessionsLoading(false);
    }
  };

  const handleDeleteAdminSession = async (id, title) => {
    if (!window.confirm(isDe ? `Möchtest du diese Spielrunde wirklich löschen?\n\n"${title}" (ID #${id})` : `Delete session?\n\n"${title}" (ID #${id})`)) return;
    try {
      const res = await safeFetchJson(`/api/admin/game-sessions/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });
      if (!res.ok) throw new Error(res.error || 'Delete failed');
      setFeedback({ type: 'success', message: isDe ? 'Spielrunde erfolgreich gelöscht.' : 'Session deleted.' });
      fetchAdminSessions();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleApproveService = async (id, name) => {
    try {
      const res = await safeFetchJson(`/api/admin/registrations/services/${id}/approve`, {
        method: 'POST',
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        setFeedback({ type: 'success', message: `Ausrüster / Besaiter ${name || ''} erfolgreich freigeschaltet!` });
        fetchPendingRegistrations();
        fetchServices();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Fehler bei der Freigabe' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Verbindungsfehler bei der Freigabe' });
    }
  };

  const handleRejectService = async (id, name) => {
    if (!window.confirm(`Möchtest du diese Registrierung wirklich ablehnen und entfernen?\n\n${name || ''} (#${id})`)) return;
    try {
      const res = await safeFetchJson(`/api/admin/registrations/services/${id}/reject`, {
        method: 'POST',
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        setFeedback({ type: 'info', message: 'Registrierung abgelehnt und entfernt.' });
        fetchPendingRegistrations();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Fehler beim Ablehnen' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Verbindungsfehler beim Ablehnen' });
    }
  };

  const handleDeleteService = async (id, name) => {
    if (!window.confirm(`Dienstleister / Besaiter "${name}" wirklich löschen?`)) return;
    try {
      const res = await safeFetchJson(`/api/admin/equipment-services/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        setFeedback({ type: 'info', message: 'Eintrag erfolgreich gelöscht.' });
        fetchServices();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Fehler beim Löschen' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Verbindungsfehler beim Löschen' });
    }
  };

  const handleCreateService = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newService.name.trim()) {
      setFeedback({ type: 'error', message: 'Bitte Name des Anbieters angeben.' });
      return;
    }
    try {
      const res = await safeFetchJson('/api/admin/equipment-services', {
        method: 'POST',
        headers: {
          ...getAdminHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newService),
      });
      if (res.ok) {
        setFeedback({ type: 'success', message: `Dienstleister "${newService.name}" erfolgreich angelegt!` });
        setNewService({
          name: '',
          service_type: 'Schläger-Besaitungsservice',
          email: '',
          phone: '',
          show_phone: true,
          pricing_details: '',
          available_items: '',
          location_note: 'Sporthalle Thüringer Weg 11',
          experience_years: '',
        });
        setIsAddServiceOpen(false);
        fetchServices();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Fehler beim Anlegen des Dienstleisters' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Verbindungsfehler beim Anlegen' });
    }
  };

  const handleSaveDonationSettings = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSavingDonation(true);
    setDonationSaveMsg('');
    try {
      const res = await safeFetchJson('/api/admin/donation-settings', {
        method: 'PUT',
        headers: {
          ...getAdminHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(donationSettings),
      });
      if (res.ok) {
        setDonationSettings(res.data.settings || donationSettings);
        setDonationSaveMsg(isDe ? 'Spenden-Einstellungen erfolgreich gespeichert!' : 'Donation settings saved successfully!');
        setFeedback({ type: 'success', message: isDe ? 'Spenden-Einstellungen gespeichert!' : 'Donation settings saved!' });
        setTimeout(() => setDonationSaveMsg(''), 4000);
      } else {
        setFeedback({ type: 'error', message: res.error || 'Fehler beim Speichern' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Verbindungsfehler beim Speichern' });
    } finally {
      setSavingDonation(false);
    }
  };

  useEffect(() => {
    // Check for password reset token in URL query or hash
    const params = new URLSearchParams(window.location.search);
    let tokenParam = params.get('reset_token');
    if (!tokenParam && window.location.hash.includes('reset_token=')) {
      const parts = window.location.hash.split('reset_token=');
      if (parts[1]) {
        tokenParam = parts[1].split('&')[0];
      }
    }
    if (tokenParam) {
      setInitialResetToken(tokenParam);
      setIsForgotModalOpen(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchAllAdminData();
    }
  }, [isAuthenticated, token]);

  // -----------------------------------------------------------------
  // Authentication Actions
  // -----------------------------------------------------------------
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    const inputPw = password.trim();
    const storedLocalPw = localStorage.getItem('tuc_admin_local_pw');
    const isLocalMatch = inputPw === 'tuc-badminton-admin' || (storedLocalPw && inputPw === storedLocalPw);

    try {
      const res = await safeFetchJson('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: inputPw }),
      });

      if (res.ok && res.data?.success && res.data?.token) {
        localStorage.setItem('tuc_admin_token', res.data.token);
        setToken(res.data.token);
        setIsAuthenticated(true);
        setPassword('');
        return;
      }

      // If backend is offline or on static GitHub Pages, allow direct browser login
      if (res.isOffline || res.status === 404 || !res.ok) {
        if (isLocalMatch) {
          const offlineToken = 'tuc-admin-session-' + Date.now();
          localStorage.setItem('tuc_admin_token', offlineToken);
          setToken(offlineToken);
          setIsAuthenticated(true);
          setPassword('');
          return;
        } else {
          setAuthError(adm.wrongPassword);
          return;
        }
      }

      setAuthError(res.error || adm.wrongPassword);
    } catch (err) {
      if (isLocalMatch) {
        const offlineToken = 'tuc-admin-session-' + Date.now();
        localStorage.setItem('tuc_admin_token', offlineToken);
        setToken(offlineToken);
        setIsAuthenticated(true);
        setPassword('');
      } else {
        setAuthError(adm.wrongPassword);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: getAdminHeaders(),
      });
    } catch (err) {
      // Ignore network errors on logout
    }
    localStorage.removeItem('tuc_admin_token');
    setToken('');
    setIsAuthenticated(false);
  };

  // -----------------------------------------------------------------
  // Gallery Actions
  // -----------------------------------------------------------------
  const handleApprove = async (id) => {
    try {
      const customGallery = JSON.parse(localStorage.getItem('tuc_custom_gallery') || '[]');
      const item = customGallery.find(g => String(g.id) === String(id));
      if (item) {
        item.is_approved = 1;
        item.status = 'approved';
        localStorage.setItem('tuc_custom_gallery', JSON.stringify(customGallery));
      }

      setGalleryItems(prev => prev.map(g => String(g.id) === String(id) ? { ...g, is_approved: 1, status: 'approved' } : g));
      setFeedback({ type: 'success', message: isDe ? 'Ergebnis freigegeben und veröffentlicht!' : 'Result approved & published!' });
      window.dispatchEvent(new Event('storage'));

      safeFetchJson(`/api/admin/gallery/${id}/approve`, {
        method: 'POST',
        headers: getAdminHeaders(),
      }).catch(() => {});
    } catch (err) {
      setFeedback({ type: 'error', message: isDe ? 'Fehler beim Freigeben' : 'Error approving' });
    }
  };

  const handleDeleteGallery = async (id) => {
    if (!window.confirm(isDe ? 'Diesen Galerieeintrag wirklich löschen?' : 'Delete this gallery entry?')) return;
    try {
      const deletedIds = (JSON.parse(localStorage.getItem('tuc_deleted_gallery_ids') || '[]')).map(String);
      if (!deletedIds.includes(String(id))) {
        deletedIds.push(String(id));
        localStorage.setItem('tuc_deleted_gallery_ids', JSON.stringify(deletedIds));
      }
      const customGallery = JSON.parse(localStorage.getItem('tuc_custom_gallery') || '[]').filter(g => String(g.id) !== String(id));
      localStorage.setItem('tuc_custom_gallery', JSON.stringify(customGallery));

      setGalleryItems(prev => prev.filter(g => String(g.id) !== String(id)));
      setFeedback({ type: 'success', message: isDe ? 'Eintrag gelöscht' : 'Item deleted' });
      window.dispatchEvent(new Event('storage'));

      safeFetchJson(`/api/admin/gallery/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      }).catch(() => {});
    } catch (err) {
      setFeedback({ type: 'error', message: isDe ? 'Fehler beim Löschen' : 'Error deleting' });
    }
  };

  const handleDirectCreateGallery = async (e) => {
    e.preventDefault();
    setGallerySubmitting(true);
    setFeedback(null);

    try {
      let photoUrl = newResultPhotoUrl.trim();
      if (newResultPhotoFile) {
        try {
          photoUrl = await fileToDataUrl(newResultPhotoFile);
        } catch (err) {
          console.warn('Could not encode photo as data URL:', err);
        }
      }

      if (!photoUrl) {
        throw new Error(isDe ? 'Bitte lade ein Foto hoch oder gib eine Bild-URL an.' : 'Please upload a photo or provide an image URL.');
      }

      const newId = Date.now();
      const newGalleryItem = {
        id: newId,
        tournament_name: newTourneyName.trim(),
        result: newResultScore.trim(),
        date: newResultDate || new Date().toLocaleDateString('de-DE'),
        player_name: newResultPlayer.trim(),
        caption: newResultCaption.trim(),
        photo_url: photoUrl,
        is_approved: 1,
        status: 'approved',
        likes: 0,
      };

      const customGallery = JSON.parse(localStorage.getItem('tuc_custom_gallery') || '[]');
      customGallery.unshift(newGalleryItem);
      localStorage.setItem('tuc_custom_gallery', JSON.stringify(customGallery));

      const deletedIds = (JSON.parse(localStorage.getItem('tuc_deleted_gallery_ids') || '[]')).map(String);
      const updatedDeletedIds = deletedIds.filter(id => id !== String(newId));
      localStorage.setItem('tuc_deleted_gallery_ids', JSON.stringify(updatedDeletedIds));

      setGalleryItems(prev => [newGalleryItem, ...prev]);
      setFeedback({ type: 'success', message: isDe ? 'Eintrag direkt veröffentlicht!' : 'Result directly published!' });
      setNewTourneyName('');
      setNewResultScore('');
      setNewResultDate('');
      setNewResultPlayer('');
      setNewResultCaption('');
      setNewResultPhotoFile(null);
      setNewResultPhotoPreview('');
      setNewResultPhotoUrl('');
      setIsAddGalleryOpen(false);
      window.dispatchEvent(new Event('storage'));

      const formData = new FormData();
      formData.append('tournament_name', newGalleryItem.tournament_name);
      formData.append('result', newGalleryItem.result);
      formData.append('date', newGalleryItem.date);
      formData.append('player_name', newGalleryItem.player_name);
      formData.append('caption', newGalleryItem.caption);
      if (newResultPhotoFile) {
        formData.append('photo', newResultPhotoFile);
      } else if (newGalleryItem.photo_url) {
        formData.append('photo_url_input', newGalleryItem.photo_url);
      }

      safeFetchJson('/api/admin/gallery/create', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: formData,
      }).catch(() => {});
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setGallerySubmitting(false);
    }
  };

  const handleSaveEditGallery = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      let photoUrl = editingItem.photo_url;
      if (editingItem.newFile) {
        try {
          photoUrl = await fileToDataUrl(editingItem.newFile);
        } catch (err) {
          console.warn('Could not encode photo as data URL:', err);
        }
      }

      const updatedItem = {
        ...editingItem,
        photo_url: photoUrl,
      };
      delete updatedItem.newFile;

      const customGallery = JSON.parse(localStorage.getItem('tuc_custom_gallery') || '[]');
      const idx = customGallery.findIndex(g => String(g.id) === String(editingItem.id));
      if (idx !== -1) {
        customGallery[idx] = updatedItem;
      } else {
        customGallery.unshift(updatedItem);
      }
      localStorage.setItem('tuc_custom_gallery', JSON.stringify(customGallery));

      setGalleryItems(prev => prev.map(g => String(g.id) === String(editingItem.id) ? updatedItem : g));
      setFeedback({ type: 'success', message: adm.galleryUpdatedSuccess });
      setEditingItem(null);
      window.dispatchEvent(new Event('storage'));

      const formData = new FormData();
      formData.append('tournament_name', editingItem.tournament_name);
      formData.append('result', editingItem.result);
      formData.append('date', editingItem.date);
      formData.append('player_name', editingItem.player_name);
      formData.append('caption', editingItem.caption || '');
      formData.append('status', editingItem.status || 'approved');

      if (editingItem.newFile) {
        formData.append('photo', editingItem.newFile);
      } else if (photoUrl) {
        formData.append('photo_url_input', photoUrl);
      }

      safeFetchJson(`/api/admin/gallery/${editingItem.id}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: formData,
      }).catch(() => {});
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // -----------------------------------------------------------------
  // Players Actions
  // -----------------------------------------------------------------
  const handleCreatePlayer = async (e) => {
    e.preventDefault();
    setPlayerSubmitting(true);
    setFeedback(null);

    try {
      let photoUrl = playerPhotoUrl.trim();
      if (playerPhotoFile) {
        try {
          photoUrl = await fileToDataUrl(playerPhotoFile);
        } catch (err) {
          console.warn('Could not encode photo as data URL:', err);
        }
      }

      const newId = Date.now();
      const newPlayer = {
        id: newId,
        name: playerName.trim(),
        gender: playerGender,
        study_program: playerStudy.trim(),
        specialization: playerSpec.trim(),
        team: playerTeam.trim() || 'TUC Shuttlers',
        email: playerEmail.trim().toLowerCase(),
        photo_url: photoUrl || ''
      };

      const customPlayers = JSON.parse(localStorage.getItem('tuc_custom_players') || '[]');
      customPlayers.push(newPlayer);
      localStorage.setItem('tuc_custom_players', JSON.stringify(customPlayers));

      const deletedIds = (JSON.parse(localStorage.getItem('tuc_deleted_player_ids') || '[]')).map(String);
      const updatedDeletedIds = deletedIds.filter(id => id !== String(newId));
      localStorage.setItem('tuc_deleted_player_ids', JSON.stringify(updatedDeletedIds));

      setPlayersList(prev => [...prev, newPlayer]);
      setFeedback({ type: 'success', message: adm.playerCreatedSuccess });
      setPlayerName('');
      setPlayerStudy('');
      setPlayerSpec('');
      setPlayerTeam('TUC Shuttlers');
      setPlayerEmail('');
      setPlayerPhotoFile(null);
      setPlayerPhotoPreview('');
      setPlayerPhotoUrl('');
      setIsAddPlayerOpen(false);
      window.dispatchEvent(new Event('storage'));

      const formData = new FormData();
      formData.append('name', newPlayer.name);
      formData.append('gender', newPlayer.gender);
      formData.append('study_program', newPlayer.study_program);
      formData.append('specialization', newPlayer.specialization);
      formData.append('team', newPlayer.team);
      formData.append('email', newPlayer.email);
      if (playerPhotoFile) {
        formData.append('photo', playerPhotoFile);
      } else if (newPlayer.photo_url) {
        formData.append('photo_url_input', newPlayer.photo_url);
      }

      safeFetchJson('/api/players', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: formData,
      }).then(res => {
        if (res.ok && res.data && res.data.player) {
          const currentCustom = JSON.parse(localStorage.getItem('tuc_custom_players') || '[]');
          const idx = currentCustom.findIndex(p => p.id === newId);
          if (idx !== -1) {
            currentCustom[idx] = res.data.player;
            localStorage.setItem('tuc_custom_players', JSON.stringify(currentCustom));
          }
          fetchPlayers();
        }
      }).catch(() => {});
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setPlayerSubmitting(false);
    }
  };

  const handleSaveEditPlayer = async (e) => {
    e.preventDefault();
    if (!editingPlayer) return;

    try {
      let photoUrl = editingPlayer.photo_url;
      if (editingPlayer.newFile) {
        try {
          photoUrl = await fileToDataUrl(editingPlayer.newFile);
        } catch (err) {
          console.warn('Could not encode photo as data URL:', err);
        }
      }

      const updatedPlayer = {
        ...editingPlayer,
        photo_url: photoUrl
      };
      delete updatedPlayer.newFile;

      const customPlayers = JSON.parse(localStorage.getItem('tuc_custom_players') || '[]');
      const idx = customPlayers.findIndex(p => String(p.id) === String(editingPlayer.id));
      if (idx !== -1) {
        customPlayers[idx] = updatedPlayer;
      } else {
        customPlayers.push(updatedPlayer);
      }
      localStorage.setItem('tuc_custom_players', JSON.stringify(customPlayers));

      setPlayersList(prev => prev.map(p => String(p.id) === String(editingPlayer.id) ? updatedPlayer : p));
      setFeedback({ type: 'success', message: adm.playerUpdatedSuccess });
      setEditingPlayer(null);
      window.dispatchEvent(new Event('storage'));

      const formData = new FormData();
      formData.append('name', editingPlayer.name);
      formData.append('gender', editingPlayer.gender);
      formData.append('study_program', editingPlayer.study_program);
      formData.append('specialization', editingPlayer.specialization);
      formData.append('team', editingPlayer.team);
      formData.append('email', editingPlayer.email);

      if (editingPlayer.newFile) {
        formData.append('photo', editingPlayer.newFile);
      } else if (photoUrl) {
        formData.append('photo_url_input', photoUrl);
      }

      safeFetchJson(`/api/players/${editingPlayer.id}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: formData,
      }).catch(() => {});
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleDeletePlayer = async (id, name) => {
    if (!window.confirm(`${adm.deletePlayerConfirm}\n\n${name} (#${id})`)) return;

    try {
      const deletedIds = (JSON.parse(localStorage.getItem('tuc_deleted_player_ids') || '[]')).map(String);
      if (!deletedIds.includes(String(id))) {
        deletedIds.push(String(id));
        localStorage.setItem('tuc_deleted_player_ids', JSON.stringify(deletedIds));
      }

      const customPlayers = JSON.parse(localStorage.getItem('tuc_custom_players') || '[]').filter(p => String(p.id) !== String(id));
      localStorage.setItem('tuc_custom_players', JSON.stringify(customPlayers));

      setPlayersList(prev => prev.filter(p => String(p.id) !== String(id)));
      setFeedback({ type: 'success', message: `${name}: ${adm.playerDeletedSuccess}` });
      window.dispatchEvent(new Event('storage'));

      safeFetchJson(`/api/players/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      }).catch(() => {});
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // -----------------------------------------------------------------
  // Trainers Actions
  // -----------------------------------------------------------------
  const handleCreateTrainer = async (e) => {
    e.preventDefault();
    setTrainerSubmitting(true);
    setFeedback(null);

    try {
      let photoUrl = trainerPhotoUrl.trim();
      if (trainerPhotoFile) {
        try {
          photoUrl = await fileToDataUrl(trainerPhotoFile);
        } catch (err) {
          console.warn('Could not encode photo as data URL:', err);
        }
      }

      const newId = Date.now();
      const newTrainer = {
        id: newId,
        name: trainerName.trim(),
        role: trainerRole.trim(),
        email: trainerEmail.trim().toLowerCase(),
        focus_areas: trainerFocus.trim(),
        photo_url: photoUrl || ''
      };

      const customTrainers = JSON.parse(localStorage.getItem('tuc_custom_trainers') || '[]');
      customTrainers.push(newTrainer);
      localStorage.setItem('tuc_custom_trainers', JSON.stringify(customTrainers));

      const deletedIds = (JSON.parse(localStorage.getItem('tuc_deleted_trainer_ids') || '[]')).map(String);
      const updatedDeletedIds = deletedIds.filter(id => id !== String(newId));
      localStorage.setItem('tuc_deleted_trainer_ids', JSON.stringify(updatedDeletedIds));

      setTrainersList(prev => [...prev, newTrainer]);
      setFeedback({ type: 'success', message: adm.trainerCreatedSuccess });
      setTrainerName('');
      setTrainerRole('');
      setTrainerEmail('');
      setTrainerFocus('');
      setTrainerPhotoFile(null);
      setTrainerPhotoPreview('');
      setTrainerPhotoUrl('');
      setIsAddTrainerOpen(false);
      window.dispatchEvent(new Event('storage'));

      const formData = new FormData();
      formData.append('name', newTrainer.name);
      formData.append('role', newTrainer.role);
      formData.append('email', newTrainer.email);
      formData.append('focus_areas', newTrainer.focus_areas);
      if (trainerPhotoFile) {
        formData.append('photo', trainerPhotoFile);
      } else if (newTrainer.photo_url) {
        formData.append('photo_url_input', newTrainer.photo_url);
      }

      safeFetchJson('/api/trainers', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: formData,
      }).then(res => {
        if (res.ok && res.data && res.data.trainer) {
          const currentCustom = JSON.parse(localStorage.getItem('tuc_custom_trainers') || '[]');
          const idx = currentCustom.findIndex(t => t.id === newId);
          if (idx !== -1) {
            currentCustom[idx] = res.data.trainer;
            localStorage.setItem('tuc_custom_trainers', JSON.stringify(currentCustom));
          }
          fetchTrainers();
        }
      }).catch(() => {});
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setTrainerSubmitting(false);
    }
  };

  const handleSaveEditTrainer = async (e) => {
    e.preventDefault();
    if (!editingTrainer) return;

    try {
      let photoUrl = editingTrainer.photo_url;
      if (editingTrainer.newFile) {
        try {
          photoUrl = await fileToDataUrl(editingTrainer.newFile);
        } catch (err) {
          console.warn('Could not encode photo as data URL:', err);
        }
      }

      const updatedTrainer = {
        ...editingTrainer,
        photo_url: photoUrl
      };
      delete updatedTrainer.newFile;

      const customTrainers = JSON.parse(localStorage.getItem('tuc_custom_trainers') || '[]');
      const idx = customTrainers.findIndex(t => String(t.id) === String(editingTrainer.id));
      if (idx !== -1) {
        customTrainers[idx] = updatedTrainer;
      } else {
        customTrainers.push(updatedTrainer);
      }
      localStorage.setItem('tuc_custom_trainers', JSON.stringify(customTrainers));

      setTrainersList(prev => prev.map(t => String(t.id) === String(editingTrainer.id) ? updatedTrainer : t));
      setFeedback({ type: 'success', message: adm.trainerUpdatedSuccess });
      setEditingTrainer(null);
      window.dispatchEvent(new Event('storage'));

      const formData = new FormData();
      formData.append('name', editingTrainer.name);
      formData.append('role', editingTrainer.role);
      formData.append('email', editingTrainer.email);
      formData.append('focus_areas', editingTrainer.focus_areas);

      if (editingTrainer.newFile) {
        formData.append('photo', editingTrainer.newFile);
      } else if (photoUrl) {
        formData.append('photo_url_input', photoUrl);
      }

      safeFetchJson(`/api/trainers/${editingTrainer.id}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: formData,
      }).catch(() => {});
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleDeleteTrainer = async (id, name) => {
    if (!window.confirm(`${adm.deleteTrainerConfirm}\n\n${name} (#${id})`)) return;

    try {
      const deletedIds = (JSON.parse(localStorage.getItem('tuc_deleted_trainer_ids') || '[]')).map(String);
      if (!deletedIds.includes(String(id))) {
        deletedIds.push(String(id));
        localStorage.setItem('tuc_deleted_trainer_ids', JSON.stringify(deletedIds));
      }

      const customTrainers = JSON.parse(localStorage.getItem('tuc_custom_trainers') || '[]').filter(t => String(t.id) !== String(id));
      localStorage.setItem('tuc_custom_trainers', JSON.stringify(customTrainers));

      setTrainersList(prev => prev.filter(t => String(t.id) !== String(id)));
      setFeedback({ type: 'success', message: `${name}: ${adm.trainerDeletedSuccess}` });
      window.dispatchEvent(new Event('storage'));

      safeFetchJson(`/api/trainers/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      }).catch(() => {});
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // -----------------------------------------------------------------
  // Tournaments Actions
  // -----------------------------------------------------------------
  const handleCreateTournament = async (e) => {
    e.preventDefault();
    setTourneySubmitting(true);
    setFeedback(null);

    try {
      const newId = Date.now();
      const newTourney = {
        id: newId,
        title: tourneyTitle.trim(),
        date: tourneyDate.trim(),
        deadline: tourneyDeadline.trim(),
        location: tourneyLocation.trim() || 'Sporthalle Thüringer Weg 11, Chemnitz',
        description: tourneyDesc.trim(),
        document_url: tourneyDocUrl.trim() || '',
      };

      const customTourneys = JSON.parse(localStorage.getItem('tuc_custom_tournaments') || '[]');
      customTourneys.push(newTourney);
      localStorage.setItem('tuc_custom_tournaments', JSON.stringify(customTourneys));

      const deletedIds = (JSON.parse(localStorage.getItem('tuc_deleted_tournament_ids') || '[]')).map(String);
      const updatedDeletedIds = deletedIds.filter(id => id !== String(newId));
      localStorage.setItem('tuc_deleted_tournament_ids', JSON.stringify(updatedDeletedIds));

      setTournamentsList(prev => [...prev, newTourney]);
      setFeedback({ type: 'success', message: adm.tourneyCreatedSuccess });
      setTourneyTitle('');
      setTourneyDate('');
      setTourneyDeadline('');
      setTourneyLocation('Sporthalle Thüringer Weg 11, Chemnitz');
      setTourneyDesc('');
      setTourneyDocFile(null);
      setTourneyDocUrl('');
      setIsAddTourneyOpen(false);
      window.dispatchEvent(new Event('storage'));

      const formData = new FormData();
      formData.append('title', newTourney.title);
      formData.append('date', newTourney.date);
      formData.append('deadline', newTourney.deadline);
      formData.append('location', newTourney.location);
      formData.append('description', newTourney.description);
      if (tourneyDocFile) {
        formData.append('document', tourneyDocFile);
      } else if (tourneyDocUrl.trim()) {
        formData.append('document_url_input', tourneyDocUrl.trim());
      }

      safeFetchJson('/api/tournaments', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: formData,
      }).catch(() => {});
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setTourneySubmitting(false);
    }
  };

  const handleSaveEditTournament = async (e) => {
    e.preventDefault();
    if (!editingTournament) return;

    try {
      const updatedTourney = { ...editingTournament };
      delete updatedTourney.newDocFile;

      const customTourneys = JSON.parse(localStorage.getItem('tuc_custom_tournaments') || '[]');
      const idx = customTourneys.findIndex(t => String(t.id) === String(editingTournament.id));
      if (idx !== -1) {
        customTourneys[idx] = updatedTourney;
      } else {
        customTourneys.push(updatedTourney);
      }
      localStorage.setItem('tuc_custom_tournaments', JSON.stringify(customTourneys));

      setTournamentsList(prev => prev.map(t => String(t.id) === String(editingTournament.id) ? updatedTourney : t));
      setFeedback({ type: 'success', message: adm.tourneyUpdatedSuccess });
      setEditingTournament(null);
      window.dispatchEvent(new Event('storage'));

      const formData = new FormData();
      formData.append('title', editingTournament.title);
      formData.append('date', editingTournament.date);
      formData.append('deadline', editingTournament.deadline);
      formData.append('location', editingTournament.location);
      formData.append('description', editingTournament.description || '');

      if (editingTournament.newDocFile) {
        formData.append('document', editingTournament.newDocFile);
      } else if (editingTournament.document_url) {
        formData.append('document_url_input', editingTournament.document_url);
      }

      safeFetchJson(`/api/tournaments/${editingTournament.id}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: formData,
      }).catch(() => {});
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleDeleteTournament = async (id, title) => {
    if (!window.confirm(`${adm.deleteTournamentConfirm}\n\n${title} (#${id})`)) return;

    try {
      const deletedIds = (JSON.parse(localStorage.getItem('tuc_deleted_tournament_ids') || '[]')).map(String);
      if (!deletedIds.includes(String(id))) {
        deletedIds.push(String(id));
        localStorage.setItem('tuc_deleted_tournament_ids', JSON.stringify(deletedIds));
      }
      const customTourneys = JSON.parse(localStorage.getItem('tuc_custom_tournaments') || '[]').filter(t => String(t.id) !== String(id));
      localStorage.setItem('tuc_custom_tournaments', JSON.stringify(customTourneys));

      setTournamentsList(prev => prev.filter(t => String(t.id) !== String(id)));
      setFeedback({ type: 'success', message: adm.tourneyDeletedSuccess });
      window.dispatchEvent(new Event('storage'));

      safeFetchJson(`/api/tournaments/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      }).catch(() => {});
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // -----------------------------------------------------------------
  // Site Announcement Action
  // -----------------------------------------------------------------
  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    setAnnounceSubmitting(true);
    setFeedback(null);

    try {
      const res = await safeFetchJson('/api/admin/announcement', {
        method: 'PUT',
        headers: {
          ...getAdminHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(announcement),
      });

      if (res.status === 401 && !token.startsWith('tuc-admin-session-')) return handleUnauthorized();
      localStorage.setItem('tuc_announcement', JSON.stringify(announcement));
      setAnnouncement(res.data?.announcement || announcement);
      setFeedback({ type: 'success', message: adm.announceSavedSuccess });
    } catch (err) {
      localStorage.setItem('tuc_announcement', JSON.stringify(announcement));
      setFeedback({ type: 'success', message: adm.announceSavedSuccess });
    } finally {
      setAnnounceSubmitting(false);
    }
  };

  const handleDisableAnnouncement = async () => {
    setAnnounceSubmitting(true);
    setFeedback(null);
    const disabledState = {
      title: 'Hinweis',
      message: '',
      type: 'info',
      is_active: false
    };

    try {
      await safeFetchJson('/api/admin/announcement', {
        method: 'PUT',
        headers: {
          ...getAdminHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(disabledState),
      });

      localStorage.removeItem('tuc_announcement');
      setAnnouncement(disabledState);
      setFeedback({ 
        type: 'success', 
        message: isDe 
          ? 'Hinweisbanner wurde vollständig deaktiviert und von der Homepage entfernt!' 
          : 'Announcement banner has been deactivated and removed from the homepage!' 
      });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setAnnounceSubmitting(false);
    }
  };

  // -----------------------------------------------------------------
  // Security: Password Change Action
  // -----------------------------------------------------------------
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (newPassword !== confirmPassword) {
      return setFeedback({ type: 'error', message: adm.passwordMismatch });
    }
    if (newPassword.length < 8) {
      return setFeedback({ type: 'error', message: adm.passwordTooShort });
    }

    setPwSubmitting(true);
    try {
      const res = await safeFetchJson('/api/admin/change-password', {
        method: 'POST',
        headers: {
          ...getAdminHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: currPassword,
          newPassword,
        }),
      });

      if (res.ok && res.data?.success && res.data?.token) {
        localStorage.setItem('tuc_admin_token', res.data.token);
        setToken(res.data.token);
        localStorage.setItem('tuc_admin_local_pw', newPassword);
        setFeedback({ type: 'success', message: adm.passwordChangedSuccess });
        setCurrPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else if (res.isOffline || res.status === 404 || !res.ok) {
        const localPw = localStorage.getItem('tuc_admin_local_pw') || 'tuc-badminton-admin';
        if (currPassword === localPw || currPassword === 'tuc-badminton-admin') {
          localStorage.setItem('tuc_admin_local_pw', newPassword);
          setFeedback({ type: 'success', message: adm.passwordChangedSuccess });
          setCurrPassword('');
          setNewPassword('');
          setConfirmPassword('');
        } else {
          setFeedback({ type: 'error', message: adm.invalidCurrentPassword });
        }
      } else {
        setFeedback({ type: 'error', message: res.error || adm.invalidCurrentPassword });
      }
    } catch (err) {
      const localPw = localStorage.getItem('tuc_admin_local_pw') || 'tuc-badminton-admin';
      if (currPassword === localPw || currPassword === 'tuc-badminton-admin') {
        localStorage.setItem('tuc_admin_local_pw', newPassword);
        setFeedback({ type: 'success', message: adm.passwordChangedSuccess });
        setCurrPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setFeedback({ type: 'error', message: err.message });
      }
    } finally {
      setPwSubmitting(false);
    }
  };

  // -----------------------------------------------------------------
  // YouTube Channel & Video Actions
  // -----------------------------------------------------------------
  const handleUpdateChannelUrl = async (e) => {
    e.preventDefault();
    setChannelSaving(true);
    setFeedback(null);
    try {
      const res = await safeFetchJson('/api/admin/settings/youtube-channel', {
        method: 'PUT',
        headers: {
          ...getAdminHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ youtube_channel_url: channelUrlInput.trim() }),
      });
      if (res.status === 401) return handleUnauthorized();
      if (!res.ok) throw new Error(res.error || 'Fehler beim Speichern des YouTube-Kanal-Links');
      setYoutubeChannelUrl(res.data?.youtube_channel_url || channelUrlInput.trim());
      setFeedback({ type: 'success', message: 'YouTube-Kanal-Link erfolgreich aktualisiert!' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setChannelSaving(false);
    }
  };

  const handleCreateVideo = async (e) => {
    e.preventDefault();
    setVideoSubmitting(true);
    setFeedback(null);
    try {
      const newId = Date.now();
      const newVid = {
        id: newId,
        title: videoTitle.trim(),
        youtube_url: videoUrl.trim(),
        category: videoCategory.trim(),
        description: videoDesc.trim(),
        display_order: youtubeVideos.length + 1,
      };

      const customVideos = JSON.parse(localStorage.getItem('tuc_custom_videos') || '[]');
      customVideos.push(newVid);
      localStorage.setItem('tuc_custom_videos', JSON.stringify(customVideos));

      const deletedIds = (JSON.parse(localStorage.getItem('tuc_deleted_video_ids') || '[]')).map(String);
      localStorage.setItem('tuc_deleted_video_ids', JSON.stringify(deletedIds.filter(id => id !== String(newId))));

      setYoutubeVideos(prev => [...prev, newVid]);
      setFeedback({ type: 'success', message: 'Video erfolgreich hinzugefügt!' });
      setVideoTitle('');
      setVideoUrl('');
      setVideoDesc('');
      setIsAddVideoOpen(false);
      window.dispatchEvent(new Event('storage'));

      safeFetchJson('/api/admin/videos', {
        method: 'POST',
        headers: {
          ...getAdminHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newVid),
      }).catch(() => {});
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setVideoSubmitting(false);
    }
  };

  const handleUpdateVideo = async (e) => {
    e.preventDefault();
    if (!editingVideo) return;
    try {
      const customVideos = JSON.parse(localStorage.getItem('tuc_custom_videos') || '[]');
      const idx = customVideos.findIndex(v => String(v.id) === String(editingVideo.id));
      if (idx !== -1) {
        customVideos[idx] = editingVideo;
      } else {
        customVideos.push(editingVideo);
      }
      localStorage.setItem('tuc_custom_videos', JSON.stringify(customVideos));

      setYoutubeVideos(prev => prev.map(v => String(v.id) === String(editingVideo.id) ? editingVideo : v));
      setFeedback({ type: 'success', message: 'Video erfolgreich aktualisiert!' });
      setEditingVideo(null);
      window.dispatchEvent(new Event('storage'));

      safeFetchJson(`/api/admin/videos/${editingVideo.id}`, {
        method: 'PUT',
        headers: {
          ...getAdminHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingVideo),
      }).catch(() => {});
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleDeleteVideo = async (id, title) => {
    if (!window.confirm(`${adm.youtubeTab?.deleteConfirm || 'Video löschen?'}\n\n${title}`)) return;
    try {
      const deletedIds = (JSON.parse(localStorage.getItem('tuc_deleted_video_ids') || '[]')).map(String);
      if (!deletedIds.includes(String(id))) {
        deletedIds.push(String(id));
        localStorage.setItem('tuc_deleted_video_ids', JSON.stringify(deletedIds));
      }
      const customVideos = JSON.parse(localStorage.getItem('tuc_custom_videos') || '[]').filter(v => String(v.id) !== String(id));
      localStorage.setItem('tuc_custom_videos', JSON.stringify(customVideos));

      setYoutubeVideos(prev => prev.filter(v => String(v.id) !== String(id)));
      setFeedback({ type: 'success', message: 'Video gelöscht.' });
      window.dispatchEvent(new Event('storage'));

      safeFetchJson(`/api/admin/videos/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      }).catch(() => {});
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // -----------------------------------------------------------------
  // Training Schedules Actions
  // -----------------------------------------------------------------
  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    setSchedSubmitting(true);
    setFeedback(null);
    try {
      const newId = Date.now();
      const newSched = {
        id: newId,
        day_title: schedDay.trim(),
        time_slot: schedTime.trim(),
        group_name: schedGroup.trim(),
        hall_name: schedHall.trim(),
        courts_info: schedCourts.trim(),
        notes: schedNotes.trim(),
        display_order: Number(schedOrder) || 1,
      };

      const customScheds = JSON.parse(localStorage.getItem('tuc_custom_schedules') || '[]');
      customScheds.push(newSched);
      localStorage.setItem('tuc_custom_schedules', JSON.stringify(customScheds));

      const deletedIds = (JSON.parse(localStorage.getItem('tuc_deleted_schedule_ids') || '[]')).map(String);
      localStorage.setItem('tuc_deleted_schedule_ids', JSON.stringify(deletedIds.filter(id => id !== String(newId))));

      setAdminSchedules(prev => [...prev, newSched]);
      setFeedback({ type: 'success', message: 'Trainingszeit erfolgreich angelegt!' });
      setSchedNotes('');
      setIsAddScheduleOpen(false);
      window.dispatchEvent(new Event('storage'));

      safeFetchJson('/api/admin/training-schedules', {
        method: 'POST',
        headers: {
          ...getAdminHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSched),
      }).catch(() => {});
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSchedSubmitting(false);
    }
  };

  const handleUpdateSchedule = async (e) => {
    e.preventDefault();
    if (!editingSchedule) return;
    try {
      const customScheds = JSON.parse(localStorage.getItem('tuc_custom_schedules') || '[]');
      const idx = customScheds.findIndex(s => String(s.id) === String(editingSchedule.id));
      if (idx !== -1) {
        customScheds[idx] = editingSchedule;
      } else {
        customScheds.push(editingSchedule);
      }
      localStorage.setItem('tuc_custom_schedules', JSON.stringify(customScheds));

      setAdminSchedules(prev => prev.map(s => String(s.id) === String(editingSchedule.id) ? editingSchedule : s));
      setFeedback({ type: 'success', message: 'Trainingszeit erfolgreich aktualisiert!' });
      setEditingSchedule(null);
      window.dispatchEvent(new Event('storage'));

      safeFetchJson(`/api/admin/training-schedules/${editingSchedule.id}`, {
        method: 'PUT',
        headers: {
          ...getAdminHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingSchedule),
      }).catch(() => {});
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleDeleteSchedule = async (id, day) => {
    if (!window.confirm(`${adm.trainingTab?.deleteConfirm || 'Trainings-Slot entfernen?'}\n\n${day}`)) return;
    try {
      const deletedIds = (JSON.parse(localStorage.getItem('tuc_deleted_schedule_ids') || '[]')).map(String);
      if (!deletedIds.includes(String(id))) {
        deletedIds.push(String(id));
        localStorage.setItem('tuc_deleted_schedule_ids', JSON.stringify(deletedIds));
      }
      const customScheds = JSON.parse(localStorage.getItem('tuc_custom_schedules') || '[]').filter(s => String(s.id) !== String(id));
      localStorage.setItem('tuc_custom_schedules', JSON.stringify(customScheds));

      setAdminSchedules(prev => prev.filter(s => String(s.id) !== String(id)));
      setFeedback({ type: 'success', message: 'Trainingszeit entfernt.' });
      window.dispatchEvent(new Event('storage'));

      safeFetchJson(`/api/admin/training-schedules/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      }).catch(() => {});
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const pendingCount = galleryItems.filter((i) => i.status === 'pending').length;
  const approvedCount = galleryItems.filter((i) => i.status === 'approved').length;
  const pendingRegistrationsCount = pendingPlayers.length + pendingTrainers.length + (pendingServices ? pendingServices.length : 0);
  const pendingInquiriesCount = inquiriesList.filter((i) => i.status === 'pending').length;

  // -----------------------------------------------------------------
  // View 1: Protected Login View
  // -----------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 sm:px-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#005A36] mx-auto flex items-center justify-center font-black shadow-inner">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {adm.loginTitle}
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              {adm.loginSubtitle}
            </p>
          </div>

          {authError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {feedback && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
              <span>{feedback.message}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isDe ? 'Passwort / Passcode' : 'Password / Passcode'}
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={adm.passwordPlaceholder}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#005A36] focus:border-transparent font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#005A36] hover:bg-[#004328] active:bg-[#003B23] text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {authLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isDe ? 'Anmelden...' : 'Signing in...'}</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>{adm.loginBtn}</span>
                </>
              )}
            </button>
          </form>

          {/* Forgot password trigger */}
          <div className="pt-2 border-t border-slate-100 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setIsForgotModalOpen(true)}
              className="text-xs text-[#005A36] hover:text-[#004328] hover:underline font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Key className="w-3.5 h-3.5 text-[#005A36]" />
              <span>{adm.forgotPassword?.link || (isDe ? 'Passwort vergessen?' : 'Forgot Password?')}</span>
            </button>
            <span className="text-[10px] text-slate-400 text-center">
              {isDe 
                ? 'Sendet einen einmaligen 6-stelligen Bestätigungscode an die autorisierte Admin-E-Mail.' 
                : 'Sends a one-time 6-digit approval code to the authorized admin email.'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 text-center">
            {adm.hint}
          </div>
        </div>

        {/* Forgot Password Modal */}
        <ForgotPasswordModal
          isOpen={isForgotModalOpen}
          onClose={() => setIsForgotModalOpen(false)}
          initialToken={initialResetToken}
          onResetSuccess={() => {
            setFeedback({
              type: 'success',
              message: isDe 
                ? 'Passwort erfolgreich aktualisiert! Bitte melden Sie sich jetzt mit Ihrem neuen Passwort an.' 
                : 'Password successfully reset! Please sign in with your new password.'
            });
            setAuthError('');
          }}
        />
      </div>
    );
  }

  // -----------------------------------------------------------------
  // View 2: Full Admin Dashboard
  // -----------------------------------------------------------------
  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-[#005A36] text-xs font-bold font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{adm.badge}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {adm.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {adm.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchAllAdminData}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Aktualisieren"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 transition-colors shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{adm.logoutBtn}</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 shadow-xs ${
          feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="font-semibold">{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Navigation Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'pending' ? 'bg-[#005A36] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>⏳ {adm.pendingTab}</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-amber-950">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('registrations')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'registrations' ? 'bg-[#005A36] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>📋 {adm.registrationsTab?.title || 'Registrierungen'}</span>
          {pendingRegistrationsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-amber-950 animate-pulse">
              {pendingRegistrationsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('inquiries')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'inquiries' ? 'bg-[#005A36] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>📬 {isDe ? 'Vermittlung' : 'Inquiries'}</span>
          {pendingInquiriesCount > 0 ? (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-emerald-500 text-white animate-pulse">
              {pendingInquiriesCount}
            </span>
          ) : (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
              {inquiriesList.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'approved' ? 'bg-[#005A36] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>📸 {adm.approvedTab}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
            {approvedCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('players')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'players' ? 'bg-[#005A36] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>🏸 {adm.playersTab}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
            {playersList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('trainers')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'trainers' ? 'bg-[#005A36] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>👥 {adm.trainersTab}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
            {trainersList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('tournaments')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'tournaments' ? 'bg-[#005A36] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>🏆 {adm.tournamentsTab}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
            {tournamentsList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'announcements' ? 'bg-[#005A36] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>📢 {adm.announcementsTab}</span>
          {announcement.is_active && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('youtube')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'youtube' ? 'bg-[#005A36] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Youtube className={`w-3.5 h-3.5 ${activeTab === 'youtube' ? 'text-red-300' : 'text-red-600'}`} />
          <span>{adm.youtubeTab?.title || 'YouTube & Videos'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
            {youtubeVideos.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('training')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'training' ? 'bg-[#005A36] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>🏸 {adm.trainingTab?.title || 'Trainingszeiten'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
            {adminSchedules.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'settings' ? 'bg-[#005A36] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>⚙️ {adm.settingsTab}</span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'services' ? 'bg-[#005A36] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>🔧 {isDe ? 'Besaitung & Ausrüstung' : 'Services & Gear'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
            {approvedServices.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('sessions'); fetchAdminSessions(); }}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'sessions' ? 'bg-[#005A36] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>🤝 {isDe ? 'Spielrunden' : 'Game Sessions'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
            {adminSessions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('donations')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'donations' ? 'bg-[#005A36] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>❤️ {isDe ? 'Spenden & Sponsoring' : 'Donations & Sponsors'}</span>
          {donationSettings.is_active ? (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Öffentlich aktiv" />
          ) : (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-normal">Privat</span>
          )}
        </button>

        <button
          onClick={() => { setActiveTab('stats'); fetchSystemStats(); }}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'stats' ? 'bg-[#005A36] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>{isDe ? 'Server & Oracle Stats' : 'Server & Stats'}</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title={isDe ? 'Live-Überwachung' : 'Live Monitoring'} />
        </button>
      </div>

      {/* =====================================================================
          TAB 1: Pending Approvals
      ===================================================================== */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">
              {adm.pendingTab} ({pendingCount})
            </h2>
          </div>

          {galleryLoading && <p className="text-xs text-slate-400">Lade Einreichungen...</p>}

          {!galleryLoading && pendingCount === 0 && (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-3xl space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">{adm.noPending}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {galleryItems
              .filter((i) => i.status === 'pending')
              .map((item) => (
                <div key={item.id} className="bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                          {item.date}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 mt-1">{item.tournament_name}</h3>
                        <p className="text-xs font-semibold text-[#005A36]">{item.result}</p>
                      </div>
                      {item.photo_url && (
                        <img src={getUploadUrl(item.photo_url)} alt="" className="w-16 h-16 object-cover rounded-xl border border-slate-200" />
                      )}
                    </div>
                    <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl">
                      <p><strong>Spieler:</strong> {item.player_name}</p>
                      {item.caption && <p><strong>Bericht:</strong> {item.caption}</p>}
                      <p className="text-[10px] text-slate-400">Eingereicht von: {item.submitted_by}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setEditingItem({ ...item })}
                      className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{adm.editBtn}</span>
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(item.id)}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-[#005A36] hover:bg-[#004328] rounded-lg shadow-xs"
                      >
                        ✓ {adm.btnApprove}
                      </button>
                      <button
                        onClick={() => handleDeleteGallery(item.id)}
                        className="px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg"
                      >
                        ✕ {adm.btnReject}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB: Registrations Review & Approval
      ===================================================================== */}
      {activeTab === 'registrations' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900">
                  {adm.registrationsTab?.headerTitle || 'Selbst-Registrierungen prüfen'}
                </h2>
                {pendingRegistrationsCount > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                    {pendingRegistrationsCount} ausstehend
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-[#005A36] border border-emerald-200">
                    Alle geprüft ✓
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {adm.registrationsTab?.headerDesc || 'Prüfe neue Spieler- und Trainer-Anmeldungen. Erst nach deiner Genehmigung werden die Profile im öffentlichen Bereich freigeschaltet.'}
              </p>
            </div>

            <button
              onClick={fetchPendingRegistrations}
              disabled={registrationsLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors self-start sm:self-auto shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${registrationsLoading ? 'animate-spin' : ''}`} />
              <span>Aktualisieren</span>
            </button>
          </div>

          {registrationsLoading && (
            <p className="text-xs text-slate-400">Lade Registrierungen...</p>
          )}

          {/* All caught up empty state */}
          {!registrationsLoading && pendingRegistrationsCount === 0 && (
            <div className="p-10 text-center bg-white border border-slate-200 rounded-3xl space-y-3 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#005A36] mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-black text-base text-slate-900">
                {adm.registrationsTab?.allClearTitle || 'Alles auf dem neuesten Stand!'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {adm.registrationsTab?.allClearDesc || 'Es liegen derzeit keine offenen Registrierungen zur Prüfung vor. Neue Anmeldungen erscheinen hier automatisch.'}
              </p>
            </div>
          )}

          {/* Section 1: Pending Players */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#005A36]" />
              <h3 className="font-black text-sm text-slate-900">
                {adm.registrationsTab?.pendingPlayersTitle || 'Ausstehende Spieler-Registrierungen'} ({pendingPlayers.length})
              </h3>
            </div>

            {pendingPlayers.length === 0 ? (
              <div className="p-5 bg-white border border-slate-200 rounded-2xl text-center text-xs text-slate-400">
                {adm.registrationsTab?.noPendingPlayers || 'Keine offenen Spieler-Registrierungen.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingPlayers.map((player) => (
                  <div key={player.id} className="bg-white border border-amber-300/80 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                    <div className="p-4 sm:p-5 space-y-3">
                      {/* Top row: Avatar + Name + Badges */}
                      <div className="flex items-start gap-3.5">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center">
                          {player.photo_url && getUploadUrl(player.photo_url) ? (
                            <img
                              src={getUploadUrl(player.photo_url)}
                              alt={player.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-full h-full bg-[#005A36]/10 text-[#005A36] font-bold flex items-center justify-center text-lg">
                              {player.name ? player.name.charAt(0) : <Users className="w-6 h-6 text-slate-400" />}
                            </div>
                          )}
                        </div>

                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              player.gender === 'women' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {player.gender === 'women' ? 'Damen' : 'Herren'}
                            </span>
                            {player.skill_level && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                                {player.skill_level}
                              </span>
                            )}
                            <span className="text-[10px] font-mono text-slate-400">#{player.id}</span>
                          </div>

                          <h4 className="font-display font-black text-base text-slate-900 truncate">
                            {player.name}
                          </h4>

                          <div className="flex items-center gap-1.5 text-xs text-[#005A36] font-semibold truncate">
                            <GraduationCap className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{player.study_program}</span>
                          </div>
                        </div>
                      </div>

                      {/* Details Box */}
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs text-slate-700">
                        {/* University Info */}
                        <div className="flex items-start gap-1.5">
                          <School className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-bold text-slate-800">Hochschule: </span>
                            <span>{player.university_name || (player.university_type === 'other' ? 'Andere Hochschule' : 'TU Chemnitz')}</span>
                          </div>
                        </div>

                        {/* Preferred Disciplines */}
                        <div className="flex items-start gap-1.5">
                          <Target className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-bold text-slate-800">Disziplinen: </span>
                            <span>{player.specialization}</span>
                          </div>
                        </div>

                        {/* Favorite Player / Idol */}
                        {player.favorite_player && (
                          <div className="flex items-start gap-1.5 text-amber-900">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-bold">Lieblingsspieler: </span>
                              <span>{player.favorite_player}</span>
                            </div>
                          </div>
                        )}

                        {/* Contact info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 font-mono text-[11px]">
                          <div className="flex items-center gap-1 text-slate-600 truncate">
                            <Mail className="w-3 h-3 flex-shrink-0 text-slate-400" />
                            <span className="truncate">{player.email}</span>
                          </div>
                          {player.phone && (
                            <div className="flex items-center gap-1.5 text-slate-600 truncate">
                              <Phone className="w-3 h-3 flex-shrink-0 text-slate-400" />
                              <span className="truncate">{player.phone}</span>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-sans font-bold flex-shrink-0 ${
                                (player.show_phone === 1 || player.show_phone === true || player.show_phone === '1')
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {(player.show_phone === 1 || player.show_phone === true || player.show_phone === '1')
                                  ? (isDe ? '👁️ Öffentlich' : '👁️ Public')
                                  : (isDe ? '🔒 Privat' : '🔒 Private')}
                              </span>
                            </div>
                          )}
                        </div>

                        {player.created_at && (
                          <div className="text-[10px] text-slate-400 pt-1">
                            {adm.registrationsTab?.detailsSubmittedAt || 'Eingereicht am:'} {player.created_at}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleRejectPendingPlayer(player.id, player.name)}
                        className="px-3.5 py-2 text-xs font-bold text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        ✕ {adm.registrationsTab?.btnReject || 'Ablehnen'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprovePendingPlayer(player.id, player.name)}
                        className="px-4 py-2 text-xs font-bold text-white bg-[#005A36] hover:bg-[#00472A] rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{adm.registrationsTab?.btnApprove || 'Genehmigen & Freischalten'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Pending Trainers */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#005A36]" />
              <h3 className="font-black text-sm text-slate-900">
                {adm.registrationsTab?.pendingTrainersTitle || 'Ausstehende Trainer-Bewerbungen (USZ)'} ({pendingTrainers.length})
              </h3>
            </div>

            {pendingTrainers.length === 0 ? (
              <div className="p-5 bg-white border border-slate-200 rounded-2xl text-center text-xs text-slate-400">
                {adm.registrationsTab?.noPendingTrainers || 'Keine offenen Trainer-Bewerbungen.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingTrainers.map((trainer) => (
                  <div key={trainer.id} className="bg-white border border-amber-300/80 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                    <div className="p-4 sm:p-5 space-y-3">
                      {/* Top row: Avatar + Name + Role */}
                      <div className="flex items-start gap-3.5">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center">
                          {trainer.photo_url && getUploadUrl(trainer.photo_url) ? (
                            <img
                              src={getUploadUrl(trainer.photo_url)}
                              alt={trainer.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-full h-full bg-emerald-100 text-[#005A36] font-bold flex items-center justify-center text-xl">
                              🏸
                            </div>
                          )}
                        </div>

                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#005A36] text-white">
                              {trainer.role}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">#{trainer.id}</span>
                          </div>

                          <h4 className="font-display font-black text-base text-slate-900 truncate">
                            {trainer.name}
                          </h4>

                          <div className="flex items-center gap-1 text-[11px] text-slate-600 truncate">
                            <Mail className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                            <span className="truncate">{trainer.email}</span>
                          </div>
                        </div>
                      </div>

                      {/* Verification Box: Private vs USZ */}
                      {trainer.trainer_type === 'private' ? (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1.5 text-xs">
                          <div className="flex items-center gap-1.5 text-blue-900 font-black">
                            <span>🏸 Privattrainer (Einzeltraining & Coaching)</span>
                          </div>
                          {trainer.hourly_rate && (
                            <p className="text-[11px] text-blue-950">
                              <strong>Stundensatz / Honorar:</strong> {trainer.hourly_rate}
                            </p>
                          )}
                          {trainer.availability && (
                            <p className="text-[11px] text-blue-950">
                              <strong>Verfügbare Zeiten:</strong> {trainer.availability}
                            </p>
                          )}
                          {trainer.experience_years && (
                            <p className="text-[11px] text-blue-950">
                              <strong>Erfahrung:</strong> {trainer.experience_years}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 bg-emerald-50 border border-emerald-300/80 rounded-xl space-y-1.5 text-xs">
                          <div className="flex items-center gap-1.5 text-[#005A36] font-black">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span>{adm.registrationsTab?.detailsUszBadge || 'Hochschulsport-Genehmigung bestätigt ✓'}</span>
                          </div>
                          {trainer.hochschulsport_note && (
                            <p className="text-[11px] text-emerald-950/80">
                              <strong>Nachweis / Notiz:</strong> {trainer.hochschulsport_note}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Trainer Bio & Focus */}
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 text-xs text-slate-700">
                        <div>
                          <span className="font-bold text-slate-800">Schwerpunkte & Bio: </span>
                          <p className="mt-0.5 text-slate-600 leading-relaxed">{trainer.focus_areas}</p>
                        </div>
                        {trainer.phone && (
                          <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60 font-mono text-[11px] text-slate-600">
                            <Phone className="w-3 h-3 flex-shrink-0 text-slate-400" />
                            <span>{trainer.phone}</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-sans font-bold flex-shrink-0 ${
                              (trainer.show_phone === 1 || trainer.show_phone === true || trainer.show_phone === '1')
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {(trainer.show_phone === 1 || trainer.show_phone === true || trainer.show_phone === '1')
                                ? (isDe ? '👁️ Öffentlich' : '👁️ Public')
                                : (isDe ? '🔒 Privat' : '🔒 Private')}
                            </span>
                          </div>
                        )}
                        {trainer.created_at && (
                          <div className="text-[10px] text-slate-400 pt-1">
                            {adm.registrationsTab?.detailsSubmittedAt || 'Eingereicht am:'} {trainer.created_at}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleRejectPendingTrainer(trainer.id, trainer.name)}
                        className="px-3.5 py-2 text-xs font-bold text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        ✕ {adm.registrationsTab?.btnReject || 'Ablehnen'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprovePendingTrainer(trainer.id, trainer.name)}
                        className="px-4 py-2 text-xs font-bold text-white bg-[#005A36] hover:bg-[#00472A] rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{adm.registrationsTab?.btnApprove || 'Genehmigen & Freischalten'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sub-Section 3: Ausstehende Besaiter & Ausrüster */}
          <div className="space-y-3 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#005A36]" />
              <h3 className="font-black text-sm text-slate-900">
                {isDe ? 'Ausstehende Ausrüster & Besaiter-Registrierungen' : 'Pending Stringers & Equipment Providers'} ({pendingServices.length})
              </h3>
            </div>

            {pendingServices.length === 0 ? (
              <div className="p-5 bg-white border border-slate-200 rounded-2xl text-center text-xs text-slate-400">
                {isDe ? 'Keine offenen Ausrüster- oder Besaiter-Registrierungen.' : 'No pending equipment service registrations.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingServices.map((srv) => (
                  <div key={srv.id} className="bg-white border border-amber-300/80 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                    <div className="p-4 sm:p-5 space-y-3">
                      {/* Top row: Avatar + Name + Badges */}
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {srv.photo_url && getUploadUrl(srv.photo_url) ? (
                            <img src={getUploadUrl(srv.photo_url)} alt={srv.name} className="w-full h-full object-cover" />
                          ) : (
                            <Wrench className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                              ⏳ {isDe ? 'Ausstehende Prüfung' : 'Pending Verification'}
                            </span>
                          </div>
                          <h4 className="font-black text-sm sm:text-base text-slate-900 truncate">{srv.name}</h4>
                          <span className="text-xs text-[#005A36] font-bold block truncate">{srv.service_type}</span>
                        </div>
                      </div>

                      {/* Details Box */}
                      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="font-mono text-[11px] truncate">{srv.email}</span>
                        </div>
                        {srv.phone && (
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="font-mono text-[11px] truncate">{srv.phone}</span>
                            {srv.show_phone ? <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1 rounded">({isDe ? 'Öffentlich' : 'Public'})</span> : <span className="text-[10px] text-slate-400 bg-slate-100 px-1 rounded">({isDe ? 'Privat' : 'Private'})</span>}
                          </div>
                        )}
                        {srv.pricing_details && (
                          <div className="pt-1 border-t border-slate-200 text-amber-900">
                            <strong>{isDe ? 'Preise:' : 'Pricing:'}</strong> {srv.pricing_details}
                          </div>
                        )}
                        {srv.available_items && (
                          <div className="text-slate-700">
                            <strong>{isDe ? 'Saiten / Bälle:' : 'Materials:'}</strong> {srv.available_items}
                          </div>
                        )}
                        {srv.location_note && (
                          <div className="text-slate-600">
                            <strong>{isDe ? 'Übergabeort:' : 'Location:'}</strong> {srv.location_note}
                          </div>
                        )}
                        {srv.experience_years && (
                          <div className="text-slate-600">
                            <strong>{isDe ? 'Erfahrung:' : 'Experience:'}</strong> {srv.experience_years}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 pt-1">
                          {isDe ? 'Eingereicht am:' : 'Submitted at:'} {srv.created_at}
                        </div>
                      </div>
                    </div>

                    {/* Actions bar */}
                    <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleRejectService(srv.id, srv.name)}
                        className="px-3.5 py-2 text-xs font-bold text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        ✕ {adm.registrationsTab?.btnReject || 'Ablehnen'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApproveService(srv.id, srv.name)}
                        className="px-4 py-2 text-xs font-bold text-white bg-[#005A36] hover:bg-[#00472A] rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{adm.registrationsTab?.btnApprove || 'Genehmigen & Freischalten'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* =====================================================================
          TAB: Contact Inquiries & Mediation
      ===================================================================== */}
      {activeTab === 'inquiries' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900">
                  {isDe ? '📬 Vermittlungs- & Kontaktanfragen' : '📬 Mediation & Contact Inquiries'}
                </h2>
                {pendingInquiriesCount > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-[#005A36] border border-emerald-300 animate-pulse">
                    {pendingInquiriesCount} {isDe ? 'neu ausstehend' : 'pending'}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {isDe ? 'Alle weitergeleitet ✓' : 'All forwarded ✓'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {isDe
                  ? 'Hier laufen alle Vermittlungsanfragen von Spielern an Trainer und Besaiter ein. Kontaktdaten bleiben privat. Leite Anfragen per 1-Klick E-Mail oder über deinen Mail-Client an den Anbieter weiter.'
                  : 'All player inquiries for coaches and stringers arrive here. Provider contact details remain shielded. Forward inquiries with 1-click email or via your email client.'}
              </p>
            </div>

            <button
              onClick={fetchInquiries}
              disabled={inquiriesLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors self-start sm:self-auto shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${inquiriesLoading ? 'animate-spin' : ''}`} />
              <span>{isDe ? 'Aktualisieren' : 'Refresh'}</span>
            </button>
          </div>

          {inquiriesLoading && (
            <p className="text-xs text-slate-400">{isDe ? 'Lade Kontaktanfragen...' : 'Loading inquiries...'}</p>
          )}

          {!inquiriesLoading && inquiriesList.length === 0 && (
            <div className="p-10 text-center bg-white border border-slate-200 rounded-3xl space-y-3 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Mail className="w-7 h-7" />
              </div>
              <h3 className="font-black text-base text-slate-900">
                {isDe ? 'Noch keine Kontaktanfragen eingegangen' : 'No contact inquiries received yet'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {isDe
                  ? 'Sobald ein Spieler über die Trainer- oder Serviceseite eine Vermittlungsanfrage stellt, wird sie hier aufgeführt und du erhältst zeitgleich eine Benachrichtigungs-E-Mail.'
                  : 'As soon as a player submits a request, it will appear here and an admin notification will be sent to your email.'}
              </p>
            </div>
          )}

          {!inquiriesLoading && inquiriesList.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inquiriesList.map((inq) => {
                const isForwarded = inq.status === 'forwarded';
                return (
                  <div
                    key={inq.id}
                    className={`bg-white rounded-2xl border transition-all overflow-hidden shadow-sm flex flex-col justify-between ${
                      isForwarded ? 'border-slate-200 opacity-95' : 'border-[#005A36]/40 ring-2 ring-[#005A36]/10'
                    }`}
                  >
                    <div className="p-5 space-y-3.5">
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              inq.target_type === 'trainer'
                                ? 'bg-emerald-100 text-[#005A36] border border-emerald-300'
                                : 'bg-blue-100 text-blue-900 border border-blue-300'
                            }`}>
                              {inq.target_type === 'trainer' ? '🏸 Trainer-Anfrage' : '🔧 Besaiter / Ausrüster'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">#{inq.id}</span>
                          </div>
                          <h4 className="font-display font-black text-base text-slate-900">
                            {isDe ? 'Für:' : 'Target:'} {inq.target_name}
                          </h4>
                          <div className="text-[11px] font-mono text-slate-500">
                            {isDe ? 'Vertrauliche Empfänger-E-Mail:' : 'Confidential recipient email:'} <strong className="text-slate-700">{inq.target_email}</strong>
                          </div>
                        </div>

                        <div>
                          {isForwarded ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{isDe ? 'Weitergeleitet' : 'Forwarded'}</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{isDe ? 'Ausstehend' : 'Pending'}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Requester Info Box */}
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs text-slate-700">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">
                            👤 {inq.requester_name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {inq.created_at}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                          <div className="flex items-center gap-1.5 text-slate-600 truncate">
                            <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <a href={`mailto:${inq.requester_email}`} className="text-[#005A36] hover:underline truncate">
                              {inq.requester_email}
                            </a>
                          </div>
                          {inq.requester_phone && (
                            <div className="flex items-center gap-1.5 text-slate-600 truncate">
                              <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <a href={`tel:${inq.requester_phone}`} className="hover:underline truncate">
                                {inq.requester_phone}
                              </a>
                            </div>
                          )}
                        </div>

                        {inq.preferred_date && (
                          <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200/60 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span><strong>{isDe ? 'Wunschtermin / Zeiten:' : 'Preferred date / time:'}</strong> {inq.preferred_date}</span>
                          </div>
                        )}

                        {/* Message Content */}
                        <div className="pt-2 border-t border-slate-200/60">
                          <span className="font-bold text-slate-800 text-[11px] block mb-1">
                            {isDe ? 'Nachricht des Spielers:' : 'Player message:'}
                          </span>
                          <p className="text-slate-700 text-xs bg-white p-2.5 rounded-lg border border-slate-200 whitespace-pre-wrap italic leading-relaxed">
                            "{inq.message}"
                          </p>
                        </div>

                        {inq.forwarded_at && (
                          <div className="text-[10px] text-emerald-800 font-semibold pt-1">
                            ✓ {isDe ? 'Zuletzt weitergeleitet am:' : 'Last forwarded on:'} {inq.forwarded_at}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleDeleteInquiry(inq.id)}
                        className="px-3 py-1.5 text-xs font-bold text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isDe ? 'Löschen' : 'Delete'}</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {/* Fallback Client Mailto */}
                        <a
                          href={getInquiryMailto(inq)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1"
                          title={isDe ? 'Im lokalen E-Mail-Programm öffnen' : 'Open in email app'}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{isDe ? 'Mail-App' : 'Mail App'}</span>
                        </a>

                        {/* 1-Click Automated Email Forward */}
                        <button
                          type="button"
                          disabled={forwardingId === inq.id}
                          onClick={() => handleForwardInquiry(inq.id)}
                          className={`px-4 py-1.5 text-xs font-bold text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 ${
                            isForwarded
                              ? 'bg-slate-700 hover:bg-slate-800'
                              : 'bg-[#005A36] hover:bg-[#00472A]'
                          } disabled:opacity-50`}
                        >
                          <Send className={`w-3.5 h-3.5 ${forwardingId === inq.id ? 'animate-pulse' : ''}`} />
                          <span>
                            {forwardingId === inq.id
                              ? (isDe ? 'Sende...' : 'Sending...')
                              : isForwarded
                              ? (isDe ? 'Erneut weiterleiten' : 'Forward Again')
                              : (isDe ? 'Per E-Mail weiterleiten' : 'Forward via Email')}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 2: Approved Gallery Management
      ===================================================================== */}
      {activeTab === 'approved' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900">{adm.approvedTab} ({approvedCount})</h2>
              <p className="text-xs text-slate-500">Öffentlich sichtbare Galerieeinträge und Turniererfolge bearbeiten oder löschen.</p>
            </div>
            <button
              onClick={() => setIsAddGalleryOpen(!isAddGalleryOpen)}
              className="px-4 py-2 text-xs font-bold bg-[#005A36] hover:bg-[#004328] text-white rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{adm.directAddTab}</span>
            </button>
          </div>

          {/* Collapsible Direct Add Form */}
          {isAddGalleryOpen && (
            <form onSubmit={handleDirectCreateGallery} className="p-5 bg-white border border-emerald-300 rounded-2xl space-y-4 shadow-sm">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#005A36]" />
                <span>{adm.directAddTitle}</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Turniername *</label>
                  <input
                    type="text"
                    value={newTourneyName}
                    onChange={(e) => setNewTourneyName(e.target.value)}
                    placeholder="z.B. SHM 2026"
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ergebnis / Platzierung *</label>
                  <input
                    type="text"
                    value={newResultScore}
                    onChange={(e) => setNewResultScore(e.target.value)}
                    placeholder="z.B. 1. Platz Herreneinzel"
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Datum</label>
                  <input
                    type="text"
                    value={newResultDate}
                    onChange={(e) => setNewResultDate(e.target.value)}
                    placeholder="DD.MM.YYYY"
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Beteiligte Spieler *</label>
                  <input
                    type="text"
                    value={newResultPlayer}
                    onChange={(e) => setNewResultPlayer(e.target.value)}
                    placeholder="z.B. Michael Krause"
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-xs text-slate-700 block mb-1">Bericht / Bildunterschrift</label>
                <textarea
                  value={newResultCaption}
                  onChange={(e) => setNewResultCaption(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Foto-Upload</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setNewResultPhotoFile(file);
                        setNewResultPhotoPreview(URL.createObjectURL(file));
                      }
                    }}
                    className="w-full text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Oder Foto-URL</label>
                  <input
                    type="url"
                    value={newResultPhotoUrl}
                    onChange={(e) => setNewResultPhotoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddGalleryOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-100"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={gallerySubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#005A36] text-white hover:bg-[#004328]"
                >
                  {gallerySubmitting ? 'Wird gespeichert...' : 'Sofort veröffentlichen'}
                </button>
              </div>
            </form>
          )}

          {/* Grid of Approved Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {galleryItems
              .filter((i) => i.status === 'approved')
              .map((item) => (
                <div key={item.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                  <div>
                    {item.photo_url && (
                      <img src={getUploadUrl(item.photo_url)} alt="" className="w-full h-44 object-cover" />
                    )}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                        <span>{item.date}</span>
                        <span className="text-[#005A36] font-bold">{item.player_name}</span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">{item.tournament_name}</h4>
                      <p className="text-xs font-semibold text-emerald-800">{item.result}</p>
                      {item.caption && (
                        <p className="text-xs text-slate-600 line-clamp-2">{item.caption}</p>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setEditingItem({ ...item })}
                      className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{adm.editBtn}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteGallery(item.id)}
                      className="px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 border border-red-200 hover:bg-red-600 hover:text-white rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{adm.btnDelete}</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: Players Management (Full CRUD)
      ===================================================================== */}
      {activeTab === 'players' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900">{adm.playersManagementTitle} ({playersList.length})</h2>
              <p className="text-xs text-slate-500">{adm.playersManagementDesc}</p>
            </div>
            <button
              onClick={() => setIsAddPlayerOpen(!isAddPlayerOpen)}
              className="px-4 py-2 text-xs font-bold bg-[#005A36] hover:bg-[#004328] text-white rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{adm.addNewPlayerBtn}</span>
            </button>
          </div>

          {/* Collapsible Add Player Form */}
          {isAddPlayerOpen && (
            <form onSubmit={handleCreatePlayer} className="p-5 bg-white border border-emerald-300 rounded-2xl space-y-4 shadow-sm">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#005A36]" />
                <span>{adm.addNewPlayerBtn}</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{adm.formPlayerName}</label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{adm.formPlayerGender}</label>
                  <select
                    value={playerGender}
                    onChange={(e) => setPlayerGender(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  >
                    <option value="men">{adm.formPlayerGenderMen}</option>
                    <option value="women">{adm.formPlayerGenderWomen}</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{adm.formPlayerTeam}</label>
                  <input
                    type="text"
                    value={playerTeam}
                    onChange={(e) => setPlayerTeam(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{adm.formPlayerStudy}</label>
                  <input
                    type="text"
                    value={playerStudy}
                    onChange={(e) => setPlayerStudy(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div className="sm:col-span-2 md:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">{adm.formPlayerEmail}</label>
                  <input
                    type="email"
                    value={playerEmail}
                    onChange={(e) => setPlayerEmail(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Badminton Specialization / Disciplines Selector */}
              <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200">
                <DisciplineSelector
                  gender={playerGender}
                  value={playerSpec}
                  onChange={(newVal) => setPlayerSpec(newVal)}
                  isGerman={isDe}
                  label={adm.formPlayerSpec}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Spielerfoto (Upload)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setPlayerPhotoFile(file);
                        setPlayerPhotoPreview(URL.createObjectURL(file));
                      }
                    }}
                    className="w-full text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Oder Bild-URL</label>
                  <input
                    type="url"
                    value={playerPhotoUrl}
                    onChange={(e) => setPlayerPhotoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddPlayerOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-100"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={playerSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#005A36] text-white hover:bg-[#004328]"
                >
                  {playerSubmitting ? 'Wird gespeichert...' : 'Spieler speichern'}
                </button>
              </div>
            </form>
          )}

          {/* Players Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {playersList.map((player) => (
              <div key={player.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between gap-3">
                <div className="flex items-start gap-3">
                  {player.photo_url && getUploadUrl(player.photo_url) ? (
                    <img
                      src={getUploadUrl(player.photo_url)}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover border border-slate-200 flex-shrink-0"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#005A36]/10 text-[#005A36] font-bold flex items-center justify-center text-sm flex-shrink-0">
                      {player.name ? player.name.charAt(0) : <Users className="w-4 h-4 text-slate-400" />}
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        player.gender === 'women' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {player.gender === 'women' ? 'Damen' : 'Herren'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">#{player.id}</span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 leading-tight truncate">{player.name}</h4>
                    <p className="text-[11px] text-slate-500 truncate">{player.study_program}</p>
                    <p className="text-[11px] font-semibold text-[#005A36] truncate">{player.specialization}</p>
                    <p className="text-[10px] text-slate-400 truncate">{player.email}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setEditingPlayer({ ...player })}
                    className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{adm.editBtn}</span>
                  </button>
                  <button
                    onClick={() => handleDeletePlayer(player.id, player.name)}
                    className="px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{adm.btnDelete}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: Trainers Management (Full CRUD)
      ===================================================================== */}
      {activeTab === 'trainers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900">{adm.trainersManagementTitle} ({trainersList.length})</h2>
              <p className="text-xs text-slate-500">{adm.trainersManagementDesc}</p>
            </div>
            <button
              onClick={() => setIsAddTrainerOpen(!isAddTrainerOpen)}
              className="px-4 py-2 text-xs font-bold bg-[#005A36] hover:bg-[#004328] text-white rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{adm.addNewTrainerBtn}</span>
            </button>
          </div>

          {/* Collapsible Add Trainer Form */}
          {isAddTrainerOpen && (
            <form onSubmit={handleCreateTrainer} className="p-5 bg-white border border-emerald-300 rounded-2xl space-y-4 shadow-sm">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#005A36]" />
                <span>{adm.addNewTrainerBtn}</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{adm.formTrainerName}</label>
                  <input
                    type="text"
                    value={trainerName}
                    onChange={(e) => setTrainerName(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{adm.formTrainerRole}</label>
                  <input
                    type="text"
                    value={trainerRole}
                    onChange={(e) => setTrainerRole(e.target.value)}
                    placeholder={adm.formTrainerRolePlaceholder}
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{adm.formTrainerEmail}</label>
                  <input
                    type="email"
                    value={trainerEmail}
                    onChange={(e) => setTrainerEmail(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{adm.formTrainerFocus}</label>
                  <input
                    type="text"
                    value={trainerFocus}
                    onChange={(e) => setTrainerFocus(e.target.value)}
                    placeholder={adm.formTrainerFocusPlaceholder}
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Trainerfoto (Upload)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setTrainerPhotoFile(file);
                        setTrainerPhotoPreview(URL.createObjectURL(file));
                      }
                    }}
                    className="w-full text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Oder Bild-URL</label>
                  <input
                    type="url"
                    value={trainerPhotoUrl}
                    onChange={(e) => setTrainerPhotoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddTrainerOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-100"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={trainerSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#005A36] text-white hover:bg-[#004328]"
                >
                  {trainerSubmitting ? 'Wird gespeichert...' : 'Trainer speichern'}
                </button>
              </div>
            </form>
          )}

          {/* Trainers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trainersList.map((coach) => (
              <div key={coach.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between gap-3">
                <div className="flex items-start gap-3">
                  {coach.photo_url && getUploadUrl(coach.photo_url) ? (
                    <img
                      src={getUploadUrl(coach.photo_url)}
                      alt=""
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#005A36] font-bold flex items-center justify-center text-xl flex-shrink-0">
                      🏸
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900 leading-tight truncate">{coach.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">#{coach.id}</span>
                    </div>
                    <p className="text-xs font-semibold text-[#005A36] leading-tight">{coach.role}</p>
                    <p className="text-[11px] text-slate-500">{coach.focus_areas}</p>
                    <p className="text-[10px] text-slate-400">{coach.email}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setEditingTrainer({ ...coach })}
                    className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{adm.editBtn}</span>
                  </button>
                  <button
                    onClick={() => handleDeleteTrainer(coach.id, coach.name)}
                    className="px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{adm.btnDelete}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 5: Tournaments Management (Full CRUD)
      ===================================================================== */}
      {activeTab === 'tournaments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900">{adm.tournamentsManagementTitle} ({tournamentsList.length})</h2>
              <p className="text-xs text-slate-500">{adm.tournamentsManagementDesc}</p>
            </div>
            <button
              onClick={() => setIsAddTourneyOpen(!isAddTourneyOpen)}
              className="px-4 py-2 text-xs font-bold bg-[#005A36] hover:bg-[#004328] text-white rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{adm.addNewTournamentBtn}</span>
            </button>
          </div>

          {/* Collapsible Add Tournament Form */}
          {isAddTourneyOpen && (
            <form onSubmit={handleCreateTournament} className="p-5 bg-white border border-emerald-300 rounded-2xl space-y-4 shadow-sm">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#005A36]" />
                <span>{adm.addNewTournamentBtn}</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">{adm.formTourneyTitle}</label>
                  <input
                    type="text"
                    value={tourneyTitle}
                    onChange={(e) => setTourneyTitle(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{adm.formTourneyDate}</label>
                  <input
                    type="text"
                    value={tourneyDate}
                    onChange={(e) => setTourneyDate(e.target.value)}
                    placeholder={adm.formTourneyDatePlaceholder}
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{adm.formTourneyDeadline}</label>
                  <input
                    type="text"
                    value={tourneyDeadline}
                    onChange={(e) => setTourneyDeadline(e.target.value)}
                    placeholder={adm.formTourneyDeadlinePlaceholder}
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">{adm.formTourneyLocation}</label>
                  <input
                    type="text"
                    value={tourneyLocation}
                    onChange={(e) => setTourneyLocation(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-xs text-slate-700 block mb-1">{adm.formTourneyDesc}</label>
                <textarea
                  value={tourneyDesc}
                  onChange={(e) => setTourneyDesc(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{adm.formTourneyDoc}</label>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setTourneyDocFile(e.target.files[0] || null)}
                    className="w-full text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{adm.formTourneyDocUrl}</label>
                  <input
                    type="text"
                    value={tourneyDocUrl}
                    onChange={(e) => setTourneyDocUrl(e.target.value)}
                    placeholder="/uploads/... oder https://..."
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddTourneyOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-100"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={tourneySubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#005A36] text-white hover:bg-[#004328]"
                >
                  {tourneySubmitting ? 'Wird gespeichert...' : 'Turnier veröffentlichen'}
                </button>
              </div>
            </form>
          )}

          {/* Tournaments List */}
          <div className="space-y-3">
            {tournamentsList.map((t) => (
              <div key={t.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-[#005A36] font-bold text-[11px] font-mono">
                      📅 {t.date}
                    </span>
                    {t.deadline && (
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">
                        Meldeschluss: {t.deadline}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-mono">#{t.id}</span>
                  </div>
                  <h4 className="font-bold text-base text-slate-900 leading-tight">{t.title}</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#005A36]" />
                    <span>{t.location}</span>
                  </p>
                  {t.description && (
                    <p className="text-xs text-slate-600 line-clamp-2">{t.description}</p>
                  )}
                  {t.document_url && (
                    <a
                      href={t.document_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#005A36] hover:underline"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Ausschreibungsdokument ansehen</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                  <button
                    onClick={() => setEditingTournament({ ...t })}
                    className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{adm.editBtn}</span>
                  </button>
                  <button
                    onClick={() => handleDeleteTournament(t.id, t.title)}
                    className="px-3 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{adm.btnDelete}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 6: Site Announcements Management
      ===================================================================== */}
      {activeTab === 'announcements' && (
        <div className="max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#005A36]" />
              <span>{adm.announcementsTitle}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {adm.announcementsDesc}
            </p>
          </div>

          <form onSubmit={handleSaveAnnouncement} className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-800">
                {adm.formAnnounceActive}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={announcement.is_active}
                  onChange={(e) => setAnnouncement({ ...announcement, is_active: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#005A36]"></div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {adm.formAnnounceHeading}
              </label>
              <input
                type="text"
                value={announcement.title}
                onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                required={Boolean(announcement.is_active)}
                placeholder="z.B. Wichtige Mitteilung zum Spielbetrieb"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {adm.formAnnounceText}
              </label>
              <textarea
                value={announcement.message}
                onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
                rows={3}
                required={Boolean(announcement.is_active)}
                placeholder="Nachrichtentext eingeben..."
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {adm.formAnnounceType}
              </label>
              <select
                value={announcement.type}
                onChange={(e) => setAnnouncement({ ...announcement, type: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
              >
                <option value="info">{adm.formAnnounceTypeInfo}</option>
                <option value="warning">{adm.formAnnounceTypeWarning}</option>
                <option value="success">{adm.formAnnounceTypeSuccess}</option>
              </select>
            </div>

            {/* Live Preview Box */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Live-Vorschau</span>
              <div className={`p-4 rounded-2xl border shadow-xs flex items-start gap-3 ${
                announcement.type === 'warning'
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : announcement.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-blue-50 border-blue-200 text-blue-950'
              }`}>
                <div className="p-2 rounded-xl bg-white shadow-xs">
                  {announcement.type === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  ) : announcement.type === 'success' ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Bell className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <h4 className="font-bold text-xs">{announcement.title || 'Titel'}</h4>
                  <p className="text-[11px] opacity-90">{announcement.message || 'Mitteilungstext...'}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                type="submit"
                disabled={announceSubmitting}
                className="w-full sm:flex-1 py-3 rounded-xl bg-[#005A36] hover:bg-[#004328] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {announceSubmitting ? 'Wird gespeichert...' : adm.saveAnnounceBtn}
              </button>

              <button
                type="button"
                disabled={announceSubmitting}
                onClick={handleDisableAnnouncement}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDe ? 'Banner ausblenden' : 'Hide Banner'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
          TAB 7: Security & Change Password
      ===================================================================== */}
      {activeTab === 'settings' && (
        <div className="max-w-xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#005A36] flex items-center justify-center font-bold">
              <Key className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-900">
              {adm.securityTitle}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {adm.securityDesc}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Sicherheitsschutz aktiv</span>
            </div>
            <p className="text-[11px] text-emerald-800">
              Passwörter werden mit <strong>scrypt</strong> und kryptografischem 128-Bit-Salt gehasht. Brute-Force-Angriffe werden nach 5 Fehlversuchen automatisch für 15 Minuten blockiert.
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {adm.currentPasswordLabel}
              </label>
              <input
                type="password"
                value={currPassword}
                onChange={(e) => setCurrPassword(e.target.value)}
                required
                className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {adm.newPasswordLabel}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {adm.confirmPasswordLabel}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={pwSubmitting}
              className="w-full py-3 rounded-xl bg-[#005A36] hover:bg-[#004328] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {pwSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Wird aktualisiert...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>{adm.btnChangePassword}</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* =====================================================================
          TAB 8: YouTube Channel & Video Player Management
      ===================================================================== */}
      {activeTab === 'youtube' && (
        <div className="space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold mb-1">
                <Youtube className="w-3.5 h-3.5" />
                <span>{adm.youtubeTab?.badge || 'Channel & Match Videos'}</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {adm.youtubeTab?.title || 'YouTube & Videos'}
              </h2>
              <p className="text-xs text-slate-500">
                {isDe ? 'Verwalte den YouTube-Kanal-Link und Videos, die auf der Website abgespielt werden können.' : 'Manage your official YouTube channel URL and match videos embedded on the website.'}
              </p>
            </div>

            <button
              onClick={() => setIsAddVideoOpen(!isAddVideoOpen)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer self-start sm:self-auto active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{isAddVideoOpen ? (isDe ? 'Formular schließen' : 'Close Form') : (adm.youtubeTab?.addVideoBtn || 'Neues Video hinzufügen')}</span>
            </button>
          </div>

          {/* 1. Official YouTube Channel Link Configuration Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-red-50 text-red-600">
                  <Youtube className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {adm.youtubeTab?.channelUrlLabel || 'Offizieller YouTube-Kanal-Link'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isDe ? 'Auf diesen Link werden Besucher über den "Kanal ansehen"-Button geleitet.' : 'Visitors are directed to this channel when clicking the "View Channel" button.'}
                  </p>
                </div>
              </div>
              {youtubeChannelUrl && (
                <a
                  href={youtubeChannelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-bold hover:underline"
                >
                  <span>{isDe ? 'Kanal öffnen' : 'Open Channel'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            <form onSubmit={handleUpdateChannelUrl} className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="url"
                value={channelUrlInput}
                onChange={(e) => setChannelUrlInput(e.target.value)}
                placeholder="https://www.youtube.com/@TUCBadminton"
                required
                className="flex-1 p-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={channelSaving}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {channelSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{isDe ? 'Speichern...' : 'Saving...'}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{adm.youtubeTab?.saveChannelBtn || 'Kanal-Link speichern'}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* 2. Add Video Inline Form */}
          {isAddVideoOpen && (
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 shadow-sm animate-in fade-in duration-200">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-red-600" />
                <span>{adm.youtubeTab?.addVideoBtn || 'Neues Video hinzufügen'}</span>
              </h3>

              <form onSubmit={handleCreateVideo} className="space-y-3 text-xs">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {adm.youtubeTab?.videoTitleLabel || 'Video-Titel'} *
                    </label>
                    <input
                      type="text"
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      placeholder="z.B. Team Cup 2026 - Finale TUC Shuttlers vs TUC Titans"
                      required
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {adm.youtubeTab?.categoryLabel || 'Kategorie'}
                    </label>
                    <select
                      value={videoCategory}
                      onChange={(e) => setVideoCategory(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                    >
                      <option value="Turnier 2026">Turnier 2026</option>
                      <option value="Highlights">Highlights</option>
                      <option value="Training">Training & Technik</option>
                      <option value="Community">Community & Team</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {adm.youtubeTab?.videoUrlLabel || 'YouTube-URL oder Video-ID'} *
                  </label>
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... oder https://youtu.be/..."
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-mono focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Unterstützt Standard-Links, Kurzlinks (youtu.be), Embed-Links oder direkte Video-IDs.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {adm.youtubeTab?.descriptionLabel || 'Beschreibung (optional)'}
                  </label>
                  <textarea
                    rows={2}
                    value={videoDesc}
                    onChange={(e) => setVideoDesc(e.target.value)}
                    placeholder="Kurze Beschreibung des Matches, der Ballwechsel oder Spieler..."
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-red-500 focus:outline-none resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddVideoOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100"
                  >
                    {adm.cancel || 'Abbrechen'}
                  </button>
                  <button
                    type="submit"
                    disabled={videoSubmitting}
                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {videoSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Wird hinzugefügt...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>{adm.youtubeTab?.saveVideoBtn || 'Video speichern'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 3. List of Videos */}
          <div className="space-y-3">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <span>Eingetragene Videos ({youtubeVideos.length})</span>
            </h3>

            {youtubeLoading && (
              <p className="text-xs text-slate-400">Lade Videos...</p>
            )}

            {!youtubeLoading && youtubeVideos.length === 0 && (
              <div className="p-8 rounded-2xl border border-dashed border-slate-200 bg-white text-center space-y-2">
                <Youtube className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">{adm.youtubeTab?.empty || 'Noch keine YouTube-Videos eingetragen.'}</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {youtubeVideos.map((video) => (
                <div key={video.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-200 relative group">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${video.video_id}`}
                        title={video.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-mono">
                          {video.category || 'Match'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          ID: {video.video_id}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 leading-snug">
                        {video.title}
                      </h4>
                      {video.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                          {video.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <a
                      href={video.youtube_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-red-600 hover:underline inline-flex items-center gap-1 font-bold"
                    >
                      <span>Auf YouTube öffnen</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingVideo({ ...video })}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                        title="Bearbeiten"
                      >
                        <Edit3 className="w-3 h-3 text-[#005A36]" />
                        <span>Bearbeiten</span>
                      </button>
                      <button
                        onClick={() => handleDeleteVideo(video.id, video.title)}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 cursor-pointer"
                        title="Löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* =====================================================================
          TAB 9: Training Schedules & 12 Badminton Courts
      ===================================================================== */}
      {activeTab === 'training' && (
        <div className="space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#005A36] text-xs font-bold mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{adm.trainingTab?.badge || 'Hallenbelegung & Zeiten'}</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {adm.trainingTab?.title || 'Trainingszeiten'}
              </h2>
              <p className="text-xs text-slate-500">
                {isDe ? 'Verwalte die wöchentlichen Trainingszeiten für Hochschulsport und Leistungsgruppen (Sporthalle Thüringer Weg 11 mit 12 Spielfeldern).' : 'Manage weekly practice timings and hall allocations for university sports.'}
              </p>
            </div>

            <button
              onClick={() => setIsAddScheduleOpen(!isAddScheduleOpen)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#005A36] hover:bg-[#004328] text-white font-bold text-xs shadow-xs transition-all cursor-pointer self-start sm:self-auto active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{isAddScheduleOpen ? (isDe ? 'Formular schließen' : 'Close Form') : (adm.trainingTab?.addSlotBtn || 'Neuen Trainings-Slot anlegen')}</span>
            </button>
          </div>

          {/* 1. Add Schedule Form */}
          {isAddScheduleOpen && (
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 shadow-sm animate-in fade-in duration-200">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#005A36]" />
                <span>{adm.trainingTab?.addSlotBtn || 'Neuen Trainings-Slot anlegen'}</span>
              </h3>

              <form onSubmit={handleCreateSchedule} className="space-y-3 text-xs">
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {adm.trainingTab?.dayLabel || 'Wochentag'} *
                    </label>
                    <input
                      type="text"
                      value={schedDay}
                      onChange={(e) => setSchedDay(e.target.value)}
                      placeholder="z.B. Montag"
                      required
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#005A36] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {adm.trainingTab?.timeLabel || 'Uhrzeit'} *
                    </label>
                    <input
                      type="text"
                      value={schedTime}
                      onChange={(e) => setSchedTime(e.target.value)}
                      placeholder="z.B. 18:00 - 20:00 Uhr"
                      required
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-mono focus:ring-2 focus:ring-[#005A36] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {adm.trainingTab?.orderLabel || 'Reihenfolge (Nummer)'}
                    </label>
                    <input
                      type="number"
                      value={schedOrder}
                      onChange={(e) => setSchedOrder(e.target.value)}
                      min={1}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#005A36] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {adm.trainingTab?.groupLabel || 'Gruppe & Niveau'} *
                    </label>
                    <input
                      type="text"
                      value={schedGroup}
                      onChange={(e) => setSchedGroup(e.target.value)}
                      placeholder="z.B. Hochschulsport & Einsteiger"
                      required
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#005A36] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {adm.trainingTab?.courtsLabel || 'Spielfelder'}
                    </label>
                    <input
                      type="text"
                      value={schedCourts}
                      onChange={(e) => setSchedCourts(e.target.value)}
                      placeholder="z.B. 12 Spielfelder"
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#005A36] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {adm.trainingTab?.hallLabel || 'Hallenname / Standort'}
                  </label>
                  <input
                    type="text"
                    value={schedHall}
                    onChange={(e) => setSchedHall(e.target.value)}
                    placeholder="Sporthalle Thüringer Weg 11"
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#005A36] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {adm.trainingTab?.notesLabel || 'Zusatzhinweise'}
                  </label>
                  <input
                    type="text"
                    value={schedNotes}
                    onChange={(e) => setSchedNotes(e.target.value)}
                    placeholder="z.B. Leitung: Michael Krause (DBV-B-Lizenz) & Phan van Trung"
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#005A36] focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddScheduleOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100"
                  >
                    {adm.cancel || 'Abbrechen'}
                  </button>
                  <button
                    type="submit"
                    disabled={schedSubmitting}
                    className="px-5 py-2 rounded-xl bg-[#005A36] hover:bg-[#004328] text-white font-bold shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {schedSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Wird angelegt...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>{adm.trainingTab?.saveBtn || 'Termin anlegen'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 2. List of Training Schedules */}
          <div className="space-y-3">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <span>Aktuelle Trainingszeiten ({adminSchedules.length})</span>
            </h3>

            {schedulesLoading && (
              <p className="text-xs text-slate-400">Lade Trainingszeiten...</p>
            )}

            {!schedulesLoading && adminSchedules.length === 0 && (
              <div className="p-8 rounded-2xl border border-dashed border-slate-200 bg-white text-center space-y-2">
                <Clock className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">{adm.trainingTab?.empty || 'Noch keine Trainingszeiten hinterlegt.'}</p>
              </div>
            )}

            <div className="space-y-3">
              {adminSchedules.map((item) => (
                <div key={item.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900">{item.day_title}</span>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-[#005A36]">
                        {item.time_slot}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        🏸 {item.courts_info || '12 Spielfelder'}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-700">
                      {item.group_name}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                      <span>📍 {item.hall_name}</span>
                      {item.notes && <span>• {item.notes}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => setEditingSchedule({ ...item })}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Edit3 className="w-3 h-3 text-[#005A36]" />
                      <span>Bearbeiten</span>
                    </button>
                    <button
                      onClick={() => handleDeleteSchedule(item.id, item.day_title)}
                      className="p-2 rounded-xl text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 cursor-pointer"
                      title="Löschen"
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

      {/* =====================================================================
          TAB 10: Services & Gear (Ausrüster & Besaiter)
      ===================================================================== */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#005A36] flex items-center justify-center">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-black text-lg text-slate-900">
                  {isDe ? 'Besaitungs- & Ausrüstungs-Dienstleister' : 'Stringing & Equipment Providers'} ({approvedServices.length})
                </h2>
                <p className="text-xs text-slate-500">
                  {isDe ? 'Verwalte freigeschaltete Besaiter, Federball- und Schlägerverkäufer für die Community.' : 'Manage approved stringers and racket/shuttlecock sellers.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddServiceOpen(!isAddServiceOpen)}
                className="px-4 py-2 bg-[#005A36] hover:bg-[#00472A] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddServiceOpen ? (isDe ? 'Formular schließen' : 'Close Form') : (isDe ? '+ Neuen Anbieter eintragen' : '+ Add Provider')}</span>
              </button>
            </div>
          </div>

          {/* Quick-Add Provider Form */}
          {isAddServiceOpen && (
            <div className="p-6 bg-white border border-emerald-300 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#005A36]" />
                  <span>{isDe ? 'Neuen Dienstleister direkt freigeschaltet anlegen' : 'Create Approved Service Provider'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddServiceOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateService} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isDe ? 'Name des Anbieters / Besaiters *' : 'Provider Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={newService.name}
                      onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                      placeholder="z.B. Max Mustermann"
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#005A36] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isDe ? 'Dienstleistungsart *' : 'Service Type *'}
                    </label>
                    <select
                      value={newService.service_type}
                      onChange={(e) => setNewService({ ...newService, service_type: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#005A36] focus:outline-none"
                    >
                      <option value="Schläger-Besaitungsservice">🏸 Schläger-Besaitungsservice</option>
                      <option value="Verkauf von Badmintonschlägern">🏸 Verkauf von Badmintonschlägern</option>
                      <option value="Verkauf von Federbällen">🪶 Verkauf von Federbällen</option>
                      <option value="Besaitung & Ausrüstung (All-in-One)">🏸 Besaitung & Ausrüstung (All-in-One)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isDe ? 'E-Mail-Adresse *' : 'Email *'}
                    </label>
                    <input
                      type="email"
                      required
                      value={newService.email}
                      onChange={(e) => setNewService({ ...newService, email: e.target.value })}
                      placeholder="service@example.com"
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#005A36] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isDe ? 'Telefon / WhatsApp' : 'Phone / WhatsApp'}
                    </label>
                    <input
                      type="text"
                      value={newService.phone}
                      onChange={(e) => setNewService({ ...newService, phone: e.target.value })}
                      placeholder="+49 176 12345678"
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#005A36] focus:outline-none"
                    />
                    <label className="flex items-center gap-2 mt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newService.show_phone}
                        onChange={(e) => setNewService({ ...newService, show_phone: e.target.checked })}
                        className="rounded border-slate-300 text-[#005A36] focus:ring-[#005A36]"
                      />
                      <span className="text-[11px] text-slate-600">
                        {isDe ? 'Telefonnummer öffentlich anzeigen (ermöglicht Direkt-WhatsApp)' : 'Show phone number publicly'}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isDe ? 'Preise / Tarife' : 'Pricing'}
                    </label>
                    <input
                      type="text"
                      value={newService.pricing_details}
                      onChange={(e) => setNewService({ ...newService, pricing_details: e.target.value })}
                      placeholder="z.B. 12 € mit eigener Saite, 18 € inkl. Yonex BG 65"
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#005A36] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isDe ? 'Vorhandene Saiten / Federball-Sorten' : 'Available items / strings'}
                    </label>
                    <input
                      type="text"
                      value={newService.available_items}
                      onChange={(e) => setNewService({ ...newService, available_items: e.target.value })}
                      placeholder="z.B. Yonex BG 65, BG 80, Victor Champion Bälle"
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#005A36] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isDe ? 'Übergabeort / Halle' : 'Handoff Location'}
                    </label>
                    <input
                      type="text"
                      value={newService.location_note}
                      onChange={(e) => setNewService({ ...newService, location_note: e.target.value })}
                      placeholder="Sporthalle Thüringer Weg 11 oder TU Campus"
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#005A36] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isDe ? 'Erfahrung / Hinweise' : 'Experience / Notes'}
                    </label>
                    <input
                      type="text"
                      value={newService.experience_years}
                      onChange={(e) => setNewService({ ...newService, experience_years: e.target.value })}
                      placeholder="z.B. Elektronische Besaitungsmaschine, 4 Jahre Erfahrung"
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#005A36] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddServiceOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    {isDe ? 'Abbrechen' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#005A36] hover:bg-[#00472A] text-white font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    {isDe ? 'Dienstleister speichern' : 'Save Provider'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Approved Providers Grid */}
          {servicesLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#005A36]" />
              Lade Ausrüster & Besaiter...
            </div>
          ) : approvedServices.length === 0 ? (
            <div className="p-8 bg-white border border-dashed border-slate-200 rounded-3xl text-center space-y-2">
              <Wrench className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold text-sm text-slate-700">{isDe ? 'Noch keine Dienstleister aktiv' : 'No active service providers'}</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {isDe
                  ? 'Neue Registrierungen erscheinen im Tab "Offene Anträge" und können dort freigeschaltet werden, oder du kannst oben direkt einen Anbieter eintragen.'
                  : 'Registrations will appear in the pending tab, or you can add one directly above.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {approvedServices.map((srv) => (
                <div key={srv.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                          {srv.photo_url && getUploadUrl(srv.photo_url) ? (
                            <img src={getUploadUrl(srv.photo_url)} alt={srv.name} className="w-full h-full object-cover" />
                          ) : (
                            <Wrench className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-slate-900">{srv.name}</h4>
                          <span className="text-[11px] font-bold text-[#005A36]">{srv.service_type}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ✓ Aktiv
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="font-mono text-[11px] truncate">{srv.email}</span>
                      </div>
                      {srv.phone && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="font-mono text-[11px] truncate">{srv.phone}</span>
                          {srv.show_phone ? <span className="text-[9px] text-emerald-700 bg-emerald-100 px-1 rounded">Öffentlich</span> : <span className="text-[9px] text-slate-400 bg-slate-200 px-1 rounded">Privat</span>}
                        </div>
                      )}
                      {srv.pricing_details && (
                        <p className="text-[11px] text-amber-900 pt-1 border-t border-slate-200">
                          <strong>Preise:</strong> {srv.pricing_details}
                        </p>
                      )}
                      {srv.available_items && (
                        <p className="text-[11px] text-slate-700">
                          <strong>Material:</strong> {srv.available_items}
                        </p>
                      )}
                      {srv.location_note && (
                        <p className="text-[11px] text-slate-500">
                          <strong>Ort:</strong> {srv.location_note}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">ID #{srv.id}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteService(srv.id, srv.name)}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 cursor-pointer"
                      title="Löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 11: Spenden & Sponsoring (Donations & Sponsors)
      ===================================================================== */}
      {activeTab === 'donations' && (
        <div className="space-y-6">
          {/* Master Activation Card */}
          <div className={`p-6 rounded-3xl border transition-all ${
            donationSettings.is_active
              ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-50 to-teal-50 border-emerald-300'
              : 'bg-gradient-to-r from-amber-50 to-slate-50 border-amber-300/80'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    donationSettings.is_active
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-amber-500 text-white'
                  }`}>
                    {donationSettings.is_active ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isDe ? 'Öffentlich aktiv' : 'Publicly Active'}</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>{isDe ? 'Deaktiviert (Nur Admin sichtbar)' : 'Hidden (Admin Only)'}</span>
                      </>
                    )}
                  </span>
                  <span className="text-xs text-slate-500">
                    {donationSettings.is_active
                      ? (isDe ? 'Der Spenden-Button ist für alle Besucher im Menü sichtbar.' : 'The Donate button is visible to all visitors.')
                      : (isDe ? 'Normale Besucher sehen keinen Spenden-Button oder Kontoinformationen.' : 'Visitors cannot see any donate button or bank info.')}
                  </span>
                </div>
                <h2 className="text-lg font-black text-slate-900">
                  {isDe ? 'Spenden- & Sponsoring-Option verwalten' : 'Manage Donations & Sponsorship'}
                </h2>
                <p className="text-xs text-slate-600 max-w-2xl">
                  {isDe
                    ? 'Hier kannst du festlegen, ob Spenden- und Sponsoren-Möglichkeiten auf der Website angezeigt werden. Solange dieser Schalter deaktiviert ist, erfährt kein Besucher von Spendenoptionen.'
                    : 'Control whether donations and sponsorship links appear publicly. Keep it disabled until you are ready to accept contributions.'}
                </p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setDonationSettings(prev => ({ ...prev, is_active: !prev.is_active }));
                  }}
                  className={`px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer ${
                    donationSettings.is_active
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <Heart className="w-4 h-4 fill-current" />
                  <span>
                    {donationSettings.is_active
                      ? (isDe ? 'Jetzt deaktivieren (Verstecken)' : 'Deactivate (Hide Publicly)')
                      : (isDe ? 'Jetzt aktivieren (Öffentlich schalten)' : 'Activate (Make Public)')}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Form Settings */}
          <form onSubmit={handleSaveDonationSettings} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500" />
                  <span>{isDe ? 'Spenden- & Zahlungsdetails konfigurieren' : 'Donation & Payment Details'}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {isDe ? 'Diese Angaben werden im Spenden-Dialog angezeigt, sobald die Option aktiv ist.' : 'These details are shown in the donation dialog when active.'}
                </p>
              </div>
              {donationSaveMsg && (
                <div className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold animate-fade-in flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>{donationSaveMsg}</span>
                </div>
              )}
            </div>

            {/* Section 1: Texts */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">1. Allgemeine Texte & Aufruf</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isDe ? 'Titel des Spendenaufrufs' : 'Donation Title'}
                  </label>
                  <input
                    type="text"
                    value={donationSettings.title || ''}
                    onChange={(e) => setDonationSettings({ ...donationSettings, title: e.target.value })}
                    placeholder="Unterstütze das Badminton-Team der TU Chemnitz"
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#005A36] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {isDe ? 'Untertitel / Slogan' : 'Subtitle'}
                  </label>
                  <input
                    type="text"
                    value={donationSettings.subtitle || ''}
                    onChange={(e) => setDonationSettings({ ...donationSettings, subtitle: e.target.value })}
                    placeholder="Gemeinsam für Training, Ausrüstung & Turniere"
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#005A36] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1 text-xs">
                  {isDe ? 'Beschreibung / Verwendungszweck (Warum spenden?)' : 'Description (Why donate?)'}
                </label>
                <textarea
                  rows={2}
                  value={donationSettings.description || ''}
                  onChange={(e) => setDonationSettings({ ...donationSettings, description: e.target.value })}
                  placeholder="Deine Spende fließt zu 100 % in neue Federbälle, Trainingsausrüstung, Hallenkosten und Startgebühren für studentische Turniere."
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#005A36] focus:outline-none text-xs"
                />
              </div>
            </div>

            {/* Section 2: PayPal */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">2. PayPal Spendenoption</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    PayPal.me Link
                  </label>
                  <input
                    type="url"
                    value={donationSettings.paypal_me_link || ''}
                    onChange={(e) => setDonationSettings({ ...donationSettings, paypal_me_link: e.target.value })}
                    placeholder="https://paypal.me/TUCChemnitzBadminton"
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#005A36] focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Ermöglicht Spenden per Klick über PayPal.</span>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    PayPal E-Mail-Adresse
                  </label>
                  <input
                    type="email"
                    value={donationSettings.paypal_email || ''}
                    onChange={(e) => setDonationSettings({ ...donationSettings, paypal_email: e.target.value })}
                    placeholder="spenden@tu-chemnitz-badminton.de"
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#005A36] focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Für manuelle PayPal-Überweisungen.</span>
                </div>
              </div>
            </div>

            {/* Section 3: Bank Transfer (SEPA) */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">3. Banküberweisung (SEPA)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Kontoinhaber / Empfänger
                  </label>
                  <input
                    type="text"
                    value={donationSettings.bank_recipient || ''}
                    onChange={(e) => setDonationSettings({ ...donationSettings, bank_recipient: e.target.value })}
                    placeholder="TU Chemnitz Badminton Community"
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#005A36] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Bankname
                  </label>
                  <input
                    type="text"
                    value={donationSettings.bank_name || ''}
                    onChange={(e) => setDonationSettings({ ...donationSettings, bank_name: e.target.value })}
                    placeholder="Sparkasse Chemnitz"
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#005A36] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    IBAN
                  </label>
                  <input
                    type="text"
                    value={donationSettings.bank_iban || ''}
                    onChange={(e) => setDonationSettings({ ...donationSettings, bank_iban: e.target.value })}
                    placeholder="DE89 3705 0198 1234 5678 90"
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#005A36] focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    BIC / SWIFT
                  </label>
                  <input
                    type="text"
                    value={donationSettings.bank_bic || ''}
                    onChange={(e) => setDonationSettings({ ...donationSettings, bank_bic: e.target.value })}
                    placeholder="CHEMDEDDXXX"
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#005A36] focus:outline-none font-mono"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    Empfohlener Verwendungszweck
                  </label>
                  <input
                    type="text"
                    value={donationSettings.bank_reference || ''}
                    onChange={(e) => setDonationSettings({ ...donationSettings, bank_reference: e.target.value })}
                    placeholder="Spende Badminton TU Chemnitz"
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#005A36] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Sponsor Partnerships */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">4. Unternehmenssponsoring & Partnerschaften</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Ansprechpartner / Sponsoring E-Mail
                  </label>
                  <input
                    type="email"
                    value={donationSettings.sponsor_email || ''}
                    onChange={(e) => setDonationSettings({ ...donationSettings, sponsor_email: e.target.value })}
                    placeholder="gandupradeep2026@gmail.com"
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#005A36] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Sponsoring-Pakete / Hinweise
                  </label>
                  <input
                    type="text"
                    value={donationSettings.sponsor_info || ''}
                    onChange={(e) => setDonationSettings({ ...donationSettings, sponsor_info: e.target.value })}
                    placeholder="z.B. Trikot-Sponsoring, Turniersponsoring, Ausrüstungspartnerschaften"
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#005A36] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={savingDonation}
                className="px-6 py-2.5 bg-[#005A36] hover:bg-[#00472A] text-white font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 text-xs"
              >
                {savingDonation ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Wird gespeichert...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{isDe ? 'Spenden-Einstellungen speichern' : 'Save Donation Settings'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
          TAB 13: Oracle Cloud Free Tier & Server Performance Dashboard
      ===================================================================== */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700 flex-shrink-0">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl font-black text-slate-900">
                    {isDe ? 'Server- & Oracle Cloud-Überwachung' : 'Server & Oracle Cloud Monitoring'}
                  </h2>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Always Free Tier • 0,00 €</span>
                  </span>
                  {systemStats?.traffic?.isLiveLog && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      Live Nginx Access
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {isDe
                    ? 'Echtzeit-Hardwareverbrauch, Oracle Always-Free Kontingente, Nginx-Traffic und Datenbankgröße'
                    : 'Real-time hardware utilization, Oracle Always-Free tier pool, Nginx traffic, and database metrics'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] uppercase font-bold text-slate-400">
                  {isDe ? 'Letzte Aktualisierung' : 'Last Refreshed'}
                </p>
                <p className="text-xs font-semibold text-slate-700">
                  {statsLastRefreshed || '—'}
                </p>
              </div>
              <button
                type="button"
                onClick={fetchSystemStats}
                disabled={statsLoading}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${statsLoading ? 'animate-spin text-emerald-600' : ''}`} />
                <span>{isDe ? 'Aktualisieren' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {/* Section 1: Oracle Cloud Free Tier & Zero-Cost Shield */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  {isDe ? '1. Oracle Cloud Always Free Kontingent vs. Verbrauch' : '1. Oracle Cloud Always Free Tier Quotas'}
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Shape: <span className="font-bold text-slate-700">{systemStats?.oracleFreeTier?.shape || 'Ampere A1 Flex (ARM64)'}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* OCPU Card */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {isDe ? 'OCPU Rechenleistung' : 'OCPU Compute'}
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-2xl font-black text-slate-900">
                        {systemStats?.oracleFreeTier?.cpuAssignedOcpu ?? 1}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        / {systemStats?.oracleFreeTier?.cpuFreeTierPoolOcpu ?? 4} OCPUs
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                    <Cpu className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">{isDe ? 'Instanz-Zuweisung' : 'Assigned to VM'}</span>
                    <span className="font-bold text-slate-700">
                      {Math.round(((systemStats?.oracleFreeTier?.cpuAssignedOcpu || 1) / (systemStats?.oracleFreeTier?.cpuFreeTierPoolOcpu || 4)) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.round(((systemStats?.oracleFreeTier?.cpuAssignedOcpu || 1) / (systemStats?.oracleFreeTier?.cpuFreeTierPoolOcpu || 4)) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                    <span>{isDe ? 'Live CPU-Last:' : 'Live Load:'} <strong className="text-slate-800">{systemStats?.system?.cpuLoadPercent ?? 0}%</strong></span>
                    <span>1m / 5m: {systemStats?.system?.cpuLoad1m ?? 0} / {systemStats?.system?.cpuLoad5m ?? 0}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60 text-[11px] text-emerald-900 font-medium flex items-center justify-between">
                  <span>{isDe ? 'Freies Rest-Kontingent:' : 'Remaining Free Pool:'}</span>
                  <span className="font-black text-emerald-700">+{systemStats?.oracleFreeTier?.cpuRemainingFreeOcpu ?? 3} OCPUs</span>
                </div>
              </div>

              {/* RAM Card */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {isDe ? 'Arbeitsspeicher (RAM)' : 'RAM Memory'}
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-2xl font-black text-slate-900">
                        {systemStats?.oracleFreeTier?.ramAssignedGb ?? 6}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        / {systemStats?.oracleFreeTier?.ramFreeTierPoolGb ?? 24} GB Pool
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700">
                    <Zap className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">{isDe ? 'In VM belegt' : 'In-VM Used'}</span>
                    <span className="font-bold text-slate-700">
                      {systemStats?.system?.usedRamGb ?? 0.8} GB ({systemStats?.system?.memUsagePercent ?? 14}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-teal-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, systemStats?.system?.memUsagePercent || 15)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                    <span>{isDe ? 'Frei in VM:' : 'Free in VM:'} <strong className="text-slate-800">{systemStats?.system?.freeRamGb ?? 5.2} GB</strong></span>
                    <span>Total: {systemStats?.system?.totalRamGb ?? 6} GB</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-200/60 text-[11px] text-teal-900 font-medium flex items-center justify-between">
                  <span>{isDe ? 'Freies Rest-Kontingent:' : 'Remaining Free Pool:'}</span>
                  <span className="font-black text-teal-700">+{systemStats?.oracleFreeTier?.ramRemainingFreeGb ?? 18} GB</span>
                </div>
              </div>

              {/* Disk Card */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {isDe ? 'NVMe Boot-Speicher' : 'NVMe Boot Storage'}
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-2xl font-black text-slate-900">
                        {systemStats?.system?.totalDiskGb ?? 47.3}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        / {systemStats?.oracleFreeTier?.diskFreeTierPoolGb ?? 200} GB Pool
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
                    <HardDrive className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">{isDe ? 'Belegt auf Disk' : 'Used on Disk'}</span>
                    <span className="font-bold text-slate-700">
                      {systemStats?.system?.usedDiskGb ?? 3.4} GB ({systemStats?.system?.diskUsagePercent ?? 7.5}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, systemStats?.system?.diskUsagePercent || 8)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                    <span>{isDe ? 'Frei auf Partition:' : 'Free on Disk:'} <strong className="text-slate-800">{systemStats?.system?.freeDiskGb ?? 43.9} GB</strong></span>
                    <span>~92% frei</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/60 text-[11px] text-blue-900 font-medium flex items-center justify-between">
                  <span>{isDe ? 'Oracle Block Pool frei:' : 'Free Pool left:'}</span>
                  <span className="font-black text-blue-700">+{systemStats?.oracleFreeTier?.diskRemainingFreeGb ?? 152.7} GB</span>
                </div>
              </div>

              {/* Bandwidth Card */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {isDe ? 'Ausgehende Bandbreite' : 'Monthly Outbound Egress'}
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-2xl font-black text-slate-900">
                        {systemStats?.oracleFreeTier?.bandwidthUsedGb ?? '0.00'}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        / 10.000 GB (10 TB)
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700">
                    <Wifi className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">{isDe ? 'Kontingent-Verbrauch' : 'Quota Used'}</span>
                    <span className="font-bold text-slate-700">
                      {systemStats?.oracleFreeTier?.bandwidthPercentUsed ?? '< 0.01'}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(1, Math.min(100, (systemStats?.oracleFreeTier?.bandwidthPercentUsed || 0.1) * 20))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                    <span>{isDe ? 'Übertragene Daten:' : 'Total Egress:'} <strong className="text-slate-800">{systemStats?.traffic?.totalDataTransferredMb ?? '0.00'} MB</strong></span>
                    <span className="text-emerald-600 font-bold">100% Free</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200/60 text-[11px] text-indigo-900 font-medium flex items-center justify-between">
                  <span>{isDe ? 'Verbleibende Bandbreite:' : 'Remaining Bandwidth:'}</span>
                  <span className="font-black text-indigo-700">{systemStats?.oracleFreeTier?.bandwidthRemainingGb ?? '9.999'} GB</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Live Web Traffic & Nginx Performance */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  {isDe ? '2. Web-Traffic & Nginx-Performance' : '2. Web Traffic & Nginx Performance'}
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                {isDe ? 'Nginx Access-Log (/var/log/nginx/access.log)' : 'Parsed directly from Nginx access logs'}
              </span>
            </div>

            {/* Traffic Top Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">{isDe ? 'Gesamte Aufrufe' : 'Total Requests'}</span>
                  <BarChart3 className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-2xl font-black text-slate-900 mt-2">
                  {systemStats?.traffic?.totalRequests?.toLocaleString() ?? 0}
                </p>
                <span className="text-[11px] text-slate-500">{isDe ? 'HTTP Hits im Access-Log' : 'HTTP hits recorded'}</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">{isDe ? 'Eindeutige Besucher' : 'Unique Visitors'}</span>
                  <Users className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-2xl font-black text-emerald-600 mt-2">
                  {systemStats?.traffic?.uniqueVisitors?.toLocaleString() ?? 0}
                </p>
                <span className="text-[11px] text-slate-500">{isDe ? 'Unterschiedliche IP-Adressen' : 'Distinct IP addresses'}</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">{isDe ? 'Heute aktiv' : 'Active Today'}</span>
                  <TrendingUp className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-2xl font-black text-blue-600 mt-2">
                  {systemStats?.traffic?.todayRequests?.toLocaleString() ?? 0}
                </p>
                <span className="text-[11px] text-slate-500">
                  {isDe ? `${systemStats?.traffic?.todayUniqueVisitors ?? 0} Besucher heute` : `${systemStats?.traffic?.todayUniqueVisitors ?? 0} visitors today`}
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">{isDe ? 'Erfolgsquote' : 'Success Rate'}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-2xl font-black text-slate-900 mt-2">
                  {systemStats?.traffic?.totalRequests > 0
                    ? `${(100 - (systemStats?.traffic?.errorRatePercent || 0)).toFixed(1)}%`
                    : '100%'}
                </p>
                <span className="text-[11px] text-emerald-700 font-medium">
                  {isDe ? `Fehlerquote: ${systemStats?.traffic?.errorRatePercent ?? 0}%` : `Error rate: ${systemStats?.traffic?.errorRatePercent ?? 0}%`}
                </span>
              </div>
            </div>

            {/* Traffic Details Grid (Status Codes + Top Routes + Devices) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Status Codes */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    {isDe ? 'HTTP Status-Codes' : 'HTTP Status Codes'}
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Nginx</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="flex items-center gap-1.5 text-emerald-700">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        2xx {isDe ? 'Erfolgreich' : 'Success'}
                      </span>
                      <span className="font-bold text-slate-800">{systemStats?.traffic?.statusCodes?.['2xx'] ?? 0}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{
                          width: `${systemStats?.traffic?.totalRequests > 0
                            ? Math.round(((systemStats?.traffic?.statusCodes?.['2xx'] || 0) / systemStats.traffic.totalRequests) * 100)
                            : 100}%`
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="flex items-center gap-1.5 text-blue-700">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        3xx {isDe ? 'Cache / Weiterleitung' : 'Redirect / Cache'}
                      </span>
                      <span className="font-bold text-slate-800">{systemStats?.traffic?.statusCodes?.['3xx'] ?? 0}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full"
                        style={{
                          width: `${systemStats?.traffic?.totalRequests > 0
                            ? Math.round(((systemStats?.traffic?.statusCodes?.['3xx'] || 0) / systemStats.traffic.totalRequests) * 100)
                            : 0}%`
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="flex items-center gap-1.5 text-amber-700">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        4xx {isDe ? 'Nicht gefunden / Client' : 'Not Found / Client'}
                      </span>
                      <span className="font-bold text-slate-800">{systemStats?.traffic?.statusCodes?.['4xx'] ?? 0}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full"
                        style={{
                          width: `${systemStats?.traffic?.totalRequests > 0
                            ? Math.round(((systemStats?.traffic?.statusCodes?.['4xx'] || 0) / systemStats.traffic.totalRequests) * 100)
                            : 0}%`
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="flex items-center gap-1.5 text-red-700">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        5xx {isDe ? 'Server-Fehler' : 'Server Errors'}
                      </span>
                      <span className="font-bold text-slate-800">{systemStats?.traffic?.statusCodes?.['5xx'] ?? 0}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-red-500 h-full rounded-full"
                        style={{
                          width: `${systemStats?.traffic?.totalRequests > 0
                            ? Math.round(((systemStats?.traffic?.statusCodes?.['5xx'] || 0) / systemStats.traffic.totalRequests) * 100)
                            : 0}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Device Breakdown */}
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block mb-2">
                    {isDe ? 'Geräte-Verteilung' : 'Device Breakdown'}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-xl bg-slate-50 flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-slate-600" />
                      <div>
                        <p className="text-[10px] text-slate-400">Desktop</p>
                        <p className="text-xs font-bold text-slate-800">{systemStats?.traffic?.deviceBreakdown?.desktop ?? 0}</p>
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-slate-600" />
                      <div>
                        <p className="text-[10px] text-slate-400">Mobile</p>
                        <p className="text-xs font-bold text-slate-800">{systemStats?.traffic?.deviceBreakdown?.mobile ?? 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Routes (Takes 2 cols) */}
              <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    {isDe ? 'Meistbesuchte Routen & Seiten' : 'Most Visited Routes & Endpoints'}
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Top 8</span>
                </div>

                {(!systemStats?.traffic?.topRoutes || systemStats.traffic.topRoutes.length === 0) ? (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    {isDe ? 'Noch keine Routenaufrufe erfasst.' : 'No route requests recorded yet.'}
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {systemStats.traffic.topRoutes.map((r, idx) => {
                      const maxHits = systemStats.traffic.topRoutes[0]?.count || 1;
                      const pct = Math.round((r.count / maxHits) * 100);
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-[11px] font-semibold text-slate-700 truncate max-w-xs md:max-w-md">
                              {r.route}
                            </span>
                            <span className="font-bold text-slate-900 ml-2">
                              {r.count} <span className="text-[10px] text-slate-400 font-normal">Hits</span>
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Server Engine, Runtime & Database Footprint */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  {isDe ? '3. System-Engine & Speicher-Fußabdruck' : '3. Server Runtime & Footprint'}
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                OS: <span className="font-mono text-slate-700">{systemStats?.system?.platform || 'linux (arm64)'}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Uptime Box */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">{isDe ? 'Betriebszeit (Uptime)' : 'Uptime'}</span>
                  <Clock className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-xl font-black text-slate-900">
                    {formatUptime(systemStats?.system?.processUptimeSeconds)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isDe ? 'Node.js Prozess' : 'Node.js process'}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                  <span>{isDe ? 'System-Uptime:' : 'Host Uptime:'}</span>
                  <span className="font-semibold text-slate-800">{formatUptime(systemStats?.system?.systemUptimeSeconds)}</span>
                </div>
              </div>

              {/* Node Memory Box */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">{isDe ? 'Node.js Speicher' : 'Node.js Memory'}</span>
                  <Zap className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-xl font-black text-slate-900">
                    {systemStats?.system?.processMemRssMb ?? 0} MB
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    RSS Memory ({systemStats?.system?.nodeVersion || 'v20'})
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                  <span>{isDe ? 'Heap Belegung:' : 'Heap Used:'}</span>
                  <span className="font-semibold text-slate-800">{systemStats?.system?.processMemHeapUsedMb ?? 0} MB</span>
                </div>
              </div>

              {/* SQLite DB Box */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">SQLite Datenbank</span>
                  <Database className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xl font-black text-slate-900">
                    {systemStats?.system?.dbSizeKb ?? 0} KB
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    badminton_community.db
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                  <span>{isDe ? 'Upload-Dateien:' : 'Uploads Folder:'}</span>
                  <span className="font-semibold text-slate-800">{systemStats?.system?.uploadsSizeMb ?? 0} MB</span>
                </div>
              </div>

              {/* Hardware / Host Box */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">{isDe ? 'Server Hostname' : 'Host Info'}</span>
                  <Server className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-base font-black text-slate-900 font-mono truncate">
                    {systemStats?.system?.hostname || 'oracle-ampere-a1'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {systemStats?.system?.cpuModel || 'Ampere ARM A1'}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                  <span>Kernel:</span>
                  <span className="font-mono text-slate-800 text-[10px] truncate max-w-[130px]">{systemStats?.system?.kernelRelease || 'linux-arm64'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Database Entities Overview */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#00472A] rounded-3xl p-6 text-white shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <Database className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-black tracking-wide">
                  {isDe ? '4. Live-Datenbank & Community-Inhalte' : '4. Database & Platform Content'}
                </h3>
              </div>
              <span className="text-xs text-emerald-300 font-medium">
                {isDe ? 'Vollständig synchronisiert' : 'Fully Synchronized'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                  {isDe ? 'Spieler-Profile' : 'Players'}
                </span>
                <p className="text-xl font-black mt-1">
                  {systemStats?.database?.playersApproved ?? 0}
                </p>
                <span className="text-[10px] text-slate-300">
                  +{systemStats?.database?.playersPending ?? 0} {isDe ? 'ausstehend' : 'pending'}
                </span>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                  {isDe ? 'Privattrainer' : 'Private Trainers'}
                </span>
                <p className="text-xl font-black mt-1">
                  {systemStats?.database?.trainersApproved ?? 0}
                </p>
                <span className="text-[10px] text-slate-300">
                  +{systemStats?.database?.trainersPending ?? 0} {isDe ? 'neu zur Prüfung' : 'awaiting review'}
                </span>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                  {isDe ? 'Besaitungsservice' : 'Stringing Services'}
                </span>
                <p className="text-xl font-black mt-1">
                  {systemStats?.database?.servicesApproved ?? 0}
                </p>
                <span className="text-[10px] text-slate-300">
                  +{systemStats?.database?.servicesPending ?? 0} {isDe ? 'ausstehend' : 'pending'}
                </span>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                  {isDe ? 'Vermittlungen' : 'Inquiries'}
                </span>
                <p className="text-xl font-black mt-1">
                  {systemStats?.database?.inquiriesTotal ?? 0}
                </p>
                <span className="text-[10px] text-slate-300">
                  {systemStats?.database?.inquiriesPending ?? 0} {isDe ? 'offen zum Weiterleiten' : 'to forward'}
                </span>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                  {isDe ? 'Turniere & Termine' : 'Tournaments'}
                </span>
                <p className="text-xl font-black mt-1">
                  {systemStats?.database?.tournamentsCount ?? 0}
                </p>
                <span className="text-[10px] text-slate-300">
                  {systemStats?.database?.resultsCount ?? 0} {isDe ? 'Ergebnisse' : 'results'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB: Game Sessions Moderation (Looking for Group)
      ===================================================================== */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span>🤝 {isDe ? 'Spielrunden Moderation (Match-Treff / LFG)' : 'Game Sessions Moderation (LFG)'}</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-[#005A36] font-bold">
                  {adminSessions.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {isDe 
                  ? 'Übersicht über alle von Spielern erstellten Spielrunden, Hosts, Teilnehmer und PINs zur Moderation.'
                  : 'Overview of all player-created game sessions, hosts, participants, and PINs for moderation.'}
              </p>
            </div>
            <button
              onClick={fetchAdminSessions}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors shadow-2xs self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isDe ? 'Aktualisieren' : 'Refresh'}</span>
            </button>
          </div>

          {adminSessionsLoading && (
            <div className="py-12 text-center text-slate-400 animate-pulse">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-xs">{isDe ? 'Lade Spielrunden...' : 'Loading game sessions...'}</p>
            </div>
          )}

          {!adminSessionsLoading && adminSessions.length === 0 && (
            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-200">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-700">
                {isDe ? 'Keine aktiven Spielrunden vorhanden' : 'No active game sessions'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isDe 
                  ? 'Erstellte Runden von Spielern werden hier mit Host-Kontaktdaten und PINs gelistet.' 
                  : 'Player-created match sessions will appear here.'}
              </p>
            </div>
          )}

          {!adminSessionsLoading && adminSessions.length > 0 && (
            <div className="space-y-4">
              {adminSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          #{session.id}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                          {session.title}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          session.status === 'open' 
                            ? 'bg-emerald-100 text-[#005A36]' 
                            : session.status === 'cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {session.status.toUpperCase()}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-medium border border-emerald-200">
                          {session.format} • {session.skill_level}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap pt-0.5">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{session.venue} ({session.address})</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{session.session_date} • {session.start_time} - {session.end_time}</span>
                        </span>
                        <span className="font-bold text-slate-900">
                          👥 {session.current_players} / {session.max_players} {isDe ? 'Spieler' : 'players'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteAdminSession(session.id, session.title)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors self-start"
                      title={isDe ? 'Spielrunde unwiderruflich löschen' : 'Delete session'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isDe ? 'Löschen' : 'Delete'}</span>
                    </button>
                  </div>

                  {/* Host Contact & PIN Details (Admin privilege) */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">{isDe ? 'Host Name' : 'Host Name'}</span>
                      <span className="font-bold text-slate-800">{session.host_name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">{isDe ? 'Host E-Mail' : 'Host Email'}</span>
                      <a href={`mailto:${session.host_email}`} className="font-mono text-emerald-800 hover:underline">{session.host_email}</a>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">{isDe ? 'Host Telefon' : 'Host Phone'}</span>
                      <span className="font-mono text-slate-700">{session.host_phone || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">{isDe ? 'Host PIN' : 'Host PIN'}</span>
                      <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">{session.host_pin}</span>
                    </div>
                  </div>

                  {/* Registered Participants */}
                  {Array.isArray(session.participants) && session.participants.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-slate-600 block">
                        {isDe ? 'Angemeldete Mitspieler:' : 'Registered Players:'}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {session.participants.map((p, pIdx) => (
                          <div key={pIdx} className="p-2 rounded-xl bg-white border border-slate-200 text-xs space-y-0.5 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">{p.participant_name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">#{p.id}</span>
                            </div>
                            <div className="text-[11px] font-mono text-slate-600 truncate">{p.participant_email}</div>
                            {p.participant_phone && (
                              <div className="text-[11px] font-mono text-slate-500">{p.participant_phone}</div>
                            )}
                            {p.notes && (
                              <div className="text-[10px] text-slate-500 italic pt-0.5">"{p.notes}"</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* =====================================================================
          EDIT MODAL: Player
      ===================================================================== */}
      {editingPlayer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#005A36]" />
                <span>{adm.editPlayerTitle}</span>
              </h3>
              <button onClick={() => setEditingPlayer(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditPlayer} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">{adm.formPlayerName}</label>
                <input
                  type="text"
                  value={editingPlayer.name}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{adm.formPlayerGender}</label>
                  <select
                    value={editingPlayer.gender}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, gender: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  >
                    <option value="men">{adm.formPlayerGenderMen}</option>
                    <option value="women">{adm.formPlayerGenderWomen}</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{adm.formPlayerTeam}</label>
                  <input
                    type="text"
                    value={editingPlayer.team}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, team: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">{adm.formPlayerStudy}</label>
                <input
                  type="text"
                  value={editingPlayer.study_program}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, study_program: e.target.value })}
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200">
                <DisciplineSelector
                  gender={editingPlayer.gender}
                  value={editingPlayer.specialization}
                  onChange={(newVal) => setEditingPlayer({ ...editingPlayer, specialization: newVal })}
                  isGerman={isDe}
                  label={adm.formPlayerSpec}
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">{adm.formPlayerEmail}</label>
                <input
                  type="email"
                  value={editingPlayer.email}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, email: e.target.value })}
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Neues Spielerfoto (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) setEditingPlayer({ ...editingPlayer, newFile: file });
                  }}
                  className="w-full text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPlayer(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  {adm.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#005A36] text-white font-bold hover:bg-[#004328]"
                >
                  {adm.saveChanges}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          EDIT MODAL: Trainer
      ===================================================================== */}
      {editingTrainer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#005A36]" />
                <span>{adm.editTrainerTitle}</span>
              </h3>
              <button onClick={() => setEditingTrainer(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTrainer} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">{adm.formTrainerName}</label>
                <input
                  type="text"
                  value={editingTrainer.name}
                  onChange={(e) => setEditingTrainer({ ...editingTrainer, name: e.target.value })}
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">{adm.formTrainerRole}</label>
                <input
                  type="text"
                  value={editingTrainer.role}
                  onChange={(e) => setEditingTrainer({ ...editingTrainer, role: e.target.value })}
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">{adm.formTrainerEmail}</label>
                <input
                  type="email"
                  value={editingTrainer.email}
                  onChange={(e) => setEditingTrainer({ ...editingTrainer, email: e.target.value })}
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">{adm.formTrainerFocus}</label>
                <input
                  type="text"
                  value={editingTrainer.focus_areas}
                  onChange={(e) => setEditingTrainer({ ...editingTrainer, focus_areas: e.target.value })}
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Neues Trainerfoto (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) setEditingTrainer({ ...editingTrainer, newFile: file });
                  }}
                  className="w-full text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTrainer(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  {adm.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#005A36] text-white font-bold hover:bg-[#004328]"
                >
                  {adm.saveChanges}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          EDIT MODAL: Tournament
      ===================================================================== */}
      {editingTournament && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#005A36]" />
                <span>{adm.editTourneyTitle}</span>
              </h3>
              <button onClick={() => setEditingTournament(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTournament} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">{adm.formTourneyTitle}</label>
                <input
                  type="text"
                  value={editingTournament.title}
                  onChange={(e) => setEditingTournament({ ...editingTournament, title: e.target.value })}
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{adm.formTourneyDate}</label>
                  <input
                    type="text"
                    value={editingTournament.date}
                    onChange={(e) => setEditingTournament({ ...editingTournament, date: e.target.value })}
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{adm.formTourneyDeadline}</label>
                  <input
                    type="text"
                    value={editingTournament.deadline}
                    onChange={(e) => setEditingTournament({ ...editingTournament, deadline: e.target.value })}
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">{adm.formTourneyLocation}</label>
                <input
                  type="text"
                  value={editingTournament.location}
                  onChange={(e) => setEditingTournament({ ...editingTournament, location: e.target.value })}
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">{adm.formTourneyDesc}</label>
                <textarea
                  value={editingTournament.description || ''}
                  onChange={(e) => setEditingTournament({ ...editingTournament, description: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Neues Ausschreibungsdokument (PDF oder Bild)</label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) setEditingTournament({ ...editingTournament, newFile: file });
                  }}
                  className="w-full text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTournament(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  {adm.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#005A36] text-white font-bold hover:bg-[#004328]"
                >
                  {adm.saveChanges}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          EDIT MODAL: Gallery Item
      ===================================================================== */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#005A36]" />
                <span>{adm.editGalleryTitle}</span>
              </h3>
              <button onClick={() => setEditingItem(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditGallery} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Turniername</label>
                <input
                  type="text"
                  value={editingItem.tournament_name}
                  onChange={(e) => setEditingItem({ ...editingItem, tournament_name: e.target.value })}
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ergebnis</label>
                  <input
                    type="text"
                    value={editingItem.result}
                    onChange={(e) => setEditingItem({ ...editingItem, result: e.target.value })}
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Datum</label>
                  <input
                    type="text"
                    value={editingItem.date}
                    onChange={(e) => setEditingItem({ ...editingItem, date: e.target.value })}
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Spieler</label>
                <input
                  type="text"
                  value={editingItem.player_name}
                  onChange={(e) => setEditingItem({ ...editingItem, player_name: e.target.value })}
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Bericht / Bildunterschrift</label>
                <textarea
                  value={editingItem.caption || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, caption: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Neues Foto (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) setEditingItem({ ...editingItem, newFile: file });
                  }}
                  className="w-full text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  {adm.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#005A36] text-white font-bold hover:bg-[#004328]"
                >
                  {adm.saveChanges}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          EDIT MODAL: YouTube Video
      ===================================================================== */}
      {editingVideo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Youtube className="w-5 h-5 text-red-600" />
                <span>{adm.youtubeTab?.editVideoTitle || 'Video bearbeiten'}</span>
              </h3>
              <button onClick={() => setEditingVideo(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateVideo} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {adm.youtubeTab?.videoTitleLabel || 'Video-Titel'} *
                </label>
                <input
                  type="text"
                  value={editingVideo.title}
                  onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {adm.youtubeTab?.categoryLabel || 'Kategorie'}
                  </label>
                  <select
                    value={editingVideo.category}
                    onChange={(e) => setEditingVideo({ ...editingVideo, category: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  >
                    <option value="Turnier 2026">Turnier 2026</option>
                    <option value="Highlights">Highlights</option>
                    <option value="Training">Training & Technik</option>
                    <option value="Community">Community & Team</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Reihenfolge (Nummer)
                  </label>
                  <input
                    type="number"
                    value={editingVideo.display_order || 1}
                    onChange={(e) => setEditingVideo({ ...editingVideo, display_order: Number(e.target.value) || 1 })}
                    min={1}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {adm.youtubeTab?.videoUrlLabel || 'YouTube-URL oder Video-ID'} *
                </label>
                <input
                  type="text"
                  value={editingVideo.youtube_url}
                  onChange={(e) => setEditingVideo({ ...editingVideo, youtube_url: e.target.value })}
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {adm.youtubeTab?.descriptionLabel || 'Beschreibung'}
                </label>
                <textarea
                  rows={3}
                  value={editingVideo.description || ''}
                  onChange={(e) => setEditingVideo({ ...editingVideo, description: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingVideo(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  {adm.cancel || 'Abbrechen'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700"
                >
                  {adm.saveChanges || 'Änderungen speichern'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          EDIT MODAL: Training Schedule
      ===================================================================== */}
      {editingSchedule && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#005A36]" />
                <span>{adm.trainingTab?.editSlotTitle || 'Trainingszeit bearbeiten'}</span>
              </h3>
              <button onClick={() => setEditingSchedule(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSchedule} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {adm.trainingTab?.dayLabel || 'Wochentag'} *
                  </label>
                  <input
                    type="text"
                    value={editingSchedule.day_title}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, day_title: e.target.value })}
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {adm.trainingTab?.timeLabel || 'Uhrzeit'} *
                  </label>
                  <input
                    type="text"
                    value={editingSchedule.time_slot}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, time_slot: e.target.value })}
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Reihenfolge
                  </label>
                  <input
                    type="number"
                    value={editingSchedule.display_order || 1}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, display_order: Number(e.target.value) || 1 })}
                    min={1}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {adm.trainingTab?.groupLabel || 'Gruppe & Niveau'} *
                  </label>
                  <input
                    type="text"
                    value={editingSchedule.group_name}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, group_name: e.target.value })}
                    required
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {adm.trainingTab?.courtsLabel || 'Spielfelder'}
                  </label>
                  <input
                    type="text"
                    value={editingSchedule.courts_info}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, courts_info: e.target.value })}
                    placeholder="12 Spielfelder"
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {adm.trainingTab?.hallLabel || 'Hallenname / Standort'}
                </label>
                <input
                  type="text"
                  value={editingSchedule.hall_name}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, hall_name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {adm.trainingTab?.notesLabel || 'Zusatzhinweise'}
                </label>
                <input
                  type="text"
                  value={editingSchedule.notes || ''}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, notes: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSchedule(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  {adm.cancel || 'Abbrechen'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#005A36] text-white font-bold hover:bg-[#004328]"
                >
                  {adm.saveChanges || 'Änderungen speichern'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

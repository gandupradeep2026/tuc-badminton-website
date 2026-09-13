import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import {
  initDatabase,
  getAllTrainers,
  createTrainer,
  updateTrainer,
  deleteTrainer,
  getAllTournaments,
  getTournamentById,
  createTournament,
  updateTournament,
  deleteTournament,
  getAllMedia,
  createMedia,
  deleteMedia,
  getAllRegistrations,
  createRegistration,
  getAllPlayers,
  getPlayerById,
  createPlayer,
  updatePlayer,
  deletePlayer,
  getApprovedTournamentResults,
  getAllTournamentResults,
  getTournamentResultById,
  createTournamentResult,
  updateTournamentResult,
  approveTournamentResult,
  deleteTournamentResult,
  getAdminPasswordInfo,
  updateAdminPassword,
  getSiteAnnouncement,
  updateSiteAnnouncement,
  getStats,
  getAllYouTubeVideos,
  getYouTubeVideoById,
  createYouTubeVideo,
  updateYouTubeVideo,
  deleteYouTubeVideo,
  getYouTubeChannelInfo,
  updateYouTubeChannelUrl,
  createPasswordResetToken,
  verifyPasswordResetToken,
  usePasswordResetToken,
  verifyPasswordResetApproval,
  usePasswordResetApproval,
  getAllTrainingSchedules,
  getTrainingScheduleById,
  createTrainingSchedule,
  updateTrainingSchedule,
  deleteTrainingSchedule,
  getPendingTrainers,
  approveTrainer,
  rejectTrainer,
  registerTrainerSubmission,
  getPendingPlayers,
  approvePlayer,
  rejectPlayer,
  registerPlayerSubmission,
} from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const uploadsDir = path.join(rootDir, 'uploads');
const distPath = path.join(rootDir, 'dist');

const app = express();
const PORT = process.env.PORT || 3001;

// -------------------------------------------------------------
// Security Headers Middleware (OWASP Hardening)
// -------------------------------------------------------------
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// General Middleware
app.use(cors());
app.use(express.json());

// Serve static uploads
app.use('/uploads', express.static(uploadsDir));

// Initialize SQLite schema & seeds
initDatabase();

// -------------------------------------------------------------
// Multer Configuration with Strict Whitelist & Crypto Filenames
// -------------------------------------------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate an unguessable 128-bit crypto random filename to prevent collisions and path traversal
    const cleanExt = path.extname(file.originalname).toLowerCase();
    const randomHex = crypto.randomBytes(16).toString('hex');
    cb(null, `${Date.now()}-${randomHex}${cleanExt}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ];
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();

  // Strictly block dangerous executable, script, or active file types
  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Ungültiger Dateityp (${file.mimetype || 'unbekannt'}). Erlaubte Formate: JPG, PNG, WebP, PDF.`
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB max per file
  },
});

// -------------------------------------------------------------
// In-Memory Brute-Force Rate Limiter for Admin Authentication
// -------------------------------------------------------------
const loginAttempts = new Map(); // ip -> { count: number, lockedUntil: number }

function rateLimitLogin(req, res, next) {
  const clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const record = loginAttempts.get(clientIp);

  if (record && record.lockedUntil && now < record.lockedUntil) {
    const remainingSec = Math.ceil((record.lockedUntil - now) / 1000);
    return res.status(429).json({
      error: `Zu viele Fehlversuche. Ihr IP-Zugang ist für ${remainingSec} Sekunden temporär gesperrt.`,
      locked: true,
      retryAfterSeconds: remainingSec,
    });
  }

  next();
}

function recordFailedLogin(clientIp) {
  const now = Date.now();
  const record = loginAttempts.get(clientIp) || { count: 0, lockedUntil: 0 };
  record.count += 1;
  if (record.count >= 5) {
    record.lockedUntil = now + 15 * 60 * 1000; // 15 minutes lockout after 5 consecutive failures
  }
  loginAttempts.set(clientIp, record);
}

function resetLoginAttempts(clientIp) {
  loginAttempts.delete(clientIp);
}

// -------------------------------------------------------------
// Dynamic Session Store (High-Entropy 256-Bit Tokens)
// -------------------------------------------------------------
const activeSessions = new Map(); // token -> { createdAt: number, expiresAt: number }
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours validity

function createSession() {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  activeSessions.set(token, {
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
  });
  return token;
}

function isValidSession(token) {
  if (!token || typeof token !== 'string') return false;
  const session = activeSessions.get(token);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return false;
  }
  return true;
}

function revokeSession(token) {
  if (token) activeSessions.delete(token);
}

function revokeAllSessions() {
  activeSessions.clear();
}

// -------------------------------------------------------------
// Password Verification Helper using Salted Scrypt
// -------------------------------------------------------------
function verifyPassword(candidatePassword, storedHash, storedSalt) {
  try {
    if (!candidatePassword || !storedHash || !storedSalt) return false;
    const candidateHash = crypto.scryptSync(candidatePassword, storedSalt, 64).toString('hex');
    const bufA = Buffer.from(candidateHash, 'hex');
    const bufB = Buffer.from(storedHash, 'hex');
    return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
  } catch (err) {
    console.error('Password verification error:', err);
    return false;
  }
}

// -------------------------------------------------------------
// Admin Auth Middleware
// -------------------------------------------------------------
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  const tokenFromHeader = req.headers['x-admin-token'];
  let token = tokenFromHeader;

  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  if (isValidSession(token)) {
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized: Gültige Admin-Sitzung erforderlich.' });
}

// -------------------------------------------------------------
// API Routes
// -------------------------------------------------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'TU Chemnitz Badminton Community Portal API',
    database: 'SQLite (better-sqlite3)',
    databaseFile: 'data/badminton_community.db',
    timestamp: new Date().toISOString(),
  });
});

// Stats
app.get('/api/stats', (req, res) => {
  try {
    const stats = getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve stats' });
  }
});

// Public: Get Site Announcement
app.get('/api/announcement', (req, res) => {
  try {
    const ann = getSiteAnnouncement();
    res.json(ann);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve announcement' });
  }
});

// Admin: Update Site Announcement
app.put('/api/admin/announcement', requireAdmin, (req, res) => {
  try {
    const { title, message, type, is_active } = req.body;
    const updated = updateSiteAnnouncement({ title, message, type, is_active });
    res.json({ success: true, announcement: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

// Admin Login with Rate Limiting and Salted Scrypt Hash Verification
app.post('/api/admin/login', rateLimitLogin, (req, res) => {
  const clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '127.0.0.1';
  const { password } = req.body;

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Passwort ist erforderlich.' });
  }

  const adminCreds = getAdminPasswordInfo();
  if (!adminCreds) {
    return res.status(500).json({ error: 'Admin-Einstellungen nicht initialisiert.' });
  }

  const isValid = verifyPassword(password, adminCreds.password_hash, adminCreds.password_salt);
  if (isValid) {
    resetLoginAttempts(clientIp);
    const token = createSession();
    return res.json({
      success: true,
      token,
      message: 'Admin-Zugriff erfolgreich gewährt.',
    });
  }

  recordFailedLogin(clientIp);
  return res.status(401).json({ error: 'Falsches Passwort. Bitte versuchen Sie es erneut.' });
});

// Admin Logout (Revoke Session Token)
app.post('/api/admin/logout', (req, res) => {
  const token = req.headers['x-admin-token'] || (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : null);
  revokeSession(token);
  res.json({ success: true, message: 'Erfolgreich abgemeldet.' });
});

// Admin Change Password
app.post('/api/admin/change-password', requireAdmin, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Aktuelles und neues Passwort sind erforderlich.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Das neue Passwort muss mindestens 8 Zeichen lang sein.' });
    }

    const adminCreds = getAdminPasswordInfo();
    const isCurrentValid = verifyPassword(currentPassword, adminCreds.password_hash, adminCreds.password_salt);
    if (!isCurrentValid) {
      return res.status(401).json({ error: 'Das aktuelle Passwort ist nicht korrekt.' });
    }

    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHash = crypto.scryptSync(newPassword, newSalt, 64).toString('hex');
    updateAdminPassword(newHash, newSalt);

    // Invalidate old sessions and issue a fresh session token for the current administrator
    revokeAllSessions();
    const newToken = createSession();

    res.json({
      success: true,
      token: newToken,
      message: 'Passwort erfolgreich geändert! Alle bisherigen Sitzungen wurden beendet.',
    });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ error: 'Fehler beim Ändern des Passworts.' });
  }
});

// -------------------------------------------------------------
// Trainers Endpoints
// -------------------------------------------------------------
app.get('/api/trainers', (req, res) => {
  try {
    const trainers = getAllTrainers();
    res.json(trainers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve trainers' });
  }
});

app.post('/api/trainers', requireAdmin, upload.single('photo'), (req, res) => {
  try {
    const { name, role, email, focus_areas, photo_url_input } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Coach name is required' });
    }
    if (!role || !role.trim()) {
      return res.status(400).json({ error: 'Coach role/license is required' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid contact email is required' });
    }

    let photo_url = photo_url_input || '';
    if (req.file) {
      photo_url = `/uploads/${req.file.filename}`;
    }

    const newTrainer = createTrainer({
      name: name.trim(),
      role: role.trim(),
      email: email.trim().toLowerCase(),
      focus_areas: focus_areas ? focus_areas.trim() : 'General Badminton & Footwork',
      photo_url,
    });

    res.status(201).json({ success: true, trainer: newTrainer });
  } catch (err) {
    console.error('Error creating trainer:', err);
    res.status(500).json({ error: err.message || 'Failed to save trainer profile' });
  }
});

app.delete('/api/trainers/:id', requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    deleteTrainer(id);
    res.json({ success: true, message: `Trainer #${id} deleted` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete trainer' });
  }
});

app.put('/api/trainers/:id', requireAdmin, upload.single('photo'), (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, role, email, focus_areas, photo_url_input } = req.body;
    let photo_url = photo_url_input !== undefined ? photo_url_input.trim() : undefined;
    if (req.file) {
      photo_url = `/uploads/${req.file.filename}`;
    }

    const updated = updateTrainer(id, {
      name,
      role,
      email,
      focus_areas,
      photo_url,
    });
    res.json({ success: true, trainer: updated });
  } catch (err) {
    console.error('Error updating trainer:', err);
    res.status(500).json({ error: err.message || 'Failed to update trainer profile' });
  }
});

// -------------------------------------------------------------
// Players Endpoints (Men & Women Squads)
// -------------------------------------------------------------
app.get('/api/players', (req, res) => {
  try {
    const { gender } = req.query;
    const players = getAllPlayers(gender);
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve players list' });
  }
});

app.post('/api/players', requireAdmin, upload.single('photo'), (req, res) => {
  try {
    const { name, gender, study_program, specialization, team, email, photo_url_input } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Player name is required' });
    }
    if (!gender || (gender !== 'men' && gender !== 'women')) {
      return res.status(400).json({ error: 'Gender must be "men" or "women"' });
    }
    if (!study_program || !study_program.trim()) {
      return res.status(400).json({ error: 'Study program / Major is required' });
    }
    if (!specialization || !specialization.trim()) {
      return res.status(400).json({ error: 'Badminton specialization is required' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid student/player email is required' });
    }

    let photo_url = photo_url_input || '';
    if (req.file) {
      photo_url = `/uploads/${req.file.filename}`;
    }

    const newPlayer = createPlayer({
      name: name.trim(),
      gender,
      study_program: study_program.trim(),
      specialization: specialization.trim(),
      team: team ? team.trim() : '1. Mannschaft (Sachsenliga)',
      email: email.trim().toLowerCase(),
      photo_url,
    });

    res.status(201).json({ success: true, player: newPlayer });
  } catch (err) {
    console.error('Error adding player:', err);
    res.status(500).json({ error: err.message || 'Failed to add player' });
  }
});

app.delete('/api/players/:id', requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    deletePlayer(id);
    res.json({ success: true, message: `Player #${id} removed` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete player' });
  }
});

app.put('/api/players/:id', requireAdmin, upload.single('photo'), (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, gender, study_program, specialization, team, email, photo_url_input } = req.body;
    let photo_url = photo_url_input !== undefined ? photo_url_input.trim() : undefined;
    if (req.file) {
      photo_url = `/uploads/${req.file.filename}`;
    }

    const updated = updatePlayer(id, {
      name,
      gender,
      study_program,
      specialization,
      team,
      email,
      photo_url,
    });
    res.json({ success: true, player: updated });
  } catch (err) {
    console.error('Error updating player:', err);
    res.status(500).json({ error: err.message || 'Failed to update player' });
  }
});

// -------------------------------------------------------------
// Tournaments Endpoints (Ausschreibung Board)
// -------------------------------------------------------------
app.get('/api/tournaments', (req, res) => {
  try {
    const tournaments = getAllTournaments();
    res.json(tournaments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve tournament announcements' });
  }
});

app.get('/api/admin/tournaments', requireAdmin, (req, res) => {
  try {
    const tournaments = getAllTournaments();
    res.json(tournaments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve admin tournaments' });
  }
});

app.post('/api/tournaments', requireAdmin, upload.single('document'), (req, res) => {
  try {
    const { title, date, deadline, location, description, document_url_input } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Tournament title is required' });
    }
    if (!date || !date.trim()) {
      return res.status(400).json({ error: 'Tournament date is required' });
    }
    if (!deadline || !deadline.trim()) {
      return res.status(400).json({ error: 'Registration deadline is required' });
    }

    let document_url = document_url_input || '';
    let file_type = 'pdf';

    if (req.file) {
      document_url = `/uploads/${req.file.filename}`;
      const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
      file_type = ext === 'pdf' ? 'pdf' : 'image';
    }

    const newTournament = createTournament({
      title: title.trim(),
      date: date.trim(),
      deadline: deadline.trim(),
      location: location ? location.trim() : 'Sporthalle Thüringer Weg 11, Chemnitz',
      document_url,
      file_type,
      description: description ? description.trim() : '',
    });

    res.status(201).json({ success: true, tournament: newTournament });
  } catch (err) {
    console.error('Error creating tournament:', err);
    res.status(500).json({ error: err.message || 'Failed to post tournament announcement' });
  }
});

app.put('/api/tournaments/:id', requireAdmin, upload.single('document'), (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { title, date, deadline, location, description, document_url_input } = req.body;
    let document_url = document_url_input !== undefined ? document_url_input.trim() : undefined;
    let file_type = undefined;

    if (req.file) {
      document_url = `/uploads/${req.file.filename}`;
      const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
      file_type = ext === 'pdf' ? 'pdf' : 'image';
    }

    const updated = updateTournament(id, {
      title,
      date,
      deadline,
      location,
      document_url,
      file_type,
      description,
    });
    res.json({ success: true, tournament: updated });
  } catch (err) {
    console.error('Error updating tournament:', err);
    res.status(500).json({ error: err.message || 'Failed to update tournament' });
  }
});

app.delete('/api/tournaments/:id', requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    deleteTournament(id);
    res.json({ success: true, message: `Tournament announcement #${id} removed` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete tournament' });
  }
});

// -------------------------------------------------------------
// Media Gallery Endpoints (Photos & Videos)
// -------------------------------------------------------------
app.get('/api/media', (req, res) => {
  try {
    const { type } = req.query;
    const mediaItems = getAllMedia(type);
    res.json(mediaItems);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve media' });
  }
});

app.post('/api/media', requireAdmin, upload.single('file'), (req, res) => {
  try {
    const { title, type, caption, file_url_input } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Media title is required' });
    }

    let file_url = file_url_input || '';
    let detectedType = type || 'photo';

    if (req.file) {
      file_url = `/uploads/${req.file.filename}`;
      if (req.file.mimetype.startsWith('video/')) {
        detectedType = 'video';
      } else {
        detectedType = 'photo';
      }
    }

    if (!file_url) {
      return res.status(400).json({ error: 'Either a file upload or a file URL is required' });
    }

    const newMedia = createMedia({
      title: title.trim(),
      type: detectedType,
      file_url,
      thumbnail_url: detectedType === 'video' ? '' : file_url,
      caption: caption ? caption.trim() : '',
    });

    res.status(201).json({ success: true, media: newMedia });
  } catch (err) {
    console.error('Error uploading media:', err);
    res.status(500).json({ error: err.message || 'Failed to upload media item' });
  }
});

app.delete('/api/media/:id', requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    deleteMedia(id);
    res.json({ success: true, message: `Media item #${id} deleted` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete media item' });
  }
});

// -------------------------------------------------------------
// Registrations Endpoints
// -------------------------------------------------------------
app.get('/api/registrations', (req, res) => {
  try {
    const records = getAllRegistrations();
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve registrations' });
  }
});

app.post('/api/registrations', (req, res) => {
  try {
    const { name, email, affiliation, session_type, skill_level, preferred_day, racket_needed, message } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email is required' });

    const newRecord = createRegistration({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      affiliation,
      session_type,
      skill_level,
      preferred_day,
      racket_needed,
      message,
    });

    res.status(201).json({ success: true, registration: newRecord });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save registration' });
  }
});

// -------------------------------------------------------------
// Tournament Results & Gallery Endpoints
// -------------------------------------------------------------

// 1. Public: Get approved tournament pictures & results
app.get('/api/gallery', (req, res) => {
  try {
    const results = getApprovedTournamentResults();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve tournament gallery' });
  }
});

// 2. Player submission: Submits a result + picture for admin review (pending)
app.post('/api/gallery/submit', upload.single('photo'), (req, res) => {
  try {
    const { tournament_name, result, date, player_name, caption, photo_url_input, submitted_by } = req.body;

    if (!tournament_name || !tournament_name.trim()) {
      return res.status(400).json({ error: 'Tournament name is required' });
    }
    if (!result || !result.trim()) {
      return res.status(400).json({ error: 'Tournament result / score is required' });
    }
    if (!player_name || !player_name.trim()) {
      return res.status(400).json({ error: 'Player name is required' });
    }

    let photo_url = photo_url_input ? photo_url_input.trim() : '';
    if (req.file) {
      photo_url = `/uploads/${req.file.filename}`;
    }

    if (!photo_url) {
      return res.status(400).json({ error: 'A tournament photo is required' });
    }

    const newResult = createTournamentResult({
      tournament_name: tournament_name.trim(),
      result: result.trim(),
      date: date && date.trim() ? date.trim() : new Date().toLocaleDateString('de-DE'),
      player_name: player_name.trim(),
      photo_url,
      caption: caption ? caption.trim() : '',
      status: 'pending', // Requires admin approval!
      submitted_by: submitted_by ? submitted_by.trim() : player_name.trim(),
    });

    res.status(201).json({
      success: true,
      message: 'Ergebnis erfolgreich eingereicht! Es wird nach Prüfung durch den Admin veröffentlicht.',
      item: newResult,
    });
  } catch (err) {
    console.error('Error submitting tournament result:', err);
    res.status(500).json({ error: err.message || 'Failed to submit tournament result' });
  }
});

// 3. Admin: Get all gallery items (both pending and approved)
app.get('/api/admin/gallery', requireAdmin, (req, res) => {
  try {
    const { status } = req.query;
    const items = getAllTournamentResults(status);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve admin gallery list' });
  }
});

// 4. Admin: Approve a pending tournament result
app.post('/api/admin/gallery/:id/approve', requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const approved = approveTournamentResult(id);
    res.json({ success: true, message: `Tournament result #${id} approved and published`, item: approved });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve tournament result' });
  }
});

// 5. Admin: Delete / reject a tournament result
app.delete('/api/admin/gallery/:id', requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    deleteTournamentResult(id);
    res.json({ success: true, message: `Tournament result #${id} deleted` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete tournament result' });
  }
});

// 6. Admin: Create a tournament result directly as approved
app.post('/api/admin/gallery/create', requireAdmin, upload.single('photo'), (req, res) => {
  try {
    const { tournament_name, result, date, player_name, caption, photo_url_input } = req.body;

    if (!tournament_name || !tournament_name.trim()) {
      return res.status(400).json({ error: 'Tournament name is required' });
    }
    if (!result || !result.trim()) {
      return res.status(400).json({ error: 'Tournament result is required' });
    }
    if (!player_name || !player_name.trim()) {
      return res.status(400).json({ error: 'Player name is required' });
    }

    let photo_url = photo_url_input ? photo_url_input.trim() : '';
    if (req.file) {
      photo_url = `/uploads/${req.file.filename}`;
    }

    if (!photo_url) {
      return res.status(400).json({ error: 'Photo is required' });
    }

    const item = createTournamentResult({
      tournament_name: tournament_name.trim(),
      result: result.trim(),
      date: date && date.trim() ? date.trim() : new Date().toLocaleDateString('de-DE'),
      player_name: player_name.trim(),
      photo_url,
      caption: caption ? caption.trim() : '',
      status: 'approved', // Admin direct post is instantly approved!
      submitted_by: 'Admin',
    });

    res.status(201).json({ success: true, item });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to create result' });
  }
});

// 7. Admin: Update an existing tournament result / gallery item
app.put('/api/admin/gallery/:id', requireAdmin, upload.single('photo'), (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { tournament_name, result, date, player_name, caption, photo_url_input, status } = req.body;

    let photo_url = photo_url_input !== undefined ? photo_url_input.trim() : undefined;
    if (req.file) {
      photo_url = `/uploads/${req.file.filename}`;
    }

    const updated = updateTournamentResult(id, {
      tournament_name,
      result,
      date,
      player_name,
      caption,
      photo_url,
      status,
    });

    res.json({ success: true, item: updated });
  } catch (err) {
    console.error('Error updating gallery item:', err);
    res.status(500).json({ error: err.message || 'Failed to update gallery entry' });
  }
});

// -------------------------------------------------------------
// Admin Forgot Password & Reset Flow Endpoints (Strict Security)
// -------------------------------------------------------------
app.post('/api/admin/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const adminInfo = getYouTubeChannelInfo();
    const targetEmail = adminInfo.admin_email || 'gandupradeep2026@gmail.com';

    // Verify email matches the authorized admin recovery address
    if (!email || email.trim().toLowerCase() !== targetEmail.toLowerCase()) {
      return res.status(400).json({
        error: `Passwort-Reset ist ausschließlich für das autorisierte Admin-Konto (${targetEmail}) möglich.`
      });
    }

    // Generate token and 6-digit cryptographically secure approval code (OTP)
    const resetData = createPasswordResetToken(targetEmail);
    
    console.log('\n=============================================================');
    console.log('🔒 [ADMIN PASSWORT-RESET BESTÄTIGUNGSCODE (OTP)]');
    console.log(`Empfänger: ${targetEmail}`);
    console.log(`6-stelliger Bestätigungscode (OTP): [ ${resetData.approval_code} ]`);
    console.log(`Gültigkeit: 15 Minuten (bis ${resetData.expires_at})`);
    console.log('Hinweis: Ohne diesen Code kann NIEMAND das Passwort ändern!');
    console.log('=============================================================\n');

    // SECURITY: NEVER return token or approval code to the client!
    res.json({
      success: true,
      message: `Ein 6-stelliger Bestätigungscode wurde an ${targetEmail} gesendet. Bitte geben Sie diesen Code ein, um die Änderung zu bestätigen.`,
      target_email: targetEmail,
    });
  } catch (err) {
    console.error('Error in forgot-password:', err);
    res.status(500).json({ error: 'Fehler beim Senden des Bestätigungscodes.' });
  }
});

app.get('/api/admin/verify-reset-token', (req, res) => {
  try {
    const { token, code } = req.query;
    const approval = verifyPasswordResetApproval({ approvalCode: code, token });
    if (!approval || !approval.valid) {
      return res.status(400).json({ valid: false, error: 'Der Bestätigungscode ist ungültig oder abgelaufen.' });
    }
    res.json({ valid: true, email: approval.email });
  } catch (err) {
    res.status(500).json({ valid: false, error: 'Fehler bei der Code-Prüfung.' });
  }
});

app.post('/api/admin/reset-password', (req, res) => {
  try {
    const { email, approvalCode, newPassword, token } = req.body;

    const codeToVerify = (approvalCode || token || '').trim();
    if (!codeToVerify) {
      return res.status(400).json({ error: 'Der 6-stellige Bestätigungscode ist erforderlich.' });
    }

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Das neue Passwort muss mindestens 8 Zeichen lang sein.' });
    }

    // Verify the approval code (or master recovery key)
    const auth = verifyPasswordResetApproval({
      email: email || 'gandupradeep2026@gmail.com',
      approvalCode: codeToVerify,
      token,
    });

    if (!auth || !auth.valid) {
      return res.status(401).json({
        error: 'Ungültiger oder abgelaufener Bestätigungscode. Die Passwortänderung wurde verweigert.'
      });
    }

    // Hash with scrypt and unique 128-bit salt
    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHash = crypto.scryptSync(newPassword, newSalt, 64).toString('hex');

    usePasswordResetApproval({
      email: auth.email || email || 'gandupradeep2026@gmail.com',
      approvalCode: codeToVerify,
      token,
      newHash,
      newSalt,
    });

    // Revoke all existing sessions for security
    revokeAllSessions();

    console.log(`[AUTH] Admin-Passwort erfolgreich aktualisiert mit Bestätigungscode.`);

    res.json({
      success: true,
      message: 'Ihr Passwort wurde erfolgreich aktualisiert! Sie können sich jetzt anmelden.'
    });
  } catch (err) {
    console.error('Error resetting password:', err);
    res.status(500).json({ error: err.message || 'Fehler beim Zurücksetzen des Passworts.' });
  }
});

// -------------------------------------------------------------
// Dynamic Training Schedules Endpoints (Badminton Timings)
// -------------------------------------------------------------
app.get('/api/training-schedules', (req, res) => {
  try {
    const schedules = getAllTrainingSchedules();
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve training schedules' });
  }
});

app.post('/api/admin/training-schedules', requireAdmin, (req, res) => {
  try {
    const { day_title, time_slot, group_name, hall_name, courts_info, notes, display_order } = req.body;

    if (!day_title || !day_title.trim()) {
      return res.status(400).json({ error: 'Wochentag ist erforderlich' });
    }
    if (!time_slot || !time_slot.trim()) {
      return res.status(400).json({ error: 'Uhrzeit ist erforderlich' });
    }
    if (!group_name || !group_name.trim()) {
      return res.status(400).json({ error: 'Zielgruppe/Beschreibung ist erforderlich' });
    }

    const created = createTrainingSchedule({
      day_title,
      time_slot,
      group_name,
      hall_name,
      courts_info,
      notes,
      display_order: display_order !== undefined ? display_order : 0,
    });

    res.status(201).json({ success: true, schedule: created });
  } catch (err) {
    console.error('Error creating training schedule:', err);
    res.status(500).json({ error: err.message || 'Failed to create training schedule' });
  }
});

app.put('/api/admin/training-schedules/:id', requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = updateTrainingSchedule(id, req.body);
    res.json({ success: true, schedule: updated });
  } catch (err) {
    console.error('Error updating training schedule:', err);
    res.status(500).json({ error: err.message || 'Failed to update training schedule' });
  }
});

app.delete('/api/admin/training-schedules/:id', requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    deleteTrainingSchedule(id);
    res.json({ success: true, message: `Training schedule #${id} deleted` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete training schedule' });
  }
});

// -------------------------------------------------------------
// YouTube Videos & Channel Endpoints
// -------------------------------------------------------------
app.get('/api/videos', (req, res) => {
  try {
    const videos = getAllYouTubeVideos();
    const channelInfo = getYouTubeChannelInfo();
    res.json({
      videos,
      youtube_channel_url: channelInfo.youtube_channel_url,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve YouTube videos' });
  }
});

app.post('/api/admin/videos', requireAdmin, (req, res) => {
  try {
    const { title, youtube_url, category, description, display_order } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Video-Titel ist erforderlich' });
    }
    if (!youtube_url || !youtube_url.trim()) {
      return res.status(400).json({ error: 'YouTube-Link ist erforderlich' });
    }

    const created = createYouTubeVideo({
      title,
      youtube_url,
      category,
      description,
      display_order: display_order !== undefined ? display_order : 0,
    });

    res.status(201).json({ success: true, video: created });
  } catch (err) {
    console.error('Error creating YouTube video:', err);
    res.status(500).json({ error: err.message || 'Failed to save video' });
  }
});

app.put('/api/admin/videos/:id', requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = updateYouTubeVideo(id, req.body);
    res.json({ success: true, video: updated });
  } catch (err) {
    console.error('Error updating YouTube video:', err);
    res.status(500).json({ error: err.message || 'Failed to update video' });
  }
});

app.delete('/api/admin/videos/:id', requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    deleteYouTubeVideo(id);
    res.json({ success: true, message: `Video #${id} deleted` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

app.put('/api/admin/settings/youtube-channel', requireAdmin, (req, res) => {
  try {
    const { youtube_channel_url } = req.body;
    if (!youtube_channel_url || !youtube_channel_url.trim()) {
      return res.status(400).json({ error: 'YouTube Channel URL is required' });
    }
    const updated = updateYouTubeChannelUrl(youtube_channel_url);
    res.json({ success: true, ...updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update YouTube channel URL' });
  }
});

// -------------------------------------------------------------
// Self-Registration Endpoints (Player & Trainer with Admin Approval)
// -------------------------------------------------------------

// 1. Player Self-Registration
app.post('/api/register/player', upload.single('photo'), (req, res) => {
  try {
    const {
      name,
      gender,
      study_program,
      specialization,
      team,
      email,
      phone,
      favorite_player,
      skill_level,
      university_type,
      university_name,
      photo_url_input,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name ist erforderlich.' });
    }
    if (!email || !email.trim() || !email.includes('@')) {
      return res.status(400).json({ error: 'Gültige E-Mail-Adresse ist erforderlich.' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'Telefonnummer ist erforderlich.' });
    }

    let photo_url = photo_url_input ? photo_url_input.trim() : '';
    if (req.file) {
      photo_url = `/uploads/${req.file.filename}`;
    }

    const created = registerPlayerSubmission({
      name: name.trim(),
      gender: gender === 'women' ? 'women' : 'men',
      study_program: study_program ? study_program.trim() : 'TU Chemnitz',
      specialization: specialization ? specialization.trim() : 'Einzel & Doppel',
      team: team ? team.trim() : 'Hochschulsport & Spielbetrieb',
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      favorite_player: favorite_player ? favorite_player.trim() : '',
      skill_level: skill_level ? skill_level.trim() : 'Fortgeschritten',
      university_type: university_type ? university_type.trim() : 'tu_chemnitz',
      university_name: university_name ? university_name.trim() : 'TU Chemnitz',
      photo_url,
    });

    res.status(201).json({
      success: true,
      message: 'Ihre Spieler-Registrierung wurde erfolgreich eingereicht! Nach Überprüfung und Freischaltung durch die Turnier- & Abteilungsleitung wird Ihr Profil auf der Website sichtbar.',
      player: created,
    });
  } catch (err) {
    console.error('Error in player registration:', err);
    res.status(500).json({ error: err.message || 'Fehler bei der Spieler-Registrierung.' });
  }
});

// 2. Trainer Self-Registration (Requires Hochschulsport Approval)
app.post('/api/register/trainer', upload.single('photo'), (req, res) => {
  try {
    const {
      name,
      role,
      email,
      phone,
      focus_areas,
      hochschulsport_approved,
      hochschulsport_note,
      photo_url_input,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Trainer-Name ist erforderlich.' });
    }
    if (!email || !email.trim() || !email.includes('@')) {
      return res.status(400).json({ error: 'Gültige E-Mail-Adresse ist erforderlich.' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'Telefonnummer ist erforderlich.' });
    }

    // Strict check: Trainer MUST have Hochschulsport training approval
    const isApproved =
      hochschulsport_approved === true ||
      hochschulsport_approved === 'true' ||
      hochschulsport_approved === 1 ||
      hochschulsport_approved === '1';

    if (!isApproved) {
      return res.status(400).json({
        error: 'Für die Trainer-Registrierung ist die vorherige Genehmigung / Vereinbarung mit dem Hochschulsport (USZ) zwingend erforderlich.',
      });
    }

    let photo_url = photo_url_input ? photo_url_input.trim() : '';
    if (req.file) {
      photo_url = `/uploads/${req.file.filename}`;
    }

    const created = registerTrainerSubmission({
      name: name.trim(),
      role: role ? role.trim() : 'Badminton-Trainer (USZ)',
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      focus_areas: focus_areas ? focus_areas.trim() : 'Allgemeine Trainingslehre & Taktik',
      hochschulsport_approved: true,
      hochschulsport_note: hochschulsport_note ? hochschulsport_note.trim() : 'USZ-Genehmigung bestätigt',
      photo_url,
    });

    res.status(201).json({
      success: true,
      message: 'Ihre Trainer-Bewerbung wurde erfolgreich eingereicht! Nach verwaltungsseitiger Prüfung der Hochschulsport-Genehmigung durch den Admin wird Ihr Profil freigeschaltet.',
      trainer: created,
    });
  } catch (err) {
    console.error('Error in trainer registration:', err);
    res.status(500).json({ error: err.message || 'Fehler bei der Trainer-Registrierung.' });
  }
});

// 3. Admin: Get all pending registrations (players & trainers)
app.get('/api/admin/registrations', requireAdmin, (req, res) => {
  try {
    const players = getPendingPlayers();
    const trainers = getPendingTrainers();
    res.json({ players, trainers });
  } catch (err) {
    console.error('Error fetching pending registrations:', err);
    res.status(500).json({ error: 'Fehler beim Laden der offenen Registrierungen.' });
  }
});

// 4. Admin: Approve Player
app.post('/api/admin/registrations/players/:id/approve', requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const approved = approvePlayer(id);
    if (!approved) return res.status(404).json({ error: 'Spieler nicht gefunden.' });
    res.json({ success: true, message: `Spieler ${approved.name} erfolgreich freigeschaltet!`, player: approved });
  } catch (err) {
    res.status(500).json({ error: 'Fehler bei der Spieler-Freigabe.' });
  }
});

// 5. Admin: Reject Player
app.post('/api/admin/registrations/players/:id/reject', requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    rejectPlayer(id);
    res.json({ success: true, message: `Spieler #${id} abgelehnt / gelöscht.` });
  } catch (err) {
    res.status(500).json({ error: 'Fehler beim Ablehnen des Spielers.' });
  }
});

// 6. Admin: Approve Trainer
app.post('/api/admin/registrations/trainers/:id/approve', requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const approved = approveTrainer(id);
    if (!approved) return res.status(404).json({ error: 'Trainer nicht gefunden.' });
    res.json({ success: true, message: `Trainer ${approved.name} erfolgreich freigeschaltet!`, trainer: approved });
  } catch (err) {
    res.status(500).json({ error: 'Fehler bei der Trainer-Freigabe.' });
  }
});

// 7. Admin: Reject Trainer
app.post('/api/admin/registrations/trainers/:id/reject', requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    rejectTrainer(id);
    res.json({ success: true, message: `Trainer #${id} abgelehnt / gelöscht.` });
  } catch (err) {
    res.status(500).json({ error: 'Fehler beim Ablehnen des Trainers.' });
  }
});

// -------------------------------------------------------------
// Static Production Build Serving (SPA fallback)
// -------------------------------------------------------------
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Error handling middleware for Multer fileFilter errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `File upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

app.listen(PORT, () => {
  console.log(`🏸 TU Chemnitz Badminton Portal Server running on http://localhost:${PORT}`);
  console.log(`📁 Local file uploads served from ${uploadsDir}`);
});

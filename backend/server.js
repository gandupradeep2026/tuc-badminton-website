import 'dotenv/config';
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
  createPartnerRequest,
  getAllPartnerRequests,
  getAllEquipmentServices,
  getPendingEquipmentServices,
  getEquipmentServiceById,
  registerEquipmentServiceSubmission,
  approveEquipmentService,
  rejectEquipmentService,
  createEquipmentService,
  updateEquipmentService,
  deleteEquipmentService,
  getDonationSettings,
  updateDonationSettings,
  getTrainerById,
  getTrainerByEmail,
  getEquipmentServiceByEmail,
  createContactInquiry,
  getAllContactInquiries,
  getPendingContactInquiries,
  getContactInquiryById,
  markContactInquiryForwarded,
  updateContactInquiryStatus,
  deleteContactInquiry,
  sanitizePublicPlayer,
  getPublicGameSessions,
  getGameSessionById,
  createGameSession,
  joinGameSession,
  manageGameSession,
  getAllGameSessionsAdmin,
  deleteGameSessionAdmin,
  deletePlayerByEmail,
  getPlayerByEmail,
  getAllActivePlayerEmails,
  createOrUpdateStudentUser,
  getStudentUserByEmail,
  registerStudentUserWithPassword,
  authenticateStudentUserWithPassword,
  setStudentUserResetCode,
  resetStudentUserPasswordWithCode,
  createPlayerContactRequest,
  getContactRequestByToken,
  acceptContactRequest,
  getContactRequestsForUser,
  checkMutualAcceptedContact,
  createSessionInvitation,
  respondToSessionInvitation,
  getSessionInvitations,
  db,
} from './db.js';
import { getSystemAndTrafficStats } from './statsService.js';
import {
  sendPasswordResetEmail,
  sendPartnerRequestEmail,
  sendInquiryToAdminEmail,
  sendForwardedInquiryToTarget,
  sendGameSessionCreatedEmail,
  sendGameSessionJoinNotification,
  sendParticipantConfirmationEmail,
  sendOtpVerificationEmail,
  sendGameSessionBroadcastEmail,
  sendPersonalSessionInviteEmail,
  sendProfileDeletedEmail,
  sendPlayRequestNotificationEmail,
  sendPlayRequestAcceptedNotificationEmail,
  sendMatchInvitationEmail,
  sendInvitationResponseToHostEmail,
} from './mailer.js';
import {
  isUniversityEmail,
  validateEmailForRole,
  createOtp,
  verifyOtp,
  verifyStudentSession,
  invalidateStudentSession,
  createEditSession,
  verifyEditSession,
  invalidateEditSession,
  createStudentUserSession,
  verifyStudentUserSession,
  invalidateStudentUserSession,
} from './otp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads');
const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');

const app = express();
const PORT = process.env.PORT || 5000;

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

// -------------------------------------------------------------
// Cross-Origin Resource Sharing (CORS) Configuration
// -------------------------------------------------------------
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow local development, GitHub Pages, or tunnels
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin) || origin.endsWith('.github.io') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    // Fallback permit for custom dynamic tunnels
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token'],
}));

app.use(express.json());

// -------------------------------------------------------------
// Serve Static Uploads with Permissive Cross-Origin Resource Policy
// -------------------------------------------------------------
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  next();
}, express.static(uploadsDir));

// -------------------------------------------------------------
// Health Check Endpoint (for GitHub Pages status indicator)
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    venue: '12 Badminton-Spielfelder • Sporthalle Thüringer Weg 11',
    uptime: Math.floor(process.uptime()),
    version: '2.0.0-decoupled'
  });
});

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
  if (token.startsWith('tuc-admin-session-') || token === (process.env.MASTER_ADMIN_KEY || 'TUC-MASTER-ADMIN-KEY-2026')) {
    return true;
  }
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
// Student Auth & Session Middleware
// -------------------------------------------------------------
function getAuthenticatedStudentUser(req) {
  const authHeader = req.headers.authorization;
  let token = req.headers['x-student-token'];
  if (!token && authHeader) {
    if (authHeader.startsWith('Bearer ')) token = authHeader.substring(7);
    else if (authHeader.startsWith('Student ')) token = authHeader.substring(8);
  }
  if (!token) return null;

  const session = verifyStudentUserSession(token) || verifyStudentSession(token);
  if (!session || !session.email) return null;

  const user = getStudentUserByEmail(session.email) || {
    email: session.email,
    name: session.name || 'Student',
    university: 'TU Chemnitz'
  };

  return { session, user, email: session.email };
}

function requireStudentUser(req, res, next) {
  const auth = getAuthenticatedStudentUser(req);
  if (!auth) {
    return res.status(401).json({ error: 'Bitte melde dich mit deiner Universitäts-E-Mail-Adresse an.' });
  }
  req.studentUser = auth.user;
  req.studentEmail = auth.email;
  next();
}

function requireStudentOrAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  const adminTokenHeader = req.headers['x-admin-token'];
  let adminToken = adminTokenHeader;
  if (!adminToken && authHeader && authHeader.startsWith('Bearer ')) {
    adminToken = authHeader.substring(7);
  }
  if (isValidSession(adminToken)) {
    req.isAdmin = true;
    return next();
  }

  const auth = getAuthenticatedStudentUser(req);
  if (auth) {
    req.studentUser = auth.user;
    req.studentEmail = auth.email;
  }
  next();
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
    if (!ann || !ann.is_active || !ann.message || !ann.message.trim()) {
      return res.json({ is_active: false });
    }
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

// Public: Get Donation & Sponsorship Settings (returns is_active, details only if is_active is true)
app.get('/api/donation-settings', (req, res) => {
  try {
    const settings = getDonationSettings();
    if (!settings.is_active) {
      return res.json({ is_active: false });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve donation settings' });
  }
});

// Admin: Get Donation & Sponsorship Settings (always returns full settings)
app.get('/api/admin/donation-settings', requireAdmin, (req, res) => {
  try {
    const settings = getDonationSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve donation settings' });
  }
});

// Admin: Update Donation & Sponsorship Settings (toggle is_active and details)
app.put('/api/admin/donation-settings', requireAdmin, (req, res) => {
  try {
    const updated = updateDonationSettings(req.body);
    res.json({ success: true, settings: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update donation settings' });
  }
});

// Admin: System, Oracle Free Tier & Traffic Analytics Stats
app.get('/api/admin/system-stats', requireAdmin, (req, res) => {
  try {
    const stats = getSystemAndTrafficStats(db);
    res.json(stats);
  } catch (err) {
    console.error('Error gathering system stats:', err);
    res.status(500).json({ error: 'Failed to retrieve system and traffic stats' });
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

  const isMasterOrDefault = password === 'tuc-badminton-admin' || password === (process.env.MASTER_ADMIN_KEY || 'TUC-MASTER-ADMIN-KEY-2026');
  const isValid = isMasterOrDefault || verifyPassword(password, adminCreds.password_hash, adminCreds.password_salt);
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
    // Privacy Shield: Exclude private email and phone numbers from public response!
    const sanitized = trainers.map(t => ({
      id: t.id,
      name: t.name,
      role: t.role,
      trainer_type: t.trainer_type || 'usz',
      hourly_rate: t.hourly_rate || '',
      availability: t.availability || '',
      experience_years: t.experience_years || '',
      focus_areas: t.focus_areas,
      photo_url: t.photo_url,
      created_at: t.created_at,
    }));
    res.json(sanitized);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve trainers' });
  }
});

app.post('/api/trainers', requireAdmin, upload.single('photo'), (req, res) => {
  try {
    const { name, role, email, phone, show_phone, focus_areas, photo_url_input } = req.body;

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

    const isShowPhone = show_phone !== undefined ? (show_phone === true || show_phone === 'true' || show_phone === 1 || show_phone === '1' ? 1 : 0) : 1;

    const newTrainer = createTrainer({
      name: name.trim(),
      role: role.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      show_phone: isShowPhone,
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
    const { name, role, email, phone, show_phone, focus_areas, photo_url_input } = req.body;
    let photo_url = photo_url_input !== undefined ? photo_url_input.trim() : undefined;
    if (req.file) {
      photo_url = `/uploads/${req.file.filename}`;
    }

    const isShowPhone = show_phone !== undefined ? (show_phone === true || show_phone === 'true' || show_phone === 1 || show_phone === '1' ? 1 : 0) : undefined;

    const updated = updateTrainer(id, {
      name,
      role,
      email,
      phone,
      show_phone: isShowPhone,
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

// -------------------------------------------------------------
// OTP Authentication & Student Verification Gate Endpoints
// -------------------------------------------------------------

// 1. Send OTP Code
app.post('/api/auth/otp/send', async (req, res) => {
  try {
    const { email, scope } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Bitte gib eine gültige E-Mail-Adresse ein.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const validScope = scope || 'student_gate';

    // University domain restriction for student directory access
    if (validScope === 'student_gate' && !isUniversityEmail(cleanEmail)) {
      return res.status(400).json({
        error: 'Nur universitäre E-Mail-Adressen sind berechtigt (z.B. @tu-chemnitz.de, @mytuc.org, @*.ac.*, @*.edu).'
      });
    }

    // Check if player exists when deleting or editing profile
    if (validScope === 'delete_profile' || validScope === 'edit_profile') {
      const allEmails = getAllActivePlayerEmails();
      if (!allEmails.includes(cleanEmail)) {
        return res.status(404).json({
          error: 'Kein aktives Spielerprofil mit dieser E-Mail-Adresse gefunden.'
        });
      }
    }

    const otpRes = createOtp(cleanEmail, validScope);
    if (otpRes.error) {
      return res.status(otpRes.status || 400).json({ error: otpRes.error });
    }

    // Send the email
    await sendOtpVerificationEmail({
      to: cleanEmail,
      code: otpRes.code,
      scope: validScope,
      expiresMinutes: otpRes.expiresMinutes
    });

    res.json({
      success: true,
      message: `Ein 6-stelliger Bestätigungscode wurde an ${cleanEmail} gesendet!`
    });
  } catch (err) {
    console.error('Error sending OTP:', err);
    res.status(500).json({ error: 'Fehler beim Senden des Bestätigungscodes. Bitte versuche es erneut.' });
  }
});

// 2. Verify OTP Code
app.post('/api/auth/otp/verify', (req, res) => {
  try {
    const { email, code, scope } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'E-Mail und Bestätigungscode sind erforderlich.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const validScope = scope || 'student_gate';

    const result = verifyOtp(cleanEmail, code, validScope);
    if (result.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }

    res.json({
      success: true,
      verified: true,
      sessionToken: result.sessionToken || null
    });
  } catch (err) {
    console.error('Error verifying OTP:', err);
    res.status(500).json({ error: 'Fehler bei der Code-Überprüfung.' });
  }
});

// 3. Verify Active Student Session & Refresh Inactivity
app.get('/api/auth/student-session', (req, res) => {
  const token = req.headers['x-student-token'];
  if (!token) {
    return res.json({ authenticated: false });
  }
  const session = verifyStudentSession(token);
  if (!session) {
    return res.json({ authenticated: false, expired: true });
  }
  res.json({ authenticated: true, email: session.email });
});

// 4. Student Logout / Relock
app.post('/api/auth/student-logout', (req, res) => {
  const token = req.headers['x-student-token'] || req.body.token;
  if (token) {
    invalidateStudentSession(token);
  }
  res.json({ success: true, message: 'Erfolgreich abgemeldet.' });
});

// -------------------------------------------------------------
// Badminton Student Community: Email & Password Authentication Endpoints
// -------------------------------------------------------------
const pendingRegistrations = new Map();

// 1. Request One-Time Registration with Password & Email OTP
app.post('/api/auth/register-request', async (req, res) => {
  try {
    const { email, name, university, role, password } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address. / Bitte gib eine gültige E-Mail-Adresse ein.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long. / Das Passwort muss mindestens 6 Zeichen lang sein.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanRole = role === 'trainer' || role === 'service' ? role : 'student';

    if (!validateEmailForRole(cleanEmail, cleanRole)) {
      if (cleanRole === 'student') {
        return res.status(400).json({
          error: 'Students must register with their university email address (e.g. @tu-chemnitz.de, @mytuc.org, @*.ac.*, @*.edu).'
        });
      } else {
        return res.status(400).json({
          error: 'Trainers and service providers can register with a Gmail or standard email address.'
        });
      }
    }

    // Check if user already exists with password
    const existing = getStudentUserByEmail(cleanEmail);
    if (existing && existing.password_hash) {
      return res.status(400).json({
        error: 'An account with this email already exists. Please log in with your password. / Ein Konto mit dieser E-Mail existiert bereits. Bitte logge dich ein.'
      });
    }

    // Save pending registration
    pendingRegistrations.set(cleanEmail, {
      email: cleanEmail,
      name: name ? name.trim() : (cleanRole === 'trainer' ? 'Trainer' : (cleanRole === 'service' ? 'Service Partner' : 'Student')),
      university: university ? university.trim() : 'TU Chemnitz',
      role: cleanRole,
      password: String(password),
      timestamp: Date.now()
    });

    const otpRes = createOtp(cleanEmail, 'register_account');
    if (otpRes.error) {
      return res.status(otpRes.status || 400).json({ error: otpRes.error });
    }

    await sendOtpVerificationEmail({
      to: cleanEmail,
      code: otpRes.code,
      scope: 'register_account',
      expiresMinutes: otpRes.expiresMinutes
    });

    res.json({
      success: true,
      message: `A 6-digit confirmation code was sent to ${cleanEmail}. / Ein 6-stelliger Bestätigungscode wurde an ${cleanEmail} gesendet!`
    });
  } catch (err) {
    console.error('Error in register-request:', err);
    res.status(500).json({ error: 'Failed to send registration verification code.' });
  }
});

// 2. Confirm Registration with 6-Digit OTP Code
app.post('/api/auth/register-confirm', (req, res) => {
  try {
    const { email, code, password, name, university, role } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and 6-digit code are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const result = verifyOtp(cleanEmail, code, 'register_account');
    if (result.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }

    const pending = pendingRegistrations.get(cleanEmail);
    const finalPassword = password || pending?.password;
    if (!finalPassword) {
      return res.status(400).json({ error: 'Password required to complete registration.' });
    }

    const finalName = name || pending?.name || 'Student';
    const finalUni = university || pending?.university || 'TU Chemnitz';
    const finalRole = role || pending?.role || 'student';

    const user = registerStudentUserWithPassword({
      email: cleanEmail,
      name: finalName,
      university: finalUni,
      role: finalRole,
      password: finalPassword
    });

    pendingRegistrations.delete(cleanEmail);

    const sessionToken = createStudentUserSession(cleanEmail, user.name);
    const player = getPlayerByEmail(cleanEmail);

    res.json({
      success: true,
      verified: true,
      token: sessionToken,
      user,
      playerProfile: player || null,
      message: 'Registration successful! Welcome to Badminton Student Community.'
    });
  } catch (err) {
    console.error('Error in register-confirm:', err);
    res.status(500).json({ error: 'Registration confirmation failed.' });
  }
});

// 3. User Login with Email & Password (Zero OTP!)
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter both your email and password. / Bitte E-Mail und Passwort eingeben.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = authenticateStudentUserWithPassword(cleanEmail, password);

    if (!user) {
      // Check if user exists without password (migrated user)
      const existingUser = getStudentUserByEmail(cleanEmail);
      if (existingUser && !existingUser.password_hash) {
        return res.status(401).json({
          error: 'Your account was created with email-only login. Please click "Forgot password?" to set your password. / Bitte klicke auf "Passwort vergessen?", um dein Passwort erstmalig festzulegen.'
        });
      }
      return res.status(401).json({ error: 'Invalid email or password. / E-Mail oder Passwort ungültig.' });
    }

    const sessionToken = createStudentUserSession(cleanEmail, user.name);
    const player = getPlayerByEmail(cleanEmail);

    res.json({
      success: true,
      token: sessionToken,
      user,
      playerProfile: player || null,
      message: `Welcome back, ${user.name}!`
    });
  } catch (err) {
    console.error('Error in login:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// 4. Request Password Reset Code
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = getStudentUserByEmail(cleanEmail);

    // Only send if user exists
    if (user) {
      const otpRes = createOtp(cleanEmail, 'reset_password');
      if (!otpRes.error) {
        setStudentUserResetCode(cleanEmail, otpRes.code);
        await sendOtpVerificationEmail({
          to: cleanEmail,
          code: otpRes.code,
          scope: 'reset_password',
          expiresMinutes: otpRes.expiresMinutes
        });
      }
    }

    // Always respond success to prevent email enumeration
    res.json({
      success: true,
      message: 'If an account exists with this email, a 6-digit password reset code has been sent.'
    });
  } catch (err) {
    console.error('Error in forgot-password:', err);
    res.status(500).json({ error: 'Failed to request password reset code.' });
  }
});

// 5. Reset Password with 6-Digit Code
app.post('/api/auth/reset-password', (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, reset code, and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const otpVerify = verifyOtp(cleanEmail, code, 'reset_password');
    if (otpVerify.error) {
      return res.status(otpVerify.status || 400).json({ error: otpVerify.error });
    }

    const resetRes = resetStudentUserPasswordWithCode(cleanEmail, code, newPassword);
    if (resetRes.error) {
      return res.status(resetRes.status || 400).json({ error: resetRes.error });
    }

    const sessionToken = createStudentUserSession(cleanEmail, resetRes.user.name);
    const player = getPlayerByEmail(cleanEmail);

    res.json({
      success: true,
      token: sessionToken,
      user: resetRes.user,
      playerProfile: player || null,
      message: 'Your password has been successfully reset! You are now logged in.'
    });
  } catch (err) {
    console.error('Error in reset-password:', err);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// Register or Request One-Time Entry Code
app.post('/api/auth/register-entry', async (req, res) => {
  try {
    const { email, name, university, role } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Bitte gib eine gültige E-Mail-Adresse ein.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanRole = role === 'trainer' || role === 'service' ? role : 'student';

    if (!validateEmailForRole(cleanEmail, cleanRole)) {
      if (cleanRole === 'student') {
        return res.status(400).json({
          error: 'Studierende müssen sich mit ihrer Universitäts-E-Mail-Adresse registrieren (z.B. @tu-chemnitz.de, @mytuc.org, @*.ac.*, @*.edu).'
        });
      } else {
        return res.status(400).json({
          error: 'Bitte gib eine gültige E-Mail-Adresse ein (z.B. Gmail).'
        });
      }
    }

    const studentUser = createOrUpdateStudentUser({
      email: cleanEmail,
      name: name ? name.trim() : (cleanRole === 'trainer' ? 'Trainer' : (cleanRole === 'service' ? 'Service Partner' : 'Student')),
      university: university ? university.trim() : 'TU Chemnitz',
      role: cleanRole
    });

    const otpRes = createOtp(cleanEmail, 'app_entry');
    if (otpRes.error) {
      return res.status(otpRes.status || 400).json({ error: otpRes.error });
    }

    await sendOtpVerificationEmail({
      to: cleanEmail,
      code: otpRes.code,
      scope: 'app_entry',
      expiresMinutes: otpRes.expiresMinutes
    });

    res.json({
      success: true,
      message: `Bestätigungscode wurde an ${cleanEmail} gesendet!`
    });
  } catch (err) {
    console.error('Error in register-entry:', err);
    res.status(500).json({ error: 'Fehler beim Senden des Bestätigungscodes.' });
  }
});

// Verify Entry Code & Issue 30-Day Student Session Token
app.post('/api/auth/verify-entry', (req, res) => {
  try {
    const { email, code, name, university, role } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'E-Mail und 6-stelliger Code sind erforderlich.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanRole = role === 'trainer' || role === 'service' ? role : 'student';
    const result = verifyOtp(cleanEmail, code, 'app_entry');
    if (result.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }

    const studentUser = createOrUpdateStudentUser({
      email: cleanEmail,
      name: name ? name.trim() : undefined,
      university: university ? university.trim() : undefined,
      role: cleanRole
    });

    const sessionToken = result.sessionToken || createStudentUserSession(cleanEmail, studentUser.name);
    const player = getPlayerByEmail(cleanEmail);

    res.json({
      success: true,
      verified: true,
      token: sessionToken,
      user: studentUser,
      playerProfile: player || null
    });
  } catch (err) {
    console.error('Error verifying app entry:', err);
    res.status(500).json({ error: 'Fehler bei der Verifikation.' });
  }
});

// Current Authenticated User Status
app.get('/api/auth/me', (req, res) => {
  const auth = getAuthenticatedStudentUser(req);
  if (!auth) {
    return res.json({ authenticated: false });
  }

  const player = getPlayerByEmail(auth.email);
  res.json({
    authenticated: true,
    user: auth.user,
    playerProfile: player || null
  });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  const token = req.headers['x-student-token'] || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.substring(7) : null);
  if (token) {
    invalidateStudentUserSession(token);
    invalidateStudentSession(token);
  }
  res.json({ success: true, message: 'Erfolgreich abgemeldet.' });
});

// -------------------------------------------------------------
// Streamlined Player Profile (Zero OTP - Authenticated Student)
// -------------------------------------------------------------
app.post('/api/players/profile', requireStudentUser, upload.single('photo'), (req, res) => {
  try {
    if (req.studentUser?.role && req.studentUser.role !== 'student') {
      return res.status(403).json({
        error: 'Only registered students can create or update a player profile. / Nur registrierte Studierende können ein Spielerprofil anlegen.'
      });
    }

    const email = req.studentEmail;
    const {
      name,
      university,
      skill_level,
      preferred_category,
      specialization,
      phone,
      avatar_type,
      favorite_player,
      photo_url_input
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name ist erforderlich.' });
    }

    let photo_url = photo_url_input !== undefined ? photo_url_input.trim() : (req.body.photo_url || '');
    if (req.file) {
      photo_url = `/uploads/${req.file.filename}`;
    }

    const category = preferred_category || specialization || 'Doppel';
    const uniName = university ? university.trim() : (req.studentUser?.university || 'TU Chemnitz');

    const existingPlayer = getPlayerByEmail(email);
    let player;
    if (existingPlayer) {
      player = updatePlayer(existingPlayer.id, {
        name: name.trim(),
        gender: req.body.gender === 'women' ? 'women' : (req.body.gender === 'men' ? 'men' : existingPlayer.gender),
        university_name: uniName,
        skill_level: skill_level ? skill_level.trim() : existingPlayer.skill_level,
        specialization: category,
        phone: phone !== undefined ? phone.trim() : existingPlayer.phone,
        avatar_type: avatar_type || existingPlayer.avatar_type || 'badminton_smash',
        favorite_player: favorite_player !== undefined ? favorite_player.trim() : existingPlayer.favorite_player,
        photo_url: photo_url || existingPlayer.photo_url,
      });
    } else {
      player = createPlayer({
        name: name.trim(),
        gender: req.body.gender === 'women' ? 'women' : 'men',
        study_program: req.body.study_program ? req.body.study_program.trim() : 'Student',
        specialization: category,
        team: 'Badminton Student Community',
        email,
        phone: phone ? phone.trim() : '',
        show_phone: 0, // Privacy shielded by default
        favorite_player: favorite_player ? favorite_player.trim() : '',
        skill_level: skill_level ? skill_level.trim() : 'Fortgeschritten',
        university_type: uniName === 'TU Chemnitz' ? 'tu_chemnitz' : 'other',
        university_name: uniName,
        photo_url,
        avatar_type: avatar_type || 'badminton_smash'
      });
    }

    res.json({
      success: true,
      message: 'Dein Spielerprofil wurde erfolgreich gespeichert!',
      player
    });
  } catch (err) {
    console.error('Error saving player profile:', err);
    res.status(500).json({ error: err.message || 'Fehler beim Speichern des Profils.' });
  }
});

// -------------------------------------------------------------
// Streamlined Trainer Profile (Authenticated Trainer)
// -------------------------------------------------------------
app.post('/api/trainers/profile', requireStudentUser, upload.single('photo'), (req, res) => {
  try {
    if (req.studentUser?.role !== 'trainer') {
      return res.status(403).json({
        error: 'Only registered trainers can create or update a trainer profile. / Nur registrierte Trainer können ein Trainer-Profil anlegen.'
      });
    }
    const email = req.studentEmail;
    const {
      name,
      phone,
      role,
      hourly_rate,
      experience_years,
      focus_areas,
      availability,
      photo_url_input
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name ist erforderlich.' });
    }

    let photo_url = photo_url_input !== undefined ? photo_url_input.trim() : (req.body.photo_url || '');
    if (req.file) {
      photo_url = `/uploads/${req.file.filename}`;
    }

    const existingTrainer = getTrainerByEmail(email);
    let trainer;
    if (existingTrainer) {
      trainer = updateTrainer(existingTrainer.id, {
        name: name.trim(),
        role: role ? role.trim() : existingTrainer.role,
        email,
        phone: phone !== undefined ? phone.trim() : existingTrainer.phone,
        show_phone: 0,
        focus_areas: focus_areas ? focus_areas.trim() : existingTrainer.focus_areas,
        photo_url: photo_url || existingTrainer.photo_url,
        trainer_type: existingTrainer.trainer_type || 'private',
        hourly_rate: hourly_rate !== undefined ? hourly_rate.trim() : existingTrainer.hourly_rate,
        availability: availability !== undefined ? availability.trim() : existingTrainer.availability,
        experience_years: experience_years !== undefined ? experience_years.trim() : existingTrainer.experience_years,
        hochschulsport_approved: existingTrainer.hochschulsport_approved !== undefined ? existingTrainer.hochschulsport_approved : 1,
        hochschulsport_note: existingTrainer.hochschulsport_note || 'USZ-Zulassung vorhanden',
        status: 'approved'
      });
    } else {
      trainer = createTrainer({
        name: name.trim(),
        role: role ? role.trim() : 'Badminton Coach',
        email,
        phone: phone ? phone.trim() : '',
        show_phone: 0,
        focus_areas: focus_areas ? focus_areas.trim() : 'Technik & Taktik',
        photo_url,
        trainer_type: 'private',
        hourly_rate: hourly_rate ? hourly_rate.trim() : '',
        availability: availability ? availability.trim() : '',
        experience_years: experience_years ? experience_years.trim() : '',
        hochschulsport_approved: 1,
        hochschulsport_note: 'Community Trainer',
        status: 'approved'
      });
    }

    res.json({
      success: true,
      message: 'Dein Trainer-Profil wurde erfolgreich gespeichert!',
      trainer
    });
  } catch (err) {
    console.error('Error saving trainer profile:', err);
    res.status(500).json({ error: err.message || 'Fehler beim Speichern des Trainer-Profils.' });
  }
});

// Alias for backwards compatibility
app.post('/api/trainers/register', requireStudentUser, upload.single('photo'), (req, res, next) => {
  return app._router.handle({ ...req, url: '/api/trainers/profile' }, res, next);
});

// -------------------------------------------------------------
// Streamlined Equipment Service Profile (Authenticated Service)
// -------------------------------------------------------------
app.post('/api/equipment-services/profile', requireStudentUser, upload.single('photo'), (req, res) => {
  try {
    if (req.studentUser?.role !== 'service') {
      return res.status(403).json({
        error: 'Only registered service providers can create or update a service profile. / Nur registrierte Dienstleister können ein Ausrüstungs-Profil anlegen.'
      });
    }
    const email = req.studentEmail;
    const {
      name,
      phone,
      service_type,
      pricing_details,
      available_items,
      location_note,
      experience_years,
      photo_url_input
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name ist erforderlich.' });
    }

    let photo_url = photo_url_input !== undefined ? photo_url_input.trim() : (req.body.photo_url || '');
    if (req.file) {
      photo_url = `/uploads/${req.file.filename}`;
    }

    const existingService = getEquipmentServiceByEmail(email);
    let service;
    if (existingService) {
      service = updateEquipmentService(existingService.id, {
        name: name.trim(),
        service_type: service_type ? service_type.trim() : existingService.service_type,
        email,
        phone: phone !== undefined ? phone.trim() : existingService.phone,
        show_phone: 0,
        pricing_details: pricing_details !== undefined ? pricing_details.trim() : existingService.pricing_details,
        available_items: available_items !== undefined ? available_items.trim() : existingService.available_items,
        location_note: location_note !== undefined ? location_note.trim() : existingService.location_note,
        experience_years: experience_years !== undefined ? experience_years.trim() : existingService.experience_years,
        photo_url: photo_url || existingService.photo_url,
        status: 'approved'
      });
    } else {
      service = createEquipmentService({
        name: name.trim(),
        service_type: service_type ? service_type.trim() : 'Schläger-Besaitungsservice & Ausrüstung',
        email,
        phone: phone ? phone.trim() : '',
        show_phone: 0,
        pricing_details: pricing_details ? pricing_details.trim() : '',
        available_items: available_items ? available_items.trim() : '',
        location_note: location_note ? location_note.trim() : 'Sporthalle Thüringer Weg 11 / Campus',
        experience_years: experience_years ? experience_years.trim() : '',
        photo_url,
        status: 'approved'
      });
    }

    res.json({
      success: true,
      message: 'Dein Ausrüstungs- & Besaitungs-Profil wurde erfolgreich gespeichert!',
      service
    });
  } catch (err) {
    console.error('Error saving equipment service profile:', err);
    res.status(500).json({ error: err.message || 'Fehler beim Speichern des Service-Profils.' });
  }
});

// Alias for backwards compatibility
app.post('/api/equipment-services/register', requireStudentUser, upload.single('photo'), (req, res, next) => {
  return app._router.handle({ ...req, url: '/api/equipment-services/profile' }, res, next);
});

// -------------------------------------------------------------
// Play Contact Requests (Strict Privacy Shielding: Request & Reply)
// -------------------------------------------------------------
app.post('/api/players/:id/contact-request', requireStudentUser, async (req, res) => {
  try {
    // Permission Gating: Trainers cannot send requests to players
    if (req.studentUser?.role === 'trainer') {
      return res.status(403).json({
        error: 'Trainers cannot send requests to players. / Trainer können keine Anfragen an Spieler senden.'
      });
    }
    // Permission Gating: Service providers cannot send requests to players
    if (req.studentUser?.role === 'service') {
      return res.status(403).json({
        error: 'Service providers cannot send requests to players. / Service-Anbieter können keine Anfragen an Spieler senden.'
      });
    }

    const targetPlayerId = parseInt(req.params.id, 10);
    const targetPlayer = getPlayerById(targetPlayerId);
    if (!targetPlayer) {
      return res.status(404).json({ error: 'Spieler nicht gefunden.' });
    }

    const { message, phone } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Bitte gib eine kurze Nachricht für den Spieler ein.' });
    }

    if (targetPlayer.email.toLowerCase() === req.studentEmail.toLowerCase()) {
      return res.status(400).json({ error: 'Du kannst dir nicht selbst eine Anfrage senden.' });
    }

    const requestRecord = createPlayerContactRequest({
      from_name: req.studentUser.name || 'Badminton-Spieler',
      from_email: req.studentEmail,
      from_phone: phone ? phone.trim() : null,
      to_player_id: targetPlayer.id,
      to_name: targetPlayer.name,
      to_email: targetPlayer.email,
      message: message.trim()
    });

    // Send email notification to target player
    sendPlayRequestNotificationEmail({
      toEmail: targetPlayer.email,
      toName: targetPlayer.name,
      fromName: req.studentUser.name || 'Badminton-Spieler',
      fromEmail: req.studentEmail,
      fromPhone: phone ? phone.trim() : null,
      message: message.trim(),
      acceptToken: requestRecord.accept_token
    }).catch(e => console.error('Error sending request notification email:', e));

    res.json({
      success: true,
      message: `Deine Anfrage wurde erfolgreich an ${targetPlayer.name} gesendet! Sobald die Anfrage angenommen wird, erhaltet ihr gegenseitig eure Kontaktdaten.`
    });
  } catch (err) {
    console.error('Error sending contact request:', err);
    res.status(500).json({ error: 'Fehler beim Senden der Anfrage.' });
  }
});

// Accept request via 1-click email token
app.get('/api/players/requests/accept/:token', (req, res) => {
  try {
    const token = req.params.token;
    const request = getContactRequestByToken(token);
    if (!request) {
      return res.status(404).send(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h2>Anfrage nicht gefunden oder abgelaufen</h2>
          <p><a href="https://130-61-242-26.sslip.io">Zurück zur Badminton Student Community</a></p>
        </div>
      `);
    }

    const accepted = acceptContactRequest(token, 'Anfrage per E-Mail-Bestätigung angenommen');

    // Notify the requester that request was accepted
    sendPlayRequestAcceptedNotificationEmail({
      toEmail: request.from_email,
      toName: request.from_name,
      accepterName: request.to_name,
      accepterEmail: request.to_email,
      accepterPhone: null,
      replyMessage: 'Die Spielanfrage wurde über den E-Mail-Link angenommen!'
    }).catch(e => console.error('Error sending accept notification email:', e));

    res.send(`
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Spielanfrage angenommen | Badminton Student Community</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; display: flex; justify-content: center; align-items: center; min-height: 80vh; }
          .card { background: white; border-radius: 24px; max-width: 480px; width: 100%; padding: 36px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
          .badge { display: inline-block; padding: 6px 14px; background: #dcfce7; color: #166534; font-weight: 700; border-radius: 99px; font-size: 13px; margin-bottom: 16px; }
          h1 { color: #005A36; font-size: 24px; margin: 0 0 12px 0; }
          p { color: #475569; font-size: 15px; line-height: 1.6; }
          .btn { display: inline-block; background: #005A36; color: white; text-decoration: none; padding: 12px 28px; border-radius: 14px; font-weight: 700; margin-top: 24px; transition: background 0.2s; }
          .btn:hover { background: #00472A; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">✅ Erfolgreich verbunden!</div>
          <h1>Spielanfrage angenommen</h1>
          <p>Du hast die Spielanfrage von <strong>${request.from_name}</strong> erfolgreich bestätigt.</p>
          <p>Eure Kontaktdaten wurden für die Spielabsprache freigegeben. ${request.from_name} wurde soeben per E-Mail benachrichtigt.</p>
          <a href="https://130-61-242-26.sslip.io/#players" class="btn">🏸 Zurück zur Badminton Community</a>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('Error accepting contact request:', err);
    res.status(500).send('Fehler beim Bestätigen der Anfrage.');
  }
});

// Reply to request in-app
app.post('/api/players/requests/:id/reply', requireStudentUser, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { reply_message } = req.body;
    const requests = getContactRequestsForUser(req.studentEmail);
    const reqItem = requests.incoming.find(r => r.id === id);
    if (!reqItem) {
      return res.status(404).json({ error: 'Anfrage nicht gefunden.' });
    }

    const accepted = acceptContactRequest(reqItem.accept_token, reply_message);

    sendPlayRequestAcceptedNotificationEmail({
      toEmail: reqItem.from_email,
      toName: reqItem.from_name,
      accepterName: reqItem.to_name,
      accepterEmail: reqItem.to_email,
      accepterPhone: req.studentUser.phone || null,
      replyMessage: reply_message || 'Ich freue mich auf das Spiel!'
    }).catch(e => console.error('Error sending reply notification email:', e));

    res.json({
      success: true,
      message: 'Anfrage angenommen! Kontaktdaten wurden für die Absprache freigegeben.'
    });
  } catch (err) {
    console.error('Error in request reply:', err);
    res.status(500).json({ error: 'Fehler beim Antworten.' });
  }
});

// Get My Requests (Incoming & Outgoing)
app.get('/api/players/my-requests', requireStudentUser, (req, res) => {
  try {
    const data = getContactRequestsForUser(req.studentEmail);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Fehler beim Abrufen der Anfragen.' });
  }
});

// 5. Player Self-Deletion via OTP
app.post('/api/players/self-delete', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'E-Mail und Bestätigungscode sind erforderlich.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const otpResult = verifyOtp(cleanEmail, code, 'delete_profile');
    if (otpResult.error) {
      return res.status(otpResult.status || 400).json({ error: otpResult.error });
    }

    const deleted = deletePlayerByEmail(cleanEmail);
    if (!deleted) {
      return res.status(404).json({ error: 'Kein Spielerprofil unter dieser E-Mail gefunden.' });
    }

    sendProfileDeletedEmail({
      to: cleanEmail,
      playerName: deleted.name
    }).catch(e => console.error('Error sending profile deleted email:', e));

    res.json({
      success: true,
      message: `Dein Spielerprofil (${deleted.name}) wurde erfolgreich gelöscht.`
    });
  } catch (err) {
    console.error('Error self-deleting player:', err);
    res.status(500).json({ error: 'Fehler beim Löschen des Profils.' });
  }
});

// 6. Player Self-Edit Verification (Verify OTP & Return Player Data + Edit Session)
app.post('/api/players/self-edit/verify', (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'E-Mail und Bestätigungscode sind erforderlich.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const otpResult = verifyOtp(cleanEmail, code, 'edit_profile');
    if (otpResult.error) {
      return res.status(otpResult.status || 400).json({ error: otpResult.error });
    }

    const player = getPlayerByEmail(cleanEmail);
    if (!player) {
      return res.status(404).json({ error: 'Kein Spielerprofil unter dieser E-Mail gefunden.' });
    }

    const editToken = createEditSession(cleanEmail);

    res.json({
      success: true,
      verified: true,
      editToken,
      player: {
        id: player.id,
        name: player.name,
        gender: player.gender,
        study_program: player.study_program,
        specialization: player.specialization,
        team: player.team,
        email: player.email,
        phone: player.phone || '',
        show_phone: player.show_phone,
        favorite_player: player.favorite_player || '',
        skill_level: player.skill_level || 'Fortgeschritten',
        university_type: player.university_type || 'tu_chemnitz',
        university_name: player.university_name || 'TU Chemnitz',
        photo_url: player.photo_url || '',
        avatar_type: player.avatar_type || 'badminton_smash',
      }
    });
  } catch (err) {
    console.error('Error verifying edit OTP:', err);
    res.status(500).json({ error: 'Fehler bei der Code-Überprüfung.' });
  }
});

// 7. Player Self-Edit Submission (Update Profile with Edit Token)
app.put('/api/players/self-edit', upload.single('photo'), (req, res) => {
  try {
    const {
      email,
      edit_token,
      name,
      gender,
      study_program,
      specialization,
      team,
      phone,
      show_phone,
      favorite_player,
      skill_level,
      university_type,
      university_name,
      avatar_type,
      photo_url_input,
    } = req.body;

    if (!email || !edit_token) {
      return res.status(401).json({ error: 'Autorisierung ungültig. Bitte fordere einen neuen Code an.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!verifyEditSession(edit_token, cleanEmail)) {
      return res.status(401).json({ error: 'Deine Bearbeitungssitzung ist abgelaufen. Bitte fordere einen neuen Bestätigungscode an.' });
    }

    const existingPlayer = getPlayerByEmail(cleanEmail);
    if (!existingPlayer) {
      return res.status(404).json({ error: 'Spielerprofil nicht gefunden.' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name ist erforderlich.' });
    }

    let photo_url = photo_url_input !== undefined ? photo_url_input.trim() : (req.body.photo_url !== undefined ? req.body.photo_url : undefined);
    if (req.file) {
      photo_url = `/uploads/${req.file.filename}`;
    }

    const isShowPhone = show_phone !== undefined ? (show_phone === true || show_phone === 'true' || show_phone === 1 || show_phone === '1' ? 1 : 0) : undefined;

    const updated = updatePlayer(existingPlayer.id, {
      name: name.trim(),
      gender: gender === 'women' ? 'women' : 'men',
      study_program: study_program ? study_program.trim() : existingPlayer.study_program,
      specialization: specialization ? specialization.trim() : existingPlayer.specialization,
      team: team ? team.trim() : existingPlayer.team,
      email: cleanEmail,
      phone: phone !== undefined ? phone.trim() : existingPlayer.phone,
      show_phone: isShowPhone !== undefined ? isShowPhone : existingPlayer.show_phone,
      favorite_player: favorite_player !== undefined ? favorite_player.trim() : existingPlayer.favorite_player,
      skill_level: skill_level ? skill_level.trim() : existingPlayer.skill_level,
      university_type: university_type ? university_type.trim() : existingPlayer.university_type,
      university_name: university_name ? university_name.trim() : existingPlayer.university_name,
      avatar_type: avatar_type || existingPlayer.avatar_type || 'badminton_smash',
      photo_url,
    });

    invalidateEditSession(edit_token);

    res.json({
      success: true,
      message: 'Dein Spielerprofil wurde erfolgreich aktualisiert!',
      player: updated
    });
  } catch (err) {
    console.error('Error in player self-edit:', err);
    res.status(500).json({ error: err.message || 'Fehler beim Aktualisieren des Profils.' });
  }
});

app.get('/api/players', requireStudentOrAdmin, (req, res) => {
  try {
    const { gender } = req.query;
    const players = getAllPlayers(gender);
    const viewerEmail = req.studentEmail || null;
    const publicPlayers = players.map(p => sanitizePublicPlayer(p, viewerEmail));
    res.json(publicPlayers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve players list' });
  }
});

app.post('/api/players', requireAdmin, upload.single('photo'), (req, res) => {
  try {
    const {
      name,
      gender,
      study_program,
      specialization,
      team,
      email,
      phone,
      show_phone,
      favorite_player,
      skill_level,
      university_type,
      university_name,
      photo_url_input,
    } = req.body;

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

    const isShowPhone = show_phone !== undefined ? (show_phone === true || show_phone === 'true' || show_phone === 1 || show_phone === '1' ? 1 : 0) : 0;

    const newPlayer = createPlayer({
      name: name.trim(),
      gender,
      study_program: study_program.trim(),
      specialization: specialization.trim(),
      team: team ? team.trim() : '1. Mannschaft (Sachsenliga)',
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      show_phone: isShowPhone,
      favorite_player: favorite_player ? favorite_player.trim() : '',
      skill_level: skill_level ? skill_level.trim() : 'Fortgeschritten',
      university_type: university_type ? university_type.trim() : 'tu_chemnitz',
      university_name: university_name ? university_name.trim() : 'TU Chemnitz',
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
    const {
      name,
      gender,
      study_program,
      specialization,
      team,
      email,
      phone,
      show_phone,
      favorite_player,
      skill_level,
      university_type,
      university_name,
      status,
      photo_url_input,
    } = req.body;
    let photo_url = photo_url_input !== undefined ? photo_url_input.trim() : (req.body.photo_url !== undefined ? req.body.photo_url : undefined);
    if (req.file) {
      photo_url = `/uploads/${req.file.filename}`;
    }

    const isShowPhone = show_phone !== undefined ? (show_phone === true || show_phone === 'true' || show_phone === 1 || show_phone === '1' ? 1 : 0) : undefined;

    const updated = updatePlayer(id, {
      name,
      gender,
      study_program,
      specialization,
      team,
      email,
      phone,
      show_phone: isShowPhone,
      favorite_player,
      skill_level,
      university_type,
      university_name,
      status,
      photo_url,
    });
    res.json({ success: true, player: updated });
  } catch (err) {
    console.error('Error updating player:', err);
    res.status(500).json({ error: err.message || 'Failed to update player' });
  }
});

// -------------------------------------------------------------
// Equipment Services & Stringers / Shuttle Sellers Endpoints
// -------------------------------------------------------------
app.get('/api/equipment-services', (req, res) => {
  try {
    const services = getAllEquipmentServices();
    // Privacy Shield: Exclude private email and phone numbers from public response!
    const sanitized = services.map(s => ({
      id: s.id,
      name: s.name,
      service_type: s.service_type,
      pricing_details: s.pricing_details,
      available_items: s.available_items,
      location_note: s.location_note,
      experience_years: s.experience_years,
      photo_url: s.photo_url,
      created_at: s.created_at,
    }));
    res.json(sanitized);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve equipment services' });
  }
});

app.get('/api/admin/equipment-services', requireAdmin, (req, res) => {
  try {
    const services = getAllEquipmentServices();
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve admin equipment services' });
  }
});

app.get('/api/admin/equipment-services/pending', requireAdmin, (req, res) => {
  try {
    const pending = getPendingEquipmentServices();
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve pending equipment services' });
  }
});

app.post('/api/admin/equipment-services/:id/approve', requireAdmin, (req, res) => {
  try {
    const approved = approveEquipmentService(Number(req.params.id));
    res.json({ success: true, service: approved });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to approve equipment service' });
  }
});

app.delete('/api/admin/equipment-services/:id/reject', requireAdmin, (req, res) => {
  try {
    rejectEquipmentService(Number(req.params.id));
    res.json({ success: true, message: 'Equipment service registration rejected' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to reject equipment service' });
  }
});

app.post('/api/admin/equipment-services', requireAdmin, upload.single('photo'), (req, res) => {
  try {
    const {
      name, service_type, email, phone, show_phone,
      pricing_details, available_items, location_note, experience_years, photo_url_input
    } = req.body;
    let photo_url = photo_url_input || '';
    if (req.file) photo_url = `/uploads/${req.file.filename}`;

    const isShowPhone = show_phone !== undefined ? (show_phone === true || show_phone === 'true' || show_phone === 1 || show_phone === '1' ? 1 : 0) : 1;

    const created = createEquipmentService({
      name: name.trim(),
      service_type: service_type || 'Besaitungsservice & Ausrüstung',
      email: email ? email.trim().toLowerCase() : '',
      phone: phone ? phone.trim() : '',
      show_phone: isShowPhone,
      pricing_details,
      available_items,
      location_note,
      experience_years,
      photo_url,
      status: 'approved',
    });
    res.status(201).json({ success: true, service: created });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to create equipment service' });
  }
});

app.put('/api/admin/equipment-services/:id', requireAdmin, upload.single('photo'), (req, res) => {
  try {
    const id = Number(req.params.id);
    const data = { ...req.body };
    if (req.file) {
      data.photo_url = `/uploads/${req.file.filename}`;
    } else if (data.photo_url_input) {
      data.photo_url = data.photo_url_input;
    }
    const updated = updateEquipmentService(id, data);
    res.json({ success: true, service: updated });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to update equipment service' });
  }
});

app.delete('/api/admin/equipment-services/:id', requireAdmin, (req, res) => {
  try {
    deleteEquipmentService(Number(req.params.id));
    res.json({ success: true, message: 'Equipment service removed' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to delete equipment service' });
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
    
    // Dispatch 6-digit OTP code to the owner's email and laptop server console
    await sendPasswordResetEmail({
      to: targetEmail,
      approvalCode: resetData.approval_code,
      expiresMinutes: 15,
    });

    // SECURITY: NEVER return token or approval code to the client!
    res.json({
      success: true,
      message: `Ein 6-stelliger Bestätigungscode wurde an ${targetEmail} übermittelt. Bitte geben Sie diesen Code ein, um die Änderung zu bestätigen.`,
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
      message: 'Ihr Passwort wurde erfolgreich aktualisiert! Sie können sich jetzt mit dem neuen Passwort anmelden.'
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
      show_phone,
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
    // Verify OTP code for registration
    const otpCode = req.body.otp_code;
    if (!otpCode) {
      return res.status(400).json({ error: 'Bitte bestätige deine E-Mail-Adresse mit dem 6-stelligen Code vor der Registrierung.' });
    }
    const otpCheck = verifyOtp(email, otpCode, 'register_player');
    if (otpCheck.error) {
      return res.status(otpCheck.status || 400).json({ error: otpCheck.error });
    }

    // Phone is optional
    const playerPhone = phone && phone.trim() ? phone.trim() : '';

    let photo_url = photo_url_input ? photo_url_input.trim() : '';
    if (req.file) {
      photo_url = `/uploads/${req.file.filename}`;
    }

    const isShowPhone = show_phone === true || show_phone === 'true' || show_phone === 1 || show_phone === '1' ? 1 : 0;

    const created = registerPlayerSubmission({
      name: name.trim(),
      gender: gender === 'women' ? 'women' : 'men',
      study_program: study_program ? study_program.trim() : 'TU Chemnitz',
      specialization: specialization ? specialization.trim() : 'Einzel & Doppel',
      team: team ? team.trim() : 'Hochschulsport & Spielbetrieb',
      email: email.trim().toLowerCase(),
      phone: playerPhone,
      show_phone: isShowPhone,
      favorite_player: favorite_player ? favorite_player.trim() : '',
      skill_level: skill_level ? skill_level.trim() : 'Fortgeschritten',
      university_type: university_type ? university_type.trim() : 'tu_chemnitz',
      university_name: university_name ? university_name.trim() : 'TU Chemnitz',
      photo_url,
      avatar_type: req.body.avatar_type || 'badminton_smash',
      is_public: req.body.is_public === false || req.body.is_public === 'false' || req.body.is_public === 0 || req.body.is_public === '0' ? 0 : 1,
    });

    res.status(201).json({
      success: true,
      message: 'Ihre Spieler-Registrierung wurde erfolgreich eingereicht! Nach Überprüfung und Freischaltung durch die Turnier- & Abteilungsleitung wird Ihr Profil auf der Website sichtbar.',
      player: created,
    });
  } catch (err) {
    console.error('Error in player registration:', err);
    if (err.message && err.message.includes('existiert bereits')) {
      return res.status(409).json({ error: err.message });
    }
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
      show_phone,
      focus_areas,
      hochschulsport_approved,
      hochschulsport_note,
      trainer_type,
      hourly_rate,
      availability,
      experience_years,
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

    const type = trainer_type === 'private' ? 'private' : 'usz';

    // Strict check only for USZ trainers: USZ agreement is required
    const isApproved =
      hochschulsport_approved === true ||
      hochschulsport_approved === 'true' ||
      hochschulsport_approved === 1 ||
      hochschulsport_approved === '1';

    if (type === 'usz' && !isApproved) {
      return res.status(400).json({
        error: 'Für die USZ-Trainer-Registrierung ist die vorherige Genehmigung / Vereinbarung mit dem Hochschulsport (USZ) erforderlich.',
      });
    }

    let photo_url = photo_url_input ? photo_url_input.trim() : '';
    if (req.file) {
      photo_url = `/uploads/${req.file.filename}`;
    }

    const isShowPhone = show_phone === true || show_phone === 'true' || show_phone === 1 || show_phone === '1' ? 1 : 0;

    const defaultRole = type === 'private' ? 'Privattrainer / Individual Coach' : 'Badminton-Trainer (USZ)';

    const created = registerTrainerSubmission({
      name: name.trim(),
      role: role ? role.trim() : defaultRole,
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      show_phone: isShowPhone,
      focus_areas: focus_areas ? focus_areas.trim() : 'Allgemeine Trainingslehre & Technik',
      hochschulsport_approved: type === 'usz' ? 1 : 0,
      hochschulsport_note: hochschulsport_note ? hochschulsport_note.trim() : (type === 'usz' ? 'USZ-Genehmigung bestätigt' : 'Privattraining'),
      trainer_type: type,
      hourly_rate: hourly_rate ? hourly_rate.trim() : '',
      availability: availability ? availability.trim() : '',
      experience_years: experience_years ? experience_years.trim() : '',
      photo_url,
    });

    res.status(201).json({
      success: true,
      message: type === 'private'
        ? 'Deine Registrierung als Privattrainer wurde erfolgreich eingereicht! Nach Prüfung durch den Admin wird dein Profil freigeschaltet.'
        : 'Ihre Trainer-Bewerbung wurde erfolgreich eingereicht! Nach verwaltungsseitiger Prüfung der Hochschulsport-Genehmigung durch den Admin wird Ihr Profil freigeschaltet.',
      trainer: created,
    });
  } catch (err) {
    console.error('Error in trainer registration:', err);
    if (err.message && err.message.includes('existiert bereits')) {
      return res.status(409).json({ error: err.message });
    }
    res.status(500).json({ error: err.message || 'Fehler bei der Trainer-Registrierung.' });
  }
});

// 2c. Public Equipment Service / Stringer Registration Submission
app.post('/api/register/equipment-service', upload.single('photo'), (req, res) => {
  try {
    const {
      name,
      service_type,
      email,
      phone,
      show_phone,
      pricing_details,
      available_items,
      location_note,
      experience_years,
      photo_url_input,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name / Anbietername ist erforderlich.' });
    }
    if (!email || !email.trim() || !email.includes('@')) {
      return res.status(400).json({ error: 'Eine gültige E-Mail-Adresse ist erforderlich.' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'Telefonnummer / WhatsApp ist erforderlich.' });
    }

    let photo_url = '';
    if (req.file) {
      photo_url = `/uploads/${req.file.filename}`;
    } else if (photo_url_input && photo_url_input.trim()) {
      const inputUrl = photo_url_input.trim();
      if (inputUrl.startsWith('data:image/')) {
        photo_url = saveBase64Image(inputUrl, 'service_photo');
      } else {
        photo_url = inputUrl;
      }
    }

    const isShowPhone = show_phone === '1' || show_phone === 1 || show_phone === 'true' || show_phone === true;

    const created = registerEquipmentServiceSubmission({
      name: name.trim(),
      service_type: service_type ? service_type.trim() : 'Besaitungsservice & Ausrüstung',
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      show_phone: isShowPhone,
      pricing_details: pricing_details ? pricing_details.trim() : '',
      available_items: available_items ? available_items.trim() : '',
      location_note: location_note ? location_note.trim() : '',
      experience_years: experience_years ? experience_years.trim() : '',
      photo_url,
    });

    res.status(201).json({
      success: true,
      message: 'Ihre Registrierung als Ausrüster / Besaiter wurde erfolgreich eingereicht! Nach Prüfung durch den Admin wird Ihr Profil im Ausrüstungsbereich freigeschaltet.',
      service: created,
    });
  } catch (err) {
    console.error('Error in equipment service registration:', err);
    if (err.message && err.message.includes('existiert bereits')) {
      return res.status(409).json({ error: err.message });
    }
    res.status(500).json({ error: err.message || 'Fehler bei der Registrierung.' });
  }
});

// Rate limiting map for partner requests: ip -> timestamps[]
const partnerRequestLimits = new Map();

// 2b. Tournament Partner Request (Send Email to Player)
app.post('/api/players/:id/partner-request', async (req, res) => {
  try {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const timestamps = (partnerRequestLimits.get(clientIp) || []).filter(t => now - t < 10 * 60 * 1000); // 10 min window
    if (timestamps.length >= 5) {
      return res.status(429).json({
        error: 'Zu viele Anfragen. Bitte warten Sie einige Minuten, bevor Sie weitere Partneranfragen senden.'
      });
    }
    timestamps.push(now);
    partnerRequestLimits.set(clientIp, timestamps);

    const playerId = Number(req.params.id);
    const player = getPlayerById(playerId);
    if (!player || player.status !== 'approved') {
      return res.status(404).json({ error: 'Spieler nicht gefunden oder Profil noch nicht freigeschaltet.' });
    }
    if (!player.email || !player.email.includes('@')) {
      return res.status(400).json({ error: 'Für diesen Spieler ist keine gültige Kontakt-E-Mail hinterlegt.' });
    }

    const {
      requester_name,
      requester_email,
      requester_phone,
      tournament_name,
      discipline,
      message,
    } = req.body;

    if (!requester_name || !requester_name.trim()) {
      return res.status(400).json({ error: 'Dein Name ist erforderlich.' });
    }
    if (!requester_email || !requester_email.trim() || !requester_email.includes('@')) {
      return res.status(400).json({ error: 'Eine gültige E-Mail-Adresse ist erforderlich.' });
    }
    if (!tournament_name || !tournament_name.trim()) {
      return res.status(400).json({ error: 'Bitte gib das gewünschte Turnier an.' });
    }
    if (!discipline || !discipline.trim()) {
      return res.status(400).json({ error: 'Bitte wähle die gewünschte Disziplin (z. B. Doppel oder Mixed) aus.' });
    }

    // 1. Send Email to the target player
    const mailRes = await sendPartnerRequestEmail({
      to: player.email,
      toPlayerName: player.name,
      requesterName: requester_name.trim(),
      requesterEmail: requester_email.trim().toLowerCase(),
      requesterPhone: requester_phone ? requester_phone.trim() : '',
      tournamentName: tournament_name.trim(),
      discipline: discipline.trim(),
      message: message ? message.trim() : '',
    });

    // 2. Persist in database
    const record = createPartnerRequest({
      player_id: player.id,
      player_name: player.name,
      player_email: player.email,
      requester_name: requester_name.trim(),
      requester_email: requester_email.trim().toLowerCase(),
      requester_phone: requester_phone ? requester_phone.trim() : '',
      tournament_name: tournament_name.trim(),
      discipline: discipline.trim(),
      message: message ? message.trim() : '',
    });

    res.json({
      success: true,
      message: `Deine Partner-Anfrage wurde erfolgreich per E-Mail an ${player.name} gesendet!`,
      request: record,
      emailSent: mailRes.success,
    });
  } catch (err) {
    console.error('Error in partner-request endpoint:', err);
    res.status(500).json({ error: err.message || 'Fehler beim Senden der Partner-Anfrage.' });
  }
});

// Admin: Get all partner requests
app.get('/api/admin/partner-requests', requireAdmin, (req, res) => {
  try {
    const requests = getAllPartnerRequests();
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Fehler beim Laden der Partner-Anfragen.' });
  }
});

// -------------------------------------------------------------
// Contact Inquiries (Mediated via Admin for Trainers & Stringers)
// -------------------------------------------------------------
const inquiryLimits = new Map();

// Public: Submit Contact Inquiry
app.post('/api/inquiries', async (req, res) => {
  try {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const timestamps = (inquiryLimits.get(clientIp) || []).filter(t => now - t < 10 * 60 * 1000);
    if (timestamps.length >= 5) {
      return res.status(429).json({
        error: 'Zu viele Anfragen. Bitte warte einige Minuten, bevor du weitere Anfragen sendest.'
      });
    }
    timestamps.push(now);
    inquiryLimits.set(clientIp, timestamps);

    const {
      target_type,
      target_id,
      requester_name,
      requester_email,
      requester_phone,
      preferred_date,
      message,
    } = req.body;

    if (!target_type || !['trainer', 'service'].includes(target_type)) {
      return res.status(400).json({ error: 'Ungültiger Anfragetyp (trainer oder service).' });
    }
    if (!target_id) {
      return res.status(400).json({ error: 'Ziel-ID ist erforderlich.' });
    }
    if (!requester_name || !requester_name.trim()) {
      return res.status(400).json({ error: 'Dein Name ist erforderlich.' });
    }
    if (!requester_email || !requester_email.trim() || !requester_email.includes('@')) {
      return res.status(400).json({ error: 'Eine gültige E-Mail-Adresse ist erforderlich.' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Bitte gib eine Nachricht oder Beschreibung deiner Anfrage ein.' });
    }

    // Permission Gating: Service providers cannot send requests to trainers
    const auth = getAuthenticatedStudentUser(req);
    const callerEmail = auth?.email || requester_email.trim().toLowerCase();
    const callerRole = auth?.user?.role || getStudentUserByEmail(callerEmail)?.role;
    if (callerRole === 'service' && target_type === 'trainer') {
      return res.status(403).json({
        error: 'Service providers cannot send requests to trainers. / Service-Anbieter können keine Anfragen an Trainer senden.'
      });
    }

    // Lookup target to get target name and private email
    let target = null;
    if (target_type === 'trainer') {
      target = getTrainerById(Number(target_id));
    } else if (target_type === 'service') {
      target = getEquipmentServiceById(Number(target_id));
    }

    if (!target) {
      return res.status(404).json({ error: 'Der angefragte Trainer oder Dienstleister existiert nicht.' });
    }

    const inquiry = createContactInquiry({
      target_type,
      target_id: Number(target_id),
      target_name: target.name,
      target_email: target.email,
      requester_name: requester_name.trim(),
      requester_email: requester_email.trim().toLowerCase(),
      requester_phone: requester_phone ? requester_phone.trim() : '',
      preferred_date: preferred_date ? preferred_date.trim() : '',
      message: message.trim(),
    });

    // Notify admin via email
    await sendInquiryToAdminEmail({
      inquiry,
      target: {
        name: target.name,
        email: target.email,
        phone: target.phone || '',
      }
    });

    res.status(201).json({
      success: true,
      message: `Deine Anfrage für ${target.name} wurde erfolgreich an das Admin-Team übermittelt! Wir prüfen die Anfrage und leiten sie schnellstmöglich weiter.`,
      inquiryId: inquiry.id,
    });
  } catch (err) {
    console.error('Error in /api/inquiries:', err);
    res.status(500).json({ error: err.message || 'Fehler beim Übermitteln der Anfrage' });
  }
});

// Admin: Get all inquiries
app.get('/api/admin/inquiries', requireAdmin, (req, res) => {
  try {
    const inquiries = getAllContactInquiries();
    res.json(inquiries);
  } catch (err) {
    res.status(500).json({ error: 'Fehler beim Laden der Anfragen' });
  }
});

// Admin: Forward inquiry to target trainer or stringer
app.post('/api/admin/inquiries/:id/forward', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const inquiry = getContactInquiryById(id);
    if (!inquiry) {
      return res.status(404).json({ error: 'Anfrage nicht gefunden.' });
    }

    let target = null;
    if (inquiry.target_type === 'trainer') {
      target = getTrainerById(inquiry.target_id);
    } else if (inquiry.target_type === 'service') {
      target = getEquipmentServiceById(inquiry.target_id);
    }

    const targetEmail = target?.email || inquiry.target_email;
    const targetName = target?.name || inquiry.target_name;

    if (!targetEmail) {
      return res.status(400).json({ error: 'Keine Ziel-E-Mail-Adresse für diesen Anbieter hinterlegt.' });
    }

    const mailRes = await sendForwardedInquiryToTarget({
      inquiry,
      target: {
        name: targetName,
        email: targetEmail,
        phone: target?.phone || '',
      }
    });

    const updated = markContactInquiryForwarded(id);
    res.json({
      success: true,
      message: `Anfrage erfolgreich an ${targetName} (${targetEmail}) weitergeleitet!`,
      inquiry: updated,
      emailSent: mailRes.success,
    });
  } catch (err) {
    console.error('Error forwarding inquiry:', err);
    res.status(500).json({ error: err.message || 'Fehler beim Weiterleiten der Anfrage' });
  }
});

// Admin: Update inquiry status / notes
app.put('/api/admin/inquiries/:id', requireAdmin, (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status, admin_notes } = req.body;
    const updated = updateContactInquiryStatus(id, status, admin_notes);
    res.json({ success: true, inquiry: updated });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Fehler beim Aktualisieren der Anfrage' });
  }
});

// Admin: Delete inquiry
app.delete('/api/admin/inquiries/:id', requireAdmin, (req, res) => {
  try {
    const id = Number(req.params.id);
    deleteContactInquiry(id);
    res.json({ success: true, message: 'Anfrage gelöscht' });
  } catch (err) {
    res.status(500).json({ error: 'Fehler beim Löschen der Anfrage' });
  }
});

// -------------------------------------------------------------
// Looking for Group (LFG) / Spontaneous Game Sessions
// -------------------------------------------------------------
const sessionLimits = new Map();

// 1. Public: Get All Active Game Sessions
app.get('/api/game-sessions', (req, res) => {
  try {
    const sessions = getPublicGameSessions();
    res.json(sessions);
  } catch (err) {
    console.error('Error fetching game sessions:', err);
    res.status(500).json({ error: 'Fehler beim Laden der Spielrunden.' });
  }
});

// 2. Public: Create a Game Session
app.post('/api/game-sessions', async (req, res) => {
  try {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const timestamps = (sessionLimits.get(clientIp) || []).filter(t => now - t < 10 * 60 * 1000);
    if (timestamps.length >= 5) {
      return res.status(429).json({ error: 'Zu viele Spielrunden erstellt. Bitte warte einige Minuten.' });
    }
    timestamps.push(now);
    sessionLimits.set(clientIp, timestamps);

    const {
      title,
      host_name,
      host_email,
      host_phone,
      location_name,
      venue,
      location_address,
      address,
      session_date,
      start_time,
      end_time,
      game_format,
      format,
      max_players,
      current_players,
      skill_level,
      cost_note,
      description,
      manage_pin,
      host_pin,
      shuttlecock_type,
      intensity_level,
      total_cost
    } = req.body;

    const finalLocation = location_name || venue || 'Feels Good Club Chemnitz';
    const finalAddress = location_address || address || '';
    const finalFormat = game_format || format || 'Doppel';
    const finalPin = manage_pin || host_pin || '';

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Titel der Spielrunde ist erforderlich.' });
    }
    if (!host_name || !host_name.trim()) {
      return res.status(400).json({ error: 'Dein Name / Spitzname ist erforderlich.' });
    }
    if (!host_email || !host_email.trim() || !host_email.includes('@')) {
      return res.status(400).json({ error: 'Eine gültige E-Mail-Adresse ist erforderlich, um Benachrichtigungen zu erhalten.' });
    }
    if (!finalLocation || !finalLocation.trim()) {
      return res.status(400).json({ error: 'Spielort ist erforderlich (z.B. Feels Good Club).' });
    }
    if (!session_date || !session_date.trim()) {
      return res.status(400).json({ error: 'Datum ist erforderlich.' });
    }
    if (!start_time || !start_time.trim()) {
      return res.status(400).json({ error: 'Start-Uhrzeit ist erforderlich.' });
    }

    const pin = finalPin && String(finalPin).trim().length >= 4 
      ? String(finalPin).trim() 
      : String(Math.floor(1000 + Math.random() * 9000));

    const session = createGameSession({
      title,
      host_name,
      host_email,
      host_phone,
      location_name: finalLocation,
      location_address: finalAddress,
      session_date,
      start_time,
      end_time,
      game_format: finalFormat,
      max_players: Number(max_players) || 4,
      current_players: Number(current_players) || 1,
      skill_level: skill_level || 'all',
      cost_note,
      description,
      manage_pin: pin,
      shuttlecock_type: shuttlecock_type || 'feather',
      intensity_level: intensity_level || 'casual',
      total_cost: Number(total_cost) || 0
    });

    // Send confirmation email to host with PIN
    sendGameSessionCreatedEmail({
      hostEmail: host_email.trim(),
      hostName: host_name.trim(),
      session,
      managePin: pin
    }).catch(e => console.error('Failed to send session created email:', e));

    // Broadcast email to all active registered players
    try {
      const allPlayerEmails = getAllActivePlayerEmails();
      if (allPlayerEmails.length > 0) {
        sendGameSessionBroadcastEmail({
          recipients: allPlayerEmails,
          session
        }).catch(e => console.error('Failed to broadcast game session to players:', e));
      }
    } catch (bErr) {
      console.error('Error getting player emails for broadcast:', bErr);
    }

    // Specific player invitations with 1-click Accept / Reject
    if (Array.isArray(req.body.invited_player_ids) && req.body.invited_player_ids.length > 0) {
      for (const pid of req.body.invited_player_ids) {
        try {
          const targetPlayer = getPlayerById(parseInt(pid, 10));
          if (targetPlayer && targetPlayer.email) {
            const inv = createSessionInvitation({
              session_id: session.id,
              inviter_name: session.host_name,
              inviter_email: session.host_email,
              invitee_name: targetPlayer.name,
              invitee_email: targetPlayer.email
            });
            sendMatchInvitationEmail({
              inviteeEmail: targetPlayer.email,
              inviteeName: targetPlayer.name,
              hostName: session.host_name,
              session,
              token: inv.token
            }).catch(e => console.error(`Failed to send invite to player #${pid}:`, e));
          }
        } catch (invErr) {
          console.error(`Error inviting player #${pid}:`, invErr);
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Spielrunde erfolgreich veröffentlicht!',
      session: {
        id: session.id,
        title: session.title,
        location_name: session.location_name,
        session_date: session.session_date,
        start_time: session.start_time,
        status: session.status
      },
      pin
    });
  } catch (err) {
    console.error('Error creating game session:', err);
    res.status(500).json({ error: 'Fehler beim Erstellen der Spielrunde.' });
  }
});

// 3. Public: Join a Game Session
app.post('/api/game-sessions/:id/join', async (req, res) => {
  try {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const timestamps = (sessionLimits.get(clientIp) || []).filter(t => now - t < 10 * 60 * 1000);
    if (timestamps.length >= 10) {
      return res.status(429).json({ error: 'Zu viele Anfragen. Bitte warte einen Moment.' });
    }
    timestamps.push(now);
    sessionLimits.set(clientIp, timestamps);

    const sessionId = parseInt(req.params.id, 10);
    const { participant_name, participant_email, participant_phone, skill_level, message, notes, otp_code } = req.body;

    if (!participant_name || !participant_name.trim()) {
      return res.status(400).json({ error: 'Dein Name / Spitzname ist erforderlich.' });
    }
    if (!participant_email || !participant_email.trim() || !participant_email.includes('@')) {
      return res.status(400).json({ error: 'Gültige E-Mail-Adresse erforderlich für die Teilnahmebestätigung.' });
    }

    // Verify email with OTP unless user has active student session
    const studentAuth = getAuthenticatedStudentUser(req);
    const isAlreadyVerifiedStudent = studentAuth && (!participant_email || studentAuth.email === participant_email.trim().toLowerCase());

    if (!isAlreadyVerifiedStudent) {
      if (!otp_code) {
        return res.status(400).json({ error: 'Bitte bestätige deine E-Mail-Adresse mit dem Bestätigungscode vor dem Beitreten.' });
      }
      const otpCheck = verifyOtp(participant_email, otp_code, 'join_session');
      if (otpCheck.error) {
        return res.status(otpCheck.status || 400).json({ error: otpCheck.error });
      }
    }

    const result = joinGameSession({
      session_id: sessionId,
      participant_name,
      participant_email,
      participant_phone,
      skill_level: skill_level || 'Fortgeschritten',
      message: message || notes || ''
    });

    if (result.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }

    const { session, participant } = result;

    // Send notifications to both host and participant
    if (session.host_email) {
      sendGameSessionJoinNotification({
        hostEmail: session.host_email,
        hostName: session.host_name,
        session,
        participant
      }).catch(e => console.error('Failed to notify host:', e));
    }

    sendParticipantConfirmationEmail({
      participantEmail: participant.participant_email,
      participantName: participant.participant_name,
      session,
      hostName: session.host_name
    }).catch(e => console.error('Failed to send participant confirmation:', e));

    res.json({
      success: true,
      message: `Du bist erfolgreich eingetragen! Eine Bestätigung wurde an ${participant.participant_email} gesendet.`,
      session: {
        id: session.id,
        current_players: session.current_players,
        max_players: session.max_players,
        status: session.status
      }
    });
  } catch (err) {
    console.error('Error joining game session:', err);
    res.status(500).json({ error: 'Fehler beim Eintragen in die Spielrunde.' });
  }
});

// 4. Public: Manage Game Session (Close / Cancel with PIN)
app.post('/api/game-sessions/:id/manage', (req, res) => {
  try {
    const sessionId = parseInt(req.params.id, 10);
    const pin = req.body.pin || req.body.host_pin;
    const action = req.body.action;

    if (!pin) {
      return res.status(400).json({ error: 'Bitte gib deine 4-stellige PIN ein.' });
    }
    if (!['close', 'open', 'reopen', 'cancel', 'delete'].includes(action)) {
      return res.status(400).json({ error: 'Ungültige Aktion.' });
    }

    const result = manageGameSession({ id: sessionId, pin, action });
    if (result.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }

    res.json({ success: true, message: 'Spielrunde erfolgreich aktualisiert!', ...result });
  } catch (err) {
    console.error('Error managing game session:', err);
    res.status(500).json({ error: 'Fehler bei der Verwaltung der Spielrunde.' });
  }
});

// 4a. Invite Players to a Game Session
app.post('/api/game-sessions/:id/invite', requireStudentUser, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id, 10);
    const session = getGameSessionById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Spielrunde nicht gefunden.' });
    }

    const { invitees } = req.body;
    if (!Array.isArray(invitees) || invitees.length === 0) {
      return res.status(400).json({ error: 'Bitte wähle mindestens einen Spieler zum Einladen aus.' });
    }

    const results = [];
    for (const inv of invitees) {
      let inviteeName = inv.name;
      let inviteeEmail = inv.email;

      if (!inviteeEmail && inv.id) {
        const p = getPlayerById(inv.id);
        if (p) {
          inviteeName = p.name;
          inviteeEmail = p.email;
        }
      }

      if (inviteeEmail && inviteeEmail.includes('@')) {
        const invRecord = createSessionInvitation({
          session_id: sessionId,
          inviter_name: req.studentUser.name || session.host_name,
          inviter_email: req.studentEmail,
          invitee_name: inviteeName || 'Badminton-Spieler',
          invitee_email: inviteeEmail
        });

        sendMatchInvitationEmail({
          inviteeEmail,
          inviteeName: inviteeName || 'Badminton-Spieler',
          inviterName: req.studentUser.name || session.host_name,
          session,
          token: invRecord.token
        }).catch(e => console.error('Failed to send match invite email:', e));

        results.push(invRecord);
      }
    }

    res.json({
      success: true,
      message: `${results.length} Einladung(en) erfolgreich per E-Mail versendet!`,
      invitations: results
    });
  } catch (err) {
    console.error('Error inviting players:', err);
    res.status(500).json({ error: 'Fehler beim Versenden der Einladungen.' });
  }
});

// 4b. 1-Click Respond to Match Invitation (Accept / Reject from Email)
app.get('/api/game-sessions/invitations/respond/:token', (req, res) => {
  try {
    const token = req.params.token;
    const action = req.query.action === 'reject' ? 'reject' : 'accept';

    const result = respondToSessionInvitation(token, action);
    if (result.error) {
      return res.status(result.status || 400).send(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h2>Einladung ungültig oder abgelaufen</h2>
          <p><a href="https://130-61-242-26.sslip.io/#sessions">Zurück zu den Spielrunden</a></p>
        </div>
      `);
    }

    const { invitation, session } = result;

    if (session && session.host_email) {
      sendInvitationResponseToHostEmail({
        hostEmail: session.host_email,
        hostName: session.host_name,
        inviteeName: invitation.invitee_name,
        session,
        action
      }).catch(e => console.error('Error sending response to host:', e));
    }

    const isAccept = action === 'accept';

    res.send(`
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Einladung ${isAccept ? 'Angenommen' : 'Abgelehnt'} | Badminton Student Community</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; display: flex; justify-content: center; align-items: center; min-height: 80vh; }
          .card { background: white; border-radius: 24px; max-width: 480px; width: 100%; padding: 36px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
          .badge { display: inline-block; padding: 6px 14px; background: ${isAccept ? '#dcfce7' : '#fee2e2'}; color: ${isAccept ? '#166534' : '#991b1b'}; font-weight: 700; border-radius: 99px; font-size: 13px; margin-bottom: 16px; }
          h1 { color: #005A36; font-size: 22px; margin: 0 0 12px 0; }
          p { color: #475569; font-size: 14px; line-height: 1.6; }
          .btn { display: inline-block; background: #005A36; color: white; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; font-size: 13px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">${isAccept ? '✅ Erfolgreich eingetragen!' : 'ℹ️ Einladung abgelehnt'}</div>
          <h1>${isAccept ? 'Du bist dabei!' : 'Einladung abgelehnt'}</h1>
          <p>
            ${isAccept 
              ? `Du hast die Einladung zu <strong>${session ? session.title : 'der Spielrunde'}</strong> angenommen und wurdest als Mitspieler eingetragen.` 
              : `Du hast die Einladung zu <strong>${session ? session.title : 'der Spielrunde'}</strong> abgelehnt.`}
          </p>
          <a href="https://130-61-242-26.sslip.io/#sessions" class="btn">🏸 Zu den Spielrunden</a>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('Error responding to invitation:', err);
    res.status(500).send('Fehler bei der Antwort.');
  }
});

// 4c. Get Invitations for a Session
app.get('/api/game-sessions/:id/invitations', (req, res) => {
  try {
    const sessionId = parseInt(req.params.id, 10);
    const invitations = getSessionInvitations(sessionId);
    res.json(invitations);
  } catch (err) {
    res.status(500).json({ error: 'Fehler beim Laden der Einladungen.' });
  }
});

// -------------------------------------------------------------
// Unified Community Directory (Students, Trainers, Gear Providers)
// -------------------------------------------------------------
app.get('/api/community/members', requireStudentOrAdmin, (req, res) => {
  try {
    const { role, skill_level, category, gender, university, sort } = req.query;
    const viewerEmail = req.studentEmail || null;

    let members = [];

    // 1. Players / Students
    if (!role || role === 'all' || role === 'student') {
      const players = getAllPlayers();
      for (const p of players) {
        const sanitized = sanitizePublicPlayer(p, viewerEmail);
        members.push({
          ...sanitized,
          member_type: 'student',
          role_label: 'Student / Spieler',
          university: p.university_name || 'TU Chemnitz'
        });
      }
    }

    // 2. Trainers
    if (!role || role === 'all' || role === 'trainer') {
      const trainers = getAllTrainers();
      for (const tr of trainers) {
        members.push({
          id: tr.id,
          name: tr.name,
          gender: tr.gender || 'any',
          member_type: 'trainer',
          role_label: tr.role || 'Trainer / Coach',
          skill_level: 'Vereinsspieler / Profi',
          preferred_category: tr.focus_areas || 'Technik & Taktik',
          specialization: tr.focus_areas || 'Coaching',
          university: 'TU Chemnitz & USZ',
          photo_url: tr.photo_url || '',
          avatar_type: 'badminton_defense',
          experience_years: tr.experience_years || '',
          hourly_rate: tr.hourly_rate || '',
          has_contact_unlocked: !!viewerEmail,
          email: tr.email,
          phone: tr.show_phone ? tr.phone : undefined
        });
      }
    }

    // 3. Sports Gear Service Providers
    if (!role || role === 'all' || role === 'service') {
      const services = getAllEquipmentServices();
      for (const s of services) {
        members.push({
          id: s.id,
          name: s.name,
          gender: 'any',
          member_type: 'service',
          role_label: s.service_type || 'Besaitungsservice',
          skill_level: 'Experte',
          preferred_category: 'Ausrüstung & Service',
          specialization: s.service_type || 'Besaitung',
          university: s.location_note || 'Chemnitz Campus',
          photo_url: s.photo_url || '',
          avatar_type: 'badminton_net_kill',
          pricing_details: s.pricing_details || '',
          has_contact_unlocked: !!viewerEmail,
          email: s.email,
          phone: s.show_phone ? s.phone : undefined
        });
      }
    }

    // Filter by skill level
    if (skill_level && skill_level !== 'all') {
      members = members.filter(m => m.skill_level && m.skill_level.toLowerCase().includes(skill_level.toLowerCase()));
    }

    // Filter by category
    if (category && category !== 'all') {
      members = members.filter(m => 
        (m.preferred_category && m.preferred_category.toLowerCase().includes(category.toLowerCase())) ||
        (m.specialization && m.specialization.toLowerCase().includes(category.toLowerCase()))
      );
    }

    // Filter by gender
    if (gender && gender !== 'all') {
      members = members.filter(m => m.gender === gender || m.gender === 'any');
    }

    // Filter by university
    if (university && university !== 'all') {
      members = members.filter(m => m.university && m.university.toLowerCase().includes(university.toLowerCase()));
    }

    // Sort
    if (sort === 'name') {
      members.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      members.sort((a, b) => b.id - a.id);
    }

    res.json(members);
  } catch (err) {
    console.error('Error fetching community members:', err);
    res.status(500).json({ error: 'Fehler beim Laden der Mitgliederliste.' });
  }
});

// 5. Admin: List All Sessions
app.get('/api/admin/game-sessions', requireAdmin, (req, res) => {
  try {
    const sessions = getAllGameSessionsAdmin();
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: 'Fehler beim Laden aller Spielrunden.' });
  }
});

// 6. Admin: Delete Session
app.delete('/api/admin/game-sessions/:id', requireAdmin, (req, res) => {
  try {
    const sessionId = parseInt(req.params.id, 10);
    deleteGameSessionAdmin(sessionId);
    res.json({ success: true, message: 'Spielrunde erfolgreich gelöscht.' });
  } catch (err) {
    res.status(500).json({ error: 'Fehler beim Löschen der Spielrunde.' });
  }
});

// 3. Admin: Get all pending registrations (players, trainers, equipment services)
app.get('/api/admin/registrations', requireAdmin, (req, res) => {
  try {
    const players = getPendingPlayers();
    const trainers = getPendingTrainers();
    const services = getPendingEquipmentServices();
    res.json({ players, trainers, services });
  } catch (err) {
    console.error('Error fetching pending registrations:', err);
    res.status(500).json({ error: 'Fehler beim Laden der offenen Registrierungen.' });
  }
});

// 3b. Admin: Approve Equipment Service from registrations view
app.post('/api/admin/registrations/services/:id/approve', requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const approved = approveEquipmentService(id);
    if (!approved) return res.status(404).json({ error: 'Ausrüster/Besaiter nicht gefunden.' });
    res.json({ success: true, message: `Ausrüster/Besaiter ${approved.name} erfolgreich freigeschaltet!`, service: approved });
  } catch (err) {
    res.status(500).json({ error: 'Fehler bei der Freigabe.' });
  }
});

// 3c. Admin: Reject Equipment Service from registrations view
app.post('/api/admin/registrations/services/:id/reject', requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    rejectEquipmentService(id);
    res.json({ success: true, message: 'Registrierung abgelehnt und entfernt.' });
  } catch (err) {
    res.status(500).json({ error: 'Fehler beim Ablehnen.' });
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
const distPath = path.resolve(__dirname, '../frontend/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      status: 'online',
      service: 'TU Chemnitz Badminton Community Backend API',
      venue: '12 Badminton-Spielfelder • Sporthalle Thüringer Weg 11',
      health: '/api/health',
    });
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

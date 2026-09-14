import crypto from 'crypto';

/**
 * In-Memory OTP Store & Student Session Manager
 * Lightweight, zero-cost, runs purely on Node.js runtime
 */

// Key: `${scope}:${email.toLowerCase()}`
// Value: { code: string, expiresAt: number, attempts: number, requestTimestamps: number[] }
const otpStore = new Map();

// Key: token (string)
// Value: { email: string, createdAt: number, lastActivity: number }
const studentSessions = new Map();

const OTP_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 3;
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes idle timeout

/**
 * Validate academic / university email
 */
export function isUniversityEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim().toLowerCase();
  
  // Specific TU Chemnitz & Saxon university domains
  if (
    clean.endsWith('@tu-chemnitz.de') ||
    clean.includes('.tu-chemnitz.de') ||
    clean.endsWith('@mytuc.org') ||
    clean.endsWith('@hrz.tu-chemnitz.de') ||
    clean.endsWith('@hs-mittweida.de') ||
    clean.endsWith('@tu-dresden.de') ||
    clean.endsWith('@uni-leipzig.de') ||
    clean.endsWith('@tu-freiberg.de') ||
    clean.endsWith('@fh-zwickau.de')
  ) {
    return true;
  }

  // Broad academic / university patterns: .edu, .ac.*, .uni-*.de, .tu-*.de, .fh-*.de, .hs-*.de
  const domainPart = clean.split('@')[1] || '';
  if (
    domainPart.endsWith('.edu') ||
    domainPart.includes('.ac.') ||
    domainPart.startsWith('uni-') ||
    domainPart.startsWith('tu-') ||
    domainPart.startsWith('fh-') ||
    domainPart.startsWith('hs-') ||
    domainPart.includes('.uni-') ||
    domainPart.includes('.hochschule-')
  ) {
    return true;
  }

  return false;
}

/**
 * Generate a secure 6-digit numerical OTP
 */
export function createOtp(email, scope = 'student_gate') {
  const cleanEmail = email.trim().toLowerCase();
  const key = `${scope}:${cleanEmail}`;
  const now = Date.now();

  // Rate limiting check
  const existing = otpStore.get(key);
  let timestamps = existing?.requestTimestamps || [];
  timestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const waitMinutes = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - timestamps[0])) / 60000);
    return {
      error: `Zu viele Anfragen. Bitte warte ${waitMinutes} Minute(n) vor dem nächsten Code.`,
      status: 429
    };
  }

  timestamps.push(now);

  // Generate 6-digit numeric code
  const code = Math.floor(100000 + crypto.randomInt(900000)).toString();

  otpStore.set(key, {
    code,
    expiresAt: now + OTP_TTL_MS,
    attempts: 0,
    requestTimestamps: timestamps
  });

  return { success: true, code, expiresMinutes: Math.round(OTP_TTL_MS / 60000) };
}

/**
 * Verify a 6-digit OTP code
 */
export function verifyOtp(email, code, scope = 'student_gate') {
  const cleanEmail = email.trim().toLowerCase();
  const key = `${scope}:${cleanEmail}`;
  const now = Date.now();

  const record = otpStore.get(key);
  if (!record) {
    return { error: 'Kein Bestätigungscode gefunden. Bitte fordere einen neuen Code an.', status: 400 };
  }

  if (now > record.expiresAt) {
    otpStore.delete(key);
    return { error: 'Der Bestätigungscode ist abgelaufen. Bitte fordere einen neuen an.', status: 400 };
  }

  record.attempts += 1;
  if (record.attempts > MAX_ATTEMPTS) {
    otpStore.delete(key);
    return { error: 'Zu viele Fehlversuche. Bitte fordere einen neuen Code an.', status: 429 };
  }

  if (record.code !== String(code).trim()) {
    return { error: 'Ungültiger Bestätigungscode. Bitte überprüfe die 6 Ziffern.', status: 400 };
  }

  // Code verified! Remove it so it cannot be reused
  otpStore.delete(key);

  // If this was for the student directory gate, generate a 30-minute student session token
  if (scope === 'student_gate') {
    const sessionToken = `tuc-student-${crypto.randomBytes(24).toString('hex')}`;
    studentSessions.set(sessionToken, {
      email: cleanEmail,
      createdAt: now,
      lastActivity: now
    });
    return { success: true, verified: true, sessionToken };
  }

  return { success: true, verified: true };
}

/**
 * Validate active student session with 30-minute idle expiration
 */
export function verifyStudentSession(token) {
  if (!token || typeof token !== 'string') return null;

  const session = studentSessions.get(token);
  if (!session) return null;

  const now = Date.now();
  // Check 30 minutes inactivity timeout
  if (now - session.lastActivity > INACTIVITY_TIMEOUT_MS) {
    studentSessions.delete(token);
    return null;
  }

  // Refresh activity timestamp
  session.lastActivity = now;
  return session;
}

/**
 * Invalidate a student session (e.g. on logout or auto-lock)
 */
export function invalidateStudentSession(token) {
  if (token) studentSessions.delete(token);
}

// Periodic cleanup of expired entries (runs every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of otpStore.entries()) {
    if (now > val.expiresAt) otpStore.delete(key);
  }
  for (const [token, session] of studentSessions.entries()) {
    if (now - session.lastActivity > INACTIVITY_TIMEOUT_MS) studentSessions.delete(token);
  }
}, 10 * 60 * 1000);

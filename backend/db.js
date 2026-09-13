import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data folder and uploads folder exist in backend directory
const dataDir = process.env.DATA_DIR || path.resolve(__dirname, 'data');
const uploadsDir = process.env.UPLOADS_DIR || path.resolve(__dirname, 'uploads');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Database file: badminton_community.db
const dbPath = path.join(dataDir, 'badminton_community.db');

// Crash-proof SQLite Driver Loader:
// 1. Tries Node.js built-in node:sqlite (zero native dependencies, 100% immune to SIGSEGV status 139 on Render/Linux)
// 2. Falls back to better-sqlite3
let db;
try {
  const { DatabaseSync } = await import('node:sqlite');
  db = new DatabaseSync(dbPath);
  try {
    db.exec('PRAGMA journal_mode = WAL;');
  } catch (e) {}
  if (!db.pragma) {
    db.pragma = (str) => {
      try {
        db.exec(`PRAGMA ${str};`);
      } catch (e) {}
    };
  }
  console.log('[DB] Connected via built-in node:sqlite (crash-proof)');
} catch (nodeSqliteErr) {
  try {
    const { default: BetterDatabase } = await import('better-sqlite3');
    db = new BetterDatabase(dbPath);
    try {
      db.pragma('journal_mode = WAL');
    } catch (e) {}
    console.log('[DB] Connected via better-sqlite3');
  } catch (betterSqliteErr) {
    console.error('[DB FATAL] Failed to initialize SQLite engine:', nodeSqliteErr, betterSqliteErr);
    throw betterSqliteErr;
  }
}

export function initDatabase() {
  // 0. Admin Settings Table (Salted Scrypt Password Hash)
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      admin_email TEXT DEFAULT 'gandupradeep2026@gmail.com',
      youtube_channel_url TEXT DEFAULT 'https://www.youtube.com/@TUCBadminton',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  try {
    db.exec(`ALTER TABLE admin_settings ADD COLUMN admin_email TEXT DEFAULT 'gandupradeep2026@gmail.com'`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE admin_settings ADD COLUMN youtube_channel_url TEXT DEFAULT 'https://www.youtube.com/@TUCBadminton'`);
  } catch (e) {}

  // 0a. Password Resets Table (Hardened with 6-Digit Approval Code / OTP)
  db.exec(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      approval_code TEXT,
      expires_at DATETIME NOT NULL,
      used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  try {
    db.exec(`ALTER TABLE password_resets ADD COLUMN approval_code TEXT`);
  } catch (e) {}

  // 0b. YouTube Videos Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS youtube_videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      youtube_url TEXT NOT NULL,
      video_id TEXT NOT NULL,
      category TEXT DEFAULT 'Highlights',
      description TEXT,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 0c. Dynamic Training Schedules Table (Badminton Timings)
  db.exec(`
    CREATE TABLE IF NOT EXISTS training_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_title TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      group_name TEXT NOT NULL,
      hall_name TEXT NOT NULL DEFAULT 'Sporthalle Thüringer Weg 11',
      courts_info TEXT NOT NULL DEFAULT '12 Spielfelder',
      notes TEXT,
      display_order INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 0d. Site Announcements Table (Live banner for Homepage)
  db.exec(`
    CREATE TABLE IF NOT EXISTS site_announcements (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info', -- 'info' | 'warning' | 'success'
      is_active INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default admin password if empty (default: tuc-badminton-admin)
  const existingAdmin = db.prepare('SELECT id FROM admin_settings WHERE id = 1').get();
  if (!existingAdmin) {
    const defaultSalt = crypto.randomBytes(16).toString('hex');
    const defaultHash = crypto.scryptSync('tuc-badminton-admin', defaultSalt, 64).toString('hex');
    db.prepare(`
      INSERT INTO admin_settings (id, password_hash, password_salt)
      VALUES (1, ?, ?)
    `).run(defaultHash, defaultSalt);
    console.log('[DB] Seeded initial hashed master admin credentials.');
  }

  // Seed default announcement if empty
  const existingAnnounce = db.prepare('SELECT id FROM site_announcements WHERE id = 1').get();
  if (!existingAnnounce) {
    db.prepare(`
      INSERT INTO site_announcements (id, title, message, type, is_active)
      VALUES (1, 'Aktuelle Hinweise zum Spielbetrieb', 'Willkommen zur Sommerrunde 2026. Bitte denkt an saubere Hallenschuhe mit abriebfester Sohle!', 'info', 1)
    `).run();
  }
  // 1. Trainers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS trainers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      email TEXT NOT NULL,
      focus_areas TEXT NOT NULL,
      photo_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Tournaments table (Ausschreibung Board)
  db.exec(`
    CREATE TABLE IF NOT EXISTS tournaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      deadline TEXT NOT NULL,
      location TEXT NOT NULL,
      document_url TEXT NOT NULL,
      file_type TEXT DEFAULT 'pdf',
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Media table (Photos & Videos)
  db.exec(`
    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'photo', -- 'photo' | 'video'
      file_url TEXT NOT NULL,
      thumbnail_url TEXT,
      caption TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. Registrations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      affiliation TEXT DEFAULT 'TUC Student',
      session_type TEXT DEFAULT 'trial',
      skill_level TEXT DEFAULT 'intermediate',
      preferred_day TEXT DEFAULT 'Wednesday',
      racket_needed INTEGER DEFAULT 0,
      message TEXT,
      status TEXT DEFAULT 'confirmed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 5. Players table (Men and Women squads)
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      gender TEXT NOT NULL, -- 'men' | 'women'
      study_program TEXT NOT NULL,
      specialization TEXT NOT NULL,
      team TEXT DEFAULT '1. Mannschaft (Sachsenliga)',
      email TEXT NOT NULL,
      photo_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 6. Tournament Results & Gallery table (with player submissions & admin approval)
  db.exec(`
    CREATE TABLE IF NOT EXISTS tournament_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_name TEXT NOT NULL,
      result TEXT NOT NULL,
      date TEXT NOT NULL,
      player_name TEXT NOT NULL,
      photo_url TEXT NOT NULL,
      caption TEXT,
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
      submitted_by TEXT DEFAULT 'Player',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Schema upgrades for players (phone, favorite_player, skill_level, university_type, university_name, status, show_phone)
  try { db.exec("ALTER TABLE players ADD COLUMN phone TEXT;"); } catch (e) {}
  try { db.exec("ALTER TABLE players ADD COLUMN favorite_player TEXT;"); } catch (e) {}
  try { db.exec("ALTER TABLE players ADD COLUMN skill_level TEXT DEFAULT 'Fortgeschritten';"); } catch (e) {}
  try { db.exec("ALTER TABLE players ADD COLUMN university_type TEXT DEFAULT 'tu_chemnitz';"); } catch (e) {}
  try { db.exec("ALTER TABLE players ADD COLUMN university_name TEXT DEFAULT 'TU Chemnitz';"); } catch (e) {}
  try { db.exec("ALTER TABLE players ADD COLUMN status TEXT DEFAULT 'approved';"); } catch (e) {}
  try { db.exec("ALTER TABLE players ADD COLUMN show_phone INTEGER DEFAULT 0;"); } catch (e) {}

  // Schema upgrades for trainers (phone, hochschulsport_approved, hochschulsport_note, status, show_phone)
  try { db.exec("ALTER TABLE trainers ADD COLUMN phone TEXT;"); } catch (e) {}
  try { db.exec("ALTER TABLE trainers ADD COLUMN hochschulsport_approved INTEGER DEFAULT 1;"); } catch (e) {}
  try { db.exec("ALTER TABLE trainers ADD COLUMN hochschulsport_note TEXT;"); } catch (e) {}
  try { db.exec("ALTER TABLE trainers ADD COLUMN status TEXT DEFAULT 'approved';"); } catch (e) {}
  try { db.exec("ALTER TABLE trainers ADD COLUMN show_phone INTEGER DEFAULT 0;"); } catch (e) {}

  // Create a minimal valid sample PDF for the seeded tournament announcement
  const samplePdfPath = path.join(uploadsDir, 'ausschreibung_shm_2026.pdf');
  if (!fs.existsSync(samplePdfPath)) {
    const samplePdfContent = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 264 >> stream
BT
/F1 22 Tf
50 720 Td
(TU Chemnitz Hochschulsport - Offizielle Ausschreibung) Tj
/F1 14 Tf
0 -40 Td
(32. Saechsische Hochschulmeisterschaft Badminton 2026) Tj
0 -25 Td
(Datum: Samstag, 14. November 2026 | Sporthalle Thueringer Weg 11) Tj
0 -25 Td
(Disziplinen: Herreneinzel, Dameneinzel, Doppel, Mixed) Tj
0 -25 Td
(Meldeschluss: 31. Oktober 2026 | Startberechtigt: Studierende & Beschaeftigte) Tj
ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000242 00000 n 
0000000558 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
627
%%EOF`;
    fs.writeFileSync(samplePdfPath, samplePdfContent);
    console.log('[DB] Created sample Ausschreibung PDF at uploads/ausschreibung_shm_2026.pdf');
  }

  // Seed Trainers if empty
  const trainerCount = db.prepare('SELECT COUNT(*) as count FROM trainers').get().count;
  if (trainerCount === 0) {
    console.log('[DB] Seeding authentic university coaches & captains...');
    const insertTrainer = db.prepare(`
      INSERT INTO trainers (name, role, email, focus_areas, photo_url)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertTrainer.run(
      'Michael Krause',
      'Head Coach & Abteilungsleiter (USZ Organisation)',
      'michael.krause@tu-chemnitz.de',
      'Doppel-Taktik, Trainingsorganisation, Wettkampfführung, Zuspielserien',
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80'
    );

    insertTrainer.run(
      'Pradeep Gandu',
      'Kapitän TUC Challengers & Turnier-Koordinator (MVP 2026)',
      'pradeep.gandu@tu-chemnitz.de',
      'Einzel-Strategie, Mixed-Abstimmung, Match-Analyse, Turnierleitung',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
    );

    insertTrainer.run(
      'Phan van Trung',
      'Kapitän TUC Shuttlers (Turniersieger 2026 - ungeschlagen)',
      'phan.van-trung@tu-chemnitz.de',
      'Schlagpräzision, Schnelligkeit & Beinarbeit, Smash-Abwehr, Multi-Shuttle',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80'
    );

    insertTrainer.run(
      'Kevin Fuchs',
      'Kapitän TUC Predators & Nachwuchs-Koordinator',
      'kevin.fuchs@tu-chemnitz.de',
      'Grundlagenausbildung, Service & Return, Hochschulsport Einsteiger, Taktik',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80'
    );
  }

  // Seed Tournaments if empty
  const tourneyCount = db.prepare('SELECT COUNT(*) as count FROM tournaments').get().count;
  if (tourneyCount === 0) {
    console.log('[DB] Seeding sample tournament announcement...');
    const insertTourney = db.prepare(`
      INSERT INTO tournaments (title, date, deadline, location, description, document_url, file_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertTourney.run(
      'UNI Badminton Team Cup 2026 (TU Chemnitz, WHZ & HSMW)',
      '31. Januar 2026',
      'Abgeschlossen',
      'Sporthalle Thüringer Weg 11, TU Chemnitz',
      'Offizieller Hochschul-Team Cup des USZ TU Chemnitz. 7 Teams, 45 Spieler*innen aus 10 Nationen, 13 Teamduelle und 65 Matches. Turniersieger: TUC Shuttlers (Gold), 2. Platz: TUC Titans (Silber), 3. Platz: TUC Challengers (Bronze).',
      '/uploads/tournament_2026/Uni_Badminton_Team_Cup_2026_Ergebnisbericht.pdf',
      'pdf'
    );

    insertTourney.run(
      'Sächsische Hochschulmeisterschaft (SHM) Badminton – Team Cup 2026',
      '09. Mai 2026',
      '25. April 2026',
      'Sportwissenschaftliche Fakultät / USZ Sporthalle',
      'Landesweite sächsische Meisterschaft der Landeskonferenz Hochschulsport Sachsen e.V. (LHS). Disziplinen: Herreneinzel, Dameneinzel, Doppel und Hochschul-Teamwertung.',
      '/uploads/tournament_2026/UNI_Badminton_Rules_EN_DE.pdf',
      'pdf'
    );

    insertTourney.run(
      'Chemnitzer Badminton Stadtmeisterschaften 2026',
      '17. Oktober 2026',
      '05. Oktober 2026',
      'Sporthalle Thüringer Weg 11, Chemnitz',
      'Regionale Meisterschaften aller Vereine und Hochschulgruppen des Regionalverbandes Chemnitz. Offen für O19 Aktive und Hobbyspieler.',
      '/uploads/tournament_2026/UNI_Badminton_Team_Cup_2026_Schedule_Printable.pdf',
      'pdf'
    );
  }

  // Seed Media if empty
  const mediaCount = db.prepare('SELECT COUNT(*) as count FROM media').get().count;
  if (mediaCount === 0) {
    console.log('[DB] Seeding sample media gallery...');
    const insertMedia = db.prepare(`
      INSERT INTO media (title, type, file_url, thumbnail_url, caption)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertMedia.run(
      'Doubles Finals Rallies - Sporthalle Thüringer Weg',
      'photo',
      '/uploads/tournament_2026/teamcup_2026_winners_gold.jpeg',
      '/uploads/tournament_2026/teamcup_2026_winners_gold.jpeg',
      'High-tempo doubles rally during the autumn university ranking tournament.'
    );

    insertMedia.run(
      'Saxony Championship Podium Celebration',
      'photo',
      '/uploads/tournament_2026/teamcup_2026_challengers_bronze.jpeg',
      '/uploads/tournament_2026/teamcup_2026_challengers_bronze.jpeg',
      'TU Chemnitz badminton squad taking silver and bronze medals at the Saxon Cup.'
    );
  }

  // Seed Players if empty
  const playerCount = db.prepare('SELECT COUNT(*) as count FROM players').get().count;
  if (playerCount === 0) {
    console.log('[DB] Seeding authentic men and women university tournament players...');
    const insertPlayer = db.prepare(`
      INSERT INTO players (name, gender, study_program, specialization, team, email, photo_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const realPlayers = [
      // Men - TUC Challengers
      {
        name: 'Pradeep Gandu',
        gender: 'men',
        study_program: 'M.Sc. Automotive Software Engineering',
        specialization: "Men's Singles (HE), Men's Doubles (HD), Mixed (MX)",
        team: 'TUC Challengers (3. Platz / MVP Cup)',
        email: 'pradeep.gandu@s2023.tu-chemnitz.de',
        photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80'
      },
      {
        name: 'Sheng Dong',
        gender: 'men',
        study_program: 'M.Sc. Computational Science',
        specialization: "Men's Singles (HE), Men's Doubles (HD)",
        team: 'TUC Challengers (3. Platz)',
        email: 'sheng.dong@s2023.tu-chemnitz.de',
        photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
      },
      {
        name: 'Cheyu Lin',
        gender: 'men',
        study_program: 'B.Sc. Informatik',
        specialization: "Men's Doubles (HD), Mixed Doubles (MX)",
        team: 'TUC Challengers (3. Platz)',
        email: 'cheyu.lin@s2024.tu-chemnitz.de',
        photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
      },
      {
        name: 'Nithin Valiyaveedu',
        gender: 'men',
        study_program: 'M.Sc. Micro and Nano Systems',
        specialization: "Men's Doubles (HD)",
        team: 'TUC Challengers (3. Platz)',
        email: 'nithin.valiyaveedu@s2023.tu-chemnitz.de',
        photo_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80'
      },
      {
        name: 'Rakib Rony',
        gender: 'men',
        study_program: 'B.Sc. Maschinenbau',
        specialization: "Men's Doubles (HD)",
        team: 'TUC Challengers (3. Platz)',
        email: 'rakib.rony@s2024.tu-chemnitz.de',
        photo_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80'
      },

      // Men - TUC Shuttlers (Champions)
      {
        name: 'Phan van Trung',
        gender: 'men',
        study_program: 'M.Sc. Sports Engineering',
        specialization: "Men's Singles (HE), Men's Doubles (HD), Mixed (MX)",
        team: 'TUC Shuttlers (1. Platz / Champions)',
        email: 'phan.van-trung@s2022.tu-chemnitz.de',
        photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80'
      },
      {
        name: 'Sangeeth Udayan',
        gender: 'men',
        study_program: 'M.Sc. Embedded Systems',
        specialization: "Men's Doubles (HD)",
        team: 'TUC Shuttlers (1. Platz / Champions)',
        email: 'sangeeth.udayan@s2023.tu-chemnitz.de',
        photo_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80'
      },
      {
        name: 'Joseph Huang',
        gender: 'men',
        study_program: 'B.Sc. Wirtschaftsingenieurwesen',
        specialization: "Men's Singles (HE), Mixed (MX)",
        team: 'TUC Shuttlers (1. Platz / Champions)',
        email: 'joseph.huang@s2024.tu-chemnitz.de',
        photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80'
      },
      {
        name: 'Nishit Sanghvi',
        gender: 'men',
        study_program: 'M.Sc. Data Science',
        specialization: "Men's Doubles (HD)",
        team: 'TUC Shuttlers (1. Platz / Champions)',
        email: 'nishit.sanghvi@s2023.tu-chemnitz.de',
        photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
      },
      {
        name: 'Salekin',
        gender: 'men',
        study_program: 'B.Sc. Elektrotechnik',
        specialization: "Men's Doubles (HD)",
        team: 'TUC Shuttlers (1. Platz / Champions)',
        email: 'salekin@s2024.tu-chemnitz.de',
        photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
      },

      // Men - TUC Titans (2. Platz)
      {
        name: 'Michael Krause',
        gender: 'men',
        study_program: 'Wissenschaftlicher Mitarbeiter / Coach',
        specialization: "Men's Doubles (HD)",
        team: 'TUC Titans (2. Platz / Silber)',
        email: 'michael.krause@mb.tu-chemnitz.de',
        photo_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80'
      },
      {
        name: 'Neeraj Kulkarni',
        gender: 'men',
        study_program: 'M.Sc. Automotive Software Engineering',
        specialization: "Men's Singles (HE), Men's Doubles (HD), Mixed (MX)",
        team: 'TUC Titans (2. Platz / Silber)',
        email: 'neeraj.kulkarni@s2023.tu-chemnitz.de',
        photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
      },
      {
        name: 'Aditya Vikram',
        gender: 'men',
        study_program: 'M.Sc. Advanced Manufacturing',
        specialization: "Men's Doubles (HD), Mixed (MX)",
        team: 'TUC Titans (2. Platz / Silber)',
        email: 'aditya.vikram@s2023.tu-chemnitz.de',
        photo_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80'
      },
      {
        name: 'Sohan Rahman',
        gender: 'men',
        study_program: 'B.Sc. Informatik',
        specialization: "Men's Doubles (HD)",
        team: 'TUC Titans (2. Platz / Silber)',
        email: 'sohan.rahman@s2024.tu-chemnitz.de',
        photo_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80'
      },
      {
        name: 'Saswat Pradhan',
        gender: 'men',
        study_program: 'M.Sc. Renewable Energy Systems',
        specialization: "Men's Doubles (HD)",
        team: 'TUC Titans (2. Platz / Silber)',
        email: 'saswat.pradhan@s2023.tu-chemnitz.de',
        photo_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80'
      },

      // Men - TUC Predators
      {
        name: 'Kevin Fuchs',
        gender: 'men',
        study_program: 'M.Sc. Sports Engineering',
        specialization: "Men's Singles (HE), Men's Doubles (HD)",
        team: 'TUC Predators',
        email: 'kevin.fuchs@s2022.tu-chemnitz.de',
        photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
      },
      {
        name: 'Phu Loc Pham',
        gender: 'men',
        study_program: 'B.Sc. Informatik',
        specialization: "Men's Singles (HE), Men's Doubles (HD), Mixed (MX)",
        team: 'TUC Predators (100% Winrate)',
        email: 'phu-loc.pham@s2023.tu-chemnitz.de',
        photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
      },
      {
        name: 'Md Motasim Billah Taihan',
        gender: 'men',
        study_program: 'M.Sc. Computational Science',
        specialization: "Men's Doubles (HD)",
        team: 'TUC Predators',
        email: 'motasim.billah@s2023.tu-chemnitz.de',
        photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
      },
      {
        name: 'Andre Apitzsch',
        gender: 'men',
        study_program: 'B.Sc. Maschinenbau',
        specialization: "Men's Doubles (HD), Mixed (MX)",
        team: 'TUC Predators',
        email: 'andre.apitzsch@s2024.tu-chemnitz.de',
        photo_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80'
      },
      {
        name: 'Rishit',
        gender: 'men',
        study_program: 'M.Sc. Micro and Nano Systems',
        specialization: "Men's Doubles (HD)",
        team: 'TUC Predators',
        email: 'rishit@s2023.tu-chemnitz.de',
        photo_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80'
      },

      // Women's Squad
      {
        name: 'Tamara Winzler',
        gender: 'women',
        study_program: 'B.Sc. Psychologie',
        specialization: "Women's Singles (DE), Mixed Doubles (MX)",
        team: 'TUC Challengers (Beste Dame 80% Win)',
        email: 'tamara.winzler@s2023.tu-chemnitz.de',
        photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
      },
      {
        name: 'Jeanette Krause',
        gender: 'women',
        study_program: 'M.Sc. Wirtschaftswissenschaften',
        specialization: "Women's Singles (DE), Mixed Doubles (MX)",
        team: 'TUC Shuttlers (Champions 87.5% Win)',
        email: 'jeanette.krause@wiwi.tu-chemnitz.de',
        photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80'
      },
      {
        name: 'Havishma Madabhushi',
        gender: 'women',
        study_program: 'M.Sc. Automotive Software Engineering',
        specialization: "Women's Singles (DE), Mixed Doubles (MX)",
        team: 'TUC Titans (2. Platz / Finalistin)',
        email: 'havishma.madabhushi@s2023.tu-chemnitz.de',
        photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80'
      },
      {
        name: 'Ayushi Thakur',
        gender: 'women',
        study_program: 'M.Sc. Micro and Nano Systems',
        specialization: 'Mixed Doubles (MX)',
        team: 'TUC Titans (2. Platz / Silber)',
        email: 'ayushi.thakur@s2023.tu-chemnitz.de',
        photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80'
      },
      {
        name: 'Annalena Wieland',
        gender: 'women',
        study_program: 'B.A. Pädagogik',
        specialization: 'Mixed Doubles (MX)',
        team: 'TUC Predators',
        email: 'annalena.wieland@s2024.tu-chemnitz.de',
        photo_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80'
      },
      {
        name: 'Jiyeon Yeo',
        gender: 'women',
        study_program: 'M.Sc. Sensorik und Kognitive Psychologie',
        specialization: "Women's Singles (DE)",
        team: 'TUC Predators',
        email: 'jiyeon.yeo@s2023.tu-chemnitz.de',
        photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80'
      },
      {
        name: 'Kalani Siriwardhana',
        gender: 'women',
        study_program: 'B.Sc. Informatik',
        specialization: "Women's Singles (DE), Mixed Doubles (MX)",
        team: 'TUC Titans',
        email: 'kalani.siriwardhana@s2024.tu-chemnitz.de',
        photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80'
      }
    ];

    for (const p of realPlayers) {
      insertPlayer.run(p.name, p.gender, p.study_program, p.specialization, p.team, p.email, p.photo_url);
    }
  }

  // Seed Tournament Results & Gallery if empty
  const resultsCount = db.prepare('SELECT COUNT(*) as count FROM tournament_results').get().count;
  if (resultsCount === 0) {
    console.log('[DB] Seeding authentic university tournament results with photos...');
    const insertResult = db.prepare(`
      INSERT INTO tournament_results (tournament_name, result, date, player_name, photo_url, caption, status, submitted_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertResult.run(
      'UNI Badminton Team Cup 2026',
      '🥇 1. Platz & Turniersieger (Gold)',
      '31.01.2026',
      'TUC Shuttlers (Phan van Trung, Jeanette Krause, Sangeeth Udayan, Joseph Huang, Nishit Sanghvi, Salekin)',
      '/uploads/tournament_2026/teamcup_2026_winners_gold.jpeg',
      'Souveräner 4:0-Triumph im großen Finale! Angeführt von Kapitän Phan van Trung (6 Siege, ungeschlagen) und Jeanette Krause (7 Siege, 87.5% Winrate) sicherte sich das Team den Meisterpokal und die Goldmedaillen.',
      'approved',
      'Phan van Trung (Kapitän)'
    );

    insertResult.run(
      'UNI Badminton Team Cup 2026',
      '🥈 2. Platz (Silber / Finalist)',
      '31.01.2026',
      'TUC Titans (Michael Krause, Neeraj Kulkarni, Aditya Vikram, Sohan Rahman, Saswat Pradhan, Havishma Madabhushi, Ayushi Thakur)',
      '/uploads/tournament_2026/teamcup_2026_titans_silver.jpeg',
      'Hervorragender Finaleinzug nach einem 3:1-Halbfinalsieg über die HSMW. Überragende Doppel- und Einzelleistungen von Neeraj Kulkarni (6 Siege aus 7 Spielen) und das gesamte Titans-Team mit dem Silberpokal.',
      'approved',
      'Michael Krause (Kapitän)'
    );

    insertResult.run(
      'UNI Badminton Team Cup 2026',
      '🥉 3. Platz (Bronze) & Sieger Gr. A',
      '31.01.2026',
      'TUC Challengers (Pradeep Gandu, Tamara Winzler, Sheng Dong, Cheyu Lin, Nithin Valiyaveedu, Rakib Rony)',
      '/uploads/tournament_2026/teamcup_2026_challengers_bronze.jpeg',
      'Sensationelle Gruppenphase mit 3:0 Siegen und ein nervenstarker 3:2-Erfolg im kleinen Finale gegen HSMW! Mit Kapitän Pradeep Gandu (8 Siege, MVP) und Tamara Winzler (8 Siege, beste Dame) auf dem Bronzepodest.',
      'approved',
      'Pradeep Gandu (Kapitän & MVP)'
    );

    insertResult.run(
      'UNI Badminton Team Cup 2026',
      '🏅 4. Platz & Beste Gast-Uni',
      '31.01.2026',
      'HSMW Mittweida (Jensun Ravichandran, Leander Pluntke, Chenyang Sun, Paul Bochmann, Franklin Asphas, Laura Harms, Louise Mahlig)',
      '/uploads/tournament_2026/teamcup_2026_hsmw_4th.jpeg',
      'Starke Leistung der Hochschule Mittweida mit dem 1. Platz in Gruppe B (2:0 Siege) und hochklassigen Ballwechseln im Halbfinale und Spiel um Platz 3.',
      'approved',
      'Jensun Ravichandran (Kapitän HSMW)'
    );

    insertResult.run(
      'UNI Badminton Team Cup 2026',
      '🏸 5. Platz (Platzierungsspiel)',
      '31.01.2026',
      'TUC Predators (Kevin Fuchs, Phu Loc Pham, Md Motasim Billah, Andre Apitzsch, Rishit, Jiyeon Yeo, Annalena Wieland)',
      '/uploads/tournament_2026/teamcup_2026_predators_5th.jpeg',
      'Starker Auftritt der TUC Predators: Mit großem Teamgeist, ungeschlagenem Einzel von Phu Loc Pham (100% Winrate) und vollem Einsatz im Platzierungsspiel.',
      'approved',
      'Kevin Fuchs (Kapitän Predators)'
    );

    insertResult.run(
      'UNI Badminton Team Cup 2026',
      '🏸 6. Platz (Platzierungsrunde)',
      '31.01.2026',
      'WHZ Zwickauer Schmetterlinge (Westsächsische Hochschule Zwickau)',
      '/uploads/tournament_2026/teamcup_2026_zwickau_schmetterlinge.jpeg',
      'Großartige Stimmung und beherzter Kampfgeist des ersten Teams der Westsächsischen Hochschule Zwickau bei den Platzierungsspielen.',
      'approved',
      'WH Zwickau'
    );

    insertResult.run(
      'UNI Badminton Team Cup 2026',
      '👥 Großes Gemeinschaftsfoto',
      '31.01.2026',
      'TU Chemnitz, WH Zwickau, HS Mittweida (7 Teams, 45 Aktive)',
      '/uploads/tournament_2026/teamcup_2026_group_all_teams.jpeg',
      'Sportlicher Wettkampf, gelebte Vielfalt und fantastische Stimmung: 45 Studierende und Mitarbeitende aus 10 Nationen feierten das größte Badminton-Turnier des Semesters in der Sporthalle Thüringer Weg.',
      'approved',
      'Turnierleitung USZ'
    );

    insertResult.run(
      'UNI Badminton Team Cup 2026',
      '📸 Team-Selfie nach dem Platzierungsspiel',
      '31.01.2026',
      'TUC Predators',
      '/uploads/tournament_2026/teamcup_2026_predators_selfie.jpeg',
      'Unser Teamgeist und Freude nach den spannenden Matches in der Sporthalle Thüringer Weg!',
      'pending',
      'Kevin Fuchs'
    );
  }

  // Seed initial YouTube videos if empty
  const vCount = db.prepare('SELECT COUNT(*) as count FROM youtube_videos').get().count;
  if (vCount === 0) {
    const insertVid = db.prepare(`
      INSERT INTO youtube_videos (title, youtube_url, video_id, category, description, display_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertVid.run(
      'UNI Badminton Team Cup 2026 - Finale & Siegerehrung Highlights',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'dQw4w9WgXcQ',
      'Turnier 2026',
      'Die besten Ballwechsel, das packende Finale der TUC Shuttlers gegen TUC Titans und die Siegerehrung in der Sporthalle Thüringer Weg 11.',
      1
    );
    insertVid.run(
      'TUC Badminton Training & 12 Felder Hallenübersicht',
      'https://www.youtube.com/watch?v=ScMzIvxBSi4',
      'ScMzIvxBSi4',
      'Training & Arena',
      'Einblick in unser wöchentliches Training in der 12-Felder-Universitäts-Sporthalle am Thüringer Weg.',
      2
    );
  }

  // Seed initial Training Schedules if empty
  const schedCount = db.prepare('SELECT COUNT(*) as count FROM training_schedules').get().count;
  if (schedCount === 0) {
    const insertSched = db.prepare(`
      INSERT INTO training_schedules (day_title, time_slot, group_name, hall_name, courts_info, notes, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertSched.run(
      'Montag',
      '18:00 - 20:00 Uhr',
      'Einsteiger, Hochschulsport & Freies Spiel',
      'Sporthalle Thüringer Weg 11',
      '12 Spielfelder',
      'Grundlagentraining, Service & Smash-Abwehr sowie freie Spielrunden für alle Studierenden & Mitarbeitenden.',
      1
    );
    insertSched.run(
      'Mittwoch',
      '19:30 - 22:00 Uhr',
      'Wettkampftraining & Mannschaft (Sachsenliga / Bezirksliga)',
      'Sporthalle Thüringer Weg 11',
      '12 Spielfelder',
      'Taktik, Zuspielserien, Doppelabstimmung und gezielte Vorbereitung auf Liga- und Universitätsturniere.',
      2
    );
    insertSched.run(
      'Freitag',
      '18:00 - 21:00 Uhr',
      'Freies Spiel & Matchpraxis für alle Leistungsstufen',
      'Sporthalle Thüringer Weg 11',
      '12 Spielfelder',
      'Ranglistenspiele, gemischte Doppel und offenes Freitagsturnier auf bis zu 12 Feldern gleichzeitig.',
      3
    );
  }

  console.log(`[DB] Database initialized successfully at ${dbPath}`);
}

// -------------------------------------------------------------
// Query Helpers
// -------------------------------------------------------------

// Trainers
export function getAllTrainers() {
  return db.prepare("SELECT * FROM trainers WHERE status = 'approved' ORDER BY id ASC").all();
}

export function getPendingTrainers() {
  return db.prepare("SELECT * FROM trainers WHERE status = 'pending' ORDER BY created_at DESC").all();
}

export function approveTrainer(id) {
  db.prepare("UPDATE trainers SET status = 'approved' WHERE id = ?").run(id);
  return db.prepare("SELECT * FROM trainers WHERE id = ?").get(id);
}

export function rejectTrainer(id) {
  return db.prepare("DELETE FROM trainers WHERE id = ?").run(id);
}

export function registerTrainerSubmission({ name, role, email, phone, show_phone, focus_areas, hochschulsport_approved, hochschulsport_note, photo_url }) {
  const stmt = db.prepare(`
    INSERT INTO trainers (name, role, email, phone, show_phone, focus_areas, hochschulsport_approved, hochschulsport_note, photo_url, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `);
  const result = stmt.run(
    name ? name.trim() : 'Badminton-Trainer',
    role ? role.trim() : 'Trainer / Coach',
    email.trim().toLowerCase(),
    phone ? phone.trim() : '',
    show_phone ? 1 : 0,
    focus_areas ? focus_areas.trim() : 'Allgemeines Training & Taktik',
    hochschulsport_approved ? 1 : 0,
    hochschulsport_note ? hochschulsport_note.trim() : '',
    photo_url || ''
  );
  return db.prepare('SELECT * FROM trainers WHERE id = ?').get(result.lastInsertRowid);
}

export function createTrainer({ name, role, email, focus_areas, photo_url, phone, show_phone, hochschulsport_approved, hochschulsport_note, status }) {
  const stmt = db.prepare(`
    INSERT INTO trainers (name, role, email, focus_areas, photo_url, phone, show_phone, hochschulsport_approved, hochschulsport_note, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    name,
    role,
    email,
    focus_areas,
    photo_url || '',
    phone || '',
    show_phone !== undefined ? (show_phone ? 1 : 0) : 1,
    hochschulsport_approved !== undefined ? (hochschulsport_approved ? 1 : 0) : 1,
    hochschulsport_note || 'USZ-Zulassung vorhanden',
    status || 'approved'
  );
  return db.prepare('SELECT * FROM trainers WHERE id = ?').get(result.lastInsertRowid);
}

export function deleteTrainer(id) {
  return db.prepare('DELETE FROM trainers WHERE id = ?').run(id);
}

export function updateTrainer(id, { name, role, email, focus_areas, photo_url, phone, show_phone, hochschulsport_approved, hochschulsport_note, status }) {
  const existing = db.prepare('SELECT * FROM trainers WHERE id = ?').get(id);
  if (!existing) throw new Error(`Trainer #${id} not found`);
  const stmt = db.prepare(`
    UPDATE trainers 
    SET name = ?, role = ?, email = ?, focus_areas = ?, photo_url = ?, phone = ?, show_phone = ?, hochschulsport_approved = ?, hochschulsport_note = ?, status = ?
    WHERE id = ?
  `);
  stmt.run(
    name !== undefined ? name.trim() : existing.name,
    role !== undefined ? role.trim() : existing.role,
    email !== undefined ? email.trim().toLowerCase() : existing.email,
    focus_areas !== undefined ? focus_areas.trim() : existing.focus_areas,
    photo_url !== undefined && photo_url !== '' ? photo_url : existing.photo_url,
    phone !== undefined ? phone.trim() : (existing.phone || ''),
    show_phone !== undefined ? (show_phone ? 1 : 0) : (existing.show_phone !== undefined ? existing.show_phone : 1),
    hochschulsport_approved !== undefined ? (hochschulsport_approved ? 1 : 0) : (existing.hochschulsport_approved || 1),
    hochschulsport_note !== undefined ? hochschulsport_note.trim() : (existing.hochschulsport_note || ''),
    status !== undefined ? status : (existing.status || 'approved'),
    id
  );
  return db.prepare('SELECT * FROM trainers WHERE id = ?').get(id);
}

// Tournaments
export function getAllTournaments() {
  return db.prepare('SELECT * FROM tournaments ORDER BY id DESC').all();
}

export function getTournamentById(id) {
  return db.prepare('SELECT * FROM tournaments WHERE id = ?').get(id);
}

export function createTournament({ title, date, deadline, location, document_url, file_type, description }) {
  const stmt = db.prepare(`
    INSERT INTO tournaments (title, date, deadline, location, document_url, file_type, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    title,
    date,
    deadline,
    location,
    document_url,
    file_type || 'pdf',
    description || ''
  );
  return db.prepare('SELECT * FROM tournaments WHERE id = ?').get(result.lastInsertRowid);
}

export function updateTournament(id, { title, date, deadline, location, document_url, file_type, description }) {
  const existing = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(id);
  if (!existing) throw new Error(`Tournament #${id} not found`);
  const stmt = db.prepare(`
    UPDATE tournaments 
    SET title = ?, date = ?, deadline = ?, location = ?, document_url = ?, file_type = ?, description = ?
    WHERE id = ?
  `);
  stmt.run(
    title !== undefined ? title.trim() : existing.title,
    date !== undefined ? date.trim() : existing.date,
    deadline !== undefined ? deadline.trim() : existing.deadline,
    location !== undefined ? location.trim() : existing.location,
    document_url !== undefined && document_url !== '' ? document_url : existing.document_url,
    file_type !== undefined ? file_type : existing.file_type,
    description !== undefined ? description.trim() : existing.description,
    id
  );
  return db.prepare('SELECT * FROM tournaments WHERE id = ?').get(id);
}

export function deleteTournament(id) {
  return db.prepare('DELETE FROM tournaments WHERE id = ?').run(id);
}

// Media
export function getAllMedia(type) {
  if (type && type !== 'all') {
    return db.prepare('SELECT * FROM media WHERE type = ? ORDER BY id DESC').all(type);
  }
  return db.prepare('SELECT * FROM media ORDER BY id DESC').all();
}

export function createMedia({ title, type, file_url, thumbnail_url, caption }) {
  const stmt = db.prepare(`
    INSERT INTO media (title, type, file_url, thumbnail_url, caption)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(title, type || 'photo', file_url, thumbnail_url || file_url, caption || '');
  return db.prepare('SELECT * FROM media WHERE id = ?').get(result.lastInsertRowid);
}

export function deleteMedia(id) {
  return db.prepare('DELETE FROM media WHERE id = ?').run(id);
}

// Registrations
export function getAllRegistrations() {
  return db.prepare('SELECT * FROM registrations ORDER BY id DESC').all();
}

export function createRegistration(data) {
  const stmt = db.prepare(`
    INSERT INTO registrations (name, email, affiliation, session_type, skill_level, preferred_day, racket_needed, message, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.name,
    data.email,
    data.affiliation || 'TUC Student',
    data.session_type || 'trial',
    data.skill_level || 'intermediate',
    data.preferred_day || 'Wednesday',
    data.racket_needed ? 1 : 0,
    data.message || '',
    data.status || 'confirmed'
  );
  return db.prepare('SELECT * FROM registrations WHERE id = ?').get(result.lastInsertRowid);
}

// Players (Men & Women Squads)
export function getAllPlayers(gender) {
  if (gender && (gender === 'men' || gender === 'women')) {
    return db.prepare("SELECT * FROM players WHERE gender = ? AND status = 'approved' ORDER BY id ASC").all(gender);
  }
  return db.prepare("SELECT * FROM players WHERE status = 'approved' ORDER BY gender ASC, id ASC").all();
}

export function getPendingPlayers() {
  return db.prepare("SELECT * FROM players WHERE status = 'pending' ORDER BY created_at DESC").all();
}

export function approvePlayer(id) {
  db.prepare("UPDATE players SET status = 'approved' WHERE id = ?").run(id);
  return db.prepare("SELECT * FROM players WHERE id = ?").get(id);
}

export function rejectPlayer(id) {
  return db.prepare("DELETE FROM players WHERE id = ?").run(id);
}

export function registerPlayerSubmission({
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
  photo_url,
}) {
  const stmt = db.prepare(`
    INSERT INTO players (
      name, gender, study_program, specialization, team, email, phone, show_phone, favorite_player, skill_level, university_type, university_name, photo_url, status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `);
  const result = stmt.run(
    name ? name.trim() : 'Badminton-Spieler',
    gender || 'men',
    study_program ? study_program.trim() : 'TU Chemnitz',
    specialization ? specialization.trim() : 'Einzel & Doppel',
    team ? team.trim() : 'Hochschulsport & Spielbetrieb',
    email.trim().toLowerCase(),
    phone ? phone.trim() : '',
    show_phone ? 1 : 0,
    favorite_player ? favorite_player.trim() : '',
    skill_level ? skill_level.trim() : 'Fortgeschritten',
    university_type ? university_type.trim() : 'tu_chemnitz',
    university_name ? university_name.trim() : 'TU Chemnitz',
    photo_url || ''
  );
  return db.prepare('SELECT * FROM players WHERE id = ?').get(result.lastInsertRowid);
}

export function createPlayer({
  name,
  gender,
  study_program,
  specialization,
  team,
  email,
  photo_url,
  phone,
  show_phone,
  favorite_player,
  skill_level,
  university_type,
  university_name,
  status,
}) {
  const stmt = db.prepare(`
    INSERT INTO players (
      name, gender, study_program, specialization, team, email, photo_url, phone, show_phone, favorite_player, skill_level, university_type, university_name, status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    name,
    gender || 'men',
    study_program || 'TU Chemnitz',
    specialization || 'Singles & Doubles',
    team || '1. Mannschaft (Sachsenliga)',
    email,
    photo_url || '',
    phone || '',
    show_phone ? 1 : 0,
    favorite_player || '',
    skill_level || 'Fortgeschritten',
    university_type || 'tu_chemnitz',
    university_name || 'TU Chemnitz',
    status || 'approved'
  );
  return db.prepare('SELECT * FROM players WHERE id = ?').get(result.lastInsertRowid);
}

export function deletePlayer(id) {
  return db.prepare('DELETE FROM players WHERE id = ?').run(id);
}

export function updatePlayer(id, {
  name,
  gender,
  study_program,
  specialization,
  team,
  email,
  photo_url,
  phone,
  show_phone,
  favorite_player,
  skill_level,
  university_type,
  university_name,
  status,
}) {
  const existing = db.prepare('SELECT * FROM players WHERE id = ?').get(id);
  if (!existing) throw new Error(`Player #${id} not found`);
  const stmt = db.prepare(`
    UPDATE players
    SET name = ?, gender = ?, study_program = ?, specialization = ?, team = ?, email = ?, photo_url = ?, phone = ?, show_phone = ?, favorite_player = ?, skill_level = ?, university_type = ?, university_name = ?, status = ?
    WHERE id = ?
  `);
  stmt.run(
    name !== undefined ? name.trim() : existing.name,
    gender !== undefined ? gender : existing.gender,
    study_program !== undefined ? study_program.trim() : existing.study_program,
    specialization !== undefined ? specialization.trim() : existing.specialization,
    team !== undefined ? team.trim() : existing.team,
    email !== undefined ? email.trim().toLowerCase() : existing.email,
    photo_url !== undefined && photo_url !== '' ? photo_url : existing.photo_url,
    phone !== undefined ? phone.trim() : (existing.phone || ''),
    show_phone !== undefined ? (show_phone ? 1 : 0) : (existing.show_phone || 0),
    favorite_player !== undefined ? favorite_player.trim() : (existing.favorite_player || ''),
    skill_level !== undefined ? skill_level.trim() : (existing.skill_level || 'Fortgeschritten'),
    university_type !== undefined ? university_type.trim() : (existing.university_type || 'tu_chemnitz'),
    university_name !== undefined ? university_name.trim() : (existing.university_name || 'TU Chemnitz'),
    status !== undefined ? status : (existing.status || 'approved'),
    id
  );
  return db.prepare('SELECT * FROM players WHERE id = ?').get(id);
}

export function getPlayerById(id) {
  return db.prepare('SELECT * FROM players WHERE id = ?').get(id);
}

export function getStats() {
  const trainersCount = db.prepare("SELECT COUNT(*) as count FROM trainers WHERE status = 'approved'").get().count;
  const tourneysCount = db.prepare('SELECT COUNT(*) as count FROM tournaments').get().count;
  const mediaCount = db.prepare('SELECT COUNT(*) as count FROM media').get().count;
  const regCount = db.prepare('SELECT COUNT(*) as count FROM registrations').get().count;
  const playerCount = db.prepare("SELECT COUNT(*) as count FROM players WHERE status = 'approved'").get().count;
  const resultsCount = db.prepare('SELECT COUNT(*) as count FROM tournament_results').get().count;
  const pendingResultsCount = db.prepare("SELECT COUNT(*) as count FROM tournament_results WHERE status = 'pending'").get().count;
  const pendingPlayersCount = db.prepare("SELECT COUNT(*) as count FROM players WHERE status = 'pending'").get().count;
  const pendingTrainersCount = db.prepare("SELECT COUNT(*) as count FROM trainers WHERE status = 'pending'").get().count;
  return {
    trainers: trainersCount,
    tournaments: tourneysCount,
    media: mediaCount,
    registrations: regCount,
    players: playerCount,
    tournamentResults: resultsCount,
    pendingResults: pendingResultsCount,
    pendingPlayers: pendingPlayersCount,
    pendingTrainers: pendingTrainersCount,
  };
}

// -------------------------------------------------------------
// Tournament Results & Gallery Helpers
// -------------------------------------------------------------

export function getApprovedTournamentResults() {
  return db.prepare("SELECT * FROM tournament_results WHERE status = 'approved' ORDER BY id DESC").all();
}

export function getAllTournamentResults(status) {
  if (status && status !== 'all') {
    return db.prepare('SELECT * FROM tournament_results WHERE status = ? ORDER BY id DESC').all(status);
  }
  return db.prepare(`
    SELECT * FROM tournament_results 
    ORDER BY CASE WHEN status = 'pending' THEN 0 ELSE 1 END, id DESC
  `).all();
}

export function getTournamentResultById(id) {
  return db.prepare('SELECT * FROM tournament_results WHERE id = ?').get(id);
}

export function createTournamentResult({ tournament_name, result, date, player_name, photo_url, caption, status = 'pending', submitted_by = 'Player' }) {
  const stmt = db.prepare(`
    INSERT INTO tournament_results (tournament_name, result, date, player_name, photo_url, caption, status, submitted_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const res = stmt.run(tournament_name, result, date, player_name, photo_url, caption || '', status, submitted_by);
  return db.prepare('SELECT * FROM tournament_results WHERE id = ?').get(res.lastInsertRowid);
}

export function updateTournamentResult(id, { tournament_name, result, date, player_name, photo_url, caption, status }) {
  const existing = db.prepare('SELECT * FROM tournament_results WHERE id = ?').get(id);
  if (!existing) throw new Error(`Tournament result #${id} not found`);
  const stmt = db.prepare(`
    UPDATE tournament_results
    SET tournament_name = ?, result = ?, date = ?, player_name = ?, photo_url = ?, caption = ?, status = ?
    WHERE id = ?
  `);
  stmt.run(
    tournament_name !== undefined ? tournament_name.trim() : existing.tournament_name,
    result !== undefined ? result.trim() : existing.result,
    date !== undefined ? date.trim() : existing.date,
    player_name !== undefined ? player_name.trim() : existing.player_name,
    photo_url !== undefined && photo_url !== '' ? photo_url : existing.photo_url,
    caption !== undefined ? caption.trim() : existing.caption,
    status !== undefined ? status : existing.status,
    id
  );
  return db.prepare('SELECT * FROM tournament_results WHERE id = ?').get(id);
}

export function approveTournamentResult(id) {
  db.prepare("UPDATE tournament_results SET status = 'approved' WHERE id = ?").run(id);
  return db.prepare('SELECT * FROM tournament_results WHERE id = ?').get(id);
}

export function deleteTournamentResult(id) {
  return db.prepare('DELETE FROM tournament_results WHERE id = ?').run(id);
}

// -------------------------------------------------------------
// Admin Password Settings Helpers
// -------------------------------------------------------------
export function getAdminPasswordInfo() {
  return db.prepare('SELECT password_hash, password_salt FROM admin_settings WHERE id = 1').get();
}

export function updateAdminPassword(password_hash, password_salt) {
  const stmt = db.prepare(`
    INSERT INTO admin_settings (id, password_hash, password_salt, updated_at)
    VALUES (1, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      password_hash = excluded.password_hash,
      password_salt = excluded.password_salt,
      updated_at = CURRENT_TIMESTAMP
  `);
  return stmt.run(password_hash, password_salt);
}

// -------------------------------------------------------------
// Site Announcements Helpers
// -------------------------------------------------------------
export function getSiteAnnouncement() {
  const row = db.prepare('SELECT * FROM site_announcements WHERE id = 1').get();
  if (!row) {
    return {
      id: 1,
      title: 'Aktuelle Hinweise zum Spielbetrieb',
      message: 'Willkommen zur Sommerrunde 2026. Bitte denkt an saubere Hallenschuhe mit abriebfester Sohle!',
      type: 'info',
      is_active: 1
    };
  }
  return {
    ...row,
    is_active: Boolean(row.is_active)
  };
}

export function updateSiteAnnouncement({ title, message, type = 'info', is_active = false }) {
  const stmt = db.prepare(`
    INSERT INTO site_announcements (id, title, message, type, is_active, updated_at)
    VALUES (1, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      message = excluded.message,
      type = excluded.type,
      is_active = excluded.is_active,
      updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(
    title ? title.trim() : 'Hinweis',
    message ? message.trim() : '',
    type,
    is_active ? 1 : 0
  );
  return getSiteAnnouncement();
}

// -------------------------------------------------------------
// YouTube Videos & Channel Helpers
// -------------------------------------------------------------
export function extractYouTubeId(url) {
  if (!url) return '';
  const clean = url.trim();
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = clean.match(regExp);
  return (match && match[2].length === 11) ? match[2] : clean;
}

export function getAllYouTubeVideos() {
  return db.prepare('SELECT * FROM youtube_videos ORDER BY display_order ASC, id DESC').all();
}

export function getYouTubeVideoById(id) {
  return db.prepare('SELECT * FROM youtube_videos WHERE id = ?').get(id);
}

export function createYouTubeVideo({ title, youtube_url, category = 'Highlights', description = '', display_order = 0 }) {
  const video_id = extractYouTubeId(youtube_url);
  const stmt = db.prepare(`
    INSERT INTO youtube_videos (title, youtube_url, video_id, category, description, display_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const res = stmt.run(
    title.trim(),
    youtube_url.trim(),
    video_id,
    category ? category.trim() : 'Highlights',
    description ? description.trim() : '',
    Number(display_order) || 0
  );
  return getYouTubeVideoById(res.lastInsertRowid);
}

export function updateYouTubeVideo(id, fields) {
  const existing = getYouTubeVideoById(id);
  if (!existing) throw new Error('Video not found');
  const video_id = fields.youtube_url ? extractYouTubeId(fields.youtube_url) : existing.video_id;
  const stmt = db.prepare(`
    UPDATE youtube_videos
    SET title = ?, youtube_url = ?, video_id = ?, category = ?, description = ?, display_order = ?
    WHERE id = ?
  `);
  stmt.run(
    fields.title !== undefined ? fields.title.trim() : existing.title,
    fields.youtube_url !== undefined ? fields.youtube_url.trim() : existing.youtube_url,
    video_id,
    fields.category !== undefined ? fields.category.trim() : existing.category,
    fields.description !== undefined ? fields.description.trim() : existing.description,
    fields.display_order !== undefined ? Number(fields.display_order) : existing.display_order,
    id
  );
  return getYouTubeVideoById(id);
}

export function deleteYouTubeVideo(id) {
  return db.prepare('DELETE FROM youtube_videos WHERE id = ?').run(id);
}

export function getYouTubeChannelInfo() {
  const row = db.prepare('SELECT youtube_channel_url, admin_email FROM admin_settings WHERE id = 1').get();
  return {
    youtube_channel_url: row?.youtube_channel_url || 'https://www.youtube.com/@TUCBadminton',
    admin_email: row?.admin_email || 'gandupradeep2026@gmail.com'
  };
}

export function updateYouTubeChannelUrl(url) {
  const stmt = db.prepare(`
    UPDATE admin_settings SET youtube_channel_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1
  `);
  stmt.run(url.trim());
  return getYouTubeChannelInfo();
}

// -------------------------------------------------------------
// Admin Password Reset Flow Helpers
// -------------------------------------------------------------
export function createPasswordResetToken(email = 'gandupradeep2026@gmail.com') {
  const token = crypto.randomBytes(32).toString('hex');
  // Cryptographically secure 6-digit numeric approval code (OTP)
  const approval_code = String(crypto.randomInt(100000, 1000000));
  // Expires in 15 minutes for strict security
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO password_resets (email, token, approval_code, expires_at, used)
    VALUES (?, ?, ?, ?, 0)
  `);
  stmt.run(email.trim().toLowerCase(), token, approval_code, expiresAt);
  
  return {
    token,
    approval_code,
    email: email.trim().toLowerCase(),
    expires_at: expiresAt
  };
}

export function verifyPasswordResetApproval({ email, approvalCode, token }) {
  const cleanCode = (approvalCode || '').trim();
  if (!cleanCode) return null;

  // 1. Support Master Recovery Key (failsafe for site owner from backend .env)
  const masterKey = process.env.ADMIN_MASTER_RECOVERY_KEY || 'TUC-MASTER-ADMIN-KEY-2026';
  if (cleanCode === masterKey) {
    return { valid: true, isMasterKey: true, email: email || 'gandupradeep2026@gmail.com' };
  }

  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanToken = (token || '').trim();

  // 2. Check pending active reset approval code in database
  const row = db.prepare(`
    SELECT * FROM password_resets 
    WHERE approval_code = ? 
      AND used = 0 
      AND datetime(expires_at) > datetime('now')
      AND (
        (? != '' AND LOWER(email) = ?)
        OR (? != '' AND token = ?)
      )
    ORDER BY id DESC LIMIT 1
  `).get(cleanCode, cleanEmail, cleanEmail, cleanToken, cleanToken);

  return row ? { valid: true, record: row, email: row.email } : null;
}

export function usePasswordResetApproval({ email, approvalCode, token, newHash, newSalt }) {
  const auth = verifyPasswordResetApproval({ email, approvalCode, token });
  if (!auth || !auth.valid) {
    throw new Error('Der 6-stellige Bestätigungscode ist ungültig oder abgelaufen.');
  }

  // Update master admin credentials
  db.prepare(`
    UPDATE admin_settings
    SET password_hash = ?, password_salt = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `).run(newHash, newSalt);

  // Mark pending codes as used
  if (auth.record && auth.record.id) {
    db.prepare(`UPDATE password_resets SET used = 1 WHERE id = ?`).run(auth.record.id);
  } else if (email) {
    db.prepare(`UPDATE password_resets SET used = 1 WHERE LOWER(email) = ?`).run(email.trim().toLowerCase());
  }
  return true;
}

export function verifyPasswordResetToken(token) {
  if (!token) return null;
  const row = db.prepare(`
    SELECT * FROM password_resets 
    WHERE token = ? AND used = 0 AND datetime(expires_at) > datetime('now')
  `).get(token.trim());
  return row || null;
}

export function usePasswordResetToken(token, newHash, newSalt) {
  const record = verifyPasswordResetToken(token);
  if (!record) {
    throw new Error('Der Passwort-Reset-Link ist ungültig oder abgelaufen.');
  }

  // Update master admin credentials
  db.prepare(`
    UPDATE admin_settings
    SET password_hash = ?, password_salt = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `).run(newHash, newSalt);

  // Invalidate reset token
  db.prepare(`UPDATE password_resets SET used = 1 WHERE id = ?`).run(record.id);
  return true;
}

// -------------------------------------------------------------
// Dynamic Training Schedules Helpers
// -------------------------------------------------------------
export function getAllTrainingSchedules() {
  return db.prepare('SELECT * FROM training_schedules ORDER BY display_order ASC, id ASC').all();
}

export function getTrainingScheduleById(id) {
  return db.prepare('SELECT * FROM training_schedules WHERE id = ?').get(id);
}

export function createTrainingSchedule({ day_title, time_slot, group_name, hall_name = 'Sporthalle Thüringer Weg 11', courts_info = '12 Spielfelder', notes = '', display_order = 0 }) {
  const stmt = db.prepare(`
    INSERT INTO training_schedules (day_title, time_slot, group_name, hall_name, courts_info, notes, display_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const res = stmt.run(
    day_title.trim(),
    time_slot.trim(),
    group_name.trim(),
    hall_name ? hall_name.trim() : 'Sporthalle Thüringer Weg 11',
    courts_info ? courts_info.trim() : '12 Spielfelder',
    notes ? notes.trim() : '',
    Number(display_order) || 0
  );
  return getTrainingScheduleById(res.lastInsertRowid);
}

export function updateTrainingSchedule(id, fields) {
  const existing = getTrainingScheduleById(id);
  if (!existing) throw new Error('Training schedule not found');
  const stmt = db.prepare(`
    UPDATE training_schedules
    SET day_title = ?, time_slot = ?, group_name = ?, hall_name = ?, courts_info = ?, notes = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(
    fields.day_title !== undefined ? fields.day_title.trim() : existing.day_title,
    fields.time_slot !== undefined ? fields.time_slot.trim() : existing.time_slot,
    fields.group_name !== undefined ? fields.group_name.trim() : existing.group_name,
    fields.hall_name !== undefined ? fields.hall_name.trim() : existing.hall_name,
    fields.courts_info !== undefined ? fields.courts_info.trim() : existing.courts_info,
    fields.notes !== undefined ? fields.notes.trim() : existing.notes,
    fields.display_order !== undefined ? Number(fields.display_order) : existing.display_order,
    id
  );
  return getTrainingScheduleById(id);
}

export function deleteTrainingSchedule(id) {
  return db.prepare('DELETE FROM training_schedules WHERE id = ?').run(id);
}

export { db };



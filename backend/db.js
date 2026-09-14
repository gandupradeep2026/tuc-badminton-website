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

  // 0e. Tournament Partner Requests Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS partner_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      player_name TEXT NOT NULL,
      player_email TEXT NOT NULL,
      requester_name TEXT NOT NULL,
      requester_email TEXT NOT NULL,
      requester_phone TEXT,
      tournament_name TEXT NOT NULL,
      discipline TEXT NOT NULL,
      message TEXT,
      status TEXT DEFAULT 'sent',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 0f. Equipment Services & Stringers / Shuttle Sellers Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS equipment_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      service_type TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      show_phone INTEGER DEFAULT 1,
      pricing_details TEXT,
      available_items TEXT,
      location_note TEXT,
      experience_years TEXT,
      photo_url TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 0g. Donation & Sponsorship Settings Table (Default: INACTIVE / Hidden for public)
  db.exec(`
    CREATE TABLE IF NOT EXISTS donation_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      is_active INTEGER DEFAULT 0,
      title TEXT NOT NULL DEFAULT 'Unterstütze das Badminton-Team der TU Chemnitz',
      subtitle TEXT DEFAULT 'Gemeinsam für Training, Ausrüstung & Turniere',
      description TEXT DEFAULT 'Als universitäre Badminton-Gemeinschaft finanzieren wir Trainingsbälle, Ausrüstung und Turnierfahrten für Studierende. Deine Unterstützung hilft uns, den Badmintonsport an der TU Chemnitz weiterzuentwickeln!',
      paypal_me_link TEXT DEFAULT '',
      paypal_email TEXT DEFAULT '',
      bank_recipient TEXT DEFAULT 'TU Chemnitz Badminton Community',
      bank_iban TEXT DEFAULT '',
      bank_bic TEXT DEFAULT '',
      bank_name TEXT DEFAULT '',
      bank_reference TEXT DEFAULT 'Spende Badminton TU Chemnitz',
      sponsor_email TEXT DEFAULT 'gandupradeep2026@gmail.com',
      sponsor_info TEXT DEFAULT 'Möchten Sie oder Ihr Unternehmen das Badminton-Team der TU Chemnitz als offizieller Sponsor oder Partner unterstützen? Wir bieten Trikotwerbung, Turniersponsoring und Logoplatzierungen auf unserer Vereinsplattform.',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default donation settings if empty (with is_active = 0)
  const existingDonation = db.prepare('SELECT id FROM donation_settings WHERE id = 1').get();
  if (!existingDonation) {
    db.prepare(`
      INSERT INTO donation_settings (id, is_active, title, subtitle, description, paypal_me_link, paypal_email, bank_recipient, bank_iban, bank_bic, bank_name, bank_reference, sponsor_email, sponsor_info)
      VALUES (1, 0, 'Unterstütze das Badminton-Team der TU Chemnitz', 'Gemeinsam für Training, Ausrüstung & Turniere', 'Als universitäre Badminton-Gemeinschaft finanzieren wir Trainingsbälle, Ausrüstung und Turnierfahrten für Studierende. Deine Unterstützung hilft uns, den Badmintonsport an der TU Chemnitz weiterzuentwickeln!', '', '', 'TU Chemnitz Badminton Community', '', '', '', 'Spende Badminton TU Chemnitz', 'gandupradeep2026@gmail.com', 'Möchten Sie oder Ihr Unternehmen das Badminton-Team der TU Chemnitz als offizieller Sponsor oder Partner unterstützen? Wir bieten Trikotwerbung, Turniersponsoring und Logoplatzierungen auf unserer Vereinsplattform.')
    `).run();
  }

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
      VALUES (1, 'Aktuelle Hinweise zum Spielbetrieb', '', 'info', 0)
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

  // Ensure trainers table has all modern fields
  const trainerCols = db.prepare(`PRAGMA table_info(trainers)`).all().map(c => c.name);
  if (!trainerCols.includes('trainer_type')) {
    db.exec(`ALTER TABLE trainers ADD COLUMN trainer_type TEXT DEFAULT 'usz';`);
  }
  if (!trainerCols.includes('hourly_rate')) {
    db.exec(`ALTER TABLE trainers ADD COLUMN hourly_rate TEXT DEFAULT '';`);
  }
  if (!trainerCols.includes('availability')) {
    db.exec(`ALTER TABLE trainers ADD COLUMN availability TEXT DEFAULT '';`);
  }
  if (!trainerCols.includes('experience_years')) {
    db.exec(`ALTER TABLE trainers ADD COLUMN experience_years TEXT DEFAULT '';`);
  }
  if (!trainerCols.includes('phone')) {
    db.exec(`ALTER TABLE trainers ADD COLUMN phone TEXT DEFAULT '';`);
  }
  if (!trainerCols.includes('show_phone')) {
    db.exec(`ALTER TABLE trainers ADD COLUMN show_phone INTEGER DEFAULT 0;`);
  }
  if (!trainerCols.includes('hochschulsport_approved')) {
    db.exec(`ALTER TABLE trainers ADD COLUMN hochschulsport_approved INTEGER DEFAULT 1;`);
  }
  if (!trainerCols.includes('hochschulsport_note')) {
    db.exec(`ALTER TABLE trainers ADD COLUMN hochschulsport_note TEXT DEFAULT '';`);
  }
  if (!trainerCols.includes('status')) {
    db.exec(`ALTER TABLE trainers ADD COLUMN status TEXT DEFAULT 'approved';`);
  }

  // Contact Inquiries (Mediated via Admin)
  db.exec(`
    CREATE TABLE IF NOT EXISTS contact_inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_type TEXT NOT NULL, -- 'trainer' | 'service'
      target_id INTEGER NOT NULL,
      target_name TEXT NOT NULL,
      target_email TEXT NOT NULL,
      requester_name TEXT NOT NULL,
      requester_email TEXT NOT NULL,
      requester_phone TEXT DEFAULT '',
      preferred_date TEXT DEFAULT '',
      message TEXT NOT NULL,
      status TEXT DEFAULT 'pending_forward', -- 'pending_forward' | 'forwarded' | 'archived'
      admin_notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      forwarded_at DATETIME
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
  try { db.exec("ALTER TABLE players ADD COLUMN avatar_type TEXT DEFAULT 'badminton_smash';"); } catch (e) {}
  try { db.exec("ALTER TABLE players ADD COLUMN is_public INTEGER DEFAULT 1;"); } catch (e) {}
  try { db.exec("ALTER TABLE players ADD COLUMN privacy_mode TEXT DEFAULT 'shielded';"); } catch (e) {}

  // 7. Looking for Group (LFG) / Spontaneous Game Sessions
  db.exec(`
    CREATE TABLE IF NOT EXISTS game_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      host_name TEXT NOT NULL,
      host_email TEXT NOT NULL,
      host_phone TEXT,
      location_name TEXT NOT NULL,
      location_address TEXT,
      session_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT,
      game_format TEXT NOT NULL DEFAULT 'doubles',
      max_players INTEGER NOT NULL DEFAULT 4,
      current_players INTEGER NOT NULL DEFAULT 1,
      skill_level TEXT NOT NULL DEFAULT 'all',
      cost_note TEXT,
      description TEXT,
      manage_pin TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      shuttlecock_type TEXT DEFAULT 'feather',
      intensity_level TEXT DEFAULT 'casual',
      total_cost REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS game_session_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      participant_name TEXT NOT NULL,
      participant_email TEXT NOT NULL,
      participant_phone TEXT,
      skill_level TEXT DEFAULT 'intermediate',
      message TEXT,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE
    );
  `);

  // Schema upgrades for trainers (phone, hochschulsport_approved, hochschulsport_note, status, show_phone)
  try { db.exec("ALTER TABLE trainers ADD COLUMN phone TEXT;"); } catch (e) {}
  try { db.exec("ALTER TABLE trainers ADD COLUMN hochschulsport_approved INTEGER DEFAULT 1;"); } catch (e) {}
  try { db.exec("ALTER TABLE trainers ADD COLUMN hochschulsport_note TEXT;"); } catch (e) {}
  try { db.exec("ALTER TABLE trainers ADD COLUMN status TEXT DEFAULT 'approved';"); } catch (e) {}
  try { db.exec("ALTER TABLE trainers ADD COLUMN show_phone INTEGER DEFAULT 0;"); } catch (e) {}

  // Schema upgrades for game_sessions (shuttlecock_type, intensity_level, total_cost)
  try { db.exec("ALTER TABLE game_sessions ADD COLUMN shuttlecock_type TEXT DEFAULT 'feather';"); } catch (e) {}
  try { db.exec("ALTER TABLE game_sessions ADD COLUMN intensity_level TEXT DEFAULT 'casual';"); } catch (e) {}
  try { db.exec("ALTER TABLE game_sessions ADD COLUMN total_cost REAL DEFAULT 0;"); } catch (e) {}

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

  // Trainers list starts empty - populated via Admin or Registration

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

  // Players list starts empty - populated via Admin or Registration

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

export function getTrainerById(id) {
  if (!id) return null;
  return db.prepare('SELECT * FROM trainers WHERE id = ?').get(Number(id));
}

export function approveTrainer(id) {
  db.prepare("UPDATE trainers SET status = 'approved' WHERE id = ?").run(id);
  return db.prepare("SELECT * FROM trainers WHERE id = ?").get(id);
}

export function rejectTrainer(id) {
  return db.prepare("DELETE FROM trainers WHERE id = ?").run(id);
}

export function getTrainerByEmail(email) {
  if (!email) return null;
  return db.prepare('SELECT * FROM trainers WHERE LOWER(email) = LOWER(?)').get(email.trim());
}

export function registerTrainerSubmission({
  name,
  role,
  email,
  phone,
  show_phone,
  focus_areas,
  hochschulsport_approved,
  hochschulsport_note,
  photo_url,
  trainer_type,
  hourly_rate,
  availability,
  experience_years
}) {
  const cleanEmail = email.trim().toLowerCase();
  const existing = getTrainerByEmail(cleanEmail);
  const type = trainer_type === 'private' ? 'private' : 'usz';
  const finalRole = role ? role.trim() : (type === 'private' ? 'Privattrainer / Coach' : 'Trainer / Übungsleiter');

  if (existing) {
    if (existing.status === 'approved') {
      throw new Error('Ein Trainerprofil mit dieser E-Mail-Adresse existiert bereits.');
    }
    // Update existing pending application without creating a duplicate row or altering created_at
    const updateStmt = db.prepare(`
      UPDATE trainers SET
        name = ?,
        role = ?,
        phone = ?,
        show_phone = ?,
        focus_areas = ?,
        hochschulsport_approved = ?,
        hochschulsport_note = ?,
        trainer_type = ?,
        hourly_rate = ?,
        availability = ?,
        experience_years = ?,
        photo_url = CASE WHEN ? != '' THEN ? ELSE photo_url END
      WHERE id = ?
    `);
    updateStmt.run(
      name ? name.trim() : existing.name,
      finalRole,
      phone ? phone.trim() : existing.phone,
      show_phone ? 1 : 0,
      focus_areas ? focus_areas.trim() : existing.focus_areas,
      hochschulsport_approved ? 1 : 0,
      hochschulsport_note ? hochschulsport_note.trim() : existing.hochschulsport_note,
      type,
      hourly_rate ? hourly_rate.trim() : (existing.hourly_rate || ''),
      availability ? availability.trim() : (existing.availability || ''),
      experience_years ? experience_years.trim() : (existing.experience_years || ''),
      photo_url || '',
      photo_url || '',
      existing.id
    );
    return db.prepare('SELECT * FROM trainers WHERE id = ?').get(existing.id);
  }

  const stmt = db.prepare(`
    INSERT INTO trainers (
      name, role, email, phone, show_phone, focus_areas,
      hochschulsport_approved, hochschulsport_note, photo_url,
      trainer_type, hourly_rate, availability, experience_years, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `);
  const result = stmt.run(
    name ? name.trim() : 'Badminton-Trainer',
    finalRole,
    cleanEmail,
    phone ? phone.trim() : '',
    show_phone ? 1 : 0,
    focus_areas ? focus_areas.trim() : 'Allgemeines Training & Taktik',
    hochschulsport_approved ? 1 : 0,
    hochschulsport_note ? hochschulsport_note.trim() : '',
    photo_url || '',
    type,
    hourly_rate ? hourly_rate.trim() : '',
    availability ? availability.trim() : '',
    experience_years ? experience_years.trim() : ''
  );
  return db.prepare('SELECT * FROM trainers WHERE id = ?').get(result.lastInsertRowid);
}

export function createTrainer({
  name,
  role,
  email,
  focus_areas,
  photo_url,
  phone,
  show_phone,
  hochschulsport_approved,
  hochschulsport_note,
  trainer_type,
  hourly_rate,
  availability,
  experience_years,
  status
}) {
  const stmt = db.prepare(`
    INSERT INTO trainers (
      name, role, email, focus_areas, photo_url, phone, show_phone,
      hochschulsport_approved, hochschulsport_note,
      trainer_type, hourly_rate, availability, experience_years, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    trainer_type || 'usz',
    hourly_rate || '',
    availability || '',
    experience_years || '',
    status || 'approved'
  );
  return db.prepare('SELECT * FROM trainers WHERE id = ?').get(result.lastInsertRowid);
}

export function deleteTrainer(id) {
  return db.prepare('DELETE FROM trainers WHERE id = ?').run(id);
}

export function updateTrainer(id, {
  name,
  role,
  email,
  focus_areas,
  photo_url,
  phone,
  show_phone,
  hochschulsport_approved,
  hochschulsport_note,
  trainer_type,
  hourly_rate,
  availability,
  experience_years,
  status
}) {
  const existing = db.prepare('SELECT * FROM trainers WHERE id = ?').get(id);
  if (!existing) throw new Error(`Trainer #${id} not found`);
  const stmt = db.prepare(`
    UPDATE trainers 
    SET name = ?, role = ?, email = ?, focus_areas = ?, photo_url = ?,
        phone = ?, show_phone = ?, hochschulsport_approved = ?, hochschulsport_note = ?,
        trainer_type = ?, hourly_rate = ?, availability = ?, experience_years = ?, status = ?
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
    trainer_type !== undefined ? trainer_type : (existing.trainer_type || 'usz'),
    hourly_rate !== undefined ? hourly_rate : (existing.hourly_rate || ''),
    availability !== undefined ? availability : (existing.availability || ''),
    experience_years !== undefined ? experience_years : (existing.experience_years || ''),
    status !== undefined ? status : (existing.status || 'approved'),
    id
  );
  return db.prepare('SELECT * FROM trainers WHERE id = ?').get(id);
}

// -------------------------------------------------------------
// Contact Inquiries (Mediated via Admin)
// -------------------------------------------------------------
export function createContactInquiry({
  target_type,
  target_id,
  target_name,
  target_email,
  requester_name,
  requester_email,
  requester_phone,
  preferred_date,
  message
}) {
  const stmt = db.prepare(`
    INSERT INTO contact_inquiries (
      target_type, target_id, target_name, target_email,
      requester_name, requester_email, requester_phone,
      preferred_date, message, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_forward')
  `);
  const res = stmt.run(
    target_type,
    Number(target_id),
    target_name.trim(),
    target_email.trim().toLowerCase(),
    requester_name.trim(),
    requester_email.trim().toLowerCase(),
    requester_phone ? requester_phone.trim() : '',
    preferred_date ? preferred_date.trim() : '',
    message.trim()
  );
  return db.prepare('SELECT * FROM contact_inquiries WHERE id = ?').get(res.lastInsertRowid);
}

export function getAllContactInquiries() {
  return db.prepare('SELECT * FROM contact_inquiries ORDER BY created_at DESC').all();
}

export function getPendingContactInquiries() {
  return db.prepare("SELECT * FROM contact_inquiries WHERE status = 'pending_forward' ORDER BY created_at DESC").all();
}

export function getContactInquiryById(id) {
  return db.prepare('SELECT * FROM contact_inquiries WHERE id = ?').get(Number(id));
}

export function markContactInquiryForwarded(id) {
  db.prepare(`
    UPDATE contact_inquiries 
    SET status = 'forwarded', forwarded_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(Number(id));
  return db.prepare('SELECT * FROM contact_inquiries WHERE id = ?').get(Number(id));
}

export function updateContactInquiryStatus(id, status, admin_notes) {
  db.prepare(`
    UPDATE contact_inquiries 
    SET status = ?, admin_notes = COALESCE(?, admin_notes)
    WHERE id = ?
  `).run(status, admin_notes !== undefined ? admin_notes : null, Number(id));
  return db.prepare('SELECT * FROM contact_inquiries WHERE id = ?').get(Number(id));
}

export function deleteContactInquiry(id) {
  return db.prepare('DELETE FROM contact_inquiries WHERE id = ?').run(Number(id));
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
export function sanitizePublicPlayer(player) {
  if (!player) return null;

  // Anonymize name: "Pradeep Gandu" -> "Pradeep G."
  let displayName = player.name ? player.name.trim() : 'Badminton-Spieler';
  const nameParts = displayName.split(/\s+/);
  if (nameParts.length > 1) {
    const firstName = nameParts[0];
    const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
    displayName = `${firstName} ${lastInitial}.`;
  }

  return {
    id: player.id,
    name: displayName,
    gender: player.gender,
    study_program: player.study_program || 'TU Chemnitz Student',
    specialization: player.specialization || '',
    team: player.team || 'TUC Shuttlers',
    photo_url: player.photo_url || '',
    avatar_type: player.avatar_type || 'badminton_smash',
    favorite_player: player.favorite_player || '',
    skill_level: player.skill_level || 'Fortgeschritten',
    university_type: player.university_type || 'tu_chemnitz',
    university_name: player.university_name || 'TU Chemnitz',
    created_at: player.created_at,
    // Note: email & phone are strictly protected and never exposed in the public API
  };
}

export function getAllPlayers(gender) {
  if (gender && (gender === 'men' || gender === 'women')) {
    return db.prepare("SELECT * FROM players WHERE gender = ? AND status = 'approved' AND (is_public IS NULL OR is_public = 1) ORDER BY id ASC").all(gender);
  }
  return db.prepare("SELECT * FROM players WHERE status = 'approved' AND (is_public IS NULL OR is_public = 1) ORDER BY gender ASC, id ASC").all();
}

export function getAllPlayersAdmin() {
  return db.prepare("SELECT * FROM players ORDER BY id DESC").all();
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

export function getPlayerByEmail(email) {
  if (!email) return null;
  return db.prepare('SELECT * FROM players WHERE LOWER(email) = LOWER(?)').get(email.trim());
}

export function deletePlayerByEmail(email) {
  if (!email) return false;
  const player = getPlayerByEmail(email);
  if (!player) return false;
  try {
    db.prepare('DELETE FROM tournament_partner_requests WHERE player_id = ?').run(player.id);
  } catch (e) {}
  db.prepare('DELETE FROM players WHERE id = ?').run(player.id);
  return player;
}

export function getAllActivePlayerEmails() {
  const rows = db.prepare("SELECT email, name FROM players WHERE status = 'approved' AND email IS NOT NULL AND email != ''").all();
  return rows.map(r => ({ email: r.email.trim().toLowerCase(), name: r.name }));
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
  avatar_type,
  is_public,
}) {
  const cleanEmail = email.trim().toLowerCase();
  const existing = getPlayerByEmail(cleanEmail);
  if (existing) {
    if (existing.status === 'approved') {
      throw new Error('Ein Spielerprofil mit dieser E-Mail-Adresse existiert bereits.');
    }
    // Update existing pending registration without creating a duplicate row or altering created_at timestamp
    const updateStmt = db.prepare(`
      UPDATE players SET
        name = ?,
        gender = ?,
        study_program = ?,
        specialization = ?,
        team = ?,
        phone = ?,
        show_phone = ?,
        favorite_player = ?,
        skill_level = ?,
        university_type = ?,
        university_name = ?,
        avatar_type = ?,
        is_public = ?,
        photo_url = CASE WHEN ? != '' THEN ? ELSE photo_url END
      WHERE id = ?
    `);
    updateStmt.run(
      name ? name.trim() : existing.name,
      gender || existing.gender,
      study_program ? study_program.trim() : existing.study_program,
      specialization ? specialization.trim() : existing.specialization,
      team ? team.trim() : existing.team,
      phone ? phone.trim() : existing.phone,
      show_phone ? 1 : 0,
      favorite_player ? favorite_player.trim() : existing.favorite_player,
      skill_level ? skill_level.trim() : existing.skill_level,
      university_type ? university_type.trim() : existing.university_type,
      university_name ? university_name.trim() : existing.university_name,
      avatar_type || existing.avatar_type || 'badminton_smash',
      is_public !== undefined ? (is_public ? 1 : 0) : (existing.is_public !== undefined ? existing.is_public : 1),
      photo_url || '',
      photo_url || '',
      existing.id
    );
    return db.prepare('SELECT * FROM players WHERE id = ?').get(existing.id);
  }

  const stmt = db.prepare(`
    INSERT INTO players (
      name, gender, study_program, specialization, team, email, phone, show_phone,
      favorite_player, skill_level, university_type, university_name, photo_url,
      avatar_type, is_public, status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `);
  const result = stmt.run(
    name ? name.trim() : 'Badminton-Spieler',
    gender || 'men',
    study_program ? study_program.trim() : 'TU Chemnitz',
    specialization ? specialization.trim() : 'Einzel & Doppel',
    team ? team.trim() : 'Hochschulsport & Spielbetrieb',
    cleanEmail,
    phone ? phone.trim() : '',
    show_phone ? 1 : 0,
    favorite_player ? favorite_player.trim() : '',
    skill_level ? skill_level.trim() : 'Fortgeschritten',
    university_type ? university_type.trim() : 'tu_chemnitz',
    university_name ? university_name.trim() : 'TU Chemnitz',
    photo_url || '',
    avatar_type || 'badminton_smash',
    is_public !== undefined ? (is_public ? 1 : 0) : 1
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

// -------------------------------------------------------------
// Tournament Partner Requests
// -------------------------------------------------------------
export function createPartnerRequest({
  player_id,
  player_name,
  player_email,
  requester_name,
  requester_email,
  requester_phone,
  tournament_name,
  discipline,
  message,
}) {
  const stmt = db.prepare(`
    INSERT INTO partner_requests (
      player_id, player_name, player_email, requester_name, requester_email, requester_phone, tournament_name, discipline, message, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'sent')
  `);
  const result = stmt.run(
    player_id,
    player_name,
    player_email,
    requester_name.trim(),
    requester_email.trim().toLowerCase(),
    requester_phone ? requester_phone.trim() : '',
    tournament_name.trim(),
    discipline.trim(),
    message ? message.trim() : ''
  );
  return db.prepare('SELECT * FROM partner_requests WHERE id = ?').get(result.lastInsertRowid);
}

export function getAllPartnerRequests() {
  return db.prepare('SELECT * FROM partner_requests ORDER BY created_at DESC').all();
}

// -------------------------------------------------------------
// Equipment Services (Stringers, Shuttles, Rackets & Accessories)
// -------------------------------------------------------------
export function getAllEquipmentServices() {
  return db.prepare("SELECT * FROM equipment_services WHERE status = 'approved' ORDER BY id ASC").all();
}

export function getPendingEquipmentServices() {
  return db.prepare("SELECT * FROM equipment_services WHERE status = 'pending' ORDER BY created_at DESC").all();
}

export function getEquipmentServiceById(id) {
  if (!id) return null;
  return db.prepare('SELECT * FROM equipment_services WHERE id = ?').get(id);
}

export function getEquipmentServiceByEmail(email) {
  if (!email) return null;
  return db.prepare('SELECT * FROM equipment_services WHERE LOWER(email) = LOWER(?)').get(email.trim());
}

export function registerEquipmentServiceSubmission({
  name,
  service_type,
  email,
  phone,
  show_phone,
  pricing_details,
  available_items,
  location_note,
  experience_years,
  photo_url,
}) {
  const cleanEmail = email.trim().toLowerCase();
  const existing = getEquipmentServiceByEmail(cleanEmail);
  if (existing) {
    if (existing.status === 'approved') {
      throw new Error('Ein Dienstleister- oder Besaiterprofil mit dieser E-Mail-Adresse existiert bereits.');
    }
    // Update existing pending application while retaining original created_at timestamp
    const updateStmt = db.prepare(`
      UPDATE equipment_services SET
        name = ?,
        service_type = ?,
        phone = ?,
        show_phone = ?,
        pricing_details = ?,
        available_items = ?,
        location_note = ?,
        experience_years = ?,
        photo_url = CASE WHEN ? != '' THEN ? ELSE photo_url END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateStmt.run(
      name ? name.trim() : existing.name,
      service_type ? service_type.trim() : existing.service_type,
      phone ? phone.trim() : existing.phone,
      show_phone !== undefined ? (show_phone ? 1 : 0) : existing.show_phone,
      pricing_details ? pricing_details.trim() : existing.pricing_details,
      available_items ? available_items.trim() : existing.available_items,
      location_note ? location_note.trim() : existing.location_note,
      experience_years ? experience_years.trim() : existing.experience_years,
      photo_url || '',
      photo_url || '',
      existing.id
    );
    return db.prepare('SELECT * FROM equipment_services WHERE id = ?').get(existing.id);
  }

  const stmt = db.prepare(`
    INSERT INTO equipment_services (
      name, service_type, email, phone, show_phone,
      pricing_details, available_items, location_note, experience_years, photo_url, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `);
  const result = stmt.run(
    name.trim(),
    service_type ? service_type.trim() : 'Besaitungsservice & Ausrüstung',
    cleanEmail,
    phone ? phone.trim() : '',
    show_phone !== undefined ? (show_phone ? 1 : 0) : 1,
    pricing_details ? pricing_details.trim() : '',
    available_items ? available_items.trim() : '',
    location_note ? location_note.trim() : '',
    experience_years ? experience_years.trim() : '',
    photo_url || ''
  );
  return db.prepare('SELECT * FROM equipment_services WHERE id = ?').get(result.lastInsertRowid);
}

export function approveEquipmentService(id) {
  db.prepare("UPDATE equipment_services SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
  return db.prepare('SELECT * FROM equipment_services WHERE id = ?').get(id);
}

export function rejectEquipmentService(id) {
  return db.prepare('DELETE FROM equipment_services WHERE id = ?').run(id);
}

export function createEquipmentService({
  name,
  service_type,
  email,
  phone,
  show_phone,
  pricing_details,
  available_items,
  location_note,
  experience_years,
  photo_url,
  status,
}) {
  const stmt = db.prepare(`
    INSERT INTO equipment_services (
      name, service_type, email, phone, show_phone,
      pricing_details, available_items, location_note, experience_years, photo_url, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    name.trim(),
    service_type || 'Besaitungsservice',
    email.trim().toLowerCase(),
    phone ? phone.trim() : '',
    show_phone !== undefined ? (show_phone ? 1 : 0) : 1,
    pricing_details || '',
    available_items || '',
    location_note || '',
    experience_years || '',
    photo_url || '',
    status || 'approved'
  );
  return db.prepare('SELECT * FROM equipment_services WHERE id = ?').get(result.lastInsertRowid);
}

export function updateEquipmentService(id, data) {
  const existing = db.prepare('SELECT * FROM equipment_services WHERE id = ?').get(id);
  if (!existing) throw new Error(`Equipment Service #${id} not found`);
  const stmt = db.prepare(`
    UPDATE equipment_services SET
      name = ?,
      service_type = ?,
      email = ?,
      phone = ?,
      show_phone = ?,
      pricing_details = ?,
      available_items = ?,
      location_note = ?,
      experience_years = ?,
      photo_url = CASE WHEN ? != '' THEN ? ELSE photo_url END,
      status = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(
    data.name !== undefined ? data.name.trim() : existing.name,
    data.service_type !== undefined ? data.service_type.trim() : existing.service_type,
    data.email !== undefined ? data.email.trim().toLowerCase() : existing.email,
    data.phone !== undefined ? data.phone.trim() : existing.phone,
    data.show_phone !== undefined ? (data.show_phone ? 1 : 0) : existing.show_phone,
    data.pricing_details !== undefined ? data.pricing_details.trim() : existing.pricing_details,
    data.available_items !== undefined ? data.available_items.trim() : existing.available_items,
    data.location_note !== undefined ? data.location_note.trim() : existing.location_note,
    data.experience_years !== undefined ? data.experience_years.trim() : existing.experience_years,
    data.photo_url || '',
    data.photo_url || '',
    data.status !== undefined ? data.status : existing.status,
    id
  );
  return db.prepare('SELECT * FROM equipment_services WHERE id = ?').get(id);
}

export function deleteEquipmentService(id) {
  return db.prepare('DELETE FROM equipment_services WHERE id = ?').run(id);
}

// -------------------------------------------------------------
// Donation & Sponsorship Settings
// -------------------------------------------------------------
export function getDonationSettings() {
  const row = db.prepare('SELECT * FROM donation_settings WHERE id = 1').get();
  if (!row) {
    return {
      id: 1,
      is_active: 0,
      title: 'Unterstütze das Badminton-Team der TU Chemnitz',
      subtitle: 'Gemeinsam für Training, Ausrüstung & Turniere',
      description: 'Als universitäre Badminton-Gemeinschaft finanzieren wir Trainingsbälle, Ausrüstung und Turnierfahrten für Studierende. Deine Unterstützung hilft uns, den Badmintonsport an der TU Chemnitz weiterzuentwickeln!',
      paypal_me_link: '',
      paypal_email: '',
      bank_recipient: 'TU Chemnitz Badminton Community',
      bank_iban: '',
      bank_bic: '',
      bank_name: '',
      bank_reference: 'Spende Badminton TU Chemnitz',
      sponsor_email: 'gandupradeep2026@gmail.com',
      sponsor_info: 'Möchten Sie oder Ihr Unternehmen das Badminton-Team der TU Chemnitz als offizieller Sponsor oder Partner unterstützen? Wir bieten Trikotwerbung, Turniersponsoring und Logoplatzierungen auf unserer Vereinsplattform.',
    };
  }
  return {
    ...row,
    is_active: Boolean(row.is_active),
  };
}

export function updateDonationSettings({
  is_active,
  title,
  subtitle,
  description,
  paypal_me_link,
  paypal_email,
  bank_recipient,
  bank_iban,
  bank_bic,
  bank_name,
  bank_reference,
  sponsor_email,
  sponsor_info,
}) {
  const existing = getDonationSettings();
  const stmt = db.prepare(`
    INSERT INTO donation_settings (
      id, is_active, title, subtitle, description, paypal_me_link, paypal_email,
      bank_recipient, bank_iban, bank_bic, bank_name, bank_reference,
      sponsor_email, sponsor_info, updated_at
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      is_active = excluded.is_active,
      title = excluded.title,
      subtitle = excluded.subtitle,
      description = excluded.description,
      paypal_me_link = excluded.paypal_me_link,
      paypal_email = excluded.paypal_email,
      bank_recipient = excluded.bank_recipient,
      bank_iban = excluded.bank_iban,
      bank_bic = excluded.bank_bic,
      bank_name = excluded.bank_name,
      bank_reference = excluded.bank_reference,
      sponsor_email = excluded.sponsor_email,
      sponsor_info = excluded.sponsor_info,
      updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(
    is_active !== undefined ? (is_active ? 1 : 0) : (existing.is_active ? 1 : 0),
    title !== undefined ? title.trim() : existing.title,
    subtitle !== undefined ? subtitle.trim() : existing.subtitle,
    description !== undefined ? description.trim() : existing.description,
    paypal_me_link !== undefined ? paypal_me_link.trim() : (existing.paypal_me_link || ''),
    paypal_email !== undefined ? paypal_email.trim().toLowerCase() : (existing.paypal_email || ''),
    bank_recipient !== undefined ? bank_recipient.trim() : (existing.bank_recipient || ''),
    bank_iban !== undefined ? bank_iban.trim().toUpperCase() : (existing.bank_iban || ''),
    bank_bic !== undefined ? bank_bic.trim().toUpperCase() : (existing.bank_bic || ''),
    bank_name !== undefined ? bank_name.trim() : (existing.bank_name || ''),
    bank_reference !== undefined ? bank_reference.trim() : (existing.bank_reference || ''),
    sponsor_email !== undefined ? sponsor_email.trim().toLowerCase() : (existing.sponsor_email || ''),
    sponsor_info !== undefined ? sponsor_info.trim() : (existing.sponsor_info || '')
  );
  return getDonationSettings();
}

// -------------------------------------------------------------
// Looking for Group (LFG) / Spontaneous Game Sessions
// -------------------------------------------------------------
export function getPublicGameSessions() {
  const sessions = db.prepare(`
    SELECT 
      id, title, host_name,
      location_name, location_name AS venue,
      location_address, location_address AS address,
      session_date, start_time, end_time,
      game_format, game_format AS format,
      max_players, current_players, skill_level, cost_note,
      description, status, created_at
    FROM game_sessions 
    WHERE status IN ('open', 'full', 'cancelled')
    ORDER BY session_date ASC, start_time ASC
  `).all();

  for (const s of sessions) {
    const participants = db.prepare(`
      SELECT id, participant_name, skill_level, joined_at 
      FROM game_session_participants 
      WHERE session_id = ? 
      ORDER BY id ASC
    `).all(s.id);
    s.participants = participants;
  }

  return sessions;
}

export function getGameSessionById(id) {
  const s = db.prepare('SELECT * FROM game_sessions WHERE id = ?').get(id);
  if (s) {
    s.venue = s.location_name;
    s.address = s.location_address;
    s.format = s.game_format;
  }
  return s;
}

export function createGameSession(data) {
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
    game_format = 'Doppel',
    format,
    max_players = 4,
    current_players = 1,
    skill_level = 'all',
    cost_note,
    description,
    manage_pin,
    host_pin,
    shuttlecock_type = 'feather',
    intensity_level = 'casual',
    total_cost = 0
  } = data;

  const locName = location_name || venue || 'Feels Good Club Chemnitz';
  const locAddr = location_address || address || '';
  const gFormat = game_format || format || 'Doppel';
  const pin = manage_pin || host_pin || '1234';

  const stmt = db.prepare(`
    INSERT INTO game_sessions (
      title, host_name, host_email, host_phone, location_name, location_address,
      session_date, start_time, end_time, game_format, max_players, current_players,
      skill_level, cost_note, description, manage_pin, status,
      shuttlecock_type, intensity_level, total_cost
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?)
  `);

  const info = stmt.run(
    title ? title.trim() : 'Badminton Spielrunde',
    host_name ? host_name.trim() : 'Spieler',
    host_email.trim().toLowerCase(),
    host_phone ? host_phone.trim() : '',
    locName ? locName.trim() : 'Feels Good Club Chemnitz',
    locAddr ? locAddr.trim() : '',
    session_date.trim(),
    start_time.trim(),
    end_time ? end_time.trim() : '',
    gFormat || 'Doppel',
    Number(max_players) || 4,
    Math.max(1, Number(current_players) || 1),
    skill_level || 'all',
    cost_note ? cost_note.trim() : '',
    description ? description.trim() : '',
    pin ? String(pin).trim() : '1234',
    shuttlecock_type || 'feather',
    intensity_level || 'casual',
    Number(total_cost) || 0
  );

  const newId = Number(info.lastInsertRowid);
  return getGameSessionById(newId);
}

export function joinGameSession({ session_id, participant_name, participant_email, participant_phone, skill_level, message }) {
  const session = getGameSessionById(session_id);
  if (!session) {
    return { error: 'Spielrunde nicht gefunden.', status: 404 };
  }
  if (session.status !== 'open' || session.current_players >= session.max_players) {
    return { error: 'Diese Spielrunde ist leider bereits voll besetzt.', status: 400 };
  }

  // Insert participant
  const insertStmt = db.prepare(`
    INSERT INTO game_session_participants (
      session_id, participant_name, participant_email, participant_phone, skill_level, message
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertStmt.run(
    session_id,
    participant_name.trim(),
    participant_email.trim().toLowerCase(),
    participant_phone ? participant_phone.trim() : '',
    skill_level || 'intermediate',
    message ? message.trim() : ''
  );

  // Increment current_players count
  db.prepare(`
    UPDATE game_sessions 
    SET current_players = current_players + 1,
        status = CASE WHEN current_players + 1 >= max_players THEN 'full' ELSE 'open' END
    WHERE id = ?
  `).run(session_id);

  const updatedSession = getGameSessionById(session_id);
  const participant = db.prepare('SELECT * FROM game_session_participants WHERE session_id = ? ORDER BY id DESC LIMIT 1').get(session_id);

  return { session: updatedSession, participant };
}

export function manageGameSession({ id, pin, action }) {
  const session = getGameSessionById(id);
  if (!session) {
    return { error: 'Spielrunde nicht gefunden.', status: 404 };
  }

  if (String(session.manage_pin).trim() !== String(pin).trim()) {
    return { error: 'Ungültige PIN für diese Spielrunde.', status: 403 };
  }

  if (action === 'close') {
    db.prepare("UPDATE game_sessions SET status = 'full' WHERE id = ?").run(id);
  } else if (action === 'reopen' || action === 'open') {
    db.prepare("UPDATE game_sessions SET status = 'open' WHERE id = ?").run(id);
  } else if (action === 'cancel') {
    db.prepare("UPDATE game_sessions SET status = 'cancelled' WHERE id = ?").run(id);
  } else if (action === 'delete') {
    db.prepare("DELETE FROM game_session_participants WHERE session_id = ?").run(id);
    db.prepare("DELETE FROM game_sessions WHERE id = ?").run(id);
    return { success: true, deleted: true };
  }

  return { success: true, session: getGameSessionById(id) };
}

export function getAllGameSessionsAdmin() {
  const sessions = db.prepare(`
    SELECT *, location_name AS venue, location_address AS address, game_format AS format FROM game_sessions ORDER BY id DESC
  `).all();

  for (const s of sessions) {
    s.participants = db.prepare(`
      SELECT * FROM game_session_participants WHERE session_id = ? ORDER BY id ASC
    `).all(s.id);
  }

  return sessions;
}

export function deleteGameSessionAdmin(id) {
  db.prepare("DELETE FROM game_session_participants WHERE session_id = ?").run(id);
  return db.prepare("DELETE FROM game_sessions WHERE id = ?").run(id);
}

export { db };



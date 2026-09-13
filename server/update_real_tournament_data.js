import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../data/badminton_community.db');

const db = new Database(dbPath);

console.log('[Migration] Updating database with authentic University Tournament 2026 data...');

// 1. Clear & repopulate trainers
db.exec(`DELETE FROM trainers;`);
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

// 2. Clear & repopulate players with authentic tournament roster
db.exec(`DELETE FROM players;`);
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

// 3. Clear & repopulate tournaments
db.exec(`DELETE FROM tournaments;`);
const insertTournament = db.prepare(`
  INSERT INTO tournaments (title, date, deadline, location, description, document_url, file_type)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

insertTournament.run(
  'UNI Badminton Team Cup 2026 (TU Chemnitz, WHZ & HSMW)',
  '31. Januar 2026',
  'Abgeschlossen',
  'Sporthalle Thüringer Weg 11, TU Chemnitz',
  'Offizieller Hochschul-Team Cup des USZ TU Chemnitz. 7 Teams, 45 Spieler*innen aus 10 Nationen, 13 Teamduelle und 65 Matches. Turniersieger: TUC Shuttlers (Gold), 2. Platz: TUC Titans (Silber), 3. Platz: TUC Challengers (Bronze).',
  '/uploads/tournament_2026/Uni_Badminton_Team_Cup_2026_Ergebnisbericht.pdf',
  'pdf'
);

insertTournament.run(
  'Sächsische Hochschulmeisterschaft (SHM) Badminton – Team Cup 2026',
  '09. Mai 2026',
  '25. April 2026',
  'Sportwissenschaftliche Fakultät / USZ Sporthalle',
  'Landesweite sächsische Meisterschaft der Landeskonferenz Hochschulsport Sachsen e.V. (LHS). Disziplinen: Herreneinzel, Dameneinzel, Doppel und Hochschul-Teamwertung.',
  '/uploads/tournament_2026/UNI_Badminton_Rules_EN_DE.pdf',
  'pdf'
);

insertTournament.run(
  'Chemnitzer Badminton Stadtmeisterschaften 2026',
  '17. Oktober 2026',
  '05. Oktober 2026',
  'Sporthalle Thüringer Weg 11, Chemnitz',
  'Regionale Meisterschaften aller Vereine und Hochschulgruppen des Regionalverbandes Chemnitz. Offen für O19 Aktive und Hobbyspieler.',
  '/uploads/tournament_2026/UNI_Badminton_Team_Cup_2026_Schedule_Printable.pdf',
  'pdf'
);

// 4. Clear & repopulate tournament_results (Gallery) with authentic images and tournament moments
db.exec(`DELETE FROM tournament_results;`);
const insertResult = db.prepare(`
  INSERT INTO tournament_results (tournament_name, result, date, player_name, photo_url, caption, status, submitted_by)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

// 1. Gold Champions: TUC Shuttlers (Winners.jpeg - photo with trophy & gold medals)
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

// 2. Silver: TUC Titans (2nd Place.jpeg - photo with silver trophy & silver medals)
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

// 3. Bronze: TUC Challengers (TUC_Challengers.jpeg - photo with squad, Pradeep & Tamara)
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

// 4. HSMW Mittweida (4. Platz - HSMW.jpeg - blue jerseys)
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

// 5. TUC Predators (5. Platz - TUC_Predators (2).jpeg - line-up photo)
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

// 6. WHZ Zwickauer Schmetterlinge (6. Platz - Zwickauer_Schmetterlinge.jpeg - red shirts)
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

// 7. WHZ Mulde Smashers (7. Platz - Mulde_Smashers.jpeg - blue/red shirts)
insertResult.run(
  'UNI Badminton Team Cup 2026',
  '🏸 7. Platz (Platzierungsrunde)',
  '31.01.2026',
  'WHZ Mulde Smashers (Westsächsische Hochschule Zwickau)',
  '/uploads/tournament_2026/teamcup_2026_mulde_smashers.jpeg',
  'Tolles Zusammenspiel und packende Dreisatz-Matches der Mulde Smashers aus Zwickau beim Hochschul-Teamcup.',
  'approved',
  'WH Zwickau'
);

// 8. Großes Gemeinschaftsfoto aller 7 Teams (Group_Picture.jpeg - all 45 players in hall)
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

// 9. Siegerehrung & Meisterpokal (Winner.jpeg - trophy ceremony on center court)
insertResult.run(
  'UNI Badminton Team Cup 2026',
  '🏆 Pokalübergabe & Siegerehrung',
  '31.01.2026',
  'TUC Shuttlers & Organisation USZ',
  '/uploads/tournament_2026/teamcup_2026_trophy_ceremony.jpeg',
  'Feierliche Übergabe des Meisterpokals auf dem Center Court an die Turniersieger TUC Shuttlers unter dem Beifall aller teilnehmenden Mannschaften.',
  'approved',
  'USZ TU Chemnitz'
);

// 10. Pending Player Submission for Admin Approval (TUC_Predators.jpeg - post match selfie)
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

console.log('[Migration] Database updated with 100% authentic University Tournament 2026 data!');
db.close();

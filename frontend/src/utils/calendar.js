/**
 * Calendar & Sharing Utilities (.ics, Google Calendar, WhatsApp)
 * Zero external dependencies, ultra-lightweight (< 2KB)
 */

export const VENUE_AMENITIES = {
  'Feels Good Club Chemnitz': [
    { id: 'showers', icon: '🚿', labelDe: 'Duschen & Umkleiden', labelEn: 'Showers & Lockers' },
    { id: 'parking', icon: '🅿️', labelDe: 'Kostenlose Parkplätze', labelEn: 'Free Parking' },
    { id: 'rental', icon: '🏸', labelDe: 'Schlägerverleih vor Ort', labelEn: 'Racket Rental' },
    { id: 'cafe', icon: '☕', labelDe: 'Bistro & Getränke', labelEn: 'Café & Drinks' },
    { id: 'court_shoes', icon: '👟', labelDe: 'Hallenschuhpflicht', labelEn: 'Non-marking Shoes' },
  ],
  'Sporthalle Thüringer Weg 11': [
    { id: 'showers', icon: '🚿', labelDe: 'Duschen & Umkleiden', labelEn: 'Showers & Lockers' },
    { id: 'parking', icon: '🅿️', labelDe: 'Campus-Parkplätze', labelEn: 'Campus Parking' },
    { id: 'tram', icon: '🚊', labelDe: 'Direkte Tram-Anbindung', labelEn: 'Tram Connection' },
    { id: 'court_shoes', icon: '👟', labelDe: 'Hallenschuhpflicht', labelEn: 'Non-marking Shoes' },
  ],
  'Richard-Hartmann-Halle': [
    { id: 'showers', icon: '🚿', labelDe: 'Duschen & Umkleiden', labelEn: 'Showers & Lockers' },
    { id: 'parking', icon: '🅿️', labelDe: 'Parkplätze vorhanden', labelEn: 'Parking Available' },
    { id: 'court_shoes', icon: '👟', labelDe: 'Hallenschuhpflicht', labelEn: 'Non-marking Shoes' },
  ],
  'default': [
    { id: 'showers', icon: '🚿', labelDe: 'Umkleiden & Duschen', labelEn: 'Changing & Showers' },
    { id: 'court_shoes', icon: '👟', labelDe: 'Hallenschuhpflicht', labelEn: 'Non-marking Shoes' },
  ]
};

export function getVenueAmenities(venueName) {
  if (!venueName) return VENUE_AMENITIES['default'];
  for (const [key, list] of Object.entries(VENUE_AMENITIES)) {
    if (key !== 'default' && venueName.toLowerCase().includes(key.toLowerCase().split(' ')[0])) {
      return list;
    }
  }
  return VENUE_AMENITIES['default'];
}

function formatIcsDateTime(dateStr, timeStr) {
  try {
    const cleanDate = dateStr.replace(/-/g, '');
    const cleanTime = (timeStr || '18:00').replace(/:/g, '').padEnd(4, '0') + '00';
    return `${cleanDate}T${cleanTime}`;
  } catch (e) {
    const now = new Date();
    return now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }
}

/**
 * Generate and download standard RFC 5545 .ics Calendar File
 */
export function downloadIcsCalendarFile(session, isDe = true) {
  if (!session) return;

  const title = session.title || 'Badminton Spielrunde';
  const venue = session.location_name || session.venue || 'Feels Good Club Chemnitz';
  const address = session.location_address || session.address || 'Chemnitz';
  const dtStart = formatIcsDateTime(session.session_date, session.start_time);
  const dtEnd = formatIcsDateTime(session.session_date, session.end_time || '20:00');
  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const shuttleLabel = session.shuttlecock_type === 'plastic' 
    ? (isDe ? '🟡 Plastik/Nylon' : '🟡 Plastic/Nylon') 
    : (session.shuttlecock_type === 'any' ? (isDe ? '🏸 Beliebig' : '🏸 Flexible') : (isDe ? '🪶 Federbälle' : '🪶 Feather'));

  const intensityLabel = session.intensity_level === 'sparring' 
    ? (isDe ? '🔥 Sparring / Matchpraxis' : '🔥 Sparring / Matchplay') 
    : (isDe ? '😊 Casual / Lockeres Spiel' : '😊 Casual / Fun');

  const desc = [
    isDe ? `Badminton Spielrunde: ${title}` : `Badminton Game Session: ${title}`,
    isDe ? `Gastgeber: ${session.host_name || 'Community Member'}` : `Host: ${session.host_name || 'Community Member'}`,
    isDe ? `Spielformat: ${session.game_format || 'Doppel'}` : `Format: ${session.game_format || 'Doubles'}`,
    isDe ? `Bälle: ${shuttleLabel}` : `Shuttles: ${shuttleLabel}`,
    isDe ? `Modus: ${intensityLabel}` : `Intensity: ${intensityLabel}`,
    session.cost_note ? (isDe ? `Kosten: ${session.cost_note}` : `Cost: ${session.cost_note}`) : '',
    session.description ? `Notiz: ${session.description}` : '',
    '',
    isDe ? 'Organisiert über TU Chemnitz Badminton Portal:' : 'Organized via TU Chemnitz Badminton Portal:',
    'https://130-61-242-26.sslip.io/#/sessions'
  ].filter(Boolean).join('\\n');

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TU Chemnitz Badminton Portal//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:tuc-session-${session.id || Date.now()}@tu-chemnitz.de`,
    `DTSTAMP:${nowStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:🏸 Badminton: ${title.replace(/[,;]/g, ' ')}`,
    `DESCRIPTION:${desc}`,
    `LOCATION:${venue.replace(/[,;]/g, ' ')}, ${address.replace(/[,;]/g, ' ')}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsLines], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `badminton-session-${session.id || 'match'}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(link.href);
}

/**
 * Generate Google Calendar Template URL
 */
export function getGoogleCalendarUrl(session, isDe = true) {
  if (!session) return '#';
  const title = encodeURIComponent(`🏸 Badminton: ${session.title || 'Spielrunde'}`);
  const venue = encodeURIComponent(`${session.location_name || session.venue || 'Feels Good Club Chemnitz'}, ${session.location_address || session.address || 'Chemnitz'}`);
  const dtStart = formatIcsDateTime(session.session_date, session.start_time);
  const dtEnd = formatIcsDateTime(session.session_date, session.end_time || '20:00');

  const shuttleLabel = session.shuttlecock_type === 'plastic' 
    ? (isDe ? '🟡 Plastik/Nylon' : '🟡 Plastic/Nylon') 
    : (session.shuttlecock_type === 'any' ? (isDe ? '🏸 Beliebig' : '🏸 Flexible') : (isDe ? '🪶 Federbälle' : '🪶 Feather'));

  const intensityLabel = session.intensity_level === 'sparring' 
    ? (isDe ? '🔥 Sparring / Matchpraxis' : '🔥 Sparring / Matchplay') 
    : (isDe ? '😊 Casual / Lockeres Spiel' : '😊 Casual / Fun');

  const details = encodeURIComponent([
    `Gastgeber: ${session.host_name || 'Spieler'}`,
    `Format: ${session.game_format || 'Doppel'}`,
    `Bälle: ${shuttleLabel}`,
    `Intensität: ${intensityLabel}`,
    session.cost_note ? `Kosten: ${session.cost_note}` : '',
    session.description ? `Info: ${session.description}` : '',
    'Webseite: https://130-61-242-26.sslip.io/#/sessions'
  ].filter(Boolean).join('\n'));

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dtStart}/${dtEnd}&details=${details}&location=${venue}`;
}

/**
 * Generate 1-Click WhatsApp Share URL
 */
export function getWhatsAppShareUrl(session, isDe = true) {
  if (!session) return '#';

  const title = session.title || (isDe ? 'Badminton Spielrunde' : 'Badminton Session');
  const venue = session.location_name || session.venue || 'Feels Good Club Chemnitz';
  const date = session.session_date || 'Demnächst';
  const time = session.start_time || '18:00';
  const max = session.max_players || 4;
  const current = session.current_players || 1;
  const freeSpots = Math.max(0, max - current);

  const shuttleLabel = session.shuttlecock_type === 'plastic' 
    ? '🟡 Plastik' 
    : (session.shuttlecock_type === 'any' ? '🏸 Beliebig' : '🪶 Federbälle');

  const intensityLabel = session.intensity_level === 'sparring' 
    ? '🔥 Sparring / Matchpraxis' 
    : '😊 Casual / Fun';

  let costStr = session.cost_note || '';
  if (session.total_cost && session.total_cost > 0) {
    const perPerson = (session.total_cost / max).toFixed(2).replace('.', ',');
    costStr = `Gesamt ${session.total_cost}€ (nur ca. ${perPerson}€ p.P. bei ${max} Spielern)`;
  }

  const spotsText = freeSpots > 0 
    ? (isDe ? `noch ${freeSpots} freie(r) Platz/Plätze!` : `${freeSpots} spot(s) remaining!`) 
    : (isDe ? 'Aktuell voll besetzt' : 'Currently full');

  const message = [
    isDe ? '🏸 *Badminton Match in Chemnitz!*' : '🏸 *Badminton Match in Chemnitz!*',
    '',
    `🏆 *${title}*`,
    `📍 Ort: ${venue}`,
    `📅 Wann: ${date} um ${time} Uhr`,
    `👥 Format: ${session.game_format || 'Doppel'} (${current}/${max} Spieler • ${spotsText})`,
    `🪶 Bälle: ${shuttleLabel}  |  Modus: ${intensityLabel}`,
    costStr ? `💰 Kosten: ${costStr}` : '',
    '',
    isDe ? '👉 *Jetzt mitspielen & Platz sichern:*' : '👉 *Join now & secure your spot:*',
    'https://130-61-242-26.sslip.io/#/sessions'
  ].filter(Boolean).join('\n');

  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}

/**
 * Mailer Service for TU Chemnitz Badminton Community
 * 
 * Supports:
 * - SMTP (Gmail App Password, Hochschulsport SMTP, Custom Relay)
 * - Secure local server console output (fallback when SMTP is not configured)
 */

export async function sendPasswordResetEmail({ to, approvalCode, expiresMinutes = 15 }) {
  console.log('\n=============================================================');
  console.log('🔒 [ADMIN PASSWORT-RESET BESTÄTIGUNGSCODE]');
  console.log(`Empfänger                    : ${to}`);
  console.log(`6-stelliger Sicherheitscode  : [ ${approvalCode} ]`);
  console.log(`Gültigkeitsdauer             : ${expiresMinutes} Minuten`);
  console.log('HINWEIS: Ohne diesen Code kann NIEMAND das Passwort ändern!');
  console.log('=============================================================\n');

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;

  if (!user || !pass) {
    // Console fallback is secure on laptop home server
    return { success: true, method: 'console' };
  }

  try {
    const nodemailer = await import('nodemailer');
    const isGmail = host === 'smtp.gmail.com' || (!host && user.includes('@gmail.com'));
    const transportConfig = isGmail
      ? {
          service: 'gmail',
          auth: { user, pass },
        }
      : {
          host: host || 'smtp.gmail.com',
          port,
          secure: port === 465,
          auth: { user, pass },
        };

    const transporter = nodemailer.default.createTransport(transportConfig);

    await transporter.sendMail({
      from: `"TU Chemnitz Badminton" <${user}>`,
      to,
      subject: `[Sicherheitscode] Ihr Bestätigungscode zum Zurücksetzen des Admin-Passworts: ${approvalCode}`,
      text: `Hallo Administrator,\n\nEs wurde eine Anfrage zum Zurücksetzen Ihres Admin-Passworts für die TU Chemnitz Badminton Website gestellt.\n\nIhr 6-stelliger Bestätigungscode lautet:\n${approvalCode}\n\nDieser Code ist ${expiresMinutes} Minuten gültig.\n\nFalls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese Nachricht. Ohne diesen Code kann niemand Ihr Passwort ändern.\n\nMit sportlichen Grüßen,\nTU Chemnitz Badminton Community`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff;">
          <div style="display: flex; align-items: center; margin-bottom: 20px;">
            <h2 style="color: #005A36; margin: 0; font-size: 20px; font-weight: 900;">TU Chemnitz Badminton Community</h2>
          </div>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">Hallo Administrator,</p>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">Es wurde eine Anfrage zum Zurücksetzen des Master-Admin-Passworts gestellt. Verwenden Sie den folgenden 6-stelligen Bestätigungscode zur Autorisierung:</p>
          <div style="background-color: #f8fafc; border: 2px dashed #005A36; padding: 18px; border-radius: 14px; text-align: center; margin: 24px 0;">
            <span style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #005A36; font-family: monospace;">${approvalCode}</span>
          </div>
          <p style="color: #64748b; font-size: 12px; line-height: 1.5;">Gültigkeitsdauer: <strong>${expiresMinutes} Minuten</strong>. Geben Sie diesen Code niemals an Dritte weiter.</p>
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 11px; margin: 0;">TU Chemnitz Badminton • Sporthalle Thüringer Weg 11 • 09126 Chemnitz</p>
        </div>
      `,
    });

    return { success: true, method: 'smtp' };
  } catch (err) {
    console.error('[MAILER] Error sending email via SMTP:', err.message);
    return { success: false, error: err.message, method: 'console_fallback' };
  }
}

export async function sendPartnerRequestEmail({
  to,
  toPlayerName,
  requesterName,
  requesterEmail,
  requesterPhone,
  tournamentName,
  discipline,
  message
}) {
  console.log('\n=============================================================');
  console.log('🏸 [TURNIERPARTNER-ANFRAGE]');
  console.log(`Empfänger (Spieler)    : ${toPlayerName} <${to}>`);
  console.log(`Anfragender Spieler    : ${requesterName} <${requesterEmail}>`);
  console.log(`Turnier / Disziplin    : ${tournamentName} • ${discipline}`);
  console.log('=============================================================\n');

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;

  if (!user || !pass) {
    return { success: true, method: 'console_only' };
  }

  try {
    const nodemailer = await import('nodemailer');
    const isGmail = host === 'smtp.gmail.com' || (!host && user.includes('@gmail.com'));
    const transportConfig = isGmail
      ? {
          service: 'gmail',
          auth: { user, pass },
        }
      : {
          host: host || 'smtp.gmail.com',
          port,
          secure: port === 465,
          auth: { user, pass },
        };

    const transporter = nodemailer.default.createTransport(transportConfig);

    await transporter.sendMail({
      from: `"TU Chemnitz Badminton Community" <${user}>`,
      replyTo: requesterEmail,
      to,
      subject: `🏸 Neue Turnierpartner-Anfrage von ${requesterName} für ${tournamentName}`,
      text: `Hallo ${toPlayerName || 'Badminton-Spieler'},\n\n${requesterName} (${requesterEmail}) hat dir über die TU Chemnitz Badminton Website eine Anfrage als Doppel-/Mixed-Partner für das Turnier "${tournamentName}" gesendet!\n\nDisziplin: ${discipline}\nTelefon/WhatsApp: ${requesterPhone || 'Nicht angegeben'}\n\nPersönliche Nachricht:\n${message || 'Keine Nachricht angegeben'}\n\nDu kannst direkt auf diese E-Mail antworten, um mit ${requesterName} in Kontakt zu treten.\n\nMit sportlichen Grüßen,\nTU Chemnitz Badminton Community\nhttps://130-61-242-26.sslip.io`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff;">
          <div style="display: flex; align-items: center; margin-bottom: 20px;">
            <h2 style="color: #005A36; margin: 0; font-size: 20px; font-weight: 900;">🏸 TU Chemnitz Badminton</h2>
          </div>
          <div style="background-color: #f0fdf4; border-left: 4px solid #005A36; padding: 14px 16px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; color: #166534; font-weight: 700; font-size: 15px;">Neue Turnierpartner-Anfrage!</p>
          </div>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">Hallo <strong>${toPlayerName || 'Badminton-Spieler'}</strong>,</p>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">
            <strong>${requesterName}</strong> hat dein Profil auf der Website gesehen und möchte gerne bei folgendem Turnier mit dir als Partner antreten:
          </p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b; font-weight: 600; width: 140px;">🏆 Turnier:</td>
              <td style="padding: 10px 0; color: #0f172a; font-weight: 700;">${tournamentName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b; font-weight: 600;">🏸 Disziplin:</td>
              <td style="padding: 10px 0; color: #005A36; font-weight: 700;">${discipline}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b; font-weight: 600;">👤 Anfragender:</td>
              <td style="padding: 10px 0; color: #0f172a; font-weight: 600;">${requesterName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b; font-weight: 600;">✉️ E-Mail:</td>
              <td style="padding: 10px 0; color: #0f172a;">${requesterEmail}</td>
            </tr>
            ${requesterPhone ? `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b; font-weight: 600;">📱 Telefon / WhatsApp:</td>
              <td style="padding: 10px 0; color: #0f172a;">${requesterPhone}</td>
            </tr>` : ''}
          </table>

          ${message ? `
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
            <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 6px;">Persönliche Nachricht:</span>
            <p style="margin: 0; color: #334155; font-size: 13px; line-height: 1.6; font-style: italic;">"${message}"</p>
          </div>
          ` : ''}

          <div style="text-align: center; margin: 28px 0;">
            <a href="mailto:${requesterEmail}?subject=${encodeURIComponent(`Re: Badminton Turnierpartner Anfrage (${tournamentName})`)}" style="background-color: #005A36; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 14px; display: inline-block;">
              ✉️ Jetzt direkt per E-Mail antworten
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 11px; line-height: 1.5; margin: 0; text-align: center;">
            Diese Nachricht wurde über die TU Chemnitz Badminton Community Plattform gesendet.<br />
            Sporthalle Thüringer Weg 11 • 09126 Chemnitz • <a href="https://130-61-242-26.sslip.io" style="color: #005A36;">130-61-242-26.sslip.io</a>
          </p>
        </div>
      `,
    });

    return { success: true, method: 'smtp' };
  } catch (err) {
    console.error('[MAILER] Error sending partner request email:', err.message);
    return { success: false, error: err.message };
  }
}

export async function sendInquiryToAdminEmail({ inquiry, target }) {
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || process.env.SMTP_USER || 'gandupradeep2026@gmail.com';
  console.log('\n=============================================================');
  console.log('📬 [VERMITTLUNGSANFRAGE AN ADMIN]');
  console.log(`Zielperson             : ${target.name} (${inquiry.target_type}) <${target.email}>`);
  console.log(`Anfragender            : ${inquiry.requester_name} <${inquiry.requester_email}>`);
  console.log(`Nachricht              : ${inquiry.message}`);
  console.log('=============================================================\n');

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;

  if (!user || !pass) {
    return { success: true, method: 'console_only' };
  }

  try {
    const nodemailer = await import('nodemailer');
    const isGmail = host === 'smtp.gmail.com' || (!host && user.includes('@gmail.com'));
    const transportConfig = isGmail
      ? {
          service: 'gmail',
          auth: { user, pass },
        }
      : {
          host: host || 'smtp.gmail.com',
          port,
          secure: port === 465,
          auth: { user, pass },
        };

    const transporter = nodemailer.default.createTransport(transportConfig);

    const typeLabel = inquiry.target_type === 'trainer' ? 'Trainer / Coaching' : 'Besaitung & Ausrüstung';

    await transporter.sendMail({
      from: `"TU Chemnitz Badminton Community" <${user}>`,
      to: adminEmail,
      subject: `📬 [Neue Anfrage #${inquiry.id}] für ${target.name} (${typeLabel})`,
      text: `Hallo Administrator,\n\nes ist eine neue Kontakt- und Vermittlungsanfrage eingegangen!\n\nZielperson: ${target.name} (${typeLabel})\nPrivate E-Mail des Anbieters: ${target.email}\nTelefon des Anbieters: ${target.phone || 'Keine'}\n\nAnfragender: ${inquiry.requester_name}\nE-Mail: ${inquiry.requester_email}\nTelefon/WhatsApp: ${inquiry.requester_phone || 'Keine'}\nWunschtermin/Notiz: ${inquiry.preferred_date || 'Keine'}\n\nNachricht:\n${inquiry.message}\n\nDu kannst die Anfrage im Admin-Dashboard prüfen und mit 1 Klick an ${target.name} weiterleiten:\nhttps://130-61-242-26.sslip.io/#admin`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff;">
          <h2 style="color: #005A36; margin: 0 0 16px 0; font-size: 20px; font-weight: 900;">📬 Neue Vermittlungsanfrage (#${inquiry.id})</h2>
          
          <div style="background-color: #f0fdf4; border-left: 4px solid #005A36; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; color: #166534; font-weight: 700; font-size: 14px;">
              Anfrage für: <strong>${target.name}</strong> (${typeLabel})
            </p>
            <p style="margin: 4px 0 0 0; color: #166534; font-size: 12px;">
              Private Ziel-E-Mail: <strong>${target.email}</strong> ${target.phone ? `• Tel: ${target.phone}` : ''}
            </p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 140px;">👤 Anfragender:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 700;">${inquiry.requester_name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">✉️ E-Mail:</td>
              <td style="padding: 8px 0; color: #0f172a;"><a href="mailto:${inquiry.requester_email}">${inquiry.requester_email}</a></td>
            </tr>
            ${inquiry.requester_phone ? `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">📱 Telefon / WhatsApp:</td>
              <td style="padding: 8px 0; color: #0f172a;">${inquiry.requester_phone}</td>
            </tr>` : ''}
            ${inquiry.preferred_date ? `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">📅 Wunschtermin:</td>
              <td style="padding: 8px 0; color: #0f172a;">${inquiry.preferred_date}</td>
            </tr>` : ''}
          </table>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
            <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 6px;">Nachricht des Spielers:</span>
            <p style="margin: 0; color: #334155; font-size: 13px; line-height: 1.6; font-style: italic;">"${inquiry.message}"</p>
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="https://130-61-242-26.sslip.io/#admin" style="background-color: #005A36; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; font-size: 13px; display: inline-block;">
              ⚡ Im Admin-Dashboard prüfen & weiterleiten
            </a>
          </div>
        </div>
      `,
    });

    return { success: true, method: 'smtp' };
  } catch (err) {
    console.error('[MAILER] Error sending inquiry notification to admin:', err.message);
    return { success: false, error: err.message };
  }
}

export async function sendForwardedInquiryToTarget({ inquiry, target }) {
  console.log('\n=============================================================');
  console.log('📤 [WEITERLEITUNG AN TRAINER / BESAITER]');
  console.log(`Empfänger (Zielperson) : ${target.name} <${target.email}>`);
  console.log(`Anfragender Spieler    : ${inquiry.requester_name} <${inquiry.requester_email}>`);
  console.log('=============================================================\n');

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;

  if (!user || !pass) {
    return { success: true, method: 'console_only' };
  }

  try {
    const nodemailer = await import('nodemailer');
    const isGmail = host === 'smtp.gmail.com' || (!host && user.includes('@gmail.com'));
    const transportConfig = isGmail
      ? {
          service: 'gmail',
          auth: { user, pass },
        }
      : {
          host: host || 'smtp.gmail.com',
          port,
          secure: port === 465,
          auth: { user, pass },
        };

    const transporter = nodemailer.default.createTransport(transportConfig);

    const isTrainer = inquiry.target_type === 'trainer';
    const subjectPrefix = isTrainer ? '🏸 Neue Coaching- / Trainingsanfrage' : '🏸 Neue Besaitungs- / Ausrüstungsanfrage';

    await transporter.sendMail({
      from: `"TU Chemnitz Badminton Community" <${user}>`,
      replyTo: inquiry.requester_email,
      to: target.email,
      subject: `${subjectPrefix} von ${inquiry.requester_name}`,
      text: `Hallo ${target.name},\n\nüber die TU Chemnitz Badminton Website wurde eine Vermittlungsanfrage für dich eingereicht und vom Admin-Team an dich weitergeleitet:\n\nAnfragender: ${inquiry.requester_name}\nE-Mail: ${inquiry.requester_email}\nTelefon/WhatsApp: ${inquiry.requester_phone || 'Keine Angabe'}\nWunschtermin/Details: ${inquiry.preferred_date || 'Keine Angabe'}\n\nNachricht:\n${inquiry.message}\n\nDu kannst direkt auf diese E-Mail antworten, um mit ${inquiry.requester_name} in Kontakt zu treten.\n\nMit sportlichen Grüßen,\nTU Chemnitz Badminton Community\nhttps://130-61-242-26.sslip.io`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff;">
          <h2 style="color: #005A36; margin: 0 0 16px 0; font-size: 20px; font-weight: 900;">🏸 TU Chemnitz Badminton Community</h2>
          
          <div style="background-color: #f0fdf4; border-left: 4px solid #005A36; padding: 14px 16px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; color: #166534; font-weight: 700; font-size: 15px;">Neue Vermittlungsanfrage weitergeleitet!</p>
          </div>

          <p style="color: #334155; font-size: 14px; line-height: 1.6;">Hallo <strong>${target.name}</strong>,</p>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">
            <strong>${inquiry.requester_name}</strong> hat dein Profil auf unserer Plattform gesehen und möchte mit dir in Kontakt treten:
          </p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b; font-weight: 600; width: 140px;">👤 Name:</td>
              <td style="padding: 10px 0; color: #0f172a; font-weight: 700;">${inquiry.requester_name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b; font-weight: 600;">✉️ E-Mail:</td>
              <td style="padding: 10px 0; color: #0f172a;">${inquiry.requester_email}</td>
            </tr>
            ${inquiry.requester_phone ? `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b; font-weight: 600;">📱 Telefon / WhatsApp:</td>
              <td style="padding: 10px 0; color: #0f172a;">${inquiry.requester_phone}</td>
            </tr>` : ''}
            ${inquiry.preferred_date ? `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b; font-weight: 600;">📅 Wunschtermin / Notiz:</td>
              <td style="padding: 10px 0; color: #0f172a;">${inquiry.preferred_date}</td>
            </tr>` : ''}
          </table>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
            <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 6px;">Persönliche Nachricht:</span>
            <p style="margin: 0; color: #334155; font-size: 13px; line-height: 1.6; font-style: italic;">"${inquiry.message}"</p>
          </div>

          <div style="text-align: center; margin: 28px 0;">
            <a href="mailto:${inquiry.requester_email}?subject=${encodeURIComponent(`Re: Badminton Anfrage (${inquiry.requester_name})`)}" style="background-color: #005A36; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 14px; display: inline-block;">
              ✉️ Jetzt direkt per E-Mail antworten
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 11px; line-height: 1.5; margin: 0; text-align: center;">
            Diese Anfrage wurde über die TU Chemnitz Badminton Community weitergeleitet.<br />
            Sporthalle Thüringer Weg 11 • 09126 Chemnitz • <a href="https://130-61-242-26.sslip.io" style="color: #005A36;">130-61-242-26.sslip.io</a>
          </p>
        </div>
      `,
    });

    return { success: true, method: 'smtp' };
  } catch (err) {
    console.error('[MAILER] Error sending forwarded inquiry to target:', err.message);
    return { success: false, error: err.message };
  }
}

export async function sendGameSessionCreatedEmail({ hostEmail, hostName, session, managePin }) {
  console.log('\n=============================================================');
  console.log('🏸 [SPIELRUNDE ERSTELLT - BESTÄTIGUNG]');
  console.log(`Gastgeber: ${hostName} <${hostEmail}>`);
  console.log(`Titel    : ${session.title}`);
  console.log(`Ort & Tag: ${session.location_name} | ${session.session_date} ${session.start_time}`);
  console.log(`PIN      : ${managePin}`);
  console.log('=============================================================\n');

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;

  if (!user || !pass) {
    return { success: true, method: 'console_only' };
  }

  try {
    const nodemailer = await import('nodemailer');
    const isGmail = host === 'smtp.gmail.com' || (!host && user.includes('@gmail.com'));
    const transportConfig = isGmail
      ? { service: 'gmail', auth: { user, pass } }
      : { host: host || 'smtp.gmail.com', port, secure: port === 465, auth: { user, pass } };

    const transporter = nodemailer.default.createTransport(transportConfig);

    await transporter.sendMail({
      from: `"TU Chemnitz Badminton Community" <${user}>`,
      to: hostEmail,
      subject: `🏸 Deine Spielrunde ist online: "${session.title}" (${session.session_date})`,
      text: `Hallo ${hostName},\n\ndeine Badminton-Spielrunde wurde erfolgreich veröffentlicht!\n\nDetails:\n- Titel: ${session.title}\n- Ort: ${session.location_name}${session.location_address ? ` (${session.location_address})` : ''}\n- Datum & Uhrzeit: ${session.session_date} ab ${session.start_time} Uhr\n- Format: ${session.game_format}\n- Spieler gesucht: ${session.max_players - session.current_players} freie Plätze\n\nDeine Verwaltungs-PIN lautet: ${managePin}\nMit dieser PIN kannst du die Spielrunde auf der Website jederzeit als voll markieren oder absagen.\n\nSobald sich Mitspieler eintragen, wirst du sofort per E-Mail benachrichtigt.\n\nLink zur Spielrunden-Übersicht:\nhttps://130-61-242-26.sslip.io/#sessions\n\nViel Spaß beim Match!\nTU Chemnitz Badminton Community`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff;">
          <h2 style="color: #005A36; margin: 0 0 12px 0; font-size: 20px; font-weight: 900;">🏸 Spielrunde erfolgreich online!</h2>
          <p style="color: #334155; font-size: 14px;">Hallo <strong>${hostName}</strong>,</p>
          <p style="color: #334155; font-size: 14px;">deine Ausschreibung für ein Badminton-Match ist ab sofort für alle Spieler sichtbar:</p>

          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <h3 style="margin: 0 0 10px 0; color: #166534; font-size: 16px;">${session.title}</h3>
            <p style="margin: 4px 0; font-size: 13px; color: #15803d;">📍 <strong>Ort:</strong> ${session.location_name} ${session.location_address ? `(${session.location_address})` : ''}</p>
            <p style="margin: 4px 0; font-size: 13px; color: #15803d;">📅 <strong>Termin:</strong> ${session.session_date} • ${session.start_time} Uhr</p>
            <p style="margin: 4px 0; font-size: 13px; color: #15803d;">👥 <strong>Plätze:</strong> ${session.current_players} von ${session.max_players} besetzt (${session.max_players - session.current_players} noch frei)</p>
            ${session.cost_note ? `<p style="margin: 4px 0; font-size: 13px; color: #15803d;">💶 <strong>Kosten:</strong> ${session.cost_note}</p>` : ''}
          </div>

          <div style="background-color: #f8fafc; border: 2px dashed #005A36; border-radius: 12px; padding: 16px; margin: 20px 0; text-align: center;">
            <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; display: block;">Deine persönliche Verwaltungs-PIN:</span>
            <span style="font-size: 28px; font-weight: 900; letter-spacing: 6px; color: #005A36; font-family: monospace;">${managePin}</span>
            <span style="font-size: 11px; color: #64748b; display: block; margin-top: 4px;">Mit dieser PIN kannst du die Spielrunde auf der Website verwalten, schließen oder absagen.</span>
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="https://130-61-242-26.sslip.io/#sessions" style="background-color: #005A36; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; font-size: 13px; display: inline-block;">
              🏸 Zu den Spielrunden auf der Website
            </a>
          </div>
        </div>
      `,
    });

    return { success: true, method: 'smtp' };
  } catch (err) {
    console.error('[MAILER] Error sending session created email:', err.message);
    return { success: false, error: err.message };
  }
}

export async function sendGameSessionJoinNotification({ hostEmail, hostName, session, participant }) {
  console.log('\n=============================================================');
  console.log('🎉 [NEUER MITSPIELER BEIGETRETEN]');
  console.log(`Gastgeber  : ${hostName} <${hostEmail}>`);
  console.log(`Mitspieler : ${participant.participant_name} <${participant.participant_email}>`);
  console.log(`Spielrunde : ${session.title} (${session.session_date})`);
  console.log('=============================================================\n');

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;

  if (!user || !pass) {
    return { success: true, method: 'console_only' };
  }

  try {
    const nodemailer = await import('nodemailer');
    const isGmail = host === 'smtp.gmail.com' || (!host && user.includes('@gmail.com'));
    const transportConfig = isGmail
      ? { service: 'gmail', auth: { user, pass } }
      : { host: host || 'smtp.gmail.com', port, secure: port === 465, auth: { user, pass } };

    const transporter = nodemailer.default.createTransport(transportConfig);

    await transporter.sendMail({
      from: `"TU Chemnitz Badminton Community" <${user}>`,
      replyTo: participant.participant_email,
      to: hostEmail,
      subject: `🎉 Neuer Mitspieler: ${participant.participant_name} hat sich für "${session.title}" eingetragen!`,
      text: `Hallo ${hostName},\n\ngute Neuigkeiten! ${participant.participant_name} spielt bei deiner Spielrunde mit!\n\nSpielrunde: ${session.title}\nOrt: ${session.location_name}\nTermin: ${session.session_date} ab ${session.start_time} Uhr\nAktueller Stand: ${session.current_players} / ${session.max_players} Spieler\n\nKontakt des Mitspielers:\n- Name: ${participant.participant_name}\n- E-Mail: ${participant.participant_email}\n- Telefon/WhatsApp: ${participant.participant_phone || 'Keine'}\n- Spielstärke: ${participant.skill_level || 'Freizeit'}\n${participant.message ? `- Nachricht: "${participant.message}"\n` : ''}\nDu kannst direkt auf diese E-Mail antworten, um dich mit ${participant.participant_name} abzustimmen.\n\nTU Chemnitz Badminton Community`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff;">
          <h2 style="color: #005A36; margin: 0 0 12px 0; font-size: 20px; font-weight: 900;">🎉 Ein neuer Mitspieler ist dabei!</h2>
          <p style="color: #334155; font-size: 14px;">Hallo <strong>${hostName}</strong>,</p>
          <p style="color: #334155; font-size: 14px;">
            <strong>${participant.participant_name}</strong> hat sich für deine Spielrunde <strong>"${session.title}"</strong> eingetragen!
          </p>

          <div style="background-color: #f0fdf4; border-left: 4px solid #005A36; padding: 14px 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0; color: #166534; font-weight: 700; font-size: 14px;">
              Status: ${session.current_players} von ${session.max_players} Plätzen besetzt ${session.status === 'full' ? '🔥 (Jetzt VOLL!)' : `(noch ${session.max_players - session.current_players} frei)`}
            </p>
            <p style="margin: 4px 0 0 0; color: #166534; font-size: 12px;">
              📍 ${session.location_name} • 📅 ${session.session_date} um ${session.start_time} Uhr
            </p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 140px;">👤 Name:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: 700;">${participant.participant_name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">✉️ E-Mail:</td>
              <td style="padding: 8px 0; color: #0f172a;"><a href="mailto:${participant.participant_email}">${participant.participant_email}</a></td>
            </tr>
            ${participant.participant_phone ? `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">📱 Telefon / WhatsApp:</td>
              <td style="padding: 8px 0; color: #0f172a;">${participant.participant_phone}</td>
            </tr>` : ''}
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">🏸 Spielstärke:</td>
              <td style="padding: 8px 0; color: #0f172a;">${participant.skill_level || 'Freizeit'}</td>
            </tr>
          </table>

          ${participant.message ? `
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin: 16px 0;">
            <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 4px;">Nachricht des Mitspielers:</span>
            <p style="margin: 0; color: #334155; font-size: 13px; font-style: italic;">"${participant.message}"</p>
          </div>` : ''}

          <div style="text-align: center; margin: 24px 0;">
            <a href="mailto:${participant.participant_email}?subject=${encodeURIComponent(`Badminton: ${session.title}`)}" style="background-color: #005A36; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; font-size: 13px; display: inline-block;">
              ✉️ ${participant.participant_name} direkt per E-Mail antworten
            </a>
          </div>
        </div>
      `,
    });

    return { success: true, method: 'smtp' };
  } catch (err) {
    console.error('[MAILER] Error sending join notification to host:', err.message);
    return { success: false, error: err.message };
  }
}

export async function sendParticipantConfirmationEmail({ participantEmail, participantName, session, hostName }) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;

  if (!user || !pass) {
    return { success: true, method: 'console_only' };
  }

  try {
    const nodemailer = await import('nodemailer');
    const isGmail = host === 'smtp.gmail.com' || (!host && user.includes('@gmail.com'));
    const transportConfig = isGmail
      ? { service: 'gmail', auth: { user, pass } }
      : { host: host || 'smtp.gmail.com', port, secure: port === 465, auth: { user, pass } };

    const transporter = nodemailer.default.createTransport(transportConfig);

    await transporter.sendMail({
      from: `"TU Chemnitz Badminton Community" <${user}>`,
      to: participantEmail,
      subject: `🏸 Teilnahme bestätigt: "${session.title}" am ${session.session_date}`,
      text: `Hallo ${participantName},\n\ndeine Teilnahme für die Spielrunde "${session.title}" ist bestätigt!\n\nTermin: ${session.session_date} ab ${session.start_time} Uhr\nOrt: ${session.location_name}${session.location_address ? ` (${session.location_address})` : ''}\nGastgeber: ${hostName}\n\nDer Gastgeber hat deine Kontaktdaten erhalten und meldet sich ggf. vor dem Match bei dir.\n\nViel Spaß beim Spiel!\nTU Chemnitz Badminton Community`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff;">
          <h2 style="color: #005A36; margin: 0 0 12px 0; font-size: 20px; font-weight: 900;">🏸 Deine Teilnahme ist bestätigt!</h2>
          <p style="color: #334155; font-size: 14px;">Hallo <strong>${participantName}</strong>,</p>
          <p style="color: #334155; font-size: 14px;">du bist bei der Spielrunde von <strong>${hostName}</strong> dabei:</p>

          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <h3 style="margin: 0 0 8px 0; color: #166534; font-size: 15px;">${session.title}</h3>
            <p style="margin: 4px 0; font-size: 13px; color: #15803d;">📍 <strong>Ort:</strong> ${session.location_name} ${session.location_address ? `(${session.location_address})` : ''}</p>
            <p style="margin: 4px 0; font-size: 13px; color: #15803d;">📅 <strong>Termin:</strong> ${session.session_date} • ${session.start_time} Uhr</p>
            <p style="margin: 4px 0; font-size: 13px; color: #15803d;">👤 <strong>Gastgeber:</strong> ${hostName}</p>
            ${session.cost_note ? `<p style="margin: 4px 0; font-size: 13px; color: #15803d;">💶 <strong>Kosten-Notiz:</strong> ${session.cost_note}</p>` : ''}
          </div>

          <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
            Der Gastgeber wurde benachrichtigt und kann sich bei Bedarf zur Feinabstimmung bei dir melden. Bitte erscheine pünktlich in Sportkleidung mit sauberen Hallenschuhen!
          </p>
        </div>
      `,
    });

    return { success: true, method: 'smtp' };
  } catch (err) {
    console.error('[MAILER] Error sending participant confirmation email:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send 6-Digit OTP Verification Email
 */
export async function sendOtpVerificationEmail({ to, code, scope = 'student_gate', expiresMinutes = 15 }) {
  const scopeDescriptions = {
    app_entry: {
      titleDe: '🎓 Badminton Student Community Login / Registrierung',
      titleEn: '🎓 Badminton Student Community Login / Sign Up',
      descDe: 'Verwende diesen Bestätigungscode, um dich einmalig bei der Badminton Student Community anzumelden und dein Profil freizuschalten.',
      descEn: 'Use this verification code for your one-time sign in to Badminton Student Community and unlock all features.'
    },
    student_gate: {
      titleDe: '🎓 Freischaltung des Spielerverzeichnisses',
      titleEn: '🎓 Student Directory Access Verification',
      descDe: 'Verwende diesen Bestätigungscode, um das Spielerverzeichnis freizuschalten.',
      descEn: 'Use this verification code to unlock the student player directory.'
    },
    register_player: {
      titleDe: '🏸 Spieler-Registrierung bestätigen',
      titleEn: '🏸 Verify Player Registration',
      descDe: 'Verwende diesen Code, um deine E-Mail-Adresse für die Aufnahme in das TU Chemnitz Badminton-Team zu bestätigen.',
      descEn: 'Use this code to verify your email address for joining the TU Chemnitz Badminton player roster.'
    },
    join_session: {
      titleDe: '🤝 Spielteilnahme bestätigen',
      titleEn: '🤝 Confirm Match Spot Booking',
      descDe: 'Verwende diesen Code, um deine Teilnahme an der Spielrunde verbindlich zu bestätigen.',
      descEn: 'Use this code to confirm your spot in the badminton match session.'
    },
    delete_profile: {
      titleDe: '⚠️ Profil-Löschung bestätigen',
      titleEn: '⚠️ Confirm Profile Deletion',
      descDe: 'Achtung: Mit diesem Code bestätigst du die unwiderrufliche Löschung deines Spielerprofils aus der Datenbank.',
      descEn: 'Warning: Using this code will permanently delete your player profile from the database.'
    },
    edit_profile: {
      titleDe: '✏️ Spielerprofil bearbeiten',
      titleEn: '✏️ Edit Player Profile',
      descDe: 'Verwende diesen Bestätigungscode, um dich zu authentifizieren und dein Spielerprofil sicher zu bearbeiten.',
      descEn: 'Use this verification code to authenticate and edit your player profile securely.'
    },
    register_account: {
      titleDe: '✨ Registrierung & E-Mail-Bestätigung',
      titleEn: '✨ Registration & Email Verification',
      descDe: 'Bitte gib diesen 6-stelligen Bestätigungscode ein, um dein Konto bei der Badminton Student Community zu erstellen.',
      descEn: 'Please enter this 6-digit verification code to complete your registration with the Badminton Student Community.'
    },
    reset_password: {
      titleDe: '🔑 Passwort zurücksetzen',
      titleEn: '🔑 Password Reset Code',
      descDe: 'Du hast das Zurücksetzen deines Passworts angefordert. Gib diesen Code ein, um dein neues Passwort festzulegen.',
      descEn: 'You requested to reset your password. Enter this code to set your new password.'
    }
  };

  const info = scopeDescriptions[scope] || scopeDescriptions.student_gate;

  console.log('\n=============================================================');
  console.log('🔑 [OTP SICHERHEITSCODE]');
  console.log(`Empfänger                    : ${to}`);
  console.log(`Zweck                        : ${scope} (${info.titleDe})`);
  console.log(`6-stelliger Bestätigungscode : [ ${code} ]`);
  console.log(`Gültigkeit                   : ${expiresMinutes} Minuten`);
  console.log('=============================================================\n');

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;

  if (!user || !pass) {
    return { success: true, method: 'console_only', code };
  }

  try {
    const nodemailer = await import('nodemailer');
    const isGmail = host === 'smtp.gmail.com' || (!host && user.includes('@gmail.com'));
    const transportConfig = isGmail
      ? { service: 'gmail', auth: { user, pass } }
      : { host: host || 'smtp.gmail.com', port, secure: port === 465, auth: { user, pass } };

    const transporter = nodemailer.default.createTransport(transportConfig);

    await transporter.sendMail({
      from: `"TU Chemnitz Badminton" <${user}>`,
      to,
      subject: `[Sicherheitscode: ${code}] ${info.titleDe}`,
      text: `Hallo,\n\ndein Bestätigungscode für die TU Chemnitz Badminton Community lautet:\n\n[ ${code} ]\n\n${info.descDe}\n\nDieser Code ist ${expiresMinutes} Minuten gültig. Gib ihn niemals an andere Personen weiter.\n\nSportliche Grüße,\nTU Chemnitz Badminton Community`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff;">
          <div style="display: flex; align-items: center; margin-bottom: 16px;">
            <h2 style="color: #005A36; margin: 0; font-size: 20px; font-weight: 900;">TU Chemnitz Badminton</h2>
          </div>
          
          <h3 style="color: #0f172a; margin: 0 0 10px 0; font-size: 16px;">${info.titleDe}</h3>
          <p style="color: #475569; font-size: 13px; line-height: 1.6; margin: 0 0 20px 0;">
            ${info.descDe}
          </p>

          <div style="background: #f0fdf4; border: 2px dashed #005A36; padding: 18px; border-radius: 16px; text-align: center; margin: 20px 0;">
            <span style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #005A36; font-family: monospace;">${code}</span>
          </div>

          <p style="color: #64748b; font-size: 11px; line-height: 1.5; margin-bottom: 0;">
            ⏱️ Gültigkeitsdauer: <strong>${expiresMinutes} Minuten</strong>. Wenn du diese Anfrage nicht gestellt hast, kannst du diese E-Mail einfach ignorieren.
          </p>
        </div>
      `,
    });

    return { success: true, method: 'smtp' };
  } catch (err) {
    console.error('[MAILER] Error sending OTP verification email:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Broadcast notification email to all registered players when a new game session is hosted
 */
export async function sendGameSessionBroadcastEmail({ recipients, session }) {
  if (!Array.isArray(recipients) || recipients.length === 0) return { success: true, count: 0 };

  const validEmails = recipients.filter(email => email && email.includes('@'));
  if (validEmails.length === 0) return { success: true, count: 0 };

  console.log(`[MAILER] Broadcasting game session #${session.id} to ${validEmails.length} registered player(s)`);

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;

  if (!user || !pass) {
    return { success: true, method: 'console_only', count: validEmails.length };
  }

  try {
    const nodemailer = await import('nodemailer');
    const isGmail = host === 'smtp.gmail.com' || (!host && user.includes('@gmail.com'));
    const transportConfig = isGmail
      ? { service: 'gmail', auth: { user, pass } }
      : { host: host || 'smtp.gmail.com', port, secure: port === 465, auth: { user, pass } };

    const transporter = nodemailer.default.createTransport(transportConfig);

    const venue = session.venue || session.location_name || 'Feels Good Club Chemnitz';
    const address = session.address || session.location_address || '';
    const format = session.format || session.game_format || 'Doppel';
    const spotsLeft = Math.max(1, (session.max_players || 4) - (session.current_players || 1));

    // Send using BCC to respect student privacy among players
    await transporter.sendMail({
      from: `"TU Chemnitz Badminton" <${user}>`,
      to: user, // Sender as To
      bcc: validEmails, // All registered players in BCC
      subject: `🏸 Neues Spiel gehostet: ${session.title} (${format}) am ${session.session_date}!`,
      text: `Hallo Badminton-Community!\n\n${session.host_name} hat eine neue Spielrunde gehostet:\n\nFormat: ${format} (${session.skill_level || 'Alle Spielstärken'})\nOrt: ${venue} ${address ? `(${address})` : ''}\nDatum & Zeit: ${session.session_date} von ${session.start_time} bis ${session.end_time || 'Ende'} Uhr\nFreie Plätze: ${spotsLeft} von ${session.max_players}\n\nMöchtest du mitspielen? Klicke auf den folgenden Link:\nhttps://130-61-242-26.sslip.io/#/sessions\n\nSportliche Grüße,\nTU Chemnitz Badminton Community`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff;">
          <div style="background: #005A36; padding: 16px 20px; border-radius: 14px; color: #ffffff; margin-bottom: 20px;">
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; opacity: 0.8;">Community Match-Alert</span>
            <h2 style="margin: 4px 0 0 0; font-size: 18px; font-weight: 900;">🏸 Neues Spiel gehostet!</h2>
          </div>

          <p style="color: #334155; font-size: 14px; line-height: 1.6;">Hallo Badminton-Freunde,</p>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">
            <strong>${session.host_name}</strong> hat gerade eine neue Spielrunde auf unserer Plattform erstellt:
          </p>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin: 18px 0;">
            <h3 style="margin: 0 0 10px 0; color: #005A36; font-size: 16px;">${session.title}</h3>
            <p style="margin: 6px 0; font-size: 13px; color: #334155;">📍 <strong>Ort:</strong> ${venue} ${address ? `(${address})` : ''}</p>
            <p style="margin: 6px 0; font-size: 13px; color: #334155;">📅 <strong>Termin:</strong> ${session.session_date} • ${session.start_time} - ${session.end_time || ''} Uhr</p>
            <p style="margin: 6px 0; font-size: 13px; color: #334155;">🏸 <strong>Format:</strong> ${format} • Niveau: ${session.skill_level || 'Alle'}</p>
            <p style="margin: 6px 0; font-size: 13px; color: #166534; font-weight: bold;">🟢 <strong>Freie Plätze:</strong> Noch ${spotsLeft} Platz/Plätze verfügbar</p>
            ${session.cost_note ? `<p style="margin: 6px 0; font-size: 13px; color: #64748b;">💶 <em>Kosten-Notiz: ${session.cost_note}</em></p>` : ''}
            ${session.description ? `<p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b; font-style: italic;">"${session.description}"</p>` : ''}
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="https://130-61-242-26.sslip.io/#/sessions" style="display: inline-block; background-color: #005A36; color: #ffffff; padding: 12px 24px; border-radius: 12px; font-weight: bold; font-size: 14px; text-decoration: none;">
              🏸 Spielrunde ansehen & Mitspielen
            </a>
          </div>

          <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 24px;">
            Du erhältst diese Nachricht, weil du als aktiver Spieler bei TU Chemnitz Badminton registriert bist.
          </p>
        </div>
      `,
    });

    return { success: true, count: validEmails.length };
  } catch (err) {
    console.error('[MAILER] Error sending game session broadcast:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send personalized VIP invitation to specifically chosen players
 */
export async function sendPersonalSessionInviteEmail({ to, hostName, session }) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;

  if (!user || !pass) {
    return { success: true, method: 'console_only' };
  }

  try {
    const nodemailer = await import('nodemailer');
    const isGmail = host === 'smtp.gmail.com' || (!host && user.includes('@gmail.com'));
    const transportConfig = isGmail
      ? { service: 'gmail', auth: { user, pass } }
      : { host: host || 'smtp.gmail.com', port, secure: port === 465, auth: { user, pass } };

    const transporter = nodemailer.default.createTransport(transportConfig);

    const venue = session.venue || session.location_name || 'Feels Good Club Chemnitz';
    const format = session.format || session.game_format || 'Doppel';

    await transporter.sendMail({
      from: `"TU Chemnitz Badminton" <${user}>`,
      to,
      subject: `🏸 Persönliche Einladung von ${hostName}: Badminton Match am ${session.session_date}!`,
      text: `Hallo!\n\n${hostName} hat dich persönlich zu einer Badminton-Runde eingeladen:\n\n${session.title} (${format})\nOrt: ${venue}\nTermin: ${session.session_date} ab ${session.start_time} Uhr\n\nSichere dir deinen Platz unter:\nhttps://130-61-242-26.sslip.io/#/sessions\n\nViel Spaß!\nTU Chemnitz Badminton`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff;">
          <h2 style="color: #005A36; margin: 0 0 12px 0; font-size: 20px; font-weight: 900;">🏸 Du wurdest persönlich eingeladen!</h2>
          <p style="color: #334155; font-size: 14px;">Hallo,</p>
          <p style="color: #334155; font-size: 14px;"><strong>${hostName}</strong> hat eine Spielrunde erstellt und dich gezielt als Mitspieler eingeladen:</p>

          <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <h3 style="margin: 0 0 8px 0; color: #166534; font-size: 15px;">${session.title}</h3>
            <p style="margin: 4px 0; font-size: 13px; color: #15803d;">📍 <strong>Ort:</strong> ${venue}</p>
            <p style="margin: 4px 0; font-size: 13px; color: #15803d;">📅 <strong>Termin:</strong> ${session.session_date} • ${session.start_time} Uhr</p>
            <p style="margin: 4px 0; font-size: 13px; color: #15803d;">🏸 <strong>Format:</strong> ${format}</p>
          </div>

          <div style="text-align: center; margin: 20px 0;">
            <a href="https://130-61-242-26.sslip.io/#/sessions" style="display: inline-block; background-color: #005A36; color: #ffffff; padding: 12px 24px; border-radius: 12px; font-weight: bold; font-size: 14px; text-decoration: none;">
              👉 Jetzt Platz sichern & Mitspielen
            </a>
          </div>
        </div>
      `,
    });

    return { success: true };
  } catch (err) {
    console.error('[MAILER] Error sending personal invite email:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Confirmation email when a player self-deletes their profile
 */
export async function sendProfileDeletedEmail({ to, playerName }) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;

  if (!user || !pass) return { success: true, method: 'console_only' };

  try {
    const nodemailer = await import('nodemailer');
    const isGmail = host === 'smtp.gmail.com' || (!host && user.includes('@gmail.com'));
    const transportConfig = isGmail
      ? { service: 'gmail', auth: { user, pass } }
      : { host: host || 'smtp.gmail.com', port, secure: port === 465, auth: { user, pass } };

    const transporter = nodemailer.default.createTransport(transportConfig);

    await transporter.sendMail({
      from: `"TU Chemnitz Badminton" <${user}>`,
      to,
      subject: `[Bestätigung] Dein Spielerprofil wurde gelöscht`,
      text: `Hallo ${playerName || ''},\n\ndein Spieler-Profil auf der TU Chemnitz Badminton Plattform wurde auf deinen Wunsch hin vollständig und unwiderruflich aus der Datenbank gelöscht.\n\nFalls du in Zukunft wieder mitspielen möchtest, kannst du dich jederzeit neu registrieren.\n\nSportliche Grüße,\nTU Chemnitz Badminton Community`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff;">
          <h2 style="color: #005A36; margin: 0 0 12px 0; font-size: 18px; font-weight: 900;">Profil erfolgreich gelöscht</h2>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">Hallo <strong>${playerName || ''}</strong>,</p>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">
            dein Spieler-Profil auf der TU Chemnitz Badminton Website wurde auf deinen Wunsch hin vollständig und unwiderruflich aus unserer Datenbank entfernt.
          </p>
          <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
            Du bist jederzeit wieder herzlich willkommen, dich neu anzumelden!
          </p>
        </div>
      `,
    });

    return { success: true };
  } catch (err) {
    console.error('[MAILER] Error sending profile deleted email:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Play Request Notification Email (Discreet contact inquiry)
 */
export async function sendPlayRequestNotificationEmail({
  toEmail,
  toName,
  fromName,
  fromEmail,
  fromPhone,
  message,
  acceptToken
}) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;

  console.log('\n=============================================================');
  console.log('🏸 [SPIELANFRAGE EMPFANGEN]');
  console.log(`An Spieler: ${toName} <${toEmail}>`);
  console.log(`Von       : ${fromName} <${fromEmail}>`);
  console.log(`Nachricht : ${message}`);
  console.log('=============================================================\n');

  if (!user || !pass) return { success: true, method: 'console_only' };

  try {
    const nodemailer = await import('nodemailer');
    const isGmail = host === 'smtp.gmail.com' || (!host && user.includes('@gmail.com'));
    const transportConfig = isGmail
      ? { service: 'gmail', auth: { user, pass } }
      : { host: host || 'smtp.gmail.com', port, secure: port === 465, auth: { user, pass } };

    const transporter = nodemailer.default.createTransport(transportConfig);

    const acceptUrl = `https://130-61-242-26.sslip.io/api/players/requests/accept/${acceptToken}`;

    await transporter.sendMail({
      from: `"Badminton Student Community" <${user}>`,
      to: toEmail,
      subject: `🏸 Neue Spielanfrage von ${fromName}!`,
      text: `Hallo ${toName},\n\n${fromName} hat dir eine Spielanfrage über die Badminton Student Community gesendet!\n\nNachricht von ${fromName}:\n"${message}"\n\n🔒 Deine Kontaktdaten bleiben geschützt, bis du die Anfrage annimmst.\n\nKlicke auf diesen Link, um die Anfrage anzunehmen und eure Kontaktdaten für die Spielabstimmung freizugeben:\n${acceptUrl}\n\nSportliche Grüße,\nBadminton Student Community`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff;">
          <h2 style="color: #005A36; margin: 0 0 12px 0; font-size: 20px; font-weight: 900;">🏸 Neue Badminton-Spielanfrage!</h2>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">Hallo <strong>${toName}</strong>,</p>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">
            <strong>${fromName}</strong> möchte gerne mit dir Badminton spielen und hat dir folgende Nachricht hinterlassen:
          </p>

          <div style="background-color: #f8fafc; border-left: 4px solid #005A36; padding: 16px; border-radius: 10px; margin: 20px 0;">
            <p style="margin: 0; color: #1e293b; font-size: 14px; font-style: italic;">
              "${message}"
            </p>
          </div>

          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 14px; border-radius: 12px; margin: 20px 0;">
            <p style="margin: 0; color: #166534; font-size: 12px; line-height: 1.5;">
              🔒 <strong>Datenschutz-Garantie:</strong> Deine Kontaktdaten (Telefon & E-Mail) sind aktuell geschützt. Sie werden für ${fromName} erst sichtbar, wenn du diese Anfrage annimmst.
            </p>
          </div>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${acceptUrl}" style="background-color: #005A36; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 14px; font-weight: 800; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(0,90,54,0.25);">
              ✅ Spielanfrage annehmen & Kontaktdaten teilen
            </a>
          </div>

          <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
            Badminton Student Community • Wenn du nicht antworten möchtest, kannst du diese E-Mail einfach ignorieren.
          </p>
        </div>
      `,
    });

    return { success: true };
  } catch (err) {
    console.error('[MAILER] Error sending play request email:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Play Request Accepted Notification Email
 */
export async function sendPlayRequestAcceptedNotificationEmail({
  toEmail,
  toName,
  accepterName,
  accepterEmail,
  accepterPhone,
  replyMessage
}) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;

  if (!user || !pass) return { success: true, method: 'console_only' };

  try {
    const nodemailer = await import('nodemailer');
    const isGmail = host === 'smtp.gmail.com' || (!host && user.includes('@gmail.com'));
    const transportConfig = isGmail
      ? { service: 'gmail', auth: { user, pass } }
      : { host: host || 'smtp.gmail.com', port, secure: port === 465, auth: { user, pass } };

    const transporter = nodemailer.default.createTransport(transportConfig);

    await transporter.sendMail({
      from: `"Badminton Student Community" <${user}>`,
      replyTo: accepterEmail,
      to: toEmail,
      subject: `🎉 ${accepterName} hat deine Spielanfrage angenommen!`,
      text: `Hallo ${toName},\n\ngroßartige Neuigkeiten! ${accepterName} hat deine Badminton-Spielanfrage angenommen.\n\nKontaktdaten von ${accepterName}:\n- E-Mail: ${accepterEmail}\n${accepterPhone ? `- Telefon / WhatsApp: ${accepterPhone}\n` : ''}${replyMessage ? `\nNachricht:\n"${replyMessage}"\n` : ''}\nIhr könnt euch nun direkt absprechen!\n\nSportliche Grüße,\nBadminton Student Community`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff;">
          <h2 style="color: #005A36; margin: 0 0 12px 0; font-size: 20px; font-weight: 900;">🎉 Spielanfrage angenommen!</h2>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">Hallo <strong>${toName}</strong>,</p>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">
            <strong>${accepterName}</strong> hat deine Spielanfrage angenommen! Ihr könnt euch nun direkt für ein Spiel verabreden.
          </p>

          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 18px; border-radius: 14px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #166534; font-size: 15px;">Kontaktdaten von ${accepterName}:</h4>
            <p style="margin: 6px 0; font-size: 14px; color: #15803d;">✉️ <strong>E-Mail:</strong> <a href="mailto:${accepterEmail}" style="color: #005A36; font-weight: 700;">${accepterEmail}</a></p>
            ${accepterPhone ? `<p style="margin: 6px 0; font-size: 14px; color: #15803d;">📱 <strong>Telefon / WhatsApp:</strong> <a href="https://wa.me/${accepterPhone.replace(/[^0-9]/g, '')}" style="color: #005A36; font-weight: 700;">${accepterPhone}</a></p>` : ''}
          </div>

          ${replyMessage ? `
          <div style="background-color: #f8fafc; border-left: 4px solid #005A36; padding: 14px; border-radius: 8px; margin: 16px 0;">
            <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Antwort von ${accepterName}:</span>
            <p style="margin: 4px 0 0 0; color: #334155; font-size: 13px; font-style: italic;">"${replyMessage}"</p>
          </div>` : ''}

          <div style="text-align: center; margin: 24px 0;">
            <a href="mailto:${accepterEmail}?subject=Badminton%20Spiel" style="background-color: #005A36; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; font-size: 13px; display: inline-block;">
              ✉️ ${accepterName} per E-Mail schreiben
            </a>
          </div>
        </div>
      `,
    });

    return { success: true };
  } catch (err) {
    console.error('[MAILER] Error sending accepted request notification:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send Match Invitation Email to a Player (Accept / Reject 1-Click)
 */
export async function sendMatchInvitationEmail({
  inviteeEmail,
  inviteeName,
  inviterName,
  session,
  token
}) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;

  console.log('\n=============================================================');
  console.log('💌 [MATCH-EINLADUNG]');
  console.log(`Eingeladener Spieler : ${inviteeName} <${inviteeEmail}>`);
  console.log(`Gastgeber (Host)     : ${inviterName}`);
  console.log(`Spielrunde           : ${session.title} (${session.session_date})`);
  console.log('=============================================================\n');

  if (!user || !pass) return { success: true, method: 'console_only' };

  try {
    const nodemailer = await import('nodemailer');
    const isGmail = host === 'smtp.gmail.com' || (!host && user.includes('@gmail.com'));
    const transportConfig = isGmail
      ? { service: 'gmail', auth: { user, pass } }
      : { host: host || 'smtp.gmail.com', port, secure: port === 465, auth: { user, pass } };

    const transporter = nodemailer.default.createTransport(transportConfig);

    const acceptUrl = `https://130-61-242-26.sslip.io/api/game-sessions/invitations/respond/${token}?action=accept`;
    const rejectUrl = `https://130-61-242-26.sslip.io/api/game-sessions/invitations/respond/${token}?action=reject`;

    await transporter.sendMail({
      from: `"Badminton Student Community" <${user}>`,
      to: inviteeEmail,
      subject: `🏸 Match-Einladung: ${inviterName} lädt dich zu "${session.title}" ein!`,
      text: `Hallo ${inviteeName},\n\n${inviterName} hat dich zu einer Badminton-Spielrunde eingeladen!\n\nDetails:\n- Titel: ${session.title}\n- Ort: ${session.location_name}\n- Datum: ${session.session_date} ab ${session.start_time} Uhr\n\nTeilnahme annehmen:\n${acceptUrl}\n\nAblehnen:\n${rejectUrl}\n\nSportliche Grüße,\nBadminton Student Community`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff;">
          <h2 style="color: #005A36; margin: 0 0 12px 0; font-size: 20px; font-weight: 900;">🏸 Du bist eingeladen!</h2>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">Hallo <strong>${inviteeName}</strong>,</p>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">
            <strong>${inviterName}</strong> hat eine Spielrunde organisiert und lädt dich persönlich zum Mitspielen ein:
          </p>

          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 18px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #166534; font-size: 16px;">${session.title}</h3>
            <p style="margin: 4px 0; font-size: 13px; color: #15803d;">📍 <strong>Ort:</strong> ${session.location_name}</p>
            <p style="margin: 4px 0; font-size: 13px; color: #15803d;">📅 <strong>Termin:</strong> ${session.session_date} • ${session.start_time} Uhr</p>
            <p style="margin: 4px 0; font-size: 13px; color: #15803d;">🏸 <strong>Format:</strong> ${session.game_format || 'Doppel'}</p>
          </div>

          <div style="display: flex; gap: 12px; justify-content: center; margin: 28px 0;">
            <a href="${acceptUrl}" style="background-color: #005A36; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 800; font-size: 14px; display: inline-block;">
              ✅ Einladung annehmen
            </a>
            <a href="${rejectUrl}" style="background-color: #f1f5f9; color: #64748b; text-decoration: none; padding: 14px 20px; border-radius: 12px; font-weight: 700; font-size: 13px; display: inline-block; border: 1px solid #cbd5e1;">
              ❌ Ablehnen
            </a>
          </div>

          <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
            Badminton Student Community • 1-Klick Antwort ohne Passwort
          </p>
        </div>
      `,
    });

    return { success: true };
  } catch (err) {
    console.error('[MAILER] Error sending match invite email:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Notify Host when an invited player accepts or rejects
 */
export async function sendInvitationResponseToHostEmail({
  hostEmail,
  hostName,
  inviteeName,
  session,
  action
}) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;

  if (!user || !pass) return { success: true, method: 'console_only' };

  const isAccept = action === 'accepted' || action === 'accept';

  try {
    const nodemailer = await import('nodemailer');
    const isGmail = host === 'smtp.gmail.com' || (!host && user.includes('@gmail.com'));
    const transportConfig = isGmail
      ? { service: 'gmail', auth: { user, pass } }
      : { host: host || 'smtp.gmail.com', port, secure: port === 465, auth: { user, pass } };

    const transporter = nodemailer.default.createTransport(transportConfig);

    await transporter.sendMail({
      from: `"Badminton Student Community" <${user}>`,
      to: hostEmail,
      subject: `${isAccept ? '✅' : '❌'} ${inviteeName} hat deine Match-Einladung ${isAccept ? 'angenommen' : 'abgelehnt'}!`,
      text: `Hallo ${hostName},\n\n${inviteeName} hat deine Einladung zu "${session.title}" (${session.session_date}) ${isAccept ? 'angenommen und ist als Mitspieler eingetragen!' : 'leider abgelehnt.'}\n\nSportliche Grüße,\nBadminton Student Community`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff;">
          <h2 style="color: #005A36; margin: 0 0 12px 0; font-size: 18px; font-weight: 900;">
            ${isAccept ? '🎉 Einladung angenommen!' : 'ℹ️ Einladung abgelehnt'}
          </h2>
          <p style="color: #334155; font-size: 14px;">Hallo <strong>${hostName}</strong>,</p>
          <p style="color: #334155; font-size: 14px;">
            <strong>${inviteeName}</strong> hat deine Einladung für die Spielrunde <strong>"${session.title}"</strong> am <strong>${session.session_date}</strong> ${isAccept ? 'angenommen!' : 'abgelehnt.'}
          </p>
          ${isAccept ? `
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 14px; border-radius: 12px; margin: 16px 0;">
            <p style="margin: 0; color: #166534; font-weight: 700; font-size: 13px;">
              ✅ ${inviteeName} wurde automatisch als Mitspieler zur Spielrunde hinzugefügt.
            </p>
          </div>` : ''}
          <div style="text-align: center; margin: 20px 0;">
            <a href="https://130-61-242-26.sslip.io/#sessions" style="background-color: #005A36; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 10px; font-weight: 700; font-size: 13px; display: inline-block;">
              🏸 Spielrunden ansehen
            </a>
          </div>
        </div>
      `,
    });

    return { success: true };
  } catch (err) {
    console.error('[MAILER] Error sending invite response to host:', err.message);
    return { success: false, error: err.message };
  }
}

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


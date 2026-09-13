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

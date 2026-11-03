import React from 'react';
import { useLanguage } from '../context/LanguageContext';

// Impressum (§ 5 DDG, § 18 Abs. 2 MStV) and Datenschutzerklärung (Art. 13 DSGVO).
// The German text is binding, the English text is a convenience translation.
const OPERATOR = {
  name: 'Pradeep Gandu',
  street: 'Bernsdorfer Str. 115',
  city: '09126 Chemnitz',
  country: 'Deutschland',
  email: 'gandupradeep2026@gmail.com',
};

const IMPRESSUM = {
  de: {
    title: 'Impressum',
    sections: [
      ['Angaben gemäß § 5 DDG', [`${OPERATOR.name}`, OPERATOR.street, OPERATOR.city, OPERATOR.country]],
      ['Kontakt', [`E-Mail: ${OPERATOR.email}`]],
      ['Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV', [`${OPERATOR.name}, Anschrift wie oben`]],
      ['Hinweis', [
        'Diese Website ist ein privates, unabhängiges Community-Projekt von Badmintonspielerinnen und -spielern in Chemnitz. Sie wird nicht von der Technischen Universität Chemnitz oder ihrem Universitätssportzentrum (USZ) betrieben und ist kein offizielles Angebot der Universität.',
        'Für die Inhalte verlinkter externer Seiten sind ausschließlich deren Betreiber verantwortlich.',
      ]],
    ],
  },
  en: {
    title: 'Legal Notice (Impressum)',
    sections: [
      ['Information according to § 5 DDG', [`${OPERATOR.name}`, OPERATOR.street, OPERATOR.city, 'Germany']],
      ['Contact', [`E-mail: ${OPERATOR.email}`]],
      ['Responsible for content (§ 18 (2) MStV)', [`${OPERATOR.name}, address as above`]],
      ['Note', [
        'This website is a private, independent community project of badminton players in Chemnitz. It is not run by Chemnitz University of Technology or its University Sports Centre (USZ) and is not an official university service.',
        'The operators of linked external sites are solely responsible for their content.',
      ]],
    ],
  },
};

const DATENSCHUTZ = {
  de: {
    title: 'Datenschutzerklärung',
    sections: [
      ['1. Verantwortlicher', [
        `${OPERATOR.name}, ${OPERATOR.street}, ${OPERATOR.city}, E-Mail: ${OPERATOR.email}`,
      ]],
      ['2. Hosting und Server-Logfiles', [
        'Die Website läuft auf einem Server der Oracle Cloud Infrastructure (Oracle Corporation) in einem Rechenzentrum in der EU.',
        'Bei jedem Aufruf speichert der Webserver IP-Adresse, Datum und Uhrzeit, aufgerufene Adresse, Statuscode und Browserkennung in Logdateien. Das dient dem sicheren Betrieb und der Abwehr von Angriffen (Art. 6 Abs. 1 lit. f DSGVO). Die Logdateien werden nach 14 Tagen gelöscht.',
      ]],
      ['3. Benutzerkonto', [
        'Für ein Konto speichern wir E-Mail-Adresse, Name, Hochschule, Rolle (Spieler, Trainer, Anbieter) und Ihr Passwort ausschließlich als gesalzenen scrypt-Hash. Rechtsgrundlage ist die Bereitstellung des Kontos (Art. 6 Abs. 1 lit. b DSGVO). Die Daten bleiben gespeichert, bis Sie Ihr Konto löschen oder die Löschung per E-Mail verlangen.',
      ]],
      ['4. Profile von Spielern, Trainern und Anbietern', [
        'Freiwillige Profilangaben (z. B. Studiengang, Team, Spielstärke, Foto, Telefonnummer) werden erst nach Prüfung durch die Administration veröffentlicht. Telefonnummer und E-Mail-Adresse sind nur sichtbar, wenn Sie das in den Privatsphäre-Einstellungen erlauben. Rechtsgrundlage ist Ihre Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), die Sie jederzeit durch Bearbeiten oder Löschen des Profils widerrufen können.',
      ]],
      ['5. Kontaktanfragen, Spielrunden und Partneranfragen', [
        'Wenn Sie eine Anfrage senden oder einer Spielrunde beitreten, speichern wir die Angaben im Formular und leiten sie per E-Mail an die angefragte Person weiter (Art. 6 Abs. 1 lit. b DSGVO). Die Einträge werden gelöscht, sobald die Anfrage erledigt ist.',
      ]],
      ['6. E-Mail-Versand', [
        'Bestätigungscodes und Benachrichtigungen versenden wir über den SMTP-Dienst von Google (Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland). Dabei verarbeitet Google Empfängeradresse und Nachrichteninhalt. Eine Übermittlung in die USA ist möglich, Google ist nach dem EU-US Data Privacy Framework zertifiziert.',
      ]],
      ['7. Speicher im Browser', [
        'Die Website setzt keine Cookies und nutzt keine Analyse- oder Trackingdienste. Im lokalen Speicher Ihres Browsers (localStorage) werden nur technisch nötige Werte abgelegt: Sprache, Anmeldetoken und Ihre Entscheidungen zu externen Inhalten (§ 25 Abs. 2 TDDDG). Sie können diese Werte jederzeit über die Browsereinstellungen löschen.',
      ]],
      ['8. YouTube-Videos und Google Maps', [
        'Videos und die Karte werden erst geladen, wenn Sie auf „YouTube laden“ bzw. „Google Maps laden“ klicken. Erst dann wird Ihre IP-Adresse an Google Ireland Limited übertragen, und Google kann Cookies setzen. Rechtsgrundlage ist Ihre Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Sie widerrufen sie, indem Sie die Websitedaten im Browser löschen. Videos werden über youtube-nocookie.com eingebunden.',
      ]],
      ['9. Spenden', [
        'Spendenlinks führen zu PayPal (PayPal (Europe) S.à r.l. et Cie, S.C.A., Luxemburg). Was dort mit Ihren Daten geschieht, regelt die Datenschutzerklärung von PayPal. Bei einer Überweisung erhalten wir die üblichen Bankdaten.',
      ]],
      ['10. Ihre Rechte', [
        'Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch (Art. 15 bis 21 DSGVO) sowie auf Widerruf erteilter Einwilligungen. Eine E-Mail an die oben genannte Adresse genügt.',
        'Sie können sich bei einer Datenschutz-Aufsichtsbehörde beschweren, z. B. bei der Sächsischen Datenschutz- und Transparenzbeauftragten, Devrientstraße 5, 01067 Dresden.',
      ]],
      ['Stand', ['November 2026']],
    ],
  },
  en: {
    title: 'Privacy Policy',
    sections: [
      ['1. Controller', [
        `${OPERATOR.name}, ${OPERATOR.street}, ${OPERATOR.city}, Germany, e-mail: ${OPERATOR.email}`,
      ]],
      ['2. Hosting and server logs', [
        'The site runs on an Oracle Cloud Infrastructure server (Oracle Corporation) in a data centre in the EU.',
        'For every request the web server logs IP address, date and time, requested address, status code and browser identifier. This keeps the service secure (Art. 6 (1) (f) GDPR). Logs are deleted after 14 days.',
      ]],
      ['3. User account', [
        'For an account we store e-mail address, name, university, role (player, coach, provider) and your password only as a salted scrypt hash (Art. 6 (1) (b) GDPR). The data is kept until you delete your account or ask for deletion by e-mail.',
      ]],
      ['4. Player, coach and provider profiles', [
        'Optional profile details (e.g. study programme, team, level, photo, phone number) are published only after review by the administrators. Phone number and e-mail are shown only if you allow it in the privacy settings. The legal basis is your consent (Art. 6 (1) (a) GDPR), which you can withdraw at any time by editing or deleting your profile.',
      ]],
      ['5. Contact requests, game sessions and partner requests', [
        'When you send a request or join a game session, we store the form data and forward it by e-mail to the person concerned (Art. 6 (1) (b) GDPR). Entries are deleted once the request is settled.',
      ]],
      ['6. E-mail delivery', [
        'Verification codes and notifications are sent through Google\'s SMTP service (Google Ireland Limited, Dublin, Ireland), which processes the recipient address and message content. Transfer to the USA is possible, Google is certified under the EU-US Data Privacy Framework.',
      ]],
      ['7. Browser storage', [
        'The site sets no cookies and uses no analytics or tracking. Your browser\'s localStorage holds only technically necessary values: language, login token and your choices about external content. You can delete them in your browser settings at any time.',
      ]],
      ['8. YouTube videos and Google Maps', [
        'Videos and the map load only after you click "Load YouTube" or "Load Google Maps". Only then is your IP address sent to Google Ireland Limited, which may set cookies. The legal basis is your consent (Art. 6 (1) (a) GDPR), which you withdraw by clearing the site data in your browser. Videos are embedded via youtube-nocookie.com.',
      ]],
      ['9. Donations', [
        'Donation links lead to PayPal (PayPal (Europe) S.à r.l. et Cie, S.C.A., Luxembourg), whose privacy policy applies there. Bank transfers give us the usual bank details.',
      ]],
      ['10. Your rights', [
        'You have the right to access, rectification, erasure, restriction, data portability and objection (Art. 15 to 21 GDPR) and to withdraw consent. An e-mail to the address above is enough.',
        'You may complain to a data protection authority, e.g. the Saxon Data Protection and Transparency Commissioner, Devrientstraße 5, 01067 Dresden.',
      ]],
      ['Last updated', ['November 2026']],
    ],
  },
};

export default function LegalPage({ kind }) {
  const { language } = useLanguage();
  const lang = language === 'de' ? 'de' : 'en';
  const page = (kind === 'impressum' ? IMPRESSUM : DATENSCHUTZ)[lang];

  return (
    <article className="max-w-3xl mx-auto pb-12 space-y-6">
      <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">{page.title}</h1>
      {lang === 'en' && (
        <p className="text-xs text-slate-500">This is a translation for convenience. The German version is binding.</p>
      )}
      {page.sections.map(([heading, paragraphs]) => (
        <section key={heading} className="space-y-1.5">
          <h2 className="font-bold text-sm sm:text-base text-slate-900">{heading}</h2>
          {paragraphs.map((text) => (
            <p key={text} className="text-xs sm:text-sm text-slate-600 leading-relaxed">{text}</p>
          ))}
        </section>
      ))}
    </article>
  );
}

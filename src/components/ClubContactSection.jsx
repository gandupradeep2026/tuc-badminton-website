import React from 'react';
import { Mail, Phone, Users, ShieldCheck, MapPin } from 'lucide-react';
import { ANSPRECHPARTNER } from '../data/mockData';

export default function ClubContactSection() {
  return (
    <section id="verein" className="py-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          
          {/* Left: Über Uns description like badminton-roehrsdorf.de */}
          <div className="lg:col-span-6 space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-tuc-800 dark:text-emerald-400">
              Verein & Hochschulsport
            </span>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-900 dark:text-white">
              Über die TU Chemnitz Badminton Community
            </h2>
            
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Die Badminton-Abteilung der TU Chemnitz steht für sportliche Leidenschaft, Teamgeist und Gemeinschaft. In unserer Gemeinschaft sind Spielerinnen und Spieler verschiedener Alters- und Leistungsklassen aktiv – von internationalen Studierenden und Einsteigern bis hin zu aktiven Wettkampfteams in der Sachsenliga und Bezirksliga.
            </p>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Neben dem sportlichen Erfolg bei Hochschulmeisterschaften legen wir großen Wert auf ein offenes Vereinsleben, die Förderung des Nachwuchses und den Zusammenhalt innerhalb unserer Trainingsgruppen an der Sporthalle Thüringer Weg 11.
            </p>

            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                Gegründet an der TU Chemnitz
              </span>
              <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                Mitglied im BVS (Badminton-Verband Sachsen)
              </span>
              <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                Universitäts-Sportzentrum (USZ)
              </span>
            </div>
          </div>

          {/* Right: Ansprechpartner cards like badminton-roehrsdorf.de */}
          <div className="lg:col-span-6 space-y-4">
            <h3 className="font-display font-black text-xl text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800">
              Ansprechpartner & Leitung
            </h3>

            <div className="space-y-3">
              {ANSPRECHPARTNER.map((person, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-tuc-800 dark:text-emerald-400">
                      {person.role}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {person.name}
                    </h4>
                  </div>

                  <div className="flex flex-col sm:items-end gap-1 text-slate-600 dark:text-slate-400">
                    <a
                      href={`mailto:${person.email}`}
                      className="flex items-center gap-1.5 hover:text-tuc-800 dark:hover:text-emerald-400 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{person.email}</span>
                    </a>
                    {person.phone && (
                      <a
                        href={`tel:${person.phone.replace(/\s+/g, '')}`}
                        className="flex items-center gap-1.5 hover:text-tuc-800 dark:hover:text-emerald-400 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{person.phone}</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

import React from 'react';
import { Trophy, Calendar, Users, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Hero({ onOpenRegister }) {
  return (
    <section className="pt-24 pb-14 sm:pt-28 sm:pb-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tuc-100 dark:bg-tuc-950 text-tuc-800 dark:text-emerald-400 text-xs font-bold">
              <span>TU Chemnitz • Abteilung Badminton & Hochschulsport</span>
            </div>

            <h1 className="font-display font-black text-3xl sm:text-5xl text-slate-900 dark:text-white tracking-tight leading-tight">
              Badminton mit Leidenschaft, Teamgeist und Gemeinschaft.
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              Willkommen bei der Badminton-Gemeinschaft der TU Chemnitz. Ob Einsteiger, Hobbyspieler oder Wettkampfkader in der Sachsenliga – bei uns steht die Freude am Sport und faire Ballwechsel im Mittelpunkt.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-3">
              <a
                href="#mannschaften"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-tuc-800 hover:bg-tuc-700 transition-colors shadow-sm"
              >
                <Users className="w-4 h-4" />
                <span>Mannschaften ansehen</span>
              </a>

              <a
                href="#aktuelles"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <Calendar className="w-4 h-4 text-tuc-800 dark:text-emerald-400" />
                <span>Termine & Spielplan</span>
              </a>

              <a
                href="#schedule"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <span>Trainingszeiten</span>
              </a>

              <button
                onClick={() => onOpenRegister('trial')}
                className="text-xs font-bold text-tuc-800 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Probetraining anfragen</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right: Clean Club Stats / Facility Card */}
          <div className="lg:col-span-5">
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-tuc-800 dark:text-emerald-400">
                  Heimspielstätte
                </span>
                <span className="text-[11px] font-mono text-slate-400">6 Spielfelder</span>
              </div>

              <div>
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                  Sporthalle Thüringer Weg 11
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  09126 Chemnitz • Campus Reichenhainer Straße
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px] block uppercase">Bodenbelag</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">Holzschwingboden</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px] block uppercase">Haltestelle</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">Tram 3 "TU Campus"</span>
                </div>
              </div>

              <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium pt-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Saubere Hallenschuhe (non-marking) zwingend erforderlich</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

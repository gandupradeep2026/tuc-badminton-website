import React, { useState } from 'react';
import { Users, Trophy, ChevronRight, Award, Clock } from 'lucide-react';
import { TEAMS } from '../data/mockData';

export default function TeamsSection() {
  const [selectedTeam, setSelectedTeam] = useState(null);

  return (
    <section id="mannschaften" className="py-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header matching badminton-roehrsdorf.de style */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-tuc-800 dark:text-emerald-400">
              Spielbetrieb & Liga
            </span>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-900 dark:text-white mt-1">
              Unsere Mannschaften
            </h2>
          </div>
          <span className="text-xs text-slate-500 mt-2 sm:mt-0 font-medium">
            Sachsenliga • Bezirksliga • Hobbyliga RV Chemnitz
          </span>
        </div>

        {/* Teams Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TEAMS.map((team) => (
            <div
              key={team.id}
              className="rounded-2xl p-5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-tuc-800 dark:hover:border-emerald-500 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-tuc-800 text-white dark:bg-tuc-700">
                    {team.league}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {team.season}
                  </span>
                </div>

                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                    {team.name}
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Kapitän: <strong className="text-slate-700 dark:text-slate-300">{team.captain}</strong>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Tabelle:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{team.standing}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Ergebnis:</span>
                    <span className="font-bold text-tuc-800 dark:text-emerald-400">{team.lastResult}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                  {team.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  {team.trainingDay.split('(')[0]}
                </span>
                <button
                  onClick={() => setSelectedTeam(team)}
                  className="text-xs font-bold text-tuc-800 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>weiterlesen</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Team Details Modal */}
      {selectedTeam && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedTeam(null)}
        >
          <div 
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-tuc-800 dark:text-emerald-400">
                  {selectedTeam.league} • {selectedTeam.season}
                </span>
                <h3 className="font-display font-black text-xl text-slate-900 dark:text-white">
                  {selectedTeam.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTeam(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedTeam.description}
            </p>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-2">
              <div><strong>Mannschaftsführer:</strong> {selectedTeam.captain}</div>
              <div><strong>Trainingszeit & Ort:</strong> {selectedTeam.trainingDay}</div>
              <div><strong>Aktueller Stand:</strong> {selectedTeam.standing} ({selectedTeam.lastResult})</div>
            </div>

            <button
              onClick={() => setSelectedTeam(null)}
              className="w-full py-2 text-xs font-bold text-white bg-tuc-800 hover:bg-tuc-700 rounded-xl"
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

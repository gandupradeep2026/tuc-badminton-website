import React, { useState, useEffect } from 'react';
import { Award, Mail, Sparkles, User, Target, ShieldCheck } from 'lucide-react';
import { safeFetchJson, getUploadUrl } from '../api/client';
import { DEFAULT_TRAINERS } from '../data/mockData';

export default function TrainersSection({ refreshTrigger = 0 }) {
  const [trainers, setTrainers] = useState(DEFAULT_TRAINERS);
  const [loading, setLoading] = useState(true);

  const fetchTrainers = async () => {
    try {
      const res = await safeFetchJson('/api/trainers');
      if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
        setTrainers(res.data);
      } else {
        setTrainers(DEFAULT_TRAINERS);
      }
    } catch (err) {
      console.error('Error fetching trainers, using fallback:', err);
      setTrainers(DEFAULT_TRAINERS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, [refreshTrigger]);

  return (
    <section id="trainers" className="py-20 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-tuc-100 dark:bg-tuc-950 text-tuc-800 dark:text-emerald-400 border border-tuc-200 dark:border-tuc-800/80 text-xs font-bold tracking-wide">
            <Award className="w-3.5 h-3.5" />
            <span>Coaching Staff & Team Coordinators</span>
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900 dark:text-white tracking-tight">
            Trainers & Coaches
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Licensed university trainers and experienced student captains dedicated to developing footwork, tactical prowess, and friendly match play.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="h-96 rounded-3xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        )}

        {/* Trainers Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {trainers.map((coach) => {
            const focusList = coach.focus_areas
              ? coach.focus_areas.split(',').map((f) => f.trim())
              : [];

            return (
              <div
                key={coach.id}
                className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-6">
                  {/* Avatar & Header Info */}
                  <div className="flex items-start gap-4">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-tuc-800/20 dark:border-emerald-500/30 flex-shrink-0">
                      {coach.photo_url ? (
                        <img
                          src={getUploadUrl(coach.photo_url)}
                          alt={coach.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100 dark:bg-slate-800">
                          <User className="w-10 h-10" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-tuc-50 dark:bg-tuc-950/80 text-tuc-800 dark:text-emerald-400 border border-tuc-200 dark:border-tuc-800">
                        <ShieldCheck className="w-3 h-3 text-tuc-700 dark:text-emerald-400" />
                        <span>Certified Instructor</span>
                      </div>
                      <h3 className="font-display font-black text-xl text-slate-900 dark:text-white truncate">
                        {coach.name}
                      </h3>
                      <p className="text-xs font-semibold text-tuc-700 dark:text-emerald-400">
                        {coach.role}
                      </p>
                    </div>
                  </div>

                  {/* Focus Areas */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-tuc-700 dark:text-emerald-400" />
                      <span>Specialties & Focus Areas</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {focusList.map((focus, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/60"
                        >
                          {focus}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Direct Contact Button */}
                <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                  <a
                    href={`mailto:${coach.email}?subject=TU%20Chemnitz%20Badminton%20Training%20Inquiry`}
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-tuc-50 hover:text-tuc-800 dark:bg-slate-800 dark:hover:bg-slate-700/80 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    <Mail className="w-4 h-4 text-tuc-700 dark:text-emerald-400" />
                    <span>Contact {coach.name.split(' ')[0]} ({coach.email})</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

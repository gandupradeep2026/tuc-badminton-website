import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Filter, 
  Check, 
  Sparkles, 
  ChevronRight, 
  LayoutGrid, 
  Table as TableIcon,
  Search,
  Zap
} from 'lucide-react';
import { TRAINING_SESSIONS } from '../data/mockData';

export default function ScheduleMatrix({ onSelectSession }) {
  const [selectedDay, setSelectedDay] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  const days = ['All', 'Monday', 'Wednesday', 'Friday', 'Sunday'];
  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced', 'All Levels'];

  const filteredSessions = useMemo(() => {
    return TRAINING_SESSIONS.filter((session) => {
      const matchDay = selectedDay === 'All' || session.day === selectedDay;
      const matchLevel = selectedLevel === 'All' || session.level === selectedLevel;
      const matchSearch = 
        searchQuery === '' ||
        (session.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (session.venue || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (session.coach || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (session.shuttleType || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchDay && matchLevel && matchSearch;
    });
  }, [selectedDay, selectedLevel, searchQuery]);

  const getLevelBadgeClass = (level) => {
    switch (level) {
      case 'Beginner':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800';
      case 'Intermediate':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
      case 'Advanced':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  return (
    <section id="schedule" className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold tracking-wide mb-3">
              <Clock className="w-3.5 h-3.5" />
              <span>Weekly Academic Training Schedule</span>
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900 dark:text-white tracking-tight">
              Training & Schedule Matrix
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-2xl text-sm sm:text-base">
              Explore weekly badminton slots across campus halls. Open to beginners, recreational players, and the university competitive squad.
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 self-start md:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 mb-8 space-y-4 shadow-sm">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Day Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Day:
              </span>
              {days.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedDay === day
                      ? 'bg-tuc-800 text-white dark:bg-tuc-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search coach, venue, shuttle..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-tuc-600"
              />
            </div>

          </div>

          {/* Level Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Skill Level:
            </span>
            {levels.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedLevel === lvl
                    ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

        </div>

        {/* Empty State */}
        {filteredSessions.length === 0 && (
          <div className="text-center py-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-300 dark:border-slate-800">
            <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">No sessions found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Try adjusting your day or skill level filters above.
            </p>
            <button
              onClick={() => { setSelectedDay('All'); setSelectedLevel('All'); setSearchQuery(''); }}
              className="mt-3 px-3.5 py-1.5 text-xs font-semibold text-tuc-700 dark:text-emerald-400 hover:underline"
            >
              Reset all filters
            </button>
          </div>
        )}

        {/* View Mode: Card Grid */}
        {viewMode === 'grid' && (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className="rounded-2xl p-6 bg-slate-50 dark:bg-slate-950/70 border border-slate-200/90 dark:border-slate-800/80 hover:border-tuc-600/50 dark:hover:border-emerald-500/50 hover:shadow-lg transition-all duration-200 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-tuc-700 dark:text-emerald-400 bg-tuc-100/70 dark:bg-tuc-950 px-2.5 py-0.5 rounded-md border border-tuc-200 dark:border-tuc-800">
                          {session.day}
                        </span>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {session.time}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mt-2 group-hover:text-tuc-700 dark:group-hover:text-emerald-400 transition-colors">
                        {session.title}
                      </h3>
                    </div>

                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${getLevelBadgeClass(session.level)}`}>
                      {session.level}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {session.description}
                  </p>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-200/80 dark:border-slate-800/80 text-xs">
                    <div className="space-y-1">
                      <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold block">Venue & Courts</span>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-tuc-600 dark:text-emerald-400 flex-shrink-0" />
                        <span className="truncate">{session.venueShort}</span>
                      </div>
                      <span className="text-slate-500 text-[11px] block">{session.courts}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold block">Shuttlecock & Coach</span>
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {session.shuttleType}
                      </div>
                      <span className="text-slate-500 text-[11px] block truncate">{session.coach}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-4 flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {session.status}
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectSession(session)}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-tuc-800 hover:bg-tuc-700 dark:bg-tuc-600 dark:hover:bg-tuc-500 rounded-lg shadow-sm transition-all active:scale-95"
                  >
                    <span>Join This Session</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* View Mode: Matrix Table */}
        {viewMode === 'table' && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="py-3.5 px-4">Day & Time</th>
                  <th className="py-3.5 px-4">Session Title</th>
                  <th className="py-3.5 px-4">Skill Level</th>
                  <th className="py-3.5 px-4">Venue & Courts</th>
                  <th className="py-3.5 px-4">Shuttles</th>
                  <th className="py-3.5 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-900 dark:text-white">
                      <span className="font-bold text-tuc-700 dark:text-emerald-400 block">{session.day}</span>
                      <span className="text-xs text-slate-500">{session.time}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{session.title}</div>
                      <div className="text-xs text-slate-500 truncate max-w-xs">{session.coach}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getLevelBadgeClass(session.level)}`}>
                        {session.level}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{session.venueShort}</div>
                      <div className="text-xs text-slate-500">{session.courts}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">
                      {session.shuttleType}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <button
                        onClick={() => onSelectSession(session)}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-tuc-800 hover:bg-tuc-700 dark:bg-tuc-600 rounded-lg shadow-sm"
                      >
                        Book Slot
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </section>
  );
}

import React from 'react';
import { 
  MapPin, 
  Navigation, 
  ExternalLink, 
  AlertTriangle, 
  Bus, 
  Footprints, 
  Lock, 
  Droplet,
  CheckCircle,
  Layers
} from 'lucide-react';
import { VENUES } from '../data/mockData';

export default function VenuesSection() {
  return (
    <section id="venues" className="py-20 bg-slate-50 dark:bg-slate-950/70 border-t border-slate-200/80 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-tuc-100 dark:bg-tuc-950/80 border border-tuc-200 dark:border-tuc-800 text-tuc-800 dark:text-tuc-300 text-xs font-bold tracking-wide">
            <MapPin className="w-3.5 h-3.5" />
            <span>Campus Gym Locations & Directions</span>
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900 dark:text-white tracking-tight">
            Sports Halls & Facilities
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            TU Chemnitz badminton sessions take place across two primary campus sports halls. 
            Review facility locations, transit stops, and mandatory hall rules prior to your visit.
          </p>
        </div>

        {/* Mandatory Hall Rules Alert Card */}
        <div className="mb-12 p-5 sm:p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display font-bold text-base text-amber-900 dark:text-amber-100">
                Important Facility Regulation: Non-Marking Indoor Shoes Only (*Hallenschuhe*)
              </h4>
              <p className="text-xs sm:text-sm text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                By order of the TU Chemnitz Sports Facilities Office, running shoes worn outdoors or shoes with black marking soles are strictly prohibited on the wooden sprung parquet floors. Please bring clean court shoes in your bag and change in the locker room.
              </p>
            </div>
          </div>
        </div>

        {/* Venues Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {VENUES.map((venue) => (
            <div
              key={venue.id}
              className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-6">
                
                {/* Card Title & Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-tuc-700 dark:text-emerald-400">
                      {venue.badge}
                    </span>
                    <h3 className="font-display font-black text-2xl text-slate-900 dark:text-white mt-1">
                      {venue.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {venue.tagline}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-2xl font-black font-display text-tuc-800 dark:text-emerald-400">
                      {venue.courtsCount}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Courts</span>
                  </div>
                </div>

                {/* Floor Type & Address */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/70 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <Layers className="w-4 h-4 text-tuc-600 dark:text-emerald-400 flex-shrink-0" />
                    <span>Floor: {venue.floorType}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>{venue.address}</span>
                  </div>
                </div>

                {/* Public Transit Section */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Bus className="w-3.5 h-3.5 text-tuc-600 dark:text-emerald-400" />
                    <span>Public Transit & Arrival</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    {(Array.isArray(venue.transit) ? venue.transit : [venue.transit].filter(Boolean)).map((t, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-tuc-600 dark:bg-emerald-400 mt-1.5 flex-shrink-0" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Hall Rules */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Footprints className="w-3.5 h-3.5 text-amber-500" />
                    <span>Hall Protocol & Equipment</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    {(Array.isArray(venue.rules) ? venue.rules : [venue.rules || venue.rule].filter(Boolean)).map((rule, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Amenities Badges */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {(venue.amenities || []).map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>

              </div>

              {/* Action Button: Google Maps */}
              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                <a
                  href={venue.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 bg-slate-100 hover:bg-tuc-50 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 transition-colors group"
                >
                  <Navigation className="w-4 h-4 text-tuc-600 dark:text-emerald-400 group-hover:rotate-45 transition-transform" />
                  <span>Get Directions in Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 ml-1" />
                </a>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

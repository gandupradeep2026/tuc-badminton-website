import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Sparkles, 
  Mail, 
  Phone, 
  MapPin, 
  Tag, 
  CheckCircle2, 
  UserPlus, 
  Package, 
  Award, 
  ShieldCheck, 
  Clock,
  ExternalLink
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { safeFetchJson, getUploadUrl } from '../api/client';

export default function ServicesPage({ onNavigate }) {
  const { language } = useLanguage();
  const isDe = language === 'de';

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'stringing' | 'shuttles' | 'rackets'

  const fetchServices = async () => {
    try {
      const res = await safeFetchJson('/api/equipment-services');
      if (res.ok && Array.isArray(res.data)) {
        setServices(res.data);
      } else {
        setServices([]);
      }
    } catch (err) {
      console.error('Failed to load equipment services:', err);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const filteredServices = services.filter((srv) => {
    if (activeFilter === 'all') return true;
    const type = (srv.service_type || '').toLowerCase();
    if (activeFilter === 'stringing') return type.includes('besait') || type.includes('string');
    if (activeFilter === 'shuttles') return type.includes('federb') || type.includes('ball') || type.includes('shuttle');
    if (activeFilter === 'rackets') return type.includes('schläger') || type.includes('racket') || type.includes('zubehör') || type.includes('griff');
    return true;
  });

  return (
    <div className="space-y-8 pb-16">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-[#005A36] text-xs font-bold mb-1">
            <Wrench className="w-3.5 h-3.5" />
            <span>{isDe ? 'Campus Service & Ausrüstung' : 'Campus Equipment & Services'}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              {isDe ? 'Besaitungsservice & Ausrüstung' : 'Racket Stringing & Equipment'}
            </h1>
            {onNavigate && (
              <button
                onClick={() => onNavigate('register')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#005A36] text-white hover:bg-[#00472A] transition-colors shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isDe ? 'Als Anbieter registrieren' : 'Register as Provider'}</span>
              </button>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            {isDe
              ? 'Finde erfahrene Badminton-Besaiter, Federbälle, Schläger und Zubehör direkt von Spielern und Partnern der TU Chemnitz.'
              : 'Find experienced badminton stringers, shuttles, rackets and grips directly from TU Chemnitz players and local partners.'}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto max-w-full flex-shrink-0 self-start sm:self-auto scrollbar-none">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-[#005A36] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isDe ? 'Alle' : 'All'} ({services.length})
          </button>
          <button
            onClick={() => setActiveFilter('stringing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeFilter === 'stringing'
                ? 'bg-[#005A36] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🏸 {isDe ? 'Besaitung' : 'Stringing'}
          </button>
          <button
            onClick={() => setActiveFilter('shuttles')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeFilter === 'shuttles'
                ? 'bg-[#005A36] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🪶 {isDe ? 'Federbälle' : 'Shuttles'}
          </button>
          <button
            onClick={() => setActiveFilter('rackets')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeFilter === 'rackets'
                ? 'bg-[#005A36] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🎾 {isDe ? 'Schläger & Zubehör' : 'Rackets & Grips'}
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-slate-100 rounded-3xl border border-slate-200" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && services.length === 0 && (
        <div className="text-center py-16 px-6 bg-white rounded-3xl border border-dashed border-slate-200 shadow-xs max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#005A36] mx-auto flex items-center justify-center">
            <Wrench className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-bold text-slate-800">
              {isDe ? 'Noch keine Anbieter eingetragen' : 'No service providers registered yet'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              {isDe
                ? 'Bespannst du Schläger mit eigener Maschine oder verkaufst du Federbälle & Griffbänder für Studierende? Werde Teil unseres Ausrüstungs-Netzwerks!'
                : 'Do you string rackets or sell shuttles and grips to students? Join our campus badminton equipment network!'}
            </p>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('register')}
              className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#005A36] text-white hover:bg-[#00472A] transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isDe ? 'Jetzt als Besaiter / Ausrüster registrieren' : 'Register as Stringer / Supplier'}</span>
            </button>
          )}
        </div>
      )}

      {/* Grid of Approved Service Providers */}
      {!loading && filteredServices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((srv) => {
            const serviceList = (srv.service_type || '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);

            return (
              <div
                key={srv.id}
                className="bg-white rounded-3xl border border-slate-200/90 hover:border-emerald-200 shadow-xs hover:shadow-md transition-all p-5 sm:p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-4">
                  {/* Provider Header */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center">
                      {srv.photo_url && getUploadUrl(srv.photo_url) ? (
                        <img
                          src={getUploadUrl(srv.photo_url)}
                          alt={srv.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-[#005A36]/10 text-[#005A36] font-bold flex items-center justify-center text-xl">
                          {srv.name ? srv.name.charAt(0) : <Wrench className="w-6 h-6 text-slate-400" />}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-[#005A36] border border-emerald-200">
                          {isDe ? 'Geprüfter Anbieter' : 'Verified Provider'}
                        </span>
                      </div>
                      <h3 className="font-display font-black text-base sm:text-lg text-slate-900 truncate">
                        {srv.name}
                      </h3>
                      {srv.experience_years && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium truncate">
                          <Award className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          <span className="truncate">{srv.experience_years}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Services Badges */}
                  {serviceList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {serviceList.map((svc, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-[10px] sm:text-[11px] font-bold text-slate-700 border border-slate-200/80"
                        >
                          {svc}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Pricing Details */}
                  {srv.pricing_details && (
                    <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900 text-[11px] uppercase tracking-wider">
                        <Tag className="w-3.5 h-3.5 text-amber-600" />
                        <span>{isDe ? 'Preise & Konditionen' : 'Pricing & Rates'}</span>
                      </div>
                      <p className="text-amber-950 font-medium whitespace-pre-line leading-relaxed">
                        {srv.pricing_details}
                      </p>
                    </div>
                  )}

                  {/* Available Items / Materials */}
                  {srv.available_items && (
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-600 text-[11px] uppercase tracking-wider">
                        <Package className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{isDe ? 'Verfügbare Saiten / Bälle' : 'Available Strings & Shuttles'}</span>
                      </div>
                      <p className="text-slate-800 leading-relaxed">
                        {srv.available_items}
                      </p>
                    </div>
                  )}

                  {/* Handoff / Campus Location */}
                  {srv.location_note && (
                    <div className="flex items-start gap-2 text-xs text-slate-600 pt-1">
                      <MapPin className="w-4 h-4 text-[#005A36] flex-shrink-0 mt-0.5" />
                      <span>{srv.location_note}</span>
                    </div>
                  )}
                </div>

                {/* Direct Contact Buttons */}
                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                  <a
                    href={`mailto:${srv.email}?subject=${encodeURIComponent(isDe ? 'Anfrage Besaitung / Badminton-Ausrüstung TU Chemnitz' : 'Inquiry Badminton Stringing / Equipment TU Chemnitz')}`}
                    className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl text-xs font-bold text-white bg-[#005A36] hover:bg-[#00472A] transition-colors shadow-xs"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate">{srv.email}</span>
                  </a>

                  {srv.phone && (srv.show_phone === 1 || srv.show_phone === true || srv.show_phone === '1') && (
                    <div className="grid grid-cols-2 gap-1.5">
                      <a
                        href={`https://wa.me/${srv.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                      >
                        <span>WhatsApp</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href={`tel:${srv.phone}`}
                        className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
                      >
                        <Phone className="w-3 h-3 text-[#005A36]" />
                        <span>{isDe ? 'Anrufen' : 'Call'}</span>
                      </a>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Community Invite Callout */}
      <div className="bg-gradient-to-r from-emerald-900 to-[#005A36] rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
        <div className="space-y-1.5 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 text-emerald-200 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isDe ? 'Campus Community' : 'Campus Community'}</span>
          </div>
          <h3 className="font-display font-black text-xl sm:text-2xl tracking-tight">
            {isDe ? 'Bietest du Besaitungsservice oder Bälle an?' : 'Do you string rackets or sell equipment?'}
          </h3>
          <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl">
            {isDe
              ? 'Trage dich kostenlos als Partner ein und hilf anderen Studierenden & Spielern, ihre Schläger und Bälle schnell auf dem Campus zu erhalten.'
              : 'Register as an equipment partner for free and support fellow students with quick racket stringing and shuttles right on campus.'}
          </p>
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate('register')}
            className="px-5 py-3 rounded-xl font-black text-xs sm:text-sm text-[#005A36] bg-white hover:bg-emerald-50 transition-colors whitespace-nowrap shadow-sm flex-shrink-0"
          >
            {isDe ? 'Jetzt als Partner eintragen' : 'Join as Equipment Partner'}
          </button>
        )}
      </div>

    </div>
  );
}

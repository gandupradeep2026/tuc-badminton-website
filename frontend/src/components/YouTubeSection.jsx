import React, { useState, useEffect } from 'react';
import { 
  Play, 
  ExternalLink, 
  Tv, 
  Film, 
  Share2, 
  Clock, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function YouTubeSection() {
  const { t, language } = useLanguage();
  const y = t.home?.youtube || {};
  const isDe = language === 'de';

  const [videos, setVideos] = useState([]);
  const [channelUrl, setChannelUrl] = useState('https://www.youtube.com/@TUCBadminton');
  const [activeVideo, setActiveVideo] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchVideos = async () => {
    try {
      const res = await fetch('/api/videos');
      if (res.ok) {
        const data = await res.json();
        setVideos(data.videos || []);
        if (data.youtube_channel_url) {
          setChannelUrl(data.youtube_channel_url);
        }
        if (data.videos && data.videos.length > 0) {
          setActiveVideo(data.videos[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load YouTube videos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  return (
    <section className="space-y-4 pt-2">
      
      {/* Section Header with Channel Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-[11px] sm:text-xs font-bold mb-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span>{y.badge || '▶️ YouTube & Videos'}</span>
          </div>
          <h2 className="font-display font-black text-xl sm:text-2xl md:text-3xl text-slate-900 tracking-tight">
            {y.title || 'Unsere Badminton-Videos & Match-Highlights'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            {y.subtitle || 'Erlebe packende Ballwechsel, Turniervideos und Trainingsszenen direkt hier oder besuche unseren offiziellen YouTube-Kanal!'}
          </p>
        </div>

        {/* Direct Link to YouTube Channel Button */}
        <a
          href={channelUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-white bg-[#FF0000] hover:bg-[#CC0000] active:bg-[#990000] transition-all shadow-sm hover:shadow-md cursor-pointer self-start sm:self-auto flex-shrink-0"
        >
          {/* YouTube Play Icon SVG */}
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          <span>{y.channelButton || 'Offizieller YouTube-Kanal'}</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
        </a>
      </div>

      {loading && (
        <div className="h-72 bg-slate-100 rounded-3xl animate-pulse" />
      )}

      {!loading && videos.length === 0 && (
        <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-sm">
          {y.noVideos || 'Derzeit sind noch keine Videos eingetragen.'}
        </div>
      )}

      {!loading && videos.length > 0 && activeVideo && (
        <div className="grid lg:grid-cols-3 gap-5 sm:gap-6">
          
          {/* Main Embedded Player (Spans 2 columns on desktop) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="relative w-full aspect-video rounded-2xl sm:rounded-3xl overflow-hidden bg-black shadow-lg border border-slate-800">
              <iframe
                title={activeVideo.title}
                src={`https://www.youtube-nocookie.com/embed/${activeVideo.video_id}?autoplay=0&rel=0`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            {/* Video Details Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-100 text-red-700">
                  {activeVideo.category || 'Turnier 2026'}
                </span>

                <a
                  href={activeVideo.youtube_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#005A36] hover:underline"
                >
                  <span>{y.watchOnYoutube || 'Auf YouTube ansehen'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <h3 className="font-display font-black text-base sm:text-xl text-slate-900 leading-snug">
                {activeVideo.title}
              </h3>

              {activeVideo.description && (
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                  {activeVideo.description}
                </p>
              )}
            </div>
          </div>

          {/* Video Playlist / Selector Sidebar (1 col) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 font-mono">
                {isDe ? 'Alle Videos (' + videos.length + ')' : 'All Videos (' + videos.length + ')'}
              </span>
              <span className="text-xs text-slate-400 font-mono">{activeVideo.category}</span>
            </div>

            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
              {videos.map((vid, idx) => {
                const isSelected = activeVideo.id === vid.id;
                const thumb = `https://img.youtube.com/vi/${vid.video_id}/mqdefault.jpg`;

                return (
                  <div
                    key={vid.id}
                    onClick={() => setActiveVideo(vid)}
                    className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer flex gap-3 group ${
                      isSelected 
                        ? 'bg-emerald-50/80 border-emerald-500 shadow-xs ring-1 ring-emerald-500/40' 
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {/* Thumbnail with overlay play icon */}
                    <div className="relative w-24 sm:w-28 aspect-video rounded-xl overflow-hidden bg-slate-900 flex-shrink-0">
                      <img
                        src={thumb}
                        alt={vid.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/uploads/tournament_2026/teamcup_2026_group_all_teams.jpeg';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                        <div className={`p-1.5 rounded-full ${isSelected ? 'bg-emerald-600 text-white' : 'bg-black/60 text-white group-hover:bg-red-600'} transition-colors`}>
                          <Play className="w-3 h-3 fill-current" />
                        </div>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <span className="text-[10px] font-bold text-red-600 block truncate">
                        {vid.category || 'Highlights'}
                      </span>
                      <h4 className={`text-xs font-bold line-clamp-2 leading-tight ${isSelected ? 'text-emerald-950 font-black' : 'text-slate-800'}`}>
                        {vid.title}
                      </h4>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </section>
  );
}

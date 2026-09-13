import React, { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Film, 
  Maximize2, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  Play
} from 'lucide-react';
import { safeFetchJson, getUploadUrl } from '../api/client';

const DEFAULT_MEDIA_ITEMS = [
  {
    id: 1,
    title: 'UNI Badminton Team Cup 2026 - Siegerehrung Gold',
    type: 'photo',
    file_url: '/uploads/tournament_2026/teamcup_2026_winners_gold.jpeg',
    thumbnail_url: '/uploads/tournament_2026/teamcup_2026_winners_gold.jpeg',
    caption: 'Goldmedaille für die TUC Shuttlers in der Sporthalle Thüringer Weg 11.',
  },
  {
    id: 2,
    title: 'TUC Challengers Bronze & MVP Feier',
    type: 'photo',
    file_url: '/uploads/tournament_2026/teamcup_2026_challengers_bronze.jpeg',
    thumbnail_url: '/uploads/tournament_2026/teamcup_2026_challengers_bronze.jpeg',
    caption: 'Erfolgreiche Bronzemedaille und Auszeichnung als MVP-Team.',
  },
  {
    id: 3,
    title: 'Doppel-Ballwechsel - Thüringer Weg 11',
    type: 'photo',
    file_url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80',
    thumbnail_url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=400&q=80',
    caption: 'Intensives Training auf den 12 Hallenfeldern.',
  }
];

export default function MediaGallerySection({ refreshTrigger = 0 }) {
  const [mediaItems, setMediaItems] = useState(DEFAULT_MEDIA_ITEMS);
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'photo' | 'video'
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMedia = async () => {
    try {
      const url = activeCategory === 'all' ? '/api/media' : `/api/media?type=${activeCategory}`;
      const res = await safeFetchJson(url);
      if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
        setMediaItems(res.data);
      } else {
        setMediaItems(DEFAULT_MEDIA_ITEMS);
      }
    } catch (err) {
      console.error('Error fetching media:', err);
      setMediaItems(DEFAULT_MEDIA_ITEMS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [activeCategory, refreshTrigger]);

  return (
    <section id="media" className="py-20 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-tuc-100 dark:bg-tuc-950 text-tuc-800 dark:text-emerald-400 border border-tuc-200 dark:border-tuc-800/80 text-xs font-bold tracking-wide mb-3">
              <Film className="w-3.5 h-3.5" />
              <span>Campus Action & Tournament Highlights</span>
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900 dark:text-white tracking-tight">
              Community Media Gallery
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-xl text-sm sm:text-base">
              Photos from weekly training sessions at Thüringer Weg, championship podiums, and technique drill clips.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm self-start md:self-auto">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeCategory === 'all'
                  ? 'bg-tuc-800 text-white dark:bg-tuc-700 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setActiveCategory('photo')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeCategory === 'photo'
                  ? 'bg-tuc-800 text-white dark:bg-tuc-700 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Photos</span>
            </button>
            <button
              onClick={() => setActiveCategory('video')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeCategory === 'video'
                  ? 'bg-tuc-800 text-white dark:bg-tuc-700 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <VideoIcon className="w-3.5 h-3.5" />
              <span>Videos</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        )}

        {/* Media Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {mediaItems.map((item) => (
            <div
              key={item.id}
              className="group rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              {/* Media Container */}
              <div className="relative aspect-video bg-slate-900 overflow-hidden">
                {item.type === 'video' ? (
                  <video
                    src={getUploadUrl(item.file_url)}
                    controls
                    preload="metadata"
                    className="w-full h-full object-cover"
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div
                    className="relative w-full h-full cursor-pointer"
                    onClick={() => setSelectedPhoto(item)}
                  >
                    <img
                      src={getUploadUrl(item.file_url)}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <div className="p-3 rounded-full bg-black/60 backdrop-blur-sm">
                        <Maximize2 className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tag pill */}
                <div className="absolute top-3 left-3 pointer-events-none">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    item.type === 'video'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-black/60 backdrop-blur-md text-white'
                  }`}>
                    {item.type === 'video' ? 'Video Clip' : 'Photo'}
                  </span>
                </div>
              </div>

              {/* Caption & Title */}
              <div className="p-5 space-y-1.5">
                <h4 className="font-display font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                  {item.title}
                </h4>
                {item.caption && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {item.caption}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Lightbox Modal for Photos */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className="relative max-w-5xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <img
              src={selectedPhoto.file_url}
              alt={selectedPhoto.title}
              className="max-h-[75vh] w-auto rounded-2xl object-contain shadow-2xl border border-white/10"
            />

            <div className="mt-4 text-center max-w-xl text-white space-y-1">
              <h3 className="font-display font-bold text-lg">{selectedPhoto.title}</h3>
              {selectedPhoto.caption && (
                <p className="text-xs text-slate-300">{selectedPhoto.caption}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

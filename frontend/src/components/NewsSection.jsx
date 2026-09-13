import React, { useState } from 'react';
import { Calendar, Download, Newspaper, ChevronRight, Clock, MapPin, Trophy } from 'lucide-react';
import { NEWS_ARTICLES, TERMINE_LIST } from '../data/mockData';

export default function NewsSection() {
  const [selectedArticle, setSelectedArticle] = useState(null);

  return (
    <section id="aktuelles" className="py-16 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Aktuelles / News Berichte */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-tuc-800 dark:text-emerald-400" />
                <h2 className="font-display font-black text-2xl text-slate-900 dark:text-white">
                  Aktuelles & Spielberichte
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">Saison 2026/27</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {NEWS_ARTICLES.map((article) => (
                <div
                  key={article.id}
                  className="rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-video w-full overflow-hidden relative">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-tuc-800 text-white">
                        {article.category}
                      </span>
                    </div>

                    <div className="p-4 space-y-2">
                      <span className="text-[11px] font-mono text-slate-400 block">{article.date}</span>
                      <h3 className="font-display font-bold text-base text-slate-900 dark:text-white line-clamp-2 leading-snug">
                        {article.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                        {article.summary}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <button
                      onClick={() => setSelectedArticle(article)}
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

          {/* Right Column: Termine & Spielplan Ticker */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <Calendar className="w-4 h-4 text-tuc-800 dark:text-emerald-400" />
              <h3 className="font-display font-black text-xl text-slate-900 dark:text-white">
                Termine & Spielplan
              </h3>
            </div>

            <div className="space-y-3">
              {TERMINE_LIST.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-tuc-800 dark:text-emerald-400 bg-tuc-50 dark:bg-tuc-950 px-2 py-0.5 rounded">
                      {item.date}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {item.category}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h4>

                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                    <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <span>{item.location}</span>
                  </div>

                  {item.hasAusschreibung && (
                    <div className="pt-2">
                      <a
                        href={item.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-tuc-800 hover:bg-tuc-700 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Ausschreibung (PDF)</span>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Link to full Ausschreibung Board */}
            <div className="p-3.5 rounded-xl bg-tuc-50 dark:bg-tuc-950/60 border border-tuc-200 dark:border-tuc-800 text-xs text-center">
              <span className="text-slate-600 dark:text-slate-300 block mb-1">
                Alle offiziellen Turnier-Ausschreibungen der Saison
              </span>
              <a
                href="#tournaments"
                className="font-bold text-tuc-800 dark:text-emerald-400 hover:underline"
              >
                Zum Ausschreibungs-Board →
              </a>
            </div>
          </div>

        </div>

      </div>

      {/* Article Read More Modal */}
      {selectedArticle && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedArticle(null)}
        >
          <div 
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-mono text-slate-400">{selectedArticle.date}</span>
              <button
                onClick={() => setSelectedArticle(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              {selectedArticle.title}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedArticle.readMore}
            </p>

            <button
              onClick={() => setSelectedArticle(null)}
              className="w-full py-2 text-xs font-bold text-white bg-tuc-800 rounded-xl"
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

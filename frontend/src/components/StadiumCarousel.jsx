import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Maximize2, 
  X, 
  MapPin, 
  Trophy, 
  Sparkles,
  Camera
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getUploadUrl } from '../api/client';

export default function StadiumCarousel() {
  const { t, language } = useLanguage();
  const c = t.home?.carousel || {};
  const isDe = language === 'de';

  const slides = [
    {
      id: 1,
      image: '/uploads/tournament_2026/teamcup_2026_group_all_teams.jpeg',
      badge: isDe ? '12 Badminton-Spielfelder' : '12 Badminton Courts',
      title: isDe ? 'Universitäts-Sporthalle Thüringer Weg 11' : 'University Sports Hall Thüringer Weg 11',
      subtitle: isDe ? 'Großsporthalle mit 12 Badminton-Feldern & 45 Aktiven aus 10 Nationen' : 'Large arena with 12 courts & 45 athletes from 10 nations',
      caption: isDe 
        ? 'Blick von der Galerie: Unsere moderne Sportarena bietet mit 12 wettkampfgerechten Badmintonfeldern und gelenkschonendem Schwingboden optimale Bedingungen für Training und Großturniere.'
        : 'Balcony view: Our modern venue features 12 tournament-grade courts and sprung flooring, providing premier conditions for training and collegiate tournaments.',
      tag: isDe ? 'Hauptsportstätte' : 'Main Venue',
    },
    {
      id: 2,
      image: '/uploads/tournament_2026/teamcup_2026_trophy_ceremony.jpeg',
      badge: isDe ? 'Center Court & Siegerehrung' : 'Center Court & Ceremony',
      title: isDe ? 'Meisterpokal & Feierliche Siegerehrung 2026' : 'Championship Trophy & Award Ceremony 2026',
      subtitle: isDe ? 'Center Court der Sporthalle Thüringer Weg 11' : 'Center Court at Sports Hall Thüringer Weg 11',
      caption: isDe
        ? 'Feierliche Übergabe des großen Siegerpokals auf dem Center Court nach 13 intensiven Mannschaftsduellen und 65 Einzel- und Doppelmatches.'
        : 'Official presentation of the championship trophy on center court following 13 team clashes and 65 individual matches.',
      tag: isDe ? 'Meisterpokal' : 'Trophy Ceremony',
    },
    {
      id: 3,
      image: '/uploads/tournament_2026/teamcup_2026_winners_gold.jpeg',
      badge: isDe ? '🥇 1. Platz (Gold)' : '🥇 1st Place (Gold)',
      title: isDe ? 'Turniersieger: TUC Shuttlers' : 'Tournament Champions: TUC Shuttlers',
      subtitle: isDe ? 'Phan van Trung, Jeanette Krause, Sangeeth, Joseph, Nishit & Salekin' : 'Phan van Trung, Jeanette Krause, Sangeeth, Joseph, Nishit & Salekin',
      caption: isDe
        ? 'Ungeschlagener Champion! Angeführt von Kapitän Phan van Trung (6 Siege / 100% Winrate) und Jeanette Krause (7 Siege) holten sich die Shuttlers den Goldpokal.'
        : 'Undefeated champions! Led by captain Phan van Trung (6 wins / 100% winrate) and Jeanette Krause (7 wins), the Shuttlers captured the championship cup.',
      tag: isDe ? 'Champions 2026' : 'Gold Champions',
    },
    {
      id: 4,
      image: '/uploads/tournament_2026/teamcup_2026_titans_silver.jpeg',
      badge: isDe ? '🥈 2. Platz (Silber)' : '🥈 2nd Place (Silver)',
      title: isDe ? 'Finalist: TUC Titans' : 'Runner-Up: TUC Titans',
      subtitle: isDe ? 'Michael Krause, Neeraj Kulkarni, Aditya, Sohan, Saswat, Havishma & Ayushi' : 'Michael Krause, Neeraj Kulkarni, Aditya, Sohan, Saswat, Havishma & Ayushi',
      caption: isDe
        ? 'Hervorragender 2. Platz: Starker 3:1-Halbfinalsieg über HSMW Mittweida und überragende Vorstellungen von Neeraj Kulkarni (6 Siege) und Coach Michael Krause.'
        : 'Outstanding 2nd place: Decisive 3:1 semifinal victory over HSMW Mittweida and exceptional performances from Neeraj Kulkarni (6 wins) and coach Michael Krause.',
      tag: isDe ? 'Silberpokal' : 'Silver Trophy',
    },
    {
      id: 5,
      image: '/uploads/tournament_2026/teamcup_2026_challengers_bronze.jpeg',
      badge: isDe ? '🥉 3. Platz & MVP (Bronze)' : '🥉 3rd Place & MVP (Bronze)',
      title: isDe ? 'TUC Challengers: Pradeep Gandu & Tamara Winzler' : 'TUC Challengers: Pradeep Gandu & Tamara Winzler',
      subtitle: isDe ? 'Pradeep Gandu (MVP 88.9%), Tamara Winzler (Top Dame 80%) & Squad' : 'Pradeep Gandu (MVP 88.9%), Tamara Winzler (Top Female 80%) & Squad',
      caption: isDe
        ? 'Nervenstarker 3:2-Erfolg im kleinen Finale! Mit Kapitän Pradeep Gandu (Rang 1 Spieler mit 8 Siegen) und Tamara Winzler (erfolgreichste Dame des Turniers) auf dem Podest.'
        : 'Nerve-wracking 3:2 win in the bronze playoff! Captain Pradeep Gandu (Rank 1 player with 8 wins) and Tamara Winzler (top female player) led the team to bronze.',
      tag: isDe ? 'Bronzemedaille & MVP' : 'Bronze & MVP',
    },
    {
      id: 6,
      image: '/uploads/tournament_2026/teamcup_2026_hsmw_4th.jpeg',
      badge: isDe ? '🏅 4. Platz & Beste Gast-Uni' : '🏅 4th Place & Top Guest University',
      title: isDe ? 'HSMW Mittweida in Blau' : 'HSMW Mittweida in Blue',
      subtitle: isDe ? 'Jensun Ravichandran, Leander, Chenyang, Paul, Franklin, Laura & Louise' : 'Jensun Ravichandran, Leander, Chenyang, Paul, Franklin, Laura & Louise',
      caption: isDe
        ? 'Starke Gastmannschaft aus Mittweida: Gruppensieger der Gruppe B (2:0 Siege) und hochklassige, faire Matches in der Sporthalle Thüringer Weg.'
        : 'Strong guest team from Mittweida: Group B champions (2:0 wins) and high-quality, competitive matches in our hall.',
      tag: isDe ? 'HS Mittweida' : 'HSMW Mittweida',
    },
    {
      id: 7,
      image: '/uploads/tournament_2026/teamcup_2026_predators_5th.jpeg',
      badge: isDe ? '🏸 5. Platz (Platzierungsspiel)' : '🏸 5th Place (Playoff Winner)',
      title: isDe ? 'TUC Predators im Team-Lineup' : 'TUC Predators Team Lineup',
      subtitle: isDe ? 'Kevin Fuchs, Phu Loc Pham, Jiyeon Yeo, Lucas, Jahid & Motasim' : 'Kevin Fuchs, Phu Loc Pham, Jiyeon Yeo, Lucas, Jahid & Motasim',
      caption: isDe
        ? 'Kämpferischer Auftritt: Mit 100% Einzelsiegen von Phu Loc Pham und starkem Teamgeist sicherte sich das Team Rang 5 im Platzierungsspiel.'
        : 'Determined performance: Backed by 100% singles wins from Phu Loc Pham and fierce team spirit, the Predators clinched 5th place.',
      tag: isDe ? 'TUC Predators' : 'TUC Predators',
    },
    {
      id: 8,
      image: '/uploads/tournament_2026/teamcup_2026_zwickau_schmetterlinge.jpeg',
      badge: isDe ? '🏸 6. Platz (Platzierungsrunde)' : '🏸 6th Place (Placement Round)',
      title: isDe ? 'WHZ Zwickauer Schmetterlinge in Rot' : 'WHZ Zwickauer Schmetterlinge in Red',
      subtitle: isDe ? 'Westsächsische Hochschule Zwickau (Team 1)' : 'West Saxon University Zwickau (Team 1)',
      caption: isDe
        ? 'Großartige Stimmung und sportlicher Einsatz des ersten Teams aus Zwickau in der roten Spielkleidung.'
        : 'Energetic atmosphere and spirited badminton from the first Zwickau team in their red team jerseys.',
      tag: isDe ? 'WH Zwickau' : 'WHZ Team 1',
    },
    {
      id: 9,
      image: '/uploads/tournament_2026/teamcup_2026_mulde_smashers.jpeg',
      badge: isDe ? '🏸 7. Platz (Platzierungsrunde)' : '🏸 7th Place (Placement Round)',
      title: isDe ? 'WHZ Mulde Smashers in Aktion' : 'WHZ Mulde Smashers in Action',
      subtitle: isDe ? 'Westsächsische Hochschule Zwickau (Team 2)' : 'West Saxon University Zwickau (Team 2)',
      caption: isDe
        ? 'Dynamisches Doppelspiel und packende Dreisatz-Kämpfe der Mulde Smashers aus Zwickau beim Hochschul-Teamcup.'
        : 'Dynamic doubles rallies and spirited three-set matches by the Mulde Smashers from Zwickau.',
      tag: isDe ? 'WH Zwickau' : 'WHZ Team 2',
    },
    {
      id: 10,
      image: '/uploads/tournament_2026/teamcup_2026_predators_selfie.jpeg',
      badge: isDe ? '📸 Teamgeist & Gemeinschaft' : '📸 Team Spirit & Community',
      title: isDe ? 'Turnier-Freude & Fairplay in der Sporthalle' : 'Tournament Camaraderie & Fair Play',
      subtitle: isDe ? 'Sporthalle Thüringer Weg 11, Chemnitz' : 'Sports Hall Thüringer Weg 11, Chemnitz',
      caption: isDe
        ? 'Echte Begeisterung für den Badmintonsport: 45 Studierende und Mitarbeiter feierten ein unvergessliches Turnierwochenende.'
        : 'Pure passion for badminton: 45 students and employees celebrating an unforgettable tournament weekend.',
      tag: isDe ? 'Community' : 'Community Spirit',
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [lightboxSlide, setLightboxSlide] = useState(null);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const progressIntervalRef = useRef(null);

  const SLIDE_DURATION = 5000; // Exactly 5 seconds
  const PROGRESS_TICK = 50;

  // Handle slide transition
  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setProgress(0);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setProgress(0);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setProgress(0);
  };

  // 5-second automatic interval & smooth progress bar
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    setProgress(0);

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + (PROGRESS_TICK / SLIDE_DURATION) * 100;
      });
    }, PROGRESS_TICK);

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
      setProgress(0);
    }, SLIDE_DURATION);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isPlaying, currentIndex, slides.length]);

  const activeSlide = slides[currentIndex];

  return (
    <section className="space-y-4">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-[#005A36] text-[11px] sm:text-xs font-bold mb-1.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{c.badge || '🏟️ Badminton-Zentrum & Impressionen'}</span>
          </div>
          <h2 className="font-display font-black text-xl sm:text-2xl md:text-3xl text-slate-900 tracking-tight">
            {c.title || 'Unser Badminton-Zentrum & Turnier-Highlights'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            {c.subtitle || '10 Impressionen aus der Universitäts-Sporthalle Thüringer Weg 11 mit 12 Badminton-Spielfeldern und dem UNI Team Cup 2026'}
          </p>
        </div>

        {/* Carousel Status & Play/Pause Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              isPlaying 
                ? 'bg-emerald-50 border-emerald-300 text-[#005A36] hover:bg-emerald-100' 
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
            title={isPlaying ? c.pause : c.play}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span className="hidden xs:inline">{c.pause || '5s Auto-Wechsel'}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span className="hidden xs:inline">{c.play || 'Fortsetzen'}</span>
              </>
            )}
          </button>

          <span className="px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 font-mono text-xs font-bold">
            {currentIndex + 1} / {slides.length}
          </span>
        </div>
      </div>

      {/* Main Carousel Frame */}
      <div 
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-950 border border-slate-800 shadow-md group"
        onMouseEnter={() => setIsPlaying(false)}
        onMouseLeave={() => setIsPlaying(true)}
      >
        {/* Progress bar (fills over 5 seconds) */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-30 overflow-hidden">
          <div 
            className="h-full bg-emerald-400 transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Slide Image Container with responsive aspect ratio */}
        <div 
          onClick={() => setLightboxSlide(activeSlide)}
          className="relative w-full h-72 sm:h-96 md:h-[460px] cursor-pointer overflow-hidden select-none"
          title={c.viewFull || 'Vollbild anzeigen'}
        >
          <img
            key={activeSlide.id}
            src={getUploadUrl(activeSlide.image)}
            alt={activeSlide.title}
            className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-500 transition-transform hover:scale-105"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = getUploadUrl('/uploads/tournament_2026/teamcup_2026_group_all_teams.jpeg');
            }}
          />

          {/* Vignette Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-transparent pointer-events-none" />

          {/* Top badges & Fullscreen icon */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950 shadow-md flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                <span>{activeSlide.badge}</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/20">
                <MapPin className="w-3 h-3 text-emerald-300" />
                <span>{c.hallTag || 'Sporthalle Thüringer Weg 11 • 12 Spielfelder'}</span>
              </span>
            </div>

            <div className="p-2 rounded-xl bg-black/50 text-white/90 backdrop-blur-md hover:bg-black/80 hover:text-white transition-colors pointer-events-auto">
              <Maximize2 className="w-4 h-4" />
            </div>
          </div>

          {/* Bottom Overlay Text Caption */}
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 text-white z-10 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-mono font-bold">
              <Camera className="w-3.5 h-3.5" />
              <span>{activeSlide.tag}</span>
              <span>•</span>
              <span>{currentIndex + 1} / {slides.length}</span>
            </div>

            <h3 className="font-display font-black text-lg sm:text-2xl md:text-3xl text-white leading-tight drop-shadow-md">
              {activeSlide.title}
            </h3>

            <p className="text-xs sm:text-sm text-slate-200 max-w-3xl line-clamp-2 sm:line-clamp-3 leading-relaxed drop-shadow">
              {activeSlide.caption}
            </p>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goToPrev();
          }}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-full bg-black/40 hover:bg-black/80 text-white backdrop-blur-md transition-all shadow-md active:scale-95 opacity-80 group-hover:opacity-100 cursor-pointer"
          aria-label={c.prev || 'Vorheriges Bild'}
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-full bg-black/40 hover:bg-black/80 text-white backdrop-blur-md transition-all shadow-md active:scale-95 opacity-80 group-hover:opacity-100 cursor-pointer"
          aria-label={c.next || 'Nächstes Bild'}
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* 10 Thumbnails / Dots Navigator */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto py-1 scrollbar-none">
        <div className="flex items-center gap-1.5 sm:gap-2 mx-auto">
          {slides.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => goToSlide(idx)}
              className={`group relative transition-all duration-200 cursor-pointer ${
                idx === currentIndex
                  ? 'scale-105'
                  : 'opacity-60 hover:opacity-100'
              }`}
              title={`${idx + 1}. ${slide.title}`}
              aria-label={`Slide ${idx + 1}`}
            >
              {/* Desktop: Mini Thumbnail Image, Mobile: Dot Pill */}
              <div className={`hidden sm:block w-14 md:w-16 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                idx === currentIndex
                  ? 'border-emerald-500 shadow-md ring-2 ring-emerald-400/40'
                  : 'border-slate-200'
              }`}>
                <img
                  src={getUploadUrl(slide.image)}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Mobile: Pill Indicator */}
              <div className={`sm:hidden h-2.5 rounded-full transition-all ${
                idx === currentIndex
                  ? 'w-7 bg-emerald-600'
                  : 'w-2.5 bg-slate-300'
              }`} />
            </button>
          ))}
        </div>
      </div>

      {/* LIGHTBOX ZOOM MODAL */}
      {lightboxSlide && (
        <div 
          onClick={() => setLightboxSlide(null)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md p-4 flex items-center justify-center animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl p-4 sm:p-6 text-white space-y-4"
          >
            <button
              onClick={() => setLightboxSlide(null)}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white z-20 cursor-pointer transition-colors"
              aria-label="Schließen"
            >
              <X className="w-5 h-5" />
            </button>

            {/* High-res Image preview */}
            <div className="max-h-[68vh] overflow-hidden rounded-2xl bg-black flex items-center justify-center">
              <img
                src={getUploadUrl(lightboxSlide.image)}
                alt={lightboxSlide.title}
                className="max-h-[68vh] w-auto object-contain mx-auto"
              />
            </div>

            {/* Lightbox Caption Information */}
            <div className="space-y-2 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>{lightboxSlide.badge}</span>
                </span>
                <span className="text-xs text-emerald-300 font-mono">
                  Sporthalle Thüringer Weg 11 • 12 Spielfelder
                </span>
              </div>

              <h3 className="font-display font-black text-xl sm:text-2xl text-white">
                {lightboxSlide.title}
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {lightboxSlide.caption}
              </p>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}

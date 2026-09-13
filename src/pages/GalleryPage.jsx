import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Calendar, 
  Users, 
  Plus, 
  Image as ImageIcon, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  Eye, 
  Maximize2,
  FileText,
  Download,
  Award
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getApiUrl, getUploadUrl, safeFetchJson, saveOfflineSubmission, fileToDataUrl } from '../api/client';
import { DEFAULT_GALLERY } from '../data/mockData';

export default function GalleryPage() {
  const [items, setItems] = useState(DEFAULT_GALLERY);
  const [loading, setLoading] = useState(true);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null); // Lightbox zoom
  const { t, language } = useLanguage();
  const g = t.gallery;
  const isDe = language === 'de';

  // Form state
  const [tournamentName, setTournamentName] = useState('');
  const [result, setResult] = useState('🥇 1. Platz (Gold)');
  const [date, setDate] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [caption, setCaption] = useState('');
  const [submitter, setSubmitter] = useState('');
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchGallery = async () => {
    try {
      const res = await safeFetchJson('/api/gallery');
      if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
        setItems(res.data);
      } else {
        setItems(DEFAULT_GALLERY);
      }
    } catch (err) {
      console.error('Failed to load gallery items, using fallback:', err);
      setItems(DEFAULT_GALLERY);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setPhotoUrlInput('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const payload = {
        tournament_name: tournamentName,
        result,
        date: date || new Date().toLocaleDateString('de-DE'),
        player_name: playerName,
        caption,
        submitted_by: submitter || playerName,
      };

      let photoDataUrl = photoUrlInput.trim();
      if (photoFile) {
        photoDataUrl = await fileToDataUrl(photoFile);
      } else if (!photoDataUrl) {
        throw new Error('Bitte lade ein Foto hoch oder gib eine Bild-URL an.');
      }

      const formData = new FormData();
      Object.entries(payload).forEach(([k, v]) => formData.append(k, v));
      if (photoFile) {
        formData.append('photo', photoFile);
      } else if (photoDataUrl) {
        formData.append('photo_url_input', photoDataUrl);
      }

      const res = await safeFetchJson('/api/gallery/submit', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        if (res.isOffline) {
          saveOfflineSubmission({
            type: 'gallery',
            data: payload,
            photoDataUrl,
          });
          setFeedback({
            type: 'success',
            message: isDe 
              ? 'Foto-Einreichung offline gespeichert! Sobald der Server aktiv ist, wird sie automatisch synchronisiert.'
              : 'Photo submission saved offline! It will synchronize automatically when the server is online.',
          });
          setTournamentName('');
          setResult('');
          setDate('');
          setPlayerName('');
          setCaption('');
          setSubmitter('');
          setPhotoFile(null);
          setPhotoPreview('');
          setPhotoUrlInput('');
          setTimeout(() => setIsSubmitModalOpen(false), 2500);
          return;
        }
        throw new Error(res.error || g.errorMsg);
      }

      setFeedback({ type: 'success', message: g.successMsg });

      // Reset fields
      setTournamentName('');
      setResult('');
      setDate('');
      setPlayerName('');
      setCaption('');
      setSubmitter('');
      setPhotoFile(null);
      setPhotoPreview('');
      setPhotoUrlInput('');

      // Auto close modal after 3 seconds
      setTimeout(() => {
        setIsSubmitModalOpen(false);
        setFeedback(null);
      }, 3500);

    } catch (err) {
      setFeedback({ type: 'error', message: err.message || g.errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4 sm:pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-[#005A36] text-[11px] sm:text-xs font-bold mb-2">
            <Trophy className="w-3.5 h-3.5" />
            <span>{g.badge}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            {g.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {g.subtitle}
          </p>
        </div>

        {/* Action Button: Player Submit Result & Photo */}
        <button
          onClick={() => {
            setIsSubmitModalOpen(true);
            setFeedback(null);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[48px] rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-white bg-[#005A36] hover:bg-[#004328] active:bg-[#003B23] shadow-sm hover:shadow transition-all w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{g.submitBtn}</span>
        </button>
      </div>
      {/* 2026 Tournament Results & PDF Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-[#005A36] text-white p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black">
            <Trophy className="w-3.5 h-3.5" />
            <span>{isDe ? 'Universitäts-Badminton-Team-Cup 2026' : 'University Badminton Team Cup 2026'}</span>
          </div>
          <h2 className="font-display font-black text-xl sm:text-2xl md:text-3xl text-white tracking-tight">
            {isDe ? 'Turnierergebnisse & Fotogalerie' : 'Tournament Results & Photo Gallery'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {isDe 
              ? 'Der offizielle 12-seitige Ergebnisbericht mit allen Spielerwertungen der 45 Aktiven, Teamstatistiken und Urkunden steht als PDF bereit.'
              : 'The comprehensive 12-page tournament report with individual player rankings for all 45 athletes, team statistics, and certificates is available as PDF.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
          <a
            href={getUploadUrl('/uploads/tournament_2026/Uni_Badminton_Team_Cup_2026_Ergebnisbericht.pdf')}
            target="_blank"
            rel="noreferrer"
            download
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#005A36] hover:bg-[#004328] text-white text-xs font-bold shadow-sm transition-colors w-full sm:w-auto"
          >
            <FileText className="w-4 h-4" />
            <span>{isDe ? 'Ergebnisbericht (PDF, 12 S.)' : 'Download Report (PDF)'}</span>
            <Download className="w-3.5 h-3.5 opacity-70" />
          </a>

          <a
            href={getUploadUrl('/uploads/tournament_2026/UNI_Badminton_Rules_EN_DE.pdf')}
            target="_blank"
            rel="noreferrer"
            download
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors w-full sm:w-auto"
          >
            <span>{isDe ? 'Regeln (DE/EN)' : 'Rules'}</span>
            <Download className="w-3.5 h-3.5 opacity-70" />
          </a>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 bg-slate-100 rounded-3xl" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">{g.empty}</p>
        </div>
      )}

      {/* Gallery Cards Grid (Responsive: 1 col on mobile, 2 col on tablet, 3 col on desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
          >
            <div>
              {/* Photo with hover zoom & Lightbox trigger */}
              <div 
                onClick={() => setSelectedPhoto(item)}
                className="relative h-56 sm:h-64 bg-slate-100 overflow-hidden cursor-pointer"
                title={g.viewFullPhoto}
              >
                <img
                  src={getUploadUrl(item.photo_url)}
                  alt={item.tournament_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

                {/* Result Badge */}
                <div className="absolute top-3 right-3">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950 shadow-md flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>{item.result}</span>
                  </span>
                </div>

                {/* Date & Tournament Name at bottom of photo */}
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-mono mb-0.5">
                    <Calendar className="w-3 h-3" />
                    <span>{item.date}</span>
                  </div>
                  <h3 className="font-display font-black text-base sm:text-lg leading-tight line-clamp-2">
                    {item.tournament_name}
                  </h3>
                </div>

                {/* Expand icon */}
                <div className="absolute top-3 left-3 p-1.5 rounded-lg bg-black/40 text-white/80 group-hover:text-white backdrop-blur-sm transition-colors">
                  <Maximize2 className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Details Body */}
              <div className="p-4 sm:p-5 space-y-3">
                {/* Players */}
                <div className="flex items-center gap-2 text-xs text-slate-800">
                  <Users className="w-4 h-4 text-[#005A36] flex-shrink-0" />
                  <span className="font-bold">{g.playersLabel}</span>
                  <span className="truncate">{item.player_name}</span>
                </div>

                {/* Caption / Match report */}
                {item.caption && (
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {item.caption}
                  </p>
                )}
              </div>
            </div>

            {/* Card Footer with Submitter Tag */}
            <div className="px-4 sm:px-5 pb-4 pt-0 text-[10px] text-slate-400 border-t border-slate-100 flex items-center justify-between pt-2">
              <span>TU Chemnitz Badminton</span>
              <span className="truncate">{item.submitted_by ? `${item.submitted_by}` : ''}</span>
            </div>
          </div>
        ))}
      </div>

      {/* LIGHTBOX MODAL */}
      {selectedPhoto && (
        <div 
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl space-y-4 p-4 sm:p-6 text-white"
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-10"
              aria-label="Schließen"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="max-h-[65vh] overflow-hidden rounded-2xl bg-black flex items-center justify-center">
              <img
                src={getUploadUrl(selectedPhoto.photo_url)}
                alt={selectedPhoto.tournament_name}
                className="max-h-[65vh] w-auto object-contain mx-auto"
              />
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950 flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>{selectedPhoto.result}</span>
                </span>
                <span className="text-xs text-slate-400 font-mono">{selectedPhoto.date}</span>
              </div>

              <h3 className="font-display font-black text-xl sm:text-2xl text-white">
                {selectedPhoto.tournament_name}
              </h3>

              <div className="flex items-center gap-2 text-xs text-emerald-300">
                <Users className="w-4 h-4" />
                <span>{g.playersLabel} <strong>{selectedPhoto.player_name}</strong></span>
              </div>

              {selectedPhoto.caption && (
                <p className="text-xs sm:text-sm text-slate-300 pt-1 leading-relaxed">
                  {selectedPhoto.caption}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PLAYER SUBMISSION MODAL (Submitted items go to pending for admin approval) */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm p-4 flex items-center justify-center overflow-y-auto animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50">
              <div>
                <span className="text-[11px] font-bold text-[#005A36] uppercase tracking-wider block">
                  {g.badge}
                </span>
                <h3 className="font-display font-black text-lg sm:text-xl text-slate-900">
                  {g.modalTitle}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {g.modalSubtitle}
                </p>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Feedback Banner */}
            {feedback && (
              <div className={`mx-6 mt-4 p-4 rounded-2xl text-xs flex items-start gap-2.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed font-medium">{feedback.message}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              
              {/* Tournament Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {g.fieldTournament} *
                </label>
                <input
                  type="text"
                  required
                  value={tournamentName}
                  onChange={(e) => setTournamentName(e.target.value)}
                  placeholder={g.fieldTournamentPlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#005A36] focus:ring-1 focus:ring-[#005A36]"
                />
              </div>

              {/* Result / Score */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {g.fieldResult} *
                </label>
                <input
                  type="text"
                  required
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  placeholder={g.fieldResultPlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#005A36] focus:ring-1 focus:ring-[#005A36]"
                />
              </div>

              {/* Date & Players (2 columns on tablet/desktop) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    {g.fieldDate}
                  </label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="z.B. 14.11.2026"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#005A36] focus:ring-1 focus:ring-[#005A36]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    {g.fieldPlayers} *
                  </label>
                  <input
                    type="text"
                    required
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder={g.fieldPlayersPlaceholder}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#005A36] focus:ring-1 focus:ring-[#005A36]"
                  />
                </div>
              </div>

              {/* Photo Upload & Preview */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  {g.fieldPhoto} *
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <label className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-200 hover:border-[#005A36] rounded-xl cursor-pointer text-xs font-bold text-slate-600 hover:text-[#005A36] transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Datei auswählen (JPG, PNG, WebP)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  <span className="text-[10px] text-slate-400 font-bold uppercase">oder</span>

                  <input
                    type="url"
                    value={photoUrlInput}
                    onChange={(e) => {
                      setPhotoUrlInput(e.target.value);
                      setPhotoFile(null);
                      setPhotoPreview(e.target.value);
                    }}
                    placeholder="https://..."
                    className="w-full sm:w-1/2 px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#005A36]"
                  />
                </div>

                {photoPreview && (
                  <div className="relative w-full h-36 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 mt-2">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview('');
                        setPhotoUrlInput('');
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Caption */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {g.fieldCaption}
                </label>
                <textarea
                  rows={2}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder={g.fieldCaptionPlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#005A36] resize-none"
                />
              </div>

              {/* Submitter Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {g.fieldSubmitter}
                </label>
                <input
                  type="text"
                  value={submitter}
                  onChange={(e) => setSubmitter(e.target.value)}
                  placeholder="z.B. Lukas Weber"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#005A36]"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  {g.btnCancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#005A36] hover:bg-[#004328] disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
                >
                  {submitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{submitting ? g.submitting : g.btnSubmit}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

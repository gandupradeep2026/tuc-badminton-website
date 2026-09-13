import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Clock, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  Calendar,
  Users
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function TrainingTimingsModal({ 
  isOpen, 
  onClose, 
  schedules, 
  onSaveSuccess, 
  adminToken 
}) {
  const { t, language } = useLanguage();
  const tr = t.home?.trainingEditor || {};
  const isDe = language === 'de';

  const [items, setItems] = useState(() => JSON.parse(JSON.stringify(schedules || [])));
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (schedules && schedules.length > 0) {
      setItems(JSON.parse(JSON.stringify(schedules)));
    }
  }, [schedules, isOpen]);

  if (!isOpen) return null;

  const handleChange = (index, field, value) => {
    const next = [...items];
    next[index][field] = value;
    setItems(next);
  };

  const handleAddSlot = () => {
    setItems([
      ...items,
      {
        id: null, // New
        day_title: isDe ? 'Donnerstag' : 'Thursday',
        time_slot: '18:00 - 20:00 Uhr',
        group_name: isDe ? 'Freies Training & Matchpraxis' : 'Open Practice & Matches',
        hall_name: 'Sporthalle Thüringer Weg 11',
        courts_info: isDe ? '12 Spielfelder' : '12 Courts',
        notes: '',
        display_order: items.length + 1
      }
    ]);
  };

  const handleDeleteSlot = async (index) => {
    const item = items[index];
    if (item.id && adminToken) {
      try {
        await fetch(`/api/admin/training-schedules/${item.id}`, {
          method: 'DELETE',
          headers: { 'x-admin-token': adminToken }
        });
      } catch (err) {
        console.error('Failed to delete slot:', err);
      }
    }
    const next = items.filter((_, i) => i !== index);
    setItems(next);
  };

  const handleSaveAll = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      for (let i = 0; i < items.length; i++) {
        const slot = items[i];
        slot.display_order = i + 1;

        if (slot.id) {
          // Update
          const res = await fetch(`/api/admin/training-schedules/${slot.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-token': adminToken
            },
            body: JSON.stringify(slot)
          });
          if (!res.ok) throw new Error('Fehler beim Aktualisieren der Trainingszeit');
        } else {
          // Create
          const res = await fetch('/api/admin/training-schedules', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-token': adminToken
            },
            body: JSON.stringify(slot)
          });
          if (!res.ok) throw new Error('Fehler beim Anlegen der Trainingszeit');
        }
      }

      setFeedback({ type: 'success', message: tr.success || 'Trainingszeiten erfolgreich aktualisiert!' });
      setTimeout(() => {
        onSaveSuccess();
        onClose();
      }, 1200);

    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Fehler beim Speichern' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm p-4 flex items-center justify-center overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-[#005A36]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-slate-900 leading-tight">
                {tr.modalTitle || 'Trainingszeiten bearbeiten (Home Page)'}
              </h3>
              <p className="text-xs text-slate-500">
                {tr.modalDesc || 'Passe die Wochentage, Uhrzeiten und Halleninfos direkt von der Startseite an.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`p-4 mx-6 mt-4 rounded-xl flex items-center gap-2.5 text-xs font-bold ${
            feedback.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSaveAll} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {items.map((slot, index) => (
            <div 
              key={slot.id || `new-${index}`}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative group"
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-600 font-mono">
                  Slot #{index + 1}
                </span>

                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteSlot(index)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 hover:text-rose-700 transition-colors cursor-pointer"
                    title={tr.deleteSlot || 'Löschen'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {tr.dayLabel || 'Wochentag'}
                  </label>
                  <input
                    type="text"
                    required
                    value={slot.day_title}
                    onChange={(e) => handleChange(index, 'day_title', e.target.value)}
                    placeholder="z.B. Montag"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-none focus:border-[#005A36]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {tr.timeLabel || 'Uhrzeit'}
                  </label>
                  <input
                    type="text"
                    required
                    value={slot.time_slot}
                    onChange={(e) => handleChange(index, 'time_slot', e.target.value)}
                    placeholder="z.B. 18:00 - 20:00 Uhr"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-800 focus:outline-none focus:border-[#005A36]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-xs">
                  {tr.groupLabel || 'Zielgruppe & Niveau'}
                </label>
                <input
                  type="text"
                  required
                  value={slot.group_name}
                  onChange={(e) => handleChange(index, 'group_name', e.target.value)}
                  placeholder="z.B. Einsteiger, Hochschulsport & Freies Spiel"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#005A36]"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Halle
                  </label>
                  <input
                    type="text"
                    value={slot.hall_name}
                    onChange={(e) => handleChange(index, 'hall_name', e.target.value)}
                    placeholder="Sporthalle Thüringer Weg 11"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#005A36]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Felder
                  </label>
                  <input
                    type="text"
                    value={slot.courts_info}
                    onChange={(e) => handleChange(index, 'courts_info', e.target.value)}
                    placeholder="12 Spielfelder"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#005A36] focus:outline-none focus:border-[#005A36]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-500 mb-1 text-[11px]">
                  {tr.notesLabel || 'Zusatzhinweis / Beschreibung'}
                </label>
                <input
                  type="text"
                  value={slot.notes || ''}
                  onChange={(e) => handleChange(index, 'notes', e.target.value)}
                  placeholder="Grundlagenausbildung, Service & Zuspiel..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-600 focus:outline-none focus:border-[#005A36]"
                />
              </div>
            </div>
          ))}

          {/* Add Slot Button */}
          <button
            type="button"
            onClick={handleAddSlot}
            className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#005A36] text-[#005A36] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-white"
          >
            <Plus className="w-4 h-4" />
            <span>{tr.addSlot || 'Neuen Trainings-Slot hinzufügen'}</span>
          </button>
        </form>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            {tr.cancel || 'Abbrechen'}
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#005A36] hover:bg-[#004328] active:bg-[#003B23] transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? (tr.saving || 'Wird gespeichert...') : (tr.save || 'Änderungen speichern')}</span>
          </button>
        </div>

      </div>
    </div>
  );
}

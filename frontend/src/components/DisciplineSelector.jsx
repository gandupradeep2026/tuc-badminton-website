import React, { useState, useEffect } from 'react';
import { Check, User, Users, Shuffle, Edit2 } from 'lucide-react';

/**
 * Parses any specialization string into standard boolean flags
 */
export function parseDisciplines(valueStr) {
  if (!valueStr) return { singles: false, doubles: false, mixed: false };
  const s = valueStr.toLowerCase();
  
  const singles = s.includes('singles') || s.includes('single') || s.includes('einzel') || s.includes('(he)') || s.includes('(de)');
  const mixed = s.includes('mix') || s.includes('(mx)');
  
  // Isolate doubles so "mixed doubles" does not trigger standard doubles
  const withoutMixed = s.replace(/mixed\s+doubles?/g, '').replace(/gemischtes\s+doppel/g, '').replace(/\(mx\)/g, '');
  const doubles = withoutMixed.includes('doubles') || withoutMixed.includes('double') || withoutMixed.includes('doppel') || s.includes('(hd)') || s.includes('(dd)');
  
  return { singles, doubles, mixed };
}

/**
 * Formats boolean flags into the canonical database string based on gender
 */
export function formatDisciplines(gender, { singles, doubles, mixed }) {
  const parts = [];
  const isWomen = gender === 'women';
  
  if (isWomen) {
    if (singles) parts.push("Women's Singles (DE)");
    if (doubles) parts.push("Women's Doubles (DD)");
    if (mixed) parts.push("Mixed (MX)");
  } else {
    if (singles) parts.push("Men's Singles (HE)");
    if (doubles) parts.push("Men's Doubles (HD)");
    if (mixed) parts.push("Mixed (MX)");
  }
  
  return parts.join(', ');
}

/**
 * Returns preset key for current selection
 */
export function getPresetKey({ singles, doubles, mixed }) {
  if (singles && doubles && mixed) return 'all';
  if (singles && doubles && !mixed) return 'singles_doubles';
  if (!singles && doubles && mixed) return 'doubles_mixed';
  if (singles && !doubles && mixed) return 'singles_mixed';
  if (singles && !doubles && !mixed) return 'singles';
  if (!singles && doubles && !mixed) return 'doubles';
  if (!singles && !doubles && mixed) return 'mixed';
  if (!singles && !doubles && !mixed) return 'none';
  return 'custom';
}

export default function DisciplineSelector({
  gender = 'men',
  value = '',
  onChange,
  isGerman = false,
  label,
  required = true,
}) {
  const [showManual, setShowManual] = useState(false);
  const parsed = parseDisciplines(value);
  const currentPreset = getPresetKey(parsed);
  const isWomen = gender === 'women';

  // Synchronize string when gender changes
  useEffect(() => {
    if (parsed.singles || parsed.doubles || parsed.mixed) {
      const reformatted = formatDisciplines(gender, parsed);
      if (reformatted && reformatted !== value && !showManual) {
        onChange(reformatted);
      }
    }
  }, [gender]);

  const handleToggle = (type) => {
    const next = { ...parsed, [type]: !parsed[type] };
    const formatted = formatDisciplines(gender, next);
    onChange(formatted);
  };

  const handlePresetSelect = (preset) => {
    let next = { singles: false, doubles: false, mixed: false };
    if (preset === 'all') next = { singles: true, doubles: true, mixed: true };
    else if (preset === 'singles_doubles') next = { singles: true, doubles: true, mixed: false };
    else if (preset === 'doubles_mixed') next = { singles: false, doubles: true, mixed: true };
    else if (preset === 'singles_mixed') next = { singles: true, doubles: false, mixed: true };
    else if (preset === 'singles') next = { singles: true, doubles: false, mixed: false };
    else if (preset === 'doubles') next = { singles: false, doubles: true, mixed: false };
    else if (preset === 'mixed') next = { singles: false, doubles: false, mixed: true };
    else if (preset === 'none') next = { singles: false, doubles: false, mixed: false };

    const formatted = formatDisciplines(gender, next);
    onChange(formatted);
  };

  const disciplinesConfig = [
    {
      key: 'singles',
      label: isWomen 
        ? (isGerman ? "Dameneinzel (DE)" : "Women's Singles (DE)")
        : (isGerman ? "Herreneinzel (HE)" : "Men's Singles (HE)"),
      code: isWomen ? "DE" : "HE",
      subText: isGerman ? "Einzel" : "Singles",
      icon: User,
      active: parsed.singles,
    },
    {
      key: 'doubles',
      label: isWomen 
        ? (isGerman ? "Damendoppel (DD)" : "Women's Doubles (DD)")
        : (isGerman ? "Herrendoppel (HD)" : "Men's Doubles (HD)"),
      code: isWomen ? "DD" : "HD",
      subText: isGerman ? "Doppel" : "Doubles",
      icon: Users,
      active: parsed.doubles,
    },
    {
      key: 'mixed',
      label: isGerman ? "Mixed (MX)" : "Mixed (MX)",
      code: "MX",
      subText: isGerman ? "Gemischt" : "Mixed",
      icon: Shuffle,
      active: parsed.mixed,
    },
  ];

  const presets = isGerman
    ? [
        { id: 'all', title: 'Alle 3 (Einzel, Doppel, Mixed)' },
        { id: 'singles_doubles', title: 'Einzel & Doppel' },
        { id: 'doubles_mixed', title: 'Doppel & Mixed' },
        { id: 'singles_mixed', title: 'Einzel & Mixed' },
        { id: 'singles', title: 'Nur Einzel' },
        { id: 'doubles', title: 'Nur Doppel' },
        { id: 'mixed', title: 'Nur Mixed' },
      ]
    : [
        { id: 'all', title: 'All 3 (Singles, Doubles, Mixed)' },
        { id: 'singles_doubles', title: 'Singles & Doubles' },
        { id: 'doubles_mixed', title: 'Doubles & Mixed' },
        { id: 'singles_mixed', title: 'Singles & Mixed' },
        { id: 'singles', title: 'Singles Only' },
        { id: 'doubles', title: 'Doubles Only' },
        { id: 'mixed', title: 'Mixed Only' },
      ];

  const activeCount = [parsed.singles, parsed.doubles, parsed.mixed].filter(Boolean).length;

  return (
    <div className="space-y-2.5">
      {/* Label and Dropdown selector row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <label className="font-bold text-slate-700 block text-xs">
          {label || (isGerman ? 'Spezialisierung / Disziplinen *' : 'Specialization / Disciplines *')}
        </label>
        
        {/* Preset Dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            {isGerman ? 'Schnellwahl:' : 'Preset:'}
          </span>
          <select
            value={currentPreset}
            onChange={(e) => handlePresetSelect(e.target.value)}
            className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-[#005A36] focus:outline-none"
          >
            <option value="none">{isGerman ? '-- Keine ausgewählt --' : '-- None selected --'}</option>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
            {currentPreset === 'custom' && (
              <option value="custom">{isGerman ? 'Individuelle Auswahl' : 'Custom Selection'}</option>
            )}
          </select>
        </div>
      </div>

      {/* Checkbox Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {disciplinesConfig.map((disc) => {
          const Icon = disc.icon;
          return (
            <button
              key={disc.key}
              type="button"
              onClick={() => handleToggle(disc.key)}
              className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border text-left transition-all min-h-[46px] ${
                disc.active
                  ? 'border-[#005A36] bg-emerald-50/70 text-slate-900 ring-1 ring-[#005A36]/40 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600 hover:bg-slate-50/70'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors flex-shrink-0 ${
                    disc.active
                      ? 'bg-[#005A36] border-[#005A36] text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {disc.active && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate leading-tight">
                    {disc.label}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {disc.subText}
                  </p>
                </div>
              </div>

              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ml-1.5 ${
                  disc.active
                    ? 'bg-[#005A36] text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {disc.code}
              </span>
            </button>
          );
        })}
      </div>

      {/* Live Badge Preview & Validation / Manual Mode */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-400 font-medium">
            {isGerman ? 'Vorschau:' : 'Preview:'}
          </span>
          {activeCount > 0 ? (
            value.split(',').map((part, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#005A36]/10 text-[#005A36] text-[11px] font-bold border border-[#005A36]/20"
              >
                {part.trim()}
              </span>
            ))
          ) : (
            <span className="text-[11px] text-amber-600 font-medium">
              {isGerman
                ? '⚠️ Bitte mindestens eine Disziplin ankreuzen'
                : '⚠️ Please choose at least one discipline'}
            </span>
          )}
        </div>

        {/* Manual text toggle */}
        <button
          type="button"
          onClick={() => setShowManual(!showManual)}
          className="text-[11px] text-slate-500 hover:text-[#005A36] font-medium flex items-center gap-1 transition-colors"
        >
          <Edit2 className="w-3 h-3" />
          <span>{showManual ? (isGerman ? 'Manuell schließen' : 'Close manual') : (isGerman ? 'Text anpassen' : 'Custom text')}</span>
        </button>
      </div>

      {/* Optional Raw Text Field (for edge-case customization) */}
      {showManual && (
        <div className="pt-1.5 animate-in fade-in">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={isGerman ? "z.B. Men's Singles (HE), Mixed (MX)" : "e.g. Men's Singles (HE), Mixed (MX)"}
            className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white"
          />
        </div>
      )}

      {/* Hidden input to ensure HTML5 form validation if required */}
      {required && (
        <input
          type="text"
          value={value}
          onChange={() => {}}
          required
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

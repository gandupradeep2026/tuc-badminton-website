import React from 'react';
import { getUploadUrl } from '../api/client';

export const AVATAR_OPTIONS = [
  { id: 'badminton_smash', nameDe: 'Smash Ace', nameEn: 'Smash Ace', descDe: 'Angriffsspieler', descEn: 'Attacking player', icon: '🏸', bg: 'bg-emerald-600', text: 'text-white' },
  { id: 'speed_racket', nameDe: 'Speed Shuttler', nameEn: 'Speed Shuttler', descDe: 'Schnelle Beinarbeit', descEn: 'Fast footwork', icon: '⚡', bg: 'bg-amber-500', text: 'text-white' },
  { id: 'tuc_lion', nameDe: 'Chemnitz Lion', nameEn: 'Chemnitz Lion', descDe: 'Teamgeist TU Chemnitz', descEn: 'TUC Team Spirit', icon: '🦁', bg: 'bg-indigo-600', text: 'text-white' },
  { id: 'golden_shuttle', nameDe: 'Golden Feather', nameEn: 'Golden Feather', descDe: 'Federball-Profi', descEn: 'Feather specialist', icon: '🪶', bg: 'bg-yellow-500', text: 'text-white' },
  { id: 'defender_shield', nameDe: 'Iron Defense', nameEn: 'Iron Defense', descDe: 'Abwehrkünstler', descEn: 'Defensive wall', icon: '🛡️', bg: 'bg-blue-600', text: 'text-white' },
  { id: 'trickshot_master', nameDe: 'Trickshot', nameEn: 'Trickshot', descDe: 'Täuschung & Finesse', descEn: 'Deception & finesse', icon: '🎯', bg: 'bg-teal-600', text: 'text-white' },
  { id: 'net_play', nameDe: 'Net Drop', nameEn: 'Net Drop', descDe: 'Netzspiel & Drop', descEn: 'Net play & drops', icon: '✨', bg: 'bg-rose-500', text: 'text-white' },
  { id: 'champion_star', nameDe: 'Champion Star', nameEn: 'Champion Star', descDe: 'Turnierkämpfer', descEn: 'Tournament fighter', icon: '🌟', bg: 'bg-purple-600', text: 'text-white' },
];

export default function BadmintonAvatar({ 
  photoUrl, 
  avatarType = 'badminton_smash', 
  name = '', 
  size = 'md',
  className = '' 
}) {
  const sizeClasses = {
    xs: 'w-7 h-7 text-xs rounded-lg',
    sm: 'w-9 h-9 sm:w-10 sm:h-10 text-sm rounded-xl',
    md: 'w-14 h-14 sm:w-16 sm:h-16 text-xl sm:text-2xl rounded-2xl',
    lg: 'w-20 h-20 text-3xl rounded-3xl',
  };

  const option = AVATAR_OPTIONS.find(a => a.id === avatarType) || AVATAR_OPTIONS[0];
  const [imgError, setImgError] = React.useState(false);

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  if (photoUrl && getUploadUrl(photoUrl) && !imgError) {
    return (
      <div className={`overflow-hidden border border-slate-200 shadow-xs flex-shrink-0 bg-slate-100 ${selectedSize} ${className}`}>
        <img
          src={getUploadUrl(photoUrl)}
          alt={name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div 
      className={`flex items-center justify-center flex-shrink-0 shadow-xs border border-white/20 select-none ${option.bg} ${option.text} ${selectedSize} ${className}`}
      title={option.nameDe}
    >
      <span>{option.icon}</span>
    </div>
  );
}

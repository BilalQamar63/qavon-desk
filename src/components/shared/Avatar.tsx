import React, { useState } from 'react';
import sarahAvatar from '../../assets/images/avatar_sarah_jenkins_1794560496936.jpg';
import davidAvatar from '../../assets/images/avatar_david_vance_1794560497240.jpg';
import elenaAvatar from '../../assets/images/avatar_elena_rostova_1794560496897.jpg';

const LOCAL_AVATAR_BY_NAME: Record<string, string> = {
  'sarah jenkins': sarahAvatar,
  'david vance': davidAvatar,
  'elena rostova': elenaAvatar,
};

interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'w-5 h-5 text-[10px]',
  sm: 'w-7 h-7 text-[11px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
};

const INITIAL_BG_TONES = [
  'bg-[#FEF6E2] text-[#B47200]',
  'bg-emerald-50 text-emerald-700',
  'bg-amber-50 text-amber-800',
  'bg-[#EFEAE0] text-[#181A1F]',
];

function getInitials(name?: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getToneClass(name?: string): string {
  if (!name) return INITIAL_BG_TONES[3];
  const hash = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return INITIAL_BG_TONES[hash % INITIAL_BG_TONES.length];
}

export const Avatar: React.FC<AvatarProps> = ({
  name = 'User',
  src,
  size = 'md',
  className = '',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  const normalized = name.trim().toLowerCase();
  const localPortrait = LOCAL_AVATAR_BY_NAME[normalized];
  const safeExternal = src && !src.includes('unsplash.com') ? src : '';
  const resolvedSrc = localPortrait || safeExternal;

  const sizeClass = SIZE_CLASSES[size];

  if (resolvedSrc && !imgFailed) {
    return (
      <img
        src={resolvedSrc}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className={`${sizeClass} rounded-full object-cover border border-[#EAE4D7] shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      aria-label={name}
      className={`${sizeClass} rounded-full border border-[#EAE4D7] flex items-center justify-center font-semibold shrink-0 select-none ${getToneClass(name)} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
};

import React, { useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  width?: number;
  height?: number;
  logoUrl?: string;
  restaurantName?: string;
}

export default function Logo({ className = '', size = 'md', width, height, logoUrl, restaurantName }: LogoProps) {
  const [imgError, setImgError] = useState(false);

  // Compute dimensions based on size presets if width/height are not provided
  let defaultWidth = 120;
  let defaultHeight = 120;

  if (size === 'sm') {
    defaultWidth = 40;
    defaultHeight = 40;
  } else if (size === 'md') {
    defaultWidth = 120;
    defaultHeight = 120;
  } else if (size === 'lg') {
    defaultWidth = 180;
    defaultHeight = 180;
  } else if (size === 'xl') {
    defaultWidth = 260;
    defaultHeight = 260;
  }

  const finalWidth = width || defaultWidth;
  const finalHeight = height || defaultHeight;
  const displayName = restaurantName || 'Yikéli';

  // Get restaurant initials (e.g. "Restaurant Yikéli" -> "Y", "Le Jardin" -> "LJ")
  const getInitials = (name: string) => {
    const clean = name.replace(/^(Restaurant|Le|La|L'|Bistro|Bar|Café)\s+/i, '').trim();
    const words = clean.split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return (name.slice(0, 2) || 'R').toUpperCase();
  };

  if (logoUrl && logoUrl.trim() !== '' && !imgError) {
    return (
      <div 
        className={`flex items-center justify-center overflow-hidden shrink-0 ${className}`}
        style={{ width: finalWidth, height: finalHeight }}
      >
        <img
          src={logoUrl}
          alt={displayName}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          className="w-full h-full object-cover select-none rounded-inherit"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Fallback if no logoUrl or image error: render dynamic restaurant monogram badge
  if (finalWidth <= 56) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white font-black shadow-xs shrink-0 select-none ${className}`}
        style={{ width: finalWidth, height: finalHeight }}
        title={displayName}
      >
        <span style={{ fontSize: Math.max(10, Math.floor(finalWidth * 0.42)) }} className="tracking-tight">
          {getInitials(displayName)}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      <div
        className="rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center shadow-md mb-2"
        style={{ width: Math.min(finalWidth * 0.5, 72), height: Math.min(finalHeight * 0.5, 72) }}
      >
        <UtensilsCrossed className="w-1/2 h-1/2 text-white" />
      </div>
      <span className="font-extrabold text-slate-900 tracking-tight leading-tight" style={{ fontSize: Math.max(14, Math.floor(finalWidth * 0.14)) }}>
        {displayName}
      </span>
      <span className="text-[10px] text-orange-600 font-bold uppercase tracking-widest mt-0.5">
        Restaurant
      </span>
    </div>
  );
}

import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  width?: number;
  height?: number;
}

export default function Logo({ className = '', size = 'md', width, height }: LogoProps) {
  // Compute dimensions based on size presets if width/height are not provided
  let defaultWidth = 120;
  let defaultHeight = 120;

  if (size === 'sm') {
    defaultWidth = 60;
    defaultHeight = 60;
  } else if (size === 'md') {
    defaultWidth = 140;
    defaultHeight = 140;
  } else if (size === 'lg') {
    defaultWidth = 200;
    defaultHeight = 200;
  } else if (size === 'xl') {
    defaultWidth = 320;
    defaultHeight = 320;
  }

  const finalWidth = width || defaultWidth;
  const finalHeight = height || defaultHeight;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 512 512"
        width={finalWidth}
        height={finalHeight}
        xmlns="http://www.w3.org/2000/svg"
        className="max-w-full h-auto select-none"
      >
        <defs>
          {/* Main orbit gradient for the left arc */}
          <linearGradient id="orbitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff5a00" />
            <stop offset="50%" stopColor="#ff8a00" />
            <stop offset="100%" stopColor="#ffa600" stopOpacity="0.1" />
          </linearGradient>
          
          {/* Text/Brush soft drop shadow */}
          <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Orange Arc framing the left side of the logo */}
        <path
          d="M 270,105 C 135,110 85,215 90,305 C 95,385 160,432 290,438"
          fill="none"
          stroke="url(#orbitGradient)"
          strokeWidth="11"
          strokeLinecap="round"
        />

        {/* Chef's Hat (tilted, outline style) in Orange */}
        <g transform="translate(290, 105) rotate(14)">
          {/* Hat base band */}
          <path
            d="M 12,42 C 12,42 16,36 34,36 C 52,36 56,42 56,42"
            fill="none"
            stroke="#ff5a00"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M 12,47 C 12,47 16,42 34,42 C 52,42 56,47 56,47"
            fill="none"
            stroke="#ff5a00"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Hat puffy top loops */}
          <path
            d="M 14,36 C 5,30 2,13 14,8 C 12,-3 26,-7 34,2 C 43,-7 56,-3 55,8 C 66,13 64,30 54,36"
            fill="none"
            stroke="#ff5a00"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* cursive text: Yikéli */}
        <text
          x="264"
          y="288"
          fontFamily="'Caveat', 'Great Vibes', 'Brush Script MT', 'Dancing Script', 'Playfair Display', cursive"
          fontSize="112"
          fontWeight="900"
          fill="#ff5a00"
          textAnchor="middle"
          filter="url(#softShadow)"
          style={{ letterSpacing: '-1.5px', transform: 'skewX(-6deg)' }}
        >
          Yikéli
        </text>

        {/* Separator Line with Central Diamond */}
        <g>
          {/* Left Line */}
          <line x1="140" y1="318" x2="238" y2="318" stroke="#475569" strokeWidth="2.5" />
          {/* Center Diamond */}
          <polygon points="256,313 261,318 256,323 251,318" fill="#475569" />
          {/* Right Line */}
          <line x1="274" y1="318" x2="372" y2="318" stroke="#475569" strokeWidth="2.5" />
        </g>

        {/* secondary text: RESTAURANT */}
        <text
          x="256"
          y="346"
          fontFamily="'Cinzel', 'Times New Roman', 'Montserrat', 'Georgia', serif"
          fontSize="24"
          letterSpacing="6.5"
          fill="#334155"
          textAnchor="middle"
          fontWeight="900"
        >
          RESTAURANT
        </text>
      </svg>
    </div>
  );
}

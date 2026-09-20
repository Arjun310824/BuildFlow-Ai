import React from 'react';

/**
 * BuildFlowLogo: Enterprise Construction-Tech Brand Silhouette.
 * Features:
 * - 2-3 vertical architectural building columns
 * - Central upward orange growth/construction arrow/chevron (#FF6A00)
 * - Primary Blue (#1677D2) and Deep Architectural Navy (#0B4F9C)
 * - Clean geometric vector alignment
 */
export const BuildFlowLogo = ({ size = 42, className = '', style = {} }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      <defs>
        {/* Primary Blue Gradient */}
        <linearGradient id="bfPrimaryBlue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2196F3" />
          <stop offset="100%" stopColor="#1677D2" />
        </linearGradient>

        {/* Deep Navy Gradient */}
        <linearGradient id="bfDeepNavy" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1565C0" />
          <stop offset="100%" stopColor="#0B4F9C" />
        </linearGradient>

        {/* Vibrant Orange Gradient */}
        <linearGradient id="bfOrange" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF7A1A" />
          <stop offset="100%" stopColor="#FF6A00" />
        </linearGradient>

        {/* Subtle drop shadow for depth */}
        <filter id="bfGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="rgba(11, 79, 156, 0.25)" />
        </filter>
      </defs>

      {/* Building Structure Group */}
      <g filter="url(#bfGlow)">
        {/* Outer Left Column - Shortest with Angled Top */}
        <path
          d="M8 32 L15 28 V58 H8 Z"
          fill="url(#bfPrimaryBlue)"
          rx="1"
        />

        {/* Mid-Left Column - Medium Height with Angled Top */}
        <path
          d="M18 25 L25 21 V58 H18 Z"
          fill="url(#bfDeepNavy)"
          rx="1"
        />

        {/* Center Tower Left Column */}
        <path
          d="M27 21 L31 18 V58 H27 Z"
          fill="url(#bfDeepNavy)"
          rx="1"
        />

        {/* Center Tower Right Column */}
        <path
          d="M33 18 L37 21 V58 H33 Z"
          fill="url(#bfDeepNavy)"
          rx="1"
        />

        {/* Mid-Right Column - Medium Height with Descending Top */}
        <path
          d="M39 21 L46 25 V58 H39 Z"
          fill="url(#bfDeepNavy)"
          rx="1"
        />

        {/* Outer Right Column - Shortest with Descending Top */}
        <path
          d="M49 28 L56 32 V58 H49 Z"
          fill="url(#bfPrimaryBlue)"
          rx="1"
        />

        {/* Central Upward Construction Arrow / Chevron (#FF6A00) */}
        {/* Prominently crowns the center tower pointing towards progress & growth */}
        <path
          d="M32 6 L44 18 H37 V28 H27 V18 H20 Z"
          fill="url(#bfOrange)"
        />

        {/* Negative space highlight / inner dynamic notch */}
        <path
          d="M32 11 L38 17 H35 V24 H29 V17 H26 Z"
          fill="#FFFFFF"
          opacity="0.22"
        />
      </g>
    </svg>
  );
};

export default BuildFlowLogo;

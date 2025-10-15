import React, { useState } from 'react';
import './Logo.css';

const Logo = ({ size = 60, showText = true }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="logo-wrapper" style={{ 
      width: size, 
      height: size,
      minWidth: size,
      minHeight: size,
      flexShrink: 0
    }}>
      {!imageError ? (
        <img 
          src="/logo-reference.png" 
          alt="The Jamalpur Chamber of Commerce & Industry"
          width={size} 
          height={size} 
          className="chamber-logo"
          style={{ 
            width: size, 
            height: size,
            imageRendering: '-webkit-optimize-contrast',
            imageRendering: 'crisp-edges'
          }}
          onError={() => setImageError(true)}
        />
      ) : (
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 400 400" 
          className="chamber-logo-svg"
          preserveAspectRatio="xMidYMid meet"
          style={{ shapeRendering: 'geometricPrecision' }}
        >
        {/* White Background - Scaled 2x for higher quality */}
        <circle cx="200" cy="200" r="200" fill="#FFFFFF"/>
        
        {/* Outer Circle with Black Border */}
        <circle 
          cx="200" 
          cy="200" 
          r="196" 
          fill="none" 
          stroke="#000000" 
          strokeWidth="8"
        />
        
        {/* White Inner Border */}
        <circle 
          cx="200" 
          cy="200" 
          r="188" 
          fill="none" 
          stroke="#FFFFFF" 
          strokeWidth="4"
        />
        
        {/* Text Paths for Curved Text - Scaled 2x */}
        <defs>
          <path id="topArc" d="M 30 200 A 170 170 0 0 1 370 200" fill="none" stroke="none"/>
          <path id="bottomArc" d="M 370 200 A 170 170 0 0 1 30 200" fill="none" stroke="none"/>
          
          {/* JCCI Gradient Definition */}
          <linearGradient id="jcci-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{stopColor: '#d97706', stopOpacity: 1}} />
            <stop offset="50%" style={{stopColor: '#f59e0b', stopOpacity: 1}} />
            <stop offset="100%" style={{stopColor: '#eab308', stopOpacity: 1}} />
          </linearGradient>
        </defs>
        
        {/* Top Arc Text - English (curved along top half) */}
        <text className="logo-text-english">
          <textPath href="#topArc" startOffset="50%" textAnchor="middle" dominantBaseline="middle">
            THE JAMALPUR CHAMBER OF COM & IND
          </textPath>
        </text>
        
        {/* Bottom Arc Text - Bengali (curved along bottom half) */}
        <text className="logo-text-bengali">
          <textPath href="#bottomArc" startOffset="50%" textAnchor="middle" dominantBaseline="middle">
            দি জামালপুর চেম্বার অব কমার্স এন্ড ইন্ডাস্ট্রি
          </textPath>
        </text>
        
        {/* Main Gear - Blue with 10 teeth - Scaled 2x for higher quality */}
        <g className="main-gear">
          {/* 10 Gear Teeth positioned around the circle - doubled size */}
          <rect x="96" y="170" width="24" height="60" fill="#3b82f6" rx="4"/>
          <rect x="136" y="96" width="60" height="24" fill="#3b82f6" rx="4"/>
          <rect x="280" y="170" width="24" height="60" fill="#3b82f6" rx="4"/>
          <rect x="204" y="280" width="60" height="24" fill="#3b82f6" rx="4"/>
          <rect x="136" y="280" width="60" height="24" fill="#3b82f6" rx="4"/>
          <rect x="80" y="170" width="24" height="60" fill="#3b82f6" rx="4"/>
          <rect x="204" y="96" width="60" height="24" fill="#3b82f6" rx="4"/>
          <rect x="170" y="80" width="60" height="24" fill="#3b82f6" rx="4"/>
          <rect x="120" y="120" width="24" height="60" fill="#3b82f6" rx="4" transform="rotate(45 132 150)"/>
          <rect x="256" y="120" width="24" height="60" fill="#3b82f6" rx="4" transform="rotate(-45 268 150)"/>
          
          {/* Gear Center Circle - White background with blue border */}
          <circle 
            cx="200" 
            cy="200" 
            r="80" 
            fill="#FFFFFF" 
            stroke="#3b82f6" 
            strokeWidth="4"
          />
          
          {/* Inner gear details for more realistic look */}
          <circle 
            cx="200" 
            cy="200" 
            r="50" 
            fill="none" 
            stroke="#3b82f6" 
            strokeWidth="2"
            opacity="0.3"
          />
          <circle 
            cx="200" 
            cy="200" 
            r="30" 
            fill="none" 
            stroke="#3b82f6" 
            strokeWidth="2"
            opacity="0.2"
          />
        </g>
        
        {/* Industrial Buildings - Green silhouette above gear hub - Scaled 2x */}
        <g className="industrial-buildings">
          {/* Building 1 */}
          <rect x="156" y="150" width="24" height="40" fill="#10b981"/>
          <rect x="160" y="136" width="4" height="14" fill="#10b981"/>
          
          {/* Building 2 */}
          <rect x="184" y="144" width="24" height="46" fill="#10b981"/>
          <rect x="188" y="130" width="4" height="14" fill="#10b981"/>
          <rect x="194" y="134" width="4" height="10" fill="#10b981"/>
          
          {/* Building 3 */}
          <rect x="212" y="140" width="24" height="50" fill="#10b981"/>
          <rect x="216" y="126" width="4" height="14" fill="#10b981"/>
          <rect x="222" y="130" width="4" height="10" fill="#10b981"/>
          <rect x="228" y="134" width="4" height="6" fill="#10b981"/>
          
          {/* Smoke from chimneys */}
          <circle cx="162" cy="130" r="3" fill="#FFFFFF" opacity="0.8"/>
          <circle cx="190" cy="124" r="2.4" fill="#FFFFFF" opacity="0.7"/>
          <circle cx="218" cy="120" r="2" fill="#FFFFFF" opacity="0.6"/>
          <circle cx="230" cy="116" r="1.6" fill="#FFFFFF" opacity="0.5"/>
        </g>
        
        {/* JCCI Text - Large, bold, golden-brown, centered in gear hub - Scaled 2x */}
        <text 
          x="200" 
          y="214" 
          textAnchor="middle" 
          className="logo-acronym"
        >
          JCCI
        </text>
        
        {/* Agricultural Squares below JCCI - Two square sections - Scaled 2x */}
        {/* Left Square - Blue background with plant branch */}
        <rect x="140" y="230" width="44" height="44" fill="#3b82f6"/>
        <path 
          d="M148 240 Q160 230 172 240 Q160 250 148 240" 
          fill="none" 
          stroke="#FFFFFF" 
          strokeWidth="4"
        />
        <circle cx="156" cy="236" r="3" fill="#FFFFFF"/>
        <circle cx="164" cy="238" r="3" fill="#FFFFFF"/>
        <circle cx="172" cy="236" r="3" fill="#FFFFFF"/>
        
        {/* Right Square - Orange background with sugarcane */}
        <rect x="216" y="230" width="44" height="44" fill="#ff6b35"/>
        <rect x="224" y="236" width="5" height="32" fill="#FFFFFF"/>
        <rect x="232" y="240" width="5" height="28" fill="#FFFFFF"/>
        <rect x="240" y="238" width="5" height="30" fill="#FFFFFF"/>
        <rect x="248" y="242" width="5" height="26" fill="#FFFFFF"/>
        </svg>
      )}
      
      {showText && (
        <div className="logo-text-container">
          <div className="logo-brand-text-english">
            THE JAMALPUR CHAMBER OF COMMERCE & INDUSTRY
          </div>
          <div className="logo-brand-text-bengali">
            দি জামালপুর চেম্বার অব কমার্স এন্ড ইন্ডাস্ট্রি
          </div>
        </div>
      )}
    </div>
  );
};

export default Logo;

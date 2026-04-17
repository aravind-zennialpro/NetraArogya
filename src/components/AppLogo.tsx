import React from 'react';

export const AppLogo = ({ className = "w-8 h-8" }: { className?: string }) => {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7D2AE8" />
            <stop offset="50%" stopColor="#5A32FA" />
            <stop offset="100%" stopColor="#00C4CC" />
          </linearGradient>
          <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <circle cx="16" cy="16" r="15" fill="url(#logo-gradient)" />
        <path 
          d="M10 16C10 12.6863 12.6863 10 16 10C19.3137 10 22 12.6863 22 16C22 19.3137 19.3137 22 16 22C12.6863 22 10 19.3137 10 16Z" 
          stroke="white" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          filter="url(#logo-glow)"
        />
        <path 
          d="M14 16H18M16 14V18" 
          stroke="white" 
          strokeWidth="2" 
          strokeLinecap="round" 
        />
        <path 
          d="M7 11L8.5 7.5L12 6M25 11L23.5 7.5L20 6M7 21L8.5 24.5L12 26M25 21L23.5 24.5L20 26" 
          stroke="white" 
          strokeWidth="1.2" 
          strokeOpacity="0.6" 
          strokeLinecap="round" 
        />
        <circle cx="21" cy="9" r="1.5" fill="white">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="9" cy="23" r="1" fill="white">
          <animate attributeName="opacity" values="1;0.3;1" dur="2.5s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
};

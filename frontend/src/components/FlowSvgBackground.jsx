import React from 'react';

const FlowSvgBackground = () => {
  return (
    <div className="auth-background">
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 1440 900" 
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0
        }}
      >
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2196F3" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#26A69A" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1976D2" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#26A69A" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#64B5F6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#80CBC4" stopOpacity="0.3" />
          </linearGradient>
          
          {/* First wave animation */}
          <path 
            id="wave1" 
            d="M0,210 C320,290 400,100 640,180 C880,260 1120,230 1440,190 L1440,900 L0,900 Z"
          >
            <animate 
              attributeName="d" 
              dur="20s" 
              repeatCount="indefinite"
              values="
                M0,210 C320,290 400,100 640,180 C880,260 1120,230 1440,190 L1440,900 L0,900 Z;
                M0,180 C280,250 480,140 720,200 C960,260 1200,210 1440,170 L1440,900 L0,900 Z;
                M0,210 C320,290 400,100 640,180 C880,260 1120,230 1440,190 L1440,900 L0,900 Z
              "
            />
          </path>
          
          {/* Second wave animation */}
          <path 
            id="wave2" 
            d="M0,350 C180,320 360,420 720,370 C1080,320 1260,370 1440,340 L1440,900 L0,900 Z"
          >
            <animate 
              attributeName="d" 
              dur="25s" 
              repeatCount="indefinite"
              values="
                M0,350 C180,320 360,420 720,370 C1080,320 1260,370 1440,340 L1440,900 L0,900 Z;
                M0,330 C240,360 480,380 720,330 C960,280 1200,320 1440,310 L1440,900 L0,900 Z;
                M0,350 C180,320 360,420 720,370 C1080,320 1260,370 1440,340 L1440,900 L0,900 Z
              "
            />
          </path>
          
          {/* Third wave animation */}
          <path 
            id="wave3" 
            d="M0,520 C140,490 280,580 560,520 C840,460 1120,490 1440,510 L1440,900 L0,900 Z"
          >
            <animate 
              attributeName="d" 
              dur="30s" 
              repeatCount="indefinite"
              values="
                M0,520 C140,490 280,580 560,520 C840,460 1120,490 1440,510 L1440,900 L0,900 Z;
                M0,500 C160,550 320,530 600,490 C880,450 1040,530 1440,490 L1440,900 L0,900 Z;
                M0,520 C140,490 280,580 560,520 C840,460 1120,490 1440,510 L1440,900 L0,900 Z
              "
            />
          </path>
        </defs>
        
        {/* Use the defined waves */}
        <use xlinkHref="#wave1" fill="url(#gradient1)" />
        <use xlinkHref="#wave2" fill="url(#gradient2)" />
        <use xlinkHref="#wave3" fill="url(#gradient3)" />
        
        {/* Flow-themed subtle background patterns */}
        <g opacity="0.1">
          <circle cx="10%" cy="15%" r="40" fill="#2196F3">
            <animate 
              attributeName="opacity" 
              values="0.05;0.1;0.05" 
              dur="5s" 
              repeatCount="indefinite" 
            />
          </circle>
          <circle cx="80%" cy="20%" r="30" fill="#26A69A">
            <animate 
              attributeName="opacity" 
              values="0.1;0.2;0.1" 
              dur="7s" 
              repeatCount="indefinite" 
            />
          </circle>
          <circle cx="30%" cy="40%" r="50" fill="#64B5F6">
            <animate 
              attributeName="opacity" 
              values="0.07;0.12;0.07" 
              dur="8s" 
              repeatCount="indefinite" 
            />
          </circle>
          <circle cx="70%" cy="60%" r="45" fill="#80CBC4">
            <animate 
              attributeName="opacity" 
              values="0.08;0.15;0.08" 
              dur="6s" 
              repeatCount="indefinite" 
            />
          </circle>
        </g>
      </svg>
    </div>
  );
};

export default FlowSvgBackground;
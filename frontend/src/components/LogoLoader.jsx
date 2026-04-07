import React from 'react';
import tfLogo from '../assets/tf-loader-logo.png';

const LogoLoader = ({ text = "Loading...", compact = false }) => {
  return (
    <div className={`flex flex-col items-center justify-center w-full ${compact ? 'py-4' : 'h-full min-h-[50vh]'} bg-transparent`}>
      <style>
        {`
          @keyframes logo-pulse {
            0% { transform: scale(1); opacity: 0.9; }
            50% { transform: scale(1.05); opacity: 1; }
            100% { transform: scale(1); opacity: 0.9; }
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .animate-logo-prime {
            animation: logo-pulse 3s infinite ease-in-out;
          }
          .shimmer-text {
            background: linear-gradient(90deg, #1e40af 25%, #3b82f6 50%, #1e40af 75%);
            background-size: 200% 100%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: shimmer 2s infinite linear;
          }
          .bouncing-dots span {
            display: inline-block;
            width: ${compact ? '3px' : '4px'};
            height: ${compact ? '3px' : '4px'};
            background-color: #2563EB;
            border-radius: 50%;
            margin-left: 2px;
            animation: bounce-dot 1.4s infinite ease-in-out both;
          }
          .bouncing-dots span:nth-child(1) { animation-delay: -0.32s; }
          .bouncing-dots span:nth-child(2) { animation-delay: -0.16s; }
          @keyframes bounce-dot {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
          }
        `}
      </style>

      {/* Natively transparent logo wrapper */}
      <div className={`${compact ? 'mb-2' : 'mb-6'}`}>
        <div className={`${compact ? 'h-12 w-12' : 'h-28 w-28'} relative animate-logo-prime flex items-center justify-center`}>
          <img
            src={tfLogo}
            alt="Loading"
            className="w-full h-full object-contain"
            onError={(e) => {
              if (e.target.src.includes('tf-loader-logo.png')) {
                e.target.src = '/assets/defaults/logo.jpg';
              }
            }}
          />
        </div>
      </div>

      <div className="flex items-center">
        <p className={`shimmer-text font-bold uppercase tracking-[0.2em] ${compact ? 'text-[8px]' : 'text-[10px]'}`}>
          {text}
        </p>
        <div className="bouncing-dots flex items-center ml-1">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
};

export default LogoLoader;

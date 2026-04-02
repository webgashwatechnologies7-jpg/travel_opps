import React from 'react';
import tfLogo from '../assets/tf-loader-logo.png';

const LogoLoader = ({ text = "Loading...", compact = false }) => {
  return (
    <div className={`flex flex-col items-center justify-center w-full ${compact ? 'py-4' : 'h-full min-h-[50vh]'} bg-transparent`}>
      <style>
        {`
          @keyframes logo-flip-spin {
            0% { transform: perspective(400px) rotateY(0deg); }
            100% { transform: perspective(400px) rotateY(360deg); }
          }
          .animate-logo-flip {
            animation: logo-flip-spin 2.5s infinite ease-in-out;
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
        <div className={`${compact ? 'h-12 w-12' : 'h-28 w-28'} relative animate-logo-flip flex items-center justify-center`}>
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
        <p className={`text-blue-700/70 font-bold uppercase tracking-[0.2em] ${compact ? 'text-[8px]' : 'text-[10px]'}`}>
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

import React, { useState } from 'react';

const ChartTooltip = ({ title, description }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className="relative inline-block group"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center gap-2 cursor-help">
        <h2 className="text-base font-semibold hover:text-blue-600 transition-colors">
          {title}
        </h2>
        <svg 
          className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
      </div>
      <div 
        className={`absolute z-50 w-96 p-3 -mt-24 text-sm bg-white border-2 border-blue-500 text-gray-800 rounded-lg shadow-lg -translate-x-1/2 left-1/2 transition-opacity duration-150 ${
          showTooltip ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <p className="leading-relaxed text-gray-700">{description}</p>
        <div className="absolute w-4 h-4 bg-white border-b-2 border-r-2 border-blue-500 transform rotate-45 -translate-x-1/2 -bottom-2 left-1/2"></div>
      </div>
    </div>
  );
};

export default ChartTooltip;

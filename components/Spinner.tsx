import React from 'react';

export const Spinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center space-y-4">
    <div className="w-12 h-12 border-4 border-neonCyan border-t-transparent rounded-full animate-spin"></div>
    <p className="text-neonCyan font-medium animate-pulse">Processing with Gemini Nano Banana...</p>
  </div>
);

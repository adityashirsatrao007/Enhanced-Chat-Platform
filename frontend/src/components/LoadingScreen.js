import React from 'react';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-8"></div>
        <h1 className="text-white text-2xl font-bold mb-4">Enhanced Chat Platform</h1>
        <p className="text-gray-300">Loading your secure chat experience...</p>
        <div className="mt-8 text-sm text-gray-400">
          <p>If this takes too long, please refresh the page.</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;

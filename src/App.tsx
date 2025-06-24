import React from 'react';
import EbookGenerator from './components/EbookGenerator';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900 to-black relative overflow-hidden">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="grid grid-cols-12 gap-4 h-full animate-pulse">
          {Array.from({ length: 144 }, (_, i) => (
            <div
              key={i}
              className="border border-purple-500/30 rounded-sm bg-gradient-to-br from-purple-500/10 to-transparent"
              style={{
                animationDelay: `${(i * 0.1) % 3}s`,
                animationDuration: '6s'
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Floating orbs for additional visual depth */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-800/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }}></div>
      
      <div className="relative z-10">
        <EbookGenerator />
      </div>
    </div>
  );
}

export default App;
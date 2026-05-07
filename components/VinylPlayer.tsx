
import React from 'react';
import { AppState, AnalysisResult } from '../types';

interface VinylPlayerProps {
  imageSrc: string | null;
  appState: AppState;
  analysis: AnalysisResult | null;
  onUploadClick: () => void;
  onPlayClick: () => void;
}

const VinylPlayer: React.FC<VinylPlayerProps> = ({ 
  imageSrc, 
  appState, 
  analysis, 
  onUploadClick, 
  onPlayClick 
}) => {
  const isPlaying = appState === AppState.PLAYING;
  const isReady = appState === AppState.READY_TO_PLAY || appState === AppState.PLAYING;
  
  // Dynamic hue from inner circle or default
  const glowColor = analysis ? analysis.innerCircle.dominantColor : '#4f4f4f';

  return (
    <div className="relative flex flex-col items-center justify-center py-8">
      
      {/* Turntable Base */}
      <div className="relative w-80 h-80 md:w-96 md:h-96 bg-zinc-900 rounded-lg shadow-2xl border border-zinc-800 flex items-center justify-center overflow-hidden">
        
        {/* Glow Effect behind record */}
        <div 
            className="absolute inset-0 opacity-20 transition-all duration-1000"
            style={{ 
                background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
                opacity: isPlaying ? 0.4 : 0.1
            }}
        />

        {/* The Vinyl Record */}
        <div 
          className={`relative w-[90%] h-[90%] rounded-full shadow-xl cursor-pointer group transition-transform duration-700 ${isPlaying ? 'animate-spin-slow' : ''}`}
          onClick={isReady ? onPlayClick : onUploadClick}
          style={{
              background: '#111',
              border: '1px solid #333',
              animationPlayState: isPlaying ? 'running' : 'paused'
          }}
        >
            {/* Vinyl Texture Lines */}
            <div className="absolute inset-0 rounded-full border-4 border-zinc-800 opacity-50" style={{ margin: '2%' }}></div>
            <div className="absolute inset-0 rounded-full border-2 border-zinc-800 opacity-30" style={{ margin: '8%' }}></div>
            <div className="absolute inset-0 rounded-full border-2 border-zinc-800 opacity-30" style={{ margin: '14%' }}></div>
            <div className="absolute inset-0 rounded-full border-2 border-zinc-800 opacity-30" style={{ margin: '20%' }}></div>

            {/* Label / User Art */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[55%] h-[55%] rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center border-4 border-zinc-900 shadow-inner">
                {imageSrc ? (
                    <img 
                        src={imageSrc} 
                        alt="Soul Record" 
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="text-zinc-500 text-xs text-center px-2 group-hover:text-zinc-300 transition-colors">
                        <span className="block text-2xl mb-1">+</span>
                        Upload
                    </div>
                )}
            </div>

            {/* Spindle Hole */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-black rounded-full border border-zinc-700 z-10"></div>
        </div>

        {/* Tone Arm (Stylized) */}
        <div 
            className={`absolute top-4 right-4 w-2 h-32 bg-zinc-700 origin-top rounded-full shadow-lg transition-transform duration-1000 ease-in-out z-20 ${isPlaying ? 'rotate-12' : '-rotate-12'}`}
            style={{ transformOrigin: 'top center' }}
        >
            <div className="absolute -top-2 -left-2 w-6 h-6 bg-zinc-500 rounded-full shadow-md"></div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-8 bg-zinc-600 rounded"></div>
        </div>
      </div>

      {/* Play Controls Overlay Hints */}
      {!imageSrc && (
          <p className="mt-4 text-zinc-500 text-sm tracking-widest uppercase">Click disk to generate soul</p>
      )}
      
      {isReady && !isPlaying && (
          <p className="mt-4 text-zinc-400 text-sm tracking-widest uppercase animate-pulse">Click to Play</p>
      )}

    </div>
  );
};

export default VinylPlayer;

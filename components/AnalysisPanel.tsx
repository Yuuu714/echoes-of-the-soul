
import React from 'react';
import { AnalysisResult } from '../types';
import { Music, Heart, Users, Sparkles, Brain } from 'lucide-react';

interface AnalysisPanelProps {
  analysis: AnalysisResult;
  isVisible: boolean;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="max-w-2xl w-full mx-auto mt-8 p-6 bg-zinc-900/50 backdrop-blur-md rounded-xl border border-zinc-800 text-zinc-300 transition-all duration-700 animate-in fade-in slide-in-from-bottom-10 h-[600px] overflow-y-auto custom-scrollbar">
      
      <div className="text-center mb-8 border-b border-zinc-800 pb-6">
        <h2 className="text-3xl font-serif text-white mb-2">{analysis.title}</h2>
        <div className="flex justify-center items-center gap-2 text-amber-500/80">
          <Sparkles size={14} />
          <span className="uppercase text-xs tracking-widest font-bold">{analysis.psychologicalProfile.archetype}</span>
          <Sparkles size={14} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Inner Circle */}
        <div className="space-y-3 p-5 bg-gradient-to-br from-black/40 to-transparent rounded-lg border border-white/5">
          <div className="flex items-center gap-2 text-zinc-400 mb-1">
            <Heart size={16} className="text-rose-400" />
            <span className="uppercase text-xs tracking-wider font-bold text-rose-200/70">Subconscious (Inner)</span>
          </div>
          <div className="flex items-center gap-3 mb-2">
             <div 
                className="w-5 h-5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" 
                style={{ backgroundColor: analysis.innerCircle.dominantColor }}
             ></div>
             <p className="font-semibold text-white capitalize">{analysis.innerCircle.mood}</p>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed border-t border-white/5 pt-2">
             {analysis.psychologicalProfile.subconsciousAnalysis}
          </p>
        </div>

        {/* Outer Circle */}
        <div className="space-y-3 p-5 bg-gradient-to-br from-black/40 to-transparent rounded-lg border border-white/5">
          <div className="flex items-center gap-2 text-zinc-400 mb-1">
            <Users size={16} className="text-cyan-400" />
            <span className="uppercase text-xs tracking-wider font-bold text-cyan-200/70">Persona (Outer)</span>
          </div>
           <div className="flex items-center gap-3 mb-2">
             <div 
                className="w-5 h-5 rounded-full border border-white/20 shadow-[0_0_10px_rgba(0,0,0,0.5)]" 
                style={{ backgroundColor: analysis.outerCircle.dominantColor }}
             ></div>
             <p className="font-semibold text-white capitalize">{analysis.outerCircle.mood}</p>
          </div>
           <p className="text-sm text-zinc-400 leading-relaxed border-t border-white/5 pt-2">
             {analysis.psychologicalProfile.personaAnalysis}
          </p>
        </div>
      </div>

      {/* Integration Advice */}
      <div className="mb-8 p-5 bg-amber-900/10 rounded-lg border border-amber-900/20">
         <div className="flex items-center gap-2 text-amber-500/90 mb-3">
            <Brain size={18} />
            <span className="uppercase text-xs tracking-wider font-bold">Integration Path</span>
          </div>
         <p className="text-base font-serif italic leading-relaxed text-zinc-200">
            "{analysis.psychologicalProfile.integrationAdvice}"
         </p>
      </div>

      {/* Sonic Identity */}
      <div className="flex flex-col gap-3 p-5 border border-zinc-800 rounded-lg bg-zinc-950/30">
        <div className="flex items-center gap-2 text-teal-500/80 mb-1">
            <Music size={18} />
            <span className="uppercase text-xs tracking-wider font-bold">Sonic Soul Signature</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-zinc-400">
           <div>
              <span className="block text-xs text-zinc-600 uppercase mb-1">Key</span>
              <span className="text-white">{analysis.musicalJourney.key}</span>
           </div>
           <div>
              <span className="block text-xs text-zinc-600 uppercase mb-1">Base Freq</span>
              <span className="text-white">{analysis.musicalJourney.baseFrequency} Hz</span>
           </div>
           <div>
              <span className="block text-xs text-zinc-600 uppercase mb-1">Avg Tempo</span>
              <span className="text-white">{analysis.musicalJourney.tempo} BPM</span>
           </div>
           <div>
              <span className="block text-xs text-zinc-600 uppercase mb-1">Structure</span>
              <span className="text-white capitalize">4-Stage Journey</span>
           </div>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05); 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2); 
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default AnalysisPanel;

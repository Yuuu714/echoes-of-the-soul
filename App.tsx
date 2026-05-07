
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Play, Pause, Sparkles, AudioWaveform, Globe, MapPin, Loader2, Disc, RefreshCcw, AlignLeft } from 'lucide-react';
import { analyzeVinylImage } from './services/geminiService';
import { audioEngine } from './services/audioEngine';
import Visualizer from './components/Visualizer';
import AnalysisPanel from './components/AnalysisPanel';
import { AppState, AnalysisResult, MusicalStageParams, Language, Scene, SceneType } from './types';

// Translation Dictionary
const TRANSLATIONS = {
  en: {
    title: "ECHOES OF THE SOUL",
    upload: "Upload",
    play: "Play Soul Record",
    analyzing: "Drifting into your subconscious...",
    ready: "Vinyl Pressed & Ready",
    selectScene: "Select Environment",
    inner: "Inner Self",
    outer: "Social Persona",
    journey: "Healing Journey",
    changeRecord: "Change Record",
    viewAnalysis: "View Analysis",
    scenes: {
      cabin: "Log Cabin",
      library: "Old Library",
      bedroom: "Sunset Bedroom",
      cafe: "Rainy Cafe"
    }
  },
  zh: {
    title: "灵魂唱片",
    upload: "上传唱片",
    play: "播放灵魂唱片",
    analyzing: "正在潜入您的潜意识...",
    ready: "唱片已压制完成",
    selectScene: "选择疗愈空间",
    inner: "内在自我",
    outer: "外在人格",
    journey: "疗愈旅程",
    changeRecord: "更换唱片",
    viewAnalysis: "查看心理分析",
    scenes: {
      cabin: "炉火木屋",
      library: "静谧书房",
      bedroom: "落日卧室",
      cafe: "雨中咖啡馆"
    }
  }
};

const SCENES: Scene[] = [
  { 
    id: 'cabin', 
    name: { en: 'Log Cabin', zh: '炉火木屋' }, 
    description: { en: 'Warm firelight and crackling embers', zh: '温暖的炉火与噼啪作响的余烬' },
    colors: ['#1a0f00', '#2d1a0a'],
    bgImage: 'https://images.unsplash.com/photo-1510525009512-ad7fc13eefab?q=80&w=2070&auto=format&fit=crop'
  },
  { 
    id: 'library', 
    name: { en: 'Library', zh: '静谧书房' }, 
    description: { en: 'Scent of old books and deep silence', zh: '古书的香气与深沉的寂静' },
    colors: ['#1a1a1a', '#0f140f'],
    bgImage: 'https://images.unsplash.com/photo-1507842217121-9e2432d719e6?q=80&w=2070&auto=format&fit=crop'
  },
  { 
    id: 'bedroom', 
    name: { en: 'Bedroom', zh: '落日卧室' }, 
    description: { en: 'Cozy sunset lamp and soft candles', zh: '落日灯的暖光与柔和的香薰' },
    colors: ['#2d1b2d', '#1a0b1a'],
    bgImage: 'https://images.unsplash.com/photo-1555529733-0e670560f7e1?q=80&w=2070&auto=format&fit=crop'
  },
  { 
    id: 'cafe', 
    name: { en: 'Rainy Cafe', zh: '雨中咖啡馆' }, 
    description: { en: 'Forest rain and gentle coffee aroma', zh: '森林雨声与淡淡的咖啡香' },
    colors: ['#0a1a1f', '#050f14'],
    bgImage: 'https://images.unsplash.com/photo-1541525032607-427909339e3c?q=80&w=2070&auto=format&fit=crop'
  }
];

const DEFAULT_ANALYSIS: AnalysisResult = {
  innerCircle: { dominantColor: '#333', mood: 'Waiting' },
  outerCircle: { dominantColor: '#555', mood: 'Waiting' },
  title: "Waiting for Soul",
  psychologicalProfile: {
    archetype: "",
    emotionalState: "",
    subconsciousAnalysis: "",
    personaAnalysis: "",
    integrationAdvice: ""
  },
  musicalJourney: {
    key: "C",
    baseFrequency: 440,
    tempo: 60,
    stages: []
  }
};

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('zh');
  const [scene, setScene] = useState<SceneType>('cabin');
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult>(DEFAULT_ANALYSIS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStage, setCurrentStage] = useState<MusicalStageParams | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    audioEngine.onStageChange = (stage) => {
      setCurrentStage(stage);
    };
  }, []);

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        processImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (base64String: string) => {
    try {
      setState(AppState.ANALYZING);
      const base64Data = base64String.split(',')[1];
      const result = await analyzeVinylImage(base64Data, lang);
      setAnalysis(result);
      setState(AppState.READY_TO_PLAY);
      setShowAnalysis(true);
    } catch (error) {
      console.error(error);
      setState(AppState.ERROR);
    }
  };

  const togglePlay = async () => {
    if (isPlaying) {
      audioEngine.stop();
      setIsPlaying(false);
      setCurrentStage(null);
      setState(AppState.READY_TO_PLAY);
    } else {
      await audioEngine.initialize();
      audioEngine.play(analysis.musicalJourney);
      setIsPlaying(true);
      setState(AppState.PLAYING);
    }
  };

  const handleReset = () => {
    audioEngine.stop();
    setIsPlaying(false);
    setImage(null);
    setAnalysis(DEFAULT_ANALYSIS);
    setCurrentStage(null);
    setShowAnalysis(false);
    setState(AppState.IDLE);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getSceneOverlay = () => {
    switch(scene) {
      case 'cabin': 
        return <div className="absolute inset-0 opacity-20 mix-blend-soft-light pointer-events-none animate-flicker bg-orange-900 z-0"></div>;
      case 'bedroom': 
        return <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none bg-rose-900 z-0"></div>;
      case 'cafe': 
        return (
          <>
            <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] z-0"></div>
            <div className="absolute inset-0 opacity-20 bg-blue-900 mix-blend-soft-light z-0"></div>
          </>
        );
      default: return null;
    }
  };

  const recordGradient = `radial-gradient(circle at center, 
    ${analysis.innerCircle.dominantColor}20 0%, 
    ${analysis.innerCircle.dominantColor}60 30%, 
    transparent 35%, 
    transparent 45%, 
    ${analysis.outerCircle.dominantColor}60 50%, 
    ${analysis.outerCircle.dominantColor}20 70%, 
    #111 71%)`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden relative transition-all duration-1000">
      
      {/* Background */}
      {SCENES.map((s) => (
         <div 
           key={s.id}
           className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 z-[-2] ${scene === s.id ? 'opacity-100' : 'opacity-0'}`}
           style={{ backgroundImage: `url(${s.bgImage})` }}
         >
           <div className="absolute inset-0 bg-black/70 backdrop-blur-[4px]"></div>
         </div>
      ))}
      {getSceneOverlay()}

      {/* Header */}
      <header className="absolute top-0 left-0 w-full p-6 md:p-8 flex justify-between items-center z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-stone-500/50 flex items-center justify-center backdrop-blur-sm bg-black/20">
            <div className={`w-3 h-3 rounded-full bg-stone-200 ${isPlaying ? 'animate-ping' : ''}`}></div>
          </div>
          <h1 className="text-xl md:text-2xl font-serif tracking-[0.2em] text-stone-200 uppercase drop-shadow-md">{t.title}</h1>
        </div>
        
        <div className="flex gap-4 items-center">
          <button 
            onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
            className="flex items-center gap-2 text-stone-300 hover:text-white transition-colors bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm"
          >
            <Globe className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">{lang === 'zh' ? 'EN' : '中'}</span>
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex flex-col xl:flex-row items-start justify-center gap-12 xl:gap-20 z-20 max-w-[1600px] w-full mt-20">
        
        {/* Left Column: Player */}
        <div className="relative group flex flex-col items-center">
          
          <Visualizer 
            isPlaying={isPlaying} 
            innerAnalysis={analysis.innerCircle} 
            outerAnalysis={analysis.outerCircle}
            currentStage={currentStage}
          />

          {/* Turntable */}
          <div className="relative bg-stone-900/90 backdrop-blur-md rounded-[3rem] p-8 md:p-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] border border-white/10 transform transition-transform duration-500">
            {/* Tone Arm */}
            <div className={`absolute top-12 right-12 w-8 h-64 z-40 origin-top transform transition-all duration-1000 ease-in-out ${isPlaying ? 'rotate-12 translate-y-2' : '-rotate-12'}`}>
                <div className="w-4 h-4 rounded-full bg-stone-400 absolute top-0 left-2"></div>
                <div className="w-2 h-full bg-stone-700 mx-auto rounded-full shadow-lg"></div>
                <div className="w-8 h-12 bg-stone-800 absolute bottom-0 left-0 rounded-sm shadow-xl"></div>
            </div>

            {/* Vinyl Record */}
            <div 
              className={`w-[280px] h-[280px] md:w-[450px] md:h-[450px] rounded-full relative flex items-center justify-center overflow-hidden transition-all duration-1000 shadow-2xl ${state === AppState.ANALYZING ? 'animate-pulse' : ''}`}
              style={{
                boxShadow: '0 0 0 2px #111, 0 0 0 8px #1a1a1a, 0 20px 50px rgba(0,0,0,0.5)'
              }}
            >
              <div 
                className={`absolute inset-0 bg-black bg-cover bg-center rounded-full transition-transform duration-[8000ms] ease-linear ${isPlaying ? 'animate-spin-slow' : 'paused'}`}
                style={{ 
                  backgroundImage: image ? `url(${image})` : undefined,
                }}
              >
                <div className="absolute inset-0 opacity-90 mix-blend-hard-light" style={{ background: recordGradient }}></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50 pointer-events-none rounded-full"></div>
              </div>

              {/* Realistic Grooves */}
              <div className="absolute inset-0 rounded-full opacity-40 pointer-events-none"
                 style={{
                   background: 'repeating-radial-gradient(#111 0, #111 2px, transparent 3px, transparent 4px)'
                 }}
              ></div>

              {/* Center Play Button */}
              <div className="absolute z-30 w-24 h-24 bg-stone-100 rounded-full flex flex-col items-center justify-center shadow-inner border-[6px] border-stone-800 cursor-pointer hover:scale-105 transition-transform"
                   onClick={state === AppState.PLAYING || state === AppState.READY_TO_PLAY ? togglePlay : triggerUpload}>
                
                {state === AppState.ANALYZING ? (
                  <Loader2 className="w-8 h-8 animate-spin text-stone-800" />
                ) : state === AppState.PLAYING ? (
                  <Pause className="w-8 h-8 text-stone-800 fill-current" />
                ) : state === AppState.READY_TO_PLAY ? (
                  <Play className="w-8 h-8 text-stone-800 fill-current ml-1" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-stone-800 mb-1" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-stone-800">{t.upload}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-center gap-4">
             {state === AppState.READY_TO_PLAY && !isPlaying && (
                <button 
                  onClick={togglePlay}
                  className="px-10 py-4 bg-white/90 text-stone-900 font-serif text-lg hover:bg-white transition-all tracking-widest flex items-center gap-3 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                >
                  <Sparkles className="w-4 h-4" /> {t.play}
                </button>
             )}
          </div>
        </div>

        {/* Right Column: Analysis & Controls */}
        <div className="w-full max-w-xl flex flex-col gap-6">
           <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />

           {/* Top Actions */}
           <div className="flex gap-4">
               {/* Scene Dropdown Trigger */}
               <div className="flex-1 bg-black/40 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                   <div className="flex items-center gap-2 mb-2 text-stone-400">
                        <MapPin className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">{t.selectScene}</span>
                   </div>
                   <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                        {SCENES.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => setScene(s.id)}
                            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all ${scene === s.id ? 'bg-white text-black' : 'bg-white/10 text-stone-400 hover:bg-white/20'}`}
                          >
                            {lang === 'zh' ? s.name.zh : s.name.en}
                          </button>
                        ))}
                   </div>
               </div>

               {/* Reset Button */}
               {(state === AppState.READY_TO_PLAY || state === AppState.PLAYING) && (
                   <button 
                      onClick={handleReset}
                      className="bg-black/40 p-4 rounded-xl border border-white/10 backdrop-blur-sm flex flex-col items-center justify-center hover:bg-white/10 transition-colors w-24"
                   >
                     <RefreshCcw className="w-5 h-5 text-stone-300 mb-1" />
                     <span className="text-[10px] uppercase font-bold text-stone-400">{t.changeRecord}</span>
                   </button>
               )}
           </div>

           {/* Dynamic Dashboard */}
           {state !== AppState.IDLE && (
             <div className="relative min-h-[500px]">
                {state === AppState.ANALYZING ? (
                   <div className="flex flex-col items-center justify-center h-full p-12 text-center animate-pulse">
                      <Sparkles className="w-12 h-12 text-stone-500 mb-4" />
                      <p className="text-xl font-serif text-stone-300">{t.analyzing}</p>
                   </div>
                ) : (
                   <div className="flex flex-col gap-6">
                      
                      {/* Musical Timeline */}
                      <div className="bg-black/40 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                         <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4 flex items-center gap-2">
                             <AudioWaveform className="w-4 h-4" />
                             {t.journey}
                         </h3>
                         <div className="grid grid-cols-4 gap-2">
                             {analysis.musicalJourney.stages.map((stage, i) => {
                                 const isActive = currentStage?.stageName === stage.stageName;
                                 return (
                                     <div key={i} className={`h-16 rounded-lg p-2 flex flex-col justify-end transition-all ${isActive ? 'bg-white/20 border border-white/40' : 'bg-white/5 border border-transparent'}`}>
                                         <div className="flex gap-0.5 items-end h-full mb-1">
                                             <div className={`w-1 bg-current rounded-full transition-all duration-300`} style={{ height: isActive ? '60%' : '20%' }}></div>
                                             <div className={`w-1 bg-current rounded-full transition-all duration-500`} style={{ height: isActive ? '90%' : '30%' }}></div>
                                             <div className={`w-1 bg-current rounded-full transition-all duration-700`} style={{ height: isActive ? '40%' : '20%' }}></div>
                                         </div>
                                         <span className={`text-[9px] uppercase font-bold truncate ${isActive ? 'text-white' : 'text-stone-500'}`}>{stage.stageName}</span>
                                     </div>
                                 )
                             })}
                         </div>
                      </div>

                      {/* Analysis Panel Toggle */}
                      <button 
                         onClick={() => setShowAnalysis(!showAnalysis)}
                         className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-stone-800 to-stone-900 rounded-xl border border-stone-700 hover:border-stone-500 transition-colors group"
                      >
                         <div className="flex items-center gap-3">
                            <AlignLeft className="w-5 h-5 text-stone-400 group-hover:text-white" />
                            <span className="font-serif text-stone-200 group-hover:text-white">{t.viewAnalysis}</span>
                         </div>
                         <div className={`w-2 h-2 rounded-full ${showAnalysis ? 'bg-green-500' : 'bg-stone-600'}`}></div>
                      </button>

                      {/* Detailed Content */}
                      {showAnalysis && <AnalysisPanel analysis={analysis} isVisible={showAnalysis} />}
                   </div>
                )}
             </div>
           )}
        </div>
      </div>

      <style>{`
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .paused {
          animation-play-state: paused;
        }
        .animate-flicker {
          animation: flicker 4s infinite;
        }
        @keyframes flicker {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.15; }
          25% { opacity: 0.08; }
          75% { opacity: 0.12; }
        }
        .custom-scrollbar::-webkit-scrollbar {
            height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.2);
            border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default App;

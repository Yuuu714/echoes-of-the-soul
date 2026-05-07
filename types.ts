
export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  READY_TO_PLAY = 'READY_TO_PLAY',
  PLAYING = 'PLAYING',
  ERROR = 'ERROR'
}

export type Language = 'en' | 'zh';
export type SceneType = 'cabin' | 'library' | 'bedroom' | 'cafe';

export interface Scene {
  id: SceneType;
  name: { en: string; zh: string };
  description: { en: string; zh: string };
  colors: string[];
  bgImage: string;
}

export interface PsychologicalProfile {
  archetype: string; // e.g., "The Creator", "The Sage"
  emotionalState: string;
  subconsciousAnalysis: string; // Deep analysis of Inner Circle
  personaAnalysis: string; // Deep analysis of Outer Circle
  integrationAdvice: string; // How to merge the two
}

export interface MusicalStageParams {
  stageName: string;
  tempo: number; // Specific tempo for this stage
  energy: number; // 0-100
  texture: 'ethereal' | 'grounded' | 'complex' | 'structured';
  rhythmicFeel: 'steady' | 'flowing' | 'syncopated' | 'chaotic'; // New: Defines rhythmic pattern
  instrumentation: ('pad' | 'bass' | 'chimes' | 'lead' | 'rhythm' | 'texture')[];
  chordProgression: number[][]; // Local progression for this stage (supports extended chords)
  scaleMode: 'major' | 'minor' | 'dorian' | 'lydian' | 'mixolydian' | 'phrygian';
}

export interface AnalysisResult {
  innerCircle: {
    dominantColor: string;
    mood: string;
  };
  outerCircle: {
    dominantColor: string;
    mood: string;
  };
  title: string;
  psychologicalProfile: PsychologicalProfile;
  musicalJourney: {
    key: string;
    baseFrequency: number;
    tempo: number; // Average/Starting tempo
    stages: MusicalStageParams[]; // Fixed 4 stages: Intro, Inner, Integration, Outer
  };
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  alpha: number;
}

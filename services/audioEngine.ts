

import { MusicalStageParams } from "../types";

class HealingAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  
  private isPlaying: boolean = false;
  private activeNodes: (OscillatorNode | GainNode | BiquadFilterNode | AudioBufferSourceNode | ConstantSourceNode | StereoPannerNode)[] = [];
  
  // Sequencing State
  private stages: MusicalStageParams[] = [];
  private currentStageIndex: number = 0;
  private currentChordIndex: number = 0;
  private currentTempo: number = 60; // Dynamic tempo
  private baseFreq: number = 440;
  
  // Voice Leading State
  private lastChordVoicing: number[] = [];
  
  // Timing
  private nextNoteTime: number = 0;
  private lookahead: number = 25.0; // ms
  private scheduleAheadTime: number = 0.1; // s
  private timerID: number | null = null;
  
  // Callbacks
  public onStageChange: ((stage: MusicalStageParams) => void) | null = null;

  private scaleMap: Record<string, number[]> = {
    major: [0, 2, 4, 5, 7, 9, 11, 12],
    minor: [0, 2, 3, 5, 7, 8, 10, 12],
    dorian: [0, 2, 3, 5, 7, 9, 10, 12],
    phrygian: [0, 1, 3, 5, 7, 8, 10, 12],
    lydian: [0, 2, 4, 6, 7, 9, 11, 12],
    mixolydian: [0, 2, 4, 5, 7, 9, 10, 12]
  };

  // --- Initialization ---

  public async initialize() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      this.compressorNode = this.ctx.createDynamicsCompressor();
      this.compressorNode.threshold.value = -20;
      this.compressorNode.ratio.value = 12;
      this.compressorNode.attack.value = 0.003;
      this.compressorNode.release.value = 0.25;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5;
      
      this.reverbNode = this.ctx.createConvolver();
      this.reverbNode.buffer = await this.createReverbImpulse(3.5, 2.5); // Richer reverb

      this.compressorNode.connect(this.masterGain);
      this.masterGain.connect(this.reverbNode);
      this.reverbNode.connect(this.ctx.destination);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume();
  }

  private async createReverbImpulse(seconds: number, decay: number): Promise<AudioBuffer> {
    const rate = this.ctx!.sampleRate;
    const length = rate * seconds;
    const impulse = this.ctx!.createBuffer(2, length, rate);
    const L = impulse.getChannelData(0);
    const R = impulse.getChannelData(1);
    for (let i = 0; i < length; i++) {
      const n = i;
      let alpha = Math.pow(1 - n / length, decay);
      L[i] = (Math.random() * 2 - 1) * alpha;
      R[i] = (Math.random() * 2 - 1) * alpha;
    }
    return impulse;
  }

  // --- Voice Leading & Theory ---

  private getFreq(degree: number, scale: string, octaveOffset: number = 0): number {
    const scaleIntervals = this.scaleMap[scale] || this.scaleMap['major'];
    const normalizedDegree = degree - 1;
    const octave = Math.floor(normalizedDegree / 7) + octaveOffset;
    const index = normalizedDegree % 7;
    const safeIndex = index < 0 ? scaleIntervals.length + index : index;
    const semitones = scaleIntervals[safeIndex] + (octave * 12);
    return this.baseFreq * Math.pow(2, semitones / 12);
  }

  // Find the octave for new note that is closest to any note in the previous chord
  // This creates smooth voice leading instead of jumping around
  private optimizeVoicing(degrees: number[], scale: string): number[] {
    if (this.lastChordVoicing.length === 0) {
      const freqs = degrees.map(d => this.getFreq(d, scale, 0));
      this.lastChordVoicing = freqs;
      return freqs;
    }

    const newFreqs = degrees.map(d => {
      // Try 3 octaves (-1, 0, 1) and find closest frequency to the previous chord's center
      const candidates = [-1, 0, 1].map(oct => this.getFreq(d, scale, oct));
      const prevCenter = this.lastChordVoicing.reduce((a, b) => a + b, 0) / this.lastChordVoicing.length;
      
      return candidates.reduce((prev, curr) => {
        return (Math.abs(curr - prevCenter) < Math.abs(prev - prevCenter) ? curr : prev);
      });
    });

    this.lastChordVoicing = newFreqs;
    return newFreqs;
  }

  // --- Synthesis (Sound Design) ---

  private playAtmosphere(freq: number, duration: number, texture: string) {
    if (!this.ctx || !this.compressorNode) return;
    const now = this.ctx.currentTime;
    
    // Complex Drone: 3 Oscillators with slight drift
    const freqs = [freq, freq * 1.002, freq * 0.998];
    const type = texture === 'ethereal' ? 'sine' : 'triangle';

    freqs.forEach((f) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();
      const lfo = this.ctx!.createOscillator();
      const lfoGain = this.ctx!.createGain();

      osc.type = type as OscillatorType;
      osc.frequency.value = f;

      // Filter modulation for movement
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      
      // LFO Modulating Filter Cutoff (Breathing)
      lfo.frequency.value = 0.1 + Math.random() * 0.1;
      lfoGain.gain.value = 200; // Modulate cutoff by +/- 200hz
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      // Envelope
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 2);
      gain.gain.linearRampToValueAtTime(0, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.compressorNode!);
      
      osc.start(now);
      osc.stop(now + duration);
      lfo.start(now);
      lfo.stop(now + duration);
      
      this.activeNodes.push(osc, gain, filter, lfo, lfoGain);
    });
  }

  private playPad(freqs: number[], duration: number, texture: string) {
    if (!this.ctx || !this.compressorNode) return;
    const now = this.ctx.currentTime;
    
    // Spread chords in stereo
    freqs.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const pan = this.ctx!.createStereoPanner();

      osc.type = texture === 'structured' ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(f, now);

      // Pan spread based on note index
      pan.pan.value = (i / (freqs.length || 1)) * 2 - 1; // -1 to 1

      // Envelope
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.1 / freqs.length, now + 0.5); // Normalize volume
      gain.gain.setValueAtTime(0.1 / freqs.length, now + duration - 0.5);
      gain.gain.linearRampToValueAtTime(0, now + duration);

      osc.connect(pan);
      pan.connect(gain);
      gain.connect(this.compressorNode!);

      osc.start(now);
      osc.stop(now + duration);
      this.activeNodes.push(osc, gain, pan);
    });
  }

  private playBass(freq: number, time: number, texture: string) {
    if (!this.ctx || !this.compressorNode) return;
    
    const osc = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    
    subOsc.type = 'sine';
    subOsc.frequency.value = freq / 2;

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, time);
    filter.frequency.exponentialRampToValueAtTime(100, time + 0.5);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.3, time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.8);

    osc.connect(filter);
    subOsc.connect(filter);
    filter.connect(gain);
    gain.connect(this.compressorNode!);
    
    osc.start(time);
    osc.stop(time + 1);
    subOsc.start(time);
    subOsc.stop(time + 1);
    this.activeNodes.push(osc, subOsc, gain, filter);
  }

  private playMelodyNote(freq: number, time: number, type: 'bell' | 'pluck') {
    if (!this.ctx || !this.compressorNode) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    if (type === 'bell') {
      // Bell-like: Sine with sharp attack and long decay
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.2, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 2.0);
    } else {
      // Pluck: Triangle with short decay
      osc.type = 'triangle';
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.15, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
    }

    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(this.compressorNode);
    
    osc.start(time);
    osc.stop(time + 3);
    this.activeNodes.push(osc, gain);
  }

  private playNoiseTexture(duration: number) {
     if (!this.ctx || !this.compressorNode) return;
     // White noise buffer
     const bufferSize = this.ctx.sampleRate * duration;
     const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
     const data = buffer.getChannelData(0);
     for (let i = 0; i < bufferSize; i++) {
       data[i] = Math.random() * 2 - 1;
     }

     const noise = this.ctx.createBufferSource();
     noise.buffer = buffer;
     
     const filter = this.ctx.createBiquadFilter();
     filter.type = 'bandpass';
     filter.frequency.value = 1000;
     filter.Q.value = 1; // Wide band

     const gain = this.ctx.createGain();
     gain.gain.value = 0.02; // Very subtle
     
     noise.connect(filter);
     filter.connect(gain);
     gain.connect(this.compressorNode);
     
     noise.start(this.ctx.currentTime);
     this.activeNodes.push(noise, filter, gain);
  }

  // --- Scheduler & Patterns ---

  public play(journey: { stages: MusicalStageParams[], tempo: number, baseFrequency: number }) {
    this.stop();
    this.stages = journey.stages;
    this.currentTempo = journey.stages[0].tempo || journey.tempo;
    this.baseFreq = journey.baseFrequency;
    this.currentStageIndex = 0;
    this.currentChordIndex = 0;
    this.lastChordVoicing = [];
    this.isPlaying = true;
    
    if (this.ctx) {
        this.nextNoteTime = this.ctx.currentTime + 0.2;
        this.scheduler();
    }
  }

  private scheduler() {
    if (!this.isPlaying) return;

    while (this.nextNoteTime < this.ctx!.currentTime + this.scheduleAheadTime) {
      this.scheduleBar();
    }
    
    this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
  }

  private scheduleBar() {
    const stage = this.stages[this.currentStageIndex];
    if (this.onStageChange) this.onStageChange(stage);

    // Tempo Ramping: Move current tempo 5% closer to target stage tempo
    const targetTempo = stage.tempo || 60;
    this.currentTempo = this.currentTempo + (targetTempo - this.currentTempo) * 0.1;

    const secondsPerBeat = 60.0 / this.currentTempo;
    const barDuration = secondsPerBeat * 4; // 4/4 signature

    // 1. Chords
    const progression = stage.chordProgression;
    const rawDegrees = progression[this.currentChordIndex % progression.length];
    
    // Voice Leading Optimization
    const chordFreqs = this.optimizeVoicing(rawDegrees, stage.scaleMode);
    
    // Play Atmosphere (Every 2 bars to keep overlapping)
    if (this.currentChordIndex % 2 === 0) {
      this.playAtmosphere(this.baseFreq * 0.5, barDuration * 2.5, stage.texture);
    }

    // Play Pad
    if (stage.instrumentation.includes('pad')) {
      this.playPad(chordFreqs, barDuration, stage.texture);
    }

    // Play Bass
    if (stage.instrumentation.includes('bass')) {
      // Play root note of chord, down 2 octaves
      const root = this.getFreq(rawDegrees[0], stage.scaleMode, -2);
      this.playBass(root, this.nextNoteTime, stage.texture);
      
      // Syncopated Bass for specific feels
      if (stage.rhythmicFeel === 'syncopated') {
         this.playBass(root, this.nextNoteTime + (secondsPerBeat * 2.5), stage.texture);
      }
    }

    // Play Texture (Noise)
    if (stage.instrumentation.includes('texture') && this.currentChordIndex % 4 === 0) {
        this.playNoiseTexture(barDuration * 4);
    }

    // Play Melody / Arp based on Rhythmic Feel
    if (stage.instrumentation.includes('chimes') || stage.instrumentation.includes('lead')) {
      this.scheduleArpeggio(stage, rawDegrees, secondsPerBeat, chordFreqs);
    }

    // Advance
    this.nextNoteTime += barDuration;
    this.currentChordIndex++;

    // Stage Progression (4 Bars per stage)
    const BARS_PER_STAGE = 4;
    if (this.currentChordIndex > 0 && this.currentChordIndex % BARS_PER_STAGE === 0) {
      if (this.currentStageIndex < this.stages.length - 1) {
        this.currentStageIndex++;
        // Keep chord index flowing but maybe reset if progressions are vastly different?
        // Let's reset chord index to start fresh progression
        this.currentChordIndex = 0; 
      } else {
        // Loop last stage
        this.currentChordIndex = 0;
      }
    }
  }

  private scheduleArpeggio(stage: MusicalStageParams, degrees: number[], spb: number, freqs: number[]) {
    const isLead = stage.instrumentation.includes('lead');
    const noteType = isLead ? 'pluck' : 'bell';
    const subdivisions = isLead ? 8 : 4; // 8th notes vs quarters
    const stepTime = (spb * 4) / subdivisions;

    // Pattern Generation based on Feel
    let pattern: number[] = [];
    switch (stage.rhythmicFeel) {
        case 'flowing':
            // Up/Down Arp
            pattern = Array.from({length: subdivisions}, (_, i) => i % degrees.length);
            break;
        case 'syncopated':
            // Euclidean-ish (3+3+2)
            pattern = [0, -1, -1, 1, -1, -1, 2, -1]; // -1 is rest
            break;
        case 'chaotic':
            // Random
            pattern = Array.from({length: subdivisions}, () => Math.random() > 0.4 ? Math.floor(Math.random() * degrees.length) : -1);
            break;
        case 'steady':
        default:
            // Quarter notes only
            pattern = [0, -1, 1, -1, 2, -1, 0, -1]; 
            break;
    }

    pattern.forEach((noteIndex, step) => {
        if (noteIndex !== -1) {
            // Use voiced freqs if possible, or calculate fresh for melodic range
            // For melody, we often want higher octaves
            const octaveShift = isLead ? 1 : 2;
            const degree = degrees[noteIndex % degrees.length];
            const freq = this.getFreq(degree, stage.scaleMode, octaveShift);
            
            // Humanize timing slightly
            const humanize = (Math.random() - 0.5) * 0.03;
            this.playMelodyNote(freq, this.nextNoteTime + (step * stepTime) + humanize, noteType);
        }
    });
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerID !== null) clearTimeout(this.timerID);
    this.activeNodes.forEach(node => {
      try {
        if (node instanceof OscillatorNode || node instanceof AudioBufferSourceNode) node.stop();
        node.disconnect();
      } catch (e) {}
    });
    this.activeNodes = [];
  }
}

export const audioEngine = new HealingAudioEngine();

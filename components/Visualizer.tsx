
import React, { useRef, useEffect } from 'react';
import { Particle, AnalysisResult, MusicalStageParams } from '../types';

interface VisualizerProps {
  isPlaying: boolean;
  innerAnalysis: { dominantColor: string };
  outerAnalysis: { dominantColor: string };
  currentStage: MusicalStageParams | null;
}

const Visualizer: React.FC<VisualizerProps> = ({ isPlaying, innerAnalysis, outerAnalysis, currentStage }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animationFrameId = useRef<number | null>(null);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
  };

  const createParticle = (width: number, height: number, stageName: string): Particle => {
    const angle = Math.random() * Math.PI * 2;
    let radius = 0;
    let colorHex = '#ffffff';

    const centerX = width / 2;
    const centerY = height / 2;

    // Spawn logic based on Song Stage
    const normalizedStage = stageName.toLowerCase();
    
    if (normalizedStage.includes('inner')) {
      radius = Math.random() * (width * 0.15); // Inner Core
      colorHex = innerAnalysis.dominantColor;
    } else if (normalizedStage.includes('outer') || normalizedStage.includes('persona')) {
      radius = (width * 0.25) + Math.random() * (width * 0.1); // Outer Ring
      colorHex = outerAnalysis.dominantColor;
    } else if (normalizedStage.includes('integration')) {
      radius = Math.random() * (width * 0.35); // Full spread
      colorHex = Math.random() > 0.5 ? innerAnalysis.dominantColor : outerAnalysis.dominantColor;
    } else {
      // Intro
      radius = Math.random() * (width * 0.4);
      colorHex = '#ffffff';
    }

    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    const speed = 0.2 + Math.random() * 0.5;
    
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1.0,
      maxLife: 1.0,
      color: colorHex,
      size: Math.random() * 3 + 1,
      alpha: 0
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 600;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const render = () => {
      // Clear with trail effect for "dreamy" look
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, size, size);
      // ctx.clearRect(0, 0, size, size); // Use clearRect if trail not desired

      if (!isPlaying) {
        particles.current = [];
        return;
      }
      
      const centerX = size / 2;
      const centerY = size / 2;

      // Spawn new particles
      const energy = currentStage ? currentStage.energy : 50;
      const spawnRate = Math.max(1, Math.floor(energy / 20));
      
      for(let i=0; i<spawnRate; i++) {
        if (particles.current.length < 400 && currentStage) {
          particles.current.push(createParticle(size, size, currentStage.stageName));
        }
      }

      // Update and Draw
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        
        // Physics
        p.x += p.vx;
        p.y += p.vy;
        
        // Spiral rotation effect
        const dx = p.x - centerX;
        const dy = p.y - centerY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        // Faster rotation near center
        const rotSpeed = 0.01 * (200 / (dist + 1)); 
        
        const newDx = dx * Math.cos(rotSpeed) - dy * Math.sin(rotSpeed);
        const newDy = dx * Math.sin(rotSpeed) + dy * Math.cos(rotSpeed);
        
        p.x = centerX + newDx;
        p.y = centerY + newDy;

        // Lifecycle
        p.life -= 0.005;
        if (p.life > 0.8) p.alpha += 0.05;
        else if (p.life < 0.2) p.alpha -= 0.05;
        p.alpha = Math.max(0, Math.min(1, p.alpha));

        if (p.life <= 0) {
          particles.current.splice(i, 1);
        } else {
          ctx.beginPath();
          const rgb = hexToRgb(p.color);
          
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
          gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${p.alpha})`);
          gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
          
          ctx.fillStyle = gradient;
          ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isPlaying, innerAnalysis, outerAnalysis, currentStage]);

  return (
    <canvas 
      ref={canvasRef}
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 mix-blend-screen"
    />
  );
};

export default Visualizer;

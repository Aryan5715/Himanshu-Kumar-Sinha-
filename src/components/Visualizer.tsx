import React, { useEffect, useRef } from "react";
import { motion } from "motion/react";

type VisualizerState = "idle" | "listening" | "processing" | "speaking";

interface VisualizerProps {
  state: VisualizerState;
}

interface Particle {
  x: number;
  y: number;
  angle: number;
  speed: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  distance: number;
}

export default function Visualizer({ state }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const getRingAnimation = (index: number, reverse: boolean = false) => {
    const baseSpeed = state === "listening" ? 3 : state === "processing" ? 1.5 : state === "speaking" ? 2 : 15;
    return {
      rotate: reverse ? [-360, 0] : [0, 360],
      transition: { duration: baseSpeed + index * 2, repeat: Infinity, ease: "linear" }
    };
  };

  const getPulseAnimation = () => {
    if (state === "speaking") {
      return {
        scale: [1, 1.05, 0.98, 1.02, 1],
        opacity: [0.8, 1, 0.8, 1, 0.8],
        transition: { duration: 0.5, repeat: Infinity, ease: "easeInOut" }
      };
    }
    if (state === "listening") {
      return {
        scale: [1, 1.02, 1],
        opacity: [0.7, 1, 0.7],
        transition: { duration: 1, repeat: Infinity, ease: "easeInOut" }
      };
    }
    if (state === "processing") {
      return {
        scale: [0.98, 1.02, 0.98],
        opacity: [0.6, 0.9, 0.6],
        transition: { duration: 0.8, repeat: Infinity, ease: "linear" }
      };
    }
    return {
      scale: [1, 1.01, 1],
      opacity: [0.4, 0.6, 0.4],
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
    };
  };

  // JARVIS/Zoya HUD Theme values
  const getTheme = () => {
    switch (state) {
      case "listening": return { color: "rgba(139, 92, 246, 1)", glow: "shadow-violet-500/60", border: "border-violet-400" };
      case "processing": return { color: "rgba(56, 189, 248, 1)", glow: "shadow-sky-400/80", border: "border-sky-400" };
      case "speaking": return { color: "rgba(236, 72, 153, 1)", glow: "shadow-pink-500/80", border: "border-pink-400" };
      default: return { color: "rgba(6, 182, 212, 0.8)", glow: "shadow-cyan-500/40", border: "border-cyan-500/50" };
    }
  };

  const theme = getTheme();

  // Particle System & Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];
    
    // Resize handler with high DPI backing support
    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    // Frequency analyzer data buffers
    const frequencyData = new Uint8Array(128);
    let rotationAngle = 0;

    // Gradient helper
    const getParticleColor = (st: VisualizerState, val: number) => {
      if (st === "speaking") {
        return `hsla(${290 + (val % 70)}, 95%, 65%, `; // Hot violet/pink
      } else if (st === "listening") {
        return `hsla(${260 + (val % 40)}, 85%, 60%, `; // Purple/indigo
      } else if (st === "processing") {
        return `hsla(${190 + (val % 30)}, 90%, 55%, `; // Blue/Sky cyan
      }
      return `hsla(${180 + (val % 20)}, 80%, 50%, `; // Teal/cyan
    };

    // Render loop
    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      const centerX = width / 2;
      const centerY = height / 2;

      // Gentle fade effect for motion trails
      ctx.fillStyle = "rgba(10, 10, 18, 0.15)";
      ctx.fillRect(0, 0, width, height);

      // Access active WebAudio API frequency data if available
      const activeAnalyser = (window as any).activeAudioAnalyser;
      let averageAudioFreq = 0;
      let maxAudioFreq = 0;

      if (activeAnalyser) {
        try {
          activeAnalyser.getByteFrequencyData(frequencyData);
          let sum = 0;
          for (let i = 0; i < frequencyData.length; i++) {
            sum += frequencyData[i];
            if (frequencyData[i] > maxAudioFreq) {
              maxAudioFreq = frequencyData[i];
            }
          }
          averageAudioFreq = sum / frequencyData.length;
        } catch (e) {
          // Guard against closed context errors
        }
      } else if (state === "speaking") {
        // Fallback procedural frequencies for fluid natural response in offline states
        const time = Date.now() * 0.003;
        for (let i = 0; i < frequencyData.length; i++) {
          frequencyData[i] = Math.max(0, 70 + Math.sin(time + i * 0.2) * 60 + Math.cos(time * 0.5 + i * 0.05) * 40);
        }
        averageAudioFreq = 95;
        maxAudioFreq = 160;
      }

      // Base radius of central orb
      const baseRadius = Math.min(width, height) * 0.125; // Matching w-[25%] in css
      const reactiveRadius = baseRadius + (averageAudioFreq * 0.2);

      // 1. Particle Spawning Logic
      if (state === "speaking") {
        // Spawn energetic particles based on frequency loudness
        const spawnCount = Math.floor(1 + (averageAudioFreq / 30));
        for (let i = 0; i < spawnCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1.5 + (maxAudioFreq / 50) + Math.random() * 2.5;
          const size = 1.5 + Math.random() * 3.5 + (averageAudioFreq / 40);
          particles.push({
            x: centerX + Math.cos(angle) * baseRadius,
            y: centerY + Math.sin(angle) * baseRadius,
            angle: angle,
            speed: speed,
            size: size,
            color: getParticleColor(state, maxAudioFreq + Math.random() * 50),
            alpha: 1.0,
            decay: 0.01 + Math.random() * 0.02,
            distance: 0
          });
        }
      } else if (state === "listening" && Math.random() < 0.25) {
        // Spawn gentle ambient light grains moving inwards
        const angle = Math.random() * Math.PI * 2;
        const outerBound = baseRadius * 3;
        particles.push({
          x: centerX + Math.cos(angle) * outerBound,
          y: centerY + Math.sin(angle) * outerBound,
          angle: angle + Math.PI, // Directed inwards
          speed: 0.5 + Math.random() * 1.0,
          size: 1.0 + Math.random() * 1.5,
          color: getParticleColor(state, Math.random() * 10),
          alpha: 0.8,
          decay: 0.005 + Math.random() * 0.01,
          distance: 0
        });
      } else if (Math.random() < 0.08) {
        // Starry subtle drifts in idle
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.2 + Math.random() * 0.5;
        particles.push({
          x: centerX + Math.cos(angle) * (baseRadius + Math.random() * 100),
          y: centerY + Math.sin(angle) * (baseRadius + Math.random() * 100),
          angle: angle,
          speed: speed,
          size: 0.8 + Math.random() * 1.5,
          color: getParticleColor(state, 100),
          alpha: 0.6,
          decay: 0.005,
          distance: 0
        });
      }

      // 2. Draw & Update Particle System
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // React physically to audio levels: speed up if audio goes high
        const speedMultiplier = 1 + (averageAudioFreq / 100);
        p.x += Math.cos(p.angle) * p.speed * speedMultiplier;
        p.y += Math.sin(p.angle) * p.speed * speedMultiplier;
        
        p.alpha -= p.decay;
        p.distance += p.speed;

        if (p.alpha <= 0 || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
          particles.splice(i, 1);
          continue;
        }

        // Draw particle glowing arc
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + p.alpha + ")";
        
        // Glow effect
        ctx.shadowBlur = p.size * 2.5;
        ctx.shadowColor = p.color + "1)";
        ctx.fill();
        ctx.restore();
      }

      // 3. Render Circular Audio Waves wrapping the Core Circle
      if (state === "speaking" || state === "processing" || state === "listening") {
        rotationAngle += 0.008 + (averageAudioFreq * 0.0002);
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotationAngle);

        const pointCount = 72; // Circular subdivisions
        ctx.beginPath();

        for (let i = 0; i <= pointCount; i++) {
          const angle = (i / pointCount) * Math.PI * 2;
          const dataIndex = Math.floor((i / pointCount) * frequencyData.length);
          const rawAmp = frequencyData[dataIndex] || 0;
          
          // Smooth the transition of amplitude
          const cleanAmp = state === "speaking" ? rawAmp * 0.35 : state === "listening" ? Math.sin(Date.now()*0.005 + i * 0.5) * 12 : Math.sin(Date.now()*0.01 + i) * 6;
          const finalRad = baseRadius + 14 + cleanAmp;

          const x = Math.cos(angle) * finalRad;
          const y = Math.sin(angle) * finalRad;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.closePath();
        ctx.lineWidth = 2.5;
        
        // Glow stroke config
        ctx.strokeStyle = state === "speaking" ? "rgba(236, 72, 153, 0.82)" : state === "listening" ? "rgba(139, 92, 246, 0.7)" : "rgba(56, 189, 248, 0.7)";
        ctx.shadowBlur = 12;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.stroke();
        ctx.restore();
      }

      // 4. Clean background starry details
      if (state === "idle") {
        // Draw delicate constellation nodes linking particles
        for (let i = 0; i < Math.min(particles.length, 12); i++) {
          for (let j = i + 1; j < Math.min(particles.length, 12); j++) {
            const p1 = particles[i];
            const p2 = particles[j];
            const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
            if (dist < 45) {
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `rgba(6, 182, 212, ${(1 - dist / 45) * 0.12})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, [state]);

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
      {/* Real-time reactive Particle Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-0 pointer-events-none rounded-3xl"
        id="visualizer-particle-canvas"
      />

      {/* Ambient Glow */}
      <motion.div
        animate={getPulseAnimation()}
        className={`absolute w-[60%] h-[60%] rounded-full blur-[80px] ${theme.glow} z-10`}
        style={{ backgroundColor: theme.color, opacity: 0.12 }}
      />

      {/* Ring 1: Massive Outer Dashed */}
      <motion.div
        animate={getRingAnimation(4, false)}
        className={`absolute w-[100%] h-[100%] rounded-full border-[1px] border-dashed ${theme.border} opacity-20 z-10`}
      />

      {/* Ring 2: Segmented Thick Ring */}
      <motion.div
        animate={getRingAnimation(3, true)}
        className={`absolute w-[85%] h-[85%] rounded-full border-[2px] border-dotted ${theme.border} opacity-25 z-10`}
      />

      {/* Ring 3: Scanner Ring (Solid with gaps) */}
      <motion.div
        animate={getRingAnimation(2, false)}
        className={`absolute w-[70%] h-[70%] rounded-full border-[1px] ${theme.border} border-t-transparent border-b-transparent opacity-35 z-10`}
      />

      {/* Ring 4: Inner Dashed */}
      <motion.div
        animate={getRingAnimation(1, true)}
        className={`absolute w-[55%] h-[55%] rounded-full border-[2px] border-dashed ${theme.border} opacity-45 z-10`}
      />
      
      {/* Ring 5: Core HUD Ring */}
      <motion.div
        animate={getRingAnimation(0, false)}
        className={`absolute w-[40%] h-[40%] rounded-full border-[4px] border-dotted ${theme.border} opacity-60 z-10`}
      />

      {/* Core Circle */}
      <motion.div
        animate={getPulseAnimation()}
        className={`absolute w-[25%] h-[25%] rounded-full border-[1px] ${theme.border} bg-black/60 backdrop-blur-md flex items-center justify-center shadow-[inset_0_0_30px_rgba(0,0,0,0.6)] z-20`}
        style={{ boxShadow: `0 0 45px ${theme.color}, inset 0 0 35px ${theme.color}` }}
      >
        {/* Center Text */}
        <div 
          className="font-bold tracking-[0.15em] text-sm md:text-xl lg:text-2xl text-white text-center px-1 select-none"
          style={{ textShadow: `0 0 15px ${theme.color}, 0 0 30px ${theme.color}` }}
        >
          SADHNA SINHA
        </div>
      </motion.div>
    </div>
  );
}

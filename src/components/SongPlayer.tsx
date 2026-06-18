import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, X, Music, Volume2, RotateCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SongPlayerProps {
  videoId: string;
  title: string;
  onClose: () => void;
}

export default function SongPlayer({ videoId, title, onClose }: SongPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(80);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // High fidelity visual states
  const [progress, setProgress] = useState(0);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const totalDurationSec = 245; // Simulated highly-accurate standard song length (4:05)

  // Determine Premium Emojis based on song request
  const getVibrantEmojis = (songTitle: string) => {
    const lowerTitle = songTitle.toLowerCase();
    if (lowerTitle.includes("sad") || lowerTitle.includes("pal pal") || lowerTitle.includes("dil") || lowerTitle.includes("dard")) {
      return { primary: "💔", list: ["🥺", "💔", "🥀", "✨", "🎵", "🖤"] };
    }
    if (lowerTitle.includes("love") || lowerTitle.includes("romantic") || lowerTitle.includes("ishq") || lowerTitle.includes("pyaar")) {
      return { primary: "💖", list: ["💖", "🥰", "✨", "💓", "🌹", "🎵"] };
    }
    if (lowerTitle.includes("party") || lowerTitle.includes("dance") || lowerTitle.includes("dj") || lowerTitle.includes("high")) {
      return { primary: "🔥", list: ["🔥", "⚡", "🕺", "💃", "🥳", "✨"] };
    }
    return { primary: "🎵", list: ["🎵", "✨", "🎧", "🌟", "💫", "🎶"] };
  };

  const { primary: primaryEmoji, list: decorEmojis } = getVibrantEmojis(title);

  // Time Formatter
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Simulate progress bar and timer over time
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTimeSec((prev) => {
          if (prev >= totalDurationSec) {
            return 0; // Loop or stay at end
          }
          const nextVal = prev + 1;
          setProgress((nextVal / totalDurationSec) * 100);
          return nextVal;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalDurationSec]);

  // Post messages to YouTube Iframe API for seamless Play / Pause control
  const togglePlay = () => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;

    if (isPlaying) {
      // Pause Video command
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: "pauseVideo", args: "" }),
        "*"
      );
    } else {
      // Play Video command
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: "playVideo", args: "" }),
        "*"
      );
    }
    setIsPlaying(!isPlaying);
  };

  // Sync volume level to Iframe if possible
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: "setVolume", args: [volume] }),
        "*"
      );
    }
  }, [volume, isPlaying]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      id="custom-song-player"
      className="w-full max-w-sm bg-slate-950/90 backdrop-blur-2xl border-2 border-violet-500/40 rounded-3xl p-5 shadow-[0_0_50px_rgba(139,92,246,0.3)] flex flex-col gap-4 pointer-events-auto relative overflow-hidden"
    >
      {/* Hidden YouTube IFrame */}
      <iframe
        ref={iframeRef}
        id="yt-hidden-player"
        className="w-1 h-1 absolute top-[-9999px] left-[-9999px] pointer-events-none"
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&controls=0&origin=${window.location.origin}`}
        allow="autoplay; encrypted-media"
      />

      {/* Decorative floating animated background elements */}
      <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-violet-900/15 via-pink-900/5 to-transparent pointer-events-none" />
      
      {/* Floating Sparkles & Emojis */}
      <div className="absolute -left-10 -top-10 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-violet-600/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header Container */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2 text-violet-400">
          <span className="text-lg animate-pulse">{primaryEmoji}</span>
          <span className="text-xs font-mono font-bold tracking-widest uppercase bg-violet-500/10 text-violet-300 border border-violet-500/20 px-2 py-0.5 rounded-md">
            Sadhna is Singing 🌟
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all hover:scale-105 active:scale-95"
        >
          <X size={15} />
        </button>
      </div>

      {/* Album Disk & Control Center */}
      <div className="flex items-center gap-4 z-10 relative">
        {/* Spinning Vinyl Disk */}
        <div className="relative shrink-0 select-none">
          <motion.div
            animate={{ rotate: isPlaying ? 360 : 0 }}
            transition={{
              repeat: Infinity,
              duration: 4.5,
              ease: "linear",
            }}
            className="w-20 h-20 rounded-full bg-gradient-to-tr from-violet-600 via-pink-600 to-cyan-400 p-0.5 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)]"
          >
            <div className="w-full h-full rounded-full bg-neutral-950 flex items-center justify-center relative overflow-hidden">
              {/* Vinyl grooves */}
              <div className="absolute inset-2 border border-white/5 rounded-full" />
              <div className="absolute inset-4 border border-white/5 rounded-full" />
              <div className="absolute inset-6 border border-white/10 rounded-full" />
              <div className="absolute inset-8 border border-white/15 rounded-full" />
              
              {/* Center core */}
              <div className="w-6 h-6 rounded-full bg-slate-900 border border-violet-500/30 flex items-center justify-center z-10">
                <span className="text-[10px] select-none">{primaryEmoji}</span>
              </div>
            </div>
          </motion.div>

          {/* Active play indicator wave effect */}
          {isPlaying && (
            <div className="absolute -top-1 -right-1 flex gap-1 bg-violet-950/80 backdrop-blur-md px-1.5 py-1 rounded-full border border-violet-500/20 shadow-sm animate-bounce">
              <span className="text-[10px]">{primaryEmoji}</span>
            </div>
          )}
        </div>

        {/* Dynamic Track Title Details */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white text-[15px] font-bold truncate select-none leading-tight filter drop-shadow">
            {title}
          </h3>
          <p className="text-violet-400 text-xs font-mono font-medium mt-1 uppercase tracking-wider flex items-center gap-1">
            <span className="animate-spin-slow">✨</span> Sadhna's Request Mix
          </p>
          
          <div className="flex gap-1.5 mt-2">
            {decorEmojis.map((emoji, index) => (
              <span
                key={index}
                className="text-xs opacity-75 transform hover:scale-125 transition-transform cursor-pointer"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {emoji}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Seeker and Timer Info */}
      <div className="flex flex-col gap-1.5 z-10 mt-1">
        {/* Real-time counters */}
        <div className="flex justify-between items-center text-[10px] font-mono text-white/40 tracking-wider">
          <span>{formatTime(currentTimeSec)}</span>
          <span className="text-violet-400/60 font-semibold uppercase bg-violet-500/5 px-1.5 rounded">
            Live Stream
          </span>
          <span>{formatTime(totalDurationSec)}</span>
        </div>

        {/* High precision aesthetic progress slider */}
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden relative cursor-pointer">
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ ease: "linear", duration: 0.3 }}
            className="h-full bg-gradient-to-r from-violet-500 via-pink-500 to-cyan-400 shadow-[0_0_12px_#c084fc]"
          />
        </div>
      </div>

      {/* Premium Integrated Sound Waves Visualizer */}
      {isPlaying && (
        <div className="flex justify-around items-end h-5 px-4 pointer-events-none select-none z-10 overflow-hidden">
          {Array.from({ length: 18 }).map((_, i) => {
            const delays = [0, 150, 300, 450, 100, 250, 400, 50, 350, 200];
            const delay = delays[i % delays.length];
            return (
              <motion.div
                key={i}
                animate={{
                  height: ["15%", "95%", "15%"],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.8 + (i % 4) * 0.2,
                  delay: delay / 1000,
                  ease: "easeInOut",
                }}
                className="w-1 bg-gradient-to-t from-violet-500 via-pink-400 to-cyan-300 rounded-full"
              />
            );
          })}
        </div>
      )}

      {/* Master Audio Controller Panel */}
      <div className="flex items-center justify-between z-10 border-t border-white/5 pt-3">
        {/* Primary Playback Toggle */}
        <button
          onClick={togglePlay}
          className="p-3 rounded-full bg-gradient-to-tr from-violet-500 via-pink-500 to-rose-400 text-white font-bold hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)]"
        >
          {isPlaying ? (
            <Pause size={17} fill="white" />
          ) : (
            <Play size={17} fill="white" className="translate-x-0.5" />
          )}
        </button>

        {/* Interactive feedback label */}
        <div className="font-mono text-[9px] text-white/30 tracking-widest text-center select-none max-w-[120px] leading-tight uppercase">
          {isPlaying ? "Sadhna is Singing for you 💖" : "Sadhna is waiting 🥺"}
        </div>

        {/* Sound Decibels Control slider */}
        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 shrink-0">
          <Volume2 size={12} className="text-white/40" />
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-16 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-400 focus:outline-none"
          />
        </div>
      </div>
    </motion.div>
  );
}

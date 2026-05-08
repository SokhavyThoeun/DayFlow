import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Play, Pause, RotateCcw, X, Volume2, VolumeX } from 'lucide-react';
import { cn } from '../lib/utils';
import confetti from 'canvas-confetti';

interface FocusModeProps {
  onClose: () => void;
}

export default function FocusMode({ onClose }: FocusModeProps) {
  const { t } = useTranslation();
  const [totalDuration, setTotalDuration] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('25');

  const sounds = [
    { id: 'rain', label: 'Rain', url: 'https://actions.google.com/sounds/v1/water/rain_on_roof.ogg' },
    { id: 'cafe', label: 'Cafe', url: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg' },
    { id: 'nature', label: 'Nature', url: 'https://actions.google.com/sounds/v1/ambiences/forest_ambience.ogg' },
    { id: 'lofi', label: 'Lofi', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
  ];

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      clearInterval(interval);
      setIsActive(false);
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#a855f7', '#ec4899']
      });
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => {
    if (showSettings) {
      handleSetDuration(parseInt(customMinutes) || 25);
      setShowSettings(false);
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(totalDuration);
  };

  const handleSetDuration = (mins: number) => {
    const seconds = mins * 60;
    setTotalDuration(seconds);
    setTimeLeft(seconds);
    setIsActive(false);
    setCustomMinutes(mins.toString());
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;
  const audioRef = React.useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (selectedSound) {
        audioRef.current.src = sounds.find(s => s.id === selectedSound)?.url || '';
        audioRef.current.play().catch(e => console.log("Audio play failed:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [selectedSound]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-8 transition-colors duration-700 overflow-y-auto"
    >
      <audio ref={audioRef} loop />
      {/* Background Glow */}
      <div className={cn(
        "absolute inset-0 bg-indigo-500/10 blur-[150px] transition-opacity duration-1000",
        isActive ? "opacity-100" : "opacity-30"
      )} />

      {/* Close Button */}
      <button 
        onClick={onClose}
        className="fixed top-8 left-8 w-12 h-12 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl flex items-center justify-center text-zinc-900 dark:text-white shadow-xl active:scale-95 transition-all z-[110] border border-white dark:border-white/5"
      >
        <X size={20} />
      </button>

      {/* Timer Display */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center mb-8 shrink-0">
        <svg 
          viewBox="0 0 320 320"
          className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-2xl"
        >
          <circle 
            cx="160" cy="160" r="145" 
            stroke="currentColor" strokeWidth="4" fill="transparent" 
            className="text-zinc-200 dark:text-white/5"
          />
          <motion.circle 
            cx="160" cy="160" r="145" 
            stroke="currentColor" strokeWidth="12" fill="transparent" 
            strokeDasharray="911"
            animate={{ strokeDashoffset: 911 - (911 * progress) / 100 }}
            strokeLinecap="round"
            className="text-indigo-500"
          />
        </svg>

        <div className="text-center z-10 flex flex-col items-center justify-center">
          <motion.div 
            onClick={() => !isActive && setShowSettings(!showSettings)}
            className="cursor-pointer select-none"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div 
              key={timeLeft}
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
              className="text-6xl sm:text-7xl font-bold text-zinc-900 dark:text-white leading-tight tracking-tight px-4 font-mono"
            >
              {formatTime(timeLeft)}
            </motion.div>
          </motion.div>
          <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.5em] mt-1">
            Focus
          </p>
        </div>
      </div>

      {/* Settings / Presets */}
      <div className="h-16 flex flex-col items-center justify-center mb-12 z-10 w-full max-w-xs">
        <AnimatePresence mode="wait">
          {!isActive && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-2"
            >
              {[15, 25, 45].map((mins) => (
                <button
                  key={mins}
                  onClick={() => handleSetDuration(mins)}
                  className={cn(
                    "px-4 py-2 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-sm",
                    totalDuration === mins * 60
                      ? "bg-indigo-500 text-white shadow-indigo-500/20"
                      : "bg-white dark:bg-zinc-900 text-zinc-400 border border-zinc-200 dark:border-white/5"
                  )}
                >
                  {mins}m
                </button>
              ))}
              <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-2xl px-3 h-9">
                <input
                  type="number"
                  value={customMinutes}
                  onChange={(e) => {
                    setCustomMinutes(e.target.value);
                    const m = parseInt(e.target.value);
                    if (m > 0 && m <= 999) {
                      setTotalDuration(m * 60);
                      setTimeLeft(m * 60);
                    }
                  }}
                  className="w-10 bg-transparent text-[11px] font-bold text-indigo-500 focus:outline-none text-center"
                  placeholder="25"
                />
                <span className="text-[9px] font-black text-zinc-400 uppercase">min</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Controls */}
      <div className="flex items-center gap-8 mb-16 z-10">
        <button 
          onClick={resetTimer}
          className="w-16 h-16 rounded-[2rem] bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200/50 dark:border-white/5 flex items-center justify-center text-zinc-400 dark:text-zinc-600 active:rotate-180 transition-all duration-500 shadow-xl"
        >
          <RotateCcw size={22} />
        </button>

        <button 
          onClick={toggleTimer}
          className={cn(
            "w-24 h-24 rounded-[3rem] flex items-center justify-center transition-all duration-500 shadow-2xl active:scale-90 relative z-10 group overflow-hidden",
            isActive 
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" 
              : "bg-indigo-500 text-white shadow-indigo-500/40"
          )}
        >
          {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-2" />}
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        
        <div className="w-16" />
      </div>

      {/* Sound Selector */}
      <div className="flex flex-col items-center gap-6 z-10">
        <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.3em]">Focus Sounds</span>
        <div className="flex flex-wrap justify-center gap-3 px-4">
          {sounds.map((sound) => (
            <button 
              key={sound.id}
              onClick={() => setSelectedSound(selectedSound === sound.id ? null : sound.id)}
              className={cn(
                "px-6 py-3 rounded-2xl text-[11px] font-bold tracking-wide transition-all active:scale-95 shadow-sm",
                selectedSound === sound.id
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                  : "bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-white/5 hover:border-indigo-500/30"
              )}
            >
              {sound.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

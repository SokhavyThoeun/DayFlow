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
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);

  const sounds = [
    { id: 'rain', label: 'Rain', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }, // Placeholder URLs
    { id: 'cafe', label: 'Cafe', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 'nature', label: 'Nature', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { id: 'lofi', label: 'Lofi', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  ];

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      clearInterval(interval);
      setIsActive(false);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#a855f7', '#ec4899']
      });
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((25 * 60 - timeLeft) / (25 * 60)) * 100;
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
      className="fixed inset-0 z-[100] bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-8 transition-colors duration-700"
    >
      <audio ref={audioRef} loop />
      {/* Background Glow */}
      <div className={cn(
        "absolute inset-0 bg-indigo-500/20 blur-[150px] transition-opacity duration-1000",
        isActive ? "opacity-100" : "opacity-30"
      )} />

      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-10 left-10 w-12 h-12 rounded-2xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl flex items-center justify-center text-zinc-900 dark:text-white shadow-xl active:scale-95 transition-all z-[110]"
      >
        <X size={20} />
      </button>

      {/* Timer Display */}
      <div className="relative w-80 h-80 flex items-center justify-center mb-12">
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle 
            cx="160" cy="160" r="150" 
            stroke="currentColor" strokeWidth="2" fill="transparent" 
            className="text-zinc-200 dark:text-white/5"
          />
          <motion.circle 
            cx="160" cy="160" r="150" 
            stroke="currentColor" strokeWidth="8" fill="transparent" 
            strokeDasharray="942"
            animate={{ strokeDashoffset: 942 - (942 * progress) / 100 }}
            strokeLinecap="round"
            className="text-indigo-500 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]"
          />
        </svg>

        <div className="text-center z-10">
          <motion.div 
            key={timeLeft}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            className="text-[100px] font-bold text-zinc-900 dark:text-white leading-none tracking-tighter"
          >
            {formatTime(timeLeft)}
          </motion.div>
          <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.4em] mt-2">
            Work Session
          </p>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center gap-8 mb-16 z-10">
        <button 
          onClick={resetTimer}
          className="w-16 h-16 rounded-3xl bg-white/50 dark:bg-white/5 backdrop-blur-xl flex items-center justify-center text-zinc-400 dark:text-zinc-600 active:rotate-180 transition-all duration-500"
        >
          <RotateCcw size={24} />
        </button>

        <div className="relative group">
          <button 
            onClick={toggleTimer}
            className={cn(
              "w-24 h-24 rounded-[2.5rem] flex items-center justify-center transition-all duration-500 shadow-2xl active:scale-90 relative z-10",
              isActive 
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" 
                : "bg-indigo-500 text-white shadow-indigo-500/40"
            )}
          >
            {isActive ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" className="ml-2" />}
          </button>
          <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em]">Focus Sounds</span>
          </div>
        </div>
        
        <div className="w-16 h-16" />
      </div>

      {/* Sound Selector */}
      <div className="flex gap-3 z-10">
        {sounds.map((sound) => (
          <button 
            key={sound.id}
            onClick={() => setSelectedSound(selectedSound === sound.id ? null : sound.id)}
            className={cn(
              "px-6 py-3 rounded-2xl text-xs font-bold transition-all active:scale-95",
              selectedSound === sound.id
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                : "bg-white dark:bg-white/5 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-white/5"
            )}
          >
            {sound.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

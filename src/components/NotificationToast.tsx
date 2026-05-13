import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Clock, AlertTriangle, X, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

interface NotificationToastProps {
  show: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: 'upcoming' | 'late' | 'motivation';
}

export default function NotificationToast({ show, onClose, title, message, type }: NotificationToastProps) {
  const duration = type === 'motivation' ? 5 : 8;
  // Use a ref for the timer to avoid reset on re-renders if we add more state
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.95, transition: { duration: 0.3, ease: "anticipate" } }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0.1, bottom: 0.05 }}
          onDragEnd={(_, info) => {
            // Dismiss if swiped up strongly
            if (info.offset.y < -50 || info.velocity.y < -300) {
              onClose();
            }
          }}
          whileDrag={{ scale: 0.98 }}
          className="fixed top-6 left-5 right-5 z-[100] max-w-md mx-auto cursor-grab active:cursor-grabbing"
        >
          <div className={cn(
            "p-5 rounded-[2.5rem] border shadow-2xl backdrop-blur-xl flex flex-col items-center transition-colors relative overflow-hidden",
            type === 'upcoming' 
              ? "bg-white/95 dark:bg-zinc-900/95 border-indigo-500/20 shadow-indigo-500/10" 
              : type === 'late'
                ? "bg-rose-50/95 dark:bg-zinc-900/95 border-rose-500/20 shadow-rose-500/10"
                : "bg-amber-50/95 dark:bg-zinc-900/95 border-amber-500/20 shadow-amber-500/10"
          )}>
            {/* Auto-dismiss progress bar */}
            <motion.div 
              key={show ? 'active' : 'inactive'}
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: duration, ease: "linear" }}
              className={cn(
                "absolute bottom-0 left-0 h-1",
                type === 'upcoming' ? "bg-indigo-500/30" : 
                type === 'late' ? "bg-rose-500/30" : "bg-amber-500/30"
              )}
            />

            {/* Drag Handle */}
            <div className="w-10 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full mb-4 opacity-50" />
            
            <div className="flex gap-4 w-full">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                type === 'upcoming' ? "bg-indigo-500 text-white" : 
                type === 'late' ? "bg-rose-500 text-white" : "bg-amber-500 text-white"
              )}>
                {type === 'upcoming' ? <Clock size={20} /> : 
                 type === 'late' ? <AlertTriangle size={20} /> : <Sparkles size={20} />}
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    {type === 'upcoming' ? 'Upcoming Focus' : 
                     type === 'late' ? 'Priority Alert' : 'Daily Inspiration'}
                  </h4>
                  <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                    <X size={14} />
                  </button>
                </div>
                <p className="font-black text-zinc-900 dark:text-white text-sm leading-tight">
                  {type === 'motivation' ? `✨ ${title}` : title}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  {message}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

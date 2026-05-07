import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Clock, AlertTriangle, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface NotificationToastProps {
  show: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: 'upcoming' | 'late';
}

export default function NotificationToast({ show, onClose, title, message, type }: NotificationToastProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.9, transition: { duration: 0.2 } }}
          drag="y"
          dragConstraints={{ top: -100, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.y < -30) {
              onClose();
            }
          }}
          className="fixed top-6 left-5 right-5 z-[100] max-w-md mx-auto cursor-grab active:cursor-grabbing"
        >
          <div className={cn(
            "p-5 rounded-[2.5rem] border shadow-2xl backdrop-blur-xl flex flex-col items-center transition-colors relative overflow-hidden",
            type === 'upcoming' 
              ? "bg-white/95 dark:bg-zinc-900/95 border-indigo-500/20" 
              : "bg-rose-50/95 dark:bg-rose-900/40 border-rose-500/20"
          )}>
            {/* Drag Handle */}
            <div className="w-10 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full mb-4 opacity-50" />
            
            <div className="flex gap-4 w-full">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                type === 'upcoming' ? "bg-indigo-500 text-white" : "bg-rose-500 text-white"
              )}>
                {type === 'upcoming' ? <Clock size={20} /> : <AlertTriangle size={20} />}
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                    {type === 'upcoming' ? 'Upcoming Task' : 'Overdue Task'}
                  </h4>
                </div>
                <p className="font-bold text-indigo-600 dark:text-indigo-400 text-xs text-balance">
                  {title}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
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

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Trophy, Star, Plus, Check, Edit2, Trash2, X, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { audioService } from '../lib/audio';
import { hapticService } from '../lib/haptics';
import { doc, updateDoc, deleteDoc, setDoc, collection } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

interface Habit {
  id: string;
  title: string;
  time?: string;
  streak: number;
  history: string[]; // ISO string dates (YYYY-MM-DD)
  createdAt: string;
}

interface HabitProps {
  stats?: {
    xp: number;
    level: number;
    progress: number;
  };
  habits?: Habit[];
}

export default function Habits({ stats = { xp: 0, level: 1, progress: 0 }, habits = [] }: HabitProps) {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitTitle, setHabitTitle] = useState('');
  const [habitTime, setHabitTime] = useState('');

  const handleSaveHabit = async () => {
    if (!habitTitle.trim() || !auth.currentUser) return;
    try {
      if (editingHabit) {
        const habitRef = doc(db, 'habits', editingHabit.id);
        await updateDoc(habitRef, { 
          title: habitTitle,
          time: habitTime || null
        });
      } else {
        const habitRef = doc(collection(db, 'habits'));
        await setDoc(habitRef, {
          userId: auth.currentUser.uid,
          title: habitTitle,
          time: habitTime || null,
          streak: 0,
          history: [],
          createdAt: new Date().toISOString()
        });
      }
      resetForm();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteHabit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const habitRef = doc(db, 'habits', id);
      await deleteDoc(habitRef);
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleHabit = async (habit: Habit) => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    let newHistory = [...habit.history];
    
    if (newHistory.includes(today)) {
      newHistory = newHistory.filter(d => d !== today);
      audioService.playPop();
      hapticService.light();
    } else {
      newHistory.push(today);
      audioService.playSuccess();
      hapticService.success();
    }

    // Simple streak calculation
    const newStreak = newHistory.includes(today) ? habit.streak + 1 : Math.max(0, habit.streak - 1);

    try {
      const habitRef = doc(db, 'habits', habit.id);
      await updateDoc(habitRef, { history: newHistory, streak: newStreak });
    } catch (error) {
      console.error(error);
    }
  };

  const resetForm = () => {
    setHabitTitle('');
    setHabitTime('');
    setEditingHabit(null);
    setShowModal(false);
  };

  const openEdit = (habit: Habit, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingHabit(habit);
    setHabitTitle(habit.title);
    setHabitTime(habit.time || '');
    setShowModal(true);
  };

  const weekDays = useMemo(() => {
    const dates = [];
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, []);

  const daysLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="space-y-8 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">{t('nav_habits')}</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white active:scale-95 transition-transform border border-zinc-200 dark:border-white/5 shadow-xl"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Reward Progress Card */}
      <section className="relative overflow-hidden group rounded-[3rem] shadow-2xl shadow-indigo-500/20">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 transition-transform duration-700 group-hover:rotate-3 group-hover:scale-110 z-0" />
        <div className="absolute -right-8 -bottom-8 opacity-20 z-0">
          <Trophy size={180} className="text-white" />
        </div>
        
        <div className="relative z-10 p-8 flex items-center gap-6">
          <div className="w-20 h-20 rounded-[2.5rem] bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/30 shadow-2xl rotate-6 group-hover:rotate-0 transition-transform duration-500">
            <Star className="w-10 h-10 text-amber-300 fill-current" />
          </div>
          <div className="space-y-3">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight leading-none mb-1">Active Mastery</h2>
              <p className="text-[10px] text-white/60 font-black uppercase tracking-widest">Level {stats.level} Progress</p>
            </div>
            <div className="w-40 h-3 bg-black/20 rounded-full overflow-hidden p-0.5 shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${stats.progress}%` }}
                transition={{ duration: 1.5, ease: "circOut" }}
                className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.6)]" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Habit List */}
      <div className="space-y-8">
        {habits.map((habit) => {
          const now = new Date();
          const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          const isDoneToday = habit.history.includes(todayStr);
          
          const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          const isOverdue = !isDoneToday && habit.time && habit.time < currentTime;
          
          return (
            <div key={habit.id} className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 p-7 rounded-[3rem] space-y-7 shadow-sm dark:shadow-none hover:shadow-xl hover:border-indigo-500/30 transition-all duration-300">
              <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-black text-zinc-900 dark:text-white text-xl tracking-tight truncate">{habit.title}</h3>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          type="button"
                          onClick={(e) => openEdit(habit, e)} 
                          className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-300 dark:text-zinc-600 hover:text-indigo-500 transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          type="button"
                          onClick={(e) => handleDeleteHabit(habit.id, e)} 
                          className="p-1.5 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-lg text-zinc-300 dark:text-zinc-600 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    {isOverdue && (
                      <p className="text-[10px] text-rose-500 font-black mt-1 flex items-center gap-1 animate-pulse tracking-widest uppercase">
                        <AlertTriangle size={10} />
                        Habit Overdue
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full", 
                      isDoneToday ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-zinc-200 dark:bg-zinc-800"
                    )} />
                    <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">{habit.streak} DAY STREAK</span>
                    {habit.time && (
                      <span className={cn(
                        "text-[10px] font-black underline decoration-2 underline-offset-2 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors",
                        isOverdue
                          ? "text-rose-500 animate-pulse" 
                          : "text-zinc-400"
                      )}>
                        <Clock className="w-2.5 h-2.5" />
                        {habit.time}
                        {isOverdue && " • OVERDUE"}
                      </span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => handleToggleHabit(habit)}
                  className={cn(
                    "w-14 h-14 rounded-[1.5rem] flex items-center justify-center group active:scale-90 transition-all shadow-xl",
                    isDoneToday ? "bg-emerald-500 shadow-emerald-500/30" : "bg-indigo-500 shadow-indigo-500/30"
                  )}
                >
                  <Check className={cn("w-7 h-7 text-white transition-transform", isDoneToday && "scale-110 shadow-glow")} strokeWidth={4} />
                </button>
              </div>

              {/* Weekly Progress Dots */}
              <div className="flex justify-between items-center gap-2">
                {weekDays.map((date, idx) => {
                  const dateStr = date.toISOString().split('T')[0];
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isCompleted = habit.history.includes(dateStr);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-3">
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest",
                        isToday ? "text-indigo-500 font-black" : "text-zinc-300 dark:text-zinc-700"
                      )}>{daysLabels[idx]}</span>
                      <div className={cn(
                        "w-full aspect-square max-w-[40px] rounded-2xl flex items-center justify-center transition-all duration-500 border relative",
                        isCompleted 
                          ? "bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20" 
                          : "bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-white/5 text-transparent"
                      )}>
                        {isCompleted && <Check className="w-5 h-5 animate-in zoom-in duration-300" strokeWidth={4} />}
                        {isToday && !isCompleted && <div className="w-1.5 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-5">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetForm}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] p-8 space-y-8 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{editingHabit ? 'Edit Habit' : 'New Habit'}</h2>
                <button onClick={resetForm} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full text-zinc-400">
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Habit Name</label>
                  <input 
                    type="text" 
                    value={habitTitle}
                    onChange={(e) => setHabitTitle(e.target.value)}
                    placeholder="e.g. Read for 20 mins"
                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/5 rounded-3xl py-5 px-6 text-xl font-bold text-zinc-900 dark:text-white placeholder-zinc-300 dark:placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
                    autoFocus
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Reminder Time (Optional)</label>
                  <input 
                    type="time" 
                    value={habitTime}
                    onChange={(e) => setHabitTime(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/5 rounded-3xl py-5 px-6 text-xl font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
                  />
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={handleSaveHabit}
                    className="flex-1 py-5 bg-indigo-500 text-white font-bold rounded-3xl shadow-xl shadow-indigo-500/20 active:scale-95 transition-all text-lg"
                  >
                    {editingHabit ? 'Apply Changes' : 'Create Habit'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

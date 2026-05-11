import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Trophy, Star, Plus, Check, Edit2, Trash2, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { doc, updateDoc, deleteDoc, setDoc, collection } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

interface Habit {
  id: string;
  title: string;
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

  const handleSaveHabit = async () => {
    if (!habitTitle.trim() || !auth.currentUser) return;
    try {
      if (editingHabit) {
        const habitRef = doc(db, 'habits', editingHabit.id);
        await updateDoc(habitRef, { title: habitTitle });
      } else {
        const habitRef = doc(collection(db, 'habits'));
        await setDoc(habitRef, {
          userId: auth.currentUser.uid,
          title: habitTitle,
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
    const today = new Date().toISOString().split('T')[0];
    let newHistory = [...habit.history];
    
    if (newHistory.includes(today)) {
      newHistory = newHistory.filter(d => d !== today);
    } else {
      newHistory.push(today);
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
    setEditingHabit(null);
    setShowModal(false);
  };

  const openEdit = (habit: Habit, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingHabit(habit);
    setHabitTitle(habit.title);
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
      <section className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 rounded-[2.5rem] shadow-xl shadow-indigo-500/20 relative overflow-hidden">
        <div className="absolute -right-4 -bottom-4 opacity-10">
          <Trophy size={160} className="text-white" />
        </div>
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-20 h-20 rounded-[2rem] bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-2xl">
            <Star className="w-10 h-10 text-amber-300 fill-current" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Active Tracker</h2>
            <div className="w-48 h-2 bg-black/20 rounded-full overflow-hidden mb-3">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${stats.progress}%` }}
                className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
              />
            </div>
            <p className="text-[10px] text-zinc-100 font-bold uppercase tracking-[0.2em] opacity-80">Level {stats.level} • {stats.progress}% Progress</p>
          </div>
        </div>
      </section>

      {/* Habit List */}
      <div className="space-y-6">
        {habits.map((habit) => {
          const todayStr = new Date().toISOString().split('T')[0];
          const isDoneToday = habit.history.includes(todayStr);
          
          return (
            <div key={habit.id} className="group relative bg-white dark:bg-zinc-800/40 border border-zinc-200 dark:border-white/5 p-6 rounded-[2.5rem] space-y-6 shadow-xl dark:backdrop-blur-sm transition-all hover:shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-zinc-900 dark:text-white text-lg tracking-tight">{habit.title}</h3>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        type="button"
                        onClick={(e) => openEdit(habit, e)} 
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-400 dark:text-zinc-500 hover:text-indigo-500 transition-all active:scale-90"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => handleDeleteHabit(habit.id, e)} 
                        className="p-2 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-xl text-zinc-400 dark:text-zinc-500 hover:text-rose-500 transition-all active:scale-90"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={cn("w-2 h-2 rounded-full", isDoneToday ? "bg-orange-500 animate-pulse" : "bg-zinc-300 dark:bg-zinc-700")} />
                    <span className="text-xs text-orange-400 font-bold uppercase tracking-widest">{habit.streak} {t('streak')}</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleToggleHabit(habit)}
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center group active:scale-95 transition-all shadow-lg",
                    isDoneToday ? "bg-emerald-500 shadow-emerald-500/20" : "bg-indigo-500 shadow-indigo-500/20"
                  )}
                >
                  <Check className={cn("w-6 h-6 text-white transition-transform", isDoneToday && "scale-110 shadow-glow")} />
                </button>
              </div>

              {/* Weekly Progress Dots */}
              <div className="flex justify-between items-center px-1">
                {weekDays.map((date, idx) => {
                  const dateStr = date.toISOString().split('T')[0];
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isCompleted = habit.history.includes(dateStr);
                  return (
                    <div key={idx} className="flex flex-col items-center gap-3">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-[0.2em]",
                        isToday ? "text-indigo-500 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-600"
                      )}>{daysLabels[idx]}</span>
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 border shadow-sm dark:shadow-none",
                        isCompleted 
                          ? "bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                          : "bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-white/5 text-transparent"
                      )}>
                        {isCompleted && <Check className="w-5 h-5 animate-in zoom-in duration-300" />}
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

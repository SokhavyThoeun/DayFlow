import { motion, AnimatePresence } from 'motion/react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { audioService } from '../lib/audio';
import { hapticService } from '../lib/haptics';
import { Sparkles, TrendingUp, Zap, Target, BookOpen, ChevronRight, Sun, Frown, Meh, Smile, Heart, Clock, CheckCircle2, Circle, X, Edit2, Trash2, MapPin, AlignLeft, AlertTriangle, Droplets } from 'lucide-react';
import { formatDate, cn } from '../lib/utils';
import { HOLIDAYS, QUOTES } from '../constants/localizedData';
import { Task, TaskCategory, TaskPriority } from '../types';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

interface DashboardProps {
  onOpenFocus: () => void;
  onOpenSettings: () => void;
  onPlanMyDay?: () => void;
  userName?: string;
  userAvatar?: string;
  stats?: { streak: number; xp: number; level: number; progress: number; todaysProgress?: number };
  taskStats?: { study: number; work: number; health: number; life: number };
  tasks?: any[];
  habits?: any[];
  onMoodSelect?: (mood: string) => void;
  userMood?: string;
  waterIntake?: number;
  waterTarget?: number;
  onUpdateWater?: (count: number) => void;
}

export default function Dashboard({ 
  onOpenFocus, 
  onOpenSettings, 
  onPlanMyDay, 
  userName, 
  userAvatar,
  stats = { streak: 0, xp: 0, level: 1, progress: 0, todaysProgress: 0 },
  taskStats = { study: 0, work: 0, health: 0, life: 0 },
  tasks = [],
  habits = [],
  onMoodSelect,
  userMood,
  waterIntake = 0,
  waterTarget = 8,
  onUpdateWater
}: DashboardProps) {
  const { t, i18n } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTaskTime, setNewTaskTime] = useState('');
  const [newTaskLocation, setNewTaskLocation] = useState('');
  const [newTaskDetails, setNewTaskDetails] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>(TaskCategory.LIFE);
  const currentDate = new Date();

  const handleToggleTask = async (task: any) => {
    try {
      const taskRef = doc(db, 'tasks', task.id);
      await updateDoc(taskRef, { isCompleted: !task.isCompleted });
      audioService.playPop();
      hapticService.light();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const taskRef = doc(db, 'tasks', id);
      await deleteDoc(taskRef);
      audioService.playClick();
      hapticService.medium();
    } catch (error) {
      console.error(error);
    }
  };

  const openEditModal = (task: any) => {
    setEditingTask(task);
    setNewTaskTitle(task.title);
    setNewTaskDate(task.deadline ? task.deadline.split('T')[0] : new Date().toISOString().split('T')[0]);
    setNewTaskTime(task.deadline ? new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '');
    setNewTaskLocation(task.location || '');
    setNewTaskDetails(task.description || '');
    setNewTaskCategory(task.category || TaskCategory.LIFE);
  };

  const closeEditModal = () => {
    setEditingTask(null);
    setNewTaskTitle('');
    setNewTaskDate(new Date().toISOString().split('T')[0]);
    setNewTaskTime('');
    setNewTaskLocation('');
    setNewTaskDetails('');
  };

  const handleSaveTask = async () => {
    if (!newTaskTitle.trim() || !editingTask || !auth.currentUser) return;
    
    const taskData = { 
      title: newTaskTitle, 
      location: newTaskLocation,
      description: newTaskDetails,
      category: newTaskCategory,
      deadline: newTaskTime ? new Date(`${newTaskDate}T${newTaskTime}`).toISOString() : new Date(newTaskDate).toISOString()
    };

    try {
      const taskRef = doc(db, 'tasks', editingTask.id);
      await updateDoc(taskRef, taskData);
      closeEditModal();
      audioService.playSuccess();
      hapticService.heavy();
    } catch (error) {
      console.error(error);
    }
  };

  const dashboardStats = [
    { id: 'streak', label: t('streak'), value: stats.streak.toString(), icon: Zap, color: 'text-orange-400', bg: 'bg-orange-400/10' },
    { id: 'xp', label: t('xp'), value: stats.xp.toString(), icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { id: 'level', label: t('level'), value: stats.level.toString(), icon: Target, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  ];

  const [activeDate, setActiveDate] = useState(new Date());

  const activeStats = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const hasActivity = habits.some(h => (h.history || []).includes(dateStr));
      
      days.push({
        date: dateStr,
        label: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()],
        active: hasActivity
      });
    }
    return days;
  }, [habits]);

  const moodIcons = [
    { id: 'sad', icon: Frown, color: 'text-blue-400' },
    { id: 'neutral', icon: Meh, color: 'text-zinc-500' },
    { id: 'happy', icon: Smile, color: 'text-emerald-400' },
    { id: 'loving', icon: Heart, color: 'text-rose-400' },
    { id: 'energetic', icon: Zap, color: 'text-amber-400' },
  ];

  const tasksForSelectedDate = useMemo(() => {
    const dateStr = activeDate.toISOString().split('T')[0];
    return tasks.filter(t => t.deadline?.startsWith(dateStr));
  }, [tasks, activeDate]);

  const taskStatsForSelectedDate = useMemo(() => {
    return {
      study: tasksForSelectedDate.filter(t => t.category === TaskCategory.STUDY).length,
      work: tasksForSelectedDate.filter(t => t.category === TaskCategory.WORK).length,
      health: tasksForSelectedDate.filter(t => t.category === TaskCategory.HEALTH).length,
      life: tasksForSelectedDate.filter(t => t.category === TaskCategory.LIFE).length,
    };
  }, [tasksForSelectedDate]);

  const filteredTasks = useMemo(() => {
    if (!selectedCategory) return [];
    return tasksForSelectedDate.filter(t => t.category === selectedCategory);
  }, [tasksForSelectedDate, selectedCategory]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <section className="flex items-end justify-between">
        <div>
          <p className="text-zinc-500 font-bold text-[10px] mb-2 uppercase tracking-[0.2em]">
            {formatDate(currentDate, i18n.language)}
          </p>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
            {i18n.language === 'kh' ? 'សួស្ដី' : (i18n.language === 'zh' ? '你好' : 'Hello')}, {userName?.split(' ')[0] || 'User'} 
            <Sun className="w-6 h-6 text-amber-400 animate-pulse" />
          </h1>
        </div>
        <button 
          onClick={onOpenSettings}
          className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 flex items-center justify-center overflow-hidden active:scale-90 transition-transform shadow-xl"
        >
          <img 
            referrerPolicy="no-referrer"
            src={userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName || 'User'}`} 
            alt="User" 
            className="w-full h-full object-cover"
          />
        </button>
      </section>

      {/* Stats Grid */}
      <section className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {dashboardStats.map((stat) => (
            <div key={stat.id} className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 p-4 rounded-3xl flex flex-col items-center shadow-sm dark:shadow-none hover:border-accent/30 hover:shadow-lg transition-all duration-300">
              <div className={`p-2.5 rounded-2xl ${stat.bg} mb-3 group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <span className="text-2xl font-black text-zinc-900 dark:text-white leading-none tracking-tight">{stat.value}</span>
              <span className="text-[10px] text-zinc-500 font-black uppercase mt-1.5 tracking-widest">{stat.label}</span>
            </div>
          ))}
        </div>
        
        {/* Level Progress Bar on Dashboard */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 p-4 py-5 rounded-[2.5rem] shadow-sm">
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Level {stats.level} Progress</span>
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{stats.xp % 500} / 500 XP</span>
          </div>
          <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${stats.progress}%` }}
              transition={{ duration: 1.2, ease: "circOut" }}
              className="h-full bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.4)]" 
            />
          </div>
        </div>
      </section>

      {/* Hero Coach Card */}
      <section className="relative overflow-hidden group rounded-[2.5rem] shadow-2xl shadow-indigo-500/20">
        <div className="absolute inset-0 bg-indigo-500 transition-transform duration-700 group-hover:scale-110 z-0" />
        <div className="relative z-10 bg-white/5 dark:bg-zinc-900/40 backdrop-blur-xl border border-white/20 p-8 rounded-[2.5rem] space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-xl rotate-3 group-hover:rotate-0 transition-transform">
              <Sparkles className="w-7 h-7 text-indigo-500" />
            </div>
            <div>
              <h2 className="font-black text-xl text-white tracking-tight">{t('nav_assistant')}</h2>
              <p className="text-[10px] text-white/60 uppercase font-black tracking-widest">AI FlowCoach</p>
            </div>
          </div>
          <p className="text-white text-base leading-relaxed font-bold tracking-tight">
             {t('assistant_motivation_default') || "Ready to achieve your flow state? Let me help you plan a productive, balanced day."}
          </p>
          <button 
            onClick={onPlanMyDay}
            className="w-full py-4 px-4 bg-white text-indigo-500 font-black uppercase tracking-widest rounded-2xl text-xs transition-all active:translate-y-1 active:shadow-none hover:shadow-xl shadow-lg"
          >
            {t('plan_my_day')}
          </button>
        </div>
      </section>

      {/* Task Categories Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex flex-col">
            <h3 className="font-black text-lg tracking-tight">{t('tasks')}</h3>
            <div className="flex items-center gap-2 mt-1">
              <button 
                onClick={() => {
                  const d = new Date(activeDate);
                  d.setDate(d.getDate() - 1);
                  setActiveDate(d);
                }}
                className="p-1 text-zinc-400 hover:text-indigo-500 transition-colors"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest min-w-[80px] text-center">
                {activeDate.toDateString() === new Date().toDateString() ? t('today') : formatDate(activeDate, i18n.language)}
              </span>
              <button 
                onClick={() => {
                  const d = new Date(activeDate);
                  d.setDate(d.getDate() + 1);
                  setActiveDate(d);
                }}
                className="p-1 text-zinc-400 hover:text-indigo-500 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          {!selectedCategory ? (
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Select Category</span>
          ) : (
            <button 
              onClick={() => setSelectedCategory(null)}
              className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1 hover:opacity-70 transition-opacity"
            >
              <ChevronRight className="w-3 h-3 rotate-180" />
              {t('back')}
            </button>
          )}
        </div>

        <AnimatePresence>
          {!selectedCategory ? (
            <motion.div 
              key="categories-grid"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid grid-cols-2 gap-5"
            >
              {[
                { id: TaskCategory.STUDY, label: t('cat_study'), icon: BookOpen, count: taskStatsForSelectedDate.study, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
                { id: TaskCategory.WORK, label: t('cat_work'), icon: Zap, count: taskStatsForSelectedDate.work, color: 'text-amber-400', bg: 'bg-amber-400/10' },
                { id: TaskCategory.HEALTH, label: t('cat_health'), icon: Heart, count: taskStatsForSelectedDate.health, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                { id: TaskCategory.LIFE, label: t('cat_life'), icon: Target, count: taskStatsForSelectedDate.life, color: 'text-rose-400', bg: 'bg-rose-400/10' },
              ].map((cat) => (
                <motion.div 
                  key={cat.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    audioService.playClick();
                    hapticService.light();
                    setSelectedCategory(cat.id);
                  }}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 p-6 rounded-[2.5rem] flex flex-col gap-4 group transition-all duration-300 cursor-pointer shadow-sm hover:border-indigo-500/40"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center border border-current transition-opacity",
                    "opacity-70 group-hover:opacity-100",
                    cat.bg
                  )}>
                    <cat.icon className={`w-6 h-6 ${cat.color}`} />
                  </div>
                  <div>
                    <p className="font-black text-zinc-900 dark:text-zinc-100 text-lg tracking-tight">{cat.label}</p>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{cat.count} tasks today</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="category-overlay"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 bg-zinc-50 dark:bg-zinc-950 p-6 flex flex-col pt-12 overflow-y-auto"
            >
              <div className="max-w-md mx-auto w-full flex flex-col min-h-full">
                <div className="flex items-center justify-between mb-8">
                  <button 
                    onClick={() => setSelectedCategory(null)}
                    className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 flex items-center justify-center text-zinc-600 dark:text-zinc-400 active:scale-90 transition-all shadow-sm"
                  >
                    <ChevronRight className="w-6 h-6 rotate-180" />
                  </button>
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center border border-current mb-2",
                      selectedCategory === TaskCategory.STUDY ? "bg-indigo-400/10 text-indigo-400" :
                      selectedCategory === TaskCategory.WORK ? "bg-amber-400/10 text-amber-400" :
                      selectedCategory === TaskCategory.HEALTH ? "bg-emerald-400/10 text-emerald-400" :
                      "bg-rose-400/10 text-rose-400"
                    )}>
                      {(() => {
                        const cat = [
                          { id: TaskCategory.STUDY, icon: BookOpen },
                          { id: TaskCategory.WORK, icon: Zap },
                          { id: TaskCategory.HEALTH, icon: Heart },
                          { id: TaskCategory.LIFE, icon: Target },
                        ].find(c => c.id === selectedCategory);
                        const Icon = cat?.icon || Target;
                        return <Icon className="w-6 h-6" />;
                      })()}
                    </div>
                    <h2 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white">
                      {t(`cat_${selectedCategory.toLowerCase()}`)}
                    </h2>
                  </div>
                  <div className="w-12" />
                </div>

                <div className="flex-1 space-y-4 pb-12">
                   {filteredTasks.map((task: any) => (
                    <div key={task.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 p-5 rounded-3xl flex items-center gap-4 shadow-sm group">
                       <motion.button 
                         whileTap={{ scale: 0.8 }}
                         onClick={() => handleToggleTask(task)}
                       >
                          {task.isCompleted ? <CheckCircle2 className="w-6 h-6 text-indigo-500" /> : <Circle className="w-6 h-6 text-zinc-300 dark:text-zinc-600" />}
                       </motion.button>
                       <div className="flex-1 min-w-0">
                          <p className={cn("font-bold text-[15px] truncate", task.isCompleted ? "text-zinc-400 line-through" : "text-zinc-900 dark:text-white")}>{task.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                             {task.deadline && <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                             {task.location && <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-auto flex items-center gap-1"><MapPin size={10} />{task.location}</span>}
                          </div>
                       </div>
                       <button onClick={() => openEditModal(task)} className="p-2 text-zinc-400 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all"><Edit2 size={14} /></button>
                    </div>
                   ))}
                </div>

                <button
                  onClick={() => setSelectedCategory(null)}
                  className="w-full py-5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-black uppercase tracking-widest rounded-3xl shadow-xl shadow-zinc-900/20 dark:shadow-white/10 mb-8"
                >
                  {t('back')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Edit Modal Overlay */}
      <AnimatePresence>
        {editingTask && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={closeEditModal} className="p-2 -ml-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full text-zinc-400 group transition-colors">
                    <ChevronRight size={24} className="group-active:scale-90 transition-transform rotate-180" />
                  </button>
                  <h2 className="text-xl font-black text-zinc-900 dark:text-white">
                    {t('edit_task')}
                  </h2>
                </div>
                <button onClick={closeEditModal} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full text-zinc-400">
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">{t('title')}</label>
                  <input 
                    type="text" 
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder={t('placeholder_task')}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 rounded-2xl py-4 px-5 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">{t('date')}</label>
                    <input 
                      type="date" 
                      value={newTaskDate}
                      onChange={(e) => setNewTaskDate(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 rounded-2xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">{t('time')}</label>
                    <input 
                      type="time" 
                      value={newTaskTime}
                      onChange={(e) => setNewTaskTime(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 rounded-2xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">{t('location')}</label>
                  <input 
                    type="text" 
                    value={newTaskLocation}
                    onChange={(e) => setNewTaskLocation(e.target.value)}
                    placeholder="Location name..."
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 rounded-2xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">{t('description')}</label>
                   <textarea 
                    value={newTaskDetails}
                    onChange={(e) => setNewTaskDetails(e.target.value)}
                    placeholder="More info..."
                    rows={2}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 rounded-2xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  ></textarea>
                </div>

                 <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">{t('category')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: TaskCategory.LIFE, icon: Target, label: t('cat_life'), color: 'indigo' },
                      { id: TaskCategory.WORK, icon: Zap, label: t('cat_work'), color: 'amber' },
                      { id: TaskCategory.HEALTH, icon: Heart, label: t('cat_health'), color: 'rose' },
                      { id: TaskCategory.STUDY, icon: BookOpen, label: t('cat_study'), color: 'emerald' },
                    ].map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setNewTaskCategory(cat.id)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-2xl border transition-all text-[11px] font-black uppercase tracking-wider",
                          newTaskCategory === cat.id 
                            ? "bg-indigo-500 border-indigo-500 text-white" 
                            : "bg-white dark:bg-zinc-800 border-zinc-100 dark:border-white/5 text-zinc-400 hover:border-indigo-500/30"
                        )}
                      >
                        <cat.icon size={14} />
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSaveTask}
                className="w-full py-4 bg-indigo-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all text-sm mt-4"
              >
                {t('save')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mood Quick Access */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 p-8 rounded-[3rem] space-y-6 shadow-sm">
        <h3 className="font-black text-[10px] text-zinc-400 uppercase tracking-[0.25em] text-center">{t('mood_question')}</h3>
        <div className="flex justify-between items-center gap-2">
          {moodIcons.map((m, idx) => (
            <button 
              key={idx} 
              onClick={() => {
                audioService.playClick();
                hapticService.light();
                onMoodSelect?.(m.id);
              }}
              className={cn(
                "w-12 h-12 rounded-[1.25rem] flex items-center justify-center transition-all active:scale-90 hover:scale-110",
                userMood === m.id 
                  ? "bg-indigo-500 text-white shadow-xl shadow-indigo-500/30 border-b-4 border-indigo-500/70 -translate-y-1" 
                  : "bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5"
              )}
            >
              <m.icon className={cn("w-6 h-6 transition-colors", userMood === m.id ? "text-white" : m.color)} />
            </button>
          ))}
        </div>
      </section>

      {/* Focus Mode Quick Link */}
      <section 
        onClick={() => {
          audioService.playPop();
          hapticService.medium();
          onOpenFocus();
        }}
        className="relative overflow-hidden bg-zinc-900 dark:bg-indigo-500 border-b-8 border-black/20 p-8 rounded-[3rem] flex items-center justify-between group active:translate-y-1 active:border-b-0 transition-all cursor-pointer shadow-2xl shadow-zinc-900/20"
      >
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-white/20 flex items-center justify-center text-zinc-900 dark:text-white shadow-xl">
            <Zap className="w-8 h-8 fill-current" />
          </div>
          <div>
            <h3 className="font-black text-white text-xl tracking-tight leading-none mb-2">{t('focus')}</h3>
            <p className="text-[10px] text-white/50 font-black uppercase tracking-widest">Enter deep work mode</p>
          </div>
        </div>
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:translate-x-2 transition-transform relative z-10">
          <ChevronRight size={28} strokeWidth={3} />
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
      </section>

      {/* Water Tracker */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 p-8 rounded-[3rem] space-y-6 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10 -rotate-12">
          <Droplets size={120} className="text-blue-500" />
        </div>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h3 className="font-black text-xl tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
              <Droplets className="text-blue-500" size={20} />
              Hydration
            </h3>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">Daily Water Tracker</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-blue-500 leading-none">{waterIntake || 0}</span>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">/ {waterTarget || 8} glasses</span>
          </div>
        </div>

        <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5 relative z-10">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, ((waterIntake || 0) / (waterTarget || 8)) * 100)}%` }}
            className="h-full bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.4)] transition-all"
          />
        </div>

        <div className="flex gap-4 relative z-10">
          <button 
            onClick={() => onUpdateWater?.(Math.max(0, (waterIntake || 0) - 1))}
            className="flex-1 py-3 bg-zinc-50 dark:bg-zinc-800 border-b-4 border-zinc-200 dark:border-zinc-950 rounded-2xl font-black text-zinc-400 active:translate-y-1 active:border-b-0 transition-all text-xs uppercase tracking-widest"
          >
            - Remove
          </button>
          <button 
            onClick={() => onUpdateWater?.((waterIntake || 0) + 1)}
            className="flex-[2] py-3 bg-blue-500 text-white border-b-4 border-blue-700 rounded-2xl font-black active:translate-y-1 active:border-b-0 transition-all text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20"
          >
            + Add Glass
          </button>
        </div>
      </section>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Plus, CheckCircle2, Circle, Clock, Tag, ChevronRight, Edit2, Trash2, MapPin, AlignLeft, AlertTriangle, BookOpen, Zap, Heart, Target, X, ChevronLeft, Sparkles, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { Task, TaskCategory, TaskPriority } from '../types';
import { audioService } from '../lib/audio';
import { hapticService } from '../lib/haptics';
import { doc, updateDoc, deleteDoc, setDoc, collection, writeBatch } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

interface PlannerProps {
  initialTasks?: Task[];
  onBack?: () => void;
  settings?: any;
}

export default function Planner({ initialTasks = [], onBack, settings }: PlannerProps) {
  const { t, i18n } = useTranslation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTaskTime, setNewTaskTime] = useState('');
  const [newTaskLocation, setNewTaskLocation] = useState('');
  const [newTaskDetails, setNewTaskDetails] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>(TaskCategory.LIFE);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAutoScheduling, setIsAutoScheduling] = useState(false);

  const handleAutoSchedule = async () => {
    if (!auth.currentUser) return;
    setIsAutoScheduling(true);
    hapticService.medium();
    
    try {
      const isToday = selectedDate.toDateString() === new Date().toDateString();
      let nextTime = new Date(selectedDate);
      
      if (isToday) {
        const now = new Date();
        // Start 30 mins from now at the next 15-min interval
        nextTime.setHours(now.getHours());
        nextTime.setMinutes(Math.ceil((now.getMinutes() + 30) / 15) * 15);
      } else {
        nextTime.setHours(8, 0, 0, 0);
      }

      const batch = writeBatch(db);
      const tasksToSchedule = filteredTasks.filter(t => !t.deadline?.includes('T') || t.deadline.endsWith('T00:00:00.000Z'));
      
      tasksToSchedule.forEach((task) => {
        const duration = (task.category === TaskCategory.STUDY || task.category === TaskCategory.WORK) ? 90 : 45;
        const scheduledDeadline = new Date(nextTime);
        const taskRef = doc(db, 'tasks', task.id);
        
        batch.update(taskRef, { 
          deadline: scheduledDeadline.toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        // Add duration + 15 min buffer
        nextTime.setMinutes(nextTime.getMinutes() + duration + 15);
      });

      await batch.commit();
      audioService.playSuccess();
      hapticService.heavy();
    } catch (error) {
      console.error("Auto-scheduling error:", error);
    } finally {
      setIsAutoScheduling(false);
    }
  };

  const handleToggleTask = async (task: Task) => {
    try {
      const taskRef = doc(db, 'tasks', task.id);
      await updateDoc(taskRef, { isCompleted: !task.isCompleted });
      audioService.playSuccess();
      hapticService.light();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const taskRef = doc(db, 'tasks', id);
      await deleteDoc(taskRef);
      audioService.playError();
      hapticService.medium();
    } catch (error) {
      console.error(error);
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setNewTaskTitle(task.title);
    setNewTaskDate(task.deadline ? task.deadline.split('T')[0] : new Date().toISOString().split('T')[0]);
    setNewTaskTime(task.deadline ? new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '');
    setNewTaskLocation(task.location || '');
    setNewTaskDetails(task.description || '');
    setNewTaskCategory(task.category || TaskCategory.LIFE);
    setShowAddModal(true);
  };

  const resetForm = () => {
    setNewTaskTitle('');
    setNewTaskDate(new Date().toISOString().split('T')[0]);
    setNewTaskTime('');
    setNewTaskLocation('');
    setNewTaskDetails('');
    setNewTaskCategory(TaskCategory.LIFE);
    setEditingTask(null);
    setShowAddModal(false);
  };

  const handleSaveTask = async () => {
    if (!newTaskTitle.trim() || !auth.currentUser) return;
    
    // Construct the deadline correctly using the newTaskDate and newTaskTime
    let deadline = new Date(newTaskDate).toISOString();
    if (newTaskTime) {
      deadline = new Date(`${newTaskDate}T${newTaskTime}`).toISOString();
    }
    
    const taskData = { 
      title: newTaskTitle, 
      location: newTaskLocation,
      description: newTaskDetails,
      category: newTaskCategory,
      deadline
    };

    try {
      if (editingTask) {
        const taskRef = doc(db, 'tasks', editingTask.id);
        await updateDoc(taskRef, taskData);
      } else {
        const newTaskRef = doc(collection(db, 'tasks'));
        await setDoc(newTaskRef, {
          ...taskData,
          userId: auth.currentUser.uid,
          priority: TaskPriority.MEDIUM,
          isCompleted: false,
          createdAt: new Date().toISOString()
        });
      }
      audioService.playPop();
      hapticService.medium();
      resetForm();
    } catch (error) {
      console.error(error);
    }
  };

  // Generate all dates for the current month view (including buffer days to fill the grid)
  const calendarDates = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDay = firstDayOfMonth.getDay();
    
    const dates = [];
    // Buffer days from previous month
    for (let i = startDay - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      dates.push(d);
    }
    // Days of current month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const d = new Date(year, month, i);
      dates.push(d);
    }
    // Buffer days from next month to complete the grid (up to 42 days for 6 rows)
    const remainingDays = 42 - dates.length;
    for (let i = 1; i <= remainingDays; i++) {
      const d = new Date(year, month + 1, i);
      dates.push(d);
    }
    return dates;
  }, [selectedDate]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + offset, 1);
    setSelectedDate(newDate);
    audioService.playClick();
    hapticService.light();
  };

  // Filter tasks for selected date
  const filteredTasks = useMemo(() => {
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    const filtered = initialTasks.filter(t => t.deadline?.startsWith(selectedDateStr));

    // AI Smart Sorting
    if (settings?.notifications?.aiAssistant) {
      filtered.sort((a, b) => {
        // First by completion status
        if (a.isCompleted !== b.isCompleted) {
          return a.isCompleted ? 1 : -1;
        }
        
        // Then by priority
        const priorityScore = { [TaskPriority.HIGH]: 3, [TaskPriority.MEDIUM]: 2, [TaskPriority.LOW]: 1 };
        const scoreA = priorityScore[a.priority] || 0;
        const scoreB = priorityScore[b.priority] || 0;
        if (scoreA !== scoreB) return scoreB - scoreA;
        
        // Then by time (only if time is specified)
        const hasTimeA = a.deadline?.includes('T') && !a.deadline.endsWith('T00:00:00.000Z');
        const hasTimeB = b.deadline?.includes('T') && !b.deadline.endsWith('T00:00:00.000Z');
        
        if (hasTimeA && hasTimeB) {
          return a.deadline!.localeCompare(b.deadline!);
        } else if (hasTimeA) {
          return -1;
        } else if (hasTimeB) {
          return 1;
        }
        
        return 0;
      });
    }

    return filtered;
  }, [initialTasks, selectedDate, settings?.notifications?.aiAssistant]);

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH: return 'text-rose-400 bg-rose-400/10';
      case TaskPriority.MEDIUM: return 'text-amber-400 bg-amber-400/10';
      case TaskPriority.LOW: return 'text-blue-400 bg-blue-400/10';
    }
  };

  const getCategoryIcon = (category: TaskCategory) => {
    switch (category) {
      case TaskCategory.STUDY: return BookOpen;
      case TaskCategory.WORK: return Zap;
      case TaskCategory.HEALTH: return Heart;
      case TaskCategory.LIFE: return Target;
      default: return Tag;
    }
  };

  return (
    <div className="space-y-6 pb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-400 active:scale-90 transition-all"
            >
              <ChevronLeft className="w-6 h-6 rotate-180" />
            </button>
          )}
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{t('nav_planner')}</h1>
        </div>
        <button 
          onClick={() => {
            setNewTaskDate(selectedDate.toISOString().split('T')[0]);
            setShowAddModal(true);
          }}
          className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 active:scale-90 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 p-6 rounded-[2.5rem] shadow-sm space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white">
            {selectedDate.toLocaleDateString(i18n.language === 'kh' ? 'km-KH' : 'en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => changeMonth(-1)}
              className="w-10 h-10 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-indigo-500 transition-colors"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <button 
              onClick={() => setSelectedDate(new Date())}
              className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-indigo-500 transition-colors"
            >
              {t('today')}
            </button>
            <button 
              onClick={() => changeMonth(1)}
              className="w-10 h-10 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-indigo-500 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
            <div key={`${day}-${idx}`} className="text-center text-[10px] font-black text-zinc-300 uppercase tracking-widest py-2">
              {day}
            </div>
          ))}
          {calendarDates.map((date, idx) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();
            const isCurrentMonth = date.getMonth() === selectedDate.getMonth();
            const hasTasks = initialTasks.find(t => t.deadline?.startsWith(date.toISOString().split('T')[0]));

            return (
              <button 
                key={idx}
                onClick={() => {
                  setSelectedDate(date);
                  audioService.playClick();
                  hapticService.light();
                }}
                className={cn(
                  "relative aspect-square flex flex-col items-center justify-center rounded-2xl text-sm font-bold transition-all",
                  isSelected 
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 scale-105 z-10" 
                    : isCurrentMonth 
                      ? "bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 text-zinc-900 dark:text-white hover:border-indigo-500/30"
                      : "text-zinc-300 dark:text-zinc-600 opacity-40",
                  isToday && !isSelected && "border-2 border-indigo-500/30"
                )}
              >
                {date.getDate()}
                {hasTasks && !isSelected && (
                  <div className={cn(
                    "absolute bottom-2 w-1 h-1 rounded-full",
                    isCurrentMonth ? "bg-indigo-500" : "bg-zinc-300"
                  )} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day View */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex flex-col">
            <h2 className="text-sm font-black text-zinc-400 uppercase tracking-widest">
              {selectedDate.toDateString() === new Date().toDateString() ? t('today') : selectedDate.toLocaleDateString(i18n.language === 'kh' ? 'km-KH' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </h2>
            <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">{filteredTasks.length} {t('tasks')}</span>
          </div>

          {settings?.notifications?.aiAutoSchedules && filteredTasks.length > 0 && filteredTasks.some(t => !t.deadline?.includes('T')) && (
            <button 
              onClick={handleAutoSchedule}
              disabled={isAutoScheduling}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-500 rounded-2xl border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all active:scale-95 disabled:opacity-50"
            >
              {isAutoScheduling ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <Sparkles size={12} />
              )}
              {isAutoScheduling ? 'Scheduling...' : 'Smart Schedule'}
            </button>
          )}
        </div>

        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <motion.div 
              key={task.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 p-4 rounded-3xl flex items-start gap-4 transition-all shadow-sm"
            >
              <motion.button 
                whileTap={{ scale: 0.8 }}
                onClick={() => handleToggleTask(task)} 
                className="mt-0.5"
              >
                {task.isCompleted ? (
                  <CheckCircle2 className="w-6 h-6 text-indigo-500" />
                ) : (
                  <Circle className="w-6 h-6 text-zinc-300 dark:text-zinc-600" />
                )}
              </motion.button>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      "font-bold text-[15px] truncate",
                      task.isCompleted ? "text-zinc-400 line-through" : "text-zinc-900 dark:text-white"
                    )}>
                      {task.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                       {task.location && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                             <MapPin size={10} />
                             {task.location}
                          </div>
                       )}
                       {task.deadline && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                             <Clock size={10} />
                             {new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                       )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditModal(task)} className="p-2 text-zinc-400 hover:text-indigo-500 transition-colors"><Edit2 size={14} /></button>
                    <button onClick={() => handleDeleteTask(task.id)} className="p-2 text-zinc-400 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-20 text-center space-y-4">
             <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-3xl flex items-center justify-center mx-auto text-zinc-300 dark:text-zinc-600">
                <Plus className="w-8 h-8" />
             </div>
             <p className="text-zinc-400 dark:text-zinc-500 font-medium italic">No tasks planned for this day.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={resetForm} className="p-2 -ml-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full text-zinc-400 group transition-colors">
                    <ChevronLeft size={24} className="group-active:scale-90 transition-transform rotate-180" />
                  </button>
                  <h2 className="text-xl font-black text-zinc-900 dark:text-white">
                    {editingTask ? t('edit_task') : t('add_task')}
                  </h2>
                </div>
                <button onClick={resetForm} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full text-zinc-400">
                  <X className="w-6 h-6" />
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
                    placeholder="Extra notes or details..."
                    rows={2}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 rounded-2xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  />
                </div>

                <div className="space-y-2">
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
                className="w-full py-4 bg-indigo-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all text-sm"
              >
                {t('save')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

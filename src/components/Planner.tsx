import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Plus, CheckCircle2, Circle, Clock, Tag, ChevronRight, Edit2, Trash2, MapPin, AlignLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { Task, TaskCategory, TaskPriority } from '../types';
import { doc, updateDoc, deleteDoc, setDoc, collection } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

interface PlannerProps {
  initialTasks?: Task[];
}

export default function Planner({ initialTasks = [] }: PlannerProps) {
  const { t, i18n } = useTranslation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [newTaskLocation, setNewTaskLocation] = useState('');
  const [newTaskDetails, setNewTaskDetails] = useState('');
  const selectedDate = new Date();

  const handleToggleTask = async (task: Task) => {
    try {
      const taskRef = doc(db, 'tasks', task.id);
      await updateDoc(taskRef, { isCompleted: !task.isCompleted });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const taskRef = doc(db, 'tasks', id);
      await deleteDoc(taskRef);
    } catch (error) {
      console.error(error);
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setNewTaskTitle(task.title);
    setNewTaskTime(task.deadline ? new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '');
    setNewTaskLocation(task.location || '');
    setNewTaskDetails(task.description || '');
    setShowAddModal(true);
  };

  const resetForm = () => {
    setNewTaskTitle('');
    setNewTaskTime('');
    setNewTaskLocation('');
    setNewTaskDetails('');
    setEditingTask(null);
    setShowAddModal(false);
  };

  const handleSaveTask = async () => {
    if (!newTaskTitle.trim() || !auth.currentUser) return;
    
    const taskData = { 
      title: newTaskTitle, 
      location: newTaskLocation,
      description: newTaskDetails,
      deadline: newTaskTime ? new Date(`${new Date().toDateString()} ${newTaskTime}`).toISOString() : new Date().toISOString()
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
          category: TaskCategory.PERSONAL, 
          priority: TaskPriority.MEDIUM,
          isCompleted: false,
          createdAt: new Date().toISOString()
        });
      }
      resetForm();
    } catch (error) {
      console.error(error);
    }
  };

  // Generate current week dates
  const weekDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = -2; i <= 4; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, []);

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH: return 'text-rose-400 bg-rose-400/10';
      case TaskPriority.MEDIUM: return 'text-amber-400 bg-amber-400/10';
      case TaskPriority.LOW: return 'text-blue-400 bg-blue-400/10';
    }
  };

  return (
    <div className="space-y-6 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">{t('nav_planner')}</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 active:scale-90 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Date Selector (Dynamic Week) */}
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
        {weekDates.map((date, idx) => {
          const isToday = date.toDateString() === new Date().toDateString();
          return (
            <button 
              key={idx}
              className={cn(
                "flex flex-col items-center min-w-[56px] py-3 rounded-2xl border transition-all duration-300",
                isToday 
                  ? "bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                  : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-white/5 text-zinc-400 dark:text-zinc-500"
              )}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest mb-1">
                {date.toLocaleDateString(i18n.language === 'kh' ? 'km-KH' : 'en-US', { month: 'short' })}
              </span>
              <span className="text-lg font-bold">{date.getDate()}</span>
            </button>
          );
        })}
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {initialTasks.length > 0 ? (
          initialTasks.map((task) => (
            <motion.div 
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 p-4 rounded-3xl flex items-start gap-4 hover:border-indigo-500/50 dark:hover:border-zinc-700 transition-colors shadow-sm dark:shadow-none"
            >
              <button onClick={() => handleToggleTask(task)} className="mt-0.5">
                {task.isCompleted ? (
                  <CheckCircle2 className="w-6 h-6 text-indigo-500" />
                ) : (
                  <Circle className="w-6 h-6 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-400" />
                )}
              </button>

              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className={cn(
                    "font-bold text-[15px] transition-all flex-1",
                    task.isCompleted ? "text-zinc-400 dark:text-zinc-500 line-through" : "text-zinc-900 dark:text-white"
                  )}>
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEditModal(task)}
                      className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-indigo-500 transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleDeleteTask(task.id); 
                      }}
                      className="p-2 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-xl text-zinc-400 dark:text-zinc-500 hover:text-rose-500 transition-all active:scale-90"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <span className={cn("text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1", getPriorityColor(task.priority))}>
                    {task.priority}
                  </span>
                  {task.location && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider bg-zinc-50 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {task.location}
                    </span>
                  )}
                  {task.description && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider bg-zinc-50 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                      <AlignLeft className="w-3 h-3" />
                    </span>
                  )}
                  {task.deadline && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider bg-zinc-50 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 flex items-center gap-1 ml-auto">
                      <Clock className="w-3 h-3" />
                      {new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                  )}
                </div>
              </div>
              
              <ChevronRight className="w-5 h-5 text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-500 self-center" />
            </motion.div>
          ))
        ) : (
          <div className="py-20 text-center space-y-4">
             <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-3xl flex items-center justify-center mx-auto text-zinc-300 dark:text-zinc-600">
                <Plus className="w-8 h-8" />
             </div>
             <p className="text-zinc-400 dark:text-zinc-500 font-medium italic">No tasks planned for today. Ask FlowCoach AI to help!</p>
          </div>
        )}
      </div>

      {/* Add Modal Placeholder */}
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
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                  {editingTask ? t('edit_task') : t('add_task')}
                </h2>
                <button onClick={resetForm} className="text-zinc-400 dark:text-zinc-500 font-bold">{t('cancel')}</button>
              </div>
              <input 
                type="text" 
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTask()}
                placeholder={t('placeholder_task')}
                autoFocus
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 rounded-2xl py-4 px-5 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">{t('time')}</label>
                   <input 
                    type="time" 
                    value={newTaskTime}
                    onChange={(e) => setNewTaskTime(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 rounded-2xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">{t('location')}</label>
                   <input 
                    type="text" 
                    value={newTaskLocation}
                    onChange={(e) => setNewTaskLocation(e.target.value)}
                    placeholder="Home, Office..."
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 rounded-2xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">{t('details')}</label>
                 <textarea 
                  value={newTaskDetails}
                  onChange={(e) => setNewTaskDetails(e.target.value)}
                  placeholder="More info..."
                  rows={2}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 rounded-2xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                ></textarea>
              </div>
              <button 
                onClick={handleSaveTask}
                className="w-full py-4 bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
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

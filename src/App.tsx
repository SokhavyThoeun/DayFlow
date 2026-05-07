/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import './i18n';

// Components
import Dashboard from './components/Dashboard';
import Planner from './components/Planner';
import Habits from './components/Habits';
import Assistant from './components/Assistant';
import MoodTracker from './components/MoodTracker';
import Profile from './components/Profile';
import BottomNav from './components/BottomNav';
import FocusMode from './components/FocusMode';
import NotificationToast from './components/NotificationToast';
import Auth from './components/Auth';
import { Task } from './types';

export default function App() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('home');
  const [isLoading, setIsLoading] = useState(true);
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  
  // Notification State
  const [activeNotification, setActiveNotification] = useState<{ id: string, title: string, message: string, type: 'upcoming' | 'late' } | null>(null);
  const [notifiedTaskIds, setNotifiedTaskIds] = useState<Set<string>>(new Set());

  // Auto-dismiss notification after 10 seconds
  useEffect(() => {
    if (activeNotification) {
      const timer = setTimeout(() => {
        setActiveNotification(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [activeNotification]);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (error) {
      console.error("Fetch tasks error:", error);
    }
  };

  const fetchHabits = async () => {
    try {
      const res = await fetch('/api/habits');
      if (res.ok) {
        const data = await res.json();
        setHabits(data);
      }
    } catch (error) {
      console.error("Fetch habits error:", error);
    }
  };

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('dayflow_user');
    if (storedUser) setUser(JSON.parse(storedUser));

    // Check for theme
    const storedTheme = localStorage.getItem('dayflow_theme');
    // Default to dark if not set (or set based on system pref if you prefer, but here we default to dark per user behavior)
    const initialDarkMode = storedTheme === null ? true : storedTheme === 'dark';
    
    setIsDarkMode(initialDarkMode);
    if (initialDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Simulate initial splash screen
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchHabits();
      
      // Periodic refresh every 30 seconds
      const interval = setInterval(() => {
        fetchTasks();
        fetchHabits();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  // Notification Checker
  useEffect(() => {
    if (!user || tasks.length === 0) return;

    const checkInterval = setInterval(() => {
      const now = new Date();
      
      tasks.forEach(task => {
        if (task.isCompleted || !task.deadline) return;
        
        const deadline = new Date(task.deadline);
        const timeDiff = deadline.getTime() - now.getTime();
        const minutesDiff = Math.floor(timeDiff / (1000 * 60));

        // Upcoming: 5 minutes before
        if (minutesDiff <= 5 && minutesDiff > 0 && !notifiedTaskIds.has(`${task.id}-upcoming`)) {
          setActiveNotification({
            id: task.id,
            title: task.title,
            message: `Starts in about ${minutesDiff} minutes. Ready FlowCoach?`,
            type: 'upcoming'
          });
          setNotifiedTaskIds(prev => new Set(prev).add(`${task.id}-upcoming`));
        }
        
        // Late: after deadline
        if (minutesDiff < 0 && !notifiedTaskIds.has(`${task.id}-late`)) {
          setActiveNotification({
            id: task.id,
            title: task.title,
            message: `You're running behind! Let's get focus mode started.`,
            type: 'late'
          });
          setNotifiedTaskIds(prev => new Set(prev).add(`${task.id}-late`));
        }
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkInterval);
  }, [user, tasks, notifiedTaskIds]);

  const handleAddTask = async (task: Partial<Task>) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...task, userId: user?.id, createdAt: new Date().toISOString(), isCompleted: false })
      });
      if (res.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogin = (userData: any) => {
    setUser(userData);
    localStorage.setItem('dayflow_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('dayflow_user');
    setActiveTab('home');
  };

  const updateUser = (updatedData: any) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem('dayflow_user', JSON.stringify(newUser));
  };

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('dayflow_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('dayflow_theme', 'light');
    }
  };

  const openFocusMode = () => setShowFocusMode(true);
  const closeFocusMode = () => setShowFocusMode(false);
  const openProfile = () => setActiveTab('profile'); // Switch to tab instead of overlay
  const closeProfile = () => setActiveTab('home');

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center z-50 transition-colors duration-500">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative w-24 h-24 mb-6"
        >
          <div className="absolute inset-0 bg-indigo-500 rounded-3xl rotate-12 blur-xl opacity-20 animate-pulse" />
          <div className="relative w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/20">
            <span className="text-white font-bold text-3xl italic">DF</span>
          </div>
        </motion.div>
        <motion.h1 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2"
        >
          DayFlow
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-[0.2em]"
        >
          {t('developer')}
        </motion.p>
      </div>
    );
  }

  // If not logged in, show Auth screen
  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  const goToAssistantWithPrompt = (prompt: string) => {
    setActiveTab('assistant');
    // We'll use a sessionStorage or a global event to pass this prompt
    // For simplicity, we can pass it as a prop if we store it in state
    localStorage.setItem('assistant_initial_prompt', prompt);
  };

  const renderContent = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // XP Calculation
    // Tasks: 10XP per completion (all time)
    const allCompletedTasksXP = tasks.filter(t => t.isCompleted).length * 10;
    // Habits: 20XP per completion (all time from history)
    const allHabitsXP = habits.reduce((acc, h) => acc + (h.history?.length || 0), 0) * 20;
    const totalXP = allCompletedTasksXP + allHabitsXP;
    
    // Today's Progress Calculation
    const tasksToday = tasks.filter(t => t.deadline?.startsWith(todayStr));
    const completedTasksToday = tasksToday.filter(t => t.isCompleted).length;
    
    const activeHabits = habits.length;
    const completedHabitsToday = habits.filter(h => h.history.includes(todayStr)).length;
    
    const totalTodayActions = tasksToday.length + activeHabits;
    const completedTodayActions = completedTasksToday + completedHabitsToday;
    
    const todaysProgress = totalTodayActions > 0 
      ? Math.round((completedTodayActions / totalTodayActions) * 100) 
      : 0;
    
    // Streak (simple mock based on habits for now, or just some value)
    const activeStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0) || (completedTasksToday > 0 ? 1 : 0);

    const taskStats = {
      study: tasks.filter(t => t.category === 'study').length,
      work: tasks.filter(t => t.category === 'work').length,
      personal: tasks.filter(t => t.category === 'personal').length,
      business: tasks.filter(t => t.category === 'business').length,
    };

    switch (activeTab) {
      case 'home': return (
        <Dashboard 
          onOpenFocus={openFocusMode} 
          onOpenProfile={openProfile} 
          userName={user.name} 
          userAvatar={user.avatar} 
          onPlanMyDay={() => goToAssistantWithPrompt(t('plan_my_day'))}
          stats={{
            xp: totalXP,
            streak: activeStreak,
            level: Math.floor(totalXP / 500) + 1, // Every 500XP is a level
            progress: todaysProgress
          }}
          taskStats={taskStats}
          habits={habits}
          onMoodSelect={(mood) => updateUser({ lastMood: mood })}
          userMood={user.lastMood}
        />
      );
      case 'planner': return <Planner initialTasks={tasks} onRefresh={fetchTasks} />;
      case 'habits': return (
        <Habits 
          stats={{
            xp: totalXP,
            level: Math.floor(totalXP / 500) + 1,
            progress: todaysProgress
          }} 
        />
      );
      case 'assistant': return <Assistant onAddTask={handleAddTask} />;
      case 'mood': return <MoodTracker />;
      case 'profile': return (
        <Profile 
          user={user} 
          onLogout={handleLogout} 
          onUpdateUser={updateUser}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
        />
      );
      default: return <Dashboard onOpenFocus={openFocusMode} onOpenProfile={openProfile} userName={user.name} onPlanMyDay={() => goToAssistantWithPrompt(t('plan_my_day'))} />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 flex flex-col pb-24 font-sans selection:bg-indigo-500/30 transition-colors duration-300">
      {/* Notifications */}
      <NotificationToast 
        show={!!activeNotification}
        onClose={() => setActiveNotification(null)}
        title={activeNotification?.title || ''}
        message={activeNotification?.message || ''}
        type={activeNotification?.type || 'upcoming'}
      />

      {/* Scrollable Area */}
      <main className="flex-1 w-full max-w-md mx-auto px-5 pt-8 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Overlays */}
      <AnimatePresence>
        {showFocusMode && <FocusMode onClose={closeFocusMode} />}
      </AnimatePresence>

      {/* Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

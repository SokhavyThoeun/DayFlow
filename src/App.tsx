/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { MotionConfig } from 'motion/react';
import './i18n';

// Components
import Dashboard from './components/Dashboard';
import Planner from './components/Planner';
import Habits from './components/Habits';
import Assistant from './components/Assistant';
import MoodTracker from './components/MoodTracker';
import Profile from './components/Profile';
import Settings from './components/Settings';
import BottomNav from './components/BottomNav';
import FocusMode from './components/FocusMode';
import NotificationToast from './components/NotificationToast';
import Auth from './components/Auth';
import { Task } from './types';

// Utils
import { audioService } from './lib/audio';
import { hapticService } from './lib/haptics';

// Firebase
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export default function App() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('home');
  const [isLoading, setIsLoading] = useState(true);
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'amoled'>('dark');
  const [settings, setSettings] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  
  // Notification State
  const [activeNotification, setActiveNotification] = useState<{ id: string, title: string, message: string, type: 'upcoming' | 'late' | 'motivation' } | null>(null);
  const [notifiedTaskIds, setNotifiedTaskIds] = useState<Set<string>>(new Set());
  const [hasShownMotivation, setHasShownMotivation] = useState(false);

  const motivationalQuotes = [
    { title: "Dream Big", message: "The only limit to our realization of tomorrow is our doubts of today." },
    { title: "Stay Focused", message: "Focus on being productive instead of busy." },
    { title: "Keep Going", message: "It does not matter how slowly you go as long as you do not stop." },
    { title: "Greatness Awaits", message: "Success is not final; failure is not fatal: It is the courage to continue that counts." },
    { title: "Believe in You", message: "Whether you think you can or you think you can't, you're right." },
    { title: "Master Your Day", message: "How you spend your days is how you spend your life." },
    { title: "Peak Flow", message: "Your work is going to fill a large part of your life. Do great work!" }
  ];

  // Handle Theme and Accent Application
  useEffect(() => {
    document.documentElement.classList.remove('dark', 'amoled');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'amoled') {
      document.documentElement.classList.add('amoled');
    }
    localStorage.setItem('dayflow_theme', theme);
  }, [theme]);

  // Apply Accent Color
  useEffect(() => {
    if (settings?.accentColor) {
      document.documentElement.style.setProperty('--accent-color', settings.accentColor);
      
      // Convert hex to RGB for opacity supporting shadows if needed
      // Simple hex to rgb conversion
      const hex = settings.accentColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      document.documentElement.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
    }
  }, [settings?.accentColor]);

  useEffect(() => {
    // Auth Listener
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Sync user profile from Firestore
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setUser({ ...userDoc.data(), id: fbUser.uid });
        } else {
          // Create new user profile
          const newUser = {
            id: fbUser.uid,
            uid: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            email: fbUser.email,
            avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fbUser.uid}`,
            lastMood: 'neutral',
            createdAt: new Date().toISOString()
          };
          await setDoc(userDocRef, newUser);
          setUser(newUser);

          // Create default settings
          const settingsRef = doc(db, 'users', fbUser.uid, 'settings', 'current');
          await setDoc(settingsRef, {
            userId: fbUser.uid,
            language: i18n.language || 'en',
            theme: 'dark',
            accentColor: '#6366f1', // Classic Indigo
            soundEnabled: true,
            hapticEnabled: true,
            animationsEnabled: true,
            notifications: {
              push: true,
              taskReminders: true,
              dailyMotivation: true,
              studyReminders: true,
              aiAssistant: true
            },
            productivity: {
              pomoWork: 25,
              pomoBreak: 5,
              waterTarget: 8,
              sleepTarget: '23:00'
            },
            security: {
              faceIdEnabled: false,
              twoFactorEnabled: false
            }
          });
        }
      } else {
        setUser(null);
        setSettings(null);
      }
      setIsLoading(false);
    });

    // Check for stored theme
    const storedTheme = localStorage.getItem('dayflow_theme') as any;
    if (storedTheme) setTheme(storedTheme);
    
    return () => unsubscribeAuth();
  }, []);

  // Sync Settings, Tasks and Habits from Firestore
  useEffect(() => {
    if (!user) {
      setTasks([]);
      setHabits([]);
      setSettings(null);
      return;
    }

    const settingsRef = doc(db, 'users', user.id, 'settings', 'current');
    const unsubscribeSettings = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setSettings(data);
        if (data.theme) setTheme(data.theme);
        if (data.language && data.language !== i18n.language) {
          i18n.changeLanguage(data.language);
        }
      }
    });

    const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', user.id));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const taskList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(taskList);
    });

    const habitsQuery = query(collection(db, 'habits'), where('userId', '==', user.id));
    const unsubscribeHabits = onSnapshot(habitsQuery, (snapshot) => {
      const habitList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHabits(habitList);
    });

    return () => {
      unsubscribeSettings();
      unsubscribeTasks();
      unsubscribeHabits();
    };
  }, [user]);

  // Sync Services with Settings & Show Motivation
  useEffect(() => {
    if (settings) {
      audioService.setEnabled(settings.soundEnabled ?? true);
      hapticService.setEnabled(settings.hapticEnabled ?? true);

      // Show daily motivation once per session
      if (settings.notifications?.dailyMotivation && !hasShownMotivation && !isLoading) {
        const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
        
        // Short delay for better UX after login/load
        const timer = setTimeout(() => {
          setActiveNotification({
            id: 'daily-motivation',
            title: randomQuote.title,
            message: randomQuote.message,
            type: 'motivation'
          });
          setHasShownMotivation(true);
          
          // Motivation hides faster (5s)
          setTimeout(() => setActiveNotification(null), 5000);
        }, 1500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [settings, hasShownMotivation, isLoading]);

  // Update Settings in Firestore
  const updateSettings = async (updatedData: any) => {
    if (!user) return;
    try {
      const settingsRef = doc(db, 'users', user.id, 'settings', 'current');
      await setDoc(settingsRef, updatedData, { merge: true });
    } catch (error) {
      console.error("Update settings error:", error);
    }
  };

  // Notification Checker
  useEffect(() => {
    if (!user || (tasks.length === 0 && habits.length === 0) || !settings?.notifications?.push) return;

    const checkInterval = setInterval(() => {
      const now = new Date();
      // Local YYYY-MM-DD string
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      // Check Tasks
      tasks.forEach(task => {
        if (task.isCompleted || !task.deadline) return;
        
        const deadline = new Date(task.deadline);
        const timeDiff = deadline.getTime() - now.getTime();
        const minutesDiff = Math.floor(timeDiff / (1000 * 60));

        // Upcoming: 5 minutes before
        if (minutesDiff <= 5 && minutesDiff > 0 && !notifiedTaskIds.has(`${task.id}-upcoming`)) {
          audioService.playPop();
          hapticService.medium();
          setActiveNotification({
            id: task.id,
            title: task.title,
            message: `Starts in about ${minutesDiff} minutes. Ready FlowCoach?`,
            type: 'upcoming'
          });
          setNotifiedTaskIds(prev => new Set(prev).add(`${task.id}-upcoming`));
          setTimeout(() => setActiveNotification(null), 8000);
        }
        
        // Late: after deadline
        if (minutesDiff < 0 && !notifiedTaskIds.has(`${task.id}-late`)) {
          audioService.playError();
          hapticService.heavy();
          setActiveNotification({
            id: task.id,
            title: task.title,
            message: `Overdue alert! This task missed its planned time.`,
            type: 'late'
          });
          setNotifiedTaskIds(prev => new Set(prev).add(`${task.id}-late`));
          setTimeout(() => setActiveNotification(null), 8000);
        }
      });

      // Check Habits
      habits.forEach(habit => {
        if (!habit.time || habit.history?.includes(todayStr)) return;

        const [hours, minutes] = habit.time.split(':').map(Number);
        const habitTimeToday = new Date();
        habitTimeToday.setHours(hours, minutes, 0, 0);

        const timeDiff = habitTimeToday.getTime() - now.getTime();
        const minutesDiff = Math.floor(timeDiff / (1000 * 60));

        // Upcoming Habit: 5-10 minutes before
        const upcomingKey = `${habit.id}-upcoming-${todayStr}-${habit.time}`;
        if (minutesDiff <= 5 && minutesDiff > 0 && !notifiedTaskIds.has(upcomingKey)) {
          audioService.playPop();
          hapticService.medium();
          setActiveNotification({
            id: habit.id,
            title: habit.title,
            message: `Almost due! Time for your daily habit: ${habit.title}`,
            type: 'upcoming'
          });
          setNotifiedTaskIds(prev => new Set(prev).add(upcomingKey));
          setTimeout(() => setActiveNotification(null), 8000);
        }

        // Late Habit: immediately after scheduled time if not done
        const lateKey = `${habit.id}-late-${todayStr}-${habit.time}`;
        if (minutesDiff < 0 && minutesDiff > -60 && !notifiedTaskIds.has(lateKey)) {
          audioService.playError();
          hapticService.heavy();
          setActiveNotification({
            id: habit.id,
            title: habit.title,
            message: `Overdue! Don't forget your habit: ${habit.title}`,
            type: 'late'
          });
          setNotifiedTaskIds(prev => new Set(prev).add(lateKey));
          setTimeout(() => setActiveNotification(null), 8000);
        }
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkInterval);
  }, [user, tasks, habits, notifiedTaskIds, settings]);

  const handleAddTask = async (task: Partial<Task>) => {
    try {
      const taskRef = doc(collection(db, 'tasks'));
      await setDoc(taskRef, {
        ...task,
        userId: user?.id,
        createdAt: new Date().toISOString(),
        isCompleted: false
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogin = (userData: any) => {
    // This is now handled by onAuthStateChanged listener
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setActiveTab('home');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const updateUser = async (updatedData: any) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.id);
      await setDoc(userDocRef, { ...user, ...updatedData }, { merge: true });
      setUser((prev: any) => ({ ...prev, ...updatedData }));
    } catch (error) {
      console.error("Update user error:", error);
    }
  };

  const toggleTheme = () => {
    let nextTheme: 'light' | 'dark' | 'amoled';
    if (theme === 'light') nextTheme = 'dark';
    else if (theme === 'dark') nextTheme = 'amoled';
    else nextTheme = 'light';
    
    setTheme(nextTheme);
    updateSettings({ theme: nextTheme });
  };

  const openFocusMode = () => setShowFocusMode(true);
  const closeFocusMode = () => setShowFocusMode(false);
  const openSettings = () => setActiveTab('settings');
  const closeSettings = () => setActiveTab('home');

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
          onOpenSettings={openSettings} 
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
      case 'planner': return <Planner initialTasks={tasks} />;
      case 'habits': return (
        <Habits 
          stats={{
            xp: totalXP,
            level: Math.floor(totalXP / 500) + 1,
            progress: todaysProgress
          }} 
          habits={habits}
        />
      );
      case 'assistant': return <Assistant user={user} onAddTask={handleAddTask} />;
      case 'mood': return <MoodTracker />;
      case 'settings': return (
        <Settings 
          user={user} 
          settings={settings}
          onLogout={handleLogout} 
          onUpdateUser={updateUser}
          onUpdateSettings={updateSettings}
          theme={theme}
          onToggleTheme={toggleTheme}
          productivityScore={totalXP}
        />
      );
      default: return <Dashboard onOpenFocus={openFocusMode} onOpenSettings={openSettings} userName={user.name} onPlanMyDay={() => goToAssistantWithPrompt(t('plan_my_day'))} />;
    }
  };

  return (
    <MotionConfig transition={settings?.animationsEnabled === false ? { duration: 0 } : undefined}>
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
    </MotionConfig>
  );
}

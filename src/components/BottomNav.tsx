import { motion } from 'motion/react';
import { Home, Calendar, RefreshCcw, MessageSquare, Smile, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const { t } = useTranslation();

  const tabs = [
    { id: 'home', icon: Home, label: t('nav_dashboard') },
    { id: 'planner', icon: Calendar, label: t('nav_planner') },
    { id: 'assistant', icon: MessageSquare, label: t('nav_assistant'), featured: true },
    { id: 'habits', icon: RefreshCcw, label: t('nav_habits') },
    { id: 'profile', icon: User, label: t('profile') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-6 pt-2">
      <div className="max-w-md mx-auto relative h-20 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-white/5 rounded-3xl flex items-center justify-around shadow-2xl shadow-black/10 dark:shadow-black/50 transition-colors">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          if (tab.featured) {
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative -top-8 group"
              >
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl",
                  isActive 
                    ? "bg-indigo-500 shadow-indigo-500/40" 
                    : "bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-100 dark:border-white/5 shadow-black/10 dark:shadow-black/40"
                )}>
                  <Icon className={cn(
                    "w-8 h-8 transition-colors duration-300",
                    isActive ? "text-white" : "text-zinc-400 dark:text-zinc-500"
                  )} />
                </div>
                {isActive && (
                  <motion.div 
                    layoutId="featured-active"
                    className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500"
                  />
                )}
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center justify-center space-y-1 relative px-2 transition-opacity active:opacity-60"
            >
              <Icon className={cn(
                "w-6 h-6 transition-all duration-300",
                isActive ? "text-indigo-500 scale-110" : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400"
              )} />
              <span className={cn(
                "text-[10px] font-bold transition-colors duration-300",
                isActive ? "text-indigo-500 opacity-100" : "text-zinc-400 dark:text-zinc-600 opacity-0"
              )}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="active-indicator"
                  className="absolute -top-3 w-4 h-1 rounded-full bg-indigo-500/50 blur-[2px]"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

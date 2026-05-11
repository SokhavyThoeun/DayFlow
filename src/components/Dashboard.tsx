import { motion } from 'motion/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, TrendingUp, Zap, Target, BookOpen, ChevronRight, Sun, Frown, Meh, Smile, Heart } from 'lucide-react';
import { formatDate, cn } from '../lib/utils';

interface DashboardProps {
  onOpenFocus: () => void;
  onOpenSettings: () => void;
  onPlanMyDay?: () => void;
  userName?: string;
  userAvatar?: string;
  stats?: { streak: number; xp: number; level: number; progress: number };
  taskStats?: { study: number; work: number; business: number; personal: number };
  habits?: any[];
  onMoodSelect?: (mood: string) => void;
  userMood?: string;
}

export default function Dashboard({ 
  onOpenFocus, 
  onOpenSettings, 
  onPlanMyDay, 
  userName, 
  userAvatar,
  stats = { streak: 0, xp: 0, level: 1, progress: 0 },
  taskStats = { study: 0, work: 0, business: 0, personal: 0 },
  habits = [],
  onMoodSelect,
  userMood
}: DashboardProps) {
  const { t, i18n } = useTranslation();
  const currentDate = new Date();

  const dashboardStats = [
    { id: 'streak', label: t('streak'), value: stats.streak.toString(), icon: Zap, color: 'text-orange-400', bg: 'bg-orange-400/10' },
    { id: 'xp', label: t('xp'), value: stats.xp.toString(), icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { id: 'level', label: t('level'), value: stats.level.toString(), icon: Target, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  ];

  const activeStats = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      // Check if any habit was completed on this day
      const hasActivity = habits.some(h => h.history.includes(dateStr));
      
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <section className="flex items-end justify-between">
        <div>
          <p className="text-zinc-500 font-bold text-[10px] mb-2 uppercase tracking-[0.2em]">
            {formatDate(currentDate, i18n.language)}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
            {i18n.language === 'kh' ? 'សួស្ដី' : (i18n.language === 'zh' ? '你好' : 'Hello')}, {userName?.split(' ')[0] || 'User'} 
            <Sun className="w-6 h-6 text-amber-400 animate-pulse" />
          </h1>
        </div>
        <button 
          onClick={onOpenSettings}
          className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 flex items-center justify-center overflow-hidden active:scale-90 transition-transform shadow-xl"
        >
          <img 
            src={userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName || 'User'}`} 
            alt="User" 
            className="w-full h-full object-cover"
          />
        </button>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-3 gap-3">
        {dashboardStats.map((stat) => (
          <div key={stat.id} className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 p-3 rounded-2xl flex flex-col items-center shadow-sm dark:shadow-none hover:border-indigo-500/50 transition-colors">
            <div className={`p-2 rounded-xl ${stat.bg} mb-2 group-hover:scale-110 transition-transform`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <span className="text-xl font-bold text-zinc-900 dark:text-white leading-none">{stat.value}</span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase mt-1 tracking-tighter">{stat.label}</span>
            
            {stat.id === 'level' && (
              <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-2 overflow-hidden px-0.5">
                <div 
                  className="h-full bg-blue-400 rounded-full" 
                  style={{ width: `${(stats.xp % 500) / 5}%` }} 
                />
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Activity Tracker Section */}
      <section className="bg-white dark:bg-zinc-800/40 border border-zinc-200 dark:border-white/5 p-6 rounded-[2.5rem] space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="font-bold text-lg">{t('activity_tracker')}</h3>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">{stats.progress}% {t('completed')} {t('today')}</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-400/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        {/* Mini Progress Bar */}
        <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${stats.progress}%` }}
            className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
          />
        </div>

        <div className="flex justify-between items-center px-1">
          {activeStats.map((day, idx) => (
            <div key={idx} className="flex flex-col items-center gap-3">
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest",
                idx === activeStats.length - 1 ? "text-indigo-500" : "text-zinc-400 dark:text-zinc-500"
              )}>{day.label}</span>
              <div className={cn(
                "w-10 h-10 rounded-2xl border transition-all duration-500 group relative",
                day.active 
                  ? "bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20" 
                  : "bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-white/5"
              )}>
                {day.active && <Sparkles className="w-3 h-3 text-white absolute top-1 right-1 opacity-50" />}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Hero Coach Card */}
      <section className="relative overflow-hidden group rounded-[2.5rem]">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 mix-blend-overlay opacity-80 z-0" />
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl z-0" />
        
        <div className="relative z-10 bg-white/10 dark:bg-zinc-800/60 backdrop-blur-md border border-white/20 p-6 rounded-[2.5rem] shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-indigo-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-indigo-500 dark:text-white" />
            </div>
            <h2 className="font-bold text-lg text-white">{t('nav_assistant')}</h2>
          </div>
          <p className="text-zinc-50 dark:text-zinc-200 text-sm leading-relaxed font-medium">
            "You have 3 study tasks today. Start with 15 mins of concentration to build momentum!"
          </p>
          <button 
            onClick={onPlanMyDay}
            className="w-full py-3 px-4 bg-white text-indigo-600 dark:text-zinc-900 font-bold rounded-2xl text-sm transition-transform active:scale-[0.98] shadow-lg"
          >
            {t('plan_my_day')}
          </button>
        </div>
      </section>

      {/* Task Categories Grid */}
      <section className="space-y-4">
        <h3 className="font-bold text-lg px-1">{t('tasks')}</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { id: 'study', label: 'Study', icon: BookOpen, count: taskStats.study, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
            { id: 'work', label: 'Work', icon: Zap, count: taskStats.work, color: 'text-amber-400', bg: 'bg-amber-400/10' },
            { id: 'business', label: 'Business', icon: TrendingUp, count: taskStats.business, color: 'text-pink-400', bg: 'bg-pink-400/10' },
            { id: 'personal', label: 'Personal', icon: Target, count: taskStats.personal, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
          ].map((cat) => (
            <motion.div 
              key={cat.label}
              whileTap={{ scale: 0.98 }}
              className="bg-white dark:bg-zinc-800/40 border border-zinc-200 dark:border-white/5 p-4 rounded-3xl flex flex-col gap-3 group hover:border-indigo-500 transition-all shadow-sm active:shadow-none"
            >
              <div className={`w-10 h-10 rounded-xl ${cat.bg} flex items-center justify-center`}>
                <cat.icon className={`w-5 h-5 ${cat.color}`} />
              </div>
              <div>
                <p className="font-bold text-zinc-900 dark:text-zinc-100">{cat.label}</p>
                <p className="text-xs text-zinc-500">{cat.count} tasks today</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Mood Quick Access */}
      <section className="bg-white dark:bg-zinc-800/40 border border-zinc-200 dark:border-white/5 p-6 rounded-[2.5rem] space-y-5 shadow-sm">
        <h3 className="font-bold text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">{t('mood_question')}</h3>
        <div className="flex justify-between items-center px-2">
          {moodIcons.map((m, idx) => (
            <button 
              key={idx} 
              onClick={() => onMoodSelect?.(m.id)}
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm",
                userMood === m.id 
                  ? "bg-indigo-500 text-white shadow-indigo-500/20" 
                  : "bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5"
              )}
            >
              <m.icon className={cn("w-6 h-6", userMood === m.id ? "text-white" : m.color)} />
            </button>
          ))}
        </div>
      </section>

      {/* Focus Mode Quick Link */}
      <section 
        onClick={onOpenFocus}
        className="bg-indigo-500 dark:bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-[2.5rem] flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer shadow-xl shadow-indigo-500/20"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-indigo-500 flex items-center justify-center text-indigo-500 dark:text-white shadow-lg">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">{t('focus')}</h3>
            <p className="text-xs text-indigo-100 dark:text-indigo-300 font-medium tracking-wide">Enter deep work mode</p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/20 dark:bg-indigo-500/10 flex items-center justify-center text-white dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
          <ChevronRight />
        </div>
      </section>
    </div>
  );
}

import { motion } from 'motion/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { audioService } from '../lib/audio';
import { hapticService } from '../lib/haptics';
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
      <section className="grid grid-cols-3 gap-4">
        {dashboardStats.map((stat) => (
          <div key={stat.id} className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 p-4 rounded-3xl flex flex-col items-center shadow-sm dark:shadow-none hover:border-accent/30 hover:shadow-lg transition-all duration-300">
            <div className={`p-2.5 rounded-2xl ${stat.bg} mb-3 group-hover:scale-110 transition-transform duration-300`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <span className="text-2xl font-black text-zinc-900 dark:text-white leading-none tracking-tight">{stat.value}</span>
            <span className="text-[10px] text-zinc-500 font-black uppercase mt-1.5 tracking-widest">{stat.label}</span>
            
            {stat.id === 'level' && (
              <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-3 overflow-hidden p-[2px]">
                <div 
                  className="h-full bg-blue-400 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.4)]" 
                  style={{ width: `${(stats.xp % 500) / 5}%` }} 
                />
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Activity Tracker Section */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 p-7 rounded-[2.5rem] space-y-7 shadow-sm dark:shadow-none transition-all">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h3 className="font-black text-lg tracking-tight">{t('activity_tracker')}</h3>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.15em]">{stats.progress}% {t('completed')} {t('today')}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/10">
            <TrendingUp className="w-6 h-6 text-emerald-500" />
          </div>
        </div>

        {/* Mini Progress Bar */}
        <div className="h-3 w-full bg-zinc-50 dark:bg-zinc-800/50 rounded-full overflow-hidden p-1 shadow-inner">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${stats.progress}%` }}
            transition={{ duration: 1.5, ease: "circOut" }}
            className="h-full bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.4)]"
          />
        </div>

        <div className="flex justify-between items-center gap-2">
          {activeStats.map((day, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-3">
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest",
                idx === activeStats.length - 1 ? "text-accent" : "text-zinc-300 dark:text-zinc-600"
              )}>{day.label}</span>
              <div className={cn(
                "w-full aspect-square rounded-2xl border transition-all duration-700 group relative flex items-center justify-center max-w-[40px]",
                day.active 
                  ? "bg-emerald-500 border-emerald-400 shadow-lg shadow-emerald-500/30" 
                  : "bg-white dark:bg-zinc-800 border-zinc-100 dark:border-white/5"
              )}>
                {day.active && <Sparkles className="w-4 h-4 text-white/50" />}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Hero Coach Card */}
      <section className="relative overflow-hidden group rounded-[2.5rem] shadow-2xl shadow-accent/20">
        <div className="absolute inset-0 bg-accent transition-transform duration-700 group-hover:scale-110 z-0" />
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/20 rounded-full blur-3xl z-0" />
        <div className="absolute left-1/4 bottom-0 w-20 h-20 bg-accent-400/20 rounded-full blur-2xl z-0" />
        
        <div className="relative z-10 bg-white/5 dark:bg-zinc-900/40 backdrop-blur-xl border border-white/20 p-8 rounded-[2.5rem] space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-xl rotate-3 group-hover:rotate-0 transition-transform">
              <Sparkles className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h2 className="font-black text-xl text-white tracking-tight">{t('nav_assistant')}</h2>
              <p className="text-[10px] text-white/60 uppercase font-black tracking-widest">AI FlowCoach</p>
            </div>
          </div>
          <p className="text-white text-base leading-relaxed font-bold tracking-tight">
            "You have {taskStats.study + taskStats.work} priority tasks today. Start with a 15-min deep focus session to build instant momentum!"
          </p>
          <button 
            onClick={onPlanMyDay}
            className="w-full py-4 px-4 bg-white text-accent font-black uppercase tracking-widest rounded-2xl text-xs transition-all active:translate-y-1 active:shadow-none hover:shadow-xl shadow-lg"
          >
            {t('plan_my_day')}
          </button>
        </div>
      </section>

      {/* Task Categories Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-black text-lg tracking-tight">{t('tasks')}</h3>
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Select Category</span>
        </div>
        <div className="grid grid-cols-2 gap-5">
          {[
            { id: 'study', label: 'Study', icon: BookOpen, count: taskStats.study, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
            { id: 'work', label: 'Work', icon: Zap, count: taskStats.work, color: 'text-amber-400', bg: 'bg-amber-400/10' },
            { id: 'business', label: 'Business', icon: TrendingUp, count: taskStats.business, color: 'text-pink-400', bg: 'bg-pink-400/10' },
            { id: 'personal', label: 'Personal', icon: Target, count: taskStats.personal, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
          ].map((cat) => (
            <motion.div 
              key={cat.label}
              whileTap={{ scale: 0.98 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 p-6 rounded-[2.5rem] flex flex-col gap-4 group hover:border-accent/40 shadow-sm transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-2xl ${cat.bg} flex items-center justify-center border border-current opacity-70 group-hover:opacity-100 transition-opacity`}>
                <cat.icon className={`w-6 h-6 ${cat.color}`} />
              </div>
              <div>
                <p className="font-black text-zinc-900 dark:text-zinc-100 text-lg tracking-tight">{cat.label}</p>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{cat.count} tasks today</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

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
                  ? "bg-accent text-white shadow-xl shadow-accent/30 border-b-4 border-accent/70 -translate-y-1" 
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
        className="relative overflow-hidden bg-zinc-900 dark:bg-accent border-b-8 border-black/20 p-8 rounded-[3rem] flex items-center justify-between group active:translate-y-1 active:border-b-0 transition-all cursor-pointer shadow-2xl shadow-zinc-900/20"
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
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
      </section>
    </div>
  );
}

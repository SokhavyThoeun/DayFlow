import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Mail, ShieldCheck, Bell, Settings as SettingsIcon, 
  Palette, Laptop, Smartphone, Speaker, Fingerprint, 
  Share2, HelpCircle, FileText, Bug, MessageSquare, 
  ChevronRight, LogOut, CheckCircle2, Globe, Moon, 
  Sun, Wand2, Brain, Bot, Rocket, Users, 
  Calendar, Quote, Zap, Clock, Droplets, BookOpen, 
  Shield, Timer, Lock, RefreshCw, Smartphone as DeviceIcon,
  Languages, Info, Star, CreditCard
} from 'lucide-react';
import { cn } from '../lib/utils';
import { auth } from '../lib/firebase';
import { useTranslation } from 'react-i18next';

interface SettingsProps {
  user: any;
  settings: any;
  onUpdateUser: (data: any) => void;
  onUpdateSettings: (data: any) => void;
  onLogout: () => void;
  theme: 'light' | 'dark' | 'amoled';
  onToggleTheme: () => void;
}

export default function Settings({ 
  user, 
  settings, 
  onUpdateUser, 
  onUpdateSettings,
  onLogout, 
  theme, 
  onToggleTheme 
}: SettingsProps) {
  const { t, i18n } = useTranslation();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');

  // Default values while loading
  const currentSettings = settings || {
    notifications: { push: true, taskReminders: true, dailyMotivation: true, studyReminders: true, aiAssistant: true },
    soundEnabled: true,
    hapticEnabled: true,
    animationsEnabled: true,
    productivity: { pomoWork: 25, pomoBreak: 5, waterTarget: 8, sleepTarget: '23:00' },
    security: { faceIdEnabled: false, twoFactorEnabled: false }
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    onUpdateSettings({ language: lang });
  };

  const handleToggle = (key: string, value: boolean) => {
    onUpdateSettings({ [key]: value });
  };

  const handleNestedToggle = (category: string, key: string, value: boolean) => {
    onUpdateSettings({
      [category]: {
        ...(currentSettings[category] || {}),
        [key]: value
      }
    });
  };

  const SettingRow = ({ icon: Icon, label, value, onClick, color = "indigo", children }: any) => (
    <motion.div 
      whileHover={{ scale: 0.995, x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center justify-between p-4 bg-white/5 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-white/5 rounded-2xl cursor-pointer transition-colors hover:border-indigo-500/30 group mb-2"
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg",
          color === "indigo" ? "bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white" :
          color === "amber" ? "bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white" :
          color === "rose" ? "bg-rose-500/10 text-rose-500 group-hover:bg-rose-500 group-hover:text-white" :
          color === "purple" ? "bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white" :
          color === "blue" ? "bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white" :
          color === "emerald" ? "bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white" :
          "bg-zinc-500/10 text-zinc-500 group-hover:bg-zinc-500 group-hover:text-white"
        )}>
          <Icon size={20} />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{label}</span>
          {value && <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">{value}</span>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {children}
        <ChevronRight size={16} className="text-zinc-400 group-hover:text-indigo-500 transition-colors" />
      </div>
    </motion.div>
  );

  const Toggle = ({ active, onToggle }: { active: boolean, onToggle: () => void }) => (
    <div 
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={cn(
        "w-10 h-6 rounded-full transition-all duration-500 relative cursor-pointer",
        active ? "bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" : "bg-zinc-200 dark:bg-zinc-800"
      )}
    >
      <div className={cn(
        "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all transform duration-300 shadow-md",
        active ? "translate-x-4" : "translate-x-0"
      )} />
    </div>
  );

  const SectionTitle = ({ children }: { children: string }) => (
    <h2 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] ml-4 mt-8 mb-4">
      {children}
    </h2>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-32 max-w-2xl mx-auto px-4"
    >
      {/* Header Profile Section */}
      <div className="relative pt-12 pb-8 flex flex-col items-center text-center">
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-indigo-500/20 to-transparent blur-3xl -z-10" />
        
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
          <img 
            src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} 
            className="relative w-28 h-28 rounded-full border-4 border-white dark:border-zinc-900 shadow-2xl object-cover transition-transform group-hover:scale-105"
            alt="Profile"
          />
          <button 
            onClick={() => onUpdateUser({ avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random().toString(36).substring(7)}` })}
            className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform hover:bg-indigo-600"
          >
            <Palette size={14} />
          </button>
        </div>

        <h1 className="mt-6 text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{user?.name || 'Explorer'}</h1>
        <div className="flex items-center gap-2 mt-2 px-4 py-1 bg-emerald-500/10 text-emerald-500 rounded-full">
          <CheckCircle2 size={12} />
          <span className="text-[10px] font-black uppercase tracking-widest leading-none">{user?.email || 'Guest'}</span>
        </div>
        <p className="mt-4 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Productivity Score: 840</p>
      </div>

      {/* PROFILE SECTION */}
      <SectionTitle>{t('settings_profile')}</SectionTitle>
      {isEditingProfile ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 bg-white/5 dark:bg-zinc-900/40 border border-indigo-500/30 rounded-3xl mb-4"
        >
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Display Name</label>
              <input 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Enter your name"
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  onUpdateUser({ name: editName });
                  setIsEditingProfile(false);
                }}
                className="flex-1 bg-indigo-500 text-white text-xs font-black uppercase tracking-widest py-3 rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
              >
                {t('save')}
              </button>
              <button 
                onClick={() => setIsEditingProfile(false)}
                className="flex-1 bg-zinc-200 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 text-xs font-black uppercase tracking-widest py-3 rounded-xl active:scale-95 transition-all"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <SettingRow 
          icon={User} 
          label={t('personal_info')} 
          value={user?.name || 'Explorer'} 
          onClick={() => setIsEditingProfile(true)} 
        />
      )}
      <SettingRow icon={Lock} label={t('security_password')} value="Manage access" />
      <SettingRow icon={Smartphone} label={t('connected_accounts')} value="Google Connected" />
      <div className="flex gap-4">
        <button className="flex-1 p-4 rounded-2xl bg-white/5 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-indigo-500 transition-colors">
          {t('verify_email')}
        </button>
        <button className="flex-1 p-4 rounded-2xl bg-white/5 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-rose-500 transition-colors">
          {t('delete_data')}
        </button>
      </div>

      {/* GENERAL SETTINGS */}
      <SectionTitle>{t('settings_general')}</SectionTitle>
      <SettingRow icon={Languages} label={t('language_selector')} value={i18n.language === 'km' ? 'ភាសាខ្មែរ' : 'English'}>
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={() => handleLanguageChange('en')}
            className={cn("text-[9px] font-bold px-2 py-1 rounded-lg transition-all", i18n.language === 'en' ? "bg-indigo-500 text-white" : "bg-zinc-100 dark:bg-white/5 text-zinc-500")}
          >
            EN
          </button>
          <button 
            onClick={() => handleLanguageChange('km')}
            className={cn("text-[9px] font-bold px-2 py-1 rounded-lg transition-all", i18n.language === 'km' ? "bg-indigo-500 text-white" : "bg-zinc-100 dark:bg-white/5 text-zinc-500")}
          >
            KH
          </button>
        </div>
      </SettingRow>
      <SettingRow icon={theme === 'amoled' ? Moon : theme === 'dark' ? Moon : Sun} label={t('theme_mode')} value={theme.toUpperCase()} onClick={onToggleTheme}>
         <div className="flex items-center gap-1">
           <div className={cn("w-2 h-2 rounded-full", theme === 'light' ? "bg-orange-400" : theme === 'dark' ? "bg-indigo-500" : "bg-purple-500")} />
           <span className="text-[10px] font-bold">{theme.toUpperCase()}</span>
         </div>
      </SettingRow>
      <SettingRow icon={Speaker} label={t('sound_effects')} color="amber">
        <Toggle active={currentSettings.soundEnabled} onToggle={() => handleToggle('soundEnabled', !currentSettings.soundEnabled)} />
      </SettingRow>
      <SettingRow icon={Zap} label={t('haptic_feedback')} color="emerald">
        <Toggle active={currentSettings.hapticEnabled} onToggle={() => handleToggle('hapticEnabled', !currentSettings.hapticEnabled)} />
      </SettingRow>
      <SettingRow icon={Rocket} label={t('animations')} color="purple">
        <Toggle active={currentSettings.animationsEnabled} onToggle={() => handleToggle('animationsEnabled', !currentSettings.animationsEnabled)} />
      </SettingRow>

      {/* NOTIFICATIONS */}
      <SectionTitle>{t('settings_notifications')}</SectionTitle>
      <SettingRow icon={Bell} label="Push Notifications" color="rose">
        <Toggle active={currentSettings.notifications?.push} onToggle={() => handleNestedToggle('notifications', 'push', !currentSettings.notifications?.push)} />
      </SettingRow>
      <SettingRow icon={Clock} label="Task Reminders" color="blue">
        <Toggle active={currentSettings.notifications?.taskReminders} onToggle={() => handleNestedToggle('notifications', 'taskReminders', !currentSettings.notifications?.taskReminders)} />
      </SettingRow>
      <SettingRow icon={Star} label="Daily Motivation" color="amber">
        <Toggle active={currentSettings.notifications?.dailyMotivation} onToggle={() => handleNestedToggle('notifications', 'dailyMotivation', !currentSettings.notifications?.dailyMotivation)} />
      </SettingRow>

      {/* PRODUCTIVITY */}
      <SectionTitle>{t('settings_productivity')}</SectionTitle>
      <SettingRow icon={Timer} label="Pomodoro Work" value={`${currentSettings.productivity?.pomoWork} mins`} color="rose" />
      <SettingRow icon={Droplets} label="Water Target" value={`${currentSettings.productivity?.waterTarget} glasses`} color="blue" />
      <SettingRow icon={RefreshCw} label="Habit Tracking" value="Cloud Sync Active" color="emerald" />

      {/* AI ASSISTANT */}
      <SectionTitle>{t('settings_ai')}</SectionTitle>
      <div className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] mb-4 shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
          <Brain size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold">Benjie AI Assistant</h3>
              <p className="text-white/60 text-[10px] font-medium uppercase tracking-[0.2em]">Next-Gen Intelligence</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
             <div className="flex items-center justify-between">
                <span className="text-white thin text-sm font-medium">Smart Task Categorization</span>
                <Toggle active={currentSettings.notifications?.aiAssistant} onToggle={() => handleNestedToggle('notifications', 'aiAssistant', !currentSettings.notifications?.aiAssistant)} />
             </div>
             <div className="flex items-center justify-between">
                <span className="text-white thin text-sm font-medium">Auto-Generated Schedules</span>
                <Toggle active={true} onToggle={() => {}} />
             </div>
          </div>
        </div>
      </div>

      {/* SPECIAL CAMBODIAN FEATURES */}
      <SectionTitle>{t('settings_localized')}</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          whileTap={{ scale: 0.95 }}
          className="p-4 bg-white/5 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-white/5 rounded-3xl flex flex-col items-center gap-3"
        >
          <Calendar className="text-rose-500" size={24} />
          <span className="text-[10px] font-black uppercase text-center tracking-widest leading-tight">Khmer Holiday<br/>Calendar</span>
        </motion.div>
        <motion.div 
          whileTap={{ scale: 0.95 }}
          className="p-4 bg-white/5 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-white/5 rounded-3xl flex flex-col items-center gap-3"
        >
          <Quote className="text-amber-500" size={24} />
          <span className="text-[10px] font-black uppercase text-center tracking-widest leading-tight">Khmer Daily<br/>Quotes</span>
        </motion.div>
      </div>

      {/* SECURITY */}
      <SectionTitle>{t('settings_security')}</SectionTitle>
      <SettingRow icon={Fingerprint} label="Face ID / Touch ID" color="emerald">
        <Toggle active={currentSettings.security?.faceIdEnabled} onToggle={() => handleNestedToggle('security', 'faceIdEnabled', !currentSettings.security?.faceIdEnabled)} />
      </SettingRow>
      <SettingRow icon={Shield} label="Two-Factor Auth" value="Manage" color="blue" />

      {/* SUPPORT */}
      <SectionTitle>{t('settings_support')}</SectionTitle>
      <SettingRow icon={HelpCircle} label="Help Center" color="zinc" />
      <SettingRow icon={Bug} label="Report a Bug" color="zinc" />
      <SettingRow icon={FileText} label="Terms & Privacy" color="zinc" />
      <SettingRow icon={Info} label="About DayFlow" value="Version 2.4.0 (Gold)" color="zinc" />

      {/* LOGOUT */}
      <button 
        onClick={onLogout}
        className="w-full mt-12 py-5 rounded-[2rem] bg-rose-500/10 text-rose-500 font-black uppercase tracking-[0.4em] text-xs transition-all active:scale-95 border border-rose-500/20 hover:bg-rose-500 hover:text-white mb-8"
      >
        <div className="flex items-center justify-center gap-3">
          <LogOut size={18} />
          {t('logout')}
        </div>
      </button>

      {/* Developer Credit */}
      <div className="text-center py-12 opacity-30 select-none">
        <div className="flex items-center justify-center gap-2 mb-2">
           <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-white text-[10px]">DF</div>
           <h2 className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-white">DayFlow.</h2>
        </div>
        <p className="text-[8px] font-bold uppercase tracking-[1em] mb-1">Built for Gen Z</p>
        <p className="text-[7px] font-black uppercase tracking-[0.2em]">Developed by Sokhavy Thoeun</p>
      </div>
    </motion.div>
  );
}

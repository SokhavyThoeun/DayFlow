import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Mail, ShieldCheck, Bell, Settings as SettingsIcon, 
  Palette, Laptop, Smartphone, Speaker, Fingerprint, 
  Share2, HelpCircle, FileText, Bug, MessageSquare, 
  ChevronRight, LogOut, CheckCircle2, Globe, Moon, 
  Sun, Wand2, Brain, Bot, Rocket, Users, 
  Calendar, Quote, Zap, Clock, Droplets, BookOpen, 
  Shield, Timer, Lock, RefreshCw, Smartphone as DeviceIcon,
  Languages, Info, Star, CreditCard, Eye, EyeOff, AlertTriangle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { auth, db } from '../lib/firebase';
import { useTranslation } from 'react-i18next';
import { audioService } from '../lib/audio';
import { hapticService } from '../lib/haptics';
import { 
  sendEmailVerification, 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider,
  unlink,
  linkWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, deleteDoc, collection, getDocs, query, where, writeBatch } from 'firebase/firestore';

interface SettingsProps {
  user: any;
  settings: any;
  onUpdateUser: (data: any) => void;
  onUpdateSettings: (data: any) => void;
  onLogout: () => void;
  theme: 'light' | 'dark' | 'amoled';
  onToggleTheme: () => void;
  productivityScore?: number;
}

export default function Settings({ 
  user, 
  settings, 
  onUpdateUser, 
  onUpdateSettings,
  onLogout, 
  theme, 
  onToggleTheme,
  productivityScore = 0
}: SettingsProps) {
  const { t, i18n } = useTranslation();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Password Update State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Default values while loading
  const currentSettings = settings || {
    notifications: { push: true, taskReminders: true, dailyMotivation: true, studyReminders: true, aiAssistant: true },
    soundEnabled: true,
    hapticEnabled: true,
    animationsEnabled: true,
    productivity: { pomoWork: 25, pomoBreak: 5, waterTarget: 8, sleepTarget: '23:00' },
    security: { faceIdEnabled: false, twoFactorEnabled: false }
  };

  const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'km', label: 'ភាសាខ្មែរ', flag: '🇰🇭' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'zh', label: '中文', flag: '🇨🇳' }
  ];

  const filteredLanguages = languages.filter(l => 
    l.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    onUpdateSettings({ language: lang });
  };

  const handleVerifyEmail = async () => {
    if (!auth.currentUser) return;
    setIsProcessing(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setMessage({ text: 'Verification email sent! Please check your inbox.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteData = async () => {
    if (!auth.currentUser || !window.confirm('Are you absolutely sure? This will delete all your tasks, habits, and profile data forever. This action cannot be undone.')) return;
    
    setIsProcessing(true);
    try {
      const uid = auth.currentUser.uid;
      const batch = writeBatch(db);

      // Delete tasks
      const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', uid));
      const taskDocs = await getDocs(tasksQuery);
      taskDocs.forEach((doc) => batch.delete(doc.ref));

      // Delete habits
      const habitsQuery = query(collection(db, 'habits'), where('userId', '==', uid));
      const habitDocs = await getDocs(habitsQuery);
      habitDocs.forEach((doc) => batch.delete(doc.ref));

      // Delete settings
      batch.delete(doc(db, 'users', uid, 'settings', 'current'));

      // Delete user profile
      batch.delete(doc(db, 'users', uid));

      await batch.commit();
      
      setMessage({ text: 'All your data has been deleted. Logging you out...', type: 'info' });
      setTimeout(() => onLogout(), 3000);
    } catch (err: any) {
      setMessage({ text: 'Error deleting data: ' + err.message, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!auth.currentUser || !currentPassword || !newPassword) return;
    setIsProcessing(true);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email!, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      setMessage({ text: 'Password updated successfully!', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setActiveSubMenu(null);
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLinkGoogle = async () => {
    if (!auth.currentUser) return;
    setIsProcessing(true);
    try {
      const provider = new GoogleAuthProvider();
      await linkWithPopup(auth.currentUser, provider);
      setMessage({ text: 'Google account linked successfully!', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggle = (key: string, value: boolean) => {
    audioService.playClick();
    hapticService.light();
    onUpdateSettings({ [key]: value });
  };

  const handleNestedToggle = (category: string, key: string, value: boolean) => {
    audioService.playClick();
    hapticService.light();
    onUpdateSettings({
      [category]: {
        ...(currentSettings[category] || {}),
        [key]: value
      }
    });
  };

  const SettingRow = ({ icon: Icon, label, value, onClick, color = "accent", children, subtext }: any) => (
    <motion.div 
      whileHover={{ scale: 0.99, y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        "flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border-b-4 border-zinc-200 dark:border-zinc-800 rounded-3xl cursor-pointer transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800/50 active:translate-y-1 active:border-b-0 mb-3 shadow-sm",
        activeSection === label && "border-accent ring-2 ring-accent/20"
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md group-hover:scale-110",
          color === "accent" ? "bg-accent/10 text-accent" :
          color === "indigo" ? "bg-indigo-500/10 text-indigo-500" :
          color === "amber" ? "bg-amber-500/10 text-amber-500" :
          color === "rose" ? "bg-rose-500/10 text-rose-500" :
          color === "purple" ? "bg-purple-500/10 text-purple-500" :
          color === "blue" ? "bg-blue-500/10 text-blue-500" :
          color === "emerald" ? "bg-emerald-500/10 text-emerald-500" :
          "bg-zinc-500/10 text-zinc-500"
        )}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{label}</span>
          {(value || subtext) && (
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">
              {value || subtext}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        {children}
        {!children && <ChevronRight size={18} className="text-zinc-300 dark:text-zinc-700" />}
      </div>
    </motion.div>
  );

  const Toggle = ({ active, onToggle }: { active: boolean, onToggle: () => void }) => (
    <div 
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={cn(
        "w-12 h-7 rounded-full transition-all duration-500 relative cursor-pointer border-b-4",
        active ? "bg-accent border-accent/80 shadow-lg shadow-accent/20" : "bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-900"
      )}
    >
      <div className={cn(
        "absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all transform duration-300 shadow-md",
        active ? "translate-x-5" : "translate-x-0"
      )} />
    </div>
  );

  const SectionTitle = ({ children }: { children: string }) => (
    <h2 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-widest ml-1 mt-8 mb-4 flex items-center gap-3">
      <div className="w-1.5 h-5 bg-accent rounded-full" />
      {children}
    </h2>
  );

  if (activeSubMenu === 'security_password') {
    const isGoogleUser = auth.currentUser?.providerData.some(p => p.providerId === 'google.com');

    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="pb-32 max-w-2xl mx-auto px-6 pt-12"
      >
        <div className="flex items-center gap-4 mb-10">
          <button 
            onClick={() => setActiveSubMenu(null)}
            className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-900 border-b-4 border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white active:translate-y-1 active:border-b-0 transition-all shadow-sm"
          >
            <ChevronRight className="rotate-180" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{t('security_password')}</h1>
            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Protect your account</p>
          </div>
        </div>

        {isGoogleUser ? (
          <div className="p-8 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2.5rem] border-b-4 border-zinc-200 dark:border-zinc-800 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-6 text-blue-500">
              <Globe size={32} />
            </div>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-2">Google Login Active</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium leading-relaxed max-w-xs mx-auto">
              Your account is secured via Google. You don't need a separate password for DayFlow.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div>
              <label className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3 block">Current Password</label>
              <div className="relative">
                <input 
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border-b-4 border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-accent transition-all text-zinc-900 dark:text-white"
                  placeholder="Enter current password"
                />
                <button 
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400"
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3 block">New Password</label>
              <div className="relative">
                <input 
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border-b-4 border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-accent transition-all text-zinc-900 dark:text-white"
                  placeholder="Enter new password"
                />
                <button 
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button 
              disabled={isProcessing || !currentPassword || !newPassword}
              onClick={handleUpdatePassword}
              className="w-full p-4 h-16 bg-accent text-white font-black uppercase tracking-[0.3em] text-base rounded-full border-b-8 border-accent/80 active:translate-y-2 active:border-b-0 transition-all shadow-xl shadow-accent/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? <RefreshCw className="animate-spin" size={20} /> : 'Update Password'}
            </button>
          </div>
        )}

        <button 
          onClick={() => setActiveSubMenu(null)}
          className="w-full mt-8 p-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-black uppercase tracking-[0.2em] text-xs rounded-full border-b-4 border-zinc-200 dark:border-zinc-900 active:translate-y-1 active:border-b-0 transition-all"
        >
          {t('cancel')}
        </button>
      </motion.div>
    );
  }

  if (activeSubMenu === 'connected_accounts') {
    const providers = auth.currentUser?.providerData || [];
    const isGoogleConnected = providers.some(p => p.providerId === 'google.com');

    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="pb-32 max-w-2xl mx-auto px-6 pt-12"
      >
        <div className="flex items-center gap-4 mb-10">
          <button 
            onClick={() => setActiveSubMenu(null)}
            className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-900 border-b-4 border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white active:translate-y-1 active:border-b-0 transition-all shadow-sm"
          >
            <ChevronRight className="rotate-180" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{t('connected_accounts')}</h1>
            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Manage secondary logins</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="p-6 bg-white dark:bg-zinc-900 border-b-4 border-zinc-200 dark:border-zinc-800 rounded-3xl flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-zinc-900 dark:text-white tracking-tight">Google Account</span>
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{isGoogleConnected ? 'Connected' : 'Not Linked'}</span>
            </div>
            {isGoogleConnected ? (
              <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20">
                <CheckCircle2 size={12} />
                <span className="text-[10px] font-black uppercase">Active</span>
              </div>
            ) : (
              <button 
                onClick={handleLinkGoogle}
                disabled={isProcessing}
                className="ml-auto text-[10px] font-black uppercase tracking-widest text-accent hover:underline disabled:opacity-50"
              >
                Link Account
              </button>
            )}
          </div>

          <div className="p-6 bg-white dark:bg-zinc-900 border-b-4 border-zinc-200 dark:border-zinc-800 rounded-3xl flex items-center gap-5 opacity-50">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <span className="text-xl font-bold text-zinc-400">f</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-zinc-900 dark:text-white tracking-tight">Facebook</span>
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Coming Soon</span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setActiveSubMenu(null)}
          className="w-full mt-10 p-4 h-16 bg-accent text-white font-black uppercase tracking-[0.3em] text-base rounded-full border-b-8 border-accent/80 active:translate-y-2 active:border-b-0 transition-all shadow-xl shadow-accent/20 sticky bottom-8"
        >
          {t('continue') || 'Continue'}
        </button>
      </motion.div>
    );
  }

  if (activeSubMenu === 'theme') {
    const themes = [
      { id: 'light', label: 'Light Mode', icon: Sun, color: 'text-amber-500', bg: 'bg-amber-500/10' },
      { id: 'dark', label: 'Dark Mode', icon: Moon, color: 'text-blue-500', bg: 'bg-blue-500/10' },
      { id: 'amoled', label: 'AMOLED Black', icon: Zap, color: 'text-accent', bg: 'bg-accent/10' }
    ];
    const selectedTheme = themes.find(t => t.id === theme) || themes[0];

    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="pb-32 max-w-2xl mx-auto px-6 pt-12"
      >
        <div className="flex items-center gap-4 mb-10">
          <button 
            onClick={() => setActiveSubMenu(null)}
            className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-900 border-b-4 border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white active:translate-y-1 active:border-b-0 transition-all shadow-sm"
          >
            <ChevronRight className="rotate-180" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{t('theme_mode')}</h1>
            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Switch up your look</p>
          </div>
        </div>

        <div className="mb-8">
          <SectionTitle>Active Style</SectionTitle>
          <div className="p-6 bg-white dark:bg-zinc-900 border-b-8 border-accent rounded-[2.5rem] flex items-center gap-5 shadow-xl transition-all">
            <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg", selectedTheme.bg)}>
              <selectedTheme.icon size={32} className={selectedTheme.color} strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-zinc-900 dark:text-white">{selectedTheme.label}</span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Current Theme</p>
            </div>
            <div className="ml-auto w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white shadow-lg">
              <CheckCircle2 size={18} />
            </div>
          </div>
        </div>

        <div className="mb-10">
          <SectionTitle>All Modes</SectionTitle>
          <div className="flex flex-col gap-3">
            {themes.map((t) => (
              <motion.div 
                key={t.id}
                whileTap={{ scale: 0.98, y: 2 }}
                onClick={() => {
                  if (t.id !== theme) onToggleTheme();
                }}
                className={cn(
                  "flex items-center gap-5 p-5 rounded-3xl border-b-4 transition-all cursor-pointer",
                  theme === t.id 
                    ? "bg-accent/5 border-accent text-accent ring-2 ring-accent/20" 
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                )}
              >
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm", t.bg)}>
                  <t.icon size={28} className={t.color} strokeWidth={2.5} />
                </div>
                <span className="text-lg font-black tracking-tight">{t.label}</span>
                {theme === t.id && (
                  <div className="ml-auto w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                    <CheckCircle2 size={14} className="text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        <button 
          onClick={() => setActiveSubMenu(null)}
          className="w-full p-4 h-16 bg-accent text-white font-black uppercase tracking-[0.3em] text-base rounded-full border-b-8 border-accent/80 active:translate-y-2 active:border-b-0 transition-all shadow-xl shadow-accent/20 sticky bottom-8"
        >
          Sounds Good
        </button>
      </motion.div>
    );
  }

  if (activeSubMenu === 'accentColor') {
    const colors = [
      { name: 'Indigo', hex: '#6366f1', bg: 'bg-[#6366f1]' },
      { name: 'Rose', hex: '#f43f5e', bg: 'bg-[#f43f5e]' },
      { name: 'Amber', hex: '#f59e0b', bg: 'bg-[#f59e0b]' },
      { name: 'Emerald', hex: '#10b981', bg: 'bg-[#10b981]' },
      { name: 'Blue', hex: '#3b82f6', bg: 'bg-[#3b82f6]' }
    ];
    const selectedColor = colors.find(c => c.hex === currentSettings.accentColor) || colors[0];

    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="pb-32 max-w-2xl mx-auto px-6 pt-12"
      >
        <div className="flex items-center gap-4 mb-10">
          <button 
            onClick={() => setActiveSubMenu(null)}
            className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-900 border-b-4 border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white active:translate-y-1 active:border-b-0 transition-all shadow-sm"
          >
            <ChevronRight className="rotate-180" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{t('accent_color')}</h1>
            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Pick your application vibe</p>
          </div>
        </div>

        <div className="mb-8">
          <SectionTitle>Current Vibe</SectionTitle>
          <div 
            className="p-5 rounded-[2rem] border-b-6 flex items-center gap-4 shadow-lg transition-all"
            style={{ backgroundColor: `${selectedColor.hex}15`, borderColor: selectedColor.hex }}
          >
            <div className="w-14 h-14 rounded-2xl shadow-md border-4 border-white dark:border-zinc-800" style={{ backgroundColor: selectedColor.hex }} />
            <div>
              <span className="text-lg font-black tracking-tight" style={{ color: selectedColor.hex }}>{selectedColor.name}</span>
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Active Theme Color</p>
            </div>
            <div className="ml-auto w-7 h-7 rounded-full flex items-center justify-center text-white shadow-md" style={{ backgroundColor: selectedColor.hex }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
        </div>

        <div className="mb-10">
          <SectionTitle>All Vibes</SectionTitle>
          <div className="grid grid-cols-1 gap-4">
            {colors.map((c) => (
              <motion.div 
                key={c.hex}
                whileTap={{ scale: 0.98, y: 2 }}
                onClick={() => onUpdateSettings({ accentColor: c.hex })}
                className={cn(
                  "flex items-center gap-5 p-5 rounded-3xl border-b-4 transition-all cursor-pointer",
                  currentSettings.accentColor === c.hex 
                    ? "bg-zinc-50 dark:bg-zinc-800/50 border-accent ring-2 ring-accent/20" 
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                )}
              >
                <div className="w-14 h-14 rounded-2xl shadow-md border-2 border-zinc-100 dark:border-zinc-700" style={{ backgroundColor: c.hex }} />
                <span className="text-lg font-black tracking-tight">{c.name}</span>
                {currentSettings.accentColor === c.hex && (
                  <div className="ml-auto w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                    <CheckCircle2 size={14} className="text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        <button 
          onClick={() => setActiveSubMenu(null)}
          className="w-full p-4 h-16 bg-accent text-white font-black uppercase tracking-[0.3em] text-base rounded-full border-b-8 border-accent/80 active:translate-y-2 active:border-b-0 transition-all shadow-xl shadow-accent/20 sticky bottom-8"
        >
          {t('continue') || 'Continue'}
        </button>
      </motion.div>
    );
  }

  if (activeSubMenu === 'language') {
    const selectedLang = languages.find(l => l.code === i18n.language) || languages[0];

    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="pb-32 max-w-2xl mx-auto px-6 pt-12"
      >
        <div className="flex items-center gap-4 mb-10">
          <button 
            onClick={() => setActiveSubMenu(null)}
            className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-900 border-b-4 border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white active:translate-y-1 active:border-b-0 transition-all shadow-sm"
          >
            <ChevronRight className="rotate-180" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{t('language_selector')}</h1>
            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Select your preferred language</p>
          </div>
        </div>

        <div className="mb-8">
          <SectionTitle>You Selected</SectionTitle>
          <div className="p-4 bg-accent/10 border-b-4 border-accent text-accent ring-2 ring-accent/20 rounded-[2rem] flex items-center gap-4 shadow-lg shadow-accent/10 transition-all">
            <div className="w-11 h-11 rounded-full bg-white dark:bg-zinc-800 shadow-inner flex items-center justify-center text-xl border-2 border-zinc-100 dark:border-zinc-700">
              {selectedLang.flag}
            </div>
            <span className="text-base font-black tracking-tight">{selectedLang.label}</span>
            <div className="ml-auto w-6 h-6 rounded-full bg-accent flex items-center justify-center border-b-2 border-accent/70">
              <CheckCircle2 size={14} className="text-white" />
            </div>
          </div>
        </div>

        <div className="mb-10">
          <SectionTitle>All Languages</SectionTitle>
          <div className="relative mb-6">
            <input 
              type="text"
              placeholder="Search language..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-4 pl-12 bg-white dark:bg-zinc-900 border-b-4 border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-bold text-zinc-900 dark:text-white placeholder-zinc-300 dark:placeholder-zinc-600 focus:outline-none focus:border-accent transition-all shadow-sm"
            />
            <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          </div>

          <div className="flex flex-col gap-3">
            {filteredLanguages.map((lang) => (
              <motion.div 
                key={lang.code}
                whileTap={{ scale: 0.98, y: 2 }}
                onClick={() => handleLanguageChange(lang.code)}
                className={cn(
                  "flex items-center gap-4 p-5 rounded-3xl border-b-4 transition-all cursor-pointer",
                  i18n.language === lang.code 
                    ? "bg-accent/5 border-accent text-accent ring-2 ring-accent/20" 
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                )}
              >
                <div className="w-12 h-12 rounded-full bg-white dark:bg-zinc-800 shadow-inner flex items-center justify-center text-2xl border-2 border-zinc-100 dark:border-zinc-700">
                  {lang.flag}
                </div>
                <span className="text-lg font-black tracking-tight">{lang.label}</span>
                {i18n.language === lang.code && (
                  <div className="ml-auto w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                    <CheckCircle2 size={14} className="text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        <button 
          onClick={() => setActiveSubMenu(null)}
          className="w-full p-4 h-16 bg-accent text-white font-black uppercase tracking-[0.3em] text-base rounded-full border-b-8 border-accent/80 active:translate-y-2 active:border-b-0 transition-all shadow-xl shadow-accent/20 sticky bottom-8"
        >
          {t('continue') || 'Continue'}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-32 max-w-2xl mx-auto px-4"
    >
      {/* Header Profile Section */}
      <div className="relative pt-12 pb-8 flex flex-col items-center text-center">
        <div className="absolute top-0 inset-x-0 h-40 bg-accent/20 blur-3xl -z-10" />
        
        <div className="relative group">
          <div className="absolute -inset-1 bg-accent rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
          <img 
            src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} 
            className="relative w-28 h-28 rounded-full border-4 border-white dark:border-zinc-900 shadow-2xl object-cover transition-transform group-hover:scale-105"
            alt="Profile"
          />
          <button 
            onClick={() => onUpdateUser({ avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random().toString(36).substring(7)}` })}
            className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform hover:brightness-110"
          >
            <Palette size={14} />
          </button>
        </div>

        <h1 className="mt-6 text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{user?.name || 'Explorer'}</h1>
        <div className="flex items-center gap-2 mt-2 px-4 py-1 bg-emerald-500/10 text-emerald-500 rounded-full">
          <CheckCircle2 size={12} />
          <span className="text-[10px] font-black uppercase tracking-widest leading-none">{user?.email || 'Guest'}</span>
        </div>
        <p className="mt-4 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
          Productivity Score: {productivityScore}
        </p>
      </div>

      {/* PROFILE SECTION */}
      <SectionTitle>{t('settings_profile')}</SectionTitle>
      
      <AnimatePresence mode="wait">
        {isEditingProfile ? (
          <motion.div 
            key="editing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-6 bg-white dark:bg-zinc-900 border-b-8 border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] mb-6 shadow-xl"
          >
            <div className="flex flex-col gap-6">
              <div>
                <label className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3 block">Display Name</label>
                <input 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-b-4 border-zinc-200 dark:border-zinc-700 rounded-2xl px-5 py-4 text-lg font-black focus:outline-none focus:border-accent transition-all text-zinc-900 dark:text-white"
                  placeholder="Enter your name"
                />
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    onUpdateUser({ name: editName });
                    setIsEditingProfile(false);
                  }}
                  className="flex-1 bg-accent text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-lg shadow-accent/20 border-b-4 border-accent/80 active:translate-y-1 active:border-b-0 transition-all text-sm"
                >
                  {t('save')}
                </button>
                <button 
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-black uppercase tracking-widest py-4 rounded-2xl border-b-4 border-zinc-200 dark:border-zinc-900 active:translate-y-1 active:border-b-0 transition-all text-sm"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-1"
          >
            <SettingRow 
              icon={User} 
              label={t('personal_info')} 
              value={user?.name || 'Explorer'} 
              onClick={() => setIsEditingProfile(true)} 
              color="blue"
            />
            <SettingRow 
              icon={Lock} 
              label={t('security_password')} 
              value="Manage access" 
              color="amber" 
              onClick={() => setActiveSubMenu('security_password')}
            />
            <SettingRow 
              icon={Smartphone} 
              label={t('connected_accounts')} 
              value="Google Connected" 
              color="purple" 
              onClick={() => setActiveSubMenu('connected_accounts')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-28 inset-x-6 z-50 pointer-events-none"
          >
            <div className={cn(
              "p-4 rounded-2xl border-b-4 shadow-xl flex items-center gap-3 backdrop-blur-md pointer-events-auto",
              message.type === 'success' ? "bg-emerald-500/90 border-emerald-700 text-white" :
              message.type === 'error' ? "bg-rose-500/90 border-rose-700 text-white" :
              "bg-blue-500/90 border-blue-700 text-white"
            )}>
              {message.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
              <span className="text-xs font-bold leading-tight flex-1">{message.text}</span>
              <button onClick={() => setMessage(null)} className="p-1 hover:bg-black/10 rounded-lg transition-colors">
                <ChevronRight size={14} className="rotate-90" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-4 mt-2">
        <button 
          onClick={handleVerifyEmail}
          disabled={isProcessing || auth.currentUser?.emailVerified}
          className="flex-1 p-4 rounded-3xl bg-white dark:bg-zinc-900 border-b-4 border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-accent transition-all active:translate-y-1 active:border-b-0 shadow-sm disabled:opacity-50"
        >
          {auth.currentUser?.emailVerified ? 'Verified ✓' : t('verify_email')}
        </button>
        <button 
          onClick={handleDeleteData}
          disabled={isProcessing}
          className="flex-1 p-4 rounded-3xl bg-white dark:bg-zinc-900 border-b-4 border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-rose-500 transition-all active:translate-y-1 active:border-b-0 shadow-sm disabled:opacity-50"
        >
          {t('delete_data')}
        </button>
      </div>

      {/* GENERAL SETTINGS */}
      <SectionTitle>{t('settings_general')}</SectionTitle>
      <SettingRow 
        icon={Globe} 
        label={t('language_selector')} 
        value={languages.find(l => l.code === i18n.language)?.label || 'English'} 
        onClick={() => setActiveSubMenu('language')}
        color="blue"
      />

      <SettingRow 
        icon={theme === 'amoled' ? Moon : theme === 'dark' ? Moon : Sun} 
        label={t('theme_mode')} 
        value={theme.toUpperCase()} 
        onClick={() => setActiveSubMenu('theme')}
        color="amber"
      />

      <SettingRow 
        icon={Palette} 
        label={t('accent_color')} 
        subtext="Pick your vibes"
        value={
          currentSettings.accentColor === '#6366f1' ? 'Indigo' :
          currentSettings.accentColor === '#f43f5e' ? 'Rose' :
          currentSettings.accentColor === '#f59e0b' ? 'Amber' :
          currentSettings.accentColor === '#10b981' ? 'Emerald' :
          currentSettings.accentColor === '#3b82f6' ? 'Blue' : 'Custom'
        }
        onClick={() => setActiveSubMenu('accentColor')}
      />

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
      <div className="flex flex-col gap-1">
        <SettingRow icon={Timer} label="Pomodoro Work" value={`${currentSettings.productivity?.pomoWork} mins`} color="rose" />
        <SettingRow icon={Droplets} label="Water Target" value={`${currentSettings.productivity?.waterTarget} glasses`} color="blue" />
        <SettingRow icon={RefreshCw} label="Habit Tracking" value="Cloud Sync Active" color="emerald" />
      </div>

      {/* AI ASSISTANT */}
      <SectionTitle>{t('settings_ai')}</SectionTitle>
      <div className="p-8 bg-accent rounded-[3rem] mb-6 shadow-xl shadow-accent/20 relative overflow-hidden group border-b-8 border-accent/80 active:translate-y-1 active:border-b-0 transition-all cursor-pointer">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
          <Brain size={140} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-5 mb-8">
            <div className="w-16 h-16 rounded-[1.5rem] bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg">
              <Bot size={32} className="text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">Benjie AI</h3>
              <p className="text-white/80 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Smarter Productivity</p>
            </div>
          </div>
          <div className="flex flex-col gap-4">
             <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl border border-white/20">
                <span className="text-white text-sm font-black tracking-tight">Smart Sorting</span>
                <Toggle active={currentSettings.notifications?.aiAssistant} onToggle={() => handleNestedToggle('notifications', 'aiAssistant', !currentSettings.notifications?.aiAssistant)} />
             </div>
             <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl border border-white/20">
                <span className="text-white text-sm font-black tracking-tight">Auto Schedules</span>
                <Toggle active={true} onToggle={() => {}} />
             </div>
          </div>
        </div>
      </div>

      {/* SPECIAL CAMBODIAN FEATURES */}
      <SectionTitle>{t('settings_localized')}</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          whileTap={{ scale: 0.95, y: 2 }}
          className="p-6 bg-white dark:bg-zinc-900 border-b-4 border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] flex flex-col items-center gap-4 transition-all active:border-b-0"
        >
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-sm">
            <Calendar size={28} strokeWidth={2.5} />
          </div>
          <span className="text-xs font-black uppercase text-center tracking-widest leading-tight text-zinc-900 dark:text-white">Khmer Holiday<br/>Calendar</span>
        </motion.div>
        <motion.div 
          whileTap={{ scale: 0.95, y: 2 }}
          className="p-6 bg-white dark:bg-zinc-900 border-b-4 border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] flex flex-col items-center gap-4 transition-all active:border-b-0"
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-sm">
            <Quote size={28} strokeWidth={2.5} />
          </div>
          <span className="text-xs font-black uppercase text-center tracking-widest leading-tight text-zinc-900 dark:text-white">Khmer Daily<br/>Quotes</span>
        </motion.div>
      </div>

      {/* SECURITY */}
      <SectionTitle>{t('settings_security')}</SectionTitle>
      <div className="flex flex-col gap-1">
        <SettingRow icon={Fingerprint} label="Face ID / Touch ID" color="emerald">
          <Toggle active={currentSettings.security?.faceIdEnabled} onToggle={() => handleNestedToggle('security', 'faceIdEnabled', !currentSettings.security?.faceIdEnabled)} />
        </SettingRow>
        <SettingRow icon={Shield} label="Two-Factor Auth" value="Manage" color="blue" />
      </div>

      {/* SUPPORT */}
      <SectionTitle>{t('settings_support')}</SectionTitle>
      <div className="flex flex-col gap-1">
        <SettingRow icon={HelpCircle} label="Help Center" color="zinc" />
        <SettingRow icon={Bug} label="Report a Bug" color="zinc" />
        <SettingRow icon={FileText} label="Terms & Privacy" color="zinc" />
        <SettingRow icon={Info} label="About DayFlow" value="Version 2.4.0 (Gold)" color="zinc" />
      </div>

      {/* LOGOUT */}
      <button 
        onClick={onLogout}
        className="w-full mt-10 p-4 rounded-3xl bg-rose-500 text-white font-black uppercase tracking-[0.3em] text-xs transition-all active:translate-y-1 active:border-b-0 border-b-8 border-rose-700 shadow-xl shadow-rose-500/20 mb-10"
      >
        <div className="flex items-center justify-center gap-3">
          <LogOut size={18} strokeWidth={3} />
          {t('logout')}
        </div>
      </button>

      {/* Developer Credit */}
      <div className="text-center py-12 opacity-30 select-none">
        <div className="flex items-center justify-center gap-2 mb-2">
           <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center font-bold text-white text-[10px]">DF</div>
           <h2 className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-white">DayFlow.</h2>
        </div>
        <p className="text-[8px] font-bold uppercase tracking-[1em] mb-1">Built for Gen Z</p>
        <p className="text-[7px] font-black uppercase tracking-[0.2em]">Developed by Sokhavy Thoeun</p>
      </div>
    </motion.div>
  );
}

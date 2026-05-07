import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Globe, Moon, Shield, Info, LogOut, Code, ChevronRight, Star, User, Check, Sun, Camera, X, ShieldCheck, FileText, Lock, Eye, Zap, Scale } from 'lucide-react';
import { cn } from '../lib/utils';

interface ProfileProps {
  user?: any;
  onLogout?: () => void;
  onUpdateUser?: (data: any) => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

export default function Profile({ user, onLogout, onUpdateUser, isDarkMode, onToggleTheme }: ProfileProps) {
  const { t, i18n } = useTranslation();
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showLanguagePopup, setShowLanguagePopup] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateName = async () => {
    if (!newName.trim() || newName === user?.name) {
      setIsEditingName(false);
      return;
    }

    try {
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, name: newName })
      });
      if (res.ok) {
        onUpdateUser?.({ name: newName });
        setIsEditingName(false);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          const res = await fetch('/api/user/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: user.id, avatar: base64String })
          });
          if (res.ok) {
            onUpdateUser?.({ avatar: base64String });
          }
        } catch (error) {
          console.error(error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const languages = [
    { code: 'en', label: t('english'), native: 'English', icon: '🇺🇸' },
    { code: 'kh', label: t('khmer'), native: 'ភាសាខ្មែរ', icon: '🇰🇭' },
    { code: 'zh', label: t('chinese'), native: '中文', icon: '🇨🇳' },
    { code: 'fr', label: t('french'), native: 'Français', icon: '🇫🇷' },
    { code: 'es', label: t('spanish'), native: 'Español', icon: '🇪🇸' },
  ];

  const sections = [
    {
      title: t('settings'),
      items: [
        { 
          id: 'lang', 
          icon: Globe, 
          label: t('language'), 
          value: languages.find(l => l.code === i18n.language)?.native || 'English', 
          onClick: () => setShowLanguagePopup(true),
          hasArrow: true
        },
        { 
          id: 'theme', 
          icon: isDarkMode ? Moon : Sun, 
          label: isDarkMode ? t('theme_dark') : t('theme_light'), 
          onClick: onToggleTheme,
          switch: true 
        },
      ]
    },
    {
      title: t('preferences'),
      items: [
        { id: 'privacy', icon: Shield, label: 'Privacy Policy', onClick: () => setShowPrivacy(true) },
        { id: 'terms', icon: FileText, label: 'Terms of Service', onClick: () => setShowTerms(true) },
      ]
    },
    {
      title: 'About',
      items: [
        { id: 'dev', icon: Code, label: 'Developer', value: 'Sokhavy Thoeun' },
        { id: 'version', icon: Info, label: 'Version', value: '2.0.1' },
      ]
    }
  ];

  const Modal = ({ isOpen, onClose, title, icon: Icon, children }: { isOpen: boolean, onClose: () => void, title: string, icon: any, children: React.ReactNode }) => (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
        >
          <motion.div 
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="p-8 pb-4 flex items-center justify-between border-b border-zinc-100 dark:border-white/5 bg-white dark:bg-zinc-900 z-10 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-none">{title}</h2>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest mt-1">Last Updated: May 2026</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 active:scale-95 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 pt-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed space-y-6 font-medium">
                {children}
              </div>
            </div>

            <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-white/5 flex justify-center transition-colors">
               <button 
                onClick={onClose}
                className="px-12 py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
               >
                 I Understand
               </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const avatarSrc = user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`;

  return (
    <div className="space-y-8 pb-8 transition-colors duration-500">
      {/* Tab Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">{t('profile')}</h1>
        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
          <User className="w-6 h-6" />
        </div>
      </div>
      
      {/* Language Popup */}
      <AnimatePresence>
        {showLanguagePopup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowLanguagePopup(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-white/5 w-full max-w-[280px] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-zinc-100 dark:border-white/5 text-center">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t('language')}</span>
              </div>
              <div className="p-2 space-y-1">
                {languages.map((lang) => {
                  const isSelected = i18n.language === lang.code;
                  return (
                    <button 
                      key={lang.code}
                      onClick={() => { i18n.changeLanguage(lang.code); setShowLanguagePopup(false); }}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300",
                        isSelected ? "bg-indigo-500 text-white" : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{lang.icon}</span>
                        <span className="font-bold text-sm">{lang.native}</span>
                      </div>
                      {isSelected && <Check size={16} />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals for Privacy/Terms */}
      <Modal 
        isOpen={showPrivacy} 
        onClose={() => setShowPrivacy(false)} 
        title="Privacy Policy"
        icon={ShieldCheck}
      >
        <div className="space-y-8">
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
              <Eye size={18} className="text-indigo-500" />
              <h3 className="font-bold text-base">1. Introduction</h3>
            </div>
            <p>Welcome to DayFlow ("we," "our," or "us"). We highly value your trust and are committed to protecting your personal information. This Privacy Policy outlines how we collect, use, and safeguard your data when you interact with our productivity and coaching platform.</p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
              <Lock size={18} className="text-indigo-500" />
              <h3 className="font-bold text-base">2. Information We Collect</h3>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-zinc-800 dark:text-zinc-200 font-bold text-sm">A. Personal Identification Information</h4>
                <p>We may collect names, email addresses, and profile pictures when users register or update their profiles. This data is used solely for account identification and personalization.</p>
              </div>
              <div>
                <h4 className="text-zinc-800 dark:text-zinc-200 font-bold text-sm">B. Productivity Data</h4>
                <p>Tasks, habits, focus logs, and mood entries are stored to provide analytics and coaching insights. This data is private to your account.</p>
              </div>
              <div>
                <h4 className="text-zinc-800 dark:text-zinc-200 font-bold text-sm">C. Technical Data</h4>
                <p>We collect browser type, IP addresses (anonymized), and device information to optimize performance and prevent fraudulent activity.</p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
              <Shield size={18} className="text-indigo-500" />
              <h3 className="font-bold text-base">3. Data Sharing & Third Parties</h3>
            </div>
            <p>We do not sell your personal data. We only share information with third-party service providers (like Firebase for authentication) as necessary to operate the application. All third-party providers are vetted for high security standards.</p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
              <Zap size={18} className="text-indigo-500" />
              <h3 className="font-bold text-base">4. Your Rights</h3>
            </div>
            <p>Under GDPR and other privacy laws, you have the right to access, rectify, or delete your data. You can export your productivity history or delete your entire account through the settings provided in this dashboard.</p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
              <Info size={18} className="text-indigo-500" />
              <h3 className="font-bold text-base">5. Contact Us</h3>
            </div>
            <p>If you have any questions about this Privacy Policy, please contact our support team at support@dayflow.app.</p>
          </section>
        </div>
      </Modal>

      <Modal 
        isOpen={showTerms} 
        onClose={() => setShowTerms(false)} 
        title="Terms of Service"
        icon={FileText}
      >
        <div className="space-y-8">
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
              <Scale size={18} className="text-indigo-500" />
              <h3 className="font-bold text-base">Agreement to Terms</h3>
            </div>
            <p>By using DayFlow, you agree to comply with and be bound by these legal terms. If you do not agree, please discontinue use immediately.</p>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider underline">1. Use of Service</h3>
              <p className="mt-2 text-xs">DayFlow provides productivity tools and AI coaching. You agree to use the service only for lawful purposes. You are responsible for maintaining the confidentiality of your login credentials.</p>
            </div>

            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider underline">2. Subscription & Payments</h3>
              <p className="mt-2 text-xs">Some features may require a premium subscription. All payments are processed securely. Cancellation can be performed at any time from your account management page.</p>
            </div>

            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider underline">3. Intellectual Property</h3>
              <p className="mt-2 text-xs">All software, designs, algorithms, and content provided by DayFlow are the property of Sokhavy Thoeun or its licensors. You may not copy, modify, or redistribute any part of the service.</p>
            </div>

            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider underline">4. Termination</h3>
              <p className="mt-2 text-xs">We reserve the right to terminate or suspend access to our service immediately, without prior notice, for any breach of these Terms.</p>
            </div>

            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider underline">5. Modifications</h3>
              <p className="mt-2 text-xs">We reserve the right to change these terms at any time. Your continued use of the app after changes are posted constitutes acceptance of the new terms.</p>
            </div>
          </section>
        </div>
      </Modal>

      {/* Profile Header */}
      <div className="flex flex-col items-center justify-center space-y-4 py-4">
        <div className="relative group/avatar">
          <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-purple-600 p-1 shadow-lg">
            <div className="w-full h-full rounded-[1.8rem] bg-white dark:bg-zinc-900 p-1 transition-colors overflow-hidden relative shadow-inner">
              <img 
                src={avatarSrc} 
                alt="Profile" 
                className="w-full h-full rounded-[1.6rem] object-cover"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-[2px]"
              >
                <Camera className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />

          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 flex items-center justify-center text-sm shadow-xl transition-colors">
             <Star className="w-4 h-4 text-amber-400 fill-current" />
          </div>
        </div>
        
        <div className="text-center w-full max-w-[200px] mx-auto">
          {isEditingName ? (
            <div className="flex flex-col gap-2">
              <input 
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-indigo-500 rounded-xl px-4 py-2 text-zinc-900 dark:text-white text-center font-bold focus:outline-none transition-colors shadow-inner"
              />
              <div className="flex gap-2">
                <button 
                  onClick={handleUpdateName}
                  className="flex-1 py-3 bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                >
                  Save
                </button>
                <button 
                  onClick={() => { setIsEditingName(false); setNewName(user?.name); }}
                  className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-xl text-xs font-bold transition-all border border-zinc-200 dark:border-white/5 active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center group">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                {user?.name || 'Guest User'}
                <button 
                  onClick={() => setIsEditingName(true)}
                  className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-zinc-200 dark:border-white/5"
                >
                  <User size={14} className="text-zinc-500" />
                </button>
              </h1>
              <p className="text-zinc-400 font-medium text-sm">{user?.email || 'guest@dayflow.app'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Profile Sections */}
      <div className="space-y-6 px-1">
        {sections.map((section) => (
          <div key={section.title} className="space-y-3">
            <h2 className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-[0.2em] px-4">{section.title}</h2>
            <div className="bg-white dark:bg-zinc-800/40 border border-zinc-200 dark:border-white/5 rounded-[2rem] overflow-hidden shadow-sm transition-colors backdrop-blur-sm">
              {section.items.map((item, idx) => (
                <button
                  key={item.id}
                  //@ts-ignore
                  onClick={item.onClick}
                  className={cn(
                    "w-full flex items-center justify-between p-4 px-6 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors active:bg-zinc-100 dark:active:bg-zinc-700",
                    idx !== section.items.length - 1 && "border-b border-zinc-100 dark:border-white/5"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/5 flex items-center justify-center transition-colors">
                      <item.icon className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                    </div>
                    <span className="font-bold text-[15px] text-zinc-900 dark:text-zinc-100">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {item.value && <span className="text-sm text-zinc-400 dark:text-zinc-500 font-medium">{item.value}</span>}
                    {item.switch ? (
                      <div className={cn(
                        "w-12 h-6 rounded-full relative flex items-center transition-all px-1 shadow-inner",
                        isDarkMode ? "bg-indigo-500" : "bg-zinc-200 dark:bg-zinc-700"
                      )}>
                        <motion.div 
                          animate={{ x: isDarkMode ? 24 : 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="w-4 h-4 rounded-full bg-white shadow-md" 
                        />
                      </div>
                    ) : item.hasArrow ? (
                      <ChevronRight className="w-5 h-5 text-zinc-300 dark:text-zinc-700 rotate-90" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-zinc-300 dark:text-zinc-700" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-3 p-5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-[2rem] active:scale-95 transition-all shadow-lg shadow-rose-500/20"
        >
          <LogOut className="w-5 h-5" />
          <span>Log Out</span>
        </button>
      </div>

      <footer className="text-center pt-8 opacity-30 text-[10px] font-bold uppercase tracking-widest text-zinc-500 space-y-1">
        <p>DayFlow © 2026</p>
        <p>Built with ❤️ by Sokhavy Thoeun</p>
      </footer>
    </div>
  );
}

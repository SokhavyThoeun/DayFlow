import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { History, Frown, Meh, Smile, Heart, Star, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { MoodEntry } from '../types';
import { collection, query, where, onSnapshot, orderBy, limit, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export default function MoodTracker() {
  const { t } = useTranslation();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [history, setHistory] = useState<MoodEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  const moods = [
    { id: 'sad', icon: Frown, label: 'Low', color: 'text-blue-400' },
    { id: 'neutral', icon: Meh, label: 'Neutral', color: 'text-zinc-500' },
    { id: 'happy', icon: Smile, label: 'Good', color: 'text-emerald-400' },
    { id: 'love', icon: Heart, label: 'Great', color: 'text-rose-400' },
    { id: 'awesome', icon: Zap, label: 'Energetic', color: 'text-amber-400' },
  ];

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'moods'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const moodData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MoodEntry[];
      setHistory(moodData);
    });

    return () => unsubscribe();
  }, []);

  const handleSaveMood = async () => {
    if (!selectedMood || !auth.currentUser) return;
    setIsSaving(true);
    try {
      const moodRef = doc(collection(db, 'moods'));
      await setDoc(moodRef, {
        userId: auth.currentUser.uid,
        emoji: selectedMood,
        timestamp: serverTimestamp()
      });
      setSelectedMood(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };

  return (
    <div className="space-y-8 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">{t('mood')}</h1>
        <History className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
      </div>

      {/* Main Selector */}
      <section className="bg-white dark:bg-zinc-800/40 border border-zinc-200 dark:border-white/5 p-8 rounded-[2.5rem] flex flex-col items-center gap-8 shadow-xl dark:backdrop-blur-xl">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white text-center leading-snug">How are you feeling<br/>at this moment?</h2>
        
        <div className="flex justify-between w-full px-2">
          {moods.map((m) => {
            const Icon = m.icon;
            const isActive = selectedMood === m.id;
            return (
              <button 
                key={m.id}
                onClick={() => setSelectedMood(m.id)}
                className={cn(
                  "group relative flex flex-col items-center gap-3 transition-all duration-300",
                  isActive ? "scale-110" : "opacity-40 hover:opacity-100"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                  isActive 
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                    : "bg-zinc-50 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500"
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className={cn("text-[10px] font-bold uppercase tracking-widest", isActive ? "text-indigo-500 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-600")}>
                  {m.label}
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="mood-active-indicator"
                    className="absolute -bottom-2 w-1 h-1 rounded-full bg-indigo-400"
                  />
                )}
              </button>
            );
          })}
        </div>

        <button 
          disabled={!selectedMood || isSaving}
          onClick={handleSaveMood}
          className="w-full py-4 bg-indigo-500 disabled:opacity-30 disabled:grayscale text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {isSaving && <Star className="w-4 h-4 animate-spin" />}
          {t('save')}
        </button>
      </section>

      {/* Recent History (Cleaned Emojis) */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] px-2">Recent Logs</h3>
        <div className="space-y-3">
          {history.length === 0 && (
            <div className="text-center py-8 text-zinc-400 text-sm italic">No entries yet</div>
          )}
          {history.map((entry) => {
            const mood = moods.find(m => m.id === entry.emoji) || moods[2];
            const Icon = mood.icon;
            return (
              <div key={entry.id} className="bg-white dark:bg-zinc-800/40 border border-zinc-200 dark:border-white/5 p-4 rounded-2xl flex items-center justify-between shadow-sm dark:shadow-none">
                <div className="flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-zinc-50 dark:bg-zinc-800")}>
                    <Icon className={cn("w-5 h-5", mood.color)} />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900 dark:text-zinc-100">{mood.label}</p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-wider">{formatDate(entry.timestamp)}</p>
                  </div>
                </div>
                <Star className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

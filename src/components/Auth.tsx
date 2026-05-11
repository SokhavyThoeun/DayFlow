import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles, LogIn } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface AuthProps {
  onLogin: (user: any) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;
      
      const userDocRef = doc(db, 'users', fbUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        const newUser = {
          id: fbUser.uid,
          uid: fbUser.uid,
          name: fbUser.displayName || 'User',
          email: fbUser.email,
          avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fbUser.uid}`,
          lastMood: 'neutral',
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, newUser);
      }
    } catch (err: any) {
      if (err.code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with the same email address but different sign-in credentials. Try signing in again.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = result.user;
        await updateProfile(fbUser, { displayName: name });
        
        // Create profile in Firestore
        const newUser = {
          id: fbUser.uid,
          uid: fbUser.uid,
          name: name,
          email: fbUser.email,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${fbUser.uid}`,
          lastMood: 'neutral',
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', fbUser.uid), newUser);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex flex-col items-center justify-center p-6 pb-12 transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-500/20">
            <Sparkles className="text-white w-10 h-10" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">DayFlow</h1>
            <p className="text-zinc-500 font-medium">Plan Your Day, Flow Your Life</p>
          </div>
        </div>

        <div className="space-y-3">
          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 text-zinc-900 dark:text-white font-bold py-3.5 rounded-2xl shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            Continue with Google
          </button>

          <div className="flex items-center gap-4 py-1">
            <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Or with email</span>
            <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <input 
                type="text" required value={name} onChange={e => setName(e.target.value)}
                placeholder="Full Name" 
                className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 rounded-2xl py-4 px-6 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            )}
            <input 
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Email" 
              className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 rounded-2xl py-4 px-6 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <input 
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Password" 
              className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 rounded-2xl py-4 px-6 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
            
            {error && <p className="text-rose-500 text-[10px] font-bold text-center px-4 leading-tight">{error}</p>}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
              {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
        </div>

        <p className="text-center text-zinc-500 text-sm font-medium">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-500 dark:text-indigo-400 font-bold ml-2 hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}

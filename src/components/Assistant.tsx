import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Send, Sparkles, User, Bot, Loader2, ArrowRight, Plus, Calendar, Clock, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { Message, TaskCategory, TaskPriority } from '../types';
import { getCoachResponse } from '../services/ai';

interface AssistantProps {
  onAddTask?: (task: any) => void;
}

interface TaskSuggestionCardProps {
  suggestion: any;
  onAddTask?: (task: any) => void;
  key?: React.Key;
}

const TaskSuggestionCard: React.FC<TaskSuggestionCardProps> = ({ suggestion, onAddTask }) => {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAddTask?.({
      title: suggestion.title,
      category: suggestion.category as TaskCategory,
      priority: suggestion.priority as TaskPriority,
      deadline: new Date().toISOString()
    });
    setAdded(true);
  };

  return (
    <div className="bg-white/10 p-3 rounded-2xl border border-white/10 space-y-2 group">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest bg-indigo-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1">
          <Clock size={10} />
          {suggestion.time}
        </span>
        <button 
          disabled={added}
          onClick={handleAdd}
          className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
            added ? "bg-emerald-500 text-white" : "bg-white/10 hover:bg-indigo-500 text-white"
          )}
        >
          {added ? <Check size={14} /> : <Plus size={14} />}
        </button>
      </div>
      <div>
        <p className="font-bold text-white text-sm">{suggestion.title}</p>
        <p className="text-[10px] text-zinc-300 line-clamp-1">{suggestion.reason}</p>
      </div>
    </div>
  );
};

interface MessageBubbleProps {
  msg: Message;
  onAddTask?: (task: any) => void;
  key?: React.Key;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ msg, onAddTask }) => {
  let planData = null;
  try {
    if (msg.sender === 'ai' && msg.text.startsWith('{')) {
      planData = JSON.parse(msg.text);
    }
  } catch (e) {}

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={cn(
        "flex items-end gap-2 max-w-[90%]",
        msg.sender === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      <div className={cn(
        "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center",
        msg.sender === 'user' ? "bg-zinc-100 dark:bg-zinc-800" : "bg-indigo-500/20"
      )}>
        {msg.sender === 'user' ? (
          <User className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
        ) : (
          <Bot className="w-4 h-4 text-indigo-400" />
        )}
      </div>
      <div className={cn(
        "p-4 rounded-3xl text-sm leading-relaxed",
        msg.sender === 'user' 
          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-br-none" 
          : "bg-indigo-500 text-white rounded-bl-none shadow-lg shadow-indigo-500/10"
      )}>
        {planData ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4" />
              <span className="font-bold">Suggested Daily Plan</span>
            </div>
            <p className="italic text-indigo-100">{planData.intro}</p>
            <div className="space-y-2">
              {planData.suggestions.map((s: any, i: number) => (
                <TaskSuggestionCard key={i} suggestion={s} onAddTask={onAddTask} />
              ))}
            </div>
            <p className="text-xs text-indigo-100 mt-2">{planData.outro}</p>
          </div>
        ) : (
          msg.text
        )}
      </div>
    </motion.div>
  );
};

export default function Assistant({ onAddTask }: AssistantProps) {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: t('assistant_greeting'), sender: 'ai', timestamp: new Date().toISOString() }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    const initialPrompt = localStorage.getItem('assistant_initial_prompt');
    if (initialPrompt) {
      handleSend(initialPrompt);
      localStorage.removeItem('assistant_initial_prompt');
    }
  }, []);

  const handleSend = async (textOverride?: string) => {
    const text = textOverride || inputValue;
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    if (!textOverride) setInputValue('');
    setIsTyping(true);

    try {
      const response = await getCoachResponse(text, { locale: i18n.language });
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const suggestions = [
    { label: t('plan_my_day'), icon: ArrowRight },
    { label: "I feel unmotivated", icon: ArrowRight },
    { label: t('improve_task'), icon: ArrowRight },
  ];

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col pt-2">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">FlowCoach AI</h1>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest">Always Listening</span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 px-1 pb-4 scrollbar-hide"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} onAddTask={onAddTask} />
          ))}
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="bg-indigo-500 text-white p-3 rounded-3xl rounded-bl-none">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="mt-4 space-y-4">
        {/* Suggestion Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {suggestions.map((s) => (
            <button 
              key={s.label}
              onClick={() => handleSend(s.label)}
              className="whitespace-nowrap px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-full text-xs font-bold text-zinc-400 dark:text-zinc-500 hover:text-indigo-500 dark:hover:text-white transition-colors flex items-center gap-2 shadow-sm"
            >
              {s.label}
              <s.icon className="w-3 h-3" />
            </button>
          ))}
        </div>

        <div className="relative">
          <input 
            type="text"
            value={inputValue}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-full py-4 pl-6 pr-14 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors shadow-2xl dark:shadow-none"
          />
          <button 
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="absolute right-2 top-2 w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white disabled:opacity-50 disabled:grayscale active:scale-90 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

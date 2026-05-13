export enum TaskCategory {
  STUDY = "study",
  WORK = "work",
  BUSINESS = "business",
  PERSONAL = "personal"
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high"
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  location?: string;
  category: TaskCategory;
  priority: TaskPriority;
  deadline?: string; // ISO string
  isCompleted: boolean;
  createdAt: string;
  userId: string;
}

export interface Habit {
  id: string;
  title: string;
  time?: string; // HH:mm format
  history: string[]; // ISO string dates (YYYY-MM-DD)
  streak: number;
  userId: string;
  createdAt: string;
}

export interface MoodEntry {
  id: string;
  emoji: string;
  note?: string;
  timestamp: string;
  userId: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  xp: number;
  level: number;
  streak: number;
  language: 'en' | 'kh';
  theme: 'dark' | 'light';
  developer: string; // Sokhavy Thoeun
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
}

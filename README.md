# DayFlow - Smart Productivity for Gen Z Cambodia

DayFlow is a smart daily life management app designed for the vibrant youth of Cambodia. Built by **Sokhavy Thoeun**, it combines task management, habit tracking, mood analysis, and an AI-powered life coach.

## 🚀 Features
- **Smart AI Coach**: Personalized productivity advice integrated with Gemini AI.
- **Planner**: Manage tasks with priorities and categories (Study, Business, etc.).
- **Habit Tracker**: Build consistency with streaks and gamified progress.
- **Mood Insights**: Emoji-based logging to track your mental well-being.
- **Focus Mode**: Pomodoro-style timer with ambient sounds.
- **i18n Support**: Full Khmer (ភាសាខ្មែរ) and English support.

## 🛠 Tech Stack
- **Frontend**: React + Vite + Tailwind CSS + Framer Motion
- **Backend**: Node.js + Express
- **AI**: Google Gemini API
- **State/i18n**: i18next
- **Animations**: Motion

## 📦 Deployment Guide

### Backend (Render / Railway / Cloud Run)
1. Set the environment variable `GEMINI_API_KEY` in your provider dashboard.
2. Ensure the `PORT` is set to `3000` or use the default provided by the environment.
3. Deploy using the `npm run build` and `npm start` commands.

### Frontend / App (Expo / Mobile)
1. To convert this to a mobile app, use **Expo**:
   ```bash
   npx create-expo-app DayFlow --template tabs
   ```
2. Copy the components and logic from the `src/` directory.
3. Use `react-native-reanimated` for similar animations.
4. Use `expo-localization` for the language switching logic.

### Android & iOS Store (EAS Build)
1. Install EAS CLI: `npm install -g eas-cli`
2. Configure project: `eas build:configure`
3. Run build: `eas build --platform android` or `eas build --platform ios`
4. Follow the prompts to generate credentials and submit to the stores.

## 👤 Credits
**Developed by Sokhavy Thoeun**
Designed with ❤️ for the Cambodian Gen Z community.

# 🌱 HabitFlow — Gentle Persistence Habit Tracker

> Build better habits, one day at a time. A calming, distraction-free Progressive Web App (PWA) built with React, TypeScript, Tailwind CSS, and Firebase.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-habitflow--2a53e.web.app-006398?style=for-the-badge&logo=firebase)](https://habitflow-2a53e.web.app)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore-FFCA28?style=flat&logo=firebase)](https://firebase.google.com/)

---

## 🌐 Live Application

- **Live URL**: [https://habitflow-2a53e.web.app](https://habitflow-2a53e.web.app)
- **Installable PWA**: Open the URL on mobile Chrome/Safari or Desktop and click **"Install App"** to add HabitFlow directly to your Home Screen.

---

## ✨ Features

- **Single Responsive PWA**: One unified codebase serving both as a responsive desktop website and an installable mobile app with native bottom navigation.
- **Real-Time Data Sync & Offline Persistence**: Sub-second synchronization across all open devices powered by Cloud Firestore `onSnapshot` listeners and multi-tab IndexedDB cache.
- **Daily Habits Matrix Grid**:
  - Full 1–31 day matrix with weekday letters and highlighted today column.
  - Sticky habit header column with flame streak counter and target counts.
  - 0ms optimistic check-in toggling.
- **Weekly & Monthly Habit Views**:
  - Weekly view with Weeks 1–5 check columns and monthly progress percentages.
  - Monthly view with milestone progress bars and completion trackers.
- **Add / Edit Habit Modal**:
  - Responsive mobile bottom-sheet & centered desktop dialog.
  - Frequency switcher (`Daily`, `Weekly`, `Monthly`), goal counter stepper, 6-color swatch palette, and curated 10-icon Material Symbols grid.
  - Non-destructive soft-delete archiving to preserve historic data.
- **Habit Detail & Calendar Heatmap (`/habit/:id`)**:
  - Interactive 7-column monthly activity heatmap.
  - Key statistics: Active streak, all-time best streak, monthly rate, and total lifetime check-ins.
- **Settings & User Preferences (`/settings`)**:
  - Live Firestore connection sync status indicator.
  - Dark / Light theme toggle.
  - One-click JSON data export of all habits and check-in history.
  - Secure authentication sign-out.
- **100% Automated Unit Test Suite**:
  - 18 Vitest tests covering streak algorithms, mid-month creation, missed days, and month boundary transitions.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 18 + TypeScript |
| **Build Tool & Bundler** | Vite 5 |
| **Styling** | Tailwind CSS (Custom "Calm Momentum" Design Tokens) |
| **PWA & Offline Caching**| `vite-plugin-pwa` + Workbox |
| **Backend & Database** | Firebase Authentication & Cloud Firestore |
| **Testing** | Vitest |
| **Hosting** | Firebase Hosting |

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 2. Installation
```bash
# Clone repository or navigate to directory
cd HabitFlow

# Install dependencies
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### 5. Run Unit Tests
```bash
npx vitest run
```

---

## 🚢 Production Build & Deployment

```bash
# Build production bundle
npm run build

# Deploy to Firebase Hosting
npx firebase deploy --only hosting
```

---

## 📄 License
MIT License. Built with care for building lasting calm momentum.

# Najahi (نجاحي) - Algerian Baccalaureate App

## Overview
Premium Arabic-first mobile app for Algerian Baccalaureate students. Built with Expo React Native and an Express backend API.

## Architecture
- **Frontend**: Expo React Native app with Expo Router file-based routing
- **Backend**: Express API server (port 3000) with PostgreSQL database
- **Language**: TypeScript
- **Auth**: Email/password + Google OAuth via `/api/auth/*` endpoints
- **API Proxy**: Metro config proxies `/api/` requests from port 5000 to Express on port 3000

## Project Layout
- All source code is in the `AI-Asset-Manager/` subdirectory
- `AI-Asset-Manager/app/` - Expo Router pages
- `AI-Asset-Manager/app/(tabs)/` - Bottom tab screens (home, ranking, tasks, sections)
- `AI-Asset-Manager/app/subject.tsx` - Subject screen showing 3 trimesters
- `AI-Asset-Manager/app/trimester.tsx` - Trimester screen with lesson list and lock system
- `AI-Asset-Manager/app/lesson.tsx` - Lesson screen (study or skip to quiz)
- `AI-Asset-Manager/app/quiz.tsx` - Quiz engine (MCQ, fill-in-blank, ordering, matching) with creative design: circular timer, streak fire counter, hearts/lives system, particle explosions, sound effects, haptic feedback
- `AI-Asset-Manager/app/quiz-results.tsx` - Results screen with animated star rating, counting score animation, particle celebration, flip stat cards, performance bar, streak bonus display
- `AI-Asset-Manager/components/quiz/` - Quiz sub-components: CircularTimer (SVG countdown), StreakFire (animated streak counter), HeartLives (lives with break animation), ParticleExplosion (gem/star burst effects)
- `AI-Asset-Manager/lib/quiz-sounds.ts` - Quiz sound effects + haptic feedback manager (correct, wrong, tap, streak, timer warning)
- `AI-Asset-Manager/server/` - Express backend (index.ts, routes.ts, storage.ts)
- `AI-Asset-Manager/shared/` - Shared types/schema
- `AI-Asset-Manager/components/` - Reusable React Native components
- `AI-Asset-Manager/contexts/` - React contexts (Auth, Gamification, Theme, Notifications)
- `AI-Asset-Manager/constants/` - Colors, app data, curriculum data
- `AI-Asset-Manager/constants/curriculum.ts` - Branch-specific subjects, trimesters, lessons, exercises
- `AI-Asset-Manager/lib/query-client.ts` - API client using EXPO_PUBLIC_DOMAIN for base URL
- `AI-Asset-Manager/metro.config.js` - Metro bundler config with API proxy middleware

## Running the App
- **Start application** (webview, port 5000): Expo dev server with Metro bundler
- **Start Backend** (console, port 3000): Express API server
- Expo dev server provides QR code for Expo Go mobile preview
- EXPO_PUBLIC_DOMAIN points to REPLIT_DEV_DOMAIN for API calls

## Sections Feature (Educational Content)
- Two-level navigation: Sections tab shows category groupings first (e.g. المواد العلمية, اللغات, مواد عامة), then tapping a category shows its subjects
- `BRANCH_SECTIONS` in curriculum.ts defines per-branch category groupings with icons, colors, and subject lists
- `section-subjects.tsx` screen shows subjects within a selected category
- Branch-specific subjects: each specialization (sciences, math, tech_math, economy, literature, languages) has its own set of subjects
- Subject → 3 Trimesters → Lessons (progressive unlock: first lesson open, rest locked until previous completed)
- Lesson flow: choice to skip to quiz or study first
- 4 quiz/exercise types: MCQ, fill-in-blank (Duolingo-style word tiles), ordering, matching
- Results screen: gems earned, XP, time taken, accuracy percentage
- Progress tracked in AsyncStorage per-user: all keys scoped by email suffix (e.g. `@najahi_xp_user@email.com`)
- `AI-Asset-Manager/lib/storage-keys.ts` - Centralized per-user storage key helpers (`lessonCompleteKey`, `isLessonComplete`, `markLessonComplete`, `setStorageEmail`, `getStorageEmail`)
- Lesson completion: `@najahi_lesson_complete_{subjectId}_{trimesterId}_{lessonId}_{email}`
- Sample content: History (all 3 trimesters, Algerian curriculum), Math (trimester 1)
- Gems system for rankings (10 gems per correct answer, streak multiplier: x2 at 3 streak, x3 at 5 streak)
- Quiz game mechanics: 3 lives (hearts), 30s timer per question, streak counter with multiplier bonus

## UI Design
- Dark theme with accent colors: primary (#00D4AA green), secondary (#7C5CFF purple), gold (#FFB74D), cyan (#4FC3F7), accent (#FF6B6B red)
- Arabic RTL layout with Cairo font family
- Floating bottom tab bar with per-tab accent colors and active indicators
- Tab screens: Home (الرئيسية), Ranking (التصنيف), Tasks (المهام), Sections (الأقسام)
- Gamification: XP, levels, badges, streaks with animated notifications
- Tasks/Missions system: daily/weekly/special tasks tracked via `hooks/useTasks.ts`, AsyncStorage per-user, auto-reset on date/week change
- Quiz results screen integrates task tracking: lessons_completed, correct_answers, max_streak, perfect_quizzes, gems_earned

## Database
- PostgreSQL (Replit built-in) via DATABASE_URL env var
- Tables: `accounts` (id, email, password, auth_provider, onboarded, profile JSONB, xp, created_at), `push_tokens` (id, email, token, platform, created_at)
- Schema managed via Drizzle ORM (`AI-Asset-Manager/drizzle.config.ts`)
- Run migrations: `cd AI-Asset-Manager && npm run db:push`

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (set automatically)
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth Web Client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret (starts with GOCSPX-)
- `EXPO_PUBLIC_DOMAIN` - Set to REPLIT_DEV_DOMAIN in dev workflow

## Deployment
- Target: autoscale
- Build: `cd AI-Asset-Manager && npm install && npm run server:build`
- Run: `cd AI-Asset-Manager && npm run server:prod`
- Production: Express server on port 5000 serves static Expo build + landing page + API

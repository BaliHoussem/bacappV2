# Najahi (نجاحي) - Algerian Baccalaureate App

## Overview
Premium Arabic-first mobile app for Algerian Baccalaureate students. Built with Expo React Native, using PostgreSQL for server-side auth and AsyncStorage for local UI state caching.

## Brand
- **Name**: نجاحي (Najahi - "My Success")
- **Color Palette**: Midnight indigo background (#0D1117), jade/turquoise primary (#00D4AA), violet secondary (#7C5CFF), coral accent (#FF6B6B), gold (#FFB74D)
- **Font**: Cairo (Arabic Google Font)
- **RTL**: Full right-to-left Arabic support

## Architecture
- **Frontend**: Expo Router with file-based routing
- **Backend**: Express API server (port 5000) with PostgreSQL database
- **Auth**: Server-side authentication via `/api/auth/*` endpoints. Supports email/password and Google OAuth. Accounts stored in PostgreSQL `accounts` table with `auth_provider` column ('email' or 'google'). AsyncStorage used only for caching session email and profile locally.
- **State**: React Context for auth state, AsyncStorage for local caching
- **Styling**: React Native StyleSheet with dark theme

## Database
- PostgreSQL with `accounts` table (id, email, password, profile JSONB, onboarded, auth_provider, xp INTEGER DEFAULT 0, created_at)
- `push_tokens` table (id, email, token, platform, created_at) for push notification tokens
- API endpoints: POST `/api/auth/signup`, POST `/api/auth/login`, POST `/api/auth/google`, POST `/api/auth/onboarding`, GET `/api/auth/account/:email`, POST `/api/notifications/register`, GET `/api/leaderboard`, POST `/api/leaderboard/sync`

## App Flow
1. Landing page (orbiting icons + logo + "ابدأ الآن") → Entry/Welcome (mascot + "مرحبا أنا نجاحي" + auth buttons) → Signup/Login (Google OAuth + email/password) → Onboarding → Notification prompt → Home (tabs)
2. Tabs: Home (الرئيسية), Ranking (التصنيف), Tasks (المهام), Sections (الأقسام)
3. Profile accessible from Home header

## Onboarding Flow (Duolingo-style)
Steps with mascot (green circle "ن" with school icon badge) and speech bubbles. All options use styled Ionicons (NO emojis):
1. **Intro** - "لدينا بعض الأسئلة السريعة قبل أن نبدأ رحلتك!"
2. **Branch** - "ماهو تخصصك؟" (6 branches with styled icons, single select)
3. **Sub-Branch** (conditional, only for تقني رياضي) - 4 sub-specialties
4. **How Heard** - "كيف سمعت عن تطبيقنا؟" (8 options with styled icons)
5. **Academic Level** - "ماهو مستواك الدراسي؟" (5 ranges with signal bar icons)
6. **Goals** - "ماهو هدفك من استعمال تطبيقنا؟" (multi-select with checkboxes)
7. **Learning Pace** - "ما هي سرعة التعلم التي تفضلها؟" (5/10/15/20 lessons/week)
8. **Daily Commitment** - Shows calculated daily study time based on pace
9. **Personal Info** - Name, username, birthday (tabbed inline grid picker: day→month→year), wilaya (modal with search + numbered badges)
10. **Final** - Bac countdown + achievement preview cards

## Curriculum / Quiz Flow
- **Navigation**: Sections tab (single "المواد" card) → section-subjects.tsx (lists all branch subjects) → subject.tsx (trimesters) → trimester.tsx (lessons with lock/unlock) → lesson.tsx (choice: review summary or skip to quiz) → quiz.tsx (exercises) → quiz-results.tsx
- **Curriculum data**: `constants/curriculum.ts` with `getSubject()`, `getSubjectsForBranch()`, `BRANCH_SUBJECTS`
- **Lock system**: First lesson always unlocked; subsequent lessons unlock when previous lesson completed (AsyncStorage key: `@najahi_lesson_complete_{subjectId}_{trimesterId}_{lessonId}`)
- **Exercise types**: MCQ (Arabic letter badges أ/ب/ج/د), fill-in-blank (tap to place/remove words), ordering (number circles), matching (connector dots)
- **Gems**: 10 per correct answer (GEMS_PER_CORRECT constant in quiz.tsx)
- **State management in quiz.tsx**: Uses refs (correctRef, wrongRef, gemsRef, startTimeRef) instead of state for values passed to results screen, avoiding stale closure bugs in setTimeout callbacks

## Key Files
- `app/index.tsx` - Premium landing page with floating education icons orbiting logo
- `app/entry.tsx` - Welcome/mascot page with auth buttons (إنشاء حساب + سجل الدخول)
- `app/signup.tsx` - Email sign up with password validation + Google sign-in
- `app/login.tsx` - Email login with error states + Google sign-in
- `app/onboarding.tsx` - Duolingo-style onboarding with mascot, styled Ionicons, tabbed date picker, progress bar, sound effects
- `hooks/useSound.ts` - Sound effects hook using expo-av (Audio.Sound.createAsync)
- `app/notifications.tsx` - Real push notification permission prompt (expo-notifications)
- `app/(tabs)/` - Main tab navigation (home, ranking, tasks, sections)
- `app/profile.tsx` - Profile with settings
- `components/GoogleSignInButton.tsx` - Shared Google OAuth sign-in button + OrDivider
- `contexts/AuthContext.tsx` - Authentication and user state (email/password + Google OAuth)
- `server/routes.ts` - Backend auth + notifications API routes
- `constants/colors.ts` - Theme colors
- `constants/data.ts` - Wilayas, branches, tech math subs, hear about options, academic levels, goals, learning paces, exam date

## UserProfile Fields
- fullName, username, branch, subBranch?, wilaya, birthDate
- hearAbout?, academicLevel?, goals? (string[]), learningPace? (number)
- gender?, candidateType?, averageScore? (legacy, optional)

## Environment Variables
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth Web Client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret
- `DATABASE_URL` - PostgreSQL connection string

## Dependencies
- `@expo-google-fonts/cairo` - Arabic font
- `expo-crypto` - UUID generation
- `expo-linear-gradient` - Gradient backgrounds
- `expo-haptics` - Haptic feedback
- `react-native-reanimated` - Animations
- `@react-native-async-storage/async-storage` - Local caching
- `pg` - PostgreSQL client
- `bcryptjs` - Password hashing
- `expo-av` - Sound effects (Audio.Sound API)
- `expo-web-browser` - OAuth browser redirect
- `expo-notifications` - Push notifications
- `assets/sounds/` - UI sound files (tap, select, next, complete, back, xp, level_up, achievement)
- `contexts/GamificationContext.tsx` - XP/Level/Badge system with AsyncStorage persistence, sound effects, haptics, notification queue, server XP sync
- `components/XpNotification.tsx` - Animated overlay for XP gains, level ups, and badge unlocks
- `contexts/NotificationCenterContext.tsx` - Inbox notification system with AsyncStorage persistence, unread count, mark-read/clear-all, welcome notifications seeded on first load
- `app/inbox.tsx` - Notification inbox screen with expandable cards, sender/time details, mark-all-read, clear-all actions
- `app/progress.tsx` - Progress stats page with activity heatmap (GitHub-style), XP stats, level progress, streak stats
- `contexts/ThemeContext.tsx` - Unlockable color themes (6 themes: Default, Ocean Blue, Royal Purple, Sunset Orange, Emerald, Gold Premium)
- `app/themes.tsx` - Theme selector screen with lock/unlock based on user level
- `components/ShimmerEffect.tsx` - Animated shimmer gradient overlay for premium cards
- `app/badges.tsx` - Full badges/achievements list screen

## Bac Exam Date
June 15, 2026 at 08:00 (Algiers time)

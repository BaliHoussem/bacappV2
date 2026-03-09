import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput, Platform,
  FlatList, Dimensions, ActivityIndicator, ScrollView, Modal, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn, FadeOut, useSharedValue, useAnimatedStyle,
  withTiming, withSpring, Easing, interpolate,
} from 'react-native-reanimated';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '@/lib/query-client';
import Colors from '@/constants/colors';
import {
  WILAYAS, BRANCHES, TECH_MATH_SUBS, HEAR_ABOUT_OPTIONS,
  ACADEMIC_LEVELS, GOAL_OPTIONS, LEARNING_PACES, BAC_EXAM_DATE, MONTHS_AR,
} from '@/constants/data';
import { useAuth } from '@/contexts/AuthContext';
import { useSound } from '@/hooks/useSound';
import AnimatedMascot from '@/components/AnimatedMascot';
const { width: SCREEN_W } = Dimensions.get('window');
const PRIMARY = Colors.primary;
const PRIMARY_DIM = Colors.primaryDim;
const BG = '#131A2B';
const CARD_BG = 'rgba(255,255,255,0.06)';
const CARD_BORDER = 'rgba(255,255,255,0.10)';
const TEXT_PRIMARY = Colors.text;
const TEXT_DIM = Colors.textSecondary;

type StepId =
  | 'intro' | 'branch' | 'subBranch'
  | 'hearAbout' | 'academicLevel' | 'goals' | 'learningPace'
  | 'dailyCommitment' | 'personalInfo' | 'final';

function getSteps(branch: string): StepId[] {
  const steps: StepId[] = ['intro', 'branch'];
  if (branch === 'tech_math') steps.push('subBranch');
  steps.push('hearAbout', 'academicLevel', 'goals', 'learningPace', 'dailyCommitment', 'personalInfo', 'final');
  return steps;
}

function Mascot({ size = 58 }: { size?: number }) {
  return <AnimatedMascot size={size} animation="idle" />;
}

function SpeechBubble({ text }: { text: string }) {
  return (
    <View style={s.bubbleWrap}>
      <View style={s.bubble}>
        <Text style={s.bubbleText}>{text}</Text>
      </View>
      <View style={s.bubbleTail} />
    </View>
  );
}

function MascotRow({ text, mascotSize }: { text: string; mascotSize?: number }) {
  return (
    <View style={s.mascotRow}>
      <SpeechBubble text={text} />
      <Mascot size={mascotSize} />
    </View>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withTiming(progress, { duration: 500, easing: Easing.out(Easing.cubic) });
  }, [progress]);
  const barStyle = useAnimatedStyle(() => ({
    width: `${Math.min(w.value * 100, 100)}%` as any,
  }));
  return (
    <View style={s.progressTrack}>
      <Animated.View style={[s.progressFill, barStyle]} />
    </View>
  );
}

function StyledIcon({ name, color, size = 24 }: { name: string; color: string; size?: number }) {
  return (
    <View style={[s.styledIcon, { backgroundColor: color + '18' }]}>
      <Ionicons name={name as any} size={size} color={color} />
    </View>
  );
}

function SignalBars({ level, active }: { level: number; active: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2, alignItems: 'flex-end' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <View key={i} style={{
          width: 5, height: 5 + i * 4, borderRadius: 2,
          backgroundColor: i <= level ? (active ? PRIMARY : '#5A6275') : 'rgba(255,255,255,0.08)',
        }} />
      ))}
    </View>
  );
}

const PACE_MINUTES: Record<number, number> = { 5: 30, 10: 60, 15: 90, 20: 120 };

function TimerRing({ size = 100, minutes = 60 }: { size?: number; minutes?: number }) {
  const r = size / 2;
  const strokeW = 5;
  const innerR = r - strokeW - 4;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const display = hrs > 0
    ? `${hrs}:${mins.toString().padStart(2, '0')}`
    : `${mins}:00`;

  const segCount = 24;
  const segAngle = 360 / segCount;
  const filled = Math.round((minutes / 120) * segCount);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {Array.from({ length: segCount }, (_, i) => {
        const angle = (i * segAngle - 90) * (Math.PI / 180);
        const dist = r - strokeW / 2;
        const active = i < filled;
        return (
          <View key={i} style={{
            position: 'absolute',
            width: strokeW, height: 8, borderRadius: 2,
            backgroundColor: active ? PRIMARY : 'rgba(255,255,255,0.12)',
            left: r + Math.cos(angle) * dist - strokeW / 2,
            top: r + Math.sin(angle) * dist - 4,
            transform: [{ rotate: `${i * segAngle}deg` }],
          }} />
        );
      })}
      <View style={{
        width: innerR * 2, height: innerR * 2, borderRadius: innerR,
        backgroundColor: 'rgba(0, 212, 170, 0.06)',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{
          fontSize: 26, fontFamily: 'Cairo_700Bold', color: PRIMARY,
          letterSpacing: 2,
        }}>{display}</Text>
      </View>
    </View>
  );
}

function OptionCard({
  icon, iconColor, label, active, onPress, tag, rightContent,
}: {
  icon?: string; iconColor?: string; label: string; active: boolean;
  onPress: () => void; tag?: string; rightContent?: React.ReactNode;
}) {
  return (
    <Pressable onPress={onPress} style={[s.optionCard, active && s.optionCardActive]}>
      {rightContent && <View style={s.optionRight}>{rightContent}</View>}
      {icon && <StyledIcon name={icon} color={iconColor || PRIMARY} />}
      <Text style={[s.optionLabel, active && s.optionLabelActive]}>{label}</Text>
      {tag && (
        <View style={[s.optionTag, active && s.optionTagActive]}>
          <Text style={[s.optionTagText, active && s.optionTagTextActive]}>{tag}</Text>
        </View>
      )}
      {!tag && !rightContent && (
        <View style={[s.optionCheck, active && s.optionCheckActive]}>
          {active && <Ionicons name="checkmark" size={14} color="#FFF" />}
        </View>
      )}
    </Pressable>
  );
}

function MultiOptionCard({
  icon, iconColor, label, active, onPress,
}: {
  icon: string; iconColor: string; label: string; active: boolean; onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[s.optionCard, active && s.optionCardActive]}>
      <StyledIcon name={icon} color={iconColor} />
      <Text style={[s.optionLabel, active && s.optionLabelActive]}>{label}</Text>
      <View style={[s.multiCheck, active && s.multiCheckActive]}>
        {active && <Ionicons name="checkmark" size={13} color="#FFF" />}
      </View>
    </Pressable>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useAuth();
  const { play } = useSound();
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  const [branch, setBranch] = useState('');
  const [subBranch, setSubBranch] = useState('');
  const [hearAbout, setHearAbout] = useState('');
  const [academicLevel, setAcademicLevel] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [learningPace, setLearningPace] = useState(0);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [wilayaSearch, setWilayaSearch] = useState('');
  const [showWilayaModal, setShowWilayaModal] = useState(false);
  const [dateTab, setDateTab] = useState<'day' | 'month' | 'year' | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const googleName = await AsyncStorage.getItem('@najahi_google_name');
        if (googleName) {
          setFullName(googleName);
          setIsGoogleUser(true);
        }
      } catch (e) {
        if (__DEV__) console.warn('[onboarding] load state error:', e);
      }
    })();
  }, []);

  const steps = useMemo(() => getSteps(branch), [branch]);
  const currentStep = steps[stepIndex] as StepId;
  const progress = stepIndex / (steps.length - 1);

  const fadeKey = useSharedValue(1);
  useEffect(() => {
    fadeKey.value = 0;
    fadeKey.value = withSpring(1, { damping: 18, stiffness: 140 });
    if (currentStep === 'personalInfo' && username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username)) {
      checkUsername(username);
    }
  }, [stepIndex]);
  const contentAnim = useAnimatedStyle(() => ({
    opacity: fadeKey.value,
    transform: [{ translateY: interpolate(fadeKey.value, [0, 1], [30, 0]) }],
  }));

  const filteredWilayas = wilayaSearch
    ? WILAYAS.filter(w => w.includes(wilayaSearch))
    : WILAYAS;

  const checkUsername = useCallback((val: string) => {
    if (usernameTimer.current) clearTimeout(usernameTimer.current);
    setUsernameAvailable(null);
    const clean = val.replace(/\s/g, '');
    if (clean.length < 3 || !/^[a-zA-Z0-9_]+$/.test(clean)) return;
    setCheckingUsername(true);
    usernameTimer.current = setTimeout(async () => {
      try {
        const baseUrl = getApiUrl();
        const url = new URL(`/api/auth/check-username/${encodeURIComponent(clean.toLowerCase())}`, baseUrl);
        const res = await fetch(url.toString());
        const data = await res.json();
        setUsernameAvailable(data.available);
      } catch (e) {
        if (__DEV__) console.warn('[onboarding] username check failed:', e);
        setUsernameAvailable(null);
      }
      setCheckingUsername(false);
    }, 500);
  }, []);

  const haptic = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 'intro':
      case 'dailyCommitment':
        return true;
      case 'branch': return branch !== '';
      case 'subBranch': return subBranch !== '';
      case 'hearAbout': return hearAbout !== '';
      case 'academicLevel': return academicLevel !== '';
      case 'goals': return goals.length > 0;
      case 'learningPace': return learningPace > 0;
      case 'personalInfo': {
        const validName = fullName.trim().length >= 2;
        const validUsername = username.trim().length >= 3 && username.trim().length <= 20 && /^[a-zA-Z0-9_]+$/.test(username.trim()) && usernameAvailable === true;
        const validBirth = birthDay !== '' && birthMonth !== '' && birthYear !== '' && birthYear.length === 4;
        return validName && validUsername && validBirth && wilaya !== '';
      }
      case 'final': return true;
      default: return false;
    }
  }, [currentStep, branch, subBranch, hearAbout, academicLevel, goals, learningPace, fullName, username, birthDay, birthMonth, birthYear, wilaya, usernameAvailable, isGoogleUser]);

  const handleNext = async () => {
    if (!canProceed()) return;
    play('next');
    haptic();

    if (currentStep === 'final') {
      setLoading(true);
      play('complete');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      try {
        const birthDate = `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`;
        let profilePicture: string | undefined;
        try {
          const pic = await AsyncStorage.getItem('@najahi_google_picture');
          if (pic) profilePicture = pic;
        } catch (e) {
          if (__DEV__) console.warn('[onboarding] picture load error:', e);
        }
        await completeOnboarding({
          fullName: fullName.trim(),
          username: username.trim(),
          branch,
          subBranch: branch === 'tech_math' ? subBranch : undefined,
          wilaya,
          birthDate,
          hearAbout,
          academicLevel,
          goals,
          learningPace,
          profilePicture,
        });
        AsyncStorage.multiRemove(['@najahi_google_name', '@najahi_google_picture']).catch(() => {});
        router.replace('/notifications');
      } catch (e: any) {
        if (e?.message === 'username_taken') {
          setUsernameAvailable(false);
          setStepIndex(steps.indexOf('personalInfo'));
        } else if (e?.message === 'server_error') {
          Alert.alert('خطأ', 'حدث خطأ في الخادم، حاول مرة أخرى');
        }
        console.error(e);
      }
      finally { setLoading(false); }
    } else {
      if (stepIndex + 1 < steps.length) setStepIndex(stepIndex + 1);
    }
  };

  const handleBack = () => {
    play('back');
    haptic();
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
    else { if (router.canGoBack()) router.back(); else router.replace('/entry'); }
  };

  const selectSingle = useCallback((setter: (v: string) => void, value: string) => {
    setter(value); play('select'); haptic();
  }, [play, haptic]);

  const toggleGoal = useCallback((id: string) => {
    setGoals(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
    play('select'); haptic();
  }, [play, haptic]);

  const getDaysRemaining = () => {
    const diff = BAC_EXAM_DATE.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const dailyText = useMemo(() =>
    LEARNING_PACES.find(p => p.id === learningPace)?.daily || '',
  [learningPace]);

  const getButtonText = () => {
    if (currentStep === 'final') return 'يلا نبدأو!';
    if (currentStep === 'dailyCommitment') return 'سألتزم بذلك';
    return 'المتابعة';
  };

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const years = Array.from({ length: 13 }, (_, i) => (2000 + i).toString());

  const renderContent = () => {
    switch (currentStep) {
      case 'intro':
        return (
          <View style={s.centeredContent}>
            <View style={s.centeredBubble}>
              <Text style={s.centeredBubbleText}>
                لدينا بعض الأسئلة السريعة{'\n'}قبل أن نبدأ رحلتك!
              </Text>
            </View>
            <Mascot size={100} />
          </View>
        );

      case 'branch':
        return (
          <View style={s.stepContent}>
            <MascotRow text="ماهو تخصصك؟" mascotSize={48} />
            <ScrollView style={s.optionsList} showsVerticalScrollIndicator={false} contentContainerStyle={s.optionsListPad}>
              {BRANCHES.map(b => (
                <OptionCard key={b.id} icon={b.icon} iconColor={b.color}
                  label={b.label} active={branch === b.id}
                  onPress={() => selectSingle(setBranch, b.id)} />
              ))}
            </ScrollView>
          </View>
        );

      case 'subBranch':
        return (
          <View style={s.stepContent}>
            <MascotRow text="اختر تخصصك الفرعي" mascotSize={48} />
            <ScrollView style={s.optionsList} showsVerticalScrollIndicator={false} contentContainerStyle={s.optionsListPad}>
              {TECH_MATH_SUBS.map(sub => (
                <OptionCard key={sub.id} icon={sub.icon} iconColor={sub.color}
                  label={sub.label} active={subBranch === sub.id}
                  onPress={() => selectSingle(setSubBranch, sub.id)} />
              ))}
            </ScrollView>
          </View>
        );

      case 'hearAbout':
        return (
          <View style={s.stepContent}>
            <MascotRow text="كيف سمعت عن تطبيقنا؟" mascotSize={48} />
            <ScrollView style={s.optionsList} showsVerticalScrollIndicator={false} contentContainerStyle={s.optionsListPad}>
              {HEAR_ABOUT_OPTIONS.map(opt => (
                <Pressable key={opt.id} onPress={() => selectSingle(setHearAbout, opt.id)}
                  style={[s.optionCard, hearAbout === opt.id && s.optionCardActive]}>
                  <BrandIcon iconLib={opt.iconLib} icon={opt.icon} color={opt.color} bg={opt.bg} />
                  <Text style={[s.optionLabel, hearAbout === opt.id && s.optionLabelActive]}>{opt.label}</Text>
                  <View style={[s.optionCheck, hearAbout === opt.id && s.optionCheckActive]}>
                    {hearAbout === opt.id && <Ionicons name="checkmark" size={14} color="#FFF" />}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        );

      case 'academicLevel':
        return (
          <View style={s.stepContent}>
            <MascotRow text="ماهو مستواك الدراسي؟" />
            <ScrollView style={s.optionsList} showsVerticalScrollIndicator={false} contentContainerStyle={s.optionsListPad}>
              {ACADEMIC_LEVELS.map(lvl => (
                <OptionCard key={lvl.id} label={lvl.label}
                  active={academicLevel === lvl.id}
                  onPress={() => selectSingle(setAcademicLevel, lvl.id)}
                  rightContent={<SignalBars level={lvl.bars} active={academicLevel === lvl.id} />} />
              ))}
            </ScrollView>
          </View>
        );

      case 'goals':
        return (
          <View style={s.stepContent}>
            <MascotRow text="ماهو هدفك من استعمال تطبيقنا؟" />
            <ScrollView style={s.optionsList} showsVerticalScrollIndicator={false} contentContainerStyle={s.optionsListPad}>
              {GOAL_OPTIONS.map(g => (
                <MultiOptionCard key={g.id} icon={g.icon} iconColor={g.color}
                  label={g.label} active={goals.includes(g.id)}
                  onPress={() => toggleGoal(g.id)} />
              ))}
            </ScrollView>
          </View>
        );

      case 'learningPace':
        return (
          <View style={s.stepContent}>
            <MascotRow text="ما هي سرعة التعلم التي تفضلها؟" />
            <ScrollView style={s.optionsList} showsVerticalScrollIndicator={false} contentContainerStyle={s.optionsListPad}>
              {LEARNING_PACES.map(p => (
                <OptionCard key={p.id} label={p.label} tag={p.tag}
                  active={learningPace === p.id}
                  onPress={() => { setLearningPace(p.id); play('select'); haptic(); }} />
              ))}
            </ScrollView>
          </View>
        );

      case 'dailyCommitment':
        return (
          <View style={s.centeredContent}>
            <MascotRow text="لنعقد لك الطريق نحو بدء عادة تعلم يومية!" />
            <View style={s.commitCard}>
              <TimerRing size={110} minutes={PACE_MINUTES[learningPace] || 60} />
              <Text style={s.commitText}>{dailyText}</Text>
              <Text style={s.commitSub}>ستدرس باستخدام تطبيقنا</Text>
            </View>
          </View>
        );

      case 'personalInfo':
        return (
          <View style={s.stepContent}>
            <MascotRow text={isGoogleUser ? `مرحبا ${fullName}! أكمل معلوماتك` : "آخر خطوة! عرّفنا عليك"} />
            <ScrollView style={s.optionsList} showsVerticalScrollIndicator={false}
              contentContainerStyle={[s.optionsListPad, { gap: 16 }]}
              keyboardShouldPersistTaps="handled">

              {!isGoogleUser && (
                <View style={s.inputGroup}>
                  <Text style={s.inputLabel}>بماذا نناديك؟</Text>
                  <View style={s.inputField}>
                    <TextInput style={s.textInput} value={fullName} onChangeText={setFullName}
                      placeholder="اسمك الكامل" placeholderTextColor={TEXT_DIM} textAlign="right" />
                    <Ionicons name="person-outline" size={18} color={TEXT_DIM} />
                  </View>
                </View>
              )}

              <View style={s.inputGroup}>
                <Text style={s.inputLabel}>اسم المستخدم</Text>
                <View style={[s.inputField, usernameAvailable === false && { borderColor: '#FF6B6B' }, usernameAvailable === true && { borderColor: '#00D4AA' }]}>
                  <TextInput style={s.textInput} value={username}
                    onChangeText={(t) => { const v = t.replace(/\s/g, ''); setUsername(v); checkUsername(v); }}
                    placeholder="username" placeholderTextColor={TEXT_DIM}
                    autoCapitalize="none" textAlign="right" />
                  {checkingUsername ? (
                    <ActivityIndicator size="small" color={TEXT_DIM} />
                  ) : usernameAvailable === true ? (
                    <Ionicons name="checkmark-circle" size={18} color="#00D4AA" />
                  ) : usernameAvailable === false ? (
                    <Ionicons name="close-circle" size={18} color="#FF6B6B" />
                  ) : (
                    <Ionicons name="at-outline" size={18} color={TEXT_DIM} />
                  )}
                </View>
                {username.length > 0 && (
                  <View style={s.rulesRow}>
                    <RuleChip ok={username.length >= 3 && username.length <= 20} label="3-20 حرف" />
                    <RuleChip ok={/^[a-zA-Z0-9_]*$/.test(username)} label="أحرف، أرقام، _" />
                    {usernameAvailable === false && <RuleChip ok={false} label="مستخدم بالفعل" />}
                  </View>
                )}
              </View>

              <View style={s.inputGroup}>
                <Text style={s.inputLabel}>تاريخ ميلادك</Text>
                <View style={s.dateTabs}>
                  <Pressable onPress={() => setDateTab(dateTab === 'day' ? null : 'day')}
                    style={[s.dateTabBtn, dateTab === 'day' && s.dateTabActive, birthDay !== '' && s.dateTabFilled]}>
                    <Ionicons name="calendar-outline" size={16} color={dateTab === 'day' ? PRIMARY : TEXT_DIM} />
                    <Text style={[s.dateTabText, (dateTab === 'day' || birthDay !== '') && { color: PRIMARY }]}>
                      {birthDay || 'اليوم'}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => setDateTab(dateTab === 'month' ? null : 'month')}
                    style={[s.dateTabBtn, dateTab === 'month' && s.dateTabActive, birthMonth !== '' && s.dateTabFilled]}>
                    <Text style={[s.dateTabText, (dateTab === 'month' || birthMonth !== '') && { color: PRIMARY }]}>
                      {birthMonth ? MONTHS_AR[parseInt(birthMonth) - 1] : 'الشهر'}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => setDateTab(dateTab === 'year' ? null : 'year')}
                    style={[s.dateTabBtn, dateTab === 'year' && s.dateTabActive, birthYear !== '' && s.dateTabFilled]}>
                    <Text style={[s.dateTabText, (dateTab === 'year' || birthYear !== '') && { color: PRIMARY }]}>
                      {birthYear || 'السنة'}
                    </Text>
                  </Pressable>
                </View>
                {dateTab === 'day' && (
                  <Animated.View entering={FadeIn.duration(200)} style={s.dateGrid}>
                    {days.map(d => (
                      <Pressable key={d} onPress={() => { setBirthDay(d); setDateTab('month'); haptic(); }}
                        style={[s.dateGridItem, birthDay === d && s.dateGridItemActive]}>
                        <Text style={[s.dateGridText, birthDay === d && s.dateGridTextActive]}>{d}</Text>
                      </Pressable>
                    ))}
                  </Animated.View>
                )}
                {dateTab === 'month' && (
                  <Animated.View entering={FadeIn.duration(200)} style={s.monthGrid}>
                    {MONTHS_AR.map((m, i) => (
                      <Pressable key={i} onPress={() => { setBirthMonth((i + 1).toString()); setDateTab('year'); haptic(); }}
                        style={[s.monthGridItem, birthMonth === (i + 1).toString() && s.dateGridItemActive]}>
                        <Text style={[s.monthGridText, birthMonth === (i + 1).toString() && s.dateGridTextActive]}>{m}</Text>
                      </Pressable>
                    ))}
                  </Animated.View>
                )}
                {dateTab === 'year' && (
                  <Animated.View entering={FadeIn.duration(200)} style={s.dateGrid}>
                    {years.map(y => (
                      <Pressable key={y} onPress={() => { setBirthYear(y); setDateTab(null); haptic(); }}
                        style={[s.dateGridItem, birthYear === y && s.dateGridItemActive, { width: '30%' as any }]}>
                        <Text style={[s.dateGridText, birthYear === y && s.dateGridTextActive]}>{y}</Text>
                      </Pressable>
                    ))}
                  </Animated.View>
                )}
              </View>

              <View style={s.inputGroup}>
                <Text style={s.inputLabel}>ولايتك</Text>
                <Pressable style={[s.inputField, s.wilayaBtn]}
                  onPress={() => setShowWilayaModal(true)}>
                  <Text style={wilaya ? s.wilayaBtnText : s.wilayaBtnPlaceholder}>
                    {wilaya || 'اختر ولايتك'}
                  </Text>
                  <Ionicons name="location-outline" size={18} color={wilaya ? PRIMARY : TEXT_DIM} />
                </Pressable>
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>

            <Modal visible={showWilayaModal} animationType="slide" transparent>
              <View style={s.modalOverlay}>
                <View style={[s.modalContent, { paddingBottom: insets.bottom + 10 }]}>
                  <View style={s.modalHeader}>
                    <Text style={s.modalTitle}>اختر ولايتك</Text>
                    <Pressable onPress={() => setShowWilayaModal(false)} hitSlop={12}>
                      <Ionicons name="close" size={24} color={TEXT_PRIMARY} />
                    </Pressable>
                  </View>
                  <View style={s.modalSearch}>
                    <Ionicons name="search" size={18} color={TEXT_DIM} />
                    <TextInput style={s.modalSearchInput} value={wilayaSearch}
                      onChangeText={setWilayaSearch} placeholder="ابحث عن ولايتك..."
                      placeholderTextColor={TEXT_DIM} textAlign="right" />
                  </View>
                  <FlatList data={filteredWilayas} keyExtractor={(item, i) => `${i}-${item}`}
                    scrollEnabled={filteredWilayas.length > 0} showsVerticalScrollIndicator={false}
                    renderItem={({ item, index }) => (
                      <Pressable onPress={() => {
                        setWilaya(item); setShowWilayaModal(false); setWilayaSearch('');
                        play('select'); haptic();
                      }} style={[s.wilayaItem, wilaya === item && s.wilayaItemActive]}>
                        <View style={s.wilayaNumBadge}>
                          <Text style={s.wilayaNum}>{index + 1}</Text>
                        </View>
                        <Text style={[s.wilayaName, wilaya === item && { color: PRIMARY }]}>{item}</Text>
                        {wilaya === item && <Ionicons name="checkmark-circle" size={20} color={PRIMARY} />}
                      </Pressable>
                    )} />
                </View>
              </View>
            </Modal>
          </View>
        );

      case 'final': {
        const d = getDaysRemaining();
        return (
          <View style={s.stepContent}>
            <MascotRow text={`هاك ما يمكنك تحقيقه\nفي ${d} يوم المتبقية!`} />
            <ScrollView style={s.optionsList} showsVerticalScrollIndicator={false}
              contentContainerStyle={[s.optionsListPad, { gap: 14 }]}>
              <View style={s.countdownCard}>
                <Text style={s.countdownLabel}>متبقي للبكالوريا</Text>
                <Text style={s.countdownDays}>{d}</Text>
                <Text style={s.countdownUnit}>يوم</Text>
              </View>
              <AchieveCard icon="bulb-outline" color="#FFB74D" title="ادرس بذكاء" sub="دروس مخصصة حسب تخصصك" />
              <AchieveCard icon="podium-outline" color="#7C5CFF" title="تنافس مع الآخرين" sub="ترتيب وطني وولائي" />
              <AchieveCard icon="time-outline" color="#4FC3F7" title="نظم وقتك" sub="تذكيرات ذكية ومهام يومية" />
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        );
      }
      default: return null;
    }
  };

  const topPad = (Platform.OS === 'web' ? 67 : insets.top) + 10;
  const botPad = (Platform.OS === 'web' ? 34 : insets.bottom) + 14;

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: topPad }]}>
        <View style={s.progressRow}>
          <ProgressBar progress={progress} />
          {stepIndex > 0 && (
            <Pressable onPress={handleBack} hitSlop={12} style={s.backBtn}>
              <Ionicons name="arrow-forward" size={22} color={TEXT_DIM} />
            </Pressable>
          )}
        </View>
      </View>

      <Animated.View style={[s.body, contentAnim]} key={`step-${stepIndex}`}>
        {renderContent()}
      </Animated.View>

      <View style={[s.footer, { paddingBottom: botPad }]}>
        <Pressable onPress={handleNext} disabled={!canProceed() || loading}
          style={({ pressed }) => [
            s.ctaBtn, (!canProceed() || loading) && s.ctaBtnOff,
            pressed && canProceed() && !loading && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}>
          {loading ? <ActivityIndicator color="#FFF" /> : (
            <Text style={[s.ctaText, (!canProceed() || loading) && s.ctaTextOff]}>
              {getButtonText()}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function BrandIcon({ iconLib, icon, color, bg }: { iconLib: string; icon: string; color: string; bg: string }) {
  const isBrand = iconLib === 'fa5';
  return (
    <View style={[s.brandIconWrap, { backgroundColor: bg }]}>
      {isBrand ? (
        <FontAwesome5 name={icon} size={20} color={color} />
      ) : (
        <Ionicons name={icon as any} size={22} color={color} />
      )}
    </View>
  );
}

function AchieveCard({ icon, color, title, sub }: { icon: string; color: string; title: string; sub: string }) {
  return (
    <View style={s.achieveCard}>
      <View style={[s.achieveIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon as any} size={26} color={color} />
      </View>
      <View style={s.achieveText}>
        <Text style={s.achieveTitle}>{title}</Text>
        <Text style={s.achieveSub}>{sub}</Text>
      </View>
    </View>
  );
}

function RuleChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <View style={[s.ruleChip, ok && s.ruleChipOk]}>
      <Ionicons name={ok ? 'checkmark-circle' : 'ellipse-outline'} size={13} color={ok ? PRIMARY : TEXT_DIM} />
      <Text style={[s.ruleChipText, ok && { color: PRIMARY }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: { paddingHorizontal: 20, zIndex: 10 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  backBtn: { padding: 4 },
  progressTrack: { flex: 1, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 6, backgroundColor: PRIMARY },

  body: { flex: 1, zIndex: 5 },

  centeredContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, gap: 28 },
  centeredBubble: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20,
    paddingHorizontal: 28, paddingVertical: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
  centeredBubbleText: { fontSize: 22, fontFamily: 'Cairo_700Bold', color: TEXT_PRIMARY, textAlign: 'center', lineHeight: 36 },

  stepContent: { flex: 1 },
  mascotRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4, gap: 10, justifyContent: 'flex-end',
  },
  bubbleWrap: { flex: 1, alignItems: 'flex-end' },
  bubble: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 18,
    paddingHorizontal: 18, paddingVertical: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', maxWidth: '100%',
  },
  bubbleText: { fontSize: 17, fontFamily: 'Cairo_600SemiBold', color: TEXT_PRIMARY, textAlign: 'right', lineHeight: 28 },
  bubbleTail: {
    position: 'absolute', bottom: -6, right: -4, width: 0, height: 0,
    borderLeftWidth: 8, borderLeftColor: 'transparent',
    borderTopWidth: 8, borderTopColor: 'rgba(255,255,255,0.08)',
    borderRightWidth: 8, borderRightColor: 'transparent',
  },

  optionsList: { flex: 1, paddingHorizontal: 20 },
  optionsListPad: { paddingTop: 12, paddingBottom: 10, gap: 8 },

  styledIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  brandIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  optionCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: CARD_BG, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 14,
    borderWidth: 2, borderColor: CARD_BORDER, gap: 12,
  },
  optionCardActive: { borderColor: PRIMARY, backgroundColor: PRIMARY + '12' },
  optionLabel: { flex: 1, fontSize: 16, fontFamily: 'Cairo_600SemiBold', color: '#C8CDD5', textAlign: 'right' },
  optionLabelActive: { color: TEXT_PRIMARY },
  optionRight: { marginLeft: 4 },
  optionTag: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)' },
  optionTagActive: { backgroundColor: PRIMARY + '20' },
  optionTagText: { fontSize: 12, fontFamily: 'Cairo_500Medium', color: TEXT_DIM },
  optionTagTextActive: { color: PRIMARY },
  optionCheck: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  optionCheckActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  multiCheck: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  multiCheckActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },

  commitCard: {
    backgroundColor: CARD_BG, borderRadius: 20,
    paddingVertical: 28, paddingHorizontal: 24,
    alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: CARD_BORDER, marginHorizontal: 30,
  },
  commitText: { fontSize: 20, fontFamily: 'Cairo_700Bold', color: PRIMARY, textAlign: 'center' },
  commitSub: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: TEXT_DIM, textAlign: 'center' },

  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 14, fontFamily: 'Cairo_600SemiBold', color: '#A0A8B8', textAlign: 'right', paddingRight: 4 },
  inputField: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: CARD_BG, borderRadius: 12,
    borderWidth: 1.5, borderColor: CARD_BORDER, paddingHorizontal: 14,
  },
  textInput: { flex: 1, fontSize: 16, fontFamily: 'Cairo_400Regular', color: TEXT_PRIMARY, paddingVertical: 13 },

  dateTabs: { flexDirection: 'row', gap: 8 },
  dateTabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 12,
    backgroundColor: CARD_BG, borderWidth: 1.5, borderColor: CARD_BORDER,
  },
  dateTabActive: { borderColor: PRIMARY, backgroundColor: PRIMARY + '10' },
  dateTabFilled: { borderColor: PRIMARY + '40' },
  dateTabText: { fontSize: 14, fontFamily: 'Cairo_600SemiBold', color: TEXT_DIM },

  dateGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    marginTop: 8, justifyContent: 'center',
  },
  dateGridItem: {
    width: '13%' as any, aspectRatio: 1,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 10, backgroundColor: CARD_BG,
    borderWidth: 1, borderColor: 'transparent',
  },
  dateGridItemActive: { backgroundColor: PRIMARY + '18', borderColor: PRIMARY },
  dateGridText: { fontSize: 14, fontFamily: 'Cairo_600SemiBold', color: '#C8CDD5' },
  dateGridTextActive: { color: PRIMARY },

  monthGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    marginTop: 8, justifyContent: 'center',
  },
  monthGridItem: {
    width: '30%' as any, paddingVertical: 12,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, backgroundColor: CARD_BG,
    borderWidth: 1, borderColor: 'transparent',
  },
  monthGridText: { fontSize: 14, fontFamily: 'Cairo_600SemiBold', color: '#C8CDD5' },

  wilayaBtn: { justifyContent: 'space-between', paddingVertical: 14 },
  wilayaBtnText: { fontSize: 16, fontFamily: 'Cairo_500Medium', color: TEXT_PRIMARY },
  wilayaBtnPlaceholder: { fontSize: 16, fontFamily: 'Cairo_400Regular', color: TEXT_DIM },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#1A2035', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '75%', paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  modalTitle: { fontSize: 18, fontFamily: 'Cairo_700Bold', color: TEXT_PRIMARY },
  modalSearch: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginVertical: 12,
    backgroundColor: CARD_BG, borderRadius: 10,
    paddingHorizontal: 12, borderWidth: 1, borderColor: CARD_BORDER,
  },
  modalSearchInput: { flex: 1, fontSize: 15, fontFamily: 'Cairo_400Regular', color: TEXT_PRIMARY, paddingVertical: 10 },
  wilayaItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 13, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  wilayaItemActive: { backgroundColor: PRIMARY + '0C' },
  wilayaNumBadge: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  wilayaNum: { fontSize: 12, fontFamily: 'Cairo_700Bold', color: TEXT_DIM },
  wilayaName: { flex: 1, fontSize: 15, fontFamily: 'Cairo_500Medium', color: '#C8CDD5', textAlign: 'right' },

  countdownCard: {
    backgroundColor: PRIMARY + '10', borderRadius: 20,
    paddingVertical: 24, alignItems: 'center',
    borderWidth: 1, borderColor: PRIMARY + '25',
  },
  countdownLabel: { fontSize: 14, fontFamily: 'Cairo_500Medium', color: TEXT_DIM },
  countdownDays: { fontSize: 56, fontFamily: 'Cairo_700Bold', color: PRIMARY, marginTop: -4 },
  countdownUnit: { fontSize: 16, fontFamily: 'Cairo_600SemiBold', color: PRIMARY, marginTop: -10 },

  achieveCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: CARD_BG, borderRadius: 14,
    paddingVertical: 16, paddingHorizontal: 16,
    borderWidth: 1, borderColor: CARD_BORDER,
  },
  achieveIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  achieveText: { flex: 1, gap: 2 },
  achieveTitle: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: TEXT_PRIMARY, textAlign: 'right' },
  achieveSub: { fontSize: 13, fontFamily: 'Cairo_400Regular', color: TEXT_DIM, textAlign: 'right' },

  rulesRow: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 4 },
  ruleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  ruleChipOk: { backgroundColor: PRIMARY + '10' },
  ruleChipText: { fontSize: 11, fontFamily: 'Cairo_400Regular', color: TEXT_DIM },

  footer: { paddingHorizontal: 24, zIndex: 10 },
  ctaBtn: {
    backgroundColor: PRIMARY, borderRadius: 14, paddingVertical: 16, alignItems: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 12px rgba(0, 212, 170, 0.3)' }
      : { shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }),
  },
  ctaBtnOff: { backgroundColor: 'rgba(255,255,255,0.08)', ...(Platform.OS === 'web' ? { boxShadow: 'none' } : { shadowOpacity: 0 }) },
  ctaText: { fontSize: 17, fontFamily: 'Cairo_700Bold', color: '#070B14' },
  ctaTextOff: { color: TEXT_DIM },
});

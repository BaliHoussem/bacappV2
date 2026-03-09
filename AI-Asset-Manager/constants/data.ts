export const WILAYAS = [
  'أدرار', 'الشلف', 'الأغواط', 'أم البواقي', 'باتنة', 'بجاية', 'بسكرة', 'بشار',
  'البليدة', 'البويرة', 'تمنراست', 'تبسة', 'تلمسان', 'تيارت', 'تيزي وزو', 'الجزائر',
  'الجلفة', 'جيجل', 'سطيف', 'سعيدة', 'سكيكدة', 'سيدي بلعباس', 'عنابة', 'قالمة',
  'قسنطينة', 'المدية', 'مستغانم', 'المسيلة', 'معسكر', 'ورقلة', 'وهران', 'البيض',
  'إليزي', 'برج بوعريريج', 'بومرداس', 'الطارف', 'تندوف', 'تيسمسيلت', 'الوادي',
  'خنشلة', 'سوق أهراس', 'تيبازة', 'ميلة', 'عين الدفلى', 'النعامة', 'عين تموشنت',
  'غرداية', 'غليزان', 'تيميمون', 'برج باجي مختار', 'أولاد جلال', 'بني عباس',
  'عين صالح', 'عين قزام', 'تقرت', 'جانت', 'المغير', 'المنيعة'
];

export const BRANCHES = [
  { id: 'sciences', label: 'علوم تجريبية', icon: 'flask-outline', color: '#4FC3F7' },
  { id: 'math', label: 'رياضيات', icon: 'calculator-outline', color: '#B06CFF' },
  { id: 'tech_math', label: 'تقني رياضي', icon: 'construct-outline', color: '#FF8C42' },
  { id: 'economy', label: 'تسيير واقتصاد', icon: 'bar-chart-outline', color: '#00D4AA' },
  { id: 'literature', label: 'آداب وفلسفة', icon: 'book-outline', color: '#FF6B6B' },
  { id: 'languages', label: 'لغات أجنبية', icon: 'language-outline', color: '#7C5CFF' },
];

export const TECH_MATH_SUBS = [
  { id: 'civil', label: 'هندسة مدنية', icon: 'business-outline', color: '#4FC3F7' },
  { id: 'mechanical', label: 'هندسة ميكانيكية', icon: 'cog-outline', color: '#FF8C42' },
  { id: 'electrical', label: 'هندسة كهربائية', icon: 'flash-outline', color: '#FFB74D' },
  { id: 'process', label: 'هندسة الطرائق', icon: 'beaker-outline', color: '#00D4AA' },
];

export const HEAR_ABOUT_OPTIONS = [
  { id: 'tiktok', label: 'تيك توك', iconLib: 'fa5', icon: 'tiktok', color: '#FFFFFF', bg: '#000000' },
  { id: 'youtube', label: 'يوتيوب', iconLib: 'fa5', icon: 'youtube', color: '#FFFFFF', bg: '#FF0000' },
  { id: 'google', label: 'البحث على جوجل', iconLib: 'fa5', icon: 'google', color: '#FFFFFF', bg: '#4285F4' },
  { id: 'facebook', label: 'فيسبوك / انستغرام', iconLib: 'fa5', icon: 'facebook', color: '#FFFFFF', bg: '#1877F2' },
  { id: 'telegram', label: 'تيليغرام', iconLib: 'fa5', icon: 'telegram-plane', color: '#FFFFFF', bg: '#0088CC' },
  { id: 'appstore', label: 'متجر التطبيقات', iconLib: 'fa5', icon: 'google-play', color: '#FFFFFF', bg: '#00C853' },
  { id: 'friends', label: 'الأصدقاء', iconLib: 'ion', icon: 'people', color: '#FFB74D', bg: '#FFB74D20' },
  { id: 'news', label: 'الأخبار / مقال', iconLib: 'ion', icon: 'newspaper', color: '#4FC3F7', bg: '#4FC3F720' },
  { id: 'other', label: 'أخرى', iconLib: 'ion', icon: 'chatbox', color: '#8B949E', bg: '#8B949E20' },
];

export const ACADEMIC_LEVELS = [
  { id: 'below_9', label: 'أقل من 9', bars: 1 },
  { id: '9_12', label: 'بين 9 و 12', bars: 2 },
  { id: '12_14', label: 'بين 12 و 14', bars: 3 },
  { id: '14_16', label: 'بين 14 و 16', bars: 4 },
  { id: 'above_16', label: 'أكثر من 16', bars: 5 },
];

export const GOAL_OPTIONS = [
  { id: 'bac_prep', label: 'الاستعداد للبكالوريا', icon: 'ribbon-outline', color: '#FF6B6B' },
  { id: 'improve', label: 'تحسين المستوى', icon: 'trending-up-outline', color: '#00D4AA' },
  { id: 'review', label: 'مراجعة الدروس', icon: 'document-text-outline', color: '#4FC3F7' },
  { id: 'high_score', label: 'الحصول على معدل عالي', icon: 'trophy-outline', color: '#FFB74D' },
  { id: 'compete', label: 'التنافس مع الآخرين', icon: 'people-outline', color: '#B06CFF' },
  { id: 'fun', label: 'الاستمتاع بالتعلم', icon: 'sparkles-outline', color: '#FF8C42' },
];

export const LEARNING_PACES = [
  { id: 5, label: '5 دروس / أسبوعيا', tag: 'عادي', daily: 'حوالي 30 دقيقة يوميا' },
  { id: 10, label: '10 دروس / أسبوعيا', tag: 'منتظم', daily: 'حوالي ساعة واحدة يوميا' },
  { id: 15, label: '15 درس / أسبوعيا', tag: 'جاد', daily: 'حوالي ساعة ونصف يوميا' },
  { id: 20, label: '20 درس / أسبوعيا', tag: 'مكثف', daily: 'حوالي ساعتين يوميا' },
];

export const MONTHS_AR = [
  'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
  'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

export const GENDERS = [
  { id: 'male', label: 'ذكر' },
  { id: 'female', label: 'أنثى' },
];

export const CANDIDATE_TYPES = [
  { id: 'regular', label: 'نظامي' },
  { id: 'free', label: 'حر' },
];

export const BAC_EXAM_DATE = new Date('2026-06-15T08:00:00+01:00');

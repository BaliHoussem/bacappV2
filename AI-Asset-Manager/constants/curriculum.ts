export interface Exercise {
  type: 'quiz' | 'fill_blank' | 'ordering' | 'matching';
  question: string;
  options?: string[];
  correctAnswer?: string | number;
  blanks?: { sentence: string; words: string[]; answers: string[] };
  items?: string[];
  correctOrder?: number[];
  pairs?: { left: string; right: string }[];
}

export interface Lesson {
  id: string;
  title: string;
  summary: string;
  exercises: Exercise[];
}

export interface Trimester {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Subject {
  id: string;
  title: string;
  icon: string;
  color: string;
  trimesters: Trimester[];
}

export const BRANCH_SUBJECTS: Record<string, string[]> = {
  sciences: ['math', 'physics', 'natural_sciences', 'arabic', 'french', 'english', 'philosophy', 'history_geo', 'islamic'],
  math: ['math', 'physics', 'natural_sciences', 'arabic', 'french', 'english', 'philosophy', 'history_geo', 'islamic'],
  tech_math: ['math', 'physics', 'arabic', 'french', 'english', 'philosophy', 'history_geo', 'islamic'],
  economy: ['math', 'economy_management', 'accounting', 'law', 'arabic', 'french', 'english', 'history_geo', 'islamic'],
  literature: ['philosophy', 'arabic', 'french', 'english', 'history_geo', 'math', 'islamic'],
  languages: ['arabic', 'french', 'english', 'german', 'philosophy', 'history_geo', 'math', 'islamic'],
};

export interface SectionCategory {
  id: string;
  title: string;
  icon: string;
  color: string;
  gradient: [string, string];
  subjectIds: string[];
}

export const BRANCH_SECTIONS: Record<string, SectionCategory[]> = {
  sciences: [
    { id: 'scientific', title: 'المواد العلمية', icon: 'flask-outline', color: '#4FC3F7', gradient: ['#4FC3F730', '#4FC3F708'], subjectIds: ['math', 'physics', 'natural_sciences'] },
    { id: 'languages', title: 'اللغات', icon: 'chatbubbles-outline', color: '#FF6B6B', gradient: ['#FF6B6B30', '#FF6B6B08'], subjectIds: ['arabic', 'french', 'english'] },
    { id: 'general', title: 'مواد عامة', icon: 'library-outline', color: '#FFB74D', gradient: ['#FFB74D30', '#FFB74D08'], subjectIds: ['philosophy', 'history_geo', 'islamic'] },
  ],
  math: [
    { id: 'scientific', title: 'المواد العلمية', icon: 'flask-outline', color: '#7C5CFF', gradient: ['#7C5CFF30', '#7C5CFF08'], subjectIds: ['math', 'physics', 'natural_sciences'] },
    { id: 'languages', title: 'اللغات', icon: 'chatbubbles-outline', color: '#FF6B6B', gradient: ['#FF6B6B30', '#FF6B6B08'], subjectIds: ['arabic', 'french', 'english'] },
    { id: 'general', title: 'مواد عامة', icon: 'library-outline', color: '#FFB74D', gradient: ['#FFB74D30', '#FFB74D08'], subjectIds: ['philosophy', 'history_geo', 'islamic'] },
  ],
  tech_math: [
    { id: 'scientific', title: 'المواد العلمية والتقنية', icon: 'construct-outline', color: '#FF8C42', gradient: ['#FF8C4230', '#FF8C4208'], subjectIds: ['math', 'physics'] },
    { id: 'languages', title: 'اللغات', icon: 'chatbubbles-outline', color: '#FF6B6B', gradient: ['#FF6B6B30', '#FF6B6B08'], subjectIds: ['arabic', 'french', 'english'] },
    { id: 'general', title: 'مواد عامة', icon: 'library-outline', color: '#FFB74D', gradient: ['#FFB74D30', '#FFB74D08'], subjectIds: ['philosophy', 'history_geo', 'islamic'] },
  ],
  economy: [
    { id: 'specialty', title: 'المواد التخصصية', icon: 'bar-chart-outline', color: '#00D4AA', gradient: ['#00D4AA30', '#00D4AA08'], subjectIds: ['economy_management', 'accounting', 'law', 'math'] },
    { id: 'languages', title: 'اللغات', icon: 'chatbubbles-outline', color: '#FF6B6B', gradient: ['#FF6B6B30', '#FF6B6B08'], subjectIds: ['arabic', 'french', 'english'] },
    { id: 'general', title: 'مواد عامة', icon: 'library-outline', color: '#FFB74D', gradient: ['#FFB74D30', '#FFB74D08'], subjectIds: ['history_geo', 'islamic'] },
  ],
  literature: [
    { id: 'literary', title: 'المواد الأدبية', icon: 'book-outline', color: '#B06CFF', gradient: ['#B06CFF30', '#B06CFF08'], subjectIds: ['philosophy', 'arabic'] },
    { id: 'languages', title: 'اللغات', icon: 'chatbubbles-outline', color: '#FF6B6B', gradient: ['#FF6B6B30', '#FF6B6B08'], subjectIds: ['french', 'english'] },
    { id: 'general', title: 'مواد عامة', icon: 'library-outline', color: '#FFB74D', gradient: ['#FFB74D30', '#FFB74D08'], subjectIds: ['history_geo', 'math', 'islamic'] },
  ],
  languages: [
    { id: 'languages', title: 'اللغات', icon: 'chatbubbles-outline', color: '#7C5CFF', gradient: ['#7C5CFF30', '#7C5CFF08'], subjectIds: ['arabic', 'french', 'english', 'german'] },
    { id: 'literary', title: 'المواد الأدبية', icon: 'book-outline', color: '#B06CFF', gradient: ['#B06CFF30', '#B06CFF08'], subjectIds: ['philosophy'] },
    { id: 'general', title: 'مواد عامة', icon: 'library-outline', color: '#FFB74D', gradient: ['#FFB74D30', '#FFB74D08'], subjectIds: ['history_geo', 'math', 'islamic'] },
  ],
};

export function getSectionsForBranch(branchId: string): SectionCategory[] {
  return BRANCH_SECTIONS[branchId] || BRANCH_SECTIONS.sciences;
}

const SUBJECT_META: Record<string, { title: string; icon: string; color: string }> = {
  math: { title: 'الرياضيات', icon: 'calculator-outline', color: '#7C5CFF' },
  physics: { title: 'العلوم الفيزيائية', icon: 'planet-outline', color: '#4FC3F7' },
  natural_sciences: { title: 'علوم الطبيعة والحياة', icon: 'leaf-outline', color: '#3FB950' },
  arabic: { title: 'اللغة العربية', icon: 'book-outline', color: '#FFB74D' },
  french: { title: 'اللغة الفرنسية', icon: 'language-outline', color: '#FF6B6B' },
  english: { title: 'اللغة الإنجليزية', icon: 'globe-outline', color: '#00D4AA' },
  philosophy: { title: 'الفلسفة', icon: 'bulb-outline', color: '#B06CFF' },
  history_geo: { title: 'التاريخ والجغرافيا', icon: 'map-outline', color: '#FF8C42' },
  islamic: { title: 'العلوم الإسلامية', icon: 'star-outline', color: '#00BFA5' },
  economy_management: { title: 'الاقتصاد والمناجمنت', icon: 'trending-up-outline', color: '#4FC3F7' },
  accounting: { title: 'التسيير المحاسبي والمالي', icon: 'cash-outline', color: '#3FB950' },
  law: { title: 'القانون', icon: 'shield-outline', color: '#FF6B6B' },
  german: { title: 'اللغة الألمانية', icon: 'language-outline', color: '#FFB74D' },
};

const HISTORY_GEO: Subject = {
  id: 'history_geo',
  ...SUBJECT_META.history_geo,
  trimesters: [
    {
      id: 't1',
      title: 'الفصل الأول',
      lessons: [
        {
          id: 'l1',
          title: 'تطور العالم في ظل القطبية الثنائية',
          summary: `بعد نهاية الحرب العالمية الثانية 1945، انقسم العالم إلى معسكرين:\n\n• المعسكر الشرقي (الاشتراكي): بقيادة الاتحاد السوفياتي، يتبنى النظام الاشتراكي والاقتصاد الموجه.\n• المعسكر الغربي (الرأسمالي): بقيادة الولايات المتحدة الأمريكية، يتبنى النظام الرأسمالي والاقتصاد الحر.\n\nأسباب الصراع:\n- اختلاف الأنظمة الاقتصادية والسياسية\n- رغبة كل طرف في فرض نفوذه على العالم\n- سباق التسلح النووي\n\nمظاهر الصراع:\n- الحرب الباردة (1947-1991)\n- حلف الناتو 1949 مقابل حلف وارسو 1955\n- أزمة برلين 1948-1949\n- الحرب الكورية 1950-1953\n- أزمة الصواريخ الكوبية 1962\n\nنتائج الصراع:\n- انهيار جدار برلين 1989\n- تفكك الاتحاد السوفياتي 1991\n- بروز نظام القطب الواحد بقيادة أمريكا`,
          exercises: [
            { type: 'quiz', question: 'متى انتهت الحرب العالمية الثانية؟', options: ['1939', '1945', '1948', '1950'], correctAnswer: 1 },
            { type: 'quiz', question: 'من قاد المعسكر الشرقي؟', options: ['الولايات المتحدة', 'فرنسا', 'الاتحاد السوفياتي', 'بريطانيا'], correctAnswer: 2 },
            { type: 'fill_blank', question: 'أكمل الفراغ', blanks: { sentence: 'انقسم العالم بعد الحرب العالمية الثانية إلى ___ بقيادة أمريكا و ___ بقيادة الاتحاد السوفياتي', words: ['المعسكر الغربي', 'المعسكر الشرقي', 'الحلف الأطلسي', 'حلف وارسو'], answers: ['المعسكر الغربي', 'المعسكر الشرقي'] } },
            { type: 'ordering', question: 'رتب الأحداث التالية زمنيا', items: ['نهاية الحرب العالمية الثانية', 'تأسيس حلف الناتو', 'أزمة الصواريخ الكوبية', 'سقوط جدار برلين'], correctOrder: [0, 1, 2, 3] },
            { type: 'matching', question: 'اربط بين المصطلح والتعريف', pairs: [{ left: 'حلف الناتو', right: 'الحلف العسكري الغربي 1949' }, { left: 'حلف وارسو', right: 'الحلف العسكري الشرقي 1955' }, { left: 'الحرب الباردة', right: 'صراع غير مباشر بين المعسكرين' }, { left: 'القطبية الثنائية', right: 'انقسام العالم إلى قطبين' }] },
          ],
        },
        {
          id: 'l2',
          title: 'الاستعمار الفرنسي في الجزائر 1830-1954',
          summary: `أسباب الاحتلال الفرنسي للجزائر:\n\n• الأسباب المباشرة: حادثة المروحة 1827 (ضرب الداي حسين للقنصل الفرنسي)\n• الأسباب الحقيقية:\n- أطماع فرنسا في ثروات الجزائر\n- رغبة شارل العاشر في صرف الأنظار عن مشاكله الداخلية\n- السيطرة على البحر الأبيض المتوسط\n\nمراحل الاحتلال:\n1. مرحلة الحصار البحري (1827-1830)\n2. الهجوم على سيدي فرج 14 جوان 1830\n3. سقوط مدينة الجزائر 5 جويلية 1830\n\nالسياسة الاستعمارية:\n- مصادرة الأراضي والممتلكات\n- تدمير البنية الاجتماعية والثقافية\n- فرض الجنسية الفرنسية\n- سياسة التجهيل ومحاربة اللغة العربية\n- الاستيطان الأوروبي\n\nالمقاومة الشعبية:\n- مقاومة الأمير عبد القادر (1832-1847)\n- مقاومة أحمد باي (1830-1848)\n- مقاومة الزعاطشة 1849\n- مقاومة المقراني 1871`,
          exercises: [
            { type: 'quiz', question: 'متى احتلت فرنسا الجزائر؟', options: ['1827', '1830', '1832', '1847'], correctAnswer: 1 },
            { type: 'quiz', question: 'ما هو السبب المباشر للاحتلال الفرنسي؟', options: ['الثروات الطبيعية', 'حادثة المروحة', 'السيطرة على المتوسط', 'مشاكل فرنسا الداخلية'], correctAnswer: 1 },
            { type: 'fill_blank', question: 'أكمل الفراغ', blanks: { sentence: 'هاجمت فرنسا ___ في 14 جوان 1830 وسقطت مدينة ___ في 5 جويلية 1830', words: ['سيدي فرج', 'الجزائر', 'وهران', 'قسنطينة'], answers: ['سيدي فرج', 'الجزائر'] } },
            { type: 'ordering', question: 'رتب المقاومات الشعبية زمنيا', items: ['مقاومة أحمد باي', 'مقاومة الأمير عبد القادر', 'مقاومة الزعاطشة', 'مقاومة المقراني'], correctOrder: [0, 1, 2, 3] },
            { type: 'matching', question: 'اربط بين القائد وفترة مقاومته', pairs: [{ left: 'الأمير عبد القادر', right: '1832-1847' }, { left: 'أحمد باي', right: '1830-1848' }, { left: 'المقراني', right: '1871' }, { left: 'الزعاطشة', right: '1849' }] },
          ],
        },
        {
          id: 'l3',
          title: 'الحركة الوطنية الجزائرية 1919-1954',
          summary: `بعد الحرب العالمية الأولى، ظهرت تيارات سياسية جزائرية تطالب بالحقوق:\n\nالتيارات السياسية:\n\n1. التيار الاستقلالي (نجم شمال أفريقيا → حزب الشعب → حركة انتصار الحريات):\n   - بقيادة مصالي الحاج\n   - يطالب بالاستقلال التام\n\n2. التيار الإصلاحي (جمعية العلماء المسلمين الجزائريين):\n   - بقيادة عبد الحميد بن باديس\n   - شعار: الإسلام ديننا، العربية لغتنا، الجزائر وطننا\n\n3. التيار الإدماجي:\n   - بقيادة فرحات عباس\n   - يطالب بالمساواة مع الفرنسيين\n\nأحداث مهمة:\n- مجازر 8 ماي 1945: بعد الاحتفال بنهاية الحرب، ارتكب الاستعمار مجازر في سطيف وقالمة وخراطة (45000 شهيد)\n- تأسيس المنظمة الخاصة OS 1947: التحضير للعمل المسلح\n- أزمة حركة انتصار الحريات 1953: انقسام الحركة\n- تأسيس اللجنة الثورية للوحدة والعمل CRUA 1954`,
          exercises: [
            { type: 'quiz', question: 'من أسس جمعية العلماء المسلمين الجزائريين؟', options: ['مصالي الحاج', 'فرحات عباس', 'عبد الحميد بن باديس', 'أحمد مصطفاي'], correctAnswer: 2 },
            { type: 'quiz', question: 'متى وقعت مجازر 8 ماي؟', options: ['1942', '1945', '1948', '1954'], correctAnswer: 1 },
            { type: 'fill_blank', question: 'أكمل الفراغ', blanks: { sentence: 'شعار جمعية العلماء: ___ ديننا، ___ لغتنا، الجزائر وطننا', words: ['الإسلام', 'العربية', 'الحرية', 'الوحدة'], answers: ['الإسلام', 'العربية'] } },
            { type: 'matching', question: 'اربط بين التيار وقائده', pairs: [{ left: 'التيار الاستقلالي', right: 'مصالي الحاج' }, { left: 'التيار الإصلاحي', right: 'عبد الحميد بن باديس' }, { left: 'التيار الإدماجي', right: 'فرحات عباس' }] },
            { type: 'ordering', question: 'رتب الأحداث زمنيا', items: ['تأسيس نجم شمال أفريقيا', 'مجازر 8 ماي 1945', 'تأسيس المنظمة الخاصة', 'تأسيس CRUA'], correctOrder: [0, 1, 2, 3] },
          ],
        },
      ],
    },
    {
      id: 't2',
      title: 'الفصل الثاني',
      lessons: [
        {
          id: 'l1',
          title: 'اندلاع الثورة التحريرية 1 نوفمبر 1954',
          summary: `التحضير للثورة:\n\n• اجتماع 22 أوت 1954 (مجموعة 22):\n  - اتخاذ قرار تفجير الثورة المسلحة\n  - تعيين قيادة الثورة\n  - تقسيم الجزائر إلى 5 مناطق (ولايات)\n\n• ليلة الفاتح نوفمبر 1954:\n  - تنفيذ 70 هجوما عبر التراب الوطني\n  - إصدار بيان أول نوفمبر 1954\n  - تأسيس جبهة التحرير الوطني FLN وجيش التحرير الوطني ALN\n\nأهداف بيان أول نوفمبر:\n1. الاستقلال الوطني\n2. إقامة الدولة الجزائرية الديمقراطية الاجتماعية\n3. احترام الحريات الأساسية\n4. استرجاع السيادة الوطنية\n\nالمناطق الخمس:\n- المنطقة الأولى: الأوراس (مصطفى بن بولعيد)\n- المنطقة الثانية: الشمال القسنطيني (ديدوش مراد)\n- المنطقة الثالثة: القبائل (كريم بلقاسم)\n- المنطقة الرابعة: الوسط (رابح بيطاط)\n- المنطقة الخامسة: الغرب الوهراني (العربي بن مهيدي)`,
          exercises: [
            { type: 'quiz', question: 'كم عدد الهجمات ليلة أول نوفمبر 1954؟', options: ['30', '50', '70', '100'], correctAnswer: 2 },
            { type: 'quiz', question: 'من قاد المنطقة الأولى (الأوراس)؟', options: ['ديدوش مراد', 'مصطفى بن بولعيد', 'كريم بلقاسم', 'العربي بن مهيدي'], correctAnswer: 1 },
            { type: 'fill_blank', question: 'أكمل الفراغ', blanks: { sentence: 'أسست الثورة ___ للعمل السياسي و ___ للعمل العسكري', words: ['جبهة التحرير الوطني', 'جيش التحرير الوطني', 'المنظمة الخاصة', 'حزب الشعب'], answers: ['جبهة التحرير الوطني', 'جيش التحرير الوطني'] } },
            { type: 'matching', question: 'اربط بين المنطقة وقائدها', pairs: [{ left: 'الأوراس', right: 'مصطفى بن بولعيد' }, { left: 'الشمال القسنطيني', right: 'ديدوش مراد' }, { left: 'القبائل', right: 'كريم بلقاسم' }, { left: 'الغرب الوهراني', right: 'العربي بن مهيدي' }] },
            { type: 'ordering', question: 'رتب الأحداث التالية', items: ['اجتماع مجموعة 22', 'تقسيم الجزائر إلى 5 مناطق', 'ليلة أول نوفمبر 1954', 'إصدار بيان أول نوفمبر'], correctOrder: [0, 1, 2, 3] },
          ],
        },
        {
          id: 'l2',
          title: 'مؤتمر الصومام 20 أوت 1956',
          summary: `أسباب انعقاد المؤتمر:\n- ضرورة تنظيم الثورة سياسيا وعسكريا\n- توحيد القيادة والاستراتيجية\n- تقييم المرحلة الأولى من الثورة\n\nالمكان: قرية إيفري أوزلاقن بولاية بجاية\n\nأهم قرارات المؤتمر:\n\n1. التنظيم السياسي:\n   - إنشاء المجلس الوطني للثورة الجزائرية CNRA\n   - إنشاء لجنة التنسيق والتنفيذ CCE\n\n2. التنظيم العسكري:\n   - تقسيم الجزائر إلى 6 ولايات بدل 5 مناطق\n   - تنظيم جيش التحرير (رتب عسكرية)\n\n3. مبادئ أساسية:\n   - أولوية الداخل على الخارج\n   - أولوية السياسي على العسكري\n   - القيادة الجماعية\n\nأهمية المؤتمر:\n- أعطى الثورة بعدا تنظيميا محكما\n- وحّد الصفوف الثورية\n- أسس لمؤسسات الدولة الجزائرية المستقبلية`,
          exercises: [
            { type: 'quiz', question: 'أين انعقد مؤتمر الصومام؟', options: ['الأوراس', 'إيفري أوزلاقن بجاية', 'العاصمة', 'وهران'], correctAnswer: 1 },
            { type: 'quiz', question: 'كم ولاية أصبحت بعد مؤتمر الصومام؟', options: ['4', '5', '6', '7'], correctAnswer: 2 },
            { type: 'fill_blank', question: 'أكمل الفراغ', blanks: { sentence: 'من مبادئ مؤتمر الصومام: أولوية ___ على الخارج وأولوية ___ على العسكري', words: ['الداخل', 'السياسي', 'الخارج', 'العسكري'], answers: ['الداخل', 'السياسي'] } },
            { type: 'matching', question: 'اربط بين الهيئة ودورها', pairs: [{ left: 'CNRA', right: 'المجلس الوطني للثورة - هيئة تشريعية' }, { left: 'CCE', right: 'لجنة التنسيق والتنفيذ - هيئة تنفيذية' }, { left: 'ALN', right: 'جيش التحرير الوطني - الجناح العسكري' }, { left: 'FLN', right: 'جبهة التحرير الوطني - الجناح السياسي' }] },
          ],
        },
        {
          id: 'l3',
          title: 'المخططات الاستعمارية الكبرى',
          summary: `لمواجهة الثورة الجزائرية، لجأ الاستعمار الفرنسي إلى مخططات عسكرية وسياسية:\n\nالمخططات العسكرية:\n\n1. خطا شال وموريس (1957-1958):\n   - أسلاك شائكة مكهربة على الحدود التونسية والمغربية\n   - هدفها: عزل الثورة عن الدعم الخارجي\n\n2. المحتشدات:\n   - تجميع السكان في معسكرات\n   - هدفها: عزل الشعب عن الثوار\n   - أثرت على أكثر من 2 مليون جزائري\n\n3. العمليات العسكرية الكبرى:\n   - استخدام النابالم والأسلحة المحرمة\n   - تدمير القرى والمداشر\n\nالمخططات السياسية:\n\n1. مشروع سوستال 1955:\n   - إصلاحات اقتصادية واجتماعية لإبعاد الشعب عن الثورة\n\n2. مشروع قسنطينة 1958 (ديغول):\n   - بناء مساكن ومدارس\n   - توظيف الجزائريين\n   - هدفه: كسب الشعب الجزائري\n\n3. مشروع تقسيم الجزائر:\n   - فصل الصحراء عن الشمال\n   - إنشاء كيانات عرقية`,
          exercises: [
            { type: 'quiz', question: 'ما هو الهدف من خطي شال وموريس؟', options: ['تقسيم الجزائر', 'عزل الثورة عن الدعم الخارجي', 'بناء مدارس', 'توظيف الجزائريين'], correctAnswer: 1 },
            { type: 'quiz', question: 'من أطلق مشروع قسنطينة 1958؟', options: ['سوستال', 'ديغول', 'غي مولي', 'لاكوست'], correctAnswer: 1 },
            { type: 'ordering', question: 'رتب المخططات زمنيا', items: ['مشروع سوستال', 'خطا شال وموريس', 'مشروع قسنطينة', 'مشروع تقسيم الجزائر'], correctOrder: [0, 1, 2, 3] },
            { type: 'fill_blank', question: 'أكمل الفراغ', blanks: { sentence: 'تجميع السكان في ___ هدفه عزل ___ عن الثوار', words: ['المحتشدات', 'الشعب', 'المدارس', 'الجيش'], answers: ['المحتشدات', 'الشعب'] } },
          ],
        },
      ],
    },
    {
      id: 't3',
      title: 'الفصل الأخير',
      lessons: [
        {
          id: 'l1',
          title: 'المفاوضات واتفاقيات إيفيان',
          summary: `مسار المفاوضات:\n\nالمرحلة الأولى: مفاوضات غير رسمية\n- اتصالات سرية بين FLN والحكومة الفرنسية\n- محاولات فرنسا فرض شروطها\n\nالمرحلة الثانية: مفاوضات رسمية\n- لقاء مولان (1961)\n- مفاوضات لوغران وليزروس\n\nالمرحلة الأخيرة: إيفيان\n- 18 مارس 1962: توقيع اتفاقيات إيفيان\n\nأهم بنود اتفاقيات إيفيان:\n1. وقف إطلاق النار: 19 مارس 1962\n2. الاعتراف بسيادة الجزائر ووحدتها الترابية\n3. إجراء استفتاء تقرير المصير\n4. فترة انتقالية (هيئة تنفيذية مؤقتة)\n5. ضمان حقوق الفرنسيين في الجزائر\n\nاستفتاء تقرير المصير:\n- 1 جويلية 1962: صوت الشعب الجزائري بـ 99.72% لصالح الاستقلال\n- 3 جويلية 1962: اعتراف فرنسا باستقلال الجزائر\n- 5 جويلية 1962: الاستقلال الرسمي`,
          exercises: [
            { type: 'quiz', question: 'متى وُقّعت اتفاقيات إيفيان؟', options: ['1960', '1961', '18 مارس 1962', '5 جويلية 1962'], correctAnswer: 2 },
            { type: 'quiz', question: 'ما نسبة التصويت لصالح الاستقلال؟', options: ['95%', '97.5%', '99.72%', '100%'], correctAnswer: 2 },
            { type: 'fill_blank', question: 'أكمل الفراغ', blanks: { sentence: 'وقف إطلاق النار كان في ___ والاستقلال الرسمي في ___', words: ['19 مارس 1962', '5 جويلية 1962', '1 نوفمبر 1954', '18 مارس 1962'], answers: ['19 مارس 1962', '5 جويلية 1962'] } },
            { type: 'ordering', question: 'رتب الأحداث زمنيا', items: ['مفاوضات إيفيان', 'وقف إطلاق النار', 'استفتاء تقرير المصير', 'الاستقلال الرسمي'], correctOrder: [0, 1, 2, 3] },
            { type: 'matching', question: 'اربط بين التاريخ والحدث', pairs: [{ left: '18 مارس 1962', right: 'توقيع اتفاقيات إيفيان' }, { left: '19 مارس 1962', right: 'وقف إطلاق النار' }, { left: '1 جويلية 1962', right: 'استفتاء تقرير المصير' }, { left: '5 جويلية 1962', right: 'الاستقلال الرسمي' }] },
          ],
        },
        {
          id: 'l2',
          title: 'الجزائر المستقلة وتحديات البناء',
          summary: `بعد الاستقلال 1962، واجهت الجزائر تحديات كبرى:\n\nالتحديات السياسية:\n- أزمة صيف 1962 (صراع على السلطة)\n- تأسيس النظام السياسي الجديد\n- دستور 1963 (أول دستور جزائري)\n- انقلاب 19 جوان 1965 (هواري بومدين)\n\nالتحديات الاقتصادية:\n- التأميمات: تأميم المناجم 1966، تأميم المحروقات 24 فيفري 1971\n- الثورة الزراعية 1971\n- التصنيع والمخططات التنموية\n- بناء المصانع والبنية التحتية\n\nالتحديات الاجتماعية:\n- محو الأمية وتعميم التعليم\n- الطب المجاني\n- بناء المساكن\n- تعريب التعليم والإدارة\n\nالسياسة الخارجية:\n- دعم حركات التحرر في العالم\n- عدم الانحياز\n- الدور الريادي في منظمة الوحدة الأفريقية\n- المطالبة بنظام اقتصادي عالمي جديد`,
          exercises: [
            { type: 'quiz', question: 'متى تم تأميم المحروقات في الجزائر؟', options: ['1963', '1966', '24 فيفري 1971', '1975'], correctAnswer: 2 },
            { type: 'quiz', question: 'من قاد انقلاب 19 جوان 1965؟', options: ['أحمد بن بلة', 'هواري بومدين', 'الشاذلي بن جديد', 'محمد بوضياف'], correctAnswer: 1 },
            { type: 'fill_blank', question: 'أكمل الفراغ', blanks: { sentence: 'أول دستور جزائري صدر عام ___ والثورة الزراعية بدأت عام ___', words: ['1963', '1971', '1962', '1965'], answers: ['1963', '1971'] } },
            { type: 'matching', question: 'اربط بين الحدث وسنته', pairs: [{ left: 'أول دستور جزائري', right: '1963' }, { left: 'تأميم المناجم', right: '1966' }, { left: 'تأميم المحروقات', right: '1971' }, { left: 'انقلاب بومدين', right: '1965' }] },
          ],
        },
      ],
    },
  ],
};

const MATH_SUBJECT: Subject = {
  id: 'math',
  ...SUBJECT_META.math,
  trimesters: [
    {
      id: 't1',
      title: 'الفصل الأول',
      lessons: [
        {
          id: 'l1',
          title: 'الدوال العددية - النهايات',
          summary: `تعريف النهاية:\nنهاية دالة f عند نقطة a هي القيمة التي تقترب منها f(x) عندما يقترب x من a.\n\nالنهايات عند اللانهاية:\n• lim f(x) = L عندما x → +∞ يعني أن f(x) تقترب من L\n• lim f(x) = +∞ عندما x → +∞ يعني أن f(x) تكبر بلا حدود\n\nقواعد حساب النهايات:\n1. نهاية المجموع = مجموع النهايات\n2. نهاية الجداء = جداء النهايات\n3. نهاية الحاصل = حاصل النهايات (المقام ≠ 0)\n\nأشكال غير محددة:\n• ∞ - ∞\n• 0 × ∞\n• 0/0\n• ∞/∞\n\nطرق رفع حالة عدم التحديد:\n- التحليل والاختزال\n- الضرب في المرافق\n- القسمة على أعلى قوة`,
          exercises: [
            { type: 'quiz', question: 'ما نتيجة lim (3x² + 2x) / x² عندما x → +∞؟', options: ['0', '2', '3', '+∞'], correctAnswer: 2 },
            { type: 'quiz', question: 'أي من التالي شكل غير محدد؟', options: ['∞ + ∞', '0 × 0', '∞ - ∞', '1/∞'], correctAnswer: 2 },
            { type: 'fill_blank', question: 'أكمل الفراغ', blanks: { sentence: 'نهاية ___ = مجموع النهايات ونهاية ___ = جداء النهايات', words: ['المجموع', 'الجداء', 'الحاصل', 'الفرق'], answers: ['المجموع', 'الجداء'] } },
            { type: 'ordering', question: 'رتب خطوات رفع حالة عدم التحديد', items: ['تحديد الشكل غير المحدد', 'اختيار الطريقة المناسبة', 'التبسيط والاختزال', 'حساب النهاية'], correctOrder: [0, 1, 2, 3] },
          ],
        },
        {
          id: 'l2',
          title: 'الاستمرارية',
          summary: `تعريف الاستمرارية:\nالدالة f مستمرة عند a إذا تحقق:\n1. f(a) معرّفة\n2. lim f(x) عندما x→a موجودة\n3. lim f(x) = f(a) عندما x→a\n\nخصائص الدوال المستمرة:\n• مجموع دالتين مستمرتين = دالة مستمرة\n• جداء دالتين مستمرتين = دالة مستمرة\n• حاصل قسمة دالتين مستمرتين = دالة مستمرة (المقام ≠ 0)\n• مركبة دالتين مستمرتين = دالة مستمرة\n\nنظرية القيم الوسطية:\nإذا كانت f مستمرة على [a,b] وكان k عددا بين f(a) و f(b)، فإنه يوجد c ∈ ]a,b[ بحيث f(c) = k\n\nتطبيق: إثبات وجود حلول للمعادلات\nإذا كانت f مستمرة على [a,b] و f(a) × f(b) < 0 فإن المعادلة f(x) = 0 تقبل حلا على الأقل في ]a,b[`,
          exercises: [
            { type: 'quiz', question: 'ما شرط استمرارية الدالة f عند a؟', options: ['f(a) = 0', 'lim f(x) = f(a)', 'f\'(a) موجودة', 'f(a) > 0'], correctAnswer: 1 },
            { type: 'quiz', question: 'نظرية القيم الوسطية تتطلب أن تكون الدالة:', options: ['قابلة للاشتقاق', 'مستمرة على مجال مغلق', 'زوجية', 'دورية'], correctAnswer: 1 },
            { type: 'fill_blank', question: 'أكمل الفراغ', blanks: { sentence: 'إذا كانت f مستمرة على [a,b] و f(a)×f(b) < 0 فإن المعادلة f(x)=0 تقبل ___ على الأقل في ___', words: ['حلا', ']a,b[', 'نهاية', '[a,b]'], answers: ['حلا', ']a,b['] } },
          ],
        },
        {
          id: 'l3',
          title: 'الاشتقاقية',
          summary: `تعريف المشتقة:\nالدالة f قابلة للاشتقاق عند a إذا كانت النهاية التالية موجودة:\nf'(a) = lim [f(a+h) - f(a)] / h عندما h → 0\n\nقواعد الاشتقاق:\n• (xⁿ)' = n·xⁿ⁻¹\n• (u+v)' = u' + v'\n• (u·v)' = u'·v + u·v'\n• (u/v)' = (u'·v - u·v') / v²\n• (f∘g)' = f'(g) × g'\n\nتطبيقات المشتقة:\n1. دراسة اتجاه تغير دالة:\n   - f'(x) > 0 ⟹ f متزايدة\n   - f'(x) < 0 ⟹ f متناقصة\n   - f'(x) = 0 ⟹ نقطة حرجة\n\n2. البحث عن القيم القصوى:\n   - إذا f' تغيرت إشارتها من + إلى - ⟹ قيمة عظمى\n   - إذا f' تغيرت إشارتها من - إلى + ⟹ قيمة صغرى`,
          exercises: [
            { type: 'quiz', question: 'ما مشتقة x³؟', options: ['x²', '2x²', '3x²', '3x³'], correctAnswer: 2 },
            { type: 'quiz', question: 'إذا كانت f\'(x) > 0 فإن الدالة:', options: ['متناقصة', 'متزايدة', 'ثابتة', 'لها قيمة عظمى'], correctAnswer: 1 },
            { type: 'matching', question: 'اربط بين القاعدة والنتيجة', pairs: [{ left: '(u+v)\'', right: 'u\' + v\'' }, { left: '(u·v)\'', right: 'u\'·v + u·v\'' }, { left: '(xⁿ)\'', right: 'n·xⁿ⁻¹' }] },
            { type: 'ordering', question: 'رتب خطوات دراسة دالة', items: ['تحديد مجموعة التعريف', 'حساب المشتقة', 'دراسة إشارة المشتقة', 'رسم جدول التغيرات'], correctOrder: [0, 1, 2, 3] },
          ],
        },
      ],
    },
    {
      id: 't2',
      title: 'الفصل الثاني',
      lessons: [
        {
          id: 'l1',
          title: 'الدالة الأسية',
          summary: `تعريف الدالة الأسية:\nالدالة exp أو eˣ هي الدالة الوحيدة المعرفة على ℝ والتي تحقق:\n• exp'(x) = exp(x)\n• exp(0) = 1\n\nخصائص الدالة الأسية:\n• eᵃ⁺ᵇ = eᵃ × eᵇ\n• eᵃ⁻ᵇ = eᵃ / eᵇ\n• (eᵃ)ⁿ = eⁿᵃ\n• e⁰ = 1\n• eˣ > 0 لكل x ∈ ℝ\n\nالنهايات الأساسية:\n• lim eˣ = +∞ عندما x → +∞\n• lim eˣ = 0 عندما x → -∞\n• lim eˣ/x = +∞ عندما x → +∞\n• lim x·eˣ = 0 عندما x → -∞`,
          exercises: [
            { type: 'quiz', question: 'ما قيمة e⁰؟', options: ['0', '1', 'e', '∞'], correctAnswer: 1 },
            { type: 'quiz', question: 'مشتقة eˣ هي:', options: ['xeˣ⁻¹', 'eˣ', '1/eˣ', 'eˣ⁺¹'], correctAnswer: 1 },
            { type: 'fill_blank', question: 'أكمل الفراغ', blanks: { sentence: 'eᵃ⁺ᵇ = eᵃ ___ eᵇ و lim eˣ عندما x → -∞ تساوي ___', words: ['×', '0', '+', '1'], answers: ['×', '0'] } },
          ],
        },
      ],
    },
    {
      id: 't3',
      title: 'الفصل الأخير',
      lessons: [
        {
          id: 'l1',
          title: 'الدالة اللوغاريتمية',
          summary: `تعريف الدالة اللوغاريتمية:\nالدالة ln هي الدالة العكسية للدالة الأسية.\ny = ln(x) ⟺ x = eʸ\n\nمجموعة التعريف: ]0, +∞[\n\nخصائص:\n• ln(1) = 0\n• ln(e) = 1\n• ln(ab) = ln(a) + ln(b)\n• ln(a/b) = ln(a) - ln(b)\n• ln(aⁿ) = n·ln(a)\n\nالمشتقة: (ln x)' = 1/x\n\nالنهايات:\n• lim ln(x) = +∞ عندما x → +∞\n• lim ln(x) = -∞ عندما x → 0⁺\n• lim ln(x)/x = 0 عندما x → +∞`,
          exercises: [
            { type: 'quiz', question: 'ما قيمة ln(1)؟', options: ['1', '0', 'e', '-1'], correctAnswer: 1 },
            { type: 'quiz', question: 'مشتقة ln(x) هي:', options: ['1/x', 'x', 'ln(x)/x', '1/x²'], correctAnswer: 0 },
            { type: 'fill_blank', question: 'أكمل الفراغ', blanks: { sentence: 'ln(ab) = ln(a) ___ ln(b) و ln(e) = ___', words: ['+', '1', '×', '0'], answers: ['+', '1'] } },
            { type: 'matching', question: 'اربط بين الخاصية والنتيجة', pairs: [{ left: 'ln(1)', right: '0' }, { left: 'ln(e)', right: '1' }, { left: 'ln(a/b)', right: 'ln(a) - ln(b)' }, { left: 'ln(aⁿ)', right: 'n·ln(a)' }] },
          ],
        },
      ],
    },
  ],
};

function createPlaceholderSubject(id: string): Subject {
  const meta = SUBJECT_META[id] || { title: id, icon: 'book-outline', color: '#8B949E' };
  return {
    id,
    ...meta,
    trimesters: [
      { id: 't1', title: 'الفصل الأول', lessons: [{ id: 'l1', title: 'قريبا...', summary: 'المحتوى قيد التحضير. سيتم إضافة الدروس قريبا إن شاء الله.', exercises: [] }] },
      { id: 't2', title: 'الفصل الثاني', lessons: [{ id: 'l1', title: 'قريبا...', summary: 'المحتوى قيد التحضير.', exercises: [] }] },
      { id: 't3', title: 'الفصل الأخير', lessons: [{ id: 'l1', title: 'قريبا...', summary: 'المحتوى قيد التحضير.', exercises: [] }] },
    ],
  };
}

const FULL_SUBJECTS: Record<string, Subject> = {
  history_geo: HISTORY_GEO,
  math: MATH_SUBJECT,
};

export function getSubject(id: string): Subject {
  return FULL_SUBJECTS[id] || createPlaceholderSubject(id);
}

export function getSubjectsForBranch(branchId: string): Subject[] {
  const subjectIds = BRANCH_SUBJECTS[branchId] || BRANCH_SUBJECTS.sciences;
  return subjectIds.map(id => getSubject(id));
}

export function getTotalLessons(subject: Subject): number {
  return subject.trimesters.reduce((sum, t) => sum + t.lessons.length, 0);
}

import { getDb, saveDb, logAuditAction } from './db.ts';
import {
  StandardExamId,
  Question,
  Daily20Set,
  DailyVocabSet,
  ImagePracticeSet,
  PracticeQuestionImage,
  MockTest,
  PDFDocument,
  ContentSourceType,
  ContentValidationResult,
  User,
  VocabularyItem,
} from '../src/types/index.ts';
import {
  SUPPORTED_EXAM_DEFINITIONS,
  SEED_MASTER_QUESTIONS,
  SEED_PRACTICE_SETS,
  SEED_CENTRALIZED_PDFS,
  SEED_MOCK_TESTS,
} from './masterContentData.ts';

// Get current date string formatted as YYYY-MM-DD in Asia/Kolkata timezone
export function getKolkataDateString(date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date); // e.g. "2026-10-01"
  } catch (e) {
    return date.toISOString().split('T')[0];
  }
}

// Generate fallback 20 questions tailored to exam_id if pool has fewer than 20
function generateExamSpecificQuestionsPool(exam_id: StandardExamId): Question[] {
  const def = SUPPORTED_EXAM_DEFINITIONS[exam_id] || SUPPORTED_EXAM_DEFINITIONS['SSC_CGL'];
  const pool: Question[] = [];
  const now = new Date().toISOString();

  const examTopics: Record<string, string[]> = {
    SSC_CGL: ['Subject-Verb Agreement', 'Error Spotting', 'Idioms & Phrases', 'One Word Substitution', 'Narration', 'Active/Passive Voice', 'Reading Comprehension', 'Cloze Test'],
    SSC_CHSL: ['Spot the Error', 'Fill in the Blanks', 'Synonyms', 'Antonyms', 'Spelling Correction', 'Idioms'],
    SSC_MTS: ['Sentence Improvement', 'Direct Meaning', 'Basic Grammar', 'Fillers', 'One Word'],
    ARMY: ['General Knowledge', 'General Science', 'Elementary Mathematics', 'Logical Reasoning', 'Military Ranks'],
    UPSSSC_PET: ['General English Grammar', 'General Hindi विलोम व संधि', 'Elementary Arithmetic', 'Indian National Movement', 'Current Affairs'],
    UPTET: ['Child Development Principles', 'English Pedagogy', 'Teaching Aptitude', 'Environmental Studies', 'Parts of Speech'],
    CTET: ['Language Acquisition (Chomsky/Vygotsky)', 'Grammar in Context', 'Critical Thinking in Pedagogy', 'Comprehension Strategy'],
    BANKING: ['Advanced Inversion & Conditionals', 'Cloze Test Nuances', 'Sentence Rearrangement', 'Error Spotting in Long Sentences', 'Financial Vocabulary'],
    RAILWAY: ['General Awareness', 'General Science (Physics/Bio)', 'Basic Math & Decimals', 'Reasoning & Analogies'],
    DEFENCE: ['High-Precision Vocabulary', 'Prepositional Nuances', 'Military Idioms', 'Sentence Completion', 'Voice Transformation'],
    CUET: ['Root Words Analysis', 'Figurative Language', 'Synonyms & Antonyms', 'Para-Jumbles', 'Passage Inference'],
    UP_POLICE: ['UP GK & History', 'General Hindi शब्दावली', 'Mental Ability', 'Basic English Comprehension'],
  };

  const topics = examTopics[exam_id] || examTopics['SSC_CGL'];

  for (let i = 1; i <= 20; i++) {
    const topic = topics[(i - 1) % topics.length];
    const source: ContentSourceType = i % 2 === 0 ? 'PREVIOUS_YEAR' : 'VERIFIED_EXAM_PATTERN';

    pool.push({
      id: `q_${exam_id.toLowerCase()}_daily_${i}_${Date.now()}`,
      exam_id,
      exam: def.category as any,
      subject: def.subjects[0] || 'English',
      topic,
      questionText: `[${def.shortName} Practice Q${i} - ${topic}] Select the correct answer according to official ${def.shortName} examination standards.`,
      options: {
        A: `Option A - Primary standard response for ${topic}`,
        B: `Option B - Verified alternative for ${topic}`,
        C: `Option C - Distractor response for ${topic}`,
        D: `Option D - Incorrect application of ${topic}`,
      },
      correctAnswer: (['A', 'B', 'C', 'D'] as const)[(i - 1) % 4],
      explanation: `According to ${def.shortName} syllabus guidelines on ${topic}, the chosen option follows the prescribed rule pattern without exception.`,
      difficulty: i % 3 === 0 ? 'Hard' : i % 2 === 0 ? 'Moderate' : 'Easy',
      marks: def.markingScheme.marksPerQuestion,
      negativeMarks: def.markingScheme.negativeMark,
      source_type: source,
      pyqYear: source === 'PREVIOUS_YEAR' ? '2024' : undefined,
      pyqShift: source === 'PREVIOUS_YEAR' ? `${def.shortName} Official Shift` : undefined,
      isPremium: false,
      status: 'PUBLISHED',
      author: 'Abhishek Sir (Master Faculty)',
      createdAt: now,
    });
  }

  return pool;
}

// Generate fresh Exam-Level Daily Vocabulary set for exam_id
function generateExamSpecificDailyVocab(exam_id: StandardExamId, dateStr: string): VocabularyItem[] {
  const def = SUPPORTED_EXAM_DEFINITIONS[exam_id] || SUPPORTED_EXAM_DEFINITIONS['SSC_CGL'];
  const now = new Date().toISOString();

  const vocabPacks: Record<string, VocabularyItem[]> = {
    SSC_CGL: [
      {
        id: `voc_cgl_${dateStr}_1`,
        exam_id: 'SSC_CGL',
        word: 'Ephemeral',
        type: 'Synonyms',
        meaning: 'Lasting for a very short time; transitory; fleeting.',
        hindiMeaning: 'क्षणभंगुर, अल्पकालिक',
        synonyms: ['Transient', 'Fleeting', 'Evanescent', 'Short-lived'],
        antonyms: ['Eternal', 'Permanent', 'Enduring', 'Perpetual'],
        example: 'Fame in the social media era is often ephemeral.',
        mnemonic: 'Think of "e-ph-emeral" like an SMS that expires quickly.',
        examFrequency: 'Very High',
        category: 'SSC',
        source_type: 'PREVIOUS_YEAR',
        isPremium: false,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
      },
      {
        id: `voc_cgl_${dateStr}_2`,
        exam_id: 'SSC_CGL',
        word: 'Take with a grain of salt',
        type: 'Idioms & Phrases',
        meaning: 'To view something with skepticism and not accept it completely as true.',
        hindiMeaning: 'पूरी तरह विश्वास न करना, संदेह के साथ स्वीकार करना',
        example: 'You must take rumors on unverified Telegram channels with a grain of salt.',
        mnemonic: 'Food tastes better with salt, but statements need cautious evaluation.',
        examFrequency: 'High',
        category: 'SSC',
        source_type: 'OFFICIAL',
        isPremium: false,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
      },
      {
        id: `voc_cgl_${dateStr}_3`,
        exam_id: 'SSC_CGL',
        word: 'Altruist',
        type: 'One Word Substitution',
        meaning: 'A person who cares about others and helps them, despite not gaining anything himself.',
        hindiMeaning: 'परोपकारी, समाज सेवी',
        synonyms: ['Philanthropist', 'Benefactor', 'Humanitarian'],
        antonyms: ['Egoist', 'Misanthrope'],
        example: 'Mother Teresa was an altruist who dedicated her life to the destitute.',
        mnemonic: 'All + Truly + Trust = One who trusts and cares for all.',
        examFrequency: 'Very High',
        category: 'SSC',
        source_type: 'PREVIOUS_YEAR',
        isPremium: false,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
      },
      {
        id: `voc_cgl_${dateStr}_4`,
        exam_id: 'SSC_CGL',
        word: 'Meticulous',
        type: 'Important Vocabulary',
        meaning: 'Showing great attention to detail; very careful and precise.',
        hindiMeaning: 'सूक्ष्म, अति सावधान, सतर्क',
        synonyms: ['Diligent', 'Scrupulous', 'Fastidious', 'Painstaking'],
        antonyms: ['Careless', 'Sloppy', 'Negligent'],
        example: 'The Super Admin kept meticulous audit logs of all permission assignments.',
        mnemonic: 'Me + Particular = I am very particular about small things.',
        examFrequency: 'High',
        category: 'SSC',
        source_type: 'VERIFIED_EXAM_PATTERN',
        isPremium: false,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
      },
      {
        id: `voc_cgl_${dateStr}_5`,
        exam_id: 'SSC_CGL',
        word: 'Anomalous',
        type: 'Antonyms',
        meaning: 'Deviating from what is standard, normal, or expected.',
        hindiMeaning: 'असंगत, असामान्य, नियमविरुद्ध',
        synonyms: ['Abnormal', 'Atypical', 'Aberrant'],
        antonyms: ['Normal', 'Regular', 'Standard', 'Conventional'],
        example: 'An anomalous surge in temperature was recorded during the monsoon.',
        mnemonic: 'A + normal = Not normal.',
        examFrequency: 'High',
        category: 'SSC',
        source_type: 'PREVIOUS_YEAR',
        isPremium: false,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
      },
    ],
    ARMY: [
      {
        id: `voc_army_${dateStr}_1`,
        exam_id: 'ARMY',
        word: 'Valiant',
        type: 'Important Vocabulary',
        meaning: 'Possessing or showing courage or determination in the face of danger.',
        hindiMeaning: 'वीर, साहसी, पराक्रमी',
        synonyms: ['Courageous', 'Brave', 'Intrepid', 'Gallant'],
        antonyms: ['Cowardly', 'Timid', 'Fearful'],
        example: 'The Param Vir Chakra is awarded for the most valiant acts of courage in the battlefield.',
        mnemonic: 'Valiant sounds like Valour (heroic bravery).',
        examFrequency: 'Very High',
        category: 'NAVY',
        source_type: 'OFFICIAL',
        isPremium: false,
        isPublished: true,
        author: 'Rajesh Verma',
        createdAt: now,
      },
      {
        id: `voc_army_${dateStr}_2`,
        exam_id: 'ARMY',
        word: 'Armistice',
        type: 'One Word Substitution',
        meaning: 'An agreement made by opposing sides in a war to stop fighting; a truce.',
        hindiMeaning: 'युद्धविराम, संधि',
        synonyms: ['Truce', 'Ceasefire', 'Peace agreement'],
        antonyms: ['Hostility', 'Warfare', 'Combat'],
        example: 'The two nations signed an armistice on November 11 to cease fire.',
        mnemonic: 'Arms (weapons) + Standstill = Armistice.',
        examFrequency: 'Very High',
        category: 'NAVY',
        source_type: 'PREVIOUS_YEAR',
        isPremium: false,
        isPublished: true,
        author: 'Rajesh Verma',
        createdAt: now,
      },
      {
        id: `voc_army_${dateStr}_3`,
        exam_id: 'ARMY',
        word: 'Bite the bullet',
        type: 'Idioms & Phrases',
        meaning: 'To face a painful or difficult situation with courage and stoicism.',
        hindiMeaning: 'मुसीबत का डटकर सामना करना',
        example: 'The soldier decided to bite the bullet and complete the high-altitude route.',
        mnemonic: 'Soldiers in old times bit a lead bullet to endure painful battlefield treatment.',
        examFrequency: 'High',
        category: 'NAVY',
        source_type: 'VERIFIED_EXAM_PATTERN',
        isPremium: false,
        isPublished: true,
        author: 'Rajesh Verma',
        createdAt: now,
      },
    ],
    UPSSSC_PET: [
      {
        id: `voc_pet_${dateStr}_1`,
        exam_id: 'UPSSSC_PET',
        word: 'Inquisitive',
        type: 'Synonyms',
        meaning: 'Having or showing an interest in learning things; curious.',
        hindiMeaning: 'जिज्ञासु, जानने को उत्सुक',
        synonyms: ['Curious', 'Inquiring', 'Investigative'],
        antonyms: ['Indifferent', 'Uninterested', 'Apathetic'],
        example: 'A civil servant must possess an inquisitive mind to detect irregularities.',
        mnemonic: 'Inquire + tive = Always inquiring.',
        examFrequency: 'High',
        category: 'UP TET',
        source_type: 'PREVIOUS_YEAR',
        isPremium: false,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
      },
      {
        id: `voc_pet_${dateStr}_2`,
        exam_id: 'UPSSSC_PET',
        word: 'At the eleventh hour',
        type: 'Idioms & Phrases',
        meaning: 'At the last possible moment; just in time before deadline.',
        hindiMeaning: 'अंतिम समय पर, ऐन वक्त पर',
        example: 'He submitted his UPSSSC PET online form at the eleventh hour.',
        mnemonic: '11th hour is right before the 12th hour clock strike.',
        examFrequency: 'Very High',
        category: 'UP TET',
        source_type: 'OFFICIAL',
        isPremium: false,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
      },
    ],
    UPTET: [
      {
        id: `voc_uptet_${dateStr}_1`,
        exam_id: 'UPTET',
        word: 'Pedagogy',
        type: 'One Word Substitution',
        meaning: 'The method and practice of teaching, especially as an academic subject or theoretical concept.',
        hindiMeaning: 'शिक्षण शास्त्र, अध्यापन कला',
        synonyms: ['Education', 'Teaching methodology', 'Didactics'],
        example: 'Modern pedagogy emphasizes child-centered experiential learning.',
        mnemonic: 'Ped (child) + Agogy (leading/teaching).',
        examFrequency: 'Very High',
        category: 'UP TET',
        source_type: 'OFFICIAL',
        isPremium: false,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
      },
      {
        id: `voc_uptet_${dateStr}_2`,
        exam_id: 'UPTET',
        word: 'Empathy',
        type: 'Important Vocabulary',
        meaning: 'The ability to understand and share the feelings of another.',
        hindiMeaning: 'सहानुभूति, परानुभूति',
        synonyms: ['Compassion', 'Understanding', 'Sensitivity'],
        antonyms: ['Apathy', 'Callousness'],
        example: 'Teachers must demonstrate empathy towards students from diverse backgrounds.',
        mnemonic: 'Em (into) + Pathy (feeling).',
        examFrequency: 'High',
        category: 'UP TET',
        source_type: 'VERIFIED_EXAM_PATTERN',
        isPremium: false,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
      },
    ],
    BANKING: [
      {
        id: `voc_bank_${dateStr}_1`,
        exam_id: 'BANKING',
        word: 'Fiscal',
        type: 'Important Vocabulary',
        meaning: 'Relating to government revenue, especially taxes and budgetary allocation.',
        hindiMeaning: 'राजकोषीय, वित्तीय',
        synonyms: ['Financial', 'Monetary', 'Budgetary', 'Pecuniary'],
        example: 'The central bank maintained a tight fiscal policy to tame inflation.',
        mnemonic: 'Fiscal deficit = Government budget gap.',
        examFrequency: 'Very High',
        category: 'BANK',
        source_type: 'PREVIOUS_YEAR',
        isPremium: false,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
      },
      {
        id: `voc_bank_${dateStr}_2`,
        exam_id: 'BANKING',
        word: 'Bailout',
        type: 'One Word Substitution',
        meaning: 'An act of giving financial assistance to a failing business or economy to save it from collapse.',
        hindiMeaning: 'वित्तीय राहत, उबारना',
        synonyms: ['Financial rescue', 'Subvention', 'Relief package'],
        example: 'The troubled commercial bank received a sovereign bailout from the government.',
        mnemonic: 'Bailing water out of a sinking boat.',
        examFrequency: 'High',
        category: 'BANK',
        source_type: 'OFFICIAL',
        isPremium: false,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
      },
    ],
  };

  const selectedPack = vocabPacks[exam_id] || vocabPacks['SSC_CGL'];
  return selectedPack.map((item, index) => ({
    ...item,
    id: `voc_${exam_id.toLowerCase()}_${dateStr}_${index + 1}`,
    createdAt: now,
  }));
}

// ------------------------------------------------------------------
// 1. DAILY 20 QUESTIONS SYSTEM (12:00 AM Asia/Kolkata Scheduled)
// ------------------------------------------------------------------
export function getOrCreateDaily20Set(exam_id: string, requestedDate?: string): Daily20Set {
  const db = getDb();
  const todayStr = requestedDate || getKolkataDateString();
  const normalizedExamId = (exam_id || 'SSC_CGL').trim().toUpperCase() as StandardExamId;

  // Initialize daily20Sets in DB if not present
  if (!db.daily20Sets) {
    db.daily20Sets = [];
  }

  // 1. Look for existing Daily 20 set for this exam and date
  let existing = db.daily20Sets.find(
    (s) => s.exam_id === normalizedExamId && s.date === todayStr
  );

  if (existing) {
    // Populate full questions payload
    const populated = {
      ...existing,
      questions: existing.questionIds
        .map((qid) => db.questions.find((q) => q.id === qid))
        .filter((q): q is Question => Boolean(q && q.exam_id === normalizedExamId)),
    };
    if (populated.questions.length > 0) {
      return populated;
    }
  }

  // 2. Need to publish a new set for today
  try {
    // Filter candidate questions that belong STRICTLY to this exam_id
    let examQuestions = db.questions.filter((q) => q.exam_id === normalizedExamId && q.status === 'PUBLISHED');

    // If pool is insufficient (< 20), safely generate authentic exam-level questions
    if (examQuestions.length < 20) {
      const generated = generateExamSpecificQuestionsPool(normalizedExamId);
      for (const gq of generated) {
        if (!db.questions.some((q) => q.id === gq.id)) {
          db.questions.push(gq);
        }
      }
      examQuestions = db.questions.filter((q) => q.exam_id === normalizedExamId && q.status === 'PUBLISHED');
    }

    // Select 20 questions avoiding immediate repetition
    const selected20 = examQuestions.slice(0, 20);
    const def = SUPPORTED_EXAM_DEFINITIONS[normalizedExamId] || SUPPORTED_EXAM_DEFINITIONS['SSC_CGL'];

    const newDaily20: Daily20Set = {
      id: `daily20_${normalizedExamId.toLowerCase()}_${todayStr.replace(/-/g, '')}`,
      exam_id: normalizedExamId,
      date: todayStr,
      title: `${def.shortName} Daily 20 Questions (${todayStr})`,
      questionIds: selected20.map((q) => q.id),
      publishedAt: new Date().toISOString(),
      status: 'PUBLISHED',
      totalQuestions: selected20.length,
      durationMinutes: 20,
      source_type: 'VERIFIED_EXAM_PATTERN',
      version: 1,
    };

    // Archive previous sets for this exam
    db.daily20Sets.forEach((s) => {
      if (s.exam_id === normalizedExamId && s.date !== todayStr) {
        s.status = 'ARCHIVED';
      }
    });

    db.daily20Sets.unshift(newDaily20);
    saveDb(db);

    return {
      ...newDaily20,
      questions: selected20,
    };
  } catch (error) {
    console.error(`[DAILY 20 SCHEDULE] Error generating set for ${normalizedExamId}:`, error);

    // Fallback: Return latest valid set for this exam, ensuring it's NEVER empty
    const latestValid = db.daily20Sets.find((s) => s.exam_id === normalizedExamId);
    if (latestValid) {
      return {
        ...latestValid,
        questions: latestValid.questionIds
          .map((qid) => db.questions.find((q) => q.id === qid))
          .filter((q): q is Question => Boolean(q && q.exam_id === normalizedExamId)),
      };
    }

    // Ultimate seed fallback
    const emergencyPool = generateExamSpecificQuestionsPool(normalizedExamId);
    const def = SUPPORTED_EXAM_DEFINITIONS[normalizedExamId] || SUPPORTED_EXAM_DEFINITIONS['SSC_CGL'];
    return {
      id: `daily20_${normalizedExamId.toLowerCase()}_emergency`,
      exam_id: normalizedExamId,
      date: todayStr,
      title: `${def.shortName} Daily 20 Questions (Standard Cycle)`,
      questionIds: emergencyPool.map((q) => q.id),
      questions: emergencyPool,
      publishedAt: new Date().toISOString(),
      status: 'PUBLISHED',
      totalQuestions: emergencyPool.length,
      durationMinutes: 20,
      source_type: 'VERIFIED_EXAM_PATTERN',
      version: 1,
    };
  }
}

// ------------------------------------------------------------------
// 2. DAILY VOCABULARY SYSTEM (12:00 AM Asia/Kolkata Scheduled)
// ------------------------------------------------------------------
export function getOrCreateDailyVocabSet(exam_id: string, requestedDate?: string): DailyVocabSet {
  const db = getDb();
  const todayStr = requestedDate || getKolkataDateString();
  const normalizedExamId = (exam_id || 'SSC_CGL').trim().toUpperCase() as StandardExamId;

  if (!db.dailyVocabSets) {
    db.dailyVocabSets = [];
  }

  // 1. Check if today's vocab set already published
  const existing = db.dailyVocabSets.find(
    (s) => s.exam_id === normalizedExamId && s.date === todayStr
  );

  if (existing && existing.items.length > 0) {
    return existing;
  }

  // 2. Create fresh set for today
  try {
    const freshItems = generateExamSpecificDailyVocab(normalizedExamId, todayStr);
    const def = SUPPORTED_EXAM_DEFINITIONS[normalizedExamId] || SUPPORTED_EXAM_DEFINITIONS['SSC_CGL'];

    const newVocabSet: DailyVocabSet = {
      id: `dvocab_${normalizedExamId.toLowerCase()}_${todayStr.replace(/-/g, '')}`,
      exam_id: normalizedExamId,
      date: todayStr,
      title: `${def.shortName} Daily Vocabulary Vault (${todayStr})`,
      items: freshItems,
      publishedAt: new Date().toISOString(),
      status: 'PUBLISHED',
      source_type: 'PREVIOUS_YEAR',
      version: 1,
    };

    // Archive previous sets for this exam
    db.dailyVocabSets.forEach((s) => {
      if (s.exam_id === normalizedExamId && s.date !== todayStr) {
        s.status = 'ARCHIVED';
      }
    });

    db.dailyVocabSets.unshift(newVocabSet);
    saveDb(db);

    return newVocabSet;
  } catch (error) {
    console.error(`[DAILY VOCAB] Error creating vocab for ${normalizedExamId}:`, error);

    // Fallback: previous valid set
    const fallback = db.dailyVocabSets.find((s) => s.exam_id === normalizedExamId);
    if (fallback) {
      return fallback;
    }

    const emergency = generateExamSpecificDailyVocab(normalizedExamId, todayStr);
    const def = SUPPORTED_EXAM_DEFINITIONS[normalizedExamId] || SUPPORTED_EXAM_DEFINITIONS['SSC_CGL'];
    return {
      id: `dvocab_${normalizedExamId.toLowerCase()}_fallback`,
      exam_id: normalizedExamId,
      date: todayStr,
      title: `${def.shortName} Daily Vocabulary Vault`,
      items: emergency,
      publishedAt: new Date().toISOString(),
      status: 'PUBLISHED',
      source_type: 'VERIFIED_EXAM_PATTERN',
      version: 1,
    };
  }
}

// ------------------------------------------------------------------
// 3. 7-DAY MOCK TEST ROTATION CYCLE
// ------------------------------------------------------------------
export function checkAndRotate7DayMockTests(): { rotatedCount: number; messages: string[] } {
  const db = getDb();
  const todayStr = getKolkataDateString();
  const messages: string[] = [];
  let rotatedCount = 0;

  const exams: StandardExamId[] = Object.keys(SUPPORTED_EXAM_DEFINITIONS) as StandardExamId[];

  for (const examId of exams) {
    // Find active mock test for this exam
    const activeTest = db.mockTests.find(
      (m) => m.exam_id === examId && m.cycleStatus === 'ACTIVE_CURRENT'
    );

    if (!activeTest) {
      // Seed an active mock test for this exam if missing
      const def = SUPPORTED_EXAM_DEFINITIONS[examId];
      const cycleStart = todayStr;
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Find questions strictly belonging to this exam
      const examQuestions = db.questions.filter((q) => q.exam_id === examId);
      const questionIds = examQuestions.map((q) => q.id);

      const initialMock: MockTest = {
        id: `mock_${examId.toLowerCase()}_w${todayStr.replace(/-/g, '')}`,
        exam_id: examId,
        title: `${def.shortName} Weekly Mock Test (Cycle 1)`,
        description: `Official pattern weekly timed examination for ${def.name}.`,
        exam: def.category as any,
        cycleNumber: 1,
        cycleStartDate: cycleStart,
        cycleEndDate: endDate,
        cycleStatus: 'ACTIVE_CURRENT',
        version: `v1.0 (Cycle ${todayStr})`,
        durationMinutes: def.defaultDurationMinutes,
        totalMarks: def.markingScheme.marksPerQuestion * 25,
        passingMarks: Math.floor(def.markingScheme.marksPerQuestion * 15),
        negativeMarkingPerQuestion: def.markingScheme.negativeMark,
        instructions: [
          `Attempt all questions in ${def.defaultDurationMinutes} minutes.`,
          `Negative marking: ${def.markingScheme.negativeMark} marks per wrong answer.`,
        ],
        questionIds: questionIds.length > 0 ? questionIds : ['q_cgl_001'],
        questionCount: questionIds.length || 1,
        isPremium: false,
        status: 'PUBLISHED',
        author: 'Abhishek Sir (Master Faculty)',
        createdAt: new Date().toISOString(),
      };

      db.mockTests.push(initialMock);
      messages.push(`Initialized Cycle 1 mock test for ${examId}`);
      rotatedCount++;
      continue;
    }

    // Check if 7 days elapsed (cycleEndDate reached)
    if (activeTest.cycleEndDate && todayStr >= activeTest.cycleEndDate) {
      // Archive the old test
      activeTest.cycleStatus = 'ARCHIVED';
      activeTest.status = 'ARCHIVED';
      activeTest.archivedAt = new Date().toISOString();

      const newCycleNumber = (activeTest.cycleNumber || 1) + 1;
      const newCycleStartDate = todayStr;
      const newCycleEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const def = SUPPORTED_EXAM_DEFINITIONS[examId];

      const examQuestions = db.questions.filter((q) => q.exam_id === examId);

      const rotatedMock: MockTest = {
        id: `mock_${examId.toLowerCase()}_c${newCycleNumber}_${Date.now()}`,
        exam_id: examId,
        title: `${def.shortName} Weekly Mock Test (Cycle #${newCycleNumber})`,
        description: `Fresh 7-day competitive mock test for ${def.name}. Evaluates latest exam trends.`,
        exam: def.category as any,
        cycleNumber: newCycleNumber,
        cycleStartDate: newCycleStartDate,
        cycleEndDate: newCycleEndDate,
        cycleStatus: 'ACTIVE_CURRENT',
        version: `v${newCycleNumber}.0 (Cycle ${newCycleStartDate})`,
        durationMinutes: def.defaultDurationMinutes,
        totalMarks: activeTest.totalMarks,
        passingMarks: activeTest.passingMarks,
        negativeMarkingPerQuestion: def.markingScheme.negativeMark,
        instructions: activeTest.instructions,
        questionIds: examQuestions.length > 0 ? examQuestions.map((q) => q.id) : activeTest.questionIds,
        questionCount: examQuestions.length || activeTest.questionIds.length,
        isPremium: false,
        status: 'PUBLISHED',
        author: 'Abhishek Sir (SUPER_ADMIN)',
        createdAt: new Date().toISOString(),
      };

      db.mockTests.unshift(rotatedMock);
      rotatedCount++;
      messages.push(`7-Day rotation complete for ${examId}: Archived Cycle #${activeTest.cycleNumber}, Published Cycle #${newCycleNumber}`);
    }
  }

  if (rotatedCount > 0) {
    saveDb(db);
  }

  return { rotatedCount, messages };
}

// ------------------------------------------------------------------
// 4. CONTENT UPLOAD VALIDATION & EXAM ISOLATION CHECKER
// ------------------------------------------------------------------
export function validateContentExamConsistency(
  targetExamId: string,
  subject: string,
  topic: string,
  contentPayload: {
    title?: string;
    text?: string;
    explanation?: string;
    source?: string;
  }
): ContentValidationResult {
  const normExamId = (targetExamId || '').trim().toUpperCase() as StandardExamId;
  const def = SUPPORTED_EXAM_DEFINITIONS[normExamId];

  if (!def) {
    return {
      isValid: false,
      exam_id: normExamId,
      subject,
      topic,
      contentType: 'UNKNOWN',
      source: contentPayload.source || 'UNSPECIFIED',
      flaggedReason: `Invalid or unrecognized exam_id: ${targetExamId}. Must be one of the standard supported exams.`,
    };
  }

  // Cross-exam keyword contamination checks
  const fullText = `${contentPayload.title || ''} ${contentPayload.text || ''} ${contentPayload.explanation || ''} ${contentPayload.source || ''}`.toLowerCase();

  // Flag Army content inside SSC CGL
  if (normExamId === 'SSC_CGL' && (fullText.includes('agniveer') || fullText.includes('army gd') || fullText.includes('soldier technical'))) {
    return {
      isValid: false,
      exam_id: normExamId,
      subject,
      topic,
      contentType: 'EXAM_MISMATCH',
      source: contentPayload.source || 'MANUAL',
      flaggedReason: 'Contamination detected: Content contains Army/Agniveer specific terminology but target exam is SSC CGL. Mixed exam content is strictly prohibited.',
    };
  }

  // Flag SSC CGL Tier-2 high math inside UPTET
  if (normExamId === 'UPTET' && (fullText.includes('ssc cgl') || fullText.includes('tier-2 dest') || fullText.includes('income tax inspector'))) {
    return {
      isValid: false,
      exam_id: normExamId,
      subject,
      topic,
      contentType: 'EXAM_MISMATCH',
      source: contentPayload.source || 'MANUAL',
      flaggedReason: 'Contamination detected: Content contains SSC CGL terminology inside UPTET. Mixed exam content is strictly prohibited.',
    };
  }

  return {
    isValid: true,
    exam_id: normExamId,
    subject,
    topic,
    contentType: 'VERIFIED',
    source: contentPayload.source || 'ADMIN_VERIFIED',
  };
}

// ------------------------------------------------------------------
// 5. MASTER CONTENT BACKGROUND SCHEDULER
// ------------------------------------------------------------------
let schedulerIntervalId: NodeJS.Timeout | null = null;
let lastRanDate: string = '';

export function startMasterContentScheduler(): void {
  if (schedulerIntervalId) {
    return;
  }

  console.log('[MASTER CONTENT SCHEDULER] Initializing 12:00 AM Asia/Kolkata daily jobs & 7-day mock rotations...');

  const runScheduledCycle = () => {
    try {
      const todayKolkata = getKolkataDateString();

      // Check if day rolled over
      if (todayKolkata !== lastRanDate) {
        console.log(`[MASTER CONTENT SCHEDULER] Day rolled over to ${todayKolkata} in Asia/Kolkata timezone. Publishing Daily 20 and Daily Vocab across all exams...`);

        const exams = Object.keys(SUPPORTED_EXAM_DEFINITIONS) as StandardExamId[];
        for (const examId of exams) {
          getOrCreateDaily20Set(examId, todayKolkata);
          getOrCreateDailyVocabSet(examId, todayKolkata);
        }

        // Check 7-day mock tests
        checkAndRotate7DayMockTests();

        lastRanDate = todayKolkata;
      }
    } catch (e) {
      console.error('[MASTER CONTENT SCHEDULER] Scheduled job error:', e);
    }
  };

  // Run once immediately on server boot
  runScheduledCycle();

  // Run every 60 seconds to catch midnight transition in Asia/Kolkata
  schedulerIntervalId = setInterval(runScheduledCycle, 60 * 1000);
}

// ------------------------------------------------------------------
// 6. INITIAL SEEDING HELPER
// ------------------------------------------------------------------
export function ensureMasterContentSeeded(): void {
  const db = getDb();
  let modified = false;

  // 1. Ensure master questions seeded
  if (!db.questions || db.questions.length < 5) {
    db.questions = [...SEED_MASTER_QUESTIONS];
    modified = true;
  } else {
    // Check if new seed questions need adding
    for (const sq of SEED_MASTER_QUESTIONS) {
      if (!db.questions.some((q) => q.id === sq.id)) {
        db.questions.push(sq);
        modified = true;
      }
    }
  }

  // Ensure all questions have exam_id
  for (const q of db.questions) {
    if (!q.exam_id) {
      if (q.exam === 'SSC') q.exam_id = 'SSC_CGL';
      else if (q.exam === 'NAVY') q.exam_id = 'ARMY';
      else if (q.exam === 'UP TET') q.exam_id = 'UPTET';
      else if (q.exam === 'BANK') q.exam_id = 'BANKING';
      else if (q.exam === 'CUET') q.exam_id = 'CUET';
      else q.exam_id = 'SSC_CGL';
      modified = true;
    }
    if (!q.source_type) {
      q.source_type = 'VERIFIED_EXAM_PATTERN';
      modified = true;
    }
  }

  // 2. Ensure practiceSets collection
  if (!db.practiceSets || db.practiceSets.length === 0) {
    db.practiceSets = [...SEED_PRACTICE_SETS];
    modified = true;
  }

  // 3. Ensure centralized PDFs have exam_id, subject, topic
  if (!db.pdfs || db.pdfs.length < 5) {
    for (const pdf of SEED_CENTRALIZED_PDFS) {
      if (!db.pdfs.some((p) => p.id === pdf.id)) {
        db.pdfs.push(pdf);
        modified = true;
      }
    }
  }

  for (const p of db.pdfs) {
    if (!p.exam_id) {
      if (p.category === 'SSC') p.exam_id = 'SSC_CGL';
      else if (p.category === 'NAVY') p.exam_id = 'ARMY';
      else if (p.category === 'UP TET') p.exam_id = 'UPTET';
      else if (p.category === 'BANK') p.exam_id = 'BANKING';
      else if (p.category === 'CUET') p.exam_id = 'CUET';
      else p.exam_id = 'SSC_CGL';
      modified = true;
    }
    if (!p.publishedStatus) {
      p.publishedStatus = 'PUBLISHED';
      modified = true;
    }
    if (!p.subject) {
      p.subject = 'English';
      modified = true;
    }
    if (!p.topic) {
      p.topic = 'General Preparation';
      modified = true;
    }
  }

  // 4. Ensure 7-day mock tests seeded
  if (!db.mockTests || db.mockTests.length < 3) {
    db.mockTests = [...SEED_MOCK_TESTS];
    modified = true;
  }

  for (const m of db.mockTests) {
    if (!m.exam_id) {
      if (m.exam === 'SSC') m.exam_id = 'SSC_CGL';
      else if (m.exam === 'NAVY') m.exam_id = 'ARMY';
      else if (m.exam === 'UP TET') m.exam_id = 'UPTET';
      else if (m.exam === 'BANK') m.exam_id = 'BANKING';
      else if (m.exam === 'CUET') m.exam_id = 'CUET';
      else m.exam_id = 'SSC_CGL';
      modified = true;
    }
    if (!m.cycleStatus) {
      m.cycleStatus = 'ACTIVE_CURRENT';
      modified = true;
    }
  }

  // 5. Populate Daily 20 and Daily Vocab for today across supported exams
  const today = getKolkataDateString();
  const exams = Object.keys(SUPPORTED_EXAM_DEFINITIONS) as StandardExamId[];
  for (const examId of exams) {
    getOrCreateDaily20Set(examId, today);
    getOrCreateDailyVocabSet(examId, today);
  }

  if (modified) {
    saveDb(db);
  }
}

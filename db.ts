import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  GrammarTopic,
  VocabularyItem,
  StudyNote,
  PDFDocument,
  Question,
  MockTest,
  TestAttemptResult,
  AuditLog,
  AdminPermission,
  ExamSyllabus,
  PendingSyllabusUpdate,
  SyllabusCategoryInfo,
  Daily20Set,
  DailyVocabSet,
  ImagePracticeSet,
  Daily20Attempt,
  Course,
  ExamDefinition,
} from '../src/types/index.ts';
import {
  INITIAL_EXAM_SYLLABI,
  DEFAULT_SYLLABUS_CATEGORIES,
  INITIAL_PENDING_UPDATES,
} from './syllabusData.ts';
import { INITIAL_COURSES } from './coursesData.ts';

export interface DatabaseSchema {
  users: (User & { passwordHash: string; salt: string })[];
  examCategories: string[];
  grammarTopics: GrammarTopic[];
  vocabularyItems: VocabularyItem[];
  notes: StudyNote[];
  pdfs: PDFDocument[];
  videos?: any[];
  questions: Question[];
  mockTests: MockTest[];
  testAttempts: TestAttemptResult[];
  auditLogs: AuditLog[];
  examSyllabi: ExamSyllabus[];
  pendingSyllabusUpdates: PendingSyllabusUpdate[];
  syllabusCategories: SyllabusCategoryInfo[];
  daily20Sets: Daily20Set[];
  dailyVocabSets: DailyVocabSet[];
  practiceSets: ImagePracticeSet[];
  daily20Attempts: Daily20Attempt[];
  courses: Course[];
  customExams: ExamDefinition[];
  settings: {
    instituteName: string;
    tagline: string;
    ownerEmail: string;
    contactPhone: string;
    allowRegistration: boolean;
    appVersion: string;
  };
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'app_data.json');

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt: generatedSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const computedHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return computedHash === hash;
}

export const PROTECTED_OWNER_EMAIL = (process.env.OWNER_EMAIL || 'iamashish128@gmail.com').trim().toLowerCase();
export const PROTECTED_OWNER_ID = 'owner_iamashish128';

export const ALL_ADMIN_PERMISSIONS: AdminPermission[] = [
  'CAN_UPLOAD_PDF',
  'CAN_CREATE_COURSE',
  'CAN_CREATE_QUESTION',
  'CAN_EDIT_CONTENT',
  'CAN_DELETE_CONTENT',
  'CAN_CREATE_PRACTICE',
  'CAN_EDIT_PRACTICE',
  'CAN_DELETE_PRACTICE',
  'CAN_UPLOAD_PRACTICE',
  'CAN_PUBLISH_PRACTICE',
  'CAN_MANAGE_QUESTIONS',
  'CAN_CREATE_MOCK_TEST',
  'CAN_MANAGE_STUDENTS',
  'CAN_MANAGE_USERS',
  'CAN_VIEW_ANALYTICS',
  'CAN_MANAGE_SYLLABUS',
];

function generateSeedData(): DatabaseSchema {
  const superAdminAuth = hashPassword('Owner@2026', 'salt_aec_owner_super');
  const facultyAuth = hashPassword('Faculty@2026', 'salt_aec_faculty_01');
  const studentAuth = hashPassword('Student@2026', 'salt_aec_student_01');

  const now = new Date().toISOString();

  return {
    users: [
      {
        id: 'owner_iamashish128',
        name: 'Abhishek Sir (Owner)',
        email: PROTECTED_OWNER_EMAIL,
        phone: '+91 98765 43210',
        role: 'SUPER_ADMIN',
        permissions: [...ALL_ADMIN_PERMISSIONS],
        targetExam: 'All Competitive Exams',
        createdAt: now,
        updatedAt: now,
        isActive: true,
        isPremium: true,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        passwordHash: superAdminAuth.hash,
        salt: superAdminAuth.salt,
      },
      {
        id: 'user_admin_01',
        name: 'Rajesh Verma (Faculty)',
        email: 'faculty@abhishekclasses.com',
        phone: '+91 98111 22334',
        role: 'ADMIN',
        permissions: [
          'CAN_UPLOAD_PDF',
          'CAN_CREATE_COURSE',
          'CAN_CREATE_QUESTION',
          'CAN_EDIT_CONTENT',
          'CAN_CREATE_MOCK_TEST',
        ],
        targetExam: 'SSC & BANK',
        createdAt: now,
        updatedAt: now,
        isActive: true,
        isPremium: true,
        passwordHash: facultyAuth.hash,
        salt: facultyAuth.salt,
      },
      {
        id: 'user_student_01',
        name: 'Ashish Kumar',
        email: 'student@abhishekclasses.com',
        phone: '+91 91234 56789',
        role: 'STUDENT',
        permissions: [],
        targetExam: 'SSC',
        createdAt: now,
        updatedAt: now,
        isActive: true,
        isPremium: false,
        passwordHash: studentAuth.hash,
        salt: studentAuth.salt,
      },
    ],
    examCategories: ['SSC', 'CUET', 'BANK', 'UP TET', 'NAVY', 'OTHER'],
    grammarTopics: [
      {
        id: 'gram_01',
        title: 'Subject-Verb Agreement (Master Rules)',
        category: 'Subject-Verb Agreement',
        difficulty: 'Basic',
        summary: 'Essential rules of singular and plural verbs with compound subjects, indefinite pronouns, and collective nouns.',
        content: `Subject-Verb Agreement is the most frequently tested grammar topic in SSC CGL, CHSL, BANK, and CUET.\n\nRule 1: Two or more singular subjects joined by 'and' take a plural verb. (Exception: If they refer to one idea or person, singular is used).\nExample: Bread and butter is a wholesome food.\n\nRule 2: When two subjects are joined by 'as well as', 'with', 'along with', 'together with', 'in addition to', the verb agrees with the FIRST subject.\nExample: The teacher, along with his students, is going on a tour.`,
        rules: [
          {
            rule: 'Rule of "Either...or" and "Neither...nor"',
            explanation: 'When subjects are joined by "either...or", "neither...nor", or "or", the verb agrees with the nearest subject.',
            example: 'Neither the teacher nor the students were present.',
            hindiNote: 'verb हमेशा सबसे पास वाले subject के अनुसार आएगी।',
          },
          {
            rule: 'Rule of "Each, Every, Either, Neither"',
            explanation: 'Each, every, either, and neither are always followed by a singular verb when used as pronouns or adjectives.',
            example: 'Each of the participants was awarded a medal.',
            hindiNote: 'Each of / Neither of के बाद noun plural पर verb singular होती है।',
          },
          {
            rule: 'Rule of Collective Nouns',
            explanation: 'If a collective noun acts as a unified body, it takes a singular verb. If members act individually or disagree, use a plural verb.',
            example: 'The jury has reached its verdict. The jury were divided in their opinions.',
            hindiNote: 'मतभेद होने पर plural verb, सर्वसम्मत होने पर singular verb।',
          },
        ],
        commonErrors: [
          {
            incorrect: 'One of my friends are a doctor.',
            correct: 'One of my friends is a doctor.',
            reason: '"One of" takes a plural noun ("friends") but a singular verb ("is") because the subject is "One".',
          },
          {
            incorrect: 'Ram as well as his friends have arrived.',
            correct: 'Ram as well as his friends has arrived.',
            reason: 'With "as well as", the verb agrees with the first subject ("Ram").',
          },
        ],
        isPremium: false,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'gram_02',
        title: 'Tenses & Time Framework',
        category: 'Tenses',
        difficulty: 'Basic',
        summary: 'Master the 12 tenses with competitive exam timelines, conditional clauses, and since/for usage.',
        content: `Tenses define the time and state of an action. SSC and Defence exams specifically target conditional sentences and perfect continuous nuances.\n\nKey Concept: Conditional Clauses\nIf + Simple Present -> Future Simple (If it rains, we will stay inside)\nIf + Past Simple -> would + V1 (If I were you, I would accept)\nIf + Past Perfect -> would have + V3 (If he had studied, he would have passed)`,
        rules: [
          {
            rule: 'Since vs For with Perfect Tenses',
            explanation: '"Since" indicates a point in time (since 2010, since morning). "For" indicates duration (for two hours, for five days).',
            example: 'He has been teaching English since 2015.',
            hindiNote: 'निश्चित समय के लिए Since और समय की अवधि के लिए For।',
          },
          {
            rule: 'Universal Truths & Habitual Facts',
            explanation: 'Universal truths, scientific facts, and proverbs always remain in the Simple Present, even after a past reporting verb.',
            example: 'Our teacher said that the sun rises in the east.',
            hindiNote: 'सार्वभौमिक सत्य कभी past tense में नहीं बदले जाते।',
          },
        ],
        commonErrors: [
          {
            incorrect: 'I am knowing him for five years.',
            correct: 'I have known him for five years.',
            reason: 'Stative verbs like "know", "believe", "own" are not used in continuous tenses.',
          },
          {
            incorrect: 'If you will come tomorrow, I will help you.',
            correct: 'If you come tomorrow, I will help you.',
            reason: 'No future auxiliary (will/shall) in the conditional "if" clause.',
          },
        ],
        isPremium: false,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'gram_03',
        title: 'Articles (A, An, The) & Zero Article',
        category: 'Articles',
        difficulty: 'Basic',
        summary: 'Sound-based indefinite articles and definite article special cases in competitive English.',
        content: `Articles are determiners modifying nouns. In competitive tests, vowel sound vs vowel letter confusion and geographical names with 'the' are heavily asked.`,
        rules: [
          {
            rule: 'Vowel Sound Rule for A/An',
            explanation: '"An" is used before words beginning with a vowel sound (not just spelling: an honest man, an hour, a European, a university).',
            example: 'He is an honest police officer.',
            hindiNote: 'अ, आ, इ, ई आदि स्वर ध्वनियों के पहले An लगता है।',
          },
          {
            rule: 'Superlative and Ordinal Rule',
            explanation: 'Always use "the" before superlative adjectives and ordinal numbers (the best, the first, the highest).',
            example: 'This is the most important chapter.',
            hindiNote: 'Superlative degree और क्रमसूचक संख्याओं से पहले "the" अनिवार्य है।',
          },
        ],
        commonErrors: [
          {
            incorrect: 'He gave me an advice.',
            correct: 'He gave me a piece of advice.',
            reason: '"Advice" is uncountable and cannot take "an" directly.',
          },
        ],
        isPremium: false,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'gram_04',
        title: 'Active & Passive Voice Transformation',
        category: 'Voice',
        difficulty: 'Intermediate',
        summary: 'Step-by-step conversion techniques for SSC Tier-2, CUET, and Navy exams.',
        content: `Voice indicates whether the subject performs the action or receives it.\nActive: Subject + Verb + Object\nPassive: Object + Helping Verb + V3 + by + Subject\n\nRule of thumb: Voice never changes the original tense!`,
        rules: [
          {
            rule: 'Imperative Sentence Conversion',
            explanation: 'Imperative sentences (commands/requests) convert to: Let + object + be + V3, or "You are requested/advised to + V1".',
            example: 'Shut the door -> Let the door be shut.',
            hindiNote: 'आदेशात्मक वाक्यों में Let + Object + be + V3 का प्रयोग करें।',
          },
        ],
        commonErrors: [
          {
            incorrect: 'A letter is wrote by him.',
            correct: 'A letter is written by him.',
            reason: 'Passive voice strictly uses past participle (V3 - written).',
          },
        ],
        isPremium: false,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'gram_05',
        title: 'Direct & Indirect Narration',
        category: 'Narration',
        difficulty: 'Intermediate',
        summary: 'Reporting verbs, tense shifts, pronoun changes, and time/place adverbs in reported speech.',
        content: `Direct speech reproduces the exact words spoken. Indirect speech reports what was said without quotation marks.\n\nTense shift table:\nSimple Present -> Simple Past\nPresent Continuous -> Past Continuous\nPresent Perfect -> Past Perfect\nPast Simple -> Past Perfect`,
        rules: [
          {
            rule: 'Changes in Time and Place Words',
            explanation: 'now -> then, today -> that day, tomorrow -> the next day, yesterday -> the previous day, here -> there.',
            example: 'He said, "I am busy today" -> He said that he was busy that day.',
            hindiNote: 'समय और स्थान दर्शाने वाले शब्द अप्रत्यक्ष कथन में बदल जाते हैं।',
          },
        ],
        commonErrors: [
          {
            incorrect: 'She asked me that where I was going.',
            correct: 'She asked me where I was going.',
            reason: 'Do not use conjunction "that" before wh-question words in reported questions.',
          },
        ],
        isPremium: false,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'gram_06',
        title: 'Prepositions & Fixed Preposition Rules',
        category: 'Prepositions',
        difficulty: 'Intermediate',
        summary: 'Spatial, temporal, and fixed prepositions frequently tested in Bank and SSC exams.',
        content: `Prepositions establish relationships of place, direction, time, and agency.\nFixed Prepositions are idioms of grammar:\n- Accustomed to + V1-ing\n- Refrain from + V1-ing\n- Congratulate on\n- Senior / Junior / Prior / Superior + to (not than)`,
        rules: [
          {
            rule: 'Latin Adjectives Rule',
            explanation: 'Words ending in "-ior" (senior, junior, superior, inferior, prior) take "to" rather than "than".',
            example: 'He is senior to me in service.',
            hindiNote: 'Senior, Junior के बाद Than की जगह To का प्रयोग करें।',
          },
        ],
        commonErrors: [
          {
            incorrect: 'He discussed about the matter.',
            correct: 'He discussed the matter.',
            reason: '"Discuss", "describe", "order", "enter" do not take a preposition when followed by an object.',
          },
        ],
        isPremium: false,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'gram_07',
        title: 'Conjunctions & Correlative Pairs',
        category: 'Conjunction',
        difficulty: 'Intermediate',
        summary: 'Coordinating, subordinating, and paired conjunctions with strict positioning rules.',
        content: `Conjunctions link clauses or words.\nCorrelative pairs must be matched exactly:\n- Not only ... but also\n- Scarcely / Hardly ... when / before\n- No sooner ... than\n- Although / Though ... yet\n- Lest ... should`,
        rules: [
          {
            rule: 'Inversion with Negative Adverbs',
            explanation: 'When sentences begin with "Hardly", "Scarcely", or "No sooner", inversion (Auxiliary + Subject + Verb) is required.',
            example: 'Hardly had I arrived at the station when the train whistled.',
            hindiNote: 'Hardly/Scarcely के साथ when आता है और verb subject से पहले आती है।',
          },
        ],
        commonErrors: [
          {
            incorrect: 'No sooner did he see the police when he ran away.',
            correct: 'No sooner did he see the police than he ran away.',
            reason: '"No sooner" is strictly followed by "than", not "when".',
          },
        ],
        isPremium: false,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'gram_08',
        title: 'Sentence Improvement Tactics',
        category: 'Sentence Improvement',
        difficulty: 'Advanced',
        summary: 'Fast elimination strategy for sentence improvement MCQs in SSC & Bank PO.',
        content: `Sentence improvement evaluates syntax, idiom usage, parallelism, and concise phrasing.\nKey checkpoints:\n1. Check subject-verb agreement first.\n2. Verify modifier placement (misplaced / dangling participles).\n3. Check pronoun case (subjective vs objective).\n4. Inspect parallelism across items joined by coordinating conjunctions.`,
        rules: [
          {
            rule: 'Rule of Parallelism',
            explanation: 'Elements in a series or comparison must share the identical grammatical structure.',
            example: 'She likes reading, writing, and dancing (not to dance).',
            hindiNote: 'समान संरचना वाले शब्दों का ही संयोजन होना चाहिए।',
          },
        ],
        commonErrors: [
          {
            incorrect: 'Walking in the park, a snake bit him.',
            correct: 'While he was walking in the park, a snake bit him.',
            reason: 'Dangling participle: the snake was not walking in the park.',
          },
        ],
        isPremium: true,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'gram_09',
        title: 'Error Detection: 50 Golden Rules',
        category: 'Error Detection',
        difficulty: 'Advanced',
        summary: 'High-frequency patterns responsible for 70% of spotting-the-error questions in competitive exams.',
        content: `Spotting the error requires scanning the sentence methodically:\nSection A: Subject & Verb\nSection B: Tense & Conditional\nSection C: Preposition & Idiom\nSection D: Pronoun, Adjective & Adverb degrees`,
        rules: [
          {
            rule: 'The "Lest ... Should" Rule',
            explanation: '"Lest" means "for fear that" and is inherently negative. It must only be paired with "should" (or subjunctive bare infinitive), never "not".',
            example: 'Run fast lest you should miss the train.',
            hindiNote: 'Lest के साथ "not" का प्रयोग कभी न करें, यह स्वयं नकारात्मक है।',
          },
        ],
        commonErrors: [
          {
            incorrect: 'Work hard lest you will fail.',
            correct: 'Work hard lest you should fail.',
            reason: '"Lest" takes "should", never "will" or "shall".',
          },
        ],
        isPremium: true,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'gram_10',
        title: 'Parts of Speech Comprehensive Review',
        category: 'Parts of Speech',
        difficulty: 'Basic',
        summary: 'Nouns, pronouns, adjectives, verbs, adverbs, prepositions, conjunctions, and interjections in competitive context.',
        content: `A thorough foundation of all 8 parts of speech with identification techniques and grammatical functions in modern exam questions.`,
        rules: [
          {
            rule: 'Noun Number & Gender Nuances',
            explanation: 'Certain nouns are always plural in form and take plural verbs: scissors, trousers, binoculars, spectacles, premises.',
            example: 'These scissors are very sharp.',
            hindiNote: 'दो समान भागों वाले उपकरण हमेशा बहुवचन होते हैं।',
          },
        ],
        commonErrors: [
          {
            incorrect: 'I have bought new furnitures.',
            correct: 'I have bought new furniture.',
            reason: '"Furniture" is uncountable and cannot be pluralized with an "-s".',
          },
        ],
        isPremium: false,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
        updatedAt: now,
      },
    ],
    vocabularyItems: [
      {
        id: 'voc_01',
        word: 'Abate',
        type: 'Synonyms',
        meaning: 'To become less active, less intense, or less in amount.',
        hindiMeaning: 'कम होना, मंद पड़ना, घटना',
        synonyms: ['Subside', 'Diminish', 'Moderate', 'Lessen'],
        antonyms: ['Intensify', 'Augment', 'Amplify', 'Escalate'],
        example: 'The storm suddenly abated, allowing the rescue boats to set sail.',
        mnemonic: 'Think of "Rebate" - a rebate decreases the price; "Abate" decreases intensity.',
        examFrequency: 'Very High',
        category: 'SSC',
        isPremium: false,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
      },
      {
        id: 'voc_02',
        word: 'Candid',
        type: 'Synonyms',
        meaning: 'Truthful, straightforward, frank and outspoken.',
        hindiMeaning: 'स्पष्टवादी, खरा, निष्कपट',
        synonyms: ['Frank', 'Direct', 'Ingenuous', 'Blunt'],
        antonyms: ['Deceitful', 'Evasive', 'Guarded', 'Insincere'],
        example: 'Abhishek Sir gave a candid assessment of the student’s mock test performance.',
        mnemonic: 'A candidate should give candid (honest) answers in the interview.',
        examFrequency: 'High',
        category: 'BANK',
        isPremium: false,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
      },
      {
        id: 'voc_03',
        word: 'Ephemeral',
        type: 'Antonyms',
        meaning: 'Lasting for a very short time; fleeting or transient.',
        hindiMeaning: 'अल्पकालिक, क्षणभंगुर',
        synonyms: ['Transient', 'Fleeting', 'Momentary', 'Brief'],
        antonyms: ['Eternal', 'Everlasting', 'Permanent', 'Perpetual'],
        example: 'Fame in modern social media is often ephemeral.',
        mnemonic: 'Sounds like "e-flower" - flowers bloom and wither in a short time.',
        examFrequency: 'Very High',
        category: 'CUET',
        isPremium: false,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
      },
      {
        id: 'voc_04',
        word: 'Altruist',
        type: 'One Word Substitution',
        meaning: 'A person who cares about others and helps them, despite not gaining anything for himself.',
        hindiMeaning: 'परोपकारी व्यक्ति',
        synonyms: ['Philanthropist', 'Benefactor', 'Humanitarian'],
        antonyms: ['Egoist', 'Misanthrope', 'Self-seeker'],
        example: 'Mother Teresa was celebrated globally as a true altruist.',
        mnemonic: 'All + Trust: someone who works for ALL people and wins trust.',
        examFrequency: 'Very High',
        category: 'SSC',
        isPremium: false,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
      },
      {
        id: 'voc_05',
        word: 'Bury the hatchet',
        type: 'Idioms & Phrases',
        meaning: 'To make peace and end an ongoing quarrel or dispute.',
        hindiMeaning: 'पुरानी दुश्मनी भुलाकर समझौता करना',
        example: 'After years of fierce rivalry, both political leaders finally decided to bury the hatchet.',
        mnemonic: 'Bury the axe (weapon) deep into the earth so you can no longer fight.',
        examFrequency: 'Very High',
        category: 'SSC',
        isPremium: false,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
      },
      {
        id: 'voc_06',
        word: 'Once in a blue moon',
        type: 'Idioms & Phrases',
        meaning: 'An event that happens very rarely or almost never.',
        hindiMeaning: 'कभी-कभार, ईद का चाँद होना',
        example: 'My brother lives abroad, so I get to see him only once in a blue moon.',
        mnemonic: 'A second full moon in one calendar month is a rare celestial event.',
        examFrequency: 'High',
        category: 'UP TET',
        isPremium: false,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
      },
      {
        id: 'voc_07',
        word: 'Pernicious',
        type: 'Important Vocabulary',
        meaning: 'Having a harmful effect, especially in a gradual or subtle way.',
        hindiMeaning: 'हानिकारक, घातक, विनाशकारी',
        synonyms: ['Detrimental', 'Inimical', 'Malignant', 'Noxious'],
        antonyms: ['Beneficial', 'Innocuous', 'Salutary', 'Wholesome'],
        example: 'The pernicious influence of excessive screen time was evident in students.',
        mnemonic: 'Per + vicious (extremely malicious and harmful).',
        examFrequency: 'Very High',
        category: 'BANK',
        isPremium: true,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
      },
      {
        id: 'voc_08',
        word: 'Somnambulist',
        type: 'One Word Substitution',
        meaning: 'A person who walks in sleep.',
        hindiMeaning: 'नींद में चलने वाला व्यक्ति',
        synonyms: ['Sleepwalker'],
        example: 'The doctor advised the family to lock the balcony door as the child was a somnambulist.',
        mnemonic: 'Somnus (sleep) + Ambulate (walk).',
        examFrequency: 'Very High',
        category: 'NAVY',
        isPremium: false,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
      },
      {
        id: 'voc_09',
        word: 'Ubiquitous',
        type: 'Important Vocabulary',
        meaning: 'Present, appearing, or found everywhere at the same time.',
        hindiMeaning: 'सर्वव्यापी, सब जगह उपस्थित',
        synonyms: ['Omnipresent', 'Pervasive', 'Prevalent', 'Universal'],
        antonyms: ['Rare', 'Scarce', 'Seldom', 'Localized'],
        example: 'Smartphones have become ubiquitous across all parts of India.',
        mnemonic: 'UBI (like USB ports) are present on every laptop everywhere.',
        examFrequency: 'Very High',
        category: 'CUET',
        isPremium: false,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
      },
      {
        id: 'voc_10',
        word: 'Burn the midnight oil',
        type: 'Idioms & Phrases',
        meaning: 'To work or study late into the night.',
        hindiMeaning: 'देर रात तक कड़ी मेहनत या पढ़ाई करना',
        example: 'SSC aspirants are burning the midnight oil before the Tier-1 examination.',
        mnemonic: 'Studying under an oil lamp at midnight.',
        examFrequency: 'High',
        category: 'SSC',
        isPremium: false,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
      },
    ],
    notes: [
      {
        id: 'note_01',
        title: 'Top 25 Grammatical Inversion Rules for SSC CGL & Bank PO',
        category: 'Tricks & Shortcuts',
        targetExam: 'SSC',
        description: 'Complete formula sheet on inversion after negative adverbs, conditionals without if, and locational prepositional phrases.',
        content: `# Grammatical Inversion Master Sheet\n\n### When does Inversion occur?\nInversion happens when the auxiliary verb precedes the subject:\n**Auxiliary + Subject + Main Verb**\n\n1. **Negative / Restrictive Adverbs at the beginning:**\n- *Hardly / Scarcely / Barely + had + Subject + V3 ... when ...*\n- *No sooner + did / had + Subject + V1/V3 ... than ...*\n- *Seldom / Never / Rarely + did / does / has + Subject ...*\n\n2. **Conditional Clauses without "If":**\n- *Had I known your trouble, I would have helped you.* (= If I had known...)\n- *Were I the Prime Minister, I would abolish this tax.* (= If I were...)\n- *Should you need any assistance, contact our desk.* (= If you should need...)`,
        isPremium: false,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
      },
      {
        id: 'note_02',
        title: 'Vocabulary Root Words: The Master 50 Prefixes & Suffixes',
        category: 'Vocabulary',
        targetExam: 'CUET',
        description: 'Decode more than 500 English words effortlessly using Latin and Greek root analysis.',
        content: `# Root Words Blueprint\n\n- **BEN / BENE** (Good, Well): Benefit, Benefactor, Benevolent, Benign\n- **MAL / MALE** (Bad, Ill): Malice, Malevolent, Malignant, Malnutrition\n- **CHRON** (Time): Chronology, Chronic, Synchronize, Anachronism\n- **LUC / LUM** (Light, Clear): Lucid, Illuminate, Translucent, Elucidate\n- **PHIL / PHILE** (Love): Philology, Philosophy, Bibliophile, Philanthropist`,
        isPremium: false,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
      },
      {
        id: 'note_03',
        title: 'Reading Comprehension 5-Minute Skimming Framework',
        category: 'Exam Strategy',
        targetExam: 'BANK',
        description: 'How to tackle lengthy Banking passages without reading every single line.',
        content: `# 5-Minute RC Cracking Strategy\n\n1. **Read Question Stems First:** Never start with the passage. Read only the questions (skip options) to build mental radar for key terms.\n2. **First & Last Paragraph Rule:** 60% of central themes and tone lie in the opening and closing paragraphs.\n3. **Tone Words Table:** Pragmatic, Sarcastic, Eulogistic, Cynical, Objective, Analytical.\n4. **Contextual Vocabulary:** Look 1 sentence before and 1 sentence after for clue words.`,
        isPremium: true,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
      },
    ],
    pdfs: [
      {
        id: 'pdf_01',
        title: 'Golden Rules of English Grammar 2026 Edition',
        description: 'Complete comprehensive formula handbook authored by Abhishek Sir for SSC, CUET, BANK & Defence exams.',
        category: 'SSC',
        pagesCount: 8,
        fileSizeMb: 4.2,
        downloadUrl: '/downloads/golden-rules-grammar-2026.pdf',
        version: 1,
        pages: [
          {
            pageNumber: 1,
            heading: 'Chapter 1: Subject-Verb Agreement Essentials',
            text: 'Welcome to the official Abhishek English Classes handbook. In competitive examinations, subject-verb agreement forms the backbone of error spotting. Remember that words joined by "along with", "together with", and "in addition to" never shift the subject. The first noun alone governs the verb.',
            highlight: 'Pro Tip: Identify the true head noun before applying verb agreement.',
          },
          {
            pageNumber: 2,
            heading: 'Chapter 2: The Logic of Pronouns & Cases',
            text: 'Pronouns must maintain case fidelity. Between you and me (objective case, not "between you and I"). After prepositions, pronouns always take the objective form: "Let him and me discuss the plan."',
            highlight: 'Rule: Objective case follows "between" and "let".',
          },
          {
            pageNumber: 3,
            heading: 'Chapter 3: Stative Verbs and Continuous Tense Traps',
            text: 'Verbs of perception (see, hear, smell, notice), verbs of emotion (love, hate, admire, prefer), and verbs of possession (own, belong, possess) do not naturally accept present continuous aspects in standard English.',
            highlight: 'Never say "I am understanding you", write "I understand you".',
          },
          {
            pageNumber: 4,
            heading: 'Chapter 4: The 10 Inversion Formulas',
            text: 'When "No sooner", "Scarcely", "Hardly", or "Little" appears in sentence-initial position, place the auxiliary before the subject: "Little did he know what lay ahead."',
          },
          {
            pageNumber: 5,
            heading: 'Chapter 5: Prepositional Mastery',
            text: 'Distinguish between "enter" and "enter into". We enter a room without "into", but we enter into an agreement or partnership. Similarly, discuss the project (no "about").',
          },
          {
            pageNumber: 6,
            heading: 'Chapter 6: Passive Voice in Competitive Questions',
            text: 'Note the passive forms of modal verbs: can -> can be + V3, must -> must be + V3. Quasi-passive: "Quinine tastes bitter" -> "Quinine is bitter when it is tasted."',
          },
          {
            pageNumber: 7,
            heading: 'Chapter 7: Narration Quirks in Interrogatives',
            text: 'Do not use "that" before wh-words. In yes/no questions, use "if" or "whether". Notice word order becomes affirmative: "He asked where I lived" (not where did I live).',
          },
          {
            pageNumber: 8,
            heading: 'Chapter 8: Rapid Revision Summary Table',
            text: 'Quick recap formulas for quick morning revisions before the exam hall. Best wishes from Abhishek Sir!',
            highlight: 'Keep revising offline anytime on your mobile app.',
          },
        ],
        isPremium: false,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'pdf_02',
        title: '500 High-Frequency SSC & BANK Idioms & Phrases',
        description: 'Categorized idioms with etymology, Hindi translation, and previous years exam questions.',
        category: 'BANK',
        pagesCount: 6,
        fileSizeMb: 3.5,
        downloadUrl: '/downloads/500-idioms-phrases.pdf',
        version: 1,
        pages: [
          {
            pageNumber: 1,
            heading: 'Section A: Body Parts Idioms',
            text: 'At arm’s length: To keep at a distance. / Achilles heel: A fatal weakness. / Bite the bullet: Face a difficult situation with courage. / Cost an arm and a leg: Extremely expensive.',
          },
          {
            pageNumber: 2,
            heading: 'Section B: Animal Idioms',
            text: 'A dark horse: An unexpected winner. / Take the bull by the horns: Deal directly with a dangerous problem. / Let the cat out of the bag: Reveal a secret inadvertently.',
          },
          {
            pageNumber: 3,
            heading: 'Section C: Color Idioms',
            text: 'Out of the blue: Completely unexpected. / Catch red-handed: Catch while committing a crime. / See red: To become extremely angry.',
          },
          {
            pageNumber: 4,
            heading: 'Section D: Weather & Nature Idioms',
            text: 'Under the weather: Feeling slightly unwell. / Every cloud has a silver lining: Good comes from bad. / Steal someone’s thunder: Win praise by pre-empting someone else.',
          },
          {
            pageNumber: 5,
            heading: 'Section E: Time & Space Idioms',
            text: 'In the nick of time: Just before it is too late. / Call it a day: Stop working for the day. / Around the clock: Day and night continuously.',
          },
          {
            pageNumber: 6,
            heading: 'Section F: Top 50 PYQ Tested Idioms',
            text: 'Comprehensive practice list compiled from SSC CGL 2018-2025 and IBPS PO past papers.',
          },
        ],
        isPremium: false,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'pdf_03',
        title: 'CUET 2026 English Language Blueprint',
        description: 'Specially structured syllabus module for CUET UG English Language aspirants.',
        category: 'CUET',
        pagesCount: 5,
        fileSizeMb: 2.8,
        downloadUrl: '/downloads/cuet-2026-english-blueprint.pdf',
        version: 1,
        pages: [
          {
            pageNumber: 1,
            heading: 'CUET Exam Pattern & Mark Distribution',
            text: 'CUET English tests Reading Comprehension, Verbal Ability, Rearranging the parts, Choosing the correct word, Synonyms and Antonyms, and Vocabulary.',
          },
          {
            pageNumber: 2,
            heading: 'Para-Jumbles Strategy & Connectors',
            text: 'Look for noun-pronoun chains, chronological signals (first, subsequently, finally), and cause-and-effect transitions (therefore, however).',
          },
          {
            pageNumber: 3,
            heading: 'Cloze Test Mastery Framework',
            text: 'Read the entire cloze paragraph before choosing options. Identify tone, tense consistency, and collocations.',
          },
          {
            pageNumber: 4,
            heading: 'Figures of Speech (Simile, Metaphor, Personification)',
            text: 'Essential poetic and rhetorical devices tested frequently in NTA CUET examinations.',
          },
          {
            pageNumber: 5,
            heading: 'Speed Drills & Model Questions',
            text: 'Target score: 200/200 in CUET English with daily timed practice on Abhishek English Classes app.',
          },
        ],
        isPremium: true,
        isPublished: true,
        author: 'Abhishek Sir',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'pdf_04',
        title: 'Navy SSR & Airforce XY English Quick Notes',
        description: 'Defence English rapid revision guide with error detection tricks and vocabulary list.',
        category: 'NAVY',
        pagesCount: 4,
        fileSizeMb: 2.1,
        downloadUrl: '/downloads/navy-ssr-quick-notes.pdf',
        version: 1,
        pages: [
          {
            pageNumber: 1,
            heading: 'Navy Exam English Format',
            text: '25 high-speed questions covering passage comprehension, preposition substitution, spelling errors, and voice transformation.',
          },
          {
            pageNumber: 2,
            heading: 'Spelling Correction Rules',
            text: 'Rules for adding "-ing" and "-ed", "i before e except after c", and commonly misspelled words like "Lieutenant", "Bureaucracy", "Mischievous".',
          },
          {
            pageNumber: 3,
            heading: 'One-Word Substitution for Defence Aspirants',
            text: 'Martyr, Pacifist, Mercenary, Arsenal, Armistice, Chauvinist, Renegade.',
          },
          {
            pageNumber: 4,
            heading: 'Final Exam Hall Checklist',
            text: 'Do not spend more than 40 seconds per question in defence examinations.',
          },
        ],
        isPremium: false,
        isPublished: true,
        author: 'Rajesh Verma',
        createdAt: now,
        updatedAt: now,
      },
    ],
    videos: [],
    questions: [
      {
        id: 'q_01',
        questionText: 'Neither the manager nor his assistants ________ present at the annual board meeting yesterday.',
        options: {
          A: 'was',
          B: 'were',
          C: 'is',
          D: 'are',
        },
        correctAnswer: 'B',
        explanation: 'When subjects are joined by "neither...nor", the verb agrees with the subject closest to it. Here, "assistants" is plural and the sentence is in the past tense ("yesterday"), hence "were" is the correct choice.',
        topic: 'Subject-Verb Agreement',
        exam: 'SSC',
        difficulty: 'Easy',
        marks: 2,
        negativeMarks: 0.5,
        isPremium: false,
        status: 'PUBLISHED',
        author: 'Abhishek Sir',
        createdAt: now,
      },
      {
        id: 'q_02',
        questionText: 'The teacher as well as his students ________ actively involved in the scientific exhibition.',
        options: {
          A: 'were',
          B: 'are',
          C: 'was',
          D: 'have been',
        },
        correctAnswer: 'C',
        explanation: 'When two nouns are connected by "as well as", the verb agrees with the first subject ("The teacher" - singular), so "was" is correct.',
        topic: 'Subject-Verb Agreement',
        exam: 'SSC',
        difficulty: 'Moderate',
        marks: 2,
        negativeMarks: 0.5,
        isPremium: false,
        status: 'PUBLISHED',
        author: 'Abhishek Sir',
        createdAt: now,
      },
      {
        id: 'q_03',
        questionText: 'Identify the segment containing an error: "Hardly had I arrived at the station (A) / when the train left (B) / and the whistle blew. (C) / No error (D)"',
        options: {
          A: 'Hardly had I arrived at the station',
          B: 'when the train left',
          C: 'and the whistle blew',
          D: 'No error',
        },
        correctAnswer: 'D',
        explanation: '"Hardly had + Subject + V3" followed by "when" is grammatically spotless. Hence, there is No Error (D).',
        topic: 'Conjunction',
        exam: 'SSC',
        difficulty: 'Moderate',
        marks: 2,
        negativeMarks: 0.5,
        isPremium: false,
        status: 'PUBLISHED',
        author: 'Abhishek Sir',
        createdAt: now,
      },
      {
        id: 'q_04',
        questionText: 'Choose the option that is closest in meaning to the word: EPHEMERAL',
        options: {
          A: 'Perpetual',
          B: 'Transient',
          C: 'Immense',
          D: 'Obdurate',
        },
        correctAnswer: 'B',
        explanation: '"Ephemeral" means lasting for a very short duration. "Transient" is its exact synonym.',
        topic: 'Synonyms',
        exam: 'CUET',
        difficulty: 'Moderate',
        marks: 2,
        negativeMarks: 0.5,
        isPremium: false,
        status: 'PUBLISHED',
        author: 'Abhishek Sir',
        createdAt: now,
      },
      {
        id: 'q_05',
        questionText: 'Select the most appropriate ANTONYM of the word: CANDID',
        options: {
          A: 'Outspoken',
          B: 'Blunt',
          C: 'Deceitful',
          D: 'Forthright',
        },
        correctAnswer: 'C',
        explanation: '"Candid" means truthful and direct. Its antonym is "Deceitful" (dishonest, misleading).',
        topic: 'Antonyms',
        exam: 'BANK',
        difficulty: 'Easy',
        marks: 1,
        negativeMarks: 0.25,
        isPremium: false,
        status: 'PUBLISHED',
        author: 'Abhishek Sir',
        createdAt: now,
      },
      {
        id: 'q_06',
        questionText: 'Select the One Word Substitution: "One who loves and collects books"',
        options: {
          A: 'Bibliophile',
          B: 'Philatelist',
          C: 'Numismatist',
          D: 'Somnambulist',
        },
        correctAnswer: 'A',
        explanation: 'Biblio (book) + phile (lover) = Bibliophile. Philatelist collects stamps; Numismatist collects coins; Somnambulist walks in sleep.',
        topic: 'One Word Substitution',
        exam: 'SSC',
        difficulty: 'Easy',
        marks: 2,
        negativeMarks: 0.5,
        isPremium: false,
        status: 'PUBLISHED',
        author: 'Abhishek Sir',
        createdAt: now,
      },
      {
        id: 'q_07',
        questionText: 'Select the passive form: "The mechanic repaired the damaged engine."',
        options: {
          A: 'The damaged engine was repaired by the mechanic.',
          B: 'The damaged engine has been repaired by the mechanic.',
          C: 'The damaged engine is repaired by the mechanic.',
          D: 'The damaged engine was being repaired by the mechanic.',
        },
        correctAnswer: 'A',
        explanation: 'Simple past active ("repaired") converts to "was/were + V3" ("was repaired").',
        topic: 'Voice',
        exam: 'NAVY',
        difficulty: 'Easy',
        marks: 2,
        negativeMarks: 0.5,
        isPremium: false,
        status: 'PUBLISHED',
        author: 'Abhishek Sir',
        createdAt: now,
      },
      {
        id: 'q_08',
        questionText: 'He is senior ________ me in both age and rank.',
        options: {
          A: 'than',
          B: 'to',
          C: 'from',
          D: 'over',
        },
        correctAnswer: 'B',
        explanation: 'Adjectives ending in "-ior" (senior, junior, superior, prior) take the preposition "to", never "than".',
        topic: 'Prepositions',
        exam: 'UP TET',
        difficulty: 'Easy',
        marks: 1,
        negativeMarks: 0.25,
        isPremium: false,
        status: 'PUBLISHED',
        author: 'Abhishek Sir',
        createdAt: now,
      },
      {
        id: 'q_09',
        questionText: 'Select the meaning of the idiom: "To spill the beans"',
        options: {
          A: 'To drop food accidentally',
          B: 'To reveal a secret prematurely',
          C: 'To waste valuable resources',
          D: 'To cook a meal enthusiastically',
        },
        correctAnswer: 'B',
        explanation: '"To spill the beans" is an idiom meaning to disclose secret information carelessly or prematurely.',
        topic: 'Idioms & Phrases',
        exam: 'SSC',
        difficulty: 'Easy',
        marks: 2,
        negativeMarks: 0.5,
        isPremium: false,
        status: 'PUBLISHED',
        author: 'Abhishek Sir',
        createdAt: now,
      },
      {
        id: 'q_10',
        questionText: 'Sentence Improvement: "Walk carefully lest you *will not fall* down."',
        options: {
          A: 'should fall',
          B: 'will fall',
          C: 'would fall',
          D: 'No improvement',
        },
        correctAnswer: 'A',
        explanation: '"Lest" is followed by "should" and is never used with a negative word like "not". Hence "should fall" is the correct improvement.',
        topic: 'Sentence Improvement',
        exam: 'SSC',
        difficulty: 'Hard',
        marks: 2,
        negativeMarks: 0.5,
        isPremium: false,
        status: 'PUBLISHED',
        author: 'Abhishek Sir',
        createdAt: now,
      },
      {
        id: 'q_11',
        questionText: 'He said, "I have passed the SSC CGL examination." (Indirect speech conversion)',
        options: {
          A: 'He said that he had passed the SSC CGL examination.',
          B: 'He said that he has passed the SSC CGL examination.',
          C: 'He told that he had passed the SSC CGL examination.',
          D: 'He said that he was passing the SSC CGL examination.',
        },
        correctAnswer: 'A',
        explanation: 'Present perfect ("have passed") shifts to past perfect ("had passed"). Reporting verb "said" does not change to "told" without an indirect object.',
        topic: 'Narration',
        exam: 'SSC',
        difficulty: 'Moderate',
        marks: 2,
        negativeMarks: 0.5,
        isPremium: false,
        status: 'PUBLISHED',
        author: 'Abhishek Sir',
        createdAt: now,
      },
      {
        id: 'q_12',
        questionText: 'Find the correctly spelt word:',
        options: {
          A: 'Millenium',
          B: 'Millennium',
          C: 'Milennium',
          D: 'Millenniam',
        },
        correctAnswer: 'B',
        explanation: '"Millennium" contains double "l" and double "n" (M-I-L-L-E-N-N-I-U-M).',
        topic: 'Error Detection',
        exam: 'NAVY',
        difficulty: 'Moderate',
        marks: 1,
        negativeMarks: 0.25,
        isPremium: false,
        status: 'PUBLISHED',
        author: 'Abhishek Sir',
        createdAt: now,
      },
    ],
    mockTests: [
      {
        id: 'mock_01',
        title: 'SSC CGL Tier-1 English Full Length Mock 01',
        description: 'Comprehensive 12-question full simulation based on latest TCS pattern. Online connection required for timing and ranking.',
        exam: 'SSC',
        durationMinutes: 15,
        totalMarks: 24,
        passingMarks: 12,
        negativeMarkingPerQuestion: 0.5,
        instructions: [
          'This Mock Test requires an active internet connection to start and submit.',
          'Each question carries 2 marks. 0.5 marks will be deducted for every incorrect response.',
          'No marks will be deducted for unattempted questions.',
          'Use the question palette to jump between questions.',
          'Click Submit when you have completed all sections.',
        ],
        questionIds: ['q_01', 'q_02', 'q_03', 'q_06', 'q_09', 'q_10', 'q_11'],
        isPremium: false,
        status: 'PUBLISHED',
        author: 'Abhishek Sir',
        createdAt: now,
      },
      {
        id: 'mock_02',
        title: 'Banking English Language Speed Test 01',
        description: 'High-speed test focused on vocabulary, contextual antonyms, and error spotting for SBI/IBPS PO aspirants.',
        exam: 'BANK',
        durationMinutes: 10,
        totalMarks: 5,
        passingMarks: 3,
        negativeMarkingPerQuestion: 0.25,
        instructions: [
          'Live internet connection is strictly required.',
          '1 mark per correct answer; 0.25 negative marking.',
          'Maintain speed and accuracy.',
        ],
        questionIds: ['q_02', 'q_05', 'q_08', 'q_10', 'q_12'],
        isPremium: false,
        status: 'PUBLISHED',
        author: 'Abhishek Sir',
        createdAt: now,
      },
      {
        id: 'mock_03',
        title: 'CUET UG English Language Drill 01',
        description: 'NTA CUET format focusing on vocabulary nuances, one-word substitutes, and sentence structure.',
        exam: 'CUET',
        durationMinutes: 12,
        totalMarks: 10,
        passingMarks: 5,
        negativeMarkingPerQuestion: 0.5,
        instructions: [
          'Real-time online evaluation with all-India percentile comparison.',
          'Carefully review answer keys and explanations upon submission.',
        ],
        questionIds: ['q_04', 'q_06', 'q_09', 'q_10', 'q_11'],
        isPremium: true,
        status: 'PUBLISHED',
        author: 'Abhishek Sir',
        createdAt: now,
      },
      {
        id: 'mock_04',
        title: 'Navy SSR / AA English Express Test',
        description: 'Grammar and voice transformation test for Defence and Navy recruits.',
        exam: 'NAVY',
        durationMinutes: 8,
        totalMarks: 8,
        passingMarks: 4,
        negativeMarkingPerQuestion: 0.25,
        instructions: [
          'Strict time limit. Instant report generation upon test submission.',
        ],
        questionIds: ['q_01', 'q_07', 'q_08', 'q_12'],
        isPremium: false,
        status: 'PUBLISHED',
        author: 'Rajesh Verma',
        createdAt: now,
      },
    ],
    testAttempts: [],
    auditLogs: [
      {
        id: 'log_init_01',
        adminId: 'user_super_admin_01',
        adminName: 'Abhishek Sir (Founder)',
        adminRole: 'SUPER_ADMIN',
        action: 'APP_SETTINGS_UPDATED',
        target: 'System Init',
        details: 'Initialized Abhishek English Classes platform with offline-first architecture & online mock test engine.',
        timestamp: now,
      },
      {
        id: 'log_init_02',
        adminId: 'user_super_admin_01',
        adminName: 'Abhishek Sir (Founder)',
        adminRole: 'SUPER_ADMIN',
        action: 'ADMIN_CREATED',
        target: 'faculty@abhishekclasses.com',
        details: 'Configured Faculty Admin Rajesh Verma with content creation permissions.',
        timestamp: now,
      },
    ],
    examSyllabi: [...INITIAL_EXAM_SYLLABI],
    pendingSyllabusUpdates: [...INITIAL_PENDING_UPDATES],
    syllabusCategories: [...DEFAULT_SYLLABUS_CATEGORIES],
    daily20Sets: [],
    dailyVocabSets: [],
    practiceSets: [],
    daily20Attempts: [],
    courses: [...INITIAL_COURSES],
    customExams: [],
    settings: {
      instituteName: 'ABHISHEK ENGLISH CLASSES',
      tagline: 'Excellence in English for Competitive Aspirants',
      ownerEmail: 'owner@abhishekclasses.com',
      contactPhone: '+91 98765 43210',
      allowRegistration: true,
      appVersion: '2.5.0-production',
    },
  };
}

let dbInstance: DatabaseSchema | null = null;

export function getDb(): DatabaseSchema {
  if (dbInstance) {
    return dbInstance;
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      dbInstance = JSON.parse(data);
      if (dbInstance && Array.isArray(dbInstance.users)) {
        if (!dbInstance.examSyllabi || dbInstance.examSyllabi.length === 0) {
          dbInstance.examSyllabi = [...INITIAL_EXAM_SYLLABI];
        } else {
          for (const initialSyl of INITIAL_EXAM_SYLLABI) {
            if (!dbInstance.examSyllabi.some((s) => s.id === initialSyl.id)) {
              dbInstance.examSyllabi.push(initialSyl);
            }
          }
        }
        if (!dbInstance.pendingSyllabusUpdates) {
          dbInstance.pendingSyllabusUpdates = [...INITIAL_PENDING_UPDATES];
        }
        if (!dbInstance.syllabusCategories || dbInstance.syllabusCategories.length === 0) {
          dbInstance.syllabusCategories = [...DEFAULT_SYLLABUS_CATEGORIES];
        }
        if (!dbInstance.daily20Sets) {
          dbInstance.daily20Sets = [];
        }
        if (!dbInstance.dailyVocabSets) {
          dbInstance.dailyVocabSets = [];
        }
        if (!dbInstance.practiceSets) {
          dbInstance.practiceSets = [];
        }
        if (!dbInstance.daily20Attempts) {
          dbInstance.daily20Attempts = [];
        }
        if (!dbInstance.courses || dbInstance.courses.length === 0) {
          dbInstance.courses = [...INITIAL_COURSES];
        }
        if (!dbInstance.customExams) {
          dbInstance.customExams = [];
        }

        // Enforce Fail-Closed Security: If owner configuration is missing or invalid, no one receives SUPER_ADMIN
        const isOwnerConfigValid = Boolean(
          PROTECTED_OWNER_EMAIL &&
          PROTECTED_OWNER_EMAIL.includes('@') &&
          PROTECTED_OWNER_EMAIL.length > 5
        );

        if (!isOwnerConfigValid) {
          // FAIL CLOSED: Downgrade all to avoid unauthorized privilege
          for (const u of dbInstance.users) {
            if (u.role === 'SUPER_ADMIN') {
              u.role = 'STUDENT';
              u.permissions = [];
            }
          }
          return dbInstance;
        }

        // Strict Owner Invariant: ONLY the account with verified email = iamashish128@gmail.com can have SUPER_ADMIN
        let ownerFound = false;
        for (const u of dbInstance.users) {
          if (u.email.toLowerCase() === PROTECTED_OWNER_EMAIL) {
            u.role = 'SUPER_ADMIN';
            u.permissions = [...ALL_ADMIN_PERMISSIONS];
            u.isActive = true;
            ownerFound = true;
          } else if (u.role === 'SUPER_ADMIN') {
            // Strictly downgrade any unauthorized account claiming SUPER_ADMIN
            u.role = 'STUDENT';
            u.permissions = [];
          }
        }
        if (!ownerFound) {
          // Re-insert protected owner if missing
          const seed = generateSeedData();
          dbInstance.users.unshift(seed.users[0]);
        }
        return dbInstance;
      }
    } catch (err) {
      console.error('Error reading db file, resetting to seed data:', err);
    }
  }

  dbInstance = generateSeedData();
  saveDb(dbInstance);
  return dbInstance;
}

export function saveDb(data: DatabaseSchema): void {
  dbInstance = data;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function logAuditAction(
  admin: User,
  action: AuditLog['action'],
  target: string,
  details: string
): void {
  const db = getDb();
  const log: AuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    adminId: admin.id,
    adminName: admin.name,
    adminRole: admin.role,
    action,
    target,
    details,
    timestamp: new Date().toISOString(),
  };
  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 200) {
    db.auditLogs = db.auditLogs.slice(0, 200);
  }
  saveDb(db);
}

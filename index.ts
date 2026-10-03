export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'STUDENT';

export type AdminPermission =
  | 'CAN_UPLOAD_PDF'
  | 'CAN_CREATE_COURSE'
  | 'CAN_CREATE_QUESTION'
  | 'CAN_EDIT_CONTENT'
  | 'CAN_DELETE_CONTENT'
  | 'CAN_CREATE_PRACTICE'
  | 'CAN_EDIT_PRACTICE'
  | 'CAN_DELETE_PRACTICE'
  | 'CAN_UPLOAD_PRACTICE'
  | 'CAN_PUBLISH_PRACTICE'
  | 'CAN_MANAGE_QUESTIONS'
  | 'CAN_CREATE_MOCK_TEST'
  | 'CAN_MANAGE_STUDENTS'
  | 'CAN_MANAGE_USERS'
  | 'CAN_VIEW_ANALYTICS'
  | 'CAN_MANAGE_SYLLABUS';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  permissions: AdminPermission[];
  targetExam?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  avatar?: string;
  isPremium?: boolean;
}

export type ExamCategory = 'SSC' | 'CUET' | 'BANK' | 'UP TET' | 'NAVY' | 'OTHER' | string;

export interface GrammarTopic {
  id: string;
  title: string;
  category: string; // e.g., 'Parts of Speech', 'Tenses', 'Voice', 'Narration'
  difficulty: 'Basic' | 'Intermediate' | 'Advanced';
  summary: string;
  content: string; // Markdown or rich text formatted notes
  rules: { rule: string; explanation: string; example: string; hindiNote?: string }[];
  commonErrors: { incorrect: string; correct: string; reason: string }[];
  isPremium: boolean;
  isPublished: boolean;
  author: string;
  createdAt: string;
  updatedAt: string;
}

export type StandardExamId =
  | 'SSC_CGL'
  | 'SSC_CHSL'
  | 'SSC_MTS'
  | 'SSC_GD'
  | 'SSC_CPO'
  | 'SSC_STENO'
  | 'SSC_SELECTION_POST'
  | 'SSC_JE'
  | 'IBPS_PO'
  | 'IBPS_CLERK'
  | 'IBPS_RRB'
  | 'SBI_PO'
  | 'SBI_CLERK'
  | 'RBI_GRADE_B'
  | 'RBI_ASSISTANT'
  | 'NABARD'
  | 'RRB_NTPC'
  | 'RRB_GROUP_D'
  | 'RRB_ALP'
  | 'RRB_TECHNICIAN'
  | 'RRB_JE'
  | 'RPF_CONSTABLE'
  | 'RPF_SI'
  | 'NDA'
  | 'CDS'
  | 'ARMY'
  | 'ARMY_AGNIVEER'
  | 'NAVY_AGNIVEER'
  | 'AIRFORCE_AGNIVEER'
  | 'AFCAT'
  | 'COAST_GUARD'
  | 'DEFENCE'
  | 'CTET'
  | 'UPTET'
  | 'SUPER_TET'
  | 'REET'
  | 'DSSSB'
  | 'KVS'
  | 'NVS'
  | 'UP_POLICE'
  | 'DELHI_POLICE'
  | 'UPPSC_PCS'
  | 'UPSSSC_PET'
  | 'UP_LEKHPAL'
  | 'UP_VDO'
  | 'UP_RO_ARO'
  | 'UPSC_CSE'
  | 'BANKING'
  | 'RAILWAY'
  | 'CUET'
  | (string & {});

export type ContentSourceType =
  | 'OFFICIAL'
  | 'PREVIOUS_YEAR'
  | 'VERIFIED_EXAM_PATTERN'
  | 'ADMIN_CREATED'
  | 'AI_GENERATED_PRACTICE';

export interface ExamDefinition {
  exam_id: StandardExamId;
  name: string;
  shortName: string;
  category: ExamCategoryGroup;
  organization: string;
  defaultDurationMinutes: number;
  markingScheme: {
    marksPerQuestion: number;
    negativeMark: number;
  };
  subjects: string[];
  eligibility?: string;
  selectionStages?: string[];
  officialSource?: string;
  isCustom?: boolean;
}

export interface VocabularyItem {
  id: string;
  exam_id?: string;
  word: string;
  type: 'Synonyms' | 'Antonyms' | 'One Word Substitution' | 'Idioms & Phrases' | 'Important Vocabulary';
  meaning: string;
  hindiMeaning: string;
  synonyms?: string[];
  antonyms?: string[];
  example: string;
  mnemonic?: string;
  examFrequency: 'High' | 'Very High' | 'Moderate';
  category: ExamCategory;
  source_type?: ContentSourceType;
  isPremium: boolean;
  isPublished: boolean;
  author: string;
  createdAt: string;
}

export interface StudyNote {
  id: string;
  exam_id?: string;
  subject?: string;
  topic?: string;
  title: string;
  category: 'Grammar' | 'Vocabulary' | 'Exam Strategy' | 'Tricks & Shortcuts';
  targetExam: ExamCategory;
  description: string;
  content: string;
  source_type?: ContentSourceType;
  isPremium: boolean;
  isPublished: boolean;
  author: string;
  createdAt: string;
}

export interface PDFDocument {
  id: string;
  title: string;
  exam_id?: string; // Permanent backend exam ID (e.g. 'SSC_CGL', 'ARMY', 'UPTET')
  category: ExamCategory; // Kept for backwards compatibility
  subject?: string;
  topic?: string;
  description: string;
  source?: string;
  version: number;
  uploadDate?: string;
  uploadedBy?: string;
  publishedStatus?: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  pagesCount: number;
  fileSizeMb: number;
  downloadUrl: string;
  pages: { pageNumber: number; heading: string; text: string; highlight?: string }[];
  isPremium: boolean;
  isPublished: boolean;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseLesson {
  id: string;
  lessonNumber: number;
  title: string;
  durationMinutes: number;
  notesMarkdown: string;
  pdfAttachmentUrl?: string;
  examples: { questionOrRule: string; explanation: string; examContext?: string }[];
  practiceQuestions: Question[];
  homeworkTask: string;
  quizQuestionsCount: number;
  isCompleted?: boolean;
}

export interface CourseModule {
  id: string;
  moduleNumber: number;
  title: string;
  description: string;
  lessons: CourseLesson[];
}

export interface Course {
  id: string;
  exam_id: string;
  title: string;
  subtitle: string;
  subject: string;
  category: ExamCategoryGroup;
  targetExamName: string;
  instructor: string;
  badge?: string;
  totalDurationHours: number;
  totalLessons: number;
  totalModules: number;
  rating: number;
  enrolledStudentsCount: number;
  overview: string;
  syllabusCoveragePercentage: number;
  modules: CourseModule[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  exam_id?: string; // Permanent backend ID (e.g., 'SSC_CGL', 'ARMY', 'UPSSSC_PET')
  exam: ExamCategory; // Kept for backwards compatibility
  subject?: string;
  topic: string;
  questionText: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  marks: number;
  negativeMarks: number;
  source_type?: ContentSourceType;
  pyqYear?: string;
  pyqShift?: string;
  isPremium?: boolean;
  status: 'PUBLISHED' | 'DRAFT';
  author: string;
  createdAt: string;
}

export interface Daily20Set {
  id: string;
  exam_id: string;
  date: string; // YYYY-MM-DD (Asia/Kolkata)
  title: string;
  questionIds: string[];
  questions?: Question[];
  publishedAt: string;
  status: 'PUBLISHED' | 'ARCHIVED';
  totalQuestions: number;
  durationMinutes: number;
  source_type: ContentSourceType;
  version: number;
}

export interface Daily20Attempt {
  id: string;
  dailySetId: string;
  exam_id: string;
  date: string;
  userId: string;
  userName: string;
  score: number;
  maxScore: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  unattemptedCount: number;
  timeSpentSeconds: number;
  submittedAt: string;
  answers: Record<string, 'A' | 'B' | 'C' | 'D'>;
}

export interface DailyVocabSet {
  id: string;
  exam_id: string;
  date: string; // YYYY-MM-DD (Asia/Kolkata)
  title: string;
  items: VocabularyItem[];
  publishedAt: string;
  status: 'PUBLISHED' | 'ARCHIVED';
  source_type: ContentSourceType;
  version: number;
}

export interface PracticeQuestionImage {
  id: string;
  exam_id: string;
  subject: string;
  topic: string;
  practice_set_id: string;
  question_number: number;
  imageUrl: string;
  questionHint?: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  source: string;
  uploadDate: string;
  uploader: string;
  status: 'PUBLISHED' | 'FLAGGED_FOR_VERIFICATION' | 'DRAFT';
  flagReason?: string;
}

export interface ImagePracticeSet {
  id: string;
  exam_id: string;
  title: string;
  subject: string;
  topic: string;
  description: string;
  totalQuestions: number;
  images: PracticeQuestionImage[];
  status: 'PUBLISHED' | 'FLAGGED_FOR_VERIFICATION' | 'DRAFT';
  source: string;
  uploader: string;
  uploadDate: string;
  publishedAt?: string;
  version: number;
}

export interface MockTest {
  id: string;
  exam_id?: string; // Permanent backend ID (e.g. 'SSC_CGL', 'ARMY', 'UPSSSC_PET')
  title: string;
  description: string;
  exam: ExamCategory; // Kept for backwards compatibility
  cycleNumber?: number; // 7-day cycle sequence number
  cycleStartDate?: string;
  cycleEndDate?: string;
  cycleStatus?: 'ACTIVE_CURRENT' | 'ARCHIVED';
  version?: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  negativeMarkingPerQuestion: number;
  instructions: string[];
  questionIds: string[];
  sections?: {
    name: string;
    subject: string;
    questionCount: number;
    marksPerQuestion: number;
    negativeMarking: number;
  }[];
  questionCount?: number;
  isPremium: boolean;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  author: string;
  createdAt: string;
  archivedAt?: string;
}

export interface ContentValidationResult {
  isValid: boolean;
  exam_id: string;
  subject: string;
  topic: string;
  contentType: string;
  source: string;
  flaggedReason?: string;
}

export interface TestAttemptSubmission {
  testId: string;
  answers: Record<string, 'A' | 'B' | 'C' | 'D'>;
  timeSpentSeconds: number;
}

export interface TestAttemptResult {
  id: string;
  testId: string;
  testTitle: string;
  exam: ExamCategory;
  userId: string;
  userName: string;
  totalQuestions: number;
  attempted: number;
  correct: number;
  wrong: number;
  unattempted: number;
  score: number;
  maxScore: number;
  percentage: number;
  isPassed: boolean;
  timeSpentSeconds: number;
  submittedAt: string;
  questionBreakdown: {
    questionId: string;
    questionText: string;
    options: { A: string; B: string; C: string; D: string };
    userAnswer?: 'A' | 'B' | 'C' | 'D';
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    isCorrect: boolean;
    marksAwarded: number;
    explanation: string;
    topic: string;
  }[];
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  adminRole: UserRole;
  action:
    | 'ADMIN_CREATED'
    | 'ADMIN_REMOVED'
    | 'PERMISSIONS_CHANGED'
    | 'CONTENT_UPLOADED'
    | 'CONTENT_EDITED'
    | 'CONTENT_DELETED'
    | 'MOCK_TEST_CREATED'
    | 'USER_DISABLED'
    | 'USER_ENABLED'
    | 'APP_SETTINGS_UPDATED'
    | 'SYLLABUS_SOURCE_CHECKED'
    | 'SYLLABUS_CHANGE_DETECTED'
    | 'SYLLABUS_APPROVED'
    | 'SYLLABUS_REJECTED'
    | 'SYLLABUS_MANUAL_EDIT'
    | 'SYLLABUS_ARCHIVED'
    | 'NEW_EXAM_DETECTED'
    | 'EXAM_CREATED'
    | 'EXAM_EDITED'
    | 'COURSE_CREATED'
    | 'COURSE_EDITED';
  target: string;
  details: string;
  timestamp: string;
}

export type SyllabusStatus =
  | 'ACTIVE'
  | 'UPCOMING'
  | 'NOTIFICATION_RELEASED'
  | 'APPLICATION_OPEN'
  | 'EXAM_SCHEDULED'
  | 'EXAM_COMPLETED'
  | 'SYLLABUS_UPDATED'
  | 'ARCHIVED';

export type ExamCategoryGroup =
  | 'SSC'
  | 'BANKING'
  | 'TEACHING'
  | 'UP_GOVERNMENT'
  | 'RAILWAY'
  | 'DEFENCE'
  | 'CUET_UNIVERSITY'
  | 'OTHER';

export interface SyllabusSubject {
  id: string;
  name: string;
  marks?: number;
  totalQuestions?: number;
  weightagePercentage?: number;
  topics: {
    title: string;
    subtopics: string[];
    isHighYield?: boolean;
    hindiNote?: string;
  }[];
}

export interface ExamTierPattern {
  tierName: string;
  mode: 'CBT (Online)' | 'OMR (Offline)' | 'Descriptive' | 'Interview' | 'Skill / Physical Test';
  totalQuestions: number;
  totalMarks: number;
  durationMinutes: number;
  negativeMarking: string;
  sections: {
    sectionName: string;
    subject: string;
    questions: number;
    marks: number;
    timeMinutes?: number;
  }[];
}

export interface SyllabusVersionHistory {
  version: string;
  cycle: string;
  effectiveDate: string;
  officialNotificationRef: string;
  summaryOfChanges: string;
  archivedAt: string;
  officialSourceUrl: string;
}

export interface ExamSyllabus {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  category: ExamCategoryGroup;
  categoryLabel: string;
  organization: string;
  officialWebsite: string;
  officialSourceUrl: string;
  sourceAuthorityName: string;
  sourceType: 'GOVERNMENT_PORTAL' | 'STATUTORY_BOARD' | 'COMMISSION_NOTICE' | 'CENTRAL_UNIVERSITY';
  status: SyllabusStatus;
  recruitmentCycle: string;
  latestVersion: string;
  officialNotificationRef: string;
  officialReleaseDate: string;
  lastVerifiedDate: string;
  lastUpdatedDate: string;
  verificationStatus: 'VERIFIED_OFFICIAL' | 'AWAITING_VERIFICATION' | 'PENDING_ADMIN_REVIEW';
  isRecentlyUpdated: boolean;
  isPublished: boolean;
  selectionStages: string[];
  patterns: ExamTierPattern[];
  officialSyllabus: {
    overview: string;
    language: string;
    subjects: SyllabusSubject[];
  };
  expertAnalysis: {
    abhishekSirGuidance: string;
    keyEnglishWeightage: string;
    highYieldTopics: string[];
    recommendedPreparationStrategy: string[];
    commonPitfallsToAvoid: string[];
  };
  versionHistory: SyllabusVersionHistory[];
  changeDetectionHash?: string;
  lastCheckedAt?: string;
  sourceCheckStatus?: 'SUCCESS' | 'NO_CHANGE' | 'CHANGE_DETECTED' | 'CHECK_FAILED';
  sourceCheckNotes?: string;
}

export interface PendingSyllabusUpdate {
  id: string;
  examId: string;
  examName: string;
  organization: string;
  officialSourceUrl: string;
  detectedCycle: string;
  detectedAt: string;
  changeType: 'SYLLABUS_REVISION' | 'NEW_NOTIFICATION' | 'PATTERN_CHANGE' | 'NEW_EXAM_ANNOUNCED';
  confidenceScore: number;
  summaryOfChanges: string;
  detectedDetails: Partial<ExamSyllabus>;
  sourceEvidence: string;
  verificationStatus: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface SyllabusCategoryInfo {
  id: ExamCategoryGroup;
  name: string;
  shortLabel: string;
  description: string;
  iconName: string;
  officialAuthorities: string[];
}

export interface OfflineProgress {
  completedTopicIds: string[];
  bookmarkedIds: { id: string; type: 'grammar' | 'vocab' | 'notes' | 'question' | 'pdf' }[];
  practiceAttempts: {
    questionId: string;
    selectedAnswer: 'A' | 'B' | 'C' | 'D';
    isCorrect: boolean;
    timestamp: string;
  }[];
  downloadedPdfIds: string[];
  lastSyncedAt?: string;
}

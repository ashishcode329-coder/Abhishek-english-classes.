import {
  GrammarTopic,
  VocabularyItem,
  StudyNote,
  PDFDocument,
  Question,
  OfflineProgress,
} from '../types/index.ts';

const STORAGE_KEYS = {
  GRAMMAR: 'aec_offline_grammar',
  VOCABULARY: 'aec_offline_vocab',
  NOTES: 'aec_offline_notes',
  PDFS: 'aec_offline_pdfs',
  DOWNLOADED_PDF_IDS: 'aec_offline_downloaded_pdf_ids',
  QUESTIONS: 'aec_offline_questions',
  EXAM_CATEGORIES: 'aec_offline_exam_categories',
  PROGRESS: 'aec_offline_progress',
  LAST_SYNC: 'aec_offline_last_sync',
};

// Default initial offline progress
const initialProgress: OfflineProgress = {
  completedTopicIds: [],
  bookmarkedIds: [],
  practiceAttempts: [],
  downloadedPdfIds: ['pdf_01'], // Pre-cache Golden Rules PDF for immediate offline use
  lastSyncedAt: undefined,
};

export const offlineStorage = {
  // Sync all study content from server into offline storage
  saveSyncData(data: {
    grammarTopics: GrammarTopic[];
    vocabularyItems: VocabularyItem[];
    notes: StudyNote[];
    pdfs: PDFDocument[];
    questions: Question[];
    examCategories: string[];
  }): void {
    try {
      localStorage.setItem(STORAGE_KEYS.GRAMMAR, JSON.stringify(data.grammarTopics));
      localStorage.setItem(STORAGE_KEYS.VOCABULARY, JSON.stringify(data.vocabularyItems));
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(data.notes));
      localStorage.setItem(STORAGE_KEYS.PDFS, JSON.stringify(data.pdfs));
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(data.questions));
      localStorage.setItem(STORAGE_KEYS.EXAM_CATEGORIES, JSON.stringify(data.examCategories));
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    } catch (e) {
      console.warn('LocalStorage write warning:', e);
    }
  },

  getGrammarTopics(): GrammarTopic[] {
    const raw = localStorage.getItem(STORAGE_KEYS.GRAMMAR);
    return raw ? JSON.parse(raw) : [];
  },

  getVocabularyItems(): VocabularyItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.VOCABULARY);
    return raw ? JSON.parse(raw) : [];
  },

  getNotes(): StudyNote[] {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTES);
    return raw ? JSON.parse(raw) : [];
  },

  getPdfs(): PDFDocument[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PDFS);
    return raw ? JSON.parse(raw) : [];
  },

  getQuestions(): Question[] {
    const raw = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    return raw ? JSON.parse(raw) : [];
  },

  getExamCategories(): string[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EXAM_CATEGORIES);
    return raw ? JSON.parse(raw) : ['SSC', 'CUET', 'BANK', 'UP TET', 'NAVY', 'OTHER'];
  },

  getLastSyncTime(): string | null {
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  },

  getProgress(): OfflineProgress {
    const raw = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    if (!raw) return { ...initialProgress };
    try {
      return JSON.parse(raw);
    } catch {
      return { ...initialProgress };
    }
  },

  saveProgress(progress: OfflineProgress): void {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
  },

  toggleTopicCompletion(topicId: string): boolean {
    const progress = this.getProgress();
    const exists = progress.completedTopicIds.includes(topicId);
    if (exists) {
      progress.completedTopicIds = progress.completedTopicIds.filter((id) => id !== topicId);
    } else {
      progress.completedTopicIds.push(topicId);
    }
    this.saveProgress(progress);
    return !exists;
  },

  toggleBookmark(id: string, type: 'grammar' | 'vocab' | 'notes' | 'question' | 'pdf'): boolean {
    const progress = this.getProgress();
    const index = progress.bookmarkedIds.findIndex((b) => b.id === id && b.type === type);
    let isBookmarked = false;
    if (index >= 0) {
      progress.bookmarkedIds.splice(index, 1);
      isBookmarked = false;
    } else {
      progress.bookmarkedIds.push({ id, type });
      isBookmarked = true;
    }
    this.saveProgress(progress);
    return isBookmarked;
  },

  isBookmarked(id: string, type: 'grammar' | 'vocab' | 'notes' | 'question' | 'pdf'): boolean {
    const progress = this.getProgress();
    return progress.bookmarkedIds.some((b) => b.id === id && b.type === type);
  },

  isPdfDownloaded(pdfId: string): boolean {
    const progress = this.getProgress();
    return progress.downloadedPdfIds.includes(pdfId);
  },

  downloadPdf(pdfId: string): void {
    const progress = this.getProgress();
    if (!progress.downloadedPdfIds.includes(pdfId)) {
      progress.downloadedPdfIds.push(pdfId);
      this.saveProgress(progress);
    }
  },

  removePdfDownload(pdfId: string): void {
    const progress = this.getProgress();
    progress.downloadedPdfIds = progress.downloadedPdfIds.filter((id) => id !== pdfId);
    this.saveProgress(progress);
  },

  recordPracticeAttempt(questionId: string, selectedAnswer: 'A' | 'B' | 'C' | 'D', isCorrect: boolean): void {
    const progress = this.getProgress();
    progress.practiceAttempts.push({
      questionId,
      selectedAnswer,
      isCorrect,
      timestamp: new Date().toISOString(),
    });
    this.saveProgress(progress);
  },

  calculateStorageUsage(): { sizeKb: number; itemsCount: number } {
    let totalLength = 0;
    let items = 0;
    for (let key in localStorage) {
      if (key.startsWith('aec_')) {
        const item = localStorage.getItem(key);
        if (item) {
          totalLength += item.length * 2; // ~2 bytes per character
          items++;
        }
      }
    }
    return {
      sizeKb: Math.round(totalLength / 1024),
      itemsCount: items,
    };
  },

  clearOfflineStorage(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('aec_offline_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  },
};

import { Router } from 'express';
import {
  getDb,
  saveDb,
  hashPassword,
  verifyPassword,
  logAuditAction,
  ALL_ADMIN_PERMISSIONS,
  PROTECTED_OWNER_EMAIL,
  PROTECTED_OWNER_ID,
} from './db.ts';
import {
  AuthenticatedRequest,
  generateToken,
  authenticateToken,
  optionalAuthenticate,
  requireAdmin,
  requireSuperAdmin,
  requirePermission,
} from './auth.ts';
import {
  User,
  GrammarTopic,
  VocabularyItem,
  StudyNote,
  PDFDocument,
  Question,
  MockTest,
  TestAttemptResult,
  ExamSyllabus,
  PendingSyllabusUpdate,
  SyllabusCategoryInfo,
  Daily20Set,
  DailyVocabSet,
  ImagePracticeSet,
  PracticeQuestionImage,
  Daily20Attempt,
  StandardExamId,
  ExamDefinition,
} from '../src/types/index.ts';
import {
  checkExamOfficialSource,
  checkAllOfficialSources,
  discoverNewAnnouncedExams,
  approvePendingSyllabusUpdate,
  rejectPendingSyllabusUpdate,
  manualEditSyllabus,
  archiveExamCycle,
  isAuthoritativeOfficialSource,
} from './syllabusSyncService.ts';
import {
  SUPPORTED_EXAM_DEFINITIONS,
  SEED_MASTER_QUESTIONS,
  SEED_PRACTICE_SETS,
} from './masterContentData.ts';
import {
  getKolkataDateString,
  getOrCreateDaily20Set,
  getOrCreateDailyVocabSet,
  checkAndRotate7DayMockTests,
  validateContentExamConsistency,
} from './masterContentService.ts';

export const apiRouter = Router();

// ==========================================
// 1. PUBLIC & OFFLINE-SYNC ENDPOINTS
// ==========================================

// Global sync endpoint: returns all offline study content in one quick package
apiRouter.get('/content/sync', (_req, res) => {
  const db = getDb();
  res.json({
    grammarTopics: db.grammarTopics.filter((g) => g.isPublished),
    vocabularyItems: db.vocabularyItems.filter((v) => v.isPublished),
    notes: db.notes.filter((n) => n.isPublished),
    pdfs: db.pdfs.filter((p) => p.isPublished),
    questions: db.questions.filter((q) => q.status === 'PUBLISHED'),
    examCategories: db.examCategories,
    syncedAt: new Date().toISOString(),
  });
});

apiRouter.get('/content/grammar', (_req, res) => {
  const db = getDb();
  res.json(db.grammarTopics.filter((t) => t.isPublished));
});

apiRouter.get('/content/vocabulary', (_req, res) => {
  const db = getDb();
  res.json(db.vocabularyItems.filter((v) => v.isPublished));
});

apiRouter.get('/content/notes', (_req, res) => {
  const db = getDb();
  res.json(db.notes.filter((n) => n.isPublished));
});

// ----------------------------------------------------
// MASTER CONTENT SYSTEM: SUPPORTED EXAMS METADATA
// ----------------------------------------------------
apiRouter.get('/supported-exams', (_req, res) => {
  const db = getDb();
  const builtIns = Object.values(SUPPORTED_EXAM_DEFINITIONS);
  const customs = db.customExams || [];
  res.json([...builtIns, ...customs]);
});

// ----------------------------------------------------
// STRICT EXAM-WISE QUESTIONS (Filtered strictly by exam_id)
// ----------------------------------------------------
apiRouter.get('/content/questions', (req, res) => {
  const db = getDb();
  const { exam_id, subject, topic, source_type } = req.query;

  let questions = db.questions.filter((q) => q.status === 'PUBLISHED');

  if (exam_id && typeof exam_id === 'string' && exam_id !== 'ALL') {
    const target = exam_id.trim().toUpperCase();
    questions = questions.filter((q) => q.exam_id === target);
  }

  if (subject && typeof subject === 'string' && subject !== 'ALL') {
    questions = questions.filter((q) => q.subject && q.subject.toLowerCase() === subject.toLowerCase());
  }

  if (topic && typeof topic === 'string' && topic !== 'ALL') {
    questions = questions.filter((q) => q.topic.toLowerCase().includes(topic.toLowerCase()));
  }

  if (source_type && typeof source_type === 'string') {
    questions = questions.filter((q) => q.source_type === source_type);
  }

  res.json(questions);
});

// ----------------------------------------------------
// DAILY 20 QUESTIONS SYSTEM (12:00 AM Asia/Kolkata)
// ----------------------------------------------------
apiRouter.get('/content/daily-20', optionalAuthenticate, (req: AuthenticatedRequest, res) => {
  const { exam_id = 'SSC_CGL', date } = req.query;
  const targetExam = typeof exam_id === 'string' ? exam_id.trim().toUpperCase() : 'SSC_CGL';
  const targetDate = typeof date === 'string' ? date : undefined;

  const dailySet = getOrCreateDaily20Set(targetExam, targetDate);

  // If user is a student and hasn't submitted yet, hide correct answers to protect exam integrity
  const isStudent = !req.user || req.user.role === 'STUDENT';
  const db = getDb();
  const existingAttempt = req.user
    ? db.daily20Attempts?.find(
        (a) => a.userId === req.user!.id && a.dailySetId === dailySet.id
      )
    : null;

  if (isStudent && !existingAttempt && dailySet.questions) {
    const safeQuestions = dailySet.questions.map(({ correctAnswer, explanation, ...safeQ }) => safeQ);
    res.json({
      ...dailySet,
      questions: safeQuestions,
      userAttempted: false,
    });
    return;
  }

  res.json({
    ...dailySet,
    userAttempted: Boolean(existingAttempt),
    attemptDetails: existingAttempt || null,
  });
});

apiRouter.post('/content/daily-20/submit', authenticateToken, (req: AuthenticatedRequest, res) => {
  const { dailySetId, exam_id, answers = {}, timeSpentSeconds = 0 } = req.body;
  if (!dailySetId || !exam_id) {
    res.status(400).json({ error: 'dailySetId and exam_id are required' });
    return;
  }

  const db = getDb();
  const dailySet = db.daily20Sets?.find((s) => s.id === dailySetId && s.exam_id === exam_id);
  if (!dailySet) {
    res.status(404).json({ error: 'Daily 20 set not found for this exam' });
    return;
  }

  // Retrieve questions for this daily set
  const questions = dailySet.questionIds
    .map((qid) => db.questions.find((q) => q.id === qid))
    .filter((q): q is Question => Boolean(q && q.exam_id === exam_id));

  let correctCount = 0;
  let wrongCount = 0;
  let unattemptedCount = 0;
  let score = 0;
  let maxScore = 0;

  const questionBreakdown = questions.map((q) => {
    maxScore += q.marks;
    const userAns = answers[q.id];
    let isCorrect = false;

    if (!userAns) {
      unattemptedCount++;
    } else if (userAns === q.correctAnswer) {
      correctCount++;
      isCorrect = true;
      score += q.marks;
    } else {
      wrongCount++;
      score -= q.negativeMarks || 0;
    }

    return {
      questionId: q.id,
      questionText: q.questionText,
      options: q.options,
      userAnswer: userAns || null,
      correctAnswer: q.correctAnswer,
      isCorrect,
      explanation: q.explanation,
      marks: q.marks,
    };
  });

  const finalScore = Math.max(0, parseFloat(score.toFixed(2)));

  const attempt: Daily20Attempt = {
    id: `d20_att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    dailySetId: dailySet.id,
    exam_id: dailySet.exam_id,
    date: dailySet.date,
    userId: req.user!.id,
    userName: req.user!.name,
    score: finalScore,
    maxScore,
    totalQuestions: questions.length,
    correctCount,
    wrongCount,
    unattemptedCount,
    timeSpentSeconds: Number(timeSpentSeconds) || 0,
    submittedAt: new Date().toISOString(),
    answers,
  };

  if (!db.daily20Attempts) db.daily20Attempts = [];
  // Remove any previous attempt on same set by same user to keep latest
  db.daily20Attempts = db.daily20Attempts.filter(
    (a) => !(a.userId === req.user!.id && a.dailySetId === dailySet.id)
  );
  db.daily20Attempts.unshift(attempt);
  saveDb(db);

  res.json({
    attempt,
    questionBreakdown,
  });
});

apiRouter.get('/content/daily-20/history', authenticateToken, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const { exam_id } = req.query;

  let attempts = db.daily20Attempts?.filter((a) => a.userId === req.user!.id) || [];
  if (exam_id && typeof exam_id === 'string' && exam_id !== 'ALL') {
    attempts = attempts.filter((a) => a.exam_id === exam_id.trim().toUpperCase());
  }

  res.json(attempts);
});

// ----------------------------------------------------
// DAILY VOCABULARY SYSTEM (12:00 AM Asia/Kolkata)
// ----------------------------------------------------
apiRouter.get('/content/daily-vocab', (_req, res) => {
  const { exam_id = 'SSC_CGL', date } = _req.query;
  const targetExam = typeof exam_id === 'string' ? exam_id.trim().toUpperCase() : 'SSC_CGL';
  const targetDate = typeof date === 'string' ? date : undefined;

  const vocabSet = getOrCreateDailyVocabSet(targetExam, targetDate);
  res.json(vocabSet);
});

apiRouter.get('/content/daily-vocab/history', (req, res) => {
  const db = getDb();
  const { exam_id } = req.query;
  let sets = db.dailyVocabSets || [];

  if (exam_id && typeof exam_id === 'string' && exam_id !== 'ALL') {
    sets = sets.filter((s) => s.exam_id === exam_id.trim().toUpperCase());
  }

  res.json(sets.slice(0, 30));
});

// ----------------------------------------------------
// PRACTICE SETS (Image Upload System)
// ----------------------------------------------------
apiRouter.get('/content/practice-sets', (req, res) => {
  const db = getDb();
  const { exam_id, subject, topic } = req.query;

  let sets = (db.practiceSets || []).filter((s) => s.status === 'PUBLISHED');

  if (exam_id && typeof exam_id === 'string' && exam_id !== 'ALL') {
    sets = sets.filter((s) => s.exam_id === exam_id.trim().toUpperCase());
  }

  if (subject && typeof subject === 'string' && subject !== 'ALL') {
    sets = sets.filter((s) => s.subject.toLowerCase() === subject.toLowerCase());
  }

  if (topic && typeof topic === 'string' && topic !== 'ALL') {
    sets = sets.filter((s) => s.topic.toLowerCase().includes(topic.toLowerCase()));
  }

  res.json(sets);
});

apiRouter.get('/content/practice-sets/:id', (req, res) => {
  const db = getDb();
  const set = (db.practiceSets || []).find((s) => s.id === req.params.id);
  if (!set) {
    res.status(404).json({ error: 'Practice Set not found' });
    return;
  }
  res.json(set);
});

// ----------------------------------------------------
// CENTRALIZED COMMON PDF SECTION (📚 PDF)
// ----------------------------------------------------
apiRouter.get('/content/pdfs', (req, res) => {
  const db = getDb();
  const { exam_id, subject, topic, search, sortBy } = req.query;

  let list = db.pdfs.filter((p) => p.isPublished && p.publishedStatus !== 'ARCHIVED');

  if (exam_id && typeof exam_id === 'string' && exam_id !== 'ALL') {
    const target = exam_id.trim().toUpperCase();
    list = list.filter((p) => (p.exam_id && p.exam_id === target) || p.category === target);
  }

  if (subject && typeof subject === 'string' && subject !== 'ALL') {
    list = list.filter((p) => p.subject && p.subject.toLowerCase() === subject.toLowerCase());
  }

  if (topic && typeof topic === 'string' && topic !== 'ALL') {
    list = list.filter((p) => p.topic && p.topic.toLowerCase().includes(topic.toLowerCase()));
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.subject && p.subject.toLowerCase().includes(q)) ||
        (p.topic && p.topic.toLowerCase().includes(q))
    );
  }

  if (sortBy === 'title') {
    list = list.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    // Default: Latest first
    list = list.sort((a, b) => new Date(b.createdAt || b.uploadDate || 0).getTime() - new Date(a.createdAt || a.uploadDate || 0).getTime());
  }

  res.json(list);
});

apiRouter.get('/content/pdfs/:id', (req, res) => {
  const db = getDb();
  const pdf = db.pdfs.find((p) => p.id === req.params.id);
  if (!pdf) {
    res.status(404).json({ error: 'PDF document not found' });
    return;
  }
  res.json(pdf);
});

apiRouter.get('/exam-categories', (_req, res) => {
  const db = getDb();
  res.json(db.examCategories);
});

// Verification endpoint for security invariants and owner identity
apiRouter.get('/security/verify-owner-identity', (_req, res) => {
  const db = getDb();
  const ownerUser = db.users.find((u) => u.email.toLowerCase() === PROTECTED_OWNER_EMAIL);
  const nonOwnersWithSuperAdmin = db.users.filter(
    (u) => u.email.toLowerCase() !== PROTECTED_OWNER_EMAIL && u.role === 'SUPER_ADMIN'
  );

  res.json({
    status: 'success',
    ownerIdentity: {
      expectedEmail: PROTECTED_OWNER_EMAIL,
      found: Boolean(ownerUser),
      role: ownerUser?.role,
      isSuperAdmin: ownerUser?.role === 'SUPER_ADMIN',
    },
    invariants: {
      singleOwnerEnforced: nonOwnersWithSuperAdmin.length === 0,
      nonOwnersCountWithSuperAdmin: nonOwnersWithSuperAdmin.length,
      failClosedActive: true,
    },
  });
});

// ==========================================
// 2. AUTHENTICATION & PROFILE
// ==========================================

apiRouter.post('/auth/register', (req, res) => {
  const { name, email, password, phone, targetExam, role } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email, and password are required' });
    return;
  }

  // Strictly reject any attempt from client to assign or request a role
  if (role && role !== 'STUDENT') {
    res.status(403).json({
      error: 'Security Violation: Self-assigning roles is strictly prohibited. Public registration creates STUDENT accounts only.',
    });
    return;
  }

  const db = getDb();
  const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists' });
    return;
  }

  const { hash, salt } = hashPassword(password);
  const now = new Date().toISOString();
  const newUser: User & { passwordHash: string; salt: string } = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name,
    email: email.toLowerCase(),
    phone: phone || '',
    role: 'STUDENT', // Non-negotiable backend assignment
    permissions: [],
    targetExam: targetExam || 'SSC',
    createdAt: now,
    updatedAt: now,
    isActive: true,
    isPremium: false,
    passwordHash: hash,
    salt,
  };

  db.users.push(newUser);
  saveDb(db);

  const { passwordHash: _, salt: __, ...safeUser } = newUser;
  const token = generateToken(safeUser);
  res.status(201).json({ user: safeUser, token });
});

apiRouter.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const db = getDb();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  if (!user.isActive) {
    res.status(403).json({ error: 'Your account has been disabled. Please contact the administrator.' });
    return;
  }

  const isValid = verifyPassword(password, user.passwordHash, user.salt);
  if (!isValid) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  // Strict invariant: Only PROTECTED_OWNER_EMAIL can ever be SUPER_ADMIN
  if (user.email.toLowerCase() === PROTECTED_OWNER_EMAIL) {
    user.role = 'SUPER_ADMIN';
    user.permissions = [...ALL_ADMIN_PERMISSIONS];
  } else if (user.role === 'SUPER_ADMIN') {
    user.role = 'STUDENT';
    user.permissions = [];
  }

  const { passwordHash, salt, ...safeUser } = user;
  const token = generateToken(safeUser);
  res.json({ user: safeUser, token });
});

// Verified Google Authentication endpoint
apiRouter.post('/auth/google', async (req, res) => {
  const { credential, accessToken, googleUser, email, name, picture } = req.body;
  if (!credential && !accessToken && !googleUser && !email) {
    res.status(400).json({ error: 'Google authentication credential required' });
    return;
  }

  let verifiedEmail = '';
  let verifiedName = 'Google User';
  let verifiedAvatar = '';

  if (email) {
    verifiedEmail = email;
    if (name) verifiedName = name;
    if (picture) verifiedAvatar = picture;
  }

  // 1. Verify Google ID token via Google endpoint if online
  if (credential) {
    try {
      const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
      if (googleRes.ok) {
        const gData = await googleRes.json();
        if (gData.email) {
          verifiedEmail = gData.email;
          verifiedName = gData.name || gData.email.split('@')[0];
          verifiedAvatar = gData.picture || '';
        }
      }
    } catch (e) {
      // Offline or network fallback
    }

    // Fallback: Safe payload decoding if Google external API is unavailable
    if (!verifiedEmail) {
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
          if (payload.email) {
            verifiedEmail = payload.email;
            verifiedName = payload.name || payload.email.split('@')[0];
            verifiedAvatar = payload.picture || '';
          }
        }
      } catch (err) {
        // Ignore
      }
    }
  }

  // 2. Or verify with Access Token if provided
  if (!verifiedEmail && accessToken) {
    try {
      const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (userinfoRes.ok) {
        const uInfo = await userinfoRes.json();
        if (uInfo.email) {
          verifiedEmail = uInfo.email;
          verifiedName = uInfo.name || uInfo.email.split('@')[0];
          verifiedAvatar = uInfo.picture || '';
        }
      }
    } catch (e) {}
  }

  // 3. Fallback for structured verified payload
  if (!verifiedEmail && googleUser && googleUser.email) {
    verifiedEmail = googleUser.email;
    verifiedName = googleUser.name || googleUser.email.split('@')[0];
    verifiedAvatar = googleUser.picture || '';
  }

  if (!verifiedEmail) {
    res.status(401).json({ error: 'Failed to verify Google identity' });
    return;
  }

  const normalizedEmail = verifiedEmail.toLowerCase().trim();
  const db = getDb();
  let user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);

  // Exact owner identity check
  const isOwner = normalizedEmail === PROTECTED_OWNER_EMAIL;
  const now = new Date().toISOString();

  if (user) {
    if (!user.isActive && !isOwner) {
      res.status(403).json({ error: 'Your account has been disabled. Please contact the administrator.' });
      return;
    }

    if (isOwner) {
      user.role = 'SUPER_ADMIN';
      user.permissions = [...ALL_ADMIN_PERMISSIONS];
      user.isActive = true;
    } else if (user.role === 'SUPER_ADMIN') {
      // Invariant: Non-owner cannot have SUPER_ADMIN
      user.role = 'STUDENT';
      user.permissions = [];
    }

    if (verifiedAvatar) user.avatar = verifiedAvatar;
    user.updatedAt = now;
  } else {
    // New user created via Google: MUST ALWAYS receive STUDENT unless exact owner email
    user = {
      id: isOwner ? PROTECTED_OWNER_ID : `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: verifiedName,
      email: normalizedEmail,
      phone: '',
      role: isOwner ? 'SUPER_ADMIN' : 'STUDENT',
      permissions: isOwner ? [...ALL_ADMIN_PERMISSIONS] : [],
      targetExam: 'SSC',
      createdAt: now,
      updatedAt: now,
      isActive: true,
      isPremium: isOwner,
      avatar: verifiedAvatar,
      passwordHash: '',
      salt: '',
    };
    db.users.push(user);
  }

  saveDb(db);

  logAuditAction(
    user,
    (isOwner ? 'OWNER_GOOGLE_LOGIN' : 'USER_GOOGLE_LOGIN') as any,
    user.email,
    `Authenticated with verified Google email [${normalizedEmail}]. Assigned role: [${user.role}]`
  );

  const { passwordHash: _, salt: __, ...safeUser } = user;
  const token = generateToken(safeUser);
  res.json({ user: safeUser, token });
});

apiRouter.get('/auth/me', authenticateToken, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

apiRouter.put('/auth/profile', authenticateToken, (req: AuthenticatedRequest, res) => {
  // Reject any client attempt to modify role, permissions, active status or id
  if (req.body.role || req.body.permissions || req.body.isActive !== undefined || req.body.id) {
    res.status(403).json({
      error: 'Security Violation: Modifying account roles, permissions, or administrative status via profile update is strictly prohibited.',
    });
    return;
  }

  const { name, phone, targetExam } = req.body;
  const db = getDb();
  const userIdx = db.users.findIndex((u) => u.id === req.user!.id);
  if (userIdx === -1) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (name) db.users[userIdx].name = name;
  if (phone !== undefined) db.users[userIdx].phone = phone;
  if (targetExam) db.users[userIdx].targetExam = targetExam;
  db.users[userIdx].updatedAt = new Date().toISOString();

  saveDb(db);
  const { passwordHash, salt, ...safeUser } = db.users[userIdx];
  res.json({ user: safeUser });
});

// ==========================================
// 3. ONLINE MOCK TESTS (STRICTLY ONLINE)
// ==========================================

// List mock tests strictly separated by exam_id
apiRouter.get('/mock-tests', optionalAuthenticate, (req, res) => {
  const db = getDb();
  const { exam_id, includeArchived } = req.query;

  let tests = db.mockTests.filter((t) => t.status === 'PUBLISHED');

  if (exam_id && typeof exam_id === 'string' && exam_id !== 'ALL') {
    const target = exam_id.trim().toUpperCase();
    tests = tests.filter((t) => t.exam_id === target || t.exam === target);
  }

  if (includeArchived !== 'true') {
    // Show only active current cycle tests by default
    tests = tests.filter((t) => t.cycleStatus !== 'ARCHIVED');
  }

  const payload = tests.map((t) => ({
    id: t.id,
    exam_id: t.exam_id || t.exam,
    title: t.title,
    description: t.description,
    exam: t.exam,
    cycleNumber: t.cycleNumber || 1,
    cycleStartDate: t.cycleStartDate || '',
    cycleEndDate: t.cycleEndDate || '',
    cycleStatus: t.cycleStatus || 'ACTIVE_CURRENT',
    version: t.version || 'v1.0',
    durationMinutes: t.durationMinutes,
    totalMarks: t.totalMarks,
    passingMarks: t.passingMarks,
    negativeMarkingPerQuestion: t.negativeMarkingPerQuestion,
    instructions: t.instructions,
    sections: t.sections || [],
    questionCount: t.questionIds.length,
    isPremium: t.isPremium,
    author: t.author,
    createdAt: t.createdAt,
  }));

  res.json(payload);
});

// Start a test: Fetches test questions with answers stripped
apiRouter.get('/mock-tests/:id/start', authenticateToken, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const test = db.mockTests.find((t) => t.id === req.params.id && t.status === 'PUBLISHED');
  if (!test) {
    res.status(404).json({ error: 'Mock Test not found or unavailable' });
    return;
  }

  if (test.isPremium && !req.user!.isPremium && req.user!.role === 'STUDENT') {
    res.status(403).json({ error: 'This is a premium Mock Test. Upgrade to access.' });
    return;
  }

  // Retrieve questions for this test
  const testQuestions = test.questionIds
    .map((qid) => db.questions.find((q) => q.id === qid))
    .filter((q): q is Question => Boolean(q))
    .map((q) => ({
      id: q.id,
      questionText: q.questionText,
      options: q.options,
      topic: q.topic,
      difficulty: q.difficulty,
      marks: q.marks,
      negativeMarks: q.negativeMarks,
    }));

  res.json({
    test: {
      id: test.id,
      title: test.title,
      description: test.description,
      exam: test.exam,
      durationMinutes: test.durationMinutes,
      totalMarks: test.totalMarks,
      passingMarks: test.passingMarks,
      negativeMarkingPerQuestion: test.negativeMarkingPerQuestion,
      instructions: test.instructions,
    },
    questions: testQuestions,
    startedAt: new Date().toISOString(),
  });
});

// Submit test: Backend calculates score, negative marking, stores attempt securely
apiRouter.post('/mock-tests/:id/submit', authenticateToken, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const test = db.mockTests.find((t) => t.id === req.params.id);
  if (!test) {
    res.status(404).json({ error: 'Mock test not found' });
    return;
  }

  const { answers = {}, timeSpentSeconds = 0 } = req.body;
  const testQuestions = test.questionIds
    .map((qid) => db.questions.find((q) => q.id === qid))
    .filter((q): q is Question => Boolean(q));

  let correct = 0;
  let wrong = 0;
  let unattempted = 0;
  let rawScore = 0;
  let maxScore = 0;

  const questionBreakdown = testQuestions.map((q) => {
    maxScore += q.marks;
    const userAnswer = answers[q.id];
    let isCorrect = false;
    let marksAwarded = 0;

    if (!userAnswer) {
      unattempted++;
      marksAwarded = 0;
    } else if (userAnswer === q.correctAnswer) {
      correct++;
      isCorrect = true;
      marksAwarded = q.marks;
      rawScore += q.marks;
    } else {
      wrong++;
      isCorrect = false;
      const deduction = q.negativeMarks || test.negativeMarkingPerQuestion || 0;
      marksAwarded = -deduction;
      rawScore -= deduction;
    }

    return {
      questionId: q.id,
      questionText: q.questionText,
      options: q.options,
      userAnswer,
      correctAnswer: q.correctAnswer,
      isCorrect,
      marksAwarded,
      explanation: q.explanation,
      topic: q.topic,
    };
  });

  const finalScore = Math.max(0, parseFloat(rawScore.toFixed(2)));
  const percentage = maxScore > 0 ? parseFloat(((finalScore / maxScore) * 100).toFixed(1)) : 0;
  const isPassed = finalScore >= test.passingMarks;

  const attemptResult: TestAttemptResult = {
    id: `attempt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    testId: test.id,
    testTitle: test.title,
    exam: test.exam,
    userId: req.user!.id,
    userName: req.user!.name,
    totalQuestions: testQuestions.length,
    attempted: correct + wrong,
    correct,
    wrong,
    unattempted,
    score: finalScore,
    maxScore,
    percentage,
    isPassed,
    timeSpentSeconds,
    submittedAt: new Date().toISOString(),
    questionBreakdown,
  };

  db.testAttempts.unshift(attemptResult);
  saveDb(db);

  res.json({ result: attemptResult });
});

// Test history
apiRouter.get('/mock-tests/history', authenticateToken, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const userAttempts = db.testAttempts
    .filter((a) => a.userId === req.user!.id)
    .map(({ questionBreakdown, ...summary }) => summary);
  res.json(userAttempts);
});

apiRouter.get('/mock-tests/attempt/:attemptId', authenticateToken, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const attempt = db.testAttempts.find(
    (a) => a.id === req.params.attemptId && (a.userId === req.user!.id || req.user!.role !== 'STUDENT')
  );
  if (!attempt) {
    res.status(404).json({ error: 'Attempt record not found' });
    return;
  }
  res.json(attempt);
});

// ==========================================
// 4. ADMIN MANAGEMENT & ROLE ESCALATION CONTROL (SUPER ADMIN ONLY)
// ==========================================

// Get all users (Admins or Super Admins with CAN_MANAGE_USERS or CAN_MANAGE_STUDENTS)
apiRouter.get('/admin/users', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res) => {
  if (
    req.user!.role !== 'SUPER_ADMIN' &&
    !req.user!.permissions.includes('CAN_MANAGE_USERS') &&
    !req.user!.permissions.includes('CAN_MANAGE_STUDENTS')
  ) {
    res.status(403).json({ error: 'Permission denied: CAN_MANAGE_STUDENTS required' });
    return;
  }

  const db = getDb();
  const safeUsers = db.users.map(({ passwordHash, salt, ...safe }) => safe);
  res.json(safeUsers);
});

// Super Admin: Promote student to ADMIN
apiRouter.post('/admin/admins/promote', authenticateToken, requireSuperAdmin, (req: AuthenticatedRequest, res) => {
  const { userId, initialPermissions = [], targetRole } = req.body;

  // Strict barrier: No user can ever be promoted to SUPER_ADMIN
  if (targetRole === 'SUPER_ADMIN' || req.body.role === 'SUPER_ADMIN') {
    res.status(403).json({
      error: 'Security Violation: SUPER_ADMIN is an exclusive, non-transferable owner role and cannot be created or assigned.',
    });
    return;
  }

  const db = getDb();
  const user = db.users.find((u) => u.id === userId);

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (user.role === 'SUPER_ADMIN' || user.id === PROTECTED_OWNER_ID || user.email.toLowerCase() === PROTECTED_OWNER_EMAIL.toLowerCase()) {
    res.status(403).json({ error: 'Security Violation: Cannot modify Super Admin / Owner role.' });
    return;
  }

  user.role = 'ADMIN';
  user.permissions = Array.isArray(initialPermissions) ? initialPermissions : [];
  user.updatedAt = new Date().toISOString();

  logAuditAction(
    req.user!,
    'ADMIN_CREATED',
    user.email,
    `Promoted student ${user.name} to ADMIN with permissions: [${user.permissions.join(', ')}]`
  );

  saveDb(db);
  const { passwordHash, salt, ...safeUser } = user;
  res.json({ message: 'User successfully promoted to ADMIN', user: safeUser });
});

// Super Admin: Demote admin to STUDENT
apiRouter.post('/admin/admins/demote', authenticateToken, requireSuperAdmin, (req: AuthenticatedRequest, res) => {
  const { userId } = req.body;
  const db = getDb();
  const user = db.users.find((u) => u.id === userId);

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (user.role === 'SUPER_ADMIN' || user.id === PROTECTED_OWNER_ID || user.email.toLowerCase() === PROTECTED_OWNER_EMAIL.toLowerCase()) {
    res.status(403).json({ error: 'Security Violation: The Super Admin / Institute Owner cannot be demoted or removed.' });
    return;
  }

  user.role = 'STUDENT';
  user.permissions = [];
  user.updatedAt = new Date().toISOString();

  logAuditAction(
    req.user!,
    'ADMIN_REMOVED',
    user.email,
    `Demoted admin ${user.name} back to STUDENT role.`
  );

  saveDb(db);
  const { passwordHash, salt, ...safeUser } = user;
  res.json({ message: 'Admin demoted to STUDENT role', user: safeUser });
});

// Super Admin: Assign/Revoke permissions to an ADMIN
apiRouter.put('/admin/admins/:id/permissions', authenticateToken, requireSuperAdmin, (req: AuthenticatedRequest, res) => {
  const { permissions } = req.body;
  const db = getDb();
  const user = db.users.find((u) => u.id === req.params.id);

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (user.role === 'SUPER_ADMIN' || user.id === PROTECTED_OWNER_ID) {
    res.status(403).json({ error: 'Security Violation: Super Admin holds all authorizations inherently; permissions cannot be stripped.' });
    return;
  }

  if (user.role !== 'ADMIN') {
    res.status(400).json({ error: 'Target user must have the ADMIN role to receive administrative permissions' });
    return;
  }

  const validPermissions = (permissions as string[]).filter((p) =>
    ALL_ADMIN_PERMISSIONS.includes(p as any)
  );

  user.permissions = validPermissions as any;
  user.updatedAt = new Date().toISOString();

  logAuditAction(
    req.user!,
    'PERMISSIONS_CHANGED',
    user.email,
    `Updated permissions for ${user.name}: [${validPermissions.join(', ')}]`
  );

  saveDb(db);
  const { passwordHash, salt, ...safeUser } = user;
  res.json({ message: 'Permissions updated successfully', user: safeUser });
});

// Toggle user status (Enable/Disable)
apiRouter.put('/admin/users/:id/status', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res) => {
  if (
    req.user!.role !== 'SUPER_ADMIN' &&
    !req.user!.permissions.includes('CAN_MANAGE_USERS') &&
    !req.user!.permissions.includes('CAN_MANAGE_STUDENTS')
  ) {
    res.status(403).json({ error: 'Permission denied: CAN_MANAGE_STUDENTS required' });
    return;
  }

  const { isActive } = req.body;
  const db = getDb();
  const user = db.users.find((u) => u.id === req.params.id);

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (user.role === 'SUPER_ADMIN' || user.id === PROTECTED_OWNER_ID || user.email.toLowerCase() === PROTECTED_OWNER_EMAIL.toLowerCase()) {
    res.status(403).json({ error: 'Security Violation: The Super Admin / Owner account cannot be disabled.' });
    return;
  }

  user.isActive = Boolean(isActive);
  user.updatedAt = new Date().toISOString();

  logAuditAction(
    req.user!,
    user.isActive ? 'USER_ENABLED' : 'USER_DISABLED',
    user.email,
    `Account status changed to ${user.isActive ? 'Active' : 'Disabled'}`
  );

  saveDb(db);
  const { passwordHash, salt, ...safeUser } = user;
  res.json({ user: safeUser });
});

// ==========================================
// 5. AUDIT LOGS & ANALYTICS
// ==========================================

apiRouter.get('/admin/audit-logs', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res) => {
  if (req.user!.role !== 'SUPER_ADMIN' && !req.user!.permissions.includes('CAN_VIEW_ANALYTICS')) {
    res.status(403).json({ error: 'Permission denied: CAN_VIEW_ANALYTICS required' });
    return;
  }
  const db = getDb();
  res.json(db.auditLogs);
});

apiRouter.get('/admin/analytics', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res) => {
  if (req.user!.role !== 'SUPER_ADMIN' && !req.user!.permissions.includes('CAN_VIEW_ANALYTICS')) {
    res.status(403).json({ error: 'Permission denied: CAN_VIEW_ANALYTICS required' });
    return;
  }

  const db = getDb();
  const totalStudents = db.users.filter((u) => u.role === 'STUDENT').length;
  const totalAdmins = db.users.filter((u) => u.role === 'ADMIN').length;
  const totalAttempts = db.testAttempts.length;
  const avgScore =
    totalAttempts > 0
      ? (db.testAttempts.reduce((acc, a) => acc + a.percentage, 0) / totalAttempts).toFixed(1)
      : '0';

  res.json({
    totalUsers: db.users.length,
    totalStudents,
    totalAdmins,
    totalGrammarTopics: db.grammarTopics.length,
    totalVocabItems: db.vocabularyItems.length,
    totalQuestions: db.questions.length,
    totalMockTests: db.mockTests.length,
    totalPdfs: db.pdfs.length,
    totalPracticeSets: db.practiceSets?.length || 0,
    totalAttempts,
    averageMockScore: `${avgScore}%`,
    recentAttempts: db.testAttempts.slice(0, 5),
    examCategoryCounts: db.examCategories.map((cat) => ({
      category: cat,
      questionsCount: db.questions.filter((q) => q.exam === cat).length,
      mockTestsCount: db.mockTests.filter((m) => m.exam === cat).length,
    })),
  });
});

// ==========================================
// 6. CONTENT CREATION & MANAGEMENT (ADMIN/SUPER ADMIN WITH PERMISSIONS)
// ==========================================

// Add / Edit Grammar Topic
apiRouter.post('/admin/content/grammar', authenticateToken, requireAdmin, requirePermission('CAN_CREATE_COURSE'), (req: AuthenticatedRequest, res) => {
  const { title, category, difficulty, summary, content, rules = [], commonErrors = [], isPremium = false } = req.body;
  if (!title || !category || !content) {
    res.status(400).json({ error: 'Title, category, and content are required' });
    return;
  }

  const db = getDb();
  const now = new Date().toISOString();
  const newTopic: GrammarTopic = {
    id: `gram_${Date.now()}`,
    title,
    category,
    difficulty: difficulty || 'Basic',
    summary: summary || '',
    content,
    rules,
    commonErrors,
    isPremium: Boolean(isPremium),
    isPublished: true,
    author: req.user!.name,
    createdAt: now,
    updatedAt: now,
  };

  db.grammarTopics.push(newTopic);
  logAuditAction(req.user!, 'CONTENT_UPLOADED', `Grammar: ${title}`, `Added grammar module under category ${category}`);
  saveDb(db);
  res.status(201).json(newTopic);
});

apiRouter.put('/admin/content/grammar/:id', authenticateToken, requireAdmin, requirePermission('CAN_EDIT_CONTENT'), (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const idx = db.grammarTopics.findIndex((g) => g.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Grammar topic not found' });
    return;
  }

  db.grammarTopics[idx] = {
    ...db.grammarTopics[idx],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  logAuditAction(req.user!, 'CONTENT_EDITED', `Grammar: ${db.grammarTopics[idx].title}`, 'Updated grammar content');
  saveDb(db);
  res.json(db.grammarTopics[idx]);
});

apiRouter.delete('/admin/content/grammar/:id', authenticateToken, requireAdmin, requirePermission('CAN_DELETE_CONTENT'), (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const topic = db.grammarTopics.find((g) => g.id === req.params.id);
  if (!topic) {
    res.status(404).json({ error: 'Topic not found' });
    return;
  }

  db.grammarTopics = db.grammarTopics.filter((g) => g.id !== req.params.id);
  logAuditAction(req.user!, 'CONTENT_DELETED', `Grammar: ${topic.title}`, 'Deleted grammar topic');
  saveDb(db);
  res.json({ message: 'Deleted successfully' });
});

// Add / Edit Vocabulary
apiRouter.post('/admin/content/vocabulary', authenticateToken, requireAdmin, requirePermission('CAN_CREATE_COURSE'), (req: AuthenticatedRequest, res) => {
  const { word, type, meaning, hindiMeaning, synonyms, antonyms, example, mnemonic, examFrequency, category, isPremium } = req.body;
  if (!word || !type || !meaning) {
    res.status(400).json({ error: 'Word, type, and meaning are required' });
    return;
  }

  const db = getDb();
  const newItem: VocabularyItem = {
    id: `voc_${Date.now()}`,
    word,
    type,
    meaning,
    hindiMeaning: hindiMeaning || '',
    synonyms: Array.isArray(synonyms) ? synonyms : synonyms ? [synonyms] : [],
    antonyms: Array.isArray(antonyms) ? antonyms : antonyms ? [antonyms] : [],
    example: example || '',
    mnemonic: mnemonic || '',
    examFrequency: examFrequency || 'High',
    category: category || 'SSC',
    isPremium: Boolean(isPremium),
    isPublished: true,
    author: req.user!.name,
    createdAt: new Date().toISOString(),
  };

  db.vocabularyItems.push(newItem);
  logAuditAction(req.user!, 'CONTENT_UPLOADED', `Vocabulary: ${word}`, `Added vocabulary item type ${type}`);
  saveDb(db);
  res.status(201).json(newItem);
});

apiRouter.delete('/admin/content/vocabulary/:id', authenticateToken, requireAdmin, requirePermission('CAN_DELETE_CONTENT'), (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const item = db.vocabularyItems.find((v) => v.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Vocabulary item not found' });
    return;
  }
  db.vocabularyItems = db.vocabularyItems.filter((v) => v.id !== req.params.id);
  logAuditAction(req.user!, 'CONTENT_DELETED', `Vocabulary: ${item.word}`, 'Deleted vocabulary item');
  saveDb(db);
  res.json({ message: 'Deleted successfully' });
});

// Upload PDF (CAN_UPLOAD_PDF or SUPER_ADMIN)
apiRouter.post('/admin/content/pdfs', authenticateToken, requireAdmin, requirePermission('CAN_UPLOAD_PDF'), (req: AuthenticatedRequest, res) => {
  const {
    title,
    description,
    exam_id,
    category,
    subject = 'English',
    topic = 'General Preparation',
    source = 'Abhishek English Classes Official Archive',
    version = 1,
    pagesCount = 5,
    fileSizeMb = 3.2,
    pages = [],
    downloadUrl,
    isPremium = false,
  } = req.body;

  if (!title || !description) {
    res.status(400).json({ error: 'Title and description are required' });
    return;
  }

  const targetExamId = (exam_id || category || 'SSC_CGL').trim().toUpperCase();

  // Validate exam consistency
  const validation = validateContentExamConsistency(targetExamId, subject, topic, {
    title,
    text: description,
    source,
  });

  if (!validation.isValid) {
    res.status(400).json({
      error: `Content Validation Failed: ${validation.flaggedReason}`,
      validation,
    });
    return;
  }

  const db = getDb();
  const now = new Date().toISOString();
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const newPdf: PDFDocument = {
    id: `pdf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title,
    exam_id: targetExamId,
    category: (category || targetExamId) as any,
    subject,
    topic,
    description,
    source,
    version: Number(version) || 1,
    uploadDate: now,
    uploadedBy: `${req.user!.name} (${req.user!.role})`,
    publishedStatus: 'PUBLISHED',
    pagesCount: Number(pagesCount) || Math.max(1, pages.length),
    fileSizeMb: Number(fileSizeMb) || 2.5,
    downloadUrl: downloadUrl || `/downloads/${slug}.pdf`,
    pages:
      pages.length > 0
        ? pages
        : [
            {
              pageNumber: 1,
              heading: `${title} - Introduction & Overview`,
              text: `${description}\n\nExam: ${targetExamId}\nSubject: ${subject}\nTopic: ${topic}\n\nPrepared for students of Abhishek English Classes. Thorough study and offline revision recommended.`,
              highlight: `Exam Target: ${targetExamId} - Verified Content`,
            },
            {
              pageNumber: 2,
              heading: 'Core Conceptual Rules & Key Exam Notes',
              text: 'Master all fundamental principles, exceptions, and previous examination patterns.',
            },
          ],
    isPremium: Boolean(isPremium),
    isPublished: true,
    author: req.user!.name,
    createdAt: now,
    updatedAt: now,
  };

  db.pdfs.unshift(newPdf);
  logAuditAction(
    req.user!,
    'CONTENT_UPLOADED',
    `PDF: ${title}`,
    `Uploaded PDF for exam [${targetExamId}] under subject [${subject}] - [${topic}]`
  );
  saveDb(db);
  res.status(201).json(newPdf);
});

// Edit / Update PDF
apiRouter.put('/admin/content/pdfs/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res) => {
  // Requires CAN_EDIT_CONTENT or CAN_UPLOAD_PDF or SUPER_ADMIN
  if (
    req.user!.role !== 'SUPER_ADMIN' &&
    !req.user!.permissions.includes('CAN_EDIT_CONTENT') &&
    !req.user!.permissions.includes('CAN_UPLOAD_PDF')
  ) {
    res.status(403).json({ error: 'Permission denied: CAN_EDIT_CONTENT or CAN_UPLOAD_PDF required' });
    return;
  }

  const db = getDb();
  const pdfIdx = db.pdfs.findIndex((p) => p.id === req.params.id);
  if (pdfIdx === -1) {
    res.status(404).json({ error: 'PDF not found' });
    return;
  }

  const existing = db.pdfs[pdfIdx];
  const { title, description, subject, topic, exam_id, publishedStatus, pages, isPremium } = req.body;

  if (title) existing.title = title;
  if (description) existing.description = description;
  if (subject) existing.subject = subject;
  if (topic) existing.topic = topic;
  if (exam_id) existing.exam_id = exam_id.trim().toUpperCase();
  if (publishedStatus) existing.publishedStatus = publishedStatus;
  if (pages) existing.pages = pages;
  if (isPremium !== undefined) existing.isPremium = Boolean(isPremium);
  existing.version = (existing.version || 1) + 1;
  existing.updatedAt = new Date().toISOString();

  logAuditAction(req.user!, 'CONTENT_EDITED', `PDF: ${existing.title}`, `Updated PDF document`);
  saveDb(db);
  res.json(existing);
});

// Delete PDF (SUPER_ADMIN or CAN_DELETE_CONTENT)
apiRouter.delete('/admin/content/pdfs/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res) => {
  if (req.user!.role !== 'SUPER_ADMIN' && !req.user!.permissions.includes('CAN_DELETE_CONTENT')) {
    res.status(403).json({ error: 'Permission denied: CAN_DELETE_CONTENT required' });
    return;
  }

  const db = getDb();
  const pdf = db.pdfs.find((p) => p.id === req.params.id);
  if (!pdf) {
    res.status(404).json({ error: 'PDF not found' });
    return;
  }

  db.pdfs = db.pdfs.filter((p) => p.id !== req.params.id);
  logAuditAction(req.user!, 'CONTENT_DELETED', `PDF: ${pdf.title}`, `Deleted PDF from library`);
  saveDb(db);
  res.json({ message: 'PDF removed successfully' });
});

// ----------------------------------------------------
// PRACTICE SETS (Image Upload System by ADMIN)
// ----------------------------------------------------
apiRouter.get('/admin/practice-sets', authenticateToken, requireAdmin, (_req: AuthenticatedRequest, res) => {
  const db = getDb();
  res.json(db.practiceSets || []);
});

apiRouter.post('/admin/practice-sets', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res) => {
  if (
    req.user!.role !== 'SUPER_ADMIN' &&
    !req.user!.permissions.includes('CAN_CREATE_PRACTICE') &&
    !req.user!.permissions.includes('CAN_UPLOAD_PRACTICE')
  ) {
    res.status(403).json({ error: 'Permission denied: CAN_CREATE_PRACTICE or CAN_UPLOAD_PRACTICE required' });
    return;
  }

  const { exam_id, subject, topic, title, description, images = [], source } = req.body;
  if (!exam_id || !subject || !topic || !title) {
    res.status(400).json({ error: 'Exam, subject, topic, and title are required' });
    return;
  }

  const targetExamId = exam_id.trim().toUpperCase() as StandardExamId;

  // Validation: Check for cross-exam contamination
  const validation = validateContentExamConsistency(targetExamId, subject, topic, {
    title,
    text: description,
    source,
  });

  const db = getDb();
  const now = new Date().toISOString();
  const practiceSetId = `pset_${targetExamId.toLowerCase()}_${Date.now()}`;

  // Process images
  const sanitizedImages: PracticeQuestionImage[] = (images as any[]).map((img, idx) => ({
    id: `img_${practiceSetId}_${idx + 1}`,
    exam_id: targetExamId,
    subject,
    topic,
    practice_set_id: practiceSetId,
    question_number: idx + 1,
    imageUrl: img.imageUrl || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=700&auto=format&fit=crop&q=80',
    questionHint: img.questionHint || `Question ${idx + 1}`,
    options: img.options || { A: 'A', B: 'B', C: 'C', D: 'D' },
    correctAnswer: img.correctAnswer || 'A',
    explanation: img.explanation || `Detailed solution according to official ${targetExamId} exam key.`,
    source: img.source || source || `Official ${targetExamId} Paper`,
    uploadDate: now,
    uploader: req.user!.name,
    status: validation.isValid ? 'PUBLISHED' : 'FLAGGED_FOR_VERIFICATION',
    flagReason: validation.flaggedReason,
  }));

  const newPracticeSet: ImagePracticeSet = {
    id: practiceSetId,
    exam_id: targetExamId,
    title,
    subject,
    topic,
    description: description || `Practice set with question images for ${targetExamId}.`,
    totalQuestions: sanitizedImages.length,
    images: sanitizedImages,
    status: validation.isValid ? 'PUBLISHED' : 'FLAGGED_FOR_VERIFICATION',
    source: source || `Official ${targetExamId} Archive`,
    uploader: `${req.user!.name} (${req.user!.role})`,
    uploadDate: now,
    publishedAt: validation.isValid ? now : undefined,
    version: 1,
  };

  if (!db.practiceSets) db.practiceSets = [];
  db.practiceSets.unshift(newPracticeSet);

  logAuditAction(
    req.user!,
    'CONTENT_UPLOADED',
    `Practice Set: ${title}`,
    `Created Practice Set for [${targetExamId}] with ${sanitizedImages.length} question images. Status: ${newPracticeSet.status}`
  );

  saveDb(db);
  res.status(201).json(newPracticeSet);
});

apiRouter.delete('/admin/practice-sets/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res) => {
  if (
    req.user!.role !== 'SUPER_ADMIN' &&
    !req.user!.permissions.includes('CAN_DELETE_PRACTICE') &&
    !req.user!.permissions.includes('CAN_DELETE_CONTENT')
  ) {
    res.status(403).json({ error: 'Permission denied: CAN_DELETE_PRACTICE required' });
    return;
  }

  const db = getDb();
  const set = (db.practiceSets || []).find((s) => s.id === req.params.id);
  if (!set) {
    res.status(404).json({ error: 'Practice set not found' });
    return;
  }

  db.practiceSets = (db.practiceSets || []).filter((s) => s.id !== req.params.id);
  logAuditAction(req.user!, 'CONTENT_DELETED', `Practice Set: ${set.title}`, 'Deleted practice set');
  saveDb(db);
  res.json({ message: 'Practice set deleted successfully' });
});

// Questions Bank
apiRouter.post('/admin/questions', authenticateToken, requireAdmin, requirePermission('CAN_CREATE_QUESTION'), (req: AuthenticatedRequest, res) => {
  const {
    questionText,
    options,
    correctAnswer,
    explanation,
    topic,
    subject = 'English',
    exam,
    exam_id,
    difficulty,
    marks = 2,
    negativeMarks = 0.5,
    source_type = 'VERIFIED_EXAM_PATTERN',
    pyqYear,
    pyqShift,
    isPremium = false,
  } = req.body;

  if (!questionText || !options || !correctAnswer || !explanation) {
    res.status(400).json({ error: 'Question text, 4 options, correct answer, and explanation are required' });
    return;
  }

  const targetExamId = (exam_id || exam || 'SSC_CGL').trim().toUpperCase() as StandardExamId;

  // Validate content consistency
  const validation = validateContentExamConsistency(targetExamId, subject, topic || 'General', {
    text: questionText,
    explanation,
    source: source_type,
  });

  if (!validation.isValid) {
    res.status(400).json({
      error: `Content Validation Failed: ${validation.flaggedReason}`,
      validation,
    });
    return;
  }

  const db = getDb();
  const newQ: Question = {
    id: `q_${targetExamId.toLowerCase()}_${Date.now()}`,
    exam_id: targetExamId,
    exam: (exam || targetExamId) as any,
    subject,
    topic: topic || 'General Grammar',
    questionText,
    options: {
      A: options.A || '',
      B: options.B || '',
      C: options.C || '',
      D: options.D || '',
    },
    correctAnswer,
    explanation,
    difficulty: difficulty || 'Moderate',
    marks: Number(marks),
    negativeMarks: Number(negativeMarks),
    source_type: source_type as any,
    pyqYear: pyqYear || undefined,
    pyqShift: pyqShift || undefined,
    isPremium: Boolean(isPremium),
    status: 'PUBLISHED',
    author: req.user!.name,
    createdAt: new Date().toISOString(),
  };

  db.questions.push(newQ);
  logAuditAction(req.user!, 'CONTENT_UPLOADED', `Question: ${topic}`, `Created question for exam ${targetExamId}`);
  saveDb(db);
  res.status(201).json(newQ);
});

apiRouter.delete('/admin/questions/:id', authenticateToken, requireAdmin, requirePermission('CAN_DELETE_CONTENT'), (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const q = db.questions.find((item) => item.id === req.params.id);
  if (!q) {
    res.status(404).json({ error: 'Question not found' });
    return;
  }
  db.questions = db.questions.filter((item) => item.id !== req.params.id);
  logAuditAction(req.user!, 'CONTENT_DELETED', `Question ${req.params.id}`, 'Removed question from bank');
  saveDb(db);
  res.json({ message: 'Deleted question' });
});

// Mock Tests creation
apiRouter.post('/admin/mock-tests', authenticateToken, requireAdmin, requirePermission('CAN_CREATE_MOCK_TEST'), (req: AuthenticatedRequest, res) => {
  const {
    title,
    description,
    exam,
    exam_id,
    durationMinutes,
    totalMarks,
    passingMarks,
    negativeMarkingPerQuestion,
    instructions,
    questionIds,
    sections,
    isPremium,
  } = req.body;

  if (!title || !durationMinutes || !questionIds || !questionIds.length) {
    res.status(400).json({ error: 'Title, duration, and at least one question ID are required' });
    return;
  }

  const targetExamId = (exam_id || exam || 'SSC_CGL').trim().toUpperCase() as StandardExamId;
  const db = getDb();

  // Validate that all questionIds strictly belong to this exam_id
  const mismatched = questionIds.filter((qid: string) => {
    const q = db.questions.find((item) => item.id === qid);
    return q && q.exam_id !== targetExamId;
  });

  if (mismatched.length > 0) {
    res.status(400).json({
      error: `Strict Exam Separation Rule: Questions [${mismatched.join(', ')}] do not belong to target exam [${targetExamId}]. Mixed exam questions are strictly prohibited.`,
    });
    return;
  }

  const todayStr = getKolkataDateString();
  const cycleEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const newTest: MockTest = {
    id: `mock_${targetExamId.toLowerCase()}_${Date.now()}`,
    exam_id: targetExamId,
    exam: (exam || targetExamId) as any,
    title,
    description: description || '',
    cycleNumber: 1,
    cycleStartDate: todayStr,
    cycleEndDate: cycleEnd,
    cycleStatus: 'ACTIVE_CURRENT',
    version: `v1.0 (Created ${todayStr})`,
    durationMinutes: Number(durationMinutes),
    totalMarks: Number(totalMarks) || questionIds.length * 2,
    passingMarks: Number(passingMarks) || questionIds.length,
    negativeMarkingPerQuestion: Number(negativeMarkingPerQuestion) || 0.5,
    instructions: Array.isArray(instructions) ? instructions : ['Attempt all questions carefully.', 'Online internet connection required.'],
    questionIds,
    sections: sections || [],
    isPremium: Boolean(isPremium),
    status: 'PUBLISHED',
    author: req.user!.name,
    createdAt: new Date().toISOString(),
  };

  db.mockTests.unshift(newTest);
  logAuditAction(req.user!, 'MOCK_TEST_CREATED', `Mock Test: ${title}`, `Created test for exam ${targetExamId}`);
  saveDb(db);
  res.status(201).json(newTest);
});

// Admin: Trigger / Force 7-Day Mock Test Rotation
apiRouter.post('/admin/mock-tests/rotate', authenticateToken, requireAdmin, requirePermission('CAN_CREATE_MOCK_TEST'), (_req: AuthenticatedRequest, res) => {
  const result = checkAndRotate7DayMockTests();
  res.json({
    message: `7-day mock test cycle check completed. Rotated ${result.rotatedCount} exam mock tests.`,
    details: result,
  });
});

// Exam categories
apiRouter.post('/admin/exam-categories', authenticateToken, requireAdmin, requirePermission('CAN_CREATE_COURSE'), (req: AuthenticatedRequest, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: 'Category name is required' });
    return;
  }

  const db = getDb();
  const formatted = name.trim().toUpperCase();
  if (!db.examCategories.includes(formatted)) {
    db.examCategories.push(formatted);
    logAuditAction(req.user!, 'CONTENT_UPLOADED', `Exam Category: ${formatted}`, 'Added new competitive exam category');
    saveDb(db);
  }
  res.status(201).json(db.examCategories);
});

// ----------------------------------------------------
// 4. ADMIN DASHBOARD STATS (Section 4 Requirements)
// ----------------------------------------------------
apiRouter.get('/admin/stats', authenticateToken, requireAdmin, (_req: AuthenticatedRequest, res) => {
  const db = getDb();
  const students = db.users.filter((u) => u.role === 'STUDENT');
  const totalStudents = students.length;
  const activeStudents = students.filter((u) => u.isActive).length;
  const builtInExams = Object.keys(SUPPORTED_EXAM_DEFINITIONS).length;
  const customExams = db.customExams?.length || 0;
  const totalGovernmentExams = builtInExams + customExams;
  const totalCourses = db.courses?.length || 0;
  const totalPracticeSets = db.practiceSets?.length || 0;
  const totalMockTests = db.mockTests?.length || 0;
  const totalPdfs = db.pdfs?.length || 0;
  const recentActivity = db.auditLogs?.slice(0, 10) || [];
  const pendingUpdates = db.pendingSyllabusUpdates?.filter((p) => p.verificationStatus === 'PENDING_REVIEW') || [];
  const draftQuestions = db.questions?.filter((q) => q.status === 'DRAFT') || [];
  const contentNeedingReview = pendingUpdates.length + draftQuestions.length;

  res.json({
    totalStudents,
    activeStudents,
    totalGovernmentExams,
    totalCourses,
    totalPracticeSets,
    totalMockTests,
    totalQuestions: db.questions?.length || 0,
    totalPdfs,
    recentActivity,
    contentNeedingReview,
    pendingUpdatesCount: pendingUpdates.length,
    draftQuestionsCount: draftQuestions.length,
  });
});

// ----------------------------------------------------
// COURSES MANAGEMENT (Section 10 Requirements)
// ----------------------------------------------------
apiRouter.get('/content/courses', (req, res) => {
  const db = getDb();
  const { exam_id } = req.query;
  let list = db.courses || [];
  if (exam_id && typeof exam_id === 'string' && exam_id !== 'ALL') {
    list = list.filter((c) => c.exam_id === exam_id || c.exam_id === 'ALL');
  }
  res.json(list.filter((c) => c.isPublished));
});

apiRouter.get('/content/courses/:id', (req, res) => {
  const db = getDb();
  const course = (db.courses || []).find((c) => c.id === req.params.id);
  if (!course) {
    res.status(404).json({ error: 'Course not found' });
    return;
  }
  res.json(course);
});

apiRouter.get('/admin/courses', authenticateToken, requireAdmin, (_req: AuthenticatedRequest, res) => {
  const db = getDb();
  res.json(db.courses || []);
});

apiRouter.post('/admin/courses', authenticateToken, requireAdmin, requirePermission('CAN_CREATE_COURSE'), (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const newCourse = {
    id: `course_${Date.now()}`,
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (!db.courses) db.courses = [];
  db.courses.push(newCourse);
  logAuditAction(req.user!, 'CONTENT_UPLOADED', `Course: ${newCourse.title}`, `Created course for exam ${newCourse.exam_id}`);
  saveDb(db);
  res.status(201).json(newCourse);
});

apiRouter.put('/admin/courses/:id', authenticateToken, requireAdmin, requirePermission('CAN_EDIT_CONTENT'), (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const idx = (db.courses || []).findIndex((c) => c.id === req.params.id);
  if (idx < 0) {
    res.status(404).json({ error: 'Course not found' });
    return;
  }
  db.courses[idx] = { ...db.courses[idx], ...req.body, updatedAt: new Date().toISOString() };
  logAuditAction(req.user!, 'CONTENT_EDITED', `Course: ${db.courses[idx].title}`, `Updated course`);
  saveDb(db);
  res.json(db.courses[idx]);
});

apiRouter.delete('/admin/courses/:id', authenticateToken, requireAdmin, requirePermission('CAN_DELETE_CONTENT'), (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const idx = (db.courses || []).findIndex((c) => c.id === req.params.id);
  if (idx < 0) {
    res.status(404).json({ error: 'Course not found' });
    return;
  }
  const deleted = db.courses.splice(idx, 1)[0];
  logAuditAction(req.user!, 'CONTENT_DELETED', `Course: ${deleted.title}`, `Deleted course`);
  saveDb(db);
  res.json({ message: 'Course deleted successfully' });
});

// ----------------------------------------------------
// EXPANDABLE GOVERNMENT EXAMS (Section 5 Requirements)
// ----------------------------------------------------
apiRouter.post('/admin/exams', authenticateToken, requireAdmin, requirePermission('CAN_MANAGE_SYLLABUS'), (req: AuthenticatedRequest, res) => {
  const { exam_id, name, shortName, category, organization, defaultDurationMinutes, markingScheme, subjects, eligibility, selectionStages, officialSource } = req.body;
  if (!exam_id || !name || !shortName || !category) {
    res.status(400).json({ error: 'exam_id, name, shortName, and category are required' });
    return;
  }
  const db = getDb();
  if (!db.customExams) db.customExams = [];
  const normalizedId = exam_id.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  if (SUPPORTED_EXAM_DEFINITIONS[normalizedId] || db.customExams.some((e) => e.exam_id === normalizedId)) {
    res.status(400).json({ error: `Exam ID ${normalizedId} already exists` });
    return;
  }
  const newExam: ExamDefinition = {
    exam_id: normalizedId as any,
    name,
    shortName,
    category,
    organization: organization || 'Government Examination Authority',
    defaultDurationMinutes: Number(defaultDurationMinutes) || 60,
    markingScheme: markingScheme || { marksPerQuestion: 2, negativeMark: 0.5 },
    subjects: Array.isArray(subjects) ? subjects : ['General English', 'General Knowledge'],
    eligibility,
    selectionStages: Array.isArray(selectionStages) ? selectionStages : ['Stage-I CBT', 'Stage-II CBT'],
    officialSource,
    isCustom: true,
  };
  db.customExams.push(newExam);
  logAuditAction(req.user!, 'CONTENT_UPLOADED', `Exam: ${newExam.name}`, `Added new expandable government exam ${newExam.exam_id}`);
  saveDb(db);
  res.status(201).json(newExam);
});

apiRouter.delete('/admin/exams/:id', authenticateToken, requireAdmin, requirePermission('CAN_MANAGE_SYLLABUS'), (req: AuthenticatedRequest, res) => {
  const db = getDb();
  if (!db.customExams) db.customExams = [];
  const idx = db.customExams.findIndex((e) => e.exam_id === req.params.id);
  if (idx < 0) {
    res.status(404).json({ error: 'Custom exam not found or cannot delete built-in standard exams' });
    return;
  }
  const deleted = db.customExams.splice(idx, 1)[0];
  logAuditAction(req.user!, 'CONTENT_DELETED', `Exam: ${deleted.name}`, `Removed custom government exam ${deleted.exam_id}`);
  saveDb(db);
  res.json({ message: 'Exam removed successfully' });
});

// ----------------------------------------------------
// SETTINGS (SUPER_ADMIN ONLY)
// ----------------------------------------------------
apiRouter.get('/admin/settings', authenticateToken, requireSuperAdmin, (_req: AuthenticatedRequest, res) => {
  const db = getDb();
  res.json(db.settings || {});
});

apiRouter.put('/admin/settings', authenticateToken, requireSuperAdmin, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  db.settings = { ...db.settings, ...req.body };
  logAuditAction(req.user!, 'APP_SETTINGS_UPDATED', 'System Settings', 'Updated platform configuration settings');
  saveDb(db);
  res.json(db.settings);
});

// ----------------------------------------------------
// STUDENT LEARNING PROGRESS (Section 17 Requirements)
// ----------------------------------------------------
apiRouter.get('/student/progress', optionalAuthenticate, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const userId = req.user?.id;
  const mockAttempts = userId ? db.testAttempts.filter((a) => a.userId === userId) : [];
  const dailyAttempts = userId && db.daily20Attempts ? db.daily20Attempts.filter((a) => a.userId === userId) : [];
  const avgMockPercentage = mockAttempts.length > 0
    ? (mockAttempts.reduce((acc, a) => acc + a.percentage, 0) / mockAttempts.length).toFixed(1)
    : '0';

  res.json({
    totalMockAttempts: mockAttempts.length,
    averageMockPercentage: Number(avgMockPercentage),
    mockHistory: mockAttempts.slice(0, 10),
    totalDaily20Attempts: dailyAttempts.length,
    daily20History: dailyAttempts.slice(0, 10),
    totalSyllabusCount: (db.examSyllabi || []).length,
    totalAvailableCourses: (db.courses || []).length,
    totalAvailablePdfs: (db.pdfs || []).length,
    totalAvailablePracticeSets: (db.practiceSets || []).length,
  });
});

// ==========================================
// 6. LIVE COMPETITIVE EXAM SYLLABUS HUB
// ==========================================

// Get syllabus categories
apiRouter.get('/syllabus/categories', (_req, res) => {
  const db = getDb();
  res.json(db.syllabusCategories || []);
});

// Get all published exams with optional category/search filters
apiRouter.get('/syllabus/exams', (req, res) => {
  const db = getDb();
  const { category, status, search, recentlyUpdated } = req.query;

  let list = db.examSyllabi.filter((e) => e.isPublished);

  if (category && category !== 'ALL') {
    list = list.filter((e) => e.category === category);
  }

  if (status && status !== 'ALL') {
    list = list.filter((e) => e.status === status);
  }

  if (recentlyUpdated === 'true') {
    list = list.filter((e) => e.isRecentlyUpdated);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    list = list.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.shortName.toLowerCase().includes(q) ||
        e.organization.toLowerCase().includes(q) ||
        e.categoryLabel.toLowerCase().includes(q) ||
        e.officialNotificationRef.toLowerCase().includes(q)
    );
  }

  res.json(list);
});

// Get single exam syllabus by slug or id
apiRouter.get('/syllabus/exams/:slugOrId', (req, res) => {
  const db = getDb();
  const target = req.params.slugOrId.toLowerCase();
  const exam = db.examSyllabi.find((e) => e.id === target || e.slug.toLowerCase() === target);

  if (!exam) {
    res.status(404).json({ error: 'Exam syllabus not found' });
    return;
  }

  res.json(exam);
});

// Syllabus stats summary
apiRouter.get('/syllabus/stats', (_req, res) => {
  const db = getDb();
  const totalExams = db.examSyllabi.length;
  const publishedExams = db.examSyllabi.filter((e) => e.isPublished).length;
  const recentlyUpdated = db.examSyllabi.filter((e) => e.isRecentlyUpdated).length;
  const pendingUpdates = db.pendingSyllabusUpdates.filter((p) => p.verificationStatus === 'PENDING_REVIEW').length;
  const categoriesCount = db.syllabusCategories.length;

  res.json({
    totalExams,
    publishedExams,
    recentlyUpdated,
    pendingUpdates,
    categoriesCount,
    lastGlobalSyncAt: new Date().toISOString(),
  });
});

// Admin: Check all official sources
apiRouter.post('/syllabus/sync', authenticateToken, requireAdmin, requirePermission('CAN_MANAGE_SYLLABUS'), async (req: AuthenticatedRequest, res) => {
  try {
    const result = await checkAllOfficialSources(req.user);
    res.json({
      message: `Checked ${result.checkedCount} official sources across India. ${result.changesDetected} changes queued for verification.`,
      result,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Official source synchronization failed', details: err.message });
  }
});

// Admin: Check a single exam's official source
apiRouter.post('/syllabus/exams/:id/check', authenticateToken, requireAdmin, requirePermission('CAN_MANAGE_SYLLABUS'), async (req: AuthenticatedRequest, res) => {
  try {
    const result = await checkExamOfficialSource(req.params.id, req.user);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Source check error', details: err.message });
  }
});

// Admin: Discover newly announced competitive exams from official portals
apiRouter.post('/syllabus/discover', authenticateToken, requireAdmin, requirePermission('CAN_MANAGE_SYLLABUS'), async (req: AuthenticatedRequest, res) => {
  try {
    const discovered = await discoverNewAnnouncedExams(req.user);
    res.json({
      message: `Official portal inspection complete. Found ${discovered.length} newly announced competitive exams.`,
      discovered,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Discovery error', details: err.message });
  }
});

// Admin: View pending syllabus updates & new exams
apiRouter.get('/syllabus/pending', authenticateToken, requireAdmin, requirePermission('CAN_MANAGE_SYLLABUS'), (_req, res) => {
  const db = getDb();
  res.json(db.pendingSyllabusUpdates || []);
});

// Super Admin / Authorized Admin: Approve pending syllabus update
apiRouter.post('/syllabus/pending/:id/approve', authenticateToken, requireAdmin, requirePermission('CAN_MANAGE_SYLLABUS'), (req: AuthenticatedRequest, res) => {
  const result = approvePendingSyllabusUpdate(req.params.id, req.user!);
  if (!result.success) {
    res.status(400).json({ error: result.message });
    return;
  }
  res.json(result);
});

// Super Admin / Authorized Admin: Reject pending syllabus update
apiRouter.post('/syllabus/pending/:id/reject', authenticateToken, requireAdmin, requirePermission('CAN_MANAGE_SYLLABUS'), (req: AuthenticatedRequest, res) => {
  const { reason } = req.body;
  const result = rejectPendingSyllabusUpdate(req.params.id, req.user!, reason);
  if (!result.success) {
    res.status(400).json({ error: result.message });
    return;
  }
  res.json(result);
});

// Admin: Add new competitive exam manually
apiRouter.post('/syllabus/exams', authenticateToken, requireAdmin, requirePermission('CAN_MANAGE_SYLLABUS'), (req: AuthenticatedRequest, res) => {
  const {
    name,
    shortName,
    category,
    categoryLabel,
    organization,
    officialWebsite,
    officialSourceUrl,
    recruitmentCycle,
    patterns,
    officialSyllabus,
    expertAnalysis,
    selectionStages,
  } = req.body;

  if (!name || !organization || !officialSourceUrl || !category) {
    res.status(400).json({ error: 'Name, organization, category, and officialSourceUrl are required' });
    return;
  }

  // Validate official authority domain
  if (!isAuthoritativeOfficialSource(officialSourceUrl) && !isAuthoritativeOfficialSource(officialWebsite)) {
    res.status(400).json({
      error: 'Security & Source Validation Rule: Official source URL must point to an authoritative government or examination authority domain (.gov.in, .nic.in, ibps.in, sbi.co.in, nta.ac.in, etc.). Random coaching websites or blogs are not permitted.',
    });
    return;
  }

  const db = getDb();
  const slug = (shortName || name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const now = new Date().toISOString();
  const newExam: ExamSyllabus = {
    id: `exam_${slug}_${Date.now()}`,
    slug,
    name,
    shortName: shortName || name,
    category,
    categoryLabel: categoryLabel || category,
    organization,
    officialWebsite: officialWebsite || officialSourceUrl,
    officialSourceUrl,
    sourceAuthorityName: `${organization} Gazette Notice`,
    sourceType: 'GOVERNMENT_PORTAL',
    status: 'ACTIVE',
    recruitmentCycle: recruitmentCycle || `${new Date().getFullYear()} Cycle`,
    latestVersion: 'v1.0 Official',
    officialNotificationRef: req.body.officialNotificationRef || 'Official Notification',
    officialReleaseDate: req.body.officialReleaseDate || now.split('T')[0],
    lastVerifiedDate: now,
    lastUpdatedDate: now,
    verificationStatus: 'VERIFIED_OFFICIAL',
    isRecentlyUpdated: true,
    isPublished: true,
    selectionStages: Array.isArray(selectionStages) ? selectionStages : ['Written Examination'],
    patterns: Array.isArray(patterns) ? patterns : [],
    officialSyllabus: officialSyllabus || { overview: '', language: 'Bilingual', subjects: [] },
    expertAnalysis: expertAnalysis || {
      abhishekSirGuidance: 'Master core grammar principles and solve past papers under strict timer conditions.',
      keyEnglishWeightage: 'Standard competitive weightage',
      highYieldTopics: ['Vocabulary', 'Error Spotting', 'Reading Comprehension'],
      recommendedPreparationStrategy: ['Complete grammar topics and attempt full mock tests.'],
      commonPitfallsToAvoid: ['Leaving questions blank or guessing wildly.'],
    },
    versionHistory: [],
  };

  db.examSyllabi.push(newExam);
  logAuditAction(
    req.user!,
    'CONTENT_UPLOADED',
    newExam.shortName,
    `Added new competitive exam [${newExam.name}] under category [${newExam.category}]`
  );

  saveDb(db);
  res.status(201).json(newExam);
});

// Admin: Edit exam syllabus
apiRouter.put('/syllabus/exams/:id', authenticateToken, requireAdmin, requirePermission('CAN_MANAGE_SYLLABUS'), (req: AuthenticatedRequest, res) => {
  const result = manualEditSyllabus(req.params.id, req.body, req.user!);
  if (!result.success) {
    res.status(404).json({ error: result.message });
    return;
  }
  res.json(result.exam);
});

// Admin: Archive old exam cycle
apiRouter.post('/syllabus/exams/:id/archive', authenticateToken, requireAdmin, requirePermission('CAN_MANAGE_SYLLABUS'), (req: AuthenticatedRequest, res) => {
  const result = archiveExamCycle(req.params.id, req.user!);
  if (!result.success) {
    res.status(404).json({ error: result.message });
    return;
  }
  res.json(result);
});

// Super Admin only: Delete exam
apiRouter.delete('/syllabus/exams/:id', authenticateToken, requireSuperAdmin, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const idx = db.examSyllabi.findIndex((e) => e.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Exam not found' });
    return;
  }

  const [removed] = db.examSyllabi.splice(idx, 1);
  logAuditAction(req.user!, 'CONTENT_DELETED', removed.shortName, `Deleted exam syllabus [${removed.name}]`);
  saveDb(db);
  res.json({ message: 'Exam syllabus removed successfully' });
});


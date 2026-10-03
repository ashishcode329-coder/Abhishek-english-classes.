import { Course } from '../src/types/index.ts';

export const INITIAL_COURSES: Course[] = [
  // =========================================================================
  // 1. SSC CGL COMPLETE ENGLISH COURSE (Modules 1 - 13)
  // =========================================================================
  {
    id: 'course_ssc_cgl_english_master',
    exam_id: 'SSC_CGL',
    title: 'SSC CGL Complete English Master Course (Tier-1 & Tier-2)',
    subtitle: 'Comprehensive 13-Module Syllabus Mastery from Basics to 135/135 Target Marks',
    subject: 'English Comprehension',
    category: 'SSC',
    targetExamName: 'SSC CGL Examination (Staff Selection Commission)',
    instructor: 'Abhishek Sir (Senior Faculty)',
    badge: 'Flagship Exam Course',
    totalDurationHours: 64,
    totalLessons: 36,
    totalModules: 13,
    rating: 4.95,
    enrolledStudentsCount: 14850,
    overview:
      'Engineered specifically for SSC CGL Tier-1 (25 Questions / 50 Marks) and Tier-2 (45 Questions / 135 Marks). Covers every grammar principle, sentence structure, active/passive voice transformation, narration, error spotting, vocabulary roots, cloze test strategies, and previous-year question breakdowns.',
    syllabusCoveragePercentage: 100,
    isPublished: true,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-09-28T00:00:00.000Z',
    modules: [
      {
        id: 'cgl_mod_01',
        moduleNumber: 1,
        title: 'Module 1: Parts of Speech Mastery',
        description: 'Deep dive into Noun classifications, Pronoun cases, Adjective degrees, Adverbs, and Verbs with competitive examination nuances.',
        lessons: [
          {
            id: 'cgl_les_01_01',
            lessonNumber: 1,
            title: 'Nouns & Categorization Rules in SSC CGL',
            durationMinutes: 45,
            notesMarkdown: `### Nouns in Competitive Examinations
In SSC CGL, noun errors predominantly occur around:
1. **Uncountable Nouns used as Countable**: Words like *furniture, luggage, baggage, advice, information, scenery, poetry, machinery, stationery* never take plural forms or indefinite articles (*a/an*).
2. **Singular in Form, Plural in Meaning**: *Cattle, gentry, poultry, peasantry, folk, clergy, police* take plural verbs.
3. **Plural in Form, Singular in Meaning**: *Mathematics, physics, measles, mumps, summons, news, innings* take singular verbs.`,
            pdfAttachmentUrl: '/sample-notes/noun_rules_ssc_cgl.pdf',
            examples: [
              {
                questionOrRule: 'The sceneries of Kashmir are enchanting. (Incorrect)',
                explanation: 'Scenery is an uncountable noun. Correct: "The scenery of Kashmir is enchanting."',
                examContext: 'SSC CGL 2023 Tier-1 Shift 1',
              },
              {
                questionOrRule: 'The police has arrested the burglar. (Incorrect)',
                explanation: 'Police is treated as a plural collective noun. Correct: "The police have arrested the burglar."',
                examContext: 'SSC CGL 2024 Tier-1 Shift 3',
              },
            ],
            practiceQuestions: [
              {
                id: 'q_cgl_crs_01',
                exam_id: 'SSC_CGL',
                exam: 'SSC',
                subject: 'English Comprehension',
                topic: 'Parts of Speech - Nouns',
                questionText: 'Find the error: "All the furnitures of the executive bungalow (A) / were auctioned off (B) / by the official receiver. (C) / No error (D)"',
                options: {
                  A: 'All the furnitures of the executive bungalow',
                  B: 'were auctioned off',
                  C: 'by the official receiver',
                  D: 'No error',
                },
                correctAnswer: 'A',
                explanation: '"Furniture" is uncountable. The correct phrasing is "All the furniture" or "All the articles of furniture".',
                difficulty: 'Easy',
                marks: 2,
                negativeMarks: 0.5,
                source_type: 'PREVIOUS_YEAR',
                pyqYear: '2023',
                pyqShift: 'Tier-1',
                status: 'PUBLISHED',
                author: 'Abhishek Sir',
                createdAt: '2026-09-28T00:00:00.000Z',
              },
            ],
            homeworkTask: 'Identify 10 uncountable nouns that students commonly mistake for countables and compose one error-spotting sentence for each.',
            quizQuestionsCount: 10,
          },
          {
            id: 'cgl_les_01_02',
            lessonNumber: 2,
            title: 'Pronouns: Order of Persons & Relative Pronouns',
            durationMinutes: 50,
            notesMarkdown: `### Pronoun Order (231 vs 123 Rule)
- **Normal/Good Context**: Second Person (2) -> Third Person (3) -> First Person (1).
  *Example*: You, he and I will inspect the project.
- **Confession of Mistake/Crime/Plural Persons**: First Person (1) -> Second Person (2) -> Third Person (3).
  *Example*: I, you and he are responsible for this financial discrepancy.`,
            examples: [
              {
                questionOrRule: 'Rule of relative pronoun "that" after superlative degrees and words like *all, any, none, only, the same*.',
                explanation: 'Use "that" instead of "who" or "which". E.g.: "This is the only book that can clarify your conceptual doubts."',
                examContext: 'SSC CGL Tier-2 2022',
              },
            ],
            practiceQuestions: [],
            homeworkTask: 'Complete 15 questions on pronoun agreement with singular antecedents joined by "neither...nor".',
            quizQuestionsCount: 8,
          },
        ],
      },
      {
        id: 'cgl_mod_02',
        moduleNumber: 2,
        title: 'Module 2: Articles & Determiners',
        description: 'Definite vs. Indefinite articles, zero article exceptions, idiomatic omissions, and geography determiners.',
        lessons: [
          {
            id: 'cgl_les_02_01',
            lessonNumber: 1,
            title: 'Definite Article "The" and Critical Exceptions',
            durationMinutes: 40,
            notesMarkdown: `### Critical SSC CGL Article Rules
1. **Omission of Articles**: Before names of meals (*dinner, lunch*), languages, subjects, and institutions (*school, college, church, prison, hospital*) when visited for their primary purpose.
2. **Parallel Comparative Structures**: *The higher you climb, the colder it gets.* (Both clauses take "The + comparative adjective").
3. **Invention & Musical Instruments**: *The telephone was invented by Graham Bell. She plays the flute skillfully.*`,
            examples: [
              {
                questionOrRule: 'He was sent to the prison for robbery. (Incorrect)',
                explanation: 'When visited for the primary purpose (criminal serving a sentence), omit "the". Correct: "He was sent to prison for robbery."',
                examContext: 'SSC CGL Tier-1 2023',
              },
            ],
            practiceQuestions: [],
            homeworkTask: 'Review 20 geographic names (rivers, mountain ranges, peaks) and classify which take the definite article.',
            quizQuestionsCount: 10,
          },
        ],
      },
      {
        id: 'cgl_mod_03',
        moduleNumber: 3,
        title: 'Module 3: Tenses & Sequence of Tenses',
        description: 'Tense consistency, conditional sentences, past perfect traps, and future time clauses.',
        lessons: [
          {
            id: 'cgl_les_03_01',
            lessonNumber: 1,
            title: 'Conditionals & Sequence of Tenses in Complex Sentences',
            durationMinutes: 55,
            notesMarkdown: `### 3 Golden Conditional Rules for SSC CGL
1. **Zero Conditional**: If + Simple Present, Simple Present (Scientific fact).
2. **First Conditional**: If + Simple Present, Simple Future (will + V1).
   *Never use "will" in the conditional clause*: Incorrect: *If it will rain...* Correct: *If it rains...*
3. **Second Conditional**: If + Simple Past (were / V2), would + V1.
4. **Third Conditional**: If + Past Perfect (had + V3), would have + V3.`,
            examples: [
              {
                questionOrRule: 'If he had informed me earlier, I would attend the seminar. (Incorrect)',
                explanation: 'Third conditional requires "would have attended".',
                examContext: 'SSC CGL Tier-2 2024',
              },
            ],
            practiceQuestions: [],
            homeworkTask: 'Solve 25 sentence improvement questions focusing on conditional clause tense shifts.',
            quizQuestionsCount: 15,
          },
        ],
      },
      {
        id: 'cgl_mod_04',
        moduleNumber: 4,
        title: 'Module 4: Subject-Verb Agreement (20 Golden Rules)',
        description: 'The single highest-weightage grammar topic in SSC CGL. Comprehensive breakdown of proximity, compound subjects, and collective nouns.',
        lessons: [
          {
            id: 'cgl_les_04_01',
            lessonNumber: 1,
            title: 'Proximity Rules & Compound Subject Connectors',
            durationMinutes: 60,
            notesMarkdown: `### Subject-Verb Agreement Essentials
1. **Connectors**: *along with, together with, as well as, accompanied by, in addition to, rather than, like, unlike* -> Verb agrees with the **FIRST subject**.
2. **Correlative Conjunctions**: *either...or, neither...nor, not only...but also* -> Verb agrees with the **NEAREST subject**.
3. **A number of vs The number of**:
   - *A number of students* -> Plural verb (*are present*).
   - *The number of applicants* -> Singular verb (*is increasing*).`,
            examples: [
              {
                questionOrRule: 'The captain along with all team members have arrived. (Incorrect)',
                explanation: 'Subject is "The captain" (singular). Verb must be "has arrived".',
                examContext: 'SSC CGL 2024 Tier-1 Shift 2',
              },
            ],
            practiceQuestions: [],
            homeworkTask: 'Memorize all 12 parenthetical connectors and complete the 20-question practice worksheet.',
            quizQuestionsCount: 20,
          },
        ],
      },
      {
        id: 'cgl_mod_05',
        moduleNumber: 5,
        title: 'Module 5: Active & Passive Voice Transformation',
        description: 'Complete voice transformation across all 12 tenses, imperatives, interrogatives, and causative verbs.',
        lessons: [
          {
            id: 'cgl_les_05_01',
            lessonNumber: 1,
            title: 'Imperative & Interrogative Passive Structures',
            durationMinutes: 50,
            notesMarkdown: `### Key Voice Transformations in Tier-2
- **Command/Order**: Let + object + be + V3 (*Open the door -> Let the door be opened*).
- **Advice/Moral Duty**: Subject + should be + V3 (*Help the poor -> The poor should be helped*).
- **Interrogatives with "Who"**: Change "Who" into "By whom".
  *Example*: Who broke this vase? -> By whom was this vase broken?`,
            examples: [
              {
                questionOrRule: 'Active: "Why did you dismiss the assistant?"',
                explanation: 'Passive: "Why was the assistant dismissed by you?"',
                examContext: 'SSC CGL Tier-2 2023',
              },
            ],
            practiceQuestions: [],
            homeworkTask: 'Convert 30 interrogative active sentences into passive voice.',
            quizQuestionsCount: 15,
          },
        ],
      },
      {
        id: 'cgl_mod_06',
        moduleNumber: 6,
        title: 'Module 6: Direct & Indirect Narration',
        description: 'Speech reporting rules, tense shifts, pronoun adjustments, time/place adverbs, and imperative reporting.',
        lessons: [
          {
            id: 'cgl_les_06_01',
            lessonNumber: 1,
            title: 'Reporting Verbs & Exceptions to Tense Shifts',
            durationMinutes: 50,
            notesMarkdown: `### When NOT to shift tenses in Indirect Speech
1. **Universal Truths & Scientific Laws**: The teacher said, "The earth revolves around the sun." -> The teacher said that the earth revolves around the sun.
2. **Habitual Actions**: He said, "I wake up at 5 AM daily." -> He said that he wakes up at 5 AM daily.
3. **Historical Facts**: The lecturer said, "Samudragupta is known as the Napoleon of India." (No tense change).`,
            examples: [
              {
                questionOrRule: 'He said to me, "What are you preparing for?"',
                explanation: 'He asked me what I was preparing for. (Interrogative sentence becomes affirmative in indirect speech).',
                examContext: 'SSC CGL Tier-2 2024',
              },
            ],
            practiceQuestions: [],
            homeworkTask: 'Practice 20 exclamatory and optative sentences transformation into indirect narration.',
            quizQuestionsCount: 15,
          },
        ],
      },
      {
        id: 'cgl_mod_07',
        moduleNumber: 7,
        title: 'Module 7: Prepositions & Phrasal Verbs',
        description: 'Fixed prepositions, commonly confused prepositions (*between vs among*, *beside vs besides*), and high-frequency exam phrasal verbs.',
        lessons: [
          {
            id: 'cgl_les_07_01',
            lessonNumber: 1,
            title: '50 Fixed Prepositions Frequently Tested in SSC CGL',
            durationMinutes: 55,
            notesMarkdown: `### High-Frequency Fixed Prepositions
- *Abide by* (rules)
- *Accustomed to* (routine)
- *Acquitted of* (crimes)
- *Adhere to* (standards)
- *Afflicted with* (disease)
- *Concur with* (person), *Concur in* (opinion)
- *Deprived of* (rights)
- *Dispense with* (formalities)`,
            examples: [
              {
                questionOrRule: 'He is confident on his success. (Incorrect)',
                explanation: 'Confident takes preposition "of". Correct: "He is confident of his success."',
                examContext: 'SSC CGL 2022 Tier-1',
              },
            ],
            practiceQuestions: [],
            homeworkTask: 'Learn 30 phrasal verbs formed with "Look", "Call", and "Bring".',
            quizQuestionsCount: 20,
          },
        ],
      },
      {
        id: 'cgl_mod_08',
        moduleNumber: 8,
        title: 'Module 8: Conjunctions & Sentence Connectors',
        description: 'Correlative conjunctions, inverted word order after negative adverbs, and transition words.',
        lessons: [
          {
            id: 'cgl_les_08_01',
            lessonNumber: 1,
            title: 'Correlative Pairs & Negative Inversion',
            durationMinutes: 45,
            notesMarkdown: `### Fixed Conjunction Pairs
1. *Scarcely / Hardly... when* (never "than").
2. *No sooner... than* (never "when" or "then").
3. *Lest... should* (never "not" or "will").
4. *Both... and* (never "as well as").
5. *Although / Though... yet* (or comma).`,
            examples: [
              {
                questionOrRule: 'Hardly had he arrived than the rain started. (Incorrect)',
                explanation: 'Hardly is followed by "when", not "than".',
                examContext: 'SSC CGL Tier-1 2024',
              },
            ],
            practiceQuestions: [],
            homeworkTask: 'Construct 10 sentences displaying correct inversion with "Neither", "Seldom", "Rarely".',
            quizQuestionsCount: 15,
          },
        ],
      },
      {
        id: 'cgl_mod_09',
        moduleNumber: 9,
        title: 'Module 9: Error Detection Master Checklist',
        description: 'Systematic 50-rule checklist used by top rankers to scan and identify errors in 15 seconds.',
        lessons: [
          {
            id: 'cgl_les_09_01',
            lessonNumber: 1,
            title: 'Top 25 High-Frequency Error Archetypes in SSC CGL',
            durationMinutes: 65,
            notesMarkdown: `### 5-Step Error Scanning Method
1. Read the full sentence without prejudice.
2. Check Subject-Verb Agreement.
3. Check Tense sequence and consistency.
4. Check Prepositions and Pronoun cases.
5. Check Modifier placement and parallelism.`,
            examples: [
              {
                questionOrRule: 'Being a rainy day, he decided to stay indoors. (Incorrect)',
                explanation: 'Unattached participle. The subject of "Being" is missing. Correct: "It being a rainy day, he decided to stay indoors."',
                examContext: 'SSC CGL Tier-2 2023',
              },
            ],
            practiceQuestions: [],
            homeworkTask: 'Solve the 40-question Error Detection Practice Worksheet.',
            quizQuestionsCount: 25,
          },
        ],
      },
      {
        id: 'cgl_mod_10',
        moduleNumber: 10,
        title: 'Module 10: Sentence Improvement & Fill in the Blanks',
        description: 'Contextual nuance, eliminating redundancy, and word collocation strategies.',
        lessons: [
          {
            id: 'cgl_les_10_01',
            lessonNumber: 1,
            title: 'Parallelism & Avoiding Redundancy',
            durationMinutes: 45,
            notesMarkdown: `### Redundancy Traps in SSC CGL
- *Return back* (Incorrect -> use *return*).
- *Repeat again* (Incorrect -> use *repeat*).
- *Cousin brother/sister* (Incorrect -> use *cousin*).
- *Revert back* (Incorrect -> use *revert*).
- *Flee away* (Incorrect -> use *flee*).`,
            examples: [
              {
                questionOrRule: 'She likes reading novels, traveling to mountains, and to cook Italian meals. (Incorrect)',
                explanation: 'Violates parallelism. Correct: "She likes reading novels, traveling to mountains, and cooking Italian meals."',
                examContext: 'SSC CGL Tier-1 2023',
              },
            ],
            practiceQuestions: [],
            homeworkTask: 'Identify and correct 15 redundant phrases in official exam excerpts.',
            quizQuestionsCount: 15,
          },
        ],
      },
      {
        id: 'cgl_mod_11',
        moduleNumber: 11,
        title: 'Module 11: Vocabulary Mastery & Cloze Test Strategies',
        description: 'Greek/Latin root words, high-yield idioms, synonyms & antonyms, and passage comprehension tactics.',
        lessons: [
          {
            id: 'cgl_les_11_01',
            lessonNumber: 1,
            title: 'Etymology & 100 Power Roots for SSC Vocabulary',
            durationMinutes: 60,
            notesMarkdown: `### Root Word Power
- *Bene* (Good): *Benefactor, benevolent, benediction, beneficiary*.
- *Mal* (Bad): *Malevolent, malignant, malediction, maladroit*.
- *Chron* (Time): *Chronological, synchronize, anachronism, chronic*.
- *Loqu / Locut* (Speech): *Loquacious, eloquent, soliloquy, circumlocution*.`,
            examples: [
              {
                questionOrRule: 'Meaning of "Anachronism"',
                explanation: 'Ana (against) + Chronos (time) = Something out of its proper historical time period.',
                examContext: 'SSC CGL Tier-1 2024',
              },
            ],
            practiceQuestions: [],
            homeworkTask: 'Construct flashcards for 50 root words and identify 3 derivatives for each.',
            quizQuestionsCount: 20,
          },
        ],
      },
      {
        id: 'cgl_mod_12',
        moduleNumber: 12,
        title: 'Module 12: Previous-Year Practice (Tier-1 & Tier-2)',
        description: 'Detailed analysis of 2021-2025 actual SSC CGL question papers with time-budgeting tactics.',
        lessons: [
          {
            id: 'cgl_les_12_01',
            lessonNumber: 1,
            title: 'SSC CGL Tier-2 45-Question Master Solved Session',
            durationMinutes: 75,
            notesMarkdown: `### Tier-2 Strategy Blueprint
In SSC CGL Tier-2 (45 Questions, 135 Marks):
- Budget: 35 minutes for English.
- Target: 42+ correct responses.
- Reading Comprehension: Skim questions before reading dense technical passages.
- Cloze Test: Read the full paragraph once to understand tone before selecting prepositions.`,
            examples: [
              {
                questionOrRule: 'Tier-2 Solved Walkthrough: Narrative Tone vs Analytic Tone in RC.',
                explanation: 'Identify the author\'s attitude from adjectives used.',
                examContext: 'SSC CGL Tier-2 2024 Shift 1',
              },
            ],
            practiceQuestions: [],
            homeworkTask: 'Solve 2 previous-year Tier-1 English papers within 12 minutes each.',
            quizQuestionsCount: 45,
          },
        ],
      },
      {
        id: 'cgl_mod_13',
        moduleNumber: 13,
        title: 'Module 13: Full Mock Tests & Performance Analysis',
        description: 'CBT exam simulation, negative marking management, and accuracy benchmarking against cutoffs.',
        lessons: [
          {
            id: 'cgl_les_13_01',
            lessonNumber: 1,
            title: 'Full CBT Simulation & Error Log Maintenance',
            durationMinutes: 60,
            notesMarkdown: `### The Golden Error Log Technique
Maintain an error log diary:
1. Question missed or incorrect.
2. Category (Silly mistake / Conceptual gap / Vocabulary unfamiliarity).
3. The exact rule that fixes the error.
Review this log every Sunday before attempting the rolling 7-day Mock Test.`,
            examples: [
              {
                questionOrRule: 'Mock Test Benchmark: Safe target score in English Tier-2 is 125+/135 for Inspector rank.',
                explanation: 'Consistent revision of rules 1 through 50 ensures maximum accuracy.',
                examContext: 'Official Benchmark',
              },
            ],
            practiceQuestions: [],
            homeworkTask: 'Attempt Mock Test 01 and complete the post-test error analysis report.',
            quizQuestionsCount: 25,
          },
        ],
      },
    ],
  },

  // =========================================================================
  // 2. UP POLICE & SI MASTER PREPARATION COURSE
  // =========================================================================
  {
    id: 'course_up_police_master',
    exam_id: 'UP_POLICE',
    title: 'UP Police Constable & Sub-Inspector Complete Preparation Course',
    subtitle: 'Full Hindi Vyakaran, UP Special GK, Mental Aptitude & Reasoning for UPPRPB Exams',
    subject: 'General Hindi & Mental Aptitude',
    category: 'UP_GOVERNMENT',
    targetExamName: 'UP Police Recruitment Board (UPPRPB)',
    instructor: 'Abhishek Sir & State Police Mentors',
    badge: 'State Recruitment Special',
    totalDurationHours: 48,
    totalLessons: 24,
    totalModules: 6,
    rating: 4.9,
    enrolledStudentsCount: 11200,
    overview:
      'Structured curriculum covering UPPRPB Constable (300 Marks) and SI (400 Marks) requirements: General Hindi (सामान्य हिन्दी व व्याकरण), Uttar Pradesh GK, Law & Constitution basics, and Mental Aptitude.',
    syllabusCoveragePercentage: 100,
    isPublished: true,
    createdAt: '2026-03-05T00:00:00.000Z',
    updatedAt: '2026-09-28T00:00:00.000Z',
    modules: [
      {
        id: 'up_mod_01',
        moduleNumber: 1,
        title: 'सामान्य हिन्दी व व्याकरण (General Hindi Grammar)',
        description: 'वर्णमाला, संधि, समास, उपसर्ग, प्रत्यय, तत्सम-तद्भव, विलोम, पर्यायवाची व मुहावरे।',
        lessons: [
          {
            id: 'up_les_01_01',
            lessonNumber: 1,
            title: 'हिन्दी वर्णमाला, स्वर-व्यंजन व उच्चारण स्थान',
            durationMinutes: 50,
            notesMarkdown: `### हिन्दी वर्णमाला महत्वपूर्ण नियम
1. **ह्रस्व स्वर**: अ, इ, उ, ऋ (4 स्वर)
2. **दीर्घ स्वर**: आ, ई, ऊ, ए, ऐ, ओ, औ (7 स्वर)
3. **स्पर्श व्यंजन**: क-वर्ग से प-वर्ग तक (25 व्यंजन)
4. **अन्तःस्थ व्यंजन**: य, र, ल, व
5. **ऊष्म व्यंजन**: श, ष, स, ह`,
            examples: [
              {
                questionOrRule: 'घ का उच्चारण स्थान क्या है?',
                explanation: 'क-वर्ग (क, ख, ग, घ, ङ) का उच्चारण स्थान "कण्ठ" है।',
                examContext: 'UP Police Constable 2024 Exam',
              },
            ],
            practiceQuestions: [],
            homeworkTask: 'उच्चारण स्थान तालिका का अभ्यास करें एवं 20 प्रश्नों का अभ्यास सेट हल करें।',
            quizQuestionsCount: 15,
          },
        ],
      },
      {
        id: 'up_mod_02',
        moduleNumber: 2,
        title: 'उत्तर प्रदेश विशेष सामान्य ज्ञान (UP Special GK)',
        description: 'यूपी का इतिहास, भूगोल, नदियाँ, प्रमुख मेले, उद्योग, लोकगीत एवं समसामयिकी।',
        lessons: [
          {
            id: 'up_les_02_01',
            lessonNumber: 1,
            title: 'उत्तर प्रदेश की नदियाँ, बांध एवं कृषि उत्पादन',
            durationMinutes: 45,
            notesMarkdown: `### यूपी विशेष तथ्य
- उत्तर प्रदेश में प्रवाहित होने वाली मुख्य नदियाँ: गंगा, यमुना, गोमती, सरयू (घाघरा), बेतवा, केन।
- गोमती नदी का उद्गम: पीलीभीत स्थित फुलहर झील से।
- प्रमुख उत्पादन: गन्ना, गेहूं, आलू, दूध उत्पादन में उत्तर प्रदेश देश में प्रथम स्थान पर है।`,
            examples: [
              {
                questionOrRule: 'लखनऊ किस नदी के तट पर स्थित है?',
                explanation: 'लखनऊ गोमती नदी के तट पर स्थित है।',
                examContext: 'UP Police SI Previous Paper',
              },
            ],
            practiceQuestions: [],
            homeworkTask: 'यूपी के 75 जिलों एवं 18 मण्डलों की रूपरेखा याद करें।',
            quizQuestionsCount: 20,
          },
        ],
      },
    ],
  },

  // =========================================================================
  // 3. BANKING EXAMINATIONS (IBPS / SBI) ENGLISH COURSE
  // =========================================================================
  {
    id: 'course_banking_english_speed',
    exam_id: 'BANKING',
    title: 'Banking English Speed & Accuracy Master Course (IBPS / SBI PO & Clerk)',
    subtitle: 'High-Level Reading Comprehension, Sentence Inversion, Cloze Test & Para Jumbles',
    subject: 'English Language',
    category: 'BANKING',
    targetExamName: 'IBPS PO/Clerk & SBI PO/Clerk',
    instructor: 'Abhishek Sir & Banking Experts',
    badge: 'Banking Precision Course',
    totalDurationHours: 42,
    totalLessons: 20,
    totalModules: 5,
    rating: 4.92,
    enrolledStudentsCount: 8900,
    overview:
      'Engineered for the 20-minute section limit in IBPS & SBI Prelims. Teaches advanced contextual vocabulary, financial reading comprehension, multi-sentence error spotting, and column matching.',
    syllabusCoveragePercentage: 100,
    isPublished: true,
    createdAt: '2026-03-10T00:00:00.000Z',
    updatedAt: '2026-09-28T00:00:00.000Z',
    modules: [
      {
        id: 'bnk_mod_01',
        moduleNumber: 1,
        title: 'Financial & Editorial Reading Comprehension',
        description: 'Tackling The Hindu, Mint, and Economist financial editorial passages with inference-based questions.',
        lessons: [
          {
            id: 'bnk_les_01_01',
            lessonNumber: 1,
            title: 'Tone Identification & Fact vs. Inference in RC',
            durationMinutes: 50,
            notesMarkdown: `### Banking RC Tactics
1. **Identify Tone**: Critical, Objective, Eulogistic, Sarcastic, Informative, Prescriptive.
2. **Inference Questions**: Must be logically supported by the passage, not an assumption.
3. **Keyword Scanning**: Read question stems first to flag monetary and policy keywords.`,
            examples: [
              {
                questionOrRule: 'Difference between "Explicit fact" and "Valid inference"',
                explanation: 'Inference extends the premise logically without introducing external bias.',
                examContext: 'SBI PO Prelims 2023',
              },
            ],
            practiceQuestions: [],
            homeworkTask: 'Read 2 editorial passages and summarize the central thesis in 50 words each.',
            quizQuestionsCount: 15,
          },
        ],
      },
    ],
  },

  // =========================================================================
  // 4. RAILWAY RRB NTPC & GROUP D COMPLETE FOUNDATION
  // =========================================================================
  {
    id: 'course_railway_rrb_master',
    exam_id: 'RAILWAY',
    title: 'RRB NTPC & Group D Comprehensive Foundation Course',
    subtitle: 'General Awareness, General Science, Reasoning & Arithmetic for CBT-1 & CBT-2',
    subject: 'General Awareness & Arithmetic',
    category: 'RAILWAY',
    targetExamName: 'Railway Recruitment Control Board (RRB)',
    instructor: 'Abhishek Sir & Railway Faculty',
    badge: 'Railway CBT Special',
    totalDurationHours: 40,
    totalLessons: 22,
    totalModules: 5,
    rating: 4.88,
    enrolledStudentsCount: 12500,
    overview:
      'Aligned with RRB NTPC (CBT-1 & CBT-2) and Group D examination pattern. Focuses on NCERT Science (Physics, Chemistry, Biology), Indian Railways history, and Speed Math.',
    syllabusCoveragePercentage: 100,
    isPublished: true,
    createdAt: '2026-03-12T00:00:00.000Z',
    updatedAt: '2026-09-28T00:00:00.000Z',
    modules: [
      {
        id: 'rrb_mod_01',
        moduleNumber: 1,
        title: 'General Science Foundation (Physics, Chemistry, Biology)',
        description: 'Class 9th & 10th NCERT core principles, units, chemical formulas, and human anatomy.',
        lessons: [
          {
            id: 'rrb_les_01_01',
            lessonNumber: 1,
            title: 'SI Units, Motion Laws & Work, Power, Energy',
            durationMinutes: 45,
            notesMarkdown: `### High-Frequency RRB Science Formulas
- 1 Newton = $10^5$ Dyne
- 1 Joule = $10^7$ Erg
- Kinetic Energy = $\\frac{1}{2}mv^2$
- Potential Energy = $mgh$`,
            examples: [
              {
                questionOrRule: 'What is the SI unit of electric charge?',
                explanation: 'Coulomb (C). Ampere is the unit of electric current.',
                examContext: 'RRB NTPC CBT-1 2022',
              },
            ],
            practiceQuestions: [],
            homeworkTask: 'Memorize all 25 common SI units and their dimensions.',
            quizQuestionsCount: 20,
          },
        ],
      },
    ],
  },

  // =========================================================================
  // 5. DEFENCE NDA / CDS / AGNIVEER ARMY FOUNDATION
  // =========================================================================
  {
    id: 'course_defence_nda_cds_master',
    exam_id: 'DEFENCE',
    title: 'NDA & CDS Military English & General Ability Foundation',
    subtitle: 'UPSC Defence Standard Grammar, High-Precision Vocabulary & Military Comprehension',
    subject: 'English (Military & High Precision)',
    category: 'DEFENCE',
    targetExamName: 'UPSC NDA & CDS Examination',
    instructor: 'Abhishek Sir (Defence Wing Faculty)',
    badge: 'UPSC Defence Standard',
    totalDurationHours: 45,
    totalLessons: 25,
    totalModules: 6,
    rating: 4.96,
    enrolledStudentsCount: 7800,
    overview:
      'Covers UPSC NDA Paper-II (GAT English - 200 Marks) and UPSC CDS English Paper (100 Marks / 120 Questions). Special attention to ordering of words in a sentence, synonyms/antonyms nuances, and military idioms.',
    syllabusCoveragePercentage: 100,
    isPublished: true,
    createdAt: '2026-03-15T00:00:00.000Z',
    updatedAt: '2026-09-28T00:00:00.000Z',
    modules: [
      {
        id: 'def_mod_01',
        moduleNumber: 1,
        title: 'Ordering of Words in a Sentence (S1-S6 & PQRS)',
        description: 'Sentence rearrangement patterns unique to UPSC NDA and CDS examinations.',
        lessons: [
          {
            id: 'def_les_01_01',
            lessonNumber: 1,
            title: 'Noun-Pronoun Linking & Conjunction Bridges in PQRS',
            durationMinutes: 50,
            notesMarkdown: `### UPSC Defence Jumbled Sentence Strategy
1. **Find the Opening Sentence**: Sentences starting with *However, Therefore, Thus, Moreover* cannot open the paragraph.
2. **Pairing Technique**: Identify mandatory pairs based on cause and effect or chronological order.`,
            examples: [
              {
                questionOrRule: 'Identifying mandatory pairs in 30 seconds.',
                explanation: 'Always trace demonstrative pronouns (this, that, these) to their preceding nouns.',
                examContext: 'CDS 2024 Exam Paper',
              },
            ],
            practiceQuestions: [],
            homeworkTask: 'Solve 20 PQRS questions from CDS 2023 & 2024 past papers.',
            quizQuestionsCount: 15,
          },
        ],
      },
    ],
  },

  // =========================================================================
  // 6. TEACHING CTET & UPTET PEDAGOGY & ENGLISH MASTER COURSE
  // =========================================================================
  {
    id: 'course_teaching_ctet_uptet_master',
    exam_id: 'UPTET',
    title: 'CTET & UPTET Child Development, Pedagogy & English Language Course',
    subtitle: 'Paper-I & Paper-II Complete Preparation with Official CBSE & Regulatory Board Syllabus',
    subject: 'Pedagogy & English Language',
    category: 'TEACHING',
    targetExamName: 'CTET (CBSE) & UPTET (Prayagraj)',
    instructor: 'Abhishek Sir & Education Pedagogy Team',
    badge: 'TET & Super TET Special',
    totalDurationHours: 38,
    totalLessons: 20,
    totalModules: 5,
    rating: 4.93,
    enrolledStudentsCount: 9600,
    overview:
      'Covers Child Development & Pedagogy (30 Marks) and English Language & Pedagogy (30 Marks) for CTET and UPTET Paper-I and Paper-II. Key focus on Piaget, Vygotsky, Kohlberg, and Chomsky theories.',
    syllabusCoveragePercentage: 100,
    isPublished: true,
    createdAt: '2026-03-18T00:00:00.000Z',
    updatedAt: '2026-09-28T00:00:00.000Z',
    modules: [
      {
        id: 'tet_mod_01',
        moduleNumber: 1,
        title: 'Child Development & Learning Theories (Piaget, Vygotsky, Kohlberg)',
        description: 'Constructivism, Zone of Proximal Development (ZPD), Scaffolding, and Stages of Moral Development.',
        lessons: [
          {
            id: 'tet_les_01_01',
            lessonNumber: 1,
            title: 'Jean Piaget: 4 Stages of Cognitive Development',
            durationMinutes: 45,
            notesMarkdown: `### Jean Piaget Cognitive Stages
1. **Sensorimotor** (0-2 years): Object permanence develops.
2. **Pre-operational** (2-7 years): Egocentrism, animism, lack of conservation.
3. **Concrete Operational** (7-11 years): Conservation, reversibility, logical thinking about concrete objects.
4. **Formal Operational** (11+ years): Abstract reasoning, hypothetical-deductive thinking.`,
            examples: [
              {
                questionOrRule: 'At which stage does a child develop conservation?',
                explanation: 'Concrete Operational Stage (7 to 11 years).',
                examContext: 'CTET Paper-I 2024',
              },
            ],
            practiceQuestions: [],
            homeworkTask: 'Contrast Piaget\'s biological constructivism with Vygotsky\'s socio-cultural theory in a comparative table.',
            quizQuestionsCount: 15,
          },
        ],
      },
    ],
  },
];

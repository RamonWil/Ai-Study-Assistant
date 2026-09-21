'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Bot, BrainCircuit, Sparkles, UserCircle, Target, 
  Trophy, BookOpen, Flame, ChevronRight, CheckCircle2, XCircle, ArrowRight, Loader2,
  Zap, Upload, FileText, File, LogOut, ShieldCheck, Key
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import confetti from 'canvas-confetti';
import { signInWithGooglePopup, logoutGoogle, initAuth } from '@/lib/auth';

// --- Types ---
type Tab = 'chat' | 'challenge' | 'quiz' | 'notes';

type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
};

type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

const TUTOR_PERSONAS = [
  { 
    id: 'Professor Owl', 
    name: 'Professor Owl', 
    icon: <BookOpen className="w-5 h-5"/>, 
    color: 'bg-amber-100 text-amber-700', 
    border: 'border-amber-200',
    description: 'Traditional, structured, and deep-diving. Best for mastering complex theories.',
    greeting: 'Greetings! Let us delve deep into the mechanics of this subject together.'
  },
  { 
    id: 'Captain Code', 
    name: 'Captain Code', 
    icon: <Target className="w-5 h-5"/>, 
    color: 'bg-emerald-100 text-emerald-700', 
    border: 'border-emerald-200',
    description: 'Practical, direct, and project-based. Focuses on the "how" and real-world application.',
    greeting: 'Welcome aboard! Let\'s tackle this subject practically and effectively.'
  },
  { 
    id: 'Zen Master', 
    name: 'Zen Master', 
    icon: <Sparkles className="w-5 h-5"/>, 
    color: 'bg-purple-100 text-purple-700', 
    border: 'border-purple-200',
    description: 'Calm, philosophical, and encouraging. Great for reducing test anxiety and building intuition.',
    greeting: 'Peace be with you. We shall build your understanding step by step, with no rush.'
  },
  { 
    id: 'Sparky', 
    name: 'Sparky', 
    icon: <Flame className="w-5 h-5"/>, 
    color: 'bg-rose-100 text-rose-700', 
    border: 'border-rose-200',
    description: 'High-energy, fast-paced, and gamified. Perfect for quick reviews and keeping you awake.',
    greeting: 'Hey! Ready to smash this subject? Let\'s go go go!'
  },
];

function GoogleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

// Default Starter Flashcard Sets for instant loading
const DEFAULT_FLASHCARD_SETS = [
  {
    id: 101,
    title: 'Cellular Respiration & ATP',
    description: 'Core AP Biology concepts covering Glycolysis, the Krebs Cycle, and Chemiosmosis.',
    cards: [
      { front: 'What is the primary function of Cellular Respiration?', back: 'To break down glucose in the presence of oxygen to produce ATP, releasing carbon dioxide and water as byproducts.' },
      { front: 'Where does Glycolysis occur in eukaryotic cells, and does it require oxygen?', back: 'Glycolysis occurs in the cytoplasm and is anaerobic (does not require oxygen).' },
      { front: 'What is the net yield of ATP and NADH per glucose molecule during Glycolysis?', back: 'Net yield of 2 ATP and 2 NADH per glucose molecule.' },
      { front: 'Where does the Krebs (Citric Acid) Cycle take place?', back: 'In the mitochondrial matrix.' },
      { front: 'What enzyme utilizes the proton gradient across the inner mitochondrial membrane to generate ATP?', back: 'ATP Synthase via the process of chemiosmosis.' },
    ]
  },
  {
    id: 102,
    title: 'DNA Replication & Molecular Genetics',
    description: 'Enzymes, replication fork mechanics, and leading vs. lagging strand synthesis.',
    cards: [
      { front: 'What enzyme unwinds the double helix at the replication fork?', back: 'Helicase separates the two parental DNA strands by breaking hydrogen bonds between base pairs.' },
      { front: 'In which 5\' to 3\' direction does DNA Polymerase synthesize new strands?', back: 'DNA Polymerase synthesizes new DNA exclusively in the 5\' to 3\' direction.' },
      { front: 'What are Okazaki fragments and where are they formed?', back: 'Short, newly synthesized DNA segments on the lagging strand that are later joined together by DNA ligase.' },
      { front: 'What role does RNA Primase play in DNA replication?', back: 'It synthesizes a short RNA primer providing a 3\'-OH group that DNA polymerase needs to begin synthesis.' },
    ]
  }
];

export default function StudyAssistant() {
  const [showIntro, setShowIntro] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [userApiKey, setUserApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('study_user_gemini_key') || '';
    }
    return '';
  });
  const [studentName, setStudentName] = useState('Ramon Williams');
  const [studentLevel, setStudentLevel] = useState('College');
  const [studentAvatar, setStudentAvatar] = useState('🧑‍🎓');

  // Google Account & AI Engine State
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(true);
  const [googleUser, setGoogleUser] = useState<{ name: string; email: string; photoURL?: string | null }>({
    name: 'Ramon Williams',
    email: 'ramonwilliams09@gmail.com'
  });
  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showAccountModal, setShowAccountModal] = useState(false);
  
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [subject, setSubject] = useState('AP Biology');
  const [persona, setPersona] = useState(TUTOR_PERSONAS[0]);
  
  const [isCustomTutor, setIsCustomTutor] = useState(false);
  const [customTutorName, setCustomTutorName] = useState('My Custom Tutor');
  const [customTutorEmoji, setCustomTutorEmoji] = useState('🤖');
  const [customTutorDesc, setCustomTutorDesc] = useState('A uniquely personalized AI tutor designed just for you.');

  // Gamification State
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [challengeMessages, setChallengeMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quiz State
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizData, setQuizData] = useState<QuizQuestion[] | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Upload & Notes State
  const [uploading, setUploading] = useState(false);
  const [flashcardSets, setFlashcardSets] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('flashcardSets');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {
          // ignore
        }
      }
    }
    return DEFAULT_FLASHCARD_SETS;
  });
  const [activeSetId, setActiveSetId] = useState<number | null>(null);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 1400);

    // Initialize Firebase Auth listener to keep real Google state synced
    const unsubscribe = initAuth(
      (user) => {
        if (user) {
          const gUser = {
            name: user.displayName || 'Ramon Williams',
            email: user.email || 'ramonwilliams09@gmail.com',
            photoURL: user.photoURL,
          };
          setGoogleUser(gUser);
          setIsGoogleSignedIn(true);
          if (user.displayName) {
            setStudentName(user.displayName);
          }
          localStorage.setItem('study_google_user', JSON.stringify(gUser));
        }
      },
      () => {
        // Fallback to saved local user if any
        const savedGUser = localStorage.getItem('study_google_user');
        if (savedGUser) {
          try {
            const parsed = JSON.parse(savedGUser);
            setGoogleUser(parsed);
            setIsGoogleSignedIn(true);
            if (parsed.name) setStudentName(parsed.name);
          } catch {
            // ignore
          }
        }
      }
    );

    return () => {
      clearTimeout(timer);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleGoogleSignIn = async () => {
    setIsSigningInGoogle(true);
    setAuthError('');
    try {
      // 1. Trigger real Google popup login
      const { user } = await signInWithGooglePopup();
      
      const realName = user.displayName || studentName.trim() || 'Ramon Williams';
      const realEmail = user.email || 'ramonwilliams09@gmail.com';
      const gUser = {
        name: realName,
        email: realEmail,
        photoURL: user.photoURL,
      };

      setGoogleUser(gUser);
      setIsGoogleSignedIn(true);
      setStudentName(realName);
      localStorage.setItem('study_google_user', JSON.stringify(gUser));

      // 2. Fire backend verification asynchronously in the background (zero blocking)
      fetch('/api/verify-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isGoogleAuth: true, apiKey: userApiKey })
      }).catch(() => {});

      // 3. Immediately advance to step 1 without waiting
      setOnboardingStep(1);
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        console.error('Google Sign-In failed:', err);
      }
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in popup was closed. Click below to try again, or continue directly.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setAuthError('Sign-in request was replaced by another popup.');
      } else if (err.code === 'auth/network-request-failed') {
        setAuthError('Network issue connecting to Google. You can continue directly.');
      } else {
        setAuthError(err.message || 'Failed to sign in with Google. You can still continue.');
      }
    } finally {
      setIsSigningInGoogle(false);
    }
  };

  const handleLaunchWorkspace = () => {
    // Instant workspace entry
    handleCompleteOnboarding();
  };

  useEffect(() => {
    if (activeTab === 'notes') {
      const savedSets = localStorage.getItem('flashcardSets');
      if (savedSets) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFlashcardSets(JSON.parse(savedSets));
      }
    }
  }, [activeTab]);

  const loadFlashcards = (setId: number, providedSets?: any[]) => {
    setActiveSetId(setId);
    setCurrentCardIdx(0);
    setIsFlipped(false);
    
    const setsToSearch = providedSets || flashcardSets;
    const targetSet = setsToSearch.find((s: any) => s.id === setId);
    if (targetSet && targetSet.cards && targetSet.cards.length > 0) {
      setFlashcards(targetSet.cards);
    } else {
      setFlashcards([]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('apiKey', userApiKey);
    
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if ((data.success || data.cards) && Array.isArray(data.cards) && data.cards.length > 0) {
        const newSetId = Date.now();
        const newSet = {
          id: newSetId,
          title: data.title || `${file.name.replace(/\.[^/.]+$/, "")} Flashcards`,
          description: `Generated from ${file.name} with AI key concepts`,
          cards: data.cards
        };
        
        const updatedSets = [newSet, ...flashcardSets];
        setFlashcardSets(updatedSets);
        localStorage.setItem('flashcardSets', JSON.stringify(updatedSets));
        
        loadFlashcards(newSetId, updatedSets);
      } else {
        alert(data.error || 'Could not generate flashcards from this document. Please try a text or PDF file with readable text.');
      }
    } catch (err: any) {
      console.error('File upload error:', err);
      alert('Error uploading file. Please ensure your file has readable text or try another document.');
    } finally {
      setUploading(false);
      // Reset input value so the same file can be re-uploaded if desired
      e.target.value = '';
    }
  };

  const activePersona = isCustomTutor ? {
    id: 'custom',
    name: customTutorName || 'Custom Tutor',
    icon: <span>{customTutorEmoji}</span>,
    color: 'bg-indigo-100 text-indigo-700 text-xl',
    border: 'border-indigo-200',
    description: customTutorDesc,
    greeting: 'Hello! I am your custom AI tutor. Ready to learn?'
  } : persona;

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, challengeMessages, activeTab]);

  // --- Chat Handlers ---
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    
    if (activeTab === 'challenge') {
      setChallengeMessages(prev => [...prev, userMsg]);
    } else {
      setMessages(prev => [...prev, userMsg]);
    }
    
    setInput('');
    setIsChatLoading(true);

    try {
      const activeMessages = activeTab === 'challenge' ? challengeMessages : messages;
      
      const historyToSend = activeMessages.concat(userMsg).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyToSend,
          tutorPersona: isCustomTutor ? `Name: ${customTutorName}. Description: ${customTutorDesc}` : activePersona.name,
          subject: subject,
          studentName: studentName,
          studentLevel: studentLevel,
          isGamified: activeTab === 'challenge',
          apiKey: userApiKey,
        })
      });

      const data = await res.json();
      if (data.text) {
        let responseText = data.text;
        
        if (activeTab === 'challenge') {
          if (responseText.includes('[RESULT: CORRECT]')) {
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
            setScore(s => s + 20);
            setStreak(s => s + 1);
            responseText = responseText.replace('[RESULT: CORRECT]', '');
          } else if (responseText.includes('[RESULT: INCORRECT]')) {
            setStreak(0);
            responseText = responseText.replace('[RESULT: INCORRECT]', '');
          }
          
          setChallengeMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: responseText }]);
        } else {
          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: responseText }]);
        }
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (err) {
      console.error(err);
      const errorMsg = { id: Date.now().toString(), role: 'model' as const, content: err instanceof Error ? `Error: ${err.message}` : 'Oops! I had a little trouble thinking of a response. Let us try that again.' };
      if (activeTab === 'challenge') setChallengeMessages(prev => [...prev, errorMsg]);
      else setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // --- Quiz Handlers ---
  const handleStartQuiz = async () => {
    setQuizLoading(true);
    setQuizData(null);
    setCurrentQuestionIdx(0);
    setSelectedAnswer(null);
    setIsAnswerRevealed(false);
    setQuizScore(0);

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, difficulty: 'medium', numQuestions: 3, apiKey: userApiKey })
      });
      const data = await res.json();
      if (data.quiz) {
        setQuizData(data.quiz);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleAnswerSelect = (opt: string) => {
    if (isAnswerRevealed) return;
    setSelectedAnswer(opt);
    setIsAnswerRevealed(true);
    
    const isCorrect = opt === quizData![currentQuestionIdx].correctAnswer;
    if (isCorrect) {
      setScore(s => s + 50);
      setStreak(s => s + 1);
      setQuizScore(s => s + 1);
    } else {
      setStreak(0);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIdx < (quizData?.length || 0) - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerRevealed(false);
    } else {
      // Quiz complete state
      setQuizData(null);
    }
  };

  const handleCompleteOnboarding = () => {
    setIsOnboarding(false);
    setMessages([
      { 
        id: '1', 
        role: 'model', 
        content: `Hello ${studentName || 'there'}! ${activePersona.greeting} I'm ready to help you with ${subject || 'your studies'}. What should we focus on first?` 
      }
    ]);
  };

  return (
    <>
      {/* Intro Animation */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            key="intro-animation"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white select-none cursor-pointer"
            onClick={() => setShowIntro(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="flex flex-col items-center gap-5 text-center px-4"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/50">
                  <BrainCircuit className="w-10 h-10 text-white animate-pulse" />
                </div>
                <div className="absolute -inset-3 rounded-3xl bg-indigo-500/20 blur-xl -z-10 animate-pulse" />
              </div>
              <div>
                <motion.h1 
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="text-3xl font-display font-bold tracking-tight text-white"
                >
                  Study With Me
                </motion.h1>
                <motion.p 
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="text-sm text-slate-400 font-medium mt-1"
                >
                  Your Personalized AI Study Assistant
                </motion.p>
              </div>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 140 }}
                transition={{ delay: 0.3, duration: 0.6, ease: "easeInOut" }}
                className="h-1 bg-indigo-500 rounded-full"
              />
              <span className="text-[11px] text-slate-500 font-mono tracking-wider uppercase">Loading Workspace...</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isOnboarding ? (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-slate-50 overflow-y-auto">
          <div className="my-auto w-full flex justify-center py-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full border border-slate-200 shadow-xl max-h-[92vh] overflow-y-auto flex flex-col"
            >
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    <BrainCircuit className="w-7 h-7" />
                  </div>
                  <div>
                    <h1 className="font-display font-bold text-xl text-slate-900">Study With Me</h1>
                    <p className="text-xs font-medium text-slate-500">Personalized AI Study Assistant</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600">
                  <span className={cn("w-2 h-2 rounded-full", onboardingStep === 0 ? "bg-indigo-600" : "bg-emerald-500")} />
                  <span>{onboardingStep === 0 ? "Step 1 of 2: Account" : onboardingStep === 1 ? "Step 2 of 2: Focus" : "Connecting..."}</span>
                </div>
              </div>

            <AnimatePresence mode="wait">
              {onboardingStep === 0 && (
                <motion.div 
                  key="step0"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
                      <GoogleIcon className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-1">Connect with Google</h2>
                    <p className="text-slate-500 text-sm max-w-md mx-auto">
                      Sign in with your Google account to get started with your personalized AI study companion.
                    </p>
                  </div>

                  {authError && (
                    <motion.div 
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-medium flex items-center gap-3"
                    >
                      <XCircle className="w-5 h-5 shrink-0 text-red-500" />
                      <span>{authError}</span>
                    </motion.div>
                  )}

                  {/* Google Account Profile Card */}
                  <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-xs text-xl overflow-hidden">
                          {googleUser?.photoURL ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={googleUser.photoURL} alt={googleUser.name} className="w-full h-full object-cover" />
                          ) : (
                            studentAvatar
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{studentName.trim() || googleUser?.name || 'Ramon Williams'}</p>
                          <p className="text-xs text-slate-500 font-mono">{googleUser?.email || 'ramonwilliams09@gmail.com'}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100/80 text-emerald-800 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        AI Key Included
                      </span>
                    </div>

                    <div className="border-t border-slate-200/70 pt-3 space-y-2 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Live Google OAuth 2.0 authentication</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Gemini &amp; ChatGPT-compatible AI engine connected</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Private study history and personalized learning</span>
                      </div>
                    </div>
                  </div>

                  {/* Profile Customization */}
                  <div className="space-y-4 pt-1">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Student Avatar</label>
                      <div className="flex gap-2 flex-wrap">
                        {['🧑‍🎓', '🦊', '🐱', '🐼', '🐨', '🦄', '🦁', '🦉', '🐙'].map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setStudentAvatar(emoji)}
                            className={cn(
                              "w-11 h-11 rounded-xl text-xl flex items-center justify-center transition-all cursor-pointer",
                              studentAvatar === emoji 
                                ? "bg-indigo-100 ring-2 ring-indigo-500 scale-105" 
                                : "bg-slate-50 hover:bg-slate-100 border border-slate-200"
                            )}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Your Name</label>
                        <input 
                          type="text" 
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                          placeholder="e.g. Ramon Williams"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Grade / Level</label>
                        <input 
                          type="text" 
                          value={studentLevel}
                          onChange={(e) => setStudentLevel(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                          placeholder="e.g. College, 10th Grade"
                        />
                      </div>
                    </div>

                    {/* BYOK (Bring Your Own Key) for GitHub / Self-Hosted Deployments */}
                    <div className="pt-2 border-t border-slate-200/80">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Gemini API Key (BYOK)</span>
                        </label>
                        <a 
                          href="https://ai.google.dev/" 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          Get a free Gemini Key ↗
                        </a>
                      </div>
                      <input 
                        type="password" 
                        value={userApiKey}
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          setUserApiKey(val);
                          if (val) {
                            localStorage.setItem('study_user_gemini_key', val);
                          } else {
                            localStorage.removeItem('study_user_gemini_key');
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                        placeholder="AIzaSy... (leave blank to use server environment key)"
                      />
                      <p className="text-[11px] text-slate-400 mt-1.5">
                        {userApiKey ? (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Using your custom Gemini API key for all AI tutor &amp; quiz calls.
                          </span>
                        ) : (
                          <span>Users who clone your GitHub repo can paste their own Gemini API key here, or configure GEMINI_API_KEY in .env.</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Single Connect with Google Action */}
                  <div className="pt-2 space-y-3">
                    <button 
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isSigningInGoogle}
                      className="w-full py-4 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 hover:border-slate-400 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-sm hover:shadow-md active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isSigningInGoogle ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                          <span>Authorizing with Google...</span>
                        </>
                      ) : (
                        <>
                          <GoogleIcon className="w-5 h-5" />
                          <span>Connect with Google &amp; Continue</span>
                          <ArrowRight className="w-4 h-4 text-slate-400" />
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between pt-1">
                      <p className="text-xs text-slate-400">
                        Protected by Google Auth
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const gUser = {
                            name: studentName.trim() || 'Ramon Williams',
                            email: 'ramonwilliams09@gmail.com',
                            photoURL: googleUser?.photoURL,
                          };
                          setGoogleUser(gUser);
                          setIsGoogleSignedIn(true);
                          localStorage.setItem('study_google_user', JSON.stringify(gUser));
                          setOnboardingStep(1);
                        }}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Continue to Study Plan</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {onboardingStep === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800 mb-2">Choose your focus and tutor</h2>
                    <p className="text-slate-500 text-sm mb-6">Select the subject you want to study and the AI persona that best fits your learning style.</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-2">What subject are we studying today?</label>
                      <input 
                        type="text" 
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                        placeholder="e.g. AP Biology, World History, Calculus..."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-2">Select a Tutor Persona</label>
                      <div className="grid grid-cols-1 gap-3">
                        {TUTOR_PERSONAS.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => { setPersona(p); setIsCustomTutor(false); }}
                            className={cn(
                              "flex items-start gap-4 p-4 rounded-xl border transition-all text-left group cursor-pointer",
                              (!isCustomTutor && persona.id === p.id) 
                                ? "border-indigo-500 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-500" 
                                : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50"
                            )}
                          >
                            <div className={cn("w-10 h-10 shrink-0 rounded-xl flex items-center justify-center mt-0.5", p.color, (!isCustomTutor && persona.id === p.id) && "ring-2 ring-white")}>
                              {p.icon}
                            </div>
                            <div>
                              <span className={cn("block font-semibold text-base mb-1", (!isCustomTutor && persona.id === p.id) ? "text-indigo-900" : "text-slate-800")}>{p.name}</span>
                              <span className="block text-sm text-slate-500 leading-relaxed">{p.description}</span>
                            </div>
                          </button>
                        ))}

                        {/* Custom Tutor Option */}
                        <button
                          type="button"
                          onClick={() => setIsCustomTutor(true)}
                          className={cn(
                            "flex items-start gap-4 p-4 rounded-xl border transition-all text-left group cursor-pointer",
                            isCustomTutor
                              ? "border-indigo-500 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-500" 
                              : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50"
                          )}
                        >
                          <div className={cn("w-10 h-10 shrink-0 rounded-xl flex items-center justify-center mt-0.5 bg-slate-200 text-slate-700 text-xl", isCustomTutor && "ring-2 ring-white")}>
                            {customTutorEmoji}
                          </div>
                          <div>
                            <span className={cn("block font-semibold text-base mb-1", isCustomTutor ? "text-indigo-900" : "text-slate-800")}>Create Custom Tutor</span>
                            <span className="block text-sm text-slate-500 leading-relaxed">Design your own personalized AI assistant to match your exact learning needs.</span>
                          </div>
                        </button>
                      </div>

                      {/* Custom Tutor Editor */}
                      <AnimatePresence>
                        {isCustomTutor && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 overflow-hidden"
                          >
                            <div>
                              <label className="text-xs font-semibold text-slate-700 block mb-1">Tutor Emoji</label>
                              <div className="flex gap-2">
                                {['🤖', '👩‍🏫', '🧙‍♂️', '🐉', '🧠', '💡'].map(emoji => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => setCustomTutorEmoji(emoji)}
                                    className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all", customTutorEmoji === emoji ? "bg-indigo-200 ring-2 ring-indigo-500" : "bg-white border border-slate-200 hover:bg-slate-100")}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-slate-700 block mb-1">Tutor Name</label>
                              <input 
                                type="text" 
                                value={customTutorName}
                                onChange={(e) => setCustomTutorName(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-slate-700 block mb-1">Personality / Teaching Style</label>
                              <textarea 
                                value={customTutorDesc}
                                onChange={(e) => setCustomTutorDesc(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 h-20 resize-none"
                                placeholder="e.g. Sarcastic but helpful, speaks like Shakespeare..."
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-8">
                    <button 
                      type="button"
                      onClick={() => setOnboardingStep(0)}
                      className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-all cursor-pointer"
                    >
                      Back
                    </button>
                    <button 
                      type="button"
                      onClick={handleLaunchWorkspace}
                      disabled={!subject.trim()}
                      className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:hover:bg-indigo-600 shadow-md shadow-indigo-500/20 cursor-pointer"
                    >
                      <span>Enter Workspace</span>
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {onboardingStep === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="py-12 flex flex-col items-center justify-center space-y-6 text-center"
                >
                  <div className="relative w-20 h-20">
                    <motion.div 
                      animate={{ rotate: 360 }} 
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-indigo-600"
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
                      <BrainCircuit className="w-8 h-8" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Preparing your study workspace...</h3>
                    <p className="text-slate-500 font-medium">Readying {activePersona.name} for {subject || 'your curriculum'}</p>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Google Connected • Gemini Engine Active
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    ) : (
    <div className="h-[100dvh] overflow-hidden flex flex-col md:flex-row max-w-7xl mx-auto w-full p-4 gap-6">
      
      {/* Sidebar: Profile & Gamification */}
      <aside className="w-full md:w-80 flex flex-col gap-6 shrink-0 overflow-y-auto">
        
        {/* Header / Stats */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h1 className="font-display font-bold text-xl text-slate-900">Study With Me</h1>
              <p className="text-sm font-medium text-slate-500">AI Study Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100/50">
            <div className="w-10 h-10 rounded-xl bg-white border border-indigo-100 flex items-center justify-center text-xl shadow-sm">
              {studentAvatar}
            </div>
            <div>
              <p className="font-semibold text-slate-800 leading-tight">{studentName}</p>
              <p className="text-xs text-indigo-600 font-medium">{studentLevel}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col items-center">
              <Trophy className="w-6 h-6 text-amber-500 mb-2" />
              <span className="text-2xl font-bold font-display text-slate-800">{score}</span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Points</span>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col items-center">
              <Flame className={cn("w-6 h-6 mb-2", streak > 0 ? "text-rose-500" : "text-slate-300")} />
              <span className="text-2xl font-bold font-display text-slate-800">{streak}</span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Streak</span>
            </div>
          </div>
        </motion.div>

        {/* Configuration */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col gap-4"
        >
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Current Subject</label>
            <input 
              type="text" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              placeholder="e.g. Biology, History..."
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Tutor Persona</label>
            <div className="grid grid-cols-1 gap-2">
              {TUTOR_PERSONAS.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setPersona(p); setIsCustomTutor(false); }}
                  className={cn(
                    "flex flex-col gap-2 p-3 rounded-xl border transition-all text-left",
                    (!isCustomTutor && persona.id === p.id) 
                      ? "border-indigo-500 bg-indigo-50 shadow-sm" 
                      : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center", p.color)}>
                      {p.icon}
                    </span>
                    <span className={cn("font-semibold text-sm", (!isCustomTutor && persona.id === p.id) ? "text-indigo-900" : "text-slate-700")}>{p.name}</span>
                  </div>
                  {(!isCustomTutor && persona.id === p.id) && (
                    <span className="text-xs text-indigo-700/80 leading-relaxed font-medium">
                      {p.description}
                    </span>
                  )}
                </button>
              ))}
              <button
                onClick={() => setIsCustomTutor(true)}
                className={cn(
                  "flex flex-col gap-2 p-3 rounded-xl border transition-all text-left",
                  isCustomTutor
                    ? "border-indigo-500 bg-indigo-50 shadow-sm" 
                    : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-200 text-slate-700 text-lg">
                    {customTutorEmoji}
                  </span>
                  <span className={cn("font-semibold text-sm", isCustomTutor ? "text-indigo-900" : "text-slate-700")}>
                    {customTutorName || 'Custom Tutor'}
                  </span>
                </div>
                {isCustomTutor && (
                  <span className="text-xs text-indigo-700/80 leading-relaxed font-medium line-clamp-2">
                    {customTutorDesc}
                  </span>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Google Account & Engine Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex flex-col gap-3 mt-auto"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Authentication</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Gemini &amp; ChatGPT Active
            </span>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs shrink-0">
              <GoogleIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 truncate">{studentName || 'Ramon Williams'}</p>
              <p className="text-[11px] text-slate-500 font-mono truncate">{googleUser?.email || 'ramonwilliams09@gmail.com'}</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-0.5">
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> Google Authorized
            </span>
            <button
              onClick={() => setShowAccountModal(true)}
              className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline"
            >
              Account info
            </button>
          </div>
        </motion.div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {/* Top Navigation */}
        <div className="flex border-b border-slate-100 p-2 gap-2">
          <button 
            onClick={() => setActiveTab('chat')}
            className={cn(
              "flex-1 py-3 px-4 rounded-2xl text-sm font-semibold transition-all flex items-center justify-center gap-2",
              activeTab === 'chat' ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <Bot className="w-4 h-4" />
            Tutor Chat
          </button>
          <button 
            onClick={() => setActiveTab('challenge')}
            className={cn(
              "flex-1 py-3 px-4 rounded-2xl text-sm font-semibold transition-all flex items-center justify-center gap-2",
              activeTab === 'challenge' ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <Zap className="w-4 h-4" />
            Challenge Mode
          </button>
          <button 
            onClick={() => setActiveTab('quiz')}
            className={cn(
              "flex-1 py-3 px-4 rounded-2xl text-sm font-semibold transition-all flex items-center justify-center gap-2",
              activeTab === 'quiz' ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <Target className="w-4 h-4" />
            Gamified Quiz
          </button>
          <button 
            onClick={() => setActiveTab('notes')}
            className={cn(
              "flex-1 py-3 px-4 rounded-2xl text-sm font-semibold transition-all flex items-center justify-center gap-2",
              activeTab === 'notes' ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <FileText className="w-4 h-4" />
            Smart Notes
          </button>
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50">
          <AnimatePresence mode="wait">
            
            {(activeTab === 'chat' || activeTab === 'challenge') && (
              <motion.div 
                key={`chat-${activeTab}`}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col h-full"
              >
                {activeTab === 'challenge' && challengeMessages.length === 0 && (
                  <div className="text-center py-6 px-4 mb-4 bg-indigo-50/50 rounded-3xl border border-indigo-100">
                    <Zap className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
                    <h3 className="font-display font-bold text-lg text-slate-800">Ready for a Challenge?</h3>
                    <p className="text-slate-600 text-sm max-w-sm mx-auto">Say hello to start! Your tutor will ask you rapid-fire questions about {subject || 'the subject'}. Answer correctly to earn points and boost your streak!</p>
                  </div>
                )}
                
                <div className="flex-1 overflow-y-auto pr-2 pb-4 space-y-6">
                  {(activeTab === 'challenge' ? challengeMessages : messages).map((msg) => (
                    <motion.div 
                      key={msg.id} 
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.25 }}
                      className={cn("flex gap-4 max-w-[85%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto")}
                    >
                      <div className={cn(
                        "w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center border",
                        msg.role === 'user' ? "bg-slate-100 border-slate-200 text-slate-600 text-xl" : activePersona.color,
                        msg.role !== 'user' && activePersona.border
                      )}>
                        {msg.role === 'user' ? <span>{studentAvatar}</span> : activePersona.icon}
                      </div>
                      <div className={cn(
                        "p-4 rounded-3xl text-sm leading-relaxed",
                        msg.role === 'user' 
                          ? "bg-slate-800 text-white rounded-tr-sm" 
                          : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm"
                      )}>
                        {msg.role === 'user' ? (
                          msg.content
                        ) : (
                          <div className="markdown-body prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-50 prose-pre:border prose-pre:border-slate-100">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {isChatLoading && (
                    <motion.div 
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="flex gap-4 max-w-[85%] mr-auto"
                    >
                      <div className={cn("w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center border", activePersona.color, activePersona.border)}>
                        {activePersona.icon}
                      </div>
                      <div className="p-4 rounded-3xl bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Chat Input */}
                <div className="pt-4 shrink-0 mt-auto">
                  <div className="relative flex items-center bg-white border border-slate-200 rounded-full shadow-sm p-1">
                    <input 
                      type="text" 
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                      placeholder={activeTab === 'challenge' ? `Answer the question...` : `Ask ${activePersona.name} anything...`}
                      className="flex-1 bg-transparent px-4 py-3 text-sm font-medium focus:outline-none text-slate-700 placeholder-slate-400"
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={!input.trim() || isChatLoading}
                      className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-500 transition-colors"
                    >
                      <Send className="w-4 h-4 ml-0.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'quiz' && (
              <motion.div 
                key="quiz"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center w-full min-h-full py-4"
              >
                {!quizData && !quizLoading && (
                  <div className="text-center my-auto">
                    <div className="w-20 h-20 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Target className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-slate-800 mb-3">Ready to test your knowledge?</h2>
                    <p className="text-slate-500 mb-8 max-w-md mx-auto">Generate a quick 3-question quiz on <strong className="text-indigo-600">{subject}</strong> to earn points and keep your streak alive.</p>
                    <button 
                      onClick={handleStartQuiz}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
                    >
                      Start Quiz Let&apos;s Go!
                    </button>
                  </div>
                )}

                {quizLoading && (
                  <div className="flex flex-col items-center text-slate-400 gap-4 my-auto">
                    <BrainCircuit className="w-10 h-10 animate-pulse text-indigo-400" />
                    <p className="font-medium animate-pulse">Generating your custom challenge...</p>
                  </div>
                )}

                {quizData && quizData.length > 0 && currentQuestionIdx < quizData.length && (
                  <div className="w-full my-auto bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">
                        Question {currentQuestionIdx + 1} of {quizData.length}
                      </span>
                      <span className="text-sm font-semibold flex items-center gap-1 text-slate-500">
                        <Trophy className="w-4 h-4 text-amber-500"/> +50 pts per correct
                      </span>
                    </div>

                    <h3 className="text-xl font-medium text-slate-800 mb-8 leading-relaxed">
                      {quizData[currentQuestionIdx].question}
                    </h3>

                    <div className="grid gap-3">
                      {quizData[currentQuestionIdx].options.map((opt, i) => {
                        const isCorrectOpt = opt === quizData[currentQuestionIdx].correctAnswer;
                        const isSelected = selectedAnswer === opt;
                        
                        let btnStyle = "bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50";
                        if (isAnswerRevealed) {
                          if (isCorrectOpt) btnStyle = "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm";
                          else if (isSelected) btnStyle = "bg-rose-50 border-rose-400 text-rose-800";
                          else btnStyle = "bg-slate-50 border-slate-100 text-slate-400 opacity-50";
                        }

                        return (
                          <button
                            key={i}
                            onClick={() => handleAnswerSelect(opt)}
                            disabled={isAnswerRevealed}
                            className={cn(
                              "text-left p-4 rounded-2xl border-2 transition-all font-medium flex items-center justify-between group",
                              btnStyle
                            )}
                          >
                            <span>{opt}</span>
                            {isAnswerRevealed && isCorrectOpt && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                            {isAnswerRevealed && isSelected && !isCorrectOpt && <XCircle className="w-5 h-5 text-rose-500" />}
                          </button>
                        );
                      })}
                    </div>

                    <AnimatePresence>
                      {isAnswerRevealed && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                          className="overflow-hidden"
                        >
                          <div className={cn(
                            "p-5 rounded-2xl border flex gap-4",
                            selectedAnswer === quizData[currentQuestionIdx].correctAnswer 
                              ? "bg-emerald-50 border-emerald-100" 
                              : "bg-amber-50 border-amber-100"
                          )}>
                            <div className="shrink-0 pt-1">
                              {selectedAnswer === quizData[currentQuestionIdx].correctAnswer 
                                ? <Trophy className="w-6 h-6 text-emerald-600"/> 
                                : <Bot className="w-6 h-6 text-amber-600"/>}
                            </div>
                            <div>
                              <h4 className={cn(
                                "font-bold mb-1",
                                selectedAnswer === quizData[currentQuestionIdx].correctAnswer ? "text-emerald-800" : "text-amber-800"
                              )}>
                                {selectedAnswer === quizData[currentQuestionIdx].correctAnswer ? "Brilliant!" : "Not quite!"}
                              </h4>
                              <p className={cn(
                                "text-sm leading-relaxed",
                                selectedAnswer === quizData[currentQuestionIdx].correctAnswer ? "text-emerald-700" : "text-amber-700"
                              )}>
                                {quizData[currentQuestionIdx].explanation}
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={handleNextQuestion}
                            className="mt-6 w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                          >
                            {currentQuestionIdx < quizData.length - 1 ? 'Next Question' : 'Finish Quiz'}
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'notes' && (
              <motion.div 
                key="notes"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col h-full max-w-4xl mx-auto w-full gap-6"
              >
                {!activeSetId ? (
                  <>
                    <div className="bg-white rounded-3xl p-8 border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-linear-to-b from-white to-indigo-50/20 shadow-sm text-center my-auto transition-all">
                      <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xs">
                        <Upload className="w-8 h-8" />
                      </div>
                      <h2 className="text-xl font-bold text-slate-800 mb-2">Upload Lecture Notes or PDFs</h2>
                      <p className="text-slate-500 mb-6 max-w-md mx-auto text-sm leading-relaxed">
                        Upload your lecture notes, summaries, or PDF slide decks (.pdf, .txt, .md, .doc) to automatically extract key concepts and create interactive study flashcards.
                      </p>
                      
                      <label className="relative overflow-hidden cursor-pointer bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-8 py-4 rounded-xl font-bold transition-all inline-flex items-center gap-2.5 shadow-md shadow-indigo-600/25">
                        {uploading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Extracting &amp; Generating...</span>
                          </>
                        ) : (
                          <>
                            <File className="w-5 h-5" />
                            <span>Select Lecture Notes or PDF</span>
                          </>
                        )}
                        <input 
                          type="file" 
                          accept=".pdf,.txt,.md,.text,application/pdf,text/plain" 
                          className="hidden" 
                          disabled={uploading} 
                          onChange={handleFileUpload} 
                        />
                      </label>
                      <p className="text-xs text-slate-400 mt-4 font-medium">Supports PDFs, Lecture TXT, and Markdown files</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      {flashcardSets.map(set => (
                        <div
                          key={set.id}
                          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all text-left flex flex-col justify-between gap-3 group"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <h3 className="font-bold text-slate-800 text-base group-hover:text-indigo-600 transition-colors">{set.title}</h3>
                              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full shrink-0">
                                {set.cards?.length || 0} cards
                              </span>
                            </div>
                            <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{set.description}</p>
                          </div>
                          
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1">
                            <button
                              onClick={() => loadFlashcards(set.id)}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                            >
                              <span>Study Set</span>
                              <span>→</span>
                            </button>
                            <span className="text-[11px] text-slate-400 font-medium">Instant Load</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center min-h-full py-4">
                    <button 
                      onClick={() => setActiveSetId(null)}
                      className="mb-8 text-sm font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 self-start transition-colors"
                    >
                      ← Back to All Sets
                    </button>
                    
                    {flashcards.length > 0 ? (
                      <div className="w-full max-w-lg my-auto">
                        <div className="text-center mb-6">
                          <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">
                            Card {currentCardIdx + 1} of {flashcards.length}
                          </span>
                        </div>
                        
                        <div 
                          className="relative w-full aspect-[4/3] perspective-1000 cursor-pointer"
                          onClick={() => setIsFlipped(!isFlipped)}
                        >
                          <motion.div
                            className="w-full h-full relative preserve-3d transition-transform duration-500"
                            animate={{ rotateY: isFlipped ? 180 : 0 }}
                          >
                            {/* Front */}
                            <div className="absolute inset-0 w-full h-full bg-white rounded-3xl border border-slate-200 shadow-lg backface-hidden p-8 flex flex-col items-center overflow-y-auto text-center"><div className="my-auto flex flex-col items-center">
                              <span className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest">Front (Click to Flip)</span>
                              <h3 className="text-xl font-medium text-slate-800">{flashcards[currentCardIdx].front}</h3></div>
                            </div>
                            
                            {/* Back */}
                            <div className="absolute inset-0 w-full h-full bg-indigo-50 rounded-3xl border border-indigo-200 shadow-lg backface-hidden p-8 flex flex-col items-center overflow-y-auto text-center rotate-y-180"><div className="my-auto flex flex-col items-center">
                              <span className="text-xs font-bold text-indigo-400 mb-4 uppercase tracking-widest">Back (Click to Flip)</span>
                              <p className="text-lg font-medium text-indigo-900">{flashcards[currentCardIdx].back}</p></div>
                            </div>
                          </motion.div>
                        </div>
                        
                        <div className="flex gap-4 mt-8">
                          <button 
                            onClick={() => {
                              setCurrentCardIdx(prev => Math.max(0, prev - 1));
                              setIsFlipped(false);
                            }}
                            disabled={currentCardIdx === 0}
                            className="flex-1 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold transition-all disabled:opacity-50"
                          >
                            Previous
                          </button>
                          <button 
                            onClick={() => {
                              setCurrentCardIdx(prev => Math.min(flashcards.length - 1, prev + 1));
                              setIsFlipped(false);
                            }}
                            disabled={currentCardIdx === flashcards.length - 1}
                            className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                          >
                            Next Card
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-8 bg-white rounded-3xl border border-slate-200 max-w-sm">
                        <p className="text-slate-600 font-semibold mb-2">No cards in this set</p>
                        <p className="text-xs text-slate-400 mb-4">This deck does not contain flashcards yet.</p>
                        <button
                          onClick={() => setActiveSetId(null)}
                          className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Return to Sets
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
    )}

    {/* Google Account Details Modal */}
    <AnimatePresence>
      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                  <GoogleIcon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">Google Account Connected</h3>
              </div>
              <button
                onClick={() => setShowAccountModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-xs text-xl overflow-hidden">
                  {googleUser?.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={googleUser.photoURL} alt={googleUser.name} className="w-full h-full object-cover" />
                  ) : (
                    studentAvatar
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-sm truncate">{studentName || googleUser?.name || 'Ramon Williams'}</p>
                  <p className="text-xs text-slate-500 font-mono truncate">{googleUser?.email || 'ramonwilliams09@gmail.com'}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{studentLevel || 'College'} • {subject || 'General Studies'}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/70 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-medium">AI Engine Key</span>
                  <span className="font-semibold text-indigo-600 flex items-center gap-1">
                    {userApiKey ? 'User Gemini Key (BYOK)' : 'Server Gemini API'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={userApiKey}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      setUserApiKey(val);
                      if (val) localStorage.setItem('study_user_gemini_key', val);
                      else localStorage.removeItem('study_user_gemini_key');
                    }}
                    placeholder="Enter custom Gemini Key (AIzaSy...)"
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-semibold text-indigo-600 hover:underline shrink-0"
                  >
                    Get Key ↗
                  </a>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  setShowAccountModal(false);
                  setIsOnboarding(true);
                  setOnboardingStep(0);
                }}
                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <GoogleIcon className="w-4 h-4" />
                <span>Switch Google Account</span>
              </button>
              <button
                onClick={() => {
                  setShowAccountModal(false);
                  setIsOnboarding(true);
                  setOnboardingStep(1);
                }}
                className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Change Study Subject or Tutor Persona</span>
              </button>
              <button
                onClick={async () => {
                  await logoutGoogle();
                  localStorage.removeItem('study_google_user');
                  setIsGoogleSignedIn(false);
                  setGoogleUser({ name: '', email: '' });
                  setShowAccountModal(false);
                  setIsOnboarding(true);
                  setOnboardingStep(0);
                }}
                className="w-full py-2.5 px-4 text-red-600 hover:bg-red-50 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out of Google</span>
              </button>
              <button
                onClick={() => setShowAccountModal(false)}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDocs,
  onSnapshot,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// TODO: Replace the following configuration with your Firebase project details.
// Firebase console: https://console.firebase.google.com
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const ADMIN_EMAILS = ["admin@example.com"];

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const gameAvailabilityRef = doc(db, "settings", "gameAvailability");
let unsubscribeGameAvailability = null;

const translations = {
  en: {
    app: {
      title: "Millionaire Challenge",
      subtitle: "Rise through the prize ladder and claim the million!",
    },
    auth: {
      heading: "Join the game",
      description: "Create an account or sign in to sync your progress across devices.",
      registerTitle: "Register",
      loginTitle: "Login",
      displayName: "Display name",
      email: "Email",
      password: "Password",
      register: "Create account",
      login: "Sign in",
    },
    menu: {
      welcome: "Welcome back",
      logout: "Logout",
      start: "Start new game",
      resume: "Resume last session",
      admin: "Open administration panel",
      closed: "The game is currently closed. Please check back soon.",
    },
    game: {
      questionCounter: "Question",
      currentPrize: "Guaranteed prize",
      ladderTitle: "Prize ladder",
      walkAway: "Walk away",
      lifelines: {
        fifty: "50 : 50",
        audience: "Ask the audience",
        phone: "Phone a friend",
      },
      messages: {
        fetching: "Fetching questions…",
        noQuestions: "Not enough questions available for a full game.",
        correct: "Correct! You're climbing the ladder.",
        wrong: "Incorrect. You've fallen back to the last safe prize.",
        walkAway: "You walked away with",
        win: "Incredible! You're the Millionaire!",
        friend: "Your friend thinks the correct answer is",
        used: "This lifeline has already been used.",
        saved: "Game progress saved.",
        resumed: "Resuming your previous game session.",
      },
    },
    admin: {
      heading: "Question management",
      description: "Create, edit, and remove questions to curate the Millionaire experience.",
      level: "Question level (1-15)",
      difficulty: "Difficulty",
      questionEn: "Question (English)",
      questionAr: "Question (Arabic)",
      answersEn: "Answers (English)",
      answersAr: "Answers (Arabic)",
      correct: "Correct answer index",
      saveQuestion: "Save question",
      reset: "Reset form",
      back: "Back to menu",
      createSuccess: "Question saved successfully.",
      deleteSuccess: "Question deleted.",
      deleteConfirm: "Delete this question?",
      errorSave: "Unable to save the question. Please try again.",
      errorDelete: "Unable to delete the question. Please try again.",
      difficulties: {
        easy: "Easy",
        medium: "Medium",
        hard: "Hard",
      },
      empty: "No questions found. Use the form above to add one.",
      edit: "Edit",
      delete: "Delete",
      gameStatus: {
        title: "Game availability",
        description: "Control whether players can access the Millionaire challenge.",
        statusOpen: "Open to players",
        statusClosed: "Closed for maintenance",
        openAction: "Open game",
        closeAction: "Close game",
        saving: "Updating…",
        updated: "Game availability updated.",
        error: "Unable to update the game availability. Please try again.",
        lastUpdated: "Last updated",
        updatedBy: "by",
        unknownAdmin: "Unknown administrator",
      },
    },
    misc: {
      loading: "Loading…",
    },
  },
  ar: {
    app: {
      title: "تحدي المليونير",
      subtitle: "تدرّج عبر سلم الجوائز واصعد نحو المليون!",
    },
    auth: {
      heading: "انضم إلى اللعبة",
      description: "أنشئ حسابًا أو سجّل الدخول لمزامنة تقدمك على جميع الأجهزة.",
      registerTitle: "تسجيل جديد",
      loginTitle: "تسجيل الدخول",
      displayName: "اسم العرض",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      register: "إنشاء حساب",
      login: "دخول",
    },
    menu: {
      welcome: "مرحبًا بعودتك",
      logout: "تسجيل الخروج",
      start: "بدء لعبة جديدة",
      resume: "متابعة اللعبة السابقة",
      admin: "فتح لوحة الإدارة",
      closed: "اللعبة مغلقة حاليًا. نرجو معاودة المحاولة لاحقًا.",
    },
    game: {
      questionCounter: "السؤال",
      currentPrize: "الجائزة المضمونة",
      ladderTitle: "سلم الجوائز",
      walkAway: "الانسحاب بالجائزة",
      lifelines: {
        fifty: "٥٠ : ٥٠",
        audience: "اسأل الجمهور",
        phone: "اتصل بصديق",
      },
      messages: {
        fetching: "جاري جلب الأسئلة…",
        noQuestions: "لا توجد أسئلة كافية لإكمال لعبة كاملة.",
        correct: "إجابة صحيحة! أنت تقترب من القمة.",
        wrong: "إجابة خاطئة. عدتَ إلى آخر جائزة مضمونة.",
        walkAway: "انسحبت بالجائزة",
        win: "مذهل! لقد أصبحت مليونيرًا!",
        friend: "صديقك يعتقد أن الإجابة الصحيحة هي",
        used: "تم استخدام وسيلة المساعدة بالفعل.",
        saved: "تم حفظ تقدم اللعبة.",
        resumed: "جاري استئناف جلستك السابقة.",
      },
    },
    admin: {
      heading: "إدارة الأسئلة",
      description: "أنشئ الأسئلة وعدّلها واحذفها لتخصيص تجربة المليونير.",
      level: "مستوى السؤال (١-١٥)",
      difficulty: "درجة الصعوبة",
      questionEn: "السؤال (بالإنجليزية)",
      questionAr: "السؤال (بالعربية)",
      answersEn: "الإجابات (بالإنجليزية)",
      answersAr: "الإجابات (بالعربية)",
      correct: "خيار الإجابة الصحيحة",
      saveQuestion: "حفظ السؤال",
      reset: "إعادة ضبط النموذج",
      back: "العودة إلى القائمة",
      createSuccess: "تم حفظ السؤال بنجاح.",
      deleteSuccess: "تم حذف السؤال.",
      deleteConfirm: "هل تريد حذف هذا السؤال؟",
      errorSave: "تعذر حفظ السؤال. حاول مرة أخرى.",
      errorDelete: "تعذر حذف السؤال. حاول مرة أخرى.",
      difficulties: {
        easy: "سهل",
        medium: "متوسط",
        hard: "صعب",
      },
      empty: "لا توجد أسئلة. استخدم النموذج أعلاه لإضافة سؤال.",
      edit: "تعديل",
      delete: "حذف",
      gameStatus: {
        title: "حالة توفر اللعبة",
        description: "تحكم في إمكانية دخول اللاعبين إلى تجربة المليونير.",
        statusOpen: "مفتوحة للاعبين",
        statusClosed: "مغلقة للصيانة",
        openAction: "فتح اللعبة",
        closeAction: "إغلاق اللعبة",
        saving: "جاري التحديث…",
        updated: "تم تحديث حالة توفر اللعبة.",
        error: "تعذر تحديث حالة توفر اللعبة. حاول مرة أخرى.",
        lastUpdated: "آخر تحديث",
        updatedBy: "بواسطة",
        unknownAdmin: "مسؤول غير معروف",
      },
    },
    misc: {
      loading: "جاري التحميل…",
    },
  },
};

const prizeLadder = [
  { level: 1, amount: 100 },
  { level: 2, amount: 200 },
  { level: 3, amount: 300 },
  { level: 4, amount: 500 },
  { level: 5, amount: 1000 },
  { level: 6, amount: 2000 },
  { level: 7, amount: 4000 },
  { level: 8, amount: 8000 },
  { level: 9, amount: 16000 },
  { level: 10, amount: 32000 },
  { level: 11, amount: 64000 },
  { level: 12, amount: 125000 },
  { level: 13, amount: 250000 },
  { level: 14, amount: 500000 },
  { level: 15, amount: 1000000 },
];

const SAFE_LEVELS = new Set([5, 10, 15]);
const LOCAL_STORAGE_KEY_PREFIX = "millionaire-session-";

const elements = {
  sections: {
    auth: document.getElementById("auth-section"),
    menu: document.getElementById("menu-section"),
    game: document.getElementById("game-section"),
    admin: document.getElementById("admin-section"),
  },
  toast: document.getElementById("toast"),
  language: {
    en: document.getElementById("lang-en"),
    ar: document.getElementById("lang-ar"),
  },
  playerName: document.getElementById("player-name"),
  logout: document.getElementById("logout-btn"),
  startGame: document.getElementById("start-game-btn"),
  resumeGame: document.getElementById("resume-game-btn"),
  openAdmin: document.getElementById("open-admin-btn"),
  menuNotice: document.getElementById("game-availability"),
  questionCounter: document.getElementById("question-counter"),
  currentPrize: document.getElementById("current-prize"),
  questionText: document.getElementById("question-text"),
  answers: document.getElementById("answers"),
  ladder: document.getElementById("ladder"),
  lifelines: {
    fifty: document.getElementById("lifeline-5050"),
    audience: document.getElementById("lifeline-audience"),
    phone: document.getElementById("lifeline-phone"),
  },
  walkAway: document.getElementById("walk-away-btn"),
  registerForm: document.getElementById("register-form"),
  loginForm: document.getElementById("login-form"),
  admin: {
    form: document.getElementById("question-form"),
    reset: document.getElementById("reset-form"),
    list: document.getElementById("question-list"),
    level: document.getElementById("question-level"),
    difficulty: document.getElementById("question-difficulty"),
    questionEn: document.getElementById("question-en"),
    questionAr: document.getElementById("question-ar"),
    correctIndex: document.getElementById("correct-index"),
    id: document.getElementById("question-id"),
    back: document.getElementById("back-to-menu"),
    availabilityIndicator: document.getElementById("game-status-indicator"),
    availabilityMeta: document.getElementById("game-status-meta"),
    toggleAvailability: document.getElementById("toggle-game-status"),
  },
};
const state = {
  user: null,
  language: "en",
  game: null,
  answering: false,
  config: {
    gameOpen: true,
    updatedAt: null,
    updatedByName: null,
    updatedByEmail: null,
    updatedById: null,
  },
  audio: {
    intro: createAudio("assets/audio/intro.mp3"),
    question: createAudio("assets/audio/question.mp3"),
    final: createAudio("assets/audio/final-answer.mp3"),
    correct: createAudio("assets/audio/correct.mp3"),
    wrong: createAudio("assets/audio/wrong.mp3"),
  },
};

function createAudio(src) {
  const audio = new Audio(src);
  audio.preload = "none";
  audio.volume = 0.75;
  return audio;
}

function showToast(message) {
  if (!elements.toast) return;
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  setTimeout(() => {
    elements.toast.classList.remove("visible");
  }, 3000);
}

function translate(keyPath) {
  const keys = keyPath.split(".");
  let value = translations[state.language];
  for (const key of keys) {
    if (!value) break;
    value = value[key];
  }
  return value ?? keyPath;
}

function applyTranslations() {
  document.documentElement.lang = state.language;
  document.documentElement.dir = state.language === "ar" ? "rtl" : "ltr";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    const translation = translate(key);
    if (translation) {
      el.textContent = translation;
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    const translation = translate(key);
    if (translation && "placeholder" in el) {
      el.placeholder = translation;
    }
  });

  elements.language.en.classList.toggle("active", state.language === "en");
  elements.language.ar.classList.toggle("active", state.language === "ar");

  refreshGameStatusUI();

  if (state.game) {
    renderQuestion();
    updateGameHeader();
    renderLadder();
  }
}

function setLanguage(language) {
  if (state.language === language) return;
  state.language = language;
  localStorage.setItem("millionaire-language", language);
  applyTranslations();
}

function getLocale() {
  return state.language === "ar" ? "ar-EG" : "en-US";
}

function formatCurrency(amount) {
  const locale = getLocale();
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(date) {
  if (!date) return "";
  const locale = getLocale();
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch (error) {
    console.error("Failed to format date", error);
    return date.toLocaleString?.() ?? String(date);
  }
}

function refreshGameStatusUI() {
  const isOpen = Boolean(state.config.gameOpen);

  if (elements.startGame) {
    elements.startGame.disabled = !isOpen;
    elements.startGame.setAttribute("aria-disabled", String(!isOpen));
    if (!isOpen) {
      elements.startGame.title = translate("menu.closed");
    } else {
      elements.startGame.removeAttribute("title");
    }
  }

  if (elements.resumeGame) {
    elements.resumeGame.disabled = !isOpen;
    elements.resumeGame.setAttribute("aria-disabled", String(!isOpen));
    if (!isOpen) {
      elements.resumeGame.title = translate("menu.closed");
    } else {
      elements.resumeGame.removeAttribute("title");
    }
  }

  if (elements.menuNotice) {
    elements.menuNotice.textContent = translate("menu.closed");
    elements.menuNotice.classList.toggle("hidden", isOpen);
  }

  const indicator = elements.admin.availabilityIndicator;
  if (indicator) {
    indicator.dataset.status = isOpen ? "open" : "closed";
    const key = isOpen
      ? "admin.gameStatus.statusOpen"
      : "admin.gameStatus.statusClosed";
    indicator.textContent = translate(key);
  }

  const toggleButton = elements.admin.toggleAvailability;
  if (toggleButton) {
    const isLoading = toggleButton.dataset.loading === "true";
    const canManage = Boolean(state.user && ADMIN_EMAILS.includes(state.user.email));
    toggleButton.disabled = isLoading || !canManage;
    if (isLoading) {
      toggleButton.textContent = translate("admin.gameStatus.saving");
    } else {
      const actionKey = isOpen
        ? "admin.gameStatus.closeAction"
        : "admin.gameStatus.openAction";
      toggleButton.textContent = translate(actionKey);
    }
    if (!canManage) {
      toggleButton.title = translate("admin.gameStatus.description");
    } else {
      toggleButton.removeAttribute("title");
    }
  }

  const meta = elements.admin.availabilityMeta;
  if (meta) {
    const { updatedAt, updatedByName, updatedByEmail, updatedById } = state.config;
    if (updatedAt) {
      const formatted = formatDateTime(updatedAt);
      const by =
        updatedByName ||
        updatedByEmail ||
        updatedById ||
        translate("admin.gameStatus.unknownAdmin");
      meta.textContent = `${translate("admin.gameStatus.lastUpdated")} ${formatted} ${translate(
        "admin.gameStatus.updatedBy"
      )} ${by}`;
    } else {
      meta.textContent = "";
    }
  }
}

function initGameStatusListener() {
  if (typeof unsubscribeGameAvailability === "function") {
    unsubscribeGameAvailability();
  }

  unsubscribeGameAvailability = onSnapshot(
    gameAvailabilityRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        state.config.gameOpen = data.isOpen !== false;
        const updatedAt = data.updatedAt;
        state.config.updatedAt =
          updatedAt && typeof updatedAt.toDate === "function"
            ? updatedAt.toDate()
            : updatedAt
            ? new Date(updatedAt)
            : null;
        state.config.updatedByName = data.updatedByName || null;
        state.config.updatedByEmail = data.updatedByEmail || null;
        state.config.updatedById = data.updatedBy || null;
      } else {
        state.config.gameOpen = true;
        state.config.updatedAt = null;
        state.config.updatedByName = null;
        state.config.updatedByEmail = null;
        state.config.updatedById = null;
      }
      refreshGameStatusUI();
    },
    (error) => {
      console.error("Failed to observe game availability", error);
    }
  );
}

async function toggleGameAvailability() {
  if (!state.user) return;
  if (!ADMIN_EMAILS.includes(state.user.email)) return;

  const button = elements.admin.toggleAvailability;
  if (!button || button.dataset.loading === "true") return;

  button.dataset.loading = "true";
  refreshGameStatusUI();

  try {
    await setDoc(
      gameAvailabilityRef,
      {
        isOpen: !state.config.gameOpen,
        updatedAt: serverTimestamp(),
        updatedBy: state.user.uid || null,
        updatedByEmail: state.user.email || null,
        updatedByName: state.user.displayName || null,
      },
      { merge: true }
    );
    state.config.gameOpen = !state.config.gameOpen;
    state.config.updatedAt = new Date();
    state.config.updatedByName = state.user.displayName || null;
    state.config.updatedByEmail = state.user.email || null;
    state.config.updatedById = state.user.uid || null;
    showToast(translate("admin.gameStatus.updated"));
  } catch (error) {
    console.error("Failed to update game availability", error);
    showToast(translate("admin.gameStatus.error"));
  } finally {
    button.dataset.loading = "false";
    refreshGameStatusUI();
  }
}

function showSection(sectionName) {
  Object.entries(elements.sections).forEach(([name, el]) => {
    el.classList.toggle("hidden", name !== sectionName);
  });
}

function getSessionKey(userId) {
  return `${LOCAL_STORAGE_KEY_PREFIX}${userId}`;
}

function saveGameState(showNotification = false) {
  if (!state.user || !state.game) return;
  const session = {
    ...state.game,
    timestamp: Date.now(),
  };
  localStorage.setItem(getSessionKey(state.user.uid), JSON.stringify(session));
  if (elements.resumeGame) {
    elements.resumeGame.classList.remove("hidden");
  }
  if (showNotification) {
    showToast(translate("game.messages.saved"));
  }
}

function loadSavedGame(userId) {
  const raw = localStorage.getItem(getSessionKey(userId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (error) {
    console.error("Failed to parse saved game", error);
    return null;
  }
}

function clearSavedGame(userId) {
  localStorage.removeItem(getSessionKey(userId));
}

function buildGameSkeleton() {
  const answersFragment = document.createDocumentFragment();
  ["A", "B", "C", "D"].forEach((label, index) => {
    const answer = document.createElement("div");
    answer.className = "answer";
    answer.dataset.index = String(index);
    const badge = document.createElement("span");
    badge.textContent = label;
    const text = document.createElement("span");
    text.className = "answer-text";
    answer.append(badge, text);
    answersFragment.appendChild(answer);
  });
  elements.answers.innerHTML = "";
  elements.answers.appendChild(answersFragment);

  renderLadder();
}

function renderLadder() {
  elements.ladder.innerHTML = "";
  const fragment = document.createDocumentFragment();
  const currentLevel = state.game ? state.game.currentIndex + 1 : 0;

  [...prizeLadder].reverse().forEach(({ level, amount }) => {
    const ladderItem = document.createElement("div");
    ladderItem.className = "ladder-item";
    if (SAFE_LEVELS.has(level)) {
      ladderItem.classList.add("safe");
    }
    if (level === currentLevel) {
      ladderItem.classList.add("active");
    }
    ladderItem.dataset.level = String(level);

    const label = document.createElement("span");
    label.textContent = `${level}`;
    const value = document.createElement("span");
    value.textContent = formatCurrency(amount);
    ladderItem.append(label, value);
    fragment.appendChild(ladderItem);
  });

  elements.ladder.appendChild(fragment);
}

function updateGameHeader() {
  if (!state.game) return;
  const { currentIndex, safePrize } = state.game;
  const counter = `${currentIndex + 1} / ${prizeLadder.length}`;
  elements.questionCounter.textContent = `${translate("game.questionCounter")} ${counter}`;
  elements.currentPrize.textContent = formatCurrency(safePrize);
}

function resetLifelines() {
  if (!state.game) return;
  state.game.lifelines = {
    fifty: false,
    audience: false,
    phone: false,
  };
  state.game.fiftyFifty = null;
  Object.values(elements.lifelines).forEach((button) => {
    button.disabled = false;
  });
}

function applyLifelineState() {
  if (!state.game || !state.game.lifelines) return;
  Object.entries(elements.lifelines).forEach(([key, button]) => {
    button.disabled = !!state.game.lifelines[key];
  });

  if (
    state.game.lifelines.fifty &&
    state.game.fiftyFifty &&
    state.game.fiftyFifty.index === state.game.currentIndex &&
    Array.isArray(state.game.fiftyFifty.removed)
  ) {
    state.game.fiftyFifty.removed.forEach((index) => {
      const answerEl = elements.answers.querySelector(`.answer[data-index="${index}"]`);
      if (answerEl) {
        answerEl.classList.add("hidden");
      }
    });
  }
}

function renderQuestion() {
  if (!state.game) return;
  const question = state.game.questions[state.game.currentIndex];
  if (!question) return;

  elements.questionText.textContent =
    state.language === "ar"
      ? question.question.ar || question.question.en
      : question.question.en;

  const answers = elements.answers.querySelectorAll(".answer");
  answers.forEach((answerEl) => {
    answerEl.classList.remove("active", "correct", "wrong", "disabled", "hidden");
    answerEl.style.display = "flex";
    const index = Number(answerEl.dataset.index);
    const answer = question.answers[index];
    const text = state.language === "ar" ? answer?.ar || answer?.en : answer?.en;
    const textContainer = answerEl.querySelector(".answer-text");
    textContainer.textContent = text ?? "";
  });

  applyLifelineState();
  updateGameHeader();
}

function playAudio(name) {
  const clip = state.audio[name];
  if (!clip) return;
  try {
    clip.currentTime = 0;
    clip.play();
  } catch (error) {
    console.warn(`Unable to play audio ${name}`, error);
  }
}

function calculateSafePrize(level) {
  const safeLevel = [...SAFE_LEVELS]
    .filter((safe) => safe <= level)
    .sort((a, b) => b - a)[0];
  return safeLevel ? prizeLadder[safeLevel - 1].amount : 0;
}

async function recordGameResult(result) {
  if (!state.user) return;
  try {
    await addDoc(collection(db, "games"), {
      userId: state.user.uid,
      userName: state.user.displayName || state.user.email,
      prize: result.prize,
      levelReached: result.level,
      status: result.status,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to store game result", error);
  }
}

function handleAnswerSelection(index) {
  if (!state.game || state.answering) return;
  const question = state.game.questions[state.game.currentIndex];
  if (!question) return;

  state.answering = true;
  const answers = elements.answers.querySelectorAll(".answer");
  answers.forEach((el) => (el.classList.add("disabled")));
  const selected = elements.answers.querySelector(`.answer[data-index="${index}"]`);
  if (selected) {
    selected.classList.add("active");
  }

  playAudio("final");

  setTimeout(() => {
    const isCorrect = index === question.correctIndex;
    if (isCorrect) {
      if (selected) selected.classList.add("correct");
      playAudio("correct");
      showToast(translate("game.messages.correct"));
      state.game.currentIndex += 1;
      state.game.fiftyFifty = null;
      const level = state.game.currentIndex;
      state.game.safePrize = calculateSafePrize(level);
      state.game.lastPrize = prizeLadder[level - 1]?.amount || state.game.safePrize;

      if (state.game.currentIndex >= state.game.questions.length) {
        endGame({ status: "win", prize: prizeLadder[prizeLadder.length - 1].amount, level });
        return;
      }

      setTimeout(() => {
        renderQuestion();
        renderLadder();
        state.answering = false;
        playAudio("question");
        saveGameState();
        enableAnswers();
      }, 1500);
    } else {
      if (selected) selected.classList.add("wrong");
      const correctEl = elements.answers.querySelector(
        `.answer[data-index="${question.correctIndex}"]`
      );
      if (correctEl) correctEl.classList.add("correct");
      playAudio("wrong");
      showToast(translate("game.messages.wrong"));
      setTimeout(() => {
        endGame({
          status: "lost",
          prize: state.game.safePrize,
          level: state.game.currentIndex + 1,
        });
      }, 1800);
    }
  }, 2200);
}

function enableAnswers() {
  elements.answers.querySelectorAll(".answer").forEach((el) => {
    el.classList.remove("disabled", "active", "correct", "wrong");
  });
  state.answering = false;
}

function endGame({ status, prize, level }) {
  state.answering = false;
  if (status === "win") {
    showToast(translate("game.messages.win"));
  } else if (status === "walk-away") {
    showToast(`${translate("game.messages.walkAway")} ${formatCurrency(prize)}`);
  }

  recordGameResult({ status, prize, level });
  clearSavedGame(state.user.uid);
  state.game = null;
  renderLadder();
  showSection("menu");
  if (state.user) {
    updateMenuForUser(state.user);
  }
}

async function fetchQuestions() {
  try {
    const q = query(collection(db, "questions"), orderBy("level"));
    const snapshot = await getDocs(q);
    const questions = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const answers = Array.isArray(data.answers) ? data.answers.slice(0, 4) : [];
      return {
        id: docSnap.id,
        level: Number(data.level) || 0,
        difficulty: data.difficulty || "easy",
        question: data.question || { en: "", ar: "" },
        answers: answers.map((answer) => ({ en: answer?.en || "", ar: answer?.ar || "" })),
        correctIndex: typeof data.correctIndex === "number" ? data.correctIndex : 0,
      };
    });
    return questions;
  } catch (error) {
    console.error("Failed to fetch questions", error);
    showToast(translate("game.messages.noQuestions"));
    return [];
  }
}

async function startGame() {
  if (!state.config.gameOpen) {
    showToast(translate("menu.closed"));
    return;
  }
  showSection("game");
  playAudio("intro");
  state.answering = false;

  showToast(translate("game.messages.fetching"));
  const questions = await fetchQuestions();
  const ordered = questions
    .filter((q) => q.level >= 1 && q.level <= prizeLadder.length)
    .sort((a, b) => a.level - b.level);

  if (ordered.length < prizeLadder.length) {
    showToast(translate("game.messages.noQuestions"));
    showSection("menu");
    return;
  }

  const selected = ordered.slice(0, prizeLadder.length);

  state.game = {
    questions: selected,
    currentIndex: 0,
    lifelines: {
      fifty: false,
      audience: false,
      phone: false,
    },
    safePrize: 0,
    lastPrize: 0,
    fiftyFifty: null,
  };

  buildGameSkeleton();
  resetLifelines();
  enableAnswers();
  renderQuestion();
  renderLadder();
  applyLifelineState();
  playAudio("question");
  saveGameState();
}

function resumeSavedGame() {
  if (!state.user) return;
  if (!state.config.gameOpen) {
    showToast(translate("menu.closed"));
    return;
  }
  const saved = loadSavedGame(state.user.uid);
  if (!saved) return;
  state.game = saved;
  buildGameSkeleton();
  enableAnswers();
  renderQuestion();
  renderLadder();
  applyLifelineState();
  showSection("game");
  playAudio("question");
  showToast(translate("game.messages.resumed"));
}

function applyFiftyFifty() {
  if (!state.game) return;
  if (state.game.lifelines.fifty) {
    showToast(translate("game.messages.used"));
    return;
  }
  const question = state.game.questions[state.game.currentIndex];
  const wrongIndices = [0, 1, 2, 3].filter((i) => i !== question.correctIndex);
  const removed = shuffleArray(wrongIndices).slice(0, 2);
  state.game.lifelines.fifty = true;
  state.game.fiftyFifty = { index: state.game.currentIndex, removed };
  elements.lifelines.fifty.disabled = true;

  removed.forEach((index) => {
    const answerEl = elements.answers.querySelector(`.answer[data-index="${index}"]`);
    if (answerEl) {
      answerEl.classList.add("hidden");
    }
  });
  saveGameState();
}

function applyAudienceHelp() {
  if (!state.game) return;
  if (state.game.lifelines.audience) {
    showToast(translate("game.messages.used"));
    return;
  }
  state.game.lifelines.audience = true;
  elements.lifelines.audience.disabled = true;

  const question = state.game.questions[state.game.currentIndex];
  const base = [25, 25, 25, 25];
  base[question.correctIndex] += 25;
  const distribution = generateAudienceDistribution(base, question.correctIndex);
  const formatted = distribution
    .map((value, index) => `${String.fromCharCode(65 + index)}: ${value}%`)
    .join(" | ");
  showToast(formatted);
  saveGameState();
}

function generateAudienceDistribution(base, correctIndex) {
  const randomised = base.map((value, index) => {
    const bias = index === correctIndex ? 15 : 0;
    return Math.max(5, Math.round(value + bias + (Math.random() * 20 - 10)));
  });
  const total = randomised.reduce((sum, value) => sum + value, 0);
  let distribution = randomised.map((value) => Math.round((value / total) * 100));
  let diff = 100 - distribution.reduce((sum, value) => sum + value, 0);
  let i = 0;
  while (diff !== 0 && i < 100) {
    const targetIndex = diff > 0 ? correctIndex : i % distribution.length;
    if (diff > 0) {
      distribution[targetIndex] += 1;
      diff -= 1;
    } else if (distribution[targetIndex] > 0) {
      distribution[targetIndex] -= 1;
      diff += 1;
    }
    i += 1;
  }
  return distribution;
}

function applyPhoneAFriend() {
  if (!state.game) return;
  if (state.game.lifelines.phone) {
    showToast(translate("game.messages.used"));
    return;
  }
  state.game.lifelines.phone = true;
  elements.lifelines.phone.disabled = true;

  const question = state.game.questions[state.game.currentIndex];
  const answerLetter = String.fromCharCode(65 + question.correctIndex);
  showToast(`${translate("game.messages.friend")} ${answerLetter}`);
  saveGameState();
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function upsertQuestion(event) {
  event.preventDefault();
  const questionId = elements.admin.id.value || null;
  const level = Number(elements.admin.level.value);
  const difficulty = elements.admin.difficulty.value;
  const questionEn = elements.admin.questionEn.value.trim();
  const questionAr = elements.admin.questionAr.value.trim();
  const correctIndex = Number(elements.admin.correctIndex.value);

  const answersEn = Array.from(document.querySelectorAll("[data-option-en]"), (input) => input.value.trim());
  const answersAr = Array.from(document.querySelectorAll("[data-option-ar]"), (input) => input.value.trim());

  const payload = {
    level,
    difficulty,
    question: { en: questionEn, ar: questionAr },
    answers: answersEn.map((en, index) => ({ en, ar: answersAr[index] })),
    correctIndex,
    updatedAt: serverTimestamp(),
  };

  try {
    if (questionId) {
      await updateDoc(doc(db, "questions", questionId), payload);
    } else {
      await addDoc(collection(db, "questions"), {
        ...payload,
        createdAt: serverTimestamp(),
        createdBy: state.user?.uid || null,
      });
    }
    showToast(translate("admin.createSuccess"));
    elements.admin.form.reset();
    elements.admin.id.value = "";
    loadAdminQuestions();
  } catch (error) {
    console.error("Failed to save question", error);
    showToast(translate("admin.errorSave"));
  }
}

async function loadAdminQuestions() {
  elements.admin.list.innerHTML = `<p>${translate("misc.loading")}</p>`;
  const questions = await fetchQuestions();
  if (!questions.length) {
    elements.admin.list.innerHTML = `<p>${translate("admin.empty")}</p>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  questions.forEach((question) => {
    const card = document.createElement("div");
    card.className = "question-card";

    const header = document.createElement("header");
    const title = document.createElement("h4");
    title.textContent = `${translate("game.questionCounter")} ${question.level}`;
    const actions = document.createElement("div");
    const editButton = document.createElement("button");
    editButton.textContent = translate("admin.edit");
    editButton.className = "secondary";
    editButton.addEventListener("click", () => populateQuestionForm(question));

    const deleteButton = document.createElement("button");
    deleteButton.textContent = translate("admin.delete");
    deleteButton.className = "danger";
    deleteButton.addEventListener("click", () => deleteQuestion(question.id));
    actions.append(editButton, deleteButton);

    header.append(title, actions);

    const english = document.createElement("p");
    const englishText = question.question?.en ?? "";
    const arabicText = question.question?.ar ?? "";
    english.textContent = englishText;
    const arabic = document.createElement("p");
    arabic.textContent = arabicText || englishText;

    const answers = document.createElement("div");
    question.answers.forEach((answer, index) => {
      const pill = document.createElement("span");
      pill.className = "option-pill";
      const answerEn = answer?.en ?? "";
      const answerAr = answer?.ar ?? "";
      pill.textContent = `${String.fromCharCode(65 + index)}. ${answerEn} / ${answerAr || answerEn}`;
      if (index === question.correctIndex) {
        pill.style.borderColor = "var(--success)";
        pill.style.color = "var(--success)";
      }
      answers.appendChild(pill);
    });

    card.append(header, english, arabic, answers);
    fragment.appendChild(card);
  });

  elements.admin.list.innerHTML = "";
  elements.admin.list.appendChild(fragment);
}

function populateQuestionForm(question) {
  elements.admin.id.value = question.id;
  elements.admin.level.value = question.level;
  elements.admin.difficulty.value = question.difficulty;
  elements.admin.questionEn.value = question.question.en;
  elements.admin.questionAr.value = question.question.ar;
  elements.admin.correctIndex.value = question.correctIndex;

  document.querySelectorAll("[data-option-en]").forEach((input) => {
    const index = Number(input.dataset.optionEn);
    input.value = question.answers[index]?.en ?? "";
  });
  document.querySelectorAll("[data-option-ar]").forEach((input) => {
    const index = Number(input.dataset.optionAr);
    input.value = question.answers[index]?.ar ?? "";
  });
}

async function deleteQuestion(id) {
  if (!confirm(translate("admin.deleteConfirm"))) return;
  try {
    await deleteDoc(doc(db, "questions", id));
    showToast(translate("admin.deleteSuccess"));
    loadAdminQuestions();
  } catch (error) {
    console.error("Failed to delete question", error);
    showToast(translate("admin.errorDelete"));
  }
}

async function registerUser(event) {
  event.preventDefault();
  const formData = new FormData(elements.registerForm);
  const displayName = formData.get("displayName");
  const email = formData.get("email");
  const password = formData.get("password");

  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(credential.user, { displayName });
    }
    await setDoc(doc(db, "users", credential.user.uid), {
      displayName: displayName || "",
      email,
      createdAt: serverTimestamp(),
    });
    elements.registerForm.reset();
  } catch (error) {
    console.error("Registration error", error);
    showToast(error.message);
  }
}

async function loginUser(event) {
  event.preventDefault();
  const formData = new FormData(elements.loginForm);
  const email = formData.get("email");
  const password = formData.get("password");
  try {
    await signInWithEmailAndPassword(auth, email, password);
    elements.loginForm.reset();
  } catch (error) {
    console.error("Login error", error);
    showToast(error.message);
  }
}

function updateMenuForUser(user) {
  elements.playerName.textContent = user.displayName || user.email;
  const saved = loadSavedGame(user.uid);
  elements.resumeGame.classList.toggle("hidden", !saved);
  const isAdmin = ADMIN_EMAILS.includes(user.email);
  elements.openAdmin.classList.toggle("hidden", !isAdmin);
  refreshGameStatusUI();
}

function onAuthChange(user) {
  state.user = user;
  if (user) {
    showSection("menu");
    updateMenuForUser(user);
  } else {
    showSection("auth");
    elements.playerName.textContent = "";
    elements.openAdmin.classList.add("hidden");
    elements.resumeGame.classList.add("hidden");
    state.game = null;
  }
  refreshGameStatusUI();
}

function initEventListeners() {
  elements.language.en.addEventListener("click", () => setLanguage("en"));
  elements.language.ar.addEventListener("click", () => setLanguage("ar"));

  elements.logout.addEventListener("click", () => signOut(auth));
  elements.startGame.addEventListener("click", () => startGame());
  elements.resumeGame.addEventListener("click", () => resumeSavedGame());
  elements.openAdmin.addEventListener("click", () => {
    showSection("admin");
    refreshGameStatusUI();
    loadAdminQuestions();
  });

  elements.registerForm.addEventListener("submit", registerUser);
  elements.loginForm.addEventListener("submit", loginUser);

  elements.walkAway.addEventListener("click", () => {
    if (!state.game) return;
    const prize = state.game.lastPrize || state.game.safePrize;
    endGame({ status: "walk-away", prize, level: state.game.currentIndex + 1 });
  });

  Object.values(elements.lifelines).forEach((button) => {
    button.addEventListener("click", (event) => {
      switch (event.target.id) {
        case "lifeline-5050":
          applyFiftyFifty();
          break;
        case "lifeline-audience":
          applyAudienceHelp();
          break;
        case "lifeline-phone":
          applyPhoneAFriend();
          break;
        default:
      }
    });
  });

  elements.answers.addEventListener("click", (event) => {
    const target = event.target.closest(".answer");
    if (!target) return;
    const index = Number(target.dataset.index);
    handleAnswerSelection(index);
  });

  elements.admin.form.addEventListener("submit", upsertQuestion);
  elements.admin.reset.addEventListener("click", () => {
    elements.admin.form.reset();
    elements.admin.id.value = "";
  });
  if (elements.admin.toggleAvailability) {
    elements.admin.toggleAvailability.addEventListener("click", toggleGameAvailability);
  }
  if (elements.admin.back) {
    elements.admin.back.addEventListener("click", () => {
      showSection("menu");
      if (state.user) {
        updateMenuForUser(state.user);
      }
    });
  }
}

function restoreLanguage() {
  const stored = localStorage.getItem("millionaire-language");
  if (stored === "en" || stored === "ar") {
    state.language = stored;
  }
  applyTranslations();
}

function setupPlaceholders() {
  document
    .querySelectorAll("input[data-option-en]")
    .forEach((input, index) => {
      input.dataset.i18nPlaceholder = `admin.answerLabelEn${index}`;
    });
  document
    .querySelectorAll("input[data-option-ar]")
    .forEach((input, index) => {
      input.dataset.i18nPlaceholder = `admin.answerLabelAr${index}`;
    });
}

function extendTranslations() {
  const labelsEn = ["Answer A", "Answer B", "Answer C", "Answer D"];
  const labelsAr = ["الإجابة أ", "الإجابة ب", "الإجابة ج", "الإجابة د"];
  labelsEn.forEach((text, index) => {
    translations.en.admin[`answerLabelEn${index}`] = text;
    translations.ar.admin[`answerLabelEn${index}`] = text;
  });
  labelsAr.forEach((text, index) => {
    translations.en.admin[`answerLabelAr${index}`] = text;
    translations.ar.admin[`answerLabelAr${index}`] = text;
  });
}

function init() {
  extendTranslations();
  setupPlaceholders();
  restoreLanguage();
  buildGameSkeleton();
  initEventListeners();
  initGameStatusListener();

  onAuthStateChanged(auth, onAuthChange);
}

init();

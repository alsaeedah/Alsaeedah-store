import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, LogIn, UserCircle2 } from 'lucide-react';
import logo from '../assets/logo.png';
import onboardingSlides from '../data/onboardingData';
import './Onboarding.css';

/* ─── Animation Variants ─── */
const slideVariants = {
  enter: (dir) => ({
    x: dir > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.38, ease: [0.4, 0, 0.2, 1] },
  },
  exit: (dir) => ({
    x: dir > 0 ? '-100%' : '100%',
    opacity: 0,
    transition: { duration: 0.32, ease: [0.4, 0, 0.2, 1] },
  }),
};

const fadeUpVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1], delay },
  }),
};

const scaleVariants = {
  hidden: { opacity: 0, scale: 0.82 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] },
  },
};

/* ─── Constants ─── */
// Screen indices: 0 = welcome, 1-5 = slides, 6 = final
const WELCOME  = 0;
const FINAL    = 6;
const TOTAL    = FINAL + 1; // 7 screens total

/* ─────────────────────────────────────────────
   OnboardingFlow — Main Orchestrator
───────────────────────────────────────────── */
export default function OnboardingFlow({ onComplete, onLogin }) {
  const [screen, setScreen]     = useState(WELCOME);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [dragStart, setDragStart] = useState(null);

  // (Auto-advance removed per user request, user must explicitly click "Start Exploring")

  /* ── Navigate helpers ── */
  const goTo = useCallback((target) => {
    if (target === screen) return;
    setDirection(target > screen ? 1 : -1);
    setScreen(target);
  }, [screen]);

  const goNext = useCallback(() => {
    if (screen < FINAL) goTo(screen + 1);
  }, [screen, goTo]);

  const goSkip = useCallback(() => {
    goTo(FINAL);
  }, [goTo]);

  const goBack = useCallback(() => {
    if (screen > 1) goTo(screen - 1);
  }, [screen, goTo]);

  /* ── Mark onboarding completed ── */
  const complete = useCallback((openLogin = false) => {
    localStorage.setItem('onboardingCompleted', 'true');
    if (openLogin) {
      onLogin?.();  // Trigger the AuthModal via parent
    }
    onComplete();  // Unmount onboarding
  }, [onComplete, onLogin]);

  /* ── Swipe gesture handling ── */
  const handleDragStart = (e) => {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    setDragStart(x);
  };

  const handleDragEnd = (e) => {
    if (dragStart === null) return;
    const x = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const delta = dragStart - x; // positive = swipe left = forward
    if (Math.abs(delta) > 50) {
      if (delta > 0 && screen < FINAL) goNext();
      else if (delta < 0 && screen > WELCOME) goTo(screen - 1);
    }
    setDragStart(null);
  };

  /* ── Dot indicator dots ── */
  const dots = onboardingSlides.map((_, i) => i + 1); // slide screens 1-5

  return (
    <div
      className="onboarding-root"
      onTouchStart={handleDragStart}
      onTouchEnd={handleDragEnd}
    >
      {/* Ambient glow orbs */}
      <div className="onboarding-glow onboarding-glow-top" />
      <div className="onboarding-glow onboarding-glow-bottom" />

      {/* Static Skip Button */}
      {screen >= 1 && screen <= 5 && (
        <motion.button 
          className="onboarding-skip" 
          onClick={goSkip}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          تخطي
        </motion.button>
      )}

      <AnimatePresence mode="wait" custom={direction}>

        {/* ═══════════════ WELCOME SCREEN ═══════════════ */}
        {screen === WELCOME && (
          <motion.div
            key="welcome"
            className="onboarding-slide"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            style={{ position: 'absolute', inset: 0, zIndex: 1 }}
          >
            <div className="onboarding-welcome">
              {/* Logo */}
              <motion.div
                variants={scaleVariants}
                initial="hidden"
                animate="visible"
              >
                <img
                  src={logo}
                  alt="Time Tech Logo"
                  className="onboarding-welcome-logo"
                />
              </motion.div>

              {/* Badge */}
              <motion.div
                className="onboarding-welcome-badge"
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
                custom={0.15}
              >
                ✨ &nbsp; متجرك للساعات الفاخرة
              </motion.div>

              {/* Title */}
              <motion.h1
                className="onboarding-welcome-title"
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
                custom={0.25}
              >
                مرحباً بك في
                <span>متجر السعيدة</span>
              </motion.h1>

              <div className="onboarding-divider" />

              {/* Subtitle */}
              <motion.p
                className="onboarding-welcome-subtitle"
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
                custom={0.35}
              >
                وجهتك الأولى لأرقى الساعات العالمية — بأسلوب عصري وتجربة تسوق استثنائية
              </motion.p>

              {/* CTA */}
              <motion.button
                className="onboarding-welcome-cta"
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
                custom={0.48}
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                ابدأ الاستكشاف
                <ChevronRight size={20} strokeWidth={2.5} />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ═══════════════ SLIDES 1 – 5 ═══════════════ */}
        {screen >= 1 && screen <= 5 && (
          <motion.div
            key={`slide-${screen}`}
            className="onboarding-slide onboarding-dynamic-content"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            style={{ position: 'absolute', inset: 0, zIndex: 1 }}
          >
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1], delay: 0.05 }}
            >
              <div className="onboarding-image-wrapper">
                <img
                  src={onboardingSlides[screen - 1].image}
                  alt={onboardingSlides[screen - 1].title}
                  className="onboarding-slide-image"
                  draggable={false}
                />
              </div>
            </motion.div>

            {/* Text */}
            <motion.div
              className="onboarding-text-block"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: 0.12 }}
            >
              <h2 className="onboarding-slide-title">
                {onboardingSlides[screen - 1].title}
              </h2>
              <p className="onboarding-slide-description">
                {onboardingSlides[screen - 1].description}
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* ═══════════════ FINAL ACTION SCREEN ═══════════════ */}
        {screen === FINAL && (
          <motion.div
            key="final"
            className="onboarding-slide"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            style={{ position: 'absolute', inset: 0, zIndex: 1 }}
          >
            <div className="onboarding-final">
              {/* Logo */}
              <motion.div
                variants={scaleVariants}
                initial="hidden"
                animate="visible"
              >
                <img
                  src={logo}
                  alt="Time Tech"
                  className="onboarding-final-logo"
                />
              </motion.div>

              {/* Title */}
              <motion.h2
                className="onboarding-final-title"
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
                custom={0.1}
              >
                أنت على بُعد خطوة من عالم
                <span> الساعات الفاخرة</span>
              </motion.h2>

              <div className="onboarding-divider" />

              <motion.p
                className="onboarding-final-subtitle"
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
                custom={0.2}
              >
                سجّل دخولك للحصول على تجربة مخصصة أو تصفّح متجرنا كزائر الآن
              </motion.p>

              {/* Action Buttons */}
              <motion.div
                className="onboarding-final-actions"
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
                custom={0.3}
              >
                {/* Login */}
                <motion.button
                  className="onboarding-btn-login"
                  onClick={() => complete(true)}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <LogIn size={20} strokeWidth={2.5} />
                  تسجيل الدخول
                </motion.button>

                {/* Guest */}
                <motion.button
                  className="onboarding-btn-guest"
                  onClick={() => complete(false)}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <UserCircle2 size={20} strokeWidth={2} />
                  متابعة كزائر
                </motion.button>
              </motion.div>

              <motion.p
                className="onboarding-terms"
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
                custom={0.42}
              >
                بالمتابعة، أنت توافق على شروط الاستخدام وسياسة الخصوصية
              </motion.p>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ═══════════════ STATIC OVERLAY LAYER ═══════════════ */}
      {screen >= 1 && screen <= 5 && (
        <div className="onboarding-static-footer">
          {/* Dots */}
          <div className="onboarding-dots">
            {[...dots].reverse().map((s) => (
              <div
                key={s}
                className={`onboarding-dot ${screen === s ? 'active' : ''}`}
                onClick={() => goTo(s)}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="onboarding-nav">
            <motion.button 
              className="onboarding-nav-btn" 
              onClick={goNext}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <ChevronRight size={20} strokeWidth={2.5} />
              {screen < 5 ? 'التالي' : 'إنهاء'}
            </motion.button>

            {screen > 1 && (
              <motion.button 
                className="onboarding-nav-btn secondary" 
                onClick={goBack}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                السابق
                <ChevronLeft size={20} strokeWidth={2.5} />
              </motion.button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useCallback } from 'react';
import OnboardingFlow from './OnboardingFlow';

/**
 * OnboardingGate
 *
 * A lightweight gate component that wraps the entire app.
 * On first launch (localStorage flag missing/false) it renders
 * the OnboardingFlow full-screen. On completion it marks the flag,
 * unmounts the flow instantly, and shows the real store UI with no
 * black screen or loading delay.
 *
 * @param {React.ReactNode} children — the store app
 * @param {Function} onLogin — callback to open AuthModal after gate closes
 */
export default function OnboardingGate({ children, onLogin }) {
  const [showOnboarding] = useState(() => {
    try {
      return localStorage.getItem('onboardingCompleted') !== 'true';
    } catch {
      // localStorage unavailable (private mode edge case)
      return false;
    }
  });

  // We track completion in separate state so the gate can close
  // independently without re-mounting children
  const [completed, setCompleted] = useState(!showOnboarding);

  const handleComplete = useCallback((openLogin = false) => {
    try {
      localStorage.setItem('onboardingCompleted', 'true');
    } catch {
      // ignore if localStorage unavailable
    }
    setCompleted(true);
    if (openLogin) {
      // Small timeout so React flushes the DOM paint first,
      // preventing any black screen on modal open
      setTimeout(() => onLogin?.(), 120);
    }
  }, [onLogin]);

  if (!completed) {
    return (
      <OnboardingFlow
        onComplete={() => handleComplete(false)}
        onLogin={() => handleComplete(true)}
      />
    );
  }

  return children;
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Phone, Lock, Eye, EyeOff, LogIn, MessageCircle,
  ShieldCheck, Zap, Star, Sun, Moon, X, CheckCircle2
} from 'lucide-react';
import './LoginPage.css';

// ─── CONFIG ────────────────────────────────────────────────────────────────
const WHATSAPP_NUMBERS = [
  { label: '772754414', value: '967772754414' },
  { label: '775055319', value: '967775055319' },
];
const WHATSAPP_MSG = encodeURIComponent(
  'السلام عليكم، أريد الحصول على حساب في متجر السعيدة 🛍️'
);
// ───────────────────────────────────────────────────────────────────────────

// ─── How To Create Account Modal ───────────────────────────────────────────
function HowToCreateModal({ isOpen, onClose }) {
  // Trap focus / close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="lp-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="lp-modal-card">
        {/* Close */}
        <button
          className="lp-modal-close"
          onClick={onClose}
          aria-label="إغلاق"
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div className="lp-modal-icon">
          <CheckCircle2 size={36} strokeWidth={1.5} />
        </div>

        <h2 id="how-modal-title" className="lp-modal-title">
          كيفية إنشاء حساب
        </h2>

        <div className="lp-modal-body">
          <p>لا يمكن للعملاء إنشاء حسابات بأنفسهم.</p>
          <p>
            يتم إنشاء الحسابات <strong>حصريًا</strong> من قِبَل مدير المتجر.
          </p>
          <p>
            للحصول على حساب، تواصل مع المدير عبر واتساب وسيقوم بإنشاء
            حسابك وإرسال بيانات تسجيل الدخول إليك.
          </p>
        </div>

        {/* Dual WhatsApp buttons inside modal */}
        <p className="lp-modal-contact-label">تواصل مع المدير:</p>
        <div className="lp-modal-wa-btns">
          {WHATSAPP_NUMBERS.map((n) => (
            <a
              key={n.value}
              href={`https://wa.me/${n.value}?text=${WHATSAPP_MSG}`}
              target="_blank"
              rel="noopener noreferrer"
              className="lp-modal-wa-btn"
            >
              <MessageCircle size={16} />
              {n.label}
            </a>
          ))}
        </div>

        <button className="lp-modal-dismiss" onClick={onClose}>
          حسنًا، فهمت
        </button>
      </div>
    </div>
  );
}

// ─── WhatsApp Number Chooser ────────────────────────────────────────────────
function WhatsAppChooser({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="lp-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="اختر رقم واتساب"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="lp-modal-card lp-wa-chooser-card">
        <button className="lp-modal-close" onClick={onClose} aria-label="إغلاق">
          <X size={20} />
        </button>

        <div className="lp-modal-icon" style={{ color: '#25d366' }}>
          <MessageCircle size={36} strokeWidth={1.5} />
        </div>

        <h2 className="lp-modal-title">تواصل مع المدير</h2>
        <p className="lp-modal-contact-label">اختر رقم واتساب:</p>

        <div className="lp-modal-wa-btns">
          {WHATSAPP_NUMBERS.map((n) => (
            <a
              key={n.value}
              href={`https://wa.me/${n.value}?text=${WHATSAPP_MSG}`}
              target="_blank"
              rel="noopener noreferrer"
              className="lp-modal-wa-btn"
              onClick={onClose}
            >
              <MessageCircle size={16} />
              {n.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Left Panel Feature Chip ────────────────────────────────────────────────
function FeatureChip({ icon: Icon, text }) {
  return (
    <div className="lp-feature-chip">
      <span className="lp-feature-icon">
        <Icon size={16} strokeWidth={2} />
      </span>
      <span>{text}</span>
    </div>
  );
}

// ─── Main Login Page ────────────────────────────────────────────────────────
export default function LoginPage() {
  const { login } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const [phone, setPhone]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]               = useState('');
  const [shake, setShake]               = useState(false);
  const [showHowModal, setShowHowModal] = useState(false);
  const [showWaChooser, setShowWaChooser] = useState(false);

  // Auto-clear error after 4 s
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 4000);
    return () => clearTimeout(t);
  }, [error]);

  const handlePhoneChange = (e) => {
    setPhone(e.target.value.replace(/[^0-9]/g, ''));
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!phone || phone.length < 7) {
      setError('يرجى إدخال رقم هاتف صحيح');
      triggerShake();
      return;
    }
    if (!password || password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      triggerShake();
      return;
    }

    setIsSubmitting(true);
    try {
      await login(phone, password);
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
      triggerShake();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="lp-root" dir="rtl">

      {/* ── Theme Toggle ── */}
      <button
        className="lp-theme-toggle"
        onClick={toggleTheme}
        aria-label={isDarkMode ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
        title={isDarkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}
      >
        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* ════════════════════════════════════════════════
          LEFT PANEL — Brand / Hero
      ════════════════════════════════════════════════ */}
      <aside className="lp-left-panel" aria-hidden="true">
        {/* Background image filled */}
        <div className="lp-left-bg" />
        {/* Dark overlay for readability */}
        <div className="lp-left-overlay" />

        <div className="lp-left-content">
          {/* Store Logo */}
          <img
            src="/logo.png"
            alt="شعار متجر السعيدة"
            className="lp-left-logo"
          />

          {/* Headline */}
          <h1 className="lp-left-headline">
            تجربة تسوق<br />
            <span className="lp-left-headline-accent">لا مثيل لها</span>
          </h1>

          <p className="lp-left-desc">
            ساعات فاخرة وإكسسوارات راقية مختارة بعناية لتناسب ذوقك الرفيع
          </p>

          {/* Feature chips */}
          <div className="lp-features">
            <FeatureChip icon={ShieldCheck} text="منتجات أصلية وعالية الجودة" />
            <FeatureChip icon={Zap}         text="دعم سريع وخدمة متميزة" />
            <FeatureChip icon={Star}        text="تجربة تسوق موثوقة وآمنة" />
          </div>
        </div>
      </aside>

      {/* ════════════════════════════════════════════════
          RIGHT PANEL — Login Form
      ════════════════════════════════════════════════ */}
      <main className="lp-right-panel">
        <div className={`lp-card ${shake ? 'lp-shake' : ''}`}>

          {/* Logo inside form card */}
          <div className="lp-card-logo-wrap">
            <img src="/logo.png" alt="شعار متجر السعيدة" className="lp-card-logo" />
          </div>

          {/* Heading */}
          <div className="lp-card-header">
            <h2 className="lp-card-title">تسجيل الدخول</h2>
            <p className="lp-card-subtitle">أهلًا بك! يرجى إدخال بياناتك للمتابعة</p>
          </div>

          {/* Form */}
          <form className="lp-form" onSubmit={handleSubmit} noValidate>

            {/* Phone */}
            <div className="lp-field-group">
              <label htmlFor="lp-phone" className="lp-label">رقم الهاتف</label>
              <div className="lp-input-wrap">
                <Phone size={18} className="lp-input-icon" />
                <input
                  id="lp-phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="أدخل رقم هاتفك"
                  value={phone}
                  onChange={handlePhoneChange}
                  className="lp-input"
                  autoComplete="tel"
                  maxLength={15}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Password */}
            <div className="lp-field-group">
              <label htmlFor="lp-password" className="lp-label">كلمة المرور</label>
              <div className="lp-input-wrap">
                <Lock size={18} className="lp-input-icon" />
                <input
                  id="lp-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="lp-input"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="lp-eye-btn"
                  onClick={() => setShowPassword(p => !p)}
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="lp-error" role="alert">{error}</div>
            )}

            {/* Login button */}
            <button
              id="lp-login-btn"
              type="submit"
              className="lp-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="lp-spinner" />
              ) : (
                <>
                  <LogIn size={20} />
                  <span>تسجيل الدخول</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="lp-divider">
            <span className="lp-divider-line" />
            <span className="lp-divider-text">هل تحتاج مساعدة؟</span>
            <span className="lp-divider-line" />
          </div>

          {/* Secondary action buttons */}
          <div className="lp-secondary-btns">
            {/* WhatsApp — opens chooser modal */}
            <button
              id="lp-whatsapp-btn"
              type="button"
              className="lp-secondary-btn lp-whatsapp-btn"
              onClick={() => setShowWaChooser(true)}
            >
              <MessageCircle size={18} />
              <span>تواصل مع المدير</span>
            </button>

            {/* How to create account */}
            <button
              id="lp-how-btn"
              type="button"
              className="lp-secondary-btn lp-how-btn"
              onClick={() => setShowHowModal(true)}
            >
              <CheckCircle2 size={18} />
              <span>كيفية إنشاء حساب</span>
            </button>
          </div>

          {/* Footer */}
          <p className="lp-footer-note">
            © {new Date().getFullYear()} متجر السعيدة — جميع الحقوق محفوظة
          </p>
        </div>
      </main>

      {/* ── Modals ── */}
      <HowToCreateModal
        isOpen={showHowModal}
        onClose={() => setShowHowModal(false)}
      />
      <WhatsAppChooser
        isOpen={showWaChooser}
        onClose={() => setShowWaChooser(false)}
      />
    </div>
  );
}

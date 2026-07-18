import { motion } from 'framer-motion';
import { ArrowRight, Phone, Mail, MapPin, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const contactItems = [
  {
    icon: Phone,
    label: 'واتساب',
    lines: ['772754414', '775055319'],
    color: '#25d366',
  },
  {
    icon: Mail,
    label: 'البريد الإلكتروني',
    lines: ['alsaeedah8@gmail.com'],
    color: 'var(--primary)',
  },
  {
    icon: MapPin,
    label: 'العنوان',
    lines: ['حضرموت / المكلا / الشرج'],
    color: '#e07b54',
  },
  {
    icon: Clock,
    label: 'ساعات العمل',
    lines: ['السبت – الخميس', '8 صباحاً حتى 10 مساءً'],
    color: '#7c9ef5',
  },
];

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--border-color)',
  borderRadius: '12px',
  padding: '14px 16px',
  color: 'var(--text-main)',
  fontFamily: 'var(--font-main)',
  fontSize: '0.95rem',
  outline: 'none',
  transition: 'border-color 0.3s ease',
  boxSizing: 'border-box',
  direction: 'rtl',
};

export default function ContactUs() {
  const navigate = useNavigate();
  const [focused, setFocused] = useState(null);
  const [sent, setSent] = useState(false);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-main)',
        direction: 'rtl',
        padding: '40px 20px 80px',
      }}
    >
      {/* Back Button */}
      <motion.button
        {...fadeIn}
        transition={{ duration: 0.4 }}
        onClick={() => navigate(-1)}
        style={{
          position: 'fixed',
          top: '24px',
          left: '24px',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--primary)',
          boxShadow: 'var(--shadow)',
          zIndex: 100,
          transition: 'all 0.3s ease',
        }}
        whileHover={{ scale: 1.1, borderColor: 'var(--primary)' }}
        whileTap={{ scale: 0.95 }}
      >
        <ArrowRight size={20} />
      </motion.button>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial="initial"
          animate="animate"
          style={{ textAlign: 'center', marginBottom: '48px', paddingTop: '20px' }}
        >
          <motion.p
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.75rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'var(--primary)',
              marginBottom: '12px',
              fontWeight: 600,
            }}
          >
            ALSAEEDAH
          </motion.p>
          <motion.h1
            variants={fadeIn}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              color: 'var(--text-main)',
              marginBottom: '16px',
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            تواصل معنا
          </motion.h1>
          <motion.div
            variants={fadeIn}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              width: '60px',
              height: '2px',
              background: 'var(--primary)',
              margin: '0 auto',
              borderRadius: '2px',
            }}
          />
        </motion.div>

        {/* Contact Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          {contactItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.3)' }}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '20px',
                  padding: '24px',
                  textAlign: 'center',
                  cursor: 'default',
                  transition: 'all 0.3s ease',
                }}
              >
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: `${item.color}18`,
                    border: `1px solid ${item.color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <Icon size={22} color={item.color} />
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.72rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: item.color,
                    marginBottom: '8px',
                    fontWeight: 600,
                  }}
                >
                  {item.label}
                </p>
                {item.lines.map((line, j) => (
                  <p
                    key={j}
                    style={{
                      fontFamily: 'var(--font-main)',
                      fontSize: '0.95rem',
                      color: 'var(--text-secondary)',
                      margin: '4px 0',
                      lineHeight: 1.7,
                      direction: line.match(/[a-zA-Z@]/) ? 'ltr' : 'rtl',
                    }}
                  >
                    {line}
                  </p>
                ))}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '28px',
            marginBottom: '20px',
            boxShadow: 'var(--shadow)',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.2rem',
              fontWeight: 600,
              marginBottom: '24px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border-color)',
              display: 'inline-block',
              color: 'var(--text-main)',
              borderRight: '3px solid var(--primary)',
              paddingRight: '12px',
            }}
          >
            أرسل لنا رسالة
          </h2>

          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                textAlign: 'center',
                padding: '40px 20px',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(212,175,55,0.15)',
                  border: '2px solid var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  fontSize: '28px',
                }}
              >
                ✓
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-main)',
                  fontSize: '1.05rem',
                  color: 'var(--primary)',
                  fontWeight: 600,
                }}
              >
                تم إرسال رسالتك بنجاح!
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-main)',
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)',
                  marginTop: '8px',
                }}
              >
                سنتواصل معك في أقرب وقت ممكن
              </p>
            </motion.div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label
                  style={{
                    fontFamily: 'var(--font-main)',
                    fontSize: '0.88rem',
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  الاسم الكريم
                </label>
                <input
                  type="text"
                  placeholder="أدخل اسمك"
                  style={{
                    ...inputStyle,
                    borderColor: focused === 'name' ? 'var(--primary)' : 'var(--border-color)',
                  }}
                  onFocus={() => setFocused('name')}
                  onBlur={() => setFocused(null)}
                />
              </div>
              <div>
                <label
                  style={{
                    fontFamily: 'var(--font-main)',
                    fontSize: '0.88rem',
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  placeholder="أدخل رقم هاتفك"
                  style={{
                    ...inputStyle,
                    borderColor: focused === 'phone' ? 'var(--primary)' : 'var(--border-color)',
                    direction: 'ltr',
                    textAlign: 'right',
                  }}
                  onFocus={() => setFocused('phone')}
                  onBlur={() => setFocused(null)}
                />
              </div>
              <div>
                <label
                  style={{
                    fontFamily: 'var(--font-main)',
                    fontSize: '0.88rem',
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  رسالتك
                </label>
                <textarea
                  placeholder="اكتب رسالتك هنا..."
                  rows={5}
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    borderColor: focused === 'msg' ? 'var(--primary)' : 'var(--border-color)',
                  }}
                  onFocus={() => setFocused('msg')}
                  onBlur={() => setFocused(null)}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(212,175,55,0.3)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSent(true)}
                style={{
                  background: 'linear-gradient(135deg, var(--primary), #b8960e)',
                  color: '#0a0a0a',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '15px 32px',
                  fontFamily: 'var(--font-main)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                  marginTop: '4px',
                  transition: 'all 0.3s ease',
                }}
              >
                إرسال
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

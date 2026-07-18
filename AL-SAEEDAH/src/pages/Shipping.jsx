import { motion } from 'framer-motion';
import { ArrowRight, Truck, Clock, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const shippingCards = [
  {
    icon: MapPin,
    color: '#e07b54',
    title: 'مناطق التوصيل',
    content: 'نوصل إلى جميع محافظات الجمهورية اليمنية. سواء كنتم في صنعاء، عدن، حضرموت، تعز، الحديدة أو أي محافظة أخرى — نحن نصلكم.',
  },
  {
    icon: Clock,
    color: '#7c9ef5',
    title: 'مدة التوصيل',
    content: 'يتم تسليم طلباتكم خلال 2 إلى 5 أيام عمل من تأكيد الطلب. قد تختلف المدة حسب الموقع الجغرافي وظروف الشحن.',
  },
  {
    icon: Truck,
    color: 'var(--primary)',
    title: 'تكلفة الشحن',
    content: 'الشحن مجاني تماماً للطلبات التي تتجاوز قيمتها 5,000 ريال يمني. للطلبات الأصغر، تبلغ تكلفة الشحن 500 ريال يمني فقط.',
  },
];

export default function Shipping() {
  const navigate = useNavigate();

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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
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
        <div style={{ textAlign: 'center', marginBottom: '48px', paddingTop: '20px' }}>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
            سياسة الشحن والتوصيل
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              width: '60px',
              height: '2px',
              background: 'var(--primary)',
              margin: '0 auto',
              borderRadius: '2px',
            }}
          />
        </div>

        {/* Icon Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          {shippingCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.25 + i * 0.12 }}
                whileHover={{ y: -5, boxShadow: '0 16px 40px rgba(0,0,0,0.35)' }}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '20px',
                  padding: '28px 24px',
                  transition: 'all 0.3s ease',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: `${card.color === 'var(--primary)' ? 'rgba(212,175,55' : card.color === '#e07b54' ? 'rgba(224,123,84' : 'rgba(124,158,245'},0.12)`,
                    border: `1px solid ${card.color === 'var(--primary)' ? 'rgba(212,175,55' : card.color === '#e07b54' ? 'rgba(224,123,84' : 'rgba(124,158,245'},0.3)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                  }}
                >
                  <Icon size={24} color={card.color} />
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    marginBottom: '12px',
                  }}
                >
                  {card.title}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-main)',
                    fontSize: '0.9rem',
                    lineHeight: 1.85,
                    color: 'var(--text-secondary)',
                    margin: 0,
                  }}
                >
                  {card.content}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Shipping Cost Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
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
              marginBottom: '20px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border-color)',
              display: 'inline-block',
              color: 'var(--text-main)',
              borderRight: '3px solid var(--primary)',
              paddingRight: '12px',
            }}
          >
            تفاصيل تكلفة الشحن
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(212,175,55,0.06)',
                border: '1px solid rgba(212,175,55,0.2)',
                borderRadius: '12px',
                padding: '16px 20px',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-main)',
                  fontSize: '0.95rem',
                  color: 'var(--text-secondary)',
                }}
              >
                طلبات أكثر من 5,000 ريال
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--primary)',
                }}
              >
                مجاناً 🎁
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '16px 20px',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-main)',
                  fontSize: '0.95rem',
                  color: 'var(--text-secondary)',
                }}
              >
                طلبات أقل من 5,000 ريال
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                }}
              >
                500 ريال
              </span>
            </div>
          </div>
        </motion.div>

        {/* WhatsApp CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.75 }}
          style={{
            background: 'linear-gradient(135deg, rgba(37,211,102,0.08), rgba(37,211,102,0.03))',
            border: '1px solid rgba(37,211,102,0.2)',
            borderRadius: '20px',
            padding: '24px 28px',
            marginBottom: '20px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-main)',
              fontSize: '0.95rem',
              lineHeight: 1.9,
              color: 'var(--text-secondary)',
              marginBottom: '16px',
            }}
          >
            للاستفسار عن حالة شحنتكم أو أي استفسارات تتعلق بالتوصيل، تواصلوا معنا عبر واتساب
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {['772754414', '775055319'].map((num) => (
              <a
                key={num}
                href={`https://wa.me/967${num}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#25d366',
                  color: '#fff',
                  textDecoration: 'none',
                  borderRadius: '10px',
                  padding: '10px 20px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  direction: 'ltr',
                  transition: 'opacity 0.2s ease',
                }}
              >
                📱 {num}
              </a>
            ))}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          style={{
            fontFamily: 'var(--font-main)',
            fontSize: '0.85rem',
            color: 'var(--text-dim)',
            textAlign: 'center',
            lineHeight: 1.8,
          }}
        >
          متجر السعيدة — نوصل الفخامة إلى بابكم
        </motion.p>
      </div>
    </div>
  );
}

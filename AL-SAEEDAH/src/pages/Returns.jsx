import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const sections = [
  {
    title: 'حق الإرجاع',
    content: `يحق للعميل الكريم إرجاع المنتج خلال 7 أيام من تاريخ الاستلام الفعلي. نؤمن بأحقيتكم في تجربة المنتج والتأكد من مطابقته لتوقعاتكم، لذا نتيح هذه الفترة لضمان رضاكم التام عن كل عملية شراء.`,
  },
  {
    title: 'شروط الإرجاع',
    content: `لقبول طلب الإرجاع، يجب استيفاء الشروط التالية: المنتج بحالته الأصلية التامة دون أي استخدام أو تلف، العلب والملصقات والمستندات الأصلية مكتملة، وشهادة الأصالة والضمان مرفقة. لن يُقبل الإرجاع في حال إزالة الأختام الأصلية أو وجود أي خدوش أو تلف.`,
  },
  {
    title: 'كيفية الإرجاع',
    content: `للبدء في عملية الإرجاع، يُرجى اتباع الخطوات التالية: أولاً، تواصلوا مع خدمة العملاء عبر واتساب وأبلغونا برغبتكم في الإرجاع مع ذكر رقم الطلب وسبب الإرجاع. ثانياً، سيتم التحقق من استيفاء شروط الإرجاع. ثالثاً، سنرسل لكم تعليمات الشحن للإعادة. لا تُرسلوا المنتج قبل التنسيق معنا مباشرةً.`,
  },
  {
    title: 'استثناءات الإرجاع',
    content: `لا يمكن قبول الإرجاع في الحالات التالية: المنتجات المخصصة أو المحفورة حسب الطلب، المنتجات المشتراة ضمن العروض الخاصة والتخفيضات المحددة، المنتجات التي تجاوزت مدة 7 أيام من تاريخ الاستلام، وأي منتج تم استخدامه أو تعديله أو إزالة أختامه الأصلية.`,
  },
  {
    title: 'استرداد المبلغ',
    content: `بعد استلام المنتج والتحقق من حالته، سيتم معالجة استرداد المبلغ خلال 5 إلى 7 أيام عمل. يُعاد المبلغ بنفس طريقة الدفع الأصلية. في حالة الاستبدال بمنتج آخر، يمكن إتمامه في وقت أقصر. سنُبلغكم بتأكيد الاسترداد عبر الواتساب فور إتمامه.`,
  },
];

const steps = [
  { num: '١', text: 'تواصل مع خدمة العملاء عبر واتساب' },
  { num: '٢', text: 'أرسل رقم الطلب وسبب الإرجاع' },
  { num: '٣', text: 'انتظر تأكيد قبول الإرجاع' },
  { num: '٤', text: 'أعد المنتج كما تم تعليمك' },
  { num: '٥', text: 'استرداد المبلغ خلال 5-7 أيام عمل' },
];

export default function Returns() {
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
            سياسة الإرجاع والاستبدال
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

        {/* Process Steps */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
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
            خطوات الإرجاع
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.35 + i * 0.08 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '14px 16px',
                  background: 'rgba(212,175,55,0.04)',
                  border: '1px solid rgba(212,175,55,0.12)',
                  borderRadius: '12px',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary), #b8960e)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: '#0a0a0a',
                  }}
                >
                  {step.num}
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-main)',
                    fontSize: '0.95rem',
                    color: 'var(--text-secondary)',
                    margin: 0,
                    lineHeight: 1.7,
                  }}
                >
                  {step.text}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Policy Sections */}
        {sections.map((section, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.45 + i * 0.1 }}
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
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--border-color)',
                display: 'inline-block',
                color: 'var(--text-main)',
                borderRight: '3px solid var(--primary)',
                paddingRight: '12px',
              }}
            >
              {section.title}
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-main)',
                fontSize: '0.95rem',
                lineHeight: 1.9,
                color: 'var(--text-secondary)',
                margin: 0,
              }}
            >
              {section.content}
            </p>
          </motion.div>
        ))}

        {/* WhatsApp CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.05 }}
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
            للبدء في عملية الإرجاع، تواصلوا مع خدمة العملاء عبر واتساب
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
          transition={{ duration: 0.6, delay: 1.15 }}
          style={{
            fontFamily: 'var(--font-main)',
            fontSize: '0.85rem',
            color: 'var(--text-dim)',
            textAlign: 'center',
            lineHeight: 1.8,
          }}
        >
          متجر السعيدة — رضاكم هو أولويتنا القصوى
        </motion.p>
      </div>
    </div>
  );
}

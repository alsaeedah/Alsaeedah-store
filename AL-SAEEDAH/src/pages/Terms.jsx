import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const sections = [
  {
    title: 'أهلاً بكم في متجر السعيدة',
    content: `يسعدنا ترحيبكم في متجر السعيدة، وجهتكم الأولى لأفخر الساعات في اليمن. باستخدامكم لهذا الموقع أو خدماتنا، فإنكم توافقون على الالتزام بالشروط والأحكام المذكورة أدناه. نرجو قراءتها بعناية قبل الشروع في أي عملية شراء أو استخدام للخدمات.`,
  },
  {
    title: 'الاستخدام المسموح به',
    content: `يُسمح باستخدام موقعنا وخدماتنا للأغراض الشخصية والمشروعة فقط. يُحظر استخدام المنصة في أي نشاط مخالف للقوانين المعمول بها، أو لإرسال محتوى مسيء أو ضار. كما يُحظر محاولة اختراق أو التلاعب بأنظمة الموقع بأي شكل من الأشكال. نحتفظ بالحق في إيقاف أي حساب يُثبت إساءة استخدامه.`,
  },
  {
    title: 'حقوق الملكية الفكرية',
    content: `جميع المحتويات المنشورة على موقع متجر السعيدة — بما تشمل الصور والنصوص والشعارات والتصاميم — هي ملك حصري للمتجر ومحمية بموجب قوانين الملكية الفكرية. لا يجوز نسخها أو استخدامها أو إعادة توزيعها دون الحصول على إذن كتابي مسبق من إدارة المتجر.`,
  },
  {
    title: 'سياسة إلغاء الطلبات',
    content: `يحق للعميل إلغاء طلبه خلال ساعة واحدة من تأكيد الطلب. بعد انقضاء هذه المدة، يُعتبر الطلب ملزماً ولا يمكن إلغاؤه. في حال رغبتم في الإلغاء ضمن الوقت المحدد، يُرجى التواصل مع خدمة العملاء عبر واتساب على الأرقام المتاحة. سيتم استرداد المبلغ كاملاً في حال الإلغاء الصحيح.`,
  },
  {
    title: 'القانون المعمول به',
    content: `تخضع هذه الشروط والأحكام للقوانين والأنظمة المعمول بها في الجمهورية اليمنية. في حال نشوء أي نزاع يتعلق بمعاملات متجر السعيدة، يتم التعامل معه وفق الإطار القانوني اليمني المعتمد. نسعى دائماً لحل أي خلاف بالطرق الودية قبل اللجوء إلى أي مسار قانوني رسمي.`,
  },
];

export default function Terms() {
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
            الشروط والأحكام
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
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            style={{
              fontFamily: 'var(--font-main)',
              fontSize: '0.88rem',
              color: 'var(--text-dim)',
              marginTop: '16px',
            }}
          >
            آخر تحديث: يوليو 2026
          </motion.p>
        </div>

        {/* Sections */}
        {sections.map((section, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 + i * 0.1 }}
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

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          style={{
            fontFamily: 'var(--font-main)',
            fontSize: '0.85rem',
            color: 'var(--text-dim)',
            textAlign: 'center',
            lineHeight: 1.8,
          }}
        >
          للاستفسار عن هذه الشروط، تواصلوا معنا عبر واتساب أو البريد الإلكتروني
        </motion.p>
      </div>
    </div>
  );
}

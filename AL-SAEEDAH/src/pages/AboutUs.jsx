import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const values = [
  { title: 'الجودة الذهبية', desc: 'نختار لكم فقط أرقى الساعات العالمية من أعرق الماركات وأكثرها موثوقية.' },
  { title: 'خدمة على مدار الساعة', desc: 'فريقنا متاح دائماً للإجابة على استفساراتكم وتقديم أفضل تجربة تسوق.' },
  { title: 'ضمان أصالة المنتجات', desc: 'جميع منتجاتنا أصلية 100% مع شهادات الأصالة والضمان الرسمي.' },
  { title: 'شحن سريع لكافة المحافظات', desc: 'نوصل طلباتكم إلى جميع أنحاء اليمن في أقصر وقت ممكن.' },
];

export default function AboutUs() {
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
          variants={stagger}
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
            transition={{ duration: 0.5 }}
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              color: 'var(--text-main)',
              marginBottom: '16px',
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            من نحن
          </motion.h1>
          <motion.div
            variants={fadeIn}
            transition={{ duration: 0.5 }}
            style={{
              width: '60px',
              height: '2px',
              background: 'var(--primary)',
              margin: '0 auto',
              borderRadius: '2px',
            }}
          />
        </motion.div>

        {/* Main Story Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
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
            قصتنا
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-main)',
              fontSize: '0.95rem',
              lineHeight: 1.9,
              color: 'var(--text-secondary)',
              marginBottom: '16px',
            }}
          >
            متجر السعيدة متخصص في ساعات الفخامة والمجموعات الراقية. نحن نؤمن بأن الساعة ليست مجرد أداة لمعرفة الوقت، بل قطعة فنية تعبر عن شخصيتك وذوقك الرفيع.
          </p>
          <p
            style={{
              fontFamily: 'var(--font-main)',
              fontSize: '0.95rem',
              lineHeight: 1.9,
              color: 'var(--text-secondary)',
              marginBottom: '16px',
            }}
          >
            انطلقنا بشغف حقيقي نحو عالم الساعات الفاخرة، وتطورنا لنصبح الوجهة الأولى لعشاق الأناقة والفخامة في اليمن. نقدم مجموعات مختارة بعناية فائقة من أرقى الماركات العالمية.
          </p>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.03))',
              border: '1px solid rgba(212,175,55,0.2)',
              borderRadius: '12px',
              padding: '20px',
              marginTop: '20px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.3rem',
                color: 'var(--primary)',
                fontStyle: 'italic',
                margin: 0,
              }}
            >
              "الفخامة في كل ثانية"
            </p>
          </div>
        </motion.div>

        {/* Values Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
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
            قيمنا
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {values.map((val, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.45 + i * 0.1 }}
                style={{
                  background: 'rgba(212,175,55,0.04)',
                  border: '1px solid rgba(212,175,55,0.15)',
                  borderRadius: '14px',
                  padding: '20px',
                  transition: 'all 0.3s ease',
                }}
                whileHover={{
                  borderColor: 'rgba(212,175,55,0.4)',
                  background: 'rgba(212,175,55,0.07)',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    marginBottom: '12px',
                    marginRight: 'auto',
                    marginLeft: '0',
                  }}
                />
                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    marginBottom: '8px',
                  }}
                >
                  {val.title}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-main)',
                    fontSize: '0.9rem',
                    lineHeight: 1.8,
                    color: 'var(--text-secondary)',
                    margin: 0,
                  }}
                >
                  {val.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer Note */}
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
          متجر السعيدة — شريككم في الأناقة والفخامة
        </motion.p>
      </div>
    </div>
  );
}

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const sections = [
  {
    title: 'البيانات التي نجمعها',
    content: `عند تسجيلكم أو إجراء طلب في متجر السعيدة، نقوم بجمع المعلومات التالية: الاسم الكريم، رقم الهاتف للتواصل وتأكيد الطلبات، والعنوان لأغراض التوصيل. قد نجمع أيضاً بيانات الاستخدام الأساسية لتحسين تجربة التسوق لديكم، وذلك بصورة مجهولة الهوية.`,
  },
  {
    title: 'كيف نستخدم بياناتك',
    content: `نستخدم المعلومات التي نجمعها حصراً للأغراض التالية: معالجة طلباتكم وتأكيدها، التواصل معكم بشأن حالة الطلب والشحن، إرسال تحديثات حول العروض والمنتجات الجديدة (بموافقتكم)، وتحسين جودة خدماتنا وتجربة التسوق. لن نستخدم بياناتكم في أي غرض آخر دون إذنكم الصريح.`,
  },
  {
    title: 'حماية البيانات',
    content: `نأخذ أمان بياناتكم على محمل الجد. نطبق إجراءات تقنية وتشغيلية صارمة لحماية معلوماتكم الشخصية من الوصول غير المصرح به أو الاستخدام أو الإفصاح. يتم تخزين بياناتكم على خوادم آمنة ولا يُسمح لأطراف ثالثة بالوصول إليها إلا في إطار تنفيذ خدمات الشحن والتوصيل.`,
  },
  {
    title: 'حقوق المستخدم',
    content: `تتمتعون بحقوق كاملة على بياناتكم الشخصية، وتشمل: حق الاطلاع على البيانات المحفوظة، حق تصحيح أي معلومات غير دقيقة، وحق حذف حسابكم وجميع بياناتكم من أنظمتنا. لممارسة أي من هذه الحقوق، يُرجى التواصل مع خدمة العملاء وسنقوم بتنفيذ طلبكم خلال 5 أيام عمل.`,
  },
  {
    title: 'التواصل معنا',
    content: `إن كان لديكم أي استفسار أو قلق يتعلق بسياسة الخصوصية أو طريقة تعاملنا مع بياناتكم، لا تترددوا في التواصل معنا عبر البريد الإلكتروني: alsaeedah8@gmail.com أو عبر واتساب على الأرقام: 772754414 أو 775055319. فريقنا سيسعد بالإجابة على جميع استفساراتكم.`,
  },
];

export default function Privacy() {
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
            سياسة الخصوصية
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

        {/* Intro Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          style={{
            background: 'linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.03))',
            border: '1px solid rgba(212,175,55,0.25)',
            borderRadius: '16px',
            padding: '20px 24px',
            marginBottom: '20px',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-main)',
              fontSize: '0.95rem',
              lineHeight: 1.9,
              color: 'var(--text-secondary)',
              margin: 0,
            }}
          >
            نحن في متجر السعيدة نحترم خصوصيتكم ونلتزم بحماية بياناتكم الشخصية. توضح هذه السياسة كيفية جمع معلوماتكم واستخدامها والحفاظ عليها.
          </p>
        </motion.div>

        {/* Sections */}
        {sections.map((section, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.3 + i * 0.1 }}
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
          متجر السعيدة — خصوصيتكم أمانة لدينا
        </motion.p>
      </div>
    </div>
  );
}

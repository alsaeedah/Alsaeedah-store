import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Download, 
  Smartphone, 
  ShieldCheck, 
  Zap, 
  Bell, 
  Heart, 
  Search, 
  ChevronDown,
  Star,
  ShoppingBag,
  RefreshCw,
  Layout,
  Headset
} from 'lucide-react';
import './DownloadApp.css';

const DownloadApp = () => {
  const navigate = useNavigate();
  const [showStickyCta, setShowStickyCta] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky CTA after scrolling down 400px (mobile only)
      if (window.scrollY > 400 && window.innerWidth < 768) {
        setShowStickyCta(true);
      } else {
        setShowStickyCta(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDownload = () => {
    // Navigate to actual store URL or trigger download
    console.log("Download clicked");
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, type: "spring" } }
  };

  const features = [
    { icon: <Zap size={28} />, title: 'تصفح سريع', desc: 'تجربة تسوق فائقة السرعة بدون تأخير.' },
    { icon: <Bell size={28} />, title: 'إشعارات بالعروض', desc: 'كن أول من يعلم بأحدث التخفيضات.' },
    { icon: <ShoppingBag size={28} />, title: 'إدارة الطلبات', desc: 'تتبع حالة طلباتك خطوة بخطوة.' },
    { icon: <Layout size={28} />, title: 'واجهة احترافية', desc: 'تصميم عصري يسهل عليك العثور على ما تريد.' },
    { icon: <Heart size={28} />, title: 'حفظ المفضلة', desc: 'احتفظ بمنتجاتك المفضلة لشرائها لاحقاً.' },
    { icon: <Search size={28} />, title: 'بحث متقدم', desc: 'فلاتر ذكية للوصول الدقيق للمنتجات.' }
  ];

  const faqs = [
    { q: 'هل التطبيق مجاني؟', a: 'نعم، تطبيق متجر السعيدة مجاني بالكامل للتحميل والاستخدام.' },
    { q: 'هل التطبيق آمن لمعلوماتي؟', a: 'نحن نستخدم أعلى معايير التشفير والأمان لحماية بياناتك الشخصية.' },
    { q: 'ما هي الأجهزة المدعومة؟', a: 'التطبيق متاح حالياً لجميع أجهزة أندرويد بإصدار 8.0 فأحدث.' }
  ];

  return (
    <div className="download-page">
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg-blur"></div>
        <div className="hero-grid download-container">
          
          <motion.div 
            className="hero-content"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={fadeUp} className="hero-badge">
              الآن على أندرويد
            </motion.div>
            <motion.h1 variants={fadeUp} className="hero-title">
              حمّل تطبيق متجر السعيدة واستمتع بتجربة تسوق أسرع وأسهل.
            </motion.h1>
            <motion.p variants={fadeUp} className="hero-desc">
              اشترِ أحدث الساعات والإكسسوارات الفاخرة، واستعرض المنتجات بسهولة، واحصل على تجربة تسوق سلسة وآمنة من خلال التطبيق.
            </motion.p>
            <motion.div variants={fadeUp} className="hero-ctas">
              <button className="btn-download-large" onClick={handleDownload}>
                <Download size={24} />
                تحميل التطبيق
              </button>
              <button className="btn-secondary-large" onClick={() => navigate('/')}>
                استعراض المتجر
              </button>
            </motion.div>
            <motion.div variants={fadeUp} className="hero-meta">
              <span>الإصدار 1.0.0</span>
              <span>•</span>
              <span>حجم التطبيق 24MB</span>
            </motion.div>
          </motion.div>

          <motion.div 
            className="hero-composition"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div 
              className="phone-mockup-wrapper"
              animate={{ y: [-10, 10, -10] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            >
              <img src="/app-preview.png" alt="App Preview" className="phone-screen" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1601972599720-36938d4ecd31?auto=format&fit=crop&w=400&q=80'; }} />
            </motion.div>

            <motion.div 
              className="float-card top-left"
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
            >
              <div className="float-icon"><ShieldCheck size={20} /></div>
              <div>
                <div className="float-text-bold">تسوق آمن</div>
                <div className="float-text-dim">حماية 100%</div>
              </div>
            </motion.div>

            <motion.div 
              className="float-card middle-right"
              animate={{ y: [0, 15, 0] }}
              transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 0.5 }}
            >
              <div className="float-icon"><RefreshCw size={20} /></div>
              <div>
                <div className="float-text-bold">تحديثات مستمرة</div>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </section>

      {/* Features Section */}
      <section className="download-section">
        <div className="download-container">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-title"
          >
            لماذا تحمل التطبيق؟
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-subtitle"
          >
            صممنا تطبيقنا بعناية فائقة ليقدم لك أفضل تجربة تسوق ممكنة، مع ميزات حصرية توفر وقتك وجهدك.
          </motion.p>
          
          <motion.div 
            className="features-grid"
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
          >
            {features.map((feat, idx) => (
              <motion.div key={idx} variants={fadeUp} className="feature-card">
                <div className="feature-icon-wrapper">{feat.icon}</div>
                <h3 className="feature-title">{feat.title}</h3>
                <p className="feature-desc">{feat.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Experience Timeline */}
      <section className="download-section">
        <div className="download-container">
          <h2 className="section-title">تجربة سلسة</h2>
          
          <div className="timeline-container mt-10">
            <div className="timeline-line"></div>
            
            {['تحميل', 'تثبيت', 'تصفح', 'طلب', 'استلام'].map((step, idx) => (
              <motion.div 
                key={idx}
                className="timeline-item"
                initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6 }}
              >
                <div className="timeline-content">
                  <h4 className="timeline-title">{step}</h4>
                  <p className="timeline-desc">خطوة بسيطة وسريعة لتصل إلى ما تريد.</p>
                </div>
                <div className="timeline-dot">{idx + 1}</div>
                <div style={{ width: '45%' }}></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="download-section" style={{ background: 'var(--bg-card)' }}>
        <div className="download-container">
          <motion.div 
            className="stats-grid"
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {[
              { label: 'عملية تحميل', val: '+50K' },
              { label: 'تقييم إيجابي', val: '4.9/5' },
              { label: 'منتج فاخر', val: '+1000' },
              { label: 'دعم فني', val: '24/7' }
            ].map((stat, idx) => (
              <motion.div key={idx} variants={fadeUp} className="stat-card">
                <div className="stat-number">{stat.val}</div>
                <div className="stat-label">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="download-section">
        <div className="download-container faq-container">
          <h2 className="section-title">الأسئلة الشائعة</h2>
          
          <div className="mt-8">
            {faqs.map((faq, idx) => (
              <motion.div 
                key={idx} 
                className={`faq-item ${openFaq === idx ? 'open' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <button className="faq-header" onClick={() => setOpenFaq(openFaq === idx ? null : idx)}>
                  {faq.q}
                  <ChevronDown className="faq-icon" size={20} />
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="faq-body"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta-section">
        <div className="final-cta-content">
          <h2 className="section-title" style={{ fontSize: '3rem', marginBottom: '30px' }}>جاهز لبدء تجربة تسوق أفضل؟</h2>
          <div className="hero-ctas" style={{ justifyContent: 'center' }}>
            <button className="btn-download-large" onClick={handleDownload} style={{ padding: '20px 40px', fontSize: '1.2rem' }}>
              <Download size={28} />
              حمل التطبيق الآن
            </button>
            <button className="btn-secondary-large" onClick={() => navigate('/')} style={{ padding: '20px 40px', fontSize: '1.2rem' }}>
              العودة للمتجر
            </button>
          </div>
        </div>
      </section>

      {/* Sticky Mobile CTA */}
      <AnimatePresence>
        {showStickyCta && (
          <motion.div 
            className="sticky-mobile-cta"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
          >
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>متجر السعيدة</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>مجاني - أندرويد</div>
            </div>
            <button className="sticky-cta-btn" onClick={handleDownload}>
              <Download size={18} />
              تحميل
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default DownloadApp;

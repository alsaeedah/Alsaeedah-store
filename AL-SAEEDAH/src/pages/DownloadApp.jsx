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
  ShoppingBag,
  RefreshCw,
  Layout,
  Plus
} from 'lucide-react';
import './DownloadApp.css';

const DownloadApp = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/alsaeedah-store.apk';
    link.download = 'alsaeedah-store.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const features = [
    { icon: <Zap size={40} strokeWidth={1.5} />, title: 'تصفح فائق السرعة', desc: 'تجربة تسوق سلسة خالية من التأخير. صُمم التطبيق ليكون الأسرع في عرض المنتجات وإتمام الطلبات بأقل مجهود.' },
    { icon: <ShoppingBag size={40} strokeWidth={1.5} />, title: 'تتبع ذكي للطلبات', desc: 'ابقَ على اطلاع دائم بحالة طلبك. من لحظة تأكيد الشراء وحتى وصول المنتج إلى باب منزلك، خطوة بخطوة.' },
  ];

  const faqs = [
    { q: 'هل التطبيق متاح للجميع؟', a: 'التطبيق متاح فقط لاصحاب محلات الجمله لسهولة التعامل معهم' },
    { q: 'كيف أضمن جودة المنتجات؟', a: 'جميع المنتجات المعروضة في متجر السعيدة تخضع لفحص دقيق لضمان الجودة العالية ومطابقتها للمواصفات.' },
    { q: 'هل هناك دعم فني متوفر؟', a: 'بالتأكيد، فريق الدعم الفني متواجد على مدار الساعة للرد على استفساراتكم وحل أي مشكلة قد تواجهونها.' }
  ];

  return (
    <div className="download-page">
      {/* Animated Background Orbs */}
      <div className="ambient-bg">
        <div className="ambient-orb orb-1"></div>
        <div className="ambient-orb orb-2"></div>
        <div className="ambient-orb orb-3"></div>
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="download-container hero-wrapper">
          
          <motion.div 
            className="hero-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="hero-pill">
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#d4af37' }}></span>
              الإصدار الجديد متاح الآن
            </div>
            <h1 className="editorial-title">
              تسوق بذكاء.<br/>
              <div style={{marginTop:"7px"}}><span style={{color: '#d4af37' }}>عش بأناقة.</span></div>
            </h1>
            <p className="editorial-subtitle">
              اكتشف عالم متجر السعيدة من خلال تطبيقنا الجديد. تجربة مستخدم استثنائية، عروض حصرية، وسرعة لا مثيل لها في متناول يدك.
            </p>
            
            <div className="hero-actions">
              <button className="btn-premium" onClick={handleDownload}>
                <Download size={22} />
                تحميل التطبيق
              </button>
              <button className="btn-text" onClick={() => navigate('/')}>
                استعراض المتجر
              </button>
            </div>
          </motion.div>

          <motion.div 
            className="hero-visuals"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <div className="device-frame">
              <img src="/app-preview.png" alt="App Preview" className="device-screen" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1601972599720-36938d4ecd31?auto=format&fit=crop&w=600&q=80'; }} />
            </div>

            <motion.div 
              className="editorial-float pos-1"
              animate={{ y: [-15, 15, -15] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            >
              <ShieldCheck className="float-icon-elegant" size={24} />
              <div className="float-title">سهولة الطلب</div>
              <div className="float-sub">تتبع ذكي للطلبات</div>
            </motion.div>

            <motion.div 
              className="editorial-float pos-2"
              animate={{ y: [15, -15, 15] }}
              transition={{ repeat: Infinity, duration: 8, ease: "easeInOut", delay: 1 }}
            >
              <RefreshCw className="float-icon-elegant" size={24} />
              <div className="float-title">تحديثات فورية</div>
              <div className="float-sub">لا تفوت أي عرض</div>
            </motion.div>
          </motion.div>

        </div>
      </section>

      {/* Features Zigzag */}
      <section className="download-section features-section">
        <div className="download-container">
          <motion.div
            className="features-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="section-eyebrow">مميزات التطبيق</span>
            <h2 className="editorial-title" style={{ textAlign: 'center', marginBottom: '16px' }}>
              مصمم من أجلك
            </h2>
            <p className="features-section-sub">كل تفصيلة صُممت لتجعل تجربتك أسهل وأجمل</p>
          </motion.div>

          <div className="features-zigzag">
            {features.map((feat, idx) => (
              <motion.div
                key={idx}
                className="feature-row"
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Text Side */}
                <div className="feature-info">
                  <div className="feature-tag">0{idx + 1}</div>
                  <h3 className="feature-row-title">{feat.title}</h3>
                  <div className="feature-divider" />
                  <p className="feature-row-desc">{feat.desc}</p>
                  <div className="feature-arrow">
                    <span>اكتشف المزيد</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>

                {/* Visual Side */}
                <div className="feature-visual">
                  <div className="visual-card">
                    <div className="visual-card-bg" />
                    <div className="visual-ring ring-outer" />
                    <div className="visual-ring ring-mid" />
                    <div className="visual-ring ring-inner" />
                    <div className="visual-icon-wrapper">
                      <div className="visual-icon">{feat.icon}</div>
                    </div>
                    <div className="visual-card-label">{feat.title}</div>
                    <div className="visual-card-dots">
                      {[0,1,2].map(d => <span key={d} className={`dot ${d === 0 ? 'dot-active' : ''}`} />)}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Vertical Organic Timeline */}
      <section className="download-section Vertical-section">
        <div className="download-container">
          <motion.div 
            style={{ textAlign: 'center' }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
          <h2 className="editorial-title">من التحميل إلى الاستلام</h2>
          </motion.div>

          <div className="timeline-editorial">
            <div className="timeline-track">
              <div className="timeline-progress"></div>
            </div>

            {['حمل التطبيق مجاناً', 'تصفح أحدث التشكيلات', 'اختر ما يناسبك', 'استلم طلبك بسرعة'].map((step, idx) => (
              <motion.div 
                key={idx} 
                className="timeline-step"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
              >
                <div className="step-content">
                  <h4 className="step-title">{step}</h4>
                  <p className="step-desc">خطوات بسيطة ومصممة لراحتك التامة في كل مرحلة.</p>
                </div>
                <div className="step-node"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Minimalist FAQ */}
      <section className="download-section">
        <div className="download-container">
          <h2 className="editorial-title" style={{ textAlign: 'center' }}>لديك أسئلة؟</h2>
          
          <div className="faq-minimal">
            {faqs.map((faq, idx) => (
              <motion.div 
                key={idx} 
                className={`faq-row ${openFaq === idx ? 'active' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <button 
                  className="faq-question" 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                >
                  {faq.q}
                  <span className="faq-toggle">
                    <Plus size={24} />
                  </span>
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="faq-answer"
                    >
                      <div className="faq-answer-inner">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Grand CTA */}
      <section className="cta-grand">
        <motion.div 
          className="cta-content"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="cta-title">مستعد للبدء؟</h2>
          <button className="btn-premium" onClick={handleDownload} style={{ padding: '20px 50px', fontSize: '1.25rem' }}>
            <Download size={24} />
            حمل التطبيق الآن
          </button>
        </motion.div>
      </section>

    </div>
  );
};

export default DownloadApp;
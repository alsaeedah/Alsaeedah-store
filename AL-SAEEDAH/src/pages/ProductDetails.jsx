import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { createPortal } from 'react-dom';

import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useVideo } from '../context/VideoContext';
import { useLoader } from '../context/LoaderContext';

import {
  ShoppingCart, PlayCircle, Image as ImageIcon,
  Check, ShieldCheck, Truck, RotateCcw, Award,
  Share2, ChevronRight, ChevronLeft, Tag, Info, Copy,
  Heart, Star, X, ZoomIn, Watch, Gem, Clock,
  Droplets, Maximize2, Home, Package, HelpCircle,
  FileText, MapPin, AlertCircle, ChevronDown, ChevronUp,
  Sparkles, CircleDot, Wind, Layers
} from 'lucide-react';

import { subscribeToProducts, subscribeToProduct } from '../services/productService';
import ProductOptionsModal from '../components/ProductOptionsModal';

/* ─────────────────────────────────────────────
   Animation variants
───────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, delay: i * 0.08, ease: [0.25, 0.8, 0.25, 1] }
  })
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.25, 0.8, 0.25, 1] } }
};

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const getYouTubeId = (url) => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v(?:id)?\/|.*v=)|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

const getCategoryLabel = (cat) =>
  cat === 'men' ? 'ساعات رجالية' :
  cat === 'women' ? 'ساعات نسائية' :
  cat === 'children' ? 'ساعات أطفال' : 'ساعات فاخرة';

const getStyleLabel = (style) =>
  style === 'classic' ? 'كلاسيك' :
  style === 'formal' ? 'رسمي' :
  style === 'wedding' ? 'عرائسي' :
  style === 'smart' ? 'سمارت' :
  style === 'sport' ? 'سبورت' : 'أخرى';

/* ─────────────────────────────────────────────
   Skeleton Loader
───────────────────────────────────────────── */
const SkeletonLoader = () => (
  <div className="pdp-skeleton">
    <div className="pdp-skeleton-left">
      <div className="skeleton-main-img shimmer" />
      <div className="skeleton-thumbs">
        {[0,1,2].map(i => <div key={i} className="skeleton-thumb shimmer" />)}
      </div>
    </div>
    <div className="pdp-skeleton-right">
      <div className="skeleton-line shimmer" style={{width:'40%', height:'14px'}} />
      <div className="skeleton-line shimmer" style={{width:'80%', height:'40px', marginTop:'16px'}} />
      <div className="skeleton-line shimmer" style={{width:'30%', height:'50px', marginTop:'24px'}} />
      <div className="skeleton-line shimmer" style={{width:'100%', height:'120px', marginTop:'32px', borderRadius:'16px'}} />
      <div className="skeleton-line shimmer" style={{width:'100%', height:'70px', marginTop:'24px', borderRadius:'14px'}} />
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Lightbox Portal
───────────────────────────────────────────── */
const Lightbox = ({ images, activeIndex, onClose, onChange }) => {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onChange((activeIndex + 1) % images.length);
      if (e.key === 'ArrowLeft') onChange((activeIndex - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeIndex, images.length]);

  return createPortal(
    <motion.div
      className="lightbox-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
    >
      <button className="lightbox-close" onClick={onClose} aria-label="إغلاق">
        <X size={22} />
      </button>

      {images.length > 1 && (
        <>
          <button className="lightbox-nav lightbox-nav--prev"
            onClick={(e) => { e.stopPropagation(); onChange((activeIndex - 1 + images.length) % images.length); }}
            aria-label="السابق">
            <ChevronLeft size={28} />
          </button>
          <button className="lightbox-nav lightbox-nav--next"
            onClick={(e) => { e.stopPropagation(); onChange((activeIndex + 1) % images.length); }}
            aria-label="التالي">
            <ChevronRight size={28} />
          </button>
          
          <div className="lightbox-dots" onClick={(e) => e.stopPropagation()}>
            {images.map((_, i) => (
              <button
                key={i}
                className={`lightbox-dot ${i === activeIndex ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onChange(i); }}
                aria-label={`صورة ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}

      <motion.div
        className="lightbox-content"
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.88, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.8, 0.25, 1] }}
        onClick={e => e.stopPropagation()}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={activeIndex}
            src={images[activeIndex]}
            alt={`صورة ${activeIndex + 1}`}
            className="lightbox-img"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.28 }}
          />
        </AnimatePresence>
      </motion.div>
    </motion.div>,
    document.body
  );
};

/* ─────────────────────────────────────────────
   Hero Gallery (Left Column)
───────────────────────────────────────────── */
const HeroGallery = ({ product, mediaMode, setMediaMode, activeImage, setActiveImage }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const { activeVideoId, setActiveVideoId, setIsVideoPlaying } = useVideo();
  const videoRef = useRef(null);
  const iframeRef = useRef(null);

  const allImages = [...new Set([product.imageUrl, ...(product.images || [])].filter(Boolean))];

  const handleThumbnailClick = (img, idx) => {
    setActiveImage(img);
    setMediaMode('image');
    setIsVideoPlaying(false);
  };

  const handleMainImageClick = () => {
    if (mediaMode === 'image' && allImages.length > 0) {
      const idx = allImages.indexOf(activeImage);
      setLightboxIndex(idx >= 0 ? idx : 0);
      setLightboxOpen(true);
    }
  };

  const renderMedia = () => {
    if (mediaMode === 'video') {
      const videoUrl = product.video;
      if (!videoUrl) return null;
      if (videoUrl.startsWith('data:video')) {
        return <video ref={videoRef} src={videoUrl} controls autoPlay loop className="hero-main-media" />;
      }
      const ytId = getYouTubeId(videoUrl);
      if (ytId) {
        return (
          <iframe
            ref={iframeRef}
            className="hero-main-media"
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
            frameBorder="0" allowFullScreen
            title="product video"
            style={{ border: 'none', borderRadius: '16px' }}
          />
        );
      }
      return <video ref={videoRef} src={videoUrl} controls autoPlay loop className="hero-main-media" />;
    }

    return (
      <motion.img
        key={activeImage}
        src={activeImage || product.imageUrl}
        alt={product.name}
        className="hero-main-media hero-main-img"
        onClick={handleMainImageClick}
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.45, ease: [0.25, 0.8, 0.25, 1] }}
        loading="eager"
      />
    );
  };

  return (
    <div className="hero-gallery">
      {/* Thumbnail strip */}
      {allImages.length > 1 && (
        <div className="hero-thumb-strip" role="list" aria-label="معرض الصور">
          {allImages.map((img, idx) => (
            <motion.button
              key={idx}
              role="listitem"
              className={`hero-thumb ${activeImage === img && mediaMode === 'image' ? 'active' : ''}`}
              onClick={() => handleThumbnailClick(img, idx)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={`صورة ${idx + 1}`}
            >
              <img src={img} alt="" loading="lazy" />
            </motion.button>
          ))}
          {product.video && (
            <motion.button
              className={`hero-thumb hero-thumb--video ${mediaMode === 'video' ? 'active' : ''}`}
              onClick={() => {
                setMediaMode('video');
                setActiveVideoId(product.id);
                setIsVideoPlaying(true);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="تشغيل الفيديو"
            >
              <PlayCircle size={24} />
            </motion.button>
          )}
        </div>
      )}

      {/* Main image canvas */}
      <div className="hero-main-canvas">
        {/* Radial glow background */}
        <div className="hero-canvas-glow" />

        <AnimatePresence mode="wait">
          {renderMedia()}
        </AnimatePresence>

        {/* Zoom hint */}
        {mediaMode === 'image' && (
          <div className="hero-zoom-hint" aria-hidden="true">
            <ZoomIn size={16} />
            <span>اضغط للتكبير</span>
          </div>
        )}

        {/* Video toggle (when single image, no strip) */}
        {product.video && allImages.length <= 1 && (
          <button
            className="hero-video-fab"
            onClick={() => {
              const newMode = mediaMode === 'image' ? 'video' : 'image';
              setMediaMode(newMode);
              setActiveVideoId(product.id);
              setIsVideoPlaying(newMode === 'video');
            }}
            aria-label={mediaMode === 'image' ? 'تشغيل الفيديو' : 'عرض الصور'}
          >
            {mediaMode === 'image' ? <PlayCircle size={18} /> : <ImageIcon size={18} />}
            {mediaMode === 'image' ? 'تشغيل الفيديو' : 'عرض الصور'}
          </button>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <Lightbox
            images={allImages}
            activeIndex={lightboxIndex}
            onClose={() => setLightboxOpen(false)}
            onChange={setLightboxIndex}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Trust Cards
───────────────────────────────────────────── */
const trustItems = [
  { icon: Award, title: 'منتج أصلي', sub: 'مضمون 100%' },
  { icon: Truck, title: 'توصيل سريع', sub: 'لجميع المناطق' },
  { icon: ShieldCheck, title: 'ضمان الجودة', sub: 'خدمة ما بعد البيع' },
  { icon: RotateCcw, title: 'استرجاع سهل', sub: 'خلال 7 أيام' },
];

const TrustCardsSection = () => {
  return (
    <motion.section 
      className="trust-section"
      variants={fadeIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
    >
      <div className="trust-grid">
        {trustItems.map((item, i) => (
          <motion.div
            key={i}
            className="trust-card"
            whileHover={{ y: -4, borderColor: 'rgba(212,175,55,0.4)' }}
            transition={{ duration: 0.25 }}
          >
            <item.icon size={26} className="trust-icon" strokeWidth={1.5} />
            <div className="trust-text">
              <span className="trust-title">{item.title}</span>
              <span className="trust-sub">{item.sub}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

/* ─────────────────────────────────────────────
   Product Info (Right Column)
───────────────────────────────────────────── */
const ProductInfo = ({ product, discountValue, onAddToCart, onBuyNow }) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const isFav = isFavorite(product.id);
  const shareUrl = `https://timetick.vercel.app/product/${product.id}`;

  const handleShare = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="product-info">
      <motion.div variants={fadeUp} custom={0} initial="hidden" animate="visible">
        {/* Category badge */}
        <span className="pi-category-badge">{getCategoryLabel(product.category)}</span>

        {/* Product name */}
        <h1 className="pi-title">{product.name}</h1>

        {/* SKU row */}
        <div className="pi-sku-row">
          <div className="pi-sku-chip">
            <span className="sku-label">REF:</span>
            <span className="sku-value">{product.displayId || '---'}</span>
            {product.displayId && (
              <button
                className={`btn-sku-copy ${codeCopied ? 'copied' : ''}`}
                onClick={() => { navigator.clipboard.writeText(product.displayId); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); }}
                aria-label="نسخ رقم المنتج"
              >
                {codeCopied ? <Check size={13} strokeWidth={3} /> : <Copy size={13} />}
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Price block */}
      <motion.div variants={fadeUp} custom={1} initial="hidden" animate="visible" className="pi-price-block">
        <div className="pi-price-row">
          <span className="pi-price">{Number(product.price).toLocaleString()}</span>
          <span className="pi-currency">ر.س</span>
          {discountValue && (
            <span className="pi-discount-badge">خصم {discountValue}%</span>
          )}
        </div>
        {discountValue && (
          <div className="pi-old-price-row">
            <span className="pi-old-price">{Number(product.old_price).toLocaleString()} ر.س</span>
            <span className="pi-savings">وفر {(Number(product.old_price) - Number(product.price)).toLocaleString()} ر.س</span>
          </div>
        )}
        <p className="pi-tax-note">السعر شامل ضريبة القيمة المضافة</p>
        <div className="pi-availability">
          <span className="avail-dot" />
          <span>متوفر في المخزون</span>
        </div>
      </motion.div>



      {/* Primary actions */}
      <motion.div variants={fadeUp} custom={3} initial="hidden" animate="visible" className="pi-actions">

        <motion.button
          className="btn-add-cart"
          onClick={onAddToCart}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          id="btn-add-cart"
        >
          <Package size={20} strokeWidth={1.5} />
          أضف إلى السلة
        </motion.button>

        <div className="pi-icon-actions">
          <motion.button
            className={`btn-icon-action ${isFav ? 'active-fav' : ''}`}
            onClick={() => toggleFavorite(product)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={isFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
            id="btn-wishlist"
          >
            <Heart size={20} fill={isFav ? 'var(--primary)' : 'none'} stroke={isFav ? 'var(--primary)' : 'currentColor'} />
          </motion.button>

          <motion.button
            className={`btn-icon-action ${copied ? 'copied' : ''}`}
            onClick={handleShare}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="مشاركة المنتج"
            id="btn-share"
          >
            {copied ? <Check size={20} strokeWidth={3} /> : <Share2 size={20} strokeWidth={1.5} />}
          </motion.button>
        </div>
      </motion.div>

      {/* Style tag */}
      {product.style && (
        <motion.div variants={fadeUp} custom={4} initial="hidden" animate="visible" className="pi-style-tag">
          <Tag size={14} strokeWidth={1.5} />
          <span>موديل {getStyleLabel(product.style)}</span>
        </motion.div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Sticky Purchase Bar
───────────────────────────────────────────── */
const StickyPurchaseBar = ({ product, discountValue, heroRef, onBuyNow }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      const heroBottom = heroRef.current.getBoundingClientRect().bottom;
      setVisible(heroBottom < 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="sticky-bar"
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.8, 0.25, 1] }}
          role="complementary"
          aria-label="شريط الشراء السريع"
        >
          <div className="sticky-bar-inner">
            <img
              src={product.imageUrl || product.image}
              alt={product.name}
              className="sticky-bar-img"
            />
            <div className="sticky-bar-info">
              <span className="sticky-bar-name">{product.name}</span>
              <span className="sticky-bar-price">{Number(product.price).toLocaleString()} ر.س</span>
            </div>
            <motion.button
              className="sticky-bar-btn"
              onClick={onBuyNow}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              id="sticky-add-cart"
            >
              <ShoppingCart size={18} />
              أضف للسلة
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ─────────────────────────────────────────────
   Specs Strip
───────────────────────────────────────────── */
const specsConfig = (product) => [
  { icon: CircleDot, label: 'الحركة', value: 'كوارتز دقيق' },
  { icon: Layers, label: 'الهيكل', value: 'ستانلس ستيل 316L' },
  { icon: Tag, label: 'السوار', value: 'جلد طبيعي فاخر' },
  { icon: Gem, label: 'الزجاج', value: 'كريستال مقاوم للخدش' },
  { icon: Droplets, label: 'مقاومة الماء', value: '30 متر' },
  { icon: Maximize2, label: 'قطر الهيكل', value: '42 مم' },
  { icon: ShieldCheck, label: 'الضمان', value: 'سنة كاملة' },
  { icon: MapPin, label: 'المنشأ', value: getCategoryLabel(product.category) },
];

const SpecsStrip = ({ product }) => (
  <motion.section
    className="specs-strip-section"
    variants={fadeIn}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '-80px' }}
  >
    <div className="specs-strip-scroll">
      {specsConfig(product).map((spec, i) => (
        <motion.div
          key={i}
          className="spec-card"
          custom={i}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          whileHover={{ y: -6, borderColor: 'rgba(212,175,55,0.5)' }}
          transition={{ duration: 0.25 }}
        >
          <div className="spec-icon-wrap">
            <spec.icon size={22} strokeWidth={1.4} />
          </div>
          <span className="spec-label">{spec.label}</span>
          <span className="spec-value">{spec.value}</span>
        </motion.div>
      ))}
    </div>
  </motion.section>
);

/* ─────────────────────────────────────────────
   Storytelling Section
───────────────────────────────────────────── */
const storyFeatures = [
  { icon: Gem, title: 'مواد فاخرة', desc: 'مصنوعة من أجود الخامات العالمية المنتقاة بعناية' },
  { icon: CircleDot, title: 'حركة دقيقة', desc: 'آلية سويسرية عالية الدقة تضمن ثبات التوقيت' },
  { icon: Sparkles, title: 'زجاج مقاوم', desc: 'كريستال يابايروتيك يقاوم الخدوش والصدمات' },
  { icon: Clock, title: 'رفاهية يومية', desc: 'صُمِّمت لتزين معصمك في كل لحظة مميزة' },
];

const StorytellingSection = ({ product }) => (
  <motion.section
    className="story-section"
    variants={fadeIn}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '-60px' }}
  >
    <div className="story-layout">
      {/* Large lifestyle image */}
      <motion.div
        className="story-image-wrap"
        variants={scaleIn}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="story-image-inner">
          <img
            src={product.imageUrl || product.image}
            alt={product.name}
            className="story-lifestyle-img"
            loading="lazy"
          />
          <div className="story-img-overlay" />
          <div className="story-img-label">
            <Sparkles size={14} />
            <span>تصميم استثنائي</span>
          </div>
        </div>
      </motion.div>

      {/* Text content */}
      <div className="story-text-side">
        <motion.span
          className="story-eyebrow"
          variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }}
        >
          — حكاية الرفاهية
        </motion.span>

        <motion.h2
          className="story-headline"
          variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}
        >
          حين يصبح الوقت <span>تحفة فنية</span>
        </motion.h2>

        <motion.p
          className="story-paragraph"
          variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}
        >
          كل ساعة في مجموعتنا تحكي قصة من الأناقة والدقة. ليست مجرد أداة لقياس الوقت، بل هي تعبير عن شخصيتك وأسلوبك الفريد.
        </motion.p>

        <div className="story-features-grid">
          {storyFeatures.map((feat, i) => (
            <motion.div
              key={i}
              className="story-feat-card"
              custom={i + 3}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.25 }}
            >
              <div className="story-feat-icon">
                <feat.icon size={20} strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="story-feat-title">{feat.title}</h4>
                <p className="story-feat-desc">{feat.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </motion.section>
);

/* ─────────────────────────────────────────────
   Info Tabs
───────────────────────────────────────────── */
const tabList = [
  { id: 'description', label: 'الوصف', icon: FileText },
  { id: 'specs', label: 'المواصفات', icon: Watch },
];

const SpecsTable = ({ product }) => {
  const rows = [
    ['العلامة التجارية', 'السعيدة ستور'],
    ['الموديل', product.name],
    ['الحركة', 'كوارتز ياباني'],
    ['مادة الهيكل', 'ستانلس ستيل 316L'],
    ['مادة السوار', 'جلد طبيعي / ستانلس ستيل'],
    ['الزجاج', 'كريستال مقاوم للخدش'],
    ['مقاومة الماء', '30 متر (3ATM)'],
    ['قطر الهيكل', '42 مم'],
    ['الوزن', 'حوالي 85 جرام'],
    ['الضمان', 'سنة كاملة'],
    ['بلد المنشأ', 'ياباني / سويسري'],
  ];
  return (
    <table className="specs-table" aria-label="مواصفات المنتج">
      <tbody>
        {rows.map(([key, val], i) => (
          <tr key={i} className={i % 2 === 0 ? 'even' : 'odd'}>
            <td className="specs-table-key">{key}</td>
            <td className="specs-table-val">{val}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const InfoTabs = ({ product }) => {
  const [active, setActive] = useState('description');

  return (
    <motion.section
      className="tabs-section"
      variants={fadeIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
    >
      {/* Tab header */}
      <div className="tabs-header" role="tablist" aria-label="تفاصيل المنتج">
        {tabList.map(tab => (
          <button
            key={tab.id}
            role="tab"
            className={`tab-btn ${active === tab.id ? 'active' : ''}`}
            onClick={() => setActive(tab.id)}
            aria-selected={active === tab.id}
            id={`tab-${tab.id}`}
          >
            <tab.icon size={16} strokeWidth={1.5} />
            <span>{tab.label}</span>
            {active === tab.id && (
              <motion.div className="tab-underline" layoutId="tab-underline" />
            )}
          </button>
        ))}
      </div>

      {/* Tab panel */}
      <div className="tab-panel-wrap" role="tabpanel">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.3, ease: [0.25, 0.8, 0.25, 1] }}
          >
            {active === 'description' && (
              <div className="tab-content-description">
                <p className="tab-description-text">
                  {product.description || 'ساعة فاخرة تجمع بين الأناقة الكلاسيكية والتقنية الحديثة. مصنوعة من أجود المواد وبدقة متناهية لتمنحك تجربة فريدة في قياس الوقت. تتميز بتصميم عصري يناسب جميع المناسبات.'}
                </p>
                {product.style && (
                  <div className="tab-desc-tags">
                    <span className="desc-tag"><Tag size={13} /> {getStyleLabel(product.style)}</span>
                    <span className="desc-tag"><Watch size={13} /> {getCategoryLabel(product.category)}</span>
                  </div>
                )}
              </div>
            )}

            {active === 'specs' && (
              <div className="tab-content-specs">
                <SpecsTable product={product} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.section>
  );
};

/* ─────────────────────────────────────────────
   Related Products Carousel
───────────────────────────────────────────── */
const RelatedCard = ({ product: p }) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const navigate = useNavigate();
  const isFav = isFavorite(p.id);

  return (
    <motion.div
      className="rel-card"
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: [0.25, 0.8, 0.25, 1] }}
    >
      <div
        className="rel-card-img-wrap"
        onClick={() => { navigate(`/product/${p.id}`); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        role="button"
        tabIndex={0}
        aria-label={`عرض ${p.name}`}
      >
        <img
          src={p.image || p.imageUrl}
          alt={p.name}
          className="rel-card-img"
          loading="lazy"
        />
        <div className="rel-card-overlay" />
      </div>
      <div className="rel-card-body">
        <button
          className={`rel-card-fav ${isFav ? 'active' : ''}`}
          onClick={() => toggleFavorite(p)}
          aria-label={isFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
        >
          <Heart size={16} fill={isFav ? 'var(--primary)' : 'none'} stroke={isFav ? 'var(--primary)' : 'currentColor'} />
        </button>
        <p
          className="rel-card-name"
          onClick={() => { navigate(`/product/${p.id}`); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        >{p.name}</p>
        <span className="rel-card-price">{Number(p.price).toLocaleString()} ر.س</span>
      </div>
    </motion.div>
  );
};

const RelatedCarousel = ({ products }) => {
  const trackRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const SCROLL_BY = 320;

  const scroll = (dir) => {
    if (!trackRef.current) return;
    trackRef.current.scrollBy({ left: dir * SCROLL_BY, behavior: 'smooth' });
  };

  const checkScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  useEffect(() => {
    const el = trackRef.current;
    if (el) { el.addEventListener('scroll', checkScroll, { passive: true }); checkScroll(); }
    return () => el?.removeEventListener('scroll', checkScroll);
  }, [products]);

  if (!products.length) return null;

  return (
    <motion.section
      className="related-section"
      variants={fadeIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
    >
      <div className="related-header">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <span className="related-eyebrow">استكشف المزيد</span>
          <h2 className="related-title">قد <span>يعجبك</span> أيضاً</h2>
        </motion.div>
        <div className="related-nav-btns">
          <button
            className={`rel-nav-btn ${!canPrev ? 'disabled' : ''}`}
            onClick={() => scroll(-1)}
            disabled={!canPrev}
            aria-label="السابق"
          >
            <ChevronRight size={20} />
          </button>
          <button
            className={`rel-nav-btn ${!canNext ? 'disabled' : ''}`}
            onClick={() => scroll(1)}
            disabled={!canNext}
            aria-label="التالي"
          >
            <ChevronLeft size={20} />
          </button>
        </div>
      </div>

      <div className="related-track" ref={trackRef}>
        {products.slice(0, 12).map((p, i) => (
          <motion.div
            key={p.id}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <RelatedCard product={p} />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { showLoader, hideLoader } = useLoader();
  const { activeVideoId, setActiveVideoId, isVideoPlaying, setIsVideoPlaying } = useVideo();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mediaMode, setMediaMode] = useState('image');
  const [activeImage, setActiveImage] = useState('');
  const [showModal, setShowModal] = useState(false);

  const heroRef = useRef(null);

  /* ── Sync video context ── */
  useEffect(() => {
    if (activeVideoId !== id && mediaMode === 'video') setMediaMode('image');
    if (!isVideoPlaying && mediaMode === 'video') setMediaMode('image');
  }, [activeVideoId, id, mediaMode, isVideoPlaying]);

  /* ── Load product ── */
  useEffect(() => {
    showLoader('تحميل تفاصيل المنتج...');
    setLoading(true);
    const unsubscribe = subscribeToProduct(id, (data) => {
      if (data) {
        setProduct(data);
        if (data.video && data.imageUrl?.includes('placehold.co')) setMediaMode('video');
        const firstImage = data.imageUrl || (data.images?.length > 0 ? data.images[0] : '');
        setActiveImage(firstImage);
      } else {
        setProduct(null);
      }
      setLoading(false);
      hideLoader();
    });
    return () => unsubscribe();
  }, [id]);

  /* ── Load related products ── */
  useEffect(() => {
    const fetchRelated = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .neq('id', id)
        .limit(12);
      if (data) {
        setRelatedProducts(data.map(p => ({
          ...p,
          price: Number(p.price) || 0,
          image: p.imageUrl || p.image || 'https://placehold.co/400x500/1a1a1a/ffffff?text=No+Image',
          video: p.video || ''
        })));
      }
    };
    fetchRelated();
  }, [id]);

  const handleBuyNow = () => setShowModal(true);
  const handleAddToCart = () => setShowModal(true);

  /* ── Empty / error state ── */
  if (loading) return (
    <div className="pdp-container">
      <SkeletonLoader />
    </div>
  );

  if (!product) {
    return (
      <motion.div
        className="pdp-not-found"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="not-found-icon"
        >
          <Info size={60} color="var(--primary)" />
        </motion.div>
        <h2>المنتج غير موجود</h2>
        <p>نعتذر، يبدو أن المنتج الذي تبحث عنه غير متوفر أو تم نقله.</p>
        <motion.button
          className="btn-buy-now"
          style={{ width: 'auto', padding: '14px 36px', marginTop: '8px' }}
          onClick={() => { navigate('/'); window.scrollTo(0, 0); }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          <Home size={18} /> العودة للمتجر
        </motion.button>
      </motion.div>
    );
  }

  const discountValue = product.old_price && Number(product.old_price) > Number(product.price)
    ? Math.round(((Number(product.old_price) - Number(product.price)) / Number(product.old_price)) * 100)
    : null;

  return (
    <article className="pdp-container" dir="rtl">
      <div className="pdp-content-wrapper">
        {/* Breadcrumb */}
        <nav className="pdp-breadcrumb" aria-label="مسار التنقل">
          <button onClick={() => navigate('/')} className="breadcrumb-link">
            <Home size={14} /> الرئيسية
          </button>
          <ChevronLeft size={13} className="breadcrumb-sep" />
          <span className="breadcrumb-current">{product.name}</span>
        </nav>

        {/* ── HERO: Gallery + Info ── */}
        <div className="pdp-hero" ref={heroRef}>
          <HeroGallery
            product={product}
            mediaMode={mediaMode}
            setMediaMode={setMediaMode}
            activeImage={activeImage}
            setActiveImage={setActiveImage}
          />
          <ProductInfo
            product={product}
            discountValue={discountValue}
            onBuyNow={handleBuyNow}
            onAddToCart={handleAddToCart}
          />
        </div>

        {/* ── TRUST CARDS ── */}
        <TrustCardsSection />

        {/* ── STORYTELLING ── */}
        <StorytellingSection product={product} />

        {/* ── INFO TABS ── */}
        <InfoTabs product={product} />

        {/* ── RELATED CAROUSEL ── */}
        <RelatedCarousel products={relatedProducts} />
      </div>

      {/* ── STICKY BAR ── */}
      <StickyPurchaseBar
        product={product}
        discountValue={discountValue}
        heroRef={heroRef}
        onBuyNow={handleBuyNow}
      />

      {/* ── Cart/Buy Modal ── */}
      <ProductOptionsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        product={product}
        onConfirm={(options) => addToCart(product, options)}
      />

      {/* ═══════════════════════════════════════════════
          ALL STYLES
      ══════════════════════════════════════════════ */}
      <style>{`
        /* ── Container ── */
        .pdp-container {
          position: relative;
          width: 100%;
          min-height: 100vh;
          background: var(--bg-main);
          overflow-x: hidden;
        }
        .pdp-content-wrapper {
          max-width: 1550px;
          margin: 0 auto;
          width: 100%;
          display: flex;
          flex-direction: column;
        }

        /* ── Breadcrumb ── */
        .pdp-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 100px 60px 0;
          font-size: 0.88rem;
          color: var(--text-dim);
          position: relative;
          z-index: 10;
        }
        .breadcrumb-link {
          display: flex;
          align-items: center;
          gap: 5px;
          background: none;
          border: none;
          color: var(--text-dim);
          cursor: pointer;
          font-family: var(--font-main);
          font-size: 0.88rem;
          transition: color 0.2s;
          padding: 0;
        }
        .breadcrumb-link:hover { color: var(--primary); }
        .breadcrumb-sep { color: var(--text-dim); opacity: 0.5; }
        .breadcrumb-current {
          color: var(--text-main);
          font-weight: 600;
          max-width: 280px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* ── Hero Layout ── */
        .pdp-hero {
          display: grid;
          grid-template-columns: minmax(0, 60fr) minmax(0, 40fr);
          min-height: 90vh;
          padding: 40px 60px 80px;
          gap: 4vw;
          align-items: start;
          position: relative;
        }

        /* ── Hero Gallery ── */
        .hero-gallery {
          display: flex;
          gap: 20px;
          position: sticky;
          top: 80px;
          height: fit-content;
        }

        /* Thumbnail Strip */
        .hero-thumb-strip {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex-shrink: 0;
        }
        .hero-thumb {
          width: 72px;
          height: 72px;
          border-radius: 14px;
          overflow: hidden;
          border: 2px solid transparent;
          background: var(--bg-card);
          cursor: pointer;
          transition: border-color 0.25s, transform 0.25s;
          padding: 0;
          outline: none;
        }
        .hero-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .hero-thumb.active,
        .hero-thumb:hover {
          border-color: var(--primary);
        }
        .hero-thumb--video {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          font-size: 0.7rem;
          flex-direction: column;
          gap: 4px;
          background: rgba(212,175,55,0.05);
          border-color: rgba(212,175,55,0.2);
        }
        .hero-thumb--video.active { border-color: var(--primary); }

        /* Main Canvas */
        .hero-main-canvas {
          flex: 1;
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          background: var(--bg-card);
          min-height: 68vh;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-color);
          align-self: stretch;
        }
        .hero-canvas-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 50%, rgba(212,175,55,0.08) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }
        .hero-main-media {
          position: relative;
          z-index: 1;
          width: 100%;
          height: 100%;
          object-fit: contain;
          cursor: zoom-in;
          transition: transform 0.5s ease;
        }
        .hero-main-canvas:hover .hero-main-img { transform: scale(1.04); }
        .hero-zoom-hint {
          position: absolute;
          bottom: 16px;
          left: 16px;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(10px);
          border-radius: 50px;
          font-size: 0.78rem;
          color: rgba(255,255,255,0.7);
          pointer-events: none;
        }
        [data-theme='light'] .hero-zoom-hint {
          background: rgba(255,255,255,0.75);
          color: rgba(0,0,0,0.6);
        }
        .hero-video-fab {
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 50px;
          color: #fff;
          font-family: var(--font-main);
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          backdrop-filter: blur(12px);
          transition: all 0.3s ease;
        }
        .hero-video-fab:hover { background: var(--primary); color: #000; border-color: var(--primary); }

        /* ── Lightbox ── */
        .lightbox-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0,0,0,0.92);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          backdrop-filter: blur(8px);
        }
        .lightbox-content {
          position: relative;
          max-width: 90vw;
          max-height: 90vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .lightbox-img {
          max-width: 80vw;
          max-height: 85vh;
          object-fit: contain;
          border-radius: 12px;
          box-shadow: 0 40px 80px rgba(0,0,0,0.6);
        }
        .lightbox-close {
          position: absolute;
          top: 32px;
          right: 32px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
          z-index: 20;
        }
        .lightbox-close:hover { background: rgba(255,255,255,0.2); }
        .lightbox-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff;
          width: 54px;
          height: 54px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
          z-index: 20;
        }
        .lightbox-nav:hover { background: rgba(255,255,255,0.22); }
        .lightbox-nav--prev { left: 32px; }
        .lightbox-nav--next { right: 32px; }
        .lightbox-dots {
          position: absolute;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 10px;
          z-index: 20;
        }
        .lightbox-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: rgba(255,255,255,0.3);
          border: none;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
          padding: 0;
        }
        .lightbox-dot.active {
          background: var(--primary);
          transform: scale(1.3);
        }

        /* ── Product Info ── */
        .product-info {
          display: flex;
          flex-direction: column;
          width: 100%;
          box-sizing: border-box;
          gap: 32px;
          padding-top: 12px;
        }
        .pi-category-badge {
          display: inline-block;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--primary);
          margin-bottom: 10px;
        }
        .pi-title {
          font-size: clamp(2rem, 3.5vw, 3rem);
          font-weight: 900;
          color: var(--text-main);
          line-height: 1.15;
          margin: 0 0 16px 0;
          font-family: var(--font-heading);
        }
        .pi-sku-row {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .pi-sku-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 14px;
          border-radius: 50px;
          border: 1px solid var(--border-color);
          background: var(--bg-card);
        }
        .sku-label { font-size: 0.78rem; color: var(--text-dim); font-weight: 600; }
        .sku-value { font-size: 0.95rem; font-weight: 800; color: var(--text-main); letter-spacing: 1.5px; }
        .btn-sku-copy {
          background: none;
          border: none;
          color: var(--text-dim);
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }
        .btn-sku-copy:hover { color: var(--primary); }
        .btn-sku-copy.copied { color: #10B981; }
        .pi-rating {
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .star-filled { color: var(--primary); }
        .star-empty { color: var(--text-dim); }
        .pi-rating-count {
          font-size: 0.85rem;
          color: var(--text-dim);
          margin-right: 4px;
        }

        /* Price block */
        .pi-price-block {
          padding-bottom: 28px;
          border-bottom: 1px solid var(--border-color);
        }
        .pi-price-row {
          display: flex;
          align-items: baseline;
          gap: 10px;
          flex-wrap: wrap;
        }
        .pi-price {
          font-size: clamp(2.4rem, 4vw, 3.5rem);
          font-weight: 900;
          color: var(--primary);
          font-family: var(--font-body);
          line-height: 1;
        }
        .pi-currency {
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--text-secondary);
        }
        .pi-discount-badge {
          background: rgba(239,68,68,0.1);
          color: #ef4444;
          border: 1px solid rgba(239,68,68,0.25);
          padding: 5px 12px;
          border-radius: 50px;
          font-size: 0.88rem;
          font-weight: 800;
          align-self: center;
        }
        .pi-old-price-row {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 8px;
          flex-wrap: wrap;
        }
        .pi-old-price {
          font-size: 1.2rem;
          color: var(--text-dim);
          text-decoration: line-through;
        }
        .pi-savings {
          font-size: 0.88rem;
          color: #10B981;
          font-weight: 700;
        }
        .pi-tax-note {
          font-size: 0.8rem;
          color: var(--text-dim);
          margin-top: 8px;
        }
        .pi-availability {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
          font-size: 0.88rem;
          color: #10B981;
          font-weight: 700;
        }
        .avail-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #10B981;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.2);
          animation: pulse-avail 2s infinite;
          flex-shrink: 0;
        }
        @keyframes pulse-avail {
          0%, 100% { box-shadow: 0 0 0 3px rgba(16,185,129,0.2); }
          50% { box-shadow: 0 0 0 6px rgba(16,185,129,0.08); }
        }

        /* Trust cards */
        .trust-section {
          padding: 0 60px 40px;
        }
        .trust-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .trust-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 12px;
          padding: 24px 16px;
          border-radius: 16px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          transition: border-color 0.3s, transform 0.25s;
        }
        .trust-card:hover { transform: translateY(-4px); }
        .trust-icon { color: var(--primary); }
        .trust-title {
          display: block;
          font-size: 1.05rem;
          font-weight: 800;
          color: var(--text-main);
          margin-bottom: 4px;
        }
        .trust-sub {
          display: block;
          font-size: 0.85rem;
          color: var(--text-dim);
        }

        /* Action buttons */
        .pi-actions {
          display: flex;
          flex-direction: column;
          width: 100%;
          gap: 12px;
        }
        .btn-add-cart {
          width: 100%;
          height: 62px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: var(--primary);
          color: #000;
          font-size: 1.1rem;
          font-weight: 900;
          border: none;
          border-radius: 14px;
          cursor: pointer;
          font-family: var(--font-main);
          box-shadow: 0 12px 32px rgba(212,175,55,0.3);
          transition: all 0.3s ease;
        }
        .btn-add-cart:hover {
          background: #c9a227;
          box-shadow: 0 18px 40px rgba(212,175,55,0.45);
          transform: scale(1.02);
        }
        .pi-icon-actions {
          display: flex;
          width: 100%;
          gap: 10px;
        }
        .btn-icon-action {
          flex: 1;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          border: 1px solid var(--primary);
          background: transparent;
          color: var(--primary);
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .btn-icon-action:hover {
          background: rgba(212,175,55,0.08);
        }
        .btn-icon-action.active-fav {
          border-color: var(--primary);
          background: rgba(212,175,55,0.08);
        }
        .btn-icon-action.copied {
          border-color: #10B981;
          color: #10B981;
        }
        .pi-style-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          border-radius: 50px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          font-size: 0.88rem;
          color: var(--text-secondary);
          font-weight: 600;
          width: fit-content;
        }

        /* ── Sticky Bar ── */
        .sticky-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 999;
          background: var(--glass);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border-color);
          box-shadow: 0 4px 24px rgba(0,0,0,0.15);
        }
        .sticky-bar-inner {
          display: flex;
          align-items: center;
          gap: 16px;
          max-width: 1400px;
          margin: 0 auto;
          padding: 12px 40px;
        }
        .sticky-bar-img {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          object-fit: cover;
          border: 1px solid var(--border-color);
          flex-shrink: 0;
        }
        .sticky-bar-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .sticky-bar-name {
          font-size: 0.92rem;
          font-weight: 700;
          color: var(--text-main);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sticky-bar-price {
          font-size: 1rem;
          font-weight: 900;
          color: var(--primary);
        }
        .sticky-bar-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 24px;
          background: var(--primary);
          color: #000;
          border: none;
          border-radius: 10px;
          font-family: var(--font-main);
          font-size: 0.9rem;
          font-weight: 900;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.25s;
          flex-shrink: 0;
        }
        .sticky-bar-btn:hover { background: #c9a227; }

        /* ── Specs Strip ── */
        .specs-strip-section {
          padding: 80px 60px;
          background: var(--bg-card);
          border-top: 1px solid var(--border-color);
          border-bottom: 1px solid var(--border-color);
        }
        .specs-strip-scroll {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 16px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .specs-strip-scroll::-webkit-scrollbar { display: none; }
        .spec-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 24px 16px;
          border-radius: 16px;
          background: var(--bg-main);
          border: 1px solid var(--border-color);
          text-align: center;
          min-width: 110px;
          cursor: default;
          transition: all 0.3s ease;
        }
        .spec-card:hover { transform: translateY(-6px); }
        .spec-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(212,175,55,0.08);
          border: 1px solid rgba(212,175,55,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          flex-shrink: 0;
        }
        .spec-label {
          font-size: 0.75rem;
          color: var(--text-dim);
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .spec-value {
          font-size: 0.85rem;
          font-weight: 800;
          color: var(--text-main);
          line-height: 1.3;
        }

        /* ── Storytelling ── */
        .story-section {
          padding: 100px 60px;
          background: var(--bg-main);
        }
        .story-layout {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 80px;
          align-items: center;
          max-width: 1400px;
          margin: 0 auto;
        }
        .story-image-wrap {
          position: relative;
        }
        .story-image-inner {
          position: relative;
          border-radius: 24px;
          overflow: hidden;
          aspect-ratio: 3/4;
        }
        .story-lifestyle-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.8s ease;
        }
        .story-image-inner:hover .story-lifestyle-img { transform: scale(1.04); }
        .story-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%);
        }
        .story-img-label {
          position: absolute;
          bottom: 24px;
          right: 24px;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: rgba(212,175,55,0.15);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(212,175,55,0.3);
          border-radius: 50px;
          color: var(--primary);
          font-size: 0.82rem;
          font-weight: 700;
        }
        .story-text-side {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }
        .story-eyebrow {
          font-size: 0.82rem;
          font-weight: 600;
          letter-spacing: 2px;
          color: var(--primary);
          text-transform: uppercase;
        }
        .story-headline {
          font-size: clamp(2rem, 3vw, 2.8rem);
          font-weight: 900;
          color: var(--text-main);
          line-height: 1.2;
          margin: 0;
        }
        .story-headline span { color: var(--primary); }
        .story-paragraph {
          font-size: 1.05rem;
          line-height: 1.85;
          color: var(--text-secondary);
          margin: 0;
        }
        .story-features-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .story-feat-card {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 18px;
          border-radius: 14px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          transition: all 0.3s ease;
        }
        .story-feat-card:hover { border-color: rgba(212,175,55,0.35); transform: translateY(-4px); }
        .story-feat-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(212,175,55,0.08);
          border: 1px solid rgba(212,175,55,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          flex-shrink: 0;
        }
        .story-feat-title {
          font-size: 0.9rem;
          font-weight: 800;
          color: var(--text-main);
          margin: 0 0 4px 0;
        }
        .story-feat-desc {
          font-size: 0.8rem;
          color: var(--text-dim);
          line-height: 1.5;
          margin: 0;
        }

        /* ── Info Tabs ── */
        .tabs-section {
          padding: 80px 60px;
          background: var(--bg-card);
          border-top: 1px solid var(--border-color);
        }
        .tabs-header {
          display: flex;
          gap: 4px;
          border-bottom: 1px solid var(--border-color);
          margin-bottom: 48px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .tabs-header::-webkit-scrollbar { display: none; }
        .tab-btn {
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 22px;
          background: none;
          border: none;
          color: var(--text-dim);
          font-family: var(--font-main);
          font-size: 0.92rem;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: color 0.25s;
        }
        .tab-btn.active { color: var(--text-main); }
        .tab-btn:hover { color: var(--text-main); }
        .tab-underline {
          position: absolute;
          bottom: -1px;
          left: 0; right: 0;
          height: 2px;
          background: var(--primary);
          border-radius: 2px;
        }
        .tab-panel-wrap { min-height: 300px; }

        /* Description tab */
        .tab-description-text {
          font-size: 1.05rem;
          line-height: 1.9;
          color: var(--text-secondary);
          max-width: 760px;
        }
        .tab-desc-tags {
          display: flex;
          gap: 10px;
          margin-top: 24px;
          flex-wrap: wrap;
        }
        .desc-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 16px;
          border-radius: 50px;
          background: var(--bg-main);
          border: 1px solid var(--border-color);
          font-size: 0.85rem;
          color: var(--text-secondary);
          font-weight: 600;
        }

        /* Specs table */
        .specs-table {
          width: 100%;
          max-width: 700px;
          border-collapse: collapse;
        }
        .specs-table tr { border-bottom: 1px solid var(--border-color); }
        .specs-table tr.even { background: var(--bg-main); }
        .specs-table tr.odd { background: transparent; }
        .specs-table td { padding: 14px 18px; font-size: 0.92rem; }
        .specs-table-key {
          color: var(--text-dim);
          font-weight: 700;
          width: 40%;
        }
        .specs-table-val {
          color: var(--text-main);
          font-weight: 600;
        }

        /* Shipping tab */
        .shipping-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          max-width: 800px;
        }
        .shipping-card {
          padding: 28px 24px;
          border-radius: 16px;
          background: var(--bg-main);
          border: 1px solid var(--border-color);
          transition: border-color 0.3s;
        }
        .shipping-card:hover { border-color: rgba(212,175,55,0.3); }
        .shipping-card-icon {
          color: var(--primary);
          margin-bottom: 14px;
        }
        .shipping-card h4 {
          font-size: 1rem;
          font-weight: 800;
          color: var(--text-main);
          margin: 0 0 8px 0;
        }
        .shipping-card p {
          font-size: 0.88rem;
          line-height: 1.65;
          color: var(--text-dim);
          margin: 0;
        }

        /* FAQ tab */
        .faq-item {
          border-bottom: 1px solid var(--border-color);
        }
        .faq-item:first-child { border-top: 1px solid var(--border-color); }
        .faq-question {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 4px;
          background: none;
          border: none;
          text-align: right;
          font-family: var(--font-main);
          font-size: 0.98rem;
          font-weight: 700;
          color: var(--text-main);
          cursor: pointer;
          transition: color 0.2s;
        }
        .faq-question:hover { color: var(--primary); }
        .faq-answer {
          overflow: hidden;
        }
        .faq-answer p {
          padding: 0 4px 20px;
          font-size: 0.92rem;
          line-height: 1.8;
          color: var(--text-secondary);
          margin: 0;
        }

        /* ── Related Carousel ── */
        .related-section {
          padding: 100px 60px;
          background: var(--bg-main);
          border-top: 1px solid var(--border-color);
        }
        .related-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 48px;
          gap: 20px;
        }
        .related-eyebrow {
          display: block;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--primary);
          margin-bottom: 10px;
        }
        .related-title {
          font-size: clamp(1.8rem, 3vw, 2.6rem);
          font-weight: 900;
          color: var(--text-main);
          margin: 0;
        }
        .related-title span { color: var(--primary); }
        .related-nav-btns {
          display: flex;
          gap: 10px;
          flex-shrink: 0;
        }
        .rel-nav-btn {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          border: 1.5px solid var(--border-color);
          background: transparent;
          color: var(--text-main);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s;
        }
        .rel-nav-btn:hover:not(.disabled) {
          border-color: var(--primary);
          color: var(--primary);
          background: rgba(212,175,55,0.08);
        }
        .rel-nav-btn.disabled { opacity: 0.3; cursor: default; }
        .related-track {
          display: flex;
          gap: 24px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          padding-bottom: 4px;
        }
        .related-track::-webkit-scrollbar { display: none; }
        .related-track > * {
          scroll-snap-align: start;
          flex-shrink: 0;
          width: 280px;
        }

        /* Related card */
        .rel-card {
          border-radius: 18px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .rel-card:hover { box-shadow: 0 20px 50px rgba(0,0,0,0.2); }
        .rel-card-img-wrap {
          position: relative;
          aspect-ratio: 4/5;
          overflow: hidden;
          cursor: pointer;
          background: var(--bg-main);
        }
        .rel-card-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          transition: transform 0.5s ease;
        }
        .rel-card:hover .rel-card-img { transform: scale(1.06); }
        .rel-card-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0);
          transition: background 0.3s;
        }
        .rel-card:hover .rel-card-overlay { background: rgba(0,0,0,0.08); }
        .rel-card-body {
          padding: 16px;
          position: relative;
        }
        .rel-card-fav {
          position: absolute;
          top: 14px;
          left: 14px;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid var(--border-color);
          background: var(--bg-card);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s;
          color: var(--text-dim);
        }
        .rel-card-fav:hover, .rel-card-fav.active {
          border-color: var(--primary);
          color: var(--primary);
        }
        .rel-card-name {
          font-size: 0.92rem;
          font-weight: 700;
          color: var(--text-main);
          line-height: 1.4;
          margin: 0 0 8px 0;
          padding-right: 44px;
          cursor: pointer;
          transition: color 0.2s;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .rel-card-name:hover { color: var(--primary); }
        .rel-card-price {
          font-size: 1rem;
          font-weight: 900;
          color: var(--primary);
          display: block;
        }

        /* ── Skeleton ── */
        .pdp-skeleton {
          display: grid;
          grid-template-columns: 60% 40%;
          gap: 60px;
          padding: 120px 60px 80px;
          min-height: 90vh;
          align-items: start;
        }
        .pdp-skeleton-left, .pdp-skeleton-right {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .skeleton-main-img {
          width: 100%;
          aspect-ratio: 4/5;
          border-radius: 20px;
        }
        .skeleton-thumbs {
          display: flex;
          gap: 10px;
        }
        .skeleton-thumb {
          width: 72px;
          height: 72px;
          border-radius: 14px;
        }
        .skeleton-line {
          border-radius: 8px;
        }
        @keyframes shimmer {
          0% { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
        .shimmer {
          background: linear-gradient(90deg,
            var(--bg-card) 25%,
            rgba(255,255,255,0.06) 50%,
            var(--bg-card) 75%
          );
          background-size: 600px 100%;
          animation: shimmer 1.6s infinite ease-in-out;
        }
        [data-theme='light'] .shimmer {
          background: linear-gradient(90deg,
            #eeeeee 25%, #f8f8f8 50%, #eeeeee 75%
          );
          background-size: 600px 100%;
          animation: shimmer 1.6s infinite ease-in-out;
        }

        /* ── Not found ── */
        .pdp-not-found {
          min-height: 80vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          padding: 80px 24px;
          text-align: center;
        }
        .not-found-icon {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: rgba(212,175,55,0.08);
          border: 1px solid rgba(212,175,55,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pdp-not-found h2 {
          font-size: 2rem;
          font-weight: 900;
          color: var(--text-main);
          margin: 0;
        }
        .pdp-not-found p {
          font-size: 1.05rem;
          color: var(--text-dim);
          max-width: 380px;
          line-height: 1.6;
          margin: 0;
        }

        /* ════════════════════════════════
           RESPONSIVE — DESKTOP ≤1440px
        ════════════════════════════════ */
        @media (max-width: 1440px) {
          .pdp-hero {
            grid-template-columns: minmax(0, 58fr) minmax(0, 42fr);
          }
        }

        /* ════════════════════════════════
           RESPONSIVE — LAPTOP ≤1200px
        ════════════════════════════════ */
        @media (max-width: 1200px) {
          .pdp-hero {
            grid-template-columns: minmax(0, 55fr) minmax(0, 45fr);
            padding: 32px 50px 60px;
            gap: 3vw;
          }
          .pdp-breadcrumb { padding: 90px 50px 0; }
          .trust-section { padding: 0 50px 40px; }
          .story-section { padding: 70px 50px; }
          .tabs-section { padding: 60px 50px; }
          .related-section { padding: 70px 50px; }
        }

        /* ════════════════════════════════
           RESPONSIVE — TABLET LANDSCAPE ≤1024px
        ════════════════════════════════ */
        @media (max-width: 1024px) {
          .pdp-hero {
            grid-template-columns: minmax(0, 52fr) minmax(0, 48fr);
            padding: 30px 40px 60px;
            gap: 40px;
          }
          .pdp-breadcrumb { padding: 90px 40px 0; }
          .trust-section { padding: 0 40px 40px; }
          .story-layout { gap: 50px; }
          .story-section { padding: 60px 40px; }
          .tabs-section { padding: 50px 40px; }
          .related-section { padding: 60px 40px; }
        }

        /* ════════════════════════════════
           RESPONSIVE — TABLET PORTRAIT ≤850px
        ════════════════════════════════ */
        @media (max-width: 850px) {
          .pdp-hero {
            display: flex;
            flex-direction: column;
            padding: 30px 30px 80px;
            gap: 40px;
            min-height: unset;
          }
          .pdp-breadcrumb { padding: 90px 30px 0; }
          
          /* Gallery takes full width when stacked */
          .hero-gallery {
            width: 100%;
          }
          .hero-main-canvas {
            min-height: 50vw; /* Keep image tall enough */
          }

          .trust-section { padding: 0 30px 40px; }
          .trust-grid { grid-template-columns: 1fr 1fr; }

          .story-section { padding: 60px 30px; }
          .story-layout { grid-template-columns: 1fr; gap: 40px; }
          .tabs-section { padding: 50px 30px; }
          .related-section { padding: 60px 30px; }
        }

        /* ════════════════════════════════
           RESPONSIVE — MOBILE ≤768px
        ════════════════════════════════ */
        @media (max-width: 768px) {
          .pdp-breadcrumb {
            padding: 88px 20px 0;
            font-size: 0.82rem;
          }
          .breadcrumb-current { max-width: 160px; }

          .pdp-hero {
            padding: 20px 20px 100px;
            gap: 32px;
          }

          .hero-gallery {
            flex-direction: column-reverse;
            position: static;
          }
          .hero-thumb-strip {
            flex-direction: row;
            overflow-x: auto;
            scrollbar-width: none;
            padding-bottom: 4px;
          }
          .hero-thumb-strip::-webkit-scrollbar { display: none; }
          .hero-thumb {
            width: 60px;
            height: 60px;
            flex-shrink: 0;
          }
          .hero-main-canvas {
            min-height: 60vw;
            max-height: 85vw;
          }

          .pi-title { font-size: 1.9rem; }
          .pi-price { font-size: 2.2rem; }

          .trust-section { padding: 0 20px 40px; }
          .trust-grid { grid-template-columns: 1fr 1fr; }

          .story-section { padding: 60px 20px; }
          .story-image-inner { aspect-ratio: 4/3; }
          .story-features-grid { grid-template-columns: 1fr; }

          .tabs-section { padding: 48px 20px; }
          .specs-table td { padding: 12px 14px; font-size: 0.85rem; }

          .related-section { padding: 60px 20px; }
          .related-track > * { width: 230px; }

          .sticky-bar-inner { padding: 10px 20px; }
          .sticky-bar-name { font-size: 0.85rem; }

          .lightbox-nav--prev { left: 16px; }
          .lightbox-nav--next { right: 16px; }
          .lightbox-close { top: 16px; right: 16px; }
        }

        @media (max-width: 420px) {
          .story-features-grid { grid-template-columns: 1fr; }
          .related-track > * { width: 200px; }
          .pi-title { font-size: 1.6rem; }
        }

        /* ════════════════════════════════
           LIGHT THEME OVERRIDES
        ════════════════════════════════ */
        [data-theme='light'] .hero-main-canvas {
          background: #f5f5f5;
        }
        [data-theme='light'] .pi-discount-badge {
          background: rgba(239,68,68,0.08);
        }
        [data-theme='light'] .hero-video-fab {
          background: rgba(0,0,0,0.06);
          border-color: rgba(0,0,0,0.15);
          color: #111;
        }
        [data-theme='light'] .hero-video-fab:hover {
          background: var(--primary);
          color: #000;
        }
        [data-theme='light'] .lightbox-overlay { background: rgba(0,0,0,0.85); }
      `}</style>
    </article>
  );
};

export default ProductDetails;

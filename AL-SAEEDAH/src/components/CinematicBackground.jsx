import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const CinematicBackground = () => {
  const containerRef = useRef(null);
  
  // Connect scroll progress to parallax
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Gentle Parallax for the aurora waves
  const y1 = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);
  const y2 = useTransform(scrollYProgress, [0, 1], ["15%", "-15%"]);
  
  return (
    <div ref={containerRef} className="cinematic-bg-container">
      {/* Soft Spotlight Reveal */}
      <motion.div 
        className="cinematic-spotlight"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
      
      {/* Elegant Aurora Light Waves */}
      <motion.div style={{ y: y1 }} className="cinematic-aurora wave-1" />
      <motion.div style={{ y: y2 }} className="cinematic-aurora wave-2" />
      
      {/* Slow Moving Golden Orbs */}
      <div className="cinematic-orb orb-1" />
      <div className="cinematic-orb orb-2" />
      
      {/* Subtle Floating Golden Particles */}
      <div className="cinematic-particles">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="particle" style={{
            '--x': `${Math.random() * 100}%`,
            '--delay': `-${Math.random() * 15}s`, // Negative delay means they start immediately at different points
            '--duration': `${15 + Math.random() * 15}s`,
            '--size': `${2 + Math.random() * 2}px`
          }} />
        ))}
      </div>
      
      {/* Noise overlay for texture */}
      <div className="cinematic-noise" />
    </div>
  );
};

export default CinematicBackground;

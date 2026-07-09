import { motion, AnimatePresence } from 'framer-motion';

export default function AnimatedLoader({ isOpen, message }) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(10px)',
                    zIndex: 99999,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {/* Watch face container */}
                <div style={{
                    position: 'relative',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    border: '3px solid rgba(212, 175, 55, 0.2)', // Dimmed gold border
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: '24px',
                    boxShadow: '0 0 30px rgba(212, 175, 55, 0.15)'
                }}>
                    {/* Pulsing glow */}
                    <motion.div
                        animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(212,175,55,0.2) 0%, rgba(0,0,0,0) 70%)'
                        }}
                    />

                    {/* Minute Hand (Fast) */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        style={{
                            position: 'absolute',
                            width: '2px',
                            height: '35px',
                            background: 'var(--primary)', // Gold color
                            transformOrigin: 'bottom',
                            bottom: '50%',
                            borderRadius: '2px'
                        }}
                    />

                    {/* Hour Hand (Slow) */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                        style={{
                            position: 'absolute',
                            width: '3px',
                            height: '25px',
                            background: 'white',
                            transformOrigin: 'bottom',
                            bottom: '50%',
                            borderRadius: '2px'
                        }}
                    />

                    {/* Center Dot */}
                    <div style={{
                        position: 'absolute',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'var(--primary)',
                        zIndex: 2
                    }} />
                </div>

                <motion.h3
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    style={{
                        color: 'var(--text-main)',
                        fontFamily: 'var(--font-main)',
                        fontSize: '1.2rem',
                        fontWeight: '500',
                        letterSpacing: '0.5px'
                    }}
                >
                    {message}
                </motion.h3>
                
                {/* Dots animation for loading text */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    style={{ display: 'flex', gap: '6px', marginTop: '12px' }}
                >
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                            style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: 'var(--primary)'
                            }}
                        />
                    ))}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

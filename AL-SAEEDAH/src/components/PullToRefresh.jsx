import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, ArrowDown, Check } from 'lucide-react';

/**
 * PullToRefresh — Render-Immune Gesture Engine
 *
 * Architecture principles:
 * 1. ZERO re-renders during gesture  — position lives in useRef, not useState.
 * 2. ONE-TIME window listeners       — attached once on mount, never re-bound.
 * 3. Stable handler ref pattern      — handler logic updates via ref so the
 *                                      listener always calls latest logic without
 *                                      needing to re-bind.
 * 4. Fire-and-forget onRefresh       — the indicator retracts IMMEDIATELY on
 *                                      pointer release, independent of data timing.
 * 5. CSS transitions for snap-back   — spring feel without framer-motion during
 *                                      the active gesture.
 * 6. Pointer Capture                 — survives layout shifts / data re-renders.
 */

// ─── Constants ────────────────────────────────────────────────────────────────
const THRESHOLD      = 90;   // px to pull before triggering refresh
const MAX_PULL       = 175;  // max px the circle travels
const INDICATOR_TOP  = 40;   // top offset (under status bar)
const REFRESH_SHOW   = 1200; // ms spinner is shown after release
const SUCCESS_SHOW   = 700;  // ms success tick is shown

// Visual states — only used for icon rendering (never gates gesture logic)
const VS = {
    IDLE:       'idle',
    PULLING:    'pulling',
    READY:      'ready',
    REFRESHING: 'refreshing',
    SUCCESS:    'success',
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function PullToRefresh({ onRefresh, children, disabled = false }) {

    // ── Visual state (React — only for icon switching) ──────────────────────
    const [visualState, setVisualState] = useState(VS.IDLE);

    // ── DOM refs ─────────────────────────────────────────────────────────────
    const wrapperRef   = useRef(null);   // outer div (pointer capture target)
    const circleRef    = useRef(null);   // the floating indicator circle
    const textRef      = useRef(null);   // optional hint text
    const contentRef   = useRef(null);   // children wrapper (slight parallax)

    // ── Gesture state refs (imperative — never cause re-renders) ─────────────
    const pullYRef         = useRef(0);           // current pull distance px
    const gestureStateRef  = useRef(VS.IDLE);     // IDLE | PULLING | READY | REFRESHING | SUCCESS
    const startYRef        = useRef(0);
    const activePointerRef = useRef(null);        // tracked pointer id
    const isPullingRef     = useRef(false);
    const startedAtTopRef  = useRef(false);
    const hasScrolledDownRef = useRef(false);
    const rafRef           = useRef(null);
    const timerRefs        = useRef([]);
    const isResettingRef   = useRef(false);       // prevents new gestures during snap-back

    // ── Stable handler ref — the window listener always calls this ───────────
    const handlerRef = useRef(null);

    // ── disabled ref — lets the window listener (never re-bound) read latest value ──
    const disabledRef = useRef(false);
    useEffect(() => { disabledRef.current = disabled; }, [disabled]);

    // ─── Helpers ──────────────────────────────────────────────────────────────

    const clearTimers = () => {
        timerRefs.current.forEach(clearTimeout);
        timerRefs.current = [];
    };

    const cancelRaf = () => {
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
    };

    /** Apply the current pullY to the DOM — called via requestAnimationFrame */
    const applyVisuals = useCallback(() => {
        const y = pullYRef.current;

        if (circleRef.current) {
            circleRef.current.style.transform  = `translateY(${y}px)`;
            
            // PRD: Gradual opacity / fade-in effect
            circleRef.current.style.opacity    = Math.min(1, y / 25);
            
            // PRD: Slight indicator scaling (0.5 -> 1.1 max)
            const baseScale = 0.5;
            const progress  = Math.min(1.2, y / THRESHOLD);
            circleRef.current.style.scale      = String(baseScale + progress * 0.6);

            const isReady = gestureStateRef.current === VS.READY;
            circleRef.current.style.background = isReady
                ? 'var(--primary)'
                : 'rgba(20, 20, 20, 0.95)';
            circleRef.current.style.color = isReady ? '#000' : 'var(--primary)';
            circleRef.current.style.boxShadow = isReady
                ? '0 0 25px rgba(212, 175, 55, 0.5)'
                : '0 10px 25px rgba(0,0,0,0.6)';
        }

        if (textRef.current) {
            textRef.current.style.transform = `translateY(${y}px)`;
            textRef.current.style.opacity   = Math.min(1, (y - THRESHOLD * 0.4) / (THRESHOLD * 0.4));
        }
    }, []);

    // ─── Animation Utilities (PRD: Spring Effect) ────────────────────────────

    /** 
     * Calculate elastic offset with progressive resistance 
     * FR-1 — Spring Effect During Pull
     */
    const calculateElasticOffset = useCallback((diff) => {
        if (diff <= THRESHOLD) return diff;
        // Progressive resistance: the further you pull, the harder it gets
        // Using a power function for a "heavy" elastic feel
        const extra = diff - THRESHOLD;
        return THRESHOLD + Math.pow(extra, 0.72) * 1.8;
    }, []);

    /** 
     * Apply spring physics to return to target position 
     * Using a damped spring solver for a "premium" feel.
     * FR-2 — Smooth Animation
     */
    const applySpringAnimation = useCallback((targetY, onComplete) => {
        cancelRaf();
        isResettingRef.current = true;

        // Spring parameters for a snappy but soft bounce
        const stiffness = 240; // k
        const damping   = 24;  // d
        const mass      = 1;   // m
        
        let velocity    = 0;
        let lastTime    = performance.now();

        const step = (now) => {
            const dt = Math.min((now - lastTime) / 1000, 0.032); 
            lastTime = now;

            const distance = targetY - pullYRef.current;
            const force    = stiffness * distance;
            const friction = damping * velocity;
            const acceleration = (force - friction) / mass;

            velocity += acceleration * dt;
            pullYRef.current += velocity * dt;

            applyVisuals();

            // Check if settled (close enough to target with low velocity)
            const isSettled = Math.abs(targetY - pullYRef.current) < 0.2 && Math.abs(velocity) < 0.5;
            
            if (isSettled) {
                pullYRef.current = targetY;
                applyVisuals();
                rafRef.current = null;
                if (onComplete) onComplete();
            } else {
                rafRef.current = requestAnimationFrame(step);
            }
        };

        rafRef.current = requestAnimationFrame(step);
    }, [applyVisuals]);

    /** 
     * Standardized reset logic (PRD: Spring return motion)
     * Smoothly returns the indicator to y=0 with a bounce.
     */
    const resetPullAnimation = useCallback(() => {
        applySpringAnimation(0, () => {
            isResettingRef.current = false;
            gestureStateRef.current = VS.IDLE;
            setVisualState(VS.IDLE);
            
            // Clean up any remaining transition styles
            if (circleRef.current) circleRef.current.style.transition = 'none';
            if (textRef.current) textRef.current.style.transition = 'none';
        });
    }, [applySpringAnimation]);

    /** Hard reset — no animation, instant */
    const forceReset = useCallback(() => {
        clearTimers();
        cancelRaf();
        activePointerRef.current   = null;
        isPullingRef.current       = false;
        pullYRef.current           = 0;
        gestureStateRef.current    = VS.IDLE;
        isResettingRef.current     = false;
        applyVisuals();
        [circleRef, textRef].forEach(r => {
            if (r.current) r.current.style.transition = 'none';
        });
        setVisualState(VS.IDLE);
    }, [applyVisuals]);

    // ─── Gesture logic (lives in handlerRef so no re-bind on re-render) ──────

    const onPointerDown = useCallback((e) => {
        // ── Disabled guard — reject gesture when PTR is not allowed on this page/state ──
        if (disabledRef.current) return;

        // Ignore if already tracking a pointer or in a post-gesture animation
        if (activePointerRef.current !== null) return;
        if (isResettingRef.current) return;
        if (gestureStateRef.current === VS.REFRESHING || gestureStateRef.current === VS.SUCCESS) return;

        // Support all pointer types including mouse for desktop parity
        // (FR-5 — Touch & Mouse Support)

        // Safety: if circle is somehow visible, force reset first
        if (pullYRef.current > 0) {
            forceReset();
            return;
        }

        // Check scroll position
        let atTop = window.scrollY <= 0;
        if (atTop) {
            let node = e.target;
            while (node && node !== wrapperRef.current && node !== document.body) {
                if (node.scrollTop > 0) { atTop = false; break; }
                node = node.parentNode;
            }
        }

        startedAtTopRef.current   = atTop;
        hasScrolledDownRef.current = false;
        startYRef.current         = e.clientY;
        activePointerRef.current  = e.pointerId;
        isPullingRef.current      = false;

        // Pointer capture: browser must route all events to us even during layout shifts
        try {
            if (wrapperRef.current) {
                wrapperRef.current.setPointerCapture(e.pointerId);
            }
        } catch (_) { /* ignore */ }
    }, [forceReset]);

    const onPointerMove = useCallback((e) => {
        if (e.pointerId !== activePointerRef.current) return;
        if (gestureStateRef.current === VS.REFRESHING || gestureStateRef.current === VS.SUCCESS) return;

        const diff = e.clientY - startYRef.current;

        // Detect downward scroll intention
        if (diff < -10) hasScrolledDownRef.current = true;

        // Activate pull if: at top, moving down, not scrolling down
        if (
            !isPullingRef.current &&
            startedAtTopRef.current &&
            !hasScrolledDownRef.current &&
            window.scrollY <= 0 &&
            diff > 5
        ) {
            isPullingRef.current = true;
        }

        if (!isPullingRef.current) return;

        // Swiping back above start — cancel
        if (diff <= 0) {
            isPullingRef.current      = false;
            pullYRef.current          = 0;
            gestureStateRef.current   = VS.IDLE;
            cancelRaf();
            applyVisuals();
            return;
        }

        // Elastic resistance logic (PRD: Progressive resistance motion)
        pullYRef.current = Math.min(MAX_PULL, calculateElasticOffset(diff));

        // Update gesture state (ref only — no re-render)
        const newGesture = pullYRef.current >= THRESHOLD ? VS.READY : VS.PULLING;
        if (gestureStateRef.current !== newGesture) {
            gestureStateRef.current = newGesture;
            // Only update React state for icon switching (PULLING vs READY arrow)
            setVisualState(newGesture);
        }

        // Schedule visual update via RAF (smooth, never blocks)
        cancelRaf();
        rafRef.current = requestAnimationFrame(applyVisuals);

        // Lock scroll while pulling
        e.preventDefault();
    }, [applyVisuals]);

    /**
     * The critical fix: onPointerUp / onPointerCancel both call this.
     * The indicator resets IMMEDIATELY on release.
     * onRefresh is fire-and-forget — its completion does NOT gate the animation.
     */
    const onPointerUp = useCallback((e, isCancel = false) => {
        if (e.pointerId !== activePointerRef.current) return;

        const wasPulling    = isPullingRef.current;
        const wasReady      = gestureStateRef.current === VS.READY;

        // Immediately clear gesture tracking
        activePointerRef.current = null;
        isPullingRef.current     = false;

        // Release pointer capture
        try {
            if (wrapperRef.current && wrapperRef.current.hasPointerCapture(e.pointerId)) {
                wrapperRef.current.releasePointerCapture(e.pointerId);
            }
        } catch (_) { /* ignore */ }

        // If cancel or not really pulling — just reset
        if (isCancel || !wasPulling) {
            if (pullYRef.current > 0) resetPullAnimation();
            return;
        }

        if (wasReady) {
            // ── Case A: Threshold reached ──────────────────────────────────
            clearTimers();
            
            // Snap to loading position (y=65) with a quick spring bounce
            applySpringAnimation(65);

            // Show spinner
            gestureStateRef.current = VS.REFRESHING;
            setVisualState(VS.REFRESHING);

            // 2. Fire onRefresh as fire-and-forget
            try {
                const refreshResult = onRefresh?.();
                if (refreshResult && typeof refreshResult.catch === 'function') {
                    refreshResult.catch(() => { /* swallow */ });
                }
            } catch (_) { /* swallow */ }

            // 3. Fixed timer for success → reset
            const t1 = setTimeout(() => {
                gestureStateRef.current = VS.SUCCESS;
                setVisualState(VS.SUCCESS);

                const t2 = setTimeout(() => {
                    resetPullAnimation();
                }, SUCCESS_SHOW);
                timerRefs.current.push(t2);
            }, REFRESH_SHOW);
            timerRefs.current.push(t1);

        } else {
            // ── Case B: Threshold NOT reached — just retract ───────────────
            gestureStateRef.current = VS.IDLE;
            resetPullAnimation();
        }
    }, [resetPullAnimation, applySpringAnimation, onRefresh]);

    // ─── One-time window listener mount ───────────────────────────────────────
    // These NEVER re-attach (empty dep array).
    // They call handlerRef.current so they always get the latest logic.
    useEffect(() => {
        const onDown   = (e) => handlerRef.current?.onPointerDown(e);
        const onMove   = (e) => handlerRef.current?.onPointerMove(e);
        const onUp     = (e) => handlerRef.current?.onPointerUp(e, false);
        const onCancel = (e) => handlerRef.current?.onPointerUp(e, true);

        window.addEventListener('pointerdown',   onDown,   { passive: true });
        window.addEventListener('pointermove',   onMove,   { passive: false });
        window.addEventListener('pointerup',     onUp,     { passive: true });
        window.addEventListener('pointercancel', onCancel, { passive: true });
        window.addEventListener('lostpointercapture', onCancel, { passive: true });

        return () => {
            window.removeEventListener('pointerdown',   onDown);
            window.removeEventListener('pointermove',   onMove);
            window.removeEventListener('pointerup',     onUp);
            window.removeEventListener('pointercancel', onCancel);
            window.removeEventListener('lostpointercapture', onCancel);
        };
    }, []); // ← EMPTY — never re-runs

    // ─── Keep handlerRef up to date on every render (no listener re-bind) ────
    useEffect(() => {
        handlerRef.current = { onPointerDown, onPointerMove, onPointerUp };
    });

    // ─── Safety: force-reset if disabled while a pull is in progress ────────
    useEffect(() => {
        if (disabled && pullYRef.current > 0) {
            forceReset();
        }
    }, [disabled, forceReset]);

    // ─── Cleanup on unmount ───────────────────────────────────────────────────
    useEffect(() => {
        return () => {
            clearTimers();
            cancelRaf();
        };
    }, []);

    // ─── Prevent native browser overscroll / pull-to-refresh ─────────────────
    useEffect(() => {
        const blockNative = (e) => {
            if (isPullingRef.current || pullYRef.current > 0) {
                if (e.cancelable) e.preventDefault();
            }
        };
        document.addEventListener('touchmove', blockNative, { passive: false });
        return () => document.removeEventListener('touchmove', blockNative);
    }, []);

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div
            ref={wrapperRef}
            className="ptr-wrapper"
            style={{
                position:  'relative',
                minHeight: '100vh',
                overflowX: 'hidden',
                width:     '100%',
                maxWidth:  '100%',
            }}
        >
            {/* ── Indicator Layer ── */}
            <div
                style={{
                    position:      'fixed',
                    top:           0,
                    left:          0,
                    width:         '100%',
                    display:       'flex',
                    flexDirection: 'column',
                    alignItems:    'center',
                    zIndex:        999999,
                    pointerEvents: 'none',
                    height:        0,
                    overflow:      'visible',
                }}
            >
                {/* Circle indicator */}
                <div
                    ref={circleRef}
                    style={{
                        width:          50,
                        height:         50,
                        borderRadius:   '50%',
                        background:     'rgba(20, 20, 20, 0.95)',
                        border:         '1px solid rgba(212, 175, 55, 0.3)',
                        boxShadow:      '0 10px 25px rgba(0,0,0,0.6)',
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                        color:          'var(--primary)',
                        marginTop:      INDICATOR_TOP,
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        opacity:        0,
                        scale:          '0.5',
                        transform:      'translateY(0px)',
                        transition:     'none',
                        willChange:     'transform, opacity, scale',
                    }}
                >
                    {/* Spinner */}
                    {visualState === VS.REFRESHING && (
                        <div
                            style={{
                                animation: 'ptr-spin 1s linear infinite',
                                display:   'flex',
                            }}
                        >
                            <RefreshCw size={22} strokeWidth={2.5} />
                        </div>
                    )}

                    {/* Success checkmark */}
                    {visualState === VS.SUCCESS && (
                        <div style={{ animation: 'ptr-pop 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
                            <Check size={22} strokeWidth={3} />
                        </div>
                    )}

                    {/* Arrow (pull or ready) */}
                    {(visualState === VS.PULLING || visualState === VS.READY || visualState === VS.IDLE) && (
                        <div
                            style={{
                                transform:  visualState === VS.READY ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s ease',
                                display:    'flex',
                            }}
                        >
                            <ArrowDown size={22} strokeWidth={2.5} />
                        </div>
                    )}
                </div>

                {/* Hint text */}
                <span
                    ref={textRef}
                    style={{
                        position:      'absolute',
                        top:           98,
                        color:         'var(--primary)',
                        fontSize:      '0.78rem',
                        fontWeight:    'bold',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        textShadow:    '0 2px 4px rgba(0,0,0,0.5)',
                        opacity:       0,
                        transform:     'translateY(0px)',
                        transition:    'none',
                        pointerEvents: 'none',
                        whiteSpace:    'nowrap',
                        willChange:    'transform, opacity',
                    }}
                >
                    {visualState === VS.READY
                        ? 'اترك للتحديث'
                        : visualState === VS.REFRESHING
                            ? 'جاري التحديث...'
                            : visualState === VS.SUCCESS
                                ? 'تم بنجاح'
                                : 'اسحب للتحديث'}
                </span>
            </div>

            {/* ── Content Layer (slight parallax on pull) ── */}
            <div
                ref={contentRef}
                className="ptr-content-layer"
            >
                {children}
            </div>

            {/* ── Keyframe animations ── */}
            <style>{`
                @keyframes ptr-spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
                @keyframes ptr-pop {
                    from { transform: scale(0); opacity: 0; }
                    to   { transform: scale(1); opacity: 1; }
                }
                /* Prevent Chrome/Android native pull-to-refresh */
                /* Removed overscroll-behavior-y: contain; as per PRD to restore native scrolling */
                .ptr-content-layer {
                    transform-origin: top center;
                }
            `}</style>
        </div>
    );
}

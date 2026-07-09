import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    motion,
    useMotionValue,
    useSpring,
    useTransform,
    AnimatePresence,
} from "framer-motion";

function useDockItemSize(
    mouseX,
    baseItemSize,
    magnification,
    distance,
    ref,
    spring
) {
    const mouseDistance = useTransform(mouseX, (val) => {
        if (typeof val !== "number" || isNaN(val)) return 0;
        const rect = ref.current?.getBoundingClientRect() ?? {
            x: 0,
            width: baseItemSize,
        };
        return val - rect.x - baseItemSize / 2;
    });

    const targetSize = useTransform(
        mouseDistance,
        [-distance, 0, distance],
        [baseItemSize, magnification, baseItemSize]
    );

    return useSpring(targetSize, spring);
}

function DockItem({
    icon,
    label,
    onClick,
    mouseX,
    baseItemSize,
    magnification,
    distance,
    spring,
    badgeCount,
}) {
    const ref = useRef(null);
    const isHovered = useMotionValue(0);
    const size = useDockItemSize(
        mouseX,
        baseItemSize,
        magnification,
        distance,
        ref,
        spring
    );
    const [showLabel, setShowLabel] = useState(false);

    useEffect(() => {
        const unsubscribe = isHovered.on("change", (value) =>
            setShowLabel(value === 1)
        );
        return () => unsubscribe();
    }, [isHovered]);

    return (
        <motion.div
            ref={ref}
            style={{
                width: size,
                height: size,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-card)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                position: 'relative',
                cursor: 'pointer',
                border: '1px solid var(--border-color)',
                outline: 'none'
            }}
            onHoverStart={() => isHovered.set(1)}
            onHoverEnd={() => isHovered.set(0)}
            onFocus={() => isHovered.set(1)}
            onBlur={() => isHovered.set(0)}
            onClick={onClick}
            tabIndex={0}
            role="button"
            aria-haspopup="true"
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
            {badgeCount !== undefined && badgeCount > 0 && (
                <span style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20px',
                    height: '20px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: 'white',
                    backgroundColor: '#ef4444',
                    borderRadius: '50%',
                    border: '2px solid var(--bg-card)'
                }}>
                    {badgeCount > 99 ? "99+" : badgeCount}
                </span>
            )}
            <AnimatePresence>
                {showLabel && (
                    <motion.div
                        initial={{ opacity: 0, y: 0 }}
                        animate={{ opacity: 1, y: -10 }}
                        exit={{ opacity: 0, y: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: 'absolute',
                            top: '-35px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 'max-content',
                            whiteSpace: 'pre',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: '#060606',
                            padding: '4px 10px',
                            fontSize: '12px',
                            color: 'white',
                            zIndex: 1000
                        }}
                        role="tooltip"
                    >
                        {label}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default function Dock({
    items,
    className = "",
    spring = { mass: 0.1, stiffness: 150, damping: 12 },
    magnification = 60,
    distance = 150,
    panelHeight = 54,
    baseItemSize = 40,
}) {
    const mouseX = useMotionValue(Infinity);
    const isHovered = useMotionValue(0);

    return (
        <motion.div
            style={{
                height: panelHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 10px',
                maxWidth: '100%',
                position: 'relative'
            }}
            className={className}
        >
            <motion.div
                onMouseMove={({ pageX }) => {
                    isHovered.set(1);
                    mouseX.set(pageX);
                }}
                onMouseLeave={() => {
                    isHovered.set(0);
                    mouseX.set(Infinity);
                }}
                style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '12px',
                    width: 'fit-content',
                    borderRadius: '20px',
                    border: '2px solid var(--border-color)',
                    padding: '0 12px 8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(12px)',
                    height: panelHeight
                }}
                role="toolbar"
                aria-label="Application dock"
            >
                {items.map((item, index) => (
                    <DockItem
                        key={index}
                        icon={item.icon}
                        label={item.label}
                        onClick={item.onClick}
                        mouseX={mouseX}
                        baseItemSize={baseItemSize}
                        magnification={magnification}
                        distance={distance}
                        spring={spring}
                        badgeCount={item.badgeCount}
                    />
                ))}
            </motion.div>
        </motion.div>
    );
}

import { useRef, useEffect } from 'react';
import FilterControls from './FilterControls';
import { motion, AnimatePresence } from 'framer-motion';
import './filters.css';

export default function DesktopFilterPanel(props) {
    const panelRef = useRef(null);

    useEffect(() => {
        const el = panelRef.current;
        if (!el) return;

        const onWheel = (e) => {
            // إذا كان المحتوى قابل للتمرير، نمنع الصفحة من التأثر
            const atTop = el.scrollTop === 0;
            const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;

            const scrollingUp = e.deltaY < 0;
            const scrollingDown = e.deltaY > 0;

            // نوقف الحدث فقط إذا كان التمرير سيؤثر على الـ panel
            // أي: لسنا في أطراف الـ panel، أو المستخدم يتمرر نحو منطقة موجودة
            if (!(atTop && scrollingUp) && !(atBottom && scrollingDown)) {
                e.stopPropagation();
            }
            // في جميع الحالات نمنع الصفحة من التمرير
            e.preventDefault();
            el.scrollTop += e.deltaY;
        };

        // passive: false ضروري حتى نتمكن من استخدام preventDefault
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [props.isOpen]);

    return (
        <AnimatePresence initial={false}>
            {props.isOpen && (
                <motion.aside 
                    ref={panelRef}
                    className="filter-panel"
                    initial={{ width: 0, opacity: 0, padding: 0, border: 'none' }}
                    animate={{ width: 280, opacity: 1, padding: 24, border: '1px solid var(--border-color)' }}
                    exit={{ width: 0, opacity: 0, padding: 0, border: 'none' }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    style={{ whiteSpace: 'nowrap' }}
                >
                    <FilterControls {...props} />
                </motion.aside>
            )}
        </AnimatePresence>
    );
}

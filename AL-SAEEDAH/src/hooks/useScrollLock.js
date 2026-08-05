import { useEffect } from 'react';
import { lenisService } from '../services/lenisService';

// Global reference counter for nested/multiple modals
let lockCount = 0;

export function useScrollLock(isOpen) {
    useEffect(() => {
        if (!isOpen) return;

        lockCount++;

        // Only lock the body on the first modal open
        if (lockCount === 1) {
            lenisService.stop();
            const originalScrollY = window.scrollY;
            
            // Calculate scrollbar width to prevent layout shift
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            
            document.body.style.top = `-${originalScrollY}px`;
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            
            // Compensate for missing scrollbar
            if (scrollbarWidth > 0) {
                document.body.style.paddingRight = `${scrollbarWidth}px`;
            }
            
            document.body.classList.add('no-scroll');
            document.body.dataset.scrollY = originalScrollY.toString();
        }

        return () => {
            lockCount--;

            // Only unlock when the last modal is closed
            if (lockCount === 0) {
                const scrollY = document.body.dataset.scrollY;
                
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                document.body.style.paddingRight = '';
                document.body.classList.remove('no-scroll');
                
                if (scrollY) {
                    const originalScrollBehavior = document.documentElement.style.scrollBehavior;
                    // Disable smooth scrolling temporarily to prevent jumping animation
                    document.documentElement.style.scrollBehavior = 'auto';
                    window.scrollTo(0, parseInt(scrollY));
                    document.documentElement.style.scrollBehavior = originalScrollBehavior;
                }
                
                lenisService.start();
                
                delete document.body.dataset.scrollY;
            }
        };
    }, [isOpen]);
}

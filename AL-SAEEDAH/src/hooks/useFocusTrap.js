import { useEffect, useRef } from 'react';

export function useFocusTrap(isActive, containerRef) {
    const previousFocusRef = useRef(null);

    useEffect(() => {
        if (!isActive || !containerRef.current) return;

        // Save the currently focused element before opening the modal
        previousFocusRef.current = document.activeElement;

        const container = containerRef.current;
        
        // Ensure the container can receive focus programmatically
        if (!container.hasAttribute('tabindex')) {
            container.setAttribute('tabindex', '-1');
        }
        
        // Focus the container itself so keyboard navigation starts inside
        // Add a slight delay to ensure rendering is complete (useful for portals/animations)
        const focusTimeout = setTimeout(() => {
            container.focus();
        }, 50);

        const handleKeyDown = (e) => {
            if (e.key !== 'Tab') return;

            const focusableElements = container.querySelectorAll(
                'a[href], button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );
            
            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            // If Shift + Tab and on the first element, jump to last
            if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            } 
            // If just Tab and on the last element, jump to first
            else if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        };

        container.addEventListener('keydown', handleKeyDown);

        return () => {
            clearTimeout(focusTimeout);
            container.removeEventListener('keydown', handleKeyDown);
            // Restore focus when modal closes
            if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
                previousFocusRef.current.focus();
            }
        };
    }, [isActive, containerRef]);
}

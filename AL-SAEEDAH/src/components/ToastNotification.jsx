import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';

export default function ToastNotification({ message, onClose, duration = 3000 }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger entry animation
        const showTimer = setTimeout(() => setIsVisible(true), 10);

        // Trigger exit animation and removal
        const hideTimer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Wait for fade out animation
        }, duration);

        return () => {
            clearTimeout(showTimer);
            clearTimeout(hideTimer);
        };
    }, [duration, onClose]);

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'rgba(0, 0, 0, 0.9)',
            border: '1px solid var(--primary)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 2000,
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.3s ease-in-out',
            boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
            fontFamily: "'Cairo', sans-serif"
        }}>
            <CheckCircle size={20} color="var(--primary)" />
            <span style={{ fontSize: '0.95rem' }}>{message}</span>
        </div>
    );
}

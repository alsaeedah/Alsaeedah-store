import React, { useEffect, useRef } from 'react';
import { useLoading } from '../context/LoadingContext';

const TopProgressBar = () => {
    const { isLoading } = useLoading();
    const [width, setWidth] = React.useState(0);
    const timer = useRef(null);

    useEffect(() => {
        if (isLoading) {
            setWidth(0);
            timer.current = setInterval(() => {
                setWidth(prev => {
                    if (prev >= 90) { clearInterval(timer.current); return 90; }
                    return prev + Math.random() * 15;
                });
            }, 200);
        } else {
            clearInterval(timer.current);
            setWidth(100);
            const t = setTimeout(() => setWidth(0), 400);
            return () => clearTimeout(t);
        }
        return () => clearInterval(timer.current);
    }, [isLoading]);

    if (width === 0) return null;

    return (
        <div className="loading-bar-container">
            <div className="loading-bar-fill" style={{ width: `${width}%` }} />
        </div>
    );
};

export default TopProgressBar;

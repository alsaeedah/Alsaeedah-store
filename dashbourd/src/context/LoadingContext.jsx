import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const LoadingContext = createContext();

export const useLoading = () => useContext(LoadingContext);

export const LoadingProvider = ({ children }) => {
    const [progress, setProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const intervalRef = useRef(null);

    const startLoading = () => {
        setIsLoading(true);
        setProgress(0);

        if (intervalRef.current) clearInterval(intervalRef.current);

        // Increment progress randomly up to 90%
        intervalRef.current = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) return prev;
                const increment = Math.random() * 10;
                return Math.min(prev + increment, 90);
            });
        }, 200);
    };

    const stopLoading = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setProgress(100);
        setTimeout(() => {
            setIsLoading(false);
            setProgress(0);
        }, 500); // Wait for animation to finish
    };

    return (
        <LoadingContext.Provider value={{ isLoading, progress, startLoading, stopLoading }}>
            {children}
        </LoadingContext.Provider>
    );
};

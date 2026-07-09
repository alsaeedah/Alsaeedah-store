import { createContext, useState, useContext } from 'react';
import AnimatedLoader from '../components/AnimatedLoader';

const LoaderContext = createContext();

export const useLoader = () => useContext(LoaderContext);

export const LoaderProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');

    const showLoader = (message = 'جاري التحميل...') => {
        setLoadingMessage(message);
        setIsLoading(true);
    };

    const hideLoader = () => {
        setIsLoading(false);
        setTimeout(() => setLoadingMessage(''), 300); // Clear after fade out
    };

    return (
        <LoaderContext.Provider value={{ showLoader, hideLoader, isLoading }}>
            {children}
            <AnimatedLoader isOpen={isLoading} message={loadingMessage} />
        </LoaderContext.Provider>
    );
};

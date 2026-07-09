import React from 'react';
import { useLoading } from '../context/LoadingContext';

const TopProgressBar = () => {
    const { isLoading, progress } = useLoading();

    if (!isLoading && progress === 0) return null;

    return (
        <div className="loading-bar-container">
            <div
                className="loading-bar-fill"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
};

export default TopProgressBar;

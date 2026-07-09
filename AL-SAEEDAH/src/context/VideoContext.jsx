import React, { createContext, useContext, useState } from 'react';

const VideoContext = createContext();

export const VideoProvider = ({ children }) => {
    const [activeVideoId, setActiveVideoId] = useState(null);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);

    return (
        <VideoContext.Provider value={{ 
            activeVideoId, setActiveVideoId, 
            isVideoPlaying, setIsVideoPlaying,
            isVideoFullscreen, setIsVideoFullscreen
        }}>
            {children}
        </VideoContext.Provider>
    );
};

export const useVideo = () => {
    const context = useContext(VideoContext);
    if (!context) {
        throw new Error('useVideo must be used within a VideoProvider');
    }
    return context;
};

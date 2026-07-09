import { useEffect } from 'react';


const SEOHelper = () => {
    useEffect(() => {
        // Static metadata or remove dynamic fetching
        updateMetaTags("Time Tick Store - الفخامة في كل ثانية");
    }, []);

    const updateMetaTags = (description) => {
        // Update Description
        const descMeta = document.querySelector('meta[name="description"]');
        if (descMeta) {
            descMeta.setAttribute('content', description);
        } else {
            const newMeta = document.createElement('meta');
            newMeta.name = 'description';
            newMeta.content = description;
            document.head.appendChild(newMeta);
        }

        // Update OG:Description
        const ogDescMeta = document.querySelector('meta[property="og:description"]');
        if (ogDescMeta) {
            ogDescMeta.setAttribute('content', description);
        } else {
            const newMeta = document.createElement('meta');
            newMeta.setAttribute('property', 'og:description');
            newMeta.content = description;
            document.head.appendChild(newMeta);
        }
    };

    return null; // This component doesn't render anything
};

export default SEOHelper;

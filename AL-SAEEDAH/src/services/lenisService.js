import Lenis from 'lenis';

class LenisService {
    constructor() {
        this.lenis = null;
        this.rafId = null;
    }

    init(options) {
        if (this.lenis) return;
        
        this.lenis = new Lenis(options);
        
        const raf = (time) => {
            this.lenis.raf(time);
            this.rafId = requestAnimationFrame(raf);
        };
        
        this.rafId = requestAnimationFrame(raf);
    }

    destroy() {
        if (this.lenis) {
            this.lenis.destroy();
            this.lenis = null;
        }
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    stop() {
        if (this.lenis) this.lenis.stop();
    }

    start() {
        if (this.lenis) this.lenis.start();
    }
}

// Export as a singleton service
export const lenisService = new LenisService();

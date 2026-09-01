import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';

/**
 * LifecycleCoordinator
 * 
 * Centralized mechanism to detect application lifecycle events such as:
 * - App startup / Cold start
 * - Page refresh
 * - Browser tab focus / visibility change
 * - Capacitor App Resume (foreground transition)
 * 
 * Emits 'revalidate' events to subscribers so that background data syncs 
 * can be triggered globally without duplicating logic in every component.
 */
class LifecycleCoordinator {
    constructor() {
        this.listeners = new Set();
        this._setupListeners();
    }

    _setupListeners() {
        if (typeof window !== 'undefined') {
            // Web visibility and focus
            window.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    this._trigger('visibilitychange');
                }
            });

            window.addEventListener('focus', () => {
                if (document.hasFocus()) {
                    this._trigger('focus');
                }
            });
        }

        // Capacitor native resume
        if (Capacitor.isNativePlatform()) {
            try {
                CapApp.addListener('appStateChange', ({ isActive }) => {
                    if (isActive) {
                        this._trigger('appStateChange');
                    }
                });
            } catch (e) {
                console.warn('[LifecycleCoordinator] Failed to register Capacitor listener', e);
            }
        }
    }

    _trigger(reason) {
        // Debounce to prevent multiple simultaneous triggers (e.g., focus + visibilitychange)
        if (this._timeout) {
            clearTimeout(this._timeout);
        }
        
        this._timeout = setTimeout(() => {
            // console.log(`[LifecycleCoordinator] Triggering revalidation due to: ${reason}`);
            this.listeners.forEach(callback => {
                try {
                    callback(reason);
                } catch (e) {
                    console.error('[LifecycleCoordinator] Error in subscriber', e);
                }
            });
        }, 150);
    }

    /**
     * Subscribe to lifecycle revalidation triggers.
     * @param {Function} callback - Called when a revalidation should occur.
     * @returns {Function} Unsubscribe function.
     */
    subscribe(callback) {
        this.listeners.add(callback);
        return () => {
            this.listeners.delete(callback);
        };
    }
}

export const lifecycleCoordinator = new LifecycleCoordinator();

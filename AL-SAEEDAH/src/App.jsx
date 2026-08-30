import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CartProvider, useCart } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FavoritesProvider, useFavorites } from './context/FavoritesContext';
import { VideoProvider } from './context/VideoContext';
import { LoaderProvider } from './context/LoaderContext';
import { useTheme } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';

import HeroCarousel from './components/HeroCarousel';
import StoreNavigation from './components/navigation/StoreNavigation';
import Features from './components/Features';
import BestSellers from './components/BestSellers';
import LatestProducts from './components/LatestProducts';
import ProductList from './components/ProductList';
import ProductDetails from './pages/ProductDetails';
import ResetPasswordPage from './pages/ResetPasswordPage';
import LoginPage from './pages/LoginPage';
import AuthModal from './components/AuthModal';
import LogoutConfirmModal from './components/LogoutConfirmModal';
import ProfileModal from './components/ProfileModal';
import Footer from './components/Footer';
import SEOHelper from './components/SEOHelper';
import ScrollToTop from './components/ScrollToTop';
import BackButtonHandler from './components/BackButtonHandler';
import PullToRefresh from './components/PullToRefresh';
import AppDownloadBanner from './components/AppDownloadBanner';
import DownloadApp from './pages/DownloadApp';

// New Pages
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import ProfilePage from './pages/ProfilePage';
import CheckoutPage from './pages/CheckoutPage';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Shipping from './pages/Shipping';
import Returns from './pages/Returns';
import MenWatches from './pages/MenWatches';
import WomenWatches from './pages/WomenWatches';
import ChildrenWatches from './pages/ChildrenWatches';
import CategoryPage from './pages/CategoryPage';
import BrandPage from './pages/BrandPage';
import SearchPage from './pages/SearchPage';

import { initializeTaxonomies, refreshTaxonomies } from './services/taxonomyService';

import { StatusBar } from '@capacitor/status-bar';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useEffect, useRef, useState, useCallback } from 'react';
import Lenis from 'lenis';
import { lenisService } from './services/lenisService';
import { NotificationService, PushNotificationService, EVENTS, ReminderManager } from './notifications';

// Page transition variants
const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 }
};
const pageTransition = { duration: 0.3, ease: [0.4, 0, 0.2, 1] };

const PageWrapper = ({ children }) => (
  <motion.div
    initial="initial"
    animate="animate"
    exit="exit"
    variants={pageVariants}
    transition={pageTransition}
  >
    {children}
  </motion.div>
);

// Home Page Component
const Home = () => (
  <PageWrapper>
    <HeroCarousel />
    <Features />
    <BestSellers />
    <LatestProducts />
    <ProductList />
  </PageWrapper>
);

// Routes where navbar/footer should be hidden
const ISOLATED_ROUTES = ['/checkout', '/download'];

const ConditionalStoreNavigation = () => {
  const location = useLocation();
  if (ISOLATED_ROUTES.includes(location.pathname)) return null;
  return <StoreNavigation />;
};

const ConditionalFooter = () => {
  const location = useLocation();
  if (ISOLATED_ROUTES.includes(location.pathname)) return null;
  return <Footer />;
};

const ConditionalAppBanner = () => {
  const location = useLocation();
  if (ISOLATED_ROUTES.includes(location.pathname)) return null;
  return <AppDownloadBanner />;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/product/:id" element={<PageWrapper><ProductDetails /></PageWrapper>} />
        
        {/* Search Route */}
        <Route path="/search" element={<PageWrapper><SearchPage /></PageWrapper>} />
        
        {/* Dynamic Taxonomy Route */}
        <Route path="/category/:slugId" element={<PageWrapper><CategoryPage /></PageWrapper>} />
        <Route path="/brand/:slugId" element={<PageWrapper><BrandPage /></PageWrapper>} />

        {/* Legacy Route Redirects */}
        <Route path="/men-watches" element={<PageWrapper><MenWatches /></PageWrapper>} />
        <Route path="/women-watches" element={<PageWrapper><WomenWatches /></PageWrapper>} />
        <Route path="/children-watches" element={<PageWrapper><ChildrenWatches /></PageWrapper>} />

        <Route path="/cart" element={<PageWrapper><CartPage /></PageWrapper>} />
        <Route path="/wishlist" element={<PageWrapper><WishlistPage /></PageWrapper>} />
        <Route path="/profile" element={<PageWrapper><ProfilePage /></PageWrapper>} />
        <Route path="/orders" element={<PageWrapper><ProfilePage initialTab="orders" /></PageWrapper>} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/about" element={<PageWrapper><AboutUs /></PageWrapper>} />
        <Route path="/contact" element={<PageWrapper><ContactUs /></PageWrapper>} />
        <Route path="/terms" element={<PageWrapper><Terms /></PageWrapper>} />
        <Route path="/privacy" element={<PageWrapper><Privacy /></PageWrapper>} />
        <Route path="/shipping" element={<PageWrapper><Shipping /></PageWrapper>} />
        <Route path="/returns" element={<PageWrapper><Returns /></PageWrapper>} />
        <Route path="/reset-password" element={<PageWrapper><ResetPasswordPage /></PageWrapper>} />
        <Route path="/download" element={<PageWrapper><DownloadApp /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
};

// Deep Link Handler Component
const DeepLinkHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHandlingColdStart = useRef(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleUrl = (url, isColdStart = false) => {
      if (!url) return;
      
      console.log(`Handling Deep Link (${isColdStart ? 'Cold' : 'Resume'}):`, url);
      
      let path = '';
      if (url.includes('timetick.vercel.app')) {
        path = url.split('timetick.vercel.app')[1];
      } else if (url.includes('com.timetick.store://')) {
        path = url.split('com.timetick.store://')[1];
        if (path && !path.startsWith('/')) path = '/' + path;
      }

      if (path) {
        path = path.replace(/\/+/g, '/');
        
        if (path.startsWith('/product/') || path.startsWith('/orders') || path.startsWith('/cart')) {
          if (isColdStart || location.pathname !== path) {
            const delay = isColdStart ? 600 : 0;
            setTimeout(() => {
              console.log('Deep Link Navigating to:', path);
              navigate(path, { replace: isColdStart });
            }, delay);
          }
        }
      }
    };

    // 1. Handle Cold Start (App was closed)
    if (!isHandlingColdStart.current) {
      isHandlingColdStart.current = true;
      CapApp.getLaunchUrl().then((launchUrl) => {
        if (launchUrl?.url) {
          const lastHandled = sessionStorage.getItem('lastHandledLaunchUrl');
          if (lastHandled !== launchUrl.url) {
            handleUrl(launchUrl.url, true);
            sessionStorage.setItem('lastHandledLaunchUrl', launchUrl.url);
          }
        }
      });
    }

    // 2. Handle Resume (App was in background)
    const urlListener = CapApp.addListener('appUrlOpen', (event) => {
      handleUrl(event.url, false);
    });

    return () => {
      urlListener.remove();
    };
  }, [navigate, location.pathname]);

  return null;
};


// Pull-to-Refresh Gate
function PullToRefreshGate({ children }) {
  const location = useLocation();
  const { isProfileModalOpen } = useAuth();

  const isNativeApp = Capacitor.isNativePlatform();

  const isAllowedRoute =
    location.pathname === '/' ||
    location.pathname === '/cart' ||
    location.pathname === '/wishlist' ||
    location.pathname === '/profile' ||
    location.pathname === '/orders' ||
    location.pathname.startsWith('/product/');

  const isAnyOverlayOpen = isProfileModalOpen;

  const disabled = !isNativeApp || !isAllowedRoute || isAnyOverlayOpen;

  return (
    <PullToRefresh
      disabled={disabled}
      onRefresh={async () => {
        await refreshTaxonomies();
        window.dispatchEvent(new CustomEvent('app-pull-to-refresh'));
      }}
    >
      {children}
    </PullToRefresh>
  );
}

function SystemBarsSync() {
  const { theme } = useTheme();

  useEffect(() => {
    const isDark  = theme === 'dark';
    const bgColor = isDark ? '#0a0a0a' : '#ffffff';

    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.content = bgColor;

    if (!Capacitor.isNativePlatform()) return;
    StatusBar.setStyle({ style: isDark ? 'LIGHT' : 'DARK' });
  }, [theme]);

  return null;
}

// Auth Gate: renders LoginPage until user is logged in
function AuthGate({ children }) {
  const { currentUser } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    if (currentUser && Capacitor.isNativePlatform()) {
      ReminderManager.resetReminderSchedule();
    }
  }, [currentUser]);

  const publicPaths = ['/download', '/reset-password'];
  if (!currentUser && !publicPaths.includes(location.pathname)) {
    return <LoginPage />;
  }
  
  return children;
}

// Notification Setup: initializes NotificationService inside Router for useNavigate access
function NotificationSetup() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    // Taxonomy Initialization
    initializeTaxonomies();

    if (!Capacitor.isNativePlatform()) return;

    NotificationService.initialize({
      onNotificationTap: (data) => {
        if (data?.target === 'order_history') {
          setTimeout(() => navigate('/orders'), 100);
        }
      }
    }).then(() => {
      const hasLaunched = localStorage.getItem('app_first_launch_completed');
      if (!hasLaunched) {
        localStorage.setItem('app_first_launch_completed', 'true');
        NotificationService.show(EVENTS.FIRST_LAUNCH);
      }
    });

    return () => {
      NotificationService.destroy();
    };
  }, [navigate]);

  useEffect(() => {
    // Non-blocking Push Notification Initialization
    // Runs independently of local notifications and Product SyncEngine
    if (currentUser?.uid) {
      PushNotificationService.initialize(currentUser.uid).catch(console.error);
    }
  }, [currentUser]);

  return null;
}

function App() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setOverlaysWebView({ overlay: true });
      StatusBar.setBackgroundColor({ color: '#00000000' });
    }
  }, []);

  // Initialize Lenis for smooth scrolling
  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (!prefersReducedMotion && !Capacitor.isNativePlatform()) {
      lenisService.init({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        smoothTouch: false,
        touchMultiplier: 2,
      });

      return () => {
        lenisService.destroy();
      };
    }
  }, []);

  return (
    <ErrorBoundary>
      <Router>
          <ScrollToTop />
          <ThemeProvider>
            <LoaderProvider>
              <AuthProvider>
                  <AuthGate>
                    <FavoritesProvider>
                      <VideoProvider>
                          <CartProvider>
                            <NotificationSetup />
                            <DeepLinkHandler />
                            <BackButtonHandler />

                          <SEOHelper />
                          <div className="app-container">
                            <SystemBarsSync />
                            <ConditionalStoreNavigation />
                            <AuthModal />
                            <LogoutConfirmModal />
                            <ProfileModal />
                            <PullToRefreshGate>
                              <AnimatedRoutes />
                            </PullToRefreshGate>
                            <ConditionalFooter />
                            <ConditionalAppBanner />
                          </div>
                        </CartProvider>
                      </VideoProvider>
                    </FavoritesProvider>
                  </AuthGate>
              </AuthProvider>
            </LoaderProvider>
          </ThemeProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;

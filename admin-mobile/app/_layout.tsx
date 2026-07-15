import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { ErrorBoundaryProps } from 'expo-router';

// ─── Error Boundary ───────────────────────────────────────────────────────────
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>حدث خطأ ما!</Text>
      <Text style={styles.errorText}>{error.message}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={retry}>
        <Text style={styles.retryText}>إعادة المحاولة</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Prevent splash auto-hide ─────────────────────────────────────────────────
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// ─── Root Layout ─────────────────────────────────────────────────────────────
export default function RootLayout() {
  const [loaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    // Always hide splash screen — whether fonts loaded or errored.
    // This ensures the screen is never permanently frozen/gray.
    if (loaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, fontError]);

  // Wait for fonts (or error) before rendering
  if (!loaded && !fontError) {
    return null;
  }

  return <RootLayoutNav />;
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    // Firebase initialization — wrapped in try/catch so a missing
    // google-services.json or permissions error never kills the UI.
    let unsubscribe: (() => void) | undefined;

    const initFirebase = async () => {
      try {
        const { requestUserPermission, setupNotificationListeners } =
          await import('./utils/firebaseHelper');
        await requestUserPermission();
        unsubscribe = setupNotificationListeners();
      } catch (error) {
        console.warn('[Firebase] Initialization skipped:', error);
      } finally {
        setFirebaseReady(true);
      }
    };

    initFirebase();

    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (_) {}
      }
    };
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
      </Stack>
    </ThemeProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 28,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#1E3A5F',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

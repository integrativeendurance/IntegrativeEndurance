import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native'; // Re-enable useColorScheme
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UnitsProvider } from '../src/hooks/useUnits'; // Uncomment
// import { CustomThemeProvider, useTheme } from '../src/hooks/useTheme'; // Comment out for now
// import { NotificationProvider } from '../src/hooks/useNotifications'; // Comment out
import { AuthProvider } from '../src/contexts/AuthContext';

// --- Restore simplified theme definitions (ensure fonts match useTheme.js) ---
const AppLightTheme = { /* Copy light theme structure from useTheme.js here */
  dark: false,
  colors: {
    primary: 'rgb(0, 122, 255)',
    background: 'rgb(242, 242, 242)',
    card: 'rgb(255, 255, 255)',
    text: 'rgb(28, 28, 30)',
    border: 'rgb(216, 216, 216)',
    notification: 'rgb(255, 59, 48)',
    error: '#FF5F6D',
    onPrimary: '#ffffff',
    accent: '#FF5F6D',
  },
  // NOTE: Minimal fonts. If variant errors reappear, copy full fontConfig from useTheme.js
  fonts: { 
    regular: { fontFamily: undefined, fontWeight: 'normal' },
    medium: { fontFamily: undefined, fontWeight: 'bold' },
    light: { fontFamily: undefined, fontWeight: 'normal' },
    thin: { fontFamily: undefined, fontWeight: 'normal' },
    // Add other required variants if needed
    bodyLarge: { fontFamily: undefined, fontWeight: 'normal' }, 
    headlineMedium: { fontFamily: undefined, fontWeight: 'bold' },
    titleLarge: { fontFamily: undefined, fontWeight: 'bold' },
    titleMedium: { fontFamily: undefined, fontWeight: 'bold' },
    labelLarge: { fontFamily: undefined, fontWeight: 'normal' },
  }
};

const AppDarkTheme = { /* Copy dark theme structure from useTheme.js here */
  dark: true,
  colors: {
    primary: 'rgb(10, 132, 255)',
    background: 'rgb(1, 1, 1)',
    card: 'rgb(18, 18, 18)',
    text: 'rgb(229, 229, 231)',
    border: 'rgb(39, 39, 41)',
    notification: 'rgb(255, 69, 58)',
    error: '#FF5F6D',
    onPrimary: '#ffffff',
    accent: '#FF5F6D',
  },
  // NOTE: Minimal fonts. If variant errors reappear, copy full fontConfig from useTheme.js
   fonts: { 
    regular: { fontFamily: undefined, fontWeight: 'normal' },
    medium: { fontFamily: undefined, fontWeight: 'bold' },
    light: { fontFamily: undefined, fontWeight: 'normal' },
    thin: { fontFamily: undefined, fontWeight: 'normal' },
    // Add other required variants if needed
    bodyLarge: { fontFamily: undefined, fontWeight: 'normal' },
    headlineMedium: { fontFamily: undefined, fontWeight: 'bold' },
    titleLarge: { fontFamily: undefined, fontWeight: 'bold' },
    titleMedium: { fontFamily: undefined, fontWeight: 'bold' },
    labelLarge: { fontFamily: undefined, fontWeight: 'normal' },
  }
};
// --- End simplified Theme Definitions ---

// function AppContent() { ... } // Comment out for now

export default function RootLayout() {
  const colorScheme = useColorScheme(); // Re-enable useColorScheme
  const theme = colorScheme === 'dark' ? AppDarkTheme : AppLightTheme; // Re-enable theme selection

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <NavThemeProvider value={theme}>
            <UnitsProvider>
              <Stack>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="index" options={{ headerShown: false }} />
              </Stack>
            </UnitsProvider>
          </NavThemeProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </AuthProvider>
  );
} 
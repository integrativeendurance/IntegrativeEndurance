import React, { createContext, useState, useContext } from 'react';
import {
  MD3LightTheme,
  MD3DarkTheme,
  configureFonts,
} from 'react-native-paper';

// Define your font configurations if you have custom fonts
// For now, we'll use undefined which defaults to system fonts
const fontConfig = {
  // Ensure all variants used by Paper are defined here
  // Refer to react-native-paper documentation for default font scales
  // This is a simplified version; you'd typically define fontFamily, fontWeight, etc.
  // for each variant based on your design system.
  // The keys (e.g., 'regular', 'medium', 'bodyLarge') must match what Paper expects.
  // For simplicity, we're ensuring the keys exist.
  // You'll need to populate this with the same structure we added to app/_layout.js
  // For now, let's keep it minimal and consistent with the previous error fixes.
  regular: { fontFamily: undefined, fontWeight: 'normal' },
  medium: { fontFamily: undefined, fontWeight: 'bold' },
  light: { fontFamily: undefined, fontWeight: 'normal' },
  thin: { fontFamily: undefined, fontWeight: 'normal' },
  headlineSmall: { fontFamily: undefined, fontWeight: 'bold' },
  headlineMedium: { fontFamily: undefined, fontWeight: 'bold' },
  headlineLarge: { fontFamily: undefined, fontWeight: 'bold' },
  titleSmall: { fontFamily: undefined, fontWeight: 'bold' },
  titleMedium: { fontFamily: undefined, fontWeight: 'bold' },
  titleLarge: { fontFamily: undefined, fontWeight: 'bold' },
  labelSmall: { fontFamily: undefined, fontWeight: 'normal' },
  labelMedium: { fontFamily: undefined, fontWeight: 'normal' },
  labelLarge: { fontFamily: undefined, fontWeight: 'normal' },
  bodySmall: { fontFamily: undefined, fontWeight: 'normal' },
  bodyMedium: { fontFamily: undefined, fontWeight: 'normal' },
  bodyLarge: { fontFamily: undefined, fontWeight: 'normal' },
};

const commonColors = {
  // Example custom colors - sync with what you had in app/_layout.js
  // primary: 'rgb(0, 122, 255)', // Example from lightTheme
  // accent: '#FF5F6D',
  // error: '#FF5F6D',
  // onPrimary: '#ffffff',
};

const AppLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: 'rgb(0, 122, 255)',
    background: 'rgb(242, 242, 242)',
    card: 'rgb(255, 255, 255)',
    text: 'rgb(28, 28, 30)',
    border: 'rgb(216, 216, 216)',
    notification: 'rgb(255, 59, 48)',
    error: '#FF5F6D',
    onPrimary: '#ffffff',
    accent: '#FF5F6D', // Added accent
    ...commonColors,
  },
  fonts: configureFonts({config: fontConfig}),
};

const AppDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: 'rgb(10, 132, 255)',
    background: 'rgb(1, 1, 1)',
    card: 'rgb(18, 18, 18)',
    text: 'rgb(229, 229, 231)',
    border: 'rgb(39, 39, 41)',
    notification: 'rgb(255, 69, 58)',
    error: '#FF5F6D',
    onPrimary: '#ffffff',
    accent: '#FF5F6D', // Added accent
    ...commonColors,
  },
  fonts: configureFonts({config: fontConfig}),
};

const ThemeContext = createContext({
  themeKey: 'light', // 'light' or 'dark', default to light
  setThemeKey: () => {},
  actualTheme: AppLightTheme, 
});

export const CustomThemeProvider = ({ children }) => {
  // const systemColorScheme = useColorScheme(); // REMOVED
  const [themeKey, setThemeKey] = useState('light'); // User's preference: 'light' or 'dark', default to light

  const activeTheme = themeKey === 'dark' ? AppDarkTheme : AppLightTheme; // Simplified

  return (
    <ThemeContext.Provider value={{ themeKey, setThemeKey, actualTheme: activeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext); 
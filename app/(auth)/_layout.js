import { Stack } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native'; // Added View, TouchableOpacity, StyleSheet
// import { Badge } from 'react-native-paper'; // Remove Badge import
// import { useNotifications } from '../../src/hooks/useNotifications'; // Keep commented out
// import HomeScreen from './home'; // REMOVE explicit import

// Remove HomeIconWithBadge component
// const HomeIconWithBadge = ({ color, size }) => { ... };

// Custom Tab Button Component
const CustomTabBarButton = ({ children, onPress }) => (
  <TouchableOpacity
    style={styles.customButtonContainer}
    onPress={onPress}
    activeOpacity={0.7} // Standard opacity
  >
    <View style={styles.customButton}>
      {children}
    </View>
  </TouchableOpacity>
);

export default function AuthLayout() {
  const { user, loading, calendarAccess } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!loading) {
      const inAuthGroup = segments[0] === '(auth)';
      
      if (user && !calendarAccess && inAuthGroup) {
        // If user is signed in but hasn't granted calendar access
        router.replace('/calendar-access');
      } else if (user && calendarAccess && inAuthGroup) {
        // If user is signed in and has granted calendar access
        router.replace('/(app)');
      } else if (!user && inAuthGroup && segments[1] !== 'landing') {
        // If user is not signed in and not on landing page
        router.replace('/landing');
      }
    }
  }, [user, loading, calendarAccess, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="landing" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="calendar-access" />
    </Stack>
  );
} 

// Styles for the custom button
const styles = StyleSheet.create({
  customButtonContainer: {
    top: -25, // Raise the button
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#FF5F6D",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5, // for Android shadow
  },
  customButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF5F6D', // Button background color
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 
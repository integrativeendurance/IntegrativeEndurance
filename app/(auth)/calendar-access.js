import React from 'react';
import { View, StyleSheet, Image, Dimensions, Text } from 'react-native';
import { Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function CalendarAccessScreen() {
  const { user, calendarAccess, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleContinue = () => {
    if (calendarAccess) {
      // Navigate to the main app
      router.replace('/(app)');
    } else {
      // Request calendar access
      signInWithGoogle();
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/mountain-signin.jpg')}
        style={styles.backgroundImage}
      />
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Calendar Access</Text>
          <Text style={styles.subtitle}>
            {calendarAccess
              ? "Great! You've granted calendar access."
              : "To provide the best training experience, we need access to your Google Calendar."}
          </Text>

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              style={styles.button}
              labelStyle={styles.buttonLabel}
              onPress={handleContinue}
              icon={({ size, color }) => (
                <MaterialCommunityIcons
                  name={calendarAccess ? "check-circle" : "calendar"}
                  size={24}
                  color="white"
                />
              )}
            >
              {calendarAccess ? "Continue to App" : "Grant Calendar Access"}
            </Button>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    width: width,
    height: height,
    position: 'absolute',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  logo: {
    width: width * 0.3,
    height: height * 0.12,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 20,
  },
  button: {
    width: '100%',
    paddingVertical: 8,
    backgroundColor: '#FF5F6D',
  },
  buttonLabel: {
    fontSize: 16,
    paddingVertical: 4,
  },
}); 
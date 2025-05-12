import React from 'react';
import { View, StyleSheet, Image, Dimensions, Text } from 'react-native';
import { Button } from 'react-native-paper';
import { Link, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';

const { width, height } = Dimensions.get('window');

export default function SignUpScreen() {
  const { signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleGoogleSignUp = async () => {
    try {
      await signInWithGoogle();
      // Navigation will be handled by the auth state change in AuthContext
    } catch (error) {
      console.error('Error signing up:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/mountain-signup.jpg')}
        style={styles.backgroundImage}
      />
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Start Your Journey</Text>
          <Text style={styles.subtitle}>Create an account to begin your training</Text>

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              style={styles.googleButton}
              labelStyle={styles.googleButtonLabel}
              onPress={handleGoogleSignUp}
              icon={({ size, color }) => (
                <MaterialCommunityIcons name="google" size={24} color="white" />
              )}
            >
              Sign up with Google
            </Button>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Link href="/sign-in" asChild>
              <Button
                mode="outlined"
                style={styles.signInButton}
                labelStyle={styles.signInButtonLabel}
              >
                Already have an account? Sign In
              </Button>
            </Link>
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
  },
  buttonContainer: {
    width: '100%',
    gap: 20,
  },
  googleButton: {
    width: '100%',
    paddingVertical: 8,
    backgroundColor: '#4285F4',
  },
  googleButtonLabel: {
    fontSize: 16,
    paddingVertical: 4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'white',
  },
  dividerText: {
    color: 'white',
    paddingHorizontal: 10,
  },
  signInButton: {
    width: '100%',
    borderColor: 'white',
  },
  signInButtonLabel: {
    color: 'white',
    fontSize: 16,
  },
}); 
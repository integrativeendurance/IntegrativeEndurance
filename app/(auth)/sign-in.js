import React from 'react';
import { View, StyleSheet, Image, Dimensions, Text } from 'react-native';
import { Button } from 'react-native-paper';
import { Link, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';

const { width, height } = Dimensions.get('window');

export default function SignInScreen() {
  const { signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // Navigation will be handled by the auth state change in AuthContext
    } catch (error) {
      console.error('Error signing in:', error);
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
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue your journey</Text>

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              style={styles.googleButton}
              labelStyle={styles.googleButtonLabel}
              onPress={handleGoogleSignIn}
              icon={({ size, color }) => (
                <MaterialCommunityIcons name="google" size={24} color="white" />
              )}
            >
              Continue with Google
            </Button>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Link href="/sign-up" asChild>
              <Button
                mode="outlined"
                style={styles.signUpButton}
                labelStyle={styles.signUpButtonLabel}
              >
                Create an Account
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
  signUpButton: {
    width: '100%',
    borderColor: 'white',
  },
  signUpButtonLabel: {
    color: 'white',
    fontSize: 16,
  },
}); 
import React from 'react';
import { View, StyleSheet, Image, Dimensions, Text } from 'react-native';
import { Button } from 'react-native-paper';
import { Link } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function LandingScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/mountain-landing.jpg')}
        style={styles.backgroundImage}
      />
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Integrative Endurance</Text>
          <Text style={styles.subtitle}>Elevate Your Training Journey</Text>
          
          <View style={styles.buttonContainer}>
            <Link href="/sign-in" asChild>
              <Button
                mode="contained"
                style={styles.button}
                labelStyle={styles.buttonLabel}
              >
                Sign In
              </Button>
            </Link>
            
            <Link href="/sign-up" asChild>
              <Button
                mode="outlined"
                style={[styles.button, styles.signUpButton]}
                labelStyle={[styles.buttonLabel, styles.signUpButtonLabel]}
              >
                Sign Up
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  content: {
    padding: 20,
    paddingBottom: 50,
    alignItems: 'center',
  },
  logo: {
    width: width * 0.4,
    height: height * 0.15,
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
    gap: 15,
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
  signUpButton: {
    backgroundColor: 'transparent',
    borderColor: 'white',
  },
  signUpButtonLabel: {
    color: 'white',
  },
}); 
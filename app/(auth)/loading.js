import React from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

const { width, height } = Dimensions.get('window');

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/mountain-loading.jpg')}
        style={styles.backgroundImage}
      />
      <View style={styles.overlay}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#FF5F6D" style={styles.spinner} />
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
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: width * 0.6,
    height: height * 0.2,
    marginBottom: 40,
  },
  spinner: {
    marginTop: 20,
  },
}); 
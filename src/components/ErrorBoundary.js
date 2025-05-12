import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

class ThemedErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Oops, something went wrong.</Text>
          <Text style={styles.message}>
            We encountered an error. Please try restarting the app.
          </Text>
          {/* You could provide a button to retry or report the error */}
          {/* For debugging, you can display the error message:
          <Text style={styles.errorMessage}>{this.state.error?.toString()}</Text> 
          */}
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorMessage: {
    fontSize: 12,
    color: 'red',
    marginTop: 10,
  }
});

export default ThemedErrorBoundary; 
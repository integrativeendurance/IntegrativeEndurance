import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect straight to the home screen within the (auth) group.
  return <Redirect href="/(auth)/home" />;
} 
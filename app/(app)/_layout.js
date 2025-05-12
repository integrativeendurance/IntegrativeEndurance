import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, TouchableOpacity, StyleSheet } from 'react-native';

// Custom Tab Button Component
const CustomTabBarButton = ({ children, onPress }) => (
  <TouchableOpacity
    style={styles.customButtonContainer}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.customButton}>
      {children}
    </View>
  </TouchableOpacity>
);

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF5F6D',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          height: 70,
          paddingBottom: 8,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -3,
          },
          shadowOpacity: 0.2,
          shadowRadius: 3,
          elevation: 10,
          borderTopWidth: 0,
        },
      }}
    >
      {/* Screen 1: Home */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          headerShown: true,
          tabBarIcon: ({ color, size }) => ( 
            <MaterialCommunityIcons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      {/* Screen 2: Training */}
      <Tabs.Screen 
        name="training" 
        options={{
          title: "Training",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="run" color={color} size={size} />
          ),
        }} 
      />
      {/* Screen 3: Custom Log Button (Mountain Icon) */}
      <Tabs.Screen 
        name="log"
        options={{
          title: "Log",
          tabBarLabel: () => null,
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialCommunityIcons 
              name="image-filter-hdr"
              color="white"
              size={size * 1.2}
            />
          ),
          tabBarButton: (props) => (
            <CustomTabBarButton {...props} />
          ),
        }}
      />
      {/* Screen 4: Performance */}
      <Tabs.Screen
        name="performance" 
        options={{
          title: "Performance",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-line" color={color} size={size} />
          ),
        }} 
      />
      {/* Screen 5: Profile */}
      <Tabs.Screen
        name="profile" 
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle-outline" color={color} size={size} />
          ),
        }} 
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  customButtonContainer: {
    top: -25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#FF5F6D",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  customButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF5F6D',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 
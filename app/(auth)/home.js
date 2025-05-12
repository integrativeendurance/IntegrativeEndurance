import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Animated as RNAnimated,
} from 'react-native';
import { 
  Text, 
  Surface, 
  Avatar, 
  IconButton, 
  ProgressBar, 
  Portal, 
  Modal,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';
import WorkoutDetailsScreen from '../../src/screens/WorkoutDetailsScreen';
import { LoadingState, EmptyState, ErrorState } from '../../src/components/StatusStates';
import ThemedErrorBoundary from '../../src/components/ErrorBoundary';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const GRID_SPACING = 8;
const COLUMN_COUNT = 2;
const CARD_WIDTH = (width - (GRID_SPACING * 3) - (CARD_MARGIN * 2)) / COLUMN_COUNT;

const mockUser = {
  name: 'John Doe',
  avatar: null,
  phase: 'Base Building',
  nextMilestone: '10K Race',
  nextEventDate: new Date('2023-12-15'), // Example target event date
  blockEndDate: new Date('2023-11-30'), // Example block end date (mock)
  recovery: {
    score: 87,
    status: 'Good',
    recommendation: 'Ready for normal training',
  },
  weeklyGoals: {
    distance: {
      current: 21.5,
      target: 35,
    },
    workouts: {
      current: 3,
      target: 5,
    },
    time: {
      current: 180,
      target: 240,
    }
  },
  recentActivities: [
    { 
      id: '101',
      type: 'run', 
      date: 'Yesterday', 
      title: 'Morning Run', 
      distance: 5.4, 
      time: 32,
      route: [
        { latitude: 37.7825, longitude: -122.4224 },
        { latitude: 37.7825, longitude: -122.4294 },
        { latitude: 37.7845, longitude: -122.4294 },
        { latitude: 37.7855, longitude: -122.4274 },
        { latitude: 37.7865, longitude: -122.4244 },
        { latitude: 37.7835, longitude: -122.4224 },
        { latitude: 37.7825, longitude: -122.4224 },
      ]
    },
    { id: '102', type: 'cycle', date: 'Monday', title: 'Long Ride', distance: 22.3, time: 78 },
    { id: '103', type: 'run', date: 'Last Sunday', title: 'Easy Jog', distance: 3.7, time: 24 },
  ],
  upcomingWorkout: {
    id: '2',
    name: 'Interval Training',
    description: '6 x 400m repeats with 1 min rest',
    date: new Date(),
    time: 'Today, 6:00 PM',
    distance: 4.8,
    duration: 35,
    intensity: 'High',
    type: 'Running',
    targetPace: '4:30/km for intervals, 7:00/km for recovery',
    completed: false
  }
};

function formatDistance(distance) {
  if (typeof distance !== 'number') return '';
  return `${distance.toFixed(1)} km`;
}

function HomeScreen() {
  const { theme, actualTheme } = useTheme();
  
  const [workoutDetailsVisible, setWorkoutDetailsVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cardScale] = React.useState(new RNAnimated.Value(1));

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const handleLogout = () => {
    router.replace('/(public)/login');
  };

  const navigateToTraining = () => {
    router.push({
      pathname: '/(auth)/TrainingScreen',
      params: { 
        showWorkout: 'next', 
        workoutId: mockUser.upcomingWorkout.id 
      }
    });
  };

  const navigateToWorkoutDetails = (activity) => {
    setSelectedActivity(activity);
    setWorkoutDetailsVisible(true);
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Calculate days until the target event
  const getDaysUntilEvent = () => {
    if (!mockUser.nextEventDate) return null;
    
    const today = new Date();
    const eventDate = new Date(mockUser.nextEventDate);
    
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  // Calculate days left in the current block
  const getDaysLeftInBlock = () => {
    if (!mockUser.blockEndDate) return null;
    const today = new Date();
    const blockEnd = new Date(mockUser.blockEndDate);
    today.setHours(0, 0, 0, 0);
    blockEnd.setHours(0, 0, 0, 0);
    const diffTime = blockEnd.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysUntilEvent = getDaysUntilEvent();
  const daysLeftInBlock = getDaysLeftInBlock();
  const mostRecentActivity = mockUser.recentActivities[0];
  const olderActivities = mockUser.recentActivities.slice(1, 3);

  const textStyle = { color: actualTheme ? actualTheme.colors.text : 'black' };
  const subtleTextStyle = { color: actualTheme ? (actualTheme.dark ? '#aaa' : '#666') : 'gray' };

  React.useEffect(() => {
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      // setError('Failed to load activities.'); // Keep this commented for now
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Helper for card press animation
  const animateCardPressIn = () => {
    RNAnimated.spring(cardScale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 30,
      bounciness: 8,
    }).start();
  };
  const animateCardPressOut = () => {
    RNAnimated.spring(cardScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 8,
    }).start();
  };

  return (
    <ThemedErrorBoundary>
      <View style={{flex: 1}}>
        <ScrollView
          style={[styles.container, { backgroundColor: actualTheme ? actualTheme.colors.background : 'white' }]}
          contentContainerStyle={styles.contentContainer}
          refreshControl={ <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> }
          scrollEnabled={!workoutDetailsVisible}
        >
          <Surface style={[styles.header, { backgroundColor: actualTheme ? actualTheme.colors.card : '#f0f0f0' }]} elevation={2}>
            <View style={styles.headerContent}>
              <View style={styles.userInfo}>
                <Avatar.Text
                  size={40}
                  label={mockUser.name.split(' ').map((n) => n[0]).join('')}
                />
              </View>
              <View style={styles.headerActions}>
                <IconButton
                  icon="bell-outline"
                  size={24}
                  onPress={() => {}}
                  iconColor={actualTheme ? actualTheme.colors.text : 'black'}
                />
              </View>
            </View>
          </Surface>

          <View style={styles.bentoGrid}>
            <TouchableOpacity
              onPress={navigateToTraining}
              activeOpacity={0.7}
              style={styles.wideCardWrapper}
              onPressIn={animateCardPressIn}
              onPressOut={animateCardPressOut}
            >
              <RNAnimated.View style={{ transform: [{ scale: cardScale }] }}>
                <Surface
                  style={[
                    styles.bentoCard,
                    styles.wideCard,
                    { backgroundColor: actualTheme.colors.card },
                  ]}
                  elevation={1}
                >
                  <View style={{ borderRadius: 16, overflow: 'hidden' }}>
                    <View style={styles.recoveryHeader}> 
                      <MaterialCommunityIcons name="run-fast" size={20} color="#FF5F6D" />
                      <Text style={[textStyle, styles.sectionTitle]}>Training Status</Text>
                      <MaterialCommunityIcons style={styles.arrowIcon} name="arrow-right" size={20} color="#FF5F6D" />
                    </View>
                    
                    <View style={styles.phaseInfo}>
                      <View style={styles.phaseItem}>
                        <Text style={[subtleTextStyle, styles.phaseLabel]}>Current Phase</Text>
                        <Text style={[textStyle, styles.phaseValue]}>{mockUser.phase}</Text>
                        {daysLeftInBlock !== null && (
                          <View style={[styles.countdownContainer, { alignSelf: 'flex-start' }]}> 
                            <Text style={styles.countdownText}>
                              {daysLeftInBlock} {daysLeftInBlock === 1 ? 'day' : 'days'} left in block
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.phaseDivider} />
                      <View style={[styles.phaseItem, styles.rightAligned]}>
                        <Text style={[subtleTextStyle, styles.phaseLabel]}>Target Event</Text>
                        <Text style={[textStyle, styles.phaseValue]}>{mockUser.nextMilestone}</Text>
                        {daysUntilEvent !== null && (
                          <View style={styles.countdownContainer}>
                            <Text style={styles.countdownText}>
                              {daysUntilEvent} {daysUntilEvent === 1 ? 'day' : 'days'} left
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    
                    <View style={styles.statusDivider} />
                    <View style={styles.recoverySection}>
                      <View style={styles.recoveryHeader}>
                        <MaterialCommunityIcons name="battery-charging" size={20} color="#FF5F6D" />
                        <Text style={[textStyle, styles.sectionTitle]}>Recovery Status</Text>
                      </View>
                      <View style={styles.recoveryContent}>
                        <View style={styles.recoveryScore}>
                          <Text style={[textStyle, styles.recoveryScoreValue]}>{mockUser.recovery.score}</Text>
                          <View style={[styles.recoveryStatusBadge, {
                            backgroundColor: mockUser.recovery.score > 80 ? 'rgba(75, 181, 67, 0.2)' : 
                                           mockUser.recovery.score > 60 ? 'rgba(255, 204, 0, 0.2)' : 
                                           'rgba(255, 95, 109, 0.2)'
                          }]}>
                            <Text style={[styles.recoveryStatusText, {
                              color: mockUser.recovery.score > 80 ? '#4BB543' : 
                                    mockUser.recovery.score > 60 ? '#FFCC00' : 
                                    '#FF5F6D'
                            }]}>{mockUser.recovery.status}</Text>
                          </View>
                        </View>
                        <Text style={[subtleTextStyle, styles.recoveryRecommendation]}>
                          {mockUser.recovery.recommendation}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.statusDivider} />
                    <View style={styles.nextWorkoutSection}>
                      <View style={styles.recoveryHeader}>
                        <MaterialCommunityIcons name="calendar-clock" size={20} color="#FF5F6D" />
                        <Text style={[textStyle, styles.sectionTitle]}>Next Workout</Text>
                      </View>
                      <View style={styles.workoutTypeContainer}>
                        <View style={[styles.workoutTypeIndicator, { backgroundColor: getWorkoutTypeColor(mockUser.upcomingWorkout.type) }]} />
                        <Text style={[textStyle, styles.workoutType]}>{mockUser.upcomingWorkout.type}</Text>
                        <Text style={[textStyle, styles.workoutIntensity]}>({mockUser.upcomingWorkout.intensity})</Text>
                      </View>
                      <Text style={[styles.workoutName, textStyle]}>
                        {mockUser.upcomingWorkout.name}
                      </Text>
                      <Text style={[styles.workoutTime, subtleTextStyle]}>
                        {mockUser.upcomingWorkout.time}
                      </Text>
                      <View style={styles.workoutMetrics}>
                        <View style={styles.metricRow}>
                          <Text style={[subtleTextStyle, styles.metricLabel]}>Distance</Text>
                          <Text style={[textStyle, styles.metricValue]}>{formatDistance(mockUser.upcomingWorkout.distance)}</Text>
                        </View>
                        <View style={styles.metricRow}>
                          <Text style={[subtleTextStyle, styles.metricLabel]}>Duration</Text>
                          <Text style={[textStyle, styles.metricValue]}>{formatTime(mockUser.upcomingWorkout.duration)}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </Surface>
              </RNAnimated.View>
            </TouchableOpacity>

            <View style={styles.wideCardWrapper}> 
              <Surface
                style={[
                  styles.bentoCard,
                  styles.wideCard,
                  { backgroundColor: actualTheme.colors.card },
                ]}
                elevation={1}
              >
                <View style={{ borderRadius: 16, overflow: 'hidden' }}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, textStyle]}>
                      Recent Activities
                    </Text>
                    <MaterialCommunityIcons name="history" size={20} color="#FF5F6D" />
                  </View>

                  {mostRecentActivity && (
                    <TouchableOpacity 
                      style={styles.recentActivityMapContainer}
                      onPress={() => navigateToWorkoutDetails(mostRecentActivity)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.recentActivityHeader}>
                        <View style={[styles.activityIconContainer, {backgroundColor: getWorkoutTypeColor(mostRecentActivity.type)}]}>
                          <MaterialCommunityIcons 
                            name={mostRecentActivity.type === 'run' ? 'run' : 'bike'}
                            size={18} 
                            color="#fff" 
                          />
                        </View>
                        <View style={styles.activityDetails}>
                          <Text style={[styles.activityTitle, textStyle]}>{mostRecentActivity.title}</Text>
                          <Text style={[styles.activityDate, subtleTextStyle]}>{mostRecentActivity.date}</Text>
                        </View>
                        <View style={styles.activityMetrics}>
                          <Text style={[styles.activityMetric, textStyle]}>
                            {formatDistance(mostRecentActivity.distance)}
                          </Text>
                          <Text style={[styles.activityMetric, textStyle]}>
                            {formatTime(mostRecentActivity.time)}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.mapPlaceholder}>
                        <MaterialCommunityIcons 
                          name="map-outline" 
                          size={32}
                          color={actualTheme.colors.text ? actualTheme.colors.text + '40' : '#00000040'} 
                        />
                        <Text style={[textStyle, styles.mapPlaceholderText]}>
                          Route map preview
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  
                  {mostRecentActivity && olderActivities.length > 0 && (
                    <View style={styles.activitiesDivider} />
                  )}
                  
                  {loading ? (
                    <LoadingState message="Loading activities..." />
                  ) : error ? (
                    <ErrorState message={typeof error === 'string' ? error : 'Failed to load activities.'} onRetry={() => { setError(null); /* Add logic to re-trigger useEffect or data fetch */ }} />
                  ) : olderActivities.map((activity, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.activityItem,
                        index < olderActivities.length - 1 && styles.activityDivider
                      ]}
                      onPress={() => navigateToWorkoutDetails(activity)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.activityIconContainer, {backgroundColor: getWorkoutTypeColor(activity.type)}]}>
                        <MaterialCommunityIcons 
                          name={activity.type === 'run' ? 'run' : 'bike'}
                          size={18} 
                          color="#fff" 
                        />
                      </View>
                      <View style={styles.activityDetails}>
                        <Text style={[styles.activityTitle, textStyle]}>{activity.title}</Text>
                        <Text style={[styles.activityDate, subtleTextStyle]}>{activity.date}</Text>
                      </View>
                      <View style={styles.activityMetrics}>
                        <Text style={[styles.activityMetric, textStyle]}>{formatDistance(activity.distance)}</Text>
                        <Text style={[styles.activityMetric, textStyle]}>{formatTime(activity.time)}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </Surface>
            </View>
          </View>

        </ScrollView>

        {selectedActivity && workoutDetailsVisible && (
          <View style={styles.fullScreenModal}>
            <WorkoutDetailsScreen 
              workout={selectedActivity} 
              onClose={() => setWorkoutDetailsVisible(false)}
            />
          </View>
        )}
      </View>
    </ThemedErrorBoundary>
  );
}

function getWorkoutTypeColor(type) {
  const colors = {
    'Running': '#EE6C4D',
    'Cycling': '#5C8BDD',
    'Strength': '#9A7ED4',
    'Other': '#70C1B3',
    'Rest': '#666666'
  };
  return colors[type] || colors.Other;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24, // For scrollable content to not be hidden by tab bar
  },
  header: {
    padding: 16,
    marginBottom: GRID_SPACING, // Use constant for spacing
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    marginLeft: 12,
  },
  userName: {
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
  },
  bentoGrid: {
    paddingHorizontal: GRID_SPACING, // Consistent padding
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center', // CHANGED from 'space-between' to 'center'
  },
  wideCardWrapper: {
    width: (CARD_WIDTH * 2) + GRID_SPACING, // Full width for wide cards
    marginBottom: GRID_SPACING, // Spacing below wide cards
  },
  bentoCard: { // General style for all cards in the bento
    borderRadius: 16,
    padding: 16,
    elevation: 1, // Subtle shadow, can be adjusted
  },
  wideCard: { // Specific to wide cards, usually to fill wrapper
    width: '100%',
  },
  regularCard: {
    width: CARD_WIDTH,
    marginBottom: GRID_SPACING, // Spacing for regular cards if they are not last in a row
  },
  tallCard: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.5, // Example aspect ratio
    justifyContent: 'space-between', // For content distribution
    marginBottom: GRID_SPACING,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 8,
  },
  sectionTitle: { // Used for titles within cards like "Training Status", "Next Workout"
    fontWeight: '600', // Or bold, depending on desired emphasis
    fontSize: 16,
    marginLeft: 8, // If icon precedes it
  },
  arrowIcon: {
    marginLeft: 'auto', // Pushes arrow to the right
  },
  statusDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)', // Subtle divider
    marginVertical: 16, // Space above and below
  },
  // Phase Info (within Training Status card)
  phaseInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  phaseItem: {
    flex: 1, // Takes half the space
  },
  phaseLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  phaseValue: {
    fontWeight: '600',
    fontSize: 16,
  },
  countdownContainer: {
    marginTop: 6,
    paddingVertical: 4, // Adjusted padding
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 95, 109, 0.1)', // Accent color, ensure contrast
    borderRadius: 12,
  },
  countdownText: {
    color: '#FF5F6D', // Ensure this color is from your theme or a constant
    fontSize: 12,
    fontWeight: '600',
  },
  phaseDivider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 12,
  },
  rightAligned: {
    alignItems: 'flex-end',
  },
  // Recovery Section (within Training Status card)
  recoverySection: {
  },
  recoveryHeader: { // Shared by Training Status, Recovery, Next Workout section headers
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // Spacing between icon and title text
    marginBottom: 12,
  },
  recoveryContent: {
    // No specific styles needed, content flows naturally
  },
  recoveryScore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recoveryScoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  recoveryStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  recoveryStatusText: {
    fontWeight: '600',
    fontSize: 14,
  },
  recoveryRecommendation: {
    fontSize: 14,
  },
  // Next Workout Section (within Training Status card)
  nextWorkoutSection: {
  },
  workoutTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutTypeIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  workoutType: {
    fontWeight: '500', // Or '600'
    marginRight: 4,
    fontSize: 15,
  },
  workoutIntensity: {
    fontSize: 13,
  },
  workoutName: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
  },
  workoutTime: { // For time like "Today, 6:00 PM"
    fontSize: 12,
    marginBottom: 8, // Space before metrics
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 14,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Recent Activities Card Styles
  recentActivityMapContainer: {
    marginBottom: 12,
  },
  recentActivityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontWeight: '500',
    fontSize: 15,
  },
  activityDate: {
    fontSize: 12,
  },
  activityMetrics: {
    alignItems: 'flex-end',
  },
  activityMetric: {
    fontSize: 13,
  },
  mapPlaceholder: {
    height: 140,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderStyle: 'dashed',
  },
  mapPlaceholderText: {
    marginTop: 8,
    fontSize: 12,
  },
  activitiesDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  activityDivider: { // Style for the TouchableOpacity if it needs a visible divider
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  fullScreenModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.005)',
    zIndex: 1000, 
  },
});

export default HomeScreen; 
import React from 'react';
import { StyleSheet, View, ScrollView, Dimensions, SafeAreaView, StatusBar } from 'react-native';
import { Text, Surface, IconButton, Divider, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import ThemedErrorBoundary from '../components/ErrorBoundary';

const { width } = Dimensions.get('window');

export default function WorkoutDetailsScreen({ workout, onClose }) {
  const { actualTheme } = useTheme();
  
  // Provide a safe fallback for the theme
  const safeActualTheme = actualTheme || {
    dark: false,
    colors: {
      text: '#000000', // Default text color
      background: '#FFFFFF', // Default background
      card: '#F0F0F0', // Default card color
      // Add other colors used if necessary, or keep them minimal
    },
  };

  // Mock data for the workout details based on the passed activity
  const workoutDetails = {
    id: workout?.id || '1',
    title: workout?.title || 'Morning Run',
    type: workout?.type || 'run',
    date: workout?.date instanceof Date ? workout.date.toLocaleDateString() : (workout?.date || 'Yesterday'),
    distance: workout?.distance || 5.4,
    duration: workout?.time || 32, // in minutes
    pace: '5:55',
    calories: 420,
    heartRate: {
      avg: 145,
      max: 175
    },
    elevation: {
      gain: 85,
      loss: 75
    },
    cadence: 170,
    zones: [
      { name: 'Zone 1', percentage: 15, color: '#70C1B3' },
      { name: 'Zone 2', percentage: 35, color: '#5C8BDD' },
      { name: 'Zone 3', percentage: 25, color: '#FFCC00' },
      { name: 'Zone 4', percentage: 20, color: '#FF9F1C' },
      { name: 'Zone 5', percentage: 5, color: '#FF5F6D' }
    ],
    splits: [
      { km: 1, pace: '5:48', elevation: 12 },
      { km: 2, pace: '5:52', elevation: 15 },
      { km: 3, pace: '6:05', elevation: 22 },
      { km: 4, pace: '5:50', elevation: 8 },
      { km: 5, pace: '5:58', elevation: 18 },
    ],
    route: workout?.route || [
      { latitude: 37.7825, longitude: -122.4224 },
      { latitude: 37.7825, longitude: -122.4294 },
      { latitude: 37.7845, longitude: -122.4294 },
      { latitude: 37.7855, longitude: -122.4274 },
      { latitude: 37.7865, longitude: -122.4244 },
      { latitude: 37.7835, longitude: -122.4224 },
      { latitude: 37.7825, longitude: -122.4224 },
    ]
  };

  const formatTime = (minutes) => {
    if (!minutes) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getActivityIcon = (type) => {
    if (!type) return 'run';
    const lowerType = type.toLowerCase();
    if (lowerType.includes('run')) return 'run';
    if (lowerType.includes('cycle') || lowerType.includes('bike')) return 'bike';
    if (lowerType.includes('strength')) return 'dumbbell';
    return 'dumbbell';
  };

  const getActivityColor = (type) => {
    if (!type) return '#EE6C4D';
    const lowerType = type.toLowerCase();
    const colors = {
      'run': '#EE6C4D',
      'running': '#EE6C4D',
      'cycle': '#5C8BDD',
      'cycling': '#5C8BDD',
      'bike': '#5C8BDD',
      'strength': '#9A7ED4',
      'other': '#70C1B3'
    };
    
    if (lowerType.includes('run')) return colors.run;
    if (lowerType.includes('cycle') || lowerType.includes('bike')) return colors.cycle;
    if (lowerType.includes('strength')) return colors.strength;
    
    return colors.other;
  };

  const textStyle = { color: safeActualTheme.colors.text };
  const subtleTextStyle = { color: safeActualTheme.dark ? '#aaa' : (safeActualTheme.colors.text === '#000000' ? '#666' : '#999') };

  return (
    <ThemedErrorBoundary>
      <SafeAreaView style={{ flex: 1, backgroundColor: safeActualTheme.colors.background }}>
        <StatusBar barStyle={safeActualTheme.dark ? 'light-content' : 'dark-content'} />
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Header with back button */}
          <View style={styles.header}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={onClose}
              iconColor={safeActualTheme.colors.text}
            />
            <Text variant="titleLarge" style={[styles.headerTitle, textStyle]}>Workout Details</Text>
            <View style={{ width: 48 }} />
          </View>
          
          {/* Workout basic info card */}
          <Surface style={[styles.card, { backgroundColor: safeActualTheme.colors.card }]} elevation={2}>
            <View style={styles.workoutHeader}>
              <View style={[styles.activityIconContainer, { backgroundColor: getActivityColor(workoutDetails.type) }]}>
                <MaterialCommunityIcons 
                  name={getActivityIcon(workoutDetails.type)} 
                  size={24} 
                  color="#fff" 
                />
              </View>
              <View style={styles.workoutTitleContainer}>
                <Text variant="titleMedium" style={[styles.workoutTitle, textStyle]}>{workoutDetails.title}</Text>
                <Text style={[styles.workoutDate, subtleTextStyle]}>{workoutDetails.date}</Text>
              </View>
            </View>
            
            {/* Main stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="map-marker-distance" size={20} color="#FF5F6D" />
                <Text style={[styles.statValue, textStyle]}>{workoutDetails.distance} km</Text>
                <Text style={[styles.statLabel, subtleTextStyle]}>Distance</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="clock-outline" size={20} color="#FF5F6D" />
                <Text style={[styles.statValue, textStyle]}>{formatTime(workoutDetails.duration)}</Text>
                <Text style={[styles.statLabel, subtleTextStyle]}>Duration</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="speedometer" size={20} color="#FF5F6D" />
                <Text style={[styles.statValue, textStyle]}>{workoutDetails.pace}/km</Text>
                <Text style={[styles.statLabel, subtleTextStyle]}>Avg Pace</Text>
              </View>
            </View>
          </Surface>
          
          {/* Map View */}
          <Surface style={[styles.card, { backgroundColor: safeActualTheme.colors.card }]} elevation={2}>
            <Text variant="titleMedium" style={[styles.sectionTitle, textStyle]}>Route</Text>
            <View style={styles.mapContainer}>
              <View style={styles.mapPlaceholder}>
                <MaterialCommunityIcons 
                  name="map-outline" 
                  size={48}
                  color={safeActualTheme.colors.text ? safeActualTheme.colors.text + '40' : '#00000040'} 
                />
                <Text style={[textStyle, styles.mapPlaceholderText]}>
                  Route map view
                </Text>
              </View>
            </View>
          </Surface>
          
          {/* Additional Stats Card */}
          <Surface style={[styles.card, { backgroundColor: safeActualTheme.colors.card }]} elevation={2}>
            <Text variant="titleMedium" style={[styles.sectionTitle, textStyle]}>Additional Stats</Text>
            
            <View style={styles.additionalStatsGrid}>
              <View style={styles.additionalStatItem}>
                <MaterialCommunityIcons name="fire" size={20} color="#FF9F1C" />
                <Text style={[styles.additionalStatValue, textStyle]}>{workoutDetails.calories}</Text>
                <Text style={[styles.additionalStatLabel, subtleTextStyle]}>Calories</Text>
              </View>
              
              <View style={styles.additionalStatItem}>
                <MaterialCommunityIcons name="heart-pulse" size={20} color="#FF5F6D" />
                <Text style={[styles.additionalStatValue, textStyle]}>{workoutDetails.heartRate.avg} bpm</Text>
                <Text style={[styles.additionalStatLabel, subtleTextStyle]}>Avg HR</Text>
              </View>
              
              <View style={styles.additionalStatItem}>
                <MaterialCommunityIcons name="heart" size={20} color="#FF5F6D" />
                <Text style={[styles.additionalStatValue, textStyle]}>{workoutDetails.heartRate.max} bpm</Text>
                <Text style={[styles.additionalStatLabel, subtleTextStyle]}>Max HR</Text>
              </View>
              
              <View style={styles.additionalStatItem}>
                <MaterialCommunityIcons name="terrain" size={20} color="#70C1B3" />
                <Text style={[styles.additionalStatValue, textStyle]}>+{workoutDetails.elevation.gain}m</Text>
                <Text style={[styles.additionalStatLabel, subtleTextStyle]}>Elevation Gain</Text>
              </View>
              
              <View style={styles.additionalStatItem}>
                <MaterialCommunityIcons name="shoe-print" size={20} color="#5C8BDD" />
                <Text style={[styles.additionalStatValue, textStyle]}>{workoutDetails.cadence}</Text>
                <Text style={[styles.additionalStatLabel, subtleTextStyle]}>Cadence</Text>
              </View>
            </View>
          </Surface>
          
          {/* Heart Rate Zones */}
          <Surface style={[styles.card, { backgroundColor: safeActualTheme.colors.card }]} elevation={2}>
            <Text variant="titleMedium" style={[styles.sectionTitle, textStyle]}>Heart Rate Zones</Text>
            
            <View style={styles.hrZonesContainer}>
              <View style={styles.hrZonesBar}>
                {workoutDetails.zones.map((zone, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.hrZoneSegment, 
                      { 
                        width: `${zone.percentage}%`,
                        backgroundColor: zone.color 
                      }
                    ]} 
                  />
                ))}
              </View>
              
              <View style={styles.hrZonesLegend}>
                {workoutDetails.zones.map((zone, index) => (
                  <View key={index} style={styles.hrZoneLegendItem}>
                    <View style={[styles.hrZoneColorIndicator, { backgroundColor: zone.color }]} />
                    <Text style={[styles.hrZoneName, subtleTextStyle]}>{zone.name}</Text>
                    <Text style={[styles.hrZonePercentage, textStyle]}>{zone.percentage}%</Text>
                  </View>
                ))}
              </View>
            </View>
          </Surface>
          
          {/* Splits */}
          <Surface style={[styles.card, { backgroundColor: safeActualTheme.colors.card }]} elevation={2}>
            <Text variant="titleMedium" style={[styles.sectionTitle, textStyle]}>Split Times</Text>
            
            <View style={styles.splitsContainer}>
              <View style={styles.splitsHeader}>
                <Text style={[styles.splitHeaderText, textStyle, { flex: 1 }]}>KM</Text>
                <Text style={[styles.splitHeaderText, textStyle, { flex: 2 }]}>Pace</Text>
                <Text style={[styles.splitHeaderText, textStyle, { flex: 2 }]}>Elevation</Text>
              </View>
              
              <Divider style={{ marginVertical: 8 }} />
              
              {workoutDetails.splits.map((split, index) => (
                <View key={index} style={styles.splitRow}>
                  <Text style={[styles.splitText, textStyle, { flex: 1 }]}>{split.km}</Text>
                  <Text style={[styles.splitText, textStyle, { flex: 2 }]}>{split.pace}/km</Text>
                  <Text style={[styles.splitText, textStyle, { flex: 2 }]}>+{split.elevation}m</Text>
                </View>
              ))}
            </View>
          </Surface>
          
          {/* Share Button */}
          <Button 
            mode="contained" 
            style={styles.shareButton} 
            icon="share-variant" 
            onPress={() => {}}
          >
            Share Workout
          </Button>
        </ScrollView>
      </SafeAreaView>
    </ThemedErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  workoutTitleContainer: {
    flex: 1,
  },
  workoutTitle: {
    fontWeight: '600',
  },
  workoutDate: {
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginVertical: 6,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: 8,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  mapPlaceholderText: {
    marginTop: 8,
    opacity: 0.6,
  },
  additionalStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  additionalStatItem: {
    width: '48%',
    marginBottom: 16,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  additionalStatValue: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 4,
  },
  additionalStatLabel: {
    fontSize: 12,
  },
  hrZonesContainer: {
    marginTop: 8,
  },
  hrZonesBar: {
    flexDirection: 'row',
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  hrZoneSegment: {
    height: '100%',
  },
  hrZonesLegend: {
    marginTop: 16,
  },
  hrZoneLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  hrZoneColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  hrZoneName: {
    flex: 1,
    fontSize: 14,
  },
  hrZonePercentage: {
    fontSize: 14,
    fontWeight: '500',
  },
  splitsContainer: {
    marginTop: 8,
  },
  splitsHeader: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  splitHeaderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  splitRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  splitText: {
    fontSize: 14,
  },
  shareButton: {
    marginTop: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
}); 
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Animated, Dimensions, PanResponder, SafeAreaView } from 'react-native';
import { Text, Surface, Card, Button, IconButton, ProgressBar, Portal, Modal, TextInput, Dialog } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '../hooks/useTheme'; // Adjusted path
import { Calendar } from 'react-native-calendars';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, subDays, addWeeks, subWeeks, isBefore, isAfter, isToday } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LoadingState, EmptyState, ErrorState } from '../components/StatusStates';
import { Animated as RNAnimated } from 'react-native';

const { width } = Dimensions.get('window');

// Simple helpers to replace useUnits
function formatDistance(distance) {
  if (typeof distance !== 'number') return '';
  return `${distance.toFixed(1)} km`;
}

function formatElevation(elevation) {
  if (typeof elevation !== 'number') return '';
  return `${Math.round(elevation)} m`;
}

export default function TrainingScreen() {
  const { actualTheme } = useTheme();
  const params = useLocalSearchParams();
  const { showWorkout } = params;
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarHeight] = useState(new Animated.Value(0));
  const [workouts, setWorkouts] = useState([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const goalScrollViewRef = useRef(null);
  const [currentGoalIndex, setCurrentGoalIndex] = useState(0);
  const [goalExpanded, setGoalExpanded] = useState(false);
  const weekPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderEnd: (e, gestureState) => {
        // Swipe left (next week)
        if (gestureState.dx < -50) {
          goToNextWeek();
        }
        // Swipe right (previous week)
        else if (gestureState.dx > 50) {
          goToPreviousWeek();
        }
      },
    })
  ).current;
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [newEvent, setNewEvent] = useState({ name: '', date: new Date() });
  const [datepickerVisible, setDatepickerVisible] = useState(false);
  const [legendModalVisible, setLegendModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [goalAnim] = useState(new RNAnimated.Value(0));
  
  // Activity type color mapping used consistently across all sections
  // Define colors that work well in both light and dark themes
  const activityColors = {
    'Running': '#EE6C4D',      // Coral - energetic activity
    'Cycling': '#5C8BDD',      // Blue - smooth activity
    'Strength': '#9A7ED4',     // Purple - power activity
    'Other': '#70C1B3',        // Teal - miscellaneous 
    'Rest': '#666666'          // Grey - calm/rest
  };

  // Generate dynamic weekly goals based on the current week
  const generateWeeklyGoals = useCallback(() => {
    // Calculate a seed value based on the week start date for consistent pseudorandom values
    const seed = new Date(currentWeekStart).getTime();
    const getRandomValue = (min, max) => {
      const x = Math.sin(seed + min) * 10000;
      return Math.floor(min + (Math.abs(x) % (max - min)));
    };
    
    // Calculate progress based on current day of week (for current week only)
    const today = new Date();
    const isCurrentWeek = isSameWeek(today, currentWeekStart);
    const dayOfWeek = isCurrentWeek ? (today.getDay() === 0 ? 7 : today.getDay()) : 7;
    const progressFactor = isCurrentWeek ? dayOfWeek / 7 : (isPreviousWeek() ? 1 : 0);
    
    // Generate workout data with various intensities
    const numWorkouts = 4 + getRandomValue(0, 3);
    const currentWorkouts = Math.round(numWorkouts * progressFactor * (0.8 + getRandomValue(0, 40) / 100));
    
    // Calculate average intensity (1-10 scale)
    const intensityScore = 5 + getRandomValue(-2, 3);
    const maxIntensity = 10;
    
    // Generate activity distribution data
    const activityTypes = [
      { type: 'Running', percentage: 30 + getRandomValue(-10, 20), color: activityColors.Running },
      { type: 'Cycling', percentage: 25 + getRandomValue(-10, 15), color: activityColors.Cycling },
      { type: 'Strength', percentage: 20 + getRandomValue(-5, 15), color: activityColors.Strength },
      { type: 'Other', percentage: 15 + getRandomValue(-5, 10), color: activityColors.Other }
    ];
    
    // Normalize percentages to total 100%
    const totalPercentage = activityTypes.reduce((sum, activity) => sum + activity.percentage, 0);
    activityTypes.forEach(activity => {
      activity.percentage = Math.round((activity.percentage / totalPercentage) * 100);
    });
    
    // Raw values in metric units (will be converted if needed)
    const distanceGoal = 30 + getRandomValue(0, 15);
    const currentDistance = Math.round(distanceGoal * progressFactor * (0.8 + getRandomValue(0, 40) / 100));
    const elevationGoal = 400 + getRandomValue(0, 300);
    const currentElevation = Math.round(elevationGoal * progressFactor * (0.8 + getRandomValue(0, 40) / 100));
    
    return [
      {
        id: 'summary',
        title: 'Weekly Summary',
        goals: [
          {
            id: 'distance',
            title: 'Distance',
            goal: distanceGoal,
            current: currentDistance,
            unit: '',
            icon: 'map-marker-distance',
            isDistance: true
          },
          {
            id: 'time',
            title: 'Time',
            goal: 180 + getRandomValue(0, 120),
            current: Math.round((180 + getRandomValue(0, 120)) * progressFactor * (0.8 + getRandomValue(0, 40) / 100)),
            unit: 'min',
            icon: 'clock-outline',
          },
          {
            id: 'elevation',
            title: 'Elevation',
            goal: elevationGoal,
            current: currentElevation,
            unit: '',
            icon: 'terrain',
            isElevation: true
          },
        ]
      },
      {
        id: 'performance',
        title: 'Performance',
        goals: [
          {
            id: 'workouts',
            title: 'Workouts',
            goal: numWorkouts,
            current: currentWorkouts,
            unit: 'sessions',
            icon: 'calendar-check',
          },
          {
            id: 'intensity',
            title: 'Avg. Intensity',
            goal: maxIntensity,
            current: intensityScore,
            unit: '/10',
            icon: 'lightning-bolt',
          }
        ],
        activityDistribution: activityTypes
      }
    ];
  }, [currentWeekStart]);

  // Check if the current displayed week is the previous week
  const isPreviousWeek = useCallback(() => {
    const today = new Date();
    const previousWeekStart = subWeeks(startOfWeek(today, { weekStartsOn: 1 }), 1);
    // Check if currentWeekStart is before the previousWeekStart (meaning we're already on or before the previous week)
    return isBefore(currentWeekStart, previousWeekStart);
  }, [currentWeekStart]);

  // Check if two dates are in the same week
  const isSameWeek = (date1, date2, options = { weekStartsOn: 1 }) => {
    const start1 = startOfWeek(date1, options);
    const start2 = startOfWeek(date2, options);
    return start1.getTime() === start2.getTime();
  };

  // Weekly goals
  const weeklyGoals = generateWeeklyGoals();

  // Generate dates for the current week
  const weekStart = currentWeekStart;
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Setup mock data with dates relative to current date
  useEffect(() => {
    setLoading(true);
    setError(null);
    const today = new Date();
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
    const startOfSelectedWeek = currentWeekStart;
    const isCurrent = startOfSelectedWeek.getTime() === startOfCurrentWeek.getTime();
    const isPrevious = startOfSelectedWeek.getTime() < startOfCurrentWeek.getTime();
    const isNext = startOfSelectedWeek.getTime() > startOfCurrentWeek.getTime();
    const weekDays = eachDayOfInterval({ start: startOfSelectedWeek, end: endOfWeek(startOfSelectedWeek, { weekStartsOn: 1 }) });
    setTimeout(() => {
      const workouts = weekDays.map((dateObj, i) => {
        const formattedDate = format(dateObj, 'yyyy-MM-dd');
        // Assign a workout type for demo
        const types = ['Running', 'Cycling', 'Strength'];
        const type = types[i % types.length];
        let name = 'Workout';
        let description = '';
        let distance = 'N/A';
        let duration = 40;
        let intensity = 'Medium';
        let targetPace = 'N/A';
        let notes = '';
        let route = '';
        if (type === 'Running') {
          name = 'Easy Run';
          description = '5k at comfortable pace';
          distance = '5 km';
          duration = 30;
          intensity = 'Low';
          targetPace = '6:00-6:30/km';
          notes = 'Focus on form and breathing. Keep heart rate in Zone 2 (60-70% of max).';
          route = 'Neighborhood loop';
        } else if (type === 'Cycling') {
          name = 'Cycling Intervals';
          description = '8 x 2min hard, 2min easy';
          distance = '20 km';
          duration = 50;
          intensity = 'High';
          targetPace = 'Hard effort for intervals';
          notes = 'Alternate hard and easy efforts. Focus on cadence.';
          route = 'City loop';
        } else if (type === 'Strength') {
          name = 'Strength Session';
          description = 'Full body strength workout';
          distance = 'N/A';
          duration = 40;
          intensity = 'Medium';
          targetPace = 'N/A';
          notes = 'Focus on form and core stability.';
          route = 'Gym';
        }
        // Determine completed/missed/upcoming state
        let completed = false;
        let missed = false;
        if (isPrevious) {
          // Previous week: alternate completed/missed for demo
          completed = i % 2 === 0;
          missed = !completed;
        } else if (isCurrent) {
          if (isBefore(dateObj, today)) {
            completed = true;
          } else if (isAfter(dateObj, today)) {
            completed = false;
          } else {
            completed = false; // today
          }
        } else if (isNext) {
          completed = false;
        }
        return {
          id: `${i + 1}`,
          name,
          description,
          date: formattedDate,
          dateObj,
          distance,
          duration,
          intensity,
          type,
          targetPace,
          notes,
          route,
          completed,
          missed,
        };
      });
      setWorkouts(workouts);
      setLoading(false);
    }, 800);
  }, [currentWeekStart]);

  // Create workout markers for calendar
  const getMarkedDates = () => {
    const markedDates = {};
    
    workouts.forEach(workout => {
      // Get color based on workout type
      let dotColor = activityColors[workout.type] || activityColors.Other;
      
      // For rest days
      if (workout.intensity === 'None' || workout.duration === 0) {
        dotColor = activityColors.Rest;
      }
      
      // Scale dot size based on workout duration
      let dotSize = 6; // Default size
      
      if (workout.duration > 60) {
        dotSize = 10; // Large dot for long workouts
      } else if (workout.duration >= 30) {
        dotSize = 8; // Medium dot for regular workouts
      } else if (workout.duration === 0) {
        dotSize = 4; // Small dot for rest days
      }
      
      markedDates[workout.date] = {
        marked: true,
        dotColor: dotColor,
        selected: format(selectedDate, 'yyyy-MM-dd') === workout.date,
        selectedColor: 'rgba(255, 95, 109, 0.1)', // Light highlight for selected date
        customStyles: {
          dot: {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
          }
        }
      };
    });
    
    return markedDates;
  };

  // Handle goal carousel scroll
  const handleGoalScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (width - 64));
    setCurrentGoalIndex(index);
  };

  // Go to specific goal
  const scrollToGoal = (index) => {
    if (goalScrollViewRef.current) {
      goalScrollViewRef.current.scrollTo({
        x: index * (width - 64),
        animated: true,
      });
      setCurrentGoalIndex(index);
    }
  };

  // Week navigation
  const goToPreviousWeek = () => {
    // Only allow going back 1 week from current week
    const today = new Date();
    const oldestAllowedWeek = subWeeks(startOfWeek(today, { weekStartsOn: 1 }), 1);
    // Prevent going back more than 1 week from current
    if (!isBefore(currentWeekStart, oldestAllowedWeek)) {
      setCurrentWeekStart(subWeeks(currentWeekStart, 1));
    }
  };

  const goToNextWeek = () => {
    // Only allow going forward 1 week from current week
    const today = new Date();
    const newestAllowedWeek = addWeeks(startOfWeek(today, { weekStartsOn: 1 }), 1);
    // Prevent going forward more than 1 week from current
    if (!isAfter(currentWeekStart, newestAllowedWeek)) {
      setCurrentWeekStart(addWeeks(currentWeekStart, 1));
    }
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  // Toggle calendar expansion
  const toggleCalendar = useCallback(() => {
    setIsCalendarExpanded(!isCalendarExpanded);
  }, [isCalendarExpanded]);

  // Handle date selection
  const handleDateSelect = (day) => {
    setSelectedDate(new Date(day.timestamp));
  };

  // Navigate to workout details
  const navigateToWorkoutDetails = (workout) => {
    // For now, just log the workout since we don't have the details screen yet
    console.log('Navigating to workout details:', workout);
    // When you have a details screen, you can use this:
    // router.push({
    //   pathname: '/(auth)/workout-details',
    //   params: { workoutId: workout.id }
    // });
  };

  // Check if a date is in the past
  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isBefore(date, today);
  };

  // Toggle weekly goals expansion
  const toggleGoalExpansion = () => {
    setGoalExpanded(!goalExpanded);
  };

  // Add/Edit target event
  const showEventModal = () => {
    setEventModalVisible(true);
  };

  const hideEventModal = () => {
    setEventModalVisible(false);
  };

  const onEventDateChange = (event, selectedDate) => {
    setDatepickerVisible(false);
    if (selectedDate) {
      setNewEvent({ ...newEvent, date: selectedDate });
    }
  };

  const formatEventDate = (date) => {
    return format(date, 'MMMM d, yyyy');
  };

  const saveEvent = () => {
    // In a real app, this would save to state/context and persist to storage
    console.log('Saving event:', newEvent);
    hideEventModal();
    
    // Show confirmation toast or feedback
    // This is where you would update the actual app state with the new event
  };

  const textStyle = { 
    color: actualTheme?.colors?.text || '#333333',
    fontFamily: actualTheme?.fonts?.regular || undefined
  };
  const subtleTextStyle = { 
    color: (actualTheme?.colors?.text + '80') || '#33333380',
    fontFamily: actualTheme?.fonts?.regular || undefined
  };

  // Week or Calendar View
  const renderDateView = () => {
    if (isCalendarExpanded) {
      return (
        <Calendar
          markingType={'custom'}
          markedDates={getMarkedDates()}
          onDayPress={(day) => {
            handleDateSelect(day);
            setIsCalendarExpanded(false); // Auto-collapse after selection
          }}
          theme={{
            calendarBackground: actualTheme.colors.card,
            textSectionTitleColor: actualTheme.colors.text,
            selectedDayBackgroundColor: actualTheme.colors.primary,
            selectedDayTextColor: '#ffffff',
            todayTextColor: actualTheme.colors.accent,
            dayTextColor: actualTheme.colors.text,
            textDisabledColor: actualTheme.dark ? '#666666' : '#d9e1e8',
            monthTextColor: actualTheme.colors.text,
            arrowColor: actualTheme.colors.primary,
            backgroundColor: actualTheme.colors.card,
            textDayFontWeight: '500',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '600',
            textDayFontSize: 16,
            dotStyle: {
              width: 8,
              height: 8,
              borderRadius: 4,
              marginTop: 2,
            },
            weekendTextColor: actualTheme.dark ? '#FF5F6D' : '#d34747'
          }}
          style={styles.calendar}
        />
      );
    } else {
      return (
        <View {...weekPanResponder.panHandlers}>
          <View style={styles.weekViewContainer}>
            {weekDays.map((day, index) => {
              const formattedDay = format(day, 'd');
              const dayAbbr = format(day, 'EEE');
              const isDayToday = isToday(day);
              const isSelected = format(selectedDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
              
              // Check if there's a workout on this day
              const workoutsOnDay = workouts.filter(w => 
                format(new Date(w.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
              );
              const hasWorkout = workoutsOnDay.length > 0;
              
              // Get max duration for dot size and determine activity type
              let maxDuration = 0;
              let activityType = 'Other';
              
              if (hasWorkout) {
                maxDuration = Math.max(...workoutsOnDay.map(w => w.duration));
                
                // Get the most significant workout by duration
                const primaryWorkout = workoutsOnDay.reduce((prev, current) => 
                  (prev.duration > current.duration) ? prev : current
                );
                
                activityType = primaryWorkout.type || 
                               (primaryWorkout.intensity === 'None' ? 'Rest' : 'Other');
              }
              
              // Scale dot size
              let dotSize = 6;
              if (maxDuration > 60) {
                dotSize = 10;
              } else if (maxDuration >= 30) {
                dotSize = 8;
              } else if (maxDuration === 0) {
                dotSize = 4;
              }
              
              // Get the color based on activity type
              const dotColor = activityColors[activityType] || activityColors.Other;
              
              return (
                <TouchableOpacity 
                  key={index} 
                  style={[
                    styles.dayItem,
                    { backgroundColor: actualTheme.dark ? '#1E1E1E' : '#F5F5F5' },
                    isDayToday && [styles.todayItem, { 
                      backgroundColor: actualTheme.dark ? 'rgba(238, 108, 77, 0.15)' : 'rgba(255, 95, 109, 0.1)'
                    }],
                    isSelected && [styles.selectedDayItem, {
                      backgroundColor: actualTheme.dark ? 'rgba(238, 108, 77, 0.3)' : 'rgba(61, 90, 128, 0.1)'
                    }]
                  ]}
                  onPress={() => setSelectedDate(day)}
                >
                  <Text style={[
                    styles.dayText, 
                    { color: actualTheme.colors.text },
                    isDayToday && [styles.todayText, { 
                      color: actualTheme.dark ? '#EE6C4D' : '#FF5F6D'
                    }],
                    isSelected && [styles.selectedDayText, { 
                      color: actualTheme.dark ? '#EE6C4D' : '#3D5A80',
                      fontWeight: 'bold'
                    }]
                  ]}>
                    {dayAbbr}
                  </Text>
                  <View style={[
                    styles.dayNumber,
                    { backgroundColor: actualTheme.dark ? '#333333' : '#FFFFFF' },
                    isSelected && [styles.selectedDayNumber, { 
                      backgroundColor: actualTheme.dark ? '#444444' : '#3D5A80'
                    }]
                  ]}>
                    <Text style={[
                      styles.dayNumberText,
                      { color: actualTheme.dark ? '#FFFFFF' : '#333333' },
                      isDayToday && [styles.todayText, { 
                        color: actualTheme.dark ? '#EE6C4D' : '#FF5F6D'
                      }],
                      isSelected && [styles.selectedDayText, { 
                        color: '#FFFFFF', 
                        fontWeight: 'bold'
                      }]
                    ]}>
                      {formattedDay}
                    </Text>
                  </View>
                  <View style={{height: 16, justifyContent: 'center', alignItems: 'center'}}>
                    {hasWorkout && (
                      <View 
                        style={[
                          styles.workoutDot,
                          { 
                            width: dotSize, 
                            height: dotSize, 
                            borderRadius: dotSize/2,
                            backgroundColor: dotColor
                          }
                        ]} 
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
    }
  }

  // Animate expansion/collapse of weekly goals
  useEffect(() => {
    RNAnimated.timing(goalAnim, {
      toValue: goalExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [goalExpanded]);

  if (loading) {
    return <LoadingState message="Loading workouts..." />;
  }
  if (error) {
    return <ErrorState message={error} onRetry={() => { setError(null); setLoading(true); }} />;
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: actualTheme.colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: actualTheme.colors.card, paddingTop: 0, marginTop: 0 }}>
        <Surface style={[styles.header, { backgroundColor: actualTheme.colors.card, paddingTop: 8, paddingBottom: 8, marginBottom: 0 }]} elevation={2}>
          <View style={[styles.headerContent, { paddingTop: 0, paddingBottom: 0 }]}>
            <View style={styles.headerTitleRow}>
              <Text variant="headlineMedium" style={textStyle}>Training Plan</Text>
              <View style={styles.headerActions}>
                <IconButton 
                  icon="information-outline" 
                  size={24} 
                  onPress={() => setLegendModalVisible(true)} 
                  iconColor={actualTheme.colors.text} 
                />
                <IconButton 
                  icon="calendar-plus" 
                  size={24} 
                  onPress={showEventModal} 
                  iconColor={actualTheme.colors.text} 
                />
              </View>
            </View>
            
            <View style={styles.weeklyGoalsContainer}>
              <TouchableOpacity
                style={styles.weeklyGoalsHeader}
                onPress={toggleGoalExpansion}
                activeOpacity={0.7}
              >
                <View style={styles.weeklyGoalsHeaderLeft}>
                  <Text variant="titleMedium" style={[textStyle, styles.weeklyGoalsTitle]}>
                    Weekly Goals
                  </Text>
                  <MaterialCommunityIcons
                    name={goalExpanded ? "chevron-up" : "chevron-down"}
                    size={24}
                    color={actualTheme.colors.text}
                    style={styles.expandIcon}
                  />
                </View>
                {!goalExpanded && (
                  <View style={styles.collapsedSummary}>
                    {weeklyGoals[0].goals.map((goal) => (
                      <View key={goal.id} style={styles.miniGoal}>
                        <MaterialCommunityIcons
                          name={goal.icon}
                          size={16}
                          color="#FF5F6D"
                        />
                        <Text style={[textStyle, styles.miniGoalText]}>
                          {Math.round((goal.current / goal.goal) * 100)}%
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
              <RNAnimated.View
                style={{
                  overflow: 'hidden',
                  height: goalAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 220], // Adjust 220 to fit your expanded content height
                  }),
                  opacity: goalAnim,
                }}
              >
                {goalExpanded && (
                  <>
                    <View style={styles.goalIndicators}>
                      {weeklyGoals.map((_, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() => scrollToGoal(index)}
                          style={[
                            styles.goalIndicator,
                            currentGoalIndex === index && styles.goalIndicatorActive,
                          ]}
                          activeOpacity={0.7}
                        />
                      ))}
                    </View>
                    <ScrollView
                      ref={goalScrollViewRef}
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      onMomentumScrollEnd={handleGoalScroll}
                      snapToInterval={width - 64}
                      decelerationRate="fast"
                      contentContainerStyle={styles.goalCarouselContent}
                      snapToAlignment="center"
                    >
                      {weeklyGoals.map((goalGroup, index) => (
                        <View key={goalGroup.id} style={styles.goalCard}>
                          <Text style={[textStyle, styles.goalGroupTitle]}>{goalGroup.title}</Text>
                          {goalGroup.goals.map((goal) => (
                            <View key={goal.id} style={styles.goalItem}>
                              <View style={styles.goalCardHeader}>
                                <MaterialCommunityIcons
                                  name={goal.icon}
                                  size={20}
                                  color="#FF5F6D"
                                />
                                <Text style={[textStyle, styles.goalCardTitle]}>{goal.title}</Text>
                                <Text style={[textStyle, styles.goalNumbers]}>
                                  {goal.isDistance
                                    ? formatDistance(goal.current) + '/' + formatDistance(goal.goal)
                                    : goal.isElevation
                                    ? formatElevation(goal.current) + '/' + formatElevation(goal.goal)
                                    : `${goal.current}/${goal.goal} ${goal.unit}`}
                                </Text>
                              </View>
                              <ProgressBar
                                progress={goal.current / goal.goal}
                                color="#FF5F6D"
                                style={styles.progressBar}
                              />
                            </View>
                          ))}
                          {goalGroup.id === 'performance' && goalGroup.activityDistribution && (
                            <View style={styles.activityDistributionContainer}>
                              <Text style={[textStyle, styles.activityDistributionTitle]}>Activity Distribution</Text>
                              <View style={styles.stackedBar}>
                                {goalGroup.activityDistribution.map((activity, i) => (
                                  <View
                                    key={i}
                                    style={[
                                      styles.activitySegment,
                                      {
                                        width: `${activity.percentage}%`,
                                        backgroundColor: activity.color,
                                      },
                                    ]}
                                  />
                                ))}
                              </View>
                              <View style={styles.activityLegendContainer}>
                                {goalGroup.activityDistribution.map((activity, i) => (
                                  <View key={i} style={styles.activityLegendItem}>
                                    <View
                                      style={[
                                        styles.activityLegendColor,
                                        { backgroundColor: activity.color },
                                      ]}
                                    />
                                    <Text style={[textStyle, styles.activityLegendText]}>
                                      {activity.type} ({activity.percentage}%)
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            </View>
                          )}
                        </View>
                      ))}
                    </ScrollView>
                  </>
                )}
              </RNAnimated.View>
            </View>
          </View>
        </Surface>
      </SafeAreaView>

      <View style={styles.weekContainer}>
        <View style={styles.weekNavigation}>
          <View style={styles.weekSelectorContainer}>
            <IconButton
              icon="chevron-left"
              size={24}
              onPress={goToPreviousWeek}
              iconColor={
                // Disable previous button if already at limit
                isPreviousWeek() ? actualTheme.colors.text + '50' : actualTheme.colors.text
              }
              disabled={isPreviousWeek()}
            />
            <Text style={[textStyle, styles.weekLabel]}>
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
            </Text>
            <IconButton
              icon="chevron-right"
              size={24}
              onPress={goToNextWeek}
              iconColor={
                // Disable next button if already at limit
                isAfter(addWeeks(currentWeekStart, 1), addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 1)) 
                  ? actualTheme.colors.text + '50' 
                  : actualTheme.colors.text
              }
              disabled={isAfter(addWeeks(currentWeekStart, 1), addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 1))}
            />
          </View>
          
          <View style={styles.weekNavigationButtons}>
            <TouchableOpacity style={styles.todayButton} onPress={goToCurrentWeek}>
              <Text style={styles.todayButtonText}>Today</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.calendarButton, isCalendarExpanded && styles.calendarButtonActive]} 
              onPress={toggleCalendar}
            >
              <MaterialCommunityIcons 
                name={isCalendarExpanded ? "view-week" : "calendar-month"} 
                size={16} 
                color="#fff" 
              />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.calendarContainer}>
          {renderDateView()}
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium" style={[styles.dateHeading, textStyle]}>
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </Text>
        
        {workouts
          .filter(workout => format(new Date(workout.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'))
          .map((workout) => {
            const isPast = isPastDate(new Date(workout.date));
            
            return (
              <Card 
                key={workout.id} 
                style={[styles.workoutCard, { backgroundColor: actualTheme.colors.card }]}
              >
                <Card.Content>
                  <View style={styles.workoutHeader}>
                    <View>
                      <Text variant="titleMedium" style={textStyle}>{workout.name}</Text>
                      <Text variant="bodyMedium" style={textStyle}>{workout.description}</Text>
                      {workout.completed && (
                        <View style={styles.completedBadge}>
                          <MaterialCommunityIcons name="check-circle" size={14} color="#4CAF50" />
                          <Text style={styles.completedText}>Completed</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity>
                      <MaterialCommunityIcons name="dots-vertical" size={24} color={actualTheme.colors.text} />
                    </TouchableOpacity>
                  </View>
                  
                  {workout.intensity !== 'None' && (
                    <View style={styles.workoutDetails}>
                      <View style={styles.detailItem}>
                        <MaterialCommunityIcons 
                          name="map-marker-distance" 
                          size={20} 
                          color={activityColors[workout.type] || activityColors.Other} 
                        />
                        <Text variant="bodyMedium" style={textStyle}>{workout.distance}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <MaterialCommunityIcons 
                          name="clock-outline" 
                          size={20} 
                          color={activityColors[workout.type] || activityColors.Other}
                        />
                        <Text variant="bodyMedium" style={textStyle}>
                          {workout.duration} {workout.duration === 1 ? 'min' : 'mins'}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <MaterialCommunityIcons 
                          name={workout.intensity === 'High' ? "lightning-bolt" : "speedometer-medium"} 
                          size={20} 
                          color={activityColors[workout.type] || activityColors.Other}
                        />
                        <Text variant="bodyMedium" style={textStyle}>{workout.intensity}</Text>
                      </View>
                    </View>
                  )}
                </Card.Content>
                
                {workout.intensity !== 'None' && (
                  <Card.Actions>
                    {isPast && workout.completed ? (
                      // Past completed workout - show Summary button
                      <Button 
                        mode="contained" 
                        buttonColor={actualTheme.dark ? "#444444" : "#98C1D9"}
                        textColor="white"
                        style={[styles.actionButton, { width: '100%' }]}
                        onPress={() => navigateToWorkoutDetails(workout)}
                      >
                        Summary
                      </Button>
                    ) : (!isPast && (
                      // Future or today's workout - show Details button
                      <Button 
                        mode="contained" 
                        buttonColor={actualTheme.dark ? "#333333" : "#3D5A80"}
                        textColor="white"
                        style={[styles.actionButton, { width: '100%' }]}
                        onPress={() => navigateToWorkoutDetails(workout)}
                      >
                        Details
                      </Button>
                    ))}
                  </Card.Actions>
                )}
              </Card>
            );
          })}
          
        {workouts.filter(workout => 
          format(new Date(workout.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
        ).length === 0 && (
          <EmptyState message="No workouts scheduled for this day" icon="calendar-remove-outline" />
        )}
      </View>

      {/* Training Block Summary */}
      <View style={styles.section}>
        <View style={styles.trainingBlockHeader}>
          <Text variant="titleMedium" style={[styles.sectionTitle, textStyle]}>
            Training Block Summary
          </Text>
          <View style={[styles.countdownContainer, { 
            backgroundColor: actualTheme.dark ? '#333333' : '#3D5A80' 
          }]}>
            <Text style={styles.countdownText}>21 days left</Text>
          </View>
        </View>
        
        <Card style={[styles.trainingBlockCard, { backgroundColor: actualTheme.colors.card }]}>
          <Card.Content>
            <Text style={[textStyle, styles.blockTitle]}>Base Building Phase</Text>
            <Text style={[subtleTextStyle, styles.blockDescription]}>
              Focus on building aerobic endurance and consistency
            </Text>
            
            <View style={styles.blockProgressContainer}>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View style={[styles.progressBarFill, { width: '65%' }]} />
                </View>
                <Text style={[subtleTextStyle, styles.progressText]}>65% complete</Text>
              </View>
            </View>
            
            <View style={styles.metricsContainer}>
              <View style={styles.metricItem}>
                <View style={styles.metricHeader}>
                  <MaterialCommunityIcons 
                    name="map-marker-distance" 
                    size={16} 
                    color={activityColors.Running} 
                  />
                  <Text style={[textStyle, styles.metricTitle]}>Distance</Text>
                </View>
                <Text style={[textStyle, styles.metricValue]}>87.3 km</Text>
                <Text style={[subtleTextStyle, styles.metricTarget]}>of 150 km</Text>
                <ProgressBar 
                  progress={87.3/150} 
                  color={activityColors.Running} 
                  style={styles.metricProgress} 
                />
              </View>
              
              <View style={styles.metricItem}>
                <View style={styles.metricHeader}>
                  <MaterialCommunityIcons 
                    name="clock-outline" 
                    size={16} 
                    color={activityColors.Running} 
                  />
                  <Text style={[textStyle, styles.metricTitle]}>Duration</Text>
                </View>
                <Text style={[textStyle, styles.metricValue]}>8h 45m</Text>
                <Text style={[subtleTextStyle, styles.metricTarget]}>of 15h</Text>
                <ProgressBar 
                  progress={(8*60+45)/(15*60)} 
                  color={activityColors.Running} 
                  style={styles.metricProgress} 
                />
              </View>
              
              <View style={styles.metricItem}>
                <View style={styles.metricHeader}>
                  <MaterialCommunityIcons 
                    name="calendar-check" 
                    size={16} 
                    color={activityColors.Running} 
                  />
                  <Text style={[textStyle, styles.metricTitle]}>Workouts</Text>
                </View>
                <Text style={[textStyle, styles.metricValue]}>12</Text>
                <Text style={[subtleTextStyle, styles.metricTarget]}>of 20</Text>
                <ProgressBar 
                  progress={12/20} 
                  color={activityColors.Running} 
                  style={styles.metricProgress} 
                />
              </View>
            </View>
            
            <View style={styles.blockActivities}>
              <Text style={[textStyle, styles.activitiesTitle]}>Activity Breakdown</Text>
              <View style={styles.activityChart}>
                <View style={styles.stackedBar}>
                  <View style={[styles.activitySegment, { width: '60%', backgroundColor: activityColors.Running }]} />
                  <View style={[styles.activitySegment, { width: '25%', backgroundColor: activityColors.Cycling }]} />
                  <View style={[styles.activitySegment, { width: '15%', backgroundColor: activityColors.Strength }]} />
                </View>
              </View>
              <View style={styles.activityLabels}>
                <View style={styles.activityLabel}>
                  <View style={[styles.activityLabelColor, { backgroundColor: activityColors.Running }]} />
                  <Text style={[textStyle, styles.activityLabelText]}>Running (60%)</Text>
                </View>
                <View style={styles.activityLabel}>
                  <View style={[styles.activityLabelColor, { backgroundColor: activityColors.Cycling }]} />
                  <Text style={[textStyle, styles.activityLabelText]}>Cycling (25%)</Text>
                </View>
                <View style={styles.activityLabel}>
                  <View style={[styles.activityLabelColor, { backgroundColor: activityColors.Strength }]} />
                  <Text style={[textStyle, styles.activityLabelText]}>Strength (15%)</Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* Event Modal */}
      <Portal>
        <Modal
          visible={eventModalVisible}
          onDismiss={hideEventModal}
          contentContainerStyle={[
            styles.eventModalContainer,
            { backgroundColor: actualTheme.colors.background }
          ]}
        >
          <View style={styles.eventModalHeader}>
            <Text variant="headlineSmall" style={[styles.eventModalTitle, textStyle]}>
              Add Target Event
            </Text>
            <IconButton
              icon="close"
              size={24}
              onPress={hideEventModal}
              iconColor={actualTheme.colors.text}
            />
          </View>

          <TextInput
            label="Event Name"
            value={newEvent.name}
            onChangeText={text => setNewEvent({ ...newEvent, name: text })}
            style={styles.eventInput}
            mode="outlined"
          />

          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setDatepickerVisible(true)}
          >
            <Text style={[styles.datePickerLabel, subtleTextStyle]}>Event Date</Text>
            <Text style={[styles.datePickerValue, textStyle]}>
              {formatEventDate(newEvent.date)}
            </Text>
          </TouchableOpacity>

          {datepickerVisible && (
            <DateTimePicker
              value={newEvent.date}
              mode="date"
              display="default"
              onChange={onEventDateChange}
              minimumDate={new Date()}
            />
          )}

          <View style={styles.eventModalActions}>
            <Button 
              mode="outlined" 
              onPress={hideEventModal} 
              style={styles.eventModalButton}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={saveEvent} 
              style={styles.eventModalButton}
              buttonColor={actualTheme.dark ? "#333333" : "#3D5A80"}
              disabled={!newEvent.name.trim()}
            >
              Save Event
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Add the Legend Modal */}
      <Portal>
        <Modal
          visible={legendModalVisible}
          onDismiss={() => setLegendModalVisible(false)}
          contentContainerStyle={[
            styles.legendModalContainer,
            { backgroundColor: actualTheme.colors.background }
          ]}
        >
          <View style={styles.legendModalHeader}>
            <Text variant="headlineSmall" style={[styles.legendModalTitle, textStyle]}>
              Activity Color Legend
            </Text>
            <IconButton
              icon="close"
              size={24}
              onPress={() => setLegendModalVisible(false)}
              iconColor={actualTheme.colors.text}
            />
          </View>

          <View style={styles.legendContent}>
            {Object.entries(activityColors).map(([type, color]) => (
              <View key={type} style={styles.legendItem}>
                <View style={[styles.legendColorDot, { backgroundColor: color }]} />
                <View style={styles.legendTextContainer}>
                  <Text style={[textStyle, styles.legendText]}>{type}</Text>
                  <Text style={[subtleTextStyle, styles.legendSubtext]}>
                    {type === 'Running' && 'Used for all running activities including intervals, tempo, and long runs'}
                    {type === 'Cycling' && 'Used for all cycling and bike training sessions'}
                    {type === 'Strength' && 'Used for strength training and resistance workouts'}
                    {type === 'Other' && 'Used for cross-training and miscellaneous activities'}
                    {type === 'Rest' && 'Used for rest days and recovery sessions'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
          
          <Text style={[subtleTextStyle, styles.legendDescription]}>
            These colors are used consistently throughout the app to indicate activity types in the calendar, 
            weekly goals, and workout details.
          </Text>
        </Modal>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(152, 193, 217, 0.2)',
    marginBottom: 0,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerContent: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
  },
  weeklyGoalsContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  weeklyGoalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  weeklyGoalsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weeklyGoalsTitle: {
    fontWeight: 'bold',
  },
  expandIcon: {
    marginLeft: 6,
  },
  collapsedSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniGoal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: 'rgba(255, 95, 109, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
  },
  miniGoalText: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 3,
  },
  goalIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  goalIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
    opacity: 0.6,
  },
  goalIndicatorActive: {
    backgroundColor: '#FF5F6D',
    width: 10,
    height: 10,
    borderRadius: 5,
    opacity: 1,
  },
  goalCarouselContent: {
    paddingRight: 16,
  },
  goalCard: {
    width: width - 64, // Full screen width minus padding
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(152, 193, 217, 0.2)', // Muted blue with opacity
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  goalGroupTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  goalItem: {
    marginBottom: 10,
  },
  goalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  goalCardTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  goalNumbers: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  calendarContainer: {
    marginVertical: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
    elevation: 1,
  },
  calendar: {
    width: '100%',
    borderWidth: 0,
    borderRadius: 12,
  },
  weekContainer: {
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  weekNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  weekSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  todayButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#3D5A80',
  },
  todayButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 12,
  },
  weekScrollContainer: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  weekViewContainer: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayItem: {
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    paddingVertical: 12,
    flex: 1,
    marginHorizontal: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    height: 110,
  },
  todayItem: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(238, 108, 77, 0.5)',
  },
  selectedDayItem: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(61, 90, 128, 0.5)',
  },
  dayText: {
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Satoshi-Medium',
  },
  todayText: {
    color: '#EE6C4D',
    fontWeight: 'bold',
  },
  selectedDayText: {
    color: '#FF5F6D',
  },
  dayNumber: {
    height: 36,
    width: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 6,
  },
  selectedDayNumber: {
    backgroundColor: '#3D5A80',
  },
  dayNumberText: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Satoshi-Medium',
  },
  selectedDayNumberText: {
    color: 'white',
  },
  workoutDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    alignSelf: 'center',
  },
  section: {
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  dateHeading: {
    marginBottom: 10,
    fontWeight: 'bold',
  },
  workoutCard: {
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: 'rgba(224, 251, 252, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  completedText: {
    color: '#98C1D9',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  dateText: {
    color: '#666',
    marginTop: 4,
  },
  workoutDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 6,
  },
  activityDistributionContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  activityDistributionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  stackedBar: {
    height: 24,
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f3f3f3',
  },
  activitySegment: {
    height: '100%',
  },
  activityLegendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    justifyContent: 'space-between',
  },
  activityLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
    marginBottom: 5,
    width: '45%',
  },
  activityLegendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  activityLegendText: {
    fontSize: 12,
  },
  eventModalContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    elevation: 5,
  },
  eventModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  eventModalTitle: {
    fontWeight: 'bold',
  },
  eventInput: {
    marginBottom: 16,
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 12,
    marginBottom: 24,
  },
  datePickerLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  datePickerValue: {
    fontSize: 16,
  },
  eventModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  eventModalButton: {
    minWidth: 100,
  },
  weekNavigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarButton: {
    padding: 8,
    borderRadius: 6,
    marginLeft: 8,
    backgroundColor: '#3D5A80',
  },
  calendarButtonActive: {
    backgroundColor: '#EE6C4D',
  },
  legendModalContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    elevation: 5,
    maxWidth: 400,
    alignSelf: 'center',
  },
  legendModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  legendModalTitle: {
    fontWeight: 'bold',
  },
  legendContent: {
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  legendColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
    marginTop: 4,
  },
  legendTextContainer: {
    flex: 1,
  },
  legendText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  legendSubtext: {
    fontSize: 12,
    lineHeight: 16,
  },
  legendDescription: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 10,
    marginTop: 10,
  },
  trainingBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  countdownContainer: {
    padding: 8,
    borderRadius: 6,
  },
  countdownText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 12,
  },
  trainingBlockCard: {
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(152, 193, 217, 0.2)',
  },
  blockTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  blockDescription: {
    fontSize: 12,
    marginBottom: 16,
  },
  blockProgressContainer: {
    marginBottom: 16,
  },
  progressBarContainer: {
    height: 20,
    backgroundColor: '#f3f3f3',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarBackground: {
    height: '100%',
    backgroundColor: '#ddd',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#EE6C4D',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
  },
  metricsContainer: {
    marginBottom: 20,
  },
  metricItem: {
    marginBottom: 12,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  metricTarget: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 4,
  },
  metricProgress: {
    height: 8,
    borderRadius: 4,
  },
  blockActivities: {
    marginTop: 16,
  },
  activitiesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  activityChart: {
    marginBottom: 12,
  },
  stackedBar: {
    height: 24,
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f3f3f3',
  },
  activityLabels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  activityLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  activityLabelColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  activityLabelText: {
    fontSize: 12,
  },
}); 
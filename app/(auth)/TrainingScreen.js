import React, { useState, useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Animated, Dimensions, PanResponder, SafeAreaView } from 'react-native';
import { Text, Surface, Card, Button, IconButton, ProgressBar, Portal, Modal, TextInput, Dialog, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, subDays, addWeeks, subWeeks, isBefore, isAfter, isToday, isSameWeek } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { EmptyState } from '../../src/components/StatusStates';
import { Animated as RNAnimated } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(152, 193, 217, 0.2)', marginBottom: 0, paddingTop: 8, paddingBottom: 8, },
  headerContent: { paddingTop: 0, paddingBottom: 0, },
  headerTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  weeklyGoalsContainer: { marginTop: 12, marginBottom: 8, },
  weeklyGoalsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, },
  weeklyGoalsHeaderLeft: { flexDirection: 'row', alignItems: 'center', },
  weeklyGoalsTitle: { fontWeight: 'bold', },
  expandIcon: { marginLeft: 6, },
  collapsedSummary: { flexDirection: 'row', alignItems: 'center', },
  miniGoal: { flexDirection: 'row', alignItems: 'center', marginLeft: 8, backgroundColor: 'rgba(255, 95, 109, 0.1)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 12, },
  miniGoalText: { fontSize: 11, fontWeight: '500', marginLeft: 3, },
  goalIndicators: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8, },
  goalIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ddd', marginHorizontal: 4, opacity: 0.6, },
  goalIndicatorActive: { backgroundColor: '#FF5F6D', width: 10, height: 10, borderRadius: 5, opacity: 1, },
  goalCarouselContent: { paddingRight: 16, },
  goalCard: { width: width - 64, padding: 16, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(152, 193, 217, 0.2)', shadowColor: "#000", shadowOffset: { width: 0, height: 2, }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 3, },
  goalGroupTitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', },
  goalItem: { marginBottom: 10, },
  goalCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, },
  goalCardTitle: { fontSize: 14, fontWeight: '500', marginLeft: 8, flex: 1, },
  goalNumbers: { fontSize: 14, fontWeight: '500', textAlign: 'right', },
  progressBar: { height: 6, borderRadius: 3, },
  calendarContainer: { marginVertical: 8, backgroundColor: 'white', borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1, }, shadowOpacity: 0.18, shadowRadius: 1.00, elevation: 1, },
  calendar: { width: '100%', borderWidth: 0, borderRadius: 12, },
  weekContainer: { marginTop: 8, marginHorizontal: 16, marginBottom: 8, },
  weekNavigation: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, },
  weekSelectorContainer: { flexDirection: 'row', alignItems: 'center', },
  weekLabel: { fontSize: 16, fontWeight: '500', },
  todayButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, backgroundColor: '#3D5A80', },
  todayButtonText: { color: 'white', fontWeight: '500', fontSize: 12, },
  weekScrollContainer: { paddingVertical: 8, paddingHorizontal: 4, },
  weekViewContainer: { paddingVertical: 12, paddingHorizontal: 4, flexDirection: 'row', justifyContent: 'space-between', },
  dayItem: { alignItems: 'center', justifyContent: 'space-between', padding: 8, paddingVertical: 12, flex: 1, marginHorizontal: 2, borderRadius: 8, borderWidth: 1, borderColor: 'transparent', height: 110, },
  todayItem: { borderRadius: 8, borderWidth: 1, borderColor: 'rgba(238, 108, 77, 0.5)', },
  selectedDayItem: { borderRadius: 8, borderWidth: 1, borderColor: 'rgba(61, 90, 128, 0.5)', },
  dayText: { fontSize: 13, marginBottom: 8, textAlign: 'center', fontFamily: 'Satoshi-Medium', },
  todayText: { color: '#EE6C4D', fontWeight: 'bold', },
  selectedDayText: { color: '#FF5F6D', },
  dayNumber: { height: 36, width: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginVertical: 6, },
  selectedDayNumber: { backgroundColor: '#3D5A80', },
  dayNumberText: { fontSize: 16, textAlign: 'center', fontFamily: 'Satoshi-Medium', },
  selectedDayNumberText: { color: 'white', },
  workoutDot: { width: 6, height: 6, borderRadius: 3, marginTop: 8, alignSelf: 'center', },
  section: { marginHorizontal: 16, marginTop: 0, marginBottom: 16, },
  sectionTitle: { marginBottom: 8, fontWeight: 'bold', },
  dateHeading: { marginBottom: 10, fontWeight: 'bold', },
  workoutCard: { marginBottom: 16, borderRadius: 8, borderWidth: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 2, }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2, },
  workoutHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, },
  completedBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 6, backgroundColor: 'rgba(224, 251, 252, 0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, },
  completedText: { color: '#98C1D9', fontSize: 12, fontWeight: '500', marginLeft: 4, },
  dateText: { color: '#666', marginTop: 4, },
  workoutDetails: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#eee', borderBottomWidth: 1, borderBottomColor: '#eee', },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4, },
  actionButton: { flex: 1, marginHorizontal: 4, borderRadius: 6, },
  activityDistributionContainer: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.1)', },
  activityDistributionTitle: { fontSize: 16, fontWeight: '500', marginBottom: 8, },
  stackedBar: { height: 24, flexDirection: 'row', borderRadius: 12, overflow: 'hidden', backgroundColor: '#f3f3f3', },
  activitySegment: { height: '100%', },
  activityLegendContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, justifyContent: 'space-between', },
  activityLegendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 6, marginBottom: 5, width: '45%', },
  activityLegendColor: { width: 12, height: 12, borderRadius: 6, marginRight: 6, },
  activityLegendText: { fontSize: 12, },
  eventModalContainer: { margin: 20, padding: 20, borderRadius: 12, elevation: 5, },
  eventModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, },
  eventModalTitle: { fontWeight: 'bold', },
  eventInput: { marginBottom: 16, },
  datePickerButton: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 12, marginBottom: 24, },
  datePickerLabel: { fontSize: 12, marginBottom: 4, },
  datePickerValue: { fontSize: 16, },
  eventModalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, },
  eventModalButton: { minWidth: 100, },
  weekNavigationButtons: { flexDirection: 'row', alignItems: 'center', },
  calendarButton: { padding: 8, borderRadius: 6, marginLeft: 8, backgroundColor: '#3D5A80', },
  calendarButtonActive: { backgroundColor: '#EE6C4D', },
  legendModalContainer: { margin: 20, padding: 20, borderRadius: 12, elevation: 5, maxWidth: 400, alignSelf: 'center', backgroundColor: '#f5f5f5' },
  legendModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, },
  legendModalTitle: { fontWeight: 'bold', fontSize: 18, color: '#333' },
  legendContent: { marginBottom: 20, },
  legendItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, },
  legendColorDot: { width: 16, height: 16, borderRadius: 8, marginRight: 12, },
  legendText: { fontSize: 16, color: '#333' },
  legendModalButton: { marginTop: 10, },
  trainingBlockHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, },
  countdownContainer: { padding: 8, borderRadius: 6, },
  countdownText: { color: 'white', fontWeight: '500', fontSize: 12, },
  trainingBlockCard: { marginBottom: 16, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(152, 193, 217, 0.2)', },
  blockTitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 8, },
  blockDescription: { fontSize: 12, marginBottom: 16, },
  blockProgressContainer: { marginBottom: 16, },
  progressBarContainer: { height: 20, backgroundColor: '#f3f3f3', borderRadius: 10, overflow: 'hidden', },
  progressBarBackground: { height: '100%', backgroundColor: '#ddd', },
  progressBarFill: { height: '100%', backgroundColor: '#EE6C4D', },
  progressText: { fontSize: 12, fontWeight: '500', textAlign: 'right', },
  metricItem: { marginBottom: 12, },
  metricHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, },
  metricTitle: { fontSize: 14, fontWeight: '500', marginLeft: 8, flex: 1, },
  metricValue: { fontSize: 16, fontWeight: '600', },
  metricTarget: { fontSize: 12, marginTop: 2, marginBottom: 4, },
  metricProgress: { height: 8, borderRadius: 4, },
  activitiesTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, },
  activityChart: { marginBottom: 12, },
  activityLabels: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, },
  activityLabel: { flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 8, },
  activityLabelColor: { width: 12, height: 12, borderRadius: 6, marginRight: 6, },
  activityLabelText: { fontSize: 12, },
});

function formatDistance(distance) {
  if (typeof distance !== 'number') return null;
  return `${distance.toFixed(1)} km`;
}

function formatElevation(elevation) {
  if (typeof elevation !== 'number') return null;
  return `${Math.round(elevation)} m`;
}

export default function TrainingScreen() {
  const { actualTheme } = useTheme();

  const params = useLocalSearchParams();
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false); // Restore default state
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
        if (gestureState.dx < -50) {
          goToNextWeek();
        }
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
  const [goalAnim] = useState(new RNAnimated.Value(0));
  
  const activityColors = {
    'Running': '#EE6C4D',
    'Cycling': '#5C8BDD',
    'Strength': '#9A7ED4',
    'Other': '#70C1B3',
    'Rest': '#666666'
  };

  // Constants for Training Block Summary
  const todayForBlock = new Date();
  // Adjust getDay() to be 1 (Mon) to 7 (Sun)
  const dayOfWeekForBlock = todayForBlock.getDay();
  const actualCurrentDayOfWeek = dayOfWeekForBlock === 0 ? 7 : dayOfWeekForBlock;
  const progressPercent = (actualCurrentDayOfWeek / 7) * 100;

  const generateWeeklyGoals = useCallback(() => {
    const seed = new Date(currentWeekStart).getTime();
    const getRandomValue = (min, max) => {
      const x = Math.sin(seed + min) * 10000;
      return Math.floor(min + (Math.abs(x) % (max - min)));
    };
    const today = new Date();
    const isCurrentWeek = isSameWeek(today, currentWeekStart);
    const dayOfWeek = isCurrentWeek ? (today.getDay() === 0 ? 7 : today.getDay()) : 7;
    const progressFactor = isCurrentWeek ? dayOfWeek / 7 : (isPreviousWeek() ? 1 : 0);
    const numWorkouts = 4 + getRandomValue(0, 3);
    const currentWorkouts = Math.round(numWorkouts * progressFactor * (0.8 + getRandomValue(0, 40) / 100));
    const intensityScore = 5 + getRandomValue(-2, 3);
    const maxIntensity = 10;
    const activityTypes = [
      { type: 'Running', percentage: 30 + getRandomValue(-10, 20), color: activityColors.Running },
      { type: 'Cycling', percentage: 25 + getRandomValue(-10, 15), color: activityColors.Cycling },
      { type: 'Strength', percentage: 20 + getRandomValue(-5, 15), color: activityColors.Strength },
      { type: 'Other', percentage: 15 + getRandomValue(-5, 10), color: activityColors.Other }
    ];
    const totalPercentage = activityTypes.reduce((sum, activity) => sum + activity.percentage, 0);
    activityTypes.forEach(activity => {
      activity.percentage = Math.round((activity.percentage / totalPercentage) * 100);
    });
    const distanceGoal = 30 + getRandomValue(0, 15);
    const currentDistance = Math.round(distanceGoal * progressFactor * (0.8 + getRandomValue(0, 40) / 100));
    const elevationGoal = 400 + getRandomValue(0, 300);
    const currentElevation = Math.round(elevationGoal * progressFactor * (0.8 + getRandomValue(0, 40) / 100));
    return [
      {id: 'summary', title: 'Weekly Summary', goals: [ {id: 'distance', title: 'Distance', goal: distanceGoal, current: currentDistance, unit: '', icon: 'map-marker-distance', isDistance: true }, { id: 'time', title: 'Time', goal: 180 + getRandomValue(0, 120), current: Math.round((180 + getRandomValue(0, 120)) * progressFactor * (0.8 + getRandomValue(0, 40) / 100)), unit: 'min', icon: 'clock-outline', }, { id: 'elevation', title: 'Elevation', goal: elevationGoal, current: currentElevation, unit: '', icon: 'terrain', isElevation: true }, ] },
      {id: 'performance', title: 'Performance', goals: [ { id: 'workouts', title: 'Workouts', goal: numWorkouts, current: currentWorkouts, unit: 'sessions', icon: 'calendar-check', }, { id: 'intensity', title: 'Avg. Intensity', goal: maxIntensity, current: intensityScore, unit: '/10', icon: 'lightning-bolt', } ], activityDistribution: activityTypes }
    ];
  }, [currentWeekStart]);

  const isPreviousWeek = useCallback(() => {
    const today = new Date();
    const previousWeekStart = subWeeks(startOfWeek(today, { weekStartsOn: 1 }), 1);
    return isBefore(currentWeekStart, previousWeekStart);
  }, [currentWeekStart]);

  const isSameWeek = (date1, date2, options = { weekStartsOn: 1 }) => {
    const start1 = startOfWeek(date1, options);
    const start2 = startOfWeek(date2, options);
    return start1.getTime() === start2.getTime();
  };

  const weeklyGoals = generateWeeklyGoals();
  const weekStart = currentWeekStart;
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    const today = new Date();
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
    const startOfSelectedWeek = currentWeekStart;
    const isCurrent = startOfSelectedWeek.getTime() === startOfCurrentWeek.getTime();
    const isPrevious = startOfSelectedWeek.getTime() < startOfCurrentWeek.getTime();
    const isNext = startOfSelectedWeek.getTime() > startOfCurrentWeek.getTime();
    const currentWeekDays = eachDayOfInterval({ start: startOfSelectedWeek, end: endOfWeek(startOfSelectedWeek, { weekStartsOn: 1 }) });
      
    const generateWorkouts = currentWeekDays.map((dateObj, i) => {
      const formattedDate = format(dateObj, 'yyyy-MM-dd');
      const types = ['Running', 'Cycling', 'Strength'];
      const type = types[i % types.length];
      let name = 'Workout'; let description = ''; let distance = 'N/A'; let duration = 40; let intensity = 'Medium'; let targetPace = 'N/A'; let notes = ''; let route = '';
      if (type === 'Running') { name = 'Easy Run'; description = '5k at comfortable pace'; distance = '5 km'; duration = 30; intensity = 'Low'; targetPace = '6:00-6:30/km'; notes = 'Focus on form and breathing. Keep heart rate in Zone 2 (60-70% of max).'; route = 'Neighborhood loop'; }
      else if (type === 'Cycling') { name = 'Cycling Intervals'; description = '8 x 2min hard, 2min easy'; distance = '20 km'; duration = 50; intensity = 'High'; targetPace = 'Hard effort for intervals'; notes = 'Alternate hard and easy efforts. Focus on cadence.'; route = 'City loop'; }
      else if (type === 'Strength') { name = 'Strength Session'; description = 'Full body strength workout'; distance = 'N/A'; duration = 40; intensity = 'Medium'; targetPace = 'N/A'; notes = 'Focus on form and core stability.'; route = 'Gym'; }
      let completed = false; let missed = false;
      if (isPrevious) { completed = i % 2 === 0; missed = !completed; }
      else if (isCurrent) { if (isBefore(dateObj, today)) completed = true; else if (isAfter(dateObj, today)) completed = false; else completed = false; }
      else if (isNext) completed = false;
      return { id: `${i + 1}`, name, description, date: formattedDate, dateObj, distance, duration, intensity, type, targetPace, notes, route, completed, missed };
    });
    setWorkouts(generateWorkouts);

  }, [currentWeekStart]);

  const getMarkedDates = () => {
    const markedDates = {};
    workouts.forEach(workout => {
      let dotColor = activityColors[workout.type] || activityColors.Other;
      if (workout.intensity === 'None' || workout.duration === 0) { dotColor = activityColors.Rest; }
      let dotSize = 6;
      if (workout.duration > 60) { dotSize = 10; } else if (workout.duration >= 30) { dotSize = 8; } else if (workout.duration === 0) { dotSize = 4; }
      markedDates[workout.date] = { marked: true, dotColor: dotColor, selected: format(selectedDate, 'yyyy-MM-dd') === workout.date, selectedColor: 'rgba(255, 95, 109, 0.1)', customStyles: { dot: { width: dotSize, height: dotSize, borderRadius: dotSize / 2, } } };
    });
    return markedDates;
  };

  const handleGoalScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (width - 64));
    setCurrentGoalIndex(index);
  };

  const scrollToGoal = (index) => {
    if (goalScrollViewRef.current) {
      goalScrollViewRef.current.scrollTo({ x: index * (width - 64), animated: true });
      setCurrentGoalIndex(index);
    }
  };

  const goToPreviousWeek = () => {
    const today = new Date();
    const oldestAllowedWeek = subWeeks(startOfWeek(today, { weekStartsOn: 1 }), 1);
    if (!isBefore(currentWeekStart, oldestAllowedWeek)) { setCurrentWeekStart(subWeeks(currentWeekStart, 1)); }
  };

  const goToNextWeek = () => {
    const today = new Date();
    const newestAllowedWeek = addWeeks(startOfWeek(today, { weekStartsOn: 1 }), 1);
    if (!isAfter(currentWeekStart, newestAllowedWeek)) { setCurrentWeekStart(addWeeks(currentWeekStart, 1)); }
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const toggleCalendar = useCallback(() => {
    setIsCalendarExpanded(!isCalendarExpanded);
  }, [isCalendarExpanded]);

  const handleDateSelect = (day) => {
    setSelectedDate(new Date(day.timestamp));
  };

  const navigateToWorkoutDetails = (workout) => {
    // console.log('Navigating to workout details:', workout);
  };

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isBefore(date, today);
  };

  const toggleGoalExpansion = () => {
    setGoalExpanded(!goalExpanded);
  };

  const showEventModal = () => { setEventModalVisible(true); };
  const hideEventModal = () => { setEventModalVisible(false); };

  const onEventDateChange = (event, selectedDate) => {
    setDatepickerVisible(false);
    if (selectedDate) { setNewEvent({ ...newEvent, date: selectedDate }); }
  };

  const formatEventDate = (date) => { return format(date, 'MMMM d, yyyy'); };

  const saveEvent = () => {
    // console.log('Saving event:', newEvent);
    hideEventModal();
  };

  const textStyle = { color: actualTheme.colors.text };
  const subtleTextStyle = { color: actualTheme.colors.text + '80' };

  const renderDateView = () => {
    if (isCalendarExpanded) {
      // Calendar component logic remains simplified from previous step
      return (
        <Calendar
          current={format(selectedDate, 'yyyy-MM-dd')}
          onDayPress={handleDateSelect}
          markedDates={getMarkedDates()}
          style={styles.calendar}
          theme={{
            backgroundColor: actualTheme.colors.card,
            calendarBackground: actualTheme.colors.card,
            textSectionTitleColor: actualTheme.colors.text,
            textSectionTitleDisabledColor: actualTheme.colors.text + '80',
            selectedDayBackgroundColor: actualTheme.colors.primary,
            selectedDayTextColor: '#ffffff',
            todayTextColor: actualTheme.colors.accent,
            dayTextColor: actualTheme.colors.text,
            textDisabledColor: actualTheme.colors.text + '80',
            dotColor: actualTheme.colors.accent,
            selectedDotColor: '#ffffff',
            arrowColor: actualTheme.colors.primary,
            disabledArrowColor: actualTheme.colors.primary + '80',
            monthTextColor: actualTheme.colors.text,
            indicatorColor: actualTheme.colors.primary,
            textDayFontSize: 16,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 14
          }}
        />
      );
    } else {
      return (
        <View {...weekPanResponder.panHandlers}>
          <View style={styles.weekViewContainer}>
            {weekDays.map((day, index) => {
              const formattedDay = format(day, 'd'); const dayAbbr = format(day, 'EEE'); const isDayToday = isToday(day); const isSelected = format(selectedDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
              const workoutsOnDay = workouts.filter(w => format(new Date(w.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')); const hasWorkout = workoutsOnDay.length > 0;
              let maxDuration = 0; let activityType = 'Other';
              if (hasWorkout) { maxDuration = Math.max(...workoutsOnDay.map(w => w.duration)); const primaryWorkout = workoutsOnDay.reduce((prev, current) => (prev.duration > current.duration) ? prev : current); activityType = primaryWorkout.type || (primaryWorkout.intensity === 'None' ? 'Rest' : 'Other'); }
              let dotSize = 6; if (maxDuration > 60) { dotSize = 10; } else if (maxDuration >= 30) { dotSize = 8; } else if (maxDuration === 0) { dotSize = 4; }
              const dotColor = activityColors[activityType] || activityColors.Other;
              return (
                <TouchableOpacity key={index} style={[ styles.dayItem, { backgroundColor: '#F5F5F5' }, isDayToday && [styles.todayItem, { backgroundColor: 'rgba(255, 95, 109, 0.1)' }], isSelected && [styles.selectedDayItem, { backgroundColor: 'rgba(61, 90, 128, 0.1)' }] ]} onPress={() => setSelectedDate(day)}>
                  <Text style={[ styles.dayText, { color: actualTheme.colors.text }, isDayToday && [styles.todayText, { color: '#FF5F6D' }], isSelected && [styles.selectedDayText, { color: '#3D5A80', fontWeight: 'bold' }] ]}>{String(dayAbbr ?? 'Err')}</Text>
                  <View style={[ styles.dayNumber, { backgroundColor: '#FFFFFF' }, isSelected && [styles.selectedDayNumber, { backgroundColor: '#3D5A80' }] ]}>
                    <Text style={[ styles.dayNumberText, { color: '#333333' }, isDayToday && [styles.todayText, { color: '#FF5F6D' }], isSelected && [styles.selectedDayText, { color: '#FFFFFF', fontWeight: 'bold' }] ]}>{String(formattedDay ?? 'Err')}</Text>
                  </View>
                  <View style={{height: 16, justifyContent: 'center', alignItems: 'center'}}>
                    {hasWorkout && ( <View style={[ styles.workoutDot, { width: dotSize, height: dotSize, borderRadius: dotSize/2, backgroundColor: dotColor } ]} /> )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
    }
  }

  useEffect(() => {
    RNAnimated.timing(goalAnim, { toValue: goalExpanded ? 1 : 0, duration: 300, useNativeDriver: false }).start();
  }, [goalExpanded]);


  return (
    <ScrollView style={[styles.container, { backgroundColor: actualTheme.colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: actualTheme.colors.card, paddingTop: 0, marginTop: 0 }}>
        <Surface style={[styles.header, { backgroundColor: actualTheme.colors.card, paddingTop: 8, paddingBottom: 8, marginBottom: 0 }]} elevation={2}>
          <View style={[styles.headerContent, { paddingTop: 0, paddingBottom: 0 }]}>
            <View style={styles.headerTitleRow}>
              <Text style={textStyle}>Training Plan</Text>
              <View style={styles.headerActions}>
                <IconButton icon="information-outline" size={24} onPress={() => setLegendModalVisible(true)} iconColor={actualTheme.colors.text} />
                <IconButton icon="calendar-plus" size={24} onPress={showEventModal} iconColor={actualTheme.colors.text} />
              </View>
            </View>
            <View style={styles.weeklyGoalsContainer}>
              <TouchableOpacity onPress={toggleGoalExpansion} style={styles.weeklyGoalsHeader}>
                <View style={styles.weeklyGoalsHeaderLeft}>
                  <Text style={[styles.weeklyGoalsTitle, textStyle]}>Weekly Goals</Text>
                  <MaterialCommunityIcons name={goalExpanded ? "chevron-up" : "chevron-down"} size={20} color={actualTheme.colors.text} style={styles.expandIcon} />
                </View>
                {!goalExpanded && (
                  <View style={styles.collapsedSummary}>
                    {weeklyGoals[0]?.goals.slice(0, 1).map(goal => (
                       <View key={goal.id} style={styles.miniGoal}>
                         <MaterialCommunityIcons name={goal.icon} size={12} color="#FF5F6D" />
                         <Text style={[styles.miniGoalText, {color: "#FF5F6D"}]}>
                           {goal.isDistance ? formatDistance(goal.current) : goal.isElevation ? formatElevation(goal.current) : goal.current} / {goal.isDistance ? formatDistance(goal.goal) : goal.isElevation ? formatElevation(goal.goal) : goal.goal} {goal.unit}
                         </Text>
                       </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
              {goalExpanded && (
                <Animated.View style={{ opacity: goalAnim, transform: [{ translateY: goalAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }] }}>
                  <ScrollView
                    ref={goalScrollViewRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleGoalScroll}
                    scrollEventThrottle={16}
                    contentContainerStyle={styles.goalCarouselContent}
                  >
                    {weeklyGoals.map(group => (
                      <View key={group.id} style={[styles.goalCard, { backgroundColor: actualTheme.colors.card + '99'}]}>
                        <Text style={[styles.goalGroupTitle, textStyle]}>{group.title}</Text>
                        {group.goals?.map(goal => (
                          <View key={goal.id} style={styles.goalItem}>
                            <View style={styles.goalCardHeader}>
                              <MaterialCommunityIcons name={goal.icon} size={16} color={actualTheme.colors.text} />
                              <Text style={[styles.goalCardTitle, textStyle]}>{goal.title}</Text>
                              <Text style={[styles.goalNumbers, textStyle]}>
                                {goal.isDistance ? formatDistance(goal.current) : goal.isElevation ? formatElevation(goal.current) : goal.current} / {goal.isDistance ? formatDistance(goal.goal) : goal.isElevation ? formatElevation(goal.goal) : goal.goal} {goal.unit}
                              </Text>
                            </View>
                            <ProgressBar progress={(goal.current / goal.goal) || 0} color={actualTheme.colors.accent} style={styles.progressBar} />
                          </View>
                        ))}
                        {group.activityDistribution && (
                           <View style={styles.activityDistributionContainer}>
                             <Text style={[styles.activityDistributionTitle, textStyle]}>Activity Mix</Text>
                             <View style={styles.stackedBar}>
                               {group.activityDistribution.map((activity, idx) => (
                                 <View key={idx} style={[styles.activitySegment, { width: `${activity.percentage}%`, backgroundColor: activity.color }]} />
                               ))}
                             </View>
                             <View style={styles.activityLegendContainer}>
                               {group.activityDistribution.map((activity, idx) => (
                                 <View key={idx} style={styles.activityLegendItem}>
                                   <View style={[styles.activityLegendColor, { backgroundColor: activity.color }]} />
                                   <Text style={[styles.activityLegendText, subtleTextStyle]}>{activity.type} ({activity.percentage}%)</Text>
                                 </View>
                               ))}
                             </View>
                           </View>
                        )}
                      </View>
                    ))}
                  </ScrollView>
                  <View style={styles.goalIndicators}>
                    {weeklyGoals.map((_, index) => (
                      <TouchableOpacity key={index} onPress={() => scrollToGoal(index)}>
                        <View style={[styles.goalIndicator, currentGoalIndex === index && styles.goalIndicatorActive]} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </Animated.View>
              )}
            </View>
          </View>
        </Surface>
      </SafeAreaView>

      <View style={styles.weekContainer}>
        <View style={styles.weekNavigation}>
          <View style={styles.weekSelectorContainer}>
            <IconButton icon="chevron-left" size={24} onPress={goToPreviousWeek} iconColor={isPreviousWeek() ? actualTheme.colors.text + '50' : actualTheme.colors.text} disabled={isPreviousWeek()} />
            <Text style={[textStyle, styles.weekLabel]}>{`${String(format(weekStart, 'MMM d') || 'Invalid Date')} - ${String(format(weekEnd, 'MMM d') || 'Invalid Date')}`}</Text>
            <IconButton icon="chevron-right" size={24} onPress={goToNextWeek} iconColor={isAfter(addWeeks(currentWeekStart, 1), addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 1)) ? actualTheme.colors.text + '50' : actualTheme.colors.text} disabled={isAfter(addWeeks(currentWeekStart, 1), addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 1))} />
          </View>
          
          <View style={styles.weekNavigationButtons}>
            <TouchableOpacity style={styles.todayButton} onPress={goToCurrentWeek}> 
              <Text style={styles.todayButtonText}>Today</Text> 
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.calendarButton, 
                isCalendarExpanded && styles.calendarButtonActive
              ].filter(Boolean)} 
              onPress={toggleCalendar}
            > 
              <MaterialCommunityIcons name={isCalendarExpanded ? "view-week" : "calendar-month"} size={16} color="#fff" /> 
            </TouchableOpacity>
          </View>
          
        </View>
        <View style={styles.calendarContainer}> 
           {renderDateView()} 
        </View>
      </View>

      <View style={styles.section}> 
        <Text style={[styles.dateHeading, textStyle]}>{String(format(selectedDate, 'EEEE, MMMM d, yyyy') || 'Invalid Date')}</Text>
        
        {workouts.filter(workout => format(new Date(workout.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')).map((workout) => { const isPast = isPastDate(new Date(workout.date)); return (
          <Card key={workout.id} style={[styles.workoutCard, { backgroundColor: actualTheme.colors.card }]}>
            
            <Card.Content>
              <View style={styles.workoutHeader}>
                <View>
                  <Text style={textStyle}>{String(workout.name ?? 'Untitled Workout')}</Text>
                  <Text style={textStyle}>{String(workout.description ?? 'No description.')}</Text>
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
                    <MaterialCommunityIcons name="map-marker-distance" size={20} color={activityColors[workout.type] || activityColors.Other} /> 
                    <Text style={textStyle}>{String(workout.distance ?? 'N/A')}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="clock-outline" size={14} color={actualTheme.colors.text} />
                    <Text style={textStyle}>
                      {workout.duration}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="fire" size={14} color={actualTheme.colors.text} />
                    <Text style={textStyle}>
                      {workout.intensity}
                    </Text>
                  </View>
                </View>
              )}
            </Card.Content>
          </Card> ); })}
        
        {workouts.filter(workout => format(new Date(workout.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')).length === 0 && ( <EmptyState message="No workouts scheduled for this day" icon="calendar-remove-outline" /> )}
      </View>

      {/* Training Block Summary */}
      {true && (
        <View style={styles.section}>
          <Card style={styles.trainingBlockCard}>
            <Card.Content>
              <View style={styles.trainingBlockHeader}>
                <Text style={[styles.blockTitle, textStyle]}>Current Training Block</Text>
                {/* Optional: IconButton for more details? */}
              </View>
              <Text style={[styles.blockDescription, subtleTextStyle, {marginBottom: 16}]}>
                Overview of your current training phase and progress towards your goals.
              </Text>
              
              <Text style={[subtleTextStyle, {fontSize: 13, fontWeight: '500', marginBottom: 4}]}>
                Weekly Progress: Day {actualCurrentDayOfWeek} of 7
              </Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
              </View>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Event Modal */}
      <Portal>
        <Text>...</Text>
      </Portal>

      {/* Legend Modal */}
      <Portal>
        <Modal visible={legendModalVisible} onDismiss={() => setLegendModalVisible(false)} contentContainerStyle={[styles.legendModalContainer, { backgroundColor: actualTheme.colors.card }]}>
          <View style={styles.legendModalHeader}>
            <Text style={[styles.legendModalTitle, textStyle]}>Activity Legend</Text>
            <IconButton icon="close" size={24} onPress={() => setLegendModalVisible(false)} iconColor={actualTheme.colors.text} />
          </View>
          <Divider style={{ backgroundColor: actualTheme.colors.border, marginVertical: 8 }} />
          <ScrollView style={styles.legendContent}>
            {Object.entries(activityColors).map(([type, color]) => (
              <View key={type} style={styles.legendItem}>
                <View style={[styles.legendColorDot, { backgroundColor: color }]} />
                <View style={styles.legendTextContainer}>
                  <Text style={[styles.legendText, textStyle]}>{type}</Text>
                  <Text style={[styles.legendSubtext, subtleTextStyle]}>
                    Activities primarily of type '{type}' will use this color for marking.
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <Button 
            mode="contained" 
            onPress={() => setLegendModalVisible(false)} 
            style={styles.legendModalButton}
            buttonColor={actualTheme.colors.primary}
          >
            Close
          </Button>
        </Modal>
      </Portal>
    </ScrollView>
  );
} 
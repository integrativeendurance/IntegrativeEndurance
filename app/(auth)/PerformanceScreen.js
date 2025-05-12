import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Animated as RNAnimated, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { Avatar, Button, Card, Divider, IconButton, Modal, Portal, ProgressBar, Surface, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Polygon, Text as SvgText } from 'react-native-svg';
import ThemedErrorBoundary from '../../src/components/ErrorBoundary';
import { useTheme } from '../../src/hooks/useTheme';
import { ErrorState, LoadingState } from '../../src/components/StatusStates';

const screenWidth = Dimensions.get('window').width;
const chartCardPadding = 32; // 16 left + 16 right padding for card
const chartWidth = screenWidth - chartCardPadding;

// Helper for trend arrow and color
const getTrend = (current, previous, isLowerBetter = false) => {
  if (current === previous) return { icon: 'arrow-right', color: '#aaa', direction: 'neutral' };
  const improved = isLowerBetter ? current < previous : current > previous;
  return {
    icon: improved ? 'arrow-down-bold' : 'arrow-up-bold',
    color: improved ? '#4BB543' : '#FF5F6D',
    direction: improved ? 'improved' : 'declined',
  };
};

// Mock summary metrics
const summaryMetrics = [
  { key: 'endurance', label: 'Endurance', icon: 'run-fast', value: 0.85, score: 8.5, trend: 1 },
  { key: 'speed', label: 'Speed', icon: 'speedometer', value: 0.72, score: 7.2, trend: -1 },
  { key: 'recovery', label: 'Recovery', icon: 'heart-pulse', value: 0.9, score: 9.0, trend: 1 },
  { key: 'climbing', label: 'Climbing', icon: 'terrain', value: 0.68, score: 6.8, trend: 1 },
  { key: 'consistency', label: 'Consistency', icon: 'calendar-check', value: 0.8, score: 8.0, trend: 0 },
];

// Progress Ring component
const ProgressRing = ({ radius, stroke, progress, color, label }) => {
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;
  return (
    <Svg height={radius * 2} width={radius * 2}>
      <Circle
        stroke="#eee"
        fill="none"
        cx={radius}
        cy={radius}
        r={normalizedRadius}
        strokeWidth={stroke}
      />
      <Circle
        stroke={color}
        fill="none"
        cx={radius}
        cy={radius}
        r={normalizedRadius}
        strokeWidth={stroke}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
      />
      <SvgText
        x={radius}
        y={radius + 6}
        fontSize="16"
        fontWeight="bold"
        fill={color}
        textAnchor="middle"
      >
        {Math.round(progress * 100)}%
      </SvgText>
    </Svg>
  );
};

// Radar Chart component
const RadarChart = ({ metrics, size = 320, levels = 4 }) => {
  const center = size / 2;
  const radius = size / 2 - 90;
  const angleStep = (2 * Math.PI) / metrics.length;
  // Points for the filled area
  const points = metrics.map((m, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = radius * m.value;
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  });
  // Points for the outer polygon
  const outerPoints = metrics.map((_, i) => {
    const angle = i * angleStep - Math.PI / 2;
    return [center + radius * Math.cos(angle), center + radius * Math.sin(angle)];
  });
  return (
    <Svg width={size} height={size}>
      {/* Draw grid levels */}
      {[...Array(levels)].map((_, l) => {
        const r = radius * ((l + 1) / levels);
        const levelPoints = metrics.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
        });
        return (
          <Polygon
            key={l}
            points={levelPoints.map(p => p.join(",")).join(" ")}
            fill="none"
            stroke="#eee"
            strokeWidth={1}
          />
        );
      })}
      {/* Outer polygon */}
      <Polygon
        points={outerPoints.map(p => p.join(",")).join(" ")}
        fill="none"
        stroke="#bbb"
        strokeWidth={2}
      />
      {/* Filled area */}
      <Polygon
        points={points.map(p => p.join(",")).join(" ")}
        fill="#EE6C4D33"
        stroke="#EE6C4D"
        strokeWidth={2}
      />
      {/* Metric labels */}
      {metrics.map((m, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const x = center + (radius + 90) * Math.cos(angle);
        const y = center + (radius + 90) * Math.sin(angle) + 6;
        return (
          <SvgText
            key={m.key}
            x={x}
            y={y}
            fontSize="10"
            fontWeight="bold"
            fill="#293241"
            textAnchor="middle"
          >
            {m.label}
          </SvgText>
        );
      })}
    </Svg>
  );
};

export default function PerformanceScreen() {
  const { actualTheme } = useTheme();
  const textStyle = { color: actualTheme.colors.text };
  const [carouselIndex, setCarouselIndex] = useState(0); // 0: trends, 1: pacing, 2: climbing
  const [selectedPaceZone, setSelectedPaceZone] = useState('easy');
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [legendVisible, setLegendVisible] = useState(false);
  const carouselRef = useRef(null);
  const [loading, setLoading] = useState(false); // Simulate loading state
  const [error, setError] = useState(null); // Simulate error state
  const [summaryAnim] = useState(new RNAnimated.Value(0));
  
  // Mock data for VO2 Max
  const vo2maxData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        data: [42.3, 43.1, 43.5, 44.2, 45.1, 46.3],
        color: (opacity = 1) => `rgba(61, 90, 128, ${opacity})`, // Primary color
        strokeWidth: 2
      }
    ],
    legend: ["VO2 Max (ml/kg/min)"]
  };
  
  // Mock data for Fatigue
  const fatigueData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        data: [50, 65, 45, 80, 40, 30, 60],
        color: (opacity = 1) => `rgba(238, 108, 77, ${opacity})`, // Accent color
        strokeWidth: 2
      }
    ],
    legend: ["Fatigue Score"]
  };
  
  // Mock data for Heart Rate Zones
  const heartRateZoneData = {
    labels: ["Z1", "Z2", "Z3", "Z4", "Z5"],
    datasets: [
      {
        // Last month's average heart rate per zone
        data: [120, 140, 160, 175, 185],
        color: (opacity = 1) => `rgba(152, 193, 217, ${opacity})`, // Disabled color
        strokeWidth: 2
      },
      {
        // This month's average heart rate per zone
        data: [118, 138, 155, 172, 183],
        color: (opacity = 1) => `rgba(238, 108, 77, ${opacity})`, // Accent color
        strokeWidth: 2
      }
    ],
    legend: ["Last Month", "This Month"]
  };

  // Mock data for Heart Rate Zone Time Distribution
  const zoneTimeData = {
    labels: ["Z1", "Z2", "Z3", "Z4", "Z5"],
    datasets: [
      {
        data: [30, 45, 15, 8, 2], // Percentage of time spent in each zone
        color: (opacity = 1) => `rgba(61, 90, 128, ${opacity})`, // Primary color
        strokeWidth: 2
      }
    ],
    legend: ["% Time in Zone (Last 4 Weeks)"]
  };

  // Mock data for Heart Rate Trend
  const heartRateTrendData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"],
    datasets: [
      {
        // Average heart rate at same pace (e.g., 5:00/km) over time
        data: [165, 162, 160, 158, 155, 152],
        color: (opacity = 1) => `rgba(238, 108, 77, ${opacity})`, // Accent color
        strokeWidth: 2
      }
    ],
    legend: ["Avg HR at 5:00/km Pace"]
  };

  // Mock data for Pacing Trends
  const pacingTrendsData = {
    labels: ["5K", "10K", "HM", "M"],
    datasets: [
      {
        data: [4.5, 4.8, 5.2, 5.8], // min/km
        color: (opacity = 1) => `rgba(152, 193, 217, ${opacity})`, // Disabled color
        strokeWidth: 2
      }
    ],
    legend: ["Recent Race Pace (min/km)"]
  };

  // Mock data for Pace Improvement by Zone
  const paceImprovementByZone = {
    easy: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        {
          data: [5.8, 5.7, 5.6, 5.5, 5.4, 5.3], // min/km
          color: (opacity = 1) => `rgba(238, 108, 77, ${opacity})`, // Accent color
          strokeWidth: 2
        }
      ],
      legend: ["Easy Pace (min/km)"]
    },
    tempo: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        {
          data: [5.2, 5.1, 5.0, 4.9, 4.8, 4.7], // min/km
          color: (opacity = 1) => `rgba(238, 108, 77, ${opacity})`, // Accent color
          strokeWidth: 2
        }
      ],
      legend: ["Tempo Pace (min/km)"]
    },
    threshold: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        {
          data: [4.8, 4.7, 4.6, 4.5, 4.4, 4.3], // min/km
          color: (opacity = 1) => `rgba(238, 108, 77, ${opacity})`, // Accent color
          strokeWidth: 2
        }
      ],
      legend: ["Threshold Pace (min/km)"]
    },
    vo2max: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        {
          data: [4.2, 4.1, 4.0, 3.9, 3.8, 3.7], // min/km
          color: (opacity = 1) => `rgba(238, 108, 77, ${opacity})`, // Accent color
          strokeWidth: 2
        }
      ],
      legend: ["VO2 Max Pace (min/km)"]
    },
    race: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        {
          data: [4.0, 3.9, 3.8, 3.7, 3.6, 3.5], // min/km
          color: (opacity = 1) => `rgba(238, 108, 77, ${opacity})`, // Accent color
          strokeWidth: 2
        }
      ],
      legend: ["Race Pace (min/km)"]
    }
  };

  // Mock data for Training Distribution (Planned vs Actual)
  const trainingDistributionData = {
    labels: ["Easy", "Tempo", "Threshold", "VO2 Max"],
    datasets: [
      {
        data: [60, 20, 10, 10], // Planned %
        color: (opacity = 1) => `rgba(61, 90, 128, ${opacity})`, // Primary color
        label: 'Planned',
      },
      {
        data: [55, 22, 12, 11], // Actual %
        color: (opacity = 1) => `rgba(238, 108, 77, ${opacity})`, // Accent color
        label: 'Actual',
      }
    ],
    legend: ["Planned", "Actual"]
  };

  // Mock AI Feedback Messages by metric
  const aiRecommendations = {
    zones: [
      {
        id: 1,
        title: "Zone Distribution",
        message: "You spent 45% of your time in Zone 2. This is optimal for aerobic base building.",
        timestamp: "2 days ago"
      },
      {
        id: 2,
        title: "Intensity Balance",
        message: "Your time in Zone 4 is slightly above recommended. Consider more recovery runs.",
        timestamp: "4 days ago"
      }
    ],
    trends: [
      {
        id: 3,
        title: "Heart Rate Efficiency",
        message: "Your average HR at 5:00/km pace has dropped by 13 BPM in 6 weeks. Great aerobic progress!",
        timestamp: "1 week ago"
      },
      {
        id: 4,
        title: "HRV Recovery",
        message: "Your HRV has improved by 12% over the last month, indicating better recovery.",
        timestamp: "3 days ago"
      }
    ],
    pacing: [
      {
        id: 5,
        title: "Pace Improvement",
        message: "Your tempo pace improved by 0.5 min/km over 6 months. Consider adding more threshold intervals.",
        timestamp: "3 days ago"
      },
      {
        id: 6,
        title: "Distribution Match",
        message: "Your actual training distribution closely matches your plan. Keep up the consistency!",
        timestamp: "5 days ago"
      }
    ],
    'training-distribution': [
      {
        id: 9,
        title: "Distribution Balance",
        message: "Your easy and tempo zones are well balanced. Keep up the aerobic work, but consider adding more threshold sessions for variety.",
        timestamp: "2 days ago"
      },
      {
        id: 10,
        title: "Zone Emphasis",
        message: "You are spending 60% of your time in the easy zone. This is great for base building, but don't neglect higher intensity work as your race approaches.",
        timestamp: "5 days ago"
      }
    ],
    climbing: [
      {
        id: 7,
        title: "Climbing Efficiency",
        message: "Your climbing score increases with grade, but HR rises sharply above 6%. Consider hill repeats at 6–9% to improve efficiency.",
        timestamp: "2 days ago"
      },
      {
        id: 8,
        title: "Pace on Steep Climbs",
        message: "Pace drops significantly above 9% grade. Focus on maintaining form and cadence on steep sections.",
        timestamp: "5 days ago"
      }
    ]
  };

  // Mock data for Climbing by grade range (Avg HR and Avg Pace only)
  const climbingData = {
    labels: ["0–3%", "3–6%", "6–9%", "9%+"],
    datasets: [
      {
        data: [145, 152, 160, 170], // Avg HR (bpm)
        color: (opacity = 1) => `rgba(238, 108, 77, ${opacity})`,
        label: 'Avg HR (bpm)',
      },
      {
        data: [6.0, 6.5, 7.2, 8.0], // Avg Pace (min/km)
        color: (opacity = 1) => `rgba(152, 193, 217, ${opacity})`,
        label: 'Avg Pace (min/km)',
      }
    ],
    legend: ["Avg HR (bpm)", "Avg Pace (min/km)"]
  };

  const chartConfig = {
    backgroundGradientFrom: actualTheme.colors.card,
    backgroundGradientTo: actualTheme.colors.card,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(238, 108, 77, ${opacity})`,
    labelColor: (opacity = 1) => actualTheme.colors.text,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: actualTheme.colors.accent
    }
  };

  // Determine current fitness level based on VO2 max
  const currentVO2Max = vo2maxData.datasets[0].data[vo2maxData.datasets[0].data.length - 1];
  
  let fitnessLevel = "Beginner";
  let fitnessProgress = 0.4;
  
  if (currentVO2Max > 45) {
    fitnessLevel = "Advanced";
    fitnessProgress = 0.8;
  } else if (currentVO2Max > 42) {
    fitnessLevel = "Intermediate";
    fitnessProgress = 0.6;
  }

  // Combine HR zone data for a grouped bar chart
  const combinedZoneData = {
    labels: ["Z1", "Z2", "Z3", "Z4", "Z5"],
    datasets: [
      {
        data: [120, 140, 160, 175, 185], // Last month's avg HR per zone
        color: (opacity = 1) => `rgba(152, 193, 217, ${opacity})`,
        label: 'Avg HR',
      },
      {
        data: [30, 45, 15, 8, 2], // % time in each zone (last 4 weeks)
        color: (opacity = 1) => `rgba(238, 108, 77, ${opacity})`,
        label: '% Time in Zone',
      }
    ],
    legend: ["Avg HR", "% Time in Zone"]
  };

  // --- Focus logic for highlights ---
  // HR Trends: focus on the week with the highest HR (needs improvement)
  const hrTrendFocusIndex = heartRateTrendData.datasets[0].data.indexOf(Math.max(...heartRateTrendData.datasets[0].data));
  const hrTrendFocusLabel = heartRateTrendData.labels[hrTrendFocusIndex];

  // Pacing: focus on the month with the slowest pace (highest value)
  const paceFocusIndex = paceImprovementByZone[selectedPaceZone].datasets[0].data.indexOf(Math.max(...paceImprovementByZone[selectedPaceZone].datasets[0].data));
  const paceFocusLabel = paceImprovementByZone[selectedPaceZone].labels[paceFocusIndex];

  // Climbing: focus on the grade with the highest HR or slowest pace
  const climbingHRFocusIndex = climbingData.datasets[0].data.indexOf(Math.max(...climbingData.datasets[0].data));
  const climbingPaceFocusIndex = climbingData.datasets[1].data.indexOf(Math.max(...climbingData.datasets[1].data));
  const climbingFocusLabel = climbingData.labels[
    climbingData.datasets[0].data[climbingHRFocusIndex] >= climbingData.datasets[1].data[climbingPaceFocusIndex]
      ? climbingHRFocusIndex
      : climbingPaceFocusIndex
  ];

  // Helper to get tight style for first/last carousel views
  const tightChartView = { width: chartWidth, alignSelf: 'center', paddingTop: 0, paddingBottom: 0, marginTop: 0, marginBottom: 0, minHeight: 0 };

  // Carousel views
  const carouselViews = [
    {
      key: 'trends',
      render: () => (
        <View style={tightChartView}>
          <Text style={[textStyle, styles.chartTitle, { marginBottom: 2, marginTop: 0 }]}>Heart Rate Efficiency Trend</Text>
          <Text style={[textStyle, styles.chartSubtitle, { marginBottom: 2, marginTop: 0 }]}>Average HR at constant pace (lower is better)</Text>
          <LineChart
            data={heartRateTrendData}
            width={chartWidth}
            height={220}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(238, 108, 77, ${opacity})`
            }}
            bezier
            style={[styles.chart, { marginVertical: 4 }]}
          />
          <View style={{ marginTop: 4, marginBottom: 0 }}>
            <Text style={[textStyle, { textAlign: 'center', fontWeight: 'bold', color: actualTheme.colors.accent }]}>Focus: {hrTrendFocusLabel} (highest HR)</Text>
          </View>
          <View style={styles.efficiencyContainer}>
            <View style={styles.efficiencyItem}>
              <Text style={[textStyle, styles.efficiencyLabel]}>Improvement</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[textStyle, styles.efficiencyValue]}>-13 BPM</Text>
                {/* Trend arrow: lower is better */}
                <MaterialCommunityIcons
                  name={getTrend(152, 165, true).icon}
                  size={18}
                  color={getTrend(152, 165, true).color}
                  style={{ marginLeft: 4 }}
                />
              </View>
              <Text style={styles.efficiencySubtext}>at threshold pace</Text>
            </View>
            <View style={styles.efficiencyItem}>
              <Text style={[textStyle, styles.efficiencyLabel]}>Recovery</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[textStyle, styles.efficiencyValue]}>+12%</Text>
                {/* Trend arrow: higher is better */}
                <MaterialCommunityIcons
                  name={getTrend(12, 0, false).icon}
                  size={18}
                  color={getTrend(12, 0, false).color}
                  style={{ marginLeft: 4 }}
                />
              </View>
              <Text style={styles.efficiencySubtext}>HRV improvement</Text>
            </View>
            <View style={styles.efficiencyItem}>
              <Text style={[textStyle, styles.efficiencyLabel]}>Zone 2</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[textStyle, styles.efficiencyValue]}>45%</Text>
                {/* Trend arrow: higher is better */}
                <MaterialCommunityIcons
                  name={getTrend(45, 40, false).icon}
                  size={18}
                  color={getTrend(45, 40, false).color}
                  style={{ marginLeft: 4 }}
                />
              </View>
              <Text style={styles.efficiencySubtext}>of training time</Text>
            </View>
          </View>
        </View>
      )
    },
    {
      key: 'training-distribution',
      render: () => (
        <View style={{ width: chartWidth, alignSelf: 'center' }}>
          <Text style={[textStyle, styles.chartTitle]}>Training Distribution</Text>
          <BarChart
            data={trainingDistributionData}
            width={chartWidth}
            height={170}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1, index) =>
                index === 0
                  ? `rgba(61, 90, 128, ${opacity})`
                  : `rgba(238, 108, 77, ${opacity})`,
            }}
            style={styles.chart}
            verticalLabelRotation={0}
            showValuesOnTopOfBars={true}
          />
          <View style={{ marginTop: 8 }}>
            <Text style={[textStyle, { textAlign: 'center', fontWeight: 'bold', color: actualTheme.colors.accent }]}>Focus: {paceFocusLabel} (slowest pace)</Text>
          </View>
          <View style={styles.segmentedControlContainer}>
            {[
              { key: 'easy', label: 'Easy' },
              { key: 'tempo', label: 'Tempo' },
              { key: 'threshold', label: 'Threshold' },
              { key: 'vo2max', label: 'VO2 Max' },
            ].map(zone => (
              <TouchableOpacity
                key={zone.key}
                style={[
                  styles.segmentedControlButton,
                  selectedPaceZone === zone.key
                    ? { backgroundColor: actualTheme.colors.accent }
                    : actualTheme.dark
                      ? { backgroundColor: '#222' } 
                      : { backgroundColor: 'rgba(61,90,128,0.08)' }
                ]}
                onPress={() => setSelectedPaceZone(zone.key)}
              >
                <Text style={[
                  styles.segmentedControlText,
                  { color: selectedPaceZone === zone.key
                      ? 'white'
                      : actualTheme.dark
                        ? '#F7F9FB'
                        : actualTheme.colors.text },
                  selectedPaceZone === zone.key && { fontWeight: 'bold' }
                ]}>
                  {zone.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.efficiencyContainer}>
            <View style={styles.efficiencyItem}>
              <Text style={[textStyle, styles.efficiencyLabel]}>Pace (6mo)</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[textStyle, styles.efficiencyValue]}>5:{ { easy: '55', tempo: '20', threshold: '10', vo2max: '50' }[selectedPaceZone] }</Text>
                {/* Trend arrow: lower is better */}
                <MaterialCommunityIcons
                  name={getTrend(
                    parseFloat({ easy: 5.55, tempo: 5.20, threshold: 5.10, vo2max: 5.50 }[selectedPaceZone]),
                    parseFloat({ easy: 5.65, tempo: 5.30, threshold: 5.20, vo2max: 5.60 }[selectedPaceZone]),
                    true
                  ).icon}
                  size={18}
                  color={getTrend(
                    parseFloat({ easy: 5.55, tempo: 5.20, threshold: 5.10, vo2max: 5.50 }[selectedPaceZone]),
                    parseFloat({ easy: 5.65, tempo: 5.30, threshold: 5.20, vo2max: 5.60 }[selectedPaceZone]),
                    true
                  ).color}
                  style={{ marginLeft: 4 }}
                />
              </View>
              <Text style={styles.efficiencySubtext}>min/km</Text>
            </View>
            <View style={styles.efficiencyItem}>
              <Text style={[textStyle, styles.efficiencyLabel]}>Pace (4w)</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[textStyle, styles.efficiencyValue]}>5:{ { easy: '45', tempo: '10', threshold: '00', vo2max: '40' }[selectedPaceZone] }</Text>
                {/* Trend arrow: lower is better */}
                <MaterialCommunityIcons
                  name={getTrend(
                    parseFloat({ easy: 5.45, tempo: 5.10, threshold: 5.00, vo2max: 5.40 }[selectedPaceZone]),
                    parseFloat({ easy: 5.55, tempo: 5.20, threshold: 5.10, vo2max: 5.50 }[selectedPaceZone]),
                    true
                  ).icon}
                  size={18}
                  color={getTrend(
                    parseFloat({ easy: 5.45, tempo: 5.10, threshold: 5.00, vo2max: 5.40 }[selectedPaceZone]),
                    parseFloat({ easy: 5.55, tempo: 5.20, threshold: 5.10, vo2max: 5.50 }[selectedPaceZone]),
                    true
                  ).color}
                  style={{ marginLeft: 4 }}
                />
              </View>
              <Text style={styles.efficiencySubtext}>min/km</Text>
            </View>
            <View style={styles.efficiencyItem}>
              <Text style={[textStyle, styles.efficiencyLabel]}>HR (6mo)</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[textStyle, styles.efficiencyValue]}>{ { easy: 138, tempo: 152, threshold: 168, vo2max: 178 }[selectedPaceZone] }</Text>
                {/* Trend arrow: lower is better */}
                <MaterialCommunityIcons
                  name={getTrend(
                    { easy: 138, tempo: 152, threshold: 168, vo2max: 178 }[selectedPaceZone],
                    { easy: 140, tempo: 154, threshold: 170, vo2max: 180 }[selectedPaceZone],
                    true
                  ).icon}
                  size={18}
                  color={getTrend(
                    { easy: 138, tempo: 152, threshold: 168, vo2max: 178 }[selectedPaceZone],
                    { easy: 140, tempo: 154, threshold: 170, vo2max: 180 }[selectedPaceZone],
                    true
                  ).color}
                  style={{ marginLeft: 4 }}
                />
              </View>
              <Text style={styles.efficiencySubtext}>bpm</Text>
            </View>
            <View style={styles.efficiencyItem}>
              <Text style={[textStyle, styles.efficiencyLabel]}>HR (4w)</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[textStyle, styles.efficiencyValue]}>{ { easy: 132, tempo: 148, threshold: 162, vo2max: 172 }[selectedPaceZone] }</Text>
                {/* Trend arrow: lower is better */}
                <MaterialCommunityIcons
                  name={getTrend(
                    { easy: 132, tempo: 148, threshold: 162, vo2max: 172 }[selectedPaceZone],
                    { easy: 138, tempo: 152, threshold: 168, vo2max: 178 }[selectedPaceZone],
                    true
                  ).icon}
                  size={18}
                  color={getTrend(
                    { easy: 132, tempo: 148, threshold: 162, vo2max: 172 }[selectedPaceZone],
                    { easy: 138, tempo: 152, threshold: 168, vo2max: 178 }[selectedPaceZone],
                    true
                  ).color}
                  style={{ marginLeft: 4 }}
                />
              </View>
              <Text style={styles.efficiencySubtext}>bpm</Text>
            </View>
          </View>
        </View>
      )
    },
    {
      key: 'pace-improvement',
      render: () => (
        <View style={{ width: chartWidth, alignSelf: 'center' }}>
          <Text style={[textStyle, styles.chartTitle]}>Pace Improvement Trend</Text>
          <LineChart
            data={paceImprovementByZone[selectedPaceZone]}
            width={chartWidth}
            height={220}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(238, 108, 77, ${opacity})`
            }}
            bezier
            style={styles.chart}
          />
          <View style={styles.efficiencyContainer}>
            <View style={styles.efficiencyItem}>
              <Text style={[textStyle, styles.efficiencyLabel]}>Current</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[textStyle, styles.efficiencyValue]}>
                  {paceImprovementByZone[selectedPaceZone].datasets[0].data[5]}
                </Text>
                {/* Trend arrow: lower is better */}
                <MaterialCommunityIcons
                  name={getTrend(
                    paceImprovementByZone[selectedPaceZone].datasets[0].data[5],
                    paceImprovementByZone[selectedPaceZone].datasets[0].data[0],
                    true
                  ).icon}
                  size={18}
                  color={getTrend(
                    paceImprovementByZone[selectedPaceZone].datasets[0].data[5],
                    paceImprovementByZone[selectedPaceZone].datasets[0].data[0],
                    true
                  ).color}
                  style={{ marginLeft: 4 }}
                />
              </View>
              <Text style={styles.efficiencySubtext}>min/km</Text>
            </View>
            <View style={styles.efficiencyItem}>
              <Text style={[textStyle, styles.efficiencyLabel]}>Improvement</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[textStyle, styles.efficiencyValue]}>
                  {(paceImprovementByZone[selectedPaceZone].datasets[0].data[0] - 
                    paceImprovementByZone[selectedPaceZone].datasets[0].data[5]).toFixed(1)}
                </Text>
                {/* Trend arrow: lower is better */}
                <MaterialCommunityIcons
                  name={getTrend(
                    paceImprovementByZone[selectedPaceZone].datasets[0].data[5],
                    paceImprovementByZone[selectedPaceZone].datasets[0].data[0],
                    true
                  ).icon}
                  size={18}
                  color={getTrend(
                    paceImprovementByZone[selectedPaceZone].datasets[0].data[5],
                    paceImprovementByZone[selectedPaceZone].datasets[0].data[0],
                    true
                  ).color}
                  style={{ marginLeft: 4 }}
                />
              </View>
              <Text style={styles.efficiencySubtext}>min/km (6mo)</Text>
            </View>
            <View style={styles.efficiencyItem}>
              <Text style={[textStyle, styles.efficiencyLabel]}>Distribution</Text>
              <Text style={[textStyle, styles.efficiencyValue]}>
                {trainingDistributionData.datasets[0].data[
                  ['easy', 'tempo', 'threshold', 'vo2max'].indexOf(selectedPaceZone)
                ]}%
              </Text>
              <Text style={styles.efficiencySubtext}>of training</Text>
            </View>
          </View>
        </View>
      )
    },
    {
      key: 'climbing',
      render: () => (
        <View style={tightChartView}>
          <Text style={[textStyle, styles.chartTitle, { marginBottom: 2, marginTop: 0 }]}>Avg HR & Pace by Grade</Text>
          <BarChart
            data={climbingData}
            width={chartWidth}
            height={220}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1, index) =>
                index === 0
                  ? `rgba(238, 108, 77, ${opacity})`
                  : `rgba(152, 193, 217, ${opacity})`,
            }}
            style={[styles.chart, { marginVertical: 4 }]}
            verticalLabelRotation={0}
            showValuesOnTopOfBars={true}
          />
          <View style={{ marginTop: 4, marginBottom: 0 }}>
            <Text style={[textStyle, { textAlign: 'center', fontWeight: 'bold', color: actualTheme.colors.accent }]}>Focus: {climbingFocusLabel} (highest HR/slowest pace)</Text>
          </View>
          <View style={{ marginTop: 6 }}>
            <Text style={[textStyle, { textAlign: 'center', fontSize: 13 }]}>Average HR and Pace are shown for each grade range. Higher grades generally result in higher HR and slower pace.</Text>
          </View>
          <View style={styles.efficiencyContainer}>
            <View style={styles.efficiencyItem}>
              <Text style={[textStyle, styles.efficiencyLabel]}>Avg HR</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[textStyle, styles.efficiencyValue]}>{climbingData.datasets[0].data[3]}</Text>
                {/* Trend arrow: lower is better */}
                <MaterialCommunityIcons
                  name={getTrend(climbingData.datasets[0].data[3], climbingData.datasets[0].data[0], true).icon}
                  size={18}
                  color={getTrend(climbingData.datasets[0].data[3], climbingData.datasets[0].data[0], true).color}
                  style={{ marginLeft: 4 }}
                />
              </View>
              <Text style={styles.efficiencySubtext}>bpm (steepest grade)</Text>
            </View>
            <View style={styles.efficiencyItem}>
              <Text style={[textStyle, styles.efficiencyLabel]}>Avg Pace</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[textStyle, styles.efficiencyValue]}>{climbingData.datasets[1].data[3]}</Text>
                {/* Trend arrow: lower is better */}
                <MaterialCommunityIcons
                  name={getTrend(climbingData.datasets[1].data[3], climbingData.datasets[1].data[0], true).icon}
                  size={18}
                  color={getTrend(climbingData.datasets[1].data[3], climbingData.datasets[1].data[0], true).color}
                  style={{ marginLeft: 4 }}
                />
              </View>
              <Text style={styles.efficiencySubtext}>min/km (steepest grade)</Text>
            </View>
          </View>
        </View>
      )
    }
  ];

  // Handle carousel scroll
  const handleCarouselScroll = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / chartWidth);
    setCarouselIndex(index);
  };

  // Map carousel index to metric key for AI insights
  const metricKeys = ['trends', 'training-distribution', 'pace-improvement', 'climbing'];
  const selectedMetric = metricKeys[carouselIndex];

  // Carousel indicator dots
  const renderCarouselDots = () => (
    <View style={styles.carouselDotsContainer}>
      {carouselViews.map((_, idx) => (
        <View
          key={idx}
          style={[styles.carouselDot, carouselIndex === idx && styles.carouselDotActive]}
        />
      ))}
    </View>
  );

  // Simulate loading and error (for demo)
  useEffect(() => {
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      // setError('Failed to load performance data.'); // Uncomment to test error state
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Animate expansion/collapse of performance summary
  useEffect(() => {
    RNAnimated.timing(summaryAnim, {
      toValue: isSummaryExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isSummaryExpanded]);

  if (loading) {
    return <LoadingState message="Loading performance metrics..." />;
  }
  if (error) {
    return <ErrorState message={error} onRetry={() => { setError(null); setLoading(true); }} />;
  }

  return (
    <ThemedErrorBoundary>
      <ScrollView style={[styles.container, { backgroundColor: actualTheme.colors.background, paddingTop: 0, marginTop: 0 }]}>
        <SafeAreaView edges={['top']} style={{ backgroundColor: actualTheme.colors.card, paddingTop: 0, marginTop: 0 }}>
          <Surface style={[styles.header, { backgroundColor: actualTheme.colors.card, paddingTop: 8, paddingBottom: 8, marginBottom: 0 }]} elevation={2}>
            <View style={[styles.headerContent, { paddingTop: 0, paddingBottom: 0 }]}>
              <View style={styles.headerTitleRow}>
                <Text style={textStyle}>Performance</Text>
                <View style={styles.headerActions}>
                  <IconButton icon="information-outline" size={24} onPress={() => setLegendVisible(true)} iconColor={actualTheme.colors.text} />
                </View>
              </View>
              <TouchableOpacity
                style={styles.weeklyGoalsHeader}
                onPress={() => setIsSummaryExpanded(!isSummaryExpanded)}
                activeOpacity={0.7}
              >
                <View style={styles.weeklyGoalsHeaderLeft}>
                  <Text style={[textStyle, styles.weeklyGoalsTitle]}>
                    Performance Summary
                  </Text>
                  <MaterialCommunityIcons
                    name={isSummaryExpanded ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color={actualTheme.colors.text}
                    style={styles.expandIcon}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </Surface>
        </SafeAreaView>
        <View style={styles.content}>
          {/* Metric Chart Carousel */}
          <View style={{ marginBottom: 0, paddingBottom: 0 }}>
            <ScrollView
              ref={carouselRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleCarouselScroll}
              contentContainerStyle={{
                width: chartWidth * carouselViews.length,
                alignItems: 'center',
                margin: 0,
                padding: 0,
              }}
              style={{ marginBottom: 0, paddingBottom: 0 }}
            >
              {carouselViews.map((view, idx) => (
                <View
                  key={view.key}
                  style={{
                    width: chartWidth,
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: 0,
                    padding: 0,
                    minHeight: 0,
                  }}
                >
                  {view.render()}
                </View>
              ))}
            </ScrollView>
            <View style={{ marginTop: 0, marginBottom: 8 }}>{renderCarouselDots()}</View>
          </View>

          {/* AI Race Goal Feedback */}
          <Card style={[styles.card, { backgroundColor: actualTheme.colors.card, marginTop: 0, marginBottom: 12 }]}>
            <Card.Title 
              title="Training Insights" 
              titleStyle={textStyle}
              left={(props) => <Avatar.Icon {...props} icon="brain" backgroundColor="#FF5F6D" />}
            />
            <Card.Content>
              {(aiRecommendations[selectedMetric] || aiRecommendations['pacing'] || []).map((recommendation, index) => (
                <View key={recommendation.id}>
                  <View style={styles.recommendationContainer}>
                    <View style={styles.recommendationHeader}>
                      <Text style={[textStyle, styles.recommendationTitle]}>{recommendation.title}</Text>
                      <Text style={styles.timestamp}>{recommendation.timestamp}</Text>
                    </View>
                    <Text style={textStyle}>{recommendation.message}</Text>
                  </View>
                  {index < (aiRecommendations[selectedMetric] || aiRecommendations['pacing'] || []).length - 1 && <Divider style={styles.divider} />}
                </View>
              ))}
            </Card.Content>
          </Card>

          {/* Overall Fitness Summary Card */}
          <Card style={[styles.card, { backgroundColor: actualTheme.colors.card, marginTop: 0, marginBottom: 8 }]}> 
            <Card.Title
              title="Overall Fitness Summary"
              titleStyle={textStyle}
              left={(props) => <Avatar.Icon {...props} icon="star" backgroundColor="#FF5F6D" />}
            />
            <Card.Content>
              {/* Scorecard Grid */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, gap: 8 }}>
                {summaryMetrics.map(metric => (
                  <View key={metric.key} style={{ alignItems: 'center', flex: 1, minWidth: 60, maxWidth: 80 }}>
                    <MaterialCommunityIcons name={metric.icon} size={24} color="#FF5F6D" />
                    <Text style={{ fontWeight: 'bold', color: textStyle.color, fontSize: 13, textAlign: 'center', flexShrink: 1 }} numberOfLines={1} ellipsizeMode="tail">{metric.label}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'nowrap' }}>
                      <Text style={{ fontWeight: 'bold', fontSize: 16, color: textStyle.color, textAlign: 'center' }}>{metric.score}</Text>
                      <MaterialCommunityIcons
                        name={metric.trend === 1 ? 'arrow-up-bold' : metric.trend === -1 ? 'arrow-down-bold' : 'arrow-right-bold'}
                        size={16}
                        color={metric.trend === 1 ? '#4BB543' : metric.trend === -1 ? '#FF5F6D' : '#aaa'}
                        style={{ marginLeft: 3 }}
                      />
                    </View>
                  </View>
                ))}
              </View>
              {/* Progress Rings */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
                {summaryMetrics.map(metric => (
                  <View key={metric.key} style={{ alignItems: 'center', flex: 1 }}>
                    <ProgressRing
                      radius={28}
                      stroke={6}
                      progress={metric.value}
                      color="#FF5F6D"
                      label={metric.label}
                    />
                  </View>
                ))}
              </View>
              {/* Radar Chart */}
              <View style={{ alignItems: 'center', marginBottom: 12, marginTop: 12, paddingHorizontal: 12 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
                  <RadarChart metrics={summaryMetrics} size={320} />
                </ScrollView>
              </View>
              {/* Motivational line */}
              <Text style={{ textAlign: 'center', color: textStyle.color, fontWeight: 'bold', fontSize: 15 }}>
                Keep up the aerobic work! Focus on speed intervals for even better results.
              </Text>
            </Card.Content>
          </Card>

          {/* Performance Summary Radar Chart - Placed higher */}
          <Card style={[styles.card, { backgroundColor: actualTheme.colors.card }]}>
            <View style={{ borderRadius: styles.card.borderRadius, overflow: 'hidden' }}>
              <Card.Content style={styles.radarCardContent}>
                {/* ... content of the card ... */}
              </Card.Content>
            </View>
          </Card>
        </View>

        {/* Legend Modal */}
        <Portal>
          <Modal
            visible={legendVisible}
            onDismiss={() => setLegendVisible(false)}
            contentContainerStyle={{
              backgroundColor: actualTheme.colors.card,
              margin: 24,
              padding: 24,
              borderRadius: 16,
              elevation: 6,
              maxWidth: 400,
              alignSelf: 'center',
            }}
          >
            <Text style={[textStyle, { fontWeight: 'bold', fontSize: 20, marginBottom: 12 }]}>Performance Metrics Legend</Text>
            <View style={{ marginBottom: 12 }}>
              <Text style={[textStyle, { fontWeight: 'bold' }]}>Endurance</Text>
              <Text style={textStyle}>Ability to sustain aerobic effort over time, measured by long runs and aerobic sessions.</Text>
            </View>
            <View style={{ marginBottom: 12 }}>
              <Text style={[textStyle, { fontWeight: 'bold' }]}>Speed</Text>
              <Text style={textStyle}>Maximum pace or velocity achieved in short efforts or intervals.</Text>
            </View>
            <View style={{ marginBottom: 12 }}>
              <Text style={[textStyle, { fontWeight: 'bold' }]}>Recovery</Text>
              <Text style={textStyle}>How quickly your body returns to baseline after exercise, often measured by HRV or resting heart rate.</Text>
            </View>
            <View style={{ marginBottom: 12 }}>
              <Text style={[textStyle, { fontWeight: 'bold' }]}>Climbing</Text>
              <Text style={textStyle}>Performance on uphill segments, measured by pace and heart rate on climbs.</Text>
            </View>
            <View style={{ marginBottom: 12 }}>
              <Text style={[textStyle, { fontWeight: 'bold' }]}>Consistency</Text>
              <Text style={textStyle}>Regularity of training sessions and adherence to the plan.</Text>
            </View>
            <View style={{ marginBottom: 12 }}>
              <Text style={[textStyle, { fontWeight: 'bold' }]}>Heart Rate Efficiency</Text>
              <Text style={textStyle}>How much your heart rate decreases at a given pace, indicating improved aerobic fitness.</Text>
            </View>
            <View style={{ marginBottom: 12 }}>
              <Text style={[textStyle, { fontWeight: 'bold' }]}>Pace</Text>
              <Text style={textStyle}>Speed per kilometer or mile, usually shown as min/km or min/mi.</Text>
            </View>
            <View style={{ marginBottom: 12 }}>
              <Text style={[textStyle, { fontWeight: 'bold' }]}>Fatigue</Text>
              <Text style={textStyle}>A subjective or calculated score indicating tiredness or readiness to train.</Text>
            </View>
            <View style={{ marginBottom: 12 }}>
              <Text style={[textStyle, { fontWeight: 'bold' }]}>VO2 Max</Text>
              <Text style={textStyle}>Estimated maximum oxygen uptake, a key indicator of aerobic capacity.</Text>
            </View>
            <Button mode="contained" onPress={() => setLegendVisible(false)} style={{ marginTop: 16 }}>
              Close
            </Button>
          </Modal>
        </Portal>
      </ScrollView>
    </ThemedErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  levelContainer: {
    marginVertical: 8,
  },
  chart: {
    marginVertical: 0,
    borderRadius: 16,
    alignSelf: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  chartSubtitle: {
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 8,
    textAlign: 'center',
  },
  chipContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  chip: {
    marginRight: 4,
    marginBottom: 8,
  },
  recommendationContainer: {
    marginVertical: 8,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recommendationTitle: {
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.7,
  },
  divider: {
    marginVertical: 12,
  },
  efficiencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  efficiencyItem: {
    alignItems: 'center',
    flex: 1,
  },
  efficiencyLabel: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  efficiencyValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  efficiencySubtext: {
    fontSize: 11,
    opacity: 0.7,
  },
  segmentedControlContainer: {
    flexDirection: 'row',
    borderRadius: 24,
    backgroundColor: '#e0fbfc',
    overflow: 'hidden',
    marginVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    minHeight: 40,
    width: '100%',
    gap: 0,
  },
  segmentedControlButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
    minWidth: 0,
    borderRadius: 24,
  },
  segmentedControlText: {
    fontSize: 14,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    width: '100%',
  },
  carouselDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 0,
  },
  carouselDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
    opacity: 0.5,
  },
  carouselDotActive: {
    backgroundColor: '#FF5F6D',
    opacity: 1,
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
  goalCard: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(152, 193, 217, 0.2)',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
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
  radarCardContent: {
    // Add any necessary styles for the radar card content
  },
}); 
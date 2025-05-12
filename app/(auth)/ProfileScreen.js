import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import {
  Avatar,
  Divider,
  List,
  RadioButton,
  Surface,
  Switch,
  Text,
  useTheme as usePaperTheme
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Added for icons
import ThemedErrorBoundary from '../../src/components/ErrorBoundary'; // Corrected path
import { UNIT_SYSTEMS, useUnits } from '../../src/hooks/useUnits'; // Corrected path
import { ErrorState, LoadingState } from '../../src/components/StatusStates'; // Corrected path

export default function ProfileScreen() {
  const { unitSystem, toggleUnitSystem, isMetric } = useUnits();
  const actualTheme = usePaperTheme(); // USE paper's useTheme hook
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [appearanceExpanded, setAppearanceExpanded] = useState(false);
  const [unitSettingsExpanded, setUnitSettingsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Use actualTheme for dynamic styling
  const textStyle = { color: actualTheme.colors.text };
  const subtleTextStyle = { color: actualTheme.colors.text + '80' };
  const cardStyle = { backgroundColor: actualTheme.colors.card };
  const containerStyle = { backgroundColor: actualTheme.colors.background };
  const dividerStyle = { backgroundColor: actualTheme.colors.border };
  const radioColor = actualTheme.colors.primary; // Use primary color for radio buttons
  const switchColor = actualTheme.colors.primary; // Use primary color for switch
  const listIconColor = actualTheme.colors.text; // Use text color for icons
  const logoutColor = actualTheme.colors.error || '#FF5F6D'; // Use error color or fallback

  useEffect(() => {
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingState message="Loading profile..." />;
  }
  if (error) {
    return <ErrorState message={error} onRetry={() => { setError(null); setLoading(true); }} />;
  }

  return (
    <ThemedErrorBoundary>
      <ScrollView style={[styles.container, containerStyle]}>
        <Surface style={[styles.header, cardStyle]} elevation={2}>
          <View style={styles.headerContent}>
            <Text style={textStyle}>Profile</Text>
          </View>
        </Surface>

        <View style={styles.profileSection}>
          <Avatar.Text
            size={80}
            label="JD"
            style={{ backgroundColor: actualTheme.colors.primary }} // Use theme color
            color={actualTheme.colors.onPrimary || '#ffffff'} // Ensure contrast
          />
          <Text style={[styles.userName, textStyle]}>John Doe</Text>
          <Text style={[styles.userEmail, subtleTextStyle]}>john.doe@example.com</Text>
        </View>

        <Surface style={[styles.settingsCardBase, cardStyle]} elevation={1}>
          <View style={styles.settingsCardContent}>
            <List.Section titleStyle={textStyle}>
              <List.Accordion
                title="Settings"
                titleStyle={textStyle}
                left={props => <List.Icon {...props} icon="cog" color={listIconColor} />}
                expanded={settingsExpanded}
                onPress={() => setSettingsExpanded(!settingsExpanded)}
              >
                <List.Accordion
                  title="Appearance"
                  titleStyle={textStyle}
                  left={props => <List.Icon {...props} icon="palette" color={listIconColor} />}
                  expanded={appearanceExpanded}
                  onPress={() => setAppearanceExpanded(!appearanceExpanded)}
                >
                  <View style={styles.themeOptions}>
                    <RadioButton.Group 
                      onValueChange={value => { /* Placeholder for theme change */ }}
                      value={actualTheme.dark ? 'dark' : 'light'}
                    >
                      <View style={styles.radioOption}>
                        <RadioButton value="light" color={radioColor} />
                        <Text style={textStyle}>Light</Text>
                      </View>
                      
                      <View style={styles.radioOption}>
                        <RadioButton value="dark" color={radioColor} />
                        <Text style={textStyle}>Dark</Text>
                      </View>
                    </RadioButton.Group>
                  </View>
                </List.Accordion>
                
                <List.Accordion
                  title="Units"
                  titleStyle={textStyle}
                  left={props => <List.Icon {...props} icon="ruler" color={listIconColor} />}
                  expanded={unitSettingsExpanded}
                  onPress={() => setUnitSettingsExpanded(!unitSettingsExpanded)}
                >
                  <View style={styles.unitOptions}>
                    {/* Note: toggleUnitSystem just flips between the two. */}
                    {/* If more systems are added, this needs radio group logic. */}
                    <TouchableOpacity style={styles.radioOption} onPress={toggleUnitSystem}>
                      <RadioButton value={UNIT_SYSTEMS.METRIC} status={unitSystem === UNIT_SYSTEMS.METRIC ? 'checked' : 'unchecked'} color={radioColor} onPress={toggleUnitSystem}/>
                      <Text style={textStyle}>Metric (km, m)</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.radioOption} onPress={toggleUnitSystem}>
                      <RadioButton value={UNIT_SYSTEMS.IMPERIAL} status={unitSystem === UNIT_SYSTEMS.IMPERIAL ? 'checked' : 'unchecked'} color={radioColor} onPress={toggleUnitSystem}/>
                      <Text style={textStyle}>Imperial (mi, ft)</Text>
                    </TouchableOpacity>
                    
                    <View style={styles.unitExamples}>
                      <Text style={[styles.unitExampleText, subtleTextStyle]}>
                        Example - Distance: {isMetric ? '10 km' : '6.2 mi'}, Elevation: {isMetric ? '100 m' : '328 ft'}
                      </Text>
                    </View>
                  </View>
                </List.Accordion>
                
                <List.Item
                  title="Notifications"
                  titleStyle={textStyle}
                  left={props => <List.Icon {...props} icon="bell" color={listIconColor} />}
                  right={() => <Switch value={true} color={switchColor} /> /* Placeholder value */}
                />
                
                <List.Item
                  title="Privacy"
                  titleStyle={textStyle}
                  left={props => <List.Icon {...props} icon="shield-account" color={listIconColor} />}
                  right={props => <List.Icon {...props} icon="chevron-right" color={listIconColor} />}
                />
              </List.Accordion>
            </List.Section>
          </View>
        </Surface>

        <Surface style={[styles.settingsCardBase, cardStyle]} elevation={1}>
          <View style={styles.settingsCardContent}>
            <List.Item
              title="Help & Support"
              titleStyle={textStyle}
              left={props => <List.Icon {...props} icon="help-circle" color={listIconColor} />}
              right={props => <List.Icon {...props} icon="chevron-right" color={listIconColor} />}
            />
            
            <Divider style={dividerStyle} />
            
            <List.Item
              title="About"
              titleStyle={textStyle}
              left={props => <List.Icon {...props} icon="information" color={listIconColor} />}
              right={props => <List.Icon {...props} icon="chevron-right" color={listIconColor} />}
            />
            
            <Divider style={dividerStyle} />
            
            <List.Item
              title="Logout"
              titleStyle={{ color: logoutColor }}
              left={props => <List.Icon {...props} icon="logout" color={logoutColor} />}
              onPress={() => { /* Add logout logic here */ console.log("Logout Pressed"); }}
            />
          </View>
        </Surface>
      </ScrollView>
    </ThemedErrorBoundary>
  );
}

// Note: Styles need adjustments to use theme colors potentially
const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#f5f5f5', // Handled by containerStyle
  },
  header: {
    padding: 16,
    // backgroundColor: 'white', // Handled by cardStyle
    marginBottom: 16,
  },
  headerContent: {
    paddingTop: 40, // Keeping this for now for visual spacing, consider SafeAreaView
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
  },
  userName: {
    fontWeight: 'bold',
    marginTop: 16,
  },
  userEmail: {
    marginTop: 4,
    // color: '#666', // Handled by subtleTextStyle
  },
  settingsCardBase: { // Renamed from settingsCard
    marginHorizontal: 16,
    marginTop: 0, // Adjusted margin for closer cards
    marginBottom: 16, // Adjusted margin for closer cards
    borderRadius: 12, // Slightly more rounded corners
    // overflow: 'hidden', // Removed from here
  },
  settingsCardContent: { // New style for inner View
    overflow: 'hidden',
    borderRadius: 12, // Ensure inner content also respects border radius if needed
  },
  themeOptions: {
    paddingHorizontal: 16,
    paddingVertical: 8, // Reduced vertical padding
  },
  unitOptions: {
    paddingHorizontal: 16,
    paddingVertical: 8, // Reduced vertical padding
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4, // Reduced vertical margin
  },
  unitExamples: {
    marginTop: 12, // Increased top margin for separation
    paddingTop: 12, // Increased top padding for separation
    borderTopWidth: 1,
    // borderTopColor: 'rgba(0, 0, 0, 0.1)', // Handled by dividerStyle if needed, or use theme
  },
  unitExampleText: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.8, // Make it slightly less prominent
  },
}); 
import React, { useState } from 'react'; // Import useState
import { View, Text, StyleSheet, useColorScheme } from 'react-native'; // Import useColorScheme
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
// Removed LinearGradient import

// Import the main content component for mobile
import EbookGeneratorMobile from './components/EbookGeneratorMobile';

export type ThemeMode = 'light' | 'dark';

export default function App() {
  // Use system preference or default to dark
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>(systemColorScheme === 'light' ? 'light' : 'dark');

  const toggleTheme = () => {
    setThemeMode(prevMode => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const containerBackgroundColor = themeMode === 'light' ? '#F7F6F3' : '#2F3437'; // Notion light vs dark background

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: containerBackgroundColor }]}>
        <StatusBar style={themeMode === 'light' ? 'dark' : 'light'} /> {/* Adjust status bar based on theme */}
        {/* Removed LinearGradient background */}
        {/* Removed grid background view */}
        <View style={[styles.containerStyle]}>
          {/* Render the main mobile component and pass theme mode and toggle function */}
          <EbookGeneratorMobile themeMode={themeMode} toggleTheme={toggleTheme} />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Background color is now set dynamically
  },
  // Removed background style
  // Removed gridBackground style
  content: {
    flex: 1,
    position: 'relative', // To layer above background
    zIndex: 10,
    paddingHorizontal: 16, // px-4 equivalent
    paddingVertical: 32, // py-8 equivalent
    maxWidth: 800, // max-w-7xl equivalent (approximate)
    alignSelf: 'center', // mx-auto equivalent
    width: '100%',
  },
  // Title and subtitle styles will be handled within EbookGeneratorMobile or other components
  // Removed title and subtitle styles from here
  containerStyle: {
    position: 'relative',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16, // p-4 equivalent
  },
});

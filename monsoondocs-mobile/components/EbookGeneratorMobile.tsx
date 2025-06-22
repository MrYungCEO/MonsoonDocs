
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'; // Import Pressable
import { CloudLightning, Sparkles, Sun, Moon } from 'lucide-react-native'; // Import Sun and Moon icons
import SettingsPanelMobile from './SettingsPanelMobile';
import PreviewPanelMobile, { PreviewPanelMobileRef } from './PreviewPanelMobile'; // Import PreviewPanelMobileRef type
import { DOCUMENT_MODES, DocumentMode } from '../types/documentTypes'; // Assuming types can be reused
import { ThemeMode } from '../App'; // Import ThemeMode type

export interface EbookSettings {
  apiKey: string;
  prompt: string;
  logo: string | null;
  background: string | null;
  colorTheme: string;
  documentMode: string;
}

export interface EbookState {
  isGenerating: boolean;
  markdownContent: string;
  activeTab: 'preview' | 'editor';
  isDownloading: boolean; // Added isDownloading state
}

interface EbookGeneratorMobileProps {
  themeMode: ThemeMode;
  toggleTheme: () => void;
}

const EbookGeneratorMobile: React.FC<EbookGeneratorMobileProps> = ({ themeMode, toggleTheme }) => { // Accept themeMode and toggleTheme props
  const [settings, setSettings] = useState<EbookSettings>({
    apiKey: '',
    prompt: '',
    logo: null,
    background: null,
    colorTheme: 'purple',
    documentMode: 'ebook'
  });

const [state, setState] = useState<EbookState>({
    isGenerating: false,
    markdownContent: '',
    activeTab: 'preview',
    isDownloading: false, // Initialize isDownloading
  });

  // Ref for the PreviewPanelMobile component to access its methods
  const previewPanelRef = useRef<PreviewPanelMobileRef>(null);

  const updateSettings = (newSettings: Partial<EbookSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const updateState = (newState: Partial<EbookState>) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  // Handlers for export buttons in SettingsPanelMobile
  const handleExportMarkdown = async () => {
    if (previewPanelRef.current) {
      await previewPanelRef.current.handleExportMarkdown();
    }
  };

  const handleExportPdf = async () => {
    if (previewPanelRef.current) {
      updateState({ isDownloading: true });
      try {
        const htmlContent = await previewPanelRef.current.getHtmlContent();
        const response = await fetch("http://localhost:8000/pdf", {
          method: "POST",
          headers: {
            "Content-Type": "text/plain",
          },
          body: htmlContent,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        // Create a link and trigger download
        const a = document.createElement("a");
        a.href = url;
        a.download = "document.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

      } catch (error) {
        console.error("PDF generation failed:", error);
        // Handle error appropriately (e.g., display an error message)
      } finally {
        updateState({ isDownloading: false });
      }
    }
  };

  const currentMode = DOCUMENT_MODES.find(mode => mode.id === settings.documentMode) || DOCUMENT_MODES[0];

  // Define theme-dependent styles
  const headerTitleColor = themeMode === 'light' ? '#37352F' : '#EBECEB'; // Dark gray vs Light gray
  const headerSubtitleColor = themeMode === 'light' ? '#787774' : '#B4B4B4'; // Medium gray vs Lighter gray
  const currentModeTextColor = themeMode === 'light' ? '#787774' : '#B4B4B4'; // Medium gray vs Lighter gray
  const currentModeNameColor = themeMode === 'light' ? '#37352F' : '#EBECEB'; // Dark gray vs Light gray
  const footerTextColor = themeMode === 'light' ? '#787774' : '#B4B4B4'; // Medium gray vs Lighter gray
  const headerIconBackgroundColor = themeMode === 'light' ? '#EBECED' : '#454B4E'; // Light gray vs Darker gray
  const headerIconBorderColor = themeMode === 'light' ? '#C4C4C4' : '#6C7275'; // Light gray vs Medium gray

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.headerIconContainer, { backgroundColor: headerIconBackgroundColor, borderColor: headerIconBorderColor }]}>
          <CloudLightning size={32} color={themeMode === 'light' ? '#37352F' : '#EBECEB'} /> {/* Icon color based on theme */}
        </View>
<Text style={[styles.headerTitle, { color: headerTitleColor }]} numberOfLines={1} ellipsizeMode="tail">
          MonsoonDocs
        </Text>
        <Sparkles size={32} color={themeMode === 'light' ? '#a78bfa' : '#c084fc'} />{/* Purple accent */}
        {/* Theme Toggle Button */}
        <Pressable onPress={toggleTheme} style={styles.themeToggle}>
          {themeMode === 'light' ? (
            <Moon size={24} color="#37352F" /> // Dark gray moon icon for light mode
          ) : (
            <Sun size={24} color="#EBECEB" /> // Light gray sun icon for dark mode
          )}
        </Pressable>
      </View>
      <Text style={[styles.headerSubtitle, { color: headerSubtitleColor }]}>
        Create professional documents in minutes with AI-powered generation
      </Text>
      <Text style={[styles.currentModeText, { color: currentModeTextColor }]}>
        <Text>Current Mode: </Text><Text style={[styles.currentModeName, { color: currentModeNameColor }]}>{currentMode.name}</Text> - <Text>{currentMode.description}</Text>
      </Text>

      {/* Main Content - Placeholder for Settings and Preview */}
      <View style={styles.mainContentContainer}>
        <View style={styles.panelsContainer}>
          <SettingsPanelMobile
            settings={settings}
            state={state}
            onSettingsChange={updateSettings}
            onStateChange={updateState}
            onExportMarkdown={handleExportMarkdown} // Pass export function
            onExportPdf={handleExportPdf} // Pass export function
            themeMode={themeMode} // Pass themeMode
            isDownloading={state.isDownloading} // Pass isDownloading state
          />
          <PreviewPanelMobile
            ref={previewPanelRef} // Assign ref to PreviewPanelMobile
            isDownloading={state.isDownloading} // Pass isDownloading state to PreviewPanelMobile
            settings={settings}
            state={state}
            onStateChange={updateState}
            themeMode={themeMode} // Pass themeMode
            // previewRef is now managed internally by PreviewPanelMobile for ViewShot
          />
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: footerTextColor }]}>
          Powered by Google Gemini AI • Built with precision and care
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Removed padding/vertical margin, handled by content in App.tsx
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12, // gap-3 equivalent (approximate)
    marginBottom: 16, // mb-4 equivalent
  },
  headerIconContainer: {
    padding: 12, // p-3 equivalent
    borderRadius: 8, // Slightly rounded corners
    borderWidth: 1,
    // Shadow needs platform-specific styles
  },
  headerTitle: {
    fontSize: 40, // text-5xl equivalent (approximate)
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 18, // text-xl equivalent
    fontWeight: '300', // font-light equivalent
    textAlign: 'center',
    marginBottom: 48, // mb-12 equivalent
  },
  currentModeText: {
    fontSize: 16, // text-lg equivalent
    textAlign: 'center',
    marginBottom: 32, // mt-4 text-lg mb-? - adding some margin
  },
  currentModeName: {
    fontWeight: '600', // font-semibold equivalent
  },
  mainContentContainer: {
    // Removed background, border, shadow for Notion-like flat style
    // Padding and margin will be handled by the ScrollView and parent container
    padding: 0, // Remove padding here
    marginBottom: 0, // Remove margin here
  },
  panelsContainer: {
    // flex-col xl:flex-row gap-8 - needs responsive layout logic in RN
    // For now, just stack them
    gap: 32, // gap-8 equivalent
  },
  footer: {
    // Removed textAlign: 'center'
  },
  footerText: {
    fontSize: 12, // text-sm equivalent
    textAlign: 'center', // Added textAlign: 'center' here
    marginTop: 32, // Add some space above the footer
  },
  themeToggle: {
    marginLeft: 16, // Add some space to the left of the toggle
    padding: 8, // Add padding for easier pressing
  },
});

export default EbookGeneratorMobile;

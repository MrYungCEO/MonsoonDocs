import React, { useState } from 'react'; // Import useState to manage file names
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, LayoutAnimation, Platform, UIManager } from 'react-native'; // Import LayoutAnimation, Platform, UIManager
import { Key, MessageSquare, Image, Palette, CloudLightning, Download, FileText, BookOpen, PenTool, Heart, Briefcase, Plus, FileDown, ChevronDown, ChevronUp } from 'lucide-react-native'; // Use lucide-react-native, Import ChevronDown, ChevronUp
import { EbookSettings, EbookState } from './EbookGeneratorMobile'; // Import types from mobile component
import { generateEbook } from '../utils/geminiApi'; // Keep for now, will need review
// Import mobile file handling
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Linking from 'expo-linking'; // Import Linking for handling URLs
import { Picker } from '@react-native-picker/picker'; // Import Picker
// import * as Sharing from 'expo-sharing'; // Sharing is for exporting, not picking
import { DOCUMENT_MODES } from '../types/documentTypes'; // Assuming types are copied
import { ThemeMode } from '../App'; // Import ThemeMode type

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface SettingsPanelMobileProps {
  settings: EbookSettings;
  state: EbookState;
  onSettingsChange: (settings: Partial<EbookSettings>) => void;
  onStateChange: (state: Partial<EbookState>) => void;
  onExportMarkdown: () => Promise<void>; // Add export markdown prop
  onExportPdf: () => Promise<void>; // Add export pdf prop
  themeMode: ThemeMode; // Add themeMode prop
  isDownloading: boolean; // Add isDownloading prop
}

const SettingsPanelMobile: React.FC<SettingsPanelMobileProps> = ({
  settings,
  state,
  onSettingsChange,
  onStateChange,
  onExportMarkdown, // Destructure export markdown prop
  onExportPdf, // Destructure export pdf prop
  themeMode // Destructure themeMode prop
}) => {
  const [logoFileName, setLogoFileName] = useState<string | null>(null);
  const [backgroundFileName, setBackgroundFileName] = useState<string | null>(null);

  // State for collapsible sections
  const [isApiKeyCollapsed, setIsApiKeyCollapsed] = useState(true);
  const [isTopicCollapsed, setIsTopicCollapsed] = useState(false); // Keep topic open by default
  const [isLogoCollapsed, setIsLogoCollapsed] = useState(true);
  const [isBackgroundCollapsed, setIsBackgroundCollapsed] = useState(true);
  const [isColorThemeCollapsed, setIsColorThemeCollapsed] = useState(true);
  const [isExportCollapsed, setIsExportCollapsed] = useState(true);

  // Toggle function for collapsible sections
  const toggleCollapse = (section: 'apiKey' | 'topic' | 'logo' | 'background' | 'colorTheme' | 'export') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    switch (section) {
      case 'apiKey':
        setIsApiKeyCollapsed(!isApiKeyCollapsed);
        break;
      case 'topic':
        setIsTopicCollapsed(!isTopicCollapsed);
        break;
      case 'logo':
        setIsLogoCollapsed(!isLogoCollapsed);
        break;
      case 'background':
        setIsBackgroundCollapsed(!isBackgroundCollapsed);
        break;
      case 'colorTheme':
        setIsColorThemeCollapsed(!isColorThemeCollapsed);
        break;
      case 'export':
        setIsExportCollapsed(!isExportCollapsed);
        break;
    }
  };


  const handleLogoUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'image/*' });
      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // Read file content and update settings
        const fileContent = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
        onSettingsChange({ logo: `data:${asset.mimeType};base64,${fileContent}` });
        setLogoFileName(asset.name);
      } else {
        setLogoFileName(null);
        onSettingsChange({ logo: null });
      }
    } catch (error) {
      console.error('Error picking logo image:', error);
      alert('Error picking logo image.');
      setLogoFileName(null);
      onSettingsChange({ logo: null });
    }
  };

  const handleBackgroundUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'image/*' });
       if (result.canceled === false && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // Read file content and update settings
        const fileContent = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
        onSettingsChange({ background: `data:${asset.mimeType};base64,${fileContent}` });
        setBackgroundFileName(asset.name);
      } else {
        setBackgroundFileName(null);
        onSettingsChange({ background: null });
      }
    } catch (error) {
      console.error('Error picking background image:', error);
      alert('Error picking background image.');
      setBackgroundFileName(null);
      onSettingsChange({ background: null });
    }
  };

  const handleGenerate = async () => {
    if (!settings.apiKey.trim()) {
      alert('Please enter your Google Gemini API key');
      return;
    }

    if (!settings.prompt.trim()) {
      alert('Please describe the document you want to create');
      return;
    }

    onStateChange({ isGenerating: true });

    try {
      const currentMode = DOCUMENT_MODES.find(mode => mode.id === settings.documentMode) || DOCUMENT_MODES[0];
      // generateEbook needs to be reviewed for mobile compatibility if it uses web APIs
      const content = await generateEbook(settings.apiKey, settings.prompt, currentMode.systemPrompt);
      onStateChange({
        markdownContent: content,
        activeTab: 'preview', // Assuming preview tab exists in mobile
        isGenerating: false
      });
    } catch (error) {
      console.error('Error generating document:', error);
      alert(`Error generating document: ${error instanceof Error ? error.message : 'Unknown error'}`);
      onStateChange({ isGenerating: false });
    }
  };

  const handleGenerateNew = async () => {
     if (!settings.apiKey.trim()) {
      alert('Please enter your Google Gemini API key');
      return;
    }

    if (!settings.prompt.trim()) {
      alert('Please describe the document you want to create');
      return;
    }

    // Clear existing content and generate new
    onStateChange({
      isGenerating: true,
      markdownContent: ''
    });

    try {
      const currentMode = DOCUMENT_MODES.find(mode => mode.id === settings.documentMode) || DOCUMENT_MODES[0];
      // generateEbook needs to be reviewed for mobile compatibility if it uses web APIs
      const content = await generateEbook(settings.apiKey, settings.prompt, currentMode.systemPrompt);
      onStateChange({
        markdownContent: content,
        activeTab: 'preview', // Assuming preview tab exists in mobile
        isGenerating: false
      });
    } catch (error) {
      console.error('Error generating document:', error);
      alert(`Error generating document: ${error instanceof Error ? error.message : 'Unknown error'}`);
      onStateChange({ isGenerating: false });
    }
  };

  // Removed placeholder export functions, now using props

  const handleModeChange = (modeId: string) => {
    const mode = DOCUMENT_MODES.find(m => m.id === modeId);
    onSettingsChange({
      documentMode: modeId,
      prompt: mode?.placeholderPrompt || ''
    });
  };

  const getIconComponent = (iconName: string) => {
    const icons = {
      BookOpen,
      FileText,
      PenTool,
      Heart,
      Briefcase
    };
    const IconComponent = icons[iconName as keyof typeof icons] || BookOpen;
    // Adjust icon color based on theme
    const iconColor = themeMode === 'light' ? '#37352F' : '#EBECEB'; // Dark gray vs Light gray
    return <IconComponent size={20} color={iconColor} />;
  };

  const currentMode = DOCUMENT_MODES.find(mode => mode.id === settings.documentMode) || DOCUMENT_MODES[0];
  const hasContent = state.markdownContent && state.markdownContent.trim() !== '';

  // Define theme-dependent styles
  // Define theme-dependent styles
  const settingsBoxBackgroundColor = themeMode === 'light' ? '#FFFFFF' : '#1f2937'; // White vs Dark grey
  const settingsBoxBorderColor = themeMode === 'light' ? '#E0E0E0' : '#374151'; // Light gray vs Darker grey
  const settingsTitleColor = themeMode === 'light' ? '#37352F' : '#EBECEB'; // Dark gray vs Light gray
  const labelColor = themeMode === 'light' ? '#37352F' : '#EBECEB'; // Dark gray vs Light gray
  const modeButtonActiveBackgroundColor = themeMode === 'light' ? '#EBECED' : '#374151'; // Light gray vs Darker grey
  const modeButtonInactiveBackgroundColor = themeMode === 'light' ? '#FFFFFF' : '#1f2937'; // White vs Dark grey
  const modeButtonBorderColor = themeMode === 'light' ? '#E0E0E0' : '#4b5563'; // Light gray vs Medium grey
  const modeButtonTextActiveColor = themeMode === 'light' ? '#37352F' : '#EBECEB'; // Dark gray vs Light gray
  const modeButtonTextInactiveColor = themeMode === 'light' ? '#37352F' : '#EBECEB'; // Dark gray vs Light gray
  const modeButtonDescriptionColor = themeMode === 'light' ? '#787774' : '#9ca3af'; // Medium gray vs Medium grey
  const textInputBackgroundColor = themeMode === 'light' ? '#F7F6F3' : '#374151'; // Light background vs Darker grey
  const textInputColor = themeMode === 'light' ? '#37352F' : '#EBECEB'; // Dark gray vs Light gray
  const textInputPlaceholderColor = themeMode === 'light' ? '#78777480' : '#9ca3af80'; // Medium gray/50 vs Medium grey/50
  const helpTextColor = themeMode === 'light' ? '#787774' : '#9ca3af'; // Medium gray vs Medium grey
  const linkTextColor = themeMode === 'light' ? '#0A85D1' : '#a78bfa'; // Notion blue vs Light purple
  const pickerContainerBackgroundColor = themeMode === 'light' ? '#F7F6F3' : '#374151'; // Light background vs Darker grey
  const pickerColor = themeMode === 'light' ? '#37352F' : '#EBECEB'; // Dark gray vs Light gray
  const uploadButtonBackgroundColor = themeMode === 'light' ? '#EBECED' : '#374151'; // Light gray vs Darker grey
  const uploadButtonBorderColor = themeMode === 'light' ? '#C4C4C4' : '#4b5563'; // Light gray vs Medium grey
  const uploadButtonTextcolor = themeMode === 'light' ? '#37352F' : '#EBECEB'; // Dark gray vs Light gray
  const generateButtonPrimaryBackgroundColor = themeMode === 'light' ? '#a78bfa' : '#c084fc'; // Purple accent
  const generateButtonNewBackgroundColor = themeMode === 'light' ? '#a78bfa' : '#c084fc'; // Purple accent
  const generateButtonDisabledBackgroundColor = themeMode === 'light' ? '#C4C4C4' : '#4b5563'; // Light gray vs Medium grey
  const generateButtonTextcolor = themeMode === 'light' ? '#FFFFFF' : '#EBECEB'; // White vs Light gray
  const continueButtonBackgroundColor = themeMode === 'light' ? '#EBECED' : '#374151'; // Light gray vs Darker grey
  const continueButtonTextcolor = themeMode === 'light' ? '#37352F' : '#EBECEB'; // Dark gray vs Light gray
  const exportBoxBackgroundColor = themeMode === 'light' ? '#FFFFFF' : '#1f2937'; // White vs Dark grey
  const exportBoxBorderColor = themeMode === 'light' ? '#E0E0E0' : '#374151'; // Light gray vs Darker grey
  const exportTitleColor = themeMode === 'light' ? '#37352F' : '#EBECEB'; // Dark gray vs Light gray
  const exportButtonBackgroundColor = themeMode === 'light' ? '#EBECED' : '#374151'; // Light gray vs Darker grey
  const exportButtonBorderColor = themeMode === 'light' ? '#E0E0E0' : '#4b5563'; // Light gray vs Medium grey
  const exportButtonDisabledBackgroundColor = themeMode === 'light' ? '#C4C4C4' : '#4b5563'; // Light gray vs Medium grey
  const exportButtonTextcolor = themeMode === 'light' ? '#37352F' : '#EBECEB'; // Dark gray vs Light gray
  const exportHelpTextColor = themeMode === 'light' ? '#787774' : '#9ca3af'; // Medium gray vs Medium grey


  return (
    <View style={styles.container}>
      <View style={[styles.settingsBox, { backgroundColor: settingsBoxBackgroundColor, borderColor: settingsBoxBorderColor }]}>
        <Text style={[styles.settingsTitle, { color: settingsTitleColor }]}>
          <CloudLightning size={24} color={themeMode === 'light' ? '#a78bfa' : '#c084fc'} />{/* Purple accent */}
          Settings
        </Text>

        {/* Document Type Section (Always Visible) */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: labelColor }]}>
             {getIconComponent(currentMode.icon)}
            Document Type
          </Text>
          <View style={styles.modeButtonsContainer}>
            {DOCUMENT_MODES.map((mode) => (
              <Pressable
                key={mode.id}
                onPress={() => handleModeChange(mode.id)}
                style={[
                  styles.modeButton,
                  { borderColor: modeButtonBorderColor },
                  settings.documentMode === mode.id ? { backgroundColor: modeButtonActiveBackgroundColor } : { backgroundColor: modeButtonInactiveBackgroundColor }
                ]}
              >
                <View style={styles.modeButtonContent}>
                  {getIconComponent(mode.icon)}
                  <View>
                    <Text style={[styles.modeButtonText, settings.documentMode === mode.id ? { color: modeButtonTextActiveColor } : { color: modeButtonTextInactiveColor }]}>{mode.name}</Text>
                    <Text style={[styles.modeButtonDescription, { color: modeButtonDescriptionColor }]}>{mode.description}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* API Key Section (Collapsible) */}
        <View style={styles.section}>
          <Pressable onPress={() => toggleCollapse('apiKey')} style={styles.collapsibleHeader}>
            <Text style={[styles.label, { color: labelColor, marginBottom: 0 }]}>
              <Key size={16} color={themeMode === 'light' ? '#a78bfa' : '#c084fc'} />{/* Purple accent */}
              Google Gemini API Key
            </Text>
            {isApiKeyCollapsed ? (
              <ChevronDown size={20} color={labelColor} />
            ) : (
              <ChevronUp size={20} color={labelColor} />
            )}
          </Pressable>
          {!isApiKeyCollapsed && (
            <View style={styles.collapsibleContent}>
              <TextInput
                value={settings.apiKey}
                onChangeText={(text) => onSettingsChange({ apiKey: text })}
                placeholder="Enter your API key"
                placeholderTextColor={textInputPlaceholderColor}
                style={[styles.textInput, { backgroundColor: textInputBackgroundColor, borderColor: settingsBoxBorderColor, color: textInputColor }]}
                secureTextEntry // Use secureTextEntry for API key
              />
              <Pressable onPress={() => Linking.openURL('https://ai.google.dev/')}>
                <Text style={[styles.helpText, { color: helpTextColor }]}>
                  Get your API key from <Text style={[styles.linkText, { color: linkTextColor }]}>Google AI Studio</Text>
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Topic Section (Collapsible) */}
        <View style={styles.section}>
           <Pressable onPress={() => toggleCollapse('topic')} style={styles.collapsibleHeader}>
            <Text style={[styles.label, { color: labelColor, marginBottom: 0 }]}>
              <MessageSquare size={16} color={themeMode === 'light' ? '#a78bfa' : '#c084fc'} />{/* Purple accent */}
              {currentMode.name} Topic
            </Text>
            {isTopicCollapsed ? (
              <ChevronDown size={20} color={labelColor} />
            ) : (
              <ChevronUp size={20} color={labelColor} />
            )}
          </Pressable>
          {!isTopicCollapsed && (
            <View style={styles.collapsibleContent}>
              <TextInput
                value={settings.prompt}
                onChangeText={(text) => onSettingsChange({ prompt: text })}
                placeholder={currentMode.placeholderPrompt}
                placeholderTextColor={textInputPlaceholderColor}
                style={[styles.textInput, styles.textArea, { backgroundColor: textInputBackgroundColor, borderColor: settingsBoxBorderColor, color: textInputColor }]}
                multiline
                numberOfLines={4}
              />
            </View>
          )}
        </View>

        {/* Upload Logo Section (Collapsible) */}
        <View style={styles.section}>
           <Pressable onPress={() => toggleCollapse('logo')} style={styles.collapsibleHeader}>
            <Text style={[styles.label, { color: labelColor, marginBottom: 0 }]}>
              <Image size={16} color={themeMode === 'light' ? '#a78bfa' : '#c084fc'} />{/* Purple accent */}
              Upload Logo (Optional)
            </Text>
            {isLogoCollapsed ? (
              <ChevronDown size={20} color={labelColor} />
            ) : (
              <ChevronUp size={20} color={labelColor} />
            )}
          </Pressable>
          {!isLogoCollapsed && (
            <View style={styles.collapsibleContent}>
               <Pressable onPress={handleLogoUpload} style={[styles.uploadButton, { backgroundColor: uploadButtonBackgroundColor, borderColor: uploadButtonBorderColor }]}>
                 <Text style={[styles.uploadButtonText, { color: uploadButtonTextcolor }]}>{logoFileName ? logoFileName : 'Choose File'}</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Background Image Section (Collapsible) */}
        <View style={styles.section}>
           <Pressable onPress={() => toggleCollapse('background')} style={styles.collapsibleHeader}>
            <Text style={[styles.label, { color: labelColor, marginBottom: 0 }]}>
              <Image size={16} color={themeMode === 'light' ? '#a78bfa' : '#c084fc'} />{/* Purple accent */}
              Background Image (Optional)
            </Text>
            {isBackgroundCollapsed ? (
              <ChevronDown size={20} color={labelColor} />
            ) : (
              <ChevronUp size={20} color={labelColor} />
            )}
          </Pressable>
          {!isBackgroundCollapsed && (
            <View style={styles.collapsibleContent}>
               <Pressable onPress={handleBackgroundUpload} style={[styles.uploadButton, { backgroundColor: uploadButtonBackgroundColor, borderColor: uploadButtonBorderColor }]}>
                 <Text style={[styles.uploadButtonText, { color: uploadButtonTextcolor }]}>{backgroundFileName ? backgroundFileName : 'Choose File'}</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Color Theme Section (Collapsible) */}
        <View style={styles.section}>
           <Pressable onPress={() => toggleCollapse('colorTheme')} style={styles.collapsibleHeader}>
            <Text style={[styles.label, { color: labelColor, marginBottom: 0 }]}>
              <Palette size={16} color={themeMode === 'light' ? '#a78bfa' : '#c084fc'} />{/* Purple accent */}
              Color Theme
            </Text>
            {isColorThemeCollapsed ? (
              <ChevronDown size={20} color={labelColor} />
            ) : (
              <ChevronUp size={20} color={labelColor} />
            )}
          </Pressable>
          {!isColorThemeCollapsed && (
            <View style={styles.collapsibleContent}>
              {/* Implement Picker component for color theme */}
              <View style={[styles.pickerContainer, { backgroundColor: pickerContainerBackgroundColor, borderColor: settingsBoxBorderColor }]}>
                <Picker
                  selectedValue={settings.colorTheme}
                  onValueChange={(itemValue) => onSettingsChange({ colorTheme: itemValue })}
                  style={[styles.picker, { color: pickerColor }]}
                  dropdownIconColor={themeMode === 'light' ? '#a78bfa' : '#c084fc'} // Purple accent
                >
                  <Picker.Item label="Purple" value="purple" />
                  <Picker.Item label="Blue" value="blue" />
                  <Picker.Item label="Green" value="green" />
                  <Picker.Item label="Red" value="red" />
                  <Picker.Item label="Indigo" value="indigo" />
                  <Picker.Item label="Pink" value="pink" />
                </Picker>
              </View>
            </View>
          )}
        </View>


        {/* Generation Buttons (Always Visible) */}
        <View style={styles.section}>
          <Pressable
            onPress={hasContent ? handleGenerateNew : handleGenerate}
            disabled={state.isGenerating}
            style={[
              styles.generateButton,
              state.isGenerating ? { backgroundColor: generateButtonDisabledBackgroundColor } : (hasContent ? { backgroundColor: generateButtonNewBackgroundColor } : { backgroundColor: generateButtonPrimaryBackgroundColor })
            ]}
          >
            {state.isGenerating ? (
              <>
                <ActivityIndicator color="#fff" />
                <Text style={[styles.generateButtonText, { color: generateButtonTextcolor }]}>Generating...</Text>
              </>
            ) : (
              <>
                {hasContent ? <Plus size={20} color={generateButtonTextcolor} /> : <CloudLightning size={20} color={generateButtonTextcolor} />}
                <Text style={[styles.generateButtonText, { color: generateButtonTextcolor }]}>{hasContent ? `Generate New ${currentMode.name}` : `Generate ${currentMode.name}`}</Text>
              </>
            )}
          </Pressable>

          {hasContent && !state.isGenerating && (
            <Pressable
              onPress={handleGenerate}
              style={[styles.continueButton, { backgroundColor: continueButtonBackgroundColor }]}
            >
              <CloudLightning size={16} color={continueButtonTextcolor} />
              <Text style={[styles.continueButtonText, { color: continueButtonTextcolor }]}>Continue/Extend Content</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Export Options (Collapsible) */}
      <View style={[styles.exportBox, { backgroundColor: exportBoxBackgroundColor, borderColor: exportBoxBorderColor }]}>
         <Pressable onPress={() => toggleCollapse('export')} style={styles.collapsibleHeader}>
          <Text style={[styles.exportTitle, { color: exportTitleColor, marginBottom: 0 }]}>
            <Download size={20} color={themeMode === 'light' ? '#a78bfa' : '#c084fc'} />{/* Purple accent */}
            Export Options
          </Text>
           {isExportCollapsed ? (
              <ChevronDown size={20} color={exportTitleColor} />
            ) : (
              <ChevronUp size={20} color={exportTitleColor} />
            )}
        </Pressable>
        {!isExportCollapsed && (
          <View style={styles.collapsibleContent}>
            <View style={styles.exportButtonsContainer}>
              <Pressable
            onPress={onExportMarkdown} // Use prop function
            disabled={!hasContent}
            style={[styles.exportButton, !hasContent && { backgroundColor: exportButtonDisabledBackgroundColor, borderColor: exportButtonDisabledBackgroundColor }, { backgroundColor: exportButtonBackgroundColor, borderColor: exportButtonBorderColor }]}
          >
            <FileText size={16} color={exportButtonTextcolor} />
            <Text style={[styles.exportButtonText, { color: exportButtonTextcolor }]}>Download Markdown (.md)</Text>
          </Pressable>
          <Pressable
            onPress={onExportPdf} // Use prop function
            disabled={!hasContent}
            style={[styles.exportButton, !hasContent && { backgroundColor: exportButtonDisabledBackgroundColor, borderColor: exportButtonDisabledBackgroundColor }, { backgroundColor: exportButtonBackgroundColor, borderColor: exportButtonBorderColor }]}
          >
            <FileDown size={16} color={exportButtonTextcolor} />
            <Text style={[styles.exportButtonText, { color: exportButtonTextcolor }]}>Download PDF (Letter Portrait)</Text>
          </Pressable>
        </View>

        <Text style={[styles.exportHelpText, { color: exportHelpTextColor }]}>
              Use the PDF options in the preview panel for custom formats and orientations
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Equivalent to space-y-6, add vertical margin/padding to sections
  },
  settingsBox: {
    borderWidth: 1,
    borderRadius: 8, // Slightly rounded corners
    padding: 20, // p-5 equivalent
    marginBottom: 24, // space-y-6 between boxes
    // Minimal shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2, // Android shadow
  },
  settingsTitle: {
    fontSize: 20, // text-2xl equivalent
    fontWeight: 'bold',
    marginBottom: 20, // mb-5 equivalent
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // gap-2 equivalent
  },
  section: {
    marginBottom: 16, // space-y-4 equivalent
  },
  label: {
    fontSize: 14, // text-sm equivalent
    fontWeight: '500', // font-medium equivalent
    marginBottom: 8, // mb-2 equivalent
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // gap-2 equivalent
  },
  modeButtonsContainer: {
    gap: 8, // gap-2 equivalent
  },
  modeButton: {
    padding: 12, // p-3 equivalent
    borderRadius: 8, // rounded-lg equivalent
    borderWidth: 1,
  },
  modeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // gap-3 equivalent
  },
  modeButtonText: {
    fontWeight: '500', // font-medium equivalent
  },
  modeButtonDescription: {
    fontSize: 10, // text-xs equivalent
    opacity: 0.8, // Slightly less opaque
  },
  textInput: {
    width: '100%',
    paddingHorizontal: 12, // px-3 equivalent
    paddingVertical: 10, // py-2.5 equivalent
    borderWidth: 1,
    borderRadius: 4, // Slightly rounded corners
    fontSize: 14, // text-sm equivalent
  },
  textArea: {
    height: 100, // Approximate rows={4}
    textAlignVertical: 'top', // For multiline placeholder alignment
  },
  helpText: {
    fontSize: 10, // text-xs equivalent
    marginTop: 4, // mt-1 equivalent
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 4, // Slightly rounded corners
    overflow: 'hidden', // Clip the picker content to the border radius
  },
  picker: {
    width: '100%',
    // Item text color needs custom styling or a different approach depending on platform
  },
  linkText: {
    textDecorationLine: 'underline',
  },
  uploadButton: {
    paddingVertical: 8, // py-2 equivalent
    paddingHorizontal: 12, // px-3 equivalent
    borderRadius: 4, // rounded equivalent
    borderWidth: 1,
    alignSelf: 'flex-start', // To not stretch full width
  },
  uploadButtonText: {
    fontSize: 14, // text-sm equivalent
    fontWeight: '500', // font-medium equivalent
  },
  generateButton: {
    width: '100%',
    paddingVertical: 12, // py-3 equivalent
    paddingHorizontal: 20, // px-5 equivalent
    borderRadius: 4, // rounded equivalent
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8, // gap-2 equivalent
  },
  generateButtonText: {
    fontWeight: '500', // font-medium equivalent
    fontSize: 16, // py-3 button text size
  },
  continueButton: {
    width: '100%',
    paddingVertical: 10, // py-2.5 equivalent
    paddingHorizontal: 20, // px-5 equivalent
    borderRadius: 4, // rounded equivalent
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8, // gap-2 equivalent
    marginTop: 8, // mt-2 equivalent
  },
  continueButtonText: {
    fontWeight: '500', // font-medium equivalent
    fontSize: 14, // py-2.5 button text size
  },
  exportBox: {
    borderWidth: 1,
    borderRadius: 8, // Slightly rounded corners
    padding: 20, // p-5 equivalent
    // Minimal shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2, // Android shadow
  },
  exportTitle: {
    fontSize: 18, // text-lg equivalent
    fontWeight: '600', // font-semibold equivalent
    marginBottom: 16, // mb-4 equivalent
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // gap-2 equivalent
  },
  exportButtonsContainer: {
    gap: 12, // gap-3 equivalent
  },
  exportButton: {
    paddingVertical: 10, // py-2.5 equivalent
    paddingHorizontal: 16, // px-4 equivalent
    borderRadius: 4, // rounded equivalent
    fontSize: 14, // text-sm equivalent
    fontWeight: '500', // font-medium equivalent
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8, // gap-2 equivalent
    borderWidth: 1,
  },
  exportButtonText: {
    fontWeight: '500', // font-medium equivalent
  },
  exportHelpText: {
    marginTop: 12, // mt-3 equivalent
    fontSize: 10, // text-xs equivalent
    textAlign: 'center',
  },
  // New styles for collapsible sections
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10, // Add some padding to the header
    marginBottom: 8, // Add space below the header
  },
  collapsibleContent: {
    // Add padding or margin if needed inside the collapsible content
  },
});

export default SettingsPanelMobile;

import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView, ScrollView, View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Dimensions, Platform, ActivityIndicator, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { Picker } from '@react-native-picker/picker';
import { marked } from 'marked';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import { CloudLightning, Sparkles, Download, Edit3, Eye, Key, MessageSquare, Palette, BookOpen, FileText, PenTool, Heart, Briefcase, Plus, FileDown, Settings, Image as ImageIcon } from 'lucide-react-native';

// Re-define DOCUMENT_MODES and EbookSettings/EbookState interfaces for the mobile app
interface DocumentMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  placeholderPrompt: string;
}

const DOCUMENT_MODES: DocumentMode[] = [
  {
    id: 'ebook',
    name: 'Ebook',
    description: 'Professional educational content with chapters',
    icon: 'BookOpen',
    systemPrompt: `Create a professional ebook in markdown format about: {topic}. 
Include the following structure:
- A compelling title and subtitle
- Author information
- Table of contents with clickable links
- Executive summary or introduction
- At least 5-7 detailed chapters with:
  - Chapter titles and subtitles
  - Comprehensive content with examples
  - Bullet points and numbered lists where appropriate
  - Key takeaways or summaries
- Conclusion with actionable insights
- About the author section
- References or further reading (if applicable)
Format the markdown with proper headings (# ## ###), emphasis (*bold*, _italic_), lists, quotes, and other markdown syntax for professional presentation. Make the content engaging, informative, and well-structured for easy reading.
The content should be substantial enough for a professional ebook (aim for comprehensive coverage of the topic).`,
    placeholderPrompt: 'A comprehensive guide to digital marketing with 7 chapters covering SEO, social media, email marketing, and analytics'
  },
  {
    id: 'contract',
    name: 'Contract Template',
    description: 'Legal document templates with proper clauses',
    icon: 'FileText',
    systemPrompt: `Create a professional contract template in markdown format for: {topic}.
Include the following structure:
- Contract title and type
- Parties section (clearly defined)
- Recitals/Background section
- Terms and Conditions with numbered clauses:
  - Scope of work/services
  - Payment terms and schedule
  - Timeline and deliverables
  - Responsibilities of each party
  - Intellectual property rights
  - Confidentiality clauses
  - Termination conditions
  - Dispute resolution
  - Governing law
- Signature blocks
- Appendices/Exhibits (if needed)
Use clear, professional legal language while remaining accessible. Include placeholder text in [BRACKETS] for customizable fields. Format with proper headings, numbered sections, and bullet points for clarity.
Note: This template is for informational purposes and should be reviewed by legal counsel before use.`,
    placeholderPrompt: 'Freelance web development services contract with payment terms, deliverables, and intellectual property clauses'
  },
  {
    id: 'workbook',
    name: 'Workbook',
    description: 'Interactive exercises and learning activities',
    icon: 'PenTool',
    systemPrompt: `Create an interactive workbook in markdown format about: {topic}.
Include the following structure:
- Workbook title and learning objectives
- How to use this workbook section
- Multiple modules/sections with:
  - Learning objectives for each section
  - Brief instructional content
  - Hands-on exercises and activities
  - Reflection questions
  - Practice scenarios
  - Self-assessment checklists
  - Action planning templates
  - Progress tracking sections
- Answer keys or example responses
- Additional resources and next steps
- Progress tracking sheet
Format with clear headings, interactive elements like checkboxes (- [ ]), fill-in-the-blank sections with underscores, and plenty of white space for writing. Include practical exercises that readers can complete immediately.
Make it highly interactive and practical, focusing on application rather than just theory.`,
    placeholderPrompt: 'Personal productivity workbook with time management exercises, goal-setting templates, and habit tracking sheets'
  },
  {
    id: 'journal',
    name: 'Interactive Journal',
    description: 'Guided reflection and personal development',
    icon: 'Heart',
    systemPrompt: `Create an interactive journal in markdown format focused on: {topic}.
Include the following structure:
- Journal introduction and purpose
- How to use this journal effectively
- Daily/weekly reflection prompts organized by themes:
  - Morning intention setting
  - Evening reflection questions
  - Weekly review sections
  - Monthly goal assessment
- Guided exercises for:
  - Self-discovery questions
  - Gratitude practices
  - Goal visualization
  - Challenge reframing
  - Progress celebration
- Inspirational quotes and affirmations
- Tracking templates (mood, habits, goals)
- Milestone celebration pages
- Future self letters
Format with plenty of space for writing (use line breaks), inspiring headers, and a warm, encouraging tone. Include prompts that encourage deep reflection and personal growth.
Make it feel personal, supportive, and transformative - like having a wise friend guide the journey.`,
    placeholderPrompt: 'Mindfulness and gratitude journal with daily reflection prompts, mood tracking, and personal growth exercises'
  },
  {
    id: 'proposal',
    name: 'Business Proposal',
    description: 'Professional project and business proposals',
    icon: 'Briefcase',
    systemPrompt: `Create a professional business proposal in markdown format for: {topic}.
Include the following structure:
- Executive Summary
- Company/Individual Background
- Problem Statement and Needs Analysis
- Proposed Solution with:
  - Detailed approach and methodology
  - Project timeline and milestones
  - Deliverables and outcomes
  - Team and resources
- Investment and Pricing:
  - Detailed cost breakdown
  - Payment schedule
  - Return on investment
- Implementation Plan
- Risk Assessment and Mitigation
- Success Metrics and KPIs
- Terms and Conditions
- Next Steps and Call to Action
- Appendices (testimonials, case studies, etc.)
Use persuasive, professional language that demonstrates value and builds confidence. Include specific details, metrics, and benefits. Format with clear sections, bullet points, and tables where appropriate.
Make it compelling, comprehensive, and action-oriented to win the business.`,
    placeholderPrompt: 'Digital transformation consulting proposal for a mid-size company including strategy, implementation, and training phases'
  }
];

const COLOR_THEMES = {
  purple: {
    primary: '#8B5CF6', // purple-600
    secondary: '#A78BFA', // purple-400
    text: '#FFFFFF',
    background: 'rgba(0,0,0,0.7)',
    border: 'rgba(139,92,246,0.3)',
    shadow: 'rgba(139,92,246,0.1)',
  },
  blue: {
    primary: '#3B82F6', // blue-600
    secondary: '#60A5FA', // blue-400
    text: '#FFFFFF',
    background: 'rgba(0,0,0,0.7)',
    border: 'rgba(59,130,246,0.3)',
    shadow: 'rgba(59,130,246,0.1)',
  },
  green: {
    primary: '#22C55E', // green-600
    secondary: '#4ADE80', // green-400
    text: '#FFFFFF',
    background: 'rgba(0,0,0,0.7)',
    border: 'rgba(34,197,94,0.3)',
    shadow: 'rgba(34,197,94,0.1)',
  },
  red: {
    primary: '#EF4444', // red-500
    secondary: '#F87171', // red-400
    text: '#FFFFFF',
    background: 'rgba(0,0,0,0.7)',
    border: 'rgba(239,68,68,0.3)',
    shadow: 'rgba(239,68,68,0.1)',
  },
  indigo: {
    primary: '#6366F1', // indigo-500
    secondary: '#818CF8', // indigo-400
    text: '#FFFFFF',
    background: 'rgba(0,0,0,0.7)',
    border: 'rgba(99,102,241,0.3)',
    shadow: 'rgba(99,102,241,0.1)',
  },
  pink: {
    primary: '#EC4899', // pink-500
    secondary: '#F472B6', // pink-400
    text: '#FFFFFF',
    background: 'rgba(0,0,0,0.7)',
    border: 'rgba(236,72,153,0.3)',
    shadow: 'rgba(236,72,153,0.1)',
  },
};

interface EbookSettings {
  apiKey: string;
  prompt: string;
  logo: string | null;
  background: string | null;
  colorTheme: keyof typeof COLOR_THEMES; // Use keys of COLOR_THEMES
  documentMode: string;
}

interface EbookState {
  isGenerating: boolean;
  markdownContent: string;
  activeTab: 'preview' | 'editor';
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  error?: {
    message: string;
  };
}

const generateEbook = async (apiKey: string, prompt: string, systemPrompt?: string): Promise<string> => {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent?key=${apiKey}`;
  
  const fullPrompt = systemPrompt 
    ? systemPrompt.replace('{topic}', prompt)
    : `Create a professional ebook in markdown format about: ${prompt}. 
Include the following structure:
- A compelling title and subtitle
- Author information
- Table of contents with clickable links
- Executive summary or introduction
- At least 5-7 detailed chapters with:
  - Chapter titles and subtitles
  - Comprehensive content with examples
  - Bullet points and numbered lists where appropriate
  - Key takeaways or summaries
- Conclusion with actionable insights
- About the author section
- References or further reading (if applicable)
Format the markdown with proper headings (# ## ###), emphasis (*bold*, _italic_), lists, quotes, and other markdown syntax for professional presentation. Make the content engaging, informative, and well-structured for easy reading.
The content should be substantial enough for a professional ebook (aim for comprehensive coverage of the topic).`;

  const requestBody = {
    contents: [{
      parts: [{
        text: fullPrompt
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    }
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No content generated by the AI');
    }

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('API call failed:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to generate ebook content');
  }
};

const { width } = Dimensions.get('window');

const App: React.FC = () => {
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
    activeTab: 'preview'
  });

  const updateSettings = (newSettings: Partial<EbookSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const updateState = (newState: Partial<EbookState>) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  const currentMode = DOCUMENT_MODES.find(mode => mode.id === settings.documentMode) || DOCUMENT_MODES[0];

  const handleLogoUpload = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      updateSettings({ logo: `data:image/jpeg;base64,${result.assets[0].base64}` });
    }
  };

  const handleBackgroundUpload = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      updateSettings({ background: `data:image/jpeg;base64,${result.assets[0].base64}` });
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

    updateState({ isGenerating: true });
    
    try {
      const currentMode = DOCUMENT_MODES.find(mode => mode.id === settings.documentMode) || DOCUMENT_MODES[0];
      const content = await generateEbook(settings.apiKey, settings.prompt, currentMode.systemPrompt);
      updateState({ 
        markdownContent: content, 
        activeTab: 'preview',
        isGenerating: false 
      });
    } catch (error) {
      console.error('Error generating document:', error);
      alert(`Error generating document: ${error instanceof Error ? error.message : 'Unknown error'}`);
      updateState({ isGenerating: false });
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

    updateState({ 
      isGenerating: true,
      markdownContent: ''
    });
    
    try {
      const currentMode = DOCUMENT_MODES.find(mode => mode.id === settings.documentMode) || DOCUMENT_MODES[0];
      const content = await generateEbook(settings.apiKey, settings.prompt, currentMode.systemPrompt);
      updateState({ 
        markdownContent: content, 
        activeTab: 'preview',
        isGenerating: false 
      });
    } catch (error) {
      console.error('Error generating document:', error);
      alert(`Error generating document: ${error instanceof Error ? error.message : 'Unknown error'}`);
      updateState({ isGenerating: false });
    }
  };

  const handleExportMarkdown = async () => {
    if (!state.markdownContent || state.markdownContent.trim() === '') {
      alert('No content to export');
      return;
    }
    try {
      const fileUri = FileSystem.documentDirectory + '/generated-document.md';
      await FileSystem.writeAsStringAsync(fileUri, state.markdownContent);
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      console.error('Error exporting markdown:', error);
      alert('Failed to export markdown.');
    }
  };

  const cleanMarkdownContent = (content: string): string => {
    if (!content) return content;
    
    let cleaned = content.trim();
    
    const markdownBlockRegex = /```(?:markdown)?\s*([\s\S]*?)\s*```/i;
    const markdownMatch = cleaned.match(markdownBlockRegex);
    
    if (markdownMatch) {
      cleaned = markdownMatch[1].trim();
    } else {
      cleaned = cleaned
        .replace(/^.*?(?:here\s+is|okay,?\s*here\s+is).*?(?:ebook|guide|content).*?(?:formatted\s+in\s+markdown|in\s+markdown\s+format|as\s+requested)[:\.]?\s*/i, '')
        .replace(/^.*?formatted\s+in\s+markdown.*?[:\.]?\s*/i, '')
        .replace(/^.*?markdown\s+format.*?[:\.]?\s*/i, '')
        .trim();
    }
    
    if (cleaned && !cleaned.startsWith('#')) {
      const firstHeadingMatch = cleaned.match(/^.*?(#\s+.*)$/m);
      if (firstHeadingMatch) {
        cleaned = firstHeadingMatch[1] + cleaned.substring(firstHeadingMatch.index! + firstHeadingMatch[0].length);
      }
    }
    
    return cleaned;
  };

  const renderMarkdownHtml = (markdown: string) => {
    if (!markdown || markdown.trim() === '') {
      return `
        <div style="text-align: center; padding: 48px; color: #a0a0a0; font-family: sans-serif;">
          <p style="font-size: 1.25rem;">Your generated document will appear here</p>
          <p style="font-size: 0.875rem; margin-top: 8px;">Click "Generate Document" to create your content</p>
        </div>
      `;
    }
    try {
      const cleanedMarkdown = cleanMarkdownContent(markdown);
      const htmlContent = marked.parse(cleanedMarkdown);
      return htmlContent;
    } catch (error) {
      console.error('Error parsing markdown:', error);
      return `
        <div style="text-align: center; padding: 48px; color: #ef4444; font-family: sans-serif;">
          <p>Error rendering markdown content</p>
        </div>
      `;
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons = {
      BookOpen,
      FileText,
      PenTool,
      Heart,
      Briefcase
    };
    return icons[iconName as keyof typeof icons] || BookOpen;
  };

  const hasContent = state.markdownContent && state.markdownContent.trim() !== '';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Georgia', serif;
          line-height: 1.6;
          color: ${COLOR_THEMES[settings.colorTheme].text === '#FFFFFF' ? '#333' : COLOR_THEMES[settings.colorTheme].text};
          margin: 0;
          padding: 0;
          background-color: ${COLOR_THEMES[settings.colorTheme].background};
        }
        .document-container {
          background-color: ${COLOR_THEMES[settings.colorTheme].text === '#FFFFFF' ? 'rgba(255,255,255,0.9)' : 'white'};
          width: 100%; /* Ensure it takes full width of WebView */
          height: 100%; /* Ensure it takes full height of WebView */
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          box-sizing: border-box; /* Include padding in width/height */
        }
        h1, h2, h3, h4, h5, h6 {
          color: ${COLOR_THEMES[settings.colorTheme].primary};
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        h1 { font-size: 2.5em; }
        h2 { font-size: 2em; }
        h3 { font-size: 1.75em; }
        p { margin-bottom: 1em; }
        ul, ol { margin-bottom: 1em; padding-left: 20px; }
        li { margin-bottom: 0.5em; }
        blockquote {
          border-left: 4px solid ${COLOR_THEMES[settings.colorTheme].secondary};
          padding-left: 15px;
          color: ${COLOR_THEMES[settings.colorTheme].primary};
          font-style: italic;
          margin-bottom: 1em;
        }
        pre {
          background-color: ${COLOR_THEMES[settings.colorTheme].border};
          padding: 10px;
          border-radius: 5px;
          overflow-x: auto;
          margin-bottom: 1em;
        }
        code {
          font-family: 'Courier New', monospace;
          background-color: ${COLOR_THEMES[settings.colorTheme].border};
          padding: 2px 4px;
          border-radius: 3px;
        }
        img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 1em auto;
          border-radius: 5px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        a {
          color: ${COLOR_THEMES[settings.colorTheme].primary};
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
        hr {
          border: none;
          height: 2px;
          background: linear-gradient(90deg, transparent, ${COLOR_THEMES[settings.colorTheme].primary}, transparent);
          margin: 2.5rem 0;
          border-radius: 1px;
        }
        .logo-container {
          text-align: center;
          margin-bottom: 20px;
        }
        .logo {
          max-height: 80px;
          max-width: 192px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
          background: ${COLOR_THEMES[settings.colorTheme].text === '#FFFFFF' ? 'rgba(255,255,255,0.9)' : 'white'};
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        th {
          background: linear-gradient(135deg, ${COLOR_THEMES[settings.colorTheme].primary} 0%, ${COLOR_THEMES[settings.colorTheme].secondary} 100%);
          color: white;
          font-weight: 600;
          padding: 1rem;
          text-align: left;
          font-size: 1rem;
        }
        td {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid ${COLOR_THEMES[settings.colorTheme].border};
          color: ${COLOR_THEMES[settings.colorTheme].text === '#FFFFFF' ? '#333' : COLOR_THEMES[settings.colorTheme].text}; /* Dynamic color for readability */
          font-size: 1rem;
        }
        tbody tr:hover {
          background-color: ${COLOR_THEMES[settings.colorTheme].text === '#FFFFFF' ? '#f9fafb' : 'rgba(0,0,0,0.05)'}; /* Subtle hover effect */
        }
      </style>
    </head>
    <body>
      <div class="document-container">
        ${settings.logo ? `<div class="logo-container"><img src="${settings.logo}" class="logo" /></div>` : ''}
        ${renderMarkdownHtml(state.markdownContent)}
      </div>
    </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIconContainer}>
              <CloudLightning size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.headerTitle}>MonsoonDocs</Text>
            <Sparkles size={32} color="#A78BFA" />
          </View>
          <Text style={styles.headerSubtitle}>
            Create professional documents in minutes with AI-powered generation
          </Text>
          <Text style={styles.currentModeText}>
            Current Mode: <Text style={styles.currentModeName}>{currentMode.name}</Text> - {currentMode.description}
          </Text>

          {/* Main Content */}
          <View style={styles.mainContentCard}>
            {/* Settings Panel */}
            <View style={styles.settingsPanel}>
              <Text style={styles.settingsTitle}>
                <CloudLightning size={24} color="#A78BFA" /> Settings
              </Text>
              
              <View style={styles.settingSection}>
                <Text style={styles.settingLabel}>
                  {React.createElement(getIconComponent(currentMode.icon), { size: 16, color: '#A78BFA' })} Document Type
                </Text>
                <View style={styles.documentTypeSelectorContainer}>
                  {DOCUMENT_MODES.map((mode) => {
                    const IconComponent = getIconComponent(mode.icon);
                    const isSelected = settings.documentMode === mode.id;
                    return (
                      <TouchableOpacity
                        key={mode.id}
                        style={[
                          styles.documentTypeButton,
                          isSelected && styles.documentTypeButtonSelected,
                        ]}
                        onPress={() => updateSettings({ documentMode: mode.id })}
                      >
                        <IconComponent
                          size={32} // Increased icon size
                          color={isSelected ? COLOR_THEMES[settings.colorTheme].primary : '#D8B4FE80'}
                        />
                        <Text
                          style={[
                            styles.documentTypeButtonText,
                            isSelected && { color: COLOR_THEMES[settings.colorTheme].primary, fontWeight: '700' },
                          ]}
                        >
                          {mode.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.settingSection}>
                <Text style={styles.settingLabel}>
                  <Key size={16} color="#A78BFA" /> Google Gemini API Key
                </Text>
                <TextInput
                  secureTextEntry
                  value={settings.apiKey}
                  onChangeText={(text) => updateSettings({ apiKey: text })}
                  placeholder="Enter your API key"
                  placeholderTextColor="#A78BFA80"
                  style={styles.textInput}
                />
                <Text style={styles.helperText}>
                  Get your API key from{' '}
                  <Text style={styles.linkText} onPress={() => Linking.openURL('https://ai.google.dev/')}>
                    Google AI Studio
                  </Text>
                </Text>
              </View>

              <View style={styles.settingSection}>
                <Text style={styles.settingLabel}>
                  <MessageSquare size={16} color="#A78BFA" /> {currentMode.name} Topic
                </Text>
                <TextInput
                  multiline
                  numberOfLines={4}
                  value={settings.prompt}
                  onChangeText={(text) => updateSettings({ prompt: text })}
                  placeholder={currentMode.placeholderPrompt}
                  placeholderTextColor="#A78BFA80"
                  style={[styles.textInput, styles.textArea]}
                />
              </View>

              <View style={styles.settingSection}>
                <Text style={styles.settingLabel}>
                  <ImageIcon size={16} color="#A78BFA" /> Upload Logo (Optional)
                </Text>
                <TouchableOpacity onPress={handleLogoUpload} style={styles.uploadButton}>
                  <Text style={styles.uploadButtonText}>Choose Image</Text>
                </TouchableOpacity>
                {settings.logo && <Image source={{ uri: settings.logo }} style={styles.uploadedImage} />}
              </View>

              <View style={styles.settingSection}>
                <Text style={styles.settingLabel}>
                  <ImageIcon size={16} color="#A78BFA" /> Background Image (Optional)
                </Text>
                <TouchableOpacity onPress={handleBackgroundUpload} style={styles.uploadButton}>
                  <Text style={styles.uploadButtonText}>Choose Image</Text>
                </TouchableOpacity>
                {settings.background && <Image source={{ uri: settings.background }} style={styles.uploadedImage} />}
              </View>

              <View style={styles.settingSection}>
                <Text style={styles.settingLabel}>
                  <Palette size={16} color="#A78BFA" /> Color Theme
                </Text>
                <View style={styles.colorThemeSelectorContainer}>
                  {Object.entries(COLOR_THEMES).map(([key, value]) => {
                    const isSelected = settings.colorTheme === key;
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.colorSwatch,
                          { backgroundColor: value.primary },
                          isSelected && styles.colorSwatchSelected,
                        ]}
                        onPress={() => updateSettings({ colorTheme: key as keyof typeof COLOR_THEMES })}
                      />
                    );
                  })}
                </View>
              </View>

              <View style={styles.generationButtonsContainer}>
                <TouchableOpacity
                  onPress={hasContent ? handleGenerateNew : handleGenerate}
                  disabled={state.isGenerating}
                  style={[styles.generateButton, state.isGenerating && styles.generateButtonDisabled]}
                >
                  {state.isGenerating ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      {hasContent ? <Plus size={20} color="#FFFFFF" /> : <CloudLightning size={20} color="#FFFFFF" />}
                      <Text style={styles.generateButtonText}>
                        {hasContent ? `Generate New ${currentMode.name}` : `Generate ${currentMode.name}`}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {hasContent && !state.isGenerating && (
                  <TouchableOpacity
                    onPress={handleGenerate}
                    style={styles.continueButton}
                  >
                    <CloudLightning size={16} color="#FFFFFF" />
                    <Text style={styles.continueButtonText}>Continue/Extend Content</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Preview Panel */}
          <View style={styles.previewPanel}>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                onPress={() => updateState({ activeTab: 'preview' })}
                style={[styles.tabButton, state.activeTab === 'preview' && styles.tabButtonActive]}
              >
                <Eye size={16} color={state.activeTab === 'preview' ? '#A78BFA' : '#D8B4FE80'} />
                <Text style={[styles.tabButtonText, state.activeTab === 'preview' && styles.tabButtonTextActive]}>
                  Preview
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => updateState({ activeTab: 'editor' })}
                style={[styles.tabButton, state.activeTab === 'editor' && styles.tabButtonActive]}
              >
                <Edit3 size={16} color={state.activeTab === 'editor' ? '#A78BFA' : '#D8B4FE80'} />
                <Text style={[styles.tabButtonText, state.activeTab === 'editor' && styles.tabButtonTextActive]}>
                  Markdown Editor
                </Text>
              </TouchableOpacity>
            </View>

            {hasContent && (
              <View style={styles.downloadButtonsContainer}>
                <TouchableOpacity
                  onPress={handleExportMarkdown}
                  style={styles.downloadButton}
                >
                  <FileText size={16} color="#FFFFFF" />
                  <Text style={styles.downloadButtonText}>.md</Text>
                </TouchableOpacity>
                {/* PDF export is complex for RN, omitting for now */}
              </View>
            )}

            {state.activeTab === 'preview' ? (
              <View style={styles.ebookPreview}>
                <WebView
                  originWhitelist={['*']}
                  source={{ html: htmlContent }}
                  style={styles.webView}
                  containerStyle={styles.webViewContainer}
                />
              </View>
            ) : (
              <View style={styles.editorContainer}>
                <TextInput
                  multiline
                  value={state.markdownContent}
                  onChangeText={(text) => updateState({ markdownContent: text })}
                  style={styles.markdownEditor}
                  textAlignVertical="top"
                />
                <View style={styles.editorFooter}>
                  <Text style={styles.editorFooterText}>
                    Lines: {state.markdownContent.split('\n').length} | Characters: {state.markdownContent.length}
                  </Text>
                </View>
              </View>
            )}
          </View>
          </View>
          {/* Export Options */}
          <View style={styles.exportOptionsCard}>
            <Text style={styles.exportOptionsTitle}>
              <Download size={20} color="#A78BFA" /> Export Options
            </Text>
            <TouchableOpacity
              onPress={handleExportMarkdown}
              disabled={!hasContent}
              style={[styles.exportButton, !hasContent && styles.exportButtonDisabled]}
            >
              <FileText size={16} color="#FFFFFF" />
              <Text style={styles.exportButtonText}>Download Markdown (.md)</Text>
            </TouchableOpacity>
            <Text style={styles.exportHelperText}>
              PDF export is not directly supported in the mobile app yet.
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Powered by Google Gemini AI • Built with precision and care
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'black',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 32,
    backgroundColor: 'transparent', // Background handled by parent
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerIconContainer: {
    padding: 12,
    backgroundColor: '#8B5CF6', // purple-600
    borderRadius: 16,
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF', // Simulating gradient with white
    marginHorizontal: 12,
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#D8B4FE', // purple-200
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '300',
  },
  currentModeText: {
    fontSize: 16,
    color: '#C084FC', // purple-300
    textAlign: 'center',
    marginBottom: 24, // Reduced margin bottom
  },
  currentModeName: {
    fontWeight: '600',
    color: '#D8B4FE', // purple-200
  },
  mainContentCard: {
    backgroundColor: 'rgba(0,0,0,0.4)', // black/40
    borderRadius: 20, // Slightly smaller border radius
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)', // purple-500/20
    shadowColor: 'rgba(139,92,246,0.1)', // purple-500/10
    shadowOffset: { width: 0, height: 8 }, // Slightly smaller shadow offset
    shadowOpacity: 0.15, // Slightly less shadow opacity
    shadowRadius: 12, // Slightly smaller shadow radius
    elevation: 6, // Slightly less elevation
    padding: 20, // Reduced padding
    marginBottom: 24, // Reduced margin bottom
  },
  settingsPanel: {
    marginBottom: 24, // Reduced margin bottom for settings panel
  },
  settingsTitle: {
    fontSize: 20, // Slightly smaller title font size
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20, // Reduced margin bottom for settings title
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingSection: {
    marginBottom: 0, // Removed bottom margin for setting sections
  },
  settingLabel: {
    fontSize: 12, // Slightly smaller label font size
    fontWeight: '500',
    color: '#D8B4FE', // purple-200
    marginBottom: 5, // Reduced margin bottom for labels
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6, // Reduced gap
  },
  pickerContainer: {
    backgroundColor: 'rgba(0,0,0,0.5)', // black/50
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)', // purple-500/30
    ...Platform.select({
      ios: { overflow: 'hidden' },
      android: { backgroundColor: 'rgba(0,0,0,0.5)' },
    }),
  },
  picker: {
    height: 50,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.7)', // Slightly darker background for better contrast
    ...Platform.select({
      android: { color: '#FFFFFF' },
    }),
  },
  pickerItem: {
    ...Platform.select({
      android: { color: '#FFFFFF' }, // Ensure text color is white on Android
    }),
  },
  textInput: {
    width: '100%',
    paddingHorizontal: 12, // Reduced padding
    paddingVertical: 10, // Reduced padding
    backgroundColor: 'rgba(0,0,0,0.5)', // black/50
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)', // purple-500/30
    borderRadius: 10, // Slightly smaller border radius
    color: '#FFFFFF',
    fontSize: 14, // Slightly smaller font size
  },
  textArea: {
    height: 80, // Reduced height for text area
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 11, // Smaller font size
    color: '#C084FCB0', // purple-300/70
    marginTop: 3, // Reduced margin top
  },
  linkText: {
    color: '#A78BFA', // purple-400
    textDecorationLine: 'underline',
  },
  uploadButton: {
    backgroundColor: '#8B5CF6', // purple-600
    paddingVertical: 8, // Reduced padding
    paddingHorizontal: 12, // Reduced padding
    borderRadius: 10, // Slightly smaller border radius
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 13, // Slightly smaller font size
    fontWeight: '600',
  },
  uploadedImage: {
    width: '100%',
    height: 120, // Reduced height
    borderRadius: 10, // Slightly smaller border radius
    marginTop: 10, // Reduced margin top
    resizeMode: 'contain',
  },
  generationButtonsContainer: {
    marginTop: 20, // Reduced margin top
    gap: 10, // Reduced gap
  },
  generateButton: {
    width: '100%',
    backgroundColor: '#8B5CF6', // purple-600
    paddingVertical: 14, // Reduced padding
    paddingHorizontal: 20, // Reduced padding
    borderRadius: 14, // Slightly smaller border radius
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 8 }, // Slightly smaller shadow offset
    shadowOpacity: 0.2, // Slightly less shadow opacity
    shadowRadius: 8, // Slightly smaller shadow radius
    elevation: 4, // Slightly less elevation
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  generateButtonDisabled: {
    backgroundColor: '#6B21A8', // purple-800
    opacity: 0.7,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16, // Slightly smaller font size
    fontWeight: '600',
  },
  continueButton: {
    width: '100%',
    backgroundColor: '#4F46E5', // indigo-600
    paddingVertical: 10, // Reduced padding
    paddingHorizontal: 20, // Reduced padding
    borderRadius: 14, // Slightly smaller border radius
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 }, // Slightly smaller shadow offset
    shadowOpacity: 0.2, // Slightly less shadow opacity
    shadowRadius: 8, // Slightly smaller shadow radius
    elevation: 4, // Slightly less elevation
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 14, // Slightly smaller font size
    fontWeight: '600',
  },
  previewPanel: {
    flex: 1, /* Allow preview panel to take available height */
    backgroundColor: '#FFFFFF',
    borderRadius: 20, // Slightly smaller border radius
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)', // purple-500/20
    shadowColor: 'rgba(139,92,246,0.1)',
    shadowOffset: { width: 0, height: 8 }, // Slightly smaller shadow offset
    shadowOpacity: 0.15, // Slightly less shadow opacity
    shadowRadius: 12, // Slightly smaller shadow radius
    elevation: 6, // Slightly less elevation
    overflow: 'hidden',
    minHeight: 300, /* Ensure a minimum height for visibility */
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139,92,246,0.3)', // purple-500/30
    backgroundColor: '#F9FAFB', // gray-50
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#A78BFA', // purple-400
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#C084FCB0', // purple-300/70
  },
  tabButtonTextActive: {
    color: '#A78BFA', // purple-400
  },
  downloadButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 10, // Reduced padding
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  downloadButton: {
    backgroundColor: 'rgba(75,85,99,0.5)', // gray-700/50
    paddingVertical: 6, // Reduced padding
    paddingHorizontal: 12, // Reduced padding
    borderRadius: 6, // Slightly smaller border radius
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6, // Reduced gap
    borderWidth: 1,
    borderColor: 'rgba(75,85,99,0.3)', // gray-600/30
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 12, // Reduced font size
    fontWeight: '500',
  },
  ebookPreview: {
    flex: 1,
    backgroundColor: 'transparent', /* Changed to transparent */
    alignSelf: 'center', /* Center the preview horizontally */
    width: '90%', /* Use percentage for responsiveness */
    maxWidth: 600, /* Adjusted for a wider document preview on mobile */
    aspectRatio: 8.5 / 11, /* Standard letter paper aspect ratio for portrait */
    overflow: 'hidden',
    borderRadius: 10, /* Add some border radius to the inner preview */
    /* Removed marginVertical to reduce vertical spacing */
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: 'transparent', /* Changed to transparent */
  },
  editorContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  markdownEditor: {
    flex: 1,
    padding: 12, // Reduced padding
    fontSize: 13, // Reduced font size
    lineHeight: 20, // Reduced line height
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#333',
  },
  editorFooter: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB', // gray-200
    backgroundColor: '#F9FAFB', // gray-50
    alignItems: 'center',
  },
  editorFooterText: {
    fontSize: 12,
    color: '#6B7280', // gray-600
  },
  exportOptionsCard: {
    backgroundColor: 'rgba(0,0,0,0.4)', // black/40
    borderRadius: 20, // Slightly smaller border radius
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)', // purple-500/20
    shadowColor: 'rgba(139,92,246,0.1)', // purple-500/10
    shadowOffset: { width: 0, height: 8 }, // Slightly smaller shadow offset
    shadowOpacity: 0.15, // Slightly less shadow opacity
    shadowRadius: 12, // Slightly smaller shadow radius
    elevation: 6, // Slightly less elevation
    padding: 20, // Reduced padding
    marginBottom: 24, // Reduced margin bottom
  },
  exportOptionsTitle: {
    fontSize: 16, // Reduced font size
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12, // Reduced margin bottom
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exportButton: {
    backgroundColor: 'rgba(75,85,99,0.5)', // gray-700/50
    paddingVertical: 10, // Reduced padding
    paddingHorizontal: 14, // Reduced padding
    borderRadius: 14, // Slightly smaller border radius
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(75,85,99,0.3)', // gray-600/30
  },
  exportButtonDisabled: {
    opacity: 0.5,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 13, // Reduced font size
    fontWeight: '500',
  },
  exportHelperText: {
    fontSize: 11, // Reduced font size
    color: '#C084FCB0', // purple-300/70
    textAlign: 'center',
    marginTop: 10, // Reduced margin top
  },
  footer: {
    alignItems: 'center',
    marginBottom: 12, // Reduced margin bottom
  },
  footerText: {
    fontSize: 11, // Reduced font size
    color: '#C084FC80', // purple-300/60
  },
  documentTypeSelectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 0, // Reduced margin top
    marginBottom: 0,
    gap: 0,
  },
  documentTypeButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 16, // Increased padding
    paddingHorizontal: 0,
    borderRadius: 0,
    borderWidth: 0,
    alignItems: 'center',
    width: (width - 32) / 3,
    aspectRatio: 1,
    justifyContent: 'center',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  documentTypeButtonSelected: {
    borderColor: 'transparent',
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  documentTypeButtonText: {
    color: '#D8B4FE80',
    fontSize: 12, // Increased font size
    fontWeight: '500',
    marginTop: 8, // Adjusted margin top
    textAlign: 'center',
  },
  colorThemeSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
    paddingHorizontal: 10,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  colorSwatchSelected: {
    borderColor: '#FFFFFF', // White border for selected swatch
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
  },
});

export default App;

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

interface EbookSettings {
  apiKey: string;
  prompt: string;
  logo: string | null;
  background: string | null;
  colorTheme: string;
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
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f8f8f8;
        }
        .document-container {
          background-color: white;
          margin: 20px;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        h1, h2, h3, h4, h5, h6 {
          color: #222;
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
          border-left: 4px solid #ccc;
          padding-left: 15px;
          color: #666;
          font-style: italic;
          margin-bottom: 1em;
        }
        pre {
          background-color: #eee;
          padding: 10px;
          border-radius: 5px;
          overflow-x: auto;
          margin-bottom: 1em;
        }
        code {
          font-family: 'Courier New', monospace;
          background-color: #eee;
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
          color: #8b5cf6;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
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
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={settings.documentMode}
                    onValueChange={(itemValue: string) => updateSettings({ documentMode: itemValue })}
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                  >
                    {DOCUMENT_MODES.map((mode) => (
                      <Picker.Item key={mode.id} label={mode.name} value={mode.id} />
                    ))}
                  </Picker>
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
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={settings.colorTheme}
                    onValueChange={(itemValue: string) => updateSettings({ colorTheme: itemValue })}
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
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
    marginBottom: 32,
  },
  currentModeName: {
    fontWeight: '600',
    color: '#D8B4FE', // purple-200
  },
  mainContentCard: {
    backgroundColor: 'rgba(0,0,0,0.4)', // black/40
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)', // purple-500/20
    shadowColor: 'rgba(139,92,246,0.1)', // purple-500/10
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
    padding: 24,
    marginBottom: 32,
  },
  settingsPanel: {
    marginBottom: 32,
  },
  settingsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingSection: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D8B4FE', // purple-200
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickerContainer: {
    backgroundColor: 'rgba(0,0,0,0.5)', // black/50
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)', // purple-500/30
    // Removed overflow: 'hidden' to see if it helps with Android visibility
  },
  picker: {
    height: 50,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.7)', // Slightly darker background for better contrast
  },
  pickerItem: {
    color: '#FFFFFF', // Ensure text color is white
    // backgroundColor is not directly supported on Android for itemStyle, handled by picker
  },
  textInput: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.5)', // black/50
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)', // purple-500/30
    borderRadius: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#C084FCB0', // purple-300/70
    marginTop: 4,
  },
  linkText: {
    color: '#A78BFA', // purple-400
    textDecorationLine: 'underline',
  },
  uploadButton: {
    backgroundColor: '#8B5CF6', // purple-600
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  uploadedImage: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    marginTop: 12,
    resizeMode: 'contain',
  },
  generationButtonsContainer: {
    marginTop: 24,
    gap: 12,
  },
  generateButton: {
    width: '100%',
    backgroundColor: '#8B5CF6', // purple-600
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
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
    fontSize: 18,
    fontWeight: '600',
  },
  continueButton: {
    width: '100%',
    backgroundColor: '#4F46E5', // indigo-600
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  previewPanel: {
    height: 600, // Fixed height for preview/editor
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)', // purple-500/20
    shadowColor: 'rgba(139,92,246,0.1)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
    overflow: 'hidden',
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
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  downloadButton: {
    backgroundColor: 'rgba(75,85,99,0.5)', // gray-700/50
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(75,85,99,0.3)', // gray-600/30
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  ebookPreview: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    // Background image handled by WebView HTML
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  webViewContainer: {
    flex: 1,
  },
  editorContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  markdownEditor: {
    flex: 1,
    padding: 16,
    fontSize: 14,
    lineHeight: 22,
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
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)', // purple-500/20
    shadowColor: 'rgba(139,92,246,0.1)', // purple-500/10
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
    padding: 24,
    marginBottom: 32,
  },
  exportOptionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exportButton: {
    backgroundColor: 'rgba(75,85,99,0.5)', // gray-700/50
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
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
    fontSize: 14,
    fontWeight: '500',
  },
  exportHelperText: {
    fontSize: 12,
    color: '#C084FCB0', // purple-300/70
    textAlign: 'center',
    marginTop: 12,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#C084FC80', // purple-300/60
  },
});

export default App;

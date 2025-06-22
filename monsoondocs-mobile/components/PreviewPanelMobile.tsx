import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, ActivityIndicator, Image } from 'react-native'; // Added Image import
import { Eye, Edit3, Bold, Italic, List, Quote, Code, Heading1, Heading2, Heading3, Link, Image as ImageIcon, Save, Undo, Redo, Download, FileText, FileDown, Settings } from 'lucide-react-native'; // Use lucide-react-native
import { EbookSettings, EbookState } from './EbookGeneratorMobile'; // Import types from mobile component
import Markdown from 'react-native-markdown-display'; // Use react-native-markdown-display
import { marked } from 'marked'; // Import marked for HTML conversion
// Import mobile export libraries
import { captureRef } from 'react-native-view-shot'; // Use react-native-view-shot
import * as Sharing from 'expo-sharing'; // Use expo-sharing for potential sharing options
import * as FileSystem from 'expo-file-system'; // Use expo-file-system for temporary files
import * as ImagePicker from 'expo-image-picker'; // Import expo-image-picker

// Define the type for the ref that will be exposed to the parent
export interface PreviewPanelMobileRef {
  handleExportMarkdown: () => Promise<void>;
  handleExportPdf: () => Promise<void>; // Simplified PDF export, options handled by backend or default
  getHtmlContent: () => Promise<string>;
}

import { ThemeMode } from '../App'; // Import ThemeMode type

interface PreviewPanelMobileProps {
  settings: EbookSettings;
  state: EbookState;
  onStateChange: (state: Partial<EbookState>) => void;
  themeMode: ThemeMode; // Add themeMode prop
  isDownloading: boolean; // Add isDownloading prop
  // previewRef is now managed internally for ViewShot
}
const PreviewPanelMobile = React.forwardRef<PreviewPanelMobileRef, PreviewPanelMobileProps>((props, ref) => {
  const {
    settings,
    state,
    onStateChange,
    themeMode,
    isDownloading // Destructure isDownloading prop
  } = props; // Destructure props inside the function body

  // Internal ref for the ScrollView to capture with ViewShot
  const previewScrollViewRef = useRef<ScrollView>(null);

  const [showPdfOptions, setShowPdfOptions] = useState(false);
  // PDF options structure might need adjustment based on mobile library capabilities
  const [pdfOptions, setPdfOptions] = useState({
    orientation: 'portrait',
    format: 'letter', // Use string literal for format
    quality: 2 // Quality might not be directly supported or work differently
  });

  // State to track text input selection
  const [selectionRange, setSelectionRange] = useState({ start: 0, end: 0 });

  // No direct equivalent of marked.setOptions needed for react-native-markdown-display

  const switchTab = (tab: 'preview' | 'editor') => {
    onStateChange({ activeTab: tab });
  };

  const handleEditorChange = (value: string) => {
    onStateChange({ markdownContent: value });
  };

  const cleanMarkdownContent = (content: string): string => {
    if (!content) return content;

    let cleaned = content.trim();

    // First, check if the content contains a markdown code block
    const markdownBlockRegex = /```(?:markdown)?\s*([\sS]*?)\s*```/i;
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const markdownMatch = cleaned.match(markdownBlockRegex);

    if (markdownMatch) {
      // Extract content from the code block
      cleaned = markdownMatch[1].trim();
    } else {
      // Remove common AI response prefixes if no code block found
      cleaned = cleaned
        .replace(/^.*?(?:here\s+is|okay,?\s*here\s+is).*?(?:ebook|guide|content).*?(?:formatted\s+in\s+markdown|in\s+markdown\s+format|as\s+requested)[:.]?\s*/i, '')
        .replace(/^.*?formatted\s+in\s+markdown.*?[:.]?\s*/i, '')
        .replace(/^.*?markdown\s+format.*?[:.]?\s*/i, '')
        .trim();
    }

    // If the cleaned content still starts with non-markdown text, try to find the first heading
    if (cleaned && !cleaned.startsWith('#')) {
      const firstHeadingMatch = cleaned.match(/^.*?(#\s+.*)$/m);
      if (firstHeadingMatch) {
        cleaned = firstHeadingMatch[1] + cleaned.substring(firstHeadingMatch.index! + firstHeadingMatch[0].length);
      }
    }

    return cleaned;
  };

  // Markdown formatting helper functions - need to interact with RN TextInput ref
  const editorInputRef = useRef<TextInput>(null); // Ref for the TextInput

  const insertMarkdown = (before: string, after: string = '', placeholder: string = '') => {
    if (!editorInputRef.current) return;

    // Use selection state instead of trying to get it from ref
    const start = selectionRange.start;
    const end = selectionRange.end;
    const selectedText = state.markdownContent.substring(start, end);
    const replacement = before + (selectedText || placeholder) + after;

    const newContent =
      state.markdownContent.substring(0, start) +
      replacement +
      state.markdownContent.substring(end);

    // Update the state with the new content
    handleEditorChange(newContent);

    // Calculate the new cursor position
    const newCursorPosition = start + before.length + (selectedText || placeholder).length;

    // Update the selection in the TextInput
    // Using setNativeProps to update selection directly for better UX
    editorInputRef.current.setNativeProps({
      selection: { start: newCursorPosition, end: newCursorPosition },
    });
  };

  const formatButtons = [
    { icon: Heading1, action: () => insertMarkdown('# ', '', 'Heading 1'), title: 'Heading 1' },
    { icon: Heading2, action: () => insertMarkdown('## ', '', 'Heading 2'), title: 'Heading 2' },
    { icon: Heading3, action: () => insertMarkdown('### ', '', 'Heading 3'), title: 'Heading 3' },
    { icon: Bold, action: () => insertMarkdown('**', '**', 'bold text'), title: 'Bold' },
    { icon: Italic, action: () => insertMarkdown('*', '*', 'italic text'), title: 'Italic' },
    { icon: List, action: () => insertMarkdown('- ', '', 'List item'), title: 'Bullet List' },
    { icon: Quote, action: () => insertMarkdown('> ', '', 'Quote'), title: 'Quote' },
    { icon: Code, action: () => insertMarkdown('`', '`', 'code'), title: 'Inline Code' },
    { icon: Link, action: () => insertMarkdown('[', '](url)', 'link text'), title: 'Link' },
    { icon: ImageIcon, action: () => handleImageInsert(), title: 'Image' },
  ];

  const handleImageInsert = () => {
    insertMarkdown('![', '](image-url.jpg)', 'alt text');
  };

  // Implement mobile markdown export using expo-sharing or similar
  const handleExportMarkdown = async () => {
     if (!state.markdownContent || state.markdownContent.trim() === '') {
      alert('No content to export');
      return;
    }
    const fileUri = FileSystem.documentDirectory + 'document.md';
    try {
      await FileSystem.writeAsStringAsync(fileUri, state.markdownContent);
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      console.error('Error exporting markdown:', error);
      alert(`Error exporting markdown: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Implement mobile PDF export using the backend service
  const handleExportPdf = async () => {
    // Reason: Prevent multiple downloads and indicate process.
    if (!previewScrollViewRef.current || isDownloading) { // Use isDownloading prop
      return;
    }

    // Note: isDownloading state is managed by the parent (EbookGeneratorMobile)
    // onStateChange({ isDownloading: true }); // This should be called by the parent

    // Reason: Construct HTML content with styling to match web version PDF output.
    const cleanedMarkdown = cleanMarkdownContent(state.markdownContent);
    const markdownHtml = await Promise.resolve(marked.parse(cleanedMarkdown));

    // Basic styling to mimic web version PDF appearance
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
      <title>Generated Document</title>
      <style>
        body { margin: 0; padding: 0; font-family: 'Georgia', 'Times New Roman', serif; color: ${themeMode === 'light' ? '#000000' : '#FFFFFF'}; }
        .ebook-preview {
          /* Styles for the main container */
        }
        .document-container {
          width: 612px; /* Equivalent to Letter Portrait width at 72 DPI */
          margin: 32px; /* Equivalent to m-8 */
          padding: 48px; /* Equivalent to p-12 */
          background-color: white;
          border-radius: 16px; /* Equivalent to rounded-xl */
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); /* Equivalent to shadow-lg */
          overflow: hidden;
          ${settings.background ? `background-image: url(${settings.background}); background-size: cover; background-position: center;` : ''}
        }
        /* Basic markdown styling to mimic web */
        h1 { font-size: 32px; margin-top: 16px; margin-bottom: 8px; font-weight: bold; color: ${themeMode === 'light' ? '#000000' : '#FFFFFF'}; }
        h2 { font-size: 24px; margin-top: 12px; margin-bottom: 6px; font-weight: bold; color: ${themeMode === 'light' ? '#000000' : '#FFFFFF'}; }
        h3 { font-size: 18px; margin-top: 10px; margin-bottom: 5px; font-weight: bold; color: ${themeMode === 'light' ? '#000000' : '#FFFFFF'}; }
        p { font-size: 16px; line-height: 1.6; margin-bottom: 12px; color: ${themeMode === 'light' ? '#000000' : '#FFFFFF'}; }
        strong { font-weight: bold; }
        em { font-style: italic; }
        ul { margin-bottom: 12px; padding-left: 20px; }
        li { margin-bottom: 4px; color: ${themeMode === 'light' ? '#000000' : '#FFFFFF'}; }
        blockquote { border-left: 4px solid #e0e0e0; padding-left: 8px; margin-bottom: 12px; color: #787774; } /* Using light mode colors for now */
        code { background-color: #ebeced; padding: 2px 4px; border-radius: 4px; font-family: monospace; color: ${themeMode === 'light' ? '#000000' : '#FFFFFF'}; }
        pre { background-color: #ebeced; padding: 8px; border-radius: 4px; overflow-x: auto; color: ${themeMode === 'light' ? '#000000' : '#FFFFFF'}; }
        a { color: #0a85d1; text-decoration: underline; }
        img { max-width: 100%; height: auto; display: block; margin: 12px auto; } /* Center images */
        .logo-container { text-align: center; margin-bottom: 32px; }
        .logo-img { max-height: 80px; max-width: 192px; display: inline-block; } /* Inline-block to center */
      </style>
      </head>
      <body>
        <div class="ebook-preview">
          <div class="document-container">
            ${settings.logo ? `<div class="logo-container" style="margin-bottom: 32px;"><img src="${settings.logo}" alt="Document Logo" class="logo-img"/></div>` : ''}
            <div class="ebook-content">
              ${markdownHtml}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Reason: Placeholder URL for the backend PDF service.
    // This should be replaced with an environment variable or config.
    // This should be replaced with an environment variable or config.
    const backendUrl = 'htmlpdf-production.up.railway.app/generate_pdf';

    try {
      // Reason: Send HTML content to the backend for PDF generation.
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/pdf',
        },
        body: JSON.stringify({ html_content: htmlContent }),
      });

      if (!response.ok) {
        // Reason: Handle non-successful HTTP responses.
        const errorText = await response.text();
        console.error('Failed to generate PDF:', response.status, response.statusText, errorText);
        // onStateChange({ isDownloading: false }); // This should be called by the parent
        alert(`Failed to generate PDF: ${response.status} ${response.statusText} ${errorText}`);
        return;
      }

      // Reason: Receive PDF bytes and trigger download/sharing.
      const pdfBlob = await response.blob();
      const fileReader = new FileReader();
      fileReader.onload = async () => {
        const base64Data = fileReader.result as string;
        const fileUri = FileSystem.documentDirectory + 'document.pdf';
        await FileSystem.writeAsStringAsync(fileUri, base64Data.split(',')[1], { encoding: FileSystem.EncodingType.Base64 });
        await Sharing.shareAsync(fileUri);
      };
      fileReader.readAsDataURL(pdfBlob);


    } catch (error) {
      // Reason: Log and handle any errors during the fetch operation.
      console.error('Error during PDF download:', error);
      alert(`Error during PDF download: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Reason: Reset downloading state regardless of success or failure.
      // onStateChange({ isDownloading: false }); // This should be called by the parent
    }
  };

  // Expose the export functions via the ref
  const getHtmlContent = async () => {
    const cleanedMarkdown = cleanMarkdownContent(state.markdownContent);
    const markdownHtml = await Promise.resolve(marked.parse(cleanedMarkdown));

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
      <title>Generated Document</title>
      <style>
        body { margin: 0; padding: 0; font-family: 'Georgia', 'Times New Roman', serif; color: ${themeMode === 'light' ? '#000000' : '#FFFFFF'}; }
        .ebook-preview {
          /* Styles for the main container */
        }
        .document-container {
          width: 612px; /* Equivalent to Letter Portrait width at 72 DPI */
          margin: 32px; /* Equivalent to m-8 */
          padding: 48px; /* Equivalent to p-12 */
          background-color: white;
          border-radius: 16px; /* Equivalent to rounded-xl */
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); /* Equivalent to shadow-lg */
          overflow: hidden;
          ${settings.background ? `background-image: url(${settings.background}); background-size: cover; background-position: center;` : ''}
        }
        /* Basic markdown styling to mimic web */
        h1 { font-size: 32px; margin-top: 16px; margin-bottom: 8px; font-weight: bold; color: ${themeMode === 'light' ? '#000000' : '#FFFFFF'}; }
        h2 { font-size: 24px; margin-top: 12px; margin-bottom: 6px; font-weight: bold; color: ${themeMode === 'light' ? '#000000' : '#FFFFFF'}; }
        h3 { font-size: 18px; margin-top: 10px; margin-bottom: 5px; font-weight: bold; color: ${themeMode === 'light' ? '#000000' : '#FFFFFF'}; }
        p { font-size: 16px; line-height: 1.6; margin-bottom: 12px; color: ${themeMode === 'light' ? '#000000' : '#FFFFFF'}; }
        strong { font-weight: bold; }
        em { font-style: italic; }
        ul { margin-bottom: 12px; padding-left: 20px; }
        li { margin-bottom: 4px; color: ${themeMode === 'light' ? '#000000' : '#FFFFFF'}; }
        blockquote { border-left: 4px solid #e0e0e0; padding-left: 8px; margin-bottom: 12px; color: #787774; } /* Using light mode colors for now */
        code { background-color: #ebeced; padding: 2px 4px; border-radius: 4px; font-family: monospace; color: ${themeMode === 'light' ? '#000000' : '#FFFFFF'}; }
        pre { background-color: #ebeced; padding: 8px; border-radius: 4px; overflow-x: auto; color: ${themeMode === 'light' ? '#000000' : '#FFFFFF'}; }
        a { color: #0a85d1; text-decoration: underline; }
        img { max-width: 100%; height: auto; display: block; margin: 12px auto; } /* Center images */
        .logo-container { text-align: center; margin-bottom: 32px; }
        .logo-img { max-height: 80px; max-width: 192px; display: inline-block; } /* Inline-block to center */
      </style>
      </head>
      <body>
        <div class="ebook-preview">
          <div class="document-container">
            ${settings.logo ? `<div class="logo-container" style="margin-bottom: 32px;"><img src="${settings.logo}" alt="Document Logo" class="logo-img"/></div>` : ''}
            <div class="ebook-content">
              ${markdownHtml}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return htmlContent;
  };

  React.useImperativeHandle(ref, () => ({
    handleExportMarkdown,
    handleExportPdf,
    getHtmlContent,
  }));

  // Test markdown for when no content exists
  const testMarkdown = `# Test Heading
## Subheading
This is **bold text** and *italic text*.

### List Example:
- Item one
- Item two
- Item three

> This is a blockquote

Regular paragraph text here.`;

  const hasContent = state.markdownContent && state.markdownContent.trim() !== '';

  // Define theme-dependent styles for markdown
  const markdownStyles = StyleSheet.create({
    heading1: {
      fontSize: 32,
      fontWeight: 'bold',
      marginTop: 16,
      marginBottom: 8,
      color: themeMode === 'light' ? '#37352F' : '#EBECEB',
    },
    heading2: {
      fontSize: 24,
      fontWeight: 'bold',
      marginTop: 12,
      marginBottom: 6,
      color: themeMode === 'light' ? '#37352F' : '#EBECEB',
    },
    heading3: {
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 10,
      marginBottom: 5,
      color: themeMode === 'light' ? '#37352F' : '#EBECEB',
    },
    body: {
      fontSize: 16,
      lineHeight: 24,
      marginBottom: 12,
      color: themeMode === 'light' ? '#000000' : '#FFFFFF',
    },
    strong: {
      fontWeight: 'bold',
      color: themeMode === 'light' ? '#000000' : '#FFFFFF',
    },
    em: {
      fontStyle: 'italic',
      color: themeMode === 'light' ? '#000000' : '#FFFFFF',
    },
    list_item: {
      marginBottom: 4,
      marginLeft: 20,
      color: themeMode === 'light' ? '#000000' : '#FFFFFF',
    },
    blockquote: {
      borderLeftWidth: 4,
      borderLeftColor: themeMode === 'light' ? '#E0E0E0' : '#555555',
      paddingLeft: 8,
      marginBottom: 12,
      color: themeMode === 'light' ? '#787774' : '#B4B4B4',
    },
    code_inline: {
      backgroundColor: themeMode === 'light' ? '#EBECED' : '#454B4E',
      paddingHorizontal: 4,
      borderRadius: 4,
      fontFamily: 'monospace',
      color: themeMode === 'light' ? '#37352F' : '#EBECEB',
    },
    link: {
      color: themeMode === 'light' ? '#0A85D1' : '#a78bfa',
      textDecorationLine: 'underline',
    },
    image: {
      width: '100%',
      height: 200,
      resizeMode: 'contain',
      marginVertical: 12,
    },
    br: { // Adding style for line breaks
      marginBottom: 24, // Adjust height as needed
    }
  });


  // Define theme-dependent styles for the component
  const previewContainerBackgroundColor = themeMode === 'light' ? '#FFFFFF' : '#3A3A3A'; // White vs Dark gray
  const previewContainerBorderColor = themeMode === 'light' ? '#E0E0E0' : '#555555'; // Light gray vs Medium gray
  const previewContentBoxBackgroundColor = themeMode === 'light' ? '#FFFFFF' : '#3A3A3A'; // White vs Dark gray
  const previewContentBoxShadowColor = themeMode === 'light' ? '#000' : '#FFF'; // Black vs White for shadow
  const noContentTextPrimaryColor = themeMode === 'light' ? '#37352F' : '#EBECEB'; // Dark gray vs Light gray
  const noContentTextSecondaryColor = themeMode === 'light' ? '#787774' : '#B4B4B4'; // Medium gray vs Lighter gray
  const editorContainerBackgroundColor = themeMode === 'light' ? '#FFFFFF' : '#3A3A3A'; // White vs Dark gray
  const editorContainerBorderColor = themeMode === 'light' ? '#E0E0E0' : '#555555'; // Light gray vs Medium gray
  const editorToolbarBackgroundColor = themeMode === 'light' ? '#EBECED' : '#454B4E'; // Light gray vs Darker gray
  const editorToolbarBorderColor = themeMode === 'light' ? '#E0E0E0' : '#555555'; // Light gray vs Medium gray
  const editorToolbarButtonBackgroundColor = themeMode === 'light' ? '#FFFFFF' : '#3A3A3A'; // White vs Dark gray
  const editorToolbarButtonBorderColor = themeMode === 'light' ? '#C4C4C4' : '#6C7275'; // Light gray vs Medium gray
  const editorToolbarButtonIconColor = themeMode === 'light' ? '#4b5563' : '#B4B4B4'; // Gray-700 vs Lighter gray
  const editorToolbarDividerColor = themeMode === 'light' ? '#C4C4C4' : '#6C7275'; // Light gray vs Medium gray
  const editorInputColor = themeMode === 'light' ? '#37352F' : '#EBECEB'; // Dark gray vs Light gray
  const editorFooterBackgroundColor = themeMode === 'light' ? '#EBECED' : '#454B4E'; // Light gray vs Darker gray
  const editorFooterBorderColor = themeMode === 'light' ? '#E0E0E0' : '#555555'; // Light gray vs Medium gray
  const editorFooterTextcolor = themeMode === 'light' ? '#787774' : '#B4B4B4'; // Medium gray vs Lighter gray
  const tabBarBorderColor = themeMode === 'light' ? '#E0E0E0' : '#555555'; // Light gray vs Medium gray
  const tabButtonActiveBorderColor = themeMode === 'light' ? '#0A85D1' : '#5E9ED6'; // Notion blue vs Lighter blue
  const tabButtonTextActiveColor = themeMode === 'light' ? '#37352F' : '#EBECEB'; // Dark gray vs Light gray
  const tabButtonTextInactiveColor = themeMode === 'light' ? '#787774' : '#B4B4B4'; // Medium gray vs Lighter gray
  const downloadButtonBackgroundColor = themeMode === 'light' ? '#EBECED' : '#454B4E'; // Light gray vs Darker gray
  const downloadButtonBorderColor = themeMode === 'light' ? '#C4C4C4' : '#6C7275'; // Light gray vs Medium gray
  const downloadButtonTextcolor = themeMode === 'light' ? '#37352F' : '#EBECEB'; // Dark gray vs Light gray
  const downloadButtonDisabledBackgroundColor = themeMode === 'light' ? '#C4C4C4' : '#6C7275'; // Light gray vs Medium gray
  const pdfOptionsDropdownBackgroundColor = themeMode === 'light' ? '#FFFFFF' : '#3A3A3A'; // White vs Dark gray
  const pdfOptionsDropdownBorderColor = themeMode === 'light' ? '#E0E0E0' : '#555555'; // Light gray vs Medium gray
  const pdfOptionsDropdownShadowColor = themeMode === 'light' ? '#000' : '#FFF'; // Black vs White for shadow
  const pdfOptionsTitleColor = themeMode === 'light' ? '#37352F' : '#EBECEB'; // Dark gray vs Light gray
  const pdfOptionLabelColor = themeMode === 'light' ? '#787774' : '#B4B4B4'; // Medium gray vs Lighter gray
  const pdfOptionButtonBackgroundColor = themeMode === 'light' ? '#EBECED' : '#454B4E'; // Light gray vs Darker gray
  const pdfOptionButtonBorderColor = themeMode === 'light' ? '#E0E0E0' : '#555555'; // Light gray vs Medium gray
  const pdfOptionButtonActiveBackgroundColor = themeMode === 'light' ? '#0A85D1' : '#5E9ED6'; // Notion blue vs Lighter blue
  const pdfOptionButtonActiveBorderColor = themeMode === 'light' ? '#0A85D1' : '#5E9ED6'; // Notion blue vs Lighter blue
  const pdfOptionButtonTextcolor = themeMode === 'light' ? '#37352F' : '#EBECEB'; // Dark gray vs Light gray
  const pdfOptionButtonTextActiveColor = themeMode === 'light' ? '#FFFFFF' : '#37352F'; // White vs Dark gray
  const pdfOptionTextInputBackgroundColor = themeMode === 'light' ? '#F7F6F3' : '#454B4E'; // Light background vs Darker gray
  const pdfOptionTextInputColor = themeMode === 'light' ? '#37352F' : '#EBECEB'; // Dark gray vs Light gray
  const pdfOptionActionsBorderColor = themeMode === 'light' ? '#E0E0E0' : '#555555'; // Light gray vs Medium gray
  const pdfOptionActionButtonPrimaryBackgroundColor = themeMode === 'light' ? '#0A85D1' : '#5E9ED6'; // Notion blue vs Lighter blue
  const pdfOptionActionButtonSecondaryBackgroundColor = themeMode === 'light' ? '#EBECED' : '#454B4E'; // Light gray vs Darker gray
  const pdfOptionActionButtonSecondaryBorderColor = themeMode === 'light' ? '#C4C4C4' : '#6C7275'; // Light gray vs Medium gray
  const pdfOptionActionButtonTextcolor = themeMode === 'light' ? '#FFFFFF' : '#37352F'; // White vs Dark gray
  const pdfOptionQuickExportBorderColor = themeMode === 'light' ? '#E0E0E0' : '#555555'; // Light gray vs Medium gray
  const pdfOptionQuickExportTextcolor = themeMode === 'light' ? '#787774' : '#B4B4B4'; // Medium gray vs Lighter gray
  const pdfOptionButtonQuickBackgroundColor = themeMode === 'light' ? '#EBECED' : '#454B4E'; // Light gray vs Darker gray
  const pdfOptionButtonQuickBorderColor = themeMode === 'light' ? '#E0E0E0' : '#555555'; // Light gray vs Medium gray
  const pdfOptionButtonQuickTextcolor = themeMode === 'light' ? '#37352F' : '#EBECEB'; // Dark gray vs Light gray

  // Define shadow colors based on theme
  const previewContainerShadowColor = themeMode === 'light' ? '#000' : '#FFF'; // Black vs White for shadow
  const editorContainerShadowColor = themeMode === 'light' ? '#000' : '#FFF'; // Black vs White for shadow


  const styles = StyleSheet.create({
    container: {
      flex: 1,
      // height: '100%', // h-full equivalent
    },
    previewBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
      // resizeMode: 'cover', // Already set in Image component
    },
    tabBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomColor: tabBarBorderColor,
      borderBottomWidth: 1,
      marginBottom: 24, // mb-6 equivalent
    },
    tabButtonsContainer: {
      flexDirection: 'row',
    },
    tabButton: {
      paddingHorizontal: 24, // px-6 equivalent
      paddingVertical: 12, // py-3 equivalent
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8, // gap-2 equivalent
      // transitionDuration: 200, // transition-all duration-200 - Removed for React Native
    },
    tabButtonActive: {
      borderBottomColor: tabButtonActiveBorderColor,
      borderBottomWidth: 2,
    },
    tabButtonInactive: {
      // No specific inactive border
    },
    tabButtonText: {
      fontSize: 14, // text-sm equivalent
      fontWeight: '500', // font-medium equivalent
    },
    tabButtonTextActive: {
      color: tabButtonTextActiveColor,
    },
    tabButtonTextInactive: {
      color: tabButtonTextInactiveColor,
    },
    downloadButtonsContainer: {
      flexDirection: 'row',
      gap: 8, // gap-2 equivalent
      position: 'relative', // For PDF options dropdown positioning
    },
    downloadButtonMarkdown: {
      paddingHorizontal: 16, // px-4 equivalent
      paddingVertical: 8, // py-2 equivalent
      backgroundColor: downloadButtonBackgroundColor,
      borderColor: downloadButtonBorderColor,
      borderWidth: 1,
      borderRadius: 4, // rounded equivalent
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8, // gap-2 equivalent
      // transitionDuration: 200, // Needs removal - Removed for React Native
    },
    downloadButtonPdf: {
      paddingHorizontal: 16, // px-4 equivalent
      paddingVertical: 8, // py-2 equivalent
      backgroundColor: downloadButtonBackgroundColor,
      borderColor: downloadButtonBorderColor,
      borderWidth: 1,
      borderRadius: 4, // rounded equivalent
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8, // gap-2 equivalent
      // transitionDuration: 200, // Needs removal - Removed for React Native
    },
    downloadButtonText: {
      color: downloadButtonTextcolor,
      fontWeight: '500', // font-medium equivalent
      fontSize: 14, // text-sm equivalent
    },
    pdfExportContainer: {
      position: 'relative',
    },
    pdfOptionsDropdown: {
      position: 'absolute',
      right: 0,
      top: '100%', // top-full equivalent
      marginTop: 8, // mt-2 equivalent
      backgroundColor: pdfOptionsDropdownBackgroundColor,
      borderColor: pdfOptionsDropdownBorderColor,
      borderWidth: 1,
      borderRadius: 8, // rounded-lg equivalent
      // Shadow needs platform-specific styles
      shadowColor: pdfOptionsDropdownShadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2, // Android shadow
      zIndex: 50,
      padding: 16, // p-4 equivalent
      minWidth: 256, // min-w-64 equivalent
    },
    pdfOptionsTitle: {
      color: pdfOptionsTitleColor,
      fontWeight: '500', // font-medium equivalent
      fontSize: 14, // text-sm equivalent
      marginBottom: 16, // mb-4 equivalent
    },
    pdfOptionSection: {
      marginBottom: 16, // space-y-4 equivalent
    },
    pdfOptionButtons: {
      flexDirection: 'row', // grid grid-cols-2 equivalent (using flex for layout)
      gap: 8, // gap-2 equivalent
    },
    pdfOptionButton: {
      flex: 1, // To make buttons take equal width
      paddingHorizontal: 12, // px-3 equivalent
      paddingVertical: 8, // py-2 equivalent
      borderRadius: 4, // rounded equivalent
      // transitionDuration: 200, // Needs removal
      alignItems: 'center', // Center text
      borderWidth: 1,
      borderColor: pdfOptionButtonBorderColor,
      backgroundColor: pdfOptionButtonBackgroundColor,
    },
    pdfOptionButtonActive: {
      backgroundColor: pdfOptionButtonActiveBackgroundColor,
      borderColor: pdfOptionButtonActiveBorderColor,
    },
    pdfOptionButtonText: {
      fontSize: 12, // text-xs equivalent
      color: pdfOptionButtonTextcolor,
    },
    pdfOptionButtonTextActive: {
      color: pdfOptionButtonTextActiveColor,
    },
    pdfOptionTextInput: {
      width: '100%',
      paddingHorizontal: 12, // px-3 equivalent
      paddingVertical: 8, // py-2 equivalent
      backgroundColor: pdfOptionTextInputBackgroundColor,
      color: pdfOptionTextInputColor,
      fontSize: 12, // text-xs equivalent
      borderRadius: 4, // rounded equivalent
      borderColor: pdfOptionsDropdownBorderColor,
      borderWidth: 1,
      // focus styles need custom handling
    },
    pdfOptionActions: {
      flexDirection: 'row', // flex equivalent
      gap: 8, // gap-2 equivalent
      paddingTop: 8, // pt-2 equivalent
      borderTopColor: pdfOptionActionsBorderColor,
      borderTopWidth: 1,
    },
    pdfOptionActionButton: {
      flex: 1, // flex-1 equivalent
      paddingHorizontal: 12, // px-3 equivalent
      paddingVertical: 8, // py-2 equivalent
      borderRadius: 4, // rounded equivalent
      // transitionDuration: 200, // Needs removal
      alignItems: 'center', // Center text
    },
    pdfOptionActionButtonPrimary: {
      backgroundColor: pdfOptionActionButtonPrimaryBackgroundColor,
    },
    pdfOptionActionButtonSecondary: {
      backgroundColor: pdfOptionActionButtonSecondaryBackgroundColor,
      borderColor: pdfOptionActionButtonSecondaryBorderColor,
      borderWidth: 1, // Ensure border is applied
    },
    pdfOptionActionButtonText: {
      color: pdfOptionActionButtonTextcolor,
      fontSize: 12, // text-xs equivalent
    },
    pdfOptionQuickExport: {
      paddingTop: 8, // pt-2 equivalent
      borderTopColor: pdfOptionQuickExportBorderColor,
      borderTopWidth: 1,
    },
    pdfOptionQuickExportText: {
      fontSize: 12, // text-xs equivalent
      color: pdfOptionQuickExportTextcolor,
      marginBottom: 8, // mb-2 equivalent
    },
    pdfOptionButtonQuick: {
      flex: 1, // To make buttons take equal width
      paddingHorizontal: 8, // px-2 equivalent
      paddingVertical: 4, // py-1 equivalent
      borderRadius: 4, // rounded equivalent
      // transitionDuration: 200, // Needs removal
      alignItems: 'center', // Center text
      borderWidth: 1,
      borderColor: pdfOptionButtonQuickBorderColor,
      backgroundColor: pdfOptionButtonQuickBackgroundColor,
    },
    pdfOptionButtonQuickText: {
      fontSize: 12, // text-xs equivalent
      color: pdfOptionButtonQuickTextcolor,
    },
    pdfOptionsOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 40,
    },
    previewContainer: {
      minHeight: 600, // min-h-[600px] equivalent
      backgroundColor: previewContainerBackgroundColor,
      borderColor: previewContainerBorderColor,
      borderWidth: 1,
      borderRadius: 16, // rounded-2xl equivalent
      overflow: 'hidden',
      shadowColor: previewContainerShadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5, // Android shadow
    },
    previewContentContainer: {
      // Add padding or margin here if needed for content inside ScrollView
    },
    previewContentBox: {
      backgroundColor: previewContentBoxBackgroundColor,
      margin: 32, // m-8 equivalent
      borderRadius: 16, // rounded-xl equivalent
      shadowColor: previewContentBoxShadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5, // Android shadow
      overflow: 'hidden',
      paddingTop: 80, // p-12 equivalent + extra padding
      paddingRight: 48, // p-12 equivalent
      paddingBottom: 48, // p-12 equivalent
      paddingLeft: 48, // p-12 equivalent
    },
    previewLogoContainer: {
      textAlign: 'center', // text-center equivalent
      marginBottom: 24, // mb-6 equivalent
    },
    previewLogo: {
      maxHeight: 80, // max-h-20 equivalent
      maxWidth: 192, // max-w-48 equivalent
      alignSelf: 'center', // mx-auto equivalent
      borderRadius: 8, // rounded-lg equivalent
      // Shadow needs platform-specific styles - Removed shadow for consistency
    },
    noContentContainer: {
      textAlign: 'center', // text-center equivalent
      paddingVertical: 48, // py-12 equivalent
    },
    noContentTextPrimary: {
      fontSize: 20, // text-xl equivalent
      color: noContentTextPrimaryColor,
    },
    noContentTextSecondary: {
      fontSize: 14, // text-sm equivalent
      color: noContentTextSecondaryColor,
      marginTop: 8, // mt-2 equivalent
    },
    editorContainer: {
      // height: 600, // h-[600px] equivalent
      backgroundColor: editorContainerBackgroundColor,
      borderColor: editorContainerBorderColor,
      borderWidth: 1,
      borderRadius: 8, // Slightly rounded corners
      overflow: 'hidden',
      // Shadow needs platform-specific styles
      shadowColor: editorContainerShadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2, // Android shadow
      flex: 1, // Allow editor to take available height
    },
    editorToolbar: {
      backgroundColor: editorToolbarBackgroundColor,
      borderBottomColor: editorToolbarBorderColor,
      borderBottomWidth: 1,
      padding: 12, // p-3 equivalent
    },
    editorToolbarButtons: {
      flexDirection: 'row', // flex equivalent
      flexWrap: 'wrap', // flex-wrap equivalent
      gap: 8, // gap-2 equivalent
    },
    editorToolbarButton: {
      padding: 8, // p-2 equivalent
      borderRadius: 4, // rounded equivalent
      backgroundColor: editorToolbarButtonBackgroundColor,
      borderColor: editorToolbarButtonBorderColor,
      borderWidth: 1,
      // transitionDuration: 200, // Needs removal
      // hover styles need custom handling
    },
    editorToolbarDivider: {
      width: 1, // w-px equivalent
      backgroundColor: editorToolbarDividerColor,
      marginHorizontal: 8, // mx-2 equivalent
    },
    editorInputContainer: {
      flex: 1, // Allow input to take available height
      // height: '100%', // h-[600px] equivalent - handled by flex: 1
    },
    editorInput: {
      flex: 1, // Take full height of container
      paddingHorizontal: 16, // padding: { top: 16, bottom: 16 } equivalent (approximate)
      paddingVertical: 16,
      fontSize: 14, // fontSize: 14 equivalent
      lineHeight: 22, // lineHeight: 1.6 equivalent (approximate)
      color: editorInputColor,
      // wordWrap: 'on' - handled by multiline
      // scrollBeyondLastLine: false - handled by ScrollView if needed
      // automaticLayout: true - handled by RN layout
      // fontFamily: "'JetBrains Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace", // Needs custom font loading
      // Other Monaco options need RN equivalents or are not applicable
    },
    editorFooter: {
      backgroundColor: editorFooterBackgroundColor,
      borderTopColor: editorFooterBorderColor,
      borderTopWidth: 1,
      padding: 12, // p-3 equivalent
      flexDirection: 'row', // flex equivalent
      justifyContent: 'space-between', // justify-between equivalent
      alignItems: 'center', // items-center equivalent
    },
    editorFooterStats: {
      flexDirection: 'row', // flex equivalent
      alignItems: 'center', // items-center equivalent
      gap: 16, // gap-4 equivalent
    },
    editorFooterText: {
      fontSize: 14, // text-sm equivalent
      color: editorFooterTextcolor,
    },
    editorFooterHelpText: {
      fontSize: 12, // text-xs equivalent
      color: editorFooterTextcolor,
    },
  });

  return (
    <View style={styles.container}>
      {/* Tab Navigation with Download Buttons */}
      <View style={styles.tabBar}>
        <View style={styles.tabButtonsContainer}>
          <Pressable
            onPress={() => switchTab('preview')}
            style={[
              styles.tabButton,
              state.activeTab === 'preview' ? styles.tabButtonActive : styles.tabButtonInactive
            ]}
          >
            <Eye size={16} color={state.activeTab === 'preview' ? tabButtonTextActiveColor : tabButtonTextInactiveColor} />
            <Text style={[styles.tabButtonText, state.activeTab === 'preview' ? styles.tabButtonTextActive : styles.tabButtonTextInactive]}>Preview</Text>
          </Pressable>
          <Pressable
            onPress={() => switchTab('editor')}
            style={[
              styles.tabButton,
              state.activeTab === 'editor' ? styles.tabButtonActive : styles.tabButtonInactive
            ]}
          >
            <Edit3 size={16} color={state.activeTab === 'editor' ? tabButtonTextActiveColor : tabButtonTextInactiveColor} />
            <Text style={[styles.tabButtonText, state.activeTab === 'editor' ? styles.tabButtonTextActive : styles.tabButtonTextInactive]}>Markdown Editor</Text>
          </Pressable>
        </View>

        {/* Download Buttons - Now handled by parent */}
        {/* {hasContent && (
          <View style={styles.downloadButtonsContainer}>
            <Pressable
              onPress={handleExportMarkdown}
              style={[styles.downloadButtonMarkdown, !hasContent && { backgroundColor: downloadButtonDisabledBackgroundColor, borderColor: downloadButtonDisabledBackgroundColor }]}
              disabled={!hasContent}
            >
              <FileText size={16} color={downloadButtonTextcolor} />
              <Text style={[styles.downloadButtonText, { color: downloadButtonTextcolor }]}>.md</Text>
            </Pressable>

            <View style={styles.pdfExportContainer}>
              <Pressable
                onPress={() => setShowPdfOptions(!showPdfOptions)}
                style={[styles.downloadButtonPdf, !hasContent && { backgroundColor: downloadButtonDisabledBackgroundColor, borderColor: downloadButtonDisabledBackgroundColor }]}
                disabled={!hasContent}
              >
                <FileDown size={16} color={downloadButtonTextcolor} />
                <Text style={[styles.downloadButtonText, { color: downloadButtonTextcolor }]}>.pdf</Text>
                <Settings size={12} color={downloadButtonTextcolor} />
              </Pressable>
            </View>
          </View>
        )} */}
      </View>

      {/* PDF Options Dropdown - Now handled by parent */}
      {/* {showPdfOptions && (
        <View style={[styles.pdfOptionsDropdown, { backgroundColor: pdfOptionsDropdownBackgroundColor, borderColor: pdfOptionsDropdownBorderColor, shadowColor: pdfOptionsDropdownShadowColor }]}>
           <Text style={[styles.pdfOptionsTitle, { color: pdfOptionsTitleColor }]}>PDF Export Options</Text>
            <View style={styles.pdfOptionSection}>
              <Text style={[styles.pdfOptionLabel, { color: pdfOptionLabelColor }]}>Paper Format</Text>
              <View style={styles.pdfOptionButtons}>
                <Pressable
                  onPress={() => setPdfOptions(prev => ({ ...prev, format: 'letter' }))}
                  style={[styles.pdfOptionButton, pdfOptions.format === 'letter' && styles.pdfOptionButtonActive, { backgroundColor: pdfOptionButtonBackgroundColor, borderColor: pdfOptionButtonBorderColor }, pdfOptions.format === 'letter' && { backgroundColor: pdfOptionButtonActiveBackgroundColor, borderColor: pdfOptionButtonActiveBorderColor }]}
                >
                  <Text style={[styles.pdfOptionButtonText, { color: pdfOptionButtonTextcolor }, pdfOptions.format === 'letter' && styles.pdfOptionButtonTextActive]}>Letter (8.5×11")</Text>
                </Pressable>
                <Pressable
                  onPress={() => setPdfOptions(prev => ({ ...prev, format: 'a4' }))}
                  style={[styles.pdfOptionButton, pdfOptions.format === 'a4' && styles.pdfOptionButtonActive, { backgroundColor: pdfOptionButtonBackgroundColor, borderColor: pdfOptionButtonBorderColor }, pdfOptions.format === 'a4' && { backgroundColor: pdfOptionButtonActiveBackgroundColor, borderColor: pdfOptionButtonActiveBorderColor }]}
                >
                  <Text style={[styles.pdfOptionButtonText, { color: pdfOptionButtonTextcolor }, pdfOptions.format === 'a4' && styles.pdfOptionButtonTextActive]}>A4 (210×297mm)</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.pdfOptionSection}>
              <Text style={[styles.pdfOptionLabel, { color: pdfOptionLabelColor }]}>Orientation</Text>
              <View style={styles.pdfOptionButtons}>
                <Pressable
                  onPress={() => setPdfOptions(prev => ({ ...prev, orientation: 'portrait' }))}
                  style={[styles.pdfOptionButton, pdfOptions.orientation === 'portrait' && styles.pdfOptionButtonActive, { backgroundColor: pdfOptionButtonBackgroundColor, borderColor: pdfOptionButtonBorderColor }, pdfOptions.orientation === 'portrait' && { backgroundColor: pdfOptionButtonActiveBackgroundColor, borderColor: pdfOptionButtonActiveBorderColor }]}
                >
                  <Text style={[styles.pdfOptionButtonText, { color: pdfOptionButtonTextcolor }, pdfOptions.orientation === 'portrait' && styles.pdfOptionButtonTextActive]}>Portrait</Text>
                </Pressable>
                <Pressable
                  onPress={() => setPdfOptions(prev => ({ ...prev, orientation: 'landscape' }))}
                  style={[styles.pdfOptionButton, pdfOptions.orientation === 'landscape' && styles.pdfOptionButtonActive, { backgroundColor: pdfOptionButtonBackgroundColor, borderColor: pdfOptionButtonBorderColor }, pdfOptions.orientation === 'landscape' && { backgroundColor: pdfOptionButtonActiveBackgroundColor, borderColor: pdfOptionButtonActiveBorderColor }]}
                >
                  <Text style={[styles.pdfOptionButtonText, { color: pdfOptionButtonTextcolor }, pdfOptions.orientation === 'landscape' && styles.pdfOptionButtonTextActive]}>Landscape</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.pdfOptionSection}>
              <Text style={[styles.pdfOptionLabel, { color: pdfOptionLabelColor }]}>Quality</Text>
               <TextInput
                 value={pdfOptions.quality.toString()}
                 onChangeText={(text) => setPdfOptions(prev => ({ ...prev, quality: Number(text) }))}
                 style={[styles.pdfOptionTextInput, { backgroundColor: pdfOptionTextInputBackgroundColor, borderColor: pdfOptionsDropdownBorderColor, color: pdfOptionTextInputColor }]}
                 keyboardType="numeric"
               />
            </View>
            <View style={[styles.pdfOptionActions, { borderTopColor: pdfOptionActionsBorderColor }]}>
              <Pressable
                onPress={() => handleExportPdf()}
                style={[styles.pdfOptionActionButton, styles.pdfOptionActionButtonPrimary, { backgroundColor: pdfOptionActionButtonPrimaryBackgroundColor }]}
              >
                <Text style={[styles.pdfOptionActionButtonText, { color: pdfOptionActionButtonTextcolor }]}>Export PDF</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowPdfOptions(false)}
                style={[styles.pdfOptionActionButton, styles.pdfOptionActionButtonSecondary, { backgroundColor: pdfOptionActionButtonSecondaryBackgroundColor, borderColor: pdfOptionActionButtonSecondaryBorderColor }]}
              >
                <Text style={[styles.pdfOptionActionButtonText, { color: pdfOptionActionButtonTextcolor }]}>Cancel</Text>
              </Pressable>
            </View>
            <View style={[styles.pdfOptionQuickExport, { borderTopColor: pdfOptionQuickExportBorderColor }]}>
              <Text style={[styles.pdfOptionQuickExportText, { color: pdfOptionQuickExportTextcolor }]}>Quick Export:</Text>
              <View style={styles.pdfOptionButtons}>
                <Pressable
                  onPress={() => handleExportPdf({ orientation: 'portrait', format: 'letter', quality: 2 })}
                  style={[styles.pdfOptionButton, styles.pdfOptionButtonQuick, { backgroundColor: pdfOptionButtonQuickBackgroundColor, borderColor: pdfOptionButtonQuickBorderColor }]}
                >
                  <Text style={[styles.pdfOptionButtonText, styles.pdfOptionButtonQuickText, { color: pdfOptionButtonQuickTextcolor }]}>Letter Portrait</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleExportPdf({ orientation: 'landscape', format: 'letter', quality: 2 })}
                  style={[styles.pdfOptionButton, styles.pdfOptionButtonQuick, { backgroundColor: pdfOptionButtonQuickBackgroundColor, borderColor: pdfOptionButtonQuickBorderColor }]}
                >
                  <Text style={[styles.pdfOptionButtonText, styles.pdfOptionButtonQuickText, { color: pdfOptionButtonQuickTextcolor }]}>Letter Landscape</Text>
                </Pressable>
              </View>
            </View>
        </View>
      )} */}

      {/* Tab Content */}
      {state.activeTab === 'preview' ? (
        <ScrollView
          ref={previewScrollViewRef} // Assign the internal ref here for ViewShot
          // Reason: Disable scrolling while downloading to prevent layout changes during capture (if using ViewShot)
          // Although we are now using backend, keeping this might be useful if we switch back or for other reasons.
          // scrollEnabled={!isDownloading}
          style={[
            styles.previewContainer,
            { backgroundColor: previewContainerBackgroundColor, borderColor: previewContainerBorderColor, shadowColor: previewContainerShadowColor }
            // Background image handling needs review for RN - setting background on ScrollView might not work as expected
            // settings.background ? { backgroundImage: `url(${settings.background})` } : {},
          ]}
          contentContainerStyle={styles.previewContentContainer}
        >
          {/* Background Image - Render separately if needed, or use a library */}
          {settings.background && (
             <Image
               source={{ uri: settings.background }}
               style={styles.previewBackground}
               resizeMode="cover"
             />
          )}
          <View style={[styles.previewContentBox, { backgroundColor: previewContentBoxBackgroundColor, shadowColor: previewContentBoxShadowColor }]}>
            {/* Logo Section */}
            {settings.logo && (
              <View style={styles.previewLogoContainer}>
                <Image
                  source={{ uri: settings.logo }} // Use source={{ uri: ... }} for images
                  style={styles.previewLogo}
                  resizeMode="contain" // Equivalent to max-h/max-w
                />
              </View>
            )}

            {/* Main Content - Render markdown */}
            {state.markdownContent && state.markdownContent.trim() !== '' ? (
              <Markdown style={markdownStyles}>
                {cleanMarkdownContent(state.markdownContent)}
              </Markdown>
            ) : (
              <View style={styles.noContentContainer}>
                <Text style={[styles.noContentTextPrimary, { color: noContentTextPrimaryColor }]}>Your generated document will appear here</Text>
                <Text style={[styles.noContentTextSecondary, { color: noContentTextSecondaryColor }]}>Click "Generate Document" to create your content</Text>
              </View>
            )}
          </View>
        </ScrollView>
      ) : (
        <View style={[styles.editorContainer, { backgroundColor: editorContainerBackgroundColor, borderColor: editorContainerBorderColor, shadowColor: editorContainerShadowColor }]}>
          {/* Formatting Toolbar */}
          <View style={[styles.editorToolbar, { backgroundColor: editorToolbarBackgroundColor, borderBottomColor: editorToolbarBorderColor }]}>
            <View style={styles.editorToolbarButtons}>
              {formatButtons.map((button, index) => (
                <Pressable
                  key={index}
                  onPress={button.action}
                  style={[styles.editorToolbarButton, { backgroundColor: editorToolbarButtonBackgroundColor, borderColor: editorToolbarButtonBorderColor }]}
                >
                  <button.icon size={16} color={editorToolbarButtonIconColor} />
                </Pressable>
              ))}
              {/* Divider */}
              <View style={[styles.editorToolbarDivider, { backgroundColor: editorToolbarDividerColor }]}></View>
              <Pressable
                onPress={() => {/* Add save functionality if needed */}}
                style={[styles.editorToolbarButton, { backgroundColor: editorToolbarButtonBackgroundColor, borderColor: editorToolbarButtonBorderColor }]}
              >
                <Save size={16} color={editorToolbarButtonIconColor} />
              </Pressable>
            </View>
          </View>

          {/* Monaco Editor - Replaced with TextInput */}
          <View style={styles.editorInputContainer}>
            <TextInput
              ref={editorInputRef} // Assign the ref
              style={[styles.editorInput, { color: editorInputColor }]}
              multiline
              value={state.markdownContent}
              onChangeText={handleEditorChange}
              onSelectionChange={(event) => setSelectionRange(event.nativeEvent.selection)} // Track selection
              textAlignVertical="top" // Align text to top
              // TODO: Implement syntax highlighting if needed (requires library)
              // TODO: Implement undo/redo if needed
            />
          </View>

          {/* Editor Footer */}
          <View style={[styles.editorFooter, { backgroundColor: editorFooterBackgroundColor, borderTopColor: editorFooterBorderColor }]}>
            <View style={styles.editorFooterStats}>
              <Text style={[styles.editorFooterText, { color: editorFooterTextcolor }]}>Lines: {state.markdownContent.split('\n').length}</Text>
              <Text style={[styles.editorFooterText, { color: editorFooterTextcolor }]}>Characters: {state.markdownContent.length}</Text>
              <Text style={[styles.editorFooterText, { color: editorFooterTextcolor }]}>Words: {state.markdownContent.split(/\s+/).filter(word => word.length > 0).length}</Text>
            </View>
            <Text style={[styles.editorFooterHelpText, { color: editorFooterTextcolor }]}>
              Markdown Editor • Use the toolbar above for quick formatting
            </Text>
            </View>
        </View>
      )}
    </View>
  );
}); // End of forwardRef


export default PreviewPanelMobile;

import React, { useEffect, useState } from 'react';
import { Eye, Edit3, Bold, Italic, List, Quote, Code, Heading1, Heading2, Heading3, Link, Image as ImageIcon, Save, Undo, Redo, Download, FileText, FileDown, Settings } from 'lucide-react';
import { EbookSettings, EbookState } from './EbookGenerator';
import { marked } from 'marked';
import Editor from '@monaco-editor/react';
import { exportMarkdown, exportAsPdf, PdfExportOptions } from '../utils/fileUtils';

interface PreviewPanelProps {
  settings: EbookSettings;
  state: EbookState;
  onStateChange: (state: Partial<EbookState>) => void;
  previewRef: React.RefObject<HTMLDivElement>;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  settings,
  state,
  onStateChange,
  previewRef
}) => {
  const [showPdfOptions, setShowPdfOptions] = useState(false);
  const [pdfOptions, setPdfOptions] = useState<PdfExportOptions>({
    orientation: 'portrait',
    format: 'letter',
    quality: 2
  });

  // Configure marked options for better rendering
  useEffect(() => {
    marked.setOptions({
      breaks: true,
      gfm: true
    });
  }, []);

  const switchTab = (tab: 'preview' | 'editor') => {
    onStateChange({ activeTab: tab });
  };

  const handleEditorChange = (value: string | undefined) => {
    onStateChange({ markdownContent: value || '' });
  };

  const cleanMarkdownContent = (content: string): string => {
    if (!content) return content;
    
    let cleaned = content.trim();

    // Remove common AI conversational preambles and markdown code block delimiters
    // This regex targets phrases like "Here is your document:", "Here's the content:", etc.,
    // and also removes leading/trailing triple backticks (```) with optional language specifier.
    cleaned = cleaned.replace(/^(?:(?:Here|Okay),?\s*(?:is|are)?\s*(?:your|the)?\s*(?:generated)?\s*(?:ebook|guide|document|content|markdown|text|response|output)[:.]?\s*|```(?:markdown)?\s*|```\s*)/i, '').trim();
    cleaned = cleaned.replace(/(```\s*)$/, '').trim(); // Remove trailing ```

    return cleaned;
  };

  const renderMarkdown = (markdown: string) => {
    if (!markdown || markdown.trim() === '') {
      return '<div class="text-center text-gray-400 py-12"><p class="text-xl">Your generated document will appear here</p><p class="text-sm mt-2">Click "Generate Document" to create your content</p></div>';
    }
    
    try {
      // Clean the markdown content first
      const cleanedMarkdown = cleanMarkdownContent(markdown);
      const htmlContent = marked.parse(cleanedMarkdown);
      return htmlContent;
    } catch (error) {
      console.error('Error parsing markdown:', error);
      return '<div class="text-center text-red-500 py-12"><p>Error rendering markdown content</p></div>';
    }
  };

  // Markdown formatting helper functions
  const insertMarkdown = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = document.querySelector('.monaco-editor textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = state.markdownContent.substring(start, end);
    const replacement = before + (selectedText || placeholder) + after;
    
    const newContent = 
      state.markdownContent.substring(0, start) + 
      replacement + 
      state.markdownContent.substring(end);
    
    handleEditorChange(newContent);
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
    { icon: ImageIcon, action: () => insertMarkdown('![', '](image-url)', 'alt text'), title: 'Image' },
  ];

  const handleExportMarkdown = () => {
    if (!state.markdownContent || state.markdownContent.trim() === '') {
      alert('No content to export');
      return;
    }
    exportMarkdown(state.markdownContent);
  };

  const handleExportPdf = (customOptions?: PdfExportOptions) => {
    if (!state.markdownContent || state.markdownContent.trim() === '') {
      alert('No content to export');
      return;
    }
    const previewElement = document.getElementById('ebook-preview');
    if (previewElement) {
      const options = customOptions || pdfOptions;
      exportAsPdf(previewElement, options);
    }
    setShowPdfOptions(false);
  };

  return (
    <div className="h-full">
      {/* Tab Navigation with Download Buttons */}
      <div className="flex justify-between items-center border-b border-purple-500/30 mb-6">
        <div className="flex">
          <button
            onClick={() => switchTab('preview')}
            className={`px-6 py-3 text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              state.activeTab === 'preview'
                ? 'border-b-2 border-purple-400 text-purple-400'
                : 'text-purple-300/70 hover:text-purple-300'
            }`}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={() => switchTab('editor')}
            className={`px-6 py-3 text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              state.activeTab === 'editor'
                ? 'border-b-2 border-purple-400 text-purple-400'
                : 'text-purple-300/70 hover:text-purple-300'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            Markdown Editor
          </button>
        </div>

        {/* Download Buttons */}
        {state.markdownContent && state.markdownContent.trim() !== '' && (
          <div className="flex gap-2 relative">
            <button
              onClick={handleExportMarkdown}
              className="px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-white font-medium rounded-lg text-sm transition-all duration-200 flex items-center gap-2 border border-gray-600/30"
              title="Download as Markdown"
            >
              <FileText className="w-4 h-4" />
              .md
            </button>
            
            {/* PDF Export with Options */}
            <div className="relative">
              <button
                onClick={() => setShowPdfOptions(!showPdfOptions)}
                className="px-4 py-2 bg-red-700/50 hover:bg-red-600/50 text-white font-medium rounded-lg text-sm transition-all duration-200 flex items-center gap-2 border border-red-600/30"
                title="PDF Export Options"
              >
                <FileDown className="w-4 h-4" />
                .pdf
                <Settings className="w-3 h-3" />
              </button>

              {/* PDF Options Dropdown */}
              {showPdfOptions && (
                <div className="absolute right-0 top-full mt-2 bg-gray-900 border border-gray-600 rounded-lg shadow-xl z-50 p-4 min-w-64">
                  <div className="space-y-4">
                    <h4 className="text-white font-medium text-sm">PDF Export Options</h4>
                    
                    {/* Format Selection */}
                    <div>
                      <label className="block text-xs text-gray-300 mb-2">Paper Format</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setPdfOptions(prev => ({ ...prev, format: 'letter' }))}
                          className={`px-3 py-2 text-xs rounded-md transition-all ${
                            pdfOptions.format === 'letter'
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          Letter (8.5×11")
                        </button>
                        <button
                          onClick={() => setPdfOptions(prev => ({ ...prev, format: 'a4' }))}
                          className={`px-3 py-2 text-xs rounded-md transition-all ${
                            pdfOptions.format === 'a4'
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          A4 (210×297mm)
                        </button>
                      </div>
                    </div>

                    {/* Orientation Selection */}
                    <div>
                      <label className="block text-xs text-gray-300 mb-2">Orientation</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setPdfOptions(prev => ({ ...prev, orientation: 'portrait' }))}
                          className={`px-3 py-2 text-xs rounded-md transition-all ${
                            pdfOptions.orientation === 'portrait'
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          Portrait
                        </button>
                        <button
                          onClick={() => setPdfOptions(prev => ({ ...prev, orientation: 'landscape' }))}
                          className={`px-3 py-2 text-xs rounded-md transition-all ${
                            pdfOptions.orientation === 'landscape'
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          Landscape
                        </button>
                      </div>
                    </div>

                    {/* Quality Selection */}
                    <div>
                      <label className="block text-xs text-gray-300 mb-2">Quality</label>
                      <select
                        value={pdfOptions.quality}
                        onChange={(e) => setPdfOptions(prev => ({ ...prev, quality: Number(e.target.value) }))}
                        className="w-full px-3 py-2 bg-gray-700 text-white text-xs rounded-md border border-gray-600 focus:border-purple-500 focus:outline-none"
                      >
                        <option value={1}>Standard (1x)</option>
                        <option value={2}>High (2x)</option>
                        <option value={3}>Ultra (3x)</option>
                      </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2 border-t border-gray-700">
                      <button
                        onClick={() => handleExportPdf()}
                        className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs rounded-md transition-all"
                      >
                        Export PDF
                      </button>
                      <button
                        onClick={() => setShowPdfOptions(false)}
                        className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded-md transition-all"
                      >
                        Cancel
                      </button>
                    </div>

                    {/* Quick Export Buttons */}
                    <div className="pt-2 border-t border-gray-700">
                      <p className="text-xs text-gray-400 mb-2">Quick Export:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleExportPdf({ orientation: 'portrait', format: 'letter', quality: 2 })}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-all"
                        >
                          Letter Portrait
                        </button>
                        <button
                          onClick={() => handleExportPdf({ orientation: 'landscape', format: 'letter', quality: 2 })}
                          className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-all"
                        >
                          Letter Landscape
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close PDF options */}
      {showPdfOptions && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowPdfOptions(false)}
        />
      )}

      {/* Tab Content */}
      {state.activeTab === 'preview' ? (
        <div
          id="ebook-preview"
          ref={previewRef}
          className="bg-white border border-purple-500/20 rounded-2xl overflow-hidden shadow-2xl mx-auto"
          style={{
            backgroundImage: settings.background ? `url(${settings.background})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            width: '90%', /* Use percentage for responsiveness */
            maxWidth: '400px', /* Adjusted for a more pronounced vertical rectangle on mobile */
            maxHeight: '90vh', /* Ensure it doesn't overflow vertically on small screens */
            aspectRatio: '8.5 / 11', /* Standard letter paper aspect ratio for portrait */
            margin: '0 auto' /* Center the preview horizontally */
          }}
        >
          <div className="bg-white m-8 rounded-xl shadow-lg overflow-hidden h-[calc(100%-4rem)]"> {/* Adjust margin and padding as needed */}
            <div className="p-12 h-full overflow-y-auto">
              {/* Logo Section */}
              {settings.logo && (
                <div className="text-center mb-8">
                  <img
                    src={settings.logo}
                    alt="Document Logo"
                    className="max-h-20 max-w-48 mx-auto rounded-lg shadow-md"
                  />
                </div>
              )}
              
              {/* Main Content - Always render through markdown parser */}
              <div
                className="ebook-content"
                dangerouslySetInnerHTML={{ 
                  __html: renderMarkdown(state.markdownContent) 
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-purple-500/30 rounded-2xl overflow-hidden shadow-2xl">
          {/* Formatting Toolbar */}
          <div className="bg-gray-50 border-b border-gray-200 p-3">
            <div className="flex flex-wrap gap-2">
              {formatButtons.map((button, index) => (
                <button
                  key={index}
                  onClick={button.action}
                  title={button.title}
                  className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 hover:border-purple-400 transition-all duration-200 text-gray-700 hover:text-purple-600"
                >
                  <button.icon className="w-4 h-4" />
                </button>
              ))}
              <div className="w-px bg-gray-300 mx-2"></div>
              <button
                onClick={() => {/* Add save functionality if needed */}}
                title="Save"
                className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 hover:border-green-400 transition-all duration-200 text-gray-700 hover:text-green-600"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="h-[600px]">
            <Editor
              height="100%"
              defaultLanguage="markdown"
              value={state.markdownContent}
              onChange={handleEditorChange}
              theme="light"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineHeight: 1.6,
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 16, bottom: 16 },
                fontFamily: "'JetBrains Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
                lineNumbers: 'on',
                renderLineHighlight: 'line',
                selectOnLineNumbers: true,
                roundedSelection: false,
                readOnly: false,
                cursorStyle: 'line',
                mouseWheelZoom: true,
                smoothScrolling: true,
                contextmenu: true,
                links: true,
                colorDecorators: true,
                suggest: {
                  showKeywords: true,
                  showSnippets: true
                }
              }}
            />
          </div>

          {/* Editor Footer */}
          <div className="bg-gray-50 border-t border-gray-200 p-3">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <span>Lines: {state.markdownContent.split('\n').length}</span>
                <span>Characters: {state.markdownContent.length}</span>
                <span>Words: {state.markdownContent.split(/\s+/).filter(word => word.length > 0).length}</span>
              </div>
              <div className="text-xs text-gray-500">
                Markdown Editor • Use the toolbar above for quick formatting
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviewPanel;

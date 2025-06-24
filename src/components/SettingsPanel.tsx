import React from 'react';
import { Key, MessageSquare, Image, Palette, CloudLightning, Download, FileText, BookOpen, PenTool, Heart, Briefcase, Plus, FileDown } from 'lucide-react';
import { EbookSettings, EbookState } from './EbookGenerator';
import { generateEbook } from '../utils/geminiApi';
import { exportMarkdown, exportAsPdf } from '../utils/fileUtils';
import { DOCUMENT_MODES } from '../types/documentTypes';

interface SettingsPanelProps {
  settings: EbookSettings;
  state: EbookState;
  onSettingsChange: (settings: Partial<EbookSettings>) => void;
  onStateChange: (state: Partial<EbookState>) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  state,
  onSettingsChange,
  onStateChange
}) => {
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onSettingsChange({ logo: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onSettingsChange({ background: e.target?.result as string });
      };
      reader.readAsDataURL(file);
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
      const content = await generateEbook(settings.apiKey, settings.prompt, currentMode.systemPrompt);
      onStateChange({ 
        markdownContent: content, 
        activeTab: 'preview',
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
      const content = await generateEbook(settings.apiKey, settings.prompt, currentMode.systemPrompt);
      onStateChange({ 
        markdownContent: content, 
        activeTab: 'preview',
        isGenerating: false 
      });
    } catch (error) {
      console.error('Error generating document:', error);
      alert(`Error generating document: ${error instanceof Error ? error.message : 'Unknown error'}`);
      onStateChange({ isGenerating: false });
    }
  };

  const handleExportMarkdown = () => {
    if (!state.markdownContent || state.markdownContent.trim() === '') {
      alert('No content to export');
      return;
    }
    exportMarkdown(state.markdownContent);
  };

  const handleExportPdf = () => {
    if (!state.markdownContent || state.markdownContent.trim() === '') {
      alert('No content to export');
      return;
    }
    const previewElement = document.getElementById('ebook-preview');
    if (previewElement) {
      exportAsPdf(previewElement, { 
        orientation: 'portrait', 
        format: 'letter', 
        quality: 2 
      });
    }
  };

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
    return <IconComponent className="w-5 h-5" />;
  };

  const currentMode = DOCUMENT_MODES.find(mode => mode.id === settings.documentMode) || DOCUMENT_MODES[0];
  const hasContent = state.markdownContent && state.markdownContent.trim() !== '';

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-purple-900/30 to-black/30 backdrop-blur-lg border border-purple-500/30 rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <CloudLightning className="w-6 h-6 text-purple-400" />
          Settings
        </h2>
        
        <div className="space-y-5">
          {/* Document Mode Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-purple-200 mb-3">
              {getIconComponent(currentMode.icon)}
              Document Type
            </label>
            <div className="grid grid-cols-1 gap-2">
              {DOCUMENT_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => handleModeChange(mode.id)}
                  className={`p-3 rounded-xl text-left transition-all duration-200 border ${
                    settings.documentMode === mode.id
                      ? 'bg-purple-600/30 border-purple-400 text-white'
                      : 'bg-black/30 border-purple-500/30 text-purple-200 hover:bg-purple-600/20 hover:border-purple-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getIconComponent(mode.icon)}
                    <div>
                      <div className="font-medium">{mode.name}</div>
                      <div className="text-xs opacity-70">{mode.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* API Key */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-purple-200 mb-2">
              <Key className="w-4 h-4" />
              Google Gemini API Key
            </label>
            <input
              type="password"
              value={settings.apiKey}
              onChange={(e) => onSettingsChange({ apiKey: e.target.value })}
              placeholder="Enter your API key"
              className="w-full px-4 py-3 bg-black/50 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            />
            <p className="text-xs text-purple-300/70 mt-1">
              Get your API key from{' '}
              <a
                href="https://ai.google.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          {/* Document Topic */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-purple-200 mb-2">
              <MessageSquare className="w-4 h-4" />
              {currentMode.name} Topic
            </label>
            <textarea
              rows={4}
              value={settings.prompt}
              onChange={(e) => onSettingsChange({ prompt: e.target.value })}
              placeholder={currentMode.placeholderPrompt}
              className="w-full px-4 py-3 bg-black/50 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none"
            />
          </div>

          {/* Logo Upload */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-purple-200 mb-2">
              <Image className="w-4 h-4" />
              Upload Logo (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="block w-full text-sm text-purple-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 file:transition-colors file:duration-200 cursor-pointer"
            />
          </div>

          {/* Background Upload */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-purple-200 mb-2">
              <Image className="w-4 h-4" />
              Background Image (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleBackgroundUpload}
              className="block w-full text-sm text-purple-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 file:transition-colors file:duration-200 cursor-pointer"
            />
          </div>

          {/* Color Theme */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-purple-200 mb-2">
              <Palette className="w-4 h-4" />
              Color Theme
            </label>
            <select
              value={settings.colorTheme}
              onChange={(e) => onSettingsChange({ colorTheme: e.target.value })}
              className="w-full px-4 py-3 bg-black/50 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            >
              <option value="purple">Purple</option>
              <option value="blue">Blue</option>
              <option value="green">Green</option>
              <option value="red">Red</option>
              <option value="indigo">Indigo</option>
              <option value="pink">Pink</option>
            </select>
          </div>

          {/* Generation Buttons */}
          <div className="space-y-3">
            {/* Primary Generate Button */}
            <button
              onClick={hasContent ? handleGenerateNew : handleGenerate}
              disabled={state.isGenerating}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 disabled:from-purple-800 disabled:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg shadow-purple-500/25 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black transition-all duration-200 flex items-center justify-center gap-2"
            >
              {state.isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  {hasContent ? <Plus className="w-5 h-5" /> : <CloudLightning className="w-5 h-5" />}
                  {hasContent ? `Generate New ${currentMode.name}` : `Generate ${currentMode.name}`}
                </>
              )}
            </button>

            {/* Continue/Extend Button - Only show when content exists */}
            {hasContent && !state.isGenerating && (
              <button
                onClick={handleGenerate}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-indigo-500/25 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-black transition-all duration-200 flex items-center justify-center gap-2"
              >
                <CloudLightning className="w-4 h-4" />
                Continue/Extend Content
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-gradient-to-br from-purple-900/30 to-black/30 backdrop-blur-lg border border-purple-500/30 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-purple-400" />
          Export Options
        </h3>
        
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={handleExportMarkdown}
            disabled={!hasContent}
            className="bg-gray-700/50 hover:bg-gray-600/50 disabled:bg-gray-800/50 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 border border-gray-600/30"
          >
            <FileText className="w-4 h-4" />
            Download Markdown (.md)
          </button>
          <button
            onClick={handleExportPdf}
            disabled={!hasContent}
            className="bg-red-700/50 hover:bg-red-600/50 disabled:bg-gray-800/50 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 border border-red-600/30"
          >
            <FileDown className="w-4 h-4" />
            Download PDF (Letter Portrait)
          </button>
        </div>
        
        <div className="mt-3 text-xs text-purple-300/70 text-center">
          Use the PDF options in the preview panel for custom formats and orientations
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
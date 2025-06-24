import React, { useState, useRef } from 'react';
import { CloudLightning, Sparkles, Download, Edit3, Eye } from 'lucide-react';
import SettingsPanel from './SettingsPanel';
import PreviewPanel from './PreviewPanel';
import { DOCUMENT_MODES, DocumentMode } from '../types/documentTypes';

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
}

const EbookGenerator: React.FC = () => {
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

  const previewRef = useRef<HTMLDivElement>(null);

  const updateSettings = (newSettings: Partial<EbookSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const updateState = (newState: Partial<EbookState>) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  const currentMode = DOCUMENT_MODES.find(mode => mode.id === settings.documentMode) || DOCUMENT_MODES[0];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-purple-600 to-purple-400 rounded-2xl shadow-2xl shadow-purple-500/25">
            <CloudLightning className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
            MonsoonDocs
          </h1>
          <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
        </div>
        <p className="text-xl text-purple-200 font-light">
          Create professional documents in minutes with AI-powered generation
        </p>
        <div className="mt-4 text-lg text-purple-300">
          Current Mode: <span className="font-semibold text-purple-200">{currentMode.name}</span> - {currentMode.description}
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-black/40 backdrop-blur-xl border border-purple-500/20 rounded-3xl shadow-2xl shadow-purple-500/10 p-8 mb-8">
        <div className="flex flex-col xl:flex-row gap-8">
          {/* Settings Panel */}
          <div className="w-full xl:w-1/3">
            <SettingsPanel
              settings={settings}
              state={state}
              onSettingsChange={updateSettings}
              onStateChange={updateState}
            />
          </div>

          {/* Preview Panel */}
          <div className="w-full xl:w-2/3">
            <PreviewPanel
              settings={settings}
              state={state}
              onStateChange={updateState}
              previewRef={previewRef}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center">
        <p className="text-purple-300/60 text-sm">
          Powered by Google Gemini AI • Built with precision and care
        </p>
      </div>
    </div>
  );
};

export default EbookGenerator;
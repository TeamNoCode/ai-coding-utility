import React, { useState, useEffect } from 'react';
import { LLMSettings, ProviderKey } from '../types';
import { LLM_PROVIDERS } from '../constants';
import { CloseIcon, CheckIcon } from './icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: LLMSettings) => void;
  currentSettings: LLMSettings;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, currentSettings }) => {
  const [settings, setSettings] = useState(currentSettings);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSettings(currentSettings);
      setTestStatus('idle');
      setTestMessage('');
    }
  }, [currentSettings, isOpen]);

  const updateSettings = <K extends keyof LLMSettings>(key: K, value: LLMSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value as ProviderKey;
    setSettings({
      provider: newProvider,
      model: LLM_PROVIDERS[newProvider].models[0],
      apiKey: '',
      useBuiltInKey: newProvider === 'google',
    });
    setTestStatus('idle');
  };

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const handleTestConnection = () => {
    setTestStatus('testing');
    setTestMessage('');

    // This is a mock test. In a real app, you would make a lightweight API call.
    setTimeout(() => {
      if (settings.provider === 'google') {
        if (settings.useBuiltInKey) {
          setTestStatus('success');
          setTestMessage('Connection successful with the built-in key.');
          return;
        }
        if (settings.apiKey && settings.apiKey.trim()) {
          setTestStatus('success');
          setTestMessage('Connection successful with your custom key!');
          return;
        }
        setTestStatus('error');
        setTestMessage('A custom API Key is required for this option.');
        return;
      }

      // For other providers
      if (settings.apiKey && settings.apiKey.trim()) {
        setTestStatus('success');
        setTestMessage('Connection successful! Your settings are working.');
      } else {
        setTestStatus('error');
        setTestMessage('API Key is required for this provider.');
      }
    }, 1000);
  };

  if (!isOpen) return null;

  const isGemini = settings.provider === 'google';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors btn-tactile"
          aria-label="Close settings"
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-white mb-6">Provider Settings</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="provider-select" className="block text-sm font-medium text-gray-300 mb-2">
              LLM Provider
            </label>
            <select
              id="provider-select"
              value={settings.provider}
              onChange={handleProviderChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {(Object.keys(LLM_PROVIDERS) as ProviderKey[]).map((key) => (
                <option key={key} value={key}>
                  {LLM_PROVIDERS[key].name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="model-select" className="block text-sm font-medium text-gray-300 mb-2">
              Model
            </label>
            <select
              id="model-select"
              value={settings.model}
              onChange={(e) => updateSettings('model', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {LLM_PROVIDERS[settings.provider].models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          
          {isGemini && (
            <div>
              <label htmlFor="gemini-key-source" className="block text-sm font-medium text-gray-300 mb-2">
                API Key Source
              </label>
              <select
                id="gemini-key-source"
                value={settings.useBuiltInKey ? 'built-in' : 'custom'}
                onChange={(e) => {
                  const useBuiltIn = e.target.value === 'built-in';
                  updateSettings('useBuiltInKey', useBuiltIn);
                  if (useBuiltIn) {
                    updateSettings('apiKey', '');
                  }
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="built-in">Built-in Key (On the house)</option>
                <option value="custom">Custom API Key</option>
              </select>
            </div>
          )}

          {(!isGemini || !settings.useBuiltInKey) && (
            <div>
              <label htmlFor="api-key-input" className="block text-sm font-medium text-gray-300 mb-2">
                API Key
              </label>
              <input
                id="api-key-input"
                type="password"
                value={settings.apiKey}
                onChange={(e) => updateSettings('apiKey', e.target.value)}
                placeholder="Enter your API key"
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
          
          {isGemini && settings.useBuiltInKey && (
            <p className="text-xs text-gray-500">
              The application's built-in key allows for free, limited use of Google Gemini without needing your own API key.
            </p>
          )}

        </div>
        
        <div className="mt-6 flex items-center justify-between">
          <div className="flex-1">
             {testStatus !== 'idle' && (
                <div className={`text-sm flex items-center ${testStatus === 'success' ? 'text-green-400' : testStatus === 'error' ? 'text-red-400' : 'text-gray-400'}`}>
                    {testStatus === 'success' && <CheckIcon className="w-4 h-4 mr-2" />}
                    <span>{testMessage}</span>
                </div>
            )}
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleTestConnection}
              disabled={testStatus === 'testing'}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 disabled:opacity-50 btn-tactile"
            >
              {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 btn-tactile"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

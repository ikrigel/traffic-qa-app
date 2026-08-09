'use client';

import { useState } from 'react';
import UserSettings from './UserSettings';
import PreferencesSettings from './PreferencesSettings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'api-keys' | 'preferences'>('api-keys');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 sm:p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">⚙️ Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('api-keys')}
            className={`px-4 py-2 font-semibold transition ${
              activeTab === 'api-keys'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🔑 API Keys
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`px-4 py-2 font-semibold transition ${
              activeTab === 'preferences'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🎨 Preferences
          </button>
        </div>

        {/* Content */}
        {activeTab === 'api-keys' && <UserSettings />}
        {activeTab === 'preferences' && <PreferencesSettings />}
      </div>
    </div>
  );
}

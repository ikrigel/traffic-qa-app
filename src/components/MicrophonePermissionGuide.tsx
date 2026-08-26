'use client';

import { useState, useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
}

export default function MicrophonePermissionGuide({ isOpen, onClose, onRetry }: Props) {
  const [deviceType, setDeviceType] = useState<'desktop' | 'ios' | 'android'>('desktop');

  useEffect(() => {
    if (typeof navigator === 'undefined') return;

    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setDeviceType('ios');
    } else if (/android/.test(ua)) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }
  }, []);

  if (!isOpen) return null;

  const instructions = {
    desktop: {
      title: '🖥️ Desktop Instructions',
      steps: [
        'Look for the lock icon or camera/mic icon in your browser\'s address bar',
        'Click on it to see site permissions',
        'Find "Microphone" and change it from "Block" to "Allow"',
        'Refresh the page and try the voice input again',
      ],
      browsers: [
        { name: 'Chrome/Edge', steps: 'Click lock/camera icon in address bar → Microphone → Allow' },
        { name: 'Firefox', steps: 'Click lock icon in address bar → Microphone → Allow' },
        { name: 'Safari', steps: 'Develop → Microphone → Allow website (or System Preferences)' },
      ],
    },
    ios: {
      title: '🍎 iPhone/iPad Instructions',
      steps: [
        'Go to Settings app',
        'Scroll down and tap "Safari" (or your browser name)',
        'Tap "Microphone"',
        'Select "Allow"',
        'Return to the app and try voice input again',
      ],
      note: 'You may need to allow permission when prompted by the browser first',
    },
    android: {
      title: '🤖 Android Instructions',
      steps: [
        'Open Settings app',
        'Tap "Apps" or "Application Manager"',
        'Find your browser (Chrome, Firefox, etc.)',
        'Tap "Permissions"',
        'Toggle "Microphone" to ON',
        'Return to the app and try voice input again',
      ],
      note: 'You may see a permission prompt in the browser - tap "Allow"',
    },
  };

  const current = instructions[deviceType];
  const showBrowsers = 'browsers' in current;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{current.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Steps */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">📋 Steps:</p>
          <ol className="space-y-2">
            {current.steps.map((step, idx) => (
              <li key={idx} className="flex gap-3 text-sm text-gray-700 dark:text-gray-300">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Browser Info for Desktop */}
        {showBrowsers && (
          <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">🌐 Browser-Specific:</p>
            <div className="space-y-1">
              {current.browsers.map((browser, idx) => (
                <div key={idx} className="text-xs text-blue-800 dark:text-blue-200">
                  <span className="font-semibold">{browser.name}:</span> {browser.steps}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Note */}
        {!showBrowsers && 'note' in current && (
          <div className="mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              💡 <span className="font-semibold">Tip:</span> {current.note}
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            Close
          </button>
          <button
            onClick={onRetry}
            className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
          >
            Try Again
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
          Need more help? Make sure your browser is up to date and try a different browser if this doesn&apos;t work.
        </p>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  completed?: boolean;
}

export default function SetupWizard() {
  const [expandedStep, setExpandedStep] = useState<string>('gemini');
  const [copyFeedback, setCopyFeedback] = useState<string>('');

  const steps: SetupStep[] = [
    {
      id: 'gemini',
      title: '🔑 Get Gemini API Key',
      description: 'Get your free Google Gemini API key',
      instructions: [
        'Go to Google AI Studio: https://aistudio.google.com/app/apikey',
        'Click "Create API key" button',
        'Choose "Create API key in new Google Cloud project" or use existing',
        'Copy your API key (it starts with "AIza...")',
        'Keep this key safe - you\'ll need it in the next step',
      ],
    },
    {
      id: 'vercel',
      title: '⚙️ Add Key to Vercel',
      description: 'Add the Gemini API key to your Vercel environment',
      instructions: [
        'Go to your Vercel Dashboard: https://vercel.com/dashboard',
        'Select your project "traffic-qa-app"',
        'Go to Settings → Environment Variables',
        'Click "Add New"',
        'Name: GEMINI_API_KEY',
        'Value: Paste your API key from step 1',
        'Select environments: Production, Preview, Development',
        'Click Save',
      ],
    },
    {
      id: 'redeploy',
      title: '🚀 Redeploy Project',
      description: 'Redeploy to apply the new environment variable',
      instructions: [
        'Go to Deployments tab in Vercel',
        'Click the three dots on the latest deployment',
        'Select "Redeploy"',
        'Wait for deployment to complete (2-3 minutes)',
        'Your app will use the new API key automatically',
      ],
    },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback('✅ Copied to clipboard!');
    setTimeout(() => setCopyFeedback(''), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            ⚡ Quick Setup
          </h1>
          <p className="text-lg text-gray-600">
            Get your app ready in 3 simple steps
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl"
            >
              {/* Step Header */}
              <button
                onClick={() =>
                  setExpandedStep(expandedStep === step.id ? '' : step.id)
                }
                className="w-full px-6 py-4 flex items-start justify-between hover:bg-gray-50 transition"
              >
                <div className="flex items-start gap-4 text-left flex-1">
                  {/* Step Number */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                    {index + 1}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-800">
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Chevron */}
                <div
                  className={`flex-shrink-0 ml-4 text-2xl text-gray-400 transition-transform ${
                    expandedStep === step.id ? 'rotate-180' : ''
                  }`}
                >
                  ▼
                </div>
              </button>

              {/* Step Content */}
              {expandedStep === step.id && (
                <div className="px-6 py-6 bg-gray-50 border-t border-gray-200">
                  <ol className="space-y-3">
                    {step.instructions.map((instruction, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-semibold">
                          {i + 1}
                        </span>
                        <span className="text-gray-700 pt-0.5">
                          {instruction}
                          {instruction.includes('https://') && (
                            <button
                              onClick={() => copyToClipboard(instruction.split(': ')[1])}
                              className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-600 rounded text-xs hover:bg-indigo-200 transition"
                            >
                              📋 Copy
                            </button>
                          )}
                        </span>
                      </li>
                    ))}
                  </ol>

                  {/* Copy Feedback */}
                  {copyFeedback && (
                    <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
                      {copyFeedback}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            ❓ Common Questions
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">
                Is Gemini API free?
              </h3>
              <p className="text-gray-600">
                Yes! Gemini API has a free tier with 60 requests per minute.
                Perfect for this app. No credit card needed initially.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">
                Where do I get the API key?
              </h3>
              <p className="text-gray-600">
                Visit{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline font-semibold"
                >
                  Google AI Studio
                </a>{' '}
                and click "Create API key" (takes 30 seconds)
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">
                Is it secure to share my API key?
              </h3>
              <p className="text-gray-600">
                Never share it publicly! Add it only to your Vercel environment
                variables (private). Vercel keeps it encrypted.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">
                How long does redeploy take?
              </h3>
              <p className="text-gray-600">
                Usually 2-3 minutes. Your app will automatically start using the
                API key after deployment completes.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            Ready to get started? Follow the steps above! 🚀
          </p>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition shadow-lg"
          >
            Get Gemini API Key →
          </a>
        </div>
      </div>
    </div>
  );
}

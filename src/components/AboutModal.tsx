/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState } from 'react';
import { APP_VERSION } from '@/lib/constants';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://traffic-qa-app.vercel.app';
  const shareText = 'דיני תעבורה - אפליקציה למידה חכמה בעברית';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(`${shareText}\n${appUrl}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(shareText);
    const body = encodeURIComponent(`${shareText}\n\n${appUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const links = [
    {
      label: 'GitHub',
      url: 'https://github.com/ikrigel',
      icon: '🔗',
      color: 'text-gray-800 hover:text-black',
    },
    {
      label: 'LinkedIn',
      url: 'https://www.linkedin.com/in/ikrigel/',
      icon: '💼',
      color: 'text-blue-600 hover:text-blue-800',
    },
    {
      label: 'Portfolio',
      url: 'https://portfolio-dusky-eight-77.vercel.app/#/',
      icon: '🌐',
      color: 'text-indigo-600 hover:text-indigo-800',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 sm:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">אודות</h2>
            <p className="text-sm text-gray-500 mt-1">v{APP_VERSION}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        <div className="space-y-8 text-right">
          {/* App Info */}
          <section className="border-b pb-6">
            <h3 className="text-xl font-semibold text-blue-600 mb-3">📱 אפליקציית דיני תעבורה</h3>
            <div className="space-y-3 text-gray-700">
              <p className="leading-relaxed">
                אפליקציה חדישה וחינמית ללימוד דיני תעבורה בעברית. המערכת משלבת בינה מלאכותית
                כדי לתת משוב ישיר על תשובות, ניהול קורסים גמיש, והערכה מפורטת של ידע.
              </p>
              <div className="space-y-2">
                <p>
                  <span className="font-semibold">תכונות:</span> קורסים, שאלות בחירה מרובה, הערכה עם 5 מדדים, צ'אט AI, תרגול קולי
                </p>
                <p>
                  <span className="font-semibold">טכנולוגיות:</span> Next.js 14, React 18, TypeScript, Tailwind CSS,
                  Google Gemini AI, Supabase, Pinecone RAG
                </p>
                <p>
                  <span className="font-semibold">הנושא:</span> דיני תעבורה בישראל (דיני תעבורה, הנחיות, בטיחות דרכים)
                </p>
              </div>
            </div>
          </section>

          {/* Share Section */}
          <section className="border-b pb-6">
            <h3 className="text-xl font-semibold text-blue-600 mb-4">📤 שתף את האפליקציה</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={handleCopyLink}
                className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition text-gray-700 hover:text-green-700"
              >
                <span className="text-2xl mb-2">📋</span>
                <span className="font-semibold text-sm">{copied ? 'הועתק!' : 'העתק קישור'}</span>
              </button>

              <button
                onClick={handleShareWhatsApp}
                className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition text-gray-700 hover:text-green-700"
              >
                <span className="text-2xl mb-2">💬</span>
                <span className="font-semibold text-sm">שלח ב-WhatsApp</span>
              </button>

              <button
                onClick={handleShareEmail}
                className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition text-gray-700 hover:text-blue-700"
              >
                <span className="text-2xl mb-2">📧</span>
                <span className="font-semibold text-sm">שלח בדוא״ל</span>
              </button>
            </div>
          </section>

          {/* Developer Profile */}
          <section className="border-b pb-6">
            <h3 className="text-xl font-semibold text-blue-600 mb-4">👨‍💻 אודות המפתח</h3>

            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl sm:text-4xl font-bold flex-shrink-0">
                IK
              </div>

              <div className="flex-1 text-center sm:text-right">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">יגאל קריגל</h4>
                <p className="text-sm text-gray-600 mb-3">
                  מפתח Full Stack עם התמחות בפיתוח אפליקציות web מודרניות.
                  בעל ידע עמוק ב-TypeScript, React, Node.js, ובנושאי ביטחוני מידע.
                </p>
                <p className="text-sm text-gray-600">
                  במטרה לעזור לנהגים בישראל ללמוד דיני תעבורה בדרך חכמה ויעילה.
                </p>
              </div>
            </div>
          </section>

          {/* Links */}
          <section>
            <h3 className="text-xl font-semibold text-blue-600 mb-4">🔗 קישורים</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {links.map(link => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition ${link.color}`}
                >
                  <span className="text-3xl mb-2">{link.icon}</span>
                  <span className="font-semibold text-sm">{link.label}</span>
                </a>
              ))}
            </div>
          </section>

          {/* Credits */}
          <section className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
            <p className="mb-2">
              <span className="font-semibold">תודות:</span> אפליקציה זו נבנתה בעזרת טכנולוגיות קוד פתוח
              וחינמיות כולל Next.js, React, Tailwind CSS, Supabase, ו-Google Gemini AI.
            </p>
            <p>
              <span className="font-semibold">רישיון:</span> MIT License - פתוח לשימוש וייבור בקוד
            </p>
          </section>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
        >
          סגור
        </button>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import type { AuthUser } from '@/hooks/useAuth';
import UserManagementPanel from './UserManagementPanel';
import RagDocumentsPanel from './RagDocumentsPanel';
import UnifiedLogsPanel from './UnifiedLogsPanel';
import RagEvaluationPanel from './RagEvaluationPanel';
import RagasEvaluationPanel from './RagasEvaluationPanel';
import DevkitConsolePanel from './DevkitConsolePanel';

type TabType = 'users' | 'rag-docs' | 'logs' | 'evaluations' | 'ragas' | 'devkit';

interface Props {
  user: AuthUser;
}

const ADMIN_TAB_STORAGE_KEY = 'admin_panel_active_tab';

export default function AdminPanelContainer({ user }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const isSuperAdmin = user.role === 'super_admin';

  // Load saved tab on mount
  useEffect(() => {
    const saved = localStorage.getItem(ADMIN_TAB_STORAGE_KEY) as TabType | null;
    if (saved && ['users', 'rag-docs', 'logs', 'evaluations', 'ragas', 'devkit'].includes(saved)) {
      setActiveTab(saved);
    }
  }, []);

  // Save tab to localStorage when it changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    localStorage.setItem(ADMIN_TAB_STORAGE_KEY, tab);
  };

  const tabs: Array<{ id: TabType; label: string; icon: string; visible: boolean }> = [
    { id: 'users', label: 'Users', icon: '👥', visible: true },
    { id: 'rag-docs', label: 'RAG Documents', icon: '📄', visible: isSuperAdmin },
    { id: 'logs', label: 'Debug Logs', icon: '📋', visible: true },
    { id: 'evaluations', label: 'Evaluations', icon: '🤖', visible: true },
    { id: 'ragas', label: 'RAGAS Tester', icon: '🧪', visible: isSuperAdmin },
    { id: 'devkit', label: 'DevKit Console', icon: '🖥️', visible: isSuperAdmin },
  ];

  return (
    <div className="space-y-6" data-testid="admin-panel">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex flex-wrap gap-0 border-b">
          {tabs
            .filter(t => t.visible)
            .map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 px-4 py-3 text-center font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white border-b-2 border-indigo-700'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <span className="text-lg">{tab.icon}</span> {tab.label}
              </button>
            ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {activeTab === 'users' && <UserManagementPanel />}
        {activeTab === 'rag-docs' && isSuperAdmin && <RagDocumentsPanel />}
        {activeTab === 'logs' && <UnifiedLogsPanel />}
        {activeTab === 'evaluations' && <RagEvaluationPanel />}
        {activeTab === 'ragas' && isSuperAdmin && <RagasEvaluationPanel />}
        {activeTab === 'devkit' && isSuperAdmin && <DevkitConsolePanel />}
      </div>
    </div>
  );
}

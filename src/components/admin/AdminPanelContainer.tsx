'use client';

import { useState } from 'react';
import type { AuthUser } from '@/hooks/useAuth';
import UserManagementPanel from './UserManagementPanel';
import RagDocumentsPanel from './RagDocumentsPanel';
import DebugLogsPanel from './DebugLogsPanel';
import RagEvaluationPanel from './RagEvaluationPanel';
import DevkitConsolePanel from './DevkitConsolePanel';

type TabType = 'users' | 'rag-docs' | 'logs' | 'evaluations' | 'devkit';

interface Props {
  user: AuthUser;
}

export default function AdminPanelContainer({ user }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const isSuperAdmin = user.role === 'super_admin';

  const tabs: Array<{ id: TabType; label: string; icon: string; visible: boolean }> = [
    { id: 'users', label: 'Users', icon: '👥', visible: true },
    { id: 'rag-docs', label: 'RAG Documents', icon: '📄', visible: isSuperAdmin },
    { id: 'logs', label: 'Debug Logs', icon: '📋', visible: true },
    { id: 'evaluations', label: 'Evaluations', icon: '🤖', visible: true },
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
                onClick={() => setActiveTab(tab.id)}
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
        {activeTab === 'logs' && <DebugLogsPanel />}
        {activeTab === 'evaluations' && <RagEvaluationPanel />}
        {activeTab === 'devkit' && isSuperAdmin && <DevkitConsolePanel />}
      </div>
    </div>
  );
}

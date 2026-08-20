'use client';

import { useUserProgress } from '@/hooks/useUserProgress';

export default function UserProgressDisplay() {
  const { stats, loading, error } = useUserProgress();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded animate-pulse w-32" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        Could not load progress data
      </div>
    );
  }

  const progressBoxes = [
    {
      icon: '🏆',
      label: 'Mastered',
      value: stats.questions_mastered,
      color: 'bg-green-50 border-green-200',
      textColor: 'text-green-700',
    },
    {
      icon: '✅',
      label: 'Proficient',
      value: stats.questions_proficient,
      color: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-700',
    },
    {
      icon: '📚',
      label: 'Learning',
      value: stats.questions_learning,
      color: 'bg-yellow-50 border-yellow-200',
      textColor: 'text-yellow-700',
    },
    {
      icon: '⭕',
      label: 'Not Started',
      value: stats.questions_unstarted,
      color: 'bg-gray-50 border-gray-200',
      textColor: 'text-gray-700',
    },
  ];

  return (
    <div className="space-y-4 w-full">
      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 md:p-4">
          <p className="text-xs md:text-sm text-indigo-600 font-medium">Accuracy</p>
          <p className="text-lg md:text-2xl font-bold text-indigo-900">{stats.overall_accuracy.toFixed(1)}%</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 md:p-4">
          <p className="text-xs md:text-sm text-purple-600 font-medium">Attempts</p>
          <p className="text-lg md:text-2xl font-bold text-purple-900">{stats.total_attempts}</p>
        </div>
        <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 md:p-4">
          <p className="text-xs md:text-sm text-pink-600 font-medium">Correct</p>
          <p className="text-lg md:text-2xl font-bold text-pink-900">{stats.total_correct}</p>
        </div>
      </div>

      {/* Mastery Levels */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Progress by Level</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          {progressBoxes.map(box => (
            <div
              key={box.label}
              className={`border rounded-lg p-3 md:p-4 text-center transition transform hover:scale-105 ${box.color}`}
            >
              <div className="text-2xl md:text-3xl mb-2">{box.icon}</div>
              <p className={`text-xs md:text-sm font-medium ${box.textColor}`}>{box.label}</p>
              <p className={`text-lg md:text-xl font-bold ${box.textColor}`}>{box.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

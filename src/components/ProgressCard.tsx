'use client';

import { useProgress } from '@/hooks/useProgress';

export default function ProgressCard() {
  const { statistics, loading } = useProgress();

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-100 rounded-lg p-3 sm:p-4 text-center border border-gray-200 animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-2"></div>
            <div className="h-4 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!statistics) {
    return null;
  }

  const stats = [
    {
      label: 'שאלות',
      value: statistics.total_attempts,
      color: 'blue',
      icon: '📝',
    },
    {
      label: 'התקדמות',
      value: `${Math.round(statistics.accuracy_percentage)}%`,
      color: 'green',
      icon: '📈',
    },
    {
      label: 'נכונות',
      value: statistics.total_correct,
      color: 'purple',
      icon: '✓',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {stats.map(stat => (
        <div
          key={stat.label}
          className={`bg-${stat.color}-50 rounded-lg p-3 sm:p-4 text-center border border-${stat.color}-200`}
        >
          <div className="text-xl sm:text-2xl font-bold text-gray-800">{stat.icon}</div>
          <div className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">{stat.value}</div>
          <div className="text-xs sm:text-sm text-gray-600 mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

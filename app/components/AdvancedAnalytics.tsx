'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Banknote, Calendar, PieChart } from 'lucide-react';

interface AnalyticsData {
  total_calculations: number;
  total_salary: number;
  total_notes: number;
  avg_salary: number;
  avg_notes: number;
  max_salary: number;
  min_salary: number;
  denomination_usage: Record<number, { count: number; total_amount: number }>;
  daily_stats: Array<{ date: string; count: number; total_salary: number; total_notes: number }>;
  monthly_stats: Array<{ month: string; count: number; total_salary: number; total_notes: number }>;
  salary_distribution: Array<{ label: string; count: number }>;
}

export default function AdvancedAnalytics({ darkMode }: { darkMode: boolean }) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`rounded-2xl shadow-2xl p-6 backdrop-blur-lg ${darkMode ? 'bg-gray-800/90 border border-gray-700' : 'bg-white/90'}`}>
        <div className="text-center py-8">
          <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
          <p className={`mt-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics || analytics.total_calculations === 0) {
    return (
      <div className={`rounded-2xl shadow-2xl p-6 backdrop-blur-lg ${darkMode ? 'bg-gray-800/90 border border-gray-700' : 'bg-white/90'}`}>
        <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          No data available yet. Start making calculations to see analytics!
        </p>
      </div>
    );
  }

  const stats = viewMode === 'daily' ? analytics.daily_stats : analytics.monthly_stats;
  const maxCount = Math.max(...stats.map(s => s.count), 1);

  return (
    <div className={`rounded-2xl shadow-2xl p-6 backdrop-blur-lg ${darkMode ? 'bg-gray-800/90 border border-gray-700' : 'bg-white/90'}`}>
      <h2 className={`text-2xl font-bold mb-6 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        <TrendingUp className="w-6 h-6 text-purple-600" />
        Advanced Analytics
      </h2>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gradient-to-br from-purple-900/50 to-purple-800/30' : 'bg-gradient-to-br from-purple-100 to-purple-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Calculations</div>
          </div>
          <div className={`text-2xl font-bold ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
            {analytics.total_calculations.toLocaleString()}
          </div>
        </div>

        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gradient-to-br from-green-900/50 to-green-800/30' : 'bg-gradient-to-br from-green-100 to-green-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Salary</div>
          </div>
          <div className={`text-xl font-bold ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
            {analytics.avg_salary.toLocaleString()}
          </div>
        </div>

        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gradient-to-br from-blue-900/50 to-blue-800/30' : 'bg-gradient-to-br from-blue-100 to-blue-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Banknote className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Notes</div>
          </div>
          <div className={`text-2xl font-bold ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
            {analytics.total_notes.toLocaleString()}
          </div>
        </div>

        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gradient-to-br from-amber-900/50 to-amber-800/30' : 'bg-gradient-to-br from-amber-100 to-amber-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Banknote className={`w-5 h-5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Notes</div>
          </div>
          <div className={`text-2xl font-bold ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>
            {analytics.avg_notes}
          </div>
        </div>
      </div>

      {/* Chart View Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setViewMode('daily')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            viewMode === 'daily'
              ? 'bg-purple-600 text-white'
              : darkMode
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Daily Trends
        </button>
        <button
          onClick={() => setViewMode('monthly')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            viewMode === 'monthly'
              ? 'bg-purple-600 text-white'
              : darkMode
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Monthly Trends
        </button>
      </div>

      {/* Bar Chart */}
      <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
        <h3 className={`font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          {viewMode === 'daily' ? 'Daily' : 'Monthly'} Activity
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className={`w-20 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {viewMode === 'daily' 
                  ? new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : stat.month
                }
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-6 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-500"
                      style={{ width: `${(stat.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <div className={`text-sm font-semibold w-12 text-right ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {stat.count}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Denomination Usage */}
      <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
        <h3 className={`font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          <PieChart className="w-5 h-5 text-purple-600" />
          Denomination Usage
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(analytics.denomination_usage)
            .sort(([a], [b]) => parseInt(b) - parseInt(a))
            .map(([value, usage]) => (
              <div
                key={value}
                className={`p-3 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-white'}`}
              >
                <div className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {parseInt(value).toLocaleString()} IQD
                </div>
                <div className={`text-lg font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                  {usage.count.toLocaleString()}
                </div>
                <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  {usage.total_amount.toLocaleString()} IQD
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Salary Distribution */}
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
        <h3 className={`font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Salary Distribution
        </h3>
        <div className="space-y-2">
          {analytics.salary_distribution.map((range, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className={`w-24 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {range.label}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-6 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-600 to-emerald-600 transition-all duration-500"
                      style={{ width: `${(range.count / analytics.total_calculations) * 100}%` }}
                    />
                  </div>
                  <div className={`text-sm font-semibold w-12 text-right ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {range.count}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-gradient-to-r from-purple-900/30 to-indigo-900/30' : 'bg-gradient-to-r from-purple-50 to-indigo-50'}`}>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Highest Salary</div>
            <div className={`text-xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
              {analytics.max_salary.toLocaleString()} IQD
            </div>
          </div>
          <div>
            <div className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Lowest Salary</div>
            <div className={`text-xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              {analytics.min_salary.toLocaleString()} IQD
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

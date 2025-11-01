'use client';

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { ArrowLeft, TrendingUp, DollarSign, Users, Calendar, PieChart, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import AnimatedBackground from "../components/AnimatedBackground";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

const API = '/api';

interface BreakdownItem {
  value: number;
  count: number;
  image_name: string;
}

interface HistoryItem {
  id: string;
  name: string;
  rank: string;
  salary: number;
  breakdown: BreakdownItem[];
  total_notes: number;
  created_at: string;
  department?: string;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

export default function DashboardPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved) {
      setDarkMode(JSON.parse(saved));
    }
    fetchHistory();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get<HistoryItem[]>(`${API}/history`);
      setHistory(response.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const statistics = useMemo(() => {
    if (history.length === 0) return null;
    
    const totalCalculations = history.length;
    const totalSalary = history.reduce((sum, item) => sum + item.salary, 0);
    const avgSalary = totalSalary / totalCalculations;
    const totalNotes = history.reduce((sum, item) => sum + item.total_notes, 0);
    const avgNotes = totalNotes / totalCalculations;
    
    const salaries = history.map(h => h.salary).sort((a, b) => a - b);
    const maxSalary = Math.max(...salaries);
    const minSalary = Math.min(...salaries);
    
    return {
      totalCalculations,
      totalSalary,
      avgSalary,
      maxSalary,
      minSalary,
      totalNotes,
      avgNotes
    };
  }, [history]);

  // Salary trend data (last 30 days)
  const salaryTrendData = useMemo(() => {
    const last30Days = new Map<string, { date: string; count: number; totalSalary: number; avgSalary: number }>();
    
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      last30Days.set(dateStr, { date: dateStr, count: 0, totalSalary: 0, avgSalary: 0 });
    }
    
    history.forEach(item => {
      const itemDate = new Date(item.created_at);
      const dateStr = itemDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (last30Days.has(dateStr)) {
        const data = last30Days.get(dateStr)!;
        data.count += 1;
        data.totalSalary += item.salary;
        data.avgSalary = data.totalSalary / data.count;
      }
    });
    
    return Array.from(last30Days.values());
  }, [history]);

  // Monthly calculation count
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, number>();
    
    history.forEach(item => {
      const month = new Date(item.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      monthMap.set(month, (monthMap.get(month) || 0) + 1);
    });
    
    return Array.from(monthMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-6); // Last 6 months
  }, [history]);

  // Denomination usage breakdown
  const denominationData = useMemo(() => {
    const denomMap = new Map<number, number>();
    
    history.forEach(item => {
      item.breakdown.forEach(b => {
        denomMap.set(b.value, (denomMap.get(b.value) || 0) + b.count);
      });
    });
    
    return Array.from(denomMap.entries())
      .map(([value, count]) => ({ 
        name: `${value.toLocaleString()} IQD`, 
        value: count,
        valueAmount: value * count 
      }))
      .sort((a, b) => b.valueAmount - a.valueAmount);
  }, [history]);

  // Department breakdown
  const departmentData = useMemo(() => {
    const deptMap = new Map<string, { count: number; totalSalary: number }>();
    
    history.forEach(item => {
      const dept = item.department || 'No Department';
      const data = deptMap.get(dept) || { count: 0, totalSalary: 0 };
      data.count += 1;
      data.totalSalary += item.salary;
      deptMap.set(dept, data);
    });
    
    return Array.from(deptMap.entries())
      .map(([name, data]) => ({ 
        name, 
        count: data.count,
        avgSalary: Math.round(data.totalSalary / data.count)
      }));
  }, [history]);

  // Top salaries
  const topSalaries = useMemo(() => {
    return [...history]
      .sort((a, b) => b.salary - a.salary)
      .slice(0, 5);
  }, [history]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 relative p-4 md:p-8`}>
      <AnimatedBackground darkMode={darkMode} />
      
      <div className="max-w-[1800px] mx-auto relative z-10">
        {/* Header */}
        <div className={`rounded-2xl shadow-2xl p-6 mb-6 backdrop-blur-lg ${darkMode ? 'bg-gray-800/90 border border-gray-700' : 'bg-white/90'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className={`p-3 rounded-lg transition-all hover:scale-110 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-purple-100 hover:bg-purple-200 text-purple-700'}`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className={`text-3xl md:text-4xl font-bold flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  📊 Analytics Dashboard
                </h1>
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Comprehensive insights and trends
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            <div className={`rounded-xl shadow-lg p-6 backdrop-blur-lg ${darkMode ? 'bg-purple-900/30' : 'bg-gradient-to-br from-purple-50 to-purple-100'}`}>
              <div className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Calculations</div>
              <div className={`text-3xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                {statistics.totalCalculations}
              </div>
            </div>
            <div className={`rounded-xl shadow-lg p-6 backdrop-blur-lg ${darkMode ? 'bg-blue-900/30' : 'bg-gradient-to-br from-blue-50 to-blue-100'}`}>
              <div className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Salary</div>
              <div className={`text-3xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                {(statistics.totalSalary / 1000000).toFixed(1)}M
              </div>
            </div>
            <div className={`rounded-xl shadow-lg p-6 backdrop-blur-lg ${darkMode ? 'bg-green-900/30' : 'bg-gradient-to-br from-green-50 to-green-100'}`}>
              <div className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Salary</div>
              <div className={`text-3xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                {Math.round(statistics.avgSalary / 1000)}K
              </div>
            </div>
            <div className={`rounded-xl shadow-lg p-6 backdrop-blur-lg ${darkMode ? 'bg-amber-900/30' : 'bg-gradient-to-br from-amber-50 to-amber-100'}`}>
              <div className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Max Salary</div>
              <div className={`text-3xl font-bold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                {(statistics.maxSalary / 1000).toFixed(0)}K
              </div>
            </div>
            <div className={`rounded-xl shadow-lg p-6 backdrop-blur-lg ${darkMode ? 'bg-red-900/30' : 'bg-gradient-to-br from-red-50 to-red-100'}`}>
              <div className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Min Salary</div>
              <div className={`text-3xl font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                {(statistics.minSalary / 1000).toFixed(0)}K
              </div>
            </div>
            <div className={`rounded-xl shadow-lg p-6 backdrop-blur-lg ${darkMode ? 'bg-indigo-900/30' : 'bg-gradient-to-br from-indigo-50 to-indigo-100'}`}>
              <div className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Notes</div>
              <div className={`text-3xl font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                {statistics.totalNotes}
              </div>
            </div>
            <div className={`rounded-xl shadow-lg p-6 backdrop-blur-lg ${darkMode ? 'bg-pink-900/30' : 'bg-gradient-to-br from-pink-50 to-pink-100'}`}>
              <div className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Notes</div>
              <div className={`text-3xl font-bold ${darkMode ? 'text-pink-400' : 'text-pink-600'}`}>
                {Math.round(statistics.avgNotes)}
              </div>
            </div>
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Salary Trend Chart */}
          <div className={`rounded-2xl shadow-2xl p-6 backdrop-blur-lg ${darkMode ? 'bg-gray-800/90 border border-gray-700' : 'bg-white/90'}`}>
            <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Daily Calculation Trends (Last 30 Days)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salaryTrendData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis 
                  dataKey="date" 
                  stroke={darkMode ? '#9ca3af' : '#6b7280'}
                  tick={{ fontSize: 12 }}
                />
                <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#1f2937' : '#fff',
                    border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#8b5cf6" 
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                  name="Calculations"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Calculations */}
          <div className={`rounded-2xl shadow-2xl p-6 backdrop-blur-lg ${darkMode ? 'bg-gray-800/90 border border-gray-700' : 'bg-white/90'}`}>
            <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <Calendar className="w-5 h-5 text-blue-600" />
              Monthly Calculations
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis 
                  dataKey="month" 
                  stroke={darkMode ? '#9ca3af' : '#6b7280'}
                  tick={{ fontSize: 12 }}
                />
                <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#1f2937' : '#fff',
                    border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Second Row Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Denomination Usage */}
          <div className={`rounded-2xl shadow-2xl p-6 backdrop-blur-lg ${darkMode ? 'bg-gray-800/90 border border-gray-700' : 'bg-white/90'}`}>
            <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <PieChart className="w-5 h-5 text-green-600" />
              Denomination Usage Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={denominationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {denominationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#1f2937' : '#fff',
                    border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px'
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          {/* Department Breakdown */}
          {departmentData.length > 0 && (
            <div className={`rounded-2xl shadow-2xl p-6 backdrop-blur-lg ${darkMode ? 'bg-gray-800/90 border border-gray-700' : 'bg-white/90'}`}>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                <Users className="w-5 h-5 text-orange-600" />
                Department Analysis
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                  <XAxis type="number" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={120}
                    stroke={darkMode ? '#9ca3af' : '#6b7280'}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#1f2937' : '#fff',
                      border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="count" fill="#f59e0b" radius={[0, 8, 8, 0]} name="Employees" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top Salaries */}
        <div className={`rounded-2xl shadow-2xl p-6 backdrop-blur-lg ${darkMode ? 'bg-gray-800/90 border border-gray-700' : 'bg-white/90'}`}>
          <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Top 5 Salaries
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${darkMode ? 'bg-gray-700' : 'bg-purple-100'}`}>
                  <th className={`p-3 text-left font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>#</th>
                  <th className={`p-3 text-left font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Name</th>
                  <th className={`p-3 text-left font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Rank/Position</th>
                  <th className={`p-3 text-left font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Department</th>
                  <th className={`p-3 text-left font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Salary (IQD)</th>
                  <th className={`p-3 text-left font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Total Notes</th>
                  <th className={`p-3 text-left font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Date</th>
                </tr>
              </thead>
              <tbody>
                {topSalaries.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`border-b transition-colors ${darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-purple-50'}`}
                  >
                    <td className={`p-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{index + 1}</td>
                    <td className={`p-3 font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{item.name || 'N/A'}</td>
                    <td className={`p-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{item.rank || 'N/A'}</td>
                    <td className={`p-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.department || 'N/A'}</td>
                    <td className={`p-3 font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                      {item.salary.toLocaleString()}
                    </td>
                    <td className={`p-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item.total_notes}</td>
                    <td className={`p-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

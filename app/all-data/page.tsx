'use client';

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { ArrowLeft, Download, Search, Filter, FileText, Sheet, Printer, BarChart3, Calendar, User, Briefcase, DollarSign, FileSpreadsheet, TrendingUp, ArrowUp, ArrowDown, Trash2, CheckSquare, Square, GitCompare, Eye, EyeOff, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import AnimatedBackground from "../components/AnimatedBackground";

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

interface DenominationSummary {
  value: number;
  total_count: number;
  image_name: string;
}

interface Denomination {
  value: number;
  image_name: string;
  is_available: boolean;
  amount: number;
}

export default function AllDataPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'date' | 'salary' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [darkMode, setDarkMode] = useState(false);
  const [filterSalaryMin, setFilterSalaryMin] = useState<number>(0);
  const [filterSalaryMax, setFilterSalaryMax] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);
  
  // New state for enhanced features
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [denominations, setDenominations] = useState<Denomination[]>([]);
  const [visibleDenominations, setVisibleDenominations] = useState<Set<number>>(new Set());
  const [showDenominationFilter, setShowDenominationFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [compareMode, setCompareMode] = useState(false);
  const [compareItems, setCompareItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved) {
      setDarkMode(JSON.parse(saved));
    }
    fetchAllData();
    fetchDenominations();
  }, []);

  const fetchDenominations = async () => {
    try {
      const response = await axios.get<Denomination[]>(`${API}/denominations`);
      setDenominations(response.data);
      // Initially show all denominations
      setVisibleDenominations(new Set(response.data.map(d => d.value)));
    } catch (err) {
      console.error("Error fetching denominations:", err);
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const fetchAllData = async () => {
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

  const toggleRowSelection = (id: string) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedRows(newSelection);
  };

  const toggleAllRows = () => {
    if (selectedRows.size === filteredAndSortedHistory.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredAndSortedHistory.map(item => item.id)));
    }
  };

  const bulkDelete = async () => {
    if (selectedRows.size === 0) return;
    
    const confirmDelete = confirm(`Are you sure you want to delete ${selectedRows.size} record(s)?`);
    if (!confirmDelete) return;

    try {
      setLoading(true);
      await Promise.all(
        Array.from(selectedRows).map(id => axios.delete(`${API}/history/${id}`))
      );
      setSelectedRows(new Set());
      await fetchAllData();
    } catch (err) {
      console.error("Error deleting records:", err);
      alert("Failed to delete some records");
    } finally {
      setLoading(false);
    }
  };

  const toggleDenominationVisibility = (value: number) => {
    const newVisible = new Set(visibleDenominations);
    if (newVisible.has(value)) {
      newVisible.delete(value);
    } else {
      newVisible.add(value);
    }
    setVisibleDenominations(newVisible);
  };

  const toggleAllDenominations = () => {
    if (visibleDenominations.size === denominations.length) {
      setVisibleDenominations(new Set());
    } else {
      setVisibleDenominations(new Set(denominations.map(d => d.value)));
    }
  };

  const addToCompare = (item: HistoryItem) => {
    if (compareItems.find(i => i.id === item.id)) {
      setCompareItems(compareItems.filter(i => i.id !== item.id));
    } else if (compareItems.length < 4) {
      setCompareItems([...compareItems, item]);
    } else {
      alert("You can compare up to 4 items at once");
    }
  };

  const clearComparison = () => {
    setCompareItems([]);
    setCompareMode(false);
  };

  // Calculate denomination summary across all calculations
  const denominationSummary = useMemo(() => {
    const summary: Record<number, DenominationSummary> = {};
    
    filteredAndSortedHistory.forEach(item => {
      item.breakdown.forEach(breakdown => {
        // Only include if denomination is visible
        if (visibleDenominations.has(breakdown.value)) {
          if (!summary[breakdown.value]) {
            summary[breakdown.value] = {
              value: breakdown.value,
              total_count: 0,
              image_name: breakdown.image_name
            };
          }
          summary[breakdown.value].total_count += breakdown.count;
        }
      });
    });

    return Object.values(summary).sort((a, b) => b.value - a.value);
  }, [filteredAndSortedHistory, visibleDenominations]);

  // Calculate statistics (using filtered data)
  const statistics = useMemo(() => {
    if (filteredAndSortedHistory.length === 0) return null;
    
    const totalCalculations = filteredAndSortedHistory.length;
    const totalSalary = filteredAndSortedHistory.reduce((sum, item) => sum + item.salary, 0);
    const avgSalary = totalSalary / totalCalculations;
    const totalNotes = filteredAndSortedHistory.reduce((sum, item) => sum + item.total_notes, 0);
    const avgNotes = totalNotes / totalCalculations;
    
    const salaries = filteredAndSortedHistory.map(h => h.salary).sort((a, b) => a - b);
    const maxSalary = Math.max(...salaries);
    const minSalary = Math.min(...salaries);
    
    // Group by month
    const byMonth: Record<string, number> = {};
    filteredAndSortedHistory.forEach(item => {
      const month = new Date(item.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      byMonth[month] = (byMonth[month] || 0) + 1;
    });
    
    // Group by department
    const byDepartment: Record<string, number> = {};
    filteredAndSortedHistory.forEach(item => {
      if (item.department) {
        byDepartment[item.department] = (byDepartment[item.department] || 0) + 1;
      }
    });
    
    return {
      totalCalculations,
      totalSalary,
      avgSalary,
      maxSalary,
      minSalary,
      totalNotes,
      avgNotes,
      byMonth,
      byDepartment
    };
  }, [filteredAndSortedHistory]);

  // Filtered and sorted data
  const filteredAndSortedHistory = useMemo(() => {
    let filtered = [...history];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.rank.toLowerCase().includes(query) ||
        item.salary.toString().includes(query) ||
        (item.department && item.department.toLowerCase().includes(query))
      );
    }

    // Apply salary range filter
    if (filterSalaryMin > 0) {
      filtered = filtered.filter(item => item.salary >= filterSalaryMin);
    }
    if (filterSalaryMax > 0) {
      filtered = filtered.filter(item => item.salary <= filterSalaryMax);
    }

    // Apply date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter(item => new Date(item.created_at) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(item => new Date(item.created_at) <= toDate);
    }

    // Apply department filter
    if (departmentFilter) {
      filtered = filtered.filter(item => item.department === departmentFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'date') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === 'salary') {
        comparison = a.salary - b.salary;
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [history, searchQuery, sortBy, sortOrder, filterSalaryMin, filterSalaryMax, dateFrom, dateTo, departmentFilter]);

  // Get unique departments from history
  const availableDepartments = useMemo(() => {
    const depts = new Set<string>();
    history.forEach(item => {
      if (item.department) {
        depts.add(item.department);
      }
    });
    return Array.from(depts).sort();
  }, [history]);

  const exportToExcel = async () => {
    if (history.length === 0) return;
    
    try {
      setLoading(true);
      
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      
      // Main data sheet
      const mainSheet = workbook.addWorksheet('All Calculations');
      mainSheet.columns = [
        { header: '#', key: 'index', width: 8 },
        { header: 'Name', key: 'name', width: 20 },
        { header: 'Rank/Position', key: 'rank', width: 20 },
        { header: 'Salary (IQD)', key: 'salary', width: 15 },
        { header: 'Total Notes', key: 'total_notes', width: 12 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Breakdown', key: 'breakdown', width: 50 }
      ];
      
      mainSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      mainSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF6B46C1' }
      };
      
      filteredAndSortedHistory.forEach((item, index) => {
        const breakdown = item.breakdown
          .filter(b => visibleDenominations.has(b.value))
          .map(b => `${b.value.toLocaleString()} IQD × ${b.count}`)
          .join(', ');
        
        mainSheet.addRow({
          index: index + 1,
          name: item.name,
          rank: item.rank,
          salary: item.salary,
          total_notes: item.total_notes,
          date: new Date(item.created_at).toLocaleDateString(),
          breakdown: breakdown
        });
      });

      // Denomination summary sheet
      const summarySheet = workbook.addWorksheet('Denomination Summary');
      summarySheet.columns = [
        { header: 'Denomination (IQD)', key: 'denomination', width: 20 },
        { header: 'Total Count', key: 'count', width: 15 },
        { header: 'Total Value (IQD)', key: 'total_value', width: 20 }
      ];
      
      summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      summarySheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF059669' }
      };
      
      denominationSummary.forEach(item => {
        summarySheet.addRow({
          denomination: item.value.toLocaleString(),
          count: item.total_count,
          total_value: (item.value * item.total_count).toLocaleString()
        });
      });

      // Statistics sheet
      if (statistics) {
        const statsSheet = workbook.addWorksheet('Statistics');
        statsSheet.columns = [
          { header: 'Metric', key: 'metric', width: 30 },
          { header: 'Value', key: 'value', width: 20 }
        ];
        
        statsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        statsSheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2563EB' }
        };
        
        statsSheet.addRow({ metric: 'Total Calculations', value: statistics.totalCalculations });
        statsSheet.addRow({ metric: 'Total Salary Amount (IQD)', value: statistics.totalSalary.toLocaleString() });
        statsSheet.addRow({ metric: 'Average Salary (IQD)', value: Math.round(statistics.avgSalary).toLocaleString() });
        statsSheet.addRow({ metric: 'Maximum Salary (IQD)', value: statistics.maxSalary.toLocaleString() });
        statsSheet.addRow({ metric: 'Minimum Salary (IQD)', value: statistics.minSalary.toLocaleString() });
        statsSheet.addRow({ metric: 'Total Notes Used', value: statistics.totalNotes });
        statsSheet.addRow({ metric: 'Average Notes per Calculation', value: Math.round(statistics.avgNotes) });
      }
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `complete_salary_data_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setLoading(false);
    }
  };

  const printAllData = () => {
    if (history.length === 0) {
      alert("No data to print");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow pop-ups to print");
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Complete Salary Database Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif;
            padding: 30px;
            background: white;
            color: black;
          }
          h1 { 
            text-align: center; 
            margin-bottom: 10px;
            color: #7c3aed;
            font-size: 28px;
          }
          .subtitle {
            text-align: center;
            margin-bottom: 30px;
            color: #666;
            font-size: 14px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          .stat-card {
            padding: 15px;
            background: #f3f4f6;
            border-radius: 8px;
            text-align: center;
          }
          .stat-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
          }
          .stat-value {
            font-size: 20px;
            font-weight: bold;
            color: #7c3aed;
          }
          .section-title {
            font-size: 20px;
            font-weight: bold;
            margin: 30px 0 15px;
            color: #374151;
            border-bottom: 2px solid #7c3aed;
            padding-bottom: 5px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px;
          }
          th { 
            background: #7c3aed; 
            color: white; 
            padding: 12px; 
            text-align: left;
            font-weight: bold;
          }
          td { 
            padding: 10px; 
            border: 1px solid #ddd;
          }
          tr:nth-child(even) { 
            background: #f9f9f9; 
          }
          .breakdown {
            font-size: 11px;
            color: #666;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }
          @media print {
            body { padding: 10px; }
            .stats-grid { page-break-inside: avoid; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>💰 Complete Salary Database Report</h1>
        <div class="subtitle">Generated on ${new Date().toLocaleString()}</div>
        
        ${statistics ? `
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total Calculations</div>
            <div class="stat-value">${statistics.totalCalculations}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Average Salary</div>
            <div class="stat-value">${Math.round(statistics.avgSalary).toLocaleString()} IQD</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Max Salary</div>
            <div class="stat-value">${statistics.maxSalary.toLocaleString()} IQD</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Avg Notes</div>
            <div class="stat-value">${Math.round(statistics.avgNotes)}</div>
          </div>
        </div>
        ` : ''}
        
        <div class="section-title">📋 All Calculations</div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Rank/Position</th>
              <th>Salary (IQD)</th>
              <th>Total Notes</th>
              <th>Date</th>
              <th>Breakdown</th>
            </tr>
          </thead>
          <tbody>
            ${history.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.name}</td>
                <td>${item.rank}</td>
                <td>${item.salary.toLocaleString()}</td>
                <td>${item.total_notes}</td>
                <td>${new Date(item.created_at).toLocaleDateString()}</td>
                <td class="breakdown">
                  ${item.breakdown.map(b => `${b.value.toLocaleString()} IQD × ${b.count}`).join(', ')}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="section-title">💵 Denomination Summary</div>
        <table>
          <thead>
            <tr>
              <th>Denomination (IQD)</th>
              <th>Total Count</th>
              <th>Total Value (IQD)</th>
            </tr>
          </thead>
          <tbody>
            ${denominationSummary.map(item => `
              <tr>
                <td>${item.value.toLocaleString()}</td>
                <td>${item.total_count}</td>
                <td>${(item.value * item.total_count).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          M.I.S Salary Calculator | Total Records: ${history.length}
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const exportToCSV = () => {
    if (filteredAndSortedHistory.length === 0) return;
    
    let csvContent = "Index,Name,Rank/Position,Department,Salary (IQD),Total Notes,Date,Breakdown\n";
    filteredAndSortedHistory.forEach((item, index) => {
      const breakdown = item.breakdown
        .filter(b => visibleDenominations.has(b.value))
        .map(b => `${b.value.toLocaleString()} IQD × ${b.count}`)
        .join(' | ');
      csvContent += `${index + 1},"${item.name}","${item.rank}","${item.department || 'N/A'}",${item.salary},${item.total_notes},"${new Date(item.created_at).toLocaleDateString()}","${breakdown}"\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `salary_data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 relative p-4 md:p-8`}>
      <AnimatedBackground darkMode={darkMode} />
      
      <div className="max-w-[1800px] mx-auto relative z-10">
        {/* Header */}
        <div className={`rounded-2xl shadow-2xl p-6 mb-6 backdrop-blur-lg ${darkMode ? 'bg-gray-800/90 border border-gray-700' : 'bg-white/90'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className={`p-3 rounded-lg transition-all hover:scale-110 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-purple-100 hover:bg-purple-200 text-purple-700'}`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className={`text-3xl md:text-4xl font-bold flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  📊 Complete Data View
                </h1>
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  All calculations with detailed breakdowns and analytics
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={exportToExcel}
                disabled={loading || history.length === 0}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all hover:scale-105 disabled:opacity-50 ${darkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
              >
                <FileSpreadsheet className="w-5 h-5" />
                Export Excel
              </button>
              <button
                onClick={exportToCSV}
                disabled={loading || history.length === 0}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all hover:scale-105 disabled:opacity-50 ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                <Sheet className="w-5 h-5" />
                Export CSV
              </button>
              <button
                onClick={printAllData}
                disabled={loading || history.length === 0}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all hover:scale-105 disabled:opacity-50 ${darkMode ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
              >
                <Printer className="w-5 h-5" />
                Print
              </button>
            </div>
          </div>

          {/* Action Buttons Row */}
          {selectedRows.size > 0 && (
            <div className={`mb-4 p-4 rounded-lg border-2 ${darkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center justify-between">
                <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {selectedRows.size} item(s) selected
                </span>
                <button
                  onClick={bulkDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected
                </button>
              </div>
            </div>
          )}

          {compareMode && compareItems.length > 0 && (
            <div className={`mb-4 p-4 rounded-lg border-2 ${darkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex items-center justify-between">
                <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {compareItems.length} item(s) in comparison
                </span>
                <button
                  onClick={clearComparison}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
                >
                  Clear Comparison
                </button>
              </div>
            </div>
          )}

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, rank, department, or salary..."
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:border-purple-500 focus:outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900'}`}
                />
              </div>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>

            <button
              onClick={() => setShowDenominationFilter(!showDenominationFilter)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
            >
              <Settings className="w-5 h-5" />
              Currency Filter
            </button>

            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold ${compareMode ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
            >
              <GitCompare className="w-5 h-5" />
              Compare
            </button>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'salary' | 'name')}
              className={`px-4 py-3 rounded-lg border-2 font-semibold ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
            >
              <option value="date">Sort by Date</option>
              <option value="salary">Sort by Salary</option>
              <option value="name">Sort by Name</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className={`p-3 rounded-lg font-semibold ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortOrder === 'asc' ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className={`mt-4 p-4 rounded-lg border-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <h3 className={`font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Advanced Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Minimum Salary (IQD)
                  </label>
                  <input
                    type="number"
                    value={filterSalaryMin || ''}
                    onChange={(e) => setFilterSalaryMin(parseInt(e.target.value) || 0)}
                    placeholder="e.g., 500000"
                    className={`w-full px-4 py-2 border-2 rounded-lg focus:border-purple-500 focus:outline-none ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Maximum Salary (IQD)
                  </label>
                  <input
                    type="number"
                    value={filterSalaryMax || ''}
                    onChange={(e) => setFilterSalaryMax(parseInt(e.target.value) || 0)}
                    placeholder="e.g., 2000000"
                    className={`w-full px-4 py-2 border-2 rounded-lg focus:border-purple-500 focus:outline-none ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Department
                  </label>
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className={`w-full px-4 py-2 border-2 rounded-lg focus:border-purple-500 focus:outline-none ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  >
                    <option value="">All Departments</option>
                    {availableDepartments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Date From
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className={`w-full px-4 py-2 border-2 rounded-lg focus:border-purple-500 focus:outline-none ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Date To
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className={`w-full px-4 py-2 border-2 rounded-lg focus:border-purple-500 focus:outline-none ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    setFilterSalaryMin(0);
                    setFilterSalaryMax(0);
                    setDateFrom("");
                    setDateTo("");
                    setDepartmentFilter("");
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
                >
                  Clear All Filters
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${darkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-800'}`}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Denomination Filter Panel */}
          {showDenominationFilter && (
            <div className={`mt-4 p-4 rounded-lg border-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Select Currency Denominations to Display</h3>
                <button
                  onClick={toggleAllDenominations}
                  className={`px-3 py-1 text-sm rounded-lg font-semibold ${darkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-800'}`}
                >
                  {visibleDenominations.size === denominations.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {denominations.map((denom) => (
                  <button
                    key={denom.value}
                    onClick={() => toggleDenominationVisibility(denom.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      visibleDenominations.has(denom.value)
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                        : 'border-gray-300 bg-gray-100 dark:bg-gray-800 opacity-50'
                    }`}
                  >
                    <img
                      src={`/currency/${denom.image_name}`}
                      alt={`${denom.value} Dinar`}
                      className="w-full h-12 object-cover rounded mb-1"
                    />
                    <div className={`text-xs font-semibold text-center ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      {denom.value.toLocaleString()} IQD
                    </div>
                    {visibleDenominations.has(denom.value) && (
                      <div className="text-center mt-1">
                        <Eye className="w-4 h-4 text-green-600 mx-auto" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowDenominationFilter(false)}
                className={`mt-3 px-4 py-2 rounded-lg font-semibold transition-all ${darkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-800'}`}
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* Statistics Dashboard */}
        {statistics && (
          <div className={`rounded-2xl shadow-2xl p-6 mb-6 backdrop-blur-lg ${darkMode ? 'bg-gray-800/90 border border-gray-700' : 'bg-white/90'}`}>
            <h2 className={`text-2xl font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <BarChart3 className="w-6 h-6 text-purple-600" />
              Statistics Overview
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
                <div className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Calculations</div>
                <div className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>{statistics.totalCalculations}</div>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                <div className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Salary</div>
                <div className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{Math.round(statistics.totalSalary / 1000000)}M</div>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-50'}`}>
                <div className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Salary</div>
                <div className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{Math.round(statistics.avgSalary).toLocaleString()}</div>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-amber-900/30' : 'bg-amber-50'}`}>
                <div className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Max Salary</div>
                <div className={`text-2xl font-bold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>{statistics.maxSalary.toLocaleString()}</div>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-red-900/30' : 'bg-red-50'}`}>
                <div className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Min Salary</div>
                <div className={`text-2xl font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{statistics.minSalary.toLocaleString()}</div>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}>
                <div className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Notes</div>
                <div className={`text-2xl font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{statistics.totalNotes.toLocaleString()}</div>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-pink-900/30' : 'bg-pink-50'}`}>
                <div className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Notes</div>
                <div className={`text-2xl font-bold ${darkMode ? 'text-pink-400' : 'text-pink-600'}`}>{Math.round(statistics.avgNotes)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Denomination Summary */}
        <div className={`rounded-2xl shadow-2xl p-6 mb-6 backdrop-blur-lg ${darkMode ? 'bg-gray-800/90 border border-gray-700' : 'bg-white/90'}`}>
          <h2 className={`text-2xl font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            <DollarSign className="w-6 h-6 text-green-600" />
            Money Type Breakdown Summary
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {denominationSummary.map((item) => (
              <div
                key={item.value}
                className={`p-4 rounded-lg border-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'}`}
              >
                <img
                  src={`/currency/${item.image_name}`}
                  alt={`${item.value} Dinar`}
                  className="w-full h-16 object-cover rounded border border-gray-300 mb-2"
                />
                <div className={`text-sm font-semibold text-center ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  {item.value.toLocaleString()} IQD
                </div>
                <div className={`text-xs text-center mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total: <span className={`font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{item.total_count}</span>
                </div>
                <div className={`text-xs text-center mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Value: <span className={`font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>{(item.value * item.total_count).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison View */}
        {compareMode && compareItems.length >= 2 && (
          <div className={`rounded-2xl shadow-2xl p-6 mb-6 backdrop-blur-lg ${darkMode ? 'bg-gray-800/90 border border-gray-700' : 'bg-white/90'}`}>
            <h2 className={`text-2xl font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <GitCompare className="w-6 h-6 text-blue-600" />
              Comparison View ({compareItems.length} items)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {compareItems.map((item, idx) => (
                <div key={item.id} className={`p-4 rounded-lg border-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className={`text-xs font-bold px-2 py-1 rounded ${darkMode ? 'bg-purple-600 text-white' : 'bg-purple-200 text-purple-800'}`}>
                      #{idx + 1}
                    </div>
                    <button
                      onClick={() => addToCompare(item)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className={`text-lg font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {item.name || 'N/A'}
                  </div>
                  <div className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {item.rank || 'N/A'}
                  </div>
                  <div className={`text-2xl font-bold mb-2 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                    {item.salary.toLocaleString()} IQD
                  </div>
                  <div className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total Notes: <span className="font-bold">{item.total_notes}</span>
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                    <div className={`text-xs font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Breakdown:</div>
                    {item.breakdown
                      .filter(b => visibleDenominations.has(b.value))
                      .map((b, i) => (
                        <div key={i} className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {b.value.toLocaleString()} × {b.count}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Calculations Table */}
        <div className={`rounded-2xl shadow-2xl p-6 backdrop-blur-lg ${darkMode ? 'bg-gray-800/90 border border-gray-700' : 'bg-white/90'}`}>
          <h2 className={`text-2xl font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            <FileText className="w-6 h-6 text-blue-600" />
            All Calculations ({filteredAndSortedHistory.length})
          </h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
              <p className={`mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading data...</p>
            </div>
          ) : filteredAndSortedHistory.length === 0 ? (
            <p className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {searchQuery || filterSalaryMin > 0 || filterSalaryMax > 0 ? "No matching calculations found" : "No calculations yet"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`${darkMode ? 'bg-gray-700' : 'bg-purple-100'}`}>
                    <th className={`p-3 text-left font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      <button
                        onClick={toggleAllRows}
                        className="hover:scale-110 transition-transform"
                      >
                        {selectedRows.size === filteredAndSortedHistory.length && filteredAndSortedHistory.length > 0 ? (
                          <CheckSquare className="w-5 h-5" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    </th>
                    <th className={`p-3 text-left font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>#</th>
                    <th className={`p-3 text-left font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Name</th>
                    <th className={`p-3 text-left font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Rank/Position</th>
                    {availableDepartments.length > 0 && (
                      <th className={`p-3 text-left font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Department</th>
                    )}
                    <th className={`p-3 text-left font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Salary (IQD)</th>
                    <th className={`p-3 text-left font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Total Notes</th>
                    <th className={`p-3 text-left font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Date</th>
                    <th className={`p-3 text-left font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Breakdown</th>
                    {compareMode && (
                      <th className={`p-3 text-left font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Compare</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedHistory.map((item, index) => (
                    <tr
                      key={item.id}
                      className={`border-b transition-colors ${
                        selectedRows.has(item.id) 
                          ? 'bg-purple-100 dark:bg-purple-900/30' 
                          : darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-purple-50'
                      }`}
                    >
                      <td className={`p-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <button
                          onClick={() => toggleRowSelection(item.id)}
                          className="hover:scale-110 transition-transform"
                        >
                          {selectedRows.has(item.id) ? (
                            <CheckSquare className="w-5 h-5 text-purple-600" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                      <td className={`p-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{index + 1}</td>
                      <td className={`p-3 font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{item.name || 'N/A'}</td>
                      <td className={`p-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{item.rank || 'N/A'}</td>
                      {availableDepartments.length > 0 && (
                        <td className={`p-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.department || 'N/A'}</td>
                      )}
                      <td className={`p-3 font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>{item.salary.toLocaleString()}</td>
                      <td className={`p-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item.total_notes}</td>
                      <td className={`p-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className={`p-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {item.breakdown
                          .filter(b => visibleDenominations.has(b.value))
                          .map((b, i) => (
                            <div key={i} className="whitespace-nowrap">
                              {b.value.toLocaleString()} IQD × {b.count}
                            </div>
                          ))}
                      </td>
                      {compareMode && (
                        <td className={`p-3`}>
                          <button
                            onClick={() => addToCompare(item)}
                            disabled={compareItems.length >= 4 && !compareItems.find(i => i.id === item.id)}
                            className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
                              compareItems.find(i => i.id === item.id)
                                ? 'bg-blue-600 text-white'
                                : compareItems.length >= 4
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : darkMode
                                ? 'bg-gray-600 hover:bg-gray-500 text-white'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                            }`}
                          >
                            {compareItems.find(i => i.id === item.id) ? 'Remove' : 'Add'}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

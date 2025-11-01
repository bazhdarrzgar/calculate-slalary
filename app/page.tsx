'use client';

import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { Download, History, Calculator, Trash2, FileText, Sheet, Search, RotateCcw, Moon, Sun, BarChart3, FileDown, Edit, Printer, Sparkles, Database, RefreshCw, LineChart } from "lucide-react";
import Fuse from "fuse.js";
import AnimatedBackground from "./components/AnimatedBackground";
import { useRouter } from "next/navigation";

const API = '/api';

interface Denomination {
  value: number;
  image_name: string;
  is_available: boolean;
  amount: number;
}

interface BreakdownItem {
  value: number;
  count: number;
  image_name: string;
}

interface CalculationResult {
  breakdown: BreakdownItem[];
  total_notes: number;
  remaining: number;
  success: boolean;
  message: string;
}

interface HistoryItem {
  id: string;
  name: string;
  rank: string;
  salary: number;
  breakdown: BreakdownItem[];
  total_notes: number;
  created_at: string;
}

// Debounce hook for search optimization
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function Home() {
  const [name, setName] = useState("");
  const [rank, setRank] = useState("");
  const [salary, setSalary] = useState(0);
  const [department, setDepartment] = useState("");
  const [denominations, setDenominations] = useState<Denomination[]>([]);
  const [selectedDenominations, setSelectedDenominations] = useState<number[]>([]);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [decreaseAmounts, setDecreaseAmounts] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [customDepartments, setCustomDepartments] = useState<string[]>(["کۆمیتە", "هاوکاری و چاودێری"]);
  const [showAddDepartment, setShowAddDepartment] = useState(false);
  const [newDepartment, setNewDepartment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEditAmountsModal, setShowEditAmountsModal] = useState(false);
  const [editedAmounts, setEditedAmounts] = useState<Record<number, number>>({});
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const router = useRouter();

  // Debounced search query for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Load dark mode from localStorage after mount (avoid hydration mismatch)
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('darkMode');
    if (saved) {
      setDarkMode(JSON.parse(saved));
    }
    // Load custom departments
    const savedDepartments = localStorage.getItem('customDepartments');
    if (savedDepartments) {
      setCustomDepartments(JSON.parse(savedDepartments));
    }
    // Check for selected template from features page
    const selectedTemplate = localStorage.getItem('selectedTemplate');
    if (selectedTemplate) {
      const template = JSON.parse(selectedTemplate);
      setName(template.name);
      setRank(template.rank);
      setDepartment(template.department);
      setSalary(template.salary);
      localStorage.removeItem('selectedTemplate');
    }
  }, []);

  useEffect(() => {
    fetchDenominations();
    fetchHistory();
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode, mounted]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'Enter') {
          e.preventDefault();
          calculateSalary();
        } else if (e.key === 'd') {
          e.preventDefault();
          setDarkMode(prev => !prev);
        } else if (e.key === 's') {
          e.preventDefault();
          setShowStats(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [salary, selectedDenominations]);

  const fetchDenominations = useCallback(async () => {
    try {
      const response = await axios.get<Denomination[]>(`${API}/denominations`);
      setDenominations(response.data);
      
      // Only set selected denominations if they haven't been set yet (initial load)
      if (selectedDenominations.length === 0) {
        setSelectedDenominations(response.data.map(d => d.value));
      }
    } catch (err) {
      console.error("Error fetching denominations:", err);
    }
  }, [selectedDenominations.length]);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await axios.get<HistoryItem[]>(`${API}/history`);
      setHistory(response.data);
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  }, []);

  const checkDbStatus = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/db-status`);
      setDbConnected(response.data.connected);
    } catch (err) {
      console.error("Error checking database status:", err);
      setDbConnected(false);
    }
  }, []);

  const reconnectDb = useCallback(async () => {
    setReconnecting(true);
    try {
      const response = await axios.post(`${API}/db-status`);
      setDbConnected(response.data.connected);
      if (response.data.connected) {
        // Refresh data after reconnection
        await fetchDenominations();
        await fetchHistory();
      }
    } catch (err) {
      console.error("Error reconnecting to database:", err);
      setDbConnected(false);
    } finally {
      setReconnecting(false);
    }
  }, [fetchDenominations, fetchHistory]);

  // Check database status on mount
  useEffect(() => {
    checkDbStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkDbStatus, 30000);
    return () => clearInterval(interval);
  }, [checkDbStatus]);

  const toggleDenomination = useCallback((value: number) => {
    setSelectedDenominations(prev =>
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  }, []);

  const calculateSalary = useCallback(async () => {
    setError("");
    setResult(null);

    if (salary <= 0) {
      setError("Please enter a valid salary");
      return;
    }

    if (selectedDenominations.length === 0) {
      setError("Please select at least one denomination");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post<CalculationResult>(`${API}/calculate`, {
        name: name || "N/A",
        rank: rank || "N/A",
        salary,
        available_denominations: selectedDenominations,
        decrease_amounts: decreaseAmounts
      });

      if (response.data.success) {
        setResult(response.data);
        // Refresh denominations to show updated amounts
        if (decreaseAmounts) {
          fetchDenominations();
        }
      } else {
        setError(response.data.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Calculation failed");
    } finally {
      setLoading(false);
    }
  }, [salary, selectedDenominations, name, rank, decreaseAmounts, fetchDenominations]);

  const saveCalculation = useCallback(async () => {
    if (!result) return;

    try {
      if (editingId) {
        // Update existing calculation
        await axios.put(`${API}/history/${editingId}`, {
          name: name.trim() || "Anonymous",
          rank: rank.trim() || "Not specified",
          salary,
          breakdown: result.breakdown,
          total_notes: result.total_notes
        });
        setEditingId(null);
      } else {
        // Create new calculation
        await axios.post(`${API}/history`, {
          name: name.trim() || "Anonymous",
          rank: rank.trim() || "Not specified",
          salary,
          breakdown: result.breakdown,
          total_notes: result.total_notes
        });
      }
      fetchHistory();
    } catch (err) {
      console.error(editingId ? "Failed to update calculation" : "Failed to save calculation", err);
    }
  }, [result, editingId, name, rank, salary, fetchHistory]);

  const editCalculation = useCallback((item: HistoryItem) => {
    setEditingId(item.id);
    setName(item.name);
    setRank(item.rank);
    setSalary(item.salary);
    setResult({
      breakdown: item.breakdown,
      total_notes: item.total_notes,
      remaining: 0,
      success: true,
      message: "Loaded for editing"
    });
    // Scroll to top to show the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const deleteHistory = useCallback(async (id: string) => {
    try {
      await axios.delete(`${API}/history/${id}`);
      fetchHistory();
      // If we're editing this item, clear the edit state
      if (editingId === id) {
        setEditingId(null);
      }
    } catch (err) {
      console.error("Failed to delete calculation:", err);
    }
  }, [editingId, fetchHistory]);

  const loadFromHistory = useCallback((item: HistoryItem) => {
    setEditingId(null); // Clear edit mode when loading
    setName(item.name);
    setRank(item.rank);
    setSalary(item.salary);
    setResult({
      breakdown: item.breakdown,
      total_notes: item.total_notes,
      remaining: 0,
      success: true,
      message: "Loaded from history"
    });
  }, []);

  const resetForm = useCallback(() => {
    setName("");
    setRank("");
    setSalary(0);
    setDepartment("");
    setResult(null);
    setError("");
    setEditingId(null); // Clear edit mode
  }, []);

  const exportPDF = useCallback(async (id: string) => {
    try {
      const response = await axios.get(`${API}/export/${id}/pdf`, {
        responseType: 'text'
      });
      
      // Open HTML in new window and trigger print
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert("Please allow pop-ups to export PDF");
        return;
      }
      
      printWindow.document.write(response.data);
      printWindow.document.close();
      
      // Wait for fonts to load then trigger print
      printWindow.onload = function() {
        setTimeout(function() {
          printWindow.print();
        }, 500);
      };
    } catch (err) {
      console.error("Failed to export PDF:", err);
    }
  }, []);

  const exportExcel = useCallback(async (id: string) => {
    try {
      const response = await axios.get(`${API}/export/${id}/excel`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `salary_breakdown_${id}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to export Excel:", err);
    }
  }, []);

  const updateDenominationAmount = async (value: number, newAmount: string) => {
    try {
      await axios.put(`${API}/denominations/${value}/amount`, {
        value,
        amount: parseInt(newAmount)
      });
      fetchDenominations();
    } catch (err) {
      console.error("Failed to update amount:", err);
    }
  };

  const updateMultipleDenominationAmounts = async () => {
    try {
      // Update all edited amounts
      for (const [value, amount] of Object.entries(editedAmounts)) {
        await axios.put(`${API}/denominations/${value}/amount`, {
          value: parseInt(value),
          amount: amount
        });
      }
      fetchDenominations();
      setShowEditAmountsModal(false);
      setEditedAmounts({});
    } catch (err) {
      console.error("Failed to update amounts:", err);
    }
  };

  const openEditAmountsModal = () => {
    // Initialize edited amounts with current values
    const amounts: Record<number, number> = {};
    denominations.forEach(denom => {
      amounts[denom.value] = denom.amount;
    });
    setEditedAmounts(amounts);
    setShowEditAmountsModal(true);
  };

  const handleAmountChange = (value: number, newAmount: number) => {
    setEditedAmounts(prev => ({
      ...prev,
      [value]: newAmount
    }));
  };

  const resetAllAmounts = async () => {
    try {
      await axios.post(`${API}/denominations/reset-amounts`);
      fetchDenominations();
    } catch (err) {
      console.error("Failed to reset amounts:", err);
    }
  };

  const exportDatabaseToExcel = async () => {
    if (history.length === 0) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Create detailed Excel content using proper Excel format
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Salary Database');
      
      // Add headers
      worksheet.columns = [
        { header: 'Name', key: 'name', width: 20 },
        { header: 'Rank/Position', key: 'rank', width: 20 },
        { header: 'Department', key: 'department', width: 20 },
        { header: 'Salary (IQD)', key: 'salary', width: 15 },
        { header: 'Total Notes', key: 'total_notes', width: 12 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Breakdown', key: 'breakdown', width: 40 }
      ];
      
      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF6B46C1' }
      };
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      
      // Add data
      history.forEach(item => {
        const breakdown = item.breakdown
          .map(b => `${b.value.toLocaleString()} IQD × ${b.count}`)
          .join(', ');
        
        worksheet.addRow({
          name: item.name,
          rank: item.rank,
          department: '-',
          salary: item.salary,
          total_notes: item.total_notes,
          date: new Date(item.created_at).toLocaleDateString(),
          breakdown: breakdown
        });
      });
      
      // Generate buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `salary_database_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setLoading(false);
    }
  };

  const addDepartment = () => {
    if (newDepartment.trim() && !customDepartments.includes(newDepartment.trim())) {
      const updatedDepartments = [...customDepartments, newDepartment.trim()];
      setCustomDepartments(updatedDepartments);
      localStorage.setItem('customDepartments', JSON.stringify(updatedDepartments));
      setNewDepartment("");
      setShowAddDepartment(false);
    }
  };

  const removeDepartment = (dept: string) => {
    const updatedDepartments = customDepartments.filter(d => d !== dept);
    setCustomDepartments(updatedDepartments);
    localStorage.setItem('customDepartments', JSON.stringify(updatedDepartments));
    if (department === dept) {
      setDepartment("");
    }
  };

  // Fuzzy search with fuse.js - now using debounced search query for better performance
  const filteredHistory = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return history;
    }

    const fuse = new Fuse(history, {
      keys: [
        { name: 'name', weight: 2 },
        { name: 'rank', weight: 1.5 },
        { name: 'salary', weight: 1 },
        { name: 'created_at', weight: 0.5 }
      ],
      threshold: 0.4,
      includeScore: true,
      minMatchCharLength: 1,
      ignoreLocation: true
    });

    const results = fuse.search(debouncedSearchQuery);
    return results.map(result => result.item);
  }, [history, debouncedSearchQuery]);

  // Statistics calculation
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

  const exportAllHistory = async () => {
    if (history.length === 0) {
      return;
    }
    
    try {
      // Create CSV content
      let csvContent = "Name,Rank,Salary (IQD),Total Notes,Date\n";
      history.forEach(item => {
        const date = new Date(item.created_at).toLocaleDateString();
        csvContent += `"${item.name}","${item.rank}",${item.salary},${item.total_notes},"${date}"\n`;
      });
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `salary_history_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to export history:", err);
    }
  };

  const printDatabaseData = () => {
    if (history.length === 0) {
      alert("No data to print");
      return;
    }

    // Create printable HTML content
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow pop-ups to print");
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html lang="ckb" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Iraqi Dinar Salary Calculator - Database Report</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&family=Noto+Naskh+Arabic:wght@400;700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Noto Naskh Arabic', 'Noto Sans Arabic', 'Arial', 'Segoe UI', 'Tahoma', sans-serif;
            padding: 30px;
            background: white;
            color: black;
            direction: rtl;
            text-align: right;
          }
          h1 { 
            text-align: center; 
            margin-bottom: 10px;
            color: #7c3aed;
            font-size: 24px;
            font-weight: 700;
          }
          .subtitle {
            text-align: center;
            margin-bottom: 20px;
            color: #666;
            font-size: 14px;
          }
          .print-date {
            text-align: center;
            margin-bottom: 30px;
            color: #999;
            font-size: 12px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px;
            direction: rtl;
          }
          th { 
            background: #7c3aed; 
            color: white; 
            padding: 12px; 
            text-align: right;
            font-weight: bold;
            border: 1px solid #5b21b6;
          }
          td { 
            padding: 10px; 
            border: 1px solid #ddd;
            text-align: right;
          }
          tr:nth-child(even) { 
            background: #f9f9f9; 
          }
          .breakdown {
            font-size: 12px;
            color: #666;
            line-height: 1.6;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }
          .stats {
            display: flex;
            justify-content: space-around;
            margin-bottom: 30px;
            padding: 20px;
            background: #f3f4f6;
            border-radius: 8px;
            flex-wrap: wrap;
          }
          .stat-item {
            text-align: center;
            min-width: 150px;
            margin: 10px;
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
          .number {
            direction: ltr;
            display: inline-block;
          }
          @media print {
            body { padding: 10px; }
            .stats { page-break-inside: avoid; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            @page { 
              margin: 1cm; 
              size: A4;
            }
          }
        </style>
      </head>
      <body>
        <h1>💰 حیسابکەری مووچەی دیناری عێراقی</h1>
        <div class="subtitle">ڕاپۆرتی بنکەی داتا - هەموو ژمێریاریەکان</div>
        <div class="print-date">چاپکراوە لە: ${new Date().toLocaleString('ckb-IQ', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        })}</div>
        
        ${statistics ? `
        <div class="stats">
          <div class="stat-item">
            <div class="stat-label">کۆی گشتی ژمێریاریەکان</div>
            <div class="stat-value"><span class="number">${statistics.totalCalculations}</span></div>
          </div>
          <div class="stat-item">
            <div class="stat-label">تێکڕای مووچە</div>
            <div class="stat-value"><span class="number">${Math.round(statistics.avgSalary).toLocaleString()}</span> IQD</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">بەرزترین مووچە</div>
            <div class="stat-value"><span class="number">${statistics.maxSalary.toLocaleString()}</span> IQD</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">تێکڕای کاغەزەکان</div>
            <div class="stat-value"><span class="number">${Math.round(statistics.avgNotes)}</span></div>
          </div>
        </div>
        ` : ''}
        
        <table>
          <thead>
            <tr>
              <th>ژمارە</th>
              <th>ناو</th>
              <th>پلە/پێگە</th>
              <th>مووچە (IQD)</th>
              <th>کۆی کاغەزەکان</th>
              <th>بەروار</th>
              <th>دابەشکردن</th>
            </tr>
          </thead>
          <tbody>
            ${history.map((item, index) => `
              <tr>
                <td><span class="number">${index + 1}</span></td>
                <td>${item.name}</td>
                <td>${item.rank}</td>
                <td><span class="number">${item.salary.toLocaleString()}</span></td>
                <td><span class="number">${item.total_notes}</span></td>
                <td><span class="number">${new Date(item.created_at).toLocaleDateString('ckb-IQ')}</span></td>
                <td class="breakdown">
                  ${item.breakdown.map(b => `<span class="number">${b.value.toLocaleString()}</span> IQD × <span class="number">${b.count}</span>`).join('<br>')}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          دروستکراوە لەلایەن حیسابکەری مووچەی دیناری عێراقی | کۆی تۆمارەکان: <span class="number">${history.length}</span>
        </div>
        
        <script>
          window.onload = function() {
            // Small delay to ensure fonts are loaded
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

  return (
    <div className={`min-h-screen transition-colors duration-300 relative p-4 md:p-8`}>
      {/* Animated Background */}
      <AnimatedBackground darkMode={darkMode} />
      
      <div className="max-w-[1800px] mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8 relative">
          <h1 className={`text-4xl md:text-5xl font-bold mb-3 flex items-center justify-center gap-3 transition-colors ${darkMode ? 'text-white' : 'text-white'}`}>
            💰 M.I.S Salary
          </h1>
          <p className={`text-lg transition-colors ${darkMode ? 'text-gray-300' : 'text-purple-100'}`}>
            Calculate optimal banknote breakdown for your salary
          </p>
          
          {/* Theme Toggle & Stats Buttons */}
          <div className="absolute top-0 right-0 flex gap-2">
            {/* Database Status Indicator */}
            <div className={`flex items-center gap-2 px-3 py-3 rounded-lg ${
              dbConnected === null 
                ? 'bg-gray-500/20 text-gray-400' 
                : dbConnected 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
            }`} title={
              dbConnected === null 
                ? 'Checking database status...' 
                : dbConnected 
                  ? 'Database connected' 
                  : 'Database disconnected'
            }>
              <Database className={`w-5 h-5 ${
                dbConnected === null 
                  ? 'text-gray-400' 
                  : dbConnected 
                    ? 'text-green-500 animate-pulse' 
                    : 'text-red-500'
              }`} />
            </div>
            
            {/* Reconnect Button */}
            <button
              onClick={reconnectDb}
              disabled={reconnecting || dbConnected === true}
              className={`p-3 rounded-lg transition-all transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${
                darkMode 
                  ? 'bg-gray-700 text-blue-400 hover:bg-gray-600' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              } ${reconnecting ? 'animate-spin' : ''}`}
              title="Reconnect to Database"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => router.push('/all-data')}
              className={`p-3 rounded-lg transition-all transform hover:scale-110 ${darkMode ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700' : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700'}`}
              title="View All Data & Analytics"
            >
              <Database className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.push('/features')}
              className={`p-3 rounded-lg transition-all transform hover:scale-110 ${darkMode ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700' : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'}`}
              title="Advanced Features"
            >
              <Sparkles className="w-5 h-5" />
            </button>
            <button
              onClick={exportDatabaseToExcel}
              disabled={loading || history.length === 0}
              className={`p-3 rounded-lg transition-all transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${darkMode ? 'bg-gray-700 text-green-400 hover:bg-gray-600' : 'bg-white/20 text-white hover:bg-white/30'}`}
              title="Download Entire Database as Excel"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowStats(!showStats)}
              className={`p-3 rounded-lg transition-all transform hover:scale-110 ${darkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-white/20 text-white hover:bg-white/30'}`}
              title="Toggle Statistics (Ctrl+S)"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
            <button
              onClick={printDatabaseData}
              disabled={history.length === 0}
              className={`p-3 rounded-lg transition-all transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${darkMode ? 'bg-gray-700 text-blue-400 hover:bg-gray-600' : 'bg-white/20 text-white hover:bg-white/30'}`}
              title="Print Database Data"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-3 rounded-lg transition-all transform hover:scale-110 ${darkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-white/20 text-white hover:bg-white/30'}`}
              title="Toggle Dark Mode (Ctrl+D)"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Statistics Panel */}
        {showStats && statistics && (
          <div className={`mb-6 p-6 rounded-2xl shadow-2xl transition-all backdrop-blur-lg ${darkMode ? 'bg-gray-800/90 border border-gray-700' : 'bg-white/90'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-2xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                <BarChart3 className="w-6 h-6 text-purple-500" />
                Statistics Dashboard
              </h2>
              <button
                onClick={exportAllHistory}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
              >
                <FileDown className="w-4 h-4" />
                Export All History
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-purple-50'}`}>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Calculations</div>
                <div className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>{statistics.totalCalculations}</div>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Salary</div>
                <div className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{Math.round(statistics.avgSalary).toLocaleString()}</div>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Max Salary</div>
                <div className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{statistics.maxSalary.toLocaleString()}</div>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-amber-50'}`}>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Notes</div>
                <div className={`text-2xl font-bold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>{Math.round(statistics.avgNotes)}</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Main Calculator */}
          <div className="xl:col-span-3">
            <div className={`rounded-2xl shadow-2xl p-6 md:p-8 transition-colors backdrop-blur-lg ${darkMode ? 'bg-gray-800/90 border border-gray-700' : 'bg-white/90'}`}>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  <Calculator className="w-6 h-6 text-purple-600" />
                  Employee Information
                  {editingId && (
                    <span className="ml-2 px-3 py-1 text-sm bg-amber-500 text-white rounded-full">
                      Editing Mode
                    </span>
                  )}
                </h2>
                <button
                  onClick={resetForm}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Form
                </button>
              </div>

              {/* Employee Information Form - Grid Layout */}
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Name <span className={`font-normal ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:border-purple-500 focus:outline-none transition-colors ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900'}`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Rank/Position <span className={`font-normal ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={rank}
                      onChange={(e) => setRank(e.target.value)}
                      placeholder="Enter your rank or position"
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:border-purple-500 focus:outline-none transition-colors ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900'}`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Department <span className={`font-normal ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>(Optional)</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className={`flex-1 px-4 py-3 border-2 rounded-lg focus:border-purple-500 focus:outline-none transition-colors ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                      >
                        <option value="">Select department</option>
                        {customDepartments.map((dept, index) => (
                          <option key={index} value={dept}>{dept}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => setShowAddDepartment(!showAddDepartment)}
                        className={`px-4 py-3 rounded-lg font-semibold transition-colors ${darkMode ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                        title="Add/Manage Departments"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Salary Amount (IQD)
                    </label>
                    <input
                      type="text"
                      value={salary || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setSalary(parseInt(value) || 0);
                      }}
                      placeholder="e.g., 888000"
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:border-purple-500 focus:outline-none transition-colors text-lg font-semibold ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900'}`}
                    />
                  </div>
                </div>
                
                {/* Add/Manage Department Section */}
                {showAddDepartment && (
                  <div className={`mt-4 p-4 border-2 rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newDepartment}
                        onChange={(e) => setNewDepartment(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addDepartment()}
                        placeholder="Add new department"
                        className={`flex-1 px-3 py-2 border rounded-lg focus:border-purple-500 focus:outline-none ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      />
                      <button
                        onClick={addDepartment}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
                      >
                        Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div className={`text-xs font-semibold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Manage Departments:
                      </div>
                      {customDepartments.map((dept, index) => (
                        <div key={index} className={`flex items-center justify-between p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                          <span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>{dept}</span>
                          <button
                            onClick={() => removeDepartment(dept)}
                            className="text-red-500 hover:text-red-700 text-sm font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Available Denominations - Horizontal Grid Layout */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    Available Denominations
                  </h3>
                  <button
                    onClick={openEditAmountsModal}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${darkMode ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                  >
                    <Edit className="w-4 h-4" />
                    Edit Amounts
                  </button>
                </div>
                
                {/* Horizontal grid layout */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {denominations.map((denom) => (
                    <div
                      key={denom.value}
                      className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                        selectedDenominations.includes(denom.value)
                          ? darkMode 
                            ? "border-purple-500 bg-purple-900/30" 
                            : "border-purple-500 bg-purple-50"
                          : darkMode
                            ? "border-gray-600 bg-gray-700/50 opacity-60"
                            : "border-gray-200 bg-gray-50 opacity-60"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedDenominations.includes(denom.value)}
                        onChange={() => toggleDenomination(denom.value)}
                        className="w-5 h-5 text-purple-600 rounded cursor-pointer mb-2"
                      />
                      <img
                        src={`/currency/${denom.image_name}`}
                        alt={`${denom.value} Dinar`}
                        className="w-full h-16 object-cover rounded border border-gray-300 mb-2"
                      />
                      <div className={`font-semibold text-center text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        {denom.value.toLocaleString()} IQD
                      </div>
                      <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Amount: <span className={`font-semibold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>{denom.amount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decrease amounts toggle */}
              <div className="mb-6">
                <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${darkMode ? 'bg-amber-900/20 border-amber-700 hover:bg-amber-900/30' : 'bg-amber-50 border-amber-200 hover:bg-amber-100'}`}>
                  <input
                    type="checkbox"
                    checked={decreaseAmounts}
                    onChange={(e) => setDecreaseAmounts(e.target.checked)}
                    className="w-5 h-5 text-purple-600 rounded cursor-pointer"
                  />
                  <div>
                    <div className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Decrease amounts after calculation</div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>When enabled, the amounts will be reduced based on the calculation</div>
                  </div>
                </label>
              </div>

              {/* Calculate Button */}
              <button
                onClick={calculateSalary}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-lg font-bold rounded-lg hover:from-purple-700 hover:to-indigo-700 transform hover:scale-[1.02] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Calculating..." : "Calculate Breakdown (Ctrl+Enter)"}
              </button>

              {/* Error Message */}
              {error && (
                <div className={`mt-4 p-4 border-2 rounded-lg ${darkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  {error}
                </div>
              )}

              {/* Results */}
              {result && result.success && (
                <div className={`mt-6 p-6 rounded-xl border-2 ${darkMode ? 'bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-purple-700' : 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200'}`}>
                  <h3 className={`text-xl font-bold mb-4 flex items-center justify-between ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    📊 Banknote Breakdown
                    <button
                      onClick={saveCalculation}
                      className={`text-sm px-4 py-2 rounded-lg transition-colors ${
                        editingId 
                          ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                    >
                      {editingId ? 'Update Calculation' : 'Save to History'}
                    </button>
                  </h3>

                  <div className="space-y-3">
                    {result.breakdown.map((item, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-4 rounded-lg shadow-sm ${darkMode ? 'bg-gray-700' : 'bg-white'}`}
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={`/currency/${item.image_name}`}
                            alt={`${item.value} Dinar`}
                            className="w-16 h-8 object-cover rounded border border-gray-300"
                          />
                          <span className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            {item.value.toLocaleString()} IQD
                          </span>
                        </div>
                        <span className="text-2xl font-bold text-purple-600">
                          × {item.count}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-4 bg-purple-600 text-white rounded-lg text-center">
                    <div className="text-2xl font-bold">
                      Total: {salary.toLocaleString()} IQD
                    </div>
                    <div className="text-sm opacity-90 mt-1">
                      Total Notes: {result.total_notes}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* History Sidebar */}
          <div className="xl:col-span-2">
            <div className={`rounded-2xl shadow-2xl p-6 sticky top-4 transition-colors backdrop-blur-lg ${darkMode ? 'bg-gray-800/90 border border-gray-700' : 'bg-white/90'}`}>
              <h2 className={`text-2xl font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                <History className="w-6 h-6 text-purple-600" />
                Calculation History
              </h2>

              {/* Search Input */}
              <div className="mb-4">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, rank, salary, or date..."
                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:border-purple-500 focus:outline-none transition-colors text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900'}`}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
                {searchQuery && (
                  <div className={`text-xs mt-1 ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {filteredHistory.length} result{filteredHistory.length !== 1 ? 's' : ''} found
                  </div>
                )}
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredHistory.length === 0 ? (
                  <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {searchQuery ? "No matching calculations found" : "No calculations yet"}
                  </p>
                ) : (
                  filteredHistory.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-lg border-2 transition-colors ${darkMode ? 'bg-gray-700 border-gray-600 hover:border-purple-500' : 'bg-gray-50 border-gray-200 hover:border-purple-300'}`}
                    >
                      <div className="mb-2">
                        <div className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{item.name}</div>
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.rank}</div>
                      </div>
                      <div className={`text-lg font-semibold mb-2 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                        {item.salary.toLocaleString()} IQD
                      </div>
                      <div className={`text-xs mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => loadFromHistory(item)}
                          className="flex-1 px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => editCalculation(item)}
                          className="px-3 py-2 bg-amber-600 text-white text-sm rounded hover:bg-amber-700 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => exportPDF(item.id)}
                          className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                          title="Export PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => exportExcel(item.id)}
                          className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                          title="Export Excel"
                        >
                          <Sheet className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteHistory(item.id)}
                          className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Keyboard Shortcuts Help */}
        <div className={`mt-6 p-4 rounded-lg text-center text-sm backdrop-blur-lg ${darkMode ? 'bg-gray-800/70 text-gray-300' : 'bg-white/50 text-gray-700'}`}>
          <p>💡 Keyboard Shortcuts: <kbd className="px-2 py-1 rounded bg-black/20">Ctrl+Enter</kbd> Calculate | <kbd className="px-2 py-1 rounded bg-black/20">Ctrl+D</kbd> Dark Mode | <kbd className="px-2 py-1 rounded bg-black/20">Ctrl+S</kbd> Stats</p>
        </div>
      </div>

      {/* Edit Amounts Modal */}
      {showEditAmountsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto ${darkMode ? 'bg-gray-800 border-2 border-gray-700' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                <Edit className="w-6 h-6 text-purple-600" />
                Edit Denomination Amounts
              </h2>
              <button
                onClick={() => setShowEditAmountsModal(false)}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {denominations.map((denom) => (
                <div
                  key={denom.value}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={`/currency/${denom.image_name}`}
                      alt={`${denom.value} Dinar`}
                      className="w-20 h-10 object-cover rounded border border-gray-300"
                    />
                    <div>
                      <div className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        {denom.value.toLocaleString()} IQD
                      </div>
                      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Current: {denom.amount}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Amount:
                    </label>
                    <input
                      type="number"
                      value={editedAmounts[denom.value] || 0}
                      onChange={(e) => handleAmountChange(denom.value, parseInt(e.target.value) || 0)}
                      min="0"
                      className={`w-24 px-3 py-2 text-center border-2 rounded-lg focus:border-purple-500 focus:outline-none font-semibold ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEditAmountsModal(false)}
                className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
              >
                Cancel
              </button>
              <button
                onClick={updateMultipleDenominationAmounts}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

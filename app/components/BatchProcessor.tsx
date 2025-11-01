'use client';

import React, { useState } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';

interface BatchEmployee {
  name: string;
  rank: string;
  department: string;
  salary: number;
}

interface BatchResult {
  employee: BatchEmployee;
  breakdown: Array<{ value: number; count: number; image_name: string }>;
  total_notes: number;
  success: boolean;
  message: string;
}

interface BatchSummary {
  total_employees: number;
  successful: number;
  failed: number;
  total_salary: number;
  total_notes: number;
  denomination_totals: Record<number, number>;
}

export default function BatchProcessor({ darkMode, denominations }: { darkMode: boolean; denominations: Array<{ value: number }> }) {
  const [employees, setEmployees] = useState<BatchEmployee[]>([]);
  const [results, setResults] = useState<BatchResult[] | null>(null);
  const [summary, setSummary] = useState<BatchSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveToHistory, setSaveToHistory] = useState(true);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setResults(null);

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      let parsedEmployees: BatchEmployee[] = [];

      if (fileExtension === 'csv') {
        // Parse CSV file
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          setError('File must contain at least a header row and one data row');
          return;
        }
        
        // Parse CSV
        for (let i = 1; i < lines.length; i++) {
          const columns = lines[i].split(',').map(col => col.trim().replace(/^"|"$/g, ''));
          
          if (columns.length >= 2) {
            const name = columns[0] || `Employee ${i}`;
            const salaryStr = columns[columns.length - 1].replace(/[^0-9]/g, '');
            const salary = parseInt(salaryStr);
            
            if (salary > 0) {
              parsedEmployees.push({
                name,
                rank: columns[1] || '',
                department: columns[2] || '',
                salary
              });
            }
          }
        }
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls' || fileExtension === 'xlsm') {
        // Parse Excel file
        const ExcelJS = (await import('exceljs')).default;
        const workbook = new ExcelJS.Workbook();
        const arrayBuffer = await file.arrayBuffer();
        await workbook.xlsx.load(arrayBuffer);
        
        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
          setError('No worksheet found in Excel file');
          return;
        }

        // Skip header row (row 1) and start from row 2
        let rowCount = 0;
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header
          
          const name = row.getCell(1).value?.toString().trim() || `Employee ${rowNumber}`;
          const rank = row.getCell(2).value?.toString().trim() || '';
          const department = row.getCell(3).value?.toString().trim() || '';
          const salaryValue = row.getCell(4).value;
          
          let salary = 0;
          if (typeof salaryValue === 'number') {
            salary = Math.round(salaryValue);
          } else if (typeof salaryValue === 'string') {
            salary = parseInt(salaryValue.replace(/[^0-9]/g, ''));
          }
          
          if (salary > 0 && name) {
            parsedEmployees.push({
              name,
              rank,
              department,
              salary
            });
            rowCount++;
          }
        });

        if (rowCount === 0) {
          setError('No valid employee data found in Excel file');
          return;
        }
      } else {
        setError('Unsupported file format. Please upload CSV, XLSX, XLS, or XLSM file.');
        return;
      }

      if (parsedEmployees.length === 0) {
        setError('No valid employee data found in file');
        return;
      }

      setEmployees(parsedEmployees);
    } catch (err) {
      setError('Failed to parse file. Please ensure it is properly formatted.');
      console.error(err);
    }
  };

  const processBatch = async () => {
    if (employees.length === 0) return;

    setLoading(true);
    setError('');

    try {
      const selectedDenominations = denominations.map(d => d.value);
      
      const response = await fetch('/api/batch-calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employees,
          available_denominations: selectedDenominations,
          save_to_history: saveToHistory
        })
      });

      if (!response.ok) {
        throw new Error('Batch processing failed');
      }

      const data = await response.json();
      setResults(data.results);
      setSummary(data.summary);
    } catch (err) {
      setError('Failed to process batch. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = async () => {
    // Create CSV template
    const csv = 'Name,Rank/Position,Department,Salary (IQD)\nJohn Doe,Manager,Finance,1500000\nJane Smith,Engineer,IT,1200000\nAhmed Ali,Supervisor,Operations,950000\n';
    const csvBlob = new Blob([csv], { type: 'text/csv' });
    const csvUrl = window.URL.createObjectURL(csvBlob);
    const csvLink = document.createElement('a');
    csvLink.href = csvUrl;
    csvLink.download = 'salary_batch_template.csv';
    csvLink.click();
    
    // Also create Excel template
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Employee Salaries');
      
      // Add headers
      worksheet.columns = [
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Rank/Position', key: 'rank', width: 20 },
        { header: 'Department', key: 'department', width: 20 },
        { header: 'Salary (IQD)', key: 'salary', width: 15 }
      ];
      
      // Style header row
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF6B46C1' }
      };
      
      // Add sample data
      worksheet.addRow({ name: 'John Doe', rank: 'Manager', department: 'Finance', salary: 1500000 });
      worksheet.addRow({ name: 'Jane Smith', rank: 'Engineer', department: 'IT', salary: 1200000 });
      worksheet.addRow({ name: 'Ahmed Ali', rank: 'Supervisor', department: 'Operations', salary: 950000 });
      
      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'salary_batch_template.xlsx';
      link.click();
    } catch (err) {
      console.error('Failed to generate Excel template:', err);
    }
  };

  const downloadResults = () => {
    if (!results) return;

    let csv = 'Name,Rank,Department,Salary,Total Notes,Status,Message\n';
    results.forEach(result => {
      csv += `"${result.employee.name}","${result.employee.rank}","${result.employee.department}",${result.employee.salary},${result.total_notes},"${result.success ? 'Success' : 'Failed'}","${result.message}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `batch_results_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className={`rounded-2xl shadow-2xl p-6 backdrop-blur-lg ${darkMode ? 'bg-gray-800/90 border border-gray-700' : 'bg-white/90'}`}>
      <h2 className={`text-2xl font-bold mb-6 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        <FileSpreadsheet className="w-6 h-6 text-purple-600" />
        Batch Employee Processing
      </h2>

      <div className="space-y-6">
        {/* Upload Section */}
        <div className={`border-2 border-dashed rounded-lg p-6 text-center ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
          <Upload className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Upload a CSV or Excel file with employee salary data
          </p>
          <div className="flex gap-3 justify-center">
            <label className="px-4 py-2 bg-purple-600 text-white rounded-lg cursor-pointer hover:bg-purple-700 transition-colors">
              Choose File
              <input
                type="file"
                accept=".csv,.xlsx,.xls,.xlsm"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <button
              onClick={downloadTemplate}
              className={`px-4 py-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              <Download className="w-4 h-4 inline mr-2" />
              Download Template
            </button>
          </div>
          <p className={`mt-3 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            Supported formats: CSV, XLSX, XLS, XLSM
          </p>
        </div>

        {/* Employee List Preview */}
        {employees.length > 0 && !results && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Loaded Employees: {employees.length}
              </h3>
              <button
                onClick={() => setEmployees([])}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className={`max-h-60 overflow-y-auto rounded-lg border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
              <table className="w-full text-sm">
                <thead className={`sticky top-0 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <tr>
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Rank</th>
                    <th className="p-2 text-left">Department</th>
                    <th className="p-2 text-right">Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp, idx) => (
                    <tr key={idx} className={darkMode ? 'border-t border-gray-600' : 'border-t border-gray-200'}>
                      <td className="p-2">{emp.name}</td>
                      <td className="p-2">{emp.rank}</td>
                      <td className="p-2">{emp.department}</td>
                      <td className="p-2 text-right">{emp.salary.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Options */}
            <div className="mt-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={saveToHistory}
                  onChange={(e) => setSaveToHistory(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                  Save all calculations to history
                </span>
              </label>
            </div>

            <button
              onClick={processBatch}
              disabled={loading}
              className="w-full mt-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : `Process ${employees.length} Employees`}
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-start gap-2 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Results Display */}
        {results && summary && (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Success</div>
                <div className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                  {summary.successful}
                </div>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-red-50'}`}>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Failed</div>
                <div className={`text-2xl font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                  {summary.failed}
                </div>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Salary</div>
                <div className={`text-lg font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  {summary.total_salary.toLocaleString()}
                </div>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-purple-50'}`}>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Notes</div>
                <div className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                  {summary.total_notes}
                </div>
              </div>
            </div>

            {/* Denomination Totals */}
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h4 className={`font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Total Banknotes Needed
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(summary.denomination_totals)
                  .sort(([a], [b]) => parseInt(b) - parseInt(a))
                  .map(([value, count]) => (
                    <div key={value} className={`flex justify-between items-center p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                      <span className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        {parseInt(value).toLocaleString()} IQD
                      </span>
                      <span className="text-purple-600 font-bold">× {count}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={downloadResults}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                <Download className="w-4 h-4 inline mr-2" />
                Download Results
              </button>
              <button
                onClick={() => {
                  setResults(null);
                  setSummary(null);
                  setEmployees([]);
                }}
                className={`px-6 py-3 rounded-lg transition-colors font-semibold ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                New Batch
              </button>
            </div>

            {/* Detailed Results */}
            <div className={`max-h-96 overflow-y-auto rounded-lg border ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
              <table className="w-full text-sm">
                <thead className={`sticky top-0 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <tr>
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-right">Salary</th>
                    <th className="p-2 text-center">Notes</th>
                    <th className="p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, idx) => (
                    <tr key={idx} className={darkMode ? 'border-t border-gray-600' : 'border-t border-gray-200'}>
                      <td className="p-2">{result.employee.name}</td>
                      <td className="p-2 text-right">{result.employee.salary.toLocaleString()}</td>
                      <td className="p-2 text-center">{result.total_notes}</td>
                      <td className="p-2 text-center">
                        {result.success ? (
                          <CheckCircle className="w-5 h-5 text-green-500 inline" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-500 inline" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { NextResponse } from 'next/server';
import { getDb } from '@/database/db';

export async function GET() {
  try {
    const db = getDb();
    
    // Get all calculations
    const calculations = db.prepare(`
      SELECT salary, breakdown, total_notes, created_at
      FROM calculations
      ORDER BY created_at DESC
    `).all() as Array<{
      salary: number;
      breakdown: string;
      total_notes: number;
      created_at: string;
    }>;
    
    if (calculations.length === 0) {
      return NextResponse.json({
        total_calculations: 0,
        total_salary: 0,
        total_notes: 0,
        avg_salary: 0,
        avg_notes: 0,
        max_salary: 0,
        min_salary: 0,
        denomination_usage: {},
        daily_stats: [],
        monthly_stats: []
      });
    }
    
    // Basic statistics
    const totalCalculations = calculations.length;
    const totalSalary = calculations.reduce((sum, c) => sum + c.salary, 0);
    const totalNotes = calculations.reduce((sum, c) => sum + c.total_notes, 0);
    const avgSalary = totalSalary / totalCalculations;
    const avgNotes = totalNotes / totalCalculations;
    const salaries = calculations.map(c => c.salary);
    const maxSalary = Math.max(...salaries);
    const minSalary = Math.min(...salaries);
    
    // Denomination usage analysis
    const denominationUsage: Record<number, { count: number; total_amount: number }> = {};
    
    calculations.forEach(calc => {
      const breakdown = JSON.parse(calc.breakdown) as Array<{ value: number; count: number }>;
      breakdown.forEach(item => {
        if (!denominationUsage[item.value]) {
          denominationUsage[item.value] = { count: 0, total_amount: 0 };
        }
        denominationUsage[item.value].count += item.count;
        denominationUsage[item.value].total_amount += item.value * item.count;
      });
    });
    
    // Daily statistics (last 30 days)
    const dailyStats: Record<string, { date: string; count: number; total_salary: number; total_notes: number }> = {};
    
    calculations.forEach(calc => {
      const date = new Date(calc.created_at).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { date, count: 0, total_salary: 0, total_notes: 0 };
      }
      dailyStats[date].count++;
      dailyStats[date].total_salary += calc.salary;
      dailyStats[date].total_notes += calc.total_notes;
    });
    
    const dailyStatsArray = Object.values(dailyStats)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30);
    
    // Monthly statistics (last 12 months)
    const monthlyStats: Record<string, { month: string; count: number; total_salary: number; total_notes: number }> = {};
    
    calculations.forEach(calc => {
      const date = new Date(calc.created_at);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyStats[month]) {
        monthlyStats[month] = { month, count: 0, total_salary: 0, total_notes: 0 };
      }
      monthlyStats[month].count++;
      monthlyStats[month].total_salary += calc.salary;
      monthlyStats[month].total_notes += calc.total_notes;
    });
    
    const monthlyStatsArray = Object.values(monthlyStats)
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 12);
    
    // Salary distribution
    const salaryRanges = [
      { min: 0, max: 500000, label: '0-500K' },
      { min: 500000, max: 1000000, label: '500K-1M' },
      { min: 1000000, max: 2000000, label: '1M-2M' },
      { min: 2000000, max: 5000000, label: '2M-5M' },
      { min: 5000000, max: Infinity, label: '5M+' }
    ];
    
    const salaryDistribution = salaryRanges.map(range => ({
      label: range.label,
      count: calculations.filter(c => c.salary >= range.min && c.salary < range.max).length
    }));
    
    return NextResponse.json({
      total_calculations: totalCalculations,
      total_salary: totalSalary,
      total_notes: totalNotes,
      avg_salary: Math.round(avgSalary),
      avg_notes: Math.round(avgNotes),
      max_salary: maxSalary,
      min_salary: minSalary,
      denomination_usage: denominationUsage,
      daily_stats: dailyStatsArray,
      monthly_stats: monthlyStatsArray,
      salary_distribution: salaryDistribution
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

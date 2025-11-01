import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/database/db';
import { v4 as uuidv4 } from 'uuid';

interface BatchEmployee {
  name: string;
  rank: string;
  department: string;
  salary: number;
}

interface BreakdownItem {
  value: number;
  count: number;
  image_name: string;
}

interface BatchResult {
  employee: BatchEmployee;
  breakdown: BreakdownItem[];
  total_notes: number;
  success: boolean;
  message: string;
}

function calculateBreakdown(salary: number, availableDenominations: number[]): {
  breakdown: BreakdownItem[];
  total_notes: number;
  remaining: number;
  success: boolean;
  message: string;
} {
  const sortedDenoms = [...availableDenominations].sort((a, b) => b - a);
  
  let remaining = salary;
  const breakdown: BreakdownItem[] = [];
  
  for (const denom of sortedDenoms) {
    if (remaining >= denom) {
      const count = Math.floor(remaining / denom);
      breakdown.push({
        value: denom,
        count,
        image_name: `${denom}.jpg`
      });
      remaining -= count * denom;
    }
  }
  
  const total_notes = breakdown.reduce((sum, item) => sum + item.count, 0);
  
  if (remaining > 0) {
    return {
      breakdown: [],
      total_notes: 0,
      remaining,
      success: false,
      message: `Cannot make exact change for ${salary.toLocaleString()} IQD. Remaining: ${remaining.toLocaleString()} IQD`
    };
  }
  
  return {
    breakdown,
    total_notes,
    remaining: 0,
    success: true,
    message: 'Calculation successful'
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employees, available_denominations, save_to_history } = body as {
      employees: BatchEmployee[];
      available_denominations: number[];
      save_to_history: boolean;
    };
    
    if (!employees || employees.length === 0) {
      return NextResponse.json({ error: 'No employees provided' }, { status: 400 });
    }
    
    if (!available_denominations || available_denominations.length === 0) {
      return NextResponse.json({ error: 'At least one denomination must be selected' }, { status: 400 });
    }
    
    const db = getDb();
    const results: BatchResult[] = [];
    let successCount = 0;
    let failCount = 0;
    
    // Process each employee
    for (const employee of employees) {
      const result = calculateBreakdown(employee.salary, available_denominations);
      
      results.push({
        employee,
        breakdown: result.breakdown,
        total_notes: result.total_notes,
        success: result.success,
        message: result.message
      });
      
      if (result.success) {
        successCount++;
        
        // Save to history if requested
        if (save_to_history) {
          const calcId = uuidv4();
          const createdAt = new Date().toISOString();
          const breakdownJson = JSON.stringify(result.breakdown);
          
          db.prepare(`
            INSERT INTO calculations (id, name, rank, salary, breakdown, total_notes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            calcId,
            employee.name,
            `${employee.rank}${employee.department ? ` - ${employee.department}` : ''}`,
            employee.salary,
            breakdownJson,
            result.total_notes,
            createdAt
          );
        }
      } else {
        failCount++;
      }
    }
    
    // Calculate aggregated statistics
    const totalSalary = employees.reduce((sum, emp) => sum + emp.salary, 0);
    const totalNotes = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.total_notes, 0);
    
    // Calculate denomination totals needed
    const denominationTotals: Record<number, number> = {};
    results.forEach(result => {
      if (result.success) {
        result.breakdown.forEach(item => {
          denominationTotals[item.value] = (denominationTotals[item.value] || 0) + item.count;
        });
      }
    });
    
    return NextResponse.json({
      results,
      summary: {
        total_employees: employees.length,
        successful: successCount,
        failed: failCount,
        total_salary: totalSalary,
        total_notes: totalNotes,
        denomination_totals: denominationTotals
      }
    });
  } catch (error) {
    console.error('Error in batch calculation:', error);
    return NextResponse.json({ error: 'Batch calculation failed' }, { status: 500 });
  }
}

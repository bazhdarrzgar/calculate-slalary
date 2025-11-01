import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/database/db';

interface CalculationRequest {
  name: string;
  rank: string;
  salary: number;
  available_denominations: number[];
  decrease_amounts: boolean;
}

interface BreakdownItem {
  value: number;
  count: number;
  image_name: string;
}

interface CalculationResponse {
  breakdown: BreakdownItem[];
  total_notes: number;
  remaining: number;
  success: boolean;
  message: string;
}

function calculateBreakdown(salary: number, availableDenominations: number[]): CalculationResponse {
  // Sort denominations in descending order
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
      message: `Cannot make exact change for ${salary.toLocaleString()} IQD with the selected denominations. Remaining: ${remaining.toLocaleString()} IQD`
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

function calculateBreakdownWithLimits(
  salary: number, 
  availableDenominations: number[],
  amountMap: Map<number, number>
): CalculationResponse {
  // Sort denominations in descending order
  const sortedDenoms = [...availableDenominations].sort((a, b) => b - a);
  
  let remaining = salary;
  const breakdown: BreakdownItem[] = [];
  
  for (const denom of sortedDenoms) {
    if (remaining >= denom) {
      const idealCount = Math.floor(remaining / denom);
      const availableCount = amountMap.get(denom) || 0;
      
      // Use whatever is available, up to what we need
      const actualCount = Math.min(idealCount, availableCount);
      
      if (actualCount > 0) {
        breakdown.push({
          value: denom,
          count: actualCount,
          image_name: `${denom}.jpg`
        });
        remaining -= actualCount * denom;
      }
    }
  }
  
  const total_notes = breakdown.reduce((sum, item) => sum + item.count, 0);
  
  if (remaining > 0) {
    return {
      breakdown: [],
      total_notes: 0,
      remaining,
      success: false,
      message: `Cannot make exact change for ${salary.toLocaleString()} IQD with the available denominations. Remaining: ${remaining.toLocaleString()} IQD. Please add more denominations or increase available amounts.`
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
    const body: CalculationRequest = await request.json();
    const { salary, available_denominations, decrease_amounts } = body;
    
    if (salary <= 0) {
      return NextResponse.json({ error: 'Salary must be greater than 0' }, { status: 400 });
    }
    
    if (!available_denominations || available_denominations.length === 0) {
      return NextResponse.json({ error: 'At least one denomination must be selected' }, { status: 400 });
    }
    
    const db = getDb();
    
    // If decrease_amounts is true, check if we have enough of each denomination
    if (decrease_amounts) {
      const placeholders = available_denominations.map(() => '?').join(',');
      const denominationAmounts = db.prepare(
        `SELECT value, amount FROM denominations WHERE value IN (${placeholders})`
      ).all(...available_denominations) as Array<{ value: number; amount: number }>;
      
      const amountMap = new Map(denominationAmounts.map(d => [d.value, d.amount]));
      
      // Calculate breakdown with amount limits
      const result = calculateBreakdownWithLimits(salary, available_denominations, amountMap);
      
      if (result.success) {
        // Decrease amounts in database
        const updateStmt = db.prepare('UPDATE denominations SET amount = amount - ? WHERE value = ?');
        for (const item of result.breakdown) {
          updateStmt.run(item.count, item.value);
        }
      }
      
      return NextResponse.json(result);
    } else {
      // Just calculate without decreasing amounts
      const result = calculateBreakdown(salary, available_denominations);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Error calculating salary:', error);
    return NextResponse.json({ error: 'Calculation failed' }, { status: 500 });
  }
}

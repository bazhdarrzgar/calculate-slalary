import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/database/db';

// Use HTML to PDF approach with proper Kurdish font rendering
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const row = db.prepare(`
      SELECT id, name, rank, salary, breakdown, total_notes, created_at
      FROM calculations
      WHERE id = ?
    `).get(id) as any;
    
    if (!row) {
      return NextResponse.json({ error: 'Calculation not found' }, { status: 404 });
    }
    
    const breakdownData = JSON.parse(row.breakdown);
    const date = new Date(row.created_at).toLocaleDateString('ckb-IQ');
    
    // Generate HTML with proper Kurdish font support
    const html = `
<!DOCTYPE html>
<html lang="ckb" dir="rtl">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Noto Naskh Arabic', 'Noto Sans Arabic', Arial, sans-serif;
      padding: 40px;
      direction: rtl;
      text-align: right;
      color: #000;
      background: white;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #7c3aed;
    }
    
    .title {
      font-size: 28px;
      color: #7c3aed;
      font-weight: 700;
      margin-bottom: 10px;
    }
    
    .subtitle {
      font-size: 16px;
      color: #666;
    }
    
    .info-section {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .info-row:last-child {
      border-bottom: none;
    }
    
    .info-label {
      font-weight: 700;
      color: #374151;
      min-width: 120px;
    }
    
    .info-value {
      color: #1f2937;
      text-align: left;
      direction: ltr;
    }
    
    .info-value.rtl {
      text-align: right;
      direction: rtl;
    }
    
    .section-title {
      font-size: 20px;
      font-weight: 700;
      color: #7c3aed;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
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
      text-align: right;
      font-weight: 700;
      font-size: 14px;
    }
    
    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      text-align: right;
    }
    
    tr:nth-child(even) {
      background: #f9fafb;
    }
    
    .total-section {
      background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin-top: 20px;
    }
    
    .total-label {
      font-size: 16px;
      margin-bottom: 5px;
    }
    
    .total-value {
      font-size: 28px;
      font-weight: 700;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
    
    .number {
      direction: ltr;
      display: inline-block;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">💰 حیسابکەری مووچەی دیناری عێراقی</div>
    <div class="subtitle">Iraqi Dinar Salary Calculator</div>
  </div>
  
  <div class="info-section">
    <div class="info-row">
      <span class="info-label">ناو (Name):</span>
      <span class="info-value rtl">${row.name}</span>
    </div>
    <div class="info-row">
      <span class="info-label">پلە (Rank):</span>
      <span class="info-value rtl">${row.rank}</span>
    </div>
    <div class="info-row">
      <span class="info-label">مووچە (Salary):</span>
      <span class="info-value"><span class="number">${row.salary.toLocaleString()}</span> IQD</span>
    </div>
    <div class="info-row">
      <span class="info-label">کۆی کاغەزەکان (Total Notes):</span>
      <span class="info-value"><span class="number">${row.total_notes}</span></span>
    </div>
    <div class="info-row">
      <span class="info-label">بەروار (Date):</span>
      <span class="info-value"><span class="number">${date}</span></span>
    </div>
  </div>
  
  <div class="section-title">دابەشکردنی کاغەزەکان (Banknote Breakdown)</div>
  
  <table>
    <thead>
      <tr>
        <th>بڕی پارە (Denomination)</th>
        <th>ژمارە (Count)</th>
        <th>کۆی گشتی (Total)</th>
      </tr>
    </thead>
    <tbody>
      ${breakdownData.map((item: any) => `
        <tr>
          <td><span class="number">${item.value.toLocaleString()}</span> IQD</td>
          <td><span class="number">${item.count}</span></td>
          <td><span class="number">${(item.value * item.count).toLocaleString()}</span> IQD</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="total-section">
    <div class="total-label">کۆی گشتی (Total Amount)</div>
    <div class="total-value"><span class="number">${row.salary.toLocaleString()}</span> IQD</div>
  </div>
  
  <div class="footer">
    دروستکراوە لە: <span class="number">${new Date().toLocaleString('ckb-IQ')}</span>
  </div>
</body>
</html>`;

    // Return HTML that can be printed to PDF by the browser
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename=salary_breakdown_${row.id}.html`
      }
    });
  } catch (error) {
    console.error('Error exporting PDF:', error);
    return NextResponse.json({ error: 'Failed to export PDF' }, { status: 500 });
  }
}

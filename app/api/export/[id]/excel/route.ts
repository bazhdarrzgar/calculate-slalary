import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/database/db';
import ExcelJS from 'exceljs';

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
    
    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Salary Breakdown');
    
    // Title
    worksheet.mergeCells('A1:C1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'Iraqi Dinar Salary Calculator';
    titleCell.font = { bold: true, size: 16, color: { argb: 'FF667eea' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    
    // Employee info
    worksheet.getCell('A3').value = 'Name:';
    worksheet.getCell('B3').value = row.name;
    worksheet.getCell('A4').value = 'Rank:';
    worksheet.getCell('B4').value = row.rank;
    worksheet.getCell('A5').value = 'Salary:';
    worksheet.getCell('B5').value = `${row.salary.toLocaleString()} IQD`;
    worksheet.getCell('A6').value = 'Total Notes:';
    worksheet.getCell('B6').value = row.total_notes;
    worksheet.getCell('A7').value = 'Date:';
    worksheet.getCell('B7').value = row.created_at.substring(0, 10);
    
    // Make info labels bold
    ['A3', 'A4', 'A5', 'A6', 'A7'].forEach(cell => {
      worksheet.getCell(cell).font = { bold: true };
    });
    
    // Breakdown header
    worksheet.mergeCells('A9:D9');
    const headerCell = worksheet.getCell('A9');
    headerCell.value = 'Banknote Breakdown';
    headerCell.font = { bold: true, size: 14 };
    
    // Table headers
    const tableHeaders = ['Denomination', 'Count', 'Total'];
    worksheet.getRow(11).values = tableHeaders;
    worksheet.getRow(11).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF667eea' }
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 14 };
      cell.alignment = { horizontal: 'center' };
    });
    
    // Breakdown data
    let rowNum = 12;
    breakdownData.forEach((item: any) => {
      worksheet.getCell(`A${rowNum}`).value = `${item.value.toLocaleString()} IQD`;
      worksheet.getCell(`B${rowNum}`).value = item.count;
      worksheet.getCell(`C${rowNum}`).value = `${(item.value * item.count).toLocaleString()} IQD`;
      
      ['A', 'B', 'C'].forEach(col => {
        worksheet.getCell(`${col}${rowNum}`).alignment = { horizontal: 'center' };
      });
      
      rowNum++;
    });
    
    // Adjust column widths
    worksheet.getColumn('A').width = 20;
    worksheet.getColumn('B').width = 15;
    worksheet.getColumn('C').width = 20;
    
    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=salary_breakdown_${row.id}.xlsx`
      }
    });
  } catch (error) {
    console.error('Error exporting Excel:', error);
    return NextResponse.json({ error: 'Failed to export Excel' }, { status: 500 });
  }
}

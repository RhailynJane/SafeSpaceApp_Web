import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { Workbook } from 'exceljs';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx';
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

const prisma = new PrismaClient();

export async function GET(req, context) {
  try {
    // ✅ 1. Get report ID from URL params
    const { id } = context.params;

    // ✅ 2. Fetch the report from DB
    const report = await prisma.reports.findUnique({
      where: { id: Number(id) },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const { name, type, data } = report;

    // ✅ Generate Excel report
    if (type === 'Excel') {
      const workbook = new Workbook();
      const sheet = workbook.addWorksheet('Report');

      sheet.columns = [
        { header: 'Metric', key: 'metric', width: 30 },
        { header: 'Value', key: 'value', width: 20 },
      ];

      for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
          sheet.addRow({}); // Add a spacer row
          const subHeaders = Object.keys(value[0]);
          const headerRow = sheet.addRow(subHeaders);
          headerRow.font = { bold: true };

          value.forEach(item => {
            const rowData = subHeaders.map(header => item[header]);
            sheet.addRow(rowData);
          });
          sheet.addRow({}); // Add another spacer row
        } else if (Array.isArray(value)) {
          sheet.addRow({ metric: key, value: value.join(', ') });
        } else {
          sheet.addRow({ metric: key, value: String(value) });
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${name}.xlsx"`,
        },
      });
    }

    // ✅ Generate Word report
    if (type === 'Word') {
      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({ children: [new TextRun({ text: name, bold: true, size: 32, font: "Calibri" })], alignment: AlignmentType.CENTER }),
              new Paragraph({ text: `Generated on: ${new Date().toLocaleDateString()}`, alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
              ...Object.entries(data).map(([key, value]) => {
                if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
                  const headers = Object.keys(value[0]);
                  const table = new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                      new TableRow({
                        children: headers.map(h => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })] })),
                      }),
                      ...value.map(item => new TableRow({
                        children: headers.map(h => {
                          const cellValue = item[h];
                          const text = (cellValue instanceof Date) ? cellValue.toLocaleString() : String(cellValue ?? '');
                          return new TableCell({ children: [new Paragraph(text)] });
                        }),
                      })),
                    ],
                  });
                  return new Paragraph({ children: [new TextRun({ text: `\n${key}`, bold: true, size: 28 }), table] });
                }
                return new Paragraph({
                  children: [
                    new TextRun({ text: `${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: `, bold: true, size: 24 }),
                    new TextRun({ text: Array.isArray(value) ? value.join(', ') : String(value), size: 24 }),
                  ],
                  spacing: { after: 200 },
                });
              }),
            ],
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${name}.docx"`,
        },
      });
    }

    // ✅ Generate PDF report (default)
    const pdfStream = new PassThrough();
    const pdfDoc = new PDFDocument();
    pdfDoc.pipe(pdfStream);

    pdfDoc.fontSize(20).font('Helvetica-Bold').text(name, { align: 'center' });
    pdfDoc.fontSize(10).font('Helvetica').text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    pdfDoc.moveDown();

    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        pdfDoc.moveDown();
        pdfDoc.fontSize(14).font('Helvetica-Bold').text(key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), { underline: true });
        pdfDoc.moveDown(0.5);

        const headers = Object.keys(value[0]);
        const colWidths = headers.map(() => (pdfDoc.page.width - 100) / headers.length);
        
        let y = pdfDoc.y;
        headers.forEach((header, i) => {
          pdfDoc.fontSize(10).font('Helvetica-Bold').text(header, 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y);
        });
        pdfDoc.moveDown();

        value.forEach(item => {
          y = pdfDoc.y;
          headers.forEach((header, i) => {
            const cellValue = item[header];
            const text = (cellValue instanceof Date) ? cellValue.toLocaleString() : String(cellValue ?? '');
            pdfDoc.fontSize(9).font('Helvetica').text(text, 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y, { width: colWidths[i] - 10, align: 'left' });
          });
          pdfDoc.moveDown();
        });
      } else {
        pdfDoc.fontSize(12).font('Helvetica-Bold').text(`${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: `, { continued: true }).font('Helvetica').text(String(value));
      }
      pdfDoc.moveDown(0.5);
    });

    pdfDoc.end();

    return new NextResponse(pdfStream, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${name}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error downloading report:", error);
    return NextResponse.json({ error: "Failed to download report" }, { status: 500 });
  }
}
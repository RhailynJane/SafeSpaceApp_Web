import { NextResponse } from "next/server";
import { Workbook } from "exceljs";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
} from "docx";
import { jsPDF } from "jspdf";

/**
 * POST /api/reports/download
 * Generates and returns a report file on-the-fly without saving it to the database.
 * The request body should contain the report's name, type, and data.
 */
export async function POST(request) {
  try {
    const { name, type, data } = await request.json();

    if (!name || !type || !data) {
      return NextResponse.json(
        { error: "Missing name, type, or data for report generation" },
        { status: 400 }
      );
    }

    /**
     * ✅ Generate Excel report
     */
    if (type === "Excel") {
      const workbook = new Workbook();
      const sheet = workbook.addWorksheet("Report");

      sheet.columns = [
        { header: "Metric", key: "metric", width: 30 },
        { header: "Value", key: "value", width: 20 },
      ];

      for (const [key, value] of Object.entries(data)) {
        if (
          Array.isArray(value) &&
          value.length > 0 &&
          typeof value[0] === "object" &&
          value[0] !== null
        ) {
          sheet.addRow({});
          const subHeaders = Object.keys(value[0]);
          const headerRow = sheet.addRow(subHeaders);
          headerRow.font = { bold: true };

          value.forEach((item) => {
            const rowData = subHeaders.map((header) => item[header]);
            sheet.addRow(rowData);
          });
          sheet.addRow({});
        } else if (Array.isArray(value)) {
          sheet.addRow({ metric: key, value: value.join(", ") });
        } else {
          sheet.addRow({ metric: key, value: String(value) });
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${name}.xlsx"`,
        },
      });
    }

    /**
     * ✅ Generate Word report
     */
    if (type === "Word") {
      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: name, bold: true, size: 32, font: "Calibri" }),
                ],
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({
                text: `Generated on: ${new Date().toLocaleDateString()}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
              }),
              ...Object.entries(data).map(([key, value]) => {
                if (
                  Array.isArray(value) &&
                  value.length > 0 &&
                  typeof value[0] === "object"
                ) {
                  const headers = Object.keys(value[0]);
                  const table = new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                      new TableRow({
                        children: headers.map(
                          (h) =>
                            new TableCell({
                              children: [
                                new Paragraph({
                                  children: [new TextRun({ text: h, bold: true })],
                                }),
                              ],
                            })
                        ),
                      }),
                      ...value.map(
                        (item) =>
                          new TableRow({
                            children: headers.map((h) => {
                              const cellValue = item[h];
                              const text =
                                cellValue instanceof Date
                                  ? cellValue.toLocaleString()
                                  : String(cellValue ?? "");
                              return new TableCell({
                                children: [new Paragraph(text)],
                              });
                            }),
                          })
                      ),
                    ],
                  });
                  return new Paragraph({
                    children: [new TextRun({ text: `\n${key}`, bold: true, size: 28 }), table],
                  });
                }
                return new Paragraph({
                  children: [
                    new TextRun({
                      text: `${key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}: `,
                      bold: true,
                      size: 24,
                    }),
                    new TextRun({
                      text: Array.isArray(value)
                        ? value.join(", ")
                        : String(value),
                      size: 24,
                    }),
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
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${name}.docx"`,
        },
      });
    }

    /**
     * ✅ Generate PDF report (using jsPDF)
     */
    if (type === "PDF") {
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.text(name, 20, 30);

      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);

      let y = 70;
      Object.entries(data).forEach(([key, value]) => {
        if (y > 270) {
          doc.addPage();
          y = 30;
        }

        doc.setFontSize(12);
        doc.text(`${key}:`, 20, y);
        y += 10;
        doc.setFontSize(10);
        doc.text(String(value), 40, y);
        y += 15;
      });

      const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${name}.pdf"`,
        },
      });
    }

    return NextResponse.json(
      { error: "Unsupported report type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error downloading report:", error);
    return NextResponse.json(
      { error: "Failed to download report" },
      { status: 500 }
    );
  }
}

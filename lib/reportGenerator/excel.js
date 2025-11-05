import ExcelJS from "exceljs";

export async function createExcelBuffer(data, reportType) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(reportType);

  // Add columns dynamically from first object
  if (data.length > 0) {
    sheet.columns = Object.keys(data[0]).map((key) => ({ header: key, key }));
    data.forEach((row) => sheet.addRow(row));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

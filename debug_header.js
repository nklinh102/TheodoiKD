
const XLSX = require('xlsx');
const path = require('path');

const filePath = 'c:\\Users\\Admin\\Downloads\\BaocaoKDweb\\DataCA.csv.xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON with array of arrays to see raw headers
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log("Sheet Name:", sheetName);
    if (rows.length > 0) {
        console.log("Headers (Row 0):", rows[0]);
    }
    if (rows.length > 1) {
        console.log("First Data Row (Row 1):", rows[1]);
    }

    // Also try checking the raw cell value for a potential date cell if we can guess the column
    // Let's print all cells in first row to be sure
} catch (error) {
    console.error("Error reading file:", error.message);
}

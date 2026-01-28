const XLSX = require('xlsx');
const fs = require('fs');

const fileName = process.argv[2];
if (!fileName) {
    console.error("Please provide a file name");
    process.exit(1);
}

const buffer = fs.readFileSync(fileName);
const wb = XLSX.read(buffer, { type: 'buffer' });
const sheetName = wb.SheetNames[0];
const sheet = wb.Sheets[sheetName];

const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
console.log("First 5 rows:");
data.slice(0, 5).forEach((row, i) => {
    console.log(`Row ${i}:`, JSON.stringify(row));
});

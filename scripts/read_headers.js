
const XLSX = require('xlsx');
const fs = require('fs');

const filePath = 'c:/Users/Admin/Downloads/BaocaoKDweb/HĐ nộp cấp.xlsx';

try {
    if (!fs.existsSync(filePath)) {
        console.error('File not found:', filePath);
        process.exit(1);
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON to get headers easier (array of arrays)
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (data.length > 0) {
        console.log('Headers:', JSON.stringify(data[0]));
        // Print first simplified row to see data sample
        if (data.length > 1) {
            console.log('Sample Row:', JSON.stringify(data[1]));
        }
    } else {
        console.log('Empty file');
    }

} catch (e) {
    console.error('Error reading file:', e);
}

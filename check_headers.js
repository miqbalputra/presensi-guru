import xlsx from 'xlsx';
import fs from 'fs';

try {
    const workbook = xlsx.readFile('data_guru.xlsx');
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    
    if (data.length > 0) {
        console.log("Headers found:", Object.keys(data[0]));
        console.log("Sample row:", data[0]);
    } else {
        console.log("No data found in sheet.");
    }
} catch (error) {
    console.error("Error reading file:", error.message);
}

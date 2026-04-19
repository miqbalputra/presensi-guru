import xlsx from 'xlsx';
import fs from 'fs';

// Helper to convert Excel serial dates to YYYY-MM-DD
function excelDateToISO(serial) {
    if (!serial) return null;
    const date = new Date(Math.round((serial - 25569) * 864e5));
    return date.toISOString().split('T')[0];
}

// Helper to convert Excel serial dates to DDMMYYYY
function excelDateToDDMMYYYY(serial) {
    if (!serial) return null;
    const date = new Date(Math.round((serial - 25569) * 864e5));
    const d = String(date.getUTCDate()).padStart(2, '0');
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const y = date.getUTCFullYear();
    return `${d}${m}${y}`;
}

try {
    const workbook = xlsx.readFile('data_guru.xlsx');
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Sort by 'Tanggal mulai bertugas'
    data.sort((a, b) => (a['Tanggal mulai bertugas'] || 99999) - (b['Tanggal mulai bertugas'] || 99999));

    const processed = data.map((row, index) => {
        const id_guru = `GQ${String(index + 1).padStart(3, '0')}`;
        const tglLahir = row['Tanggal Lahir'];
        const userPass = excelDateToDDMMYYYY(tglLahir);
        
        // Split Jabatan by comma if multiple
        let jabatanArr = [];
        if (row['Jabatan']) {
            jabatanArr = row['Jabatan'].split(',').map(j => j.trim());
        }

        return {
            id_guru: id_guru,
            username: userPass,
            password_plain: userPass, // will be hashed in PHP
            role: 'guru',
            nama: row['Nama Lengkap'],
            tempat_lahir: row['Tempat Lahir'],
            tanggal_lahir: excelDateToISO(tglLahir),
            jenis_kelamin: row['Jenis Kelamin'],
            alamat: row['Alamat'],
            no_hp: row['No HP'],
            jabatan: JSON.stringify(jabatanArr),
            tanggal_bertugas: excelDateToISO(row['Tanggal mulai bertugas'])
        };
    });

    fs.writeFileSync('data_guru.json', JSON.stringify(processed, null, 2));
    console.log(`Successfully processed ${processed.length} teachers of data.`);
} catch (error) {
    console.error("Error:", error.message);
}

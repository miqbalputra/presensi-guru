// Script untuk fix format tanggal di DownloadLaporan.jsx
const fs = require('fs');

const filePath = 'src/components/admin/DownloadLaporan.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace semua occurrence
content = content.replace(/log\.tanggal\.split\('-'\)\.reverse\(\)\.join\('-'\)/g, 'log.tanggal');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed all date formats in DownloadLaporan.jsx');

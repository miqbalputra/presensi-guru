// Format tanggal ke dd-mm-yyyy
export const formatDate = (date) => {
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}-${month}-${year}`
}

// Format tanggal untuk input date (yyyy-mm-dd)
export const formatDateForInput = (date) => {
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${year}-${month}-${day}`
}

// Hitung lama bertugas
export const calculateWorkDuration = (startDate) => {
  const start = new Date(startDate)
  const now = new Date()
  
  let years = now.getFullYear() - start.getFullYear()
  let months = now.getMonth() - start.getMonth()
  
  if (months < 0) {
    years--
    months += 12
  }
  
  return `${years} Tahun ${months} Bulan`
}

// Get hari dalam bahasa Indonesia
export const getDayName = (date) => {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  return days[new Date(date).getDay()]
}

// Get nama bulan dalam bahasa Indonesia
export const getMonthName = (monthIndex) => {
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  return months[monthIndex]
}

// Format tanggal lengkap (Senin, 12 Desember 2025)
export const formatFullDate = (date) => {
  const d = new Date(date)
  const dayName = getDayName(d)
  const day = d.getDate()
  const monthName = getMonthName(d.getMonth())
  const year = d.getFullYear()
  return `${dayName}, ${day} ${monthName} ${year}`
}

// Format waktu untuk database (HH:MM:SS)
export const formatTimeForDB = (date = new Date()) => {
  const d = new Date(date)
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

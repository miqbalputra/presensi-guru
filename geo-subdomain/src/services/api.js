// API Configuration
// GANTI dengan URL API Anda setelah deploy
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost/api'

// Helper function untuk fetch dengan error handling
async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for session
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.message || 'API request failed')
    }

    return data
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

// Auth API
export const authAPI = {
  login: async (username, password) => {
    return fetchAPI('/auth.php?action=login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  },

  logout: async () => {
    return fetchAPI('/auth.php?action=logout', {
      method: 'POST',
    })
  },

  checkSession: async () => {
    return fetchAPI('/auth.php?action=check', {
      method: 'GET',
    })
  },
}

// Guru API
export const guruAPI = {
  getAll: async () => {
    return fetchAPI('/guru.php', {
      method: 'GET',
    })
  },

  getById: async (id) => {
    return fetchAPI(`/guru.php?id=${id}`, {
      method: 'GET',
    })
  },

  create: async (guruData) => {
    return fetchAPI('/guru.php', {
      method: 'POST',
      body: JSON.stringify(guruData),
    })
  },

  update: async (guruData) => {
    return fetchAPI('/guru.php', {
      method: 'PUT',
      body: JSON.stringify(guruData),
    })
  },

  delete: async (id) => {
    return fetchAPI(`/guru.php?id=${id}`, {
      method: 'DELETE',
    })
  },
}

// Presensi API
export const presensiAPI = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters)
    return fetchAPI(`/presensi.php?${params}`, {
      method: 'GET',
    })
  },

  create: async (presensiData) => {
    return fetchAPI('/presensi.php', {
      method: 'POST',
      body: JSON.stringify(presensiData),
    })
  },

  update: async (presensiData) => {
    return fetchAPI('/presensi.php', {
      method: 'PUT',
      body: JSON.stringify(presensiData),
    })
  },

  delete: async (id) => {
    return fetchAPI(`/presensi.php?id=${id}`, {
      method: 'DELETE',
    })
  },
}

// Activity Logs API
export const activityAPI = {
  create: async (activityData) => {
    return fetchAPI('/activity.php', {
      method: 'POST',
      body: JSON.stringify(activityData),
    })
  },

  getAll: async () => {
    return fetchAPI('/activity.php', {
      method: 'GET',
    })
  },
}

// Holidays API
export const holidaysAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return fetchAPI(`/holidays.php${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
    })
  },

  checkDate: async (tanggal) => {
    return fetchAPI(`/holidays.php?check=${tanggal}`, {
      method: 'GET',
    })
  },

  create: async (holidayData) => {
    return fetchAPI('/holidays.php', {
      method: 'POST',
      body: JSON.stringify(holidayData),
    })
  },

  update: async (holidayData) => {
    return fetchAPI('/holidays.php', {
      method: 'PUT',
      body: JSON.stringify(holidayData),
    })
  },

  delete: async (id) => {
    return fetchAPI(`/holidays.php?id=${id}`, {
      method: 'DELETE',
    })
  },
}

// Settings API
export const settingsAPI = {
  getAll: async () => {
    return fetchAPI('/settings.php', {
      method: 'GET',
    })
  },

  update: async (settingKey, settingValue) => {
    return fetchAPI('/settings.php', {
      method: 'PUT',
      body: JSON.stringify({ setting_key: settingKey, setting_value: settingValue }),
    })
  },
}

// Jadwal Piket API
export const jadwalPiketAPI = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters)
    return fetchAPI(`/jadwal_piket.php?${params}`, {
      method: 'GET',
    })
  },

  getToday: async () => {
    return fetchAPI('/jadwal_piket.php?today=1', {
      method: 'GET',
    })
  },

  create: async (jadwalData) => {
    return fetchAPI('/jadwal_piket.php', {
      method: 'POST',
      body: JSON.stringify(jadwalData),
    })
  },

  update: async (jadwalData) => {
    return fetchAPI('/jadwal_piket.php', {
      method: 'PUT',
      body: JSON.stringify(jadwalData),
    })
  },

  delete: async (id) => {
    return fetchAPI(`/jadwal_piket.php?id=${id}`, {
      method: 'DELETE',
    })
  },
}

// QR Scan API
export const qrScanAPI = {
  // Submit QR scan attendance
  submit: async (qrData, latitude, longitude, isPulang = false) => {
    return fetchAPI('/qr_scan.php', {
      method: 'POST',
      body: JSON.stringify({ 
        qr_data: qrData, 
        latitude, 
        longitude,
        is_pulang: isPulang
      }),
    })
  },

  // Check today's attendance status
  checkStatus: async () => {
    return fetchAPI('/qr_scan.php', {
      method: 'GET',
    })
  },
}

// QR Generate API (Admin only)
export const qrGenerateAPI = {
  // Get QR Code data for printing
  generate: async () => {
    return fetchAPI('/qr_generate.php', {
      method: 'GET',
    })
  },

  // Regenerate QR secret (invalidates old QR codes)
  regenerateSecret: async (newSecret = null) => {
    return fetchAPI('/qr_generate.php', {
      method: 'PUT',
      body: JSON.stringify({ new_secret: newSecret }),
    })
  },
}

// Manual Entry API (Admin only)
export const manualEntryAPI = {
  // Get list of guru for dropdown
  getGurus: async () => {
    return fetchAPI('/manual_entry.php', {
      method: 'GET',
    })
  },

  // Submit manual attendance entry
  submit: async (data) => {
    return fetchAPI('/manual_entry.php', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

export default {
  authAPI,
  guruAPI,
  presensiAPI,
  activityAPI,
  holidaysAPI,
  settingsAPI,
  jadwalPiketAPI,
  qrScanAPI,
  qrGenerateAPI,
  manualEntryAPI,
}

// Haversine Formula untuk menghitung jarak antara 2 koordinat
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3 // Radius bumi dalam meter
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Jarak dalam meter
}

// Fungsi untuk mendapatkan lokasi user
export const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation tidak didukung oleh browser Anda'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
      },
      (error) => {
        reject(error)
      }
    )
  })
}

// Validasi apakah user berada dalam radius sekolah
export const validateLocation = (userLat, userLon, schoolLat, schoolLon, radius) => {
  const distance = calculateDistance(userLat, userLon, schoolLat, schoolLon)
  return {
    isValid: distance <= radius,
    distance: Math.round(distance)
  }
}

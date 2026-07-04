export interface GeocodeResult {
  lat: number
  lng: number
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`

  const res = await fetch(url)
  if (!res.ok) return null

  const results = await res.json()
  if (!results.length) return null

  return {
    lat: parseFloat(results[0].lat),
    lng: parseFloat(results[0].lon),
  }
}

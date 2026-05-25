export function decodePolyline(encoded: string): [number, number][] {
  const coords: [number, number][] = []
  let idx = 0, lat = 0, lng = 0
  while (idx < encoded.length) {
    let shift = 0, result = 0, byte: number
    do {
      byte = encoded.charCodeAt(idx++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    lat += result & 1 ? ~(result >> 1) : result >> 1

    shift = 0; result = 0
    do {
      byte = encoded.charCodeAt(idx++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    lng += result & 1 ? ~(result >> 1) : result >> 1

    coords.push([lng / 1e5, lat / 1e5])
  }
  return coords
}

const SPORT_COLORS: Record<string, string> = {
  Ride: '#FC4C02',
  Run: '#00BFFF',
  Swim: '#00CED1',
  Walk: '#8BC34A',
  Hike: '#4CAF50',
  Skateboard: '#FF9800',
  InlineSkate: '#FF9800',
  EBikeRide: '#FC4C02',
  VirtualRide: '#FC4C02',
}

export function sportColor(sportType: string): string {
  return SPORT_COLORS[sportType] ?? '#9333ea'
}

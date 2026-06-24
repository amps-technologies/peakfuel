export function cleanAddress(address: string): string {
  return address.replace(/\s*\[.*?\]\s*/g, "").trim();
}

export function extractCoords(
  address: string,
): { lat: number; lng: number } | null {
  const match = address.match(/\[(-?\d+\.?\d*),(-?\d+\.?\d*)\]/);
  if (!match) return null;
  return {
    lat: parseFloat(match[1]),
    lng: parseFloat(match[2]),
  };
}

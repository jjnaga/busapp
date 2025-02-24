import { environment } from '../../../environments/environment';

export function getBaseUrl(protocol?: string): string {
  let domain = window.location.hostname;
  let url = '';

  if (protocol) {
    url = `${protocol}//${domain}`;
  } else {
    url = `${window.location.protocol}//${domain}`;
  }

  if (!environment.production) {
    url += `:3000`;
  }

  return url;
}

export function getVisibleHeight(element: Element) {
  const rect = element.getBoundingClientRect();
  const isExpanded = element.classList.contains('translate-y-0');

  // If the drawer is not expanded, return 40% of the height
  // from the translateY class, that can be abstracted
  if (!isExpanded) {
    return rect.height * 0.4;
  }

  return rect.height;
}

export function isValidCoordinate(lat: number, lng: number): boolean {
  // Oahu center coordinates
  const OAHU_CENTER = {
    lat: 21.4389,
    lng: -157.9978,
  };
  const MAX_DISTANCE_MILES = 50;

  // First check if we have valid numbers
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return false;
  }

  // Calculate distance from Oahu center using Haversine formula
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat - OAHU_CENTER.lat);
  const dLon = toRad(lng - OAHU_CENTER.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(OAHU_CENTER.lat)) * Math.cos(toRad(lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance <= MAX_DISTANCE_MILES;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

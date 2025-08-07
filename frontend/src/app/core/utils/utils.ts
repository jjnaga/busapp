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

  // Calculate how much of the element is actually visible in the viewport
  const windowHeight = window.innerHeight;
  const elementTop = rect.top;
  const elementBottom = rect.bottom;

  // If element is completely above viewport
  if (elementBottom <= 0) return 0;

  // If element is completely below viewport
  if (elementTop >= windowHeight) return 0;

  // Calculate visible portion
  const visibleTop = Math.max(0, elementTop);
  const visibleBottom = Math.min(windowHeight, elementBottom);
  const visibleHeight = Math.max(0, visibleBottom - visibleTop);

  return visibleHeight;
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

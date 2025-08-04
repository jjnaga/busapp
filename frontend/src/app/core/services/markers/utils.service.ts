export function createUserMarkerContent(): HTMLElement {
  const div = document.createElement('div');
  div.classList.add('custom-user-marker');
  div.innerHTML = `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" 
         class="w-6 h-6 text-blue-600 drop-shadow-lg animate-pulse">
      <defs>
        <linearGradient id="userGradient" x1="12" y1="0" x2="12" y2="24">
          <stop offset="0%" stop-color="#2563eb"/>
          <stop offset="100%" stop-color="#1d4ed8"/>
        </linearGradient>
        <filter id="userShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.2"/>
        </filter>
      </defs>
      <g filter="url(#userShadow)">
        <circle cx="12" cy="12" r="10" fill="url(#userGradient)"/>
        <path fill="#fff" d="M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 6c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </g>
    </svg>
  `;
  return div;
}

// Enhanced vehicle marker with route info and zoom-aware display
export function createVehicleMarkerContent(routeName?: string, headsign?: string, zoom?: number): HTMLElement {
  const div = document.createElement('div');
  div.classList.add('custom-vehicle-marker');

  // Filter out null values (both actual null and string 'null')
  const validRouteName = routeName && routeName !== 'null' ? routeName : null;
  const validHeadsign = headsign && headsign !== 'null' ? headsign : null;

  // Determine display mode based on zoom level
  const showInfoOnHover = (zoom || 15) >= 15;
  const showRouteOnly = (zoom || 15) >= 13;

  if (showInfoOnHover && validRouteName && validHeadsign) {
    // Detailed view with route and headsign info box (always visible)
    div.innerHTML = `
      <div class="vehicle-marker-container">
        <div class="vehicle-info-box always-visible">
          <div class="route-badge">${validRouteName}</div>
          <div class="headsign-text">${truncateText(validHeadsign, 20)}</div>
        </div>
        <div class="vehicle-icon">
          <svg width="24" height="24" viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg">
            <path fill="#2563eb" d="M288 0C422.4 0 512 35.2 512 80l0 16 0 32c17.7 0 32 14.3 32 32l0 64c0 17.7-14.3 32-32 32l0 160c0 17.7-14.3 32-32 32l0 32c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-32-192 0 0 32c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-32c-17.7 0-32-14.3-32-32l0-160c0-17.7-14.3-32-32-32l0-64c0-17.7-14.3-32-32-32l0-32 0-16C64 35.2 153.6 0 288 0zM128 160l0 96c0 17.7 14.3 32 32 32l32 0c17.7 0 32-14.3 32-32l0-96-96 0zM304 160l0 96c0 17.7 14.3 32 32 32l32 0c17.7 0 32-14.3 32-32l0-96-96 0zM144 400a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm288 0a32 32 0 1 0 0-64 32 32 0 1 0 0 64zM384 80c0-8.8-7.2-16-16-16L208 64c-8.8 0-16 7.2-16 16s7.2 16 16 16l160 0c8.8 0 16-7.2 16-16z"/>
          </svg>
        </div>
      </div>
    `;
  } else if (showRouteOnly && validRouteName) {
    // Route badge only view for medium zoom (always visible)
    div.innerHTML = `
      <div class="vehicle-marker-container compact">
        <div class="route-badge-only">${validRouteName}</div>
        <div class="vehicle-icon-small">
          <svg width="16" height="16" viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg">
            <path fill="#2563eb" d="M288 0C422.4 0 512 35.2 512 80l0 16 0 32c17.7 0 32 14.3 32 32l0 64c0 17.7-14.3 32-32 32l0 160c0 17.7-14.3 32-32 32l0 32c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-32-192 0 0 32c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-32c-17.7 0-32-14.3-32-32l0-160c0-17.7-14.3-32-32-32l0-64c0-17.7-14.3-32-32-32l0-32 0-16C64 35.2 153.6 0 288 0zM128 160l0 96c0 17.7 14.3 32 32 32l32 0c17.7 0 32-14.3 32-32l0-96-96 0zM304 160l0 96c0 17.7 14.3 32 32 32l32 0c17.7 0 32-14.3 32-32l0-96-96 0zM144 400a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm288 0a32 32 0 1 0 0-64 32 32 0 1 0 0 64zM384 80c0-8.8-7.2-16-16-16L208 64c-8.8 0-16 7.2-16 16s7.2 16 16 16l160 0c8.8 0 16-7.2 16-16z"/>
          </svg>
        </div>
      </div>
    `;
  } else {
    // Minimal icon only for low zoom levels
    div.innerHTML = `
      <div class="vehicle-marker-container minimal">
        <svg width="12" height="12" viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg">
          <path fill="#2563eb" d="M288 0C422.4 0 512 35.2 512 80l0 16 0 32c17.7 0 32 14.3 32 32l0 64c0 17.7-14.3 32-32 32l0 160c0 17.7-14.3 32-32 32l0 32c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-32-192 0 0 32c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-32c-17.7 0-32-14.3-32-32l0-160c0-17.7-14.3-32-32-32l0-64c0-17.7-14.3-32-32-32l0-32 0-16C64 35.2 153.6 0 288 0zM128 160l0 96c0 17.7 14.3 32 32 32l32 0c17.7 0 32-14.3 32-32l0-96-96 0zM304 160l0 96c0 17.7 14.3 32 32 32l32 0c17.7 0 32-14.3 32-32l0-96-96 0zM144 400a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm288 0a32 32 0 1 0 0-64 32 32 0 1 0 0 64zM384 80c0-8.8-7.2-16-16-16L208 64c-8.8 0-16 7.2-16 16s7.2 16 16 16l160 0c8.8 0 16-7.2 16-16z"/>
        </svg>
      </div>
    `;
  }

  return div;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

export function createStopSVG(title: string, isFavorite: boolean, isNearby: boolean = false): HTMLElement {
  const outerCircleSize = 34;
  const innerCircleSize = 27;
  const iconSize = 16;
  const outerCircleColor = 'white';

  // Color priority: favorite > nearby > normal
  let innerCircleColor = 'rgb(30,64,175)'; // Default blue
  if (isFavorite) {
    innerCircleColor = '#FFD700'; // Gold for favorites
  } else if (isNearby) {
    innerCircleColor = '#10B981'; // Green for nearby (special) stops
  }

  const iconColor = 'white';

  // Calculate centers and offsets
  const center = outerCircleSize / 2;
  const innerRadius = innerCircleSize / 2;
  const iconOffset = (outerCircleSize - iconSize) / 2;
  const div = document.createElement('div');
  div.classList.add('stop-marker');

  if (isFavorite) {
    div.classList.add('favorite');
  } else if (isNearby) {
    div.classList.add('nearby');
  }

  div.innerHTML = `
      <svg aria-label="${title}" width="${outerCircleSize}" height="${outerCircleSize}" viewBox="0 0 ${outerCircleSize} ${outerCircleSize}" xmlns="http://www.w3.org/2000/svg">
        <!-- Outer white circle for depth -->
        <circle cx="${center}" cy="${center}" r="${center}" fill="${outerCircleColor}" />
        <!-- Inner circle -->
        <circle cx="${center}" cy="${center}" r="${innerRadius}" fill="${innerCircleColor}" />
        <svg x="${iconOffset}" y="${iconOffset}" width="${iconSize}" height="${iconSize}" viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg" fill="${iconColor}">
          <path d="M288 0C422.4 0 512 35.2 512 80l0 16 0 32c17.7 0 32 14.3 32 32l0 64c0 17.7-14.3 32-32 32l0 160c0 17.7-14.3 32-32 32l0 32c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-32-192 0 0 32c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-32c-17.7 0-32-14.3-32-32l0-160c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32c0 0 0 0 0 0l0-32s0 0 0 0l0-16C64 35.2 153.6 0 288 0zM128 160l0 96c0 17.7 14.3 32 32 32l112 0 0-160-112 0c-17.7 0-32 14.3-32 32zM304 288l112 0c17.7 0 32-14.3 32-32l0-96c0-17.7-14.3-32-32-32l-112 0 0 160zM144 400a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm288 0a32 32 0 1 0 0-64 32 32 0 1 0 0 64zM384 80c0-8.8-7.2-16-16-16L208 64c-8.8 0-16 7.2-16 16s7.2 16 16 16l160 0c8.8 0 16-7.2 16-16z"/>
        </svg>
      </svg>
    </div>
    `;

  return div;
}

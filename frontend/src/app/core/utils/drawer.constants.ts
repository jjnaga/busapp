/**
 * Drawer configuration constants
 * These values should match the corresponding CSS classes and transforms used in the drawer component
 *
 * MOBILE DRAWER BEHAVIOR:
 * - When closed: drawer is translated by 60% (CLOSED_TRANSLATE_PERCENTAGE)
 * - This means 40% of the drawer remains visible (VISIBLE_PERCENTAGE_WHEN_CLOSED)
 * - Content area height is 50vh (CONTENT_HEIGHT_VH)
 * - Header takes ~40px (HEADER_HEIGHT_PX)
 * - Bottom padding needed: 40vh - 40px to ensure content is fully scrollable
 */

export const DRAWER_CONSTANTS = {
  // Mobile drawer configuration
  MOBILE: {
    // Percentage of drawer hidden when in closed state (translate-y-[60%])
    CLOSED_TRANSLATE_PERCENTAGE: 60,

    // Content area height as percentage of viewport height (h-[50vh])
    CONTENT_HEIGHT_VH: 50,

    // Header minimum height in pixels (min-h-[40px])
    HEADER_HEIGHT_PX: 40,

    // Gesture threshold for determining expand/collapse intent (30% of screen height)
    GESTURE_THRESHOLD_PERCENTAGE: 30,

    // Calculated visible percentage when closed (100% - translate percentage)
    get VISIBLE_PERCENTAGE_WHEN_CLOSED() {
      return 100 - this.CLOSED_TRANSLATE_PERCENTAGE;
    },

    // Bottom padding needed for proper scrolling in closed mode
    get BOTTOM_PADDING_CLOSED() {
      return `pb-[calc(${this.VISIBLE_PERCENTAGE_WHEN_CLOSED}vh-${this.HEADER_HEIGHT_PX}px)]`;
    },
  },

  // Desktop drawer configuration
  DESKTOP: {
    // Fixed dimensions for desktop drawer (simulating iPhone screen)
    WIDTH_PX: 375,
    HEIGHT_PX: 575,
  },
} as const;

/**
 * Utility function to get bottom padding class for mobile drawer
 * @param isMobile - Whether the device is mobile
 * @param isExpanded - Whether the drawer is expanded
 * @returns CSS class string for bottom padding
 */
export function getDrawerBottomPadding(isMobile: boolean, isExpanded: boolean): string {
  if (isMobile && !isExpanded) {
    return DRAWER_CONSTANTS.MOBILE.BOTTOM_PADDING_CLOSED;
  }
  return '';
}

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

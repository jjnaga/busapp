import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';

export function getBaseUrl(toastr?: ToastrService, protocol?: string): string {
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

  if (toastr) {
    toastr.success(url);
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

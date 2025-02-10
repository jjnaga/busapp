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

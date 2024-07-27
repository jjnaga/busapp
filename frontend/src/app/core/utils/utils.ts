import { environment } from '../../../environments/environment';

export function getBaseUrl(): string {
  const protocol = window.location.protocol;
  let host = window.location.host;

  if (!environment.production) {
    host = 'localhost:3000';
  }

  return `${protocol}//${host}`;
}

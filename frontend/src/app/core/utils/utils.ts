import { environment } from '../../../environments/environment';

export function getBaseUrl(): string {
  if (!environment.production) {
    return 'http://localhost:3000';
  }
  return ''; // Relative to current origin in production
}

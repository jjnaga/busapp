import { environment } from '../../../environments/environment';

export function getBaseUrl(): string {
  console.log(environment.production);
  if (!environment.production) {
    return 'http://localhost:3000';
  }
  return ''; // Relative to current origin in production
}

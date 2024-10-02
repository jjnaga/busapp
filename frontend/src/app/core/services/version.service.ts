import { Injectable } from '@angular/core';
import { appVersion } from '../../../environments/version';

@Injectable({
  providedIn: 'root',
})
export class VersionService {
  getAppVersion(): string {
    return appVersion;
  }
}

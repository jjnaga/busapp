import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
import type { Global } from '@jest/types';
declare const global: Global.Global;

setupZoneTestEnv();

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn(),
}));

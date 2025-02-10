import { UserLocationService } from './user-location.service';

describe('UserLocationService', () => {
  let service: UserLocationService;
  let originalGeolocation: any;

  beforeAll(() => {
    // Save the original geolocation object
    originalGeolocation = navigator.geolocation;
  });

  afterAll(() => {
    // Restore the original geolocation object after all tests
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: originalGeolocation,
    });
  });

  beforeEach(() => {
    service = new UserLocationService();
  });

  describe('watchLocation', () => {
    test('should emit coordinates on success', (done) => {
      const coords = { latitude: 10, longitude: 20 };
      const mockWatchId = 1;
      const fakeGeolocation = {
        watchPosition: jest.fn((success, error, options) => {
          // Immediately invoke success callback with fake coordinates
          success({ coords: { latitude: coords.latitude, longitude: coords.longitude } });
          return mockWatchId;
        }),
        clearWatch: jest.fn(),
      };

      // Override navigator.geolocation using Object.defineProperty
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: fakeGeolocation,
      });

      service.watchLocation().subscribe({
        next: (data) => {
          expect(data).toEqual(coords);
          done();
        },
        error: () => {},
      });
    });

    test('should error when geolocation fails', (done) => {
      const errorMessage = 'Test error';
      const mockWatchId = 1;
      const fakeGeolocation = {
        watchPosition: jest.fn((success, error, options) => {
          // Immediately invoke error callback with a fake error object
          error({ message: errorMessage });
          return mockWatchId;
        }),
        clearWatch: jest.fn(),
      };

      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: fakeGeolocation,
      });

      service.watchLocation().subscribe({
        next: () => {
          // This path should not be hit—stop goofing.
        },
        error: (err) => {
          expect(err).toBe(errorMessage);
          done();
        },
      });
    });
  });
});

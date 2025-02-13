import { ToastrService } from 'ngx-toastr';
import { Stop } from '../utils/global.types';
import { MarkerService } from './marker.service';
import { Store } from '@ngrx/store';

describe('MarkerService', () => {
  let markerService: MarkerService;

  beforeEach(() => {
    const storeMock = {} as Store;
    const toastrServiceMock = {} as ToastrService;
    markerService = new MarkerService(storeMock, toastrServiceMock);
  });

  test('should not create marker for invalid coordinates', () => {
    const invalidStop = {
      stopId: '3',
      stopLat: null,
      stopLon: null,
      stopName: 'Invalid Stop',
    } as unknown as Stop;

    markerService.updateStopMarkers([invalidStop], 15);

    // Assuming markerService internally stores markers in a Map called stopMarkers
    expect(markerService['stopMarkers']?.size || 0).toBe(0);
  });
});

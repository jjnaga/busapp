// websocket.effects.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import { WebsocketEffects } from './websocket.effects';
import * as WebsocketActions from './websocket.actions';
import * as VehiclesActions from '../vehicles/vehicles.actions';
import { Vehicle } from '../../../utils/global.types';
import { WebsocketService } from '../../../services/websocket.service';

const mockVehicle: Vehicle = {
  busNumber: '100',
  tripId: 'v1',
  driver: 'John',
  latitude: 10,
  longitude: 10,
  adherence: 0,
  heartbeat: new Date(),
  routeName: 'Route 1',
  headsign: 'Downtown',
};

describe('WebsocketEffects', () => {
  let effects: WebsocketEffects;
  let actions$: Observable<any>;
  let websocketService: any;

  beforeEach(() => {
    websocketService = {
      getMessages: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        WebsocketEffects,
        provideMockActions(() => actions$),
        { provide: WebsocketService, useValue: websocketService },
      ],
    });

    effects = TestBed.inject(WebsocketEffects);
  });

  describe('listenForMessages$', () => {
    test('should process vehicleUpdate messages correctly', () => {
      // Mock WebSocket message stream
      websocketService.getMessages.mockReturnValue(
        of({
          type: 'vehicleUpdate',
          data: [mockVehicle],
        })
      );

      actions$ = of(WebsocketActions.websocketConnected());

      effects.listenForMessages$.subscribe((action) => {
        expect(action).toEqual(
          WebsocketActions.websocketVehiclesUpdateMessageReceived({
            vehicles: [mockVehicle],
          })
        );
      });
    });

    test('should filter out unknown message types', () => {
      websocketService.getMessages.mockReturnValue(of({ type: 'unknownType', data: {} }));

      actions$ = of(WebsocketActions.websocketConnected());

      effects.listenForMessages$.subscribe((action) => {
        expect(action.type).toBe('NO_ACTION');
      });
    });
  });

  describe('vehiclesUpdateMessageReceived$', () => {
    test('should map to updateVehicles action', () => {
      actions$ = of(
        WebsocketActions.websocketVehiclesUpdateMessageReceived({
          vehicles: [mockVehicle],
        })
      );

      effects.vehiclesUpdateMessageReceived$.subscribe((action) => {
        expect(action).toEqual(VehiclesActions.updateVehicles({ vehicles: [mockVehicle] }));
      });
    });
  });

  test('should handle websocket error', () => {
    const error = new Error('Test error');
    websocketService.getMessages.mockReturnValue(throwError(() => error));
    actions$ = of(WebsocketActions.websocketConnected());

    effects.listenForMessages$.subscribe((action) => {
      expect(action).toEqual(WebsocketActions.websocketError({ error }));
    });
  });
});

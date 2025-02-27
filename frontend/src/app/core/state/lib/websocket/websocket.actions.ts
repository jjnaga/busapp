import { createAction, props } from '@ngrx/store';
import { VehicleArray } from '../../../utils/global.types';

export const connectWebsocket = createAction('[Websocket] Connect');
export const websocketVehiclesUpdateMessageReceived = createAction(
  '[Websocket] Vehicles Update Received',
  props<{ vehicles: VehicleArray }>()
);
export const websocketError = createAction('[Websocket] Error', props<{ error: any }>());

export const websocketConnected = createAction('[Websocket] Connected');
export const websocketDisconnected = createAction('[Websocket] Disconnected');

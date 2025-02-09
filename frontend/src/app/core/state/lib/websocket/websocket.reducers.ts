import { createReducer, on } from '@ngrx/store';
import { connectWebsocket, websocketConnected, websocketDisconnected } from './websocket.actions';

export interface WebsocketState {
  connecting: boolean;
  connected: boolean;
}

export const initialWebsocketState: WebsocketState = {
  connecting: false,
  connected: false,
};

// Add to state
export const websocketReducer = createReducer(
  initialWebsocketState,
  on(connectWebsocket, (state) => ({ ...state, connecting: true })),
  on(websocketConnected, (state) => ({ ...state, connected: true, connecting: false })),
  on(websocketDisconnected, (state) => ({ ...state, connected: false, connecting: false }))
);

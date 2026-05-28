import type * as Party from 'partykit/server';
import type { ClientEvent, RoomState, ServerEvent } from '../src/types';
import {
  applyEvent,
  createInitialState,
  markDisconnected,
  markReconnected,
} from './state';

const STORAGE_KEY = 'roomState';

export default class JeopardyServer implements Party.Server {
  state: RoomState = createInitialState();

  constructor(readonly room: Party.Room) {}

  async onStart() {
    const stored = await this.room.storage.get<RoomState>(STORAGE_KEY);
    if (stored) this.state = stored;
  }

  async onConnect(conn: Party.Connection) {
    // First-ever connection to a fresh room claims host automatically.
    const isFirstEver = this.state.hostId === null && this.state.players.length === 0;
    if (isFirstEver) {
      const result = applyEvent(this.state, { type: 'claimHost' }, conn.id);
      if (result.ok) {
        this.state = result.state;
      }
    } else {
      // Reconnect: if we know this id, mark connected.
      this.state = markReconnected(this.state, conn.id);
    }

    this.persist();

    const isHost = this.state.hostId === conn.id;
    const youAre: ServerEvent = { type: 'youAre', playerId: conn.id, isHost };
    conn.send(JSON.stringify(youAre));

    this.broadcastState();
  }

  onClose(conn: Party.Connection) {
    if (conn.id === this.state.hostId) {
      // Host disconnect: keep host slot, just mark connection state implicitly via UI.
      // (Auto-host-transfer is a stretch goal; v1 simply waits.)
    }
    this.state = markDisconnected(this.state, conn.id);
    this.persist();
    this.broadcastState();
  }

  onMessage(message: string, sender: Party.Connection) {
    let event: ClientEvent;
    try {
      event = JSON.parse(message);
    } catch {
      this.sendError(sender, 'Invalid JSON');
      return;
    }

    const result = applyEvent(this.state, event, sender.id);
    if (!result.ok) {
      this.sendError(sender, result.error);
      return;
    }
    this.state = result.state;
    this.persist();
    this.broadcastState();
  }

  private async persist() {
    await this.room.storage.put(STORAGE_KEY, this.state);
  }

  private broadcastState() {
    const msg: ServerEvent = { type: 'state', state: this.state };
    this.room.broadcast(JSON.stringify(msg));
  }

  private sendError(conn: Party.Connection, message: string) {
    const msg: ServerEvent = { type: 'error', message };
    conn.send(JSON.stringify(msg));
  }
}

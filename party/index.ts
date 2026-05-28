import type * as Party from 'partykit/server';

export default class JeopardyServer implements Party.Server {
  constructor(readonly room: Party.Room) {}
}

import { useEffect, useRef, useState } from 'react';
import PartySocket from 'partysocket';
import type { ClientEvent, RoomState, ServerEvent } from '../types';

export type Me = { playerId: string; isHost: boolean };

function getOrCreateClientId(): string {
  const KEY = 'jepardy-client-id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function useGameState(roomCode: string) {
  const [state, setState] = useState<RoomState | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const socketRef = useRef<PartySocket | null>(null);

  useEffect(() => {
    const host = import.meta.env.VITE_PARTYKIT_HOST || 'localhost:1999';
    const isHostIntent =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('host') === '1';
    const socket = new PartySocket({
      host,
      room: roomCode,
      id: getOrCreateClientId(),
      query: isHostIntent ? { host: '1' } : undefined,
    });
    socketRef.current = socket;

    const onMessage = (e: MessageEvent) => {
      const msg = JSON.parse(e.data) as ServerEvent;
      if (msg.type === 'state') setState(msg.state);
      else if (msg.type === 'youAre') setMe({ playerId: msg.playerId, isHost: msg.isHost });
      else if (msg.type === 'error') console.warn('Server error:', msg.message);
    };

    socket.addEventListener('message', onMessage);
    return () => {
      socket.removeEventListener('message', onMessage);
      socket.close();
    };
  }, [roomCode]);

  const send = (event: ClientEvent) => {
    socketRef.current?.send(JSON.stringify(event));
  };

  return { state, me, send };
}

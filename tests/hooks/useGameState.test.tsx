import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameState } from '../../src/hooks/useGameState';

// Mock partysocket so we can drive messages in tests.
// We use vi.hoisted() to declare the mock instance and constructor so the
// vi.mock factory (which Vitest hoists to the top of the file) can reference
// them safely. This also lets the tests inspect constructor arguments.
const { mockInstance, PartySocketCtor } = vi.hoisted(() => {
  class MockSocket {
    listeners: Record<string, ((e: any) => void)[]> = {};
    sent: any[] = [];
    addEventListener(name: string, fn: (e: any) => void) {
      (this.listeners[name] ??= []).push(fn);
    }
    removeEventListener(name: string, fn: (e: any) => void) {
      this.listeners[name] = (this.listeners[name] || []).filter((f) => f !== fn);
    }
    send(msg: string) { this.sent.push(JSON.parse(msg)); }
    close() {}
    emit(name: string, e: any) {
      (this.listeners[name] || []).forEach((fn) => fn(e));
    }
  }
  const instance = new MockSocket();
  // NOTE: Vitest 4's `vi.fn` preserves the implementation's non-constructable
  // nature, so an arrow function here throws "is not a constructor" when the
  // hook does `new PartySocket(...)`. Use a regular function expression so the
  // mock can be invoked with `new`.
  const ctor = vi.fn(function () { return instance; });
  return { mockInstance: instance, PartySocketCtor: ctor };
});

vi.mock('partysocket', () => ({
  default: PartySocketCtor,
}));

describe('useGameState', () => {
  beforeEach(() => {
    mockInstance.listeners = {};
    mockInstance.sent = [];
    PartySocketCtor.mockClear();
  });

  it('starts with null state and null me', () => {
    const { result } = renderHook(() => useGameState('ABC'));
    expect(result.current.state).toBeNull();
    expect(result.current.me).toBeNull();
  });

  it('updates state when a state message arrives', () => {
    const { result } = renderHook(() => useGameState('ABC'));
    act(() => {
      mockInstance.emit('message', {
        data: JSON.stringify({ type: 'state', state: { phase: 'lobby' } }),
      });
    });
    expect(result.current.state).toEqual({ phase: 'lobby' });
  });

  it('updates me when a youAre message arrives', () => {
    const { result } = renderHook(() => useGameState('ABC'));
    act(() => {
      mockInstance.emit('message', {
        data: JSON.stringify({ type: 'youAre', playerId: 'X', isHost: true }),
      });
    });
    expect(result.current.me).toEqual({ playerId: 'X', isHost: true });
  });

  it('sends typed messages via send()', () => {
    const { result } = renderHook(() => useGameState('ABC'));
    act(() => {
      result.current.send({ type: 'setNickname', nickname: 'Alice' });
    });
    expect(mockInstance.sent).toEqual([{ type: 'setNickname', nickname: 'Alice' }]);
  });

  it('passes a stable client id to PartySocket', () => {
    renderHook(() => useGameState('ABC'));
    const callArgs = PartySocketCtor.mock.calls[0][0];
    expect(callArgs.id).toMatch(/^[0-9a-f-]{36}$/);
  });
});

# Jeopardy Web Game — Design Spec

**Date:** 2026-05-27
**Status:** Approved, ready for implementation planning

## Overview

A web-based Jeopardy game for online multiplayer parties. One person hosts (controls the board, opens the buzzer, judges answers); up to 20 others play. Games are pre-authored as JSON files bundled with the app. Built on PartyKit for realtime, React + Vite + TypeScript + Tailwind on the client.

## Goals & Non-Goals

### Goals

- Playable end-to-end Jeopardy match: one round + Final Jeopardy
- Online multiplayer with low-friction joining (room code + nickname)
- Modern, clean UI that works for groups from 4 to 20
- Resilient to short network blips (player or host)
- Foundation that custom game authoring can be added to later

### Non-Goals (v1)

- Custom game authoring UI
- User accounts, long-term history, or stats
- Daily Doubles or Double Jeopardy round
- Auto-judging of answers (host judges)
- Cheater-proofing (clients receive full game JSON; acceptable for friends-and-family)
- TV-show visual fidelity (deliberately modern, not branded look-alike)

## Game Decisions Reference

These are the decisions made during brainstorming, frozen here:

| Decision | Value |
|---|---|
| Transport | PartyKit (Cloudflare Durable Objects) |
| Host model | Dedicated host (room creator), does not play |
| Player count | Up to 20 |
| Identity | Nickname + room code (no accounts) |
| Game content | Pre-bundled JSON games (3–5 to start) |
| Format | One Jeopardy round + Final Jeopardy |
| Buzzer | Host opens manually, host judges right/wrong |
| Visual style | Modern UI (not TV-show faithful) |
| Persistence | Room state in `room.storage` (survives disconnects); no long-term storage |
| Scoring | Correct = +clue value; Wrong = −clue value; scores may go negative |
| Picker order | First-joined picks first; thereafter, last correct picks next; on no-correct, previous picker picks again |
| Final Jeopardy eligibility | Only players with positive scores may wager |

## Architecture

### Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS + React Router
- **Realtime:** PartyKit (Party.Server class)
- **Testing:** Vitest + React Testing Library (no Playwright in v1)
- **State management (client):** single `useGameState` hook backed by `useSyncExternalStore`; no Zustand, Context only if drilling gets ugly

### Repo Layout

```
jepardy/
├── src/                      # React app
│   ├── routes/               # / (landing), /host, /play/:code
│   ├── components/           # Board, Buzzer, Podium, ClueModal, etc.
│   ├── hooks/                # useGameState (PartySocket wrapper)
│   ├── games/                # pre-bundled JSON game files
│   │   ├── manifest.ts       # list of available games
│   │   └── *.json            # individual games
│   ├── types.ts              # shared types (also imported by server)
│   └── main.tsx
├── party/
│   └── index.ts              # PartyKit server (Party.Server class)
├── tests/                    # Vitest + RTL
├── docs/                     # specs, plans
├── partykit.json             # PartyKit config
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

Single `package.json` for both client and server. `src/types.ts` is the shared source of truth for the message protocol and game state shape — server imports from it.

## Data Model

### Static game content (JSON, bundled at build time)

```ts
type Game = {
  id: string;
  title: string;
  jeopardyRound: {
    categories: Category[];          // exactly 6
  };
  finalJeopardy: {
    category: string;
    clue: string;
    answer: string;
  };
};

type Category = {
  name: string;
  clues: Clue[];                      // exactly 5
};

type Clue = {
  value: number;                      // 200, 400, 600, 800, 1000
  clue: string;
  answer: string;
};
```

### Runtime room state (lives in PartyKit `room.storage`)

```ts
type RoomState = {
  phase: GamePhase;
  hostId: string | null;
  players: Player[];                  // up to 20
  game: Game | null;
  board: BoardState | null;
  selectedClue: { categoryIdx: number; clueIdx: number } | null;
  buzzer: BuzzerState;
  pickerId: string | null;
  scores: Record<string, number>;
  finalJeopardy: {
    wagers: Record<string, number>;
    answers: Record<string, string>;
    submitted: string[];              // playerIds who locked in
  } | null;
};

type Player = { id: string; nickname: string; connected: boolean };

type BuzzerState =
  | { status: "closed" }
  | { status: "open"; openedAt: number }
  | { status: "locked"; winnerId: string };

type BoardState = {
  revealed: boolean[][];              // [categoryIdx][clueIdx] = played?
};

type GamePhase =
  | "lobby"
  | "selectingClue"
  | "clueRevealed"
  | "buzzerOpen"
  | "judging"
  | "roundComplete"
  | "finalCategoryShown"
  | "finalClueShown"
  | "finalReveal"
  | "gameOver";
```

`selectedClue` holds indices, not a copy of the clue, so the JSON stays the single source of truth.

## Message Protocol

### Client → Server

| Event | Sent by | Payload | Valid when |
|---|---|---|---|
| `setNickname` | any | `{ nickname }` | on join |
| `claimHost` | first connection | — | room creator becomes host |
| `selectGame` | host | `{ gameId }` | in lobby |
| `startGame` | host | — | ≥ 2 players + game selected |
| `selectClue` | current picker | `{ categoryIdx, clueIdx }` | phase = `selectingClue` |
| `openBuzzer` | host | — | phase = `clueRevealed` or `judging` (reopen after wrong) |
| `closeBuzzer` | host | — | phase = `buzzerOpen` (nobody buzzed) |
| `buzz` | any player | — | phase = `buzzerOpen` |
| `judgeCorrect` | host | — | phase = `judging` |
| `judgeWrong` | host | — | phase = `judging` |
| `moveOn` | host | — | phase = `judging`, after wrong-and-no-rebuzz or close |
| `revealFinalCategory` | host | — | phase = `roundComplete` |
| `submitFinalWager` | player | `{ wager }` | phase = `finalCategoryShown` |
| `revealFinalClue` | host | — | all eligible wagers in |
| `submitFinalAnswer` | player | `{ answer }` | phase = `finalClueShown` |
| `revealFinalPlayer` | host | `{ playerId, correct }` | phase = `finalReveal` |
| `endGame` | host | — | phase = `gameOver` |
| `kickPlayer` | host | `{ playerId }` | any time |

### Server → Client

| Event | Payload | When |
|---|---|---|
| `state` | full `RoomState` | on every state change, broadcast to all |
| `youAre` | `{ playerId, isHost }` | on connect |
| `error` | `{ message }` | invalid action from sender |

**No diffs.** Full state broadcast every time. For up to 20 players, payloads are small enough that diffs aren't worth the complexity.

### Authority & Validation

The server validates every action before applying:
- `selectClue` only if `senderId === pickerId` and `phase === "selectingClue"`
- `buzz` only if `phase === "buzzerOpen"`; first received wins, rest dropped silently
- `judgeCorrect`/`judgeWrong` only from `hostId` during `phase === "judging"`
- All host-only events check `senderId === hostId`

Invalid actions → `error` event back to sender, state unchanged.

## Client Architecture

### Routes

| Path | Screen | Notes |
|---|---|---|
| `/` | Landing | "Host a game" or "Join a game" buttons |
| `/host` | Host setup | Creates room, picks game, redirects to `/play/:code` |
| `/play/:code` | Room | Nickname entry → lobby → game → game over |

Same `/play/:code` route renders host or player view based on `isHost` flag.

### The single hook

```ts
const { state, me, send } = useGameState(roomCode);
```

- `state: RoomState | null`
- `me: { playerId, isHost } | null`
- `send(msg)` — typed client→server events

Manages one `PartySocket`, reconnect logic, exposes everything via `useSyncExternalStore`.

### Component tree

```
<App>
 └─ <Router>
     ├─ <Landing />
     ├─ <HostSetup />
     └─ <Room />
         ├─ <Lobby />
         ├─ <GameBoard />
         │   ├─ <CategoryHeader />
         │   ├─ <ClueCell />
         │   ├─ <ClueModal />
         │   ├─ <BuzzerControls />
         │   └─ <Scoreboard />     # vertical sidebar
         ├─ <FinalJeopardy />
         │   ├─ <WagerInput />
         │   ├─ <AnswerInput />
         │   └─ <RevealStage />
         └─ <GameOver />
```

### Rendering rule

`<Room />` reads `state.phase` and renders exactly one phase-specific child. UI is a pure function of `RoomState` — no local UI state competes with server phase.

### Host vs. player views

Each phase component renders different controls based on `me.isHost`. Example, `<BuzzerControls />`:
- Host: "Open Buzzer" (when closed), "Correct" / "Wrong" / "Move On" (when judging)
- Player: large tap-target buzz button (active only when `buzzer.status === "open"`)

### Client-side prediction for buzzer

When player taps buzz, the client shows immediate visual feedback ("you buzzed!") and sends the event. The server decides the winner; if you don't win, the next `state` message corrects the UI. This keeps the buzzer feeling snappy despite network latency.

### Scoreboard layout

Vertical sidebar list (player name + score, current picker highlighted), not a horizontal podium. Designed to accommodate up to 20 entries gracefully.

## Game Flow

### Setup

1. Host visits `/host` → server creates room → host redirected to `/play/:code` with their code.
   - Phase: `lobby`, hostId set, players empty, game null.
2. Host picks a bundled game → `selectGame`.
3. Players visit `/play/:code` → enter nickname → `setNickname` → join `players[]`.
4. Host clicks "Start" (≥ 2 players + game selected) → `startGame`.
   - Server picks first-joined as picker.
   - Phase: `lobby` → `selectingClue`.

### A single clue, start to finish

5. Picker clicks a board cell → `selectClue(cat, idx)`.
   - Server marks `board.revealed[cat][idx] = true`.
   - Phase: `selectingClue` → `clueRevealed`.
   - All clients show clue modal. Host reads aloud.
6. Host clicks "Open Buzzer" → `openBuzzer`.
   - Phase: `clueRevealed` → `buzzerOpen`.
7. Either:
   - **Someone buzzes** → server picks first received → Phase: `buzzerOpen` → `judging`, with `buzzer.winnerId` set. Player says answer out loud; host clicks Correct/Wrong.
   - **Nobody buzzes** → host clicks "No One" → `closeBuzzer` → Phase: `buzzerOpen` → `judging`. Host reads answer aloud, clicks "Move On".
8. Judge outcomes:
   - **Correct**: `scores[winner] += clue.value`, `pickerId = winner`. Phase: `judging` → `selectingClue`.
   - **Wrong**: `scores[winner] -= clue.value`. Host may "Reopen Buzzer" (→ `buzzerOpen`) or "Move On" (→ `selectingClue`, picker unchanged).
   - **No one buzzed**: host "Move On" → `selectingClue`, picker unchanged.

### Round end → Final Jeopardy

9. After all 30 clues played, server auto-transitions: `selectingClue` → `roundComplete`.
10. Host clicks "Reveal Final Jeopardy Category" → `revealFinalCategory` → Phase: `finalCategoryShown`.
    - Players with score > 0: wager input (1 to current score).
    - Players with score ≤ 0: spectator view.
11. Each eligible player submits wager → `submitFinalWager(amount)`. Wagers stored privately on the server (other clients don't see them).
12. When all eligible players have wagered, host clicks "Reveal Final Clue" → `revealFinalClue` → Phase: `finalClueShown`. ~30-second timer visible to all.
13. Players type answer → `submitFinalAnswer(text)`. Non-submitters auto-locked-in with empty string when timer expires.
14. When all locked in (or timer expires) → Phase: `finalReveal`. Host walks through each player one at a time: sees answer + wager + Correct/Wrong → `revealFinalPlayer(id, correct)`. Server updates score, broadcasts so everyone sees the reveal.
15. After all players revealed → Phase: `gameOver`. Final scores displayed; "New Game" button visible to host.
16. Host clicks "New Game" → `endGame` → Phase: `lobby`. Game and scores cleared; players kept.

### Special cases during play

- **Player disconnects mid-game**: marked `connected: false`, score persists. If they were the picker or had buzzed in, host gets a "Skip" control.
- **Player reconnects**: same client ID (localStorage) → re-attached to existing `Player`. State broadcast on reconnect catches them up.
- **Host disconnects briefly**: room state persists in `room.storage`. Host reconnects via stored client ID. Other players see a "host reconnecting" overlay.
- **Host closes browser entirely**: room enters indefinite "waiting for host" state. (Auto-host-transfer is a stretch goal — see Deferred.)
- **Player tries to buzz before buzzer opens**: server silently drops.

## Error Handling

### Handled in v1

| Scenario | Behavior |
|---|---|
| Invalid action (e.g., non-host clicks judge) | Server sends `error` event; client shows toast; state unchanged |
| Two players buzz "simultaneously" | Server picks first received; broadcast state reveals winner |
| Page refresh | Treated as reconnect; client ID in localStorage preserves identity |
| Final Jeopardy: player never submits | Auto-locked-in as empty string; counts as wrong |
| Final Jeopardy: player with score ≤ 0 | Spectator view, no wager, not in reveal sequence |
| Duplicate nickname | Server appends suffix: "Victoria" → "Victoria (2)" |
| Non-existent room code | Friendly "room not found" message |

### Not handled in v1 (intentional)

- Network adversaries / rate limiting / DDoS protection (rely on PartyKit defaults)
- Cheaters inspecting devtools (clients receive full game JSON including answers)
- Anti-bot / captchas
- Multi-tab same player (creates two slots, harmless)

### Server invariants

Cheap assertions, checked after every state mutation:

- `players.length <= 20`
- `Object.keys(scores)` ⊆ `players[].id`
- At most one player has `isHost: true`
- `pickerId` is either `null` or in `players`
- `buzzer.status` transitions only: `closed → open → locked → (closed | open)` (locked → open on host reopen after wrong; locked → closed on move-on or correct)

Throw on violation. In dev, surfaces bugs; in prod, PartyKit restarts the room (worst case: one match dies, better than silent corruption).

## Testing Strategy

| Layer | Tool | Focus |
|---|---|---|
| **Server state machine** | Vitest (Node) | Pure `applyEvent(state, event) → state` functions. Highest-value tests: judge logic, buzzer ordering, scoring math, Final Jeopardy reveal flow, invariants. |
| **React components** | Vitest + RTL | Render each phase-specific component with mocked `RoomState`; assert what's visible/clickable per role. |
| **`useGameState` hook** | Vitest + RTL | Mock PartySocket: connects, receives messages, calls `send`, handles reconnect. |
| **End-to-end** | Manual playtest | Open multiple browsers, run a full game. Sufficient for v1. |

No coverage % target. Focus on server state machine — if `applyEvent` is well-tested, the game can't enter impossible states.

## v1 Scope Summary

### In

- PartyKit-based realtime multiplayer
- Dedicated host + up to 20 players, nickname + room code
- 3–5 pre-bundled games (start with 3)
- One Jeopardy round + Final Jeopardy
- Host opens buzzer manually, judges right/wrong
- Modern UI with vertical sidebar scoreboard
- `room.storage` persistence for disconnect/reconnect
- localStorage client ID for player reconnection
- Vitest unit tests on server state machine + component smoke tests

### Deferred (Future Versions)

- Custom game authoring UI ("v2 priority")
- Host-transfer-on-timeout (stretch goal, low priority)
- Long-term game history / stats
- Real accounts (email or OAuth)
- Daily Doubles, Double Jeopardy round
- Visual player avatars / colors
- TV-show-faithful aesthetic option
- Server-side answer-reveal cheater-proofing
- Playwright E2E

### Out (Unless Re-Decided)

- Player-built games during play (host pre-authors only)
- Auto-judging answers via text matching
- Room-locking

## Suggested Implementation Order

Dependency order; each step is independently testable and a logical commit boundary:

1. Project scaffold (Vite + React + TS + Tailwind + PartyKit + React Router)
2. Shared types in `src/types.ts`
3. Pre-bundled game JSON format + 1 sample game
4. PartyKit server: lobby + state machine for `selectClue` → judge → score (single round, no FJ)
5. `useGameState` hook with reconnect
6. Landing + host setup + lobby screens
7. Board + clue modal + buzzer + scoreboard
8. Final Jeopardy phase (wager → clue → answer → reveal)
9. Game over screen
10. Reconnect / disconnect polish
11. Add 2 more bundled games
12. Manual playtest, fix bugs

import type { ClientEvent, RoomState } from '../types';
import type { Me } from '../hooks/useGameState';
import { BuzzerControls } from './BuzzerControls';

type Props = {
  state: RoomState;
  me: Me;
  send: (event: ClientEvent) => void;
};

const pillBase =
  'rounded-full px-5 py-2 text-sm font-semibold shadow-sm transition disabled:opacity-40';

export function ClueModal({ state, me, send }: Props) {
  if (!state.selectedClue || !state.game) return null;
  const { categoryIdx, clueIdx } = state.selectedClue;
  const clue = state.game.jeopardyRound.categories[categoryIdx].clues[clueIdx];
  const category = state.game.jeopardyRound.categories[categoryIdx].name;

  const inJudging = state.phase === 'judging';
  const showAnswer = me.isHost && state.answerRevealed;
  const showClue = me.isHost || state.phase !== 'clueRevealed';

  const buzzer = state.buzzer;
  const answeringPlayer =
    buzzer.status === 'locked'
      ? state.players.find((p) => p.id === buzzer.winnerId)
      : null;

  const showTypedAnswers =
    me.isHost && state.answerRevealed && state.typedAnswers.length > 0;
  const canAward = inJudging && state.clueJudgment === 'wrong';

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-teal-dark/70 p-3 backdrop-blur-sm sm:p-4">
      <div className="flex max-h-[95vh] w-full max-w-3xl flex-col overflow-y-auto rounded-2xl bg-teal p-5 text-cream-light shadow-2xl sm:rounded-3xl sm:p-10">
        <div className="mb-4 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.25em] text-mustard sm:mb-6 sm:gap-3 sm:text-xs sm:tracking-[0.3em]">
          <span>{category}</span>
          <span className="text-cream-light/40">•</span>
          <span>${clue.value}</span>
        </div>

        {showClue ? (
          <p className="mb-6 text-center font-display text-xl font-medium leading-snug text-cream-light sm:mb-10 sm:text-3xl">
            {clue.clue}
          </p>
        ) : (
          <p className="mb-6 text-center font-display text-xl italic leading-snug text-cream-light/60 sm:mb-10 sm:text-3xl">
            Listen for the host…
          </p>
        )}

        {inJudging && answeringPlayer && (
          <div className="mb-5 rounded-2xl bg-peach px-5 py-3 text-center sm:mb-6">
            <p className="text-[10px] uppercase tracking-[0.25em] text-mustard sm:text-xs sm:tracking-[0.3em]">
              Answering
            </p>
            <p className="font-display text-xl font-semibold text-teal sm:text-2xl">
              {answeringPlayer.nickname}
            </p>
          </div>
        )}

        {showAnswer && (
          <p className="mb-5 rounded-2xl bg-teal-dark px-4 py-3 text-center text-mustard sm:mb-6 sm:px-5 sm:py-4">
            <span className="text-[10px] uppercase tracking-[0.25em] text-mustard/70 sm:text-xs sm:tracking-[0.3em]">
              answer
            </span>
            <br />
            <span className="font-display text-lg sm:text-2xl">{clue.answer}</span>
          </p>
        )}

        {showTypedAnswers && (
          <div className="mb-5 rounded-2xl bg-teal-dark/70 px-4 py-3 sm:mb-6 sm:px-5 sm:py-4">
            <p className="mb-2 text-center text-[10px] uppercase tracking-[0.25em] text-mustard/80 sm:text-xs sm:tracking-[0.3em]">
              typed answers
            </p>
            <ul className="space-y-2">
              {state.typedAnswers.map((entry) => {
                const player = state.players.find((p) => p.id === entry.playerId);
                return (
                  <li
                    key={entry.playerId}
                    className="flex items-center justify-between gap-3 rounded-xl bg-cream-light/10 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-mustard sm:text-xs">
                        {player?.nickname ?? entry.playerId}
                      </p>
                      <p className="truncate font-display text-base text-cream-light sm:text-lg">
                        "{entry.answer}"
                      </p>
                    </div>
                    {canAward && (
                      <button
                        className={`${pillBase} shrink-0 bg-mustard text-teal-dark hover:bg-mustard-dark hover:text-cream-light`}
                        onClick={() =>
                          send({ type: 'awardTypedAnswer', playerId: entry.playerId })
                        }
                      >
                        Award ${clue.value}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="flex flex-col items-center gap-3">
          <BuzzerControls state={state} me={me} send={send} />
        </div>
      </div>
    </div>
  );
}

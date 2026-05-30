type Props = {
  value: number;
  revealed: boolean;
  isPicker: boolean;
  onClick: () => void;
};

export function ClueCell({ value, revealed, isPicker, onClick }: Props) {
  const clickable = isPicker && !revealed;
  const difficulty = value / 200; // 200/400/600/800/1000 → 1/2/3/4/5
  return (
    <button
      aria-label={revealed ? 'Clue already played' : `Difficulty ${difficulty}, $${value}`}
      className={`flex aspect-[5/4] items-center justify-center rounded-md font-display font-semibold transition sm:aspect-[4/3] sm:rounded-2xl ${
        revealed
          ? 'bg-lavender-light text-transparent'
          : 'bg-teal text-mustard'
      } ${clickable ? 'cursor-pointer hover:bg-teal-dark hover:scale-[1.02]' : 'cursor-default'}`}
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
    >
      <span className="text-base sm:hidden">{difficulty}</span>
      <span className="hidden sm:inline sm:text-2xl md:text-3xl">${value}</span>
    </button>
  );
}

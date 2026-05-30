type Props = {
  value: number;
  revealed: boolean;
  isPicker: boolean;
  onClick: () => void;
};

export function ClueCell({ value, revealed, isPicker, onClick }: Props) {
  const clickable = isPicker && !revealed;
  return (
    <button
      className={`flex aspect-[4/3] items-center justify-center rounded-2xl font-display text-3xl font-semibold transition ${
        revealed
          ? 'bg-lavender-light text-transparent'
          : 'bg-teal text-mustard'
      } ${clickable ? 'cursor-pointer hover:bg-teal-dark hover:scale-[1.02]' : 'cursor-default'}`}
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
    >
      ${value}
    </button>
  );
}

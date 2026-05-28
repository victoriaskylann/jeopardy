type Props = {
  value: number;
  revealed: boolean;
  isPicker: boolean;
  onClick: () => void;
};

export function ClueCell({ value, revealed, isPicker, onClick }: Props) {
  return (
    <button
      className={`flex aspect-[4/3] items-center justify-center rounded-md text-2xl font-bold transition ${
        revealed
          ? 'bg-slate-200 text-transparent'
          : 'bg-blue-700 text-amber-300 hover:bg-blue-600'
      } ${!isPicker || revealed ? 'cursor-default' : 'cursor-pointer'}`}
      onClick={isPicker && !revealed ? onClick : undefined}
      disabled={!isPicker || revealed}
    >
      ${value}
    </button>
  );
}

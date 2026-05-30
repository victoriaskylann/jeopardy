type Props = { title: string };

export function HostHeader({ title }: Props) {
  return (
    <header className="relative flex h-14 items-center justify-center overflow-hidden bg-cream-light">
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="checker"
            x="0"
            y="0"
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <rect width="14" height="14" fill="#b89a3e" />
            <rect x="14" y="14" width="14" height="14" fill="#b89a3e" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="#f3e8d0" />
        <rect width="100%" height="100%" fill="url(#checker)" />
      </svg>
      <h1 className="relative z-10 rounded-full bg-cream-light px-5 py-1 font-display text-xl font-semibold tracking-tight text-teal">
        {title}
      </h1>
    </header>
  );
}

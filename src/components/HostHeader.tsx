type Props = { title: string };

export function HostHeader({ title }: Props) {
  return (
    <header className="relative flex h-20 items-center justify-center overflow-hidden bg-cream-light">
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
            width="56"
            height="56"
            patternUnits="userSpaceOnUse"
          >
            <rect width="28" height="28" fill="#b89a3e" />
            <rect x="28" y="28" width="28" height="28" fill="#b89a3e" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="#f3e8d0" />
        <rect width="100%" height="100%" fill="url(#checker)" />
      </svg>
      <h1 className="relative z-10 w-1/2 rounded-full bg-cream-light px-8 py-2 text-center font-display text-3xl font-semibold tracking-tight text-teal">
        {title}
      </h1>
    </header>
  );
}

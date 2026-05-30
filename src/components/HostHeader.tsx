type Props = { title: string };

export function HostHeader({ title }: Props) {
  return (
    <header className="relative flex h-14 items-center justify-center overflow-hidden bg-cream-light">
      <svg
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        viewBox="0 0 200 56"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="200" height="56" fill="#f3e8d0" />
        <path
          d="M0,10 Q25,2 50,10 T100,10 T150,10 T200,10 L200,18 Q175,10 150,18 T100,18 T50,18 T0,18 Z"
          fill="#b89a3e"
          opacity="0.9"
        />
        <path
          d="M0,38 Q25,30 50,38 T100,38 T150,38 T200,38 L200,46 Q175,38 150,46 T100,46 T50,46 T0,46 Z"
          fill="#b89a3e"
          opacity="0.9"
        />
      </svg>
      <h1 className="relative z-10 rounded-full bg-cream-light px-5 py-1 font-display text-xl font-semibold tracking-tight text-teal">
        {title}
      </h1>
    </header>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function Landing() {
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const join = () => {
    if (code.length >= 4) navigate(`/play/${code}`);
  };

  return (
    <main className="relative mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-10 p-6">
      <div className="flex flex-col items-center gap-2">
        <span className="font-display text-7xl font-semibold leading-none text-teal">
          jepardy
        </span>
        <span className="font-sans text-sm uppercase tracking-[0.3em] text-mustard">
          a party game
        </span>
      </div>

      <div className="flex w-full flex-col gap-4">
        <button
          className="rounded-full bg-mustard px-6 py-4 text-lg font-semibold text-cream-light shadow-sm transition hover:bg-mustard-dark"
          onClick={() => navigate('/host')}
        >
          Host a game
        </button>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            join();
          }}
        >
          <input
            aria-label="Room code"
            className="flex-1 rounded-full border-2 border-teal/30 bg-cream-light px-5 py-3 uppercase tracking-widest text-teal placeholder:text-teal/40 focus:border-teal focus:outline-none"
            placeholder="ROOM CODE"
            maxLength={6}
            autoCapitalize="characters"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <button
            type="submit"
            className="rounded-full bg-teal px-6 py-3 font-semibold text-cream-light shadow-sm transition hover:bg-teal-dark disabled:opacity-40"
            disabled={code.length < 4}
          >
            Join
          </button>
        </form>
      </div>
    </main>
  );
}

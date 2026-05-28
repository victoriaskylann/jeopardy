import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function Landing() {
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-8 p-6">
      <h1 className="text-4xl font-bold">Jepardy</h1>
      <div className="flex w-full flex-col gap-4">
        <button
          className="rounded-lg bg-blue-600 px-4 py-3 text-lg font-medium text-white hover:bg-blue-700"
          onClick={() => navigate('/host')}
        >
          Host a game
        </button>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border px-3 py-2 uppercase"
            placeholder="ROOM CODE"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <button
            className="rounded-lg bg-slate-800 px-4 py-2 font-medium text-white disabled:opacity-50"
            disabled={code.length < 4}
            onClick={() => navigate(`/play/${code}`)}
          >
            Join
          </button>
        </div>
      </div>
    </main>
  );
}

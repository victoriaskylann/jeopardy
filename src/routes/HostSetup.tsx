import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 5; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function HostSetup() {
  const navigate = useNavigate();
  useEffect(() => {
    const code = generateCode();
    sessionStorage.setItem('host-claim', code);
    navigate(`/play/${code}?host=1`, { replace: true });
  }, [navigate]);

  return <main className="p-6">Creating room…</main>;
}
